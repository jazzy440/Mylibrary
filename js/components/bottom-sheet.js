import { deleteBook, updateBook } from '../db.js';
import { showToast } from './toast.js';

let backdrop, sheet, titleEl, contentEl, actionsEl;
let current = null;
let onChanged = null;

export function initSheet(onBookChanged) {
  onChanged = onBookChanged;
  backdrop = document.getElementById('sheet-backdrop');
  sheet    = document.getElementById('bottom-sheet');
  titleEl  = document.getElementById('sheet-title');
  contentEl = document.getElementById('sheet-content');
  actionsEl = document.getElementById('sheet-actions');

  backdrop.addEventListener('click', closeSheet);
  document.getElementById('sheet-close-btn').addEventListener('click', closeSheet);
}

export function openDetail(book) {
  current = book;
  titleEl.textContent = 'Dettaglio';
  renderDetail();
  openSheet();
}

export function closeSheet() {
  backdrop.classList.remove('open');
  sheet.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    contentEl.innerHTML = '';
    actionsEl.innerHTML = '';
    current = null;
  }, 350);
}

/* ---- Detail ---- */
function renderDetail() {
  const b = current;

  contentEl.innerHTML = `
    <div class="book-detail-hero">
      ${coverEl(b, 'book-detail-cover', 'book-detail-cover-placeholder', '📖')}
      <div class="book-detail-headline">
        <div class="book-detail-title">${esc(b.title)}</div>
        <div class="book-detail-author">${esc(b.author || '—')}</div>
        <div class="book-detail-tags">
          ${b.genre    ? `<span class="chip chip-primary">${esc(b.genre)}</span>` : ''}
          ${b.language ? `<span class="chip chip-surface">${esc(b.language)}</span>` : ''}
        </div>
      </div>
    </div>
    ${metaGrid(b)}
    ${b.notes ? `<div class="notes-box"><div class="notes-box-label">Note</div><p>${esc(b.notes)}</p></div>` : ''}
  `;

  actionsEl.innerHTML = '';
  const delBtn  = btn('btn-ghost', 'Elimina');
  const editBtn = btn('btn-primary', 'Modifica', 'flex:1');
  delBtn.addEventListener('click', showDeleteConfirm);
  editBtn.addEventListener('click', renderEdit);
  actionsEl.append(delBtn, editBtn);
}

function showDeleteConfirm() {
  const box = document.createElement('div');
  box.className = 'delete-confirm';
  box.innerHTML = `
    <p>Eliminare <strong>${esc(current.title)}</strong>?</p>
    <div class="delete-confirm-btns">
      <button class="btn btn-ghost" id="del-cancel">Annulla</button>
      <button class="btn btn-danger" id="del-ok">Elimina</button>
    </div>
  `;
  contentEl.prepend(box);
  box.querySelector('#del-cancel').addEventListener('click', () => box.remove());
  box.querySelector('#del-ok').addEventListener('click', () => {
    deleteBook(current.id);
    showToast('Libro eliminato');
    closeSheet();
    onChanged?.();
  });
}

/* ---- Edit ---- */
function renderEdit() {
  titleEl.textContent = 'Modifica';
  contentEl.innerHTML = buildForm(current);

  actionsEl.innerHTML = '';
  const cancelBtn = btn('btn-ghost', 'Annulla');
  const saveBtn   = btn('btn-primary', 'Salva', 'flex:1');
  cancelBtn.addEventListener('click', () => { titleEl.textContent = 'Dettaglio'; renderDetail(); });
  saveBtn.addEventListener('click', () => {
    const data = readForm();
    if (!data.title.trim()) { showToast('Il titolo è obbligatorio', 'error'); return; }
    current = updateBook(current.id, data);
    showToast('Salvato', 'success');
    titleEl.textContent = 'Dettaglio';
    renderDetail();
    onChanged?.();
  });
  actionsEl.append(cancelBtn, saveBtn);
}

/* ---- Shared form ---- */
export function buildForm(b = {}) {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="label">Titolo *</label>
        <input id="f-title" type="text" value="${esc(b.title || '')}" placeholder="Titolo del libro">
      </div>
      <div class="form-group">
        <label class="label">Autore</label>
        <input id="f-author" type="text" value="${esc(b.author || '')}" placeholder="Nome Cognome">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="label">Anno</label>
          <input id="f-year" type="number" value="${esc(b.year || '')}" placeholder="2024" min="1000" max="2099">
        </div>
        <div class="form-group">
          <label class="label">Pagine</label>
          <input id="f-pages" type="number" value="${esc(b.pages || '')}" placeholder="300" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="label">Editore</label>
        <input id="f-publisher" type="text" value="${esc(b.publisher || '')}" placeholder="Casa editrice">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="label">Genere</label>
          <input id="f-genre" type="text" value="${esc(b.genre || '')}" placeholder="es. Narrativa">
        </div>
        <div class="form-group">
          <label class="label">Lingua</label>
          <input id="f-language" type="text" value="${esc(b.language || '')}" placeholder="es. Italiano">
        </div>
      </div>
      <div class="form-group">
        <label class="label">URL Copertina</label>
        <input id="f-cover" type="url" value="${esc(b.cover || '')}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="label">Note personali</label>
        <textarea id="f-notes" placeholder="Commenti, citazioni, pensieri...">${esc(b.notes || '')}</textarea>
      </div>
    </div>
  `;
}

export function readForm() {
  return {
    title:     document.getElementById('f-title').value.trim(),
    author:    document.getElementById('f-author').value.trim(),
    year:      parseInt(document.getElementById('f-year').value)  || '',
    pages:     parseInt(document.getElementById('f-pages').value) || '',
    publisher: document.getElementById('f-publisher').value.trim(),
    genre:     document.getElementById('f-genre').value.trim(),
    language:  document.getElementById('f-language').value.trim(),
    cover:     document.getElementById('f-cover').value.trim(),
    notes:     document.getElementById('f-notes').value.trim(),
  };
}

/* ---- Helpers ---- */
function openSheet() {
  backdrop.classList.add('open');
  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function coverEl(b, imgClass, phClass, emoji) {
  if (b.cover) {
    return `<img class="${imgClass}" src="${esc(b.cover)}" alt="${esc(b.title)}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="${phClass}" style="display:none">${emoji}</div>`;
  }
  return `<div class="${phClass}">${emoji}</div>`;
}

function metaGrid(b) {
  const pairs = [
    ['Anno', b.year], ['Pagine', b.pages],
    ['Editore', b.publisher], ['Lingua', b.language],
  ].filter(([, v]) => v);
  if (!pairs.length) return '';
  return `<div class="meta-list">${pairs.map(([l, v]) =>
    `<div class="meta-item"><div class="meta-item-label">${l}</div><div class="meta-item-value">${esc(String(v))}</div></div>`
  ).join('')}</div>`;
}

function btn(cls, label, style = '') {
  const b = document.createElement('button');
  b.className = `btn ${cls}`;
  b.textContent = label;
  if (style) b.style.cssText = style;
  return b;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
