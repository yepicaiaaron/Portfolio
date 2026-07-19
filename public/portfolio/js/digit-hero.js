/* Digit-mosaic hero renderer.
   Renders the hero media (video > image > generative signal) as a grid of
   cycling digits whose brightness/colour sample the source, then dissolves
   center-out as the user scrolls, revealing the media underneath. */

(function () {
  'use strict';

  const hero = document.getElementById('hero');
  const canvas = document.getElementById('digit-canvas');
  const media = document.getElementById('hero-media');
  const video = document.getElementById('hero-video');
  const image = document.getElementById('hero-image');
  const glow = document.getElementById('hero-glow');
  const copy = document.querySelector('.hero-copy');
  const brandMini = document.querySelector('.brand-mini');
  const phaseLabel = document.getElementById('phase-label');
  const progressBar = document.getElementById('progress-bar');
  const heroSticky = document.querySelector('.hero-sticky');
  const heroDark = document.querySelector('.hero-dark');
  const bridging1 = document.querySelector('.bridging-1');
  const bridging2 = document.querySelector('.bridging-2');
  const heroFoot = document.querySelector('.hero-foot');
  const heroVignette = document.querySelector('.hero-vignette');
  const heroGrain = document.querySelector('.hero-grain');
  if (!canvas || !hero) return;

  // "in - hold - out" pulse: 0 outside [a,d], 1 across [b,c], smoothstepped
  // in/out over [a,b] and [c,d].
  function pulse(a, b, c, d, x) {
    const rise = Math.max(0, Math.min(1, (x - a) / Math.max(0.001, b - a)));
    const fall = Math.max(0, Math.min(1, (x - c) / Math.max(0.001, d - c)));
    const riseS = rise * rise * (3 - 2 * rise);
    const fallS = fall * fall * (3 - 2 * fall);
    return Math.max(0, riseS - fallS);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = canvas.getContext('2d', { alpha: true });

  // --- Grid ---
  const isMobile = Math.min(window.innerWidth, window.innerHeight) < 700;
  const COLS = isMobile ? 58 : 96;
  let ROWS = 100;

  let n = 0;
  let bright, digits, ticks, jitterX, jitterY, cellDX, cellDY, cellDist;

  // --- Colour ramp (ice matrix theme) ---
  const stops = [
    [0.0,  [5, 11, 20]],
    [0.22, [11, 34, 55]],
    [0.42, [23, 90, 134]],
    [0.62, [47, 168, 230]],
    [0.82, [143, 214, 255]],
    [1.0,  [237, 246, 255]]
  ];

  function col(b) {
    for (let i = 0; i < stops.length - 1; i++) {
      if (b <= stops[i + 1][0]) {
        const t0 = stops[i][0], c0 = stops[i][1];
        const t1 = stops[i + 1][0], c1 = stops[i + 1][1];
        const t = (b - t0) / (t1 - t0);
        return [
          c0[0] + (c1[0] - c0[0]) * t | 0,
          c0[1] + (c1[1] - c0[1]) * t | 0,
          c0[2] + (c1[2] - c0[2]) * t | 0
        ];
      }
    }
    return stops[stops.length - 1][1];
  }

  const ss = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // --- Offscreen sampling canvas ---
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });

  let source = null;          // video, image, or null (generative)
  let sourceReady = false;
  let lastSample = 0;

  function allocate() {
    const vw = window.innerWidth, vh = window.innerHeight;
    ROWS = Math.max(40, Math.round(COLS * (vh / vw)));
    n = COLS * ROWS;
    bright = new Float32Array(n);
    digits = new Uint8Array(n);
    ticks = new Float32Array(n);
    jitterX = new Float32Array(n);
    jitterY = new Float32Array(n);
    cellDX = new Float32Array(n);
    cellDY = new Float32Array(n);
    cellDist = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      digits[k] = (Math.random() * 10) | 0;
      ticks[k] = Math.random();
      jitterX[k] = Math.random() * 2 - 1;
      jitterY[k] = Math.random() * 2 - 1;
      const x = (k % COLS) / (COLS - 1);
      const y = ((k / COLS) | 0) / (ROWS - 1);
      cellDX[k] = x - 0.5;
      cellDY[k] = y - 0.5;
      cellDist[k] = Math.hypot(x - 0.5, (y - 0.5) * 1.15);
    }
    off.width = COLS;
    off.height = ROWS;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    allocate();
  }

  // --- Source selection: video > image > generative ---
  function pickSource() {
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      source = video; sourceReady = true; return;
    }
    if (image && image.complete && image.naturalWidth > 0) {
      source = image; sourceReady = true; return;
    }
    source = null; sourceReady = true; // generative fallback
  }

  if (video) {
    video.addEventListener('loadeddata', () => { source = video; sourceReady = true; media.classList.add('has-media'); });
    video.addEventListener('error', pickSource);
    // Some browsers won't fire error on missing <source>; poll once.
    setTimeout(pickSource, 1200);
  }
  if (image) {
    image.addEventListener('load', () => { if (source !== video) { source = image; sourceReady = true; media.classList.add('has-media'); } });
    image.addEventListener('error', pickSource);
  }
  setTimeout(pickSource, 2000);

  // Generative "signal" field: a portrait-shaped luminance bust so the hero
  // reads as a figure emerging from code even before real media is added.
  function generativeSample(t) {
    // Correct for viewport aspect so the bust keeps its proportions on
    // tall (mobile) and wide screens alike.
    const ar = window.innerWidth / window.innerHeight;
    const axc = Math.max(1, ar), ayc = Math.max(1, 1 / ar);
    for (let k = 0; k < n; k++) {
      const x = ((k % COLS) / (COLS - 1) - 0.5) * axc;
      const y = (((k / COLS) | 0) / (ROWS - 1) - 0.5) * ayc;
      // Head: ellipse centred slightly above middle
      const hd = Math.hypot(x / 0.16, (y + 0.08) / 0.21);
      // Shoulders: wide flat ellipse near bottom
      const sd = Math.hypot(x / 0.34, (y - 0.38) / 0.18);
      let v = Math.max(0, 1 - Math.max(0, hd - 0.55) * 1.6) * 0.85
            + Math.max(0, 1 - Math.max(0, sd - 0.5) * 2.2) * 0.6;
      // Breathing shimmer
      v *= 0.82 + 0.18 * Math.sin(t * 0.0011 + x * 9 + y * 7);
      // Scanline pulse rising through the figure
      const scan = Math.exp(-Math.pow((y + 0.5) - ((t * 0.00012) % 1.4 - 0.2), 2) * 40);
      v += scan * 0.22 * Math.max(0.15, v);
      bright[k] = bright[k] * 0.9 + Math.min(1, v) * 0.1;
    }
  }

  function sampleSource(now) {
    if (now - lastSample < 33) return;
    lastSample = now;
    // effects.js publishes whichever stacked act layer is currently
    // visible (act1 video, act2 video, or the act3 frame canvas) — sample
    // that one so the digit mosaic always mirrors what's on screen.
    const active = window.__heroActiveLayer;
    const src = (active && (active.readyState >= 2 || active.tagName === 'CANVAS')) ? active : source;
    if (!src) { generativeSample(now); return; }
    const sw = src.videoWidth || src.naturalWidth || src.width;
    const sh = src.videoHeight || src.naturalHeight || src.height;
    if (!sw || !sh) { generativeSample(now); return; }
    // cover-fit crop
    const targetAR = COLS / ROWS * (window.innerHeight / window.innerWidth) * (COLS / ROWS);
    const gridAR = window.innerWidth / window.innerHeight;
    let cw = sw, ch = sh;
    if (sw / sh > gridAR) { cw = sh * gridAR; } else { ch = sw / gridAR; }
    const sx = (sw - cw) / 2, sy = (sh - ch) / 2;
    try {
      // faceShift slides the sampled image right within the digit grid
      // (matching the CSS translate on #hero-media) — the vacated left
      // cells sample black, so they fall to the dim ambient digit field,
      // exactly the name-left / face-right composition of the reference.
      const xOff = Math.round(faceShift * COLS);
      if (xOff > 0) { octx.fillStyle = '#000'; octx.fillRect(0, 0, COLS, ROWS); }
      octx.drawImage(src, sx, sy, cw, ch, xOff, 0, COLS, ROWS);
    } catch (e) { generativeSample(now); return; }
    const data = octx.getImageData(0, 0, COLS, ROWS).data;
    let min = 1, max = 0;
    const lum = new Float32Array(n);
    for (let k = 0, q = 0; k < n; k++, q += 4) {
      const v = 0.2126 * data[q] / 255 + 0.7152 * data[q + 1] / 255 + 0.0722 * data[q + 2] / 255;
      lum[k] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(0.001, max - min);
    for (let k = 0; k < n; k++) {
      const v = Math.pow((lum[k] - min) / range, 0.85);
      bright[k] = bright[k] * 0.55 + v * 0.45;
    }
  }

  // --- Scroll state ---
  let p = 0;
  let pRaw = 0; // unclamped — keeps growing past 1 through hero-sticky's release scroll
  // Smoothed playhead: everything visual is driven by pRawS, an eased
  // chase of pRaw, NOT the raw value. Wheel scrolling arrives in ~100px
  // steps — bigger than some of the animation bands here — so raw-driven
  // fades visibly teleport. The ease spreads any scroll jump across
  // ~300ms of real frames (same treatment as the act-3 film scrub).
  let pRawS = 0;
  let lastFrameT = 0;
  let paintTick = false; // halves the mosaic repaint rate when idle (see frame())
  let lastPaintP = -1;
  let lastPaintT = 0;
  let faceShift = 0; // 0..~0.11: how far right (as a fraction of width) the face sits
  const PHASES = ['Code', 'Signal', 'Pixels', 'Presence'];

  function readScroll() {
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    pRaw = total > 0 ? Math.max(0, -rect.top / total) : 0;
    p = Math.min(1, pRaw);
    if (progressBar) {
      const doc = document.documentElement;
      const sp = doc.scrollTop / Math.max(1, doc.scrollHeight - window.innerHeight);
      progressBar.style.transform = 'scaleX(' + sp + ')';
    }
    if (phaseLabel) {
      const ph = PHASES[Math.min(PHASES.length - 1, (p * PHASES.length) | 0)];
      if (phaseLabel.textContent !== ph) phaseLabel.textContent = ph;
    }
  }

  // --- Render loop ---
  let fontSize = 10, cellW = 10, cellH = 10;

  function layoutCells() {
    cellW = window.innerWidth / COLS;
    cellH = window.innerHeight / ROWS;
    fontSize = Math.ceil(Math.max(cellW, cellH) * 1.05);
  }

  function frame(now) {
    readScroll();
    const dtF = Math.min(0.05, (now - lastFrameT) / 1000 || 0.016);
    lastFrameT = now;
    // ease the playhead toward the real scroll position (~150ms half-life)
    pRawS += (pRaw - pRawS) * (reduceMotion ? 1 : 1 - Math.exp(-dtF * 10));
    if (Math.abs(pRaw - pRawS) < 0.0003) pRawS = pRaw;
    const pS = Math.min(1, pRawS);
    const pp = reduceMotion ? 1 : pS;
    // With no real media to reveal, freeze the dissolve mid-transition —
    // half human, half code — rather than dissolving into nothing.
    const dp = source ? pp : Math.min(pp, 0.38);

    const videoReveal = ss(0.18, 0.78, pp);
    const digitPresence = reduceMotion ? 0.35 : 1 - ss(0.22, 0.88, dp);
    const tide = ss(0.15, 0.92, dp);
    const scatter = ss(0.30, 1.0, dp);

    // media treatment. Purely scroll-driven (not tied to the video's
    // 'ended' event, which doesn't fire reliably on every connection/
    // browser) — panZoom pushes in slightly over the last stretch of the
    // hero's own scroll budget (pp 0.80->1.0), landing on scale 1.2 well
    // before the hero actually scrolls out of view (the pan video itself
    // already ends framed tight on the screen now, so this is just a
    // small finishing push, not the dramatic crop it used to be), so by
    // the time the fixed backdrop takes over it already matches this
    // framing. transform-origin (50% 53%, set in CSS) is calibrated to
    // the same crop used for that backdrop image.
    //
    // Once fully zoomed, hero-sticky still needs a full extra 100vh of
    // scroll to physically release (a 100vh sticky element can't exit any
    // faster) — and because it releases by clipping from the TOP, the
    // shrinking sliver that stays on screen longest is disproportionately
    // its BOTTOM edge, which in this crop is curtain/bezel, not screen.
    // Rather than fight that with an ever-more-precise crop, just fade
    // hero-media out early in that release stretch (releaseFade, driven
    // by unclamped pRaw) so only the backdrop — which doesn't have this
    // clipping problem — is ever visible by the time it'd show.
    const releaseFade = 1 - ss(1.0, 1.08, pRawS);
    // Composition shift (matches the reference art direction): at the top
    // of the page the face sits right-of-centre — name on the left, digit
    // portrait on the right — then glides back to centre as the dissolve
    // begins, settling well before the video is fully revealed. The same
    // value drives the CSS translate here AND the sampling offset in
    // sampleSource, so mosaic and video stay in register throughout.
    faceShift = 0.11 * (1 - ss(0.06, 0.30, pp));
    if (media) {
      media.style.opacity = (source ? videoReveal : 0) * releaseFade;
      // Blur capped at 6px (was 14) and quantised to whole pixels —
      // animating a full-viewport blur every frame is one of the most
      // expensive GPU ops there is, and the digit mosaic is already
      // visually covering the video through this stretch anyway. The
      // quantise means the filter string only changes ~6 times across
      // the whole dissolve instead of every frame.
      const blur = Math.round(6 * (1 - videoReveal));
      const baseScale = 1.08 - 0.08 * videoReveal;
      const panZoom = ss(0.80, 1.0, pp);
      const scale = baseScale + panZoom * 0.20;
      const f = blur > 0 ? 'blur(' + blur + 'px)' : 'none';
      if (media.style.filter !== f) media.style.filter = f;
      media.style.transform = 'translateX(' + (faceShift * 100).toFixed(2) + 'vw) scale(' + scale.toFixed(3) + ')';
    }
    if (glow) glow.style.transform = 'translateX(' + (faceShift * 100).toFixed(2) + 'vw)';
    if (heroVignette) heroVignette.style.opacity = releaseFade.toFixed(3);
    if (heroGrain) heroGrain.style.opacity = (0.13 * releaseFade).toFixed(3);
    // Social links + "menu" affordance fade out with the same pan-zoom —
    // without this they'd otherwise still be sitting at the bottom of
    // .hero-sticky when it physically scrolls away, visibly sweeping
    // through the (by-then screen-locked) frame instead of just being gone.
    if (heroFoot) {
      const fo = 1 - ss(0.76, 0.86, pp);
      heroFoot.style.opacity = fo.toFixed(3);
      heroFoot.style.pointerEvents = fo > 0.5 ? 'auto' : 'none';
    }
    if (glow) glow.style.opacity = (videoReveal * 0.85).toFixed(2);
    if (copy) {
      copy.style.transform = 'translateY(' + (-videoReveal * 55) + 'vh)';
      copy.style.opacity = (1 - ss(0.34, 0.58, pp)).toFixed(3);
    }
    if (brandMini) {
      const bo = ss(0.42, 0.64, pp);
      brandMini.style.opacity = bo.toFixed(3);
      brandMini.style.pointerEvents = bo > 0.5 ? 'auto' : 'none';
      brandMini.style.transform = 'translateY(' + ((1 - bo) * -10) + 'px)';
    }

    // ---- act-two sequence: two title beats over the (undimmed) video,
    // purely additive from pp. Room.mp4 and the pan video are graded to
    // match and room.mp4 holds on its matching final frame (see
    // effects.js), so the video itself carries the whole act2->act3
    // handoff with no dark beat needed to hide the cut.
    if (heroDark) heroDark.style.opacity = '0';
    if (bridging1) {
      const b1 = pulse(0.52, 0.55, 0.60, 0.63, pp);
      bridging1.style.opacity = b1.toFixed(3);
      bridging1.style.transform = 'translateY(' + ((1 - b1) * 24) + 'px)';
    }
    if (bridging2) {
      const b2 = pulse(0.65, 0.68, 0.70, 0.73, pp);
      bridging2.style.opacity = b2.toFixed(3);
      bridging2.style.transform = 'translateY(' + ((1 - b2) * 24) + 'px)';
    }

    if (digitPresence < 0.01) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      requestAnimationFrame(frame);
      return;
    }

    // Adaptive repaint: full 60fps whenever the playhead is moving (the
    // dissolve is scroll-coupled, so scrolling is exactly when stepping
    // would show), half rate only while idle — which is when the glyph
    // cycling is the only motion and 30fps is indistinguishable. Painting
    // thousands of glyphs is the biggest per-frame cost in the hero.
    const playheadMoving = Math.abs(pS - lastPaintP) > 0.0004;
    paintTick = !paintTick;
    if (!playheadMoving && paintTick) { requestAnimationFrame(frame); return; }

    if (sourceReady) sampleSource(now);

    const dtPaint = Math.min(0.08, (now - lastPaintT) / 1000 || 0.016);
    lastPaintT = now;
    lastPaintP = pS;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.font = '600 ' + fontSize + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const vanishRadius = tide * 0.95;
    const soft = 0.18;

    for (let k = 0; k < n; k++) {
      const b = bright[k];
      // dying: 1 inside vanish radius, 0 outside, soft band between
      const dying = 1 - ss(vanishRadius - soft, vanishRadius, cellDist[k]);
      const alive = (1 - dying) * digitPresence;
      const a = alive * (0.14 + b * 0.9);
      if (a < 0.012) continue;

      if (!reduceMotion) {
        // dt-based: paints run at a variable rate (60fps scrolling, 30fps
        // idle), so advance by real elapsed time to keep the cycling
        // speed constant either way.
        ticks[k] += dtPaint * (0.5 + b * 3.4 + 1.2 + scatter * 1.5);
        if (ticks[k] > 1) {
          ticks[k] = 0;
          digits[k] = (digits[k] + 1 + ((Math.random() * 3) | 0)) % 10;
        }
      }

      const driftX = dying * scatter * (cellDX[k] * 40 + jitterX[k] * 8);
      const driftY = dying * scatter * (-20 - jitterY[k] * 14);

      const c = col(b);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
      const x = (k % COLS) * cellW + cellW / 2 + driftX;
      const y = ((k / COLS) | 0) * cellH + cellH / 2 + driftY;
      ctx.fillText(digits[k], x, y);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { resize(); layoutCells(); });
  resize();
  layoutCells();
  requestAnimationFrame(frame);
})();

