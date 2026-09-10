(()=>{
 const records=window.portfolioCollection;if(!records)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el};
 // Preserve the first-person accounts, moving their depth into one screen reader.
 for(const item of records){if(!item.legacy)continue;const scene=document.getElementById(item.id);if(!scene)continue;
  item.role=scene.querySelector('.case-role')?.textContent;
  item.body=[...scene.querySelectorAll('.case-beat')].map(a=>[a.querySelector('h3').textContent,a.querySelector('p').textContent]);scene.remove();
 }
 const section=make('section','film-scene collection-scene');section.id='projects';section.dataset.title='Selected work';
 const header=make('header','collection-heading');header.append(make('span','scene-label','Selected work'),make('h2','','Research becomes something real'),make('p','','Experiences, products and teams I’ve helped bring to life. Select a project to explore.'));
 const filters=make('div','collection-filters');filters.setAttribute('aria-label','Filter projects');
 const grid=make('div','collection-grid');section.append(header,filters,grid);document.querySelector('#possibilities').after(section);
 const dialog=make('dialog','project-reader');dialog.setAttribute('aria-labelledby','project-reader-title');document.querySelector('.screen-paper').append(dialog);
 let opener=null,oldHash='',lockedOverflow='',returnToProjects=false;
 function close(){if(dialog.open)dialog.close()}
 dialog.addEventListener('close',()=>{dialog.replaceChildren();document.documentElement.style.overflow=lockedOverflow;history.replaceState(null,'',location.pathname+location.search+oldHash);if(returnToProjects)dispatchEvent(new HashChangeEvent('hashchange'));opener?.focus({preventScroll:true})});
 function open(item,button,fromHash=false){
  opener=button;returnToProjects=fromHash;oldHash=fromHash?'#projects':location.hash;lockedOverflow=document.documentElement.style.overflow;
  dialog.replaceChildren();const top=make('header','reader-top');const back=make('button','','← Back to projects');back.type='button';back.onclick=close;top.append(back,make('span','',item.category));dialog.append(top);
  const content=make('div','reader-content');const title=make('h2','',item.title);title.id='project-reader-title';content.append(title,make('p','reader-role',item.role||''));
  if(item.video){const player=make('div','reader-player');const play=make('button','','Play project video');play.type='button';player.append(play);play.onclick=()=>{const iframe=make('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+item.video+'?autoplay=1';iframe.title=item.title+' video';iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;player.replaceChildren(iframe)};content.append(player);const fallback=make('a','reader-source','Open video on YouTube');fallback.href='https://www.youtube.com/watch?v='+item.video;fallback.target='_blank';fallback.rel='noopener';content.append(fallback)}
  if(item.note)content.append(make('p','reader-note',item.note));
  const body=make('div','reader-body');for(const [heading,copy] of item.body||[]){const article=make('article');article.append(make('h3','',heading),make('p','',copy));body.append(article)}content.append(body);
  if(item.images?.length){const gallery=make('div','reader-gallery');for(const pic of item.images){const figure=make('figure');const img=make('img');img.src=pic.src;img.alt=pic.alt;img.loading='lazy';figure.append(img,make('figcaption','',pic.alt));gallery.append(figure)}content.append(gallery)}
  for(const [label,url] of item.links||[]){const a=make('a','reader-source',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener';content.append(a)}
  const cta=make('a','reader-cta','Discuss a project like this');cta.href='mailto:aaronjonesvideo@gmail.com?subject='+encodeURIComponent('Let’s talk: '+item.title)+'&body='+encodeURIComponent('Hi Aaron,\n\nI saw your '+item.title+' project. I’m working on...\n\nThe people it is for are...\n\nI could use your help with...');content.append(cta);dialog.append(content);
  history.replaceState(null,'','#project-'+item.id);document.documentElement.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;back.focus();
 }
 const cards=[];
 for(const item of records){const card=make('button','project-card');card.type='button';card.dataset.category=item.category;card.setAttribute('aria-haspopup','dialog');
  const art=make('span','project-preview');if(item.images?.length){const img=make('img');img.src=item.images[0].src;img.alt='';img.loading='lazy';art.append(img)}else{art.classList.add('type-preview');art.append(make('span','project-monogram',item.category==='Hackathon wins'?'01':item.category==='Open source'?'</>':item.title.split(' ')[0]))}
  const code=make('span','project-code');code.setAttribute('aria-hidden','true');code.textContent=Array.from({length:720},(_,i)=>i%43===0?'\n':((i*17+item.id.length)%7<3?'1':'0')).join('');art.append(code);
  card.append(art,make('span','project-category',item.category),make('strong','',item.title),make('span','project-action',item.video?'Watch & explore ↗':'Explore the story ↗'));card.onclick=()=>open(item,card);grid.append(card);cards.push(card);
 }
 for(const category of ['All',...new Set(records.map(r=>r.category))]){const button=make('button','',category);button.type='button';button.setAttribute('aria-pressed',String(category==='All'));button.onclick=()=>{filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));cards.forEach(c=>c.hidden=category!=='All'&&c.dataset.category!==category);grid.scrollTop=0};filters.append(button)}
 // Focus and touch work without requiring a hover gesture. Native dialog traps focus.
 addEventListener('hashchange',()=>{if(!location.hash.startsWith('#project-')){close();return}const item=records.find(r=>'#project-'+r.id===location.hash);if(item&&!dialog.open)open(item,cards[records.indexOf(item)],true)});
 if(location.hash.startsWith('#project-'))requestAnimationFrame(()=>{const item=records.find(r=>'#project-'+r.id===location.hash);if(item)open(item,cards[records.indexOf(item)],true)});
 const browse=make('a','browse-projects','Browse projects');browse.href='#projects';document.querySelector('.screen-top').insertBefore(browse,document.querySelector('#motion-toggle'));
 const about=document.querySelector('#work .scene-copy p');about.textContent='I’m a builder first. My work spans ethical fashion, visual search, AI video and the tools people use to create with it. I understand the research, write the code and bring people together to make something work.';
 document.querySelector('#speaking .scene-label').textContent='Speaking, consulting and teaching';
 document.querySelector('#contact .scene-label').textContent='Work with me';
 if(reduced)section.classList.add('no-reveal');
})();
