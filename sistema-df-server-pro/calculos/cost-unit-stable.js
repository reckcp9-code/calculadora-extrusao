(function(){
  'use strict';
  let timer=0,bound=false;
  function costVisible(){
    const pg=document.getElementById('pgCu');
    return !!(pg&&(pg.classList.contains('on')||pg.classList.contains('dfSectionSelected')||location.hash==='#custo'));
  }
  function schedule(force=false){
    if(!force&&!costVisible())return;
    clearTimeout(timer);
    timer=setTimeout(()=>{try{if(typeof window.calcCu==='function')window.calcCu()}catch(e){}},80);
  }
  function bind(){
    if(bound)return;
    const pg=document.getElementById('pgCu');
    if(!pg){setTimeout(bind,300);return}
    bound=true;
    ['cuKg','cuLucroPct','cuLucroModo','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuAuto'].forEach(id=>{
      const e=document.getElementById(id);
      e?.addEventListener('input',schedule);
      e?.addEventListener('change',schedule);
    });
    document.addEventListener('click',ev=>{if(ev.target?.closest?.('#btCu'))setTimeout(()=>schedule(true),100)},true);
    window.addEventListener('hashchange',()=>schedule(true));
    window.addEventListener('focus',()=>schedule(true));
    schedule(true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
