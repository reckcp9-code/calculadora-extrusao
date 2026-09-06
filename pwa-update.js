(function(){
  'use strict';
  const BASE=location.pathname.includes('/secure-frontend/')?'../':'./';
  const VERSION_URL=BASE+'app-version.json';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VAPID_PUBLIC_KEY='BAP5OpX-PiK0irnjMLuyzga7OV04cm7bnNp5s5cDqUuGMz4sZtkaS_6UUg2MEV-OgBJSaWWTLLZNndWHeVlBM5M';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LAST_VERSION='df_last_version_seen_v1';
  const LAST_NOTIFY='df_last_version_notified_v1';
  let reg=null;

  function ensureManifest(){
    if(document.querySelector('link[rel="manifest"]'))return;
    const link=document.createElement('link');
    link.rel='manifest';
    link.href=BASE+'manifest.webmanifest';
    document.head.appendChild(link);
  }

  function ensureAppleIcon(){
    if(document.querySelector('link[rel="apple-touch-icon"]'))return;
    const link=document.createElement('link');
    link.rel='apple-touch-icon';
    link.href=BASE+'logo.jpg.jpeg';
    document.head.appendChild(link);
  }

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}

  function b64ToBytes(s){
    let b64=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
    while(b64.length%4)b64+='=';
    const raw=atob(b64);
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  }

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true ||
      navigator.standalone===true;
  }

  async function registerSW(){
    if(!('serviceWorker' in navigator))return null;
    try{
      reg=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});
      await navigator.serviceWorker.ready;
      return reg;
    }catch(e){
      console.warn('DF SW:',e);
      return null;
    }
  }

  async function apiPost(path,body){
    const headers={'Content-Type':'application/json','X-DF-Device':deviceId()};
    const t=token();
    if(t)headers.Authorization='Bearer '+t;
    const r=await fetch(API+path,{method:'POST',headers,body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};
    try{j=await r.json();}catch(e){}
    if(!r.ok||j.ok===false){
      const err=new Error(j.error||('Erro HTTP '+r.status));
      err.status=r.status;
      throw err;
    }
    return j;
  }

  async function currentVersionData(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      return r.ok?await r.json():null;
    }catch(e){return null;}
  }

  async function syncVersionToSW(){
    try{
      const data=await currentVersionData();
      if(!data||!data.version)return;
      const r=reg||await navigator.serviceWorker.ready;
      const target=r.active||r.waiting||r.installing;
      if(target)target.postMessage({type:'DF_SET_VERSION',version:String(data.version)});
    }catch(e){}
  }

  async function clearBadge(){
    try{
      if('clearAppBadge' in navigator)await navigator.clearAppBadge();
      const r=reg||await navigator.serviceWorker.ready;
      const target=r.active||r.waiting||r.installing;
      if(target)target.postMessage({type:'DF_CLEAR_BADGE'});
    }catch(e){}
  }

  async function ensurePushSubscription(testAfter=false){
    if(!('PushManager' in window))throw new Error('Este navegador não oferece Web Push.');
    const r=reg||await registerSW()||await navigator.serviceWorker.ready;
    let sub=await r.pushManager.getSubscription();
    if(!sub){
      sub=await r.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:b64ToBytes(VAPID_PUBLIC_KEY)
      });
    }

    const t=token();
    if(!t)throw new Error('Entre com sua licença antes de ativar as atualizações.');

    await apiPost('/push/subscribe',{subscription:sub.toJSON()});
    if(testAfter)await apiPost('/push/test',{subscription:sub.toJSON()});
    return sub;
  }

  async function enablePeriodicCheck(){
    try{
      const r=reg||await navigator.serviceWorker.ready;
      if(r&&'periodicSync' in r){
        await r.periodicSync.register('df-version-check',{minInterval:60*60*1000});
      }
    }catch(e){console.warn('DF periodic sync:',e);}
  }

  async function showDeviceNotification(title,body){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    try{
      const r=reg||await navigator.serviceWorker.ready;
      if(r&&r.showNotification){
        await r.showNotification(title,{
          body,
          icon:BASE+'logo.svg',
          badge:BASE+'logo.svg',
          tag:'df-extrusor-update',
          renotify:true,
          data:{url:location.origin+'/'}
        });
      }
    }catch(e){console.warn(e);}
  }

  function removeBanner(){
    const el=document.getElementById('dfUpdateBanner');
    if(el)el.remove();
  }

  function showBanner(data){
    if(document.getElementById('dfUpdateBanner'))return;
    const box=document.createElement('div');
    box.id='dfUpdateBanner';
    box.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:99999;width:min(92vw,520px);background:#111827;color:#f8fafc;border:1px solid #f59e0b;border-radius:16px;padding:14px;box-shadow:0 18px 45px rgba(0,0,0,.45);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial';
    box.innerHTML='<div style="font-weight:900;color:#facc15;margin-bottom:4px">'+String(data.title||'DF EXTRUSOR PRO atualizado')+'</div><div style="font-size:13px;line-height:1.4;margin-bottom:10px">'+String(data.message||'Uma nova versão está disponível.')+'</div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="dfUpdateLater" style="border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer">DEPOIS</button><button id="dfUpdateNow" style="border:0;background:#f59e0b;color:#111827;border-radius:10px;padding:8px 11px;font-weight:900;cursor:pointer">ATUALIZAR AGORA</button></div>';
    document.body.appendChild(box);
    document.getElementById('dfUpdateLater').onclick=removeBanner;
    document.getElementById('dfUpdateNow').onclick=async()=>{
      try{localStorage.setItem(LAST_VERSION,String(data.version||''));}catch(e){}
      await clearBadge();
      try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}}catch(e){}
      const u=new URL(location.href);
      u.searchParams.set('v',String(data.version||Date.now()));
      u.searchParams.set('t',Date.now());
      location.replace(u.toString());
    };
  }

  async function checkVersion(){
    try{
      const data=await currentVersionData();
      if(!data)return;
      const current=String(data.version||'').trim();
      if(!current)return;
      const seen=localStorage.getItem(LAST_VERSION);
      if(!seen){
        localStorage.setItem(LAST_VERSION,current);
        await syncVersionToSW();
        return;
      }
      if(seen===current)return;
      showBanner(data);
      const notified=localStorage.getItem(LAST_NOTIFY);
      if(notified!==current){
        await showDeviceNotification(data.title||'DF EXTRUSOR PRO atualizado',data.message||'Nova versão disponível.');
        try{localStorage.setItem(LAST_NOTIFY,current);}catch(e){}
      }
    }catch(e){console.warn('DF version:',e);}
  }

  async function enableNotifications(){
    if(isIos()&&!isStandalone()){
      alert('No iPhone, primeiro adicione o DF EXTRUSOR à Tela de Início. Depois abra pelo ícone e toque novamente em ATIVAR ATUALIZAÇÕES.');
      return false;
    }
    if(!('Notification' in window)){
      alert('Este navegador não oferece notificações web.');
      return false;
    }
    if(!('serviceWorker' in navigator)||!('PushManager' in window)){
      alert('Este navegador não oferece Web Push.');
      return false;
    }

    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      alert('Notificações não foram permitidas. Você pode liberar depois nas configurações do aparelho.');
      return false;
    }

    try{
      await registerSW();
      await ensurePushSubscription(true);
      await syncVersionToSW();
      await enablePeriodicCheck();
      await clearBadge();
      window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted',push:true}}));
      return true;
    }catch(e){
      console.warn('DF push:',e);
      alert('A permissão foi liberada, mas o Web Push ainda não terminou de ativar: '+String(e&&e.message||e));
      window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted',push:false}}));
      return false;
    }
  }

  async function pushStatus(){
    try{
      if(!('Notification' in window))return 'unsupported';
      if(Notification.permission!=='granted')return Notification.permission;
      const r=reg||await registerSW()||await navigator.serviceWorker.ready;
      const sub=await r.pushManager.getSubscription();
      return sub?'push':'granted';
    }catch(e){return 'granted';}
  }

  window.dfEnableNotifications=enableNotifications;
  window.dfNotificationPermission=()=>('Notification' in window?Notification.permission:'unsupported');
  window.dfPushStatus=pushStatus;
  window.dfCheckForUpdate=checkVersion;
  window.dfClearAppBadge=clearBadge;

  async function init(){
    ensureManifest();
    ensureAppleIcon();
    await registerSW();
    await clearBadge();

    if('Notification' in window&&Notification.permission==='granted'){
      await syncVersionToSW();
      await enablePeriodicCheck();
      try{
        const r=reg||await navigator.serviceWorker.ready;
        const sub=await r.pushManager.getSubscription();
        if(sub&&token())await apiPost('/push/subscribe',{subscription:sub.toJSON()});
      }catch(e){console.warn('DF push sync:',e);}
    }

    setTimeout(checkVersion,1200);
    setInterval(checkVersion,15*60*1000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden){
        clearBadge();
        checkVersion();
      }
    });
    window.addEventListener('focus',clearBadge);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();