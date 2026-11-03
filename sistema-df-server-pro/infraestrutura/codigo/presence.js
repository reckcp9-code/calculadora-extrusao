(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const PING_MS=240000;
  const RETRY_MS=1200;
  const BOOT_RETRY_LIMIT=75;
  let timer=0;
  let busy=false;
  let bootRetries=0;
  let lastPingAt=0;

  function deviceId(){
    try{return String(localStorage.getItem(DEVICE_KEY)||window.DF_DEVICE_ID||'').trim()}catch(e){return String(window.DF_DEVICE_ID||'').trim()}
  }

  function credential(){
    try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return ''}
  }

  function payload(state){
    return {credential:credential(),deviceId:deviceId(),platform:String(window.DF_PLATFORM_HINT||''),state:state||'online'};
  }

  function schedule(ms){
    clearTimeout(timer);
    timer=setTimeout(tick,Math.max(200,Number(ms)||PING_MS));
  }

  async function ping(force){
    if(busy||document.hidden||navigator.onLine===false)return false;
    const body=payload('online');
    if(!body.credential||!body.deviceId)return false;
    if(!force&&lastPingAt&&Date.now()-lastPingAt<12000)return true;
    busy=true;
    try{
      const r=await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':body.deviceId},
        body:JSON.stringify(body),
        cache:'no-store'
      });
      if(r&&r.ok)lastPingAt=Date.now();
      return !!(r&&r.ok);
    }catch(e){
      return false;
    }finally{
      busy=false;
    }
  }

  function sendOffline(){
    clearTimeout(timer);
    const body=payload('offline');
    if(!body.credential||!body.deviceId)return;
    const raw=JSON.stringify(body);
    try{
      if(navigator.sendBeacon){
        const blob=new Blob([raw],{type:'text/plain;charset=UTF-8'});
        navigator.sendBeacon(API+'/access/presence',blob);
      }
    }catch(e){}
    try{
      fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=UTF-8','X-DF-Device':body.deviceId},
        body:raw,
        cache:'no-store',
        keepalive:true
      }).catch(function(){});
    }catch(e){}
  }

  async function tick(){
    const hasAccess=!!credential()&&!!deviceId();
    if(!hasAccess&&bootRetries<BOOT_RETRY_LIMIT){
      bootRetries++;
      schedule(RETRY_MS);
      return;
    }
    if(hasAccess)bootRetries=BOOT_RETRY_LIMIT;
    await ping(true);
    schedule(PING_MS);
  }

  function wake(){
    if(document.hidden)return;
    schedule(150);
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden)sendOffline();
    else wake();
  });
  window.addEventListener('focus',wake);
  window.addEventListener('pageshow',wake);
  window.addEventListener('online',wake);
  window.addEventListener('df-access-ready',wake);
  window.addEventListener('pagehide',sendOffline);
  window.addEventListener('beforeunload',sendOffline);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){schedule(250)});
  else schedule(250);
})();
