(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(n)=>Math.max(0,Math.min(1,n));
  const story=document.querySelector('#screen-story'),paper=document.querySelector('.screen-paper');
  const titleEls=[...document.querySelectorAll('.flying-title')];
  function letters(el){const value=el.textContent;el.textContent='';return [...value].map((ch,i)=>{const s=document.createElement('span');s.className='matrix-letter';s.textContent=ch===' '?'\u00a0':ch;s.setAttribute('aria-hidden','true');s.dataset.char=ch;el.append(s);return s})}
  const titleLetters=titleEls.map(letters);
  const interactive=document.querySelector('.interactive-text');
  const hoverLetters=letters(interactive);
  interactive.tabIndex=0;interactive.setAttribute('role','button');interactive.setAttribute('aria-label','Real-time video excites me. Play letter animation');
  function ripple(){if(reduce)return;hoverLetters.forEach((s,i)=>{s.getAnimations().forEach(a=>a.cancel());s.animate([{transform:'translateY(0)',textShadow:'none'},{transform:'translateY(-7px)',color:'#b6efff',textShadow:'3px 3px 0 #147aa980, -3px -3px 0 #77e3e650'},{transform:'translateY(0)',textShadow:'none'}],{duration:600,delay:i*22,easing:'ease-out'})})}
  interactive.addEventListener('pointerenter',ripple);interactive.addEventListener('focus',ripple);interactive.addEventListener('click',ripple);interactive.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ripple()}});
  let pointerX=0,pointerY=0;
  paper.addEventListener('pointermove',e=>{const r=paper.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;schedule()});
  paper.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;schedule()});
  const cv=document.createElement('canvas');cv.className='matrix-atmosphere';cv.setAttribute('aria-hidden','true');paper.prepend(cv);const ctx=cv.getContext('2d');
  let width=0,height=0,lastPaint=0,raf=0;
  function resize(){width=paper.clientWidth;height=paper.clientHeight;const d=Math.min(devicePixelRatio||1,1.5);cv.width=width*d;cv.height=height*d;ctx.setTransform(d,0,0,d,0,0);schedule()}
  function schedule(){if(!raf)raf=requestAnimationFrame(draw)}
  function draw(t){raf=0;const reading=document.body.classList.contains('reading');const raw=clamp((scrollY-story.offsetTop)/(story.offsetHeight-innerHeight))*document.querySelectorAll('.film-scene').length;
    const hero=document.querySelector('#hero');const hp=scrollY/(hero.offsetHeight-innerHeight);const introVisible=hp>.37&&hp<.50;interactive.style.pointerEvents=introVisible?'auto':'none';interactive.tabIndex=introVisible?0:-1;interactive.parentElement.setAttribute('aria-hidden',String(!introVisible));
    titleLetters.forEach((list,row)=>list.forEach((s,i)=>{const settled=reduce||reading?1:clamp((raw-(row?.32:.04)-i*.006)/.24);const smooth=1-Math.pow(1-settled,3),depart=reduce||reading?0:clamp((raw-.83)/.17);const distance=1-smooth;const sign=i%2?1:-1;s.style.opacity=String(clamp(settled*3)*(1-depart));s.style.transform=`translate3d(${distance*sign*(110+i*12)+pointerX*(i%4+1)*4}px,${distance*(row?220:-200)+pointerY*(i%3+1)*5-depart*90}px,${distance*350}px) rotate(${distance*sign*65}deg)`}));
    if(t-lastPaint>80){lastPaint=t;ctx.clearRect(0,0,width,height);ctx.font='12px monospace';const tick=reduce?0:t*.00004;for(let col=0;col<Math.ceil(width/32);col++){const x=col*32+16;for(let k=0;k<5;k++){const y=((col*97+tick*height+k*22)%height);const edge=x<width*.12||x>width*.88;ctx.fillStyle=`rgba(23,111,145,${edge?.13:.035})`;ctx.fillText(String((col*7+k+Math.floor(t/420))%10),x,y)}}}
    if(!reduce&&!reading&&!document.hidden&&scrollY>story.offsetTop-innerHeight&&scrollY<story.offsetTop+story.offsetHeight)schedule();
  }
  const arts=document.querySelectorAll('.scene-art');arts.forEach(art=>{const overlay=document.createElement('span');overlay.className='matrix-image-code';overlay.setAttribute('aria-hidden','true');overlay.textContent='01001 10110 00101\n10110 01001 11010\n00101 11010 01001';art.append(overlay)});
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&!reduce)ripple()}),{threshold:.5});io.observe(interactive);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',schedule);new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});resize();
})();
