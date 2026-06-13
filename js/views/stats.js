import { getBooks } from '../db.js';

let genreChart = null;
let langChart  = null;

export function mount(container) {
  const books = getBooks();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-top"><h1>Statistiche</h1></div>
    </div>
    ${summaryHTML(books)}
    <div class="chart-card">
      <div class="chart-card-title">Libri per genere</div>
      <div class="chart-container"><canvas id="chart-genre"></canvas></div>
    </div>
    <div class="chart-card" style="margin-bottom:16px">
      <div class="chart-card-title">Libri per lingua</div>
      <div class="chart-container"><canvas id="chart-lang"></canvas></div>
    </div>
  `;

  if (!books.length) return;

  // Destroy previous instances if navigating back
  if (genreChart) { genreChart.destroy(); genreChart = null; }
  if (langChart)  { langChart.destroy();  langChart  = null; }

  const genreCounts = countBy(books, 'genre');
  const langCounts  = countBy(books, 'language');

  genreChart = makeChart('chart-genre', genreCounts);
  langChart  = makeChart('chart-lang',  langCounts);
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
      ${statCard(pages ? pages.toLocaleString('it') : '—', 'Pagine totali')}
    </div>
  `;
}

function statCard(value, label) {
  return `
    <div class="stat-card">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function countBy(books, field) {
  const map = {};
  books.forEach(b => {
    const key = b[field] || 'Altro';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function makeChart(canvasId, entries) {
  if (!window.Chart) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas || !entries.length) return null;

  const labels = entries.map(([k]) => k);
  const data   = entries.map(([, v]) => v);

  return new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
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
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw} ${ctx.raw === 1 ? 'libro' : 'libri'}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#9090b8', font: { size: 11 } },
          grid:  { color: '#2a2a40' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9090b8', font: { size: 11 }, stepSize: 1, precision: 0 },
          grid:  { color: '#2a2a40' },
        },
      },
    },
  });
}
