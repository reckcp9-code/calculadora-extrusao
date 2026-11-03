(function(){
  'use strict';

  const USER_KEY='df_auto_user_code_v1';
  const USER_COOKIE='df_auto_user_code_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const COOKIE_MAX_AGE=315360000;
  const initialUrl=new URL(location.href);
  const generalMode=String(initialUrl.searchParams.get('acesso')||'').trim().toLowerCase()==='geral';
  let started=false;

  function readCookie(){
    try{
      const p=USER_COOKIE+'=';
      for(const part of String(document.cookie||'').split(';')){
        const s=part.trim();
        if(s.startsWith(p))return decodeURIComponent(s.slice(p.length)).trim();
      }
    }catch(e){}
    return '';
  }

  function writeCookie(v){
    try{document.cookie=USER_COOKIE+'='+encodeURIComponent(v)+'; Max-Age='+COOKIE_MAX_AGE+'; Path=/; SameSite=Lax; Secure'}catch(e){}
  }

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const v=String(window.DFDeviceIdentity.get()||'').trim();
        if(v)return v;
      }
    }catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return ''}
  }

  function makeCode(id){
    let h=2166136261;
    const s=String(id||'DF');
    for(let i=0;i<s.length;i++){
      h^=s.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    h>>>=0;
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let x=h;
    let out='';
    for(let i=0;i<4;i++){
      out+=alphabet[x&31];
      x=(x>>>5)^Math.imul(x,2654435761);
      x>>>=0;
    }
    return 'DF-'+out.slice(0,2)+'-'+out.slice(2,4);
  }

  function automaticUser(){
    let code=readCookie();
    try{if(!code)code=String(localStorage.getItem(USER_KEY)||'').trim()}catch(e){}
    if(!/^DF-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(code))code=makeCode(deviceId());
    try{localStorage.setItem(USER_KEY,code)}catch(e){}
    writeCookie(code);
    window.DF_AUTO_USER=code;
    return code;
  }

  function setMessage(text,ok){
    const e=document.getElementById('licenseMsg');
    if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }

  function run(){
    if(!generalMode||started)return false;
    const input=document.getElementById('dfAccessIdentity');
    const wrap=document.getElementById('dfAccessIdentityWrap');
    const key=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    if(!input||!btn)return false;

    started=true;
    const code=automaticUser();
    input.value=code;
    if(wrap)wrap.style.display='none';
    if(key)key.style.display='none';

    const title=document.querySelector('#licenseGate h1,#licenseGate h2');
    if(title)title.textContent='Acesso DF';
    const sub=document.querySelector('#licenseGate .licenseSub,#licenseGate p');
    if(sub)sub.textContent='Seu usuário foi criado automaticamente para este aparelho.';

    btn.textContent='ENTRANDO...';
    setMessage('Usuário automático: '+code+' • liberando acesso...',true);

    queueMicrotask(()=>{
      try{btn.click()}catch(e){
        started=false;
        setMessage('Não foi possível entrar automaticamente. Toque em ACESSAR.',false);
        btn.disabled=false;
        btn.textContent='ACESSAR';
      }
    });
    return true;
  }

  function boot(){
    automaticUser();
    run();
  }

  window.addEventListener('df-access-gate-ready',run);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
