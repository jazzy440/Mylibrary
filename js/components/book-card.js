import { ratingHTML } from './rating.js';

const STATUS_BADGE = {
  reading: { label: 'In lettura', cls: 'badge-reading' },
  read:    { label: 'Letto',      cls: 'badge-read' },
};

export function createBookCard(book, onClick) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const coverWrap = document.createElement('div');
  coverWrap.className = 'book-card-cover-wrap';

  if (book.cover) {
    const img = document.createElement('img');
    img.className = 'book-card-cover';
    img.src = book.cover;
    img.alt = book.title;
    img.loading = 'lazy';
    img.onerror = () => img.replaceWith(makePlaceholder());
    coverWrap.appendChild(img);
  } else {
    coverWrap.appendChild(makePlaceholder());
  }

  // Status badge overlay
  const badge = STATUS_BADGE[book.status];
  if (badge) {
    const b = document.createElement('div');
    b.className = `card-badge ${badge.cls}`;
    b.textContent = badge.label;
    coverWrap.appendChild(b);
  }

  // Wishlist star overlay
  if (book.wishlist) {
    const w = document.createElement('div');
    w.className = 'card-wish';
    w.textContent = '★';
    coverWrap.appendChild(w);
  }

  const info = document.createElement('div');
  info.className = 'book-card-info';
  info.innerHTML = `
    <div class="book-card-title">${esc(book.title)}</div>
    <div class="book-card-author">${esc(book.author || '—')}</div>
    ${book.rating ? ratingHTML(book.rating) : ''}
    <div class="book-card-tags">
      ${book.genre ? `<span class="chip chip-primary">${esc(book.genre)}</span>` : ''}
    </div>
  `;

  card.appendChild(coverWrap);
  card.appendChild(info);
  card.addEventListener('click', () => onClick(book));
  return card;
}

function makePlaceholder() {
  const el = document.createElement('div');
  el.className = 'book-card-cover-placeholder';
  el.textContent = '📖';
  return el;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
