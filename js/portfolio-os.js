(function () {
  'use strict';

  const journey = document.querySelector('.journey-v5');
  if (!journey) return;

  const moments = Array.from(journey.querySelectorAll('.story-moment'));
  const roomLinks = Array.from(journey.querySelectorAll('[data-room-link]'));
  const progress = journey.querySelector('.journey-line i');
  const counter = journey.querySelector('.journey-counter b');
  const corridor = journey.querySelector('.corridor-moment');
  const corridorTrack = journey.querySelector('[data-corridor-track]');
  const practiceDoors = Array.from(journey.querySelectorAll('[data-practice-door]'));
  const corridorLabel = journey.querySelector('[data-corridor-label]');
  const corridorProgress = journey.querySelector('[data-corridor-progress]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = Boolean(window.gsap && window.ScrollTrigger);
  let currentMoment = -1;
  let currentDoor = -1;
  let ticking = false;

  document.documentElement.classList.add('journey-ready');
  journey.dataset.activeRoom = 'threshold';

  function setActiveMoment(index) {
    if (index < 0 || index >= moments.length || index === currentMoment) return;
    currentMoment = index;

    const active = moments[index];
    const room = active.dataset.room || 'threshold';
    journey.dataset.activeRoom = room;

    moments.forEach((moment, momentIndex) => {
      moment.classList.toggle('is-current', momentIndex === index);
    });

    roomLinks.forEach((link) => {
      const selected = link.dataset.roomLink === room;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });

    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
  }

  function updateProgress() {
    const rect = journey.getBoundingClientRect();
    const scrollable = journey.offsetHeight - window.innerHeight;
    const value = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;
    if (progress) progress.style.transform = 'scaleY(' + value.toFixed(4) + ')';
    updateCorridor();
    document.body.classList.toggle('journey-reading', rect.top < window.innerHeight && rect.bottom > 0);
    document.body.classList.toggle('portfolio-reading', rect.top <= window.innerHeight * .15);
    ticking = false;
  }

  function updateCorridor() {
    if (!corridor || !corridorTrack || !practiceDoors.length) return;

    const compact = window.matchMedia('(max-width: 700px)').matches;
    if (compact || reducedMotion) {
      corridorTrack.style.transform = '';
      practiceDoors.forEach((door) => door.classList.add('is-active'));
      return;
    }

    const rect = corridor.getBoundingClientRect();
    const scrollable = Math.max(1, corridor.offsetHeight - window.innerHeight);
    const value = Math.max(0, Math.min(1, -rect.top / scrollable));
    const scaled = value * (practiceDoors.length - 1);
    const from = Math.floor(scaled);
    const to = Math.min(practiceDoors.length - 1, from + 1);
    const mix = scaled - from;
    const fromCentre = practiceDoors[from].offsetLeft + practiceDoors[from].offsetWidth / 2;
    const toCentre = practiceDoors[to].offsetLeft + practiceDoors[to].offsetWidth / 2;
    const activeCentre = fromCentre + (toCentre - fromCentre) * mix;
    const x = corridor.clientWidth / 2 - activeCentre;
    const active = Math.max(0, Math.min(practiceDoors.length - 1, Math.round(scaled)));

    corridorTrack.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    corridor.style.setProperty('--corridor-progress', value.toFixed(4));
    if (corridorProgress) corridorProgress.style.transform = 'scaleX(' + value.toFixed(4) + ')';

    if (active !== currentDoor) {
      currentDoor = active;
      practiceDoors.forEach((door, index) => door.classList.toggle('is-active', index === active));
      if (corridorLabel) {
        const label = practiceDoors[active].querySelector('.door-copy small');
        corridorLabel.textContent = String(active + 1).padStart(2, '0') + ' / ' + (label ? label.textContent : 'CHOOSE A DOOR');
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });

  const observer = new IntersectionObserver(function (entries) {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    setActiveMoment(moments.indexOf(visible.target));
  }, {
    rootMargin: '-24% 0px -24% 0px',
    threshold: [0, .2, .4, .6, .8]
  });

  moments.forEach((moment) => observer.observe(moment));

  roomLinks.forEach((link) => {
    link.addEventListener('click', function (event) {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* Native fragment positioning happens before web fonts, media and GSAP
     have finished settling the layout. Re-align deep links once the final
     geometry is known so #speaking never opens over an earlier case study. */
  function alignHashTarget() {
    if (!window.location.hash) return;
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, '', link.getAttribute('href'));
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  function scrambleOnce(element) {
    if (!element || reducedMotion || element.dataset.scrambled === 'true') return;
    element.dataset.scrambled = 'true';
    const finalText = element.textContent.trim();
    const glyphs = '01{}[]<>/\\*+#$%';
    const start = performance.now();
    const duration = 900;

    function draw(now) {
      const value = Math.min(1, (now - start) / duration);
      const settled = Math.floor(finalText.length * value);
      element.textContent = Array.from(finalText).map(function (character, index) {
        if (character === ' ' || index < settled || value === 1) return character;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join('');
      if (value < 1) requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  const thresholdAnswer = journey.querySelector('.threshold-answer');
  const thresholdObserver = new IntersectionObserver(function (entries) {
    if (entries.some((entry) => entry.isIntersecting)) {
      scrambleOnce(thresholdAnswer);
      thresholdObserver.disconnect();
    }
  }, { threshold: .55 });
  if (thresholdAnswer) thresholdObserver.observe(thresholdAnswer);

  if (hasGSAP && !reducedMotion) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    moments.forEach(function (moment, index) {
      const copy = moment.querySelector('.moment-copy');
      const artefact = moment.querySelector('.artefact');
      const opening = moment.querySelector('.room-manifesto');
      const sequence = moment.querySelector('.signal-sequence, .audience-sequence, .talk-list, .scale-proof, .delivery-ledger');

      const timeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: moment,
          start: 'top 72%',
          toggleActions: 'play none none reverse'
        },
        defaults: { ease: 'power3.out' }
      });

      if (opening) {
        timeline.from(opening, { y: 70, autoAlpha: 0, duration: 1.05, immediateRender: false }, 0);
      }

      if (copy) {
        timeline.from(copy.children, { y: 42, autoAlpha: 0, duration: .8, stagger: .1, immediateRender: false }, 0);
      }

      if (artefact) {
        timeline.from(artefact, { y: 70, rotate: index % 2 ? 1.5 : -1.5, autoAlpha: 0, duration: 1.1, immediateRender: false }, .12);
        window.gsap.fromTo(artefact,
          { yPercent: 5 },
          { yPercent: -5, ease: 'none', scrollTrigger: { trigger: moment, start: 'top bottom', end: 'bottom top', scrub: 1.2 } }
        );
      }

      if (sequence) {
        timeline.from(sequence.children, { y: 50, autoAlpha: 0, duration: .75, stagger: .13, immediateRender: false }, .06);
      }
    });

    journey.querySelectorAll('.studio-contact-sheet figure, .stage-hero-image').forEach(function (element) {
      window.gsap.fromTo(element,
        { yPercent: -4 },
        { yPercent: 5, ease: 'none', scrollTrigger: { trigger: element.closest('.story-moment'), start: 'top bottom', end: 'bottom top', scrub: 1.4 } }
      );
    });
  }

  setActiveMoment(0);
  updateProgress();

  window.addEventListener('load', function () {
    window.setTimeout(function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      updateCorridor();
      alignHashTarget();
    }, 120);
  });
  window.addEventListener('resize', function () {
    window.requestAnimationFrame(updateCorridor);
  });
  window.addEventListener('hashchange', function () {
    window.setTimeout(alignHashTarget, 0);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      alignHashTarget();
    });
  }
})();
