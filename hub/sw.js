const CACHE = 'oon-jai-hub-shell-v1';
const ROOT = new URL('./', self.location.href).href;
const FILES = [
  './', 'lantern.css?v=app1', 'hub-app.js', 'app.webmanifest',
  'lantern-terrace.webp', 'emerald-lantern.webp', 'lantern-symbols.png',
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
  } else if (FILES.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.href)) || fetch(event.request)));
  }
});
