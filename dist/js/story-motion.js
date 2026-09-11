/* One screen, one active chapter, native scrolling. No scroll-event hijacking. */
(()=>{
 const story=document.querySelector('#screen-story'),paper=document.querySelector('.screen-paper'),projection=document.querySelector('.projection'),scenes=[...document.querySelectorAll('.film-scene')];
 const toggle=document.querySelector('#motion-toggle'),previous=document.querySelector('#previous-scene'),next=document.querySelector('#next-scene');
 const media=matchMedia('(prefers-reduced-motion: reduce)');let reading=media.matches,current=0,frame=0,last=0,target=scrollY,eased=scrollY,px=0,py=0,mx=0,my=0;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
 const units=scenes.length;story.style.height=(units*125+100)+'vh';
 function go(id){const index=typeof id==='number'?clamp(id,0,units-1):scenes.findIndex(s=>s.id===id);if(index<0)return;
  if(reading)scenes[index].scrollIntoView({behavior:'auto'});else scrollTo({top:story.offsetTop+(index+.38)/units*(story.offsetHeight-innerHeight),behavior:media.matches?'auto':'smooth'});
 }
 function update(){target=scrollY;if(!frame)frame=requestAnimationFrame(paint)}
 function paint(now=0){frame=0;const dt=Math.min(.05,(now-last)/1000||.016);last=now;eased+=(target-eased)*(media.matches?1:1-Math.exp(-dt*9));if(Math.abs(target-eased)<.2)eased=target;
  if(window.PortfolioModalOpen){mx=my=0;return}
  mx+=(px-mx)*.15;my+=(py-my)*.15;
  const start=story.offsetTop,position=clamp((eased-start)/(story.offsetHeight-innerHeight),0,.99999)*units;current=Math.floor(position);const local=position-current;
  projection.style.setProperty('--projection-opacity',reading||eased>=start?1:0);
  projection.inert=!reading&&eased<start;
  paper.dataset.theme=reading?'light':scenes[current].dataset.theme;
  scenes.forEach((scene,i)=>{
   const active=reading||i===current;scene.classList.toggle('active',active);scene.inert=!active;scene.setAttribute('aria-hidden',String(!active));
   // Stacked scenes share the viewport, so native lazy-loading alone loads them all.
   if(reading||((eased>=start-innerHeight)&&Math.abs(i-current)<=1))window.PortfolioMedia?.hydrate(scene);
   if(!active){scene.style.opacity='0';return}
   const enter=smooth(0,.18,local),exit=current===units-1?0:smooth(.87,1,local);scene.style.opacity=reading?'1':String(enter*(1-exit));
   scene.querySelectorAll('.layer').forEach((el,k)=>{
    if(reading){el.style.transform='none';el.style.opacity='1';return}
    const t=smooth(k===0?0:.025,k===0?.18:.26,local),off=1-t,dir=el.dataset.direction||'right',sign=dir==='left'||dir==='top'?-1:1,vertical=dir==='top'||dir==='bottom';
    const travel=(off*24+exit*-12)*sign;
    const depth=el.classList.contains('chapter-copy')?0:1;
    el.style.transform=`translate3d(${vertical?mx*depth*8:travel+mx*depth*.4}%,${vertical?travel:my*depth*.4}%,0) scale(${1-off*.07+exit*.04})`;
    el.style.opacity=String(t);
   });
   scene.querySelectorAll('.depth-layer').forEach(el=>{const d=Number(el.dataset.depth)||.5;el.style.transform=reading?'none':`translate3d(${mx*d*14}px,${(local-.5)*-34*d+my*d*12}px,0)`});
  });
  document.querySelector('#scene-title').textContent=scenes[current].dataset.title;document.querySelector('#scene-counter').textContent=String(current+1).padStart(2,'0')+' / '+String(units).padStart(2,'0');document.querySelector('.film-progress i').style.transform=`scaleX(${position/units})`;previous.disabled=current===0;next.disabled=current===units-1;
  if(eased!==target||Math.abs(mx-px)>.002||Math.abs(my-py)>.002)frame=requestAnimationFrame(paint);
 }
 function setMode(){document.body.classList.toggle('reading',reading);toggle.textContent=reading?'Play the scroll story':'Read without motion';scenes.forEach(s=>s.inert=false);update()}
 toggle.onclick=()=>{reading=!reading;setMode();go(current)};media.addEventListener('change',()=>{reading=media.matches;setMode()});
 previous.onclick=()=>go(current-1);next.onclick=()=>go(current+1);
 projection.addEventListener('pointermove',e=>{px=media.matches?0:e.clientX/innerWidth-.5;py=media.matches?0:e.clientY/innerHeight-.5;update()});projection.addEventListener('pointerleave',()=>{px=py=0;update()});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);if(scenes.some(s=>s.id===id)){e.preventDefault();history.replaceState(null,'','#'+id);go(id)}});
 function followHash(){let id=location.hash.slice(1);if(id==='speaking'||id==='consulting')id='contact';if(scenes.some(s=>s.id===id))go(id)}
 addEventListener('hashchange',followHash);addEventListener('scroll',update,{passive:true});addEventListener('resize',update);addEventListener('portfolio:resume',update);
 window.PortfolioStory={go,setReading(value){reading=value;setMode()},scenes};setMode();if(location.hash)requestAnimationFrame(followHash);
})();
