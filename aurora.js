/* Homepage chrome: mobile menu, pause-motion, scroll reveals, live gateway status.
   No palette switcher. Motion itself lives in fx.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  };
  if (store.get('artemis-motion') === 'paused') root.setAttribute('data-motion', 'paused');

  document.addEventListener('DOMContentLoaded', function () {
    root.classList.add('js');

    var paused = root.getAttribute('data-motion') === 'paused';
    var mt = document.querySelectorAll('[data-motion-toggle]');
    function syncMotion() {
      mt.forEach(function (b) {
        b.setAttribute('aria-pressed', paused ? 'true' : 'false');
        var l = b.querySelector('.l'); if (l) l.textContent = paused ? 'Play motion' : 'Pause motion';
        var i = b.querySelector('.i'); if (i) i.textContent = paused ? '\u25B6' : '\u275A\u275A';
      });
    }
    mt.forEach(function (b) {
      b.addEventListener('click', function () {
        paused = !paused;
        store.set('artemis-motion', paused ? 'paused' : null);
        if (paused) root.setAttribute('data-motion', 'paused');
        else root.removeAttribute('data-motion');
        syncMotion();
      });
    });
    syncMotion();

    var burger = document.querySelector('.burger'), drawer = document.getElementById('drawer');
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var o = drawer.classList.toggle('open');
        burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('a')) { drawer.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
      });
    }

    var rv = document.querySelectorAll('.rv');
    rv.forEach(function (n) {
      var sib = n.parentElement ? Array.prototype.filter.call(n.parentElement.children, function (c) { return c.classList.contains('rv'); }) : [];
      n.style.setProperty('--i', Math.min(sib.indexOf(n), 6));
    });
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (n) { n.classList.add('in'); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (n) { io.observe(n); });
      setTimeout(function () { rv.forEach(function (n) { n.classList.add('in'); }); }, 4000);
    }

    var $ = function (id) { return document.getElementById(id); };
    if (!$('st-chat') && !$('hero-dot')) return;
    var API = 'https://api.artemisai-bycutlineindustries.studio';
    function txt(id, v, cls) { var n = $(id); if (!n) return; n.textContent = v; if (cls) n.className = cls; }
    function get(path) {
      var c = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (c) c.abort(); }, 8000);
      return fetch(API + path, { cache: 'no-store', credentials: 'omit', signal: c ? c.signal : undefined }).then(function (r) {
        clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json();
      });
    }
    var t0 = performance.now();
    get('/api/health').then(function (h) {
      var ok = !!(h && h.ok), ms = Math.round(performance.now() - t0);
      ['hero-dot', 'live-dot'].forEach(function (id) { var d = $(id); if (d) d.className = 'dot ' + (ok ? 'ok' : 'bad'); });
      txt('hero-state', ok ? 'Artemis Chat is online' : 'Artemis Chat is unreachable right now');
      txt('st-gw', ok ? 'Reachable · ' + ms + ' ms from you' : 'Not responding', ok ? 'on' : 'off');
      txt('st-queue', (h.queued || 0) + ' queued · ' + (h.generating || 0) + ' generating');
    }).catch(function () {
      ['hero-dot', 'live-dot'].forEach(function (id) { var d = $(id); if (d) d.className = 'dot bad'; });
      txt('hero-state', 'Status unavailable right now');
      txt('st-gw', 'Not responding', 'off');
    });
    get('/api/status').then(function (s) {
      var cap = s.capabilities || {}, tools = cap.tools || {};
      txt('st-chat', s.serving ? 'Serving' : (s.configured ? 'Configured, not serving' : 'Not configured'), s.serving ? 'on' : 'off');
      txt('st-model', (s.bootstrap || s.quality === 'not-artemis') ? 'Bootstrap model (not Artemis\u2019s own weights)' : (s.model || '\u2014'));
      txt('st-search', tools.web_search ? 'On (' + tools.web_search + ')' : 'Off', tools.web_search ? 'on' : 'off');
      txt('st-fetch', tools.web_fetch ? 'On' : 'Off', tools.web_fetch ? 'on' : 'off');
      txt('st-storage', s.storage === 'server' ? 'Saved to your account' : (s.storage || '\u2014'));
      txt('st-voice', cap.voice_input ? 'On' : 'Not yet', cap.voice_input ? 'on' : 'off');
      txt('st-upload', cap.file_upload ? 'On' : 'Not yet', cap.file_upload ? 'on' : 'off');
      txt('st-when', 'checked ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }).catch(function () { txt('st-chat', 'Status unavailable', 'off'); });
  });
})();
