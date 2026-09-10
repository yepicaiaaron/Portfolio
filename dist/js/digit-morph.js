/* One particle identity per original portrait cell, carried through every scene.
   Images are target distributions only. They are never drawn onto the visible canvas. */
(()=>{
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const lerp=(a,b,t)=>a+(b-a)*t;
 const hash=k=>{const v=Math.sin(k*127.1+311.7)*43758.5453;return v-Math.floor(v)};
 const maps={};
 for(const [name,url] of Object.entries({boat:'assets/empty-boat.png',balloon:'assets/balloon.png',project:'assets/ltw-digit-source.jpeg'})){
  const img=new Image();img.onload=()=>{
   const cv=document.createElement('canvas');cv.width=160;cv.height=120;
   const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,160,120);
   const data=ctx.getImageData(0,0,160,120).data,points=[];
   for(let y=0;y<120;y++)for(let x=0;x<160;x++){
    const i=(y*160+x)*4,b=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255*data[i+3]/255;
    if(b>.15)points.push([x/160,y/120,b]);
   }
   maps[name]=points;
  };img.src=url;
 }
 function sprite(name,k){const points=maps[name];return points?.length?points[Math.floor(hash(k+9)*points.length)]:[hash(k),hash(k+1),.15]}
 let xs=new Float32Array(),ys=new Float32Array();
 const times=[.12,.24,.37,.50,.60],ends=[.20,.32,.45,.58,.65];
 function phase(p){let scene=0,t=0;for(let i=0;i<times.length;i++){if(p>=times[i]){scene=i;t=smooth(times[i],ends[i],p)}}return {scene,t}}
 function target(scene,k,n,cols,rows,p,base){
  const home=[(k%cols+.5)/cols,(Math.floor(k/cols)+.5)/rows,base];
  if(scene===0||scene===5)return home;
  const mobile=innerWidth<700,u=hash(k+41),v=hash(k+73),main=k%12===0;
  let x=u,y=v,b=.09;
  if(scene===1){
   // An illustrative acceleration curve, deliberately without invented metrics.
   x=.07+u*.86;y=.82-.67*u*u*u+(v-.5)*(main?.025:.55);b=main?.95:.045;
  }else if(scene===2){
   const pose=window.DigitStory.boatPose(p);
   if(k%5<2){const q=sprite('boat',k);const dx=(q[0]-.5)*.76,dy=(q[1]-.595)*.48;
    x=pose.x+dx*Math.cos(pose.angle)-dy*Math.sin(pose.angle);y=pose.y+dx*Math.sin(pose.angle)+dy*Math.cos(pose.angle);b=q[2]*.7;
   }else{x=u;y=window.DigitStory.surface(u,p)+(k%4)*.045+(v-.5)*.012;b=main?.9:.28}
  }else if(scene===3){
   if(k%3===0){const q=sprite('project',k);x=.06+q[0]*.88;y=.18+q[1]*.52;b=q[2]*.9}
   else{const angle=u*Math.PI*2,r=.14+v*.4;x=.5+Math.cos(angle)*r;y=.47+Math.sin(angle)*r*.65;b=.18+.28*Math.pow(Math.sin(r*45-p*80),8)}
  }else{
   const q=sprite('balloon',k);x=.10+q[0]*.80;y=q[1]*.85-smooth(.54,.60,p)*.12;b=q[2]*.65;
  }
  if(scene>1&&k%3!==0)b*=.12;
  if(mobile)return [x*.9+.05,y*.36+.43,b];
  return [x*.47+.50,y*.64+.13,b];
 }
 function apply(bright,cols,rows,p){
  const n=bright.length;if(xs.length!==n){xs=new Float32Array(n);ys=new Float32Array(n)}
  const {scene,t}=phase(p),amount=smooth(.12,.20,p)*(1-smooth(.60,.65,p));
  const pointer=window.DigitStory.pointer();
  for(let k=0;k<n;k++){
   const a=target(scene,k,n,cols,rows,p,bright[k]),b=target(scene+1,k,n,cols,rows,p,bright[k]);
   let x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t);
   const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),force=Math.max(0,1-d/.16)*.017*amount;
   x+=dx/Math.max(.001,d)*force;y+=dy/Math.max(.001,d)*force;
   xs[k]=x;ys[k]=y;bright[k]=lerp(a[2],b[2],t);
  }
  return {xs,ys,amount};
 }
 window.DigitMorph={apply,phase,ready:()=>Object.keys(maps)};
})();
