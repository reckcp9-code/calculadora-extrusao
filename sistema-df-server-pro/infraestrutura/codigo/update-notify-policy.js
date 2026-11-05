(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VERSION_URL='./app-version.json';
  const LAST_VERSION='df_last_version_seen_v1';
  const LAST_NOTIFY='df_last_version_notified_v1';
  let syncing=false;

  function patchServiceWorkerRegister(){
    try{
      if(!('serviceWorker' in navigator)||navigator.serviceWorker.dfPolicyPatched)return;
      const original=navigator.serviceWorker.register.bind(navigator.serviceWorker);
      navigator.serviceWorker.register=function(scriptURL,options){
        try{
          const u=new URL(scriptURL,location.href);
          if(u.pathname.endsWith('/sw.js'))scriptURL=u.pathname.replace(/sw\.js$/,'sw-policy.js')+u.search;
        }catch(e){}
        return original(scriptURL,options);
      };
      navigator.serviceWorker.dfPolicyPatched=true;
    }catch(e){}
  }

  async function currentVersion(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return'';
      const j=await r.json();
      return String(j&&j.version||'').trim();
    }catch(e){return''}
  }

  async function shouldNotify(version){
    try{
      const u=new URL(API+'/update/notification-policy');
      u.searchParams.set('version',String(version||''));
      u.searchParams.set('t',Date.now());
      const r=await fetch(u.toString(),{cache:'no-store'});
      if(!r.ok)return true;
      const j=await r.json();
      return j&&j.notify===true;
    }catch(e){return true}
  }

  async function syncPolicy(){
    if(syncing||document.hidden)return;
    syncing=true;
    try{
      const version=await currentVersion();
      if(!version)return;
      const notify=await shouldNotify(version);
      if(notify)return;
      try{
        localStorage.setItem(LAST_VERSION,version);
        localStorage.setItem(LAST_NOTIFY,version);
      }catch(e){}
      try{
        const reg=await navigator.serviceWorker.ready;
        const target=reg.active||reg.waiting||reg.installing;
        if(target)target.postMessage({type:'DF_SET_VERSION',version});
      }catch(e){}
    }finally{syncing=false}
  }

  patchServiceWorkerRegister();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncPolicy,{once:true});
  else syncPolicy();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPolicy()});
})();