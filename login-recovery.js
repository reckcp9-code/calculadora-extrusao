(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const LICENSE_KEY='df_licenseauth_license_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const keyAtLoad=localStorage.getItem(LICENSE_KEY)||'';
  let installing=false;

  function $(id){return document.getElementById(id)}
  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY)||'';
    if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem(DEVICE_KEY,id)}
    return id;
  }
  function msg(text,ok){
    const e=$('licenseMsg');if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }
  function unlock(){
    if(typeof window.dfUnlocked==='function')window.dfUnlocked();
    else{if($('licenseGate'))$('licenseGate').style.display='none';if($('appContent'))$('appContent').style.display='block'}
  }
  function lock(){
    if(typeof window.dfLocked==='function')window.dfLocked();
    else{if($('licenseGate'))$('licenseGate').style.display='flex';if($('appContent'))$('appContent').style.display='none'}
  }

  async function login(key,silent=false){
    const k=String(key||'').trim();
    if(!k){msg('Digite sua licença.');return false}
    // Salva antes da tentativa para uma falha de rede nunca apagar a licença do usuário.
    localStorage.setItem(LICENSE_KEY,k);
    const btn=$('licenseBtn');if(btn)btn.disabled=true;
    if(!silent)msg('Verificando licença...');
    try{
      const r=await fetch(API+'/auth',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({licenseKey:k,deviceId:deviceId()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(_){}
      if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
      if(!j.token)throw new Error('Servidor não retornou uma sessão válida.');
      sessionStorage.setItem(TOKEN_KEY,j.token);
      localStorage.setItem(LICENSE_KEY,k);
      if($('licenseKey'))$('licenseKey').value=k;
      msg('Licença válida. Acesso liberado.',true);
      unlock();
      return true;
    }catch(e){
      // NÃO apagar a licença. Isso evita ficar preso na tela após atualização ou falha temporária.
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(LICENSE_KEY,k);
      if($('licenseKey'))$('licenseKey').value=k;
      lock();
      msg(e&&e.message?e.message:'Não foi possível validar a licença.');
      return false;
    }finally{if(btn)btn.disabled=false}
  }

  function install(){
    if(installing)return;installing=true;
    try{
      const oldBtn=$('licenseBtn'),inp=$('licenseKey');
      if(!oldBtn||!inp){installing=false;setTimeout(install,250);return}

      const preserved=keyAtLoad||localStorage.getItem(LICENSE_KEY)||inp.value||'';
      if(preserved){localStorage.setItem(LICENSE_KEY,preserved);inp.value=preserved}

      // Clona o botão para retirar o listener antigo que apagava a licença em qualquer erro.
      const btn=oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(btn,oldBtn);
      btn.addEventListener('click',()=>login(inp.value,false));
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();login(inp.value,false)}});
      window.dfLicenseAuthLogin=login;

      if(preserved){
        setTimeout(async()=>{
          if(await login(preserved,true))return;
          // Uma segunda tentativa cobre instabilidade rápida logo após atualização/deploy.
          setTimeout(()=>login(preserved,true),900);
        },120);
      }
    }finally{installing=false}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));
  else setTimeout(install,80);
})();
