let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'default', duration = 3000) {
  const c = getContainer();
  const el = document.createElement('div');
  el.className = `toast${type !== 'default' ? ` ${type}` : ''}`;
  el.textContent = message;
  c.appendChild(el);

  setTimeout(() => {
    el.classList.add('hiding');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}
