(function () {
  'use strict';

  const building = document.querySelector('#mind-os.three-worlds');
  if (!building) return;

  const scenes = Array.from(building.querySelectorAll('.world-scene'));
  const navItems = Array.from(building.querySelectorAll('.world-nav-item'));
  const jumpButtons = Array.from(building.querySelectorAll('[data-jump-world]'));
  const progressBar = building.querySelector('.world-progress span');
  const shell = building.querySelector('.worlds-shell');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => window.matchMedia('(max-width: 760px)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  let activeIndex = -1;

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  function sceneParts(scene) {
    return {
      intro: scene.querySelector('.map-intro, .room-intro, .stage-copy'),
      objects: scene.querySelectorAll('.room-object'),
      stories: scene.querySelectorAll('.story-trigger'),
      background: scene.querySelectorAll('.parallax-layer'),
      ticker: scene.querySelector('.stage-ticker')
    };
  }

  function activateScene(index, immediate) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    if (index === activeIndex) return;

    const previous = activeIndex >= 0 ? scenes[activeIndex] : null;
    const next = scenes[index];
    activeIndex = index;

    scenes.forEach((scene, i) => {
      const selected = i === index;
      scene.classList.toggle('is-active', selected);
      scene.setAttribute('aria-hidden', selected ? 'false' : 'true');
    });
    navItems.forEach((item, i) => item.classList.toggle('is-active', i === index));

    if (!hasGSAP || reduceMotion || immediate || mobile()) return;

    if (previous) gsap.set(previous, { autoAlpha: 0 });
    gsap.set(next, { autoAlpha: 1 });
    const parts = sceneParts(next);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (parts.intro) tl.fromTo(parts.intro, { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8 });
    if (parts.background.length) tl.fromTo(parts.background, { scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.1, stagger: .08 }, 0);
    if (parts.objects.length) tl.fromTo(parts.objects, { y: 45, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .09 }, .18);
    if (parts.stories.length) tl.fromTo(parts.stories, { x: -28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .45, stagger: .07 }, .34);
    if (parts.ticker) tl.fromTo(parts.ticker, { x: 90, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .8 }, .45);
  }

  function scrollProgress() {
    const rect = building.getBoundingClientRect();
    const total = building.offsetHeight - window.innerHeight;
    return total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
  }

  function updateFromProgress(progress) {
    const safe = Math.max(0, Math.min(.9999, progress));
    activateScene(Math.floor(safe * scenes.length), false);
    if (progressBar) {
      if (hasGSAP) gsap.set(progressBar, { scaleX: progress });
      else progressBar.style.transform = 'scaleX(' + progress + ')';
    }
  }

  function moveToScene(index) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    if (mobile() || reduceMotion) {
      activateScene(index, false);
      shell.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    const total = building.offsetHeight - window.innerHeight;
    const targetProgress = (index + .5) / scenes.length;
    window.scrollTo({ top: building.offsetTop + total * targetProgress, behavior: 'smooth' });
  }

  navItems.forEach((item, index) => item.addEventListener('click', () => moveToScene(index)));
  jumpButtons.forEach((item) => item.addEventListener('click', () => moveToScene(Number(item.dataset.jumpWorld || 0))));

  building.querySelectorAll('.world-scene').forEach((scene) => {
    const triggers = Array.from(scene.querySelectorAll('[data-story-target]'));
    const cards = Array.from(scene.querySelectorAll('[data-story-card]'));

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const target = trigger.dataset.storyTarget;
        triggers.forEach((item) => item.classList.toggle('is-selected', item === trigger));
        cards.forEach((card) => card.classList.toggle('is-selected', card.dataset.storyCard === target));

        if (hasGSAP && !reduceMotion) {
          const card = cards.find((item) => item.dataset.storyCard === target);
          if (card) gsap.fromTo(card, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, ease: 'power3.out' });
        }
      });
    });
  });

  if (hasGSAP && window.ScrollTrigger && !mobile() && !reduceMotion) {
    window.ScrollTrigger.create({
      trigger: building,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => updateFromProgress(self.progress)
    });
  } else if (!mobile() && !reduceMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateFromProgress(scrollProgress());
        ticking = false;
      });
    }, { passive: true });
  }

  if (!reduceMotion && !mobile()) {
    shell.addEventListener('pointermove', (event) => {
      const rect = shell.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - .5;
      const dy = (event.clientY - rect.top) / rect.height - .5;
      const active = scenes[activeIndex];
      if (!active) return;

      active.querySelectorAll('.parallax-layer').forEach((layer) => {
        const depth = Number(layer.dataset.depth || .5);
        if (hasGSAP) gsap.to(layer, { x: dx * 25 * depth, y: dy * 18 * depth, duration: .55, overwrite: 'auto' });
      });
    });
  }

  activateScene(0, true);
  updateFromProgress(mobile() ? 0 : scrollProgress());

  window.addEventListener('resize', () => {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    if (mobile()) activateScene(Math.max(0, activeIndex), true);
  });
})();
