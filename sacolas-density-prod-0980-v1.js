/* DF EXTRUSOR PRO — Sacolas: densidade Alta 0,980 */
(function(){
  'use strict';

  function applyDensity(){
    const select=document.getElementById('saDs');
    if(!select)return false;

    let highOption=null;
    for(const option of Array.from(select.options||[])){
      const text=String(option.textContent||'').toLowerCase();
      if(text.includes('alta')){highOption=option;break;}
    }
    if(!highOption)return false;

    const wasSelected=select.value===highOption.value || select.selectedOptions?.[0]===highOption;
    highOption.value='0.980';
    highOption.textContent='0,980 — Alta';

    if(wasSelected){
      select.value='0.980';
      try{select.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
    }
    return true;
  }

  function boot(){
    if(applyDensity())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(applyDensity()||tries>=20)clearInterval(timer);
    },150);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('df-ui-ready',boot);
})();
