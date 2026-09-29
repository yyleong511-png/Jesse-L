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

  // In-app browsers (Instagram, Facebook, TikTok, LINE…) often refuse to autoplay
  // video, so films there go straight to their animated image.
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|musical_ly|TikTok|Bytedance/i.test(navigator.userAgent || '');

  // About drop cap: size its float to the J's real ink so the text wraps
  // around the visible letter. Fonts render with different metrics on each
  // browser (the J sat lower on iPhone), so measure instead of guessing.
  var fitDrops = function () {
    document.querySelectorAll('.drop-star').forEach(function (box) {
      var j = box.querySelector('.mask-j');
      if (!j) return;
      var cs = getComputedStyle(j);
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var m = ctx.measureText(j.textContent.trim());
      if (!m || !('actualBoundingBoxAscent' in m)) return;
      // where the baseline actually sits inside the J's box
      var probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      j.appendChild(probe);
      var baseline = probe.getBoundingClientRect().top - j.getBoundingClientRect().top;
      j.removeChild(probe);
      var padL = parseFloat(cs.paddingLeft) || 0;
      var inkTop = baseline - m.actualBoundingBoxAscent;
      var inkLeft = padL - m.actualBoundingBoxLeft;
      box.style.width = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 'px';
      box.style.height = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 'px';
      j.style.left = (-inkLeft) + 'px';
      j.style.top = (-inkTop) + 'px';
    });
  };
  if (document.querySelector('.drop-star')) {
    fitDrops();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitDrops);
    window.addEventListener('load', fitDrops);
    window.addEventListener('resize', fitDrops);
  }

  // Instagram handles in credits become links (runs again after content.json
  // refills the text, since that replaces the element's contents)
  var linkHandles = function () {
    var re = /(^|[\s(\/,])@([A-Za-z0-9_](?:[A-Za-z0-9_.]*[A-Za-z0-9_])?)/g;
    document.querySelectorAll('.series-credit, .story-note, .about-body').forEach(function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) { if (!walker.currentNode.parentNode.closest('a')) nodes.push(walker.currentNode); }
      nodes.forEach(function (node) {
        var text = node.nodeValue;
        if (text.indexOf('@') < 0) return;
        var frag = document.createDocumentFragment(), last = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(text))) {
          var start = m.index + m[1].length;
          frag.appendChild(document.createTextNode(text.slice(last, start)));
          var a = document.createElement('a');
          a.className = 'ig-handle';
          a.href = 'https://www.instagram.com/' + m[2] + '/';
          a.target = '_blank'; a.rel = 'noopener';
          a.textContent = '@' + m[2];
          frag.appendChild(a);
          last = start + 1 + m[2].length;
        }
        if (!last) return;
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  };
  linkHandles();
  document.addEventListener('content:applied', linkHandles);

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
      // The film as a sequence of HD frames drawn on a canvas: behaves like a
      // GIF at a fraction of the size, plays in every browser, never flickers.
      var useAnim = function () {
        if (usingAnim || !anim) return;
        usingAnim = true;
        var wide = window.matchMedia('(min-aspect-ratio: 1/1)').matches;
        var dir = anim.getAttribute(wide ? 'data-frames-wide' : 'data-frames-tall');
        var n = parseInt(anim.getAttribute('data-frame-count'), 10);
        var fps = parseInt(anim.getAttribute('data-fps'), 10) || 10;
        var name = function (k) { return dir + String(k + 1).padStart(3, '0') + '.jpg'; };
        var frames = [], ready = 0, i = 0, last = 0, playing = false;
        var ctx = anim.getContext('2d');
        var draw = function (im) {
          if (anim.width !== im.naturalWidth) { anim.width = im.naturalWidth; anim.height = im.naturalHeight; }
          ctx.drawImage(im, 0, 0);
        };
        anim.hidden = false;
        hero.classList.add('is-anim');
        try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
        var tick = function (t) {
          if (!document.hidden && t - last >= 1000 / fps) {
            last = t;
            var next = (i + 1) % n;
            if (next < ready) { i = next; draw(frames[i]); }
          }
          requestAnimationFrame(tick);
        };
        // load in order (decoded before use) so playback starts before the last frame arrives
        var load = function (k) {
          if (k >= n) return;
          var im = new Image();
          var done = function () {
            frames[k] = im;
            ready = k + 1;
            if (k === 0) draw(im);
            if (!playing && ready >= Math.min(n, 20)) { playing = true; requestAnimationFrame(tick); }
            load(k + 1);
          };
          im.onload = function () { if (im.decode) im.decode().then(done, done); else done(); };
          im.onerror = function () { load(k + 1); };
          im.src = name(k);
        };
        load(0);
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
      if (inApp) useAnim(); else pick();
      if (wideMQ.addEventListener) wideMQ.addEventListener('change', pick); else if (wideMQ.addListener) wideMQ.addListener(pick);

      if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
      else if (!inApp) {
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

  // Work page: one cover slider per group (photo series, runway, competition);
  // each cover opens its story on its own at #slug
  var sliders = Array.prototype.slice.call(document.querySelectorAll('.covers'));
  if (sliders.length) {
    var root = document.documentElement;
    var stories = Array.prototype.slice.call(document.querySelectorAll('.story[id]'));
    var nextLink = document.querySelector('.series-next');
    var pad = function (n) { return String(n).padStart(2, '0'); };

    var makeSlider = function (covers) {
      var track = covers.querySelector('.cover-track');
      var slides = Array.prototype.slice.call(track.children);
      var prevBtn = covers.querySelector('[data-cover-nav="prev"]');
      var nextBtn = covers.querySelector('[data-cover-nav="next"]');
      var count = covers.querySelector('.cover-count');
      var bar = covers.querySelector('.cover-progress span');
      covers.classList.toggle('is-single', slides.length < 2);

      // Each cover reuses its story's lead photo, so the page carries no duplicate images
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
      nextBtn.addEventListener('click', function () { goTo(current() + 1, true); });
      slides.forEach(function (s, n) {
        s.addEventListener('click', function (e) {
          if (!s.classList.contains('is-current')) { e.preventDefault(); goTo(n, true); }
        });
      });
      var t;
      track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
      window.addEventListener('resize', sync);
      sync();
      var ids = slides.map(function (s) { return s.querySelector('[data-cover]').getAttribute('data-cover'); });
      return { el: covers, ids: ids, goTo: goTo, sync: sync };
    };
    var groups = sliders.map(makeSlider);

    // A reel that can't autoplay (in-app browser, Low Power Mode, error, frozen)
    // is swapped for its animated image, which always plays.
    var reelToAnim = function (v) {
      if (v.hidden) return;
      var img = document.createElement('img');
      img.src = v.getAttribute('data-anim'); img.alt = ''; img.className = 'reel-anim';
      img.width = v.width; img.height = v.height;
      try { v.pause(); } catch (e) {}
      v.hidden = true;
      v.parentNode.insertBefore(img, v);
    };
    var playReel = function (v) {
      if (v.hidden || !v.getAttribute('data-anim')) { if (!v.hidden) { var p0 = v.play(); if (p0 && p0.catch) p0.catch(function () {}); } return; }
      if (inApp) { reelToAnim(v); return; }
      v.muted = true; v.playsInline = true;
      var q; try { q = v.play(); } catch (e) { reelToAnim(v); return; }
      if (q && q.catch) q.catch(function () { reelToAnim(v); });
      v.addEventListener('error', function () { reelToAnim(v); }, { once: true });
      setTimeout(function () { if (!v.hidden && (v.paused || v.currentTime === 0)) reelToAnim(v); }, 3500);
    };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lastId = null;
    var route = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      var open = -1;
      stories.forEach(function (s, i) {
        var on = s.id === id;
        s.classList.toggle('is-open', on);
        if (on) open = i;
      });
      root.classList.toggle('viewing', open >= 0);
      // films only play while their story is open (and not for reduced motion)
      stories.forEach(function (s, i) {
        s.querySelectorAll('video').forEach(function (v) {
          if (i === open && !reduceMotion) playReel(v);
          else if (!v.hidden) v.pause();
        });
      });
      if (open >= 0) {
        var next = stories[(open + 1) % stories.length];
        nextLink.href = '#' + next.id;
        nextLink.textContent = 'Next: ' + next.querySelector('.series-title').textContent + ' →';
        var cta = document.querySelector('.series-contact-link');
        if (cta) {
          var name = stories[open].querySelector('.series-title').textContent.trim();
          cta.href = 'https://wa.me/' + cta.getAttribute('data-wa') + '?text=' +
            encodeURIComponent('Hi Jesse, I saw your "' + name + '" work on your website and would love to discuss a collaboration.');
        }
        lastId = id;
        window.scrollTo(0, 0);
      } else if (lastId) {
        // back on the index: land on the cover just viewed, in its own slider
        var from = lastId;
        requestAnimationFrame(function () {
          groups.forEach(function (g) {
            var n = g.ids.indexOf(from);
            if (n < 0) return;
            g.goTo(n, false); g.sync();
            var top = g.el.getBoundingClientRect().top + window.scrollY - 140;
            window.scrollTo(0, g === groups[0] ? 0 : top);
          });
        });
      }
      groups.forEach(function (g) { g.sync(); });
    };
    window.addEventListener('hashchange', route);
    route();
  }
})();
