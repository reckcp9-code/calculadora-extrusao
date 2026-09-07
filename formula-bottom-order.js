(function(){
  'use strict';

  function cardByText(pg,text){
    const cards=[...pg.querySelectorAll(':scope > .card')];
    return cards.find(function(card){return String(card.textContent||'').replace(/\s+/g,' ').includes(text)})||null;
  }

  let arranging=false;
  function arrange(){
    if(arranging)return;
    const pg=document.getElementById('pgFo');if(!pg)return;
    const backup=document.getElementById('dfCloudBackupCard')||cardByText(pg,'Backup na nuvem');
    const vendedor=document.getElementById('dfVendedorCard')||cardByText(pg,'WhatsApp / PDF ao salvar');
    const wanted=[backup,vendedor].filter(function(el){return el&&el.parentNode===pg});
    if(!wanted.length)return;
    const children=[...pg.children],tail=children.slice(-wanted.length);
    if(wanted.every(function(el,i){return tail[i]===el}))return;
    arranging=true;
    try{wanted.forEach(function(el){pg.appendChild(el)})}finally{arranging=false}
  }

  function init(){
    arrange();
    setTimeout(arrange,350);setTimeout(arrange,1000);setTimeout(arrange,2200);setTimeout(arrange,4500);
    document.addEventListener('click',function(ev){
      const el=ev.target&&ev.target.closest?ev.target.closest('#btFo,[onclick*="show(\'fo\')"]'):null;
      if(el)setTimeout(arrange,80);
    },true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(arrange,50)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
