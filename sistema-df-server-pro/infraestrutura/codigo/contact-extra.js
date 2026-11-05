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

  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
