# Media performance and cinema delivery

The opening keeps its original continuous digit field and actual 180-degree camera footage. No frame-by-frame image sequence or additional rendering library is loaded.

## Delivery

- First paint: matching WebP poster, HTML, CSS, scripts and handwriting font. The local core files total 236,490 bytes uncompressed, excluding the external Inter font, secondary artwork and later video. This is a file-size budget, not a measured network or process-memory figure.
- Idle opening: 8-second H.264 face loop, 786,671 bytes desktop / 405,649 bytes mobile.
- Research beat: Aaron's own 405,649-byte mobile audience derivative. Load near the beat, play only while used, release outside it; no third-party demonstration clip.
- Approach to cinema: 1,099,389-byte desktop turn / 447,142-byte mobile turn. Fast-start MP4 metadata and a keyframe every 0.4/0.5 seconds allow efficient seeking.
- Current video derivatives total 2,594,291 bytes on desktop (audience, turn, crystal and research audience) / 1,155,373 unique bytes on mobile (the audience derivative is reused for research), down from the original 9,840,988-byte opening. They are not all downloaded at entry; these file-size sums are not measured network totals.
- Stacked chapter images receive a source only for the current and neighbouring chapters. Images are WebP, at most 1280px, preserving transparent cutouts. Case-study players remain click-to-load.

The current production static host was observed returning HTTP 200 to a byte-range request. `media-runtime.js` probes a single byte. On a compliant 206 response, the video element streams natively. On a 200 response, that same compact response becomes a seekable Blob; there is no second application download. The bounded buffer is released after the hero. This fixes host-incompatible seeking without changing hosting configuration.

The canvas backing store is capped at 1.8 million pixels (at most 1.5 DPR). Luminance arrays are reused. Drawing stops offscreen/when hidden, and idles after the digits disappear. Hidden face playback is paused during the research/creative shapes; hero decoders are released after the handoff. This does not promise a fixed total browser-memory number, since decoder and GPU allocations vary by device.

## Build and tests

`node build.mjs` uses the checked-in compact derivatives. No FFmpeg dependency is needed for normal builds.

To regenerate derivatives, install FFmpeg and Sharp, then run `node optimise-media.mjs <ffmpeg-executable> <sharp-module-directory>`. Original media is retained and never overwritten. Check the budgets again after re-encoding.

Run:

```
node build.mjs
node verify-opening.mjs
node verify-collection.mjs
node verify-story-motion.mjs
node verify-media.mjs
```

The media tests cover mobile selection, deferred sources, native range delivery, whole-file fallback, cancellation races, malformed responses, Blob cleanup, WebP signatures, byte budgets and fast-start metadata. Desktop browser QA checked audience and screen frames in forward/reverse scrolling, crystal reveal and lazy chapter artwork. Mobile layout remains unverified: the browser viewport override did not change the reported 813×778 dimensions. Passing source tests alone does not establish a successful deployment.

## Authoring sources

### September 11 additions

The crystal animation adds a 302,582-byte H.264 loop and a 32,434-byte WebP fallback, loaded only as the crystal beat approaches. Its decoder pauses/releases outside that beat. The research beat now uses Aaron's own compact audience video, replacing the third-party demonstration. Customer logos, speaking photography and StoryMachine images still use chapter-scoped hydration. Google Calendar is created only after a booking click and removed on close. Run `node verify-feedback.mjs` for the new regressions. Current local JS/CSS/core-assets total is 236,490 bytes uncompressed, excluding fonts and deferred media; this is not a claimed whole-session network total.

Edit `effects-original.js`, not its generated `dist/js/opening.js`. The build regenerates the opening and index, fingerprints script/style URLs, and maps the hero to the compact assets. `dist/js/media-runtime.js`, `digit-hero.js`, `pioneer-morph.js`, `narrative.js`, `story-motion.js` and `project-reader.js` are authored directly.
