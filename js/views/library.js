import { getBooks } from '../db.js';
import { openDetail } from '../components/bottom-sheet.js';

let query = '';

export function mount(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top">
        <h1>La mia libreria</h1>
        <button class="icon-btn" id="toggle-search" aria-label="Cerca">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>
      <div id="search-wrap" class="search-bar" style="${query ? '' : 'display:none'}">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="lib-search" type="search" placeholder="Cerca titolo o autore…" autocomplete="off" value="${esc(query)}">
      </div>
    </div>
    <div id="book-list"></div>
  `;

  const searchWrap = container.querySelector('#search-wrap');
  const searchInput = container.querySelector('#lib-search');
  const listEl = container.querySelector('#book-list');

  container.querySelector('#toggle-search').addEventListener('click', () => {
    const visible = searchWrap.style.display !== 'none';
    if (visible) {
      searchWrap.style.display = 'none';
      query = '';
      searchInput.value = '';
      render(listEl);
    } else {
      searchWrap.style.display = '';
      searchInput.focus();
    }
  });

  searchInput.addEventListener('input', e => {
    query = e.target.value;
    render(listEl);
  });

  render(listEl);
}

function render(listEl) {
  const all = getBooks();

  if (!all.length) {
    listEl.outerHTML = `<div id="book-list" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>La libreria è vuota</h3>
      <p>Tocca "Aggiungi" e scansiona il codice a barre di un libro per iniziare.</p>
    </div>`;
    return;
  }

  let list = all;
  if (query) {
    const q = query.toLowerCase();
    list = all.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:48px 0">
      <div class="empty-icon">🔍</div>
      <p>Nessun risultato per "${esc(query)}"</p>
    </div>`;
    return;
  }

  listEl.innerHTML = '';
  list.forEach(b => listEl.appendChild(createListItem(b)));
}

function createListItem(book) {
  const item = document.createElement('div');
  item.className = 'book-list-item';

  const cover = book.cover
    ? `<img class="book-list-cover" src="${esc(book.cover)}" alt="" loading="lazy"
         onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'book-list-placeholder',textContent:'📖'}))">`
    : `<div class="book-list-placeholder">📖</div>`;

  const statusDot = statusClass(book.status);

  item.innerHTML = `
    ${cover}
    <div class="book-list-info">
      <div class="book-list-title">${esc(book.title)}</div>
      <div class="book-list-author">${esc(book.author || '—')}</div>
    </div>
    ${statusDot ? `<div class="book-list-dot ${statusDot}"></div>` : ''}
  `;

  item.addEventListener('click', () => openDetail(book));
  return item;
}

function statusClass(status) {
  if (status === 'read')    return 'dot-read';
  if (status === 'reading') return 'dot-reading';
  return '';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
