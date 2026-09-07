(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const PING_MS=60000;
  let timer=0;
  let busy=false;

  function deviceId(){
    try{return String(localStorage.getItem(DEVICE_KEY)||window.DF_DEVICE_ID||'').trim()}catch(e){return String(window.DF_DEVICE_ID||'').trim()}
  }

  function credential(){
    try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return ''}
  }

  function schedule(ms){
    clearTimeout(timer);
    timer=setTimeout(tick,Math.max(500,Number(ms)||PING_MS));
  }

  async function ping(){
    if(busy||document.hidden||navigator.onLine===false)return;
    const cred=credential(),device=deviceId();
    if(!cred||!device)return;
    busy=true;
    try{
      await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':device},
        body:JSON.stringify({credential:cred,deviceId:device,platform:String(window.DF_PLATFORM_HINT||'')}),
        cache:'no-store'
      });
    }catch(e){}finally{busy=false}
  }

  async function tick(){
    await ping();
    schedule(PING_MS);
  }

  function wake(){schedule(300)}

  document.addEventListener('visibilitychange',function(){if(!document.hidden)wake()});
  window.addEventListener('online',wake);
  window.addEventListener('pagehide',function(){clearTimeout(timer)});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){schedule(1200)});
  else schedule(1200);
})();
