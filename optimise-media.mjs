// Run with paths to ffmpeg and sharp; originals are never overwritten.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const [ffmpeg, sharpPath] = process.argv.slice(2);
if (!ffmpeg || !sharpPath) throw new Error('Usage: node optimise-media.mjs FFMPEG SHARP_MODULE');
const sharp = createRequire(import.meta.url)(sharpPath);
const output = 'dist/assets/optimised';
await fs.mkdir(output, { recursive: true });
const imageMap = {};
for (const name of await fs.readdir('dist/assets')) {
  if (!/\.(png|jpe?g)$/i.test(name)) continue;
  const target = name.replace(/\.[^.]+$/, '.webp');
  await sharp('dist/assets/' + name).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 79, effort: 6 }).toFile(output + '/' + target);
  imageMap['assets/' + name] = 'assets/optimised/' + target;
}
await sharp('dist/assets/bsh-shared-imagination.png').resize(256, 256).webp({ quality: 85 }).toFile(output + '/cinema-map.webp');
const clips = [
  ['aaron-room.mp4', 'audience-desktop.mp4', 960, 24, 28, 48],
  ['aaron-room.mp4', 'audience-mobile.mp4', 640, 24, 29, 48],
  ['aaron-pan-to-screen.mp4', 'turn-desktop.mp4', 960, 30, 26, 12],
  ['aaron-pan-to-screen.mp4', 'turn-mobile.mp4', 640, 24, 27, 12],
  ['research-talking-head.mp4', 'research.mp4', 256, 20, 29, 40],
];
for (const [input, name, width, fps, crf, keyint] of clips) {
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', 'dist/assets/' + input,
    ...(input === 'aaron-room.mp4' ? ['-t', '8'] : []),
    '-map', '0:v:0', '-an', '-vf', `scale=${width}:-2,fps=${fps}`, '-c:v', 'libx264', '-preset', 'slow',
    '-crf', String(crf), '-pix_fmt', 'yuv420p', '-g', String(keyint), '-keyint_min', String(keyint),
    '-sc_threshold', '0', '-movflags', '+faststart', output + '/' + name], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Failed to encode ' + name);
}
await fs.writeFile('dist/js/media-assets.js', 'window.PortfolioImageAssets=' + JSON.stringify(imageMap) + ';\n');
console.table(await Promise.all(clips.map(async ([,name]) => ({ file: name, bytes: (await fs.stat(output + '/' + name)).size }))));
