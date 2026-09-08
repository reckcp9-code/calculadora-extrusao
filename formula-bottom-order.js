(function(){
  'use strict';

  function cardByText(pg,text){
    const cards=[...pg.querySelectorAll(':scope > .card')];
    return cards.find(function(card){return String(card.textContent||'').replace(/\s+/g,' ').includes(text)})||null;
  }

  let arranging=false;
  let observer=null;

  function arrange(){
    if(arranging)return false;
    const pg=document.getElementById('pgFo');if(!pg)return false;
    const backup=document.getElementById('dfCloudBackupCard')||cardByText(pg,'Backup na nuvem');
    const vendedor=document.getElementById('dfVendedorCard')||cardByText(pg,'WhatsApp / PDF ao salvar');
    const wanted=[backup,vendedor].filter(function(el){return el&&el.parentNode===pg});
    if(!wanted.length)return false;
    const children=[...pg.children],tail=children.slice(-wanted.length);
    if(wanted.every(function(el,i){return tail[i]===el}))return wanted.length===2;
    arranging=true;
    try{wanted.forEach(function(el){pg.appendChild(el)})}finally{arranging=false}
    return wanted.length===2;
  }

  function watchUntilReady(){
    const pg=document.getElementById('pgFo');
    if(!pg||observer)return;
    if(arrange())return;
    observer=new MutationObserver(function(){
      if(arrange()&&observer){observer.disconnect();observer=null}
    });
    observer.observe(pg,{childList:true});
  }

  function init(){
    watchUntilReady();
    document.addEventListener('click',function(ev){
      const el=ev.target&&ev.target.closest?ev.target.closest('#btFo,[onclick*="show(\'fo\')"]'):null;
      if(el)arrange();
    },true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)arrange()});
    window.addEventListener('df-ui-ready',arrange);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
