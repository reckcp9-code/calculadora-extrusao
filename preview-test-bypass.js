(function(){
  'use strict';
  const isPreview=/\/preview-teste\.html$/i.test(location.pathname);
  if(!isPreview)return;

  function unlock(){
    try{
      let st=document.getElementById('dfPreviewBypassStyle');
      if(!st){
        st=document.createElement('style');
        st.id='dfPreviewBypassStyle';
        st.textContent='#licenseGate{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}#appContent{display:block!important;visibility:visible!important;opacity:1!important}';
        document.head.appendChild(st);
      }
      const gate=document.getElementById('licenseGate');
      if(gate){
        gate.style.setProperty('display','none','important');
        gate.style.setProperty('visibility','hidden','important');
        gate.style.setProperty('opacity','0','important');
        gate.style.setProperty('pointer-events','none','important');
      }
      const app=document.getElementById('appContent');
      if(app){
        app.style.setProperty('display','block','important');
        app.style.setProperty('visibility','visible','important');
        app.style.setProperty('opacity','1','important');
      }
      document.body.classList.add('dfPreviewUnlocked');
    }catch(e){}
  }

  unlock();
  document.addEventListener('DOMContentLoaded',unlock,{once:true});
  window.addEventListener('df-ui-ready',unlock);
  window.addEventListener('pageshow',unlock);
  const mo=new MutationObserver(unlock);
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  setTimeout(unlock,100);
  setTimeout(unlock,500);
  setTimeout(unlock,1500);
})();
