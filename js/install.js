// Handles the "Install app" experience across Android (Chrome) and iOS (Safari).
let deferredPrompt = null;

export function initInstall() {
  const banner   = document.getElementById('install-banner');
  const btn      = document.getElementById('install-btn');
  const dismiss  = document.getElementById('install-dismiss');
  const iosHint  = document.getElementById('ios-install-hint');

  // Already installed → never show the banner
  if (isStandalone()) return;

  // User dismissed it before → respect that for this session
  if (sessionStorage.getItem('install_dismissed')) return;

  // Android / Chrome: the browser fires this when the app is installable
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.add('show');
  });

  // iOS Safari never fires beforeinstallprompt → show manual instructions
  if (isIOS() && !isStandalone()) {
    banner.classList.add('show');
    btn.textContent = 'Come installare';
  }

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') banner.classList.remove('show');
    } else if (isIOS()) {
      iosHint.classList.add('show');
    }
  });

  dismiss.addEventListener('click', () => {
    banner.classList.remove('show');
    sessionStorage.setItem('install_dismissed', '1');
  });

  // Hide banner once installed
  window.addEventListener('appinstalled', () => {
    banner.classList.remove('show');
    deferredPrompt = null;
  });

  // Close iOS hint when tapping its backdrop
  iosHint?.addEventListener('click', (e) => {
    if (e.target === iosHint) iosHint.classList.remove('show');
  });
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
