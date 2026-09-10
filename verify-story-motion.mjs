import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Deterministic state-machine test; does not open or inspect a browser.
const listeners={},frames=[];let clock=0;
function element(){const classes=new Set();return{style:{setProperty(k,v){this[k]=v}},dataset:{},inert:false,attributes:{},classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k)},contains(k){return classes.has(k)}},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){this[k]=fn},querySelectorAll(){return[]},scrollIntoView(){this.scrolled=true}}}
const scenes=Array.from({length:10},(_,i)=>{const s=element();s.id='chapter-'+i;s.dataset={title:'Chapter '+i,theme:i%2?'dark':'light'};const layers=[element(),element()];layers[0].classList.toggle('chapter-copy',true);layers[1].dataset.direction='bottom';const depth=element();depth.dataset.depth='.5';s.querySelectorAll=q=>q==='.layer'?layers:[depth];return s});
const story=element();story.offsetTop=6750;Object.defineProperty(story,'offsetHeight',{get(){return parseFloat(story.style.height)*9}});
const nodes={'#screen-story':story,'.screen-paper':element(),'.projection':element(),'#motion-toggle':element(),'#previous-scene':element(),'#next-scene':element(),'#scene-title':element(),'#scene-counter':element(),'.film-progress i':element()};
const body=element(),media={matches:false,addEventListener(){}};
const context={window:{},document:{body,querySelector:q=>nodes[q],querySelectorAll:()=>scenes,addEventListener(){}},matchMedia:()=>media,innerWidth:1440,innerHeight:900,scrollY:0,location:{hash:''},history:{replaceState(){}},requestAnimationFrame(fn){frames.push(fn);return frames.length},addEventListener(k,fn){listeners[k]=fn},scrollTo({top}){context.scrollY=top;listeners.scroll()},Math};
vm.runInNewContext(fs.readFileSync('dist/js/story-motion.js','utf8'),context);
function settle(){let guard=0;while(frames.length){assert(++guard<1000,'Animation failed to settle');frames.shift()(clock+=16)}}
settle();assert(nodes['.projection'].inert,'Hidden screen is keyboard-focusable during the intro');
for(let i=0;i<10;i++){
 context.window.PortfolioStory.go(i);settle();
 assert.equal(scenes.filter(s=>s.classList.contains('active')).length,1);
 assert(scenes[i].classList.contains('active'));assert(!scenes[i].inert);
 assert.equal(scenes[i].style.opacity,'1');
 assert.equal(nodes['.screen-paper'].dataset.theme,scenes[i].dataset.theme);
 for(let j=0;j<10;j++)if(j!==i)assert(scenes[j].inert);
}
context.scrollY=story.offsetTop+story.offsetHeight-900;listeners.scroll();settle();
assert.equal(scenes[9].style.opacity,'1','Final contact chapter disappears at the bottom');
assert(nodes['#next-scene'].disabled);
context.window.PortfolioStory.setReading(true);settle();
assert(scenes.every(s=>!s.inert&&s.style.opacity==='1'),'Reading mode hides chapters');
context.window.PortfolioStory.setReading(false);settle();
assert.equal(scenes.filter(s=>!s.inert).length,1);
context.window.PortfolioModalOpen=true;const before=scenes[9].style.opacity;context.scrollY=0;listeners.scroll();settle();assert.equal(scenes[9].style.opacity,before,'Story moves behind an open project');
context.window.PortfolioModalOpen=false;listeners['portfolio:resume']();settle();assert(nodes['.projection'].inert);
console.log('Chapter navigation, single active scene, final contact visibility, reading mode and project-pause state passed.');
