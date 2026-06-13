export function createBookCard(book, onClick) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const coverWrap = document.createElement('div');
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

  const info = document.createElement('div');
  info.className = 'book-card-info';
  info.innerHTML = `
    <div class="book-card-title">${esc(book.title)}</div>
    <div class="book-card-author">${esc(book.author || '—')}</div>
    <div class="book-card-tags">
      ${book.genre ? `<span class="chip chip-primary">${esc(book.genre)}</span>` : ''}
      ${book.language ? `<span class="chip chip-surface">${esc(book.language)}</span>` : ''}
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
