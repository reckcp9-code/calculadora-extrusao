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

  window.DFDeviceIdentity={get:sync,sync:sync};
  sync();
})();
