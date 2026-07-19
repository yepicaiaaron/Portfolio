/* The Reflection: scroll-scrubbed zoom into the cinema photo — pushing in
   toward the glasses until the film playing in them fills the screen.
   Focal point is configurable via --gx/--gy on .refl-photo so a new photo
   only needs two CSS vars changed. */

(function () {
  'use strict';

  const section = document.getElementById('reflection');
  if (!section) return;

  const photo = section.querySelector('.refl-photo');
  const film = section.querySelector('.refl-film');
  const video = film ? film.querySelector('video') : null;
  const capA = section.querySelector('.refl-cap-a');
  const capB = section.querySelector('.refl-cap-b');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    if (film) film.style.opacity = 1;
    if (photo) photo.style.opacity = 0;
    return;
  }

  const ZOOM = parseFloat(section.dataset.zoom || '7');

  const ss = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Play the film only while the section is on screen.
  if (video) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { video.play().catch(() => {}); }
        else { video.pause(); }
      });
    }, { threshold: 0.05 });
    io.observe(section);
  }

  function frame() {
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    const p = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;

    // Push-in: hold, zoom, then hand over to the film.
    const zoomT = ss(0.08, 0.72, p);
    const scale = 1 + zoomT * (ZOOM - 1);
    const filmT = ss(0.58, 0.82, p);

    if (photo) {
      photo.style.transform = 'scale(' + scale.toFixed(3) + ')';
      photo.style.opacity = (1 - filmT).toFixed(3);
      photo.style.filter = 'brightness(' + (1 - zoomT * 0.25).toFixed(3) + ') contrast(' + (1 + zoomT * 0.12).toFixed(3) + ')';
    }
    if (film) {
      film.style.opacity = filmT.toFixed(3);
      film.style.transform = 'scale(' + (1.18 - filmT * 0.18).toFixed(3) + ')';
    }
    if (capA) capA.style.opacity = (1 - ss(0.3, 0.5, p)).toFixed(2);
    if (capB) capB.style.opacity = ss(0.72, 0.9, p).toFixed(2);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

