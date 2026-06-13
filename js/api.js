const BASE = 'https://www.googleapis.com/books/v1/volumes';

const LANG_MAP = {
  en: 'English', it: 'Italiano', fr: 'Français',
  de: 'Deutsch', es: 'Español', pt: 'Português',
  ja: '日本語', zh: '中文', ru: 'Русский',
};

export async function searchBooks(query) {
  const url = `${BASE}?q=${encodeURIComponent(query)}&maxResults=12&fields=items(id,volumeInfo)`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  return (data.items || []).map(mapItem);
}

function mapItem(item) {
  const v = item.volumeInfo || {};
  const cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || '';
  return {
    googleId: item.id,
    title: v.title || '',
    author: (v.authors || []).join(', '),
    year: v.publishedDate ? parseInt(v.publishedDate) || '' : '',
    publisher: v.publisher || '',
    language: LANG_MAP[v.language] || v.language || '',
    pages: v.pageCount || '',
    genre: (v.categories?.[0] || '').split(' / ')[0],
    cover: cover.replace('http:', 'https:'),
    notes: '',
  };
}
