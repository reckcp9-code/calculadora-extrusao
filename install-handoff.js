(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const nativeFetch=window.fetch.bind(window);

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }

  function deviceId(){
    let id=String(localStorage.getItem(DEVICE_KEY)||'').trim();
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
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

  async function prepareIosHandoff(button){
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    if(!credential){
      alert('Entre pelo link geral do DF EXTRUSOR antes de adicionar à Tela de Início.');
      return;
    }

    button.disabled=true;
    button.textContent='PREPARANDO INSTALAÇÃO...';
    try{
      const r=await nativeFetch(API+'/access/install-handoff/create',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({credential,deviceId:deviceId(),platformKey:platformKey()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível preparar a instalação.');
      const token=String(j.installToken||'').trim();
      if(!token)throw new Error('O servidor não retornou a transferência de instalação.');
      location.assign('/instalar.html?instalar='+encodeURIComponent(token));
    }catch(e){
      button.disabled=false;
      button.textContent='PREPARAR INSTALAÇÃO';
      alert(String(e&&e.message||e));
    }
  }

  function hookIosInstallButton(){
    if(!isIos()||isStandalone())return;
    const b=document.getElementById('dfInstallNow');
    if(!b||b.dataset.dfHandoffHook==='1')return;
    b.dataset.dfHandoffHook='1';
    b.textContent='PREPARAR INSTALAÇÃO';
    b.onclick=()=>prepareIosHandoff(b);
  }

  if(isIos()&&!isStandalone()){
    const obs=new MutationObserver(()=>hookIosInstallButton());
    if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookIosInstallButton);
    else hookIosInstallButton();
  }
})();
