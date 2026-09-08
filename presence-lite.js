(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const HEARTBEAT_MS=4*60*1000;
  let timer=0;
  let sending=false;
  let retries=0;

  function credential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const v=String(window.DFDeviceIdentity.get()||'').trim();if(v)return v;
      }
    }catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}
  }
  function platform(){
    const ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua))return 'iOS';
    if(/Android/i.test(ua))return 'Android';
    if(/Windows/i.test(ua))return 'Windows';
    if(/Macintosh|Mac OS X/i.test(ua))return 'macOS';
    return 'Web';
  }
  function stop(){if(timer){clearTimeout(timer);timer=0}}
  function schedule(ms){stop();if(document.hidden)return;timer=setTimeout(()=>send('online'),Math.max(1000,Number(ms)||HEARTBEAT_MS))}

  async function send(state){
    if(sending)return false;
    const cred=credential(),dev=deviceId();
    if(!cred||!dev){
      if(state==='online'&&retries<30){retries++;schedule(1000)}
      return false;
    }
    sending=true;
    try{
      const r=await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential:cred,deviceId:dev,state:state,platform:platform()}),
        cache:'no-store',
        keepalive:state==='offline'
      });
      if(r.ok){retries=0;return true}
      return false;
    }catch(e){return false}
    finally{
      sending=false;
      if(state==='online'&&!document.hidden)schedule(HEARTBEAT_MS);
    }
  }

  function onlineNow(){if(document.hidden)return;send('online')}
  function init(){onlineNow();window.addEventListener('df-ui-ready',onlineNow,{once:true})}

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){stop();return}
    onlineNow();
  });
  window.addEventListener('focus',onlineNow);
  window.addEventListener('online',onlineNow);
  window.addEventListener('pagehide',function(){stop();send('offline')});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
