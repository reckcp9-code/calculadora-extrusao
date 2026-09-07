(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  let restoring=false;

  function deviceId(){
    let id=String(localStorage.getItem(DEVICE_KEY)||'').trim();
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function hasCredential(){return !!String(localStorage.getItem(ACCESS_KEY)||'').trim()}

  function setMessage(text,ok){
    const e=document.getElementById('licenseMsg');
    if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }

  function unlock(){
    try{
      if(typeof window.dfUnlocked==='function')window.dfUnlocked();
      else{
        const gate=document.getElementById('licenseGate');
        const app=document.getElementById('appContent');
        if(gate)gate.style.display='none';
        if(app)app.style.display='block';
      }
    }catch(e){}
  }

  function cleanGeneralParam(){
    try{
      const u=new URL(location.href);
      if(String(u.searchParams.get('acesso')||'').toLowerCase()!=='geral')return;
      u.searchParams.delete('acesso');
      history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||''));
    }catch(e){}
  }

  function hideVerification(){
    if(!hasCredential())return;
    const wrap=document.getElementById('dfAccessIdentityWrap');
    const key=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    if(wrap)wrap.style.display='none';
    if(key)key.style.display='none';
    if(btn){btn.disabled=true;btn.textContent='ENTRANDO...'}
    setMessage('Este aparelho já possui um acesso cadastrado. Restaurando...',true);
  }

  async function restore(){
    if(restoring||!hasCredential())return false;
    restoring=true;
    hideVerification();
    try{
      const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
      const dev=deviceId();
      const r=await fetch(API+'/access/session',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential,deviceId:dev}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false){
        if(r.status===401||r.status===403||r.status===404||r.status===410){
          localStorage.removeItem(ACCESS_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          const wrap=document.getElementById('dfAccessIdentityWrap');
          const btn=document.getElementById('licenseBtn');
          if(wrap)wrap.style.display='';
          if(btn){btn.disabled=false;btn.textContent='ACESSAR'}
          setMessage(j.error||'O acesso salvo não está mais válido.',false);
        }
        return false;
      }
      const token=String(j.token||'').trim();
      if(!token)return false;
      sessionStorage.setItem(TOKEN_KEY,token);
      cleanGeneralParam();
      setMessage('Acesso já cadastrado neste aparelho. Entrando...',true);
      setTimeout(unlock,60);setTimeout(unlock,400);
      return true;
    }catch(e){
      setMessage('Não foi possível restaurar o acesso agora. Tente novamente.',false);
      return false;
    }finally{restoring=false}
  }

  function replaceOldText(){
    try{
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;
      while((n=walker.nextNode())){
        if(n.nodeValue&&n.nodeValue.includes('O vínculo é feito pelo ID deste aparelho no LicenseAuth.')){
          n.nodeValue=n.nodeValue.replace('O vínculo é feito pelo ID deste aparelho no LicenseAuth.','O vínculo é controlado pelo sistema DF EXTRUSOR.');
        }
      }
    }catch(e){}
  }

  function guard(){
    replaceOldText();
    if(!hasCredential())return;
    hideVerification();
    const btn=document.getElementById('licenseBtn');
    if(btn&&btn.dataset.dfExistingGuard!=='1'){
      btn.dataset.dfExistingGuard='1';
      btn.addEventListener('click',function(e){
        if(!hasCredential())return;
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        restore();
      },true);
    }
    restore();
  }

  function init(){
    guard();
    const obs=new MutationObserver(()=>guard());
    obs.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>obs.disconnect(),12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
