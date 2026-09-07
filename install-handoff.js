(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const INSTALL_PARAM='instalar';
  const nativeFetch=window.fetch.bind(window);
  const firstUrl=new URL(location.href);
  const installToken=String(firstUrl.searchParams.get(INSTALL_PARAM)||'').trim();

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

  function saveAccess(j){
    const session=String(j&&j.token||'').trim();
    const credential=String(j&&j.accessCredential||'').trim();
    if(!session||!credential)throw new Error('O servidor não retornou o acesso completo.');
    sessionStorage.setItem(TOKEN_KEY,session);
    localStorage.setItem(ACCESS_KEY,credential);
  }

  function showTransferScreen(text,error){
    let box=document.getElementById('dfInstallTransferScreen');
    if(!box){
      box=document.createElement('div');
      box.id='dfInstallTransferScreen';
      box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#080b13;color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;text-align:center';
      box.innerHTML='<div style="width:min(92vw,430px);background:#0f172a;border:1px solid #334155;border-radius:20px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.5)"><img src="./logo.jpg.jpeg" alt="DF" style="width:68px;height:68px;border-radius:16px;object-fit:cover;margin-bottom:14px"><h2 style="margin:0 0 8px">DF EXTRUSOR PRO</h2><div id="dfInstallTransferText" style="font-size:14px;line-height:1.55;color:#cbd5e1"></div></div>';
      document.body.appendChild(box);
    }
    const t=document.getElementById('dfInstallTransferText');
    if(t){t.textContent=text;t.style.color=error?'#fca5a5':'#cbd5e1'}
  }

  async function claimInstalledAccess(){
    showTransferScreen('Transferindo seu acesso para o aplicativo instalado...',false);
    try{
      const r=await nativeFetch(API+'/access/install-handoff/claim',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({token:installToken,deviceId:deviceId(),platformKey:platformKey()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível transferir o acesso para o aplicativo.');
      saveAccess(j);
      showTransferScreen('Acesso transferido. Abrindo DF EXTRUSOR PRO...',false);
      setTimeout(()=>location.replace('/'),450);
    }catch(e){
      showTransferScreen(String(e&&e.message||e)+' Abra o DF EXTRUSOR pelo Safari e prepare a instalação novamente.',true);
    }
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

      const u=new URL(location.href);
      u.searchParams.set(INSTALL_PARAM,token);
      history.replaceState(null,'',u.pathname+u.search+u.hash);

      document.querySelectorAll('link[rel="manifest"]').forEach(el=>el.remove());

      const card=button.parentElement;
      const text=button.previousElementSibling;
      if(text){
        text.innerHTML='<b>Acesso preparado para este aparelho.</b><br>Agora toque em <b>Compartilhar</b> no Safari → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.<br><br>Quando abrir pelo novo ícone, a <b>mesma key</b> será transferida automaticamente e o acesso do Safari será encerrado.';
      }
      button.textContent='PRONTO — AGORA ADICIONE À TELA DE INÍCIO';
      button.disabled=true;

      const later=document.getElementById('dfInstallLater');
      if(later){
        later.textContent='CANCELAR INSTALAÇÃO';
        later.onclick=()=>{
          const clean=new URL(location.href);
          clean.searchParams.delete(INSTALL_PARAM);
          location.replace(clean.pathname+(clean.search||'')+(clean.hash||''));
        };
      }
      if(card)card.style.borderColor='#16a34a';
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

  if(isStandalone()&&installToken){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',claimInstalledAccess,{once:true});
    else claimInstalledAccess();
    return;
  }

  if(isIos()&&!isStandalone()){
    const obs=new MutationObserver(()=>hookIosInstallButton());
    if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookIosInstallButton);
    else hookIosInstallButton();
  }
})();
