/* THE SATURDAY 60 — shared app shell.
   THIS FILE IS THE LIVE VERSION, served from
   https://indoor-cycling.github.io/saturday60/ — revise from this copy,
   not an older one, and raise VERSION in sw.js after any upload.

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

      // A new version may ALREADY be sitting there from an earlier visit —
      // in that case no updatefound event is ever coming, so check directly.
      if (r.waiting && navigator.serviceWorker.controller) offerUpdate(r.waiting);
      if (r.installing) watch(r.installing);

      r.addEventListener('updatefound', function () {
        if (r.installing) watch(r.installing);
      });

      // Look for a newer upload each time the app is opened…
      r.update().catch(function () {});

      // …and again whenever it comes back to the foreground.
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) r.update().catch(function () {});
      });
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

  function watch(sw) {
    if (sw.state === 'installed' && navigator.serviceWorker.controller) return offerUpdate(sw);
    sw.addEventListener('statechange', function () {
      if (sw.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(sw);
    });
  }

  /* Ask the running worker which version it is. */
  function runningVersion(cb) {
    var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (!sw || typeof MessageChannel !== 'function') return cb(null);
    var ch = new MessageChannel(), done = false;
    ch.port1.onmessage = function (e) { done = true; cb(e.data && e.data.version); };
    try { sw.postMessage('VERSION', [ch.port2]); } catch (e) { return cb(null); }
    setTimeout(function () { if (!done) cb(null); }, 1200);
  }
  window.S60 = window.S60 || {};
  window.S60.runningVersion = runningVersion;
  window.S60.checkForUpdate = function (cb) {
    if (!reg) return cb && cb('no-sw');
    reg.update().then(function () {
      if (reg.waiting && navigator.serviceWorker.controller) { offerUpdate(reg.waiting); return cb && cb('found'); }
      if (reg.installing) { watch(reg.installing); return cb && cb('found'); }
      cb && cb('current');
    }).catch(function () { cb && cb('error'); });
  };

  var offered = false;
  function offerUpdate(sw) {
    if (offered) return;
    offered = true;
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
      '.s60-note{position:fixed;left:50%;transform:translateX(-50%);' +
        'bottom:calc(22px + env(safe-area-inset-bottom));z-index:95;' +
        'background:#252932;color:#f2f4f7;border:1px solid #30343d;border-radius:10px;' +
        'padding:10px 16px;font:500 13px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 12px 32px -14px rgba(0,0,0,.7);max-width:calc(100vw - 32px);}' +
      '@media print{.s60-bar,.s60-update,.s60-note{display:none !important;}}';
    var el = document.createElement('style');
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
  }

  /* ---------- "Save to…" — send a backup somewhere other than Downloads ----------
     The tools all save the same way: build a Blob, make an object URL, click a
     hidden <a download>. We remember the Blob behind each object URL, then let a
     "Save to…" button run the tool's own save button with delivery redirected to
     the share sheet (phones) or the system save dialog (desktop). The original
     Backup buttons are untouched and still download as before. */

  var blobsByUrl = Object.create(null);
  var blobOrder = [];
  var redirect = null;               // 'share' | 'picker' while a Save to… is running

  function trackBlobUrls() {
    if (!window.URL || !URL.createObjectURL) return;
    var makeUrl = URL.createObjectURL, dropUrl = URL.revokeObjectURL;

    URL.createObjectURL = function (obj) {
      var u = makeUrl.call(URL, obj);
      try {
        if (obj instanceof Blob) {
          blobsByUrl[u] = obj;
          blobOrder.push(u);
          while (blobOrder.length > 20) delete blobsByUrl[blobOrder.shift()];
        }
      } catch (e) {}
      return u;
    };
    URL.revokeObjectURL = function (u) {
      delete blobsByUrl[u];
      return dropUrl.call(URL, u);
    };
  }

  function interceptDownloadClicks() {
    var realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var href = this.getAttribute('href') || '';
      if (redirect && this.hasAttribute('download') && href.indexOf('blob:') === 0) {
        var blob = blobsByUrl[href];
        if (blob) {
          deliver(blob, this.getAttribute('download') || 'saturday60.json', redirect, this, realClick);
          return;
        }
      }
      return realClick.apply(this, arguments);
    };
  }

  /* Phones will not share every kind of file. Chrome's share sheet accepts
     text/plain but refuses application/json, so a .json backup is turned away.
     We therefore offer the same bytes as a .txt when .json isn't allowed — the
     contents are identical and Restore reads either. AS_TEXT remembers a phone
     that accepted .json at the check and then refused it for real. */
  var AS_TEXT = 's60-share-as-text';

  function preferText() {
    try { return localStorage.getItem(AS_TEXT) === '1'; } catch (e) { return false; }
  }
  function rememberPreferText() {
    try { localStorage.setItem(AS_TEXT, '1'); } catch (e) {}
  }

  function asText(name) { return name.replace(/\.json$/i, '') + '.txt'; }

  function makeFile(blob, name, type) {
    try { return new File([blob], name, { type: type }); } catch (e) { return null; }
  }
  function shareable(file) {
    if (!file || !navigator.share || !navigator.canShare) return false;
    try { return navigator.canShare({ files: [file] }); } catch (e) { return false; }
  }

  /* Which shape of file this device will take — checked with a stand-in of the
     same type and extension as the real thing. */
  function shareShape() {
    if (!navigator.share || !navigator.canShare || typeof File !== 'function') return null;
    var probe = new Blob(['{}'], { type: 'application/json' });
    if (!preferText() && shareable(makeFile(probe, 'probe.json', 'application/json'))) return 'json';
    if (shareable(makeFile(probe, 'probe.txt', 'text/plain'))) return 'text';
    return null;
  }

  function canPickFile() { return typeof window.showSaveFilePicker === 'function'; }

  function deliver(blob, name, mode, anchor, realClick) {
    function fallBack(why) {
      if (why) note(why + ' — saved to your downloads instead');
      realClick.call(anchor);
    }

    if (mode === 'share') {
      var shape = shareShape();
      var file = shape === 'json'
        ? makeFile(blob, name, 'application/json')
        : makeFile(blob, asText(name), 'text/plain');

      if (!file || !shareable(file)) return fallBack('This phone will not share that file');

      navigator.share({ files: [file], title: file.name }).then(function () {
        note('Sent to your share sheet');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;      // user backed out
        // Said yes to .json, then refused it. Use .txt from here on.
        if (shape === 'json') rememberPreferText();
        fallBack('Share sheet refused it (' + ((err && err.name) || 'unknown') + ')');
      });
      return;
    }

    window.showSaveFilePicker({
      suggestedName: name,
      types: [{ description: 'Saturday 60 backup', accept: { 'application/json': ['.json'] } }]
    }).then(function (handle) {
      return handle.createWritable().then(function (w) {
        return w.write(blob).then(function () { return w.close(); });
      }).then(function () { note('Saved to ' + (handle.name || name)); });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      fallBack();
    });
  }

  function note(msg) {
    var el = document.createElement('div');
    el.className = 's60-note';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  var SAVE_TARGETS = {
    'selector.html':   ['backupBtn', 'dlExport'],
    'buildsheet.html': ['bkBtn', 'dlExport'],
    'drops.html':      ['saveBtn', 'csvBtn']
  };

  /* Restore/Import must accept the .txt twin as well as .json. */
  function widenFileInputs() {
    var inputs = document.querySelectorAll('input[type=file]');
    Array.prototype.forEach.call(inputs, function (el) {
      var a = el.getAttribute('accept') || '';
      if (a.indexOf('json') < 0) return;
      if (a.indexOf('.txt') < 0) el.setAttribute('accept', a + ',.txt,text/plain');
    });
  }

  function addSaveButtons() {
    var share = !!shareShape(), pick = !share && canPickFile();
    if (!share && !pick) return;            // nothing better than a download here

    var mode = share ? 'share' : 'picker';
    var label = share ? 'Save to…' : 'Save as…';
    var hint = share
      ? 'Send this file to Drive, Files, mail — anywhere but Downloads'
      : 'Choose the folder to save this file in';

    var ids = SAVE_TARGETS[location.pathname.split('/').pop()] || [];
    ids.forEach(function (id) {
      var src = document.getElementById(id);
      if (!src || document.getElementById('s60-saveto-' + id)) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 's60-saveto-' + id;
      btn.className = src.className;        // borrow the tool's own button styling
      btn.textContent = label;
      btn.title = hint;
      btn.disabled = src.disabled;

      btn.addEventListener('click', function () {
        if (src.disabled) return;
        redirect = mode;
        try { src.click(); } finally { redirect = null; }
      });

      src.parentNode.insertBefore(btn, src.nextSibling);

      // keep it in step with the button it shadows
      try {
        new MutationObserver(function () { btn.disabled = src.disabled; })
          .observe(src, { attributes: true, attributeFilter: ['disabled'] });
      } catch (e) {}
    });
  }

  function boot() {
    addStyles();
    if (!isHub) addHubBar();
    trackBlobUrls();
    interceptDownloadClicks();
    widenFileInputs();
    addSaveButtons();
    register();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
