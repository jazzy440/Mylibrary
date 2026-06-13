import { searchBooks } from '../api.js';
import { addBook } from '../db.js';
import { buildForm, readForm } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';

let debounceTimer = null;

export function mount(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top"><h1>Aggiungi libro</h1></div>
      <div class="tab-bar" style="margin: 12px 0 0;">
        <button class="tab active" data-tab="search">Cerca online</button>
        <button class="tab"        data-tab="manual">Inserimento manuale</button>
      </div>
    </div>

    <div id="tab-search" class="tab-panel active">
      <div class="form-group">
        <div class="search-bar">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input id="add-search-input" type="search" placeholder="Titolo, autore, ISBN…" autocomplete="off">
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
  const searchInput  = container.querySelector('#add-search-input');
  const statusEl     = container.querySelector('#search-status');
  const resultsEl    = container.querySelector('#search-results');

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (!q) { statusEl.innerHTML = ''; resultsEl.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => runSearch(q, statusEl, resultsEl), 500);
  });

  /* ----- Manual save ----- */
  container.querySelector('#manual-save').addEventListener('click', () => {
    const data = readForm();
    if (!data.title) { showToast('Il titolo è obbligatorio', 'error'); return; }
    addBook(data);
    showToast('Libro aggiunto!', 'success');
    location.hash = 'library';
  });
}

async function runSearch(query, statusEl, resultsEl) {
  statusEl.innerHTML = `<div class="loading-row"><div class="spinner"></div> Ricerca in corso…</div>`;
  resultsEl.innerHTML = '';
  try {
    const results = await searchBooks(query);
    statusEl.innerHTML = '';
    if (!results.length) {
      statusEl.innerHTML = `<div class="empty-state" style="padding:32px 0"><div class="empty-icon">🔍</div><p>Nessun risultato per "${esc(query)}"</p></div>`;
      return;
    }
    renderResults(results, resultsEl);
  } catch {
    statusEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="empty-icon">⚠️</div><p>Errore di rete. Controlla la connessione.</p></div>`;
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

    item.addEventListener('click', () => openConfirm(book, container.parentElement));
    list.appendChild(item);
  });

  container.appendChild(list);
}

function openConfirm(prefill, panel) {
  panel.innerHTML = `
    <button class="confirm-back-btn" id="confirm-back">
      ← Torna ai risultati
    </button>
    <p style="font-size:.8rem;color:var(--text-2);margin-bottom:14px">
      Rivedi i dati e aggiungi note prima di salvare.
    </p>
    ${buildForm(prefill)}
    <button class="btn btn-primary btn-full" id="confirm-save" style="margin-top:6px">
      Aggiungi alla libreria
    </button>
  `;

  panel.querySelector('#confirm-back').addEventListener('click', () => {
    // Re-mount the search tab
    panel.innerHTML = `
      <div class="form-group">
        <div class="search-bar">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input id="add-search-input" type="search" placeholder="Titolo, autore, ISBN…" autocomplete="off">
        </div>
      </div>
      <div id="search-status"></div>
      <div id="search-results"></div>
    `;
    const inp = panel.querySelector('#add-search-input');
    const stat = panel.querySelector('#search-status');
    const res = panel.querySelector('#search-results');
    inp.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = inp.value.trim();
      if (!q) { stat.innerHTML = ''; res.innerHTML = ''; return; }
      debounceTimer = setTimeout(() => runSearch(q, stat, res), 500);
    });
  });

  panel.querySelector('#confirm-save').addEventListener('click', () => {
    const data = readForm();
    if (!data.title) { showToast('Il titolo è obbligatorio', 'error'); return; }
    addBook(data);
    showToast('Libro aggiunto!', 'success');
    location.hash = 'library';
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
