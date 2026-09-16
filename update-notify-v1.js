(function(){
  'use strict';
  if(window.DFUpdateNotifyV1)return;
  window.DFUpdateNotifyV1=true;

  const SEEN_KEY='df_update_seen_version_v1';
  const AUTO_KEY='df_update_auto_applied_v1';
  const CHECK_MS=2*60*1000;
  let timer=0,updating=false,permHotfixLoaded=false;

  function loadPermissionHotfix(){
    if(permHotfixLoaded||window.DFTeamTabPermissionsHotfixV195)return;
    permHotfixLoaded=true;
    try{
      const s=document.createElement('script');
      s.src='./team-tab-permissions-hotfix-v195.js?v=195&t='+Date.now();
      s.async=false;
      s.onerror=()=>{permHotfixLoaded=false};
      document.head.appendChild(s);
    }catch(e){permHotfixLoaded=false}
  }

  async function clearOldShellCaches(){
    try{
      if(!('caches' in window))return;
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>
        k.startsWith('df-app-shell-source-')||
        k.startsWith('df-app-shell-test-')||
        k.startsWith('df-extrusor-shell-')
      ).map(k=>caches.delete(k)));
    }catch(e){}
  }

  async function refreshServiceWorker(){
    try{
      if(!('serviceWorker' in navigator))return;
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(async r=>{try{await r.update()}catch(e){}}));
      for(const r of regs){
        try{if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}
      }
    }catch(e){}
  }

  async function applyUpdate(v){
    if(updating||!v||!v.version)return;
    const current=String(v.version).trim();
    if(!current)return;
    let applied='';
    try{applied=String(localStorage.getItem(AUTO_KEY)||'')}catch(e){}
    if(applied===current)return;
    updating=true;
    try{
      localStorage.setItem(AUTO_KEY,current);
      localStorage.setItem(SEEN_KEY,current);
    }catch(e){}
    await refreshServiceWorker();
    await clearOldShellCaches();
    const u=new URL(location.href);
    u.searchParams.set('v',current);
    u.searchParams.set('t',Date.now());
    setTimeout(()=>location.replace(u.toString()),80);
  }

  async function check(){
    loadPermissionHotfix();
    if(updating||document.hidden)return;
    try{
      const r=await fetch('./app-version.json?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const v=await r.json();
      const current=String(v&&v.version||'').trim();if(!current)return;
      let seen='';try{seen=String(localStorage.getItem(SEEN_KEY)||'')}catch(e){}
      if(!seen){
        try{localStorage.setItem(SEEN_KEY,current);localStorage.setItem(AUTO_KEY,current)}catch(e){}
        return;
      }
      if(seen!==current)await applyUpdate(v);
    }catch(e){}
  }

  function start(){
    loadPermissionHotfix();
    check();
    clearInterval(timer);
    timer=setInterval(check,CHECK_MS);
  }

  window.dfCheckForUpdate=check;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',()=>{loadPermissionHotfix();setTimeout(check,250)});
  window.addEventListener('focus',()=>{loadPermissionHotfix();setTimeout(check,150)});
  window.addEventListener('online',()=>{loadPermissionHotfix();setTimeout(check,150)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadPermissionHotfix();setTimeout(check,120)}});
})();
