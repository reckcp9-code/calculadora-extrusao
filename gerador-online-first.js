(function(){
  'use strict';

  function isOnlineItem(item){
    return !!(item && item.querySelector && item.querySelector('.dfOnlineBadge.on'));
  }

  function sortOnlineFirst(){
    const list=document.getElementById('usedList');
    if(!list)return;
    const items=Array.from(list.querySelectorAll(':scope > .usedItem'));
    if(items.length<2)return;
    const sorted=items.slice().sort(function(a,b){
      return Number(isOnlineItem(b))-Number(isOnlineItem(a));
    });
    let changed=false;
    for(let i=0;i<items.length;i++){
      if(items[i]!==sorted[i]){changed=true;break;}
    }
    if(changed)sorted.forEach(function(item){list.appendChild(item)});
  }

  let timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(sortOnlineFirst,80);
  }

  function init(){
    const list=document.getElementById('usedList');
    if(!list){setTimeout(init,250);return;}
    const obs=new MutationObserver(schedule);
    obs.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    schedule();
    setInterval(sortOnlineFirst,3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
