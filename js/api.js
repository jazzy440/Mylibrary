// Dual-source: Google Books (if API key set) → Open Library (free fallback)
const GB_BASE  = 'https://www.googleapis.com/books/v1/volumes';
const OL_SEARCH = 'https://openlibrary.org/search.json';
const OL_ISBN   = 'https://openlibrary.org/api/books';
const OL_COVERS = 'https://covers.openlibrary.org/b';

const LANG_MAP_LONG = {
  en:'English', it:'Italiano', fr:'Français', de:'Deutsch',
  es:'Español', pt:'Português', ja:'日本語', zh:'中文', ru:'Русский', nl:'Nederlands',
};
const LANG_MAP_SHORT = {
  eng:'English', ita:'Italiano', fre:'Français', ger:'Deutsch',
  spa:'Español', por:'Português', jpn:'日本語', chi:'中文', rus:'Русский', dut:'Nederlands',
};

export function getApiKey()       { return localStorage.getItem('books_api_key') || ''; }
export function setApiKey(key)    { localStorage.setItem('books_api_key', key.trim()); }

// ── Public API ──────────────────────────────────────────────────────────────

export async function searchBooks(query) {
  const key = getApiKey();
  return key ? gbSearch(query, key) : olSearch(query);
}

export async function searchByISBN(isbn) {
  const clean = String(isbn).replace(/[^0-9Xx]/g, '');
  const key = getApiKey();
  if (key) {
    const result = await gbISBN(clean, key);
    if (result) return result;
  }
  return olISBN(clean);
}

// ── Google Books ─────────────────────────────────────────────────────────────

async function gbSearch(query, key) {
  const url = `${GB_BASE}?q=${encodeURIComponent(query)}&maxResults=20&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`Google Books: ${data.error.message}`);
  return (data.items || []).map(gbMapItem);
}

async function gbISBN(isbn, key) {
  const url = `${GB_BASE}?q=isbn:${isbn}&maxResults=1&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) return null;
  const item = (data.items || [])[0];
  return item ? { ...gbMapItem(item), isbn } : null;
}

function gbMapItem(item) {
  const v = item.volumeInfo || {};
  const ids = v.industryIdentifiers || [];
  const isbn13 = ids.find(i => i.type === 'ISBN_13')?.identifier;
  const isbn10 = ids.find(i => i.type === 'ISBN_10')?.identifier;
  const cover = (v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || '').replace('http:', 'https:');
  return {
    googleId:    item.id,
    isbn:        isbn13 || isbn10 || '',
    title:       v.title || '',
    author:      (v.authors || []).join(', '),
    year:        v.publishedDate ? (parseInt(v.publishedDate) || '') : '',
    publisher:   v.publisher || '',
    language:    LANG_MAP_LONG[v.language] || v.language || '',
    pages:       v.pageCount || '',
    genre:       (v.categories?.[0] || '').split(' / ')[0],
    cover,
    description: v.description || '',
    notes:       '',
  };
}

// ── Open Library ─────────────────────────────────────────────────────────────

async function olSearch(query) {
  const url = `${OL_SEARCH}?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library errore (${res.status})`);
  const data = await res.json();
  return (data.docs || []).filter(d => d.title).map(olMapDoc);
}

async function olISBN(isbn) {
  const url = `${OL_ISBN}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library errore (${res.status})`);
  const data = await res.json();
  const entry = data[`ISBN:${isbn}`];
  return entry ? olMapISBN(entry, isbn) : null;
}

function olMapDoc(doc) {
  const isbn = (doc.isbn || [])[0] || '';
  const lang = (doc.language || [])[0] || '';
  const cover = doc.cover_i
    ? `${OL_COVERS}/id/${doc.cover_i}-M.jpg`
    : isbn ? `${OL_COVERS}/isbn/${isbn}-M.jpg` : '';
  return {
    googleId:    doc.key || '',
    isbn,
    title:       doc.title || '',
    author:      (doc.author_name || []).join(', '),
    year:        doc.first_publish_year || '',
    publisher:   (doc.publisher || [])[0] || '',
    language:    LANG_MAP_SHORT[lang] || lang || '',
    pages:       doc.number_of_pages_median || '',
    genre:       (doc.subject || [])[0] || '',
    cover,
    description: '',
    notes:       '',
  };
}

function olMapISBN(book, isbn) {
  const lang = book.languages?.[0]?.key?.replace('/languages/', '') || '';
  const cover = book.cover?.medium || book.cover?.small || `${OL_COVERS}/isbn/${isbn}-M.jpg`;
  return {
    googleId:    book.key || '',
    isbn,
    title:       book.title || '',
    author:      (book.authors || []).map(a => a.name).join(', '),
    year:        book.publish_date ? (parseInt(book.publish_date) || '') : '',
    publisher:   (book.publishers || [])[0]?.name || '',
    language:    LANG_MAP_SHORT[lang] || lang || '',
    pages:       book.number_of_pages || '',
    genre:       (book.subjects || [])[0]?.name || '',
    cover,
    description: book.excerpts?.[0]?.text || '',
    notes:       '',
  };
}
