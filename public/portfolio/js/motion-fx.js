/* Motion-powered scroll choreography (motion.dev, loaded from CDN as ESM).
   Everything here is progressive enhancement on top of effects.js — if the
   CDN import fails or reduced motion is set, the base experience stands. */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Velocity skew + magnetic buttons are dependency-free — run them even if
   the Motion CDN is unreachable. */
function velocitySkew() {
  const targets = document.querySelectorAll('.composition, .timeline, .grid-3');
  if (!targets.length) return;
  let lastY = window.scrollY;
  let skew = 0;
  function tick() {
    const y = window.scrollY;
    const v = y - lastY;
    lastY = y;
    const target = Math.max(-3.5, Math.min(3.5, v * 0.06));
    skew += (target - skew) * 0.12;
    if (Math.abs(skew) > 0.01) {
      targets.forEach((el) => { el.style.transform = 'skewY(' + skew.toFixed(3) + 'deg)'; });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function magneticButtons() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width;
      const dy = (e.clientY - r.top - r.height / 2) / r.height;
      btn.style.transform = 'translate(' + (dx * 10).toFixed(1) + 'px,' + (dy * 8).toFixed(1) + 'px)';
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

async function motionEnhancements() {
  const { animate, scroll, inView } = await import('https://cdn.jsdelivr.net/npm/motion@12/+esm');

  // 1. Statement scenes: giant words scrub through scale/opacity like
  //    title cards in a music video.
  document.querySelectorAll('.scene').forEach((scene) => {
    const word = scene.querySelector('.scene-word');
    if (!word) return;
    scroll(
      animate(word, {
        transform: [
          'scale(0.72) translateY(70px)',
          'scale(1) translateY(0px)',
          'scale(1.18) translateY(-50px)'
        ],
        opacity: [0, 1, 1, 0]
      }, { ease: 'linear' }),
      { target: scene, offset: ['start end', 'end start'] }
    );
  });

  // 2. Holographic props drift and rotate with scroll depth.
  document.querySelectorAll('.prop').forEach((prop) => {
    const drift = parseFloat(prop.dataset.drift || '120');
    const rot = parseFloat(prop.dataset.rot || '8');
    scroll(
      animate(prop, {
        transform: [
          'translateY(' + drift + 'px) rotate(' + (-rot) + 'deg)',
          'translateY(' + (-drift) + 'px) rotate(' + rot + 'deg)'
        ]
      }, { ease: 'linear' }),
      { target: prop.parentElement, offset: ['start end', 'end start'] }
    );
  });

  // 3. Chapter headlines: word-by-word rise (skip decrypting headlines,
  //    which effects.js owns).
  document.querySelectorAll('.chapter-head h2:not([data-decrypt])').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map((w) => '<span class="mw" style="display:inline-block;opacity:0;transform:translateY(0.6em)">' + w + '</span>').join(' ');
    inView(h, () => {
      h.querySelectorAll('.mw').forEach((s, i) => {
        animate(s, { opacity: 1, transform: 'translateY(0em)' }, { duration: 0.7, delay: i * 0.07, ease: [0.2, 0.65, 0.2, 1] });
      });
    }, { amount: 0.6 });
  });

  // 4. Hero copy: cinematic settle on load.
  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    animate(heroCopy, { opacity: [0, 1], transform: ['translateY(30px)', 'translateY(0px)'] }, { duration: 1.4, ease: [0.2, 0.65, 0.2, 1] });
  }

  // 5. Marquee: nudge speed with scroll position for a live feel.
  const track = document.querySelector('.marquee .track');
  if (track) {
    scroll((progress) => {
      const p = typeof progress === 'number' ? progress : 0;
      track.style.animationDuration = (38 - p * 14) + 's';
    });
  }
}

if (!reduce) {
  velocitySkew();
  magneticButtons();
  motionEnhancements().catch(() => { /* CDN unavailable — base effects stand */ });
}

