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

  function start(){
    fixStatus();
    setTimeout(fixStatus,700);
    setTimeout(fixStatus,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
