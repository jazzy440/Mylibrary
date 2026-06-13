import { searchBooks } from '../api.js';
import { addBook, findDuplicate } from '../db.js';
import { buildForm, readForm } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { openScanner } from '../scanner.js';

let debounceTimer = null;

export function mount(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top"><h1>Aggiungi libro</h1></div>
    </div>

    <div style="padding:16px 16px 0">
      <button class="btn btn-scan btn-full" id="scan-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
        </svg>
        Scansiona codice a barre
      </button>
      <p class="scan-hint">Inquadra l'ISBN sul retro del libro per aggiungerlo all'istante</p>
    </div>

    <div class="tab-bar">
      <button class="tab active" data-tab="search">Cerca online</button>
      <button class="tab"        data-tab="manual">Manuale</button>
    </div>

    <div id="tab-search" class="tab-panel active">
      <div class="form-group">
        <div class="search-bar">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input id="add-search-input" type="search" placeholder="Titolo, autore o ISBN…" autocomplete="off">
        </div>
      </div>
      <div id="search-status"></div>
      <div id="search-results"></div>
    </div>

    <div id="tab-manual" class="tab-panel">
      ${buildForm()}
      <button class="btn btn-primary btn-full" id="manual-save" style="margin-top:6px">Aggiungi alla libreria</button>
    </div>
  `;

  container.querySelector('#scan-btn').addEventListener('click', openScanner);

  /* ----- Tabs ----- */
  container.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      container.querySelector(`#tab-${t.dataset.tab}`).classList.add('active');
    });
  });

  /* ----- Online search ----- */
  const searchInput = container.querySelector('#add-search-input');
  const statusEl    = container.querySelector('#search-status');
  const resultsEl   = container.querySelector('#search-results');

  attachSearch(searchInput, statusEl, resultsEl);

  /* ----- Manual save ----- */
  container.querySelector('#manual-save').addEventListener('click', () => {
    const data = readForm();
    if (!data.title) { showToast('Il titolo è obbligatorio', 'error'); return; }
    addBook(data);
    showToast('Libro aggiunto!', 'success');
    location.hash = 'library';
  });
}

function attachSearch(input, statusEl, resultsEl) {
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { statusEl.innerHTML = ''; resultsEl.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => runSearch(q, statusEl, resultsEl), 450);
  });
}

async function runSearch(query, statusEl, resultsEl) {
  statusEl.innerHTML = `<div class="loading-row"><div class="spinner"></div> Ricerca in corso…</div>`;
  resultsEl.innerHTML = '';
  try {
    const results = await searchBooks(query);
    statusEl.innerHTML = '';
    if (!results.length) {
      statusEl.innerHTML = emptyBlock('🔍', `Nessun risultato per "${esc(query)}"`);
      return;
    }
    renderResults(results, resultsEl);
  } catch {
    statusEl.innerHTML = emptyBlock('⚠️', 'Errore di rete. Controlla la connessione.');
  }
}

function renderResults(results, container) {
  const list = document.createElement('div');
  list.className = 'search-results-list';

  results.forEach(book => {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const coverPart = book.cover
      ? `<img class="search-result-cover" src="${esc(book.cover)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'search-result-placeholder',textContent:'📖'}))">`
      : `<div class="search-result-placeholder">📖</div>`;

    const meta = [book.year, book.publisher].filter(Boolean).join(' · ');

    item.innerHTML = `
      ${coverPart}
      <div class="search-result-info">
        <div class="search-result-title">${esc(book.title)}</div>
        <div class="search-result-author">${esc(book.author || '—')}</div>
        ${meta ? `<div class="search-result-meta">${esc(meta)}</div>` : ''}
      </div>
      <div class="search-result-add">+</div>
    `;

    item.addEventListener('click', () => openConfirm(book, container.closest('.tab-panel')));
    list.appendChild(item);
  });

  container.appendChild(list);
}

function openConfirm(prefill, panel) {
  const dup = findDuplicate(prefill);
  panel.innerHTML = `
    <button class="confirm-back-btn" id="confirm-back">← Torna ai risultati</button>
    ${dup ? `<div class="dup-warning">⚠️ "${esc(dup.title)}" è già nella tua libreria.</div>` : ''}
    <p style="font-size:.8rem;color:var(--text-2);margin:8px 0 14px">Rivedi i dati e aggiungi note prima di salvare.</p>
    ${buildForm(prefill)}
    <button class="btn btn-primary btn-full" id="confirm-save" style="margin-top:6px">Aggiungi alla libreria</button>
  `;

  panel.querySelector('#confirm-back').addEventListener('click', () => remountSearch(panel));

  panel.querySelector('#confirm-save').addEventListener('click', () => {
    const data = readForm();
    if (!data.title) { showToast('Il titolo è obbligatorio', 'error'); return; }
    addBook({ ...prefill, ...data });
    showToast('Libro aggiunto!', 'success');
    location.hash = 'library';
  });
}

function remountSearch(panel) {
  panel.innerHTML = `
    <div class="form-group">
      <div class="search-bar">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="add-search-input" type="search" placeholder="Titolo, autore o ISBN…" autocomplete="off">
      </div>
    </div>
    <div id="search-status"></div>
    <div id="search-results"></div>
  `;
  attachSearch(
    panel.querySelector('#add-search-input'),
    panel.querySelector('#search-status'),
    panel.querySelector('#search-results')
  );
}

function emptyBlock(icon, text) {
  return `<div class="empty-state" style="padding:32px 0"><div class="empty-icon">${icon}</div><p>${text}</p></div>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
