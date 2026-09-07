(function(){
  'use strict';

  function removeSupportCards(){
    document.querySelectorAll('.dfContactCard,[id^="dfContact_"]').forEach(function(el){
      try{el.remove()}catch(e){}
    });
    const style=document.getElementById('dfContactStyle');
    if(style){try{style.remove()}catch(e){}}
  }

  function init(){
    removeSupportCards();
    setTimeout(removeSupportCards,100);
    setTimeout(removeSupportCards,500);
    setTimeout(removeSupportCards,1200);

    try{
      const observer=new MutationObserver(function(){removeSupportCards()});
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
