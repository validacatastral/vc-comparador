/* Solo recursos de la aplicación; nunca datos de Drive o Apps Script. */
const CACHE = 'vc-comparador-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await cache.addAll(SHELL);
    await Promise.allSettled(LIBS.map(url => cache.add(url)));
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vc-comparador-shell-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CHECK_INDEX') event.waitUntil((async () => {
    const cached = await caches.match('./index.html');
    const response = await fetch('./index.html', {cache:'no-store'});
    if (cached && response.ok && await cached.text() !== await response.text() && event.source)
      event.source.postMessage('INDEX_UPDATED');
  })().catch(() => {}));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isIndex = url.origin === self.location.origin && (url.pathname === new URL('./', self.registration.scope).pathname || url.pathname === new URL('./index.html', self.registration.scope).pathname);
  if (isIndex) {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put('./index.html', response.clone()); }
      return response;
    }).catch(() => caches.match('./index.html')));
  } else if (LIBS.includes(url.href) || (url.origin === self.location.origin && SHELL.slice(2).some(path => new URL(path, self.registration.scope).href === url.href))) {
    event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(async response => {
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); }
      return response;
    })));
  }
});
