/* THE SATURDAY 60 — service worker.
   THIS FILE IS THE LIVE VERSION, served from
   https://indoor-cycling.github.io/saturday60/ — revise from this copy,
   not an older one.

   Bump VERSION below whenever you upload changed files.

   v50 changes, after an update took most of an afternoon to land:
   - install calls skipWaiting(), so a new version takes over at once
     instead of waiting for every tab on the old one to be closed.
   - Pages (.html and navigations) are fetched network-first, so a reload
     after an upload always shows the new file. Everything else stays
     cache-first for speed and offline use.
   - Background refreshes revalidate with the server rather than accepting
     whatever Chrome's HTTP cache is holding.
   In practice: upload, bump VERSION, reload once. */
var VERSION = 's60-v51';
var CACHE = 'saturday60-' + VERSION;

var ASSETS = [
  './',
  'index.html',
  'selector.html',
  'buildsheet.html',
  'drops.html',
  'Saturday60_WeeklyWorkflow.html',
  'Saturday60_WeeklyWorkflow.pdf',
  'Saturday60_SystemManual.html',
  'Saturday60_SystemManual.pdf',
  'Saturday60_GettingStarted.html',
  'Saturday60_GettingStarted.pdf',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

// A page is anything the browser would render as a document: a navigation,
// a path ending in .html, or a bare directory such as './'.
function isPage(req, url) {
  if (req.mode === 'navigate' || req.destination === 'document') return true;
  return /\.html$/i.test(url.pathname) || /\/$/.test(url.pathname);
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Individually, so one bad path can't fail the whole install.
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function (err) {
          console.warn('[sw] could not precache', u, err);
        });
      }));
    }).then(function () {
      // Don't sit in "waiting" behind open tabs — this version is ready.
      return self.skipWaiting();
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
  if (e.data === 'VERSION' && e.ports && e.ports[0]) {
    e.ports[0].postMessage({ version: VERSION });
  }
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ---- Pages: network first. An upload shows up on the next reload;
  //      the cached copy is only there for when the network isn't.
  if (isPage(req, url)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          return caches.match('index.html').then(function (page) {
            return page || caches.match('./');
          }).then(function (page) {
            return page || new Response('', { status: 504, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // ---- Everything else: cache first, refreshed quietly in the background.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        e.waitUntil(
          // no-cache: check with the server rather than trusting Chrome's copy.
          fetch(new Request(req, { cache: 'no-cache' })).then(function (res) {
            if (res && res.ok) return caches.open(CACHE).then(function (c) { return c.put(req, res); });
          }).catch(function () {})
        );
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
