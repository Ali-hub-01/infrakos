/* ИНФРАКОС, Байконур. Анимации и интерактив */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Шапка: тень + прогресс ── */
  var header = document.getElementById('header');
  var progressBar = document.getElementById('progressBar');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && h > 0) progressBar.style.width = (y / h * 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Мобильное меню ── */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── Появление блоков ── */
  var revealEls = document.querySelectorAll('.reveal-up, .reveal-left');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── Счётчики ── */
  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    if (reducedMotion) { el.textContent = target.toLocaleString('ru-RU'); return; }
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animateCounter(en.target);
          cio.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ── Звёздное небо (canvas) ── */
  function starfield(canvas, density) {
    if (!canvas || reducedMotion) return;
    var ctx = canvas.getContext('2d');
    var stars = [], W, H, raf;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.floor(W * H / density);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.3,
          tw: Math.random() * Math.PI * 2,
          sp: 0.008 + Math.random() * 0.02
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tw += s.sp;
        var a = 0.25 + Math.abs(Math.sin(s.tw)) * 0.65;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf) draw();
        if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
      }).observe(canvas);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
  }
  starfield(document.getElementById('stars'), 9000);
  starfield(document.getElementById('stars2'), 12000);

  /* ── Параллакс hero ── */
  var heroImg = document.getElementById('heroImg');
  if (heroImg && !reducedMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) {
          heroImg.style.transform = 'scale(1.08) translateY(' + (y * 0.18) + 'px)';
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Галерея: лайтбокс ── */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  document.querySelectorAll('.g-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      lightboxImg.src = btn.dataset.full;
      lightboxImg.alt = img ? img.alt : 'Фото космодрома Байконур';
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

  /* ── Форма: сборка письма (без бэкенда) ── */
  var form = document.getElementById('leadForm');
  var formDone = document.getElementById('formDone');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name = (fd.get('name') || '').toString().trim();
      var phone = (fd.get('phone') || '').toString().trim();
      var topic = (fd.get('topic') || 'Обращение').toString();
      var message = (fd.get('message') || '').toString().trim();
      if (!name || !phone) {
        form.reportValidity();
        return;
      }
      var subject = encodeURIComponent('Заявка с сайта: ' + topic);
      var body = encodeURIComponent(
        'Имя: ' + name + '\nТелефон: ' + phone + '\nТема: ' + topic +
        (message ? '\n\nСообщение:\n' + message : '') +
        '\n\nОтправлено с infracos.kz'
      );
      formDone.hidden = false;
      window.location.href = 'mailto:post@infracos.kz?subject=' + subject + '&body=' + body;
      form.reset();
    });
  }

  /* ── Делегированный учёт кликов tel/mailto (для будущих gtag-конверсий) ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="tel:"], a[href^="mailto:"]') : null;
    if (!a) return;
    /* Opus повесит сюда gtag('event', ...) при настройке Google Ads */
  });

  /* ── Год в футере ── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
