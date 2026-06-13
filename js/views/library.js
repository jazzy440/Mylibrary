import { getBooks } from '../db.js';
import { createBookCard } from '../components/book-card.js';
import { openDetail } from '../components/bottom-sheet.js';

export function mount(container) {
  let query = '';
  let activeGenre = '';
  let activeLang = '';

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top">
        <h1>La mia libreria</h1>
      </div>
      <div class="search-bar">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="lib-search" type="search" placeholder="Cerca titolo o autore…" autocomplete="off">
      </div>
    </div>
    <div id="filter-row" class="filter-row"></div>
    <div id="book-grid" class="book-grid"></div>
  `;

  const searchInput = container.querySelector('#lib-search');
  const filterRow   = container.querySelector('#filter-row');
  const grid        = container.querySelector('#book-grid');

  searchInput.addEventListener('input', e => { query = e.target.value; render(); });

  function buildFilters(books) {
    const genres = [...new Set(books.map(b => b.genre).filter(Boolean))];
    const langs  = [...new Set(books.map(b => b.language).filter(Boolean))];

    filterRow.innerHTML = '';
    if (!genres.length && !langs.length) return;

    const allChip = chip('Tutti', !activeGenre && !activeLang, () => {
      activeGenre = ''; activeLang = ''; render();
    });
    filterRow.appendChild(allChip);

    genres.forEach(g => filterRow.appendChild(chip(g, activeGenre === g, () => {
      activeGenre = activeGenre === g ? '' : g; activeLang = ''; render();
    })));

    langs.forEach(l => filterRow.appendChild(chip(l, activeLang === l, () => {
      activeLang = activeLang === l ? '' : l; activeGenre = ''; render();
    })));
  }

  function render() {
    const all = getBooks();
    buildFilters(all);

    let filtered = all;
    if (query)        filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(query.toLowerCase())
    );
    if (activeGenre)  filtered = filtered.filter(b => b.genre === activeGenre);
    if (activeLang)   filtered = filtered.filter(b => b.language === activeLang);

    grid.innerHTML = '';

    if (!all.length) {
      grid.outerHTML; // leave grid empty, show empty state below
      container.querySelector('#book-grid').replaceWith(emptyState(
        '📚', 'La libreria è vuota', 'Vai su "Aggiungi" per inserire il tuo primo libro.'
      ));
      return;
    }

    if (!filtered.length) {
      grid.replaceWith(emptyState('🔍', 'Nessun risultato', 'Prova a cambiare la ricerca o i filtri.'));
      return;
    }

    filtered.forEach(b => grid.appendChild(createBookCard(b, openDetail)));
  }

  render();

  // expose re-render so app.js can call it after sheet changes
  container._rerender = render;
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
  el.className = 'empty-state';
  el.innerHTML = `<div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p>`;
  return el;
}
