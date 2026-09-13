(function(){
  'use strict';
  if(window.DFPushBackgroundRepairV1)return;
  window.DFPushBackgroundRepairV1=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VAPID_PUBLIC_KEY='BCeh5o1hAKV598vbnKqDfoIMcsGZaxKmfW8fVmR3FdGoAOOUWeBoeikXc_s07eb47M-6Kwl991u4w0MFuv4-rGU';
  const DEVICE_KEY='df_licenseauth_device_v1';
  let running=false,lastSync=0;

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent||'') ||
      (navigator.platform==='MacIntel' && Number(navigator.maxTouchPoints||0)>1);
  }
  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }
  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const v=String(window.DFDeviceIdentity.get()||'').trim();
        if(v)return v;
      }
    }catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return ''}
  }
  function b64ToBytes(value){
    const pad='='.repeat((4-value.length%4)%4);
    const raw=atob((value+pad).replace(/-/g,'+').replace(/_/g,'/'));
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  }
  async function register(){
    const base=new URL('./',location.href).pathname;
    const reg=await navigator.serviceWorker.register(base+'sw.js',{scope:base});
    await navigator.serviceWorker.ready;
    return reg;
  }
  async function sendSubscription(sub){
    const headers={'Content-Type':'application/json'};
    const dev=deviceId();if(dev)headers['X-DF-Device']=dev;
    const r=await fetch(API+'/push/subscribe',{
      method:'POST',headers,body:JSON.stringify({subscription:sub.toJSON()}),cache:'no-store'
    });
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||('Push HTTP '+r.status));
    return true;
  }
  async function sync(force){
    if(running)return false;
    if(!force && Date.now()-lastSync<60000)return true;
    if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))return false;
    if(Notification.permission!=='granted')return false;
    if(isIos()&&!isStandalone())return false;

    running=true;
    try{
      const reg=await register();
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:b64ToBytes(VAPID_PUBLIC_KEY)
        });
      }
      await sendSubscription(sub);
      lastSync=Date.now();
      try{window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted',push:true,repaired:true}}))}catch(e){}
      return true;
    }catch(e){
      console.warn('DF push repair:',e);
      return false;
    }finally{running=false}
  }

  function start(){
    setTimeout(()=>sync(true),1800);
    setTimeout(()=>sync(false),7000);
  }
  window.DFPushBackgroundSync=()=>sync(true);
  window.addEventListener('df-ui-ready',start,{once:true});
  window.addEventListener('online',()=>setTimeout(()=>sync(false),800));
  window.addEventListener('focus',()=>setTimeout(()=>sync(false),600));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>sync(false),500)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
