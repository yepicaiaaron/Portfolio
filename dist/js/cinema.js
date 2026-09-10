(()=>{
const story=document.querySelector('#screen-story'),projection=document.querySelector('.projection'),scenes=[...document.querySelectorAll('.film-scene')],counter=document.querySelector('#scene-counter'),title=document.querySelector('#scene-title'),progress=document.querySelector('.film-progress i'),previous=document.querySelector('#previous-scene'),next=document.querySelector('#next-scene');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let reading=reduced,current=0,frame=0,target=scrollY,eased=scrollY,last=0,mx=0,my=0,px=0,py=0;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const weights=scenes.map(s=>s.classList.contains('case-scene')?2:1),starts=[];let units=0;weights.forEach(w=>{starts.push(units);units+=w});story.style.height=(units*145+100)+'vh';
function indexScroll(i,phase=.35){return story.offsetTop+(starts[i]+phase*weights[i])/units*(story.offsetHeight-innerHeight)}
function go(i,phase=.35){i=clamp(i,0,scenes.length-1);if(reading)scenes[i].scrollIntoView({behavior:'auto'});else scrollTo({top:indexScroll(i,phase),behavior:reduced?'auto':'smooth'})}
function paint(now=0){frame=0;const dt=Math.min(.05,(now-last)/1000||.016);last=now;eased+=(target-eased)*(reduced?1:1-Math.exp(-dt*9));if(Math.abs(target-eased)<.2)eased=target;mx+=(px-mx)*.12;my+=(py-my)*.12;
const start=story.offsetTop,span=story.offsetHeight-innerHeight,position=clamp((eased-start)/span,0,.99999)*units;current=starts.findLastIndex(s=>position>=s);current=Math.max(0,current);const phase=(position-starts[current])/weights[current];window.__storyTimeline={position:current+phase,phase,index:current,reading,mx,my};
// An opaque handoff only after the audience-to-screen camera move has finished.
projection.style.setProperty('--projection-opacity',reading||eased>=start?1:0);
projection.classList.toggle('pre-film',!reading&&current===0);
scenes.forEach((scene,i)=>{const local=(position-starts[i])/weights[i],active=reading||i===current,focused=active;scene.classList.toggle('active',active);scene.inert=!focused;scene.setAttribute('aria-hidden',String(!focused));
if(!active){scene.style.opacity='0';return}const enter=smooth((local+.065)/.20),exit=smooth((local-.9)/.165);scene.style.opacity=reading?'1':String(enter*(1-exit));
scene.querySelectorAll('[data-enter]').forEach((el,k)=>{if(reading){el.style.transform='none';el.style.opacity='1';return}const isArt=el.classList.contains('scene-art'),side=scene.classList.contains('reverse')?-1:1;const x=(1-enter)*side*(isArt?38:-12)-exit*side*20;const z=(1-enter)*(isArt?-500:80)+exit*160;const tilt=(1-enter)*side*(isArt?-16:3);el.style.transform='translate3d('+x+'%,'+((1-enter)*8-exit*6)+'%,'+z+'px) rotateY('+tilt+'deg)';el.style.opacity=String(isArt?enter:clamp(enter*1.2));
if(isArt)el.querySelectorAll('.photo,.person-cutout,.floating-note,.giant-word').forEach((layer,j)=>{const depth=layer.classList.contains('person-cutout')?1.4:(j+1)*.5;layer.style.transform='translate3d('+(mx*depth*16)+'px,'+((local-.5)*-28*depth+my*depth*10)+'px,0) scale('+(1+clamp(local)*.045*depth)+')';});
});
const beats=[...scene.querySelectorAll('.case-beat')],beat=clamp(Math.floor((local-.18)/.245),0,2);beats.forEach((b,j)=>{b.hidden=!reading&&j!==beat});scene.querySelectorAll('.case-beat-nav button').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===beat)));
});
counter.textContent=String(current+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');title.textContent=scenes[current].dataset.title;progress.style.transform='scaleX('+position/units+')';previous.disabled=current===0;next.disabled=current===scenes.length-1;
if(eased!==target||Math.abs(mx-px)>.001||Math.abs(my-py)>.001)frame=requestAnimationFrame(paint);
}
function update(){target=scrollY;if(!frame)frame=requestAnimationFrame(paint)}
previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
const toggle=document.querySelector('#motion-toggle');function setMode(){document.body.classList.toggle('reading',reading);toggle.textContent=reading?'Play the scroll story':'Read without motion';update()}toggle.addEventListener('click',()=>{reading=!reading;setMode();go(current)});setMode();
scenes.forEach((scene,i)=>scene.addEventListener('casechange',()=>go(i,.23+Number(scene.dataset.manualBeat)*.245)));
projection.addEventListener('pointermove',e=>{px=reduced?0:e.clientX/innerWidth-.5;py=reduced?0:e.clientY/innerHeight-.5;update()});projection.addEventListener('pointerleave',()=>{px=py=0;update()});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const dest=document.querySelector(a.getAttribute('href'));const index=scenes.indexOf(dest?.closest('.film-scene'));if(index>=0){e.preventDefault();go(index)}}));
document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-vote]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelector('#vote-result').textContent='Let’s explore '+b.dataset.vote.toLowerCase()+'. Choose a contact link to start.'}));
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
function followHash(){const index=scenes.findIndex(s=>s.id===location.hash.slice(1));if(index>=0)go(index)}addEventListener('hashchange',followHash);if(location.hash)requestAnimationFrame(followHash);
})();
