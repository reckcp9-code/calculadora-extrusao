(function(){
  'use strict';

  function cardByText(pg,text){
    const cards=[...pg.querySelectorAll(':scope > .card')];
    return cards.find(function(card){
      return String(card.textContent||'').replace(/\s+/g,' ').includes(text);
    })||null;
  }

  let arranging=false;
  function arrange(){
    if(arranging)return;
    const pg=document.getElementById('pgFo');
    if(!pg)return;

    const backup=document.getElementById('dfCloudBackupCard')||cardByText(pg,'Backup na nuvem');
    const vendedor=document.getElementById('dfVendedorCard')||cardByText(pg,'WhatsApp / PDF ao salvar');
    const wanted=[backup,vendedor].filter(function(el){return el&&el.parentNode===pg});
    if(!wanted.length)return;

    const children=[...pg.children];
    const tail=children.slice(-wanted.length);
    const alreadyLast=wanted.every(function(el,i){return tail[i]===el});
    if(alreadyLast)return;

    arranging=true;
    try{
      wanted.forEach(function(el){pg.appendChild(el)});
    }finally{
      arranging=false;
    }
  }

  function init(){
    arrange();
    setTimeout(arrange,300);
    setTimeout(arrange,900);
    setTimeout(arrange,1800);
    setTimeout(arrange,3500);

    try{
      const pg=document.getElementById('pgFo');
      if(pg){
        const observer=new MutationObserver(function(){setTimeout(arrange,30)});
        observer.observe(pg,{childList:true});
      }
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
