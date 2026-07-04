
(function () {
  'use strict';

  /* Reveal on scroll */
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  /* Print-head progress bar */
  var bar = document.getElementById('printbar');
  addEventListener('scroll', function () {
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    bar.style.width = (p * 100) + '%';
  }, { passive: true });

  /* Mobile nav */
  var t = document.getElementById('navtoggle'), nav = document.getElementById('mnav');
  t.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });

  /* ===== Price calculator =====
     PRICING is the single source of truth. When the daily feed exists,
     replace this constant with: fetch('/pricing.json').then(...)
     keeping the same keys, and set asOf from the feed. */
  if (document.getElementById('c-run')) {
  var PRICING = {
    asOf: 'Illustrative planning ranges. Daily verified pricing coming soon.',
    perSqft: { single: 26, double: 42, landscape: 21 },   /* $ per printed wall sqft */
    mobilization: 14000,                                   /* flat, per project */
    spread: 0.15                                           /* +/- range */
  };
  function money(n) {
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function estimate() {
    var len = Math.max(0, parseFloat(document.getElementById('c-len').value) || 0);
    var h = Math.max(0, parseFloat(document.getElementById('c-h').value) || 0);
    var sys = document.getElementById('c-sys').value;
    var geo = parseFloat(document.getElementById('c-geo').value) || 1;
    var mob = document.getElementById('c-mob').value === '1' ? PRICING.mobilization : 0;
    var area = len * h;
    var base = area * PRICING.perSqft[sys] * geo + mob;
    var lo = base * (1 - PRICING.spread), hi = base * (1 + PRICING.spread);
    document.getElementById('c-area').textContent =
      area.toLocaleString('en-US') + ' sqft';
    document.getElementById('c-fig').textContent =
      area > 0 ? money(lo) + ' to ' + money(hi) : '$0';
    document.getElementById('c-asof').textContent = 'Pricing basis: ' + PRICING.asOf;
  }
  document.getElementById('c-run').addEventListener('click', estimate);
  ['c-len', 'c-h', 'c-sys', 'c-geo', 'c-mob'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', estimate);
  });
  estimate();
  }

  /* ===== Signature moment: the hero prints itself =====
     Canvas2D bead field. Concrete layer lines lay down bottom-up like a
     print in progress; the cursor swells the beads locally, like fresh
     material responding to the nozzle. Desktop-and-tablet, reduced-motion off. */
  var host = document.getElementById('printfield');
  if (host && !reduced) {
    var cv = document.createElement('canvas');
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, rows = [], t0 = null, running = false, raf = 0, shown = false;
    var mx = -1e5, my = -1e5;

    function build() {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = [];
      var gap = 16;
      for (var y = H - 8; y > 40; y -= gap) rows.push(y);
    }
    function draw(ts) {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (t0 === null) t0 = ts;
      var elapsed = (ts - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < rows.length; i++) {
        var y = rows[i];
        /* Each row starts printing after the one below it, left to right */
        var start = i * 0.22;
        var prog = Math.min(1, Math.max(0, (elapsed - start) / 1.4));
        if (prog <= 0) continue;
        var xEnd = prog * (W + 40);
        ctx.beginPath();
        var alpha = 0.16 + 0.05 * Math.sin(i * 1.7);
        ctx.strokeStyle = 'rgba(110,99,87,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        var step = 14;
        for (var x = -20; x <= xEnd; x += step) {
          var wob = Math.sin(x * 0.012 + i * 0.9) * 2.2;
          var dx = x - mx, dy = y - my;
          var d2 = dx * dx + dy * dy;
          var bulge = d2 < 22500 ? (1 - Math.sqrt(d2) / 150) * -14 : 0;
          var yy = y + wob + bulge;
          if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      if (!shown) { shown = true; host.classList.add('on'); }
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(draw); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.05 }).observe(host);
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    var rt = 0;
    addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { build(); }, 200);
    });
    build();
    start();
  } else if (host) { host.remove(); }
})();

/* ===== Print-bead section dividers =====
   Miniaturised version of the hero canvas: 5 bead rows forming left to right,
   looping continuously. No cursor interaction — purely decorative. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.print-divider').forEach(function (host) {
    if (reduced) { host.style.background = 'repeating-linear-gradient(180deg,rgba(110,99,87,.13) 0 5px,transparent 5px 16px)'; return; }
    var cv = document.createElement('canvas');
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, raf = 0, t0 = null, running = false;
    var ROWS = 5, GAP, ROW_Y = [];
    var CYCLE = 3200; /* ms for one full draw cycle */

    function build() {
      var r = host.getBoundingClientRect();
      W = Math.max(r.width, 100); H = Math.max(r.height, 60);
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      GAP = H / (ROWS + 1);
      ROW_Y = [];
      for (var i = ROWS; i >= 1; i--) ROW_Y.push(i * GAP);
    }
    function draw(ts) {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (t0 === null) t0 = ts;
      var phase = ((ts - t0) % CYCLE) / CYCLE; /* 0..1 per cycle */
      ctx.clearRect(0, 0, W, H);
      var rowDur = 1 / ROWS; /* fraction of cycle each row uses */
      for (var i = 0; i < ROW_Y.length; i++) {
        var y = ROW_Y[i];
        var rowStart = i * rowDur * 0.7;
        var rowProg = Math.min(1, Math.max(0, (phase - rowStart) / (rowDur * 1.1)));
        if (rowProg <= 0) continue;
        /* fade out gently in last 15% of cycle */
        var fade = phase > 0.85 ? 1 - (phase - 0.85) / 0.15 : 1;
        var alpha = (0.13 + 0.06 * Math.sin(i * 1.4)) * fade;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(110,99,87,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        var xEnd = rowProg * (W + 20);
        var step = 14;
        for (var x = 0; x <= xEnd; x += step) {
          var wob = Math.sin(x * 0.013 + i * 0.8) * 1.8;
          if (x === 0) ctx.moveTo(x, y + wob); else ctx.lineTo(x, y + wob);
        }
        ctx.stroke();
      }
    }
    function start() { if (!running) { running = true; t0 = null; raf = requestAnimationFrame(draw); } }
    function stop()  { running = false; cancelAnimationFrame(raf); }

    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.05 }).observe(host);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    addEventListener('resize', function () { clearTimeout(host._rt); host._rt = setTimeout(build, 200); });
    build();
  });
})();
