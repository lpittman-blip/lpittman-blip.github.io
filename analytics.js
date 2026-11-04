/* Provider-agnostic analytics. Nothing is sent anywhere until a provider is chosen.
   To connect one later, assign window.ARTEMIS_ANALYTICS = function (name, props) {}.
   A public site id, if any, is read from data-site-id on this script tag. It is
   not a secret, and this file never transmits it on its own. */
(function () {
  'use strict';

  var siteId = '';
  var current = document.currentScript;
  if (current && current.dataset && current.dataset.siteId) siteId = current.dataset.siteId;

  function track(name, props) {
    var payload = {};
    if (props) {
      for (var key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) payload[key] = props[key];
      }
    }
    if (siteId) payload.site_id = siteId;
    try {
      var send = window.ARTEMIS_ANALYTICS;
      if (typeof send === 'function') send(name, payload);
    } catch (e) {}
  }

  window.artemisTrack = track;

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (target && target.nodeType !== 1) target = target.parentElement;
    var el = target && target.closest && target.closest('[data-track]');
    if (!el) return;
    track('cta_click', { id: el.getAttribute('data-track'), path: location.pathname });
  }, { capture: true, passive: true });

  var marks = [25, 50, 75, 90], sent = {};
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = (h.scrollTop / max) * 100;
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (pct >= m && !sent[m]) {
        sent[m] = 1;
        track('scroll_depth', { percent: m, path: location.pathname });
      }
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
})();
