(function(){
  'use strict';
  let timer=0,bound=false;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{try{if(typeof window.calcCu==='function')window.calcCu()}catch(e){}},220);
  }
  function bind(){
    if(bound)return;
    const pg=document.getElementById('pgCu');
    if(!pg){setTimeout(bind,300);return}
    bound=true;
    ['cuKg','cuLucroPct','cuLucroModo','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuAuto','saL','saC','saM','saDes','saDm','saPesoAlvo','saQ'].forEach(id=>{
      const e=document.getElementById(id);
      e?.addEventListener('input',schedule);
      e?.addEventListener('change',schedule);
    });
    window.addEventListener('hashchange',schedule);
    window.addEventListener('focus',schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
