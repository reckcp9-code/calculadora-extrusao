(function(){
  const DEV_KEY='df_formula_dev_v1';
  function unlockFormula(){
    try{
      localStorage.setItem(DEV_KEY,'1');
      localStorage.setItem('df_formula_dev','1');
    }catch(e){}
    try{
      const btn=document.getElementById('btFo');
      if(btn){
        btn.textContent='FORMULAÇÃO';
        btn.classList.remove('locked');
        btn.onclick=function(){ if(window.show) window.show('fo'); };
      }
      const locked=document.getElementById('foLocked');
      if(locked) locked.style.display='none';
      const area=document.getElementById('foDevArea');
      if(area) area.style.display='block';
    }catch(e){}
  }
  unlockFormula();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(unlockFormula,80)});
  }else{
    setTimeout(unlockFormula,80);
  }
  setTimeout(unlockFormula,600);
  setTimeout(unlockFormula,1600);
})();