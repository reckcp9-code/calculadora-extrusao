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
  const hasAccess=!!linkToken||!!localStorage.getItem(ACCESS_KEY);
  let renewPromise=null;

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function apiUrl(input){
    try{return new URL(typeof input==='string'?input:input.url,location.href)}catch(e){return null}
  }

  function headersWith(init,newToken){
    const h=new Headers(init&&init.headers||{});
    if(newToken)h.set('Authorization','Bearer '+newToken);
    h.set('X-DF-Device',deviceId());
    return h;
  }

  async function renewAccess(){
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    if(!credential)return '';
    if(renewPromise)return renewPromise;

    renewPromise=(async()=>{
      try{
        const r=await previousFetch(API+'/access/session',{
          method:'POST',
          headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
          body:JSON.stringify({credential,deviceId:deviceId()}),
          cache:'no-store'
        });
        let j={};try{j=await r.json()}catch(e){}
        if(!r.ok||j.ok===false){
          if(r.status===401||r.status===403||r.status===404||r.status===410){
            localStorage.removeItem(ACCESS_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
          }
          return '';
        }
        const t=String(j.token||'').trim();
        if(t)sessionStorage.setItem(TOKEN_KEY,t);
        return t;
      }catch(e){
        return '';
      }finally{
        renewPromise=null;
      }
    })();

    return renewPromise;
  }

  if(hasAccess){
    window.fetch=async function(input,init){
      const u=apiUrl(input);
      if(!u||u.hostname!==API_HOST)return previousFetch(input,init);

      const path=u.pathname;
      const special=path==='/access/redeem'||path==='/access/identify'||path==='/access/session'||path.startsWith('/admin/access/');
      let patched=init;

      if(!special){
        const current=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();
        if(current)patched={...(init||{}),headers:headersWith(init,current)};
      }

      let r=await previousFetch(input,patched);
      if(r.status!==401||special||!localStorage.getItem(ACCESS_KEY))return r;

      const fresh=await renewAccess();
      if(!fresh)return r;
      patched={...(init||{}),headers:headersWith(init,fresh)};
      return previousFetch(input,patched);
    };
  }

  function setMessage(text,ok){
    const e=document.getElementById('licenseMsg');
    if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }

  function unlock(){
    try{if(typeof window.dfUnlocked==='function')window.dfUnlocked();else{
      const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');
      if(g)g.style.display='none';if(a)a.style.display='block';
    }}catch(e){}
  }

  function saveAccess(j){
    const session=String(j&&j.token||'').trim();
    const credential=String(j&&j.accessCredential||'').trim();
    if(!session||!credential)throw new Error('O servidor não retornou o acesso completo.');
    sessionStorage.setItem(TOKEN_KEY,session);
    localStorage.setItem(ACCESS_KEY,credential);
    localStorage.removeItem(LICENSE_KEY);
  }

  function cleanAccessParam(){
    const clean=new URL(location.href);
    clean.searchParams.delete(ACCESS_PARAM);
    history.replaceState(null,'',clean.pathname+(clean.search||'')+(clean.hash||''));
  }

  async function redeemLegacy(){
    if(!linkToken||generalMode)return false;
    const btn=document.getElementById('licenseBtn');
    if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}
    setMessage('Preparando seu acesso automático...',false);

    try{
      const r=await previousFetch(API+'/access/redeem',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({token:linkToken,deviceId:deviceId()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível liberar este acesso.');
      saveAccess(j);
      cleanAccessParam();
      setMessage('Acesso liberado. Entrando...',true);
      if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}
      setTimeout(unlock,120);setTimeout(unlock,650);
      return true;
    }catch(e){
      setMessage(String(e&&e.message||e),false);
      if(btn){btn.disabled=false;btn.textContent='ACESSAR'}
      return false;
    }
  }

  async function redeemIdentity(){
    const input=document.getElementById('dfAccessIdentity');
    const identity=String(input&&input.value||'').trim();
    const btn=document.getElementById('licenseBtn');
    if(!identity){setMessage('Digite sua identificação.',false);if(input)input.focus();return false}
    if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}
    setMessage('Verificando sua identificação...',false);

    try{
      const r=await previousFetch(API+'/access/identify',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({identity,deviceId:deviceId()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível liberar este acesso.');
      saveAccess(j);
      cleanAccessParam();
      setMessage(j.reused?'Acesso reconhecido. Entrando...':'Acesso criado. Entrando...',true);
      if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}
      setTimeout(unlock,120);setTimeout(unlock,650);
      return true;
    }catch(e){
      setMessage(String(e&&e.message||e),false);
      if(btn){btn.disabled=false;btn.textContent='ACESSAR'}
      return false;
    }
  }

  function setGateText(text){
    const title=document.querySelector('#licenseGate h1,#licenseGate h2');
    if(title)title.textContent='Acesso DF';
    const sub=document.querySelector('#licenseGate .licenseSub,#licenseGate p');
    if(sub)sub.textContent=text;
  }

  function prepareGeneralGate(){
    if(!generalMode)return;
    const keyInput=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    if(!btn)return;

    if(keyInput){keyInput.value='';keyInput.style.display='none'}
    setGateText('Informe sua identificação. Cada identificação recebe somente 1 licença, mesmo que o link seja aberto novamente.');

    let wrap=document.getElementById('dfAccessIdentityWrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='dfAccessIdentityWrap';
      wrap.style.cssText='width:100%;margin:12px 0 8px;text-align:left';
      const label=document.createElement('label');
      label.textContent='Sua identificação';
      label.setAttribute('for','dfAccessIdentity');
      label.style.cssText='display:block;margin:0 0 6px;font-size:12px;font-weight:800;color:#cbd5e1';
      const input=document.createElement('input');
      input.id='dfAccessIdentity';
      input.type='text';
      input.inputMode='text';
      input.autocomplete='username';
      input.placeholder='Ex.: seu WhatsApp ou código';
      input.style.cssText='width:100%;box-sizing:border-box;border:1px solid #475569;background:#111827;color:#fff;border-radius:12px;padding:12px;font:600 14px system-ui;outline:none';
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();redeemIdentity()}});
      wrap.appendChild(label);wrap.appendChild(input);
      btn.parentNode.insertBefore(wrap,btn);
    }

    btn.textContent='ACESSAR';
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemIdentity();
    },true);
    setMessage('Use sempre a mesma identificação.',true);
  }

  function prepareLegacyGate(){
    if(!linkToken||generalMode)return;
    const input=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    if(!btn)return;
    if(input){input.value='';input.style.display='none'}
    setGateText('Seu acesso está pronto. Toque em ACESSAR para liberar este aparelho.');
    btn.textContent='ACESSAR';
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemLegacy();
    },true);
    setMessage('Link de acesso válido para um único aparelho.',true);
  }

  async function resumeSavedAccess(){
    if(linkToken)return;
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    if(!credential)return;

    // Quem já possui acesso salvo não fica bloqueado se o D1/Worker estiver
    // temporariamente indisponível. Tentamos renovar normalmente; se falhar por
    // erro operacional, mantemos a entrada local. Erros reais de licença (401/403)
    // continuam removendo o acesso dentro de renewAccess().
    const t=await renewAccess();
    if(t){
      setMessage('Acesso automático restaurado.',true);
    }else if(localStorage.getItem(ACCESS_KEY)){
      setMessage('Acesso salvo restaurado. Sincronização temporariamente indisponível.',true);
    }else{
      return;
    }
    setTimeout(unlock,80);setTimeout(unlock,450);setTimeout(unlock,900);
  }

  function boot(){
    setTimeout(prepareGeneralGate,80);setTimeout(prepareGeneralGate,450);
    setTimeout(prepareLegacyGate,80);setTimeout(prepareLegacyGate,450);
    setTimeout(resumeSavedAccess,120);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
