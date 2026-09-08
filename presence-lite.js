(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const HEARTBEAT_MS=4*60*1000;
  let timer=0;
  let sending=false;
  let queuedState='';
  let retries=0;

  function credential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
  function storedDevice(){try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
  function canonicalDevice(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function')return String(window.DFDeviceIdentity.get()||'').trim();
    }catch(e){}
    return '';
  }
  function deviceCandidates(){
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
  function stop(){if(timer){clearTimeout(timer);timer=0}}
  function schedule(ms){stop();if(document.hidden)return;timer=setTimeout(()=>send('online'),Math.max(1000,Number(ms)||HEARTBEAT_MS))}

  async function postPresence(state,dev,keepalive){
    const cred=credential();
    if(!cred||!dev)return null;
    try{
      return await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential:cred,deviceId:dev,state:state,platform:platform()}),
        cache:'no-store',
        keepalive:!!keepalive
      });
    }catch(e){return null}
  }

  async function send(state){
    if(sending){queuedState=state;return false}
    const cred=credential(),devices=deviceCandidates();
    if(!cred||!devices.length){
      if(state==='online'&&retries<60){retries++;schedule(1000)}
      return false;
    }
    sending=true;
    let ok=false;
    try{
      for(const dev of devices){
        const r=await postPresence(state,dev,state==='offline');
        if(r&&r.ok){ok=true;break}
        if(r&&r.status!==401)break;
      }
      if(ok)retries=0;
      return ok;
    }finally{
      sending=false;
      const next=queuedState;queuedState='';
      if(next)send(next);
      else if(state==='online'&&!document.hidden)schedule(HEARTBEAT_MS);
    }
  }

  function sendOfflineFast(){
    stop();
    const cred=credential(),dev=storedDevice()||canonicalDevice();
    if(!cred||!dev)return;
    const body=JSON.stringify({credential:cred,deviceId:dev,state:'offline',platform:platform()});
    try{fetch(API+'/access/presence',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body,cache:'no-store',keepalive:true}).catch(()=>{})}catch(e){}
  }

  function onlineNow(){if(document.hidden)return;send('online')}
  function init(){onlineNow();window.addEventListener('df-ui-ready',onlineNow,{once:true})}

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){sendOfflineFast();return}
    onlineNow();
  });
  window.addEventListener('focus',onlineNow);
  window.addEventListener('online',onlineNow);
  window.addEventListener('pageshow',onlineNow);
  window.addEventListener('pagehide',sendOfflineFast);
  window.addEventListener('beforeunload',sendOfflineFast);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
