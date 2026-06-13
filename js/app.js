import { mount as mountLibrary } from './views/library.js';
import { mount as mountAdd }     from './views/add.js';
import { mount as mountStats }   from './views/stats.js';
import { initSheet, closeSheet } from './components/bottom-sheet.js';
import { initScanner }           from './scanner.js';
import { initInstall }           from './install.js';

const viewContainer = document.getElementById('view-container');
const navItems      = document.querySelectorAll('.nav-item');

const VIEWS = { library: mountLibrary, add: mountAdd, stats: mountStats };

function currentView() {
  const h = location.hash.slice(1);
  return VIEWS[h] ? h : 'library';
}

function navigate(view) {
  if (location.hash.slice(1) !== view) location.hash = view;
  else renderCurrent();
}

function renderCurrent() {
  const view = currentView();
  navItems.forEach(item => item.classList.toggle('active', item.dataset.view === view));
  closeSheet();
  viewContainer.innerHTML = '';
  VIEWS[view](viewContainer);
}

function onBookChanged() { renderCurrent(); }

navItems.forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
window.addEventListener('hashchange', renderCurrent);

initSheet(onBookChanged);
initScanner(() => { if (currentView() === 'library') renderCurrent(); });
initInstall();

renderCurrent();

/* ---- Service worker with update flow ---- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js');
      // When a new version is found, activate it and reload once ready
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      });
    } catch {}
  });

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
