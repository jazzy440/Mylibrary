const BASE = 'https://www.googleapis.com/books/v1/volumes';

const LANG_MAP = {
  en: 'English', it: 'Italiano', fr: 'Français',
  de: 'Deutsch', es: 'Español', pt: 'Português',
  ja: '日本語', zh: '中文', ru: 'Русский', nl: 'Nederlands',
};

export async function searchBooks(query) {
  const url = `${BASE}?q=${encodeURIComponent(query)}&maxResults=20&fields=items(id,volumeInfo)`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  return (data.items || []).map(mapItem);
}

// Look up a single book by ISBN (13 or 10 digits)
export async function searchByISBN(isbn) {
  const clean = String(isbn).replace(/[^0-9Xx]/g, '');
  const url = `${BASE}?q=isbn:${clean}&fields=items(id,volumeInfo)`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const item = (data.items || [])[0];
  if (!item) return null;
  return { ...mapItem(item), isbn: clean };
}

function mapItem(item) {
  const v = item.volumeInfo || {};
  const cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || '';
  const ids = v.industryIdentifiers || [];
  const isbn13 = ids.find(i => i.type === 'ISBN_13')?.identifier;
  const isbn10 = ids.find(i => i.type === 'ISBN_10')?.identifier;
  return {
    googleId: item.id,
    isbn: isbn13 || isbn10 || '',
    title: v.title || '',
    author: (v.authors || []).join(', '),
    year: v.publishedDate ? parseInt(v.publishedDate) || '' : '',
    publisher: v.publisher || '',
    language: LANG_MAP[v.language] || v.language || '',
    pages: v.pageCount || '',
    genre: (v.categories?.[0] || '').split(' / ')[0],
    cover: cover.replace('http:', 'https:'),
    description: v.description || '',
    notes: '',
  };
}
