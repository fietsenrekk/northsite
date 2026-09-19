/* northsite. Two motion variants only: rise for content, settle for media.
   Everything here is decoration on a page that already works without it. */
(function () {
  'use strict';

  var root = document.documentElement;

  /* `no-js` is what keeps every .rise element visible. It is removed only once
     the motion stack is confirmed present, so a failed or blocked script leaves
     the page fully readable instead of blank. The sheet and the hover cursor
     below do not depend on it. */


  /* ---------------------------------------------------------------- sheet */
  var bar = document.getElementById('bookBar');
  var sheet = document.getElementById('sheet');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('sheetClose');
  var frameHost = document.getElementById('frameHost');
  var hdrBook = document.getElementById('hdrBook');
  var lastFocus = null;
  var frameLoaded = false;

  function focusables() {
    return sheet.querySelectorAll('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])');
  }

  /* The iframe is only injected on first open, so nothing third party loads
     and nothing third party can set a cookie until someone asks for it. */
  function mountFrame() {
    if (frameLoaded) return;
    frameLoaded = true;
    var f = document.createElement('iframe');
    f.className = 'sheet__frame';
    f.src = frameHost.getAttribute('data-src');
    f.title = 'Pick a time for an intro call';
    f.loading = 'lazy';
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    var fallback = frameHost.querySelector('.sheet__fallback');
    var settled = false;
    f.addEventListener('load', function () {
      settled = true;
      if (fallback) fallback.hidden = true;
    });
    frameHost.insertBefore(f, frameHost.firstChild);
    /* If the embed has not loaded in 6s the styled link stays put. A dead
       panel is never an acceptable end state. */
    setTimeout(function () {
      if (!settled) { f.remove(); frameLoaded = false; }
    }, 6000);
  }

  function openSheet() {
    lastFocus = document.activeElement;
    mountFrame();
    sheet.classList.add('is-open');
    scrim.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    bar.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    closeBtn.focus();
  }

  function closeSheet() {
    sheet.classList.remove('is-open');
    scrim.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    bar.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  bar.addEventListener('click', openSheet);
  closeBtn.addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);

  /* The header link is a real anchor to the booking page, so it works with no
     JavaScript. With JavaScript it opens the same sheet the bar does. */
  document.querySelectorAll('[data-book]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      openSheet();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!sheet.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ------------------------------------------------------- hover cursor */
  /* The logo is a cursor, so on a real pointer the cursor becomes the label.
     Fine pointers only: on touch there is nothing to follow, and the card's
     own "Open" link is the affordance for keyboard and screen readers. */
  var ghost = document.getElementById('ghost');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ghost && fine && !calm) {
    var gx = 0, gy = 0, cx = 0, cy = 0, riding = false;
    document.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      var over = e.target.closest ? e.target.closest('.card') : null;
      if (over && !riding) { riding = true; cx = gx; cy = gy; ghost.classList.add('is-on'); }
      else if (!over && riding) { riding = false; ghost.classList.remove('is-on'); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      riding = false; ghost.classList.remove('is-on');
    });
    (function ride() {
      cx += (gx - cx) * 0.18;
      cy += (gy - cy) * 0.18;
      ghost.style.transform = 'translate3d(' + (cx + 14) + 'px,' + (cy + 12) + 'px,0)';
      requestAnimationFrame(ride);
    })();
  }

  /* ------------------------------------------------------------ motion */
  /* app.js loads straight away so the booking bar works from first paint. The
     142 KB motion stack arrives later, and calls __nsMotion when it is ready. */
  function initMotion() {
  if (!window.gsap || !window.ScrollTrigger || initMotion.done) return;
  initMotion.done = true;
  root.classList.remove('no-js');

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var mm = gsap.matchMedia();

  /* Reduced motion registers nothing at all. The page is already correct. */
  mm.add('(prefers-reduced-motion: no-preference)', function () {

    if (window.Lenis) {
      var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* read-through progress, the one piece of always-on colour */
    var prog = document.getElementById('prog');
    if (prog) {
      gsap.to(prog, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    }

    /* Hero headline, split by LINE. Never by character: a screen reader must
       read one sentence, not a pile of letters. mask:'lines' gives each line
       its own overflow box so the reveal clips at the line, not at descenders. */
    var h1 = document.querySelector('.hero h1');
    if (h1 && window.SplitText) {
      h1.setAttribute('aria-label', h1.textContent.trim());
      var split = new SplitText(h1, { type: 'lines', linesClass: 'ln', mask: 'lines' });
      split.lines.forEach(function (l) { l.setAttribute('aria-hidden', 'true'); });
      gsap.set(split.lines, { yPercent: 105 });
      gsap.to(split.lines, {
        yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.075, delay: 0.08,
        onComplete: function () { split.revert(); h1.removeAttribute('aria-label'); },
      });
    }

    /* RISE: the primary variant. Staggered within a section, never across. */
    gsap.utils.toArray('[data-rise-group]').forEach(function (group) {
      var items = group.querySelectorAll('.rise');
      if (!items.length) return;
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.07,
        scrollTrigger: { trigger: group, start: 'top 80%', once: true },
      });
    });

    /* Shelf cards rise as they arrive, batched. A ScrollTrigger per card is
       thirty-odd triggers on a fifteen-card grid, and the scroll frame cost
       showed it: 15.5ms at the 95th percentile against a 16.7ms budget.
       ScrollTrigger.batch groups whatever enters together into one tween. */
    ScrollTrigger.batch('.shelf .card', {
      start: 'top 92%', once: true, batchMax: 6, interval: 0.12,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.07 });
      },
    });

    ScrollTrigger.batch('.feat__shot, .feat__cta, .feat__step', {
      start: 'top 88%', once: true, batchMax: 4, interval: 0.1,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.07 });
      },
    });

    /* SETTLE on the featured figure. Media only, never type. */
    var featImg = document.querySelector('.feat__shot img');
    if (featImg) {
      gsap.to(featImg, {
        scale: 1, duration: 1.1, ease: 'power2.out',
        scrollTrigger: { trigger: featImg, start: 'top 90%', once: true },
      });
    }

    /* Featured: the pinned reveal, desktop only. On a phone a pinned section
       is a usability problem, not a flourish. */
    mm.add('(min-width: 1024px)', function () {
      var steps = gsap.utils.toArray('.feat__step');
      var section = document.getElementById('featured');
      if (!steps.length || !section) return;

      /* Light whichever step sits nearest the reading line. Per-step triggers
         leave dead bands between them where every step is dimmed at once. */
      function pick() {
        var line = window.innerHeight * 0.45;
        var best = 0, bestDist = Infinity;
        for (var i = 0; i < steps.length; i++) {
          var r = steps[i].getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - line);
          if (d < bestDist) { bestDist = d; best = i; }
        }
        for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('is-on', j === best);
      }

      var st = ScrollTrigger.create({
        trigger: section, start: 'top bottom', end: 'bottom top',
        onUpdate: pick, onRefresh: pick,
      });
      pick();

      return function () {
        st.kill();
        for (var k = 0; k < steps.length; k++) steps[k].classList.remove('is-on');
      };
    });

    return function () {
      if (window.__lenis) { window.__lenis.destroy(); window.__lenis = null; }
    };
  });

  /* will-change goes on at refresh and comes off once the reveals are done. */
  ScrollTrigger.addEventListener('refreshInit', function () {
    document.querySelectorAll('.rise,.settle img').forEach(function (el) { el.style.willChange = 'transform,opacity'; });
  });
  /* initMotion now runs after the load event has already fired, so a load
     listener here would never run and will-change would never be released. */
  setTimeout(function () {
    document.querySelectorAll('.rise,.settle img').forEach(function (el) { el.style.willChange = ''; });
  }, 2600);
  }
  window.__nsMotion = initMotion;
  initMotion();
})();
