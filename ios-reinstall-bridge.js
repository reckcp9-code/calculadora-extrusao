(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const PREPARED_AT_KEY='df_ios_install_prepared_at_v1';
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

  function alreadyInstallerUrl(){
    try{return location.pathname.endsWith('/instalar.html')&&!!new URL(location.href).searchParams.get('instalar')}catch(e){return false}
  }

  async function prepare(){
    if(!isIos()||isStandalone()||alreadyInstallerUrl()||navigator.onLine===false)return;
    const cred=credential();
    if(!cred)return;

    // Evita chamadas repetidas no mesmo carregamento/retorno rápido.
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

      // No iPhone, "Adicionar à Tela de Início" usa a URL preparada.
      // Mantemos a tela atual aberta, mas deixamos a URL com o token temporário
      // para que uma reinstalação recupere o mesmo acesso/equipe automaticamente.
      const next='/instalar.html?instalar='+encodeURIComponent(token);
      history.replaceState(history.state,'',next);
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(prepare,250),{once:true});
  else setTimeout(prepare,250);
  window.addEventListener('pageshow',()=>setTimeout(prepare,250));
})();
