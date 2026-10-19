/* Agenda Pedagógica: guarda la app completa para usarla sin conexión.
   Todo sale del caché que se llenó al instalar, también la página: abre al instante y no usa la red ni la batería en buscarla.
   Así las partes de la app nunca se mezclan entre versiones. El navegador revisa solo este archivo para saber si hay versión nueva:
   para publicar cambios, cambia CACHE y todo se descarga de nuevo junto. */
var CACHE = 'agenda-v11';
var PROPIOS = ['./', './index.html', './app.js', './estilos.css', './manifest.webmanifest', './icono.svg', './icono-maskable.svg',
  './partes/app-1.js', './partes/app-2.js', './partes/app-3.js', './partes/app-4.js', './partes/app-5.js', './partes/app-6.js'];
var EXTERNOS = [
  'https://cdn.jsdelivr.net/npm/@fontsource/atkinson-hyperlegible@5.3.0/files/atkinson-hyperlegible-latin-400-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/atkinson-hyperlegible@5.3.0/files/atkinson-hyperlegible-latin-700-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/zilla-slab@5.3.0/files/zilla-slab-latin-500-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/zilla-slab@5.3.0/files/zilla-slab-latin-700-normal.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(PROPIOS.map(function (u) { return new Request(u, { cache: 'reload' }); })).then(function () {
      return Promise.all(EXTERNOS.map(function (u) {
        return fetch(u, { mode: 'cors' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === 'https://cdn.jsdelivr.net' || url.origin === 'https://cdnjs.cloudflare.com') {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req.url).then(function (g) {
        return g || fetch(req).then(function (r) { if (r.ok && r.type !== 'opaque') c.put(req.url, r.clone()); return r; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match('./index.html').then(function (g) {
        return g || fetch(req).then(function (r) { if (r && r.ok) c.put('./index.html', r.clone()); return r; });
      });
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (g) {
      return g || fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; });
    });
  }));
});
