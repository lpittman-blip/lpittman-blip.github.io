/* Particle field and the Artemis orb. One animation frame drives every canvas.
   Paused off-screen, in background tabs, when Pause motion is on, and under
   reduced motion. Phones draw at 30fps. */
(function () {
  'use strict';
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var phone = !!(window.matchMedia && matchMedia('(max-width: 760px), (pointer: coarse)').matches);
  var root = document.documentElement;
  var hidden = document.hidden;
  var paused = root.getAttribute('data-motion') === 'paused';
  var jobs = [];
  var raf = 0;
  var last = 0;
  var agent = 'idle';
  var amp = 0.12;
  var targetAmp = 0.12;
  var fps = phone ? 30 : 60;
  var PALETTE = ['#3B6FE8', '#7C5CDB', '#E15B4C', '#E0B03A', '#C6A27A'];

  function live() { return !reduce && !paused && !hidden; }

  function resize(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w: w, h: h, dpr: dpr };
  }

  function particle(extra) {
    return {
      path: 'scatter', kind: 'dot', cx: 0.5, cy: 0.5, u: 0, angle: 0, radius: 0.4,
      aspect: 1, freq: 2, amp: 0.05, color: PALETTE[0], alpha: 0.55,
      size: 1.15, speed: 0.04, phase: 0, weight: 1.15,
      extra: extra || null
    };
  }

  function buildSpec(mode) {
    var parts = [];
    var scale = phone ? 0.55 : 1;
    var i;
    if (mode === 'quiet') {
      var n = Math.round(26 * scale);
      for (i = 0; i < n; i++) {
        var edge = i % 4;
        var cx = edge === 0 ? Math.random() * 0.14 : edge === 1 ? 0.86 + Math.random() * 0.14 : Math.random();
        var cy = edge === 2 ? Math.random() * 0.12 : edge === 3 ? 0.88 + Math.random() * 0.12 : Math.random();
        var p = particle();
        p.path = 'scatter';
        p.kind = i % 3 === 0 ? 'dash' : 'dot';
        p.cx = cx; p.cy = cy; p.angle = Math.random() * Math.PI * 2;
        p.color = PALETTE[i % PALETTE.length];
        p.alpha = 0.28 + Math.random() * 0.28;
        p.size = 1 + Math.random() * 0.8;
        p.speed = 0.12 + Math.random() * 0.2;
        p.phase = Math.random() * Math.PI * 2;
        parts.push(p);
      }
      return parts;
    }
    if (mode === 'waves') {
      var waves = phone ? 2 : 3;
      var w;
      for (w = 0; w < waves; w++) {
        var count = Math.round((phone ? 16 : 32));
        for (i = 0; i < count; i++) {
          var p = particle();
          p.path = 'wave';
          p.kind = i % 4 === 0 ? 'dash' : 'dot';
          p.u = i / count;
          p.cy = 0.32 + w * 0.2;
          p.freq = 1.4 + w * 0.45;
          p.amp = 0.055;
          p.color = PALETTE[(i + w) % PALETTE.length];
          p.alpha = 0.35 + (i % 3) * 0.1;
          p.size = i % 4 === 0 ? 1.35 : 1.05;
          p.speed = 0.012 + w * 0.004;
          p.phase = w * 0.8;
          parts.push(p);
        }
      }
      return parts;
    }
    var rings = [
      { r: 0.33, n: Math.round(36 * scale), cy: 0.48 },
      { r: 0.46, n: Math.round(48 * scale), cy: 0.46 },
      { r: 0.6, n: Math.round(40 * scale), cy: 0.42 }
    ];
    rings.forEach(function (ring, ri) {
      for (i = 0; i < ring.n; i++) {
        var p = particle();
        p.path = 'ring';
        p.kind = (i + ri) % 3 === 0 ? 'dash' : 'dot';
        p.angle = (i / ring.n) * Math.PI * 2 + ri * 0.35;
        p.radius = ring.r * (0.96 + ((i * 17) % 7) * 0.012);
        p.cx = 0.5;
        p.cy = ring.cy;
        p.aspect = 0.62;
        p.color = PALETTE[(i + ri * 2) % PALETTE.length];
        p.alpha = 0.38 + ((i * 3) % 5) * 0.07;
        p.size = i % 3 === 0 ? 1.45 : 1.05;
        p.speed = (ri % 2 ? -1 : 1) * (0.035 + ri * 0.008);
        p.phase = i * 0.2;
        parts.push(p);
      }
    });
    var arcs = [
      { cx: 0.16, cy: 0.28, r: 0.2, a0: -0.2, a1: 2.1, n: Math.round(14 * scale) },
      { cx: 0.84, cy: 0.66, r: 0.18, a0: 2.2, a1: 5.1, n: Math.round(12 * scale) }
    ];
    arcs.forEach(function (arc, ai) {
      for (i = 0; i < arc.n; i++) {
        var t = arc.n === 1 ? 0 : i / (arc.n - 1);
        var p = particle();
        p.path = 'ring';
        p.kind = i % 2 ? 'dot' : 'dash';
        p.angle = arc.a0 + (arc.a1 - arc.a0) * t;
        p.radius = arc.r;
        p.cx = arc.cx;
        p.cy = arc.cy;
        p.aspect = 1;
        p.color = PALETTE[(i + ai * 2) % PALETTE.length];
        p.alpha = 0.5;
        p.size = 1.15;
        p.speed = 0.025 * (ai ? -1 : 1);
        p.phase = ai;
        parts.push(p);
      }
    });
    var wn = Math.round(24 * scale);
    for (i = 0; i < wn; i++) {
      var p = particle();
      p.path = 'wave';
      p.kind = i % 5 === 0 ? 'dash' : 'dot';
      p.u = i / wn;
      p.cy = 0.8;
      p.freq = 2;
      p.amp = 0.035;
      p.color = PALETTE[i % PALETTE.length];
      p.alpha = 0.36;
      p.size = 1.05;
      p.speed = 0.018;
      p.phase = 0.4;
      parts.push(p);
    }
    return parts;
  }

  function paintSpec(ctx, canvas, spec, t, still) {
    var s = resize(canvas), w = s.w, h = s.h;
    if (w < 2 || h < 2) return;
    ctx.clearRect(0, 0, w, h);
    var min = Math.min(w, h);
    var time = still ? 0 : t / 1000;
    for (var i = 0; i < spec.length; i++) {
      var p = spec[i];
      var x, y, rot;
      if (p.path === 'ring') {
        var ang = p.angle + time * p.speed;
        var breathe = still ? 0 : Math.sin(time * 0.7 + p.phase) * min * 0.006;
        var rad = p.radius * min + breathe;
        x = p.cx * w + Math.cos(ang) * rad;
        y = p.cy * h + Math.sin(ang) * rad * p.aspect;
        rot = ang + Math.PI / 2;
      } else if (p.path === 'wave') {
        var u = p.u + time * p.speed;
        u = u - Math.floor(u);
        x = u * w;
        y = p.cy * h + Math.sin(u * Math.PI * 2 * p.freq + p.phase) * h * p.amp;
        rot = Math.cos(u * Math.PI * 2 * p.freq + time * 0.6) * 0.8;
      } else {
        x = p.cx * w + Math.sin(time * p.speed + p.phase) * 10 * s.dpr;
        y = p.cy * h + Math.cos(time * p.speed * 0.8 + p.phase) * 8 * s.dpr;
        rot = p.angle + time * 0.2;
      }
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = Math.max(1, p.weight * s.dpr);
      ctx.lineCap = 'round';
      if (p.kind === 'dot') {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, p.size * s.dpr * 0.85), 0, Math.PI * 2);
        ctx.fill();
      } else {
        var len = p.size * s.dpr * 4.5;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(rot) * len, y - Math.sin(rot) * len);
        ctx.lineTo(x + Math.cos(rot) * len, y + Math.sin(rot) * len);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function mountField(canvas) {
    if (!canvas || canvas._fx) return;
    canvas._fx = 'field';
    var mode = canvas.getAttribute('data-field') || 'rings';
    if (mode === '' || mode === 'field') mode = 'rings';
    var ctx = canvas.getContext('2d', { alpha: true });
    var spec = buildSpec(mode);
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '64px' }).observe(canvas);
    }
    jobs.push({
      visible: function () { return visible; },
      draw: function (t) { paintSpec(ctx, canvas, spec, t, false); },
      still: function () { paintSpec(ctx, canvas, spec, 0, true); }
    });
  }

  function mountOrb(canvas) {
    if (!canvas || canvas._fx) return;
    canvas._fx = 'orb';
    canvas.style.background = 'transparent';
    var ctx = canvas.getContext('2d', { alpha: true });
    var spec = orbSpec();
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    }
    jobs.push({
      visible: function () { return visible; },
      draw: function (t) { paintOrb(ctx, canvas, spec, t, false); },
      still: function () { paintOrb(ctx, canvas, spec, 0, true); }
    });
  }

  function orbSpec() {
    var rings = [
      { r: 0.42, n: phone ? 16 : 22, speed: 0.35 },
      { r: 0.62, n: phone ? 22 : 30, speed: -0.22 },
      { r: 0.82, n: phone ? 26 : 36, speed: 0.16 }
    ];
    var parts = [];
    rings.forEach(function (ring, ri) {
      for (var i = 0; i < ring.n; i++) {
        parts.push({
          ring: ri,
          r: ring.r * (0.94 + ((i * 13) % 5) * 0.018),
          a: (i / ring.n) * Math.PI * 2,
          speed: ring.speed,
          kind: (i + ri) % 3 === 0 ? 'dash' : 'dot',
          color: PALETTE[(i + ri) % PALETTE.length],
          alpha: 0.45 + ((i * 5) % 4) * 0.1,
          size: i % 4 === 0 ? 1.5 : 1.05
        });
      }
    });
    return parts;
  }

  function paintOrb(ctx, canvas, spec, t, still) {
    var s = resize(canvas), w = s.w, h = s.h;
    var cx = w / 2, cy = h / 2;
    var reach = Math.min(w, h) * 0.48;
    var state = canvas.getAttribute('data-state') || (canvas.getAttribute('data-orb') === 'agent' ? agent : 'idle');
    var energy = still ? 0.2 : (state === 'speak' || state === 'listen' ? amp : state === 'think' ? 0.45 : 0.12);
    var pulse = 1;
    if (!still && state === 'speak') pulse = 1 + Math.sin(t / 130) * (0.045 + energy * 0.12);
    else if (!still && state === 'listen') pulse = 1 + Math.sin(t / 200) * 0.035;
    else if (!still && state === 'think') pulse = 1 + Math.sin(t / 240) * 0.03;
    else if (!still) pulse = 1 + Math.sin(t / 1100) * 0.012;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    var time = still ? 0 : t / 1000;
    for (var i = 0; i < spec.length; i++) {
      var p = spec[i];
      var spin = still ? p.a : p.a + time * p.speed * (state === 'think' ? 2.1 : state === 'speak' ? 1.5 : 1);
      var rad = reach * p.r * pulse;
      var x = cx + Math.cos(spin) * rad;
      var y = cy + Math.sin(spin) * rad * 0.92;
      var alpha = p.alpha * (state === 'speak' ? 0.75 + energy * 0.45 : 1);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, 1.15 * s.dpr);
      if (p.kind === 'dot') {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.7, p.size * s.dpr * 0.9), 0, Math.PI * 2);
        ctx.fill();
      } else {
        var len = p.size * s.dpr * 4.2;
        var rot = spin + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(rot) * len, y - Math.sin(rot) * len);
        ctx.lineTo(x + Math.cos(rot) * len, y + Math.sin(rot) * len);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = Math.max(1.6, 2.1 * s.dpr);
    var m = reach * 0.22 * (state === 'speak' && !still ? pulse : 1);
    ctx.beginPath();
    ctx.moveTo(cx - m, cy + m * 0.42);
    ctx.quadraticCurveTo(cx, cy - m * 1.05, cx + m, cy + m * 0.42);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!live()) return;
    if (t - last < 1000 / fps) return;
    last = t;
    amp += (targetAmp - amp) * 0.18;
    if (agent !== 'speak' && agent !== 'listen') targetAmp += (0.16 - targetAmp) * 0.08;
    for (var i = 0; i < jobs.length; i++) if (jobs[i].visible()) jobs[i].draw(t);
  }

  function settle() {
    for (var i = 0; i < jobs.length; i++) jobs[i].still();
  }

  function kick() {
    if (reduce) { settle(); return; }
    if (!raf) raf = requestAnimationFrame(frame);
    if (!live()) settle();
  }

  function boot(scope) {
    (scope || document).querySelectorAll('[data-field]').forEach(mountField);
    (scope || document).querySelectorAll('[data-orb]').forEach(mountOrb);
    kick();
    var verb = document.getElementById('verb');
    if (verb && !verb._typed) { verb._typed = true; typeVerb(verb); }
  }

  function typeVerb(el) {
    var words = ['Chat', 'Code', 'Build'];
    var i = 0, pos = words[0].length, dir = -1, hold = 0;
    el.textContent = words[0];
    if (reduce || paused) return;
    var box = el.closest('.hero') || el;
    var on = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(box);
    }
    setInterval(function () {
      if (!on || !live()) return;
      if (hold > 0) { hold--; return; }
      var word = words[i];
      pos += dir;
      if (pos <= 0) { dir = 1; i = (i + 1) % words.length; word = words[i]; pos = 0; }
      else if (pos >= word.length) { dir = -1; hold = 10; pos = word.length; }
      el.textContent = words[i].slice(0, Math.max(pos, 0));
    }, phone ? 90 : 70);
  }

  document.addEventListener('visibilitychange', function () { hidden = document.hidden; kick(); });
  new MutationObserver(function () {
    paused = root.getAttribute('data-motion') === 'paused';
    kick();
  }).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  if ('MutationObserver' in window) {
    new MutationObserver(function (list) {
      list.forEach(function (rec) {
        rec.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('[data-orb],[data-field]')) boot(node.parentNode || document);
          else if (node.querySelectorAll) boot(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  window.addEventListener('resize', function () { if (!live()) settle(); }, { passive: true });

  window.ArtemisFX = {
    mountField: mountField,
    mountOrb: mountOrb,
    setAgent: function (state, level) {
      agent = state || 'idle';
      if (typeof level === 'number') targetAmp = Math.max(0, Math.min(1, level));
      document.querySelectorAll('[data-orb="agent"]').forEach(function (c) { c.setAttribute('data-state', agent); });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
  else boot();
})();
