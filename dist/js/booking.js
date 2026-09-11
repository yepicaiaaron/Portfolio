/* Booking is loaded only after a visitor chooses to arrange a call. */
(()=>{
 const link='https://calendar.app.google/pZkjBD1BnG83RQxi7';
 const embed='https://calendar.google.com/calendar/appointments/schedules/AcZssZ09mhL3n0ODRDTcmSRk7Ur78AY7LxUp_hGYyg0cZkRy7KJGLzEp6S_Pe14gYyijQxHWrDDSgrAl?gv=true';
 const dialog=document.createElement('dialog');dialog.className='booking-dialog';dialog.setAttribute('aria-labelledby','booking-title');
 dialog.innerHTML='<header><h2 id="booking-title">Let’s arrange a call</h2><button type="button" aria-label="Close booking calendar">Close ×</button></header><p>Pick a time that works for you. <a href="'+link+'" target="_blank" rel="noopener">Open Google Calendar separately ↗</a></p><p class="booking-status" role="status" hidden></p><div class="booking-frame"></div>';
 document.body.append(dialog);let opener,oldOverflow='',wasModal=false,loadTimer=0;
 dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{clearTimeout(loadTimer);dialog.querySelector('.booking-frame').replaceChildren();document.documentElement.style.overflow=oldOverflow;window.PortfolioModalOpen=wasModal;opener?.focus({preventScroll:true});dispatchEvent(new Event('portfolio:resume'))});
 document.addEventListener('click',e=>{const trigger=e.target.closest('[data-booking]');if(!trigger)return;e.preventDefault();if(dialog.open)return;opener=trigger;oldOverflow=document.documentElement.style.overflow;wasModal=!!window.PortfolioModalOpen;document.documentElement.style.overflow='hidden';window.PortfolioModalOpen=true;const frame=document.createElement('iframe');frame.title='Book a meeting with Aaron Jones';frame.referrerPolicy='strict-origin-when-cross-origin';const status=dialog.querySelector('.booking-status');status.hidden=false;status.textContent='Loading Google Calendar…';frame.addEventListener('load',()=>{clearTimeout(loadTimer);status.hidden=true});loadTimer=setTimeout(()=>{status.textContent='Calendar not appearing? Use the direct Google Calendar link above to choose a time.'},8000);dialog.showModal();dialog.querySelector('.booking-frame').append(frame);frame.src=embed;dialog.querySelector('button').focus()});
})();
