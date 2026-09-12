(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const RECOVERY_KEY='df_access_recovery_secret_v1';
  const RECOVERY_COOKIE='df_access_recovery_v1';
  const BOUND_KEY='df_access_recovery_bound_v1';
  const COOKIE_MAX_AGE=315360000; // 10 anos
  let binding=false;
  let restoring=false;

  function readCookie(name){
    try{
      const prefix=name+'=';
      for(const part of String(document.cookie||'').split(';')){
        const item=part.trim();
        if(item.startsWith(prefix))return decodeURIComponent(item.slice(prefix.length)).trim();
      }
    }catch(e){}
    return '';
  }

  function writeCookie(name,value){
    if(!value)return;
    try{document.cookie=name+'='+encodeURIComponent(value)+'; Max-Age='+COOKIE_MAX_AGE+'; Path=/; SameSite=Lax; Secure'}catch(e){}
  }

  function savedCredential(){
    try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return ''}
  }

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const id=String(window.DFDeviceIdentity.get()||'').trim();
        if(id)return id;
      }
    }catch(e){}
    let id='';
    try{id=String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){}
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      try{localStorage.setItem(DEVICE_KEY,id)}catch(e){}
    }
    return id;
  }

  function newSecret(){
    try{
      const bytes=crypto.getRandomValues(new Uint8Array(32));
      let bin='';
      for(const b of bytes)bin+=String.fromCharCode(b);
      return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }catch(e){
      return (crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))+
        (crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2));
    }
  }

  function recoverySecret(){
    const fromCookie=readCookie(RECOVERY_COOKIE);
    let fromStorage='';
    try{fromStorage=String(localStorage.getItem(RECOVERY_KEY)||'').trim()}catch(e){}
    const secret=fromCookie||fromStorage||newSecret();
    try{if(fromStorage!==secret)localStorage.setItem(RECOVERY_KEY,secret)}catch(e){}
    if(fromCookie!==secret)writeCookie(RECOVERY_COOKIE,secret);
    return secret;
  }

  function platform(){
    const ua=String(navigator.userAgent||'');
    if(/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'iPad';
    if(/iPhone|iPod/i.test(ua))return 'iOS';
    if(/Android/i.test(ua))return 'Android';
    if(/Windows NT|Macintosh|CrOS|Linux|X11/i.test(ua))return 'PC';
    return 'Outro';
  }

  async function bind(){
    if(binding||navigator.onLine===false)return false;
    const credential=savedCredential();
    if(!credential)return false;
    const secret=recoverySecret();
    if(!secret)return false;
    try{
      const already=String(localStorage.getItem(BOUND_KEY)||'');
      if(already===credential)return true;
    }catch(e){}
    binding=true;
    try{
      const dev=deviceId();
      const r=await fetch(API+'/access/recovery/bind',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential,recoverySecret:secret,deviceId:dev,platform:platform()}),
        cache:'no-store'
      });
      if(r.status===404)return false;
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)return false;
      try{localStorage.setItem(BOUND_KEY,credential)}catch(e){}
      return true;
    }catch(e){
      return false;
    }finally{
      binding=false;
    }
  }

  async function restore(){
    if(restoring||navigator.onLine===false||savedCredential())return false;
    const secret=recoverySecret();
    if(!secret)return false;
    restoring=true;
    try{
      const dev=deviceId();
      const r=await fetch(API+'/access/recovery/restore',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({recoverySecret:secret,deviceId:dev,platform:platform()}),
        cache:'no-store'
      });
      if(r.status===404)return false;
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)return false;
      const credential=String(j.accessCredential||'').trim();
      const token=String(j.token||'').trim();
      if(!credential||!token)return false;
      try{
        localStorage.setItem(ACCESS_KEY,credential);
        localStorage.setItem(BOUND_KEY,credential);
        sessionStorage.setItem(TOKEN_KEY,token);
      }catch(e){return false}
      try{window.dispatchEvent(new CustomEvent('df-access-recovered'))}catch(e){}
      location.reload();
      return true;
    }catch(e){
      return false;
    }finally{
      restoring=false;
    }
  }

  window.DFAccessRecovery={bind,restore,getSecret:recoverySecret};
  window.DFAccessRecoveryReady=restore();

  window.addEventListener('pageshow',()=>setTimeout(bind,350));
  window.addEventListener('df-ui-ready',()=>setTimeout(bind,500));
  window.addEventListener('online',()=>{setTimeout(()=>{if(savedCredential())bind();else restore()},500)});

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(savedCredential()){
      bind();
      clearInterval(timer);
    }else if(tries>=30){
      clearInterval(timer);
    }
  },1000);
})();
