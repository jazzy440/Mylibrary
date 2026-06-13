const KEY = 'mylibrary_v1';

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return raw.map(migrate);
  } catch {
    return [];
  }
}

// Ensure books saved before new fields existed get sensible defaults
function migrate(book) {
  return {
    status: 'unread',
    rating: 0,
    wishlist: false,
    ...book,
  };
}

function persist(books) {
  localStorage.setItem(KEY, JSON.stringify(books));
}

export function getBooks() { return load(); }

export function getBook(id) {
  return load().find(b => b.id === id) || null;
}

export function addBook(data) {
  const books = load();
  const book = {
    status: 'unread',
    rating: 0,
    wishlist: false,
    ...data,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  };
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

// True if a book with the same ISBN or googleId already exists
export function findDuplicate({ isbn, googleId }) {
  const books = load();
  return books.find(b =>
    (isbn && b.isbn && b.isbn === isbn) ||
    (googleId && b.googleId && b.googleId === googleId)
  ) || null;
}

/* ---- Backup ---- */
export function exportData() {
  return JSON.stringify({
    app: 'MyLibrary',
    version: 1,
    exportedAt: new Date().toISOString(),
    books: load(),
  }, null, 2);
}

export function importData(json, mode = 'merge') {
  let parsed;
  try { parsed = JSON.parse(json); }
  catch { throw new Error('File non valido'); }

  const incoming = Array.isArray(parsed) ? parsed : parsed.books;
  if (!Array.isArray(incoming)) throw new Error('Formato non riconosciuto');

  const clean = incoming.filter(b => b && b.title).map(b => ({
    ...migrate(b),
    id: b.id || crypto.randomUUID(),
    addedAt: b.addedAt || Date.now(),
  }));

  if (mode === 'replace') {
    persist(clean);
    return clean.length;
  }

  // merge: skip books whose id already exists
  const existing = load();
  const ids = new Set(existing.map(b => b.id));
  const merged = [...clean.filter(b => !ids.has(b.id)), ...existing];
  persist(merged);
  return clean.length;
}
