import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const el=()=>({style:{},hidden:false,innerHTML:'',textContent:'',append(){},setAttribute(){},querySelector(){return el()},querySelectorAll(){return Array.from({length:5},el)}});
const context={window:{addEventListener(){}},document:{querySelector:el,createElement:el,addEventListener(){}},innerWidth:1440,innerHeight:900,fetch:async path=>({ok:true,arrayBuffer:async()=>{const b=fs.readFileSync('dist/'+path);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}),Uint8Array,Math};
vm.runInNewContext(fs.readFileSync('dist/js/digit-story.js','utf8'),context);
await new Promise(resolve=>setTimeout(resolve,20));
const story=context.window.DigitStory;
let last=-1;
for(let p=0;p<=1;p+=.001){const v=story.timeline(p);assert(v>=last-1e-9,'Camera timeline reverses');last=v}
assert(Math.abs(story.timeline(.74)-.44)<1e-8);
assert(Math.abs(story.timeline(1)-1)<1e-8);
assert.equal(story.reveal(.65),0);
assert.equal(story.reveal(.74),1,'Real video must be fully visible before camera turn');
assert(story.timeline(.74)<.50,'Reveal overlaps start of camera turn');
for(let p=.77;p<=1;p+=.01)assert.equal(story.reveal(p),1,'Code obscures camera turn');
for(let p=.15;p<.65;p+=.002){const pose=story.boatPose(p);assert.equal(pose.y,story.surface(pose.x,p),'Boat disconnected from wave');assert(Math.abs(story.surface(.5,p+.001)-story.surface(.5,p))<.003,'Wave jumps');}
const source=fs.readFileSync('dist/js/digit-story.js','utf8');
assert(!source.includes('digit-story-tech'),'Career categories still attached to boat');
assert(!source.includes('boat*=crew'),'Staged boarding still present');
assert(source.includes('experiences that<br>drive engagement.'));
assert(fs.readFileSync('dist/assets/essex-logo.svg','utf8').startsWith('<svg'));
for(const p of [.18,.30,.40,.53]){const b=new Float32Array(144*90);story.paint(b,144,90,p,1000);assert(b.some(x=>x>.5),'Empty guide at '+p);assert(b.every(Number.isFinite));story.update(p)}
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.indexOf('js/digit-story.js')<html.indexOf('js/digit-hero.js'));
assert(!html.includes('class="film-poster"'),'Rejected ark render still visible');
for(const name of ['wave','boat'])assert.equal(fs.statSync(`dist/assets/digit-${name}.bin`).size,48*128*72);
console.log('Digit guides, scene energy, script order and monotonic 180-degree camera handoff passed.');
