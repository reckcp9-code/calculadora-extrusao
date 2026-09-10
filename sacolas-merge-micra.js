(function(){
  'use strict';

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim()}

  function findCards(pg){
    const cards=Array.from(pg.querySelectorAll(':scope > .card'));
    const medidas=cards.find(c=>norm(c.querySelector('h2')?.textContent).includes('MEDIDAS E MATERIAL'))||cards[0];
    const micra=cards.find(c=>norm(c.querySelector('h2')?.textContent).includes('MICRA')&&norm(c.querySelector('h2')?.textContent).includes('PESO DO SACO'));
    return {medidas,micra};
  }

  function merge(){
    const pg=document.getElementById('pgSa');
    if(!pg)return;

    const {medidas,micra}=findCards(pg);
    if(!medidas||!micra)return;

    let box=document.getElementById('dfSaMicraMerged');
    if(!box){
      box=document.createElement('div');
      box.id='dfSaMicraMerged';
      box.style.cssText='margin-top:22px;padding-top:18px;border-top:1px solid #263244';

      const title=micra.querySelector('h2');
      if(title)box.appendChild(title);
      while(micra.firstChild)box.appendChild(micra.firstChild);
      medidas.appendChild(box);
    }

    micra.style.setProperty('display','none','important');
    micra.setAttribute('aria-hidden','true');

    const nav=pg.querySelector(':scope > .dfAutoTopics');
    if(nav){
      const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
      const micraBtn=buttons.find(b=>{
        const t=norm(b.textContent);
        return t.includes('MICRA')&&t.includes('PESO DO SACO');
      });
      if(micraBtn){
        const wasOn=micraBtn.classList.contains('on');
        micraBtn.style.setProperty('display','none','important');
        micraBtn.setAttribute('aria-hidden','true');
        micraBtn.tabIndex=-1;
        if(wasOn){
          const first=buttons.find(b=>b!==micraBtn&&b.style.display!=='none');
          if(first)setTimeout(()=>first.click(),0);
        }
      }
    }
  }

  function start(){
    merge();
    requestAnimationFrame(merge);
    setTimeout(merge,150);
    setTimeout(merge,500);
    setTimeout(merge,1200);
    const root=document.getElementById('pgSa');
    if(root&&!root.dataset.dfSaMergeObserver){
      root.dataset.dfSaMergeObserver='1';
      new MutationObserver(()=>requestAnimationFrame(merge)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    }
    window.addEventListener('df-ui-ready',()=>setTimeout(merge,80));
    document.addEventListener('click',()=>setTimeout(merge,60),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
