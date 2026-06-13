import { exportData, importData } from './db.js';
import { showToast } from './components/toast.js';

export function downloadBackup() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mylibrary-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup esportato', 'success');
}

export function pickAndImport(onDone) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const count = importData(fr.result, 'merge');
        showToast(`Importati ${count} libri`, 'success');
        onDone?.();
      } catch (e) {
        showToast(e.message || 'Errore importazione', 'error');
      }
    };
    fr.readAsText(file);
  });
  input.click();
}
