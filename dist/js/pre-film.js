(()=>{
 const stage=document.querySelector('.pre-film-stage'),play=document.querySelector('#play-trailer'),skip=document.querySelector('#skip-trailer');
 skip.addEventListener('click',()=>{location.hash='work'});
 const movie=stage.querySelector('video');
 if(!movie){play.hidden=true;return}
 const credit=stage.querySelector('.film-credit'),name=credit.querySelector('span'),headline=credit.querySelector('h2');
 name.textContent='Aaron Jones';headline.innerHTML='I’ve spent my career<br>building what comes next.';
 movie.muted=true;
 const sound=document.createElement('button');sound.type='button';sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');play.after(sound);
 sound.addEventListener('click',()=>{movie.muted=!movie.muted;sound.textContent=movie.muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(!movie.muted))});
 play.addEventListener('click',async()=>{if(!movie.paused){movie.pause();return}if(movie.ended)movie.currentTime=0;try{await movie.play()}catch{play.textContent='Try playing again'}});
 movie.addEventListener('play',()=>{play.textContent='Pause film'});
 movie.addEventListener('pause',()=>{play.textContent=movie.ended?'Replay film':'Play opening film'});
 movie.addEventListener('ended',()=>{play.textContent='Replay film'});
 movie.addEventListener('error',()=>{play.textContent='Film unavailable';play.disabled=true;credit.style.opacity='1'});
 const io=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){movie.pause();play.textContent='Play opening film'}},{threshold:.25});io.observe(stage);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)movie.pause()});
})();
