/* Persistent particles: Aaron -> crystal -> research -> cinema. Camera timing is unchanged. */
(()=>{
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const lerp=(a,b,t)=>a+(b-a)*t,hash=k=>{const v=Math.sin(k*127.1+311.7)*43758.5453;return v-Math.floor(v)};
 const maps={};
 function sample(c){const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,pts=[];for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,b=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255*d[i+3]/255;if(b>.22)pts.push([x/c.width,y/c.height,b])}return pts}
 const word=document.createElement('canvas');word.width=440;word.height=140;const wc=word.getContext('2d');wc.fillStyle='#fff';wc.font='bold 88px Arial';wc.textAlign='center';wc.textBaseline='middle';wc.fillText('See.',220,70);maps.see=sample(word);
 const cinema=new Image();cinema.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(cinema,0,0,256,256);maps.cinema=sample(c)};
 function sprite(name,k){const a=maps[name];return a?.length?a[Math.floor(hash(k+9)*a.length)]:[hash(k),hash(k+1),.1]}
 function raster(id,src,poster,w,h){
  const video=document.createElement('video');Object.assign(video,{id,muted:true,defaultMuted:true,loop:true,playsInline:true,preload:'none',hidden:true});video.dataset.src=src;video.setAttribute('aria-hidden','true');document.body.append(video);
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true}),still=new Image();
  let pixels=null,last=-1,lastSample=0,playing=false,active=false;
  const draw=source=>{const sw=source.videoWidth||source.naturalWidth,sh=source.videoHeight||source.naturalHeight,scale=Math.max(w/sw,h/sh);ctx.drawImage(source,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);pixels=ctx.getImageData(0,0,w,h).data};
  still.onload=()=>{if(!pixels)draw(still)};
  const play=()=>{if(active&&video.paused&&!playing){playing=true;video.play()?.catch(()=>{playing=false})}};video.addEventListener('canplay',play);
  function update(load,run,now){active=run&&!document.hidden&&!window.PortfolioMedia.lowMotion.matches;if(load){if(!still.src)still.src=poster;if(!window.PortfolioMedia.lowMotion.matches)window.PortfolioMedia.load(video)}else if(video.hasAttribute('src')){window.PortfolioMedia.release(video);last=-1;playing=false}
   if(active)play();else{video.pause();playing=false}if(active&&video.readyState>=2&&video.currentTime!==last&&now-lastSample>45){draw(video);last=video.currentTime;lastSample=now}
  }
  return {video,still,update,suspend(){active=false;playing=false;last=-1;window.PortfolioMedia.release(video)},light(u,v){if(!pixels)return 0;const i=(Math.min(h-1,Math.floor(v*h))*w+Math.min(w-1,Math.floor(u*w)))*4;return Math.pow(Math.max(0,(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255-.025),.7)}};
 }
 const crystal=raster('crystal-video-source','assets/optimised/crystal-future.mp4','assets/optimised/crystal-future.webp',160,146);
 // Aaron's own footage replaces the licensed third-party research demo.
 const research=raster('research-video-source','assets/optimised/audience-mobile.mp4','assets/optimised/aaron-portrait.webp',128,128);
 const revealButton=document.createElement('button');revealButton.className='crystal-reveal';revealButton.type='button';revealButton.setAttribute('aria-label','Reveal the future inside the crystal ball');revealButton.setAttribute('aria-pressed','false');revealButton.innerHTML='<span>Hover or tap to look inside</span>';revealButton.hidden=true;document.querySelector('.hero-sticky').append(revealButton);
 let pinned=false,reveal=0,crystalWeight=0,rect=null;
 revealButton.onclick=()=>{pinned=!pinned;revealButton.setAttribute('aria-pressed',String(pinned))};
 function crystalRect(){const mobile=innerWidth<700,w=mobile?Math.min(innerWidth*.92,innerHeight*.285*576/528):Math.min(innerWidth*.48,innerHeight*.64*576/528),h=w*528/576;return{x:(mobile?.5:.755)*innerWidth-w/2,y:(mobile?.62:.46)*innerHeight-h/2,w,h}}
 function rasterPoint(source,k,cols,rows,box,gain=1){const cells=Math.ceil(cols*rows/3),nx=Math.round(Math.sqrt(cells*box.w/box.h)),ny=Math.ceil(cells/nx),cell=Math.floor(k/3),u=(cell%nx+.5)/nx,v=(Math.floor(cell/nx)+.5)/ny;return[(box.x+u*box.w)/innerWidth,(box.y+v*box.h)/innerHeight,k%3===0?Math.min(1,source.light(u,v)*gain):.018]}
 let xs=new Float32Array(),ys=new Float32Array();const times=[.12,.24,.37,.50,.60],ends=[.20,.32,.45,.58,.65];
 function phase(p){let scene=0,t=0;for(let i=0;i<times.length;i++)if(p>=times[i]){scene=i;t=smooth(times[i],ends[i],p)}return{scene,t}}
 function target(scene,k,cols,rows,base){
  if(scene===0||scene===5)return[(k%cols+.5)/cols,(Math.floor(k/cols)+.5)/rows,base];
  if(scene===1)return rasterPoint(crystal,k,cols,rows,rect,1.3);
  if(scene===3){const mobile=innerWidth<700,s=mobile?Math.min(innerWidth*.76,innerHeight*.29):Math.min(innerWidth*.41,innerHeight*.58);return rasterPoint(research,k,cols,rows,{x:(mobile?.5:.755)*innerWidth-s/2,y:(mobile?.62:.42)*innerHeight-s/2,w:s,h:s})}
  if(scene===2){const q=sprite('see',k),x=q[0],y=.22+q[1]*.42;return innerWidth<700?[x*.9+.05,y*.30+.52,q[2]*.8]:[x*.46+.51,y*.66+.13,q[2]*.8]}
  const q=sprite('cinema',k),mobile=innerWidth<700,size=mobile?Math.min(innerWidth*.88,innerHeight*.29):Math.min(innerWidth*.46,innerHeight*.82);return[(mobile?.5:.755)+(q[0]-.5)*size/innerWidth,(mobile?.735:.49)+(q[1]-.5)*size/innerHeight,q[2]*.95];
 }
 function apply(bright,cols,rows,p,now){
  crystal.update(p>=.09&&p<.34,p>=.12&&p<.33,now);research.update(p>=.29&&p<.60,p>=.34&&p<.60,now);if(p>=.43&&!cinema.src)cinema.src='assets/optimised/cinema-map.webp';rect=crystalRect();
  const pointer=window.DigitStory.pointer(),cx=rect.x+rect.w*.5,cy=rect.y+rect.h*.493,r=rect.w*.25;
  crystalWeight=smooth(.12,.20,p)*(1-smooth(.24,.32,p));const available=p>=.195&&p<.255;
  revealButton.hidden=!available;Object.assign(revealButton.style,{left:(cx-r)+'px',top:(cy-r)+'px',width:r*2+'px',height:r*2+'px'});
  if(!available){pinned=false;revealButton.setAttribute('aria-pressed','false')}
  const hovered=Math.hypot(pointer.x*innerWidth-cx,pointer.y*innerHeight-cy)<r;
  reveal+=((available&&(hovered||pinned)?1:0)-reveal)*.16;
  if(xs.length!==bright.length){xs=new Float32Array(bright.length);ys=new Float32Array(bright.length)}
  const{scene,t}=phase(p),amount=smooth(.12,.20,p)*(1-smooth(.60,.65,p));
  for(let k=0;k<bright.length;k++){const a=target(scene,k,cols,rows,bright[k]),b=target(scene+1,k,cols,rows,bright[k]);let x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t),light=lerp(a[2],b[2],t);const dx=x-pointer.x,dy=(y-pointer.y)*innerHeight/innerWidth,d=Math.hypot(dx,dy),force=Math.max(0,1-d/.12)*.009*amount;
   const orbDistance=Math.hypot(x*innerWidth-cx,y*innerHeight-cy);if(orbDistance<r){light*=1-reveal*crystalWeight;x+=(x-cx/innerWidth)*reveal*.045;y+=(y-cy/innerHeight)*reveal*.045}
   x+=dx/Math.max(.001,d)*force;y+=dy/Math.max(.001,d)*force;xs[k]=x;ys[k]=y;bright[k]=light;
  }
  return{xs,ys,amount,codeWeight:smooth(.37,.45,p)*(1-smooth(.50,.58,p))};
 }
 function drawReveal(ctx){if(reveal<.005||!rect)return;const source=crystal.video.readyState>=2?crystal.video:crystal.still;if(!(source.videoWidth||source.naturalWidth))return;ctx.save();ctx.globalAlpha=reveal*crystalWeight;ctx.beginPath();ctx.arc(rect.x+rect.w*.5,rect.y+rect.h*.493,rect.w*.25,0,Math.PI*2);ctx.clip();ctx.drawImage(source,rect.x,rect.y,rect.w,rect.h);ctx.restore()}
 window.DigitMorph={apply,phase,drawReveal,ready:()=>Object.keys(maps),suspend(){crystal.suspend();research.suspend();revealButton.hidden=true;reveal=0}};
})();
