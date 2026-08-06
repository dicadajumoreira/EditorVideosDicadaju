/* HubStation — Editorial Premium JS */
(function () {
  'use strict';

  /* ── NAV ── */
  const nav = document.getElementById('nav');
  const tick = () => nav && (window.scrollY > 48 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled'));
  window.addEventListener('scroll', tick, { passive: true });
  tick();

  /* ── BURGER ── */
  const burger = document.getElementById('burger');
  const mob    = document.getElementById('mobNav');
  if (burger && mob) {
    burger.addEventListener('click', () => {
      const o = burger.classList.toggle('open');
      mob.classList.toggle('open', o);
      document.body.style.overflow = o ? 'hidden' : '';
    });
    mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      mob.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ── ACTIVE LINK ── */
  const cur = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mob-nav a').forEach(a => {
    if ((a.getAttribute('href') || '').split('/').pop() === cur) a.classList.add('active');
  });

  /* ── SCROLL OBSERVER ── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fu,.fl,.fr').forEach(el => obs.observe(el));
  } else {
    document.querySelectorAll('.fu,.fl,.fr').forEach(el => el.classList.add('in'));
  }

  /* ── COUNTER ── */
  function count(el) {
    const t = +el.dataset.target, dur = 1600;
    const s = performance.now();
    (function loop(now) {
      const p = Math.min((now - s) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.floor(e * t);
      if (p < 1) requestAnimationFrame(loop); else el.textContent = t;
    })(s);
  }
  const cobs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { count(e.target); cobs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => cobs.observe(el));

  /* ── TICKER DUPLICATE ── */
  const tk = document.querySelector('.ticker-track');
  if (tk) tk.innerHTML += tk.innerHTML;

  /* ── FORM ── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      btn.textContent = 'Enviando...'; btn.disabled = true;
      setTimeout(() => {
        const s = document.getElementById('formSuccess');
        if (s) { s.style.display = 'block'; form.style.display = 'none'; }
      }, 1100);
    });
  }

  /* ── SMOOTH ANCHOR ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

})();
