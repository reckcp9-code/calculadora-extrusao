(function(){
  'use strict';
  const OLD='Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.';
  const NEW='Pronto para fazer o backup na nuvem.';

  function fixStatus(){
    const el=document.getElementById('dfCloudStatus');
    if(!el)return;
    if(String(el.textContent||'').trim()===OLD){
      el.textContent=NEW;
      el.className='dfCloudStatus';
    }
  }

  const obs=new MutationObserver(fixStatus);
  function start(){
    fixStatus();
    obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    setInterval(fixStatus,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
