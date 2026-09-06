(function(){
  'use strict';
  const AUTH_MARK='df_offline_auth_v1';
  const MAX_AGE=24*60*60*1000;
  const nativeFetch=window.fetch.bind(window);

  function b64(bytes){
    let s='';for(const b of bytes)s+=String.fromCharCode(b);
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  async function hashText(text){
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text||'')));
    return b64(new Uint8Array(d));
  }
  function getMark(){try{return JSON.parse(localStorage.getItem(AUTH_MARK)||'null')}catch(e){return null}}
  function putMark(v){try{localStorage.setItem(AUTH_MARK,JSON.stringify(v))}catch(e){}}
  function isAuthUrl(input){
    try{
      const u=new URL(typeof input==='string'?input:input.url,location.href);
      return u.hostname==='df-extrusor-api.reck-cp9.workers.dev'&&u.pathname==='/auth';
    }catch(e){return false}
  }
  function readBody(init){
    try{return JSON.parse(String(init&&init.body||'{}'))}catch(e){return{}}
  }

  window.fetch=async function(input,init){
    if(!isAuthUrl(input))return nativeFetch(input,init);
    const body=readBody(init);
    const licenseKey=String(body.licenseKey||'').trim();
    const deviceId=String(body.deviceId||'').trim();

    if(navigator.onLine===false&&licenseKey&&deviceId){
      try{
        const mark=getMark();
        const keyHash=await hashText(licenseKey);
        if(mark&&mark.device===deviceId&&mark.keyHash===keyHash&&Number(mark.until)>Date.now()){
          window.dispatchEvent(new CustomEvent('df-offline-auth',{detail:{until:mark.until}}));
          return new Response(JSON.stringify({ok:true,token:'df-offline-session',expiresIn:3600,offline:true}),{
            status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
          });
        }
      }catch(e){}
    }

    const res=await nativeFetch(input,init);
    if(res.ok&&licenseKey&&deviceId){
      try{
        const clone=res.clone();
        const data=await clone.json();
        if(data&&data.ok&&data.token){
          putMark({device:deviceId,keyHash:await hashText(licenseKey),validatedAt:Date.now(),until:Date.now()+MAX_AGE});
        }
      }catch(e){}
    }
    return res;
  };
})();
