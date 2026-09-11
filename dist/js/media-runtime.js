/* Small, demand-loaded media. No image sequences or whole-page preloading. */
(() => {
  const image = src => window.PortfolioImageAssets?.[src] || src;
  const mobile = matchMedia('(max-width: 700px)').matches;
  const lowMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sources = new WeakMap();
  function load(video) {
    if (!video || video.hasAttribute('src')) return;
    const src = video.dataset[mobile ? 'mobileSrc' : 'src'] || video.dataset.src;
    if (!src) return;
    video.src = src;
    video.load();
  }
  function release(video) {
    if (!video) return;
    video.pause();
    const state = sources.get(video);
    if (state) { state.controller.abort(); if (state.url) URL.revokeObjectURL(state.url); }
    sources.delete(video);
    delete video.dataset.loading;
    delete video.dataset.delivery;
    delete video.dataset.mediaError;
    video.removeAttribute('src');
    video.load();
  }
  async function loadSeekable(video) {
    if (sources.has(video)) return sources.get(video).promise;
    const controller = new AbortController();
    const state = { controller, url: null, promise: null };
    sources.set(video, state);
    state.promise = (async () => {
      const src = video.dataset[mobile ? 'mobileSrc' : 'src'] || video.dataset.src;
      // A compliant server returns one byte; the browser then streams/seeks natively.
      // The current static host returns 200 + the whole compact file instead.
      // Reuse that same response as a bounded Blob, never download it a second time.
      const response = await fetch(src, { headers: { Range: 'bytes=0-0' }, signal: controller.signal });
      if (controller.signal.aborted || sources.get(video) !== state) { await response.body?.cancel(); return false; }
      if (!response.ok) throw new Error('Camera film unavailable');
      if (response.status === 206 && /^bytes 0-0\//.test(response.headers.get('Content-Range') || '')) {
        await response.body?.cancel();
        if (controller.signal.aborted || sources.get(video) !== state) return false;
        video.src = src;
        video.dataset.delivery = 'range';
      } else {
        if (response.status !== 200 || Number(response.headers.get('Content-Length')) > 2_000_000) {
          await response.body?.cancel();
          throw new Error('Camera film exceeds its budget');
        }
        const blob = await response.blob();
        if (controller.signal.aborted || sources.get(video) !== state) return false;
        // Budget is enforced at build time; keep malformed responses out of the decoder.
        if (!blob.size || blob.size > 2_000_000 || !blob.type.startsWith('video/')) throw new Error('Invalid camera film');
        state.url = URL.createObjectURL(blob);
        video.src = state.url;
        video.dataset.delivery = 'compact-buffer';
      }
      video.load();
      return true;
    })().catch(error => {
      if (error.name !== 'AbortError') video.dataset.mediaError = 'unavailable';
      if (state.url) URL.revokeObjectURL(state.url);
      if (sources.get(video) === state) sources.delete(video);
      return false;
    });
    return state.promise;
  }
  function hydrate(root) {
    root?.querySelectorAll('img[data-src]').forEach(img => {
      img.src = image(img.dataset.src);
      img.removeAttribute('data-src');
    });
  }
  window.PortfolioMedia = { image, load, release, loadSeekable, hydrate, lowMotion };
  addEventListener('pagehide', event => document.querySelectorAll('video').forEach(video => {
    // A back/forward-cache snapshot needs its sources when restored.
    if (event.persisted) video.pause(); else release(video);
  }));
})();
