/* ============================================================================
   COS-GPT — "Searchlight in the Archive" engine (concept site)
   ----------------------------------------------------------------------------
   The page floats over a dark archive: hundreds of buried document cards,
   nearly invisible in the dark. A searchlight follows your cursor (or finger —
   or wanders on its own when idle, so mobile still gets the effect) and the
   documents it touches come into the light. Transparency, rendered literally.

   Scroll hands the engine a new beam tint per section via [data-beam].
   No dependencies. Honors prefers-reduced-motion.
   ============================================================================ */
(() => {
  'use strict';

  const canvas = document.getElementById('archive');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ------------------------------------------------------- beam moods */
  const MOODS = {
    cold:  { tint: [190, 215, 255], glow: 0.14, reach: 1.0 },  // default: searching
    found: { tint: [255, 232, 180], glow: 0.18, reach: 1.15 }, // warm: the find
    clear: { tint: [200, 255, 224], glow: 0.16, reach: 1.1 },  // green-gold: daylight
    guard: { tint: [255, 214, 170], glow: 0.15, reach: 1.0 },  // amber: watchful
  };

  const beam = {
    x: 0, y: 0,                 // eased position
    tx: 0, ty: 0,               // target (pointer or wander)
    r: 260,                     // light pool radius (set on resize)
    tint: MOODS.cold.tint.slice(),
    glow: MOODS.cold.glow,
    mood: MOODS.cold,
  };

  /* ----------------------------------------------- document sprites */
  const docs = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function makeDocSprite(w, h) {
    const c = document.createElement('canvas');
    c.width = w * DPR;
    c.height = h * DPR;
    const g = c.getContext('2d');
    g.scale(DPR, DPR);
    // paper
    g.fillStyle = 'rgb(226, 231, 238)';
    g.fillRect(0, 0, w, h);
    // header bar (a title line)
    g.fillStyle = 'rgba(30, 42, 56, 0.85)';
    g.fillRect(w * 0.12, h * 0.12, w * 0.55, Math.max(2, h * 0.05));
    // body text lines
    g.fillStyle = 'rgba(30, 42, 56, 0.45)';
    const lines = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < lines; i++) {
      const lw = w * (0.5 + Math.random() * 0.36);
      g.fillRect(w * 0.12, h * (0.26 + i * 0.1), lw, Math.max(1.2, h * 0.028));
    }
    // official-looking stamp box, lower right
    g.strokeStyle = 'rgba(120, 40, 40, 0.55)';
    g.lineWidth = 1;
    g.strokeRect(w * 0.62, h * 0.74, w * 0.26, h * 0.14);
    return c;
  }

  function scatterDocs() {
    docs.length = 0;
    const W = canvas.width, H = canvas.height;
    const count = Math.min(Math.floor((W * H) / 8500), 240);
    for (let i = 0; i < count; i++) {
      const w = 46 + Math.random() * 74;
      const h = w * (1.15 + Math.random() * 0.35);
      docs.push({
        x: Math.random() * (W - w),
        y: Math.random() * (H - h),
        w, h,
        rot: (Math.random() - 0.5) * 0.22,
        sprite: makeDocSprite(w, h),
        base: 0.025 + Math.random() * 0.035,   // barely-there alpha in the dark
        flicker: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ------------------------------------------------------- dust motes */
  const motes = [];
  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.09 - 0.03,
        r: 0.5 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ------------------------------------------------------ falloff */
  function intensityAt(x, y) {
    const dx = x - beam.x, dy = y - beam.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const R = beam.r * beam.mood.reach;
    if (d >= R) return 0;
    const t = 1 - d / R;
    return t * t * (3 - 2 * t);          // smoothstep falloff
  }

  /* --------------------------------------------------------- frame */
  // On small screens the light stays subtle so text always wins contrast.
  let dimFactor = 1;

  function frame(t) {
    // ease beam toward target
    beam.x += (beam.tx - beam.x) * 0.085;
    beam.y += (beam.ty - beam.y) * 0.085;
    // ease beam color toward section mood
    for (let i = 0; i < 3; i++) beam.tint[i] += (beam.mood.tint[i] - beam.tint[i]) * 0.04;
    beam.glow += (beam.mood.glow - beam.glow) * 0.04;

    const W = canvas.width, H = canvas.height;

    // the dark
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgb(5, 8, 13)';
    ctx.fillRect(0, 0, W, H);

    // documents: dim always, bright inside the beam
    for (const d of docs) {
      const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
      const I = intensityAt(cx, cy);
      const flick = 0.9 + 0.1 * Math.sin(t * 0.0012 + d.flicker);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(d.rot);
      ctx.globalAlpha = d.base;
      ctx.drawImage(d.sprite, -d.w / 2, -d.h / 2, d.w, d.h);
      if (I > 0.01) {
        ctx.globalAlpha = Math.min(I * 1.15 * flick, 0.96) * dimFactor;
        ctx.drawImage(d.sprite, -d.w / 2, -d.h / 2, d.w, d.h);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // dust motes — only visible where the light catches them
    ctx.globalCompositeOperation = 'lighter';
    const [tr, tg, tb] = beam.tint;
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy; m.tw += 0.02;
      if (m.x < -4) m.x = W + 4; if (m.x > W + 4) m.x = -4;
      if (m.y < -4) m.y = H + 4; if (m.y > H + 4) m.y = -4;
      const I = intensityAt(m.x, m.y);
      if (I > 0.02) {
        const a = I * (0.25 + 0.2 * Math.sin(m.tw));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${a})`;
        ctx.fill();
      }
    }

    // the light pool itself
    const glow = beam.glow * dimFactor;
    const R = beam.r * beam.mood.reach;
    const grad = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, R);
    grad.addColorStop(0, `rgba(${tr | 0},${tg | 0},${tb | 0},${glow})`);
    grad.addColorStop(0.55, `rgba(${tr | 0},${tg | 0},${tb | 0},${glow * 0.35})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(beam.x - R, beam.y - R, R * 2, R * 2);

    // hot center — the bulb of the searchlight
    const core = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, R * 0.12);
    core.addColorStop(0, `rgba(255,255,255,${glow * 0.9})`);
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(beam.x - R * 0.12, beam.y - R * 0.12, R * 0.24, R * 0.24);

    requestAnimationFrame(frame);
  }

  /* -------------------------------------------- pointer + idle wander */
  let lastInput = 0;
  function setTarget(x, y) {
    beam.tx = x; beam.ty = y;
    lastInput = performance.now();
  }
  window.addEventListener('pointermove', (e) => setTarget(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => setTarget(e.clientX, e.clientY), { passive: true });

  // no cursor on touch devices — when idle, the searchlight sweeps on its own
  function wander(t) {
    if (t - lastInput > 3500) {
      const W = canvas.width, H = canvas.height;
      beam.tx = W * (0.5 + 0.36 * Math.sin(t * 0.00021) * Math.cos(t * 0.00013));
      beam.ty = H * (0.45 + 0.3 * Math.sin(t * 0.00017));
    }
    requestAnimationFrame(wander);
  }

  /* -------------------------------------- section-driven beam moods */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.4) {
        const mood = MOODS[e.target.dataset.beam];
        if (mood && beam.mood !== mood) beam.mood = mood;
        document.documentElement.style.setProperty(
          '--accent',
          `rgb(${mood ? mood.tint[0] : 190},${mood ? mood.tint[1] : 215},${mood ? mood.tint[2] : 255})`
        );
      }
    }
  }, { threshold: [0.4] });
  document.querySelectorAll('[data-beam]').forEach((s) => io.observe(s));

  /* reveal-on-scroll */
  const rio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) e.target.classList.add('in');
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach((el) => rio.observe(el));

  /* header condensation */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* --------------------------------------------------------- boot */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const small = Math.min(canvas.width, canvas.height) < 720;
    beam.r = Math.max(200, Math.min(canvas.width, canvas.height) * (small ? 0.34 : 0.42));
    dimFactor = small ? 0.55 : 1;
    scatterDocs();
    seedMotes();
  }
  window.addEventListener('resize', resize);
  resize();

  beam.x = beam.tx = canvas.width * 0.5;
  beam.y = beam.ty = canvas.height * 0.42;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // one static lit frame, centered beam, no loop
    beam.x = beam.tx; beam.y = beam.ty;
    (function once() {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = 'rgb(5, 8, 13)';
      ctx.fillRect(0, 0, W, H);
      for (const d of docs) {
        const I = intensityAt(d.x + d.w / 2, d.y + d.h / 2);
        ctx.save();
        ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
        ctx.rotate(d.rot);
        ctx.globalAlpha = Math.max(d.base, Math.min(I, 0.9));
        ctx.drawImage(d.sprite, -d.w / 2, -d.h / 2, d.w, d.h);
        ctx.restore();
      }
    })();
    return;
  }

  requestAnimationFrame(frame);
  requestAnimationFrame(wander);
})();
