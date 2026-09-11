(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const PREPARED_AT_KEY='df_ios_install_prepared_at_v1';
  const INSTALL_COOKIE='df_ios_install_token_v1';
  const nativeFetch=window.fetch.bind(window);

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }

  function credential(){
    try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return ''}
  }

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

  function writeInstallToken(token){
    if(!token)return;
    try{document.cookie=INSTALL_COOKIE+'='+encodeURIComponent(token)+'; Max-Age=1800; Path=/; SameSite=Lax; Secure'}catch(e){}
  }

  function clearInstallToken(){
    try{document.cookie=INSTALL_COOKIE+'=; Max-Age=0; Path=/; SameSite=Lax; Secure'}catch(e){}
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

  function platformKey(){
    let tz='';
    try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
    return [
      navigator.platform||'',
      navigator.language||'',
      String(screen.width||0)+'x'+String(screen.height||0),
      String(window.devicePixelRatio||1),
      String(navigator.maxTouchPoints||0),
      tz
    ].join('|');
  }

  function tokenFromUrl(){
    try{return String(new URL(location.href).searchParams.get('instalar')||'').trim()}catch(e){return ''}
  }

  async function recoverInstalledAccess(){
    if(!isIos()||!isStandalone()||navigator.onLine===false)return false;
    if(credential())return true;

    const installToken=tokenFromUrl()||readCookie(INSTALL_COOKIE);
    if(!installToken)return false;

    try{
      const dev=deviceId();
      const r=await nativeFetch(API+'/access/install-handoff/claim',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({token:installToken,deviceId:dev,platformKey:platformKey()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)return false;

      const accessCredential=String(j.accessCredential||'').trim();
      const sessionToken=String(j.token||'').trim();
      if(!accessCredential||!sessionToken)return false;

      localStorage.setItem(ACCESS_KEY,accessCredential);
      sessionStorage.setItem(TOKEN_KEY,sessionToken);
      clearInstallToken();
      try{history.replaceState(history.state,'','/')}catch(e){}
      window.dispatchEvent(new CustomEvent('df-ios-access-restored'));
      return true;
    }catch(e){
      return false;
    }
  }

  async function prepare(){
    if(!isIos()||isStandalone()||navigator.onLine===false)return;
    const cred=credential();
    if(!cred)return;

    try{
      const last=Number(sessionStorage.getItem(PREPARED_AT_KEY)||0);
      if(last&&Date.now()-last<30000)return;
      sessionStorage.setItem(PREPARED_AT_KEY,String(Date.now()));
    }catch(e){}

    try{
      const dev=deviceId();
      const r=await nativeFetch(API+'/access/install-handoff/create',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential:cred,deviceId:dev,platformKey:platformKey()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)return;
      const token=String(j.installToken||'').trim();
      if(!token)return;

      // Guarda a transferência também em cookie do mesmo domínio. Assim, mesmo
      // que o iPhone abra o PWA pelo start_url do manifest em vez da URL atual,
      // o app instalado consegue recuperar o mesmo acesso antes de consultar a equipe.
      writeInstallToken(token);

      const next='/instalar.html?instalar='+encodeURIComponent(token);
      history.replaceState(history.state,'',next);
    }catch(e){}
  }

  window.DFIosReinstallReady=recoverInstalledAccess();

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prepare,250),{once:true});
  else setTimeout(prepare,250);
  window.addEventListener('pageshow',()=>setTimeout(prepare,250));
})();
