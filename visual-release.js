(function(){
  'use strict';
  try{localStorage.setItem('df_private_polish_v1','1')}catch(e){}

  function cleanup(){
    const badge=document.getElementById('dfPrivateVisualBadge');
    if(badge)badge.remove();
    const minis=document.querySelectorAll('#dfSystemMini .dfMini');
    minis.forEach(function(box){
      const span=box.querySelector('span');
      const b=box.querySelector('b');
      if(span&&b&&String(span.textContent||'').trim().toLowerCase()==='visual'){
        span.textContent='Interface';
        b.textContent='Profissional';
      }
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanup);else cleanup();
  setTimeout(cleanup,250);
  setTimeout(cleanup,900);
  setTimeout(cleanup,1800);
})();