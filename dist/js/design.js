(() => {
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=document.querySelector('#idea-canvas'),ctx=canvas.getContext('2d');
let w=0,h=0,active=false,raf=0;
const points=Array.from({length:42},(_,i)=>({x:((i*0.61803398875)%1),y:((i*0.41421356)%1),phase:i*1.7}));
function resize(){w=canvas.clientWidth;h=canvas.clientHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw(0)}
function draw(t){ctx.clearRect(0,0,w,h);const p=points.map(n=>({x:n.x*w+Math.sin(t*.00015+n.phase)*25,y:n.y*h+Math.cos(t*.00012+n.phase)*25}));ctx.lineWidth=.7;for(let i=0;i<p.length;i++){for(let j=i+1;j<p.length;j++){const d=Math.hypot(p[i].x-p[j].x,p[i].y-p[j].y);if(d<190){ctx.strokeStyle=`rgba(187,222,144,${(1-d/190)*.32})`;ctx.beginPath();ctx.moveTo(p[i].x,p[i].y);ctx.lineTo(p[j].x,p[j].y);ctx.stroke()}}ctx.fillStyle='#b9d293';ctx.beginPath();ctx.arc(p[i].x,p[i].y,2,0,Math.PI*2);ctx.fill()}if(active&&!reduced)raf=requestAnimationFrame(draw)}
new IntersectionObserver(([entry])=>{active=entry.isIntersecting;cancelAnimationFrame(raf);if(active)draw(performance.now())}).observe(canvas);window.addEventListener('resize',resize);resize();
if(!reduced){const images=[...document.querySelectorAll('.project-image img')];let pending=false;function update(){images.forEach(img=>{const r=img.parentElement.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){const v=(r.top+r.height/2-innerHeight/2)/innerHeight;img.style.transform=`translateY(${Math.max(-12,Math.min(0,-5+v*5))}%)`}});pending=false}addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});update()}
})();
