(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LAST_KEY='df_presence_last_online_v103';
  const HEARTBEAT_MS=5*60*1000;
  const ENTRY_THROTTLE_MS=10*60*1000;

  let timer=0;
  let sending=false;
  let retries=0;

  function credential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
  function storedDevice(){try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
  function canonicalDevice(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function')return String(window.DFDeviceIdentity.get()||'').trim();
    }catch(e){}
    return '';
  }
  function devices(){
    const a=storedDevice(),b=canonicalDevice(),out=[];
    if(a)out.push(a);
    if(b&&!out.includes(b))out.push(b);
    return out;
  }
  function platform(){
    const ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua))return 'iOS';
    if(/Android/i.test(ua))return 'Android';
    if(/Windows/i.test(ua))return 'Windows';
    if(/Macintosh|Mac OS X/i.test(ua))return 'macOS';
    return 'Web';
  }
  function lastOnline(){try{return Number(localStorage.getItem(LAST_KEY)||0)||0}catch(e){return 0}}
  function markOnline(){try{localStorage.setItem(LAST_KEY,String(Date.now()))}catch(e){}}
  function stop(){if(timer){clearTimeout(timer);timer=0}}
  function schedule(ms){
    stop();
    if(document.hidden)return;
    timer=setTimeout(function(){sendOnline(true)},Math.max(1500,Number(ms)||HEARTBEAT_MS));
  }

  async function postOnline(dev){
    const cred=credential();
    if(!cred||!dev)return null;
    try{
      return await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential:cred,deviceId:dev,state:'online',platform:platform()}),
        cache:'no-store'
      });
    }catch(e){return null}
  }

  async function sendOnline(heartbeat){
    if(document.hidden||sending)return false;

    const cred=credential(),list=devices();
    if(!cred||!list.length){
      if(retries<20){retries++;schedule(1500)}
      return false;
    }

    const age=Date.now()-lastOnline();
    if(!heartbeat&&age>=0&&age<ENTRY_THROTTLE_MS){
      schedule(Math.max(30000,HEARTBEAT_MS));
      return true;
    }

    sending=true;
    let ok=false;
    try{
      for(const dev of list){
        const r=await postOnline(dev);
        if(r&&r.ok){ok=true;break}
        if(r&&r.status!==401)break;
      }
      if(ok){markOnline();retries=0}
      return ok;
    }finally{
      sending=false;
      schedule(HEARTBEAT_MS);
    }
  }

  function resume(){
    if(document.hidden){stop();return}
    const age=Date.now()-lastOnline();
    if(age>=ENTRY_THROTTLE_MS)sendOnline(false);
    else schedule(HEARTBEAT_MS);
  }

  function init(){sendOnline(false)}

  // No iPhone, sair momentaneamente para a Tela de Início não significa logout.
  // Por isso não enviamos "offline" em visibilitychange/pagehide/beforeunload.
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('online',resume);
  window.addEventListener('pageshow',resume);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
