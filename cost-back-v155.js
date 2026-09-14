(function(){
  'use strict';
  if(window.DFCostBackV155)return;
  window.DFCostBackV155=true;

  function ensure(){
    const pg=document.getElementById('pgCu');
    const box=document.getElementById('dfCostSimpleV154');
    if(!pg||!box)return false;

    let btn=document.getElementById('dfCostBackV155');
    if(!btn){
      btn=document.createElement('button');
      btn.id='dfCostBackV155';
      btn.type='button';
      btn.setAttribute('aria-label','Voltar para o menu');
      btn.textContent='←';
      btn.style.cssText='width:46px;height:46px;border:1px solid #f5a000;border-radius:999px;background:#211400;color:#ffd36a;font-size:27px;font-weight:950;line-height:1;display:flex;align-items:center;justify-content:center;margin:0 0 12px;padding:0;cursor:pointer';
      btn.addEventListener('click',function(){
        const original=document.getElementById('dfSectionBack');
        if(original){original.click();return;}
        document.body.classList.remove('dfSectionMode');
        document.body.classList.add('dfHomeMode');
        document.querySelectorAll('#appContent>.page').forEach(function(p){p.classList.remove('dfSectionSelected')});
        try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
      });
      box.insertBefore(btn,box.firstChild);
    }
    return true;
  }

  function start(){
    if(ensure())return;
    let n=0;
    const t=setInterval(function(){n++;if(ensure()||n>50)clearInterval(t)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',function(){setTimeout(ensure,100);setTimeout(ensure,600)},{once:true});
})();
