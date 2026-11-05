(function(){
  'use strict';
  const HOST='df-extrusor-api.reck-cp9.workers.dev';
  const PENDING='df_cloud_pending_v1';
  const nativeFetch=window.fetch.bind(window);
  let manual=false,timer=0;

  function clearPending(){try{localStorage.removeItem(PENDING)}catch(e){}}
  function status(text,cls){const e=document.getElementById('dfCloudStatus');if(!e)return;e.textContent=text;e.className='dfCloudStatus '+(cls||'')}
  function patch(){
    clearPending();
    const card=document.getElementById('dfCloudBackupCard');if(!card)return;
    const meta=card.querySelector('.dfCloudMeta');
    if(meta)meta.textContent='Backup manual: nada é enviado sozinho. Toque em FAZER BACKUP AGORA quando quiser salvar na nuvem.';
    const e=document.getElementById('dfCloudStatus');if(!e)return;
    const t=String(e.textContent||'');
    if(t.startsWith('Backup automático ativo')){e.textContent=t.replace('Backup automático ativo','Backup manual');e.className='dfCloudStatus ok'}
    else if(t.includes('aguardando')||t.includes('fila')||t.includes('modo manual'))status('Backup manual ativo. Nada será enviado automaticamente.','ok');
    else if(t.includes('pronto para o primeiro backup'))status('Pronto para fazer backup manual.','ok');
  }
  function patchSoon(){setTimeout(patch,100);setTimeout(patch,700);setTimeout(patch,1800)}

  window.fetch=function(input,init){
    let u=null;try{u=new URL(typeof input==='string'?input:input&&input.url,location.href)}catch(e){}
    const method=String(init&&init.method||'GET').toUpperCase();
    if(u&&u.hostname===HOST&&u.pathname==='/backup/save'&&method==='POST'){
      if(manual){manual=false;if(timer){clearTimeout(timer);timer=0}return nativeFetch(input,init).finally(patchSoon)}
      clearPending();patchSoon();
      return Promise.resolve(new Response(JSON.stringify({ok:false,error:'Backup em modo manual.'}),{status:409,headers:{'Content-Type':'application/json'}}));
    }
    return nativeFetch(input,init);
  };

  document.addEventListener('click',function(ev){
    const b=ev.target&&ev.target.closest?ev.target.closest('#dfCloudSave'):null;if(!b)return;
    clearPending();
    if(navigator.onLine===false){ev.preventDefault();ev.stopImmediatePropagation();status('Sem internet. Conecte-se e toque novamente em FAZER BACKUP AGORA.','warn');return}
    manual=true;if(timer)clearTimeout(timer);timer=setTimeout(()=>{manual=false;timer=0},12000);patchSoon();
  },true);

  window.addEventListener('online',patchSoon);
  window.addEventListener('df-ui-ready',patchSoon);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)patchSoon()});
  clearPending();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchSoon,{once:true});else patchSoon();
})();
