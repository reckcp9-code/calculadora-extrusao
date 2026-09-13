(function(){
  'use strict';

  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const PENDING_KEY='df_cloud_pending_v1';
  const previousFetch=window.fetch.bind(window);
  let manualPermit=false;
  let permitTimer=0;

  function clearPending(){
    try{localStorage.removeItem(PENDING_KEY)}catch(e){}
  }

  function setStatus(text,type){
    const el=document.getElementById('dfCloudStatus');
    if(!el)return;
    el.textContent=text;
    el.className='dfCloudStatus '+(type||'');
  }

  function rewriteStatus(){
    const el=document.getElementById('dfCloudStatus');
    if(!el)return;
    const text=String(el.textContent||'').trim();

    if(text.startsWith('Backup automático ativo • último:')){
      el.textContent=text.replace('Backup automático ativo','Backup manual');
      el.className='dfCloudStatus ok';
      return;
    }

    if(text.includes('há alterações aguardando envio para a nuvem')){
      clearPending();
      setStatus('Alterações locais não são enviadas automaticamente. Toque em FAZER BACKUP AGORA quando quiser salvar.','');
      return;
    }

    if(text.includes('ficou na fila')||text.includes('aguardando sincronização')){
      clearPending();
      setStatus('Nada será enviado automaticamente. Conecte-se à internet e toque em FAZER BACKUP AGORA quando quiser salvar.','warn');
      return;
    }

    if(text==='Acesso automático reconhecido • pronto para o primeiro backup.'){
      setStatus('Pronto para fazer backup manual.','ok');
    }
  }

  function patchCard(){
    const card=document.getElementById('dfCloudBackupCard');
    if(!card)return false;

    const meta=card.querySelector('.dfCloudMeta');
    if(meta)meta.textContent='Backup manual: nada é enviado automaticamente. Use FAZER BACKUP AGORA somente quando quiser salvar uma cópia na nuvem.';

    rewriteStatus();

    const status=document.getElementById('dfCloudStatus');
    if(status&&!status.dataset.dfManualBackupObserved){
      status.dataset.dfManualBackupObserved='1';
      new MutationObserver(rewriteStatus).observe(status,{childList:true,subtree:true,characterData:true});
    }
    return true;
  }

  window.fetch=async function(input,init){
    let url=null;
    try{url=new URL(typeof input==='string'?input:input&&input.url,location.href)}catch(e){}
    const method=String(init&&init.method||'GET').toUpperCase();

    if(url&&url.hostname===API_HOST&&url.pathname==='/backup/save'&&method==='POST'){
      if(manualPermit){
        manualPermit=false;
        if(permitTimer){clearTimeout(permitTimer);permitTimer=0}
        return previousFetch(input,init);
      }

      clearPending();
      return new Response(JSON.stringify({ok:false,error:'Backup configurado para modo manual.'}),{
        status:409,
        headers:{'Content-Type':'application/json'}
      });
    }

    return previousFetch(input,init);
  };

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#dfCloudSave'):null;
    if(!btn)return;

    clearPending();

    if(navigator.onLine===false){
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      setStatus('Sem internet. O backup não será colocado em fila. Conecte-se e toque novamente em FAZER BACKUP AGORA.','warn');
      return;
    }

    manualPermit=true;
    if(permitTimer)clearTimeout(permitTimer);
    permitTimer=setTimeout(function(){manualPermit=false;permitTimer=0},15000);
  },true);

  window.addEventListener('online',function(){
    clearPending();
    setTimeout(patchCard,900);
  });

  clearPending();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(patchCard,600)},{once:true});
  }else{
    setTimeout(patchCard,600);
  }

  const observer=new MutationObserver(function(){patchCard()});
  if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
})();
