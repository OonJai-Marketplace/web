const CACHE = 'oon-jai-hub-shell-v3';
const ROOT = new URL('./', self.location.href).href;
const FILES = [
  './', 'gateway.css?v=3','lang.js?v=3','leave.html','leave.js?v=3', 'hub-app.js?v=3', 'app.webmanifest',
  'home.css?v=3', ...['wide-restaurant','wide-wellness','wide-accounting','wide','phone','wide-scene','phone-scene','restaurant','wellness','accounting'].map(name=>'art/'+name+'.webp'),
  'hub-192.png', 'hub-512.png', '../assets/images/logo-png-favicon.3dff595a20.png'
].map(path => new URL(path, ROOT).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('oon-jai-hub-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isHome = event.request.mode === 'navigate' &&
    [ROOT, ROOT + 'index.html'].includes(url.origin + url.pathname);
  if (isHome) {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match(ROOT))));
  } else if (event.request.mode==='navigate' && url.origin+url.pathname===ROOT+'leave.html') {
    event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match(ROOT+'leave.html'))));
  } else if (FILES.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.href)) || fetch(event.request)));
  }
});
