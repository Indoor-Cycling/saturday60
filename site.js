/* THE SATURDAY 60 — site.js, loaded first by every page (s60-v85).

   1. Visitor counter. Loads GoatCounter (no cookies, no IP addresses kept)
      and counts one view when a page opens online and visible. It reports
      the page's address only: never what follows a "?" — the RPE cards can
      carry an FTP there, and GoatCounter would otherwise send it along — and
      the referring page the same way. Never counts on file:// or localhost.
      To keep a device's own visits out, open the app once with
      #toggle-goatcounter on the end of the address (again to switch back),
      or list your IP in GoatCounter's Settings -> Tracking.

   2. Rider numbers, once per device. Before s60-v85 the Build Sheet, TSS
      Planner and M3i card started at FTP 158 W, Max HR 164 and PB 280; new
      devices now start at the placeholders 200 W, 180 and 350. A device
      that was already in use keeps the numbers it was showing, so nobody's
      zones move under them. A number typed by hand was saved already and is
      never touched. */
(function () {
  var CODE = 'saturday60';                       // https://<CODE>.goatcounter.com
  var bare = function (u) {                  // address without "?..." or "#..."
    try { var x = new URL(u); return x.origin + x.pathname; } catch (e) { return ''; }
  };
  window.goatcounter = { no_onload: true, path: location.pathname || '/', referrer: bare };
  if (location.protocol !== 'https:') return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
  s.onload = function () {
    var gc = window.goatcounter;
    if (!gc || !gc.count) return;
    var go = function () {
      // count.js always adds location.search; hide it for the one synchronous call.
      var q = location.search, st = history.state;
      if (q) history.replaceState(st, '', location.pathname + location.hash);
      try { gc.count(); }
      finally { if (q) history.replaceState(st, '', location.pathname + q + location.hash); }
    };
    if (!('visibilityState' in document) || document.visibilityState === 'visible') go();
    else document.addEventListener('visibilitychange', function f() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', f); go();
    });
  };
  (document.head || document.documentElement).appendChild(s);
})();

(function () {
  try {
    var ls = window.localStorage, FLAG = 's60.v85.rider';
    if (!ls || ls.getItem(FLAG)) return;
    var used = false;
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (k && k !== FLAG && k !== 'skipgc') { used = true; break; }
    }
    if (used) {
      if (!ls.getItem('s60_rider_v1')) ls.setItem('s60_rider_v1', JSON.stringify({ ftp: 158, hr: 164 }));
      if (!ls.getItem('tss.ftp')) ls.setItem('tss.ftp', '158');
      if (!ls.getItem('rpe.m3i.ftp')) ls.setItem('rpe.m3i.ftp', '158');
      if (!ls.getItem('rpe.m3i.pb')) ls.setItem('rpe.m3i.pb', '280');
    }
    ls.setItem(FLAG, '1');
  } catch (e) {}
})();
