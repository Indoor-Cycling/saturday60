/* Saturday 60 — service worker
   Bump VERSION whenever you upload changed files. That forces every
   installed copy to re-download the whole app on its next launch. */
var VERSION = 's60-v1';
var CACHE = 'saturday60-' + VERSION;

var ASSETS = [
  './',
  'index.html',
  'selector.html',
  'buildsheet.html',
  'drops.html',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Individually, so one bad path can't fail the whole install.
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function (err) {
          console.warn('[sw] could not precache', u, err);
        });
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE && k.indexOf('saturday60-') === 0) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      // Cached: serve instantly, then quietly refresh in the background.
      if (hit) {
        e.waitUntil(
          fetch(req).then(function (res) {
            if (res && res.ok) return caches.open(CACHE).then(function (c) { return c.put(req, res); });
          }).catch(function () {})
        );
        return hit;
      }
      // Not cached: go to the network and keep a copy.
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // Offline and unknown page — fall back to the hub.
        if (req.mode === 'navigate') {
          return caches.match('index.html') || caches.match('./');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
