/* site.js — shared behaviour: header state, scroll reveal, hero film, work flipbooks */
(function () {
  var header = document.querySelector('.site-header');
  var isHome = document.body.classList.contains('home');

  // Header turns solid once the page scrolls (home stays transparent over the film)
  if (header && !isHome) {
    var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 12); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Home film
  var hero = document.querySelector('.hero');
  if (hero) {
    var video = hero.querySelector('video');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('ready'); }); });
    if (video) {
      // Portrait screens get the upright film, landscape screens the 16:9 version
      var wideMQ = window.matchMedia('(min-aspect-ratio: 1/1)');
      var pick = function () {
        var k = wideMQ.matches ? 'wide' : 'tall';
        var src = video.getAttribute('data-src-' + k);
        if (video.getAttribute('src') === src) return;
        video.setAttribute('poster', video.getAttribute('data-poster-' + k));
        video.setAttribute('src', src);
        video.load();
        if (!reduce) { var q = video.play(); if (q && q.catch) q.catch(function () {}); }
      };
      pick();
      if (wideMQ.addEventListener) wideMQ.addEventListener('change', pick); else if (wideMQ.addListener) wideMQ.addListener(pick);
      if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
      else {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked (e.g. Low Power Mode) — poster stays */ });
      }
    }
  }

  // Work page flipbooks
  document.querySelectorAll('.flipbook-wrap').forEach(function (wrap) {
    var track = wrap.querySelector('.flipbook');
    var pages = Array.prototype.slice.call(track.children);
    var prev = wrap.querySelector('[data-flip="prev"]');
    var next = wrap.querySelector('[data-flip="next"]');
    var label = wrap.querySelector('.flip-count');
    var bar = wrap.querySelector('.flip-progress span');
    var total = pages.length;
    if (!total) return;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var step = function () {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return pages[0].getBoundingClientRect().width + gap;
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth;
      var i = Math.min(total - 1, Math.max(0, Math.round(track.scrollLeft / step())));
      if (track.scrollLeft >= max - 2) i = total - 1;
      if (label) label.textContent = pad(i + 1) + ' / ' + pad(total);
      if (bar) bar.style.width = ((i + 1) / total * 100) + '%';
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    prev && prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next && next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
})();
