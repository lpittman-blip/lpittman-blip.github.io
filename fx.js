/* One motion system: aurora field + living orb + typed headline.
   A single animation frame drives every canvas. Paused off-screen, in
   background tabs, when Pause motion is on, and under reduced motion. */
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
  var COLORS = ['#7C9CFF', '#19D3C5', '#FF4FD8', '#C8FF4A', '#B388FF'];

  function live() { return !reduce && !paused && !hidden; }

  function resize(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w: w, h: h, dpr: dpr };
  }

  function mountField(canvas) {
    if (!canvas || canvas._fx) return;
    canvas._fx = 'field';
    var ctx = canvas.getContext('2d', { alpha: true });
    var n = phone ? 26 : 70;
    var parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({
        x: Math.random(), y: Math.random(),
        v: 0.012 + Math.random() * 0.03,
        r: (phone ? 1 : 1.2) + Math.random() * 1.6,
        c: COLORS[i % COLORS.length],
        a: 0.25 + Math.random() * 0.55
      });
    }
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    }
    jobs.push({
      visible: function () { return visible; },
      draw: function (t) {
        var s = resize(canvas), w = s.w, h = s.h;
        ctx.clearRect(0, 0, w, h);
        var bands = [
          { c: 'rgba(124,156,255,.22)', y: 0.28, a: 0.7 },
          { c: 'rgba(25,211,197,.16)', y: 0.48, a: 1.1 },
          { c: 'rgba(255,79,216,.14)', y: 0.66, a: 0.5 }
        ];
        bands.forEach(function (b, i) {
          ctx.beginPath();
          for (var x = 0; x <= w; x += 8) {
            var u = x / w;
            var y = h * b.y + Math.sin(u * 6 + t / 1400 * b.a + i) * h * 0.08 + Math.sin(u * 2.2 - t / 2200) * h * 0.04;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = b.c;
          ctx.lineWidth = phone ? 28 : 46;
          ctx.lineCap = 'round';
          ctx.stroke();
        });
        parts.forEach(function (p) {
          p.y -= p.v * (phone ? 0.7 : 1);
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          ctx.beginPath();
          ctx.fillStyle = p.c;
          ctx.globalAlpha = p.a;
          ctx.arc(p.x * w, p.y * h, p.r * s.dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      },
      still: function () {
        var s = resize(canvas);
        ctx.clearRect(0, 0, s.w, s.h);
        var g = ctx.createLinearGradient(0, 0, s.w, s.h);
        g.addColorStop(0, 'rgba(124,156,255,.20)');
        g.addColorStop(0.5, 'rgba(25,211,197,.10)');
        g.addColorStop(1, 'rgba(255,79,216,.12)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, s.w, s.h);
      }
    });
  }

  function mountOrb(canvas) {
    if (!canvas || canvas._fx) return;
    canvas._fx = 'orb';
    canvas.style.background = 'transparent';
    var ctx = canvas.getContext('2d', { alpha: true });
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    }
    jobs.push({
      visible: function () { return visible; },
      draw: function (t) {
        paintOrb(ctx, canvas, t, false);
      },
      still: function () { paintOrb(ctx, canvas, 0, true); }
    });
  }

  function paintOrb(ctx, canvas, t, still) {
    var s = resize(canvas), w = s.w, h = s.h;
    var cx = w / 2, cy = h / 2;
    /* Keep every pixel of glow inside the bitmap so the canvas edge stays clear. */
    var reach = Math.min(w, h) * 0.5 - Math.max(2, s.dpr);
    var base = reach * 0.36;
    var state = canvas.getAttribute('data-state') || (canvas.getAttribute('data-orb') === 'agent' ? agent : 'idle');
    var energy = still ? 0.2 : (state === 'speak' || state === 'listen' ? Math.max(amp, 0.35) : state === 'think' ? 0.72 : 0.18);
    var speed = state === 'think' ? 3.2 : state === 'speak' ? 1.8 : state === 'listen' ? 1.5 : 0.7;
    ctx.clearRect(0, 0, w, h);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    var bloom = ctx.createRadialGradient(cx, cy, base * 0.15, cx, cy, reach);
    bloom.addColorStop(0, 'rgba(124,156,255,0.42)');
    bloom.addColorStop(0.22, state === 'listen' ? 'rgba(200,255,74,0.16)' : 'rgba(25,211,197,0.14)');
    bloom.addColorStop(0.48, 'rgba(255,79,216,0.07)');
    bloom.addColorStop(0.78, 'rgba(124,156,255,0.025)');
    bloom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, reach, 0, Math.PI * 2);
    ctx.fill();
    var rings = state === 'idle' ? 2 : 3;
    var ringLimit = reach * 0.86;
    for (var i = 0; i < rings; i++) {
      var p = still ? (i + 1) / (rings + 1) : ((t / 1000) * speed * 0.35 + i / rings) % 1;
      var ringR = Math.min(ringLimit, base * (1.25 + p * 0.95));
      var fade = 1 - ringR / ringLimit;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? 'rgba(255,79,216,' + ((1 - p) * 0.35 * (0.35 + fade)) + ')' : 'rgba(25,211,197,' + ((1 - p) * 0.4 * (0.35 + fade)) + ')';
      ctx.lineWidth = Math.max(1, 1.6 * s.dpr * (1 - p));
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    if (state === 'speak' && !still) {
      for (var a = 0; a <= Math.PI * 2 + 0.2; a += 0.15) {
        var wobble = 1 + Math.sin(a * 4 + t / 140) * energy * 0.07 + Math.sin(t / 90) * 0.03;
        var rr = base * wobble;
        var x = Math.cos(a) * rr, y = Math.sin(a) * rr * (1 + energy * 0.08);
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else {
      var pulse = 1 + (still ? 0 : Math.sin(t / 700) * 0.035) + energy * 0.08;
      ctx.arc(0, 0, base * pulse, 0, Math.PI * 2);
    }
    var core = ctx.createRadialGradient(-base * 0.32, -base * 0.36, base * 0.05, 0, 0, base * 1.35);
    core.addColorStop(0, 'rgba(255,255,255,0.95)');
    core.addColorStop(0.16, 'rgba(200,255,74,0.9)');
    core.addColorStop(0.38, 'rgba(124,156,255,0.85)');
    core.addColorStop(0.62, state === 'listen' ? 'rgba(200,255,74,0.45)' : 'rgba(25,211,197,0.4)');
    core.addColorStop(1, 'rgba(124,156,255,0)');
    ctx.fillStyle = core;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-base * 0.28, -base * 0.32, base * 0.22, base * 0.11, -0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fill();
    ctx.restore();
    /* Force a soft circular falloff so corners of the bitmap stay empty. */
    ctx.globalCompositeOperation = 'destination-in';
    var mask = ctx.createRadialGradient(cx, cy, reach * 0.42, cx, cy, reach);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.7, 'rgba(0,0,0,0.45)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
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
    if (verb) typeVerb(verb);
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
