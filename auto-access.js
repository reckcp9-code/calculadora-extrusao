(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LICENSE_KEY='df_licenseauth_license_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const ACCESS_PARAM='acesso';
  const GENERAL_TOKEN='geral';
  const previousFetch=window.fetch.bind(window);
  const initialUrl=new URL(location.href);
  const linkToken=String(initialUrl.searchParams.get(ACCESS_PARAM)||'').trim();
  const generalMode=linkToken.toLowerCase()===GENERAL_TOKEN;
  let renewPromise=null;

  function savedCredential(){return String(localStorage.getItem(ACCESS_KEY)||'').trim()}
  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem(DEVICE_KEY,id)}
    return id;
  }
  function apiUrl(input){try{return new URL(typeof input==='string'?input:input.url,location.href)}catch(e){return null}}
  function headersWith(init,newToken){const h=new Headers(init&&init.headers||{});if(newToken)h.set('Authorization','Bearer '+newToken);h.set('X-DF-Device',deviceId());return h}
  function setMessage(text,ok){const e=document.getElementById('licenseMsg');if(!e)return;e.textContent=text;e.className='licenseMsg '+(ok?'ok':'err')}
  function unlock(){try{if(typeof window.dfUnlocked==='function')window.dfUnlocked();else{const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='none';if(a)a.style.display='block'}}catch(e){}}
  function cleanAccessParam(){try{const clean=new URL(location.href);clean.searchParams.delete(ACCESS_PARAM);history.replaceState(null,'',clean.pathname+(clean.search||'')+(clean.hash||''))}catch(e){}}

  function unlockSavedImmediately(){
    if(!savedCredential())return false;
    cleanAccessParam();
    setTimeout(()=>{if(savedCredential()){setMessage('Acesso salvo restaurado.',true);unlock()}},10);
    setTimeout(()=>{if(savedCredential())unlock()},120);
    setTimeout(()=>{if(savedCredential())unlock()},500);
    return true;
  }

  async function renewAccess(){
    const credential=savedCredential();if(!credential)return '';
    if(renewPromise)return renewPromise;
    renewPromise=(async()=>{
      try{
        const r=await previousFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},body:JSON.stringify({credential,deviceId:deviceId()}),cache:'no-store'});
        let j={};try{j=await r.json()}catch(e){}
        if(!r.ok||j.ok===false){
          if(r.status===401||r.status===403||r.status===404||r.status===410){localStorage.removeItem(ACCESS_KEY);sessionStorage.removeItem(TOKEN_KEY)}
          return '';
        }
        const t=String(j.token||'').trim();if(t)sessionStorage.setItem(TOKEN_KEY,t);return t;
      }catch(e){return ''}finally{renewPromise=null}
    })();
    return renewPromise;
  }

  if(linkToken||savedCredential()){
    window.fetch=async function(input,init){
      const u=apiUrl(input);if(!u||u.hostname!==API_HOST)return previousFetch(input,init);
      const path=u.pathname;const special=path==='/access/redeem'||path==='/access/identify'||path==='/access/session'||path.startsWith('/admin/access/');
      let patched=init;
      if(!special){const current=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();if(current)patched={...(init||{}),headers:headersWith(init,current)}}
      let r=await previousFetch(input,patched);
      if(r.status!==401||special||!savedCredential())return r;
      const fresh=await renewAccess();if(!fresh)return r;
      patched={...(init||{}),headers:headersWith(init,fresh)};return previousFetch(input,patched);
    };
  }

  function saveAccess(j){
    const session=String(j&&j.token||'').trim(),credential=String(j&&j.accessCredential||'').trim();
    if(!session||!credential)throw new Error('O servidor não retornou o acesso completo.');
    sessionStorage.setItem(TOKEN_KEY,session);localStorage.setItem(ACCESS_KEY,credential);localStorage.removeItem(LICENSE_KEY);
  }

  async function redeemLegacy(){
    if(!linkToken||generalMode)return false;
    const btn=document.getElementById('licenseBtn');if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}
    setMessage('Preparando seu acesso automático...',false);
    try{
      const r=await previousFetch(API+'/access/redeem',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},body:JSON.stringify({token:linkToken,deviceId:deviceId()}),cache:'no-store'});
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível liberar este acesso.');
      saveAccess(j);cleanAccessParam();setMessage('Acesso liberado. Entrando...',true);if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}setTimeout(unlock,80);setTimeout(unlock,350);return true;
    }catch(e){setMessage(String(e&&e.message||e),false);if(btn){btn.disabled=false;btn.textContent='ACESSAR'}return false}
  }

  async function redeemIdentity(){
    const input=document.getElementById('dfAccessIdentity'),identity=String(input&&input.value||'').trim(),btn=document.getElementById('licenseBtn');
    if(!identity){setMessage('Digite sua identificação.',false);if(input)input.focus();return false}
    if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}setMessage('Verificando sua identificação...',false);
    try{
      const r=await previousFetch(API+'/access/identify',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},body:JSON.stringify({identity,deviceId:deviceId()}),cache:'no-store'});
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||('Falha no acesso ('+r.status+').'));
      saveAccess(j);cleanAccessParam();setMessage(j.reused?'Acesso reconhecido. Entrando...':'Acesso criado. Entrando...',true);if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}setTimeout(unlock,80);setTimeout(unlock,350);return true;
    }catch(e){setMessage(String(e&&e.message||e),false);if(btn){btn.disabled=false;btn.textContent='ACESSAR'}return false}
  }

  function setGateText(text){const title=document.querySelector('#licenseGate h1,#licenseGate h2');if(title)title.textContent='Acesso DF';const sub=document.querySelector('#licenseGate .licenseSub,#licenseGate p');if(sub)sub.textContent=text}
  function prepareGeneralGate(){
    if(!generalMode||savedCredential())return;
    const keyInput=document.getElementById('licenseKey'),btn=document.getElementById('licenseBtn');if(!btn)return;
    if(keyInput){keyInput.value='';keyInput.style.display='none'}
    setGateText('Informe sua identificação. Cada identificação recebe somente 1 licença, mesmo que o link seja aberto novamente.');
    let wrap=document.getElementById('dfAccessIdentityWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='dfAccessIdentityWrap';wrap.style.cssText='display:block!important;width:100%;margin:14px 0 10px;text-align:left;visibility:visible!important;opacity:1!important';
      const label=document.createElement('label');label.textContent='Sua identificação';label.setAttribute('for','dfAccessIdentity');label.style.cssText='display:block;margin:0 0 7px;font-size:13px;font-weight:800;color:#cbd5e1';
      const input=document.createElement('input');input.id='dfAccessIdentity';input.type='text';input.inputMode='text';input.autocomplete='username';input.placeholder='Digite seu WhatsApp ou código';input.style.cssText='display:block!important;width:100%!important;min-height:50px!important;box-sizing:border-box;border:1px solid #475569;background:#111827;color:#fff;border-radius:12px;padding:12px 14px;font:600 16px system-ui;outline:none;visibility:visible!important;opacity:1!important';
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();redeemIdentity()}});wrap.appendChild(label);wrap.appendChild(input);btn.parentNode.insertBefore(wrap,btn);
    }
    btn.textContent='ACESSAR';if(!btn.dataset.dfAccessBound){btn.dataset.dfAccessBound='1';btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemIdentity()},true)}
    setMessage('Use sempre a mesma identificação.',true);
  }
  function prepareLegacyGate(){
    if(!linkToken||generalMode||savedCredential())return;
    const input=document.getElementById('licenseKey'),btn=document.getElementById('licenseBtn');if(!btn)return;
    if(input){input.value='';input.style.display='none'}setGateText('Seu acesso está pronto. Toque em ACESSAR para liberar este aparelho.');btn.textContent='ACESSAR';
    if(!btn.dataset.dfAccessBound){btn.dataset.dfAccessBound='1';btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemLegacy()},true)}setMessage('Link de acesso válido para um único aparelho.',true);
  }
  async function resumeSavedAccess(){
    if(!savedCredential())return;
    cleanAccessParam();unlock();
    const t=await renewAccess();
    if(t){setMessage('Acesso automático restaurado.',true);unlock()}else if(savedCredential()){setMessage('Acesso salvo restaurado.',true);unlock()}
  }
  function boot(){
    const restored=unlockSavedImmediately();
    if(!restored){setTimeout(prepareGeneralGate,40);setTimeout(prepareGeneralGate,220);setTimeout(prepareGeneralGate,700);setTimeout(prepareLegacyGate,40);setTimeout(prepareLegacyGate,220)}
    setTimeout(resumeSavedAccess,100);
  }
  unlockSavedImmediately();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
