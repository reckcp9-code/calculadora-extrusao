(function(){
  'use strict';

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim()}

  function directCards(pg){
    return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'));
  }

  function locate(pg){
    const cards=directCards(pg);
    const medidas=cards.find(c=>norm(c.querySelector('h2')?.textContent).includes('MEDIDAS E MATERIAL'))||cards[0]||null;
    let micra=cards.find(c=>c.dataset.dfSaMicraSource==='1')||null;
    if(!micra){
      micra=cards.find(c=>{
        const t=norm(c.querySelector('h2')?.textContent||c.textContent);
        return t.includes('MICRA')&&t.includes('PESO DO SACO');
      })||null;
    }
    return {cards,medidas,micra};
  }

  function merge(){
    const pg=document.getElementById('pgSa');
    if(!pg)return;

    const found=locate(pg);
    const medidas=found.medidas;
    let micra=found.micra;
    if(!medidas)return;

    let box=document.getElementById('dfSaMicraMerged');

    if(micra&&!box){
      const originalCards=found.cards;
      const sourceIndex=Math.max(0,originalCards.indexOf(micra));
      micra.dataset.dfSaMicraSource='1';
      micra.dataset.dfSaMicraTopic=String(sourceIndex);

      box=document.createElement('div');
      box.id='dfSaMicraMerged';
      box.style.cssText='margin-top:22px;padding-top:18px;border-top:1px solid #263244';

      while(micra.firstChild)box.appendChild(micra.firstChild);
      medidas.appendChild(box);
    }

    if(!micra){
      micra=directCards(pg).find(c=>c.dataset.dfSaMicraSource==='1')||null;
    }

    if(micra){
      micra.style.setProperty('display','none','important');
      micra.setAttribute('aria-hidden','true');
    }

    const nav=pg.querySelector(':scope > .dfAutoTopics');
    if(nav&&micra){
      const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
      const topic=micra.dataset.dfTopic||micra.dataset.dfSaMicraTopic||'1';
      const micraBtn=buttons.find(b=>String(b.dataset.topic)===String(topic))||buttons.find(b=>{
        const t=norm(b.textContent);
        return t.includes('MICRA')&&t.includes('PESO DO SACO');
      });

      if(micraBtn){
        const wasOn=micraBtn.classList.contains('on');
        micraBtn.classList.remove('on');
        micraBtn.style.setProperty('display','none','important');
        micraBtn.setAttribute('aria-hidden','true');
        micraBtn.tabIndex=-1;

        if(wasOn){
          const first=buttons.find(b=>String(b.dataset.topic)==='0')||buttons.find(b=>b!==micraBtn);
          if(first){
            first.classList.add('on');
            const cards=directCards(pg);
            cards.forEach((c,i)=>c.classList.toggle('dfTopicVisible',i===0));
            medidas.classList.add('dfTopicVisible');
          }
        }
      }
    }

    /* Micra -> Peso do saco passa a fazer parte visualmente do primeiro card.
       Portanto aparece junto com Medidas e material e some quando outra aba é aberta. */
    if(box&&medidas.parentElement===pg){
      const navNow=pg.querySelector(':scope > .dfAutoTopics');
      const active=navNow&&navNow.querySelector('.dfAutoTopic.on');
      const firstActive=!active||String(active.dataset.topic)==='0';
      box.style.display=firstActive?'block':'none';
    }
  }

  function start(){
    merge();
    requestAnimationFrame(merge);
    setTimeout(merge,120);
    setTimeout(merge,450);
    setTimeout(merge,1000);

    const root=document.getElementById('pgSa');
    if(root&&!root.dataset.dfSaMergeObserver){
      root.dataset.dfSaMergeObserver='1';
      new MutationObserver(()=>requestAnimationFrame(merge)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-df-topic']});
    }

    window.addEventListener('df-ui-ready',()=>setTimeout(merge,80));
    document.addEventListener('click',()=>setTimeout(merge,70),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
