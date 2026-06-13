import { getBooks } from '../db.js';
import { downloadBackup, pickAndImport } from '../backup.js';

let genreChart = null;
let langChart  = null;

export function mount(container) {
  const books = getBooks();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top"><h1>Statistiche</h1></div>
    </div>
    ${summaryHTML(books)}
    ${readingProgressHTML(books)}
    <div class="chart-card">
      <div class="chart-card-title">Libri per genere</div>
      <div class="chart-container"><canvas id="chart-genre"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">Libri per lingua</div>
      <div class="chart-container"><canvas id="chart-lang"></canvas></div>
    </div>

    <div class="chart-card" style="margin-bottom:16px">
      <div class="chart-card-title">Backup &amp; ripristino</div>
      <p style="font-size:.82rem;color:var(--text-2);line-height:1.5;margin-bottom:14px">
        I dati sono salvati solo su questo dispositivo. Esporta un backup per non perderli.
      </p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-full" id="export-btn">⬇ Esporta</button>
        <button class="btn btn-ghost btn-full" id="import-btn">⬆ Importa</button>
      </div>
    </div>
  `;

  container.querySelector('#export-btn').addEventListener('click', downloadBackup);
  container.querySelector('#import-btn').addEventListener('click', () =>
    pickAndImport(() => mount(container))
  );

  if (!books.length) return;

  if (genreChart) { genreChart.destroy(); genreChart = null; }
  if (langChart)  { langChart.destroy();  langChart  = null; }

  genreChart = makeChart('chart-genre', countBy(books, 'genre'));
  langChart  = makeChart('chart-lang',  countBy(books, 'language'));
}

function summaryHTML(books) {
  const authors = new Set(books.map(b => b.author).filter(Boolean)).size;
  const genres  = new Set(books.map(b => b.genre).filter(Boolean)).size;
  const pages   = books.reduce((s, b) => s + (parseInt(b.pages) || 0), 0);

  return `
    <div class="stats-summary">
      ${statCard(books.length, 'Libri')}
      ${statCard(authors, 'Autori')}
      ${statCard(genres, 'Generi')}
      ${statCard(pages ? pages.toLocaleString('it') : '—', 'Pagine')}
    </div>
  `;
}

function readingProgressHTML(books) {
  if (!books.length) return '';
  const read    = books.filter(b => b.status === 'read').length;
  const reading = books.filter(b => b.status === 'reading').length;
  const unread  = books.filter(b => (b.status || 'unread') === 'unread').length;
  const total   = books.length;
  const pct = v => total ? Math.round((v / total) * 100) : 0;

  return `
    <div class="chart-card">
      <div class="chart-card-title">Avanzamento lettura</div>
      <div class="progress-bar">
        <div class="progress-seg seg-read"    style="width:${pct(read)}%"></div>
        <div class="progress-seg seg-reading" style="width:${pct(reading)}%"></div>
        <div class="progress-seg seg-unread"  style="width:${pct(unread)}%"></div>
      </div>
      <div class="progress-legend">
        <span><i class="dot dot-read"></i>Letti ${read}</span>
        <span><i class="dot dot-reading"></i>In lettura ${reading}</span>
        <span><i class="dot dot-unread"></i>Da leggere ${unread}</span>
      </div>
    </div>
  `;
}

function statCard(value, label) {
  return `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
}

function countBy(books, field) {
  const map = {};
  books.forEach(b => {
    const key = b[field] || 'Altro';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function makeChart(canvasId, entries) {
  if (!window.Chart) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas || !entries.length) return null;

  return new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: 'rgba(124, 106, 240, 0.7)',
        borderColor: 'rgba(168, 154, 247, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} ${ctx.raw === 1 ? 'libro' : 'libri'}` } },
      },
      scales: {
        x: { ticks: { color: '#9090b8', font: { size: 10 } }, grid: { color: '#2a2a40' } },
        y: { beginAtZero: true, ticks: { color: '#9090b8', font: { size: 11 }, stepSize: 1, precision: 0 }, grid: { color: '#2a2a40' } },
      },
    },
  });
}
