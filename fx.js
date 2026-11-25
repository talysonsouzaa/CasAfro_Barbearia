/* =========================================================
   CasAfro — fx.js (JS puro) — efeitos de scroll e parallax
   ========================================================= */
(() => {
  const root = document.documentElement;
  root.classList.add('fx-ready');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- libera animações do hero após a intro ---------- */
  const intro = document.getElementById('intro');
  let loaded = false;
  const setLoaded = () => {
    if (loaded) return;
    loaded = true;
    document.body.classList.add('fx-loaded');
    runCounters();
  };
  if (!intro || reduce || intro.classList.contains('intro-done')) {
    setLoaded();
  } else {
    new MutationObserver((_, obs) => {
      if (intro.classList.contains('intro-done')) { setLoaded(); obs.disconnect(); }
    }).observe(intro, { attributes: true, attributeFilter: ['class'] });
    setTimeout(setLoaded, 2800); // segurança
  }

  /* ---------- contagem 4,9 e 94 ---------- */
  function runCounters() {
    if (reduce) return;
    $$('.cnt').forEach(el => {
      const to = parseFloat(el.dataset.to);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const t0 = performance.now();
      const dur = 1300;
      const fmt = v => v.toFixed(dec).replace('.', ',');
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e);
        if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(to);
      };
      el.textContent = fmt(0);
      requestAnimationFrame(tick);
    });
  }

  /* ---------- desfiles: entram em cena ao aparecer ---------- */
  const parades = $$('.parade');
  if (reduce || !('IntersectionObserver' in window)) {
    parades.forEach(p => p.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    parades.forEach(p => io.observe(p));
  }

  /* ---------- títulos palavra por palavra, seções e subtítulos ---------- */
  $$('.section-title, .cta-final h2').forEach(t => {
    const txt = t.textContent.trim().split(/\s+/);
    t.setAttribute('aria-label', t.textContent.trim());
    t.innerHTML = txt.map((w, i) =>
      '<span class="w" aria-hidden="true"><span class="w-in" style="transition-delay:' + (i * 70) + 'ms">' + w + '</span></span>'
    ).join(' ');
  });
  const wordTargets = $$('.section-title, .cta-final h2');
  const eyebrows = $$('.eyebrow');
  const sections = $$('.section');
  if (reduce || !('IntersectionObserver' in window)) {
    wordTargets.forEach(t => t.classList.add('w-visible'));
    eyebrows.forEach(e => e.classList.add('eb-in'));
    sections.forEach(s => s.classList.add('is-in'));
  } else {
    const mk = (cls, thr) => new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add(cls); o.unobserve(e.target); }
    }), { threshold: thr, rootMargin: '0px 0px -8% 0px' });
    const a = mk('w-visible', 0.3), b = mk('eb-in', 0.5), c = mk('is-in', 0.12);
    wordTargets.forEach(t => a.observe(t));
    eyebrows.forEach(e => b.observe(e));
    sections.forEach(s => c.observe(s));
  }

  /* ---------- galeria: corrige o reveal (clip-path total esconde do observer) ---------- */
  const galItems = $$('.gallery-item.mask-reveal');
  const grid = document.querySelector('.gallery-grid');
  const showGallery = () => galItems.forEach((el, i) => setTimeout(() => el.classList.add('is-visible'), reduce ? 0 : i * 110));
  if (grid && 'IntersectionObserver' in window && !reduce) {
    const gio = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { showGallery(); gio.disconnect(); }
    }, { threshold: 0.12 });
    gio.observe(grid);
  } else {
    showGallery();
  }

  /* ---------- scroll: progresso, parallax, desfiles e faixa ---------- */
  const bar = document.getElementById('scroll-progress');

  const par = $$('[data-parallax]').map(el => ({
    el, k: parseFloat(el.dataset.parallax) || 0, ref: el.parentElement
  }));
  const tracks = $$('.parade').map(box => {
    const tr = box.querySelector('.parade-track');
    return { box, tr, dir: parseFloat(box.dataset.dir) || 1, max: 0, kind: 'parade' };
  });
  const mq = $$('.marquee').map(box => {
    const tr = box.querySelector('.marquee-track');
    return { box, tr, dir: parseFloat(tr.dataset.dir) || -1, w: 0, kind: 'marquee' };
  });

  const measure = () => {
    tracks.forEach(t => { t.max = Math.max(0, (t.tr.scrollWidth - window.innerWidth) / 2) * 0.92; });
    mq.forEach(m => { m.w = m.tr.scrollWidth / 3; });
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    if (reduce) return;

    par.forEach(o => {
      const r = o.ref.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      const c = r.top + r.height / 2 - vh / 2;
      o.el.style.translate = '0 ' + (c * o.k).toFixed(1) + 'px';
    });

    tracks.forEach(t => {
      const r = t.box.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      t.tr.style.translate = (-t.dir * (p - 0.5) * 2 * t.max).toFixed(1) + 'px 0';
    });

    mq.forEach(m => {
      const r = m.box.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const x = -m.w + m.dir * (p - 0.5) * 2 * m.w * 0.8;
      m.tr.style.translate = x.toFixed(1) + 'px 0';
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  window.addEventListener('load', () => { measure(); update(); });
  measure(); update();

  /* ---------- brilho dos cartões segue o mouse ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const card = e.target.closest && e.target.closest('.diff-card, .service-card, .review-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }
})();

/* ---------- foto do profissional: inclina seguindo o mouse ---------- */
(() => {
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.querySelector('.hero-image');
  if (!box) return;
  const MAX = 7; // graus
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    box.style.setProperty('--ry', (px * MAX * 2).toFixed(2) + 'deg');
    box.style.setProperty('--rx', (-py * MAX * 2).toFixed(2) + 'deg');
  }, { passive: true });
  box.addEventListener('pointerleave', () => {
    box.style.setProperty('--ry', '0deg');
    box.style.setProperty('--rx', '0deg');
  });
})();
