/* One introduction; the original camera's mapped timeline stays unchanged. */
(()=>{
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const hero=document.querySelector('.hero-sticky');if(!hero)return;
 const beats=[
  ['Builder. Technologist. Strategist.','I’ve spent my career<br>building what<br>comes next.','Visual search. Generative video. Now world models. I see what a technology could become, then get to work building it.'],
  ['See the possibility','Early enough<br>to help shape it.','Visual search twelve years ago. AI video seven years ago. I wasn’t just watching those changes happen. I was building the technology and the businesses around them.'],
  ['Research & open source','Building, testing<br>and sharing code.','I work across multiple repositories, building and testing real-time AI, video generation and creative tools. You can explore my projects and experiments on GitHub.'],
  ['Big Screen Hack','Building a new institution for AI cinema.','I founded Big Screen Hack to create the platform, audience and industry recognition AI-assisted filmmakers were missing.</p><p>In under a year, it grew from a London experiment into an international platform spanning <strong>London, Cannes and New York</strong>.'],
  ['The thread through it all','New ways to learn.<br>To connect.<br>To create.','That’s what I’m building towards. And why I’m working on real-time creative AI and world models now.']
 ];
 const text=document.createElement('section');text.className='digit-story-copy';text.setAttribute('aria-label','My story');
 const trustedClients=[['Roche',3],['Concentrix',2],['Acronis',1],['Chicago Transit Authority',0],['GymNation',9],['Deriv',7],['Lumen5',8],['XRSpace',10],['LEAP',4],['GAIN',5]];
 text.innerHTML=beats.map((b,i)=>`<div class="digit-story-beat" ${i?'hidden':''}><span>${b[0]}</span><h2>${b[1]}</h2><p>${b[2]}</p></div>`).join('')+'<div class="intro-proof intro-clients"><span>Multi Award Winning Entrepreneur, Engineer &amp; Educator/Speaker</span><div role="list" aria-label="Selected clients">'+trustedClients.map(([name,i])=>`<div role="listitem" class="intro-client"><img data-src="assets/optimised/yepic-client-${i}.webp" alt="${name}" title="${name}" width="120" height="40" decoding="async"></div>`).join('')+'</div></div>';
 hero.append(text);const panels=[...text.querySelectorAll('.digit-story-beat')];
 const creativeProof=document.createElement('p');creativeProof.className='creative-proof';creativeProof.textContent='90+ teams · 58 films · 1,126 guests · 1M+ impressions · 28 awards';panels[3].append(creativeProof);
 const research=document.createElement('aside');research.className='research-proof';research.hidden=true;research.innerHTML='<a class="research-github" href="https://github.com/yepicaiaaron" target="_blank" rel="noopener"><img src="assets/github-mark-white.svg" alt="GitHub" width="42" height="41"><span>Explore my GitHub<small>Projects, experiments and code ↗</small></span></a>';hero.append(research);
 const controls=document.createElement('div');controls.className='digit-story-controls';controls.innerHTML='<a href="#work">Enter the cinema</a>';hero.append(controls);
 let current=-1;
 let pointer={x:-10,y:-10};addEventListener('pointermove',e=>{pointer={x:e.clientX/innerWidth,y:e.clientY/innerHeight}},{passive:true});document.addEventListener('pointerleave',()=>pointer={x:-10,y:-10});
 function timeline(p){if(p<.12)return p/.12*.26;if(p<.68)return .26;if(p<.74)return .26+(p-.68)/.06*.18;return .44+(p-.74)/.26*.56}
 function reveal(p){return smooth(.65,.74,p)}
 function update(p){
  const visible=p>=.12&&p<.68;current=visible?(p<.24?0:p<.37?1:p<.50?2:p<.60?3:4):-1;
  text.style.opacity=String(smooth(.12,.14,p)*(1-smooth(.66,.68,p)));text.style.visibility=visible?'visible':'hidden';
  panels.forEach((el,i)=>el.hidden=i!==current);text.dataset.beat=String(current);hero.dataset.storyActive=String(p>=.12);controls.style.visibility=p>=.12&&p<.72?'visible':'hidden';
  research.hidden=current!==2;research.style.opacity=String(smooth(.37,.41,p));hero.dataset.researchActive=String(current===2);
  hero.dataset.creativityActive=String(current===3);
  if(visible)window.PortfolioMedia?.hydrate(text);
 }
 window.DigitStory={timeline,reveal,update,pointer:()=>pointer};
})();
