import { searchByISBN } from './api.js';
import { addBook, findDuplicate } from './db.js';
import { showToast } from './components/toast.js';

let reader = null;
let overlay = null;
let onAdded = null;
let scanning = false;

export function initScanner(onBookAdded) {
  onAdded = onBookAdded;
  overlay = document.getElementById('scanner-overlay');
  document.getElementById('scanner-close').addEventListener('click', closeScanner);
}

export async function openScanner() {
  if (!window.ZXing) {
    showToast('Scanner non disponibile (offline?)', 'error');
    return;
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setStatus('Inquadra il codice a barre sul retro del libro');

  const video = document.getElementById('scanner-video');

  try {
    const hints = new Map();
    hints.set(
      window.ZXing.DecodeHintType.POSSIBLE_FORMATS,
      [window.ZXing.BarcodeFormat.EAN_13, window.ZXing.BarcodeFormat.EAN_8]
    );
    reader = new window.ZXing.BrowserMultiFormatReader(hints);
    scanning = true;

    await reader.decodeFromVideoDevice(null, video, (result, err) => {
      if (result && scanning) {
        const code = result.getText();
        if (isValidISBN(code)) {
          scanning = false; // lock to avoid multiple hits
          handleCode(code);
        }
      }
    });
  } catch (e) {
    if (e?.name === 'NotAllowedError') {
      setStatus('⚠️ Permesso fotocamera negato. Abilitalo nelle impostazioni del browser.', true);
    } else if (e?.name === 'NotFoundError') {
      setStatus('⚠️ Nessuna fotocamera trovata.', true);
    } else {
      setStatus('⚠️ Impossibile avviare la fotocamera.', true);
    }
  }
}

export function closeScanner() {
  scanning = false;
  if (reader) {
    try { reader.reset(); } catch {}
    reader = null;
  }
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

async function handleCode(isbn) {
  // Pause camera feedback
  if (navigator.vibrate) navigator.vibrate(60);
  setStatus(`📚 Trovato ISBN ${isbn} — cerco il libro…`);

  const dup = findDuplicate({ isbn });
  if (dup) {
    setStatus(`"${dup.title}" è già nella tua libreria.`, false, true);
    setTimeout(() => { scanning = true; setStatus('Inquadra un altro codice…'); }, 1800);
    return;
  }

  try {
    const book = await searchByISBN(isbn);
    if (!book) {
      setStatus(`Nessun libro trovato per ISBN ${isbn}. Riprova o inseriscilo a mano.`, true);
      setTimeout(() => { scanning = true; setStatus('Inquadra un altro codice…'); }, 2200);
      return;
    }
    const saved = addBook(book);
    if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
    showToast(`Aggiunto: ${saved.title}`, 'success');
    onAdded?.(saved);
    // keep scanning for the next book — common to add several in a row
    setStatus(`✅ "${saved.title}" aggiunto! Inquadra il prossimo.`, false, true);
    setTimeout(() => { scanning = true; }, 1200);
  } catch (err) {
    setStatus(`⚠️ ${err?.message || 'Errore di rete'}. Riprova.`, true);
    setTimeout(() => { scanning = true; setStatus('Inquadra un altro codice…'); }, 2200);
  }
}

function setStatus(text, isError = false, isSuccess = false) {
  const el = document.getElementById('scanner-status');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('error', isError);
  el.classList.toggle('success', isSuccess);
}

// ISBN-13 barcodes start with 978 or 979
function isValidISBN(code) {
  const c = String(code).replace(/[^0-9]/g, '');
  return c.length === 13 && (c.startsWith('978') || c.startsWith('979'));
}
