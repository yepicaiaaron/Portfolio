(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,clamp=n=>Math.max(0,Math.min(1,n));
 const story=document.querySelector('#screen-story'),paper=document.querySelector('.screen-paper'),titles=[...document.querySelectorAll('.flying-title')];
 function letters(el){const value=el.textContent;el.textContent='';return [...value].map(ch=>{const s=document.createElement('span');s.className='matrix-letter';s.textContent=ch===' '?'\u00a0':ch;s.dataset.char=s.textContent;s.setAttribute('aria-hidden','true');el.append(s);return s})}
 const titleLetters=titles.map(el=>[...el.querySelectorAll('.title-line')].flatMap(letters));
 const interactive=document.querySelector('.interactive-text'),hoverLetters=letters(interactive);
 interactive.setAttribute('role','button');interactive.setAttribute('aria-label','I’ve always wanted to work on what’s coming next. Play letter animation');
 function ripple(){if(reduce)return;hoverLetters.forEach((s,i)=>{s.getAnimations().forEach(a=>a.cancel());s.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)',textShadow:'5px 8px 0 #147aa980, -5px -8px 0 #77e3e650'},{transform:'translateY(0)'}],{duration:750,delay:i*18,easing:'cubic-bezier(.2,.8,.2,1)'})})}
 interactive.addEventListener('pointerenter',ripple);interactive.addEventListener('focus',ripple);interactive.addEventListener('click',ripple);interactive.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ripple()}});
 let px=0,py=0,mx=0,my=0;
 paper.addEventListener('pointermove',e=>{const r=paper.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;schedule()});paper.addEventListener('pointerleave',()=>{px=0;py=0;schedule()});
 const cv=document.createElement('canvas');cv.className='matrix-atmosphere';cv.setAttribute('aria-hidden','true');paper.prepend(cv);const ctx=cv.getContext('2d');
 let width=0,height=0,lastPaint=0,raf=0;
 function resize(){width=paper.clientWidth;height=paper.clientHeight;const d=Math.min(devicePixelRatio||1,1.5);cv.width=width*d;cv.height=height*d;if(ctx)ctx.setTransform(d,0,0,d,0,0);schedule()}
 function schedule(){if(!raf)raf=requestAnimationFrame(draw)}
 function draw(t){raf=0;const reading=document.body.classList.contains('reading'),raw=window.__storyTimeline?.position??0;
 mx+=(px-mx)*.08;my+=(py-my)*.08;
 const hero=document.querySelector('#hero'),hp=scrollY/(hero.offsetHeight-innerHeight),visible=hp>.37&&hp<.50;interactive.style.pointerEvents=visible?'auto':'none';interactive.tabIndex=visible?0:-1;interactive.parentElement.setAttribute('aria-hidden',String(!visible));
 const opening=raw<1&&!reading&&!reduce;paper.classList.toggle('title-sequence',opening);
 titles.forEach((el,row)=>{const local=(raw-row*.49)/.49;el.style.visibility=reduce||reading||local>=0&&local<1?'visible':'hidden';titleLetters[row].forEach((s,i)=>{const enter=reduce||reading?1:clamp((local-i*.013)/.29),settle=1-Math.pow(1-enter,4),leave=reduce||reading?0:clamp((local-.79)/.21),sign=i%2?1:-1,x=(1-settle)*sign*(width*.7+i*22),y=(1-settle)*((i%3)-1)*height*.65;s.style.opacity=String(clamp(enter*4)*(1-leave));s.style.filter=`blur(${(1-settle)*15+leave*8}px)`;s.style.transform=`translate3d(${x+mx*(i%3+1)*9}px,${y+my*(i%4+1)*6}px,${-(1-settle)*1800+leave*650}px) rotateY(${(1-settle)*sign*100}deg) scale(${1+leave*.9})`})});
 if(ctx&&t-lastPaint>32){lastPaint=t;ctx.clearRect(0,0,width,height);if(opening){const cx=width*(.5+mx*.15),cy=height*(.5+my*.12);for(let i=0;i<110;i++){const a=i*2.39996,depth=((t*.00013+i*.019)%1),r=depth*depth*Math.max(width,height)*.8,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.strokeStyle=`rgba(62,187,225,${depth*.3})`;ctx.lineWidth=depth*1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx+(x-cx)*(1+depth*.1),cy+(y-cy)*(1+depth*.1));ctx.stroke();ctx.fillStyle=`rgba(112,224,245,${depth*.55})`;ctx.font=`${10+depth*10}px monospace`;ctx.fillText(String(i%2),x,y)}}else{ctx.font='12px monospace';for(let col=0;col<Math.ceil(width/32);col++){const x=col*32+16;for(let k=0;k<5;k++){const y=(col*97+(reduce?0:t*.00004*height)+k*22)%height;ctx.fillStyle=`rgba(23,111,145,${x<width*.12||x>width*.88?.13:.035})`;ctx.fillText(String((col*7+k)%10),x,y)}}}}
 if(!reduce&&!reading&&!document.hidden&&scrollY>story.offsetTop-innerHeight&&scrollY<story.offsetTop+story.offsetHeight)schedule();
 }
 document.querySelectorAll('.scene-art').forEach(art=>{const overlay=document.createElement('span');overlay.className='matrix-image-code';overlay.setAttribute('aria-hidden','true');overlay.textContent='01001 10110 00101\n10110 01001 11010\n00101 11010 01001';art.append(overlay)});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',schedule);new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});resize();
})();
