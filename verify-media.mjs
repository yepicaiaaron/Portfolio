import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const runtime = fs.readFileSync('dist/js/media-runtime.js', 'utf8');
function harness(fetch, mobile = false) {
  const calls = [], revoked = [], events = {}, videos = [];
  const context = {
    window: { PortfolioImageAssets: { 'assets/test.png': 'assets/optimised/test.webp' } },
    matchMedia: query => ({ matches: query.includes('max-width') && mobile }),
    AbortController,
    URL: { createObjectURL: () => 'blob:compact-film', revokeObjectURL: url => revoked.push(url) },
    fetch: (...args) => { calls.push(args); return fetch(...args); },
    addEventListener: (event, fn) => { events[event] = fn; },
    document: { querySelectorAll: () => videos },
  };
  vm.runInNewContext(runtime, context);
  const video = () => {
    const v = {
      dataset: { src: 'desktop.mp4', mobileSrc: 'mobile.mp4' }, loads: 0, pauses: 0,
      hasAttribute: name => Object.hasOwn(v, name),
      removeAttribute: name => { delete v[name]; },
      load: () => { v.loads++; }, pause: () => { v.pauses++; },
    };
    videos.push(v);
    return v;
  };
  return { media: context.window.PortfolioMedia, calls, revoked, events, video };
}
const response = (status, headers = {}, blob = { size: 1_000_000, type: 'video/mp4' }) => ({
  status, ok: status >= 200 && status < 300,
  headers: { get: name => headers[name] || null },
  body: { cancel: async () => {} }, blob: async () => blob,
});

// Nothing requests a video simply by creating its element / loading the runtime.
{
  const h = harness(async () => response(200), true), v = h.video();
  assert.equal(h.calls.length, 0);
  h.media.load(v); h.media.load(v);
  assert.equal(v.src, 'mobile.mp4'); assert.equal(v.loads, 1);
  h.media.release(v); assert.equal(v.src, undefined);
  h.media.load(v); assert.equal(v.loads, 3);
  const img = { dataset: { src: 'assets/test.png' }, removeAttribute() { delete this.dataset.src; } };
  h.media.hydrate({ querySelectorAll: () => [img] });
  assert.equal(img.src, 'assets/optimised/test.webp');
  assert.equal(img.dataset.src, undefined);
}
// Range-capable delivery uses the native URL, never a second application fetch.
{
  const h = harness(async () => response(206, { 'Content-Range': 'bytes 0-0/1100000' }));
  const v = h.video();
  await h.media.loadSeekable(v); await h.media.loadSeekable(v);
  assert.equal(v.dataset.delivery, 'range'); assert.equal(v.src, 'desktop.mp4');
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0][1].headers.Range, 'bytes=0-0');
}
// The production host's 200 response becomes one small seekable buffer.
{
  const h = harness(async () => response(200)), v = h.video();
  assert.equal(await h.media.loadSeekable(v), true);
  assert.equal(v.dataset.delivery, 'compact-buffer'); assert.equal(v.src, 'blob:compact-film');
  assert.equal(h.calls.length, 1);
  h.events.pagehide({ persisted: true }); assert.equal(v.src, 'blob:compact-film');
  h.events.pagehide({ persisted: false }); assert.equal(v.src, undefined);
  assert.deepEqual(h.revoked, ['blob:compact-film']);
  assert.equal(h.calls[0][1].signal.aborted, true);
  assert.equal(v.dataset.delivery, undefined);
}
// A late response must not reattach a video after scrolling out of the hero.
for (const status of [200, 206]) {
  let resolve;
  const h = harness(() => new Promise(done => { resolve = done; })), v = h.video();
  const pending = h.media.loadSeekable(v);
  h.media.release(v);
  resolve(response(status, { 'Content-Range': 'bytes 0-0/1100000' }));
  assert.equal(await pending, false); assert.equal(v.src, undefined);
}
// Release can happen while a compliant response stream is being cancelled.
{
  let cancelDone, cancelStarted;
  const cancelling = new Promise(done => { cancelStarted = done; });
  const reply = response(206, { 'Content-Range': 'bytes 0-0/1100000' });
  reply.body.cancel = () => new Promise(done => { cancelDone = done; cancelStarted(); });
  const h = harness(async () => reply), v = h.video();
  const pending = h.media.loadSeekable(v);
  await cancelling; h.media.release(v); cancelDone();
  assert.equal(await pending, false); assert.equal(v.src, undefined);
}
for (const reply of [response(404), response(200, {}, { size: 2_000_001, type: 'video/mp4' }),
  response(200, {}, { size: 100, type: 'text/html' }), response(206)]) {
  const h = harness(async () => reply), v = h.video();
  assert.equal(await h.media.loadSeekable(v), false);
  assert.equal(v.src, undefined); assert.equal(v.dataset.mediaError, 'unavailable');
}

const root = 'dist/assets/optimised/';
const budgets = { 'audience-desktop.mp4': 850_000, 'audience-mobile.mp4': 450_000,
  'turn-desktop.mp4': 1_200_000, 'turn-mobile.mp4': 500_000, 'research.mp4': 120_000 };
for (const [name, max] of Object.entries(budgets)) {
  const file = fs.readFileSync(root + name);
  assert(file.length < max, `${name} exceeds ${max} byte budget`);
  // Fast-start metadata must precede video data, so decoding need not wait for EOF.
  const atoms = [];
  for (let offset = 0; offset + 8 <= file.length;) {
    let size = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    if (size === 1) size = Number(file.readBigUInt64BE(offset + 8));
    atoms.push(type); if (!size) break; offset += size;
  }
  assert(atoms.includes('moov') && atoms.indexOf('moov') < atoms.indexOf('mdat'), `${name}: fast start missing`);
}
const html = fs.readFileSync('dist/index.html', 'utf8');
for (const video of html.matchAll(/<video\b[^>]+>/g)) {
  assert(video[0].includes('preload="none"'));
  assert(!/\s(?:src|autoplay)=/.test(video[0]));
}
assert(!html.includes('<source '), 'Eager video source reintroduced');
const narrative = fs.readFileSync('dist/js/narrative.js', 'utf8');
assert(narrative.includes('data-src='), 'Stacked chapter pictures must be explicitly deferred');
const map = JSON.parse(fs.readFileSync('dist/js/media-assets.js', 'utf8').slice('window.PortfolioImageAssets='.length).trim().replace(/;$/, ''));
for (const path of Object.values(map)) {
  const data = fs.readFileSync('dist/' + path);
  assert.equal(data.toString('ascii', 8, 12), 'WEBP', `${path} is not WebP`);
}
const initial = new Set(['dist/index.html', root + 'aaron-room-poster.webp', 'dist/assets/fonts/homemade.woff2',
  ...[...html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+)(?:\?[^"]*)?"/g)].map(m => 'dist/' + m[1])]);
const initialBytes = [...initial].reduce((sum, path) => sum + fs.statSync(path).size, 0);
assert(initialBytes < 300_000, 'Local HTML, scripts, styles, poster and handwriting font exceed 300 KB');
console.log(`Media delivery, cancellation races, lazy loading, WebP and fast-start budgets passed. Local core assets: ${initialBytes} bytes uncompressed (excludes external Inter font and later media).`);
