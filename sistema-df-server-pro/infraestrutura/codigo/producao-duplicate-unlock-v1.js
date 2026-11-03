(function(){
'use strict';
if(window.DFProducaoDuplicateUnlockV1)return;
window.DFProducaoDuplicateUnlockV1=true;

function unlock(){
  try{
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    document.body.style.pointerEvents='';
    document.documentElement.style.pointerEvents='';
    document.querySelectorAll('button,input,select,textarea').forEach(function(el){
      if(el.dataset&&el.dataset.dfUnlockKeep==='1')return;
      el.style.pointerEvents='';
    });
  }catch(e){}
}

var nativeAlert=window.alert;
window.alert=function(message){
  try{return nativeAlert.call(window,message);}
  finally{
    unlock();
    setTimeout(unlock,0);
    setTimeout(unlock,80);
    setTimeout(unlock,250);
  }
};

window.addEventListener('focus',unlock,true);
window.addEventListener('pageshow',unlock,true);
document.addEventListener('visibilitychange',function(){if(!document.hidden)unlock();});
})();
