import { getBooks } from '../db.js';
import { createBookCard } from '../components/book-card.js';
import { openDetail } from '../components/bottom-sheet.js';

const SORTS = {
  added:  { label: 'Aggiunti di recente', fn: (a, b) => (b.addedAt || 0) - (a.addedAt || 0) },
  title:  { label: 'Titolo (A→Z)',        fn: (a, b) => a.title.localeCompare(b.title) },
  author: { label: 'Autore (A→Z)',        fn: (a, b) => (a.author || '').localeCompare(b.author || '') },
  year:   { label: 'Anno (recente)',      fn: (a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0) },
  rating: { label: 'Valutazione',         fn: (a, b) => (b.rating || 0) - (a.rating || 0) },
};

// Persist UI prefs across navigation
const ui = { query: '', status: 'all', sort: 'added', genre: '', wishlist: false };

export function mount(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top">
        <h1>La mia libreria</h1>
        <button class="icon-btn" id="sort-btn" aria-label="Ordina">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M6 12h12M10 18h4"/>
          </svg>
        </button>
      </div>
      <div class="search-bar">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="lib-search" type="search" placeholder="Cerca titolo o autore…" autocomplete="off" value="${esc(ui.query)}">
      </div>
      <div class="segmented" id="status-seg">
        <button class="seg" data-status="all">Tutti</button>
        <button class="seg" data-status="unread">Da leggere</button>
        <button class="seg" data-status="reading">In lettura</button>
        <button class="seg" data-status="read">Letti</button>
        <button class="seg" data-status="wishlist">★</button>
      </div>
    </div>
    <div id="filter-row" class="filter-row"></div>
    <div id="result-meta" class="result-meta"></div>
    <div id="book-grid" class="book-grid"></div>
  `;

  const searchInput = container.querySelector('#lib-search');
  const filterRow   = container.querySelector('#filter-row');
  const grid        = container.querySelector('#book-grid');
  const resultMeta  = container.querySelector('#result-meta');
  const statusSeg   = container.querySelector('#status-seg');

  searchInput.addEventListener('input', e => { ui.query = e.target.value; render(); });

  statusSeg.addEventListener('click', e => {
    const seg = e.target.closest('.seg');
    if (!seg) return;
    ui.status = seg.dataset.status;
    ui.wishlist = seg.dataset.status === 'wishlist';
    render();
  });

  container.querySelector('#sort-btn').addEventListener('click', openSortMenu);

  function openSortMenu() {
    const existing = document.getElementById('sort-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'sort-menu';
    menu.className = 'popover-menu';
    menu.innerHTML = Object.entries(SORTS).map(([key, s]) =>
      `<button class="popover-item${ui.sort === key ? ' active' : ''}" data-sort="${key}">${s.label}</button>`
    ).join('');
    container.querySelector('.view-header').appendChild(menu);

    menu.querySelectorAll('.popover-item').forEach(item =>
      item.addEventListener('click', () => { ui.sort = item.dataset.sort; menu.remove(); render(); })
    );
    setTimeout(() => document.addEventListener('click', closeOnce, { once: true }), 0);
    function closeOnce(ev) { if (!menu.contains(ev.target)) menu.remove(); }
  }

  function buildGenreFilters(books) {
    const genres = [...new Set(books.map(b => b.genre).filter(Boolean))].sort();
    filterRow.innerHTML = '';
    if (genres.length < 2) return;

    filterRow.appendChild(chip('Tutti i generi', !ui.genre, () => { ui.genre = ''; render(); }));
    genres.forEach(g => filterRow.appendChild(chip(g, ui.genre === g, () => {
      ui.genre = ui.genre === g ? '' : g; render();
    })));
  }

  function syncSeg() {
    statusSeg.querySelectorAll('.seg').forEach(s =>
      s.classList.toggle('active', s.dataset.status === ui.status));
  }

  function render() {
    const all = getBooks();
    syncSeg();
    buildGenreFilters(all);

    let list = all;
    if (ui.wishlist)       list = list.filter(b => b.wishlist);
    else if (ui.status !== 'all') list = list.filter(b => (b.status || 'unread') === ui.status);

    if (ui.query) {
      const q = ui.query.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
      );
    }
    if (ui.genre) list = list.filter(b => b.genre === ui.genre);

    list = [...list].sort(SORTS[ui.sort].fn);

    grid.innerHTML = '';
    resultMeta.textContent = '';

    if (!all.length) {
      grid.replaceWith(emptyState('📚', 'La libreria è vuota',
        'Tocca "Aggiungi" e scansiona il codice a barre di un libro per iniziare.'));
      return;
    }
    if (!list.length) {
      grid.replaceWith(emptyState('🔍', 'Nessun risultato', 'Prova a cambiare ricerca o filtri.'));
      return;
    }

    resultMeta.textContent = `${list.length} ${list.length === 1 ? 'libro' : 'libri'}`;
    list.forEach(b => grid.appendChild(createBookCard(b, openDetail)));
  }

  render();
}

/* ---- helpers ---- */
function chip(label, active, onClick) {
  const el = document.createElement('button');
  el.className = `filter-chip${active ? ' active' : ''}`;
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

function emptyState(icon, title, text) {
  const el = document.createElement('div');
  el.id = 'book-grid';
  el.className = 'empty-state';
  el.innerHTML = `<div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p>`;
  return el;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
