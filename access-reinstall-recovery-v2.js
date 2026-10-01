(function(){
  'use strict';
  if(window.DFAccessReinstallRecoveryV2)return;
  window.DFAccessReinstallRecoveryV2=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const LEGACY_LICENSE_KEY='df_licenseauth_license_v1';
  const BACKUP_FOUND_KEY='df_recovery_backup_found_v1';
  const url=new URL(location.href);
  const generalMode=String(url.searchParams.get('acesso')||'').trim().toLowerCase()==='geral';
  let mode='recover';
  let busy=false;
  let configured=false;

  function safeGet(key){try{return String(localStorage.getItem(key)||'').trim()}catch(e){return ''}}
  function active(){return generalMode&&!safeGet(ACCESS_KEY)}

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const v=String(window.DFDeviceIdentity.get()||'').trim();
        if(v)return v;
      }
    }catch(e){}
    let id=safeGet(DEVICE_KEY);
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      try{localStorage.setItem(DEVICE_KEY,id)}catch(e){}
    }
    return id;
  }

  function platform(){
    const hinted=String(window.DF_PLATFORM_HINT||'').trim();
    if(hinted)return hinted;
    const ua=String(navigator.userAgent||'');
    if(/iPhone|iPod/i.test(ua))return 'iOS';
    if(/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'iPad';
    if(/Android/i.test(ua))return 'Android';
    return 'PC';
  }

  function message(text,ok){
    const e=document.getElementById('licenseMsg');
    if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }

  function gateText(title,sub){
    const t=document.querySelector('#licenseGate h1,#licenseGate h2');
    if(t)t.textContent=title;
    const p=document.querySelector('#licenseGate .licenseSub,#licenseGate p');
    if(p)p.textContent=sub;
  }

  function ensureSecondary(btn){
    let b=document.getElementById('dfFirstAccessBtn');
    if(!b){
      b=document.createElement('button');
      b.id='dfFirstAccessBtn';
      b.type='button';
      b.className=btn.className||'licenseBtn';
      b.style.cssText='width:100%;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:13px;padding:13px 10px;margin-top:10px;font-size:13px;font-weight:900';
      btn.insertAdjacentElement('afterend',b);
      b.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
        if(busy)return;
        mode=mode==='recover'?'new':'recover';
        configure(true);
      },true);
    }
    return b;
  }

  function clearGeneratedIdentity(input){
    if(!input)return;
    const v=String(input.value||'').trim();
    if(/^DF-[A-Z0-9]{2}-[A-Z0-9]{2}$/i.test(v))input.value='';
  }

  function configure(force){
    if(!active())return false;
    const btn=document.getElementById('licenseBtn');
    const key=document.getElementById('licenseKey');
    const wrap=document.getElementById('dfAccessIdentityWrap');
    const identity=document.getElementById('dfAccessIdentity');
    if(!btn||!key)return false;

    configured=true;
    busy=false;
    btn.disabled=false;
    const secondary=ensureSecondary(btn);

    if(mode==='recover'){
      gateText('Recuperar acesso','Já usava o DF EXTRUSOR e reinstalou? Digite a mesma licença antiga para recuperar este aparelho sem consumir outra key.');
      key.style.display='block';
      key.type='text';
      key.autocomplete='off';
      key.placeholder='Digite sua licença antiga';
      if(wrap)wrap.style.display='none';
      btn.textContent='RECUPERAR ACESSO';
      secondary.textContent='PRIMEIRO ACESSO / NÃO TENHO LICENÇA ANTIGA';
      if(force)message('Use a mesma licença que já estava neste aparelho. O sistema tentará manter o mesmo vínculo e o backup em nuvem.',true);
    }else{
      gateText('Primeiro acesso','Se você nunca usou o DF EXTRUSOR neste aparelho, informe seu WhatsApp ou identificação para criar/liberar o acesso.');
      key.style.display='none';
      if(wrap)wrap.style.display='block';
      clearGeneratedIdentity(identity);
      btn.textContent='CRIAR / ENTRAR';
      secondary.textContent='VOLTAR PARA RECUPERAR LICENÇA ANTIGA';
      if(force)message('Primeiro acesso: informe sua identificação. Se já usava o app antes, volte e recupere pela licença antiga.',true);
    }
    return true;
  }

  function saveAccess(j){
    const token=String(j&&j.token||'').trim();
    const credential=String(j&&j.accessCredential||'').trim();
    if(!token||!credential)throw new Error('O servidor não retornou o acesso completo.');
    sessionStorage.setItem(TOKEN_KEY,token);
    localStorage.setItem(ACCESS_KEY,credential);
    localStorage.removeItem(LEGACY_LICENSE_KEY);
    if(j&&j.backupAvailable){
      localStorage.setItem(BACKUP_FOUND_KEY,JSON.stringify({found:true,updatedAt:String(j.backupUpdatedAt||''),at:new Date().toISOString()}));
    }
  }

  async function post(path,body){
    const r=await fetch(API+path,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
      body:JSON.stringify(body),
      cache:'no-store'
    });
    let j={};
    try{j=await r.json()}catch(e){}
    return {r,j};
  }

  async function recoverOld(){
    if(busy)return;
    const key=document.getElementById('licenseKey');
    const btn=document.getElementById('licenseBtn');
    const licenseKey=String(key&&key.value||'').trim();
    if(!licenseKey){message('Digite a mesma licença antiga que você já usava.',false);key&&key.focus();return}

    busy=true;if(btn){btn.disabled=true;btn.textContent='RECUPERANDO...'}
    message('Procurando seu acesso antigo e o backup em nuvem...',true);
    try{
      const {r,j}=await post('/access/recover-license',{licenseKey,deviceId:deviceId(),platform:platform()});
      if(!r.ok||j.ok===false){
        if(r.status===404&&j.notFound!==true)throw new Error('Servidor ainda não possui a recuperação por licença antiga. Atualize o Worker v99 e tente novamente. Não gere outra key.');
        throw new Error(j.error||('Falha na recuperação ('+r.status+').'));
      }
      saveAccess(j);
      if(j.backupAvailable)message('✅ Acesso recuperado. Backup em nuvem encontrado. Entrando...',true);
      else message('✅ Acesso recuperado com a mesma licença. Entrando...',true);
      if(btn){btn.textContent='ACESSO RECUPERADO';btn.disabled=false}
      setTimeout(()=>location.replace('./'),700);
    }catch(e){
      busy=false;
      if(btn){btn.disabled=false;btn.textContent='RECUPERAR ACESSO'}
      const txt=String(e&&e.message||e||'Erro ao recuperar acesso.');
      if(txt==='Erro interno.')message('O servidor ainda precisa da correção de recuperação. Não gere outra key e não apague mais nada do aparelho.',false);
      else message(txt,false);
    }
  }

  async function firstAccess(){
    if(busy)return;
    const identity=document.getElementById('dfAccessIdentity');
    const btn=document.getElementById('licenseBtn');
    const value=String(identity&&identity.value||'').trim();
    if(!value){message('Digite seu WhatsApp ou identificação.',false);identity&&identity.focus();return}
    if(/^DF-[A-Z0-9]{2}-[A-Z0-9]{2}$/i.test(value)){
      message('Informe seu WhatsApp ou uma identificação escolhida por você. Não use o código automático do aparelho.',false);
      identity&&identity.focus();return;
    }

    busy=true;if(btn){btn.disabled=true;btn.textContent='LIBERANDO...'}
    message('Verificando sua identificação...',true);
    try{
      const {r,j}=await post('/access/identify',{identity:value,deviceId:deviceId(),platform:platform()});
      if(!r.ok||j.ok===false)throw new Error(j.error||('Falha no acesso ('+r.status+').'));
      saveAccess(j);
      message(j.reused?'✅ Acesso reconhecido. Entrando...':'✅ Acesso liberado. Entrando...',true);
      setTimeout(()=>location.replace('./'),700);
    }catch(e){
      busy=false;
      if(btn){btn.disabled=false;btn.textContent='CRIAR / ENTRAR'}
      message(String(e&&e.message||e||'Não foi possível liberar o acesso.'),false);
    }
  }

  document.addEventListener('click',function(e){
    if(!active())return;
    const t=e.target&&e.target.closest?e.target.closest('#licenseBtn'):null;
    if(!t)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(!e.isTrusted)return;
    if(mode==='recover')recoverOld();else firstAccess();
  },true);

  function boot(){
    if(!active())return;
    configure(false);
    setTimeout(()=>configure(false),0);
    setTimeout(()=>configure(false),250);
    setTimeout(()=>configure(false),900);
  }

  window.addEventListener('df-access-gate-ready',function(){if(active()){configure(false);setTimeout(()=>configure(false),0)}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
