(function(){
  'use strict';
  let scheduled=false;

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim()}
  function directCards(pg){return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'))}

  function removeOutros(pg){
    directCards(pg).forEach(function(c){
      const h=norm(c.querySelector('h2')?.textContent||'');
      const t=norm(c.textContent||'');
      if(h==='OUTROS RESULTADOS'||(t.includes('SACOS POR KG')&&t.includes('PESO DE 1.000 SACOS')))c.remove();
    });
  }

  function findCards(pg){
    const cards=directCards(pg);
    const medidas=cards.find(c=>norm(c.querySelector('h2')?.textContent).includes('MEDIDAS E MATERIAL'))||cards[0]||null;
    const micra=cards.find(c=>{
      const t=norm(c.querySelector('h2')?.textContent||c.textContent);
      return t.includes('MICRA')&&t.includes('PESO DO SACO');
    })||null;
    return {medidas,micra};
  }

  function cleanNav(pg){
    const nav=pg.querySelector(':scope > .dfAutoTopics');
    if(!nav)return;
    Array.from(nav.querySelectorAll('.dfAutoTopic')).forEach(function(b){
      const t=norm(b.textContent);
      if(t.includes('OUTROS RESULTADOS')||(t.includes('MICRA')&&t.includes('PESO DO SACO')))b.remove();
    });
  }

  function updateMergedVisibility(pg){
    const box=document.getElementById('dfSaMicraMerged');
    if(!box)return;
    const nav=pg.querySelector(':scope > .dfAutoTopics');
    const active=nav&&nav.querySelector('.dfAutoTopic.on');
    const isMedidas=!active||norm(active.textContent).includes('MEDIDAS E MATERIAL')||String(active.dataset.topic||'')==='0';
    box.style.display=isMedidas?'block':'none';
  }

  function merge(){
    scheduled=false;
    const pg=document.getElementById('pgSa');
    if(!pg)return;

    removeOutros(pg);
    const found=findCards(pg);
    const medidas=found.medidas;
    const micra=found.micra;
    if(!medidas)return;

    let box=document.getElementById('dfSaMicraMerged');
    if(micra&&!box){
      box=document.createElement('div');
      box.id='dfSaMicraMerged';
      box.style.cssText='margin-top:22px;padding-top:18px;border-top:1px solid #263244';
      while(micra.firstChild)box.appendChild(micra.firstChild);
      medidas.appendChild(box);
      micra.remove();
    }

    cleanNav(pg);
    updateMergedVisibility(pg);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(merge);
  }

  function start(){
    merge();
    const root=document.getElementById('pgSa');
    if(root&&!root.dataset.dfSaMergeObserverV2){
      root.dataset.dfSaMergeObserverV2='1';
      new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
      root.addEventListener('click',function(e){
        if(e.target&&e.target.closest&&e.target.closest('.dfAutoTopic'))setTimeout(schedule,0);
      },true);
    }
    window.addEventListener('df-ui-ready',schedule);
    window.addEventListener('pageshow',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();