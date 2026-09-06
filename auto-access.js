(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LICENSE_KEY='df_licenseauth_license_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const ACCESS_PARAM='acesso';
  const previousFetch=window.fetch.bind(window);
  const initialUrl=new URL(location.href);
  const linkToken=String(initialUrl.searchParams.get(ACCESS_PARAM)||'').trim();
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
      const special=path==='/access/redeem'||path==='/access/session'||path.startsWith('/admin/access/');
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

  async function redeem(){
    if(!linkToken)return false;
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

      const session=String(j.token||'').trim();
      const credential=String(j.accessCredential||'').trim();
      if(!session||!credential)throw new Error('O servidor não retornou o acesso completo.');

      sessionStorage.setItem(TOKEN_KEY,session);
      localStorage.setItem(ACCESS_KEY,credential);
      localStorage.removeItem(LICENSE_KEY);

      const clean=new URL(location.href);
      clean.searchParams.delete(ACCESS_PARAM);
      history.replaceState(null,'',clean.pathname+(clean.search||'')+(clean.hash||''));

      setMessage('Acesso liberado. Entrando...',true);
      if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}
      setTimeout(unlock,120);
      setTimeout(unlock,650);
      return true;
    }catch(e){
      setMessage(String(e&&e.message||e),false);
      if(btn){btn.disabled=false;btn.textContent='ACESSAR'}
      return false;
    }
  }

  function prepareLinkGate(){
    if(!linkToken)return;
    const input=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    if(!btn)return;

    if(input){input.value='';input.style.display='none'}
    const title=document.querySelector('#licenseGate h1,#licenseGate h2');
    if(title)title.textContent='Acesso DF';
    const text=document.querySelector('#licenseGate .licenseSub,#licenseGate p');
    if(text)text.textContent='Seu acesso está pronto. Toque em ACESSAR para liberar este aparelho.';
    btn.textContent='ACESSAR';

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      redeem();
    },true);

    setMessage('Link de acesso válido para um único aparelho.',true);
  }

  async function resumeSavedAccess(){
    if(linkToken)return;
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    if(!credential)return;
    const t=await renewAccess();
    if(t){
      setMessage('Acesso automático restaurado.',true);
      setTimeout(unlock,120);
      setTimeout(unlock,700);
    }
  }

  function boot(){
    setTimeout(prepareLinkGate,120);
    setTimeout(prepareLinkGate,550);
    setTimeout(resumeSavedAccess,240);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
