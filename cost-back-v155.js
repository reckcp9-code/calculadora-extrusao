(function(){
  'use strict';
  if(window.DFCostBackV173)return;
  window.DFCostBackV173=true;

  let observer=null;

  function goBack(){
    const original=document.getElementById('dfSectionBack');
    if(original){original.click();return;}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(function(p){p.classList.remove('dfSectionSelected')});
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function ensure(){
    const pg=document.getElementById('pgCu');
    const box=document.getElementById('dfCostSimpleV154');
    if(!pg||!box)return false;

    let btn=document.getElementById('dfCostBackV155');
    if(!btn){
      btn=document.createElement('button');
      btn.id='dfCostBackV155';
      btn.type='button';
      btn.setAttribute('aria-label','Voltar para a tela principal');
      btn.textContent='←';
      btn.style.cssText='width:46px;height:46px;border:1px solid #f5a000;border-radius:999px;background:#211400;color:#ffd36a;font-size:27px;font-weight:950;line-height:1;display:flex!important;align-items:center;justify-content:center;margin:0 0 12px;padding:0;cursor:pointer;visibility:visible!important;opacity:1!important';
      btn.addEventListener('click',goBack);
      box.insertBefore(btn,box.firstChild);
    }else if(btn.parentElement!==box){
      box.insertBefore(btn,box.firstChild);
    }
    return true;
  }

  function observe(){
    const pg=document.getElementById('pgCu');
    if(!pg)return false;
    if(observer)observer.disconnect();
    observer=new MutationObserver(function(){ensure()});
    observer.observe(pg,{childList:true,subtree:true});
    return true;
  }

  function start(){
    ensure();
    observe();
    let n=0;
    const t=setInterval(function(){n++;ensure();if(observe()||n>80)clearInterval(t)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',function(e){
    const t=e.target&&e.target.closest?e.target.closest('#btCu'):null;
    if(t){setTimeout(ensure,40);setTimeout(ensure,180);setTimeout(ensure,500)}
  },true);
  window.addEventListener('df-ui-ready',function(){setTimeout(start,80)});
  window.addEventListener('pageshow',function(){setTimeout(ensure,80)});
})();
