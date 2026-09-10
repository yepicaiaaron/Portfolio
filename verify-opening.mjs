import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
for(const asset of ['aaron-room.mp4','aaron-pan-to-screen.mp4']){
 assert(html.includes('assets/'+asset),`Original cinema asset missing: ${asset}`);
 assert(fs.statSync('dist/assets/'+asset).size>100000,`Empty cinema asset: ${asset}`);
}
for(const obsolete of ['cinematic-intro','story-depth','cinema','collection','case-stories','digit-story','digit-morph'])assert(!html.includes('src="js/'+obsolete+'.js'),'Obsolete effect is still loaded: '+obsolete);
assert(!html.includes('href="https://yepic.webflow.io/case-studies/'),'Case study navigation leaves the website');
const motion=fs.readFileSync('dist/js/story-motion.js','utf8');
assert(motion.includes('active=reading||i===current'),'Multiple story scenes can overlap');
assert(motion.includes('reading||eased>=start?1:0'),'Screen handoff is translucent');
const camera=fs.readFileSync('dist/js/opening.js','utf8');
for(const token of ['PAN_START = 0.50','PAN_END = 0.91','panVid.currentTime = target','window.DigitStory.timeline(rawProg)'])assert(camera.includes(token),'Camera contract changed: '+token);
const refs=[...html.matchAll(/(?:src|href)="((?:css|js|assets)\/[^"?#]+)(?:\?[^"#]*)?"/g)];
assert(refs.length>=13,'Asset matching unexpectedly skipped the fingerprinted scripts');
for(const match of refs)assert(fs.existsSync('dist/'+match[1]),'Missing local asset: '+match[1]);
assert(!fs.readFileSync('dist/css/base.css','utf8').includes('#contact h2'),'Old typography is leaking into the rebuild');
const hero=fs.readFileSync('dist/js/digit-hero.js','utf8');
assert(!hero.includes('faceShift'),'Portrait has an artificial sideways offset');
assert(hero.includes('octx.drawImage(src, sx, sy, cw, ch, 0, 0, COLS, ROWS)'),'Digit source does not fill its sampling frame');
assert(hero.includes("media.style.transform = 'none'"),'Video crop does not match its digit rendering');
const css=fs.readFileSync('dist/css/pioneer.css','utf8');
assert(css.includes("'Homemade Apple',cursive"),'Handwritten identity has been replaced by plain text');
assert(camera.includes("sp.className = 'hl'"),'Letter-by-letter handwriting effect missing');
assert(camera.includes("wordEl.className = 'handwritten-word'"),'Handwritten words can split on narrow screens');
assert(fs.readFileSync('dist/assets/fonts/homemade.woff2').subarray(0,4).toString()==='wOF2','Handwriting font missing or invalid');
console.log('Original camera sequence, full-frame portrait/digits, handwriting, single-scene handoff and all HTML assets passed.');
