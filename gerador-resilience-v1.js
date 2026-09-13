(function(){
  'use strict';

  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const nativeFetch=window.fetch.bind(window);
  const READ_ONLY=new Set([
    '/admin/access/status',
    '/admin/access/list-used',
    '/admin/access/list-stock',
    '/admin/push/online-status'
  ]);
  const VERSIONED=new Map([
    ['/admin/access/status','/admin/v1/access/status'],
    ['/admin/access/import','/admin/v1/access/import'],
    ['/admin/access/create-link','/admin/v1/access/create-link'],
    ['/admin/access/list-used','/admin/v1/access/list-used'],
    ['/admin/access/list-stock','/admin/v1/access/list-stock'],
    ['/admin/access/delete-access','/admin/v1/access/delete-access'],
    ['/admin/access/pause','/admin/v1/access/pause'],
    ['/admin/access/resume','/admin/v1/access/resume'],
    ['/admin/access/set-days','/admin/v1/access/set-days'],
    ['/admin/access/default-days','/admin/v1/access/default-days'],
    ['/admin/access/rename-user','/admin/v1/access/rename-user'],
    ['/admin/access/delete-stock','/admin/v1/access/delete-stock'],
    ['/admin/access/reset-device','/admin/v1/access/reset-device'],
    ['/admin/update/notify-next','/admin/v1/update/notify-next']
  ]);
  const RETRY_STATUS=new Set([408,425,429,500,502,503,504]);

  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
  function inputUrl(input){
    try{return new URL(typeof input==='string'?input:(input&&input.url)||'',location.href)}catch(e){return null}
  }
  function withPath(input,path){
    if(typeof input!=='string')return input;
    try{const u=new URL(input,location.href);u.pathname=path;return u.toString()}catch(e){return input}
  }
  async function enrich(response){
    if(!response||response.ok)return response;
    try{
      const j=await response.clone().json();
      if(!j||typeof j!=='object')return response;
      const detail=String(j.detail||'').trim();
      if(String(j.error||'').trim()==='Erro interno.'&&detail){
        const safe={...j,error:'Erro interno: '+detail};
        return new Response(JSON.stringify(safe),{
          status:response.status,
          statusText:response.statusText,
          headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
        });
      }
    }catch(e){}
    return response;
  }
  async function callWithRetry(input,init,maxRetries){
    let last=null;
    for(let attempt=0;attempt<=maxRetries;attempt++){
      try{
        last=await nativeFetch(input,init);
        if(!RETRY_STATUS.has(last.status)||attempt===maxRetries)return last;
      }catch(e){
        if(attempt===maxRetries)throw e;
      }
      await wait(attempt===0?350:900);
    }
    return last;
  }

  window.fetch=async function(input,init){
    const u=inputUrl(input);
    if(!u||u.hostname!==API_HOST||!u.pathname.startsWith('/admin/'))return nativeFetch(input,init);

    const originalPath=u.pathname;
    const versionedPath=VERSIONED.get(originalPath)||'';
    const method=String(init&&init.method||'GET').toUpperCase();
    const readOnly=method==='GET'||READ_ONLY.has(originalPath);

    if(versionedPath&&typeof input==='string'){
      const versionedInput=withPath(input,versionedPath);
      let vr;
      try{vr=await callWithRetry(versionedInput,init,readOnly?2:0)}catch(e){throw e}
      if(vr.status!==404&&vr.status!==405){
        if(readOnly&&RETRY_STATUS.has(vr.status)){
          try{const legacy=await callWithRetry(input,init,1);return await enrich(legacy)}catch(e){}
        }
        return await enrich(vr);
      }
    }

    const r=await callWithRetry(input,init,readOnly?2:0);
    return await enrich(r);
  };

  window.addEventListener('unhandledrejection',function(ev){
    try{
      const msg=String(ev&&ev.reason&&ev.reason.message||ev&&ev.reason||'').trim();
      if(!msg)return;
      const box=document.getElementById('statusMsg')||document.getElementById('usedMsg');
      if(box&&!box.textContent.trim()){
        box.textContent='Falha temporária no painel: '+msg+'\nTente novamente. Seus dados não foram apagados.';
        box.className='status bad';
      }
    }catch(e){}
  });
})();
