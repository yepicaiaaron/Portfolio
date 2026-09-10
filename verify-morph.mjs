import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const el=()=>({style:{},dataset:{},append(){},setAttribute(){},addEventListener(){},paused:true,currentTime:1,readyState:2,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true},querySelector:el,querySelectorAll:()=>Array.from({length:5},el),getContext(){return{fillText(){},drawImage(){},getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let k=0;k<w*h;k++)if(k%5===0)data.fill(255,k*4,k*4+4);return{data}}}}});
const media=[];
const context={window:{addEventListener(){}},addEventListener(){},document:{body:{append(v){media.push(v)}},querySelector:el,createElement:el,addEventListener(){}},Image:class{set src(v){this.onload?.()}},performance:{now:()=>5000},innerWidth:1440,innerHeight:900,Float32Array,Uint8Array,Math};
vm.runInNewContext(fs.readFileSync('dist/js/pioneer-intro.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('dist/js/pioneer-morph.js','utf8'),context);
const n=144*90,base=new Float32Array(n).fill(.5),m=context.window.DigitMorph;
assert.deepEqual(Array.from(m.ready()),['build','see','cinema']);
const researchVideo=media.find(v=>v.id==='research-video-source');
assert(researchVideo.muted&&researchVideo.loop);
m.apply(base.slice(),144,90,.46,5000);assert(!researchVideo.paused);
assert.equal(m.apply(base.slice(),144,90,.46,5040).codeWeight,1);
m.apply(base.slice(),144,90,.62,5080);assert(researchVideo.paused);
for(const width of [1440,390]){
 context.innerWidth=width;
 for(const p of [0,.12,.20,.24,.32,.37,.45,.5,.58,.60,.65,.68,.74]){
  const a=m.apply(base.slice(),144,90,p),x=a.xs.slice(),y=a.ys.slice();
  const b=m.apply(base.slice(),144,90,p+.000001);
  assert.equal(a.xs,b.xs,'Particle position buffer replaced between frames');
  for(let k=0;k<n;k++){
   assert(Number.isFinite(b.xs[k])&&Number.isFinite(b.ys[k]));
   assert(Math.hypot(x[k]-b.xs[k],y[k]-b.ys[k])<.001,'Position cut at '+p);
   if(p===0||p===.65)assert(Math.hypot(x[k]-(k%144+.5)/144,y[k]-(Math.floor(k/144)+.5)/90)<1e-6,'Did not return to original portrait cell');
  }
 }
}
const intro=context.window.DigitStory;
for(let p=0;p<1;p+=.001){assert(intro.timeline(p)<=intro.timeline(p+.001));assert(intro.reveal(p)>=0&&intro.reveal(p)<=1)}
assert.equal(intro.reveal(.74),1,'Digits must disappear before camera rotation');
assert(intro.timeline(.74)<.5,'Camera starts before digit reveal completes');
for(const name of ['research-talking-head.mp4','research-talking-head-poster.jpg','github-mark-white.svg','bsh-shared-imagination.png'])assert(fs.statSync('dist/assets/'+name).size>1000);
assert(!fs.readFileSync('dist/js/pioneer-morph.js','utf8').includes('bsh-film-card.jpg'),'Intro still uses the participant credit card');
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.indexOf('js/pioneer-morph.js')<html.indexOf('js/digit-hero.js'));
const hero=fs.readFileSync('dist/js/digit-hero.js','utf8');
assert(hero.includes('portraitBrightness.set(bright)'));
console.log('Persistent particles, continuous chapter boundaries, portrait return and camera timing passed at desktop/mobile proportions.');
