/* Scroll-driven effects: text decryption, number tickers, cutout assembly,
   digit-rain chapter transitions, and the 48h countdown. All effects are
   progressive enhancement over semantic HTML and respect reduced motion. */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smoothed scroll hub ----------
     Native scrolling is untouched, but nothing here reads window.scrollY
     directly: scroll events only move a TARGET, and a rAF loop chases it
     with an exponential ease (~150ms half-life), fanning the smoothed
     value out to subscribers every frame until it settles. Wheel scrolling
     arrives in ~100px steps - bigger than some animation bands on this
     page - so anything driven by the raw value visibly teleports; driven
     by the eased value, the same jump plays out over ~a third of a second
     of real frames. This is the useful part of what Lenis does, without
     hijacking the scroll. The loop idles out when settled, so there is no
     perpetual per-frame work at rest. */
  const scrollSubs = [];
  let yTarget = window.scrollY || 0;
  let ySmooth = yTarget;
  let hubRAF = 0;
  let hubLastT = 0;

  function hubTick(now) {
    hubRAF = 0;
    const dt = Math.min(0.05, (now - hubLastT) / 1000 || 0.016);
    hubLastT = now;
    ySmooth += (yTarget - ySmooth) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 7));
    if (Math.abs(yTarget - ySmooth) < 0.3) ySmooth = yTarget;
    for (let i = 0; i < scrollSubs.length; i++) scrollSubs[i](ySmooth);
    if (ySmooth !== yTarget) hubRAF = requestAnimationFrame(hubTick);
  }

  function onSmoothScroll(fn) {
    scrollSubs.push(fn);
    fn(ySmooth); // run once with the current position
  }

  window.addEventListener('scroll', () => {
    yTarget = window.scrollY;
    if (!hubRAF) { hubLastT = 0; hubRAF = requestAnimationFrame(hubTick); }
  }, { passive: true });

  /* ---------- Text decryption ----------
     Elements with [data-decrypt] resolve from random digits into their
     real text when scrolled into view. Runs once per element. */
  function decrypt(el) {
    const finalText = el.dataset.finalText;
    const chars = finalText.split('');
    const settleAt = chars.map((ch, i) => (ch === ' ' ? 0 : 12 + Math.random() * 26 + i * 1.2));
    let t = 0;
    function step() {
      t += 1;
      let out = '';
      let done = true;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === ' ' || t >= settleAt[i]) {
          out += chars[i];
        } else {
          out += String((Math.random() * 10) | 0);
          done = false;
        }
      }
      el.textContent = out;
      if (!done) requestAnimationFrame(step);
    }
    step();
  }

  document.querySelectorAll('[data-decrypt]').forEach((el) => {
    el.dataset.finalText = el.textContent;
    if (reduceMotion) return;
    el.textContent = el.textContent.replace(/\S/g, () => String((Math.random() * 10) | 0));
  });

  /* ---------- Number tickers ----------
     [data-ticker="4000000"] counts from 0 with easing; digits cycle
     rapidly before settling. Suffix kept from markup (e.g. "M+"). */
  function tick(el) {
    const target = parseFloat(el.dataset.ticker);
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    let start = null;
    function step(now) {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      let val = target * eased;
      val = target >= 100 ? Math.round(val) : Math.round(val * 10) / 10;
      el.textContent = val + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- IntersectionObserver dispatch ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add('in-view');
      if (el.hasAttribute('data-decrypt') && !reduceMotion) decrypt(el);
      if (el.hasAttribute('data-ticker')) {
        if (reduceMotion) {
          el.textContent = el.dataset.ticker + (el.dataset.suffix || '');
        } else {
          tick(el);
        }
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  document
    .querySelectorAll('[data-decrypt], [data-ticker], .cutout, .reveal, .chapter-head, .quote-card, .work-card, .cin-card, .proof-item, .capability-card, .case-study, .research-card, .teaching-card, .venture-row')
    .forEach((el) => io.observe(el));

  /* ---------- Cutout parallax ----------
     Elements with [data-depth] drift at different speeds while their
     chapter is on screen. Skipped under reduced motion. */
  const parallaxEls = reduceMotion ? [] : Array.from(document.querySelectorAll('[data-depth]'));
  function parallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const centre = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5-ish
      const depth = parseFloat(el.dataset.depth);
      el.style.setProperty('--py', (centre * depth * -60).toFixed(1) + 'px');
    });
    requestAnimationFrame(parallax);
  }
  if (parallaxEls.length) requestAnimationFrame(parallax);

  /* ---------- Digit-rain chapter transitions ----------
     Thin full-width canvases between chapters; digits rain while the band
     is in view. Colour comes from data-theme. */
  const THEMES = {
    ice:    ['#0b2237', '#175a86', '#2fa8e6', '#a7e0ff'],
    deep:   ['#08192b', '#0f3a5c', '#1d7ab8', '#6fc9ff'],
    ember:  ['#371610', '#8c3018', '#ff5c38', '#ffaa78'],
    gold:   ['#2e2410', '#6e5620', '#e0a92e', '#ffe9b0'],
    violet: ['#241238', '#4b2a78', '#8b5cf6', '#d8c2ff'],
    mono:   ['#1a2431', '#3c4c5e', '#7f93a6', '#edf4fb']
  };

  document.querySelectorAll('.digit-rain, .scene').forEach((band) => {
    const cv = document.createElement('canvas');
    band.appendChild(cv);
    const c = cv.getContext('2d');
    const palette = THEMES[band.dataset.theme] || THEMES.ice;
    let cols = 0, drops = [], speeds = [], running = false, W = 0, H = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = band.clientWidth; H = band.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = Math.min(W, 900) < 700 ? 14 : 16;
      cols = Math.ceil(W / cell);
      drops = new Array(cols).fill(0).map(() => Math.random() * H);
      speeds = new Array(cols).fill(0).map(() => 40 + Math.random() * 140);
      c.font = '600 12px "JetBrains Mono", monospace';
    }

    let last = 0;
    function rain(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      c.fillStyle = 'rgba(5,11,20,0.28)';
      c.fillRect(0, 0, W, H);
      const cell = W / cols;
      for (let i = 0; i < cols; i++) {
        drops[i] += speeds[i] * dt;
        if (drops[i] > H + 20) { drops[i] = -20; speeds[i] = 40 + Math.random() * 140; }
        c.fillStyle = palette[(Math.random() * palette.length) | 0];
        c.globalAlpha = 0.25 + Math.random() * 0.65;
        c.fillText(String((Math.random() * 10) | 0), i * cell + cell / 2, drops[i]);
      }
      c.globalAlpha = 1;
      requestAnimationFrame(rain);
    }

    if (reduceMotion) return;
    const bandIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !running) {
          running = true; size(); last = 0; requestAnimationFrame(rain);
        } else if (!e.isIntersecting) {
          running = false;
        }
      });
    }, { threshold: 0.05 });
    bandIO.observe(band);
    window.addEventListener('resize', () => { if (running) size(); });
  });

  /* ---------- 48h countdown (Big Screen Hack) ----------
     Ticks down from 48:00:00 on scroll-in, looping - a texture, not a
     real deadline. */
  const cd = document.getElementById('hack-countdown');
  if (cd && !reduceMotion) {
    let remaining = 48 * 3600;
    let started = false;
    const cdIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true;
          setInterval(() => {
            remaining = remaining <= 0 ? 48 * 3600 : remaining - 1;
            const h = String((remaining / 3600) | 0).padStart(2, '0');
            const m = String(((remaining % 3600) / 60) | 0).padStart(2, '0');
            const s = String(remaining % 60).padStart(2, '0');
            cd.textContent = h + ':' + m + ':' + s;
          }, 1000);
        }
      });
    }, { threshold: 0.3 });
    cdIO.observe(cd);
  }

  /* ---------- Hero title sequence: name paints in after the digit fall,
     handwriting lands letter by letter ---------- */
  const nameEl = document.querySelector('.hero-name');
  if (nameEl) {
    const hw = nameEl.querySelector('.handwritten');
    const textNode = nameEl.childNodes[0];
    if (textNode && textNode.nodeType === 3) {
      const txt = textNode.textContent.trim();
      textNode.remove();
      const frag = document.createDocumentFragment();
      txt.split('').forEach((ch, i) => {
        const sp = document.createElement('span');
        sp.className = 'nl';
        sp.style.animationDelay = (1.1 + i * 0.1) + 's';
        sp.textContent = ch === ' ' ? '\u00A0' : ch;
        frag.appendChild(sp);
      });
      nameEl.insertBefore(frag, hw);
    }
    if (hw && !reduceMotion) {
      const t = hw.textContent;
      hw.textContent = '';
      t.split('').forEach((ch, i) => {
        const sp = document.createElement('span');
        sp.className = 'hl';
        sp.style.animationDelay = (2.6 + i * 0.11) + 's';
        sp.textContent = ch === ' ' ? '\u00A0' : ch;
        hw.appendChild(sp);
      });
    }
  }

  /* ---------- Audience -> screen ----------
     The audience film cross-dissolves into an optically interpolated,
     keyframe-dense camera move. The pan is scrubbed across a generous
     scroll band, then its final frame holds before the trailer begins. */
  const audienceVid = document.getElementById('hero-video-2');
  const panVid = document.getElementById('hero-pan-video');
  const heroEl = document.getElementById('hero');
  if (audienceVid && panVid && heroEl) {
    const sticky = document.querySelector('.hero-sticky');
    let pendingPanProgress = 0;
    let lastPanTime = -1;

    function scrubPan(t) {
      pendingPanProgress = Math.max(0, Math.min(1, t));
      if (!Number.isFinite(panVid.duration) || panVid.duration <= 0 || panVid.readyState < 1) return;
      const target = pendingPanProgress * Math.max(0, panVid.duration - 0.025);
      if (Math.abs(target - lastPanTime) < 0.012) return;
      lastPanTime = target;
      try { panVid.currentTime = target; } catch (_) {}
    }
    panVid.pause();
    panVid.load();
    panVid.addEventListener('loadedmetadata', () => scrubPan(pendingPanProgress), { once: true });
    audienceVid.play().catch(() => {});
    window.__heroActiveLayer = audienceVid;

    const DISSOLVE_START = 0.44;
    const DISSOLVE_END = 0.56;
    const PAN_START = 0.50;
    const PAN_END = 0.91;

    function smooth(a, b, value) {
      const t = Math.max(0, Math.min(1, (value - a) / Math.max(.001, b - a)));
      return t * t * (3 - 2 * t);
    }

    onSmoothScroll((y) => {
      const total = heroEl.offsetHeight - window.innerHeight;
      const prog = total > 0 ? Math.max(0, Math.min(1, y / total)) : 0;
      const dissolve = smooth(DISSOLVE_START, DISSOLVE_END, prog);
      audienceVid.style.opacity = (1 - dissolve).toFixed(4);
      panVid.style.opacity = dissolve.toFixed(4);
      sticky && sticky.classList.toggle('act3', dissolve > .5);
      window.__heroActiveLayer = dissolve < .5 ? audienceVid : panVid;

      scrubPan((prog - PAN_START) / (PAN_END - PAN_START));
      if (dissolve > .995) audienceVid.pause();
      else if (audienceVid.paused) audienceVid.play().catch(() => {});

      document.body.classList.toggle('screen-locked', prog >= .94);
    });
  }

  /* ---------- Opening trailer ----------
     The pan's last frame holds for a beat, the projector falls to black,
     and the pinned screen advances through five title/footage cuts. */
  const cinemaEl = document.getElementById('cinema');
  if (cinemaEl) {
    const beats = Array.from(cinemaEl.querySelectorAll('.screen-beat'));
    const stage = cinemaEl.querySelector('.screen-stage');
    const counter = cinemaEl.querySelector('.trailer-counter b');
    const screenImg = document.querySelector('#screen-lock-bg img');

    function smooth(a, b, x) {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    function updateCinema(y) {
      // Position computed from the smoothed hub value (offsetTop is
      // stable in document flow), not getBoundingClientRect against the
      // raw scroll - same easing treatment as everything else.
      const total = cinemaEl.offsetHeight - window.innerHeight;
      const prog = total > 0 ? Math.max(0, Math.min(1, (y - cinemaEl.offsetTop) / total)) : 0;
      const trailerStart = .065;
      const trailerProgress = Math.max(0, Math.min(1, (prog - trailerStart) / (1 - trailerStart)));
      const n = beats.length;
      beats.forEach((el, i) => {
        const start = i / n, end = (i + 1) / n;
        const fadeIn = smooth(start, start + 0.055, trailerProgress);
        const fadeOut = i === n - 1 ? 1 : 1 - smooth(end - 0.055, end, trailerProgress);
        const o = Math.min(fadeIn, fadeOut);
        const local = Math.max(0, Math.min(1, (trailerProgress - start) / Math.max(.001, end - start)));
        el.style.opacity = o.toFixed(3);
        el.style.transform = 'translateY(' + ((1 - fadeIn) * 18) + 'px)';
        el.style.setProperty('--trailer-scale', (1.09 - local * .065).toFixed(4));
        el.classList.toggle('is-active', o > 0.5);
      });
      if (stage) {
        stage.style.setProperty('--stage-black', smooth(0, .055, prog).toFixed(3));
      }
      if (counter) {
        const seconds = Math.floor(prog * 18);
        const frames = Math.floor((prog * 18 - seconds) * 24);
        counter.textContent = '00:00:' + String(seconds).padStart(2, '0') + ':' + String(frames).padStart(2, '0');
      }
      if (screenImg) {
        const dim = smooth(0, .055, prog);
        screenImg.style.filter = 'brightness(' + (1 - dim * .94).toFixed(3) + ') saturate(1.02)';
      }
    }
    onSmoothScroll(updateCinema);
  }

  /* ---------- Cursor-tilt on the cinema cards ----------
     A small nod to Lusion.co's interactive, cursor-reactive surfaces -
     each card tilts toward the pointer in 3D, eased back to flat on
     mouseleave. Desktop pointer devices only. */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.cin-card, .work-card').forEach((card) => {
      card.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)';
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform 0.08s linear';
        card.style.transform = 'perspective(700px) rotateX(' + (-dy * 7).toFixed(2) + 'deg) rotateY(' + (dx * 7).toFixed(2) + 'deg) translateZ(6px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)';
        card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  /* ---------- Year stamp ---------- */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
