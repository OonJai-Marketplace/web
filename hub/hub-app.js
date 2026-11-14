const installButton = document.querySelector('#install-hub');
const shareButton = document.querySelector('#share-hub');
const statusLine = document.querySelector('#hub-status');
const shareField = document.querySelector('#share-url');
const hubUrl = new URL('./', location.href).href;
let installPrompt;
function announce(message) {
  statusLine.textContent = message;
  statusLine.hidden = false;
}
const standalone = matchMedia('(display-mode: standalone)');
function refreshInstall() {
  installButton.hidden = standalone.matches || navigator.standalone === true;
}
refreshInstall();
standalone.addEventListener?.('change', refreshInstall);
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installButton.hidden = true;
  installPrompt = null;
  announce('Oon Jai Hub is installed.');
});
installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return;
    } catch { /* Browser may have withdrawn the prompt. */ }
  }
  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  announce(appleMobile ? 'In Safari, tap Share, then Add to Home Screen.' :
    'Open the browser menu and choose Install app or Add to Home screen if available. On Android, you can also download the APK here.');
});
shareButton.hidden = false;
shareButton.addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({title: 'Oon Jai Hub', url: hubUrl}); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(hubUrl);
    announce('Hub link copied.');
  } catch {
    shareField.value = hubUrl;
    shareField.hidden = false;
    shareField.focus();
    shareField.select();
    announce('Copy the selected hub link.');
  }
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
