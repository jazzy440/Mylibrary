const KEY = 'mylibrary_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function persist(books) {
  localStorage.setItem(KEY, JSON.stringify(books));
}

export function getBooks() { return load(); }

export function addBook(data) {
  const books = load();
  const book = { ...data, id: crypto.randomUUID(), addedAt: Date.now() };
  books.unshift(book);
  persist(books);
  return book;
}

export function updateBook(id, data) {
  const books = load();
  const i = books.findIndex(b => b.id === id);
  if (i === -1) return null;
  books[i] = { ...books[i], ...data };
  persist(books);
  return books[i];
}

export function deleteBook(id) {
  persist(load().filter(b => b.id !== id));
}
