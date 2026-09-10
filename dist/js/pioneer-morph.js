/* One persistent digit field: portrait -> Build -> See -> live research
   -> cinema -> original portrait. The camera timing is deliberately untouched. */
(()=>{
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const lerp=(a,b,t)=>a+(b-a)*t,hash=k=>{const v=Math.sin(k*127.1+311.7)*43758.5453;return v-Math.floor(v)};
 const maps={};
 function sample(canvas){const c=canvas.getContext('2d',{willReadFrequently:true}),d=c.getImageData(0,0,canvas.width,canvas.height).data,pts=[];for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4,b=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255*d[i+3]/255;if(b>.22)pts.push([x/canvas.width,y/canvas.height,b])}return pts}
 function word(value){const c=document.createElement('canvas');c.width=440;c.height=140;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 88px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,220,70,420);return sample(c)}
 maps.build=word('Build.');maps.see=word('See.');
 const cinema=new Image();cinema.onload=()=>{const c=document.createElement('canvas');c.width=256;c.height=256;c.getContext('2d').drawImage(cinema,0,0,256,256);maps.cinema=sample(c)};cinema.src='assets/bsh-shared-imagination.png';
 function sprite(name,k){const a=maps[name];return a?.length?a[Math.floor(hash(k+9)*a.length)]:[hash(k),hash(k+1),.1]}

 // Public Soul AI Lab research demonstration; credited separately from Aaron's
 // own LiveKit integration. Only this decoded video supplies the moving face.
 const video=document.createElement('video');video.id='research-video-source';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.hidden=true;video.setAttribute('aria-hidden','true');video.setAttribute('playsinline','');video.poster='assets/research-talking-head-poster.jpg';video.src='assets/research-talking-head.mp4';document.body.append(video);
 const videoCanvas=document.createElement('canvas');videoCanvas.width=128;videoCanvas.height=128;const videoContext=videoCanvas.getContext('2d',{willReadFrequently:true});
 let videoPixels=null,lastVideoTime=-1,lastSample=0,wantsVideo=false,playRequested=false;
 const fallback=new Image();fallback.onload=()=>{if(videoPixels)return;videoContext.drawImage(fallback,0,0,128,128);videoPixels=videoContext.getImageData(0,0,128,128).data};fallback.src=video.poster;
 function playVideo(){if(wantsVideo&&video.paused&&!playRequested){playRequested=true;video.play()?.catch(()=>{playRequested=false})}}
 function updateVideo(p,now){
  const active=p>=.34&&p<.60&&!document.hidden;
  if(active!==wantsVideo){wantsVideo=active;playRequested=false;if(active)playVideo();else video.pause()}
  if(!active||video.readyState<2||video.currentTime===lastVideoTime||now-lastSample<33)return;
  try{videoContext.drawImage(video,0,0,128,128);videoPixels=videoContext.getImageData(0,0,128,128).data;lastVideoTime=video.currentTime;lastSample=now}catch(_){}
 }
 video.addEventListener('canplay',playVideo);
 for(const name of ['pointerdown','keydown'])document.addEventListener(name,()=>{playRequested=false;playVideo()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){video.pause();wantsVideo=false;playRequested=false}});
 function researchPoint(k,cols,rows,base){
  const count=cols*rows,side=Math.max(28,Math.round(Math.sqrt(Math.ceil(count/6)))),height=Math.ceil(Math.ceil(count/6)/side),cell=Math.floor(k/6);
  const u=(cell%side+.5)/side,v=(Math.floor(cell/side)+.5)/height;
  let b=0;
  if(k%6===0&&videoPixels){const index=(Math.min(127,Math.floor(v*128))*128+Math.min(127,Math.floor(u*128)))*4;const luminance=(videoPixels[index]*.2126+videoPixels[index+1]*.7152+videoPixels[index+2]*.0722)/255;b=Math.pow(Math.max(0,(luminance-.055)/.945),.72)*.95}
  // Keep a square face, including on tall phones; no image stretching.
  const mobile=innerWidth<700,size=mobile?Math.min(innerWidth*.76,innerHeight*.29):Math.min(innerWidth*.41,innerHeight*.58),cx=mobile?.5:.755,cy=mobile?.62:.42;
  return[cx+(u-.5)*size/innerWidth,cy+(v-.5)*size/innerHeight,b];
 }
 let xs=new Float32Array(),ys=new Float32Array();const times=[.12,.24,.37,.50,.60],ends=[.20,.32,.45,.58,.65];
 function phase(p){let scene=0,t=0;for(let i=0;i<times.length;i++)if(p>=times[i]){scene=i;t=smooth(times[i],ends[i],p)}return{scene,t}}
 function target(scene,k,cols,rows,p,base){
  if(scene===0||scene===5)return[(k%cols+.5)/cols,(Math.floor(k/cols)+.5)/rows,base];
  if(scene===3)return researchPoint(k,cols,rows,base);
  let x,y,b;
  if(scene===1||scene===2){const q=sprite(scene===1?'build':'see',k);x=q[0];y=.22+q[1]*.42;b=q[2]*.8;if(k%5===0){x=hash(k+41);y=hash(k+73);b=.07}}
  else{
   // The same particles form the whole workbench-to-cinema illustration.
   // Preserve its square proportions rather than stretching the logo.
   const q=sprite('cinema',k),mobile=innerWidth<700;
   const size=mobile?Math.min(innerWidth*.88,innerHeight*.29):Math.min(innerWidth*.46,innerHeight*.82);
   const cx=mobile?.5:.755,cy=mobile?.735:.49;
   return[cx+(q[0]-.5)*size/innerWidth,cy+(q[1]-.5)*size/innerHeight,q[2]*.95];
  }
  if(innerWidth<700)return[x*.9+.05,y*.30+.52,b];return[x*.46+.51,y*.66+.13,b];
 }
 function apply(bright,cols,rows,p,now=performance.now()){
  updateVideo(p,now);
  if(xs.length!==bright.length){xs=new Float32Array(bright.length);ys=new Float32Array(bright.length)}
  const{scene,t}=phase(p),amount=smooth(.12,.20,p)*(1-smooth(.60,.65,p)),pointer=window.DigitStory.pointer();
  for(let k=0;k<bright.length;k++){const a=target(scene,k,cols,rows,p,bright[k]),b=target(scene+1,k,cols,rows,p,bright[k]);let x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t);const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),force=Math.max(0,1-d/.16)*.012*amount;x+=dx/Math.max(.001,d)*force;y+=dy/Math.max(.001,d)*force;xs[k]=x;ys[k]=y;bright[k]=lerp(a[2],b[2],t)}
  return{xs,ys,amount,codeWeight:smooth(.37,.45,p)*(1-smooth(.50,.58,p))};
 }
 window.DigitMorph={apply,phase,ready:()=>Object.keys(maps)};
})();
