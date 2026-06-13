import { mount as mountLibrary } from './views/library.js';
import { mount as mountAdd }     from './views/add.js';
import { mount as mountStats }   from './views/stats.js';
import { initSheet, closeSheet } from './components/bottom-sheet.js';

const viewContainer = document.getElementById('view-container');
const navItems      = document.querySelectorAll('.nav-item');

const VIEWS = { library: mountLibrary, add: mountAdd, stats: mountStats };

function currentView() {
  const h = location.hash.slice(1);
  return VIEWS[h] ? h : 'library';
}

function navigate(view) {
  if (location.hash.slice(1) !== view) location.hash = view;
  else renderCurrent(); // same tab tapped → refresh
}

function renderCurrent() {
  const view = currentView();

  navItems.forEach(item =>
    item.classList.toggle('active', item.dataset.view === view)
  );

  closeSheet();
  viewContainer.innerHTML = '';
  VIEWS[view](viewContainer);
}

/* Re-render current view (called after book edits / deletes) */
function onBookChanged() {
  renderCurrent();
}

navItems.forEach(item =>
  item.addEventListener('click', () => navigate(item.dataset.view))
);

window.addEventListener('hashchange', renderCurrent);

// Init sheet with callback
initSheet(onBookChanged);

// Boot
renderCurrent();

// Service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  );
}
