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
        st.textContent='body.dfPreviewUnlocked{visibility:visible!important;opacity:1!important}#licenseGate{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}#appContent{display:block!important;visibility:visible!important;opacity:1!important}';
        document.head.appendChild(st);
      }
      if(document.body)document.body.classList.add('dfPreviewUnlocked');
    }catch(e){}
  }

  unlock();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',unlock,{once:true});
  window.addEventListener('df-ui-ready',unlock,{once:true});
  window.addEventListener('pageshow',unlock,{once:true});
  setTimeout(unlock,250);
  setTimeout(unlock,1000);
})();
