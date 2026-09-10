/* Generated Pruna motion is sampled as luminance only. No guide video is displayed. */
(()=>{
 'use strict';
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const clamp=x=>Math.max(0,Math.min(1,x));
 const guides={};
 for(const name of ['wave','boat'])fetch(`assets/digit-${name}.bin`).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer()}).then(b=>{if(b.byteLength!==48*128*72)throw Error('Invalid guide');guides[name]=new Uint8Array(b)}).catch(()=>{});
 const hero=document.querySelector('.hero-sticky');
 if(!hero)return;
 const text=document.createElement('section');text.className='digit-story-copy';text.setAttribute('aria-label','My story');
 const beats=[
  ['Aaron Jones','I’ve spent my career<br>building what<br>comes next','I started building with AI video seven years ago. Seeing what a technology could become, and knowing how to build it, has shaped my career.'],
  ['Entrepreneur','I build things<br>people want<br>to be part of','Fikay created livelihoods through ethical fashion. Since then, I’ve built businesses and experiences around emerging technology.'],
  ['Creative technologist','I turn research into<br>experiences that<br>drive engagement.','At London Tech Week, I helped turn the hosts into interactive AI avatars that could discuss what was happening across the stages.'],
  ['What comes next','Creativity is<br>becoming real-time','I’m building tools that let people explore ideas together as they take shape. That’s the future I want to bring to your team or your stage.'],
  ['Aaron Jones','Before anything,<br>I’m a builder','I work on the technology, design the experience and help people bring it to life. Here’s what that looks like.']
 ];
 text.innerHTML=beats.map((b,i)=>`<div class="digit-story-beat" data-beat="${i}" ${i?'hidden':''}><span>${b[0]}</span><h2>${b[1]}</h2><p>${b[2]}</p></div>`).join('')+'<div class="digit-story-recognition" aria-label="Selected honours and recognition"><a href="https://www.essex.ac.uk/alumni/awards/alumnus-of-the-year/2018" target="_blank" rel="noopener"><strong>British Empire Medal</strong><span>Services to ethical fashion · 2016</span></a><a href="https://www.essex.ac.uk/alumni/awards/alumnus-of-the-year/2018" target="_blank" rel="noopener"><img src="assets/essex-logo.svg" alt="University of Essex"><span>Alumnus of the Year · 2018</span></a><a href="https://www.essex.ac.uk/alumni/awards/alumnus-of-the-year/2018" target="_blank" rel="noopener"><strong>EY Future 50</strong><span>Social entrepreneurship</span></a></div>';
 hero.append(text);
 const panels=[...text.querySelectorAll('.digit-story-beat')],recognition=text.querySelector('.digit-story-recognition');
 const controls=document.createElement('div');controls.className='digit-story-controls';controls.innerHTML='<button type="button" aria-pressed="false">Narration off</button><a href="#work">Skip introduction</a>';hero.append(controls);
 const audio=controls.querySelector('button');let spoken=-1,enabled=false,current=-1;
 const synth=window.speechSynthesis;
 if(!synth)audio.hidden=true;
 function speak(i){if(!enabled||i<0||i===spoken)return;spoken=i;synth.cancel();const u=new SpeechSynthesisUtterance(beats[i].slice(1).join('. ').replace(/<br>/g,' '));u.rate=.94;synth.speak(u)}
 audio.onclick=()=>{enabled=!enabled;audio.textContent=enabled?'Narration on':'Narration off';audio.setAttribute('aria-pressed',String(enabled));spoken=-1;if(!enabled)synth.cancel();else speak(current)};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&enabled)synth.cancel()});
 let pointer={x:-10,y:-10};
 window.addEventListener('pointermove',e=>{pointer={x:e.clientX/innerWidth,y:e.clientY/innerHeight}},{passive:true});
 document.addEventListener('pointerleave',()=>{pointer={x:-10,y:-10}});
 function sample(name,x,y,t){const data=guides[name];if(!data||x<0||x>1||y<0||y>1)return 0;const f=clamp(t)*47,f0=Math.floor(f),f1=Math.min(47,f0+1),k=Math.min(71,Math.floor(y*72))*128+Math.min(127,Math.floor(x*128));return (data[f0*9216+k]*(1-(f-f0))+data[f1*9216+k]*(f-f0))/255}
 // Preserve every original camera boundary by mapping an extended story interval
 // back onto the original intro timeline. Both renderer and camera use this mapping.
 function timeline(p){if(p<.12)return p/.12*.26;if(p<.68)return .26;if(p<.74)return .26+(p-.68)/.06*.18;return .44+(p-.74)/.26*.56}
 // Clear all code before the original camera begins turning at timeline .50.
 function reveal(p){return smooth(.65,.74,p)}
 function update(p){
  const visible=p>=.12&&p<.68;
  current=visible?(p<.24?0:p<.37?1:p<.50?2:p<.60?3:4):-1;
  text.style.opacity=String(smooth(.12,.14,p)*(1-smooth(.66,.68,p)));
  text.style.visibility=visible?'visible':'hidden';
  panels.forEach((el,i)=>{el.hidden=i!==current});
  recognition.style.opacity=String(smooth(.26,.30,p)*(1-smooth(.36,.38,p)));
  recognition.style.visibility=visible&&p>=.26&&p<.38?'visible':'hidden';
  controls.style.opacity=p<.72?'1':'0';controls.style.visibility=p<.72?'visible':'hidden';
  if(visible)speak(current);else if(spoken!==-1){if(enabled)synth.cancel();spoken=-1}
 }
 // One scroll-driven sea: the hull position and angle use this very same surface.
 // It never changes scenes or stops while captions advance.
 function surface(u,p){const phase=(p-.12)*24;return .65+.047*Math.sin(u*8-phase)+.018*Math.sin(u*15-phase*.73)}
 function boatPose(p){const x=.48+.08*smooth(.23,.60,p),y=surface(x,p);const slope=(surface(x+.001,p)-surface(x-.001,p))/.002;return {x,y,angle:Math.atan(slope)*.65}}
 function paint(bright,cols,rows,p,now){
  const mix=smooth(.12,.155,p)*(1-smooth(.61,.68,p));
  if(!mix)return 0;
  const mobile=innerWidth<700;
  const arrival=smooth(.19,.24,p),pose=boatPose(p);
  const cs=Math.cos(pose.angle),sn=Math.sin(pose.angle);
  const ready=Boolean(guides.wave&&guides.boat);
  if(!ready)return 0;
  for(let k=0;k<bright.length;k++){
   const x=(k%cols)/cols,y=Math.floor(k/cols)/rows;
   // Landscape: type left, illustration right. Portrait: type above, art below.
   const u=mobile?x:(x-.43)/.57,v=mobile?(y-.42)/.40:(y-.13)/.67;
   const edge=smooth(0,.06,u)*(1-smooth(.94,1,u))*smooth(0,.04,v)*(1-smooth(.93,1,v));
   let wave=0;
   for(let line=0;line<4;line++){
    const depth=line*.058;
    const distance=Math.abs(v-surface(u,p)-depth);
    wave=Math.max(wave,Math.exp(-Math.pow(distance/.011,2))*(1-line*.18));
   }
   // An intact boat, not three career labels or a boarding sequence. Crop off
   // the generated guide's separate water so only the shared sea remains.
   const dx=u-pose.x,dy=v-pose.y;
   const bx=.535+(dx*cs+dy*sn)*.48,by=.59+(-dx*sn+dy*cs)*.48;
   const boat=by<.595?sample('boat',bx,by,0)*arrival:0;
   const scene=Math.max(wave,boat)*edge;
   const value=Math.pow(clamp(scene),.7);
   bright[k]=bright[k]*(1-mix)+value*mix;
  }
  return mix;
 }
 window.DigitStory={timeline,reveal,update,paint,surface,boatPose,pointer:()=>pointer};
})();
