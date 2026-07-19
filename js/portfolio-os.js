(function () {
  'use strict';

  const mind = document.getElementById('mind-os');
  if (!mind) return;

  const scenes = Array.from(mind.querySelectorAll('.os-scene'));
  const dock = mind.querySelector('.os-dock');
  const dockItems = Array.from(mind.querySelectorAll('.dock-item'));
  const progressBar = mind.querySelector('.os-progress span');
  const grid = mind.querySelector('.os-grid');
  const frame = mind.querySelector('.os-frame');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => window.matchMedia('(max-width: 720px)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  let activeIndex = -1;
  let scrambleToken = 0;

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  function scramble(el) {
    if (!el) return;
    const finalText = el.dataset.scramble || el.textContent;
    if (reduceMotion) {
      el.textContent = finalText;
      return;
    }

    const glyphs = '01{}[]<>/\\*+#$%ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const token = ++scrambleToken;
    const started = performance.now();
    const duration = 1050;

    function frameText(now) {
      if (token !== scrambleToken) return;
      const progress = Math.min(1, (now - started) / duration);
      const settled = Math.floor(progress * finalText.length);
      let next = '';
      for (let i = 0; i < finalText.length; i++) {
        const char = finalText[i];
        if (char === ' ') next += ' ';
        else if (i < settled || progress === 1) next += char;
        else next += glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = next;
      if (progress < 1) requestAnimationFrame(frameText);
    }

    requestAnimationFrame(frameText);
  }

  function sceneParts(scene) {
    return {
      left: scene.querySelector('.os-window--left'),
      right: scene.querySelector('.os-window--right'),
      copy: scene.querySelector('.os-center-copy'),
      proof: scene.querySelector('.os-proof-strip'),
      intro: scene.querySelector('.os-intro'),
      orbits: scene.querySelectorAll('.os-orbit')
    };
  }

  function activateScene(index, immediate) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    if (index === activeIndex) return;

    const previous = activeIndex >= 0 ? scenes[activeIndex] : null;
    const next = scenes[index];
    activeIndex = index;

    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-active', i === index);
      scene.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    dockItems.forEach((item, i) => item.classList.toggle('is-active', i === index));

    if (mobile() || reduceMotion || immediate || !hasGSAP) {
      if (hasGSAP) gsap.set(next, { autoAlpha: 1 });
      if (index === 0) scramble(next.querySelector('[data-scramble]'));
      return;
    }

    if (previous) gsap.set(previous, { autoAlpha: 0 });
    gsap.set(next, { autoAlpha: 1 });
    const parts = sceneParts(next);
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (parts.intro) {
      timeline.fromTo(parts.intro, { y: 42, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .75 });
      if (parts.orbits.length) {
        timeline.fromTo(parts.orbits, { scale: .8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .5, stagger: .08 }, '-=.35');
      }
      scramble(next.querySelector('[data-scramble]'));
    } else {
      if (parts.left) timeline.fromTo(parts.left, { x: -150, rotate: -2, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, duration: .78 }, 0);
      if (parts.right) timeline.fromTo(parts.right, { x: 150, rotate: 2, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, duration: .78 }, .05);
      if (parts.copy) timeline.fromTo(parts.copy, { y: 62, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .68 }, .18);
      if (parts.proof) timeline.fromTo(parts.proof.children, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .42, stagger: .045 }, .36);
    }
  }

  function updateFromProgress(progress) {
    const p = Math.max(0, Math.min(0.9999, progress));
    const index = Math.floor(p * scenes.length);
    activateScene(index, false);

    if (progressBar) {
      if (hasGSAP) gsap.set(progressBar, { scaleX: progress });
      else progressBar.style.transform = 'scaleX(' + progress + ')';
    }

    if (grid && !reduceMotion) {
      const x = Math.sin(progress * Math.PI * 4) * 13;
      const y = progress * -32;
      if (hasGSAP) gsap.set(grid, { x, y });
      else grid.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
  }

  function scrollProgress() {
    const rect = mind.getBoundingClientRect();
    const total = mind.offsetHeight - window.innerHeight;
    return total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
  }

  if (hasGSAP && window.ScrollTrigger && !mobile() && !reduceMotion) {
    window.ScrollTrigger.create({
      trigger: mind,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) { updateFromProgress(self.progress); }
    });
  } else if (!mobile() && !reduceMotion) {
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateFromProgress(scrollProgress());
        ticking = false;
      });
    }, { passive: true });
  }

  dockItems.forEach((item, index) => {
    item.addEventListener('click', function () {
      if (mobile() || reduceMotion) {
        activateScene(index, false);
        frame.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }

      const total = mind.offsetHeight - window.innerHeight;
      const targetProgress = (index + .5) / scenes.length;
      window.scrollTo({ top: mind.offsetTop + total * targetProgress, behavior: 'smooth' });
    });
  });

  if (dock && !mobile() && !reduceMotion) {
    dock.addEventListener('mousemove', function (event) {
      dockItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const centre = rect.left + rect.width / 2;
        const distance = Math.abs(event.clientX - centre);
        const influence = Math.max(0, 1 - distance / 115);
        item.style.setProperty('--dock-scale', (1 + influence * .62).toFixed(3));
      });
    });

    dock.addEventListener('mouseleave', function () {
      dockItems.forEach((item) => item.style.setProperty('--dock-scale', '1'));
    });
  }

  if (frame && !reduceMotion && !mobile()) {
    frame.addEventListener('pointermove', function (event) {
      const rect = frame.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - .5;
      const dy = (event.clientY - rect.top) / rect.height - .5;
      const active = scenes[activeIndex];
      if (!active) return;
      const left = active.querySelector('.os-window--left');
      const right = active.querySelector('.os-window--right');
      if (hasGSAP) {
        if (left) gsap.to(left, { x: dx * 10, y: dy * 7, duration: .45, overwrite: 'auto' });
        if (right) gsap.to(right, { x: dx * -10, y: dy * -7, duration: .45, overwrite: 'auto' });
      }
    });
  }

  activateScene(0, true);
  updateFromProgress(mobile() ? 0 : scrollProgress());

  window.addEventListener('resize', function () {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    if (mobile()) activateScene(Math.max(0, activeIndex), true);
  });
})();
