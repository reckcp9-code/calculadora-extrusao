(function(){
  'use strict';

  const STORAGE_KEY='df_licenseauth_device_v1';
  const COOKIE_KEY='df_device_id_v1';
  const COOKIE_MAX_AGE=315360000; // 10 anos

  function readCookie(){
    try{
      const prefix=COOKIE_KEY+'=';
      const parts=String(document.cookie||'').split(';');
      for(const part of parts){
        const item=part.trim();
        if(item.startsWith(prefix))return decodeURIComponent(item.slice(prefix.length)).trim();
      }
    }catch(e){}
    return '';
  }

  function writeCookie(id){
    if(!id)return;
    try{
      document.cookie=COOKIE_KEY+'='+encodeURIComponent(id)+'; Max-Age='+COOKIE_MAX_AGE+'; Path=/; SameSite=Lax; Secure';
    }catch(e){}
  }

  function newId(){
    return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
  }

  function sync(){
    let cookieId=readCookie();
    let storedId='';
    try{storedId=String(localStorage.getItem(STORAGE_KEY)||'').trim()}catch(e){}

    // No iOS, o cookie copiado para o app da Tela de Início é a identidade canônica.
    // Assim Safari e PWA usam o mesmo ID, mesmo com localStorage separado.
    const id=cookieId||storedId||newId();

    try{
      if(storedId!==id)localStorage.setItem(STORAGE_KEY,id);
    }catch(e){}
    if(cookieId!==id)writeCookie(id);

    window.DF_DEVICE_ID=id;
    return id;
  }

  function loadPrivateCalculatorRecovery(){
    try{
      if(!/^\/extrusora(?:\/|$)/i.test(location.pathname))return;
      const access=String(localStorage.getItem('df_auto_access_credential_v1')||'').trim();
      if(access)return;
      if(document.getElementById('dfPrivateRecoveryLoader'))return;

      const gateText=document.getElementById('gateText');
      if(gateText)gateText.textContent='Restaurando seu acesso de dono automaticamente...';

      const s=document.createElement('script');
      s.id='dfPrivateRecoveryLoader';
      s.src='../access-recovery-v1.js?v=private-extruder-recovery-v2';
      s.async=true;
      s.onload=function(){
        try{
          const ready=window.DFAccessRecoveryReady;
          if(ready&&typeof ready.then==='function'){
            ready.then(function(ok){
              if(ok){
                try{location.reload()}catch(e){}
              }else{
                const t=document.getElementById('gateText');
                if(t&&!String(localStorage.getItem('df_auto_access_credential_v1')||'').trim())t.textContent='Não consegui recuperar o acesso automaticamente. Abra o DF EXTRUSOR PRO uma vez neste navegador e tente novamente.';
              }
            }).catch(function(){});
          }
        }catch(e){}
      };
      document.head.appendChild(s);
    }catch(e){}
  }

  window.DFDeviceIdentity={get:sync,sync:sync};
  sync();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPrivateCalculatorRecovery,{once:true});
  else loadPrivateCalculatorRecovery();
})();
