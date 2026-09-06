/* Saturday 60 — shared app shell.
   Loaded by every page. Registers the service worker, offers an
   update when a new version is uploaded, and puts a "back to the
   hub" bar on the three tool pages. It never touches the tools'
   own data or logic. */
(function () {
  'use strict';

  var isHub = document.body && document.body.hasAttribute('data-s60-hub');

  /* ---------- service worker ---------- */
  var reg = null;

  function register() {
    if (!('serviceWorker' in navigator)) return;
    // file:// has no service workers — the tools still work, just not offline-installable.
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

    navigator.serviceWorker.register('sw.js').then(function (r) {
      reg = r;
      document.dispatchEvent(new CustomEvent('s60:sw-ready', { detail: r }));

      r.addEventListener('updatefound', function () {
        var sw = r.installing;
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          // A new version is waiting, and an old one is already running.
          if (sw.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(sw);
        });
      });

      // Look for a newer upload each time the app is opened.
      r.update().catch(function () {});
    }).catch(function (e) {
      console.warn('[s60] service worker did not register:', e);
    });

    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  function offerUpdate(sw) {
    var bar = document.createElement('div');
    bar.className = 's60-update';
    bar.innerHTML = '<span>A newer version is ready.</span><button type="button">Update now</button>' +
                    '<button type="button" class="s60-x" aria-label="Later">×</button>';
    bar.querySelector('button').addEventListener('click', function () {
      bar.querySelector('button').textContent = 'Updating…';
      sw.postMessage('SKIP_WAITING');
    });
    bar.querySelector('.s60-x').addEventListener('click', function () { bar.remove(); });
    document.body.appendChild(bar);
  }

  /* ---------- back-to-hub bar on tool pages ---------- */
  function luminance(rgb) {
    var m = String(rgb).match(/(\d+(?:\.\d+)?)/g);
    if (!m || m.length < 3) return 0;
    return (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255;
  }

  function pageIsLight() {
    var bg = getComputedStyle(document.body).backgroundColor;
    if (!bg || bg === 'transparent' || bg.indexOf('rgba(0, 0, 0, 0)') === 0) {
      bg = getComputedStyle(document.documentElement).backgroundColor;
    }
    return luminance(bg) > 0.5;
  }

  function addHubBar() {
    var light = pageIsLight();
    var bar = document.createElement('div');
    bar.className = 's60-bar' + (light ? ' light' : '');
    var a = document.createElement('a');
    a.href = './';
    a.className = 's60-home';
    a.innerHTML = '<span aria-hidden="true">‹</span> Saturday 60';
    bar.appendChild(a);
    var names = {
      'selector.html': 'Selector',
      'buildsheet.html': 'Build Sheet',
      'drops.html': 'Drops Library'
    };
    var file = location.pathname.split('/').pop();
    var title = document.createElement('span');
    title.className = 's60-title';
    title.textContent = names[file] || (document.title.split('·')[0] || '').trim();
    bar.appendChild(title);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ---------- styles ---------- */
  function addStyles() {
    var css =
      '.s60-bar{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:10px;' +
        'padding:calc(7px + env(safe-area-inset-top)) 14px 7px;background:#14161a;' +
        'border-bottom:1px solid #30343d;font:600 12px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
      '.s60-bar.light{background:#e9ebee;border-bottom-color:#c9ced6;}' +
      '.s60-home{color:#38bdf8;text-decoration:none;padding:4px 2px;}' +
      '.s60-bar.light .s60-home{color:#0e7fb8;}' +
      '.s60-home span{font-size:15px;line-height:1;}' +
      '.s60-title{margin-left:auto;color:#6b7280;font-weight:600;letter-spacing:.06em;' +
        'text-transform:uppercase;font-size:10px;}' +
      '.s60-bar.light .s60-title{color:#5a6472;}' +
      '.s60-update{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));' +
        'z-index:90;margin:0 auto;max-width:420px;display:flex;align-items:center;gap:10px;' +
        'background:#252932;color:#f2f4f7;border:1px solid #30343d;border-radius:12px;' +
        'padding:11px 12px;font:500 13px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 14px 34px -14px rgba(0,0,0,.75);}' +
      '.s60-update button{border:1px solid #30343d;background:#f2f4f7;color:#14161a;border-radius:8px;' +
        'padding:7px 11px;font:600 12.5px system-ui,sans-serif;cursor:pointer;margin-left:auto;}' +
      '.s60-update .s60-x{background:transparent;color:#9aa3af;border-color:transparent;' +
        'margin-left:0;padding:6px 8px;font-size:16px;line-height:1;}' +
      '@media print{.s60-bar,.s60-update{display:none !important;}}';
    var el = document.createElement('style');
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
  }

  function boot() {
    addStyles();
    if (!isHub) addHubBar();
    register();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
