// Uses Open Library (openlibrary.org) — free, no API key required.
const OL_SEARCH = 'https://openlibrary.org/search.json';
const OL_ISBN   = 'https://openlibrary.org/api/books';
const OL_COVERS = 'https://covers.openlibrary.org/b';

const LANG_MAP = {
  eng: 'English',  ita: 'Italiano', fre: 'Français', ger: 'Deutsch',
  spa: 'Español',  por: 'Português', jpn: '日本語',   chi: '中文',
  rus: 'Русский',  dut: 'Nederlands', ara: 'العربية', lat: 'Latino',
};

export async function searchBooks(query) {
  const url = `${OL_SEARCH}?q=${encodeURIComponent(query)}&limit=20`
    + `&fields=key,title,author_name,first_publish_year,publisher,isbn,number_of_pages_median,subject,language,cover_i`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Errore server (${res.status})`);
  const data = await res.json();
  return (data.docs || []).filter(d => d.title).map(mapDoc);
}

export async function searchByISBN(isbn) {
  const clean = String(isbn).replace(/[^0-9Xx]/g, '');
  const url = `${OL_ISBN}?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Errore server (${res.status})`);
  const data = await res.json();
  const entry = data[`ISBN:${clean}`];
  if (!entry) return null;
  return mapISBNEntry(entry, clean);
}

function coverURL(coverId, isbn) {
  if (coverId)  return `${OL_COVERS}/id/${coverId}-M.jpg`;
  if (isbn)     return `${OL_COVERS}/isbn/${isbn}-M.jpg`;
  return '';
}

function mapDoc(doc) {
  const isbn = (doc.isbn || [])[0] || '';
  const lang = (doc.language || [])[0] || '';
  return {
    googleId:    doc.key || '',
    isbn,
    title:       doc.title || '',
    author:      (doc.author_name || []).join(', '),
    year:        doc.first_publish_year || '',
    publisher:   (doc.publisher || [])[0] || '',
    language:    LANG_MAP[lang] || lang || '',
    pages:       doc.number_of_pages_median || '',
    genre:       (doc.subject || [])[0] || '',
    cover:       coverURL(doc.cover_i, isbn),
    description: '',
    notes:       '',
  };
}

function mapISBNEntry(book, isbn) {
  const lang = book.languages?.[0]?.key?.replace('/languages/', '') || '';
  const cover = book.cover?.medium || book.cover?.small || coverURL(null, isbn);
  return {
    googleId:    book.key || '',
    isbn,
    title:       book.title || '',
    author:      (book.authors || []).map(a => a.name).join(', '),
    year:        book.publish_date ? (parseInt(book.publish_date) || '') : '',
    publisher:   (book.publishers || [])[0]?.name || '',
    language:    LANG_MAP[lang] || lang || '',
    pages:       book.number_of_pages || '',
    genre:       (book.subjects || [])[0]?.name || '',
    cover,
    description: book.excerpts?.[0]?.text || '',
    notes:       '',
  };
}
