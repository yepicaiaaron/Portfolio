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
    ySmooth += (yTarget - ySmooth) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 10));
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

  /* ---------- Three-act hero: portrait -> cinema montage -> pan to screen
     -> lock.

     All three act layers are STACKED in #hero-media and loaded once up
     front - acts switch by toggling opacity (.is-active), never by
     swapping src, so no cut ever waits on a network fetch or decoder
     restart. Whichever layer is active is published on
     window.__heroActiveLayer so the digit mosaic samples the right one.

     Act 3 is a keyframe-dense MP4 scrubbed by scroll position. The source
     was rebuilt from the original 193-frame camera move, but ships as one
     reliable request. Stop scrolling and the pan stops; reverse direction
     and it travels back towards Aaron.

     "screen-locked" flips on when the scrub band completes (prog >= 1),
     comfortably before hero physically scrolls away - the backdrop sits
     behind hero (z-index 0 vs 1) so this early flip is invisible until
     hero vacates the space, at which point it's already there. ---------- */
  const heroVid = document.getElementById('hero-video');
  const heroVid2 = document.getElementById('hero-video-2');
  const panVid = document.getElementById('hero-pan-video');
  const heroEl = document.getElementById('hero');
  if (heroVid && heroEl) {
    const sticky = document.querySelector('.hero-sticky');
    const layers = [heroVid, heroVid2, panVid].filter(Boolean);
    let act = 1;
    let pendingPanProgress = 0;
    let lastPanTime = -1;

    function scrubPan(t) {
      if (!panVid) return;
      pendingPanProgress = Math.max(0, Math.min(1, t));
      if (!Number.isFinite(panVid.duration) || panVid.duration <= 0 || panVid.readyState < 1) return;
      const target = pendingPanProgress * Math.max(0, panVid.duration - 0.035);
      if (Math.abs(target - lastPanTime) < 0.018) return;
      lastPanTime = target;
      try { panVid.currentTime = target; } catch (_) {}
    }
    if (panVid) {
      panVid.pause();
      panVid.load();
      panVid.addEventListener('loadedmetadata', () => scrubPan(pendingPanProgress), { once: true });
    }

    function setAct(n) {
      act = n;
      if (sticky) sticky.classList.remove('act2', 'act3');
      if (n === 2) sticky && sticky.classList.add('act2');
      if (n === 3) sticky && sticky.classList.add('act3');
      const active = n === 1 ? heroVid : n === 2 ? heroVid2 : panVid;
      layers.forEach((el) => el.classList.toggle('is-active', el === active));
      window.__heroActiveLayer = active;
      // Play/pause without ever touching src. Act-2 video is not looped:
      // room.mp4 ends on ~the same shot the act-3 frame sequence opens on,
      // so it plays once and holds there - the act2->act3 cut lands on a
      // matching frame no matter how long the user dwells.
      if (heroVid) { if (n === 1) heroVid.play().catch(() => {}); else heroVid.pause(); }
      if (heroVid2) {
        if (n === 2 && !heroVid2.ended) heroVid2.play().catch(() => {});
        else heroVid2.pause();
      }
    }
    window.__heroActiveLayer = heroVid;

    // Act bands (fractions of the hero's scroll budget):
    //   act1 0 -> 0.5, act2 0.5 -> 0.74 (bridging beats live here),
    //   act3 scrub 0.74 -> 1.0 - the "film" plays across that whole band.
    // Driven by the smoothed scroll hub, so the film frames (and the act
    // switches) glide through every intermediate position instead of
    // jumping a wheel-notch at a time. The hub calls back every frame
    // while the eased value settles - the scrub needs no easing of its
    // own, drawPanFrame is called directly with the smoothed position.
    const SCRUB_START = 0.74;
    onSmoothScroll((y) => {
      const total = heroEl.offsetHeight - window.innerHeight;
      const prog = total > 0 ? y / total : 0;
      // every swap happens while digits still veil the video, so cuts are invisible
      if (act === 1 && prog > 0.5) setAct(2);
      else if (act === 2 && prog < 0.42) setAct(1);
      else if (act === 2 && prog > SCRUB_START) setAct(3);
      else if (act === 3 && prog < SCRUB_START - 0.04) setAct(2);
      if (act === 3) {
        scrubPan((Math.min(1, Math.max(0, prog)) - SCRUB_START) / (1 - SCRUB_START));
      }
      document.body.classList.toggle('screen-locked', act === 3 && prog >= 1);
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
      const n = beats.length;
      beats.forEach((el, i) => {
        const start = i / n, end = (i + 1) / n;
        const fadeIn = i === 0 ? 1 : smooth(start, start + 0.055, prog);
        const fadeOut = i === n - 1 ? 1 : 1 - smooth(end - 0.055, end, prog);
        const o = Math.min(fadeIn, fadeOut);
        const local = Math.max(0, Math.min(1, (prog - start) / Math.max(.001, end - start)));
        el.style.opacity = o.toFixed(3);
        el.style.transform = 'translateY(' + ((1 - fadeIn) * 18) + 'px)';
        el.style.setProperty('--trailer-scale', (1.09 - local * .065).toFixed(4));
        el.classList.toggle('is-active', o > 0.5);
      });
      if (stage) {
        stage.style.setProperty('--leader-white', (1 - smooth(0, .045, prog)).toFixed(3));
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
