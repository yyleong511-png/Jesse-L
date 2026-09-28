/* site.js — shared behaviour: header state, scroll reveal, hero film, work covers */
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
      var anim = hero.querySelector('.hero-anim');
      var usingAnim = false;

      // Some browsers (Instagram / Facebook in-app browsers, iPhone Low Power Mode)
      // refuse to autoplay video. Then we switch to an animated image of the same
      // film, which always plays and loops on its own.
      var useAnim = function () {
        if (usingAnim || !anim) return;
        usingAnim = true;
        anim.querySelectorAll('source').forEach(function (s) { s.setAttribute('srcset', s.getAttribute('data-srcset')); });
        var img = anim.querySelector('img');
        img.setAttribute('src', img.getAttribute('data-src'));
        anim.hidden = false;
        hero.classList.add('is-anim');
        try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
      };

      var tryPlay = function () {
        if (usingAnim) return;
        video.muted = true; video.defaultMuted = true; video.playsInline = true;
        var q;
        try { q = video.play(); } catch (e) { useAnim(); return; }
        if (q && q.catch) q.catch(function () { useAnim(); });
      };

      // Portrait screens get the upright film, landscape screens the 16:9 version
      var wideMQ = window.matchMedia('(min-aspect-ratio: 1/1)');
      var pick = function () {
        if (usingAnim) return;
        var k = wideMQ.matches ? 'wide' : 'tall';
        var src = video.getAttribute('data-src-' + k);
        if (video.getAttribute('src') === src) return;
        video.setAttribute('poster', video.getAttribute('data-poster-' + k));
        video.setAttribute('src', src);
        video.load();
        if (!reduce) tryPlay();
      };
      pick();
      if (wideMQ.addEventListener) wideMQ.addEventListener('change', pick); else if (wideMQ.addListener) wideMQ.addListener(pick);

      if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
      else {
        tryPlay();
        video.addEventListener('canplay', function () { if (video.paused) tryPlay(); });
        video.addEventListener('error', function () { if (video.getAttribute('src')) useAnim(); });
        // Safety net: if nothing is moving after a few seconds, use the animated image
        var check = function (wait) {
          setTimeout(function () {
            if (usingAnim) return;
            var moving = !video.paused && video.currentTime > 0;
            if (moving) return;
            if (video.readyState >= 2 || wait >= 6000) useAnim(); else check(wait + 1500);
          }, wait === 0 ? 2500 : 1500);
        };
        check(0);
        // Any first touch also nudges playback
        var nudge = function () { tryPlay(); window.removeEventListener('touchstart', nudge); window.removeEventListener('click', nudge); };
        window.addEventListener('touchstart', nudge, { passive: true });
        window.addEventListener('click', nudge);
        document.addEventListener('visibilitychange', function () { if (!document.hidden && !usingAnim && video.paused) tryPlay(); });
      }
    }
  }

  // Sentence-length series titles get a smaller size (run after content.json fills them in)
  var markLong = function () {
    document.querySelectorAll('.series-title').forEach(function (t) {
      t.classList.toggle('is-long', t.textContent.trim().length > 28);
    });
  };
  markLong();
  document.addEventListener('content:applied', markLong);

  // Work page: a slider of series covers; each series opens on its own at #slug
  var covers = document.querySelector('.covers');
  if (covers) {
    var root = document.documentElement;
    var track = covers.querySelector('.cover-track');
    var slides = Array.prototype.slice.call(track.children);
    var stories = Array.prototype.slice.call(document.querySelectorAll('.story[id]'));
    var prevBtn = covers.querySelector('[data-cover-nav="prev"]');
    var nextBtn = covers.querySelector('[data-cover-nav="next"]');
    var count = covers.querySelector('.cover-count');
    var bar = covers.querySelector('.cover-progress span');
    var nextLink = document.querySelector('.series-next');
    var pad = function (n) { return String(n).padStart(2, '0'); };

    // Each cover reuses its series' lead photo, so the page carries no duplicate images
    slides.forEach(function (slide) {
      var link = slide.querySelector('[data-cover]');
      var story = document.getElementById(link.getAttribute('data-cover'));
      var img = story && story.querySelector('.story-lead img');
      if (img) { var c = img.cloneNode(); c.removeAttribute('style'); link.appendChild(c); }
    });

    // covers are narrower than the track (the next one peeks in), so step by cover + gap
    var step = function () { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; };
    var current = function () { return Math.round(track.scrollLeft / (step() || 1)); };
    var goTo = function (i, smooth) {
      i = Math.min(slides.length - 1, Math.max(0, i));
      track.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'auto' });
    };
    var sync = function () {
      var i = Math.min(slides.length - 1, Math.max(0, current()));
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) i = slides.length - 1;
      slides.forEach(function (s, n) { s.classList.toggle('is-current', n === i); });
      count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
      bar.style.width = ((i + 1) / slides.length * 100) + '%';
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
    };
    prevBtn.addEventListener('click', function () { goTo(current() - 1, true); });
    slides.forEach(function (s, n) {
      s.addEventListener('click', function (e) {
        if (!s.classList.contains('is-current')) { e.preventDefault(); goTo(n, true); }
      });
    });
    nextBtn.addEventListener('click', function () { goTo(current() + 1, true); });
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
    window.addEventListener('resize', sync);

    var lastOpen = -1;
    var route = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      var open = -1;
      stories.forEach(function (s, i) {
        var on = s.id === id;
        s.classList.toggle('is-open', on);
        if (on) open = i;
      });
      root.classList.toggle('viewing', open >= 0);
      if (open >= 0) {
        var next = stories[(open + 1) % stories.length];
        nextLink.href = '#' + next.id;
        nextLink.textContent = 'Next: ' + next.querySelector('.series-title').textContent + ' →';
        lastOpen = open;
        window.scrollTo(0, 0);
      } else if (lastOpen >= 0) {
        // back on the index: land on the cover of the series just viewed
        requestAnimationFrame(function () { goTo(lastOpen, false); sync(); window.scrollTo(0, 0); });
      }
      sync();
    };
    window.addEventListener('hashchange', route);
    route();
  }
})();
