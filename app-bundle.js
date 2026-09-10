/* DF EXTRUSOR PRO - pacote de scripts v1.0.108
   Gerado na ordem oficial para reduzir requisicoes sem alterar as funcoes. */

/* ---- offline-auth-shim.js ---- */
(function(){
  'use strict';

  // O acesso ao DF EXTRUSOR agora exige internet.
  // Mantemos este arquivo apenas para compatibilidade com versões antigas do shell.
  try{localStorage.removeItem('df_offline_auth_v1')}catch(e){}
})();


/* ---- platform-hint.js ---- */
(function(){
  'use strict';

  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_PATHS=new Set(['/access/redeem','/access/identify','/access/session']);
  const previousFetch=window.fetch.bind(window);

  function detectPlatform(){
    try{
      const ua=String(navigator.userAgent||'');
      const navPlatform=String(navigator.platform||'');
      const uaDataPlatform=String(navigator.userAgentData&&navigator.userAgentData.platform||'');
      const all=ua+' '+navPlatform+' '+uaDataPlatform;
      const touches=Number(navigator.maxTouchPoints||0);
      const sw=Number(screen&&screen.width||0),sh=Number(screen&&screen.height||0);
      const shortSide=sw&&sh?Math.min(sw,sh):0;

      if(/iPhone|iPod/i.test(all))return 'iOS';
      if(/iPad/i.test(all))return 'iPad';
      if(/Android/i.test(all))return 'Android';

      // Safari no iPhone/iPad pode se anunciar como Macintosh quando está em
      // "Solicitar Site para Computador". Macs reais normalmente não têm touch.
      const appleDesktopMask=/MacIntel|Macintosh|MacPPC|Mac68K/i.test(all)&&touches>1;
      if(appleDesktopMask)return shortSide>0&&shortSide<600?'iOS':'iPad';

      if(/Windows|Win32|Win64|CrOS|X11|Linux|MacIntel|Macintosh|MacPPC|Mac68K/i.test(all))return 'PC';
      return 'Outro';
    }catch(e){
      return 'Outro';
    }
  }

  const platform=detectPlatform();
  window.DF_PLATFORM_HINT=platform;

  window.fetch=function(input,init){
    try{
      const u=new URL(typeof input==='string'?input:input&&input.url,location.href);
      const method=String(init&&init.method||'GET').toUpperCase();
      if(u.hostname===API_HOST&&method==='POST'&&ACCESS_PATHS.has(u.pathname)&&typeof (init&&init.body)==='string'){
        const body=JSON.parse(init.body);
        if(body&&typeof body==='object'&&!Array.isArray(body)){
          body.platform=platform;
          init={...(init||{}),body:JSON.stringify(body)};
        }
      }
    }catch(e){}
    return previousFetch(input,init);
  };
})();


/* ---- install-handoff.js ---- */
(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const nativeFetch=window.fetch.bind(window);

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }

  function deviceId(){
    let id=String(localStorage.getItem(DEVICE_KEY)||'').trim();
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function platformKey(){
    let tz='';
    try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
    return [
      navigator.platform||'',
      navigator.language||'',
      String(screen.width||0)+'x'+String(screen.height||0),
      String(window.devicePixelRatio||1),
      String(navigator.maxTouchPoints||0),
      tz
    ].join('|');
  }

  async function prepareIosHandoff(button){
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    if(!credential){
      alert('Entre pelo link geral do DF EXTRUSOR antes de adicionar à Tela de Início.');
      return;
    }

    button.disabled=true;
    button.textContent='PREPARANDO INSTALAÇÃO...';
    try{
      const r=await nativeFetch(API+'/access/install-handoff/create',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':deviceId()},
        body:JSON.stringify({credential,deviceId:deviceId(),platformKey:platformKey()}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível preparar a instalação.');
      const token=String(j.installToken||'').trim();
      if(!token)throw new Error('O servidor não retornou a transferência de instalação.');
      location.assign('/instalar.html?instalar='+encodeURIComponent(token));
    }catch(e){
      button.disabled=false;
      button.textContent='PREPARAR INSTALAÇÃO';
      alert(String(e&&e.message||e));
    }
  }

  function hookIosInstallButton(){
    if(!isIos()||isStandalone())return;
    const b=document.getElementById('dfInstallNow');
    if(!b||b.dataset.dfHandoffHook==='1')return;
    b.dataset.dfHandoffHook='1';
    b.textContent='PREPARAR INSTALAÇÃO';
    b.onclick=()=>prepareIosHandoff(b);
  }

  if(isIos()&&!isStandalone()){
    const obs=new MutationObserver(()=>hookIosInstallButton());
    if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookIosInstallButton);
    else hookIosInstallButton();
  }
})();


/* ---- auto-access.js ---- */
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
  let booted=false;

  function savedCredential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return ''}}
  function isOffline(){return navigator.onLine===false}
  function deviceId(){
    let id='';
    try{id=String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){}
    if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);try{localStorage.setItem(DEVICE_KEY,id)}catch(e){}}
    return id;
  }
  function apiUrl(input){try{return new URL(typeof input==='string'?input:input.url,location.href)}catch(e){return null}}
  function headersWith(init,newToken){const h=new Headers(init&&init.headers||{});if(newToken)h.set('Authorization','Bearer '+newToken);h.set('X-DF-Device',deviceId());return h}
  function setMessage(text,ok){const e=document.getElementById('licenseMsg');if(!e)return;e.textContent=text;e.className='licenseMsg '+(ok?'ok':'err')}
  function unlock(){try{if(typeof window.dfUnlocked==='function')window.dfUnlocked();else{const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='none';if(a)a.style.display='block'}}catch(e){}}
  function lockToGate(){try{const style=document.getElementById('dfSavedAccessBoot');if(style)style.remove();const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='flex';if(a)a.style.display='none'}catch(e){}}
  function cleanAccessParam(){try{const clean=new URL(location.href);clean.searchParams.delete(ACCESS_PARAM);history.replaceState(null,'',clean.pathname+(clean.search||'')+(clean.hash||''))}catch(e){}}
  function emitGateReady(){try{window.dispatchEvent(new CustomEvent('df-access-gate-ready'))}catch(e){}}
  function setGateText(text){const title=document.querySelector('#licenseGate h1,#licenseGate h2');if(title)title.textContent='Acesso DF';const sub=document.querySelector('#licenseGate .licenseSub,#licenseGate p');if(sub)sub.textContent=text}

  function showOfflineGate(){
    lockToGate();
    setGateText('É necessário estar conectado à internet para liberar o acesso.');
    const keyInput=document.getElementById('licenseKey');if(keyInput)keyInput.style.display='none';
    const identity=document.getElementById('dfAccessIdentityWrap');if(identity)identity.style.display='none';
    const btn=document.getElementById('licenseBtn');if(btn){btn.disabled=true;btn.textContent='SEM INTERNET'}
    setMessage('📶 Conecte-se à internet para acessar o DF EXTRUSOR PRO.',false);
    emitGateReady();
    return true;
  }

  function unlockSavedImmediately(){if(isOffline()||!savedCredential())return false;cleanAccessParam();setMessage('Acesso salvo restaurado.',true);unlock();return true}

  async function renewAccess(){
    const credential=savedCredential();if(!credential||isOffline())return '';
    if(renewPromise)return renewPromise;
    renewPromise=(async()=>{try{const dev=deviceId();const r=await previousFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false){if(r.status===401||r.status===403||r.status===404||r.status===410){try{localStorage.removeItem(ACCESS_KEY)}catch(e){}try{sessionStorage.removeItem(TOKEN_KEY)}catch(e){}}return ''}const t=String(j.token||'').trim();if(t)sessionStorage.setItem(TOKEN_KEY,t);return t}catch(e){return ''}finally{renewPromise=null}})();
    return renewPromise;
  }

  if(linkToken||savedCredential()){
    window.fetch=async function(input,init){const u=apiUrl(input);if(!u||u.hostname!==API_HOST)return previousFetch(input,init);const path=u.pathname;const special=path==='/access/redeem'||path==='/access/identify'||path==='/access/session'||path.startsWith('/admin/access/');let patched=init;if(!special){const current=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();if(current)patched={...(init||{}),headers:headersWith(init,current)}}let r=await previousFetch(input,patched);if(r.status!==401||special||!savedCredential())return r;const fresh=await renewAccess();if(!fresh)return r;patched={...(init||{}),headers:headersWith(init,fresh)};return previousFetch(input,patched)};
  }

  function saveAccess(j){const session=String(j&&j.token||'').trim();const credential=String(j&&j.accessCredential||'').trim();if(!session||!credential)throw new Error('O servidor não retornou o acesso completo.');sessionStorage.setItem(TOKEN_KEY,session);localStorage.setItem(ACCESS_KEY,credential);localStorage.removeItem(LICENSE_KEY)}

  async function redeemLegacy(){
    if(isOffline()){showOfflineGate();return false}
    if(!linkToken||generalMode)return false;
    const btn=document.getElementById('licenseBtn');if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}setMessage('Preparando seu acesso automático...',false);
    try{const dev=deviceId();const r=await previousFetch(API+'/access/redeem',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({token:linkToken,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível liberar este acesso.');saveAccess(j);cleanAccessParam();setMessage('Acesso liberado. Entrando...',true);if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}unlock();return true}catch(e){setMessage(String(e&&e.message||e),false);if(btn){btn.disabled=false;btn.textContent='ACESSAR'}return false}
  }

  async function redeemIdentity(){
    if(isOffline()){showOfflineGate();return false}
    const input=document.getElementById('dfAccessIdentity');const identity=String(input&&input.value||'').trim();const btn=document.getElementById('licenseBtn');if(!identity){setMessage('Digite sua identificação.',false);if(input)input.focus();return false}if(btn){btn.disabled=true;btn.textContent='LIBERANDO ACESSO...'}setMessage('Verificando sua identificação...',false);
    try{const dev=deviceId();const r=await previousFetch(API+'/access/identify',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({identity,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||('Falha no acesso ('+r.status+').'));saveAccess(j);cleanAccessParam();setMessage(j.reused?'Acesso reconhecido. Entrando...':'Acesso criado. Entrando...',true);if(btn){btn.textContent='ACESSO LIBERADO';btn.disabled=false}unlock();return true}catch(e){setMessage(String(e&&e.message||e),false);if(btn){btn.disabled=false;btn.textContent='ACESSAR'}return false}
  }

  function prepareGeneralGate(){
    if(!generalMode||savedCredential())return false;
    const keyInput=document.getElementById('licenseKey');const btn=document.getElementById('licenseBtn');if(!btn)return false;if(keyInput){keyInput.value='';keyInput.style.display='none'}setGateText('Informe sua identificação. Cada identificação recebe somente 1 licença, mesmo que o link seja aberto novamente.');let wrap=document.getElementById('dfAccessIdentityWrap');if(!wrap){wrap=document.createElement('div');wrap.id='dfAccessIdentityWrap';wrap.style.cssText='display:block!important;width:100%;margin:14px 0 10px;text-align:left;visibility:visible!important;opacity:1!important';const label=document.createElement('label');label.textContent='Sua identificação';label.setAttribute('for','dfAccessIdentity');label.style.cssText='display:block;margin:0 0 7px;font-size:13px;font-weight:800;color:#cbd5e1';const input=document.createElement('input');input.id='dfAccessIdentity';input.type='text';input.inputMode='text';input.autocomplete='username';input.placeholder='Digite seu WhatsApp ou código';input.style.cssText='display:block!important;width:100%!important;min-height:50px!important;box-sizing:border-box;border:1px solid #475569;background:#111827;color:#fff;border-radius:12px;padding:12px 14px;font:600 16px system-ui;outline:none;visibility:visible!important;opacity:1!important';input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();redeemIdentity()}});wrap.appendChild(label);wrap.appendChild(input);btn.parentNode.insertBefore(wrap,btn)}else wrap.style.display='block';btn.disabled=false;btn.textContent='ACESSAR';if(!btn.dataset.dfAccessBound){btn.dataset.dfAccessBound='1';btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemIdentity()},true)}setMessage('Use sempre a mesma identificação.',true);emitGateReady();return true
  }

  function prepareLegacyGate(){
    if(!linkToken||generalMode||savedCredential())return false;
    const input=document.getElementById('licenseKey');const btn=document.getElementById('licenseBtn');if(!btn)return false;if(input){input.value='';input.style.display='none'}setGateText('Seu acesso está pronto. Toque em ACESSAR para liberar este aparelho.');btn.disabled=false;btn.textContent='ACESSAR';if(!btn.dataset.dfAccessBound){btn.dataset.dfAccessBound='1';btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();redeemLegacy()},true)}setMessage('Link de acesso válido para um único aparelho.',true);emitGateReady();return true
  }

  async function resumeSavedAccess(){if(!savedCredential()||isOffline())return;cleanAccessParam();const t=await renewAccess();if(t){setMessage('Acesso automático restaurado.',true);unlock()}else if(savedCredential()){setMessage('Não foi possível validar o acesso. Verifique sua internet.',false);lockToGate()}}

  function boot(){if(booted)return;booted=true;if(isOffline()){showOfflineGate();return}const restored=unlockSavedImmediately();if(!restored){prepareGeneralGate();prepareLegacyGate()}if(savedCredential())resumeSavedAccess()}

  window.addEventListener('offline',showOfflineGate);
  window.addEventListener('online',function(){const btn=document.getElementById('licenseBtn');if(btn)btn.disabled=false;if(savedCredential()){setMessage('Internet conectada. Validando seu acesso...',true);resumeSavedAccess()}else if(generalMode){prepareGeneralGate();setMessage('Internet conectada. Digite sua identificação para acessar.',true)}else if(linkToken){prepareLegacyGate();setMessage('Internet conectada. Toque em ACESSAR.',true)}});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


/* ---- auto-user.js ---- */
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


/* ---- beta-launch.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfBetaLaunchStyle'))return;
    const st=document.createElement('style');
    st.id='dfBetaLaunchStyle';
    st.textContent=[
      '.dfBetaBox{border:1px solid #f59e0b;background:linear-gradient(180deg,#241600,#15100a);border-radius:16px;padding:12px 14px;color:#fde68a;box-shadow:0 10px 28px rgba(0,0,0,.18)}',
      '.dfBetaBox strong{display:block;color:#facc15;font-size:13px;letter-spacing:.03em}',
      '.dfBetaBox span{display:block;margin-top:4px;color:#f8fafc;font-size:12px;line-height:1.42}',
      '.dfBetaBox small{display:block;margin-top:6px;color:#cbd5e1;font-size:10px;line-height:1.35}',
      '#dfBetaApp{margin:-4px 0 10px}',
      '#dfBetaGate{margin:12px 0 4px;text-align:left}',
      '@media(max-width:560px){.dfBetaBox{padding:10px 11px}.dfBetaBox strong{font-size:12px}.dfBetaBox span{font-size:11px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function html(){
    return '<strong>🎁 PERÍODO BETA — ACESSO GRATUITO</strong>'+ 
      '<span>Use o DF EXTRUSOR PRO normalmente enquanto estamos aperfeiçoando o sistema.</span>'+ 
      '<small>Usuários atuais terão condição especial quando o lançamento oficial acontecer.</small>';
  }

  function ensureGate(){
    const box=document.querySelector('#licenseGate .licenseBox');
    if(!box)return;
    let beta=$('dfBetaGate');
    if(!beta){
      beta=document.createElement('div');
      beta.id='dfBetaGate';
      beta.className='dfBetaBox';
      beta.innerHTML=html();
    }
    const msg=$('licenseMsg');
    if(msg&&beta.parentNode!==box)msg.insertAdjacentElement('beforebegin',beta);
    else if(beta.parentNode!==box)box.appendChild(beta);
  }

  function ensureApp(){
    const app=$('appContent');
    if(!app)return;
    const brand=app.querySelector('.brand');
    if(!brand)return;
    let beta=$('dfBetaApp');
    if(!beta){
      beta=document.createElement('div');
      beta.id='dfBetaApp';
      beta.className='dfBetaBox';
      beta.innerHTML=html();
    }
    if(beta.previousElementSibling!==brand)brand.insertAdjacentElement('afterend',beta);
  }

  function ensure(){addStyle();ensureGate();ensureApp()}

  function init(){
    ensure();
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensure()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- access-device-guard.js ---- */
(function(){
  'use strict';

  const ACCESS_KEY='df_auto_access_credential_v1';

  function hasCredential(){
    try{return !!String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return false}
  }

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
    if(wrap)wrap.style.display='none';
    if(key)key.style.display='none';
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

    // A renovação da sessão pertence exclusivamente ao auto-access.js.
    // Antes este arquivo também chamava /access/session no boot, criando duas
    // restaurações concorrentes, mais tráfego e estados visuais diferentes.
    hideVerification();
    cleanGeneralParam();
    unlock();
    setMessage('Acesso salvo restaurado.',true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guard,{once:true});
  else guard();
})();


/* ---- presence-lite.js ---- */
(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LAST_KEY='df_presence_last_online_v103';
  const HEARTBEAT_MS=5*60*1000;
  const ENTRY_THROTTLE_MS=10*60*1000;

  let timer=0;
  let sending=false;
  let retries=0;

  function credential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
  function storedDevice(){try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
  function canonicalDevice(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function')return String(window.DFDeviceIdentity.get()||'').trim();
    }catch(e){}
    return '';
  }
  function devices(){
    const a=storedDevice(),b=canonicalDevice(),out=[];
    if(a)out.push(a);
    if(b&&!out.includes(b))out.push(b);
    return out;
  }
  function platform(){
    const ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua))return 'iOS';
    if(/Android/i.test(ua))return 'Android';
    if(/Windows/i.test(ua))return 'Windows';
    if(/Macintosh|Mac OS X/i.test(ua))return 'macOS';
    return 'Web';
  }
  function lastOnline(){try{return Number(localStorage.getItem(LAST_KEY)||0)||0}catch(e){return 0}}
  function markOnline(){try{localStorage.setItem(LAST_KEY,String(Date.now()))}catch(e){}}
  function stop(){if(timer){clearTimeout(timer);timer=0}}
  function schedule(ms){
    stop();
    if(document.hidden)return;
    timer=setTimeout(function(){sendOnline(true)},Math.max(1500,Number(ms)||HEARTBEAT_MS));
  }

  async function postOnline(dev){
    const cred=credential();
    if(!cred||!dev)return null;
    try{
      return await fetch(API+'/access/presence',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':dev},
        body:JSON.stringify({credential:cred,deviceId:dev,state:'online',platform:platform()}),
        cache:'no-store'
      });
    }catch(e){return null}
  }

  async function sendOnline(heartbeat){
    if(document.hidden||sending)return false;

    const cred=credential(),list=devices();
    if(!cred||!list.length){
      if(retries<20){retries++;schedule(1500)}
      return false;
    }

    const age=Date.now()-lastOnline();
    if(!heartbeat&&age>=0&&age<ENTRY_THROTTLE_MS){
      schedule(Math.max(30000,HEARTBEAT_MS));
      return true;
    }

    sending=true;
    let ok=false;
    try{
      for(const dev of list){
        const r=await postOnline(dev);
        if(r&&r.ok){ok=true;break}
        if(r&&r.status!==401)break;
      }
      if(ok){markOnline();retries=0}
      return ok;
    }finally{
      sending=false;
      schedule(HEARTBEAT_MS);
    }
  }

  function resume(){
    if(document.hidden){stop();return}
    const age=Date.now()-lastOnline();
    if(age>=ENTRY_THROTTLE_MS)sendOnline(false);
    else schedule(HEARTBEAT_MS);
  }

  function init(){sendOnline(false)}

  // No iPhone, sair momentaneamente para a Tela de Início não significa logout.
  // Por isso não enviamos "offline" em visibilitychange/pagehide/beforeunload.
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('online',resume);
  window.addEventListener('pageshow',resume);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- safe-core.js ---- */
(() => {
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const LICENSE_KEY='df_licenseauth_license_v1';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const MAT_KEY='df_formula_materiais_v2';
  const FORM_KEY='df_formulacoes_v2';
  const DEV_KEY='df_formula_dev_v1';
  let token=sessionStorage.getItem(TOKEN_KEY)||'';
  let FO_ROWS=[];
  let LAST_EX={};
  let LAST_FO={};
  const timers=new Map();
  const calcControllers=new Map();

  function $(id){return document.getElementById(id)}
  function parseNum(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const x=parseFloat(s);return Number.isFinite(x)?x:0}
  function n(id){const e=$(id);return parseNum(e?e.value:0)}
  function fmt(v,d=2){const x=Number(v);return Number.isFinite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
  function rs(v){return 'R$ '+fmt(Number(v)||0,2)}
  function set(id,t){const e=$(id);if(e)e.textContent=t}
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function safeLower(t){return String(t||'').trim().toLocaleLowerCase('pt-BR')}
  function debounce(name,fn,ms=320){clearTimeout(timers.get(name));timers.set(name,setTimeout(fn,ms))}

  function deviceId(){let id=localStorage.getItem(DEVICE_KEY);if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem(DEVICE_KEY,id)}return id}
  function dfMsg(t,ok=false){const e=$('licenseMsg');if(!e)return;e.textContent=t;e.className='licenseMsg '+(ok?'ok':'err')}
  function dfLocked(){if($('licenseGate'))$('licenseGate').style.display='flex';if($('appContent'))$('appContent').style.display='none'}
  function dfUnlocked(){if($('licenseGate'))$('licenseGate').style.display='none';if($('appContent'))$('appContent').style.display='block'}

  async function rawPost(path,body,useToken=true,signal){const headers={'Content-Type':'application/json','X-DF-Device':deviceId()};if(useToken&&token)headers.Authorization='Bearer '+token;const r=await fetch(API+path,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',signal});let j={};try{j=await r.json()}catch(_){}if(!r.ok||j.ok===false){const e=new Error(j.error||('Erro HTTP '+r.status));e.status=r.status;throw e}return j}
  async function dfLicenseAuthLogin(key,silent=false){const k=String(key||'').trim();if(!k){dfMsg('Digite sua licença.');return false}const btn=$('licenseBtn');if(btn)btn.disabled=true;if(!silent)dfMsg('Verificando licença no LicenseAuth...');try{const j=await rawPost('/auth',{licenseKey:k,deviceId:deviceId()},false);token=j.token||'';if(!token)throw new Error('Servidor não retornou uma sessão válida.');sessionStorage.setItem(TOKEN_KEY,token);localStorage.setItem(LICENSE_KEY,k);dfMsg('Licença válida. Acesso liberado.',true);setTimeout(dfUnlocked,120);return true}catch(e){token='';sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(LICENSE_KEY);dfLocked();dfMsg(e.message||'Não foi possível validar a licença.');return false}finally{if(btn)btn.disabled=false}}
  async function dfCalc(type,input,retried=false){let ctrl=calcControllers.get(type);if(!retried){if(ctrl)ctrl.abort();ctrl=('AbortController'in window)?new AbortController():null;if(ctrl)calcControllers.set(type,ctrl)}try{const j=await rawPost('/calc',{type,input},true,ctrl?ctrl.signal:undefined);return j.result||{}}catch(e){if(e.name==='AbortError')throw e;if(e.status===401&&!retried){const k=localStorage.getItem(LICENSE_KEY);if(k&&await dfLicenseAuthLogin(k,true))return dfCalc(type,input,true)}throw e}finally{if(ctrl&&calcControllers.get(type)===ctrl)calcControllers.delete(type)}}
  function apiError(e){if(e&&e.name==='AbortError')return;console.error('DF API:',e)}

  function dens(prefix){const s=$(prefix+'Ds');return s&&s.value==='manual'?n(prefix+'Dm'):s?parseNum(s.value):0}
  function toggleManual(prefix){const s=$(prefix+'Ds'),box=$(prefix+'DmBox');if(box)box.style.display=s&&s.value==='manual'?'block':'none'}
  function pesoMetroIdeal(){return Number(LAST_EX.pesoIdeal)||0}

  async function calcEx(){toggleManual('ex');try{const r=await dfCalc('extrusao',{largura:n('exL'),micra:n('exM'),densidade:dens('ex'),pesoMedido:n('exP')});LAST_EX=r;set('exGm',fmt(r.pesoIdeal||0,2)+' g/m');set('exMr',r.micraReal?fmt(r.micraReal,2)+' µm':'0,00 µm');const st=$('exSt');if(st){if(r.micraReal&&n('exM')){const dif=Number(r.diferencaMicraPct)||0;st.textContent=(dif>=0?'+':'')+fmt(dif,2)+'% em relação à micra desejada';st.className='status '+(Math.abs(dif)<=2?'ok':dif>0?'warn':'bad')}else st.textContent=''}debounce('cor',calcCor,50)}catch(e){apiError(e)}}
  function deltaText(d,nome){return(d>0?'Aumentar ':d<0?'Diminuir ':'Manter ')+nome+(d?' em aproximadamente '+fmt(Math.abs(d),0)+' RPM':'')}
  async function calcCor(){const massa=n('exCorMasA'),pux=n('exCorPuxA'),ar=n('exCorArA');set('exCorArRef',ar>0?'Anel de ar atual: '+fmt(ar,0)+' RPM — ajustar somente se necessário para estabilidade e refrigeração do balão.':'—');try{const r=await dfCalc('correcao',{largura:n('exL'),micra:n('exM'),densidade:dens('ex'),pesoMedido:n('exP'),massa,puxador:pux,ar});const des=Number(r.pesoIdeal)||0,med=Number(r.pesoMedido)||0,dif=Number(r.diferencaPct)||0,msg=$('exCorMsg');if(des>0&&med>0){set('exCorDif',(dif>=0?'+':'')+fmt(dif,2)+'%');if(msg){if(Math.abs(dif)<=2){msg.textContent='O filme está dentro do peso desejado.';msg.className='status ok'}else if(dif>0){msg.textContent='O filme está mais pesado/grosso que o alvo.';msg.className='status warn'}else{msg.textContent='O filme está mais leve/fino que o alvo.';msg.className='status bad'}}}else{set('exCorDif','—');if(msg){msg.textContent='Informe acima largura, micra, densidade e peso medido de 1 metro.';msg.className='status warn'}}if(!(des>0&&med>0)){set('exCorPuxRes','—');set('exCorMasRes','—');set('exCorPuxDelta','Resultado automático depois de preencher os dados de cima.');set('exCorMasDelta','Resultado automático depois de preencher os dados de cima.');set('exCorMasMantem','');set('exCorPuxMantem','');return}if(r.puxadorRecomendado){set('exCorPuxRes','PUXADOR RECOMENDADO: '+fmt(r.puxadorRecomendado,0)+' RPM');const d=Number(r.deltaPuxador)||0,e=$('exCorPuxDelta');if(e){e.textContent=deltaText(d,'puxador');e.className='status '+(Math.abs(d)<=1?'ok':'warn')}set('exCorMasMantem',massa>0?'Motor de massa: mantém '+fmt(massa,0)+' RPM':'Motor de massa: informe o RPM atual para mostrar quanto mantém.')}else{set('exCorPuxRes','—');set('exCorPuxDelta','Digite o RPM atual do puxador.')}if(r.massaRecomendada){set('exCorMasRes','MOTOR DE MASSA RECOMENDADO: '+fmt(r.massaRecomendada,0)+' RPM');const d=Number(r.deltaMassa)||0,e=$('exCorMasDelta');if(e){e.textContent=deltaText(d,'motor de massa');e.className='status '+(Math.abs(d)<=1?'ok':'warn')}set('exCorPuxMantem',pux>0?'Puxador: mantém '+fmt(pux,0)+' RPM':'Puxador: informe o RPM atual para mostrar quanto mantém.')}else{set('exCorMasRes','—');set('exCorMasDelta','Digite o RPM atual do motor de massa.')}}catch(e){apiError(e)}}
  async function calcProd(){const perc=n('exProdPerc');set('exProdTitulo',perc?((perc>0?'AUMENTAR ':'DIMINUIR ')+fmt(Math.abs(perc),2)+'%'):'—');try{const r=await dfCalc('producao',{massa:n('exProdMas'),puxador:n('exProdPux'),ar:n('exProdAr'),percentual:perc});set('exProdMasRes',r.massaNova?fmt(r.massaNova,0)+' RPM':'—');set('exProdPuxRes',r.puxadorNovo?fmt(r.puxadorNovo,0)+' RPM':'—');set('exProdArRes',r.arNovo?fmt(r.arNovo,0)+' RPM':'—');if(r.massaNova)set('exProdMasDelta',deltaText(Number(r.massaNova)-n('exProdMas'),'motor de massa'));if(r.puxadorNovo)set('exProdPuxDelta',deltaText(Number(r.puxadorNovo)-n('exProdPux'),'puxador'));if(r.arNovo)set('exProdArDelta','Referência inicial do ar: ajustar no balão.');set('exRelAtual',r.relacaoAtual?fmt(r.relacaoAtual,3):'—');set('exRelNova',r.relacaoNova?fmt(r.relacaoNova,3):'—');set('exRelMsg',r.relacaoAtual?'Relação mantida para preservar a micra próxima.':'')}catch(e){apiError(e)}}
  async function calcSa(){toggleManual('sa');try{const r=await dfCalc('sacola',{largura:n('saL'),comprimento:n('saC'),micra:n('saM'),densidade:dens('sa'),descontoPct:n('saDes'),quantidade:n('saQ')});set('saPr',r.pesoUnidade?fmt(r.pesoUnidade,2)+' g':'—');set('saRoM',r.pesoQuantidadeKg?fmt(r.pesoQuantidadeKg,3)+' kg':'—');set('saKg',r.unidadesPorKg?fmt(r.unidadesPorKg,0)+' sacos':'—');set('saMil',r.pesoMilKg?fmt(r.pesoMilKg,2)+' kg':'—')}catch(e){apiError(e)}}
  async function calcCu(){try{const r=await dfCalc('custo',{pesoKg:n('cuPeso'),custoKg:n('cuKg'),vendaKg:n('cuVenda'),quantidade:n('cuQtd')||1});set('cuCustoRolo',r.custoUnidade?rs(r.custoUnidade):'—');set('cuVendaRolo',r.vendaUnidade?rs(r.vendaUnidade):'—');set('cuVendaTotal',r.vendaTotal?rs(r.vendaTotal):'—');set('cuCustoTotal',r.custoTotal?rs(r.custoTotal):'—');set('cuLucro',(n('cuPeso')&&n('cuKg')&&n('cuVenda'))?rs(r.lucroTotal||0):'—')}catch(e){apiError(e)}}

  function loadMats(){try{return JSON.parse(localStorage.getItem(MAT_KEY)||'[]')}catch(_){return[]}}
  function saveMats(a){localStorage.setItem(MAT_KEY,JSON.stringify(a));renderMixRows(FO_ROWS);debounce('fo',calcFo,20)}
  function loadForms(){try{return JSON.parse(localStorage.getItem(FORM_KEY)||'[]')}catch(_){return[]}}
  function saveForms(a){localStorage.setItem(FORM_KEY,JSON.stringify(a));renderForms()}
  function materialById(id){return loadMats().find(m=>String(m.id)===String(id))}
  function buildMatOptions(selected=''){const mats=loadMats();let h=mats.length?'<option value="">Selecione o material</option>':'<option value="">Cadastre material primeiro</option>';mats.forEach(m=>{h+='<option value="'+esc(m.id)+'" '+(String(selected)===String(m.id)?'selected':'')+'>'+esc(m.nome)+(m.preco>0?' — '+rs(m.preco)+'/kg':'')+'</option>'});return h}
  function renderMatBatch(){const b=$('matBatch');if(!b)return;b.innerHTML='<div class="formRow"><div class="rowTitle">Novo material</div><div class="grid"><div><label>Nome do material</label><input id="matNome1" placeholder="Ex.: Canela"></div><div><label>Preço por kg opcional</label><input id="matPreco1" inputmode="decimal" placeholder="Ex.: 5,50"></div></div></div>';if($('matSave'))$('matSave').textContent='CADASTRAR MATERIAL';if($('matClearBatch'))$('matClearBatch').style.display='none'}
  function salvarMateriais(){const ne=$('matNome1'),pe=$('matPreco1'),nome=(ne?.value||'').trim(),preco=parseNum(pe?.value||'');if(!nome){alert('Digite o nome do material.');ne?.focus();return}const mats=loadMats();if(mats.some(m=>safeLower(m.nome)===safeLower(nome))){alert('Esse material já está cadastrado. Não pode cadastrar duas vezes com o mesmo nome.');return}mats.push({id:Date.now()+Math.floor(Math.random()*999),nome,preco});saveMats(mats);if(ne)ne.value='';if(pe)pe.value='';ne?.focus();alert('Material cadastrado. Campo liberado para o próximo material.')}
  function addFoRow(){const sel=$('foAddMat'),pctEl=$('foAddPct'),id=sel?.value||'',pct=parseNum(pctEl?.value||'');if(!id){alert('Escolha um material.');return}if(!(pct>0)){alert('Digite a porcentagem do material.');return}if(FO_ROWS.some(r=>String(r.id)===String(id))){alert('Esse material já foi colocado na formulação.');return}if(FO_ROWS.length>=8){alert('Limite de 8 materiais nesta formulação.');return}const m=materialById(id);FO_ROWS.push({id,nome:m?.nome||'',preco:+m?.preco||0,pct});if(sel)sel.value='';if(pctEl)pctEl.value='';renderMixList();debounce('fo',calcFo,20)}
  function renderMixRows(savedRows=[]){FO_ROWS=(savedRows||[]).map(r=>{const m=materialById(r.id)||r;return{id:String(r.id||''),nome:m.nome||r.nome||'',preco:+m.preco||+r.preco||0,pct:+r.pct||0}}).filter(r=>r.id&&r.pct>0);const b=$('foMixRows');if(!b)return;b.innerHTML='<div class="formRow"><div class="rowTitle">Adicionar na formulação</div><div class="grid"><div><label>Material</label><select id="foAddMat">'+buildMatOptions()+'</select></div><div><label>Porcentagem %</label><input id="foAddPct" inputmode="decimal" placeholder="Ex.: 60"></div></div><button id="foAddRow" class="calcBtn" type="button">ADICIONAR NA FORMULAÇÃO</button></div><div id="foMixList"></div>';$('foAddRow')?.addEventListener('click',addFoRow);$('foAddPct')?.addEventListener('keydown',e=>{if(e.key==='Enter')addFoRow()});$('foMixList')?.addEventListener('click',ev=>{const i=ev.target?.dataset?.remrow;if(i!==undefined){FO_ROWS.splice(+i,1);renderMixList();debounce('fo',calcFo,20)}});renderMixList()}
  function renderMixList(){const b=$('foMixList');if(!b)return;if(!FO_ROWS.length){b.innerHTML="<div class='formNote'>Nenhum material adicionado na formulação ainda.</div>";return}const items=Array.isArray(LAST_FO.itens)?LAST_FO.itens:[];b.innerHTML=FO_ROWS.map((r,i)=>{const m=materialById(r.id)||r,sv=items[i]||{};return '<div class="savedItem"><b>'+esc(m.nome||r.nome)+'</b><div class="formNote">'+fmt(+r.pct||0,2)+'%'+(sv.kg?' = '+fmt(sv.kg,3)+' kg':'')+(sv.custo?' • '+rs(sv.custo):'')+'</div><div class="savedBtns"><button class="delBtn" type="button" data-remrow="'+i+'">REMOVER</button></div></div>'}).join('')}
  function getFoRows(){return FO_ROWS.slice()}
  async function calcFo(){try{const total=n('foTotal'),rows=getFoRows().map(r=>({pct:+r.pct||0,precoKg:+(materialById(r.id)?.preco??r.preco)||0})),r=await dfCalc('formulacao',{totalKg:total,rows});LAST_FO=r;renderMixList();set('foTotPct',r.totalPct?fmt(r.totalPct,2)+'%':'—');set('foTotKg',r.somaKg?fmt(r.somaKg,3)+' kg':'—');set('foCustoTotal',r.custoTotal?rs(r.custoTotal):'—');set('foCustoKg',r.custoKgFinal?rs(r.custoKgFinal)+'/kg':'—');const st=$('foStatus'),d=Number(r.diferencaPara100)||0;if(st){if(Math.abs(d)<=0.05&&Number(r.totalPct)>0){st.textContent='FORMULAÇÃO FECHADA 100% ✅';st.className='midRes ok'}else if(d>0){st.textContent='FALTAM '+fmt(d,2)+'% PARA FECHAR ⚠️';st.className='midRes warn'}else{st.textContent='PASSOU '+fmt(Math.abs(d),2)+'% DO LIMITE ❌';st.className='midRes bad'}}return r}catch(e){apiError(e);return{}}}
  async function salvarFormula(){const nome=($('foNome')?.value||'').trim()||'Formulação',total=n('foTotal'),rows=getFoRows().filter(r=>r.id&&r.pct>0);if(!total){alert('Digite quantos kg quer fazer.');return}if(!rows.length){alert('Escolha pelo menos 1 material.');return}const r=await calcFo();const d=Number(r.diferencaPara100)||0;if(Math.abs(d)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;const rec={id:Date.now(),nome,total,rows,custo:Number(r.custoTotal)||0,custoKg:Number(r.custoKgFinal)||0,criado:new Date().toISOString()};const a=loadForms();a.unshift(rec);saveForms(a);alert('Formulação salva.')}
  function renderForms(){const b=$('foSaved'),a=loadForms();if(!b)return;if(!a.length){b.innerHTML="<div class='formNote'>Nenhuma formulação salva ainda.</div>";return}b.innerHTML=a.map(f=>'<div class="savedItem"><b>'+esc(f.nome)+'</b><div class="formNote">'+fmt(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+(f.custo?rs(f.custo):'sem custo')+'</div><div class="savedBtns"><button class="miniBtn" data-openform="'+f.id+'">ABRIR</button><button class="miniBtn" data-dupform="'+f.id+'">DUPLICAR</button><button class="delBtn" data-delform="'+f.id+'">EXCLUIR</button></div></div>').join('')}
  function abrirFormula(f,dup=false){if(!f)return;if($('foNome'))$('foNome').value=dup?(f.nome+' cópia'):f.nome;if($('foTotal'))$('foTotal').value=String(f.total||'').replace('.',',');renderMixRows(f.rows||[]);debounce('fo',calcFo,20);show('fo')}
  function initFormula(){renderMatBatch();renderMixRows();renderForms();$('matSave')?.addEventListener('click',salvarMateriais);$('matNome1')?.addEventListener('keydown',e=>{if(e.key==='Enter')salvarMateriais()});$('matPreco1')?.addEventListener('keydown',e=>{if(e.key==='Enter')salvarMateriais()});$('foTotal')?.addEventListener('input',()=>debounce('fo',calcFo));$('foSave')?.addEventListener('click',salvarFormula);$('foSaved')?.addEventListener('click',ev=>{const id=ev.target.dataset.openform||ev.target.dataset.dupform||ev.target.dataset.delform;if(!id)return;let forms=loadForms(),f=forms.find(x=>String(x.id)===String(id));if(ev.target.dataset.delform){if(confirm('Excluir esta formulação?'))saveForms(forms.filter(x=>String(x.id)!==String(id)));return}if(ev.target.dataset.dupform){const cp={...f,id:Date.now(),nome:(f.nome||'Formulação')+' cópia',criado:new Date().toISOString()};forms.unshift(cp);saveForms(forms);return}abrirFormula(f,false)})}

  function hero(p){const H={ex:['DF EXTRUSOR PRO','CALCULADORA DE EXTRUSÃO • PESO POR METRO • MICRA • DENSIDADE'],sa:['DF EXTRUSOR PRO','CALCULADORA DE SACOLAS • MICRA = PAREDE DUPLA • CÁLCULO AUTOMÁTICO'],cu:['DF EXTRUSOR PRO','CALCULADORA DE CUSTOS • CUSTO • VENDA • LUCRO POR ROLO'],fo:['DF EXTRUSOR PRO','FORMULAÇÃO • MATERIAIS • PORCENTAGEM • CUSTO POR KG']};const v=H[p]||H.ex;set('heroTitle',v[0]);set('heroSub',v[1])}
  function isDev(){return localStorage.getItem(DEV_KEY)==='1'||localStorage.getItem('df_formula_dev')==='1'}
  function show(p){for(const x of ['ex','sa','cu','fo']){const pg=$('pg'+x[0].toUpperCase()+x.slice(1)),bt=$('bt'+x[0].toUpperCase()+x.slice(1));if(pg)pg.classList.toggle('on',x===p);if(bt)bt.classList.toggle('on',x===p)}history.replaceState(null,'',p==='ex'?'./':p==='sa'?'./#sacolas':p==='cu'?'./#custo':'./#formulacao');hero(p);scrollTo(0,0)}

  function bind(){
    window.$=$;window.parseNum=parseNum;window.n=n;window.fmt=fmt;window.rs=rs;window.set=set;window.deviceId=deviceId;window.dfMsg=dfMsg;window.dfLocked=dfLocked;window.dfUnlocked=dfUnlocked;window.dfLicenseAuthLogin=dfLicenseAuthLogin;window.dfCalc=dfCalc;window.dens=dens;window.toggleManual=toggleManual;window.pesoMetroIdeal=pesoMetroIdeal;window.calcEx=calcEx;window.calcCor=calcCor;window.calcProd=calcProd;window.calcSa=calcSa;window.calcCu=calcCu;window.loadMats=loadMats;window.saveMats=saveMats;window.loadForms=loadForms;window.saveForms=saveForms;window.materialById=materialById;window.renderMixRows=renderMixRows;window.getFoRows=getFoRows;window.calcFo=calcFo;window.salvarFormula=salvarFormula;window.renderForms=renderForms;window.abrirFormula=abrirFormula;window.show=show;
    if($('licenseDevice'))$('licenseDevice').textContent='ID deste aparelho: '+deviceId();
    const inp=$('licenseKey'),btn=$('licenseBtn');
    btn?.addEventListener('click',()=>{const k=(inp?.value||'').trim();if(!k)return dfMsg('Digite sua licença.');dfLicenseAuthLogin(k)});
    inp?.addEventListener('keydown',e=>{if(e.key==='Enter')btn?.click()});
    const saved=localStorage.getItem(LICENSE_KEY);if(saved&&inp){inp.value=saved;dfLicenseAuthLogin(saved,true)}else dfLocked();
    ['exL','exM','exP','exDm'].forEach(id=>$(id)?.addEventListener('input',()=>debounce('ex',calcEx)));$('exDs')?.addEventListener('change',()=>debounce('ex',calcEx));
    ['exCorMasA','exCorArA','exCorPuxA'].forEach(id=>$(id)?.addEventListener('input',()=>debounce('cor',calcCor)));$('btnCorPux')?.addEventListener('click',calcCor);$('btnCorMas')?.addEventListener('click',calcCor);
    ['exProdMas','exProdPux','exProdAr','exProdPerc'].forEach(id=>$(id)?.addEventListener('input',()=>debounce('prod',calcProd)));$('btnProd')?.addEventListener('click',calcProd);
    ['saL','saC','saM','saQ','saDes','saDm'].forEach(id=>$(id)?.addEventListener('input',()=>debounce('sa',calcSa)));$('saDs')?.addEventListener('change',()=>debounce('sa',calcSa));
    ['cuPeso','cuKg','cuVenda','cuQtd'].forEach(id=>$(id)?.addEventListener('input',()=>debounce('cu',calcCu)));
    initFormula();
    const hash=location.hash;if(hash==='#sacolas')show('sa');else if(hash==='#custo')show('cu');else if(hash==='#formulacao')show('fo');else show('ex');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();


/* ---- sacola-peso-quantidade.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}
  function num(v){
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)?n:0;
  }
  function val(id){const e=$(id);return num(e?e.value:0)}
  function densidade(){
    const s=$('saDs');
    if(!s)return 0;
    return s.value==='manual'?val('saDm'):num(s.value);
  }
  function fmt(v,d=0){
    const n=Number(v);
    return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  }

  let timer=0;
  function debounce(){clearTimeout(timer);timer=setTimeout(calcular,180)}

  async function calcular(){
    const pesoAlvo=val('saPesoAlvo');
    const out=$('saQtdPorPeso');
    const st=$('saQtdPorPesoInfo');
    if(!out)return;

    if(!(pesoAlvo>0)){
      out.textContent='—';
      if(st)st.textContent='';
      return;
    }

    if(typeof window.dfCalc!=='function'){
      out.textContent='—';
      if(st){st.textContent='A calculadora ainda está carregando.';st.className='status warn'}
      return;
    }

    try{
      const r=await window.dfCalc('sacola',{
        largura:val('saL'),
        comprimento:val('saC'),
        micra:val('saM'),
        densidade:densidade(),
        descontoPct:val('saDes'),
        quantidade:0
      });
      const pesoUnidade=Number(r&&r.pesoUnidade)||0;
      if(!(pesoUnidade>0)){
        out.textContent='—';
        if(st){st.textContent='Preencha largura, comprimento, micra e densidade.';st.className='status warn'}
        return;
      }

      const qtd=Math.max(1,Math.round((pesoAlvo*1000)/pesoUnidade));
      const pesoEstimado=(qtd*pesoUnidade)/1000;
      out.textContent=fmt(qtd,0)+' sacos';
      if(st){
        st.textContent='Peso estimado com '+fmt(qtd,0)+' sacos: '+fmt(pesoEstimado,3)+' kg';
        st.className='status ok';
      }
    }catch(e){
      out.textContent='—';
      if(st){st.textContent='Não foi possível calcular agora.';st.className='status warn'}
    }
  }

  function montar(){
    if($('saPesoAlvo'))return;
    const q=$('saQ');
    const card=q&&q.closest('.card');
    if(!card)return;

    const box=document.createElement('div');
    box.id='saPesoQtdExtra';
    box.innerHTML='\
      <label>Peso desejado do rolo (kg)</label>\
      <input id="saPesoAlvo" class="main" inputmode="decimal" placeholder="Ex.: 6">\
      <div class="result">\
        <span>QUANTIDADE DE SACOS PELO PESO</span>\
        <b id="saQtdPorPeso">—</b>\
        <div id="saQtdPorPesoInfo" class="status"></div>\
      </div>';
    card.appendChild(box);

    $('saPesoAlvo')?.addEventListener('input',debounce);
    ['saL','saC','saM','saDes','saDm'].forEach(id=>$(id)?.addEventListener('input',debounce));
    $('saDs')?.addEventListener('change',debounce);
  }

  function init(){
    montar();
    setTimeout(montar,300);
    setTimeout(montar,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ---- material-manager.js ---- */
(function(){
  'use strict';

  const MAT_KEY='df_formula_materiais_v2';
  const STYLE_ID='dfMaterialManagerStyle';
  const WRAP_ID='dfMaterialManager';
  const PANEL_ID='dfMaterialManagerPanel';

  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const lower=t=>String(t??'').trim().toLocaleLowerCase('pt-BR');
  const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  function parsePrice(v){
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)&&n>=0?n:0;
  }

  function loadMats(){
    try{
      if(typeof window.loadMats==='function')return window.loadMats();
      return JSON.parse(localStorage.getItem(MAT_KEY)||'[]');
    }catch(e){return[];}
  }

  function saveMats(mats){
    if(typeof window.saveMats==='function')window.saveMats(mats);
    else localStorage.setItem(MAT_KEY,JSON.stringify(mats));
  }

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const st=document.createElement('style');
    st.id=STYLE_ID;
    st.textContent=[
      '.dfMatMgr{margin-top:12px}',
      '.dfMatMgrBtn{width:100%;border:1px solid #f59e0b;background:#111827;color:#facc15;border-radius:14px;padding:13px 14px;font:900 13px system-ui;cursor:pointer}',
      '.dfMatPanel{margin-top:12px;border:1px solid #334155;background:#0f172a;border-radius:16px;padding:12px}',
      '.dfMatPanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '.dfMatPanelHead b{color:#f8fafc;font:900 15px system-ui}',
      '.dfMatClose{border:1px solid #475569;background:#111827;color:#e2e8f0;border-radius:10px;padding:7px 10px;font-weight:800;cursor:pointer}',
      '.dfMatEmpty{color:#94a3b8;font:700 13px system-ui;padding:8px 2px}',
      '.dfMatItem{border:1px solid #334155;background:#111827;border-radius:13px;padding:11px;margin-top:9px}',
      '.dfMatSummary{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.dfMatName{font:900 14px system-ui;color:#f8fafc;word-break:break-word}',
      '.dfMatPrice{font:800 12px system-ui;color:#94a3b8;margin-top:3px}',
      '.dfMatActions{display:flex;gap:7px;flex-shrink:0}',
      '.dfMatAction{border:0;border-radius:9px;padding:8px 10px;font:900 11px system-ui;cursor:pointer}',
      '.dfMatEdit{background:#f59e0b;color:#111827}',
      '.dfMatDelete{background:#7f1d1d;color:#fee2e2;border:1px solid #ef4444}',
      '.dfMatEditor{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px;padding-top:11px;border-top:1px solid #334155}',
      '.dfMatEditor label{display:block;color:#cbd5e1;font:800 11px system-ui;margin-bottom:5px}',
      '.dfMatEditor input{width:100%;box-sizing:border-box;background:#0b1220;color:#f8fafc;border:1px solid #475569;border-radius:10px;padding:10px 11px;font:700 14px system-ui}',
      '.dfMatEditorBtns{grid-column:1/-1;display:flex;gap:8px}',
      '.dfMatSave,.dfMatCancel{flex:1;border:0;border-radius:10px;padding:10px;font:900 11px system-ui;cursor:pointer}',
      '.dfMatSave{background:#166534;color:#dcfce7;border:1px solid #22c55e}',
      '.dfMatCancel{background:#1e293b;color:#e2e8f0;border:1px solid #475569}',
      '@media(max-width:560px){.dfMatSummary{align-items:flex-start;flex-direction:column}.dfMatActions{width:100%}.dfMatAction{flex:1}.dfMatEditor{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function renderList(){
    const panel=document.getElementById(PANEL_ID);
    if(!panel)return;
    const mats=loadMats();
    let html='<div class="dfMatPanelHead"><b>Materiais cadastrados</b><button type="button" class="dfMatClose" data-dfmat="close">FECHAR</button></div>';
    if(!mats.length){
      panel.innerHTML=html+'<div class="dfMatEmpty">Nenhum material cadastrado.</div>';
      return;
    }

    html+=mats.map(m=>{
      const preco=Number(m.preco)||0;
      return '<div class="dfMatItem" data-id="'+esc(m.id)+'">'+
        '<div class="dfMatSummary">'+
          '<div><div class="dfMatName">'+esc(m.nome||'Material')+'</div><div class="dfMatPrice">'+(preco>0?'R$ '+fmt(preco)+'/kg':'Sem preço cadastrado')+'</div></div>'+ 
          '<div class="dfMatActions"><button type="button" class="dfMatAction dfMatEdit" data-dfmat="edit" data-id="'+esc(m.id)+'">EDITAR</button><button type="button" class="dfMatAction dfMatDelete" data-dfmat="delete" data-id="'+esc(m.id)+'">EXCLUIR</button></div>'+ 
        '</div>'+ 
        '<div class="dfMatEditor" data-editor="'+esc(m.id)+'" style="display:none">'+
          '<div><label>Nome do material</label><input data-field="name" value="'+esc(m.nome||'')+'"></div>'+ 
          '<div><label>Preço por kg</label><input data-field="price" inputmode="decimal" value="'+(preco>0?fmt(preco):'')+'" placeholder="Ex.: 5,50"></div>'+ 
          '<div class="dfMatEditorBtns"><button type="button" class="dfMatSave" data-dfmat="save" data-id="'+esc(m.id)+'">SALVAR ALTERAÇÃO</button><button type="button" class="dfMatCancel" data-dfmat="cancel" data-id="'+esc(m.id)+'">CANCELAR</button></div>'+ 
        '</div>'+ 
      '</div>';
    }).join('');
    panel.innerHTML=html;
  }

  function openEditor(id){
    document.querySelectorAll('[data-editor]').forEach(el=>{el.style.display=String(el.dataset.editor)===String(id)?'grid':'none';});
    const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');
    if(ed)ed.querySelector('[data-field="name"]')?.focus();
  }

  function saveEdit(id){
    const mats=loadMats();
    const i=mats.findIndex(m=>String(m.id)===String(id));
    if(i<0)return;
    const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');
    if(!ed)return;
    const nome=(ed.querySelector('[data-field="name"]')?.value||'').trim();
    const preco=parsePrice(ed.querySelector('[data-field="price"]')?.value||'');
    if(!nome){alert('Digite o nome do material.');return;}
    if(mats.some((m,idx)=>idx!==i&&lower(m.nome)===lower(nome))){alert('Já existe outro material com esse nome.');return;}
    mats[i]={...mats[i],nome,preco};
    saveMats(mats);
    renderList();
  }

  function deleteMat(id){
    const mats=loadMats();
    const m=mats.find(x=>String(x.id)===String(id));
    if(!m)return;
    if(!confirm('Excluir o material "'+(m.nome||'Material')+'" do cadastro?'))return;

    try{
      if(typeof window.getFoRows==='function'&&typeof window.renderMixRows==='function'){
        const rows=(window.getFoRows()||[]).filter(r=>String(r.id)!==String(id));
        window.renderMixRows(rows);
      }
    }catch(e){}

    saveMats(mats.filter(x=>String(x.id)!==String(id)));
    renderList();
  }

  function bindPanel(panel){
    if(panel.dataset.dfBound==='1')return;
    panel.dataset.dfBound='1';
    panel.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-dfmat]');
      if(!btn)return;
      const act=btn.dataset.dfmat,id=btn.dataset.id;
      if(act==='close'){panel.style.display='none';return;}
      if(act==='edit'){openEditor(id);return;}
      if(act==='cancel'){const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');if(ed)ed.style.display='none';return;}
      if(act==='save'){saveEdit(id);return;}
      if(act==='delete'){deleteMat(id);return;}
    });
  }

  function mount(){
    addStyle();
    const saveBtn=document.getElementById('matSave');
    if(!saveBtn||document.getElementById(WRAP_ID))return;

    const wrap=document.createElement('div');
    wrap.id=WRAP_ID;
    wrap.className='dfMatMgr';
    wrap.innerHTML='<button type="button" class="dfMatMgrBtn" id="dfMaterialEditBtn">✎ EDITAR MATERIAIS CADASTRADOS</button><div id="'+PANEL_ID+'" class="dfMatPanel" style="display:none"></div>';
    saveBtn.insertAdjacentElement('afterend',wrap);

    const panel=document.getElementById(PANEL_ID);
    bindPanel(panel);
    document.getElementById('dfMaterialEditBtn').addEventListener('click',()=>{
      renderList();
      panel.style.display=panel.style.display==='none'?'block':'none';
    });
  }

  function init(){
    mount();
    [400,900,1600,2600].forEach(t=>setTimeout(mount,t));
    document.addEventListener('click',()=>setTimeout(mount,80),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();


/* ---- cost-safe.js ---- */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const num=v=>window.parseNum?window.parseNum(v):(parseFloat(String(v||'').replace(',','.'))||0);
  const get=id=>num($(id)?.value);
  const getQtd=id=>{
    const e=$(id); if(!e) return 0;
    const s=String(e.value||'').trim().replace(/\s/g,'');
    if(!s) return 0;
    if(/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g,''),10)||0;
    if(/^\d{1,3}(,\d{3})+$/.test(s)) return parseInt(s.replace(/,/g,''),10)||0;
    const n=parseInt(s.replace(/\D/g,''),10);
    return Number.isFinite(n)?n:0;
  };
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const rs=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};

  const MODE_KEY='df_custo_lucro_modo_v1';
  const CONFIG_KEY='df_custo_config_v1';
  let timer=null;

  function schedule(){clearTimeout(timer);timer=setTimeout(calc,170)}
  function densSacola(){const s=$('saDs');if(!s)return 0;return s.value==='manual'?get('saDm'):num(s.value)}
  function sacolaInput(quantidade){return{largura:get('saL'),comprimento:get('saC'),micra:get('saM'),densidade:densSacola(),descontoPct:get('saDes'),quantidade:Number(quantidade)||0}}
  function lucroModo(){return $('cuLucroModo')?.value||localStorage.getItem(MODE_KEY)||'markup'}
  function precoModo(){return $('cuPrecoModo')?.value||'percentual'}

  function precoPorPercentual(custo,pct,modo){
    if(!(custo>0))return 0;
    if(modo==='margin'){
      if(!(pct>=0&&pct<100))return NaN;
      return custo/(1-pct/100);
    }
    return custo*(1+pct/100);
  }

  function lerConfig(){
    try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')||{}}catch(_){return{}}
  }
  function salvarConfig(){
    const ids=['cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuLucroPct','cuLucroModo'];
    const c={};
    ids.forEach(id=>{const e=$(id);if(e)c[id]=e.value});
    try{localStorage.setItem(CONFIG_KEY,JSON.stringify(c))}catch(_){}
  }
  function aplicarConfig(){
    const c=lerConfig();
    Object.entries(c).forEach(([id,v])=>{const e=$(id);if(e&&v!==undefined&&v!==null)e.value=v});
    const modoSalvo=localStorage.getItem(MODE_KEY)||c.cuLucroModo||'markup';
    if($('cuLucroModo'))$('cuLucroModo').value=modoSalvo==='margin'?'margin':'markup';
  }

  function atualizarExplicacao(){
    const modo=lucroModo(),pct=get('cuLucroPct');
    const el=$('cuLucroModoInfo');
    if(el){
      if(modo==='margin'){
        if(pct>=100){el.textContent='A margem sobre a venda precisa ser menor que 100%.';el.style.color='#fca5a5'}
        else{
          const markup=pct>0?(pct/(100-pct))*100:0;
          el.textContent=pct>0
            ? fmt(pct,2)+'% de margem sobre a venda. Ex.: custo R$ 100 → venda R$ '+fmt(100/(1-pct/100),2)+'. Acréscimo equivalente sobre o custo: '+fmt(markup,2)+'%.'
            : 'Margem sobre venda: o lucro é uma porcentagem do preço final. Ex.: custo R$ 100 com 50% de margem → venda R$ 200.';
          el.style.color='#94a3b8';
        }
      }else{
        const margem=pct>0?(pct/(100+pct))*100:0;
        el.textContent=pct>0
          ? fmt(pct,2)+'% sobre o custo. Ex.: custo R$ 100 → venda R$ '+fmt(100*(1+pct/100),2)+'. Margem real sobre a venda: '+fmt(margem,2)+'%.'
          : 'Lucro sobre custo (Markup): o percentual é acrescentado ao custo. Ex.: custo R$ 100 + 50% → venda R$ 150.';
        el.style.color='#94a3b8';
      }
    }

    const inv=$('cuPrecoInversoBox');
    const pctBox=$('cuPercentualBox');
    const inverso=precoModo()==='inverso';
    if(inv)inv.style.display=inverso?'block':'none';
    if(pctBox)pctBox.style.display=inverso?'none':'block';

    const pinfo=$('cuPrecoModoInfo');
    if(pinfo){
      pinfo.textContent=inverso
        ? 'Você informa o preço que quer cobrar e o app calcula automaticamente lucro, markup e margem reais.'
        : 'O app calcula o preço de venda a partir do percentual escolhido.';
    }
  }

  async function sacolaData(){
    if(typeof window.dfCalc!=='function')return{};
    const base=await window.dfCalc('sacola',sacolaInput(0));
    const pesoUnidade=Number(base&&base.pesoUnidade)||0;
    const pesoAlvo=get('saPesoAlvo');
    const qtdDigitada=get('saQ');
    let quantidade=0,origem='';

    if(pesoAlvo>0&&pesoUnidade>0){
      quantidade=Math.max(1,Math.round((pesoAlvo*1000)/pesoUnidade));
      origem='peso';
    }else if(qtdDigitada>0){
      quantidade=Math.max(1,Math.round(qtdDigitada));
      origem='quantidade';
    }

    if(!(quantidade>0))return{...base,quantidadeUsada:0,origem:'',pesoAlvo:0};
    const completo=await window.dfCalc('sacola',sacolaInput(quantidade));
    return{...completo,quantidadeUsada:quantidade,origem,pesoAlvo};
  }

  async function fillFromSacolas(force=false){
    const auto=$('cuAuto');
    if(!force&&auto&&!auto.checked)return;
    try{
      const d=await sacolaData();
      const peso=Number(d&&d.pesoQuantidadeKg)||0;
      const qtd=Number(d&&d.quantidadeUsada)||0;
      const pesoUnidade=Number(d&&d.pesoUnidade)||0;

      if($('cuPeso'))$('cuPeso').value=peso>0?fmt(peso,3):'';
      if($('cuUnid'))$('cuUnid').value=qtd>0?String(Math.round(qtd)):'';

      if(peso>0&&qtd>0){
        if(d.origem==='peso'){
          set('cuAutoInfo','Puxado automaticamente da aba Sacolas pelo peso desejado de '+fmt(d.pesoAlvo,3)+' kg: '+fmt(qtd,0)+' sacolas por rolo • peso calculado '+fmt(peso,3)+' kg • '+fmt(pesoUnidade,2)+' g por sacola');
        }else{
          set('cuAutoInfo','Puxado automaticamente da aba Sacolas: '+fmt(pesoUnidade,2)+' g por sacola • '+fmt(qtd,0)+' sacolas por rolo • '+fmt(peso,3)+' kg por rolo');
        }
      }else set('cuAutoInfo','Preencha a aba Sacolas ou digite manualmente abaixo.');
    }catch(e){
      console.error('DF custo automático:',e);
      set('cuAutoInfo','Não consegui puxar os dados da aba Sacolas.');
    }
  }

  function vendaRoloInversa(peso,unid){
    const valor=get('cuVendaAlvo');
    const tipo=$('cuVendaTipo')?.value||'sacola';
    if(!(valor>0))return 0;
    if(tipo==='rolo')return valor;
    if(tipo==='kg')return peso>0?valor*peso:0;
    return unid>0?valor*unid:0;
  }

  async function calc(){
    if(typeof window.dfCalc!=='function')return;
    await fillFromSacolas(false);
    atualizarExplicacao();

    const peso=get('cuPeso');
    const unid=getQtd('cuUnid');
    const custoMaterialKg=get('cuKg');
    const qtdRolos=Math.max(1,getQtd('cuQtd')||1);

    const energiaKg=get('cuEnergiaKg');
    const maoKg=get('cuMaoKg');
    const reprocessoKg=get('cuReprocessoKg');
    const outrosKg=get('cuOutrosKg');
    const embalagemRolo=get('cuEmbalagemRolo');
    const freteRolo=get('cuFreteRolo');
    const impostoPct=get('cuImpostoPct');
    const comissaoPct=get('cuComissaoPct');
    const lucroPct=get('cuLucroPct');
    const modo=lucroModo();

    try{
      const base=await window.dfCalc('custo',{pesoKg:peso,custoKg:custoMaterialKg,vendaKg:custoMaterialKg,quantidade:qtdRolos});
      const custoResinaRolo=Number(base.custoUnidade)||0;
      const custoFabrilKg=energiaKg+maoKg+reprocessoKg+outrosKg;
      const custoFabrilRolo=(peso*custoFabrilKg)+embalagemRolo+freteRolo;
      const custoRealRolo=custoResinaRolo+custoFabrilRolo;
      const custoRealKg=peso>0?custoRealRolo/peso:0;
      const custoUnid=unid>0?custoRealRolo/unid:0;

      let vendaRolo=0;
      if(precoModo()==='inverso'){
        vendaRolo=vendaRoloInversa(peso,unid);
      }else{
        vendaRolo=precoPorPercentual(custoRealRolo,lucroPct,modo);
        if(!Number.isFinite(vendaRolo)){
          set('cuLucro','MARGEM INVÁLIDA');
          ['cuVendaRolo','cuPrecoUnid','cuLucroRolo','cuVendaTotal','cuLucroTotal','cuLucroLiquidoRolo','cuLucroLiquidoTotal'].forEach(id=>set(id,'—'));
          return;
        }
      }

      const vendaUnid=unid>0?vendaRolo/unid:0;
      const vendaKg=peso>0?vendaRolo/peso:0;
      const lucroBrutoRolo=vendaRolo-custoRealRolo;
      const impostoRolo=vendaRolo*(impostoPct/100);
      const comissaoRolo=vendaRolo*(comissaoPct/100);
      const despesasVendaRolo=impostoRolo+comissaoRolo;
      const lucroLiquidoRolo=lucroBrutoRolo-despesasVendaRolo;

      const vendaTotal=vendaRolo*qtdRolos;
      const custoTotal=custoRealRolo*qtdRolos;
      const lucroBrutoTotal=lucroBrutoRolo*qtdRolos;
      const despesasTotal=despesasVendaRolo*qtdRolos;
      const lucroLiquidoTotal=lucroLiquidoRolo*qtdRolos;

      const markupReal=custoRealRolo>0?((vendaRolo/custoRealRolo)-1)*100:0;
      const margemReal=vendaRolo>0?(lucroBrutoRolo/vendaRolo)*100:0;
      const margemLiquida=vendaRolo>0?(lucroLiquidoRolo/vendaRolo)*100:0;

      let titulo='';
      if(precoModo()==='inverso') titulo='PREÇO INFORMADO';
      else titulo=modo==='margin'?'MARGEM '+fmt(lucroPct,2)+'%':'MARKUP +'+fmt(lucroPct,2)+'%';

      set('cuLucro',titulo+' • lucro líquido total '+(vendaRolo>0?rs(lucroLiquidoTotal):'—'));
      set('cuCustoResinaRolo',custoResinaRolo?rs(custoResinaRolo):'—');
      set('cuCustoFabrilRolo',custoFabrilRolo?rs(custoFabrilRolo):rs(0));
      set('cuCustoRealKg',custoRealKg?rs(custoRealKg)+'/kg':'—');
      set('cuCustoRolo',custoRealRolo?rs(custoRealRolo):'—');
      set('cuVendaRolo',vendaRolo?rs(vendaRolo):'—');
      set('cuPrecoKg',vendaKg?rs(vendaKg)+'/kg':'—');
      set('cuPrecoUnid',vendaUnid?rs(vendaUnid):'—');
      set('cuCustoUnid',custoUnid?rs(custoUnid):'—');
      set('cuLucroRolo',lucroBrutoRolo?rs(lucroBrutoRolo):'—');
      set('cuDespesasRolo',vendaRolo?rs(despesasVendaRolo):'—');
      set('cuLucroLiquidoRolo',vendaRolo?rs(lucroLiquidoRolo):'—');
      set('cuVendaTotal',vendaTotal?rs(vendaTotal):'—');
      set('cuCustoTotal',custoTotal?rs(custoTotal):'—');
      set('cuLucroTotal',vendaRolo?rs(lucroBrutoTotal):'—');
      set('cuDespesasTotal',vendaRolo?rs(despesasTotal):'—');
      set('cuLucroLiquidoTotal',vendaRolo?rs(lucroLiquidoTotal):'—');

      set('cuMarkupReal',vendaRolo?fmt(markupReal,2)+'%':'—');
      set('cuMargemReal',vendaRolo?fmt(margemReal,2)+'%':'—');
      set('cuMargemLiquida',vendaRolo?fmt(margemLiquida,2)+'%':'—');

      const invInfo=$('cuVendaAlvoInfo');
      if(invInfo&&precoModo()==='inverso'){
        invInfo.textContent=vendaRolo>0
          ? 'Preço informado resulta em '+fmt(markupReal,2)+'% sobre o custo, '+fmt(margemReal,2)+'% de margem bruta e '+fmt(margemLiquida,2)+'% de margem líquida.'
          : 'Informe um preço válido para calcular o resultado.';
      }

      salvarConfig();
    }catch(e){console.error(e)}
  }

  function build(){
    const pg=$('pgCu');
    if(!pg||pg.dataset.dfCustoAuto==='1')return;
    pg.dataset.dfCustoAuto='1';

    pg.innerHTML='<div class="card">'+
      '<span class="tag">Custo</span><h2>Custo e venda automático</h2>'+
      '<div class="hint">Puxa peso e quantidade da aba Sacolas e calcula custo real, venda, lucro bruto e lucro líquido.</div>'+
      '<button id="cuPull" class="calcBtn alt" type="button">PUXAR DADOS DA ABA SACOLAS</button>'+
      '<label style="display:flex;gap:9px;align-items:center;margin-top:12px"><input id="cuAuto" type="checkbox" checked style="width:auto"> Preencher automático pela aba Sacolas</label>'+
      '<div id="cuAutoInfo" class="smallNote">Preencha a aba Sacolas ou digite manualmente abaixo.</div>'+

      '<h3 style="margin:18px 0 8px">1. Dados do produto</h3>'+
      '<div class="grid">'+
        '<div><label>Peso do rolo (kg)</label><input id="cuPeso" class="main" inputmode="decimal" placeholder="Ex.: 6"></div>'+
        '<div><label>Sacolas por rolo</label><input id="cuUnid" class="main" inputmode="numeric" placeholder="Ex.: 2000"></div>'+
        '<div><label>Custo da resina por kg</label><input id="cuKg" class="main" inputmode="decimal" placeholder="Ex.: 7,50"><div class="smallNote">Valor médio do material/resina usado no produto.</div></div>'+
        '<div><label>Quantidade de rolos</label><input id="cuQtd" class="main" inputmode="numeric" placeholder="Ex.: 10"></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">2. Custo fabril</h3>'+
      '<div class="hint">Todos são opcionais. Deixe 0 ou vazio quando não quiser incluir.</div>'+
      '<div class="grid">'+
        '<div><label>Energia (R$/kg)</label><input id="cuEnergiaKg" class="main" inputmode="decimal" placeholder="Ex.: 0,45"><div class="smallNote">Custo de energia para produzir cada kg.</div></div>'+
        '<div><label>Mão de obra (R$/kg)</label><input id="cuMaoKg" class="main" inputmode="decimal" placeholder="Ex.: 0,60"><div class="smallNote">Custo de mão de obra rateado por kg.</div></div>'+
        '<div><label>Reprocesso / apara (R$/kg)</label><input id="cuReprocessoKg" class="main" inputmode="decimal" placeholder="Ex.: 0,20"><div class="smallNote">Custo adicional de moagem, reprocesso ou perdas.</div></div>'+
        '<div><label>Outros custos (R$/kg)</label><input id="cuOutrosKg" class="main" inputmode="decimal" placeholder="Ex.: 0,15"><div class="smallNote">Outros custos fabris variáveis por kg.</div></div>'+
        '<div><label>Embalagem (R$/rolo)</label><input id="cuEmbalagemRolo" class="main" inputmode="decimal" placeholder="Ex.: 1,50"><div class="smallNote">Tubete, saco, etiqueta e embalagem do rolo.</div></div>'+
        '<div><label>Frete / custo fixo (R$/rolo)</label><input id="cuFreteRolo" class="main" inputmode="decimal" placeholder="Ex.: 2,00"><div class="smallNote">Valor fixo que deseja acrescentar em cada rolo.</div></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">3. Impostos e comissão</h3>'+
      '<div class="grid">'+
        '<div><label>Impostos sobre a venda (%)</label><input id="cuImpostoPct" class="main" inputmode="decimal" placeholder="Ex.: 8"><div class="smallNote">Percentual descontado do valor vendido.</div></div>'+
        '<div><label>Comissão do vendedor (%)</label><input id="cuComissaoPct" class="main" inputmode="decimal" placeholder="Ex.: 3"><div class="smallNote">Comissão calculada sobre o valor da venda.</div></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">4. Formação do preço</h3>'+
      '<div class="grid">'+
        '<div><label>Como deseja formar o preço?</label><select id="cuPrecoModo" class="main"><option value="percentual">Calcular pelo percentual</option><option value="inverso">Quero informar o preço de venda</option></select><div id="cuPrecoModoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
      '</div>'+

      '<div id="cuPercentualBox">'+
        '<div class="grid">'+
          '<div><label>Tipo de lucro</label><select id="cuLucroModo" class="main"><option value="markup">Lucro sobre custo (Markup)</option><option value="margin">Margem sobre venda</option></select><div id="cuLucroModoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
          '<div><label>Percentual desejado (%)</label><input id="cuLucroPct" class="main" inputmode="decimal" placeholder="Ex.: 50"></div>'+
        '</div>'+
      '</div>'+

      '<div id="cuPrecoInversoBox" style="display:none">'+
        '<div class="grid">'+
          '<div><label>Quero vender por</label><select id="cuVendaTipo" class="main"><option value="sacola">Preço por sacola</option><option value="rolo">Preço por rolo</option><option value="kg">Preço por kg</option></select></div>'+
          '<div><label>Preço desejado (R$)</label><input id="cuVendaAlvo" class="main" inputmode="decimal" placeholder="Ex.: 0,08"><div id="cuVendaAlvoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
        '</div>'+
      '</div>'+

      '<div class="result"><span>LUCRO LÍQUIDO TOTAL ESTIMADO</span><b id="cuLucro">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Resumo por rolo</h3>'+
      '<div class="kpi"><span>Custo da resina por rolo</span><b id="cuCustoResinaRolo">—</b></div>'+
      '<div class="kpi"><span>Custo fabril por rolo</span><b id="cuCustoFabrilRolo">—</b></div>'+
      '<div class="kpi"><span>Custo real por kg</span><b id="cuCustoRealKg">—</b></div>'+
      '<div class="kpi"><span>Custo real por rolo</span><b id="cuCustoRolo">—</b></div>'+
      '<div class="kpi"><span>Preço de venda por kg</span><b id="cuPrecoKg">—</b></div>'+
      '<div class="kpi"><span>Preço de venda por rolo</span><b id="cuVendaRolo">—</b></div>'+
      '<div class="kpi"><span>Preço por unidade / sacola</span><b id="cuPrecoUnid">—</b></div>'+
      '<div class="kpi"><span>Custo por unidade / sacola</span><b id="cuCustoUnid">—</b></div>'+
      '<div class="kpi"><span>Lucro bruto por rolo</span><b id="cuLucroRolo">—</b></div>'+
      '<div class="kpi"><span>Impostos + comissão por rolo</span><b id="cuDespesasRolo">—</b></div>'+
      '<div class="kpi"><span>Lucro líquido por rolo</span><b id="cuLucroLiquidoRolo">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Percentuais reais</h3>'+
      '<div class="kpi"><span>Markup real sobre o custo</span><b id="cuMarkupReal">—</b></div>'+
      '<div class="kpi"><span>Margem bruta sobre a venda</span><b id="cuMargemReal">—</b></div>'+
      '<div class="kpi"><span>Margem líquida sobre a venda</span><b id="cuMargemLiquida">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Totais do pedido</h3>'+
      '<div class="kpi"><span>Venda total</span><b id="cuVendaTotal">—</b></div>'+
      '<div class="kpi"><span>Custo total</span><b id="cuCustoTotal">—</b></div>'+
      '<div class="kpi"><span>Lucro bruto total</span><b id="cuLucroTotal">—</b></div>'+
      '<div class="kpi"><span>Impostos + comissão total</span><b id="cuDespesasTotal">—</b></div>'+
      '<div class="kpi"><span>Lucro líquido total</span><b id="cuLucroLiquidoTotal">—</b></div>'+
    '</div>';

    aplicarConfig();
    atualizarExplicacao();

    const ids=['cuPeso','cuUnid','cuKg','cuQtd','cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuLucroPct','cuVendaAlvo','cuAuto'];
    ids.forEach(id=>$(id)?.addEventListener('input',()=>{salvarConfig();schedule()}));

    ['cuLucroModo','cuPrecoModo','cuVendaTipo'].forEach(id=>$(id)?.addEventListener('change',()=>{
      if(id==='cuLucroModo')localStorage.setItem(MODE_KEY,lucroModo());
      salvarConfig();atualizarExplicacao();schedule();
    }));

    ['cuPeso','cuUnid'].forEach(id=>$(id)?.addEventListener('input',()=>{if($('cuAuto'))$('cuAuto').checked=false;schedule()}));
    $('cuPull')?.addEventListener('click',async()=>{if($('cuAuto'))$('cuAuto').checked=true;await fillFromSacolas(true);schedule()});

    ['saL','saC','saM','saQ','saPesoAlvo','saDes','saDm','saDs'].forEach(id=>{
      const e=$(id);e?.addEventListener('input',schedule);e?.addEventListener('change',schedule);
    });

    window.addEventListener('hashchange',()=>{if(location.hash==='#custo')schedule()});
    window.addEventListener('focus',schedule);
    window.calcCu=calc;
    fillFromSacolas(true).then(calc);
  }

  function init(){build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200));else setTimeout(init,200);
})();


/* ---- cost-unit-stable.js ---- */
(function(){
  'use strict';
  let timer=0,bound=false;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{try{if(typeof window.calcCu==='function')window.calcCu()}catch(e){}},220);
  }
  function bind(){
    if(bound)return;
    const pg=document.getElementById('pgCu');
    if(!pg){setTimeout(bind,300);return}
    bound=true;
    ['cuKg','cuLucroPct','cuLucroModo','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuAuto','saL','saC','saM','saDes','saDm','saPesoAlvo','saQ'].forEach(id=>{
      const e=document.getElementById(id);
      e?.addEventListener('input',schedule);
      e?.addEventListener('change',schedule);
    });
    window.addEventListener('hashchange',schedule);
    window.addEventListener('focus',schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();


/* ---- cost-explanations.js ---- */
(function(){
  'use strict';
  const itens={
    cuCustoResinaRolo:'Somente o custo da matéria-prima usada em 1 rolo.',
    cuCustoFabrilRolo:'Energia, mão de obra, reprocesso, outros custos, embalagem e frete incluídos no rolo.',
    cuCustoRealKg:'Custo final por kg depois de somar resina e custos fabris.',
    cuCustoRolo:'Custo completo para produzir 1 rolo.',
    cuPrecoKg:'Preço de venda equivalente por kg.',
    cuVendaRolo:'Valor cobrado pela venda de 1 rolo.',
    cuPrecoUnid:'Valor de venda de cada sacola.',
    cuCustoUnid:'Custo completo para produzir cada sacola.',
    cuLucroRolo:'Venda menos o custo real, antes de impostos e comissão.',
    cuDespesasRolo:'Total de impostos e comissão descontados da venda de 1 rolo.',
    cuLucroLiquidoRolo:'Quanto realmente sobra em 1 rolo depois dos custos, impostos e comissão.',
    cuMarkupReal:'Quanto o preço ficou acima do custo real.',
    cuMargemReal:'Percentual do preço de venda que sobra como lucro bruto.',
    cuMargemLiquida:'Percentual da venda que realmente sobra depois de impostos e comissão.',
    cuVendaTotal:'Faturamento de todos os rolos informados.',
    cuCustoTotal:'Custo completo de todos os rolos.',
    cuLucroTotal:'Lucro bruto total antes de impostos e comissão.',
    cuDespesasTotal:'Total de impostos e comissão de todo o pedido.',
    cuLucroLiquidoTotal:'Ganho final do pedido depois de todos os custos, impostos e comissão.'
  };

  function aplicar(){
    Object.entries(itens).forEach(([id,texto])=>{
      const valor=document.getElementById(id);
      const kpi=valor&&valor.closest('.kpi');
      if(!kpi||kpi.dataset.dfExplicado==='1')return;
      const titulo=kpi.querySelector('span');
      if(!titulo)return;

      const box=document.createElement('div');
      box.className='dfKpiTexto';
      titulo.parentNode.insertBefore(box,titulo);
      box.appendChild(titulo);

      const exp=document.createElement('small');
      exp.className='dfKpiExp';
      exp.textContent=texto;
      box.appendChild(exp);
      kpi.dataset.dfExplicado='1';
    });
  }

  function estilo(){
    if(document.getElementById('dfKpiExpStyle'))return;
    const s=document.createElement('style');
    s.id='dfKpiExpStyle';
    s.textContent='.kpi .dfKpiTexto{display:flex;flex-direction:column;gap:4px;min-width:0;padding-right:12px}.kpi .dfKpiExp{display:block;color:#8292ad;font-size:11px;line-height:1.25;font-weight:500}.kpi>b{flex:0 0 auto;text-align:right}.card h3{color:#dbeafe;font-size:14px}@media(max-width:560px){.kpi .dfKpiExp{font-size:10px}.kpi{align-items:center}}';
    document.head.appendChild(s);
  }

  function init(){estilo();aplicar();setTimeout(aplicar,300);setTimeout(aplicar,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('df-ui-ready',aplicar);
})();


/* ---- formula-unlock.js ---- */
(function(){
  const DEV_KEY='df_formula_dev_v1';
  function unlockFormula(){
    try{
      localStorage.setItem(DEV_KEY,'1');
      localStorage.setItem('df_formula_dev','1');
    }catch(e){}
    try{
      const btn=document.getElementById('btFo');
      if(btn){
        btn.textContent='FORMULAÇÃO';
        btn.classList.remove('locked');
        btn.onclick=function(){ if(window.show) window.show('fo'); };
      }
      const locked=document.getElementById('foLocked');
      if(locked) locked.style.display='none';
      const area=document.getElementById('foDevArea');
      if(area) area.style.display='block';
    }catch(e){}
  }
  unlockFormula();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(unlockFormula,80)});
  }else{
    setTimeout(unlockFormula,80);
  }
  setTimeout(unlockFormula,600);
  setTimeout(unlockFormula,1600);
})();

/* ---- help-extra.js ---- */
(function(){
  const $=id=>document.getElementById(id);
  const canSpeak=()=>('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
  let reading=false;
  let readIndex=0;
  let readParts=[];

  const sections=[
    {title:'1. Objetivo do sistema',note:'O DF EXTRUSOR PRO foi desenvolvido para facilitar os cálculos do dia a dia na extrusão de filme plástico, sacolas, custo, formulação, PDF e OP de produção.',kpis:[['O sistema ajuda a calcular','Peso por metro, micra, RPM, sacolas, custo, lucro, formulação e OP']]},
    {title:'2. Acesso por licença',note:'Ao abrir o sistema, o usuário deve digitar a chave de licença no campo Licença DF e clicar em ATIVAR / ENTRAR.',kpis:[['Licença válida','Libera o sistema'],['Licença inválida','Mostra mensagem de erro']],small:'Cada licença pode ser vinculada ao navegador ou aparelho usado pelo cliente.'},
    {title:'3. Aba Extrusão',note:'A aba Extrusão calcula o peso ideal de 1 metro de filme e auxilia na regulagem da máquina.',kpis:[['Preencher','Largura, micra e densidade'],['Resultado','Peso ideal de 1 metro em gramas']],small:'A densidade pode ser escolhida em opções prontas ou digitada manualmente, útil para material reciclado.'},
    {title:'4. Descobrir micra real',note:'Corte 1 metro de filme, pese na balança e digite o peso medido. O sistema mostra a micra real do filme.',kpis:[['Serve para saber','Se o filme está fino, grosso ou correto']]},
    {title:'5. Corrigir micra por peso',note:'Use quando o peso real não bate com o peso ideal. Informe os RPMs atuais da máquina.',kpis:[['Informar','RPM da massa, ar e puxador'],['O sistema mostra','Correção pelo puxador ou pela massa']],small:'Se o filme está pesado ou grosso, normalmente aumenta o puxador ou diminui a massa. Se está leve ou fino, normalmente diminui o puxador ou aumenta a massa.'},
    {title:'6. Aumentar ou diminuir produção',note:'Informe os RPMs atuais e a porcentagem que deseja aumentar ou diminuir.',kpis:[['Exemplo','Aumentar 20% ou diminuir 10%'],['Resultado','Novos RPMs de referência']],small:'A função mantém a relação entre massa e puxador mais equilibrada para preservar a micra próxima.'},
    {title:'7. Aba Sacolas',note:'A aba Sacolas calcula peso do saco, peso do rolo e quantidade.',kpis:[['Preencher','Largura, comprimento, micra, densidade, desconto e quantidade'],['Resultados','Peso do saco, peso do rolo, sacos por kg e peso de 1.000 sacos']],small:'O desconto de alça ou recorte deve ser usado quando a embalagem perde material no corte.'},
    {title:'8. Aba Custo',note:'A aba Custo calcula venda, lucro, preço por rolo e preço por unidade.',kpis:[['Puxa da aba Sacolas','Peso do rolo e sacolas por rolo'],['Também permite','Digitar manualmente'],['Preencher','Custo por kg, lucro desejado % e quantidade de rolos'],['Resultados','Preço por rolo, preço por unidade e lucro total']]},
    {title:'9. Aba Formulação',note:'A aba Formulação serve para cadastrar materiais e montar misturas por porcentagem.',kpis:[['Cadastrar material','Nome do material e preço por kg opcional'],['Montar formulação','Nome, quantidade total, material e porcentagem'],['O sistema mostra','Porcentagem total, kg de cada material, custo total e custo por kg']],small:'A formulação deve fechar 100%. Se faltar ou passar, o sistema avisa.'},
    {title:'10. Formulações salvas',note:'Depois de salvar, a formulação fica disponível em uma barra de seleção.',kpis:[['ABRIR','Carrega a formulação'],['PDF','Gera relatório de formulação'],['OP','Gera ordem de produção'],['DUPLICAR','Cria uma cópia'],['EXCLUIR','Apaga a formulação selecionada']]},
    {title:'11. PDF da formulação',note:'O PDF mostra nome da formulação, quantidade total, materiais, porcentagem, kg de cada material, preço por kg, custo total e custo por kg final.',kpis:[['Uso indicado','Conferência, orçamento e controle interno']]},
    {title:'12. OP de produção',note:'A OP puxa automaticamente os dados da Extrusão e da Formulação.',kpis:[['Puxa automático','Nome, peso, largura, comprimento, micra, gramatura, materiais e porcentagem'],['Produção preenche','Data, operador, máquina, aparas, quantidade, paradas e bobinas']],small:'A OP foi feita em A4 paisagem com os campos mais importantes destacados para facilitar a leitura na produção.'},
    {title:'13. Cuidados importantes',note:'Antes de usar os resultados na produção, confira se a largura está em cm, se a micra é parede dupla, se a densidade está correta, se o peso foi medido em 1 metro, se a quantidade de sacolas está correta e se a formulação fechou 100%.',small:'Os cálculos servem como referência técnica. A regulagem final deve ser feita pelo operador responsável, observando estabilidade do balão, qualidade do filme e peso real na balança.'},
    {title:'14. Resumo rápido',note:'Resumo das funções principais do sistema.',kpis:[['Extrusão','Peso por metro, micra real e correção RPM'],['Sacolas','Peso do saco, peso do rolo e quantidade'],['Custo','Preço de venda, lucro, rolo e unidade'],['Formulação','Mistura de materiais e custo por kg'],['PDF e OP','Relatório e ordem de produção']]},
    {title:'15. Suporte',note:'Em caso de dúvida, entre em contato com a DF Manutenção e Consultoria.',kpis:[['Instagram','@Df_manutencao_consultoria']]}
  ];

  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function kpisHtml(kpis){return (kpis||[]).map(k=>'<div class="kpi"><span>'+esc(k[0])+'</span><b>'+esc(k[1])+'</b></div>').join('')}
  function cardsHtml(){return sections.map(s=>'<div class="card"><h2>'+esc(s.title)+'</h2><div class="formNote">'+esc(s.note)+'</div>'+kpisHtml(s.kpis)+(s.small?'<div class="smallNote">'+esc(s.small)+'</div>':'')+'</div>').join('')}
  function readTextParts(){const first='Manual de operação do DF EXTRUSOR PRO. Agora o assistente vai ler a ajuda da calculadora.';return [first].concat(sections.map(s=>{let t=s.title+'. '+s.note+'. ';(s.kpis||[]).forEach(k=>{t+=k[0]+': '+k[1]+'. '});if(s.small)t+=s.small+'. ';return t}))}
  function manualHtml(){return `<section id="pgAj" class="page"><div class="card"><span class="tag">Ajuda</span><h2>Manual de operação — DF EXTRUSOR PRO</h2><div class="hint">Este manual explica cada função do sistema para operador, encarregado, produção e cliente.</div></div><div class="card" id="dfHelpAssistant"><span class="tag">Assistente</span><h2>🤖 Assistente de leitura</h2><div class="hint">Clique em <b>ASSISTENTE LER</b> para o celular ou computador ler a ajuda em voz alta.</div><div class="dfHelpActions"><button id="dfHelpRead" class="calcBtn" type="button">🔊 ASSISTENTE LER</button><button id="dfHelpStop" class="calcBtn danger" type="button">⏹ PARAR LEITURA</button></div><div id="dfHelpMsg" class="status">Pronto para ler a ajuda.</div><div class="smallNote">A voz usa o próprio navegador do aparelho. No iPhone ou Android, toque no botão e mantenha a tela aberta durante a leitura.</div></div><div id="dfHelpReadText">${cardsHtml()}</div></section>`}

  function addStyle(){if($('dfHelpStyle'))return;const st=document.createElement('style');st.id='dfHelpStyle';st.textContent='.dfHelpActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}@media(max-width:560px){.tabs{grid-template-columns:repeat(3,1fr)!important}.dfHelpActions{grid-template-columns:1fr}.tab{font-size:10px!important}}@media(min-width:561px){.tabs{grid-template-columns:repeat(6,1fr)!important}}';document.head.appendChild(st)}
  function addHelpTab(){addStyle();const tabs=document.querySelector('.tabs');if(!tabs||$('btAj'))return;const btn=document.createElement('button');btn.id='btAj';btn.className='tab';btn.type='button';btn.textContent='AJUDA';btn.addEventListener('click',showHelp);const curso=tabs.querySelector('button:last-child');if(curso)tabs.insertBefore(btn,curso);else tabs.appendChild(btn)}
  function addHelpPage(){if($('pgAj'))return;const wrap=$('appContent')||document.querySelector('.w');if(!wrap)return;wrap.insertAdjacentHTML('beforeend',manualHtml());const read=$('dfHelpRead'),stop=$('dfHelpStop');if(read)read.addEventListener('click',startRead);if(stop)stop.addEventListener('click',()=>stopRead(true))}
  function markTab(on){['btEx','btSa','btCu','btFo','btAj'].forEach(id=>{const b=$(id);if(b)b.classList.toggle('on',id==='btAj'&&on)})}
  function basicShow(p){['Ex','Sa','Cu','Fo','Aj'].forEach(k=>{const pg=$('pg'+k),bt=$('bt'+k);if(pg)pg.classList.toggle('on',k.toLowerCase()===String(p).toLowerCase());if(bt)bt.classList.toggle('on',k.toLowerCase()===String(p).toLowerCase())})}
  function showHelp(){addHelpTab();addHelpPage();['pgEx','pgSa','pgCu','pgFo'].forEach(id=>{const p=$(id);if(p)p.classList.remove('on')});const p=$('pgAj');if(p)p.classList.add('on');markTab(true);const h=$('heroTitle'),s=$('heroSub');if(h)h.textContent='DF EXTRUSOR PRO';if(s)s.textContent='MANUAL DE OPERAÇÃO • AJUDA • ASSISTENTE DE VOZ';try{history.replaceState(null,'','./#ajuda')}catch(e){}try{scrollTo(0,0)}catch(e){}}
  function setMsg(txt,cls){const m=$('dfHelpMsg');if(!m)return;m.textContent=txt;m.className='status '+(cls||'')}
  function pickVoice(){try{const voices=speechSynthesis.getVoices()||[];return voices.find(v=>/pt-BR/i.test(v.lang))||voices.find(v=>/^pt/i.test(v.lang))||null}catch(e){return null}}
  function speakNext(){if(!reading)return;if(readIndex>=readParts.length){reading=false;setMsg('Leitura finalizada.','ok');return}const u=new SpeechSynthesisUtterance(readParts[readIndex]);u.lang='pt-BR';u.rate=.92;u.pitch=1;const voice=pickVoice();if(voice)u.voice=voice;u.onstart=()=>setMsg('Assistente lendo '+(readIndex+1)+' de '+readParts.length+'...','ok');u.onend=()=>{readIndex++;setTimeout(speakNext,180)};u.onerror=()=>{reading=false;setMsg('Não consegui continuar a leitura neste aparelho. Tente tocar em Assistente ler de novo.','bad')};try{speechSynthesis.speak(u);setTimeout(()=>{try{speechSynthesis.resume()}catch(e){}},250)}catch(e){reading=false;setMsg('Este navegador não liberou a leitura em voz alta.','bad')}}
  function startRead(){if(!canSpeak()){setMsg('Este aparelho ou navegador não suporta leitura em voz alta.','bad');return}try{speechSynthesis.cancel()}catch(e){}readParts=readTextParts();readIndex=0;reading=true;setMsg('Preparando assistente de leitura...','warn');setTimeout(speakNext,120)}
  function stopRead(show){reading=false;try{if(canSpeak())speechSynthesis.cancel()}catch(e){}if(show)setMsg('Leitura parada.','warn')}
  function init(){addHelpTab();addHelpPage();const oldShow=window.show;if(!window.dfHelpShowWrapped){window.dfHelpShowWrapped=true;window.show=function(p){if(p==='aj'||p==='ajuda')return showHelp();stopRead(false);if(oldShow)oldShow(p);else basicShow(p);const pg=$('pgAj');if(pg)pg.classList.remove('on');const b=$('btAj');if(b)b.classList.remove('on')}}if(location.hash==='#ajuda')showHelp();try{if(canSpeak())speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}

  // O script é carregado no fim do body, então a interface já existe.
  // Inicializa imediatamente para evitar o "pisca" em que o botão AJUDA aparecia depois.
  init();
})();


/* ---- back-extra.js ---- */
(function(){
  function showFormulaOnOpener(w){
    try{
      if(w && w.opener && !w.opener.closed){
        if(typeof w.opener.show==='function') w.opener.show('fo');
        const btn=w.opener.document && w.opener.document.getElementById('btFo');
        if(btn) btn.click();
        w.opener.focus();
        return true;
      }
    }catch(e){}
    return false;
  }

  function addBackButton(w, tipo){
    function run(){
      try{
        if(!w || w.closed || !w.document || !w.document.body) return;
        if(w.document.getElementById('dfBackFormula')) return;

        const st=w.document.createElement('style');
        st.textContent='.dfBackBar{position:sticky;top:0;z-index:99999;background:#080b13;padding:10px 12px;border-bottom:2px solid #facc15;font-family:Arial,Helvetica,sans-serif}.dfBackBtn{appearance:none;border:0;border-radius:10px;background:#facc15;color:#111827;font-weight:900;padding:10px 14px;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.18)}.dfBackTxt{color:#e5e7eb;font-size:11px;margin-left:10px}@media print{.dfBackBar{display:none!important}}';
        w.document.head.appendChild(st);

        const bar=w.document.createElement('div');
        bar.id='dfBackFormula';
        bar.className='dfBackBar';

        const btn=w.document.createElement('button');
        btn.type='button';
        btn.className='dfBackBtn';
        btn.textContent='← VOLTAR PARA FORMULAÇÃO';
        btn.onclick=function(){
          const ok=showFormulaOnOpener(w);
          try{w.close()}catch(e){}
          if(!ok){
            try{w.location.href='./#formulação'}catch(e){}
          }
          return false;
        };

        const txt=w.document.createElement('span');
        txt.className='dfBackTxt';
        txt.textContent=tipo+' pronta. Use imprimir/salvar ou volte para editar.';

        bar.appendChild(btn);
        bar.appendChild(txt);
        w.document.body.insertBefore(bar,w.document.body.firstChild);
      }catch(e){}
    }
    setTimeout(run,80);
    setTimeout(run,350);
    setTimeout(run,900);
  }

  function wrapPrint(name,tipo){
    const old=window[name];
    if(typeof old!=='function' || old.dfBackWrapped) return false;
    const wrapped=function(){
      let captured=null;
      const realOpen=window.open;
      window.open=function(){
        captured=realOpen.apply(window,arguments);
        return captured;
      };
      try{
        return old.apply(this,arguments);
      }finally{
        window.open=realOpen;
        if(captured) addBackButton(captured,tipo);
      }
    };
    wrapped.dfBackWrapped=true;
    window[name]=wrapped;
    return true;
  }

  function init(){
    wrapPrint('printFormulaPdf','PDF');
    wrapPrint('printFormulaOp','OP');
  }

  init();
  setTimeout(init,200);
  setTimeout(init,800);
  setTimeout(init,1600);
})();


/* ---- bobina-safe.js ---- */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const PI=Math.PI;
  const pn=v=>{
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const x=parseFloat(s.replace(/[^0-9.\-]/g,''));
    return Number.isFinite(x)?x:0;
  };
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const fmtInp=(v,d=2)=>Number(v)>0?Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d}):'';
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};
  const setMsg=(t,c)=>{const e=$('bobMsg');if(e){e.textContent=t;e.className='status '+(c||'')}};
  let timer=null;

  function addStyle(){
    if($('dfBobinaStyle'))return;
    const st=document.createElement('style');
    st.id='dfBobinaStyle';
    st.textContent=[
      '.dfBobinaCard{border-color:#3b2b0b!important}',
      '.dfBobinaTop{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
      '.dfBobinaCheck{display:flex;gap:8px;align-items:center;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:10px 12px;color:#cbd5e1;font-size:13px;font-weight:800}',
      '.dfBobinaCheck input{width:auto;transform:scale(1.15)}',
      '.dfBobinaMini{font-size:12px!important;padding:10px 8px!important;margin-top:8px!important}',
      '.dfBobinaResults{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
      '.dfBobinaResults .kpi{margin-top:0}',
      '.dfCalBox{margin-top:14px;padding:14px;border:1px solid #334155;border-radius:16px;background:#0b1220}',
      '.dfCalBox h3{margin:0 0 8px;font-size:16px;color:#facc15}',
      '@media(max-width:560px){.dfBobinaResults{grid-template-columns:1fr}.dfBobinaTop{align-items:stretch}.dfBobinaCheck{width:100%}}'
    ].join('');
    document.head.appendChild(st);
  }

  function cardHtml(){return `<div class="card dfBobinaCard" id="dfBobinaCard">
    <div class="dfBobinaTop"><div><span class="tag">Bobina</span><h2>Peso da bobina pelo raio</h2></div><label class="dfBobinaCheck"><input id="bobAuto" type="checkbox" checked> Puxar largura, micra e densidade da Extrusão</label></div>
    <div class="hint">Cálculo geométrico pelo anel da bobina: usa o <b>raio do tubete ao quadrado</b> e o <b>raio externo ao quadrado</b>. Você pode informar a altura de plástico enrolado ou o peso desejado.</div>
    <button id="bobPull" class="calcBtn alt dfBobinaMini" type="button">PUXAR DADOS DA EXTRUSÃO AGORA</button>
    <div class="grid">
      <div><label>Largura física da bobina / boca fechada (cm)</label><input id="bobL" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Micra parede dupla (µm)</label><input id="bobM" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Densidade</label><input id="bobD" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Fator de compactação / calibração (%)</label><input id="bobK" inputmode="decimal" value="100" placeholder="100 = geometria pura"></div>
      <div><label>Tipo da bobina</label><select id="bobTipo"><option value="normal">Normal</option><option value="sanfonada">Sanfonada</option></select></div>
    </div>
    <div class="smallNote"><b>Regra sanfonada:</b> no cálculo físico do raio/peso usa metade da largura informada (ex.: 80 cm → 40 cm). Não precisa informar a sanfona de cada lado. O peso por metro usa a largura informada do filme. O padrão matemático é 100%; para compensar ar/pressão do enrolamento, calibre pela balança.</div>
    <div class="grid">
      <div><label>Altura de plástico enrolado (cm)</label><input id="bobRe" class="main" inputmode="decimal" placeholder="Do lado de fora do tubete até a borda"></div>
      <div><label>Diâmetro do tubete / núcleo (cm)</label><input id="bobRi" class="main" inputmode="decimal" value="7,6" placeholder="Ex.: 7,6 ou 10"></div>
      <div><label>Peso do tubete (kg)</label><input id="bobCore" inputmode="decimal" placeholder="Opcional"></div>
      <div><label>Peso desejado da bobina (kg)</label><input id="bobTarget" class="main" inputmode="decimal" placeholder="Para calcular a altura"></div>
    </div>
    <label class="dfBobinaCheck" style="margin-top:10px"><input id="bobTargetTotal" type="checkbox" checked> O peso desejado inclui o tubete</label>
    <div id="bobMsg" class="status warn">Preencha a altura enrolada da bobina ou o peso desejado.</div>
    <div class="result"><span>ALTURA → PESO DA BOBINA</span><b id="bobPesoTotal">—</b></div>
    <div class="dfBobinaResults">
      <div class="kpi"><span>Tipo usado</span><b id="bobTipoUsado">—</b></div>
      <div class="kpi"><span>Largura informada</span><b id="bobLargFis">—</b></div>
      <div class="kpi"><span>Largura usada no raio</span><b id="bobLargRaio">—</b></div>
      <div class="kpi"><span>Largura usada no peso por metro</span><b id="bobLargEquiv">—</b></div>
      <div class="kpi"><span>Fator aplicado</span><b id="bobFatorRaio">—</b></div>
      <div class="kpi"><span>Peso do plástico</span><b id="bobPesoPlastico">—</b></div>
      <div class="kpi"><span>Metros aproximados</span><b id="bobMetros">—</b></div>
      <div class="kpi"><span>Diâmetro externo</span><b id="bobDiametro">—</b></div>
      <div class="kpi"><span>Peso por metro</span><b id="bobGm">—</b></div>
    </div>
    <div class="result"><span>PESO → ALTURA ENROLADA NECESSÁRIA</span><b id="bobRaioNec">—</b></div>
    <div class="dfBobinaResults">
      <div class="kpi"><span>Diâmetro externo necessário</span><b id="bobDiamNec">—</b></div>
      <div class="kpi"><span>Metros nesse peso</span><b id="bobMetrosPeso">—</b></div>
      <div class="kpi"><span>Peso plástico usado</span><b id="bobPesoUsado">—</b></div>
      <div class="kpi"><span>Tubete somado</span><b id="bobTubeteUsado">—</b></div>
    </div>
    <div class="dfCalBox">
      <h3>Calibrar bobina pela balança</h3>
      <div class="hint">Para máxima precisão na sua máquina, use uma bobina real. Informe o peso da balança e a altura enrolada medida. O sistema calcula o fator de compactação real do seu enrolamento.</div>
      <div class="grid"><div><label>Peso real na balança (kg)</label><input id="bobCalPeso" inputmode="decimal" placeholder="Ex.: 100"></div><div><label>O peso da balança inclui tubete?</label><select id="bobCalTipo"><option value="total">Sim, inclui tubete</option><option value="plastico">Não, só plástico</option></select></div></div>
      <button id="bobCalBtn" class="calcBtn alt dfBobinaMini" type="button">CALIBRAR FATOR PELA BALANÇA</button>
      <div class="smallNote" id="bobCalRes">Para calibrar, preencha também altura enrolada, diâmetro do tubete, largura, densidade e tipo da bobina.</div>
    </div>
  </div>`}

  function val(id){return pn($(id)?.value)}
  function densEx(){const s=$('exDs');if(!s)return 0;return s.value==='manual'?val('exDm'):pn(s.value)}
  function schedule(){clearTimeout(timer);timer=setTimeout(calc,120)}
  function sync(force){const a=$('bobAuto');if(!force&&a&&!a.checked)return;const l=val('exL'),m=val('exM'),d=densEx();if(l>0&&$('bobL'))$('bobL').value=fmtInp(l);if(m>0&&$('bobM'))$('bobM').value=fmtInp(m);if(d>0&&$('bobD'))$('bobD').value=fmtInp(d,3);schedule()}
  function updateTipo(){schedule()}
  function limpar(){['bobPesoTotal','bobPesoPlastico','bobMetros','bobDiametro','bobGm','bobRaioNec','bobDiamNec','bobMetrosPeso','bobPesoUsado','bobTubeteUsado','bobTipoUsado','bobLargFis','bobLargRaio','bobLargEquiv','bobFatorRaio'].forEach(id=>set(id,'—'))}

  function medidas(){
    const tipo=$('bobTipo')?.value||'normal';
    const fisica=val('bobL');
    const equivalente=fisica;
    const larguraRaio=tipo==='sanfonada'?fisica/2:fisica;
    const diametroTubete=val('bobRi');
    const raioNucleo=diametroTubete/2;
    const altura=val('bobRe');
    const raioExterno=altura>0&&raioNucleo>0?raioNucleo+altura:0;
    const fatorBase=val('bobK')/100;
    const fatorRaio=fatorBase;
    return {tipo,fisica,equivalente,larguraRaio,diametroTubete,raioNucleo,altura,raioExterno,fatorBase,fatorRaio};
  }

  function resultadoBase(){
    const w=medidas(), micra=val('bobM'), dens=val('bobD');
    const pesoMetroG=(w.equivalente*micra*dens)/100;
    return {w,micra,dens,pesoMetroG,core:val('bobCore'),target:val('bobTarget'),incluiTubete:!!$('bobTargetTotal')?.checked};
  }

  function validar(b){
    if(!(b.w.fisica>0&&b.w.larguraRaio>0&&b.w.equivalente>0&&b.micra>0&&b.dens>0&&b.w.fatorBase>0&&b.w.raioNucleo>0)){
      setMsg('Confira largura, micra, densidade, diâmetro do tubete e fator de compactação.','bad');
      return false;
    }
    return true;
  }

  function preencherFixos(b){
    set('bobTipoUsado',b.w.tipo==='sanfonada'?'Sanfonada — metade da largura no raio':'Normal');
    set('bobLargFis',fmt(b.w.fisica,2)+' cm');
    set('bobLargRaio',fmt(b.w.larguraRaio,2)+' cm');
    set('bobLargEquiv',fmt(b.w.equivalente,2)+' cm');
    set('bobFatorRaio',fmt(b.w.fatorRaio*100,1)+'%');
    set('bobGm',fmt(b.pesoMetroG,2)+' g/m');
  }

  function calc(){
    limpar();
    const b=resultadoBase();
    if(!validar(b))return;
    preencherFixos(b);
    let ok=false;

    if(b.w.altura>0){
      if(!(b.w.raioExterno>b.w.raioNucleo)){setMsg('A altura enrolada precisa ser maior que zero.','bad')}
      else{
        const areaAnel=PI*((b.w.raioExterno*b.w.raioExterno)-(b.w.raioNucleo*b.w.raioNucleo));
        const volumePlastico=areaAnel*b.w.larguraRaio*b.w.fatorRaio;
        const kgPlastico=(volumePlastico*b.dens)/1000;
        const metros=b.pesoMetroG>0?(kgPlastico*1000)/b.pesoMetroG:0;
        const kgTotal=kgPlastico+b.core;
        set('bobPesoTotal',fmt(kgTotal,3)+' kg total');
        set('bobPesoPlastico',fmt(kgPlastico,3)+' kg');
        set('bobMetros',fmt(metros,1)+' m');
        set('bobDiametro',fmt(b.w.raioExterno*2,2)+' cm');
        ok=true;
      }
    }

    if(b.target>0){
      const kgPlasticoDesejado=b.incluiTubete?b.target-b.core:b.target;
      if(kgPlasticoDesejado<=0){set('bobRaioNec','Peso menor que o tubete')}
      else{
        const raioExternoNec=Math.sqrt(
          (b.w.raioNucleo*b.w.raioNucleo)+
          (kgPlasticoDesejado*1000)/(PI*b.w.larguraRaio*b.dens*b.w.fatorRaio)
        );
        const alturaNec=Math.max(0,raioExternoNec-b.w.raioNucleo);
        const metrosPeso=b.pesoMetroG>0?(kgPlasticoDesejado*1000)/b.pesoMetroG:0;
        set('bobRaioNec',fmt(alturaNec,2)+' cm');
        set('bobDiamNec',fmt(raioExternoNec*2,2)+' cm');
        set('bobMetrosPeso',fmt(metrosPeso,1)+' m');
        set('bobPesoUsado',fmt(kgPlasticoDesejado,3)+' kg');
        set('bobTubeteUsado',fmt(b.incluiTubete?b.core:0,3)+' kg');
        ok=true;
      }
    }

    if(ok){
      const extra=b.w.tipo==='sanfonada'?' Na sanfonada foi usada metade da largura no cálculo do raio, conforme sua regra de produção.':'';
      setMsg('Cálculo pelo anel da bobina pronto. O tubete entra pelo raio ao quadrado e a altura informada é somente a camada de plástico.'+extra,'ok');
    }else setMsg('Preencha a altura enrolada para saber o peso ou digite o peso desejado para saber a altura.','warn');
  }

  function calibrar(){
    const b=resultadoBase(), box=$('bobCalRes');
    const pesoReal=val('bobCalPeso'), inclui=($('bobCalTipo')?.value||'total')==='total';
    const r=txt=>{if(box)box.textContent=txt};
    if(!validar(b)||!(b.w.altura>0&&b.w.raioExterno>b.w.raioNucleo&&pesoReal>0)){
      r('Confira peso real, altura enrolada, diâmetro do tubete, largura, densidade e tipo da bobina.');
      setMsg('Não consegui calibrar. Falta algum dado da bobina real.','bad');
      return;
    }
    const kgPlastico=inclui?pesoReal-b.core:pesoReal;
    if(!(kgPlastico>0)){r('Peso plástico ficou menor ou igual a zero. Confira o peso do tubete.');return}
    const areaAnel=PI*((b.w.raioExterno*b.w.raioExterno)-(b.w.raioNucleo*b.w.raioNucleo));
    const fatorEfetivo=(kgPlastico*1000)/(areaAnel*b.w.larguraRaio*b.dens);
    if(!(fatorEfetivo>0&&Number.isFinite(fatorEfetivo))){r('Não consegui calcular o fator. Confira as medidas.');return}
    if($('bobK'))$('bobK').value=fmtInp(fatorEfetivo*100,1);
    r('Fator calibrado: '+fmt(fatorEfetivo*100,1)+'%. Agora o cálculo de raio/peso fica ajustado à bobina real medida na balança.');
    setMsg('Calibração feita pela balança. O fator foi ajustado para o seu enrolamento real.','ok');
    schedule();
  }

  function bind(){
    const pull=$('bobPull'),auto=$('bobAuto'),tipo=$('bobTipo'),cal=$('bobCalBtn');
    if(pull&&!pull.dfBound){pull.dfBound=true;pull.addEventListener('click',()=>{if(auto)auto.checked=true;sync(true)})}
    if(auto&&!auto.dfBound){auto.dfBound=true;auto.addEventListener('change',()=>sync(false))}
    if(tipo&&!tipo.dfBound){tipo.dfBound=true;tipo.addEventListener('change',updateTipo)}
    if(cal&&!cal.dfBound){cal.dfBound=true;cal.addEventListener('click',calibrar)}
    if(!window.dfBobinaMigratedV5){window.dfBobinaMigratedV5=true;const e=$('bobRi');if(e&&String(e.value).replace(',','.')==='3.8')e.value='7,6'}
    ['bobL','bobM','bobD'].forEach(id=>{const e=$(id);if(e&&!e.dfBound){e.dfBound=true;e.addEventListener('input',()=>{if(auto)auto.checked=false;schedule()})}});
    ['bobK','bobRe','bobRi','bobCore','bobTarget','bobTargetTotal'].forEach(id=>{const e=$(id);if(e&&!e.dfBound){e.dfBound=true;e.addEventListener('input',schedule);e.addEventListener('change',schedule)}});
    ['exL','exM','exDm','exDs'].forEach(id=>{const e=$(id);if(e&&!e.dfBobBound){e.dfBobBound=true;e.addEventListener('input',()=>sync(false));e.addEventListener('change',()=>sync(false))}});
    updateTipo();sync(false);
  }

  function add(){addStyle();const pg=$('pgEx');if(!pg||$('dfBobinaCard'))return;const contact=$('dfContact_pgEx');if(contact)contact.insertAdjacentHTML('beforebegin',cardHtml());else pg.insertAdjacentHTML('beforeend',cardHtml());bind()}
  function init(){add();setTimeout(()=>{add();bind()},300);setTimeout(()=>{add();bind()},900)}
  window.dfBobinaCalc=calc;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ---- bobina-factor-profiles.js ---- */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY_LISA='df_bobina_fator_lisa_v1';
  const KEY_SANF='df_bobina_fator_sanfonada_v1';
  let currentType='';
  let mounted=false;

  function num(v){
    const n=parseFloat(String(v||'').trim().replace(',','.').replace(/[^0-9.\-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function fmt(v){return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2})}
  function tipo(){return $('bobTipo')?.value==='sanfonada'?'sanfonada':'lisa'}
  function key(t){return t==='sanfonada'?KEY_SANF:KEY_LISA}
  function ler(t){
    try{const v=num(localStorage.getItem(key(t)));if(v>0)return v}catch(e){}
    return 100;
  }
  function salvar(t,v){
    if(!(v>0))return;
    try{localStorage.setItem(key(t),String(v))}catch(e){}
  }
  function migrar(){
    const k=$('bobK');
    if(!k)return;
    try{
      if(!localStorage.getItem(KEY_LISA))salvar('lisa',num(k.value)||100);
      if(!localStorage.getItem(KEY_SANF))salvar('sanfonada',100);
    }catch(e){}
  }
  function nota(){
    let n=$('dfBobinaPerfis');
    if(!n){
      const k=$('bobK');
      if(!k)return null;
      n=document.createElement('div');
      n.id='dfBobinaPerfis';
      n.className='smallNote';
      n.style.marginTop='7px';
      k.insertAdjacentElement('afterend',n);
    }
    return n;
  }
  function atualizarTela(){
    const t=tipo(),k=$('bobK');
    if(!k)return;
    const lab=k.parentElement?.querySelector('label');
    if(lab)lab.textContent=t==='sanfonada'?'Fator calibrado — SANFONADA (%)':'Fator calibrado — LISA (%)';
    const n=nota();
    if(n)n.textContent='Salvo neste aparelho: Lisa '+fmt(ler('lisa'))+'% • Sanfonada '+fmt(ler('sanfonada'))+'%. Ao trocar o tipo, o app usa o fator correspondente automaticamente.';
  }
  function aplicarTipo(novo){
    const k=$('bobK');if(!k)return;
    if(currentType&&currentType!==novo)salvar(currentType,num(k.value));
    currentType=novo;
    k.value=fmt(ler(novo));
    atualizarTela();
    k.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function mount(){
    const k=$('bobK'),sel=$('bobTipo');
    if(!k||!sel)return;
    migrar();
    if(!mounted){
      mounted=true;
      currentType=tipo();
      k.value=fmt(ler(currentType));

      sel.addEventListener('change',()=>aplicarTipo(tipo()));
      const guardar=()=>{const t=tipo();currentType=t;salvar(t,num(k.value));atualizarTela()};
      k.addEventListener('input',guardar);
      k.addEventListener('change',guardar);

      document.addEventListener('click',e=>{
        if(e.target?.closest?.('#bobCalBtn')){
          const t=tipo();
          setTimeout(()=>{
            const v=num($('bobK')?.value);
            if(v>0){salvar(t,v);currentType=t;atualizarTela()}
          },30);
        }
      },true);
    }
    atualizarTela();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250),{once:true});else setTimeout(mount,250);
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,350));
  const mo=new MutationObserver(()=>{if(!mounted||!$('dfBobinaPerfis'))requestAnimationFrame(mount)});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(mount,700);
  setTimeout(mount,1400);
})();


/* ---- contact-extra.js ---- */
(function(){
  'use strict';

  function removeSupportCards(){
    document.querySelectorAll('.dfContactCard,[id^="dfContact_"]').forEach(function(el){
      try{el.remove()}catch(e){}
    });
    const style=document.getElementById('dfContactStyle');
    if(style){try{style.remove()}catch(e){}}
  }

  function init(){
    removeSupportCards();
    setTimeout(removeSupportCards,100);
    setTimeout(removeSupportCards,500);
    setTimeout(removeSupportCards,1200);

    try{
      const observer=new MutationObserver(function(){removeSupportCards()});
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();


/* ---- update-notify-policy.js ---- */
(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VERSION_URL='./app-version.json';
  const LAST_VERSION='df_last_version_seen_v1';
  const LAST_NOTIFY='df_last_version_notified_v1';
  let syncing=false;

  function patchServiceWorkerRegister(){
    try{
      if(!('serviceWorker' in navigator)||navigator.serviceWorker.dfPolicyPatched)return;
      const original=navigator.serviceWorker.register.bind(navigator.serviceWorker);
      navigator.serviceWorker.register=function(scriptURL,options){
        try{
          const u=new URL(scriptURL,location.href);
          if(u.pathname.endsWith('/sw.js'))scriptURL=u.pathname.replace(/sw\.js$/,'sw-policy.js')+u.search;
        }catch(e){}
        return original(scriptURL,options);
      };
      navigator.serviceWorker.dfPolicyPatched=true;
    }catch(e){}
  }

  async function currentVersion(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return'';
      const j=await r.json();
      return String(j&&j.version||'').trim();
    }catch(e){return''}
  }

  async function shouldNotify(version){
    try{
      const u=new URL(API+'/update/notification-policy');
      u.searchParams.set('version',String(version||''));
      u.searchParams.set('t',Date.now());
      const r=await fetch(u.toString(),{cache:'no-store'});
      if(!r.ok)return true;
      const j=await r.json();
      return j&&j.notify===true;
    }catch(e){return true}
  }

  async function syncPolicy(){
    if(syncing||document.hidden)return;
    syncing=true;
    try{
      const version=await currentVersion();
      if(!version)return;
      const notify=await shouldNotify(version);
      if(notify)return;
      try{
        localStorage.setItem(LAST_VERSION,version);
        localStorage.setItem(LAST_NOTIFY,version);
      }catch(e){}
      try{
        const reg=await navigator.serviceWorker.ready;
        const target=reg.active||reg.waiting||reg.installing;
        if(target)target.postMessage({type:'DF_SET_VERSION',version});
      }catch(e){}
    }finally{syncing=false}
  }

  patchServiceWorkerRegister();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncPolicy,{once:true});
  else syncPolicy();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPolicy()});
})();

/* ---- pwa-update.js ---- */
(function(){
  'use strict';
  const BASE=location.pathname.includes('/secure-frontend/')?'../':'./';
  const VERSION_URL=BASE+'app-version.json';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const VAPID_PUBLIC_KEY='BCeh5o1hAKV598vbnKqDfoIMcsGZaxKmfW8fVmR3FdGoAOOUWeBoeikXc_s07eb47M-6Kwl991u4w0MFuv4-rGU';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LAST_VERSION='df_last_version_seen_v1';
  const LAST_NOTIFY='df_last_version_notified_v1';
  let reg=null;

  function ensureManifest(){
    if(document.querySelector('link[rel="manifest"]'))return;
    const link=document.createElement('link');
    link.rel='manifest';link.href=BASE+'manifest.webmanifest';document.head.appendChild(link);
  }

  function ensureAppleIcon(){
    if(document.querySelector('link[rel="apple-touch-icon"]'))return;
    const link=document.createElement('link');
    link.rel='apple-touch-icon';link.href=BASE+'logo.jpg.jpeg';document.head.appendChild(link);
  }

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}

  function b64ToBytes(s){
    let b64=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
    while(b64.length%4)b64+='=';
    const raw=atob(b64);
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  }

  function sameBytes(a,b){
    if(!a||!b||a.byteLength!==b.byteLength)return false;
    const aa=new Uint8Array(a),bb=new Uint8Array(b);
    for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])return false;
    return true;
  }

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true ||
      navigator.standalone===true;
  }

  async function registerSW(){
    if(!('serviceWorker' in navigator))return null;
    try{
      reg=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE});
      await navigator.serviceWorker.ready;
      return reg;
    }catch(e){console.warn('DF SW:',e);return null;}
  }

  async function apiPost(path,body){
    const headers={'Content-Type':'application/json','X-DF-Device':deviceId()};
    const t=token();if(t)headers.Authorization='Bearer '+t;
    const r=await fetch(API+path,{method:'POST',headers,body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json();}catch(e){}
    if(!r.ok||j.ok===false){
      const err=new Error(j.error||('Erro HTTP '+r.status));err.status=r.status;throw err;
    }
    return j;
  }

  async function currentVersionData(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      return r.ok?await r.json():null;
    }catch(e){return null;}
  }

  async function syncVersionToSW(){
    try{
      const data=await currentVersionData();if(!data||!data.version)return;
      const r=reg||await navigator.serviceWorker.ready;
      const target=r.active||r.waiting||r.installing;
      if(target)target.postMessage({type:'DF_SET_VERSION',version:String(data.version)});
    }catch(e){}
  }

  async function clearBadge(){
    try{
      if('clearAppBadge' in navigator)await navigator.clearAppBadge();
      const r=reg||await navigator.serviceWorker.ready;
      const target=r.active||r.waiting||r.installing;
      if(target)target.postMessage({type:'DF_CLEAR_BADGE'});
    }catch(e){}
  }

  async function ensurePushSubscription(testAfter=false){
    if(!('PushManager' in window))throw new Error('Este navegador não oferece Web Push.');
    const r=reg||await registerSW()||await navigator.serviceWorker.ready;
    const wanted=b64ToBytes(VAPID_PUBLIC_KEY);
    let sub=await r.pushManager.getSubscription();

    if(sub){
      const current=sub.options&&sub.options.applicationServerKey;
      if(current&&!sameBytes(current,wanted)){
        try{await sub.unsubscribe();}catch(e){}
        sub=null;
      }
    }

    if(!sub){
      sub=await r.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:wanted
      });
    }

    const t=token();
    if(!t)throw new Error('Entre com sua licença antes de ativar as atualizações.');

    await apiPost('/push/subscribe',{subscription:sub.toJSON()});
    if(testAfter)await apiPost('/push/test',{subscription:sub.toJSON()});
    return sub;
  }

  async function enablePeriodicCheck(){
    try{
      const r=reg||await navigator.serviceWorker.ready;
      if(r&&'periodicSync' in r)await r.periodicSync.register('df-version-check',{minInterval:60*60*1000});
    }catch(e){console.warn('DF periodic sync:',e);}
  }

  async function showDeviceNotification(title,body){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    try{
      const r=reg||await navigator.serviceWorker.ready;
      if(r&&r.showNotification){
        await r.showNotification(title,{
          body,icon:BASE+'logo.svg',badge:BASE+'logo.svg',
          tag:'df-extrusor-update',renotify:true,data:{url:location.origin+'/'}
        });
      }
    }catch(e){console.warn(e);}
  }

  function removeBanner(){
    const el=document.getElementById('dfUpdateBanner');if(el)el.remove();
  }

  function showBanner(data){
    if(document.getElementById('dfUpdateBanner'))return;
    const box=document.createElement('div');box.id='dfUpdateBanner';
    box.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:99999;width:min(92vw,520px);background:#111827;color:#f8fafc;border:1px solid #f59e0b;border-radius:16px;padding:14px;box-shadow:0 18px 45px rgba(0,0,0,.45);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial';
    box.innerHTML='<div style="font-weight:900;color:#facc15;margin-bottom:4px">'+String(data.title||'DF EXTRUSOR PRO atualizado')+'</div><div style="font-size:13px;line-height:1.4;margin-bottom:10px">'+String(data.message||'Uma nova versão está disponível.')+'</div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="dfUpdateLater" style="border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer">DEPOIS</button><button id="dfUpdateNow" style="border:0;background:#f59e0b;color:#111827;border-radius:10px;padding:8px 11px;font-weight:900;cursor:pointer">ATUALIZAR AGORA</button></div>';
    document.body.appendChild(box);
    document.getElementById('dfUpdateLater').onclick=removeBanner;
    document.getElementById('dfUpdateNow').onclick=async()=>{
      try{localStorage.setItem(LAST_VERSION,String(data.version||''));}catch(e){}
      await clearBadge();
      try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}}catch(e){}
      const u=new URL(location.href);u.searchParams.set('v',String(data.version||Date.now()));u.searchParams.set('t',Date.now());location.replace(u.toString());
    };
  }

  async function checkVersion(){
    try{
      const data=await currentVersionData();if(!data)return;
      const current=String(data.version||'').trim();if(!current)return;
      const seen=localStorage.getItem(LAST_VERSION);
      if(!seen){localStorage.setItem(LAST_VERSION,current);await syncVersionToSW();return;}
      if(seen===current)return;
      showBanner(data);
      const notified=localStorage.getItem(LAST_NOTIFY);
      if(notified!==current){
        await showDeviceNotification(data.title||'DF EXTRUSOR PRO atualizado',data.message||'Nova versão disponível.');
        try{localStorage.setItem(LAST_NOTIFY,current);}catch(e){}
      }
    }catch(e){console.warn('DF version:',e);}
  }

  async function enableNotifications(){
    if(isIos()&&!isStandalone()){
      alert('No iPhone, primeiro adicione o DF EXTRUSOR à Tela de Início. Depois abra pelo ícone e toque novamente em ATIVAR ATUALIZAÇÕES.');
      return false;
    }
    if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)){
      alert('Este navegador não oferece Web Push.');return false;
    }
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      alert('Notificações não foram permitidas. Você pode liberar depois nas configurações do aparelho.');return false;
    }
    try{
      await registerSW();
      await ensurePushSubscription(true);
      await syncVersionToSW();
      await enablePeriodicCheck();
      await clearBadge();
      window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted',push:true}}));
      return true;
    }catch(e){
      console.warn('DF push:',e);
      alert('A permissão foi liberada, mas o Web Push ainda não terminou de ativar: '+String(e&&e.message||e));
      window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted',push:false}}));
      return false;
    }
  }

  async function pushStatus(){
    try{
      if(!('Notification' in window))return 'unsupported';
      if(Notification.permission!=='granted')return Notification.permission;
      const r=reg||await registerSW()||await navigator.serviceWorker.ready;
      const sub=await r.pushManager.getSubscription();
      return sub?'push':'granted';
    }catch(e){return 'granted';}
  }

  window.dfEnableNotifications=enableNotifications;
  window.dfNotificationPermission=()=>('Notification' in window?Notification.permission:'unsupported');
  window.dfPushStatus=pushStatus;
  window.dfCheckForUpdate=checkVersion;
  window.dfClearAppBadge=clearBadge;

  async function init(){
    ensureManifest();ensureAppleIcon();await registerSW();await clearBadge();

    if('Notification' in window&&Notification.permission==='granted'){
      await syncVersionToSW();await enablePeriodicCheck();
      try{
        const r=reg||await navigator.serviceWorker.ready;
        const sub=await r.pushManager.getSubscription();
        if(sub&&token())await ensurePushSubscription(false);
      }catch(e){console.warn('DF push sync:',e);}
    }

    setTimeout(checkVersion,1200);
    setInterval(checkVersion,15*60*1000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){clearBadge();checkVersion();}});
    window.addEventListener('focus',clearBadge);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* ---- install-app.js ---- */
(function(){
  'use strict';

  const TOKEN_KEY='df_secure_token_v2';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DISMISS_KEY='df_install_dismiss_until_v1';
  let deferredPrompt=null;
  let showing=false;
  let promptedThisSession=false;

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isAndroid(){return /Android/i.test(navigator.userAgent)}

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }

  function hasAccess(){
    return !!String(sessionStorage.getItem(TOKEN_KEY)||'').trim() || !!String(localStorage.getItem(ACCESS_KEY)||'').trim();
  }

  function appUnlocked(){
    const gate=document.getElementById('licenseGate');
    const app=document.getElementById('appContent');
    if(app){
      const s=getComputedStyle(app);
      if(s.display==='none' || s.visibility==='hidden')return false;
    }
    if(gate){
      const s=getComputedStyle(gate);
      if(s.display!=='none' && s.visibility!=='hidden')return false;
    }
    return hasAccess();
  }

  function dismissed(){
    const until=Number(localStorage.getItem(DISMISS_KEY)||0);
    return Number.isFinite(until) && Date.now()<until;
  }

  function dismissForDay(){
    try{localStorage.setItem(DISMISS_KEY,String(Date.now()+24*60*60*1000))}catch(e){}
    close();
  }

  function ensureHead(){
    if(!document.querySelector('link[rel="manifest"]')){
      const l=document.createElement('link');l.rel='manifest';l.href='./manifest.webmanifest';document.head.appendChild(l);
    }
    if(!document.querySelector('link[rel="apple-touch-icon"]')){
      const l=document.createElement('link');l.rel='apple-touch-icon';l.href='./logo.jpg.jpeg';document.head.appendChild(l);
    }
    const metas=[
      ['apple-mobile-web-app-capable','yes'],
      ['apple-mobile-web-app-status-bar-style','black-translucent'],
      ['apple-mobile-web-app-title','DF EXTRUSOR']
    ];
    metas.forEach(([name,content])=>{
      if(document.querySelector('meta[name="'+name+'"]'))return;
      const m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m);
    });
  }

  function close(){
    const el=document.getElementById('dfInstallOverlay');if(el)el.remove();
    showing=false;
  }

  function commonShell(title,body,buttonText){
    const overlay=document.createElement('div');
    overlay.id='dfInstallOverlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(3,7,18,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial';
    overlay.innerHTML='<div style="width:min(94vw,520px);background:#0f172a;border:1px solid #334155;border-radius:20px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.5);color:#f8fafc">'+
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><img src="./logo.jpg.jpeg" alt="DF" style="width:54px;height:54px;border-radius:14px;object-fit:cover;background:#111827"><div><div style="font-size:18px;font-weight:950">'+title+'</div><div style="font-size:12px;color:#94a3b8;margin-top:2px">DF EXTRUSOR PRO</div></div></div>'+
      '<div style="font-size:14px;line-height:1.5;color:#dbeafe;margin-bottom:14px">'+body+'</div>'+
      '<button id="dfInstallNow" style="width:100%;border:1px solid #16a34a;background:#064e2a;color:#bbf7d0;border-radius:12px;padding:13px;font-weight:950;cursor:pointer">'+buttonText+'</button>'+
      '<button id="dfInstallLater" style="width:100%;border:0;background:transparent;color:#94a3b8;padding:12px 8px 4px;font-weight:800;cursor:pointer">DEPOIS</button>'+
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('dfInstallLater').onclick=dismissForDay;
    showing=true;
    return overlay;
  }

  function showIosGuide(){
    if(showing||isStandalone()||dismissed()||promptedThisSession||!appUnlocked())return;
    promptedThisSession=true;
    commonShell(
      'Adicionar à Tela de Início',
      'No iPhone/iPad, o iOS não permite instalar automaticamente. Toque no botão abaixo para ver o passo a passo: <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.',
      'VER COMO INSTALAR'
    );
    document.getElementById('dfInstallNow').onclick=()=>{
      const b=document.getElementById('dfInstallNow');
      if(b){b.disabled=true;b.textContent='COMPARTILHAR → ADICIONAR À TELA DE INÍCIO';}
      const card=b&&b.parentElement;
      if(card){
        const help=document.createElement('div');
        help.style.cssText='margin-top:12px;background:#07101f;border:1px solid #2563eb;border-radius:12px;padding:12px;color:#bfdbfe;font-size:13px;line-height:1.5;text-align:left';
        help.innerHTML='<b>1.</b> Toque no botão <b>Compartilhar</b> do Safari (quadrado com seta para cima).<br><b>2.</b> Escolha <b>Adicionar à Tela de Início</b>.<br><b>3.</b> Toque em <b>Adicionar</b>.';
        card.insertBefore(help,document.getElementById('dfInstallLater'));
      }
    };
  }

  function showInstallPrompt(){
    if(showing||isStandalone()||dismissed()||promptedThisSession||!appUnlocked())return;
    if(isIos()){showIosGuide();return}
    if(!deferredPrompt)return;
    promptedThisSession=true;
    commonShell(
      'Instalar DF EXTRUSOR',
      isAndroid()?'Instale o DF EXTRUSOR na tela inicial para abrir como aplicativo.':'Instale o DF EXTRUSOR no computador para abrir pelo ícone como aplicativo.',
      'INSTALAR DF EXTRUSOR'
    );
    document.getElementById('dfInstallNow').onclick=async()=>{
      const p=deferredPrompt;
      if(!p)return;
      const b=document.getElementById('dfInstallNow');if(b){b.disabled=true;b.textContent='ABRINDO INSTALAÇÃO...'}
      try{
        await p.prompt();
        const choice=await p.userChoice;
        deferredPrompt=null;
        if(choice&&choice.outcome==='accepted')close();
        else{if(b){b.disabled=false;b.textContent='INSTALAR DF EXTRUSOR'}}
      }catch(e){if(b){b.disabled=false;b.textContent='INSTALAR DF EXTRUSOR'}}
    };
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    setTimeout(showInstallPrompt,250);
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    try{localStorage.removeItem(DISMISS_KEY)}catch(e){}
    close();
  });

  function watchAccess(){
    if(isStandalone())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(appUnlocked()){
        if(isIos())showIosGuide();else showInstallPrompt();
      }
      if(tries>180||isStandalone())clearInterval(timer);
    },500);
  }

  function init(){
    ensureHead();
    watchAccess();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&appUnlocked()){if(isIos())showIosGuide();else showInstallPrompt()}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ---- vendedor-extra.js ---- */
(function(){
  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const KEY_PDF_AUTO='df_vendedor_pdf_auto_v1';
  const DEFAULT_NUM='5547992825006';
  const $=id=>document.getElementById(id);

  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function fmt(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'0,00'}
  function money(v){const n=Number(v)||0;return 'R$ '+fmt(n,2)}
  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function mats(){try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}}
  function mat(id){try{return window.materialById?window.materialById(id):mats().find(m=>String(m.id)===String(id))}catch(e){return null}}

  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(!d)d=DEFAULT_NUM;
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }
  function getPhone(){return normalizePhone(localStorage.getItem(KEY_NUM)||DEFAULT_NUM)}
  function autoOn(){return localStorage.getItem(KEY_AUTO)!=='0'}
  function pdfAutoOn(){return localStorage.getItem(KEY_PDF_AUTO)!=='0'}

  function addStyle(){
    if($('dfVendedorStyle'))return;
    const st=document.createElement('style');
    st.id='dfVendedorStyle';
    st.textContent=[
      '.dfVendedorCard{border-color:#14532d!important;background:linear-gradient(180deg,#101827,#07130d)!important}',
      '.dfVendedorGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dfVendedorCheck{display:flex;align-items:center;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:11px 12px;color:#cbd5e1;font-size:13px;font-weight:900;margin-top:12px}',
      '.dfVendedorCheck input{width:auto;transform:scale(1.15)}',
      '.dfVendedorMini{font-size:12px!important;padding:10px 8px!important;margin-top:10px!important}',
      '.dfVendedorPdf{border-color:#22c55e!important;background:#0c321c!important;color:#bbf7d0!important}',
      '@media(max-width:560px){.dfVendedorGrid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function saveCfg(){
    const n=$('foVendWhats'),a=$('foVendAuto'),p=$('foVendPdfAuto');
    if(n)localStorage.setItem(KEY_NUM,normalizePhone(n.value));
    if(a)localStorage.setItem(KEY_AUTO,a.checked?'1':'0');
    if(p)localStorage.setItem(KEY_PDF_AUTO,p.checked?'1':'0');
  }

  function configHtml(){
    const phone=localStorage.getItem(KEY_NUM)||DEFAULT_NUM;
    const checked=autoOn()?'checked':'';
    const pdfChecked=pdfAutoOn()?'checked':'';
    return '<div class="card dfVendedorCard" id="dfVendedorCard">'+
      '<span class="tag">Vendedor</span>'+
      '<h2>WhatsApp / PDF ao salvar</h2>'+
      '<div class="hint">Quando salvar uma formulação, o sistema pode abrir diretamente o WhatsApp cadastrado com a mensagem pronta e também gerar o PDF para anexar.</div>'+ 
      '<div class="dfVendedorGrid">'+
        '<div><label>WhatsApp do vendedor com DDD</label><input id="foVendWhats" inputmode="tel" value="'+esc(phone)+'" placeholder="Ex.: 47992825006"></div>'+
        '<div><label>Teste mensagem</label><button id="foVendTest" class="calcBtn alt dfVendedorMini" type="button">ENVIAR MSG DA ÚLTIMA</button></div>'+ 
        '<div><label>Teste PDF</label><button id="foVendPdfTest" class="calcBtn dfVendedorPdf dfVendedorMini" type="button">ENVIAR PDF DA ÚLTIMA</button></div>'+ 
      '</div>'+ 
      '<label class="dfVendedorCheck"><input id="foVendAuto" type="checkbox" '+checked+'> Abrir WhatsApp com mensagem quando salvar formulação</label>'+ 
      '<label class="dfVendedorCheck"><input id="foVendPdfAuto" type="checkbox" '+pdfChecked+'> Gerar PDF e abrir o WhatsApp cadastrado quando salvar formulação</label>'+ 
      '<div id="foVendMsg" class="smallNote">Ao clicar em ENVIAR PDF DA ÚLTIMA, o PDF é baixado e a conversa do WhatsApp cadastrado abre direto. Depois é só anexar o PDF e enviar.</div>'+ 
    '</div>';
  }

  function addConfig(){
    addStyle();
    const pg=$('pgFo');
    if(!pg||$('dfVendedorCard'))return;
    const contact=$('dfContact_pgFo');
    if(contact)contact.insertAdjacentHTML('beforebegin',configHtml());
    else pg.insertAdjacentHTML('afterbegin',configHtml());
    bindConfig();
  }

  function bindConfig(){
    const n=$('foVendWhats'),a=$('foVendAuto'),p=$('foVendPdfAuto'),t=$('foVendTest'),pdf=$('foVendPdfTest');
    if(n&&!n.dfVendBound){n.dfVendBound=true;n.addEventListener('input',saveCfg);n.addEventListener('change',saveCfg)}
    if(a&&!a.dfVendBound){a.dfVendBound=true;a.addEventListener('change',saveCfg)}
    if(p&&!p.dfVendBound){p.dfVendBound=true;p.addEventListener('change',saveCfg)}
    if(t&&!t.dfVendBound){t.dfVendBound=true;t.addEventListener('click',function(){saveCfg();const f=forms()[0];if(!f){alert('Nenhuma formulação salva ainda.');return}openWhats(f,true)})}
    if(pdf&&!pdf.dfVendBound){pdf.dfVendBound=true;pdf.addEventListener('click',function(){saveCfg();const f=forms()[0];if(!f){alert('Nenhuma formulação salva ainda.');return}sharePdf(f,true)})}
  }

  function messageFor(f){
    const total=Number(f.total)||0;
    const rows=f.rows||[];
    let linhas=[];
    linhas.push('📋 *NOVA FORMULAÇÃO SALVA*');
    linhas.push('');
    linhas.push('*Formulação:* '+(f.nome||'Formulação'));
    linhas.push('*Total:* '+fmt(total,2)+' kg');
    if(f.custo)linhas.push('*Custo total:* '+money(f.custo));
    if(f.custoKg)linhas.push('*Custo por kg:* '+money(f.custoKg));
    const op=f.op||{};
    if(op.largura||op.comprimento||op.micra||op.grama){
      linhas.push('');
      linhas.push('*Dados da extrusão:*');
      if(op.largura)linhas.push('Largura: '+fmt(op.largura,1)+' cm');
      if(op.comprimento)linhas.push('Comprimento: '+fmt(op.comprimento,1)+' cm');
      if(op.micra)linhas.push('Micra dupla: '+fmt(op.micra,2)+' µm');
      if(op.grama)linhas.push('Peso metro: '+fmt(op.grama,2)+' g/m');
    }
    linhas.push('');
    linhas.push('*Materiais:*');
    if(rows.length){
      rows.forEach(r=>{
        const m=mat(r.id)||r;
        const pct=Number(r.pct)||0;
        const kg=total*pct/100;
        const preco=Number(r.preco||m.preco)||0;
        linhas.push('- '+(m.nome||r.nome||'Material')+': '+fmt(pct,2)+'% = '+fmt(kg,3)+' kg'+(preco?' | '+money(preco)+'/kg':''));
      });
    }else{
      linhas.push('- sem materiais');
    }
    linhas.push('');
    linhas.push('Gerado pelo DF EXTRUSOR PRO');
    return linhas.join('\n');
  }

  function pdfLines(f){
    const total=Number(f.total)||0,rows=f.rows||[],op=f.op||{};
    let l=[];
    l.push('DF EXTRUSOR PRO');
    l.push('RELATORIO DE FORMULACAO');
    l.push('Gerado em: '+new Date().toLocaleString('pt-BR'));
    l.push('');
    l.push('FORMULACAO: '+(f.nome||'Formulação'));
    l.push('TOTAL: '+fmt(total,2)+' kg');
    if(f.custo)l.push('CUSTO TOTAL: '+money(f.custo));
    if(f.custoKg)l.push('CUSTO POR KG: '+money(f.custoKg));
    if(op.largura||op.comprimento||op.micra||op.grama){
      l.push('');
      l.push('DADOS DA EXTRUSAO');
      if(op.largura)l.push('Largura: '+fmt(op.largura,1)+' cm');
      if(op.comprimento)l.push('Comprimento: '+fmt(op.comprimento,1)+' cm');
      if(op.micra)l.push('Micra dupla: '+fmt(op.micra,2)+' um');
      if(op.grama)l.push('Peso metro: '+fmt(op.grama,2)+' g/m');
    }
    l.push('');
    l.push('MATERIAIS');
    if(rows.length){
      rows.forEach(r=>{
        const m=mat(r.id)||r;
        const pct=Number(r.pct)||0,kg=total*pct/100,preco=Number(r.preco||m.preco)||0;
        l.push((m.nome||r.nome||'Material')+' | '+fmt(pct,2)+'% | '+fmt(kg,3)+' kg'+(preco?' | '+money(preco)+'/kg':''));
      });
    }else l.push('Sem materiais.');
    l.push('');
    l.push('Observacao: confira os dados antes de produzir. Resultado depende de densidade, medicao e materia-prima.');
    return l;
  }

  function ascii(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ')}
  function pdfEsc(t){return ascii(t).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
  function wrap(arr,max){
    const out=[];
    arr.forEach(line=>{
      let s=ascii(line);
      if(!s){out.push('');return}
      while(s.length>max){
        let cut=s.lastIndexOf(' ',max);
        if(cut<25)cut=max;
        out.push(s.slice(0,cut));
        s=s.slice(cut).trim();
      }
      out.push(s);
    });
    return out.slice(0,46);
  }
  function safeName(f){
    const base=ascii(f&&f.nome?f.nome:'formulacao').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'formulacao';
    return 'DF-'+base+'.pdf';
  }

  function makePdfBlob(f){
    const lines=wrap(pdfLines(f),82);
    let body='BT\n/F2 18 Tf\n50 800 Td\n(DF EXTRUSOR PRO) Tj\n/F1 11 Tf\n0 -24 Td\n';
    lines.slice(1).forEach((line,i)=>{
      if(i>0)body+='0 -15 Td\n';
      body+='('+pdfEsc(line)+') Tj\n';
    });
    body+='ET\n';
    const objects=[];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    objects.push('<< /Length '+body.length+' >>\nstream\n'+body+'endstream');
    let pdf='%PDF-1.4\n';
    const offsets=[0];
    objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n'});
    const xref=pdf.length;
    pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
    for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }

  function downloadPdf(f){
    const blob=makePdfBlob(f);
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=safeName(f);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }

  async function sharePdf(f,manual){
    const msg=$('foVendMsg');
    downloadPdf(f);
    if(msg)msg.textContent='PDF gerado. Abrindo diretamente o WhatsApp cadastrado. Anexe o PDF baixado e envie.';
    openWhats(f,manual);
  }

  function openWhats(f,manual){
    const phone=getPhone();
    const url='https://wa.me/'+phone+'?text='+encodeURIComponent(messageFor(f));
    const w=window.open(url,'_blank','noopener');
    const msg=$('foVendMsg');
    if(msg)msg.textContent='WhatsApp cadastrado aberto. Anexe o PDF baixado e aperte ENVIAR.';
    if(!w)alert('O navegador bloqueou o WhatsApp. Libere pop-up e tente novamente.');
  }

  function wrapSave(){
    const original=window.salvarFormula;
    if(typeof original!=='function'||original.dfVendWrapped)return;
    function wrapped(){
      const before=forms().map(f=>String(f.id));
      const beforeSet=new Set(before);
      const ret=original.apply(this,arguments);
      try{
        saveCfg();
        const after=forms();
        const novo=after.find(f=>!beforeSet.has(String(f.id)));
        if(novo){
          if(pdfAutoOn())sharePdf(novo,false);
          if(autoOn())openWhats(novo,false);
        }
      }catch(e){}
      return ret;
    }
    wrapped.dfVendWrapped=true;
    wrapped.dfVendOriginal=original;
    window.salvarFormula=wrapped;
  }

  function init(){
    addConfig();
    wrapSave();
    setTimeout(()=>{addConfig();bindConfig();wrapSave();},400);
    setTimeout(()=>{addConfig();bindConfig();wrapSave();},1200);
    setTimeout(()=>{addConfig();bindConfig();wrapSave();},2500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('click',function(){setTimeout(()=>{addConfig();bindConfig();wrapSave();},200)},true);
})();

/* ---- system-extra.js ---- */
(function(){
  const APP_VERSION='1.0.47';
  const CACHE_TAG='20260908-boot-stable-v97';
  const BASE=location.pathname.includes('/secure-frontend/')?'../':'./';
  const VERSION_URL=BASE+'app-version.json';
  let versionTimer=0;

  function addStyle(){
    if(document.getElementById('dfSystemStyle'))return;
    const st=document.createElement('style');
    st.id='dfSystemStyle';
    st.textContent=[
      '.dfSystemBar{position:relative;z-index:20;display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(8,11,19,.94);border:1px solid #334155;border-radius:16px;padding:8px 10px;margin:-4px 0 12px;box-shadow:0 10px 26px rgba(0,0,0,.25);backdrop-filter:blur(8px)}',
      '.dfSystemVer{font:800 12px system-ui;color:#facc15;white-space:nowrap}',
      '.dfSystemActions{display:flex;gap:7px;align-items:center}',
      '.dfSystemBtn{border:0;border-radius:12px;background:#f59e0b;color:#111827;font:900 11px system-ui;padding:9px 10px;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}',
      '.dfSystemBtn.alt{background:#1e293b;color:#f8fafc;border:1px solid #475569;box-shadow:none}',
      '.dfSystemBtn.ok{background:#166534;color:#fff;border:1px solid #22c55e;box-shadow:none}',
      '.dfSystemBtn:active{transform:translateY(1px)}',
      '@media(max-width:560px){.dfSystemBar{margin:0 0 10px;padding:8px;align-items:flex-start}.dfSystemVer{font-size:11px;padding-top:8px}.dfSystemActions{flex-direction:column;align-items:stretch}.dfSystemBtn{font-size:10px;padding:8px 8px}}'
    ].join('');
    document.head.appendChild(st);
  }

  async function latestVersionData(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return null;
      return await r.json();
    }catch(e){return null}
  }

  function setVersionLabel(version){
    const el=document.querySelector('.dfSystemVer');
    const v=String(version||APP_VERSION).trim()||APP_VERSION;
    if(el)el.textContent='DF EXTRUSOR PRO v'+v;
  }

  async function syncVersionLabel(){
    if(document.hidden)return;
    const data=await latestVersionData();
    setVersionLabel(data&&data.version?data.version:APP_VERSION);
  }

  function clearBrowserCaches(){
    const jobs=[];
    try{if('caches' in window)jobs.push(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))))}catch(e){}
    return Promise.allSettled(jobs);
  }

  async function updateServiceWorkerNow(){
    if(!('serviceWorker' in navigator))return;
    try{
      const reg=await navigator.serviceWorker.getRegistration(BASE);
      if(reg)await reg.update();
    }catch(e){console.warn('DF SW update:',e)}
  }

  async function refreshClean(){
    const btn=document.getElementById('dfSystemRefresh');
    if(btn)btn.textContent='ATUALIZANDO...';
    await clearBrowserCaches();
    await updateServiceWorkerNow();
    const data=await latestVersionData();
    if(data&&data.version)setVersionLabel(data.version);
    const url=new URL(location.href);
    url.searchParams.set('v',String(data&&data.version||CACHE_TAG));
    url.searchParams.set('t',Date.now());
    location.replace(url.toString());
  }

  async function notifyState(){
    const btn=document.getElementById('dfSystemNotify');if(!btn)return;
    let p='unsupported';
    try{if(typeof window.dfPushStatus==='function')p=await window.dfPushStatus();else p=window.dfNotificationPermission?window.dfNotificationPermission():('Notification' in window?Notification.permission:'unsupported')}catch(e){}
    btn.style.display='';
    if(p==='push'){btn.textContent='✓ ATUALIZAÇÕES ATIVAS';btn.className='dfSystemBtn ok';btn.title='Web Push ativo neste aparelho, inclusive com o app fechado'}
    else if(p==='granted'){btn.textContent='🔔 CONCLUIR ATUALIZAÇÕES';btn.className='dfSystemBtn alt';btn.title='Permissão liberada; falta concluir a assinatura Web Push'}
    else if(p==='unsupported'){btn.style.display='none'}
    else{btn.textContent='🔔 ATIVAR ATUALIZAÇÕES';btn.className='dfSystemBtn alt';btn.title='Receber avisos quando o DF EXTRUSOR PRO for atualizado'}
  }

  async function enableNotify(){
    const btn=document.getElementById('dfSystemNotify');
    try{
      if(typeof window.dfPushStatus==='function'){
        const state=await window.dfPushStatus();
        if(state==='push'){
          if(typeof window.dfClearAppBadge==='function')await window.dfClearAppBadge();
          await notifyState();
          return;
        }
      }
      if(btn)btn.textContent='ATIVANDO...';
      if(typeof window.dfEnableNotifications==='function')await window.dfEnableNotifications();
      else alert('O sistema de atualizações ainda está carregando. Tente novamente em alguns segundos.');
    }catch(e){console.warn(e)}
    await notifyState();
  }

  function addBar(){
    addStyle();
    let bar=document.getElementById('dfSystemBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='dfSystemBar';
      bar.className='dfSystemBar';
      bar.innerHTML='<span class="dfSystemVer">DF EXTRUSOR PRO v'+APP_VERSION+'</span><div class="dfSystemActions"><button id="dfSystemNotify" class="dfSystemBtn alt" type="button">🔔 ATIVAR ATUALIZAÇÕES</button><button id="dfSystemRefresh" class="dfSystemBtn" type="button">↻ ATUALIZAR</button></div>';
      const app=document.getElementById('appContent');
      const tabs=app?app.querySelector('.tabs'):document.querySelector('.tabs');
      if(tabs&&tabs.parentNode)tabs.parentNode.insertBefore(bar,tabs);
      else if(app)app.insertBefore(bar,app.firstChild);
      else document.body.insertBefore(bar,document.body.firstChild);
    }
    const btn=document.getElementById('dfSystemRefresh');
    if(btn&&!btn.dfRefreshBound){btn.dfRefreshBound=true;btn.addEventListener('click',refreshClean)}
    const nbtn=document.getElementById('dfSystemNotify');
    if(nbtn&&!nbtn.dfNotifyBound){nbtn.dfNotifyBound=true;nbtn.addEventListener('click',enableNotify)}
    notifyState();
    syncVersionLabel();
  }

  function loadVendedor(){
    if(document.getElementById('dfVendedorScript'))return;
    const s=document.createElement('script');
    s.id='dfVendedorScript';
    s.src='./vendedor-extra.js?v=20260908-boot-stable-v97';
    document.body.appendChild(s);
  }

  function scheduleVersionSync(){
    clearInterval(versionTimer);
    versionTimer=setInterval(function(){if(!document.hidden)syncVersionLabel()},5*60*1000);
  }

  function init(){
    addBar();
    loadVendedor();
    scheduleVersionSync();
  }

  window.addEventListener('df-notify-status',notifyState);
  window.addEventListener('df-ui-ready',addBar);
  document.addEventListener('visibilitychange',function(){if(!document.hidden){notifyState();syncVersionLabel()}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* ---- offline-mode.js ---- */
(function(){
  'use strict';
  function style(){
    if(document.getElementById('dfOfflineStyle'))return;
    const s=document.createElement('style');s.id='dfOfflineStyle';
    s.textContent='.dfOfflineBanner{display:none;margin:-4px 0 12px;padding:10px 12px;border:1px solid #f59e0b;border-radius:13px;background:#2a1902;color:#fde68a;font:800 12px system-ui;line-height:1.35}.dfOfflineBanner.on{display:block}.dfNetBadge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font:900 10px system-ui;border:1px solid #334155;background:#0f172a;color:#cbd5e1}.dfNetBadge.off{border-color:#f59e0b;background:#2a1902;color:#fde68a}.dfNetDot{width:7px;height:7px;border-radius:50%;background:#22c55e}.dfNetBadge.off .dfNetDot{background:#f59e0b}';
    document.head.appendChild(s);
  }
  function ensure(){
    style();
    try{if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{const t=r.active||r.waiting||r.installing;if(t)t.postMessage({type:'DF_CACHE_NOW'})}).catch(()=>{})}catch(e){}
    let b=document.getElementById('dfOfflineBanner');
    if(!b){b=document.createElement('div');b.id='dfOfflineBanner';b.className='dfOfflineBanner';b.innerHTML='<b>MODO OFFLINE</b> — materiais e formulações salvos continuam disponíveis. OP/PDF salvos podem ser consultados; cálculos que dependem do servidor ficam pausados até a internet voltar.';const bar=document.getElementById('dfSystemBar');if(bar&&bar.parentNode)bar.parentNode.insertBefore(b,bar.nextSibling);}
    let badge=document.getElementById('dfNetBadge');
    if(!badge){badge=document.createElement('span');badge.id='dfNetBadge';badge.className='dfNetBadge';badge.innerHTML='<span class="dfNetDot"></span><span class="dfNetTxt">ONLINE</span>';const a=document.querySelector('#dfSystemBar .dfSystemActions');if(a)a.insertBefore(badge,a.firstChild);}
    update();
  }
  function update(){
    const off=navigator.onLine===false,b=document.getElementById('dfOfflineBanner'),badge=document.getElementById('dfNetBadge');
    if(b)b.classList.toggle('on',off);
    if(badge){badge.classList.toggle('off',off);const t=badge.querySelector('.dfNetTxt');if(t)t.textContent=off?'OFFLINE':'ONLINE';}
    document.documentElement.dataset.dfOnline=off?'0':'1';
    window.dispatchEvent(new CustomEvent('df-network-state',{detail:{online:!off}}));
    if(!off&&typeof window.dfBackupSync==='function')setTimeout(()=>window.dfBackupSync(),500);
  }
  window.addEventListener('online',update);window.addEventListener('offline',update);
  window.addEventListener('df-offline-auth',()=>setTimeout(ensure,20));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(ensure,350);setTimeout(ensure,1200)});else{setTimeout(ensure,350);setTimeout(ensure,1200)}
})();


/* ---- formula-mix-kg.js ---- */
(function(){
  'use strict';

  const q=id=>document.getElementById(id);
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const mats=()=>{try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}};
  const mat=id=>{try{return window.materialById?window.materialById(id):mats().find(m=>String(m.id)===String(id))}catch(e){return null}};
  const selected=()=>{const id=q('foSavedSelect')?.value;return forms().find(f=>String(f.id)===String(id));};

  function currentRows(){
    try{if(typeof window.getFoRows==='function')return window.getFoRows().filter(r=>r.id&&Number(r.pct)>0)}catch(e){}
    return [];
  }

  function mixData(total,rows){
    let pct=0;
    const items=(rows||[]).map(r=>{
      const m=mat(r.id)||r;
      const p=Number(r.pct)||0;
      const kg=Number(total||0)*p/100;
      pct+=p;
      return{nome:m.nome||r.nome||'Material',pct:p,kg};
    });
    return{pct,items};
  }

  function addMixBox(){
    if(q('dfMixKgBox'))return;
    const total=q('foTotal');
    if(!total)return;
    const grid=total.closest('.grid')||total.parentElement;
    if(!grid||!grid.parentNode)return;

    const box=document.createElement('div');
    box.id='dfMixKgBox';
    box.className='formRow';
    box.style.marginTop='14px';
    box.innerHTML=`
      <div class="rowTitle">Calcular mistura em kg</div>
      <div class="formNote">O campo “Quantos kg quer fazer?” continua sendo a quantidade total que será produzida nessa medida. Aqui embaixo você digita separadamente o tamanho da mistura que quer preparar.</div>
      <label>Quantos kg quer preparar nesta mistura?</label>
      <input id="dfMixBatchKg" class="main" inputmode="decimal" placeholder="Ex.: 100, 250 ou 750">
      <button id="dfCalcMixKg" class="calcBtn alt" type="button">CALCULAR MISTURA</button>
      <div id="dfMixKgResult" style="margin-top:10px"></div>`;

    grid.insertAdjacentElement('afterend',box);
    q('dfCalcMixKg')?.addEventListener('click',renderMix);
    q('dfMixBatchKg')?.addEventListener('keydown',e=>{if(e.key==='Enter')renderMix()});
  }

  function renderMix(){
    const producao=pn(q('foTotal')?.value);
    const mistura=pn(q('dfMixBatchKg')?.value);
    const rows=currentRows();
    const out=q('dfMixKgResult');
    if(!out)return;

    if(!(mistura>0)){
      alert('Digite quantos kg quer preparar nesta mistura.');
      q('dfMixBatchKg')?.focus();
      return;
    }
    if(!rows.length){alert('Adicione os materiais e as porcentagens primeiro.');return;}

    const d=mixData(mistura,rows);
    window.dfMixBatchKgCurrent=mistura;

    let html='';
    if(producao>0)html+='<div class="kpi"><span>Quantidade que será produzida</span><b>'+fm(producao,2)+' kg</b></div>';
    html+='<div class="kpi"><span>Tamanho desta mistura</span><b>'+fm(mistura,2)+' kg</b></div>';
    d.items.forEach(it=>{
      html+='<div class="kpi"><span>'+esc(it.nome)+' — '+fm(it.pct,2)+'%</span><b>'+fm(it.kg,3)+' kg</b></div>';
    });

    if(Math.abs(d.pct-100)<=0.05){
      html+='<div class="status ok" style="margin-top:10px">MISTURA FECHADA EM '+fm(d.pct,2)+'% ✅</div>';
    }else{
      html+='<div class="status bad" style="margin-top:10px">ATENÇÃO: porcentagens somam '+fm(d.pct,2)+'%. Ajuste para 100%.</div>';
    }
    out.innerHTML=html;
  }

  function currentOp(){
    return{
      largura:pn(q('exL')?.value),
      comprimento:pn(q('exComp')?.value),
      micra:pn(q('exM')?.value),
      grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0
    };
  }

  function openOP(f){
    if(!f){alert('Formulação não encontrada.');return;}

    const nome=f.nome||'Formulação';
    const totalProducao=Number(f.total)||0;
    const rows=f.rows||[];
    const pctInfo=mixData(1,rows);
    if(Math.abs(pctInfo.pct-100)>0.05){
      alert('A formulação soma '+fm(pctInfo.pct,2)+'%. Ajuste para 100% antes de gerar a OP.');
      return;
    }

    const digitado=pn(q('dfMixBatchKg')?.value);
    const totalMistura=digitado>0?digitado:(Number(window.dfMixBatchKgCurrent)||totalProducao);
    const atual=currentOp(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'_____';
    const letras=['A','B','C','D','E','F','G','H'];

    let matRows='';
    for(let i=0;i<8;i++){
      const r=rows[i]||{};
      const m=r.id?(mat(r.id)||r):{};
      const desc=m.nome||r.nome||'';
      const pct=Number(r.pct)||0;
      const kg=totalMistura*pct/100;
      matRows+='<tr><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td><td class="center b mixkg">'+(pct?fm(kg,3)+' kg':'')+'</td></tr>';
    }

    let prodRows='';
    for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

    const style=`
      @page{size:A4 landscape;margin:4mm}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#dfe3e8}
      .toolbar{position:sticky;top:0;z-index:20;display:flex;gap:8px;align-items:center;padding:9px 12px;background:#111827;color:#fff;box-shadow:0 2px 10px #0003}
      .toolbar button{border:0;border-radius:7px;padding:9px 13px;font-weight:900;cursor:pointer}.back{background:#e5e7eb;color:#111827}.print{background:#111;color:#fff;border:1px solid #fff!important}.hint{font-size:13px;opacity:.9}
      .sheet{width:285mm;min-height:190mm;margin:10px auto;background:#fff;padding:3mm;box-shadow:0 6px 26px #0002;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
      .op{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4px;line-height:1.02}.op td,.op th{border:1.5px solid #111;padding:2px 3px;vertical-align:middle;height:17px}.center{text-align:center}.b{font-weight:800}
      .logo{font-size:16px;font-weight:900;letter-spacing:.3px}.title{background:#d1d5db;color:#111;text-align:center;font-weight:900}.shade{background:#f3f4f6}.shade2{background:#e5e7eb}.top td{height:21px}.big{font-size:13px}.xbig{font-size:16px}
      .mat th{background:#d1d5db;color:#111;font-weight:900}.mat td{height:19px}.mat .cMat{width:7%}.mat .cDesc{width:60%}.mat .cPct{width:12%}.mat .cKg{width:21%}.mixkg{white-space:nowrap}
      .prod th{background:#e5e7eb;font-size:8px}.prod td{height:18px}.codes td{font-size:8px;background:#f8fafc;height:15px}.sectionGap{height:2px;flex:0 0 2px}.obs{height:25px}.miniTitle{font-size:8px;color:#333;font-weight:800;text-transform:uppercase}.value{font-size:12px;font-weight:900}.stamp{float:right;border:1.5px solid #111;border-radius:5px;padding:3px 8px;font-weight:900;background:#fff}
      @media(max-width:900px){.sheet{width:285mm;transform-origin:top left;transform:scale(calc((100vw - 14px) / 1077));margin-left:7px;margin-right:0}}
      @media print{
        @page{size:A4 landscape;margin:4mm}
        html,body{margin:0!important;padding:0!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}
        .toolbar{display:none!important}
        .sheet{display:block!important;position:static!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;box-shadow:none!important;transform:none!important;overflow:visible!important;page-break-inside:avoid!important;break-inside:avoid-page!important}
        .op{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:7.6px!important;line-height:.88!important;margin:0!important;page-break-inside:avoid!important;break-inside:avoid-page!important}
        .op td,.op th{border:.32mm solid #111!important;height:3.6mm!important;min-height:0!important;padding:.22mm .45mm!important;vertical-align:middle!important;line-height:.88!important}
        .top td{height:4.4mm!important}.mat td,.mat th{height:3.4mm!important}.prod td,.prod th{height:3.25mm!important;font-size:6.5px!important}.codes td,.codes th{height:2.7mm!important;font-size:6.1px!important}.obs{height:4.6mm!important}.sectionGap{display:block!important;height:.15mm!important;min-height:0!important;flex:none!important}.logo{font-size:11px!important}.title{font-size:7.4px!important}.xbig{font-size:10px!important}.big{font-size:8.5px!important}.value{font-size:8px!important}.miniTitle{font-size:5.8px!important}.stamp{padding:.6mm 1.5mm!important;font-size:6px!important}
        .sheet,.sheet *{page-break-before:avoid!important;page-break-after:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important}
      }
    `;

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OP '+esc(nome)+'</title><style>'+style+'</style></head><body><div class="toolbar"><button class="back" onclick="window.close()">← VOLTAR PARA FORMULAÇÃO</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button><span class="hint">OP A4 deitado — produção e mistura separadas</span></div><div class="sheet">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="center b">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho)+'</span></td><td colspan="3">cód. de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Peso líquido / produção</span><br><span class="value">'+fm(totalProducao,0)+' KG</span></td><td colspan="3" class="shade"><span class="miniTitle">Mistura calculada</span><br><span class="value">'+fm(totalMistura,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div>'+
      '<table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="shade"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="shade2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="shade"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div>'+
      '<table class="op mat"><colgroup><col class="cMat"><col class="cDesc"><col class="cPct"><col class="cKg"></colgroup><tr><th>MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th>%</th><th>KG DA MISTURA</th></tr>'+matRows+'</table><div class="sectionGap"></div>'+
      '<table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02- acerto</td><td>03- M. mecânica</td><td>04- falta de energia</td><td>05- material molhado</td><td>06- teste</td></tr><tr><td>07- M. elétrica</td><td>08- limpeza da borda</td><td>09- troca de tela</td><td>10- outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div></body></html>';

    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  document.addEventListener('click',function(ev){
    const b=ev.target?.closest?.('[data-fosafe="op"]');
    if(!b)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const f=selected();
    if(!f){alert('Selecione uma formulação.');return;}
    openOP(f);
  },true);

  function mount(){addMixBox();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,120));
  const mo=new MutationObserver(()=>{if(!q('dfMixKgBox'))addMixBox();});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(mount,500);
  setTimeout(mount,1300);
})();


/* ---- op-page-maximize.js ---- */
(function(){
  'use strict';
  if(window.__dfOpPageMaximize)return;
  window.__dfOpPageMaximize=true;

  const nativeOpen=window.open.bind(window);

  function inject(win){
    try{
      if(!win||win.closed)return false;
      const d=win.document;
      if(!d)return false;
      const sheet=d.querySelector('.sheet');
      const title=String(d.title||'');
      if(!sheet||!/^OP\s/i.test(title))return false;

      let s=d.getElementById('dfOpPageMaximizeStyle');
      if(!s){
        s=d.createElement('style');
        s.id='dfOpPageMaximizeStyle';
        d.head.appendChild(s);
      }

      s.textContent=`
        @media print{
          @page{size:A4 landscape!important;margin:4mm!important}
          html,body{
            width:289mm!important;
            height:190mm!important;
            min-height:190mm!important;
            max-height:190mm!important;
            margin:0!important;
            padding:0!important;
            background:#fff!important;
            overflow:hidden!important;
            -webkit-text-size-adjust:100%!important;
            text-size-adjust:100%!important;
          }
          body{position:relative!important}
          .toolbar{display:none!important}
          .sheet{
            display:flex!important;
            flex-direction:column!important;
            justify-content:space-between!important;
            position:relative!important;
            width:289mm!important;
            height:184mm!important;
            min-height:184mm!important;
            max-height:184mm!important;
            margin:0!important;
            padding:1mm!important;
            box-shadow:none!important;
            transform:none!important;
            overflow:hidden!important;
            page-break-before:avoid!important;
            page-break-after:avoid!important;
            page-break-inside:avoid!important;
            break-before:avoid-page!important;
            break-after:avoid-page!important;
            break-inside:avoid-page!important;
          }
          .op{
            width:100%!important;
            max-width:100%!important;
            border-collapse:collapse!important;
            table-layout:fixed!important;
            margin:0!important;
            font-size:8.8px!important;
            line-height:.94!important;
            page-break-inside:avoid!important;
            break-inside:avoid-page!important;
            flex:0 0 auto!important;
          }
          .op td,.op th{
            border:.31mm solid #111!important;
            height:5.8mm!important;
            min-height:0!important;
            padding:.34mm .62mm!important;
            vertical-align:middle!important;
            line-height:.94!important;
          }
          .top td{height:6.8mm!important}
          .mat td,.mat th{height:6.2mm!important}
          .prod{margin:0!important}
          .prod td,.prod th{height:6.8mm!important;font-size:7.2px!important}
          .obs{height:8.2mm!important}
          .sectionGap{display:block!important;height:.18mm!important;min-height:0!important;flex:0 0 .18mm!important}

          /* Rodape removido: era o bloco que estava sendo jogado para a segunda pagina no Safari/iPhone. */
          .codes{display:none!important}

          .logo{font-size:13.5px!important;line-height:1!important}
          .title{font-size:8.8px!important}
          .xbig{font-size:12.3px!important;line-height:1!important}
          .big{font-size:10.4px!important;line-height:1!important}
          .value{font-size:10px!important;line-height:1!important}
          .miniTitle{font-size:6.5px!important;line-height:.94!important}
          .stamp{display:none!important}
          .sheet,.sheet *{
            page-break-before:avoid!important;
            page-break-after:avoid!important;
            page-break-inside:avoid!important;
            break-before:avoid-page!important;
            break-after:avoid-page!important;
            break-inside:avoid-page!important;
          }
          body::before,body::after,html::before,html::after,.sheet::before,.sheet::after{
            content:none!important;
            display:none!important;
          }
        }
      `;
      return true;
    }catch(e){return false;}
  }

  window.open=function(){
    const w=nativeOpen.apply(window,arguments);
    if(!w)return w;
    let n=0;
    const timer=setInterval(function(){
      n++;
      if(inject(w)||n>120||w.closed)clearInterval(timer);
    },20);
    try{
      w.addEventListener('beforeprint',function(){inject(w)});
      w.addEventListener('load',function(){inject(w)});
    }catch(e){}
    return w;
  };
})();


/* ---- op-single-safe.js ---- */
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};

  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function mats(){try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}}
  function mat(id){return mats().find(m=>String(m.id)===String(id))}
  function selected(){const id=q('foSavedSelect')?.value;return forms().find(f=>String(f.id)===String(id))}
  function currentOp(){return{largura:pn(q('exL')?.value),comprimento:pn(q('exComp')?.value),micra:pn(q('exM')?.value),grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0}}

  function openOP(f){
    if(!f){alert('Formulação não encontrada.');return;}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
    const atual=currentOp(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'_____';
    const letras=['A','B','C','D','E','F','G','H'];

    let matRows='';
    for(let i=0;i<8;i++){
      const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;
      matRows+='<tr><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';
    }

    let prodRows='';
    for(let i=0;i<8;i++){
      prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    }

    const style=`
      @page{size:A4 landscape;margin:6mm}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#dfe3e8}
      .toolbar{position:sticky;top:0;z-index:20;display:flex;gap:8px;align-items:center;padding:9px 12px;background:#111827;color:#fff;box-shadow:0 2px 10px #0003}
      .toolbar button{border:0;border-radius:7px;padding:9px 13px;font-weight:900;cursor:pointer}.back{background:#e5e7eb;color:#111827}.print{background:#111;color:#fff;border:1px solid #fff!important}.hint{font-size:13px;opacity:.9}
      .sheet{width:285mm;min-height:190mm;margin:10px auto;background:#fff;padding:3mm;box-shadow:0 6px 26px #0002;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
      .op{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4px;line-height:1.02}.op td,.op th{border:1px solid #333;padding:2px 3px;vertical-align:middle;height:17px}.center{text-align:center}.b{font-weight:800}
      .logo{font-size:16px;font-weight:900;letter-spacing:.3px}.title{background:#d1d5db;color:#111;text-align:center;font-weight:900}.shade{background:#f3f4f6}.shade2{background:#e5e7eb}.top td{height:21px}.big{font-size:13px}.xbig{font-size:16px}.mat th{background:#d1d5db;color:#111}.mat td{height:19px}.prod th{background:#e5e7eb;font-size:8px}.prod td{height:18px}.codes td{font-size:8px;background:#f8fafc;height:15px}.sectionGap{height:2px;flex:0 0 2px}.obs{height:25px}.miniTitle{font-size:8px;color:#333;font-weight:800;text-transform:uppercase}.value{font-size:12px;font-weight:900}.stamp{float:right;border:1px solid #333;border-radius:5px;padding:3px 8px;font-weight:900;background:#fff}
      @media(max-width:900px){.sheet{width:285mm;transform-origin:top left;transform:scale(calc((100vw - 14px) / 1077));margin-left:7px;margin-right:0}}
      @media print{
        @page{size:A4 landscape;margin:6mm}
        html,body{background:#fff!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:hidden!important}
        .toolbar{display:none!important}
        .sheet{position:relative!important;left:auto!important;top:auto!important;width:285mm!important;height:188mm!important;min-height:188mm!important;max-height:188mm!important;margin:0!important;padding:2mm!important;box-shadow:none!important;transform:none!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;page-break-before:avoid!important;page-break-after:avoid!important;page-break-inside:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important;break-inside:avoid-page!important}
        .op{font-size:9.1px!important;line-height:.98!important;break-inside:avoid-page!important;page-break-inside:avoid!important;flex:0 0 auto!important}
        .op td,.op th{height:4.9mm!important;padding:.55mm .8mm!important}
        .top td{height:6.1mm!important}.mat td,.mat th{height:4.9mm!important}.prod td,.prod th{height:5.05mm!important}.codes td,.codes th{height:3.8mm!important}.obs{height:6.8mm!important}.sectionGap{height:.35mm!important;flex:0 0 .35mm!important}.logo{font-size:16px!important}.xbig{font-size:16px!important}.big{font-size:13px!important}.value{font-size:12px!important}.miniTitle{font-size:7.3px!important}
        .sheet,.sheet *{page-break-before:avoid!important;page-break-after:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important}
        body::before,body::after,html::before,html::after,.sheet::before,.sheet::after{content:none!important;display:none!important}
      }`;

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OP '+esc(nome)+'</title><style>'+style+'</style></head><body><div class="toolbar"><button class="back" onclick="try{if(window.opener&&!window.opener.closed)window.opener.focus()}catch(e){};window.close()">← VOLTAR PARA FORMULAÇÃO</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button><span class="hint">OP em A4 deitado — 1 folha preenchida</span></div><div class="sheet">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="center b">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho)+'</span></td><td colspan="3">cód. de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="shade"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div>'+
      '<table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="shade"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="shade2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="shade"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div>'+
      '<table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table><div class="sectionGap"></div>'+
      '<table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table>'+ 
      '<table class="op codes"><tr><td>01- troca de TELA</td><td>02- acerto</td><td>03- M. mecânica</td><td>04- falta de energia</td><td>05- material molhado</td><td>06- teste</td></tr><tr><td>07- M. elétrica</td><td>08- limpeza da borda</td><td>09- troca de tela</td><td>10- outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div></body></html>';

    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}
    w.document.open();w.document.write(html);w.document.close();
  }

  document.addEventListener('click',function(ev){
    if(ev.target?.dataset?.fosafe!=='op')return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    openOP(f);
  },true);
})();


/* ---- formula-share-safe.js ---- */
(function(){
  'use strict';
  const BASE_KG=100;
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>'R$ '+fm(Number(v)||0,2);
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function activeRows(f){return (f?.rows||[]).filter(r=>Number(r.pct)>0);}

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=activeRows(f).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:BASE_KG,rows});}catch(e){console.error(e);return null;}
  }

  function rowsHtml(f,srv){
    const items=Array.isArray(srv?.itens)?srv.itens:[];
    let out='';
    activeRows(f).forEach((r,i)=>{
      const m=mat(r.id)||r,it=items[i]||{};
      out+='<tr>'+ 
        '<td class="material">'+esc(m.nome||r.nome||'Material')+'</td>'+ 
        '<td class="num">'+fm(r.pct||0,2)+'%</td>'+ 
        '<td class="num">'+fm(it.kg||0,3)+' kg</td>'+ 
      '</tr>';
    });
    return out||'<tr><td colspan="3">Sem materiais.</td></tr>';
  }

  function validate100(srv){
    const total=Number(srv?.totalPct)||0;
    if(Math.abs(total-100)>0.05){
      alert('Para gerar o relatório, a formulação precisa fechar em 100%. Total atual: '+fm(total,2)+'%.');
      return false;
    }
    return true;
  }

  function loading(win){
    try{
      win.document.open();
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#eee;color:#111}.box{background:#fff;border:1px solid #ccc;padding:22px 28px;font-weight:700}</style></head><body><div class="box">Gerando relatório...</div></body></html>');
      win.document.close();
    }catch(e){}
  }

  async function pdfResinas(f,targetWin){
    if(!f){alert('Nenhuma formulação salva ainda.');return false;}
    const win=targetWin&&!targetWin.closed?targetWin:window.open('about:blank','df_resinas_pdf');
    if(!win){alert('O navegador bloqueou a janela do PDF. Libere pop-up e tente novamente.');return false;}
    loading(win);

    const srv=await calcSaved(f);
    if(!srv){try{win.close()}catch(e){} alert('Não foi possível gerar o PDF.');return false;}
    if(!validate100(srv)){try{win.close()}catch(e){} return false;}

    const now=new Date();
    const data=now.toLocaleDateString('pt-BR');
    const hora=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const gerado=now.toLocaleString('pt-BR');

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Formulação - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#2d2d2d}.tools{width:186mm;margin:8px auto;display:flex;justify-content:flex-end;gap:8px}.tools button{border:1px solid #aaa;background:#fff;color:#111;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer;border-radius:4px}.tools .print{background:#111;color:#fff;border-color:#111}.sheet{width:186mm;min-height:273mm;margin:0 auto 12px;background:#fff;padding:5mm 6mm 6mm}.topline{display:flex;justify-content:space-between;gap:12px;font-size:8.5px;color:#333;margin-bottom:6mm}.header h1{font-size:24px;line-height:1.05;margin:0;font-weight:800}.header p{font-size:12px;margin:2mm 0 0}.rule{height:2px;background:#111;margin:4mm 0 6mm}.formulaRow{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:6mm}.formula{font-size:20px;font-weight:800}.base{font-size:9px;color:#555;font-weight:700}.cards{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-bottom:5mm}.card{border:1px solid #d3d3d3;border-radius:7px;padding:4mm;min-height:18mm}.card span{display:block;font-size:9px;color:#555;margin-bottom:1.5mm}.card b{display:block;font-size:17px;line-height:1.1}.tableWrap{margin-top:2mm}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #c9c9c9;padding:3.4mm 3mm;font-size:10px;text-align:left;vertical-align:middle}th{font-size:9px;font-weight:800;background:#fafafa}.material{font-weight:700}.num{text-align:right}th:nth-child(1){width:50%}th:nth-child(2){width:22%}th:nth-child(3){width:28%}.totalRow{display:grid;grid-template-columns:50% 22% 28%;background:#f3f3f3;border:1px solid #c9c9c9;border-top:0;font-size:10px;font-weight:800}.totalRow div{padding:3.4mm 3mm;border-right:1px solid #c9c9c9}.totalRow div:last-child{border-right:0}.totalRow .num{text-align:right}.footnote{margin-top:6mm;color:#666;font-size:8.5px}.note{margin-top:3mm;color:#555;font-size:8.5px;line-height:1.45}.spacer{height:112mm}@media(max-width:820px){body{background:#fff}.tools{width:auto;margin:8px}.sheet{width:100%;min-height:auto;margin:0;padding:16px}.cards{grid-template-columns:1fr}.formulaRow{align-items:flex-start;flex-direction:column}.spacer{height:28px}th,td{font-size:8px;padding:8px 5px}}@media print{html,body{background:#fff}.tools{display:none!important}.sheet{width:auto;min-height:auto;margin:0;padding:0}.spacer{height:112mm}}'+
      '</style></head><body>'+ 
      '<div class="tools"><button onclick="window.close()">← VOLTAR</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div>'+ 
      '<main class="sheet">'+
        '<div class="topline"><span>'+esc(data)+', '+esc(hora)+'</span><span>Formulação '+esc(f.nome||'Formulação')+'</span></div>'+ 
        '<header class="header"><h1>DF Manutenção e Consultoria</h1><p>Relatório de Formulação</p></header>'+ 
        '<div class="rule"></div>'+ 
        '<div class="formulaRow"><div class="formula">'+esc(f.nome||'Formulação')+'</div><div class="base">BASE PADRÃO: 100 KG</div></div>'+ 
        '<section class="cards">'+
          '<div class="card"><span>Total da porcentagem</span><b>'+fm(srv.totalPct||0,2)+'%</b></div>'+ 
          '<div class="card"><span>Fator KG</span><b>'+money(srv.custoKgFinal||0)+'/kg</b></div>'+ 
        '</section>'+ 
        '<div class="tableWrap"><table><thead><tr><th>Material</th><th class="num">%</th><th class="num">Kg na base 100 kg</th></tr></thead><tbody>'+rowsHtml(f,srv)+'</tbody></table></div>'+ 
        '<div class="totalRow"><div>TOTAL</div><div class="num">'+fm(srv.totalPct||0,2)+'%</div><div class="num">100,000 kg</div></div>'+ 
        '<div class="footnote">Gerado em '+esc(gerado)+' • DF EXTRUSOR PRO</div>'+ 
        '<div class="note">Fator KG referente somente ao custo das resinas da formulação. Não inclui custo fabril.</div>'+ 
        '<div class="spacer"></div>'+ 
      '</main>'+ 
      '</body></html>';

    try{
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      return true;
    }catch(e){
      try{win.close()}catch(x){}
      alert('Não foi possível abrir o relatório.');
      return false;
    }
  }

  window.dfPdfResinasProfissional=pdfResinas;
})();


/* ---- pdf-button-safe.js ---- */
(function(){
  'use strict';

  function forms(){
    try{
      return window.loadForms ? window.loadForms() : JSON.parse(localStorage.getItem('df_formulacoes_v2') || '[]');
    }catch(e){
      return [];
    }
  }

  function selected(){
    const id=document.getElementById('foSavedSelect')?.value;
    return forms().find(f=>String(f.id)===String(id));
  }

  function prepararJanela(){
    const w=window.open('about:blank','df_resinas_pdf');
    if(!w)return null;
    try{
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#eee;color:#111}.box{background:#fff;border:1px solid #ccc;padding:22px 28px;font-weight:700}</style></head><body><div class="box">Gerando relatório...</div></body></html>');
      w.document.close();
    }catch(e){}
    return w;
  }

  function configurarVoltar(w){
    try{
      const btn=w.document.querySelector('.tools button');
      if(!btn)return;
      btn.textContent='← VOLTAR PARA FORMULAÇÃO';
      btn.onclick=function(){
        try{
          if(w.opener && !w.opener.closed){
            w.opener.location.hash='#formulacao';
            w.opener.focus();
          }
        }catch(e){}
        w.close();
      };
    }catch(e){}
  }

  async function abrirPdf(f){
    if(!f){alert('Selecione uma formulação.');return;}
    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O PDF ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const w=prepararJanela();
    if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up e tente novamente.');return;}
    const ok=await window.dfPdfResinasProfissional(f,w);
    if(ok){
      configurarVoltar(w);
      setTimeout(()=>configurarVoltar(w),150);
      setTimeout(()=>configurarVoltar(w),500);
    }
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('[data-fosafe="pdf"]'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    abrirPdf(selected());
  },true);
})();


/* ---- formula-view-safe.js ---- */
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>Number(v)>0?'R$ '+fm(v,2):'sem custo';
  const load=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const save=a=>{try{localStorage.setItem('df_formulacoes_v2',JSON.stringify(a))}catch(e){}render();};
  const selected=()=>{const id=q('foSavedSelect')?.value;return load().find(f=>String(f.id)===String(id));};
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function addComp(){
    if(q('exComp'))return;
    const exL=q('exL');if(!exL)return;
    const box=exL.closest('div');if(!box||!box.parentNode)return;
    const div=document.createElement('div');
    div.innerHTML='<label>Comprimento final / saco (cm)</label><input id="exComp" class="main" inputmode="decimal" placeholder="Ex.: 105"><div class="smallNote">Usado somente para puxar o tamanho final na OP. Não entra na conta de g/m.</div>';
    box.parentNode.insertBefore(div,box.nextSibling);
  }

  function getExtrusaoOP(){
    return{
      largura:pn(q('exL')?.value),
      comprimento:pn(q('exComp')?.value),
      micra:pn(q('exM')?.value),
      grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0
    };
  }

  function info(){
    const b=q('foSavedInfo'),f=selected();if(!b)return;
    if(!f){b.innerHTML='Selecione uma formulação salva.';return;}
    b.innerHTML='<b>'+esc(f.nome||'Formulação')+'</b><br>'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+money(f.custo||0);
  }

  function render(){
    const b=q('foSaved'),a=load();if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return;}
    const current=q('foSavedSelect')?.value;
    const opts=a.map((f,i)=>'<option value="'+esc(f.id)+'" '+((current&&String(current)===String(f.id))||(!current&&i===0)?'selected':'')+'>'+esc(f.nome||'Formulação')+' — '+fm(f.total||0,2)+' kg</option>').join('');
    b.innerHTML='<div class="formRow"><label>Formulação salva</label><select id="foSavedSelect">'+opts+'</select><div id="foSavedInfo" class="formNote"></div><div class="savedBtns" style="grid-template-columns:repeat(5,1fr)"><button class="miniBtn" data-fosafe="open">ABRIR</button><button class="miniBtn" data-fosafe="pdf">PDF</button><button class="miniBtn" data-fosafe="op">OP</button><button class="miniBtn" data-fosafe="dup">DUPLICAR</button><button class="delBtn" data-fosafe="del">EXCLUIR</button></div></div>';
    q('foSavedSelect')?.addEventListener('change',info);info();
  }

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=(f.rows||[]).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:Number(f.total)||0,rows});}catch(e){console.error(e);return null;}
  }

  async function saveFormulaSafe(){
    const nome=(q('foNome')?.value||'').trim()||'Formulação';
    const total=pn(q('foTotal')?.value);
    const rows=(typeof window.getFoRows==='function'?window.getFoRows():[]).filter(r=>r.id&&Number(r.pct)>0);
    if(!total){alert('Digite quantos kg quer fazer.');return;}
    if(!rows.length){alert('Escolha pelo menos 1 material.');return;}
    const tmp={total,rows};
    const srv=await calcSaved(tmp);if(!srv){alert('Não foi possível calcular a formulação no servidor.');return;}
    const d=Number(srv.diferencaPara100)||0;
    if(Math.abs(d)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;
    const rec={id:Date.now(),nome,total,rows,custo:Number(srv.custoTotal)||0,custoKg:Number(srv.custoKgFinal)||0,op:getExtrusaoOP(),criado:new Date().toISOString()};
    const a=load();a.unshift(rec);save(a);alert('Formulação salva.');
  }

  async function pdf(f){
    if(!f)return;
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível gerar o PDF.');return;}
    const total=Number(f.total)||0,rows=f.rows||[],items=Array.isArray(srv.itens)?srv.itens:[];
    let trs='';
    rows.forEach((r,i)=>{const m=mat(r.id)||r,it=items[i]||{};trs+='<tr><td>'+esc(m.nome||r.nome||'')+'</td><td>'+fm(r.pct||0,2)+'%</td><td>'+fm(it.kg||0,3)+' kg</td><td>'+money(m.preco||r.preco||0)+'</td><td>'+money(it.custo||0)+'</td></tr>';});
    if(!trs)trs='<tr><td colspan="5">Sem materiais.</td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação '+esc(f.nome||'')+'</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{margin:0 0 4px}.top{border-bottom:3px solid #111;padding-bottom:12px}.box{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#555;font-size:12px}.kpi b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#eee}.foot{margin-top:26px;color:#666;font-size:12px}@media print{body{margin:18px}}</style></head><body><div class="top"><h1>DF Manutenção e Consultoria</h1><div>Relatório de Formulação</div></div><h2>'+esc(f.nome||'Formulação')+'</h2><div class="box"><div class="kpi"><span>Quantidade total</span><b>'+fm(total,3)+' kg</b></div><div class="kpi"><span>Total da porcentagem</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="kpi"><span>Custo total</span><b>'+money(srv.custoTotal||0)+'</b></div><div class="kpi"><span>Custo por kg final</span><b>'+money(srv.custoKgFinal||0)+'</b></div></div><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Valor/kg</th><th>Custo</th></tr></thead><tbody>'+trs+'</tbody></table><div class="foot">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  function op(f){
    if(!f){alert('Formulação não encontrada.');return;}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
    const atual=getExtrusaoOP(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'';
    const letras=['A','B','C','D','E','F','G','H'];
    let matRows='';for(let i=0;i<8;i++){const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;matRows+='<tr class="'+((desc||pct)?'matFilled':'')+'"><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';}
    let prodRows='';for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OP '+esc(nome)+'</title><style>@page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11.5px;background:#fff}.page{border:2px solid #111;padding:6px}.op{width:100%;border-collapse:collapse;table-layout:fixed}.op td,.op th{border:1px solid #333;padding:4px 5px;vertical-align:middle}.center{text-align:center}.b{font-weight:700}.logo{font-size:16px;font-weight:900;letter-spacing:.4px}.title{background:#111827!important;color:#fff!important;text-align:center;font-weight:900;letter-spacing:.4px}.hl{background:#fff200!important;font-weight:900}.hl2{background:#eaf3ff!important;font-weight:900}.hl3{background:#eaffea!important;font-weight:900}.top td{height:21px}.big{font-size:15px}.xbig{font-size:18px}.mat th{background:#111827!important;color:#fff!important}.mat td{height:22px}.matFilled td{background:#fffbe6!important;font-weight:700}.prod th{background:#e5e7eb!important;font-size:10px}.prod td{height:23px}.codes td{font-size:10.5px;background:#fafafa}.sectionGap{height:6px;border:0}.printHint{margin:0 0 6px;color:#555;font-size:11px}.obs{height:34px}.stamp{float:right;border:1px solid #333;border-radius:8px;padding:5px 12px;font-weight:900;background:#fff200}.miniTitle{font-size:10px;color:#333;font-weight:700;text-transform:uppercase}.value{font-size:14px;font-weight:900}@media print{body{margin:0}.printHint{display:none}.page{border:0;padding:0}}</style></head><body><div class="printHint">OP pronta para imprimir. Escolha salvar como PDF ou imprimir.</div><div class="page">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="hl center">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="hl"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho||'_____')+'</span></td><td colspan="3">cod de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="hl3"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div><table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="hl"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="hl3"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div><table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table><div class="sectionGap"></div><table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02-acerto</td><td>03-M.mecânica</td><td>04-falta de energia</td><td>05-material molhado</td><td>06-teste</td></tr><tr><td>07-M.elétrica</td><td>08-limpeza da borda</td><td>09-troca de tela</td><td>10-outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  document.addEventListener('click',function(ev){
    if(ev.target?.id==='foSave'){
      ev.preventDefault();ev.stopImmediatePropagation();saveFormulaSafe();return;
    }
    const act=ev.target?.dataset?.fosafe;if(!act)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    if(act==='open'){if(window.abrirFormula)window.abrirFormula(f,false);return;}
    if(act==='pdf'){pdf(f);return;}
    if(act==='op'){op(f);return;}
    if(act==='dup'){const a=load(),cp=JSON.parse(JSON.stringify(f));cp.id=Date.now();cp.nome=(f.nome||'Formulação')+' cópia';cp.criado=new Date().toISOString();a.unshift(cp);save(a);return;}
    if(act==='del'){if(!confirm('Excluir esta formulação?'))return;save(load().filter(x=>String(x.id)!==String(f.id)));}
  },true);

  function force(){window.renderForms=render;window.salvarFormula=saveFormulaSafe;window.getExtrusaoOP=getExtrusaoOP;window.printFormulaOp=op;addComp();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(force,250));else setTimeout(force,250);
  [600,1200,2200].forEach(t=>setTimeout(force,t));
  document.addEventListener('click',()=>setTimeout(()=>{if(q('foSaved')&&!q('foSavedSelect'))force();},120),true);
})();


/* ---- whatsapp-user-number.js ---- */
(function(){
  'use strict';

  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const KEY_PDF_AUTO='df_vendedor_pdf_auto_v1';
  const KEY_PDF_PRO='df_vendedor_pdf_auto_prof_v1';
  const OLD_DEFAULT='5547992825006';

  function $(id){return document.getElementById(id)}
  function digits(v){return String(v||'').replace(/\D/g,'')}
  function normalize(v){let d=digits(v);if(d.length===10||d.length===11)d='55'+d;return d}
  function valid(v){return /^55\d{10,11}$/.test(String(v||''))}

  function removeOldDefault(){
    try{
      if(digits(localStorage.getItem(KEY_NUM)||'')===OLD_DEFAULT)localStorage.removeItem(KEY_NUM);
      ['df_vendedor_whatsapp','df_whatsapp_vendedor','vendedorWhatsapp'].forEach(function(k){if(digits(localStorage.getItem(k)||'')===OLD_DEFAULT)localStorage.removeItem(k)});
    }catch(e){}
  }

  function storedPhone(){try{return normalize(localStorage.getItem(KEY_NUM)||'')}catch(e){return''}}

  function disableAutoIfNoNumber(){
    if(valid(storedPhone()))return;
    try{localStorage.setItem(KEY_AUTO,'0');localStorage.setItem(KEY_PDF_AUTO,'0');localStorage.setItem(KEY_PDF_PRO,'0')}catch(e){}
    const a=$('foVendAuto'),p=$('foVendPdfAuto');if(a)a.checked=false;if(p)p.checked=false;
  }

  function saveNumber(showMessage){
    const input=$('foVendWhats');if(!input)return false;
    const raw=String(input.value||'').trim(),phone=normalize(raw),msg=$('foVendMsg');
    if(!raw){try{localStorage.removeItem(KEY_NUM)}catch(e){};input.value='';disableAutoIfNoNumber();if(showMessage&&msg)msg.textContent='Número removido. Digite o WhatsApp que deseja usar e toque em SALVAR NÚMERO.';return false}
    if(!valid(phone)){if(showMessage)alert('Digite um WhatsApp válido com DDD. Ex.: 47999999999.');return false}
    try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
    input.value=phone.startsWith('55')?phone.slice(2):phone;
    if(showMessage&&msg)msg.textContent='WhatsApp salvo neste aparelho. Os próximos envios usarão este número.';
    return true;
  }

  function ensureUi(){
    removeOldDefault();disableAutoIfNoNumber();
    const input=$('foVendWhats');if(!input)return;
    const saved=storedPhone(),shown=normalize(input.value||'');
    if(shown===OLD_DEFAULT)input.value='';
    else if(valid(saved)){const local=saved.startsWith('55')?saved.slice(2):saved;if(String(input.value||'').trim()!==local)input.value=local}
    else if(!saved)input.value='';
    input.placeholder='Ex.: 47999999999';input.autocomplete='tel';

    if(!$('foVendSaveNumber')){
      const btn=document.createElement('button');btn.id='foVendSaveNumber';btn.type='button';btn.className='calcBtn alt dfVendedorMini';btn.textContent='SALVAR NÚMERO';btn.style.marginTop='8px';
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();saveNumber(true)});
      input.insertAdjacentElement('afterend',btn);
    }
    if(!$('dfWhatsUserHint')){
      const div=document.createElement('div');div.id='dfWhatsUserHint';div.className='smallNote';div.style.marginTop='6px';div.textContent='Cada usuário cadastra e salva o próprio número neste aparelho. Nenhum número vem preenchido por padrão.';
      const btn=$('foVendSaveNumber');if(btn)btn.insertAdjacentElement('afterend',div);
    }
  }

  function capturePhoneEdit(ev){
    const input=ev.target;if(!input||input.id!=='foVendWhats')return;
    ev.stopImmediatePropagation();
    const raw=String(input.value||'').trim();
    if(!raw){try{localStorage.removeItem(KEY_NUM)}catch(e){};disableAutoIfNoNumber();return}
    const phone=normalize(raw);if(valid(phone))try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
  }

  function captureAutoChange(ev){
    const el=ev.target;if(!el||!['foVendAuto','foVendPdfAuto'].includes(el.id))return;
    ev.stopImmediatePropagation();
    const phone=normalize(($('foVendWhats')&&$('foVendWhats').value)||storedPhone());
    if(el.checked&&!valid(phone)){el.checked=false;alert('Digite e salve um WhatsApp com DDD antes de ativar o envio automático.');const input=$('foVendWhats');if(input)input.focus();return}
    if(valid(phone))try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
    try{if(el.id==='foVendAuto')localStorage.setItem(KEY_AUTO,el.checked?'1':'0');if(el.id==='foVendPdfAuto'){localStorage.setItem(KEY_PDF_AUTO,'0');localStorage.setItem(KEY_PDF_PRO,el.checked?'1':'0')}}catch(e){}
  }

  function guardActions(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendTest,#foVendPdfTest'):null;if(!btn)return;
    const input=$('foVendWhats'),phone=normalize((input&&input.value)||storedPhone());
    if(valid(phone)){try{localStorage.setItem(KEY_NUM,phone)}catch(e){};return}
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();alert('Digite e salve o WhatsApp com DDD antes de enviar.');if(input)input.focus();
  }

  function init(){
    removeOldDefault();disableAutoIfNoNumber();ensureUi();
    setTimeout(ensureUi,250);setTimeout(ensureUi,800);setTimeout(ensureUi,1800);
    document.addEventListener('input',capturePhoneEdit,true);
    document.addEventListener('change',function(ev){capturePhoneEdit(ev);captureAutoChange(ev)},true);
    document.addEventListener('click',function(ev){guardActions(ev);const el=ev.target&&ev.target.closest?ev.target.closest('#btFo,[onclick*="show(\'fo\')"]'):null;if(el)setTimeout(ensureUi,60)},true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(ensureUi,40)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ---- vendedor-pdf-profissional.js ---- */
(function(){
  'use strict';
  const OLD_KEY='df_vendedor_pdf_auto_v1';
  const PRO_KEY='df_vendedor_pdf_auto_prof_v1';
  const KEY_NUM='df_vendedor_whats_num_v1';
  const LEGACY_KEYS=['df_vendedor_whatsapp','df_whatsapp_vendedor','vendedorWhatsapp'];
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};

  try{localStorage.setItem(OLD_KEY,'0')}catch(e){}

  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }

  function phoneFromField(){
    const el=document.getElementById('foVendWhats');
    return normalizePhone(el&&el.value);
  }

  function syncPhone(){
    let phone=phoneFromField();
    if(!phone){
      try{phone=normalizePhone(localStorage.getItem(KEY_NUM)||'')}catch(e){}
    }
    if(!phone){
      for(const k of LEGACY_KEYS){
        try{phone=normalizePhone(localStorage.getItem(k)||'')}catch(e){}
        if(phone)break;
      }
    }
    if(phone){
      try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
      const el=document.getElementById('foVendWhats');
      if(el&&normalizePhone(el.value)!==phone)el.value=phone;
    }
    return phone;
  }

  function validPhone(phone){
    return /^55\d{10,11}$/.test(String(phone||''));
  }

  function whatsUrl(f,phone){
    const texto='Segue o PDF da formulação '+String(f?.nome||'Formulação')+'.';
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(mobile)return 'https://wa.me/'+phone+'?text='+encodeURIComponent(texto);
    return 'https://web.whatsapp.com/send?phone='+phone+'&text='+encodeURIComponent(texto);
  }

  function prepararJanelaPdf(){
    const w=window.open('about:blank','df_resinas_pdf');
    if(!w)return null;
    try{
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f3f4f6;color:#111}.box{background:#fff;border:1px solid #bbb;padding:24px 30px;border-radius:6px;font-weight:700}</style></head><body><div class="box">Gerando relatório A4...</div></body></html>');
      w.document.close();
    }catch(e){}
    return w;
  }

  async function enviarPdfUltima(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return;}

    const phone=syncPhone();
    if(!validPhone(phone)){
      alert('Cadastre o WhatsApp com DDD antes de enviar o PDF. Ex.: 47999999999.');
      const el=document.getElementById('foVendWhats');
      if(el)el.focus();
      return;
    }

    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O relatório profissional ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }

    const pdfWin=prepararJanelaPdf();
    if(!pdfWin){
      alert('O navegador bloqueou a janela do PDF. Libere pop-up para este site e tente novamente.');
      return;
    }

    const msg=document.getElementById('foVendMsg');
    if(msg)msg.textContent='Gerando relatório e abrindo direto o WhatsApp cadastrado...';

    const ok=await window.dfPdfResinasProfissional(f,pdfWin);
    if(!ok){try{pdfWin.close()}catch(e){} return;}

    if(msg)msg.textContent='Relatório pronto. Abrindo a conversa do número cadastrado: '+phone+'.';

    window.location.href=whatsUrl(f,phone);
  }

  async function abrirProfissional(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return;}
    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O relatório profissional ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const ok=await window.dfPdfResinasProfissional(f);
    const msg=document.getElementById('foVendMsg');
    if(ok&&msg)msg.textContent='Relatório profissional aberto. Use IMPRIMIR / SALVAR PDF para compartilhar.';
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendPdfTest'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    syncPhone();
    enviarPdfUltima(forms()[0]);
  },true);

  document.addEventListener('input',function(ev){
    if(ev.target&&ev.target.id==='foVendWhats')syncPhone();
  },true);
  document.addEventListener('change',function(ev){
    if(ev.target&&ev.target.id==='foVendWhats')syncPhone();
  },true);

  function ajustarAuto(){
    syncPhone();
    const cb=document.getElementById('foVendPdfAuto');
    if(!cb||cb.dataset.dfPdfProf==='1')return;
    cb.dataset.dfPdfProf='1';
    cb.checked=localStorage.getItem(PRO_KEY)!=='0';
    try{localStorage.setItem(OLD_KEY,'0')}catch(e){}
    cb.addEventListener('change',function(ev){
      ev.stopImmediatePropagation();
      try{
        localStorage.setItem(OLD_KEY,'0');
        localStorage.setItem(PRO_KEY,cb.checked?'1':'0');
      }catch(e){}
    },true);
    const label=cb.closest('label');
    if(label){
      const nodes=[...label.childNodes].filter(n=>n.nodeType===3);
      if(nodes.length)nodes[nodes.length-1].textContent=' Abrir relatório profissional quando salvar formulação';
    }
  }

  let lastId='';
  function initLast(){const f=forms()[0];lastId=f?String(f.id):'';syncPhone();}
  function watchNew(){
    ajustarAuto();
    try{localStorage.setItem(OLD_KEY,'0')}catch(e){}
    const f=forms()[0];
    const id=f?String(f.id):'';
    if(lastId&&id&&id!==lastId&&localStorage.getItem(PRO_KEY)!=='0'){
      lastId=id;
      setTimeout(()=>abrirProfissional(f),250);
      return;
    }
    if(id)lastId=id;
  }

  window.dfGetVendedorWhats=syncPhone;
  window.dfEnviarPdfUltima=enviarPdfUltima;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initLast();setTimeout(ajustarAuto,500)});
  else{initLast();setTimeout(ajustarAuto,500)}
  setInterval(watchNew,700);
})();


/* ---- cloud-backup-auto.js ---- */
(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const LEGACY_LICENSE_KEY='df_licenseauth_license_v1';
  const LAST_KEY='df_cloud_last_backup_v1';
  const PENDING_KEY='df_cloud_pending_v1';
  const DATA_KEYS=[
    'df_formula_materiais_v2',
    'df_formulacoes_v2',
    'df_vendedor_whats_num_v1',
    'df_vendedor_whats_auto_v1',
    'df_vendedor_pdf_auto_prof_v1',
    'df_vendedor_pdf_auto_v1'
  ];

  let busy=false,lastHash='',serverReady=null,renewPromise=null;

  function $(id){return document.getElementById(id)}
  function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function unb64(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
  function quickHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
  function fmtDate(v){if(!v)return'Nunca';try{return new Date(v).toLocaleString('pt-BR')}catch(e){return String(v)}}
  function setStatus(text,type=''){const e=$('dfCloudStatus');if(!e)return;e.textContent=text;e.className='dfCloudStatus '+type}

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const id=String(window.DFDeviceIdentity.get()||'').trim();
        if(id)return id;
      }
    }catch(e){}
    return String(localStorage.getItem(DEVICE_KEY)||'').trim();
  }

  function decodeTokenPayload(token){
    try{
      let s=String(token||'').split('.')[0]||'';
      s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
      return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));
    }catch(e){return null}
  }

  async function renewSession(force){
    const current=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();
    if(current&&!force){
      const p=decodeTokenPayload(current);
      if(p&&p.owner)return current;
    }
    if(renewPromise)return renewPromise;

    renewPromise=(async()=>{
      const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
      const device=deviceId();
      if(!credential||!device)throw new Error('Acesso automático ainda não está pronto neste aparelho.');

      const r=await fetch(API+'/access/session',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-DF-Device':device},
        body:JSON.stringify({credential,deviceId:device}),
        cache:'no-store'
      });
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível renovar o acesso automático.');
      const token=String(j.token||'').trim();
      if(!token)throw new Error('Sessão automática não retornada pelo servidor.');
      sessionStorage.setItem(TOKEN_KEY,token);
      return token;
    })();

    try{return await renewPromise}finally{renewPromise=null}
  }

  async function ownerKey(force){
    let token=await renewSession(!!force);
    let p=decodeTokenPayload(token);
    if(!p||!p.owner){token=await renewSession(true);p=decodeTokenPayload(token)}
    const owner=String(p&&p.owner||'').trim();
    if(!owner)throw new Error('O acesso automático precisa ser atualizado para usar o backup.');
    return owner;
  }

  function syncVisibleFields(){
    try{if(typeof window.dfGetVendedorWhats==='function')window.dfGetVendedorWhats()}catch(e){}
    const n=$('foVendWhats');
    if(n&&String(n.value||'').trim()){
      try{
        let d=String(n.value).replace(/\D/g,'');
        if(d.length===10||d.length===11)d='55'+d;
        if(d)localStorage.setItem('df_vendedor_whats_num_v1',d);
      }catch(e){}
    }
  }

  function snapshot(){
    syncVisibleFields();
    const data={};
    for(const k of DATA_KEYS){const v=localStorage.getItem(k);if(v!==null)data[k]=v}
    return{v:2,createdAt:new Date().toISOString(),origin:location.origin,data};
  }
  function snapshotHash(){return quickHash(JSON.stringify(snapshot().data))}

  async function deriveOwnerKey(owner){
    const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v2|'+owner));
    return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
  }
  async function deriveLegacyKey(license){
    const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v1|'+license));
    return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
  }
  async function encrypt(data,owner){
    const key=await deriveOwnerKey(owner),iv=crypto.getRandomValues(new Uint8Array(12));
    const plain=new TextEncoder().encode(JSON.stringify(data));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);
    return{v:2,alg:'A256GCM',kdf:'owner-v1',iv:b64(iv),ct:b64(new Uint8Array(ct))};
  }
  async function decrypt(env,owner){
    if(!env||env.alg!=='A256GCM')throw new Error('Formato de backup inválido.');
    const iv=unb64(env.iv),ct=unb64(env.ct);
    if(env.kdf==='owner-v1'||Number(env.v)>=2){
      const key=await deriveOwnerKey(owner);
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
      return JSON.parse(new TextDecoder().decode(plain));
    }
    const legacy=String(localStorage.getItem(LEGACY_LICENSE_KEY)||'').trim();
    if(!legacy){const e=new Error('Este backup é de uma versão antiga. Faça um novo backup neste aparelho para migrar para o acesso automático.');e.name='LegacyBackupError';throw e}
    const key=await deriveLegacyKey(legacy);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  async function apiPost(path,body,retry=true){
    const token=await renewSession(false);
    const device=deviceId();
    let r;
    try{
      r=await fetch(API+path,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':device},
        body:JSON.stringify(body||{}),cache:'no-store'
      });
    }catch(e){e.network=true;throw e}
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false){
      if(r.status===401&&retry){
        await renewSession(true);
        return apiPost(path,body,false);
      }
      const e=new Error(j.error||('Erro HTTP '+r.status));e.status=r.status;e.detail=j.detail||'';throw e;
    }
    return j;
  }

  function markPending(){try{localStorage.setItem(PENDING_KEY,'1')}catch(e){};updateCard()}
  function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(e){}}
  function lastBackup(){return localStorage.getItem(LAST_KEY)||''}
  function toggleButtons(dis){['dfCloudSave','dfCloudRestore'].forEach(id=>{const b=$(id);if(b)b.disabled=!!dis})}

  async function saveNow(){
    if(busy)return false;
    if(navigator.onLine===false){markPending();setStatus('Sem internet. Backup ficou na fila e será enviado automaticamente quando voltar.','warn');return false}
    if(!localStorage.getItem(ACCESS_KEY)){setStatus('Acesso automático ainda não foi liberado neste aparelho.','warn');return false}
    busy=true;toggleButtons(true);setStatus('Enviando backup criptografado...','');
    try{
      const owner=await ownerKey(false);
      const snap=snapshot();
      const envelope=await encrypt(snap,owner);
      const j=await apiPost('/backup/save',{backup:envelope,clientTime:snap.createdAt});
      serverReady=true;
      const when=j.updatedAt||new Date().toISOString();
      localStorage.setItem(LAST_KEY,when);clearPending();lastHash=snapshotHash();
      setStatus('Backup automático ativo • último: '+fmtDate(when),'ok');
      return true;
    }catch(e){
      if(e.status===404||/D1|DB|backup/i.test(String(e.message||'')+' '+String(e.detail||''))){serverReady=false;setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn')}
      else if(e.network){markPending();setStatus('Sem conexão com o servidor. Backup ficou na fila.','warn')}
      else setStatus('Não foi possível salvar o backup: '+String(e.message||e),'bad');
      return false;
    }finally{busy=false;toggleButtons(false);updateCard()}
  }

  async function restore(){
    if(busy)return;
    if(navigator.onLine===false){setStatus('Para restaurar da nuvem, conecte o aparelho à internet.','warn');return}
    if(!localStorage.getItem(ACCESS_KEY)){setStatus('Acesso automático ainda não foi liberado neste aparelho.','warn');return}
    if(!confirm('Restaurar o backup da nuvem neste aparelho? Os materiais e formulações atuais serão substituídos pelos dados do backup.'))return;
    busy=true;toggleButtons(true);setStatus('Buscando backup na nuvem...','');
    try{
      const j=await apiPost('/backup/load',{});
      serverReady=true;
      if(!j.backup){setStatus('Ainda não existe backup salvo para este acesso.','warn');return}
      const owner=await ownerKey(false);
      const snap=await decrypt(j.backup,owner);
      if(!snap||!snap.data)throw new Error('Backup vazio ou inválido.');
      for(const k of DATA_KEYS){if(Object.prototype.hasOwnProperty.call(snap.data,k))localStorage.setItem(k,String(snap.data[k]));else localStorage.removeItem(k)}
      localStorage.setItem(LAST_KEY,j.updatedAt||snap.createdAt||new Date().toISOString());clearPending();
      setStatus('Backup restaurado. Reabrindo o app...','ok');
      setTimeout(()=>location.reload(),700);
    }catch(e){
      if(e.status===404||/D1|DB|backup/i.test(String(e.message||'')+' '+String(e.detail||''))){serverReady=false;setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn')}
      else if(e.name==='LegacyBackupError')setStatus(e.message,'warn');
      else if(e.name==='OperationError')setStatus('Não foi possível descriptografar este backup. Faça um novo backup para atualizar a proteção.','bad');
      else setStatus('Não foi possível restaurar: '+String(e.message||e),'bad');
    }finally{busy=false;toggleButtons(false);updateCard()}
  }

  function addStyle(){
    if($('dfCloudStyle'))return;
    const s=document.createElement('style');s.id='dfCloudStyle';
    s.textContent='.dfCloudCard{border-color:#1d4ed8!important;background:linear-gradient(180deg,#101827,#07101f)!important}.dfCloudHead{display:flex;justify-content:space-between;align-items:center;gap:10px}.dfCloudPill{border:1px solid #2563eb;background:#0b1d3a;color:#bfdbfe;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900}.dfCloudGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.dfCloudBtn{border:1px solid #2563eb;background:#0b1d3a;color:#dbeafe;border-radius:12px;padding:11px 9px;font-weight:900;cursor:pointer}.dfCloudBtn.restore{border-color:#475569;background:#0f172a;color:#e2e8f0}.dfCloudBtn:disabled{opacity:.55}.dfCloudStatus{margin-top:11px;font-size:12px;color:#94a3b8;line-height:1.4}.dfCloudStatus.ok{color:#86efac}.dfCloudStatus.warn{color:#fbbf24}.dfCloudStatus.bad{color:#fca5a5}.dfCloudMeta{margin-top:8px;color:#64748b;font-size:10px}@media(max-width:560px){.dfCloudGrid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function ensureCard(){
    addStyle();
    const pg=$('pgFo');if(!pg||$('dfCloudBackupCard'))return;
    const card=document.createElement('div');card.className='card dfCloudCard';card.id='dfCloudBackupCard';
    card.innerHTML='<div class="dfCloudHead"><div><span class="tag">Nuvem</span><h2 style="margin-bottom:4px">☁ Backup na nuvem</h2></div><span class="dfCloudPill">CRIPTOGRAFADO</span></div><div class="hint">Salva materiais, formulações, WhatsApp cadastrado e preferências. O acesso e o ID do aparelho não são enviados dentro do backup.</div><div class="dfCloudGrid"><button id="dfCloudSave" class="dfCloudBtn" type="button">FAZER BACKUP AGORA</button><button id="dfCloudRestore" class="dfCloudBtn restore" type="button">RESTAURAR BACKUP</button></div><div id="dfCloudStatus" class="dfCloudStatus">Reconhecendo acesso automático...</div><div class="dfCloudMeta">Backup automático: alterações ficam na fila offline e sincronizam quando a internet voltar.</div>';
    const vendor=$('dfVendedorCard'),contact=$('dfContact_pgFo');
    if(vendor&&vendor.parentNode)vendor.parentNode.insertBefore(card,vendor);
    else if(contact&&contact.parentNode)contact.parentNode.insertBefore(card,contact);
    else pg.insertBefore(card,pg.firstChild);
    $('dfCloudSave').onclick=()=>saveNow();
    $('dfCloudRestore').onclick=restore;
    updateCard();
  }

  function updateCard(){
    const e=$('dfCloudStatus');if(!e)return;
    if(navigator.onLine===false){setStatus('Modo offline: alterações protegidas neste aparelho e aguardando sincronização.','warn');return}
    if(serverReady===false){setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn');return}
    if(!localStorage.getItem(ACCESS_KEY)){setStatus('Acesso automático ainda não foi liberado neste aparelho.','warn');return}
    const last=lastBackup(),pending=localStorage.getItem(PENDING_KEY)==='1';
    if(pending)setStatus('Acesso reconhecido • há alterações aguardando envio para a nuvem.','warn');
    else if(last)setStatus('Backup automático ativo • último: '+fmtDate(last),'ok');
    else setStatus('Acesso automático reconhecido • pronto para o primeiro backup.','ok');
  }

  function detectChanges(){
    const h=snapshotHash();
    if(!lastHash){lastHash=h;return}
    if(h!==lastHash){lastHash=h;markPending();if(navigator.onLine!==false)setTimeout(()=>saveNow(),1200)}
  }
  async function sync(){
    ensureCard();
    if(navigator.onLine===false){updateCard();return false}
    if(!localStorage.getItem(ACCESS_KEY)){updateCard();return false}
    if(localStorage.getItem(PENDING_KEY)==='1')return saveNow();
    updateCard();return false;
  }

  window.dfBackupSync=sync;
  window.dfBackupNow=saveNow;
  window.dfBackupRestore=restore;
  window.addEventListener('online',()=>setTimeout(sync,700));
  window.addEventListener('df-network-state',e=>{if(e.detail&&e.detail.online)setTimeout(sync,700);else updateCard()});

  function init(){
    setTimeout(ensureCard,500);
    setTimeout(async()=>{
      lastHash=snapshotHash();
      if(!lastBackup())markPending();
      try{await renewSession(false)}catch(e){}
      sync();
    },1800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setInterval(detectChanges,12000);setInterval(sync,60000);
})();


/* ---- backup-status-fix.js ---- */
(function(){
  'use strict';
  const OLD='Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.';
  const NEW='Pronto para fazer o backup na nuvem.';

  function fixStatus(){
    const el=document.getElementById('dfCloudStatus');
    if(!el)return;
    if(String(el.textContent||'').trim()===OLD){
      el.textContent=NEW;
      el.className='dfCloudStatus';
    }
  }

  const obs=new MutationObserver(fixStatus);
  function start(){
    fixStatus();
    obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();


/* ---- feedback-extra.js ---- */
(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const DRAFT_KEY='df_feedback_draft_v1';
  const POSTS_KEY='df_feedback_posts_v1';
  const OWNER_KEY='df_feedback_owner_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const SUPPORT_PHONE='5547992825006';
  const MAX_POSTS=100;

  function $(id){return document.getElementById(id)}
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
  function fmtDate(v){try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return''}}
  function ownerKey(){
    let k='';try{k=localStorage.getItem(OWNER_KEY)||''}catch(e){}
    if(!k){k=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));try{localStorage.setItem(OWNER_KEY,k)}catch(e){}}
    return k;
  }
  function deviceId(){try{return localStorage.getItem(DEVICE_KEY)||''}catch(e){return''}}
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch(e){return''}}

  async function cloud(path,body){
    const headers={'Content-Type':'application/json','X-DF-Device':deviceId()};
    const tk=token();if(tk)headers.Authorization='Bearer '+tk;
    const r=await fetch(API+path,{method:'POST',headers,body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
    return j;
  }

  function addStyle(){
    if($('dfFeedbackStyle'))return;
    const st=document.createElement('style');st.id='dfFeedbackStyle';
    st.textContent=[
      '.tabs.dfFeedbackTabs{grid-template-columns:repeat(6,1fr)!important}',
      '.dfFeedbackCard{border-color:#334155!important}',
      '.dfFeedbackStars{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0 4px}',
      '.dfFeedbackStar{border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:11px 5px;font-weight:900;font-size:15px;cursor:pointer}',
      '.dfFeedbackStar.on{border-color:#f59e0b;background:#241600;color:#ffd36a}',
      '.dfFeedbackText{width:100%;min-height:130px;resize:vertical;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:13px 12px;font:inherit;line-height:1.4}',
      '.dfFeedbackStatus{margin-top:10px;font-size:12px;font-weight:800;color:#94a3b8;line-height:1.45}.dfFeedbackStatus.ok{color:#86efac}.dfFeedbackStatus.warn{color:#fbbf24}',
      '.dfFeedbackActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}',
      '.dfFeedbackWall{margin-top:14px}.dfFeedbackWallHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.dfFeedbackWallHead h2{margin:0}',
      '.dfFeedbackEmpty{border:1px dashed #334155;background:#0f172a;border-radius:14px;padding:18px;text-align:center;color:#94a3b8;font-size:13px}',
      '.dfFeedbackPost{border:1px solid #334155;background:#0f172a;border-radius:15px;padding:13px;margin-top:10px}.dfFeedbackPost.pending{border-color:#92400e}',
      '.dfFeedbackPostTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.dfFeedbackPostName{font-weight:900;color:#f8fafc}.dfFeedbackPostMeta{font-size:11px;color:#94a3b8;margin-top:3px;line-height:1.35}',
      '.dfFeedbackPostType{display:inline-block;border:1px solid #475569;border-radius:999px;padding:4px 7px;color:#cbd5e1;font-size:10px;font-weight:900;margin-top:7px}.dfFeedbackPending{display:inline-block;margin-left:5px;border:1px solid #92400e;border-radius:999px;padding:4px 7px;color:#fbbf24;font-size:10px;font-weight:900}',
      '.dfFeedbackPostText{white-space:pre-wrap;word-break:break-word;color:#e2e8f0;line-height:1.45;margin-top:10px}.dfFeedbackPostDelete{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:9px;padding:6px 8px;font-size:10px;font-weight:900;cursor:pointer;flex:0 0 auto}',
      '.dfFeedbackWallNote{font-size:11px;color:#64748b;line-height:1.45;margin-top:8px}',
      '@media(max-width:560px){.tabs.dfFeedbackTabs{grid-template-columns:repeat(3,1fr)!important}.dfFeedbackActions{grid-template-columns:1fr}.dfFeedbackStars{gap:5px}.dfFeedbackStar{font-size:13px;padding:10px 2px}.dfFeedbackPostTop{gap:6px}}'
    ].join('');document.head.appendChild(st);
  }

  function pageHtml(){return '<section id="pgFb" class="page">'+
    '<div class="card dfFeedbackCard"><span class="tag">Feedback</span><h2>💬 Enviar feedback</h2><div class="hint">Seu comentário pode ficar visível para todos os usuários do DF EXTRUSOR PRO.</div>'+ 
    '<label>Tipo de feedback</label><select id="dfFeedbackType"><option value="Sugestão">Sugestão</option><option value="Problema / erro">Problema / erro</option><option value="Melhoria">Melhoria</option><option value="Elogio">Elogio</option><option value="Outro">Outro</option></select>'+ 
    '<label>Sua nota para o app</label><div class="dfFeedbackStars" id="dfFeedbackStars"><button type="button" class="dfFeedbackStar" data-score="1">⭐ 1</button><button type="button" class="dfFeedbackStar" data-score="2">⭐ 2</button><button type="button" class="dfFeedbackStar" data-score="3">⭐ 3</button><button type="button" class="dfFeedbackStar" data-score="4">⭐ 4</button><button type="button" class="dfFeedbackStar" data-score="5">⭐ 5</button></div>'+ 
    '<label>Nome (opcional)</label><input id="dfFeedbackName" maxlength="60" placeholder="Seu nome ou empresa"><label>Mensagem</label><textarea id="dfFeedbackText" maxlength="1000" class="dfFeedbackText" placeholder="Ex.: Gostaria que tivesse... / Encontrei um problema quando..."></textarea>'+ 
    '<div class="dfFeedbackActions"><button id="dfFeedbackSend" class="calcBtn" type="button">PUBLICAR PARA TODOS</button><button id="dfFeedbackClear" class="calcBtn alt" type="button">LIMPAR</button></div><div id="dfFeedbackStatus" class="dfFeedbackStatus">Se a internet estiver indisponível, o comentário fica pendente neste aparelho e tenta sincronizar depois.</div></div>'+ 
    '<div class="card dfFeedbackCard dfFeedbackWall"><div class="dfFeedbackWallHead"><h2>🗣 Comentários da comunidade</h2><span class="tag" id="dfFeedbackCount">0</span></div><div id="dfFeedbackPosts"></div><div class="dfFeedbackWallNote" id="dfFeedbackWallNote">Carregando mural compartilhado...</div></div></section>'}

  function loadPosts(){try{const a=JSON.parse(localStorage.getItem(POSTS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function savePosts(a){try{localStorage.setItem(POSTS_KEY,JSON.stringify((a||[]).slice(0,MAX_POSTS)))}catch(e){}}
  function stars(v){const n=Math.max(0,Math.min(5,Number(v)||0));return n?'⭐'.repeat(n):'Sem nota'}
  function renderPosts(){
    const box=$('dfFeedbackPosts');if(!box)return;const posts=loadPosts();const count=$('dfFeedbackCount');if(count)count.textContent=String(posts.length);
    if(!posts.length){box.innerHTML='<div class="dfFeedbackEmpty">Ainda não há comentários publicados.</div>';return}
    box.innerHTML=posts.map(p=>'<div class="dfFeedbackPost '+(p.pending?'pending':'')+'"><div class="dfFeedbackPostTop"><div><div class="dfFeedbackPostName">'+esc(p.name||'Anônimo')+'</div><div class="dfFeedbackPostMeta">'+esc(fmtDate(p.createdAt))+' • '+esc(stars(p.score))+'</div><span class="dfFeedbackPostType">'+esc(p.type||'Feedback')+'</span>'+(p.pending?'<span class="dfFeedbackPending">AGUARDANDO NUVEM</span>':'')+'</div>'+((p.canDelete||p.pending)?'<button class="dfFeedbackPostDelete" type="button" data-feedback-delete="'+esc(p.id)+'">EXCLUIR</button>':'')+'</div><div class="dfFeedbackPostText">'+esc(p.text||'')+'</div></div>').join('');
  }

  async function loadCloudPosts(showStatus=true){
    if(!navigator.onLine){if(showStatus)setWall('OFFLINE — mostrando a última cópia salva neste aparelho.','warn');renderPosts();return false}
    try{
      const j=await cloud('/feedback/list',{ownerKey:ownerKey()});
      const posts=Array.isArray(j.posts)?j.posts:Array.isArray(j.items)?j.items:[];
      const pending=loadPosts().filter(p=>p.pending);
      const ids=new Set(posts.map(p=>String(p.id)));
      savePosts([...pending.filter(p=>!ids.has(String(p.id))),...posts].slice(0,MAX_POSTS));renderPosts();
      if(showStatus)setWall('Mural sincronizado com a nuvem. Estes comentários aparecem para todos os usuários licenciados.','ok');
      return true;
    }catch(e){if(showStatus)setWall('A nuvem do Feedback ainda não está conectada. Mostrando os comentários salvos neste aparelho.','warn');renderPosts();return false}
  }

  function setWall(text,kind=''){const e=$('dfFeedbackWallNote');if(e){e.textContent=text;e.style.color=kind==='ok'?'#86efac':kind==='warn'?'#fbbf24':'#64748b'}}
  function localPending(data){const posts=loadPosts();const id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);posts.unshift({id,createdAt:new Date().toISOString(),type:data.type,score:data.score,name:data.name,text:data.text,pending:true,canDelete:true});savePosts(posts);renderPosts();return id}

  async function publish(data){
    const localId=localPending(data);
    if(!navigator.onLine)return {cloud:false,localId};
    try{
      await cloud('/feedback/create',{ownerKey:ownerKey(),type:data.type,score:data.score,name:data.name,text:data.text});
      savePosts(loadPosts().filter(p=>String(p.id)!==String(localId)));
      await loadCloudPosts(false);return {cloud:true};
    }catch(e){return {cloud:false,localId,error:e}}
  }

  async function syncPending(){
    if(!navigator.onLine)return;
    const pending=loadPosts().filter(p=>p.pending);if(!pending.length){await loadCloudPosts(false);return}
    let changed=false;
    for(const p of pending){try{await cloud('/feedback/create',{ownerKey:ownerKey(),type:p.type,score:p.score,name:p.name,text:p.text});savePosts(loadPosts().filter(x=>String(x.id)!==String(p.id)));changed=true}catch(e){break}}
    if(changed)await loadCloudPosts(false);
  }

  async function deletePost(id){
    const p=loadPosts().find(x=>String(x.id)===String(id));if(!p)return;
    if(p.pending){savePosts(loadPosts().filter(x=>String(x.id)!==String(id)));renderPosts();return}
    try{await cloud('/feedback/delete',{ownerKey:ownerKey(),id});await loadCloudPosts(false);setWall('Comentário excluído da nuvem.','ok')}
    catch(e){setWall('Não foi possível excluir. Somente quem publicou pode excluir o próprio comentário.','warn')}
  }

  function ensureUi(){
    addStyle();const tabs=document.querySelector('#appContent .tabs')||document.querySelector('.tabs');
    if(tabs){tabs.classList.add('dfFeedbackTabs');if(!$('btFb')){const b=document.createElement('button');b.id='btFb';b.className='tab';b.type='button';b.textContent='FEEDBACK';b.addEventListener('click',showFeedback);tabs.appendChild(b)}}
    const app=$('appContent');if(app&&!$('pgFb')){const foot=app.querySelector('.foot');if(foot)foot.insertAdjacentHTML('beforebegin',pageHtml());else app.insertAdjacentHTML('beforeend',pageHtml());bindPage();restoreDraft();renderPosts();loadCloudPosts()}
  }
  function hideFeedback(){const pg=$('pgFb'),bt=$('btFb');if(pg)pg.classList.remove('on');if(bt)bt.classList.remove('on')}
  function showFeedback(){document.querySelectorAll('#appContent .page').forEach(p=>p.classList.remove('on'));document.querySelectorAll('#appContent .tab').forEach(b=>b.classList.remove('on'));const pg=$('pgFb'),bt=$('btFb');if(pg)pg.classList.add('on');if(bt)bt.classList.add('on');if($('heroTitle'))$('heroTitle').textContent='DF EXTRUSOR PRO';if($('heroSub'))$('heroSub').textContent='FEEDBACK • COMENTÁRIOS PÚBLICOS • SUGESTÕES • MELHORIAS';try{history.replaceState(null,'','./#feedback')}catch(e){}renderPosts();loadCloudPosts();scrollTo(0,0)}

  let score=0;
  function setScore(v){score=Number(v)||0;document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.toggle('on',Number(b.dataset.score)<=score));saveDraft()}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify({type:$('dfFeedbackType')?.value||'Sugestão',score,name:$('dfFeedbackName')?.value||'',text:$('dfFeedbackText')?.value||''}))}catch(e){}}
  function restoreDraft(){try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');if($('dfFeedbackType')&&d.type)$('dfFeedbackType').value=d.type;if($('dfFeedbackName'))$('dfFeedbackName').value=d.name||'';if($('dfFeedbackText'))$('dfFeedbackText').value=d.text||'';if(d.score)setScore(d.score)}catch(e){}}
  function clearDraft(message='Campos limpos.'){score=0;if($('dfFeedbackType'))$('dfFeedbackType').value='Sugestão';if($('dfFeedbackName'))$('dfFeedbackName').value='';if($('dfFeedbackText'))$('dfFeedbackText').value='';document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.remove('on'));try{localStorage.removeItem(DRAFT_KEY)}catch(e){}const st=$('dfFeedbackStatus');if(st){st.textContent=message;st.className='dfFeedbackStatus ok'}}

  async function sendFeedback(){
    const type=$('dfFeedbackType')?.value||'Sugestão',name=String($('dfFeedbackName')?.value||'').trim(),text=String($('dfFeedbackText')?.value||'').trim(),st=$('dfFeedbackStatus');
    if(!text){if(st){st.textContent='Digite sua mensagem antes de publicar.';st.className='dfFeedbackStatus warn'}$('dfFeedbackText')?.focus();return}
    if(st){st.textContent='Publicando comentário...';st.className='dfFeedbackStatus'}
    const result=await publish({type,score,name,text});
    const lines=['💬 *FEEDBACK — DF EXTRUSOR PRO*','','*Tipo:* '+type,'*Nota:* '+(score?score+' / 5':'Não informada'),name?'*Nome:* '+name:'','','*Mensagem:*',text,'','*Versão:* '+(document.querySelector('.dfSystemVer')?.textContent||'DF EXTRUSOR PRO')].filter(Boolean);
    const w=window.open('https://wa.me/'+SUPPORT_PHONE+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
    clearDraft(result.cloud?'Comentário publicado para todos na nuvem. '+(w?'WhatsApp aberto.':''):'Comentário salvo como pendente. Assim que a nuvem estiver conectada ele será sincronizado.');
    if(st&&!result.cloud)st.className='dfFeedbackStatus warn';
    setWall(result.cloud?'Mural sincronizado com a nuvem.':'Aguardando conexão do banco de Feedback no Worker.',result.cloud?'ok':'warn');
  }

  function bindPage(){
    if($('dfFeedbackStars')&&!$('dfFeedbackStars').dataset.bound){$('dfFeedbackStars').dataset.bound='1';$('dfFeedbackStars').addEventListener('click',e=>{const b=e.target.closest('[data-score]');if(b)setScore(b.dataset.score)})}
    ['dfFeedbackType','dfFeedbackName','dfFeedbackText'].forEach(id=>{const el=$(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('input',saveDraft);el.addEventListener('change',saveDraft)}});
    const send=$('dfFeedbackSend');if(send&&!send.dataset.bound){send.dataset.bound='1';send.addEventListener('click',sendFeedback)}
    const clear=$('dfFeedbackClear');if(clear&&!clear.dataset.bound){clear.dataset.bound='1';clear.addEventListener('click',()=>clearDraft())}
    const posts=$('dfFeedbackPosts');if(posts&&!posts.dataset.bound){posts.dataset.bound='1';posts.addEventListener('click',e=>{const b=e.target.closest('[data-feedback-delete]');if(!b)return;if(confirm('Excluir este comentário?'))deletePost(b.dataset.feedbackDelete)})}
  }
  function wrapShow(){const original=window.show;if(typeof original!=='function'||original.dfFeedbackWrapped)return;function wrapped(p){hideFeedback();return original.apply(this,arguments)}wrapped.dfFeedbackWrapped=true;wrapped.dfFeedbackOriginal=original;window.show=wrapped}
  function openFromHash(){if(location.hash==='#feedback')setTimeout(showFeedback,80)}
  function init(){ensureUi();wrapShow();openFromHash();setTimeout(()=>{ensureUi();wrapShow();renderPosts();syncPending()},500);setTimeout(()=>{ensureUi();wrapShow();renderPosts();syncPending()},1500)}
  window.addEventListener('online',()=>{syncPending();loadCloudPosts()});
  window.dfRenderFeedbackPosts=renderPosts;window.dfSyncFeedback=syncPending;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ---- nav-separation-fix.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function onlyHelp(){
    const fb=$('pgFb');if(fb)fb.classList.remove('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.remove('on');
    const help=$('pgAj');if(help)help.classList.add('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.add('on');
  }

  function onlyFeedback(){
    const help=$('pgAj');if(help)help.classList.remove('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.remove('on');
    const fb=$('pgFb');if(fb)fb.classList.add('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.add('on');
  }

  function closeExtras(){
    const help=$('pgAj');if(help)help.classList.remove('on');
    const fb=$('pgFb');if(fb)fb.classList.remove('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.remove('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.remove('on');
  }

  function onClick(e){
    const btn=e.target&&e.target.closest?e.target.closest('button'):null;
    if(!btn)return;
    const id=btn.id||'';
    if(id==='btAj')setTimeout(onlyHelp,0);
    else if(id==='btFb')setTimeout(onlyFeedback,0);
    else if(['btEx','btSa','btCu','btFo'].includes(id))setTimeout(closeExtras,0);
  }

  document.addEventListener('click',onClick,true);

  function syncHash(){
    if(location.hash==='#ajuda')setTimeout(onlyHelp,0);
    else if(location.hash==='#feedback')setTimeout(onlyFeedback,0);
  }

  window.addEventListener('hashchange',syncHash);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncHash);
  else syncHash();
})();


/* ---- quick-access.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfQuickAccessStyle'))return;
    const st=document.createElement('style');
    st.id='dfQuickAccessStyle';
    st.textContent=[
      '#dfQuickAccess{display:none;grid-template-columns:repeat(3,1fr);gap:8px;background:#08090bee;border:1px solid #263244;border-radius:16px;padding:7px;margin:-4px 0 10px;box-shadow:0 10px 26px rgba(0,0,0,.18)}',
      '#dfQuickAccess .dfQuickBtn{width:100%;min-height:42px;margin:0;border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:11px;padding:10px 4px;font:900 10px system-ui;cursor:pointer}',
      '#dfQuickAccess .dfQuickBtn.on{background:#211400;border-color:#f5a000;color:#ffd36a}',
      '#dfQuickAccess .dfQuickBtn:active{transform:translateY(1px)}',
      '#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}',
      '@media(max-width:560px){#dfQuickAccess{gap:7px;padding:7px;margin:-2px 0 9px}#dfQuickAccess .dfQuickBtn{font-size:10px;padding:10px 2px;min-height:40px}#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function getCourseButton(tabs){
    if(!tabs)return null;
    const list=[...tabs.querySelectorAll('button')];
    return list.find(b=>String(b.textContent||'').trim().replace(/\s+/g,' ').toUpperCase()==='CURSO')||null;
  }

  function ensureBox(){
    const app=$('appContent');
    if(!app)return null;
    const brand=app.querySelector('.brand');
    if(!brand)return null;
    let box=$('dfQuickAccess');
    if(!box){
      box=document.createElement('div');
      box.id='dfQuickAccess';
      brand.insertAdjacentElement('afterend',box);
      box.addEventListener('click',function(e){
        const b=e.target.closest('button');
        if(!b)return;
        if(b.id==='btAj'||b.id==='btFb')box.querySelectorAll('.dfQuickBtn').forEach(x=>x.classList.toggle('on',x===b));
      });
    }else if(box.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',box);
    }
    return box;
  }

  function organize(){
    addStyle();
    const app=$('appContent');
    if(!app)return;
    const tabs=app.querySelector('.tabs');
    const box=ensureBox();
    if(!tabs||!box)return;

    const course=getCourseButton(tabs)||[...box.querySelectorAll('button')].find(b=>String(b.textContent||'').trim().toUpperCase()==='CURSO');
    const help=$('btAj');
    const feedback=$('btFb');

    [course,help,feedback].forEach(function(btn){
      if(!btn)return;
      btn.classList.add('dfQuickBtn');
      if(btn.parentNode!==box)box.appendChild(btn);
    });

    box.style.display=box.querySelector('button')?'grid':'none';
  }

  function init(){
    organize();
    requestAnimationFrame(organize);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)organize()});
    window.addEventListener('df-ui-ready',organize);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- favoritos.js ---- */
(function(){
  'use strict';

  const FAV_KEY='df_favoritos_v1';

  function $(id){return document.getElementById(id)}
  function loadFavs(){try{const a=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function saveFavs(a){try{localStorage.setItem(FAV_KEY,JSON.stringify([...new Set(a)]))}catch(e){}}

  const ITEMS={
    'peso-metro':{title:'Peso ideal por metro',page:'ex',find:function(){const pg=$('pgEx');if(!pg)return null;return [...pg.querySelectorAll(':scope > .card')].find(c=>/Peso ideal por metro/i.test(c.textContent||''))||null}},
    'micra-real':{title:'Descobrir micra pelo peso',page:'ex',find:function(){const pg=$('pgEx');if(!pg)return null;return [...pg.querySelectorAll(':scope > .card')].find(c=>/Descobrir micra pelo peso de 1 metro/i.test(c.textContent||''))||null}},
    'peso-bobina':{title:'Peso da bobina pelo raio',page:'ex',find:function(){return $('dfBobinaCard')}}
  };

  function addStyle(){
    if($('dfFavStyle'))return;
    const st=document.createElement('style');
    st.id='dfFavStyle';
    st.textContent=[
      '#dfFavBtn{border-color:#f59e0b!important;color:#fde68a!important}',
      '#dfQuickAccess.dfFavFour{grid-template-columns:repeat(4,1fr)!important}',
      '.dfFavStar{float:right;margin:-2px 0 8px 10px;border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:10px;padding:7px 9px;font-weight:900;font-size:12px;cursor:pointer}',
      '.dfFavStar.on{border-color:#f59e0b;background:#241600;color:#ffd36a}',
      '.dfFavList{display:grid;gap:9px;margin-top:12px}',
      '.dfFavItem{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #334155;background:#0f172a;border-radius:13px;padding:12px}',
      '.dfFavOpen{flex:1;text-align:left;border:0;background:transparent;color:#f8fafc;font-weight:900;font-size:14px;cursor:pointer}',
      '.dfFavRemove{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:900;cursor:pointer}',
      '.dfFavEmpty{border:1px dashed #475569;border-radius:13px;padding:16px;text-align:center;color:#94a3b8;font-size:13px}',
      '@media(max-width:560px){#dfQuickAccess.dfFavFour{grid-template-columns:repeat(2,1fr)!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function ensurePage(){
    const app=$('appContent');
    if(!app||$('pgFav'))return;
    const section=document.createElement('section');
    section.id='pgFav';
    section.className='page';
    section.innerHTML='<div class="card"><span class="tag">Favoritos</span><h2>⭐ Meus favoritos</h2><div class="hint">Adicione as calculadoras que você mais usa para abrir direto sem ficar procurando.</div><div id="dfFavList" class="dfFavList"></div></div>';
    const foot=app.querySelector('.foot');
    if(foot)foot.insertAdjacentElement('beforebegin',section);else app.appendChild(section);
  }

  function ensureButton(){
    const box=$('dfQuickAccess');
    if(!box||$('dfFavBtn'))return;
    box.classList.add('dfFavFour');
    const b=document.createElement('button');
    b.id='dfFavBtn';b.type='button';b.className='dfQuickBtn';b.textContent='⭐ FAVORITOS';
    b.addEventListener('click',showFavorites);
    box.appendChild(b);
  }

  function toggleFavorite(key){
    const a=loadFavs();
    const i=a.indexOf(key);
    if(i>=0)a.splice(i,1);else a.push(key);
    saveFavs(a);refreshStars();render();
  }

  function ensureStars(){
    Object.keys(ITEMS).forEach(function(key){
      const card=ITEMS[key].find();
      if(!card)return;
      let b=card.querySelector('[data-df-fav="'+key+'"]');
      if(!b){
        b=document.createElement('button');b.type='button';b.className='dfFavStar';b.dataset.dfFav=key;
        b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();toggleFavorite(key)});
        const h=card.querySelector('h2');if(h)h.insertAdjacentElement('beforebegin',b);else card.insertBefore(b,card.firstChild);
      }
    });
    refreshStars();
  }

  function refreshStars(){
    const set=new Set(loadFavs());
    document.querySelectorAll('.dfFavStar[data-df-fav]').forEach(function(b){
      const on=set.has(b.dataset.dfFav);b.classList.toggle('on',on);b.textContent=on?'★ FAVORITO':'☆ FAVORITO';
    });
  }

  function showOnly(pageId,buttonId){
    document.querySelectorAll('#appContent .page').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('#appContent .tab,#dfQuickAccess .dfQuickBtn').forEach(b=>b.classList.remove('on'));
    const p=$(pageId);if(p)p.classList.add('on');
    const b=$(buttonId);if(b)b.classList.add('on');
  }

  function openItem(key){
    const item=ITEMS[key];if(!item)return;
    try{if(typeof window.show==='function')window.show(item.page)}catch(e){}
    requestAnimationFrame(function(){
      const card=item.find();if(card){try{card.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){card.scrollIntoView()}}
    });
  }

  function render(){
    const box=$('dfFavList');if(!box)return;
    const favs=loadFavs().filter(k=>ITEMS[k]);
    if(!favs.length){box.innerHTML='<div class="dfFavEmpty">Você ainda não adicionou nenhum favorito. Toque em ☆ FAVORITO nas calculadoras.</div>';return}
    box.innerHTML='';
    favs.forEach(function(key){
      const item=ITEMS[key],row=document.createElement('div');row.className='dfFavItem';
      const open=document.createElement('button');open.type='button';open.className='dfFavOpen';open.textContent='⭐ '+item.title;open.onclick=function(){openItem(key)};
      const rem=document.createElement('button');rem.type='button';rem.className='dfFavRemove';rem.textContent='REMOVER';rem.onclick=function(){toggleFavorite(key)};
      row.append(open,rem);box.appendChild(row);
    });
  }

  function showFavorites(){
    ensurePage();render();showOnly('pgFav','dfFavBtn');
    const h=$('heroTitle'),s=$('heroSub');if(h)h.textContent='DF EXTRUSOR PRO';if(s)s.textContent='FAVORITOS • ACESSO RÁPIDO';
    try{history.replaceState(null,'','./#favoritos')}catch(e){}
    try{scrollTo(0,0)}catch(e){}
  }

  function ensure(){addStyle();ensurePage();ensureButton();ensureStars();render()}
  function init(){
    ensure();
    requestAnimationFrame(ensure);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensure()});
    window.addEventListener('df-ui-ready',ensure);
    if(location.hash==='#favoritos')showFavorites();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* ---- home-swap-menu.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}
  const OTHER_IDS=['pgSa','pgCu','pgFo'];
  let syncing=false;

  function addStyle(){
    if($('dfHomeSwapMenuStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeSwapMenuStyle';
    s.textContent=`
      #dfHomeMenuAnchor{display:none!important}

      /* HOME COMPACTA: Curso / Ajuda / Feedback / Favoritos sao o fim da tela. */
      body.dfHomeCompact #appContent > .page,
      body.dfHomeCompact #appContent > .foot{display:none!important}
      body.dfHomeCompact #dfQuickAccess ~ *{display:none!important}
      body.dfHomeCompact #dfQuickAccess{margin-bottom:0!important}
      body.dfHomeCompact #appContent>.tabs{margin:0 0 12px!important}
      body.dfHomeCompact #dfQuickAccess{margin-top:12px!important}

      /* Dentro dos modulos: sem a seta redonda antiga. */
      body.dfSectionMode #dfSectionBack{display:none!important}
      body.dfSectionMode #dfSectionHeader{justify-content:center!important;gap:0!important}
      body.dfSectionMode #dfSectionTitle{width:100%!important;margin:0!important;text-align:center!important}

      /* MENU fica sempre visivel no primeiro lugar da barra interna. */
      .dfPersistentMenuBtn{
        position:sticky!important;
        left:0!important;
        z-index:20!important;
        flex:0 0 auto!important;
        min-width:92px!important;
        min-height:46px!important;
        padding:0 12px!important;
        border:1px solid #f5a000!important;
        border-radius:12px!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:10px 0 16px rgba(8,11,19,.92)!important;
        font-weight:950!important;
        font-size:10.5px!important;
        line-height:1.1!important;
        white-space:nowrap!important;
        text-transform:uppercase!important;
      }
      .dfPersistentMenuBtn:active{transform:scale(.96)!important;background:#342000!important}

      .dfOtherSoloNav{display:flex!important;gap:7px;overflow-x:auto;margin:0 0 14px;padding:3px 1px 10px}

      @media(max-width:560px){
        body.dfHomeCompact #appContent>.tabs{margin:0 0 10px!important;gap:7px!important}
        body.dfHomeCompact #dfQuickAccess{margin-top:10px!important;margin-bottom:0!important}
        .dfPersistentMenuBtn{min-width:88px!important;padding:0 10px!important;font-size:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureAnchor(app,tabs){
    let a=$('dfHomeMenuAnchor');
    if(a)return a;
    a=document.createElement('div');
    a.id='dfHomeMenuAnchor';
    a.setAttribute('aria-hidden','true');
    tabs.parentNode.insertBefore(a,tabs);
    return a;
  }

  function swapHome(){
    const app=$('appContent');
    if(!app)return;
    const brand=app.querySelector(':scope > .brand')||app.querySelector('.brand');
    const tabs=app.querySelector(':scope > .tabs')||app.querySelector('.tabs');
    const quick=$('dfQuickAccess');
    if(!brand||!tabs||!quick)return;

    const anchor=ensureAnchor(app,tabs);
    if(tabs.previousElementSibling!==brand)brand.insertAdjacentElement('afterend',tabs);
    if(anchor.parentNode&&quick.nextElementSibling!==anchor)anchor.parentNode.insertBefore(quick,anchor);
  }

  function sectionActive(){
    const app=$('appContent');
    if(!app)return false;
    return document.body.classList.contains('dfSectionMode') && !!app.querySelector(':scope > .page.dfSectionSelected');
  }

  function restoreMarked(){
    document.querySelectorAll('[data-df-home-cut="1"]').forEach(function(el){
      el.style.removeProperty('display');
      delete el.dataset.dfHomeCut;
    });
  }

  function compactHome(){
    const app=$('appContent');
    if(!app)return;
    const home=!sectionActive();
    document.body.classList.toggle('dfHomeCompact',home);

    if(!home){restoreMarked();return}

    app.querySelectorAll('.page,.foot').forEach(function(el){
      el.dataset.dfHomeCut='1';
      el.style.setProperty('display','none','important');
    });

    const quick=$('dfQuickAccess');
    if(quick&&quick.parentElement){
      let el=quick.nextElementSibling;
      while(el){
        el.dataset.dfHomeCut='1';
        el.style.setProperty('display','none','important');
        el=el.nextElementSibling;
      }
    }
  }

  function focused(page){
    return !!(page&&document.body.classList.contains('dfSectionMode')&&page.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=$('dfSectionBack');
    if(back){back.click();setTimeout(syncAll,60);return}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(p=>p.classList.remove('dfSectionSelected'));
    setTimeout(syncAll,20);
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function makeMenuButton(){
    const b=document.createElement('button');
    b.type='button';
    b.className='dfPersistentMenuBtn';
    b.dataset.dfPersistentMenu='1';
    b.textContent='← MENU';
    b.setAttribute('aria-label','Voltar para a tela principal');
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      goHome();
    });
    return b;
  }

  function restoreLegacyFirst(nav){
    if(!nav)return;
    const firstTopic=nav.querySelector('.dfAutoTopic');
    if(!firstTopic)return;
    const original=firstTopic.dataset.dfOriginalLabel||firstTopic.dataset.dfModuleOriginalLabel||'';
    if(original&&String(firstTopic.textContent||'').trim().toUpperCase().includes('VOLTAR'))firstTopic.textContent=original;
    firstTopic.classList.remove('dfOtherBackTab','dfModuleBackTab');
    if(original)firstTopic.setAttribute('aria-label',original);
  }

  function ensureMenu(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    const oldSolo=page.querySelector(':scope > .dfOtherSoloNav');

    if(!focused(page)){
      if(oldSolo)oldSolo.remove();
      if(nav)nav.querySelectorAll(':scope > .dfPersistentMenuBtn').forEach(b=>b.remove());
      return;
    }

    if(!nav){
      let solo=oldSolo;
      if(!solo){
        solo=document.createElement('div');
        solo.className='dfOtherSoloNav';
        solo.appendChild(makeMenuButton());
        page.insertBefore(solo,page.firstChild);
      }
      return;
    }

    if(oldSolo)oldSolo.remove();
    restoreLegacyFirst(nav);

    let menu=nav.querySelector(':scope > .dfPersistentMenuBtn');
    if(!menu){menu=makeMenuButton();nav.insertBefore(menu,nav.firstChild)}
    else if(nav.firstElementChild!==menu)nav.insertBefore(menu,nav.firstChild);
  }

  function syncOthers(){OTHER_IDS.forEach(id=>ensureMenu($(id)))}

  function syncAll(){
    if(syncing)return;
    syncing=true;
    try{
      addStyle();
      restoreMarked();
      swapHome();
      compactHome();
      syncOthers();
    }finally{syncing=false}
  }

  function init(){
    syncAll();
    requestAnimationFrame(syncAll);
    setTimeout(syncAll,120);
    setTimeout(syncAll,500);
    setTimeout(syncAll,1200);

    const app=$('appContent')||document.body;
    if(app&&!app.dataset.dfHomeSwapObserver){
      app.dataset.dfHomeSwapObserver='1';
      const mo=new MutationObserver(function(){requestAnimationFrame(syncAll)});
      mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    const bodyMo=new MutationObserver(function(){requestAnimationFrame(syncAll)});
    bodyMo.observe(document.body,{attributes:true,attributeFilter:['class']});

    window.addEventListener('df-ui-ready',function(){setTimeout(syncAll,80)});
    document.addEventListener('click',function(){setTimeout(syncAll,80)},true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(syncAll,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* ---- help-inline-assistant.js ---- */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  let speaking=false;
  let parts=[];
  let partIndex=0;

  const topics=[
    {
      key:'inicio',
      title:'Visão geral',
      text:'O DF EXTRUSOR PRO reúne as principais ferramentas para extrusão de filme plástico, sacolas, custos, formulação, bobinas, correções de micra, produção, PDF e ordem de produção.'
    },
    {
      key:'extrusao',
      title:'Extrusão',
      text:'Na Extrusão você informa largura do filme, comprimento quando necessário, micra desejada e densidade. O sistema calcula o peso ideal por metro. Também é possível descobrir a micra real pelo peso medido de um metro, calcular bobina, corrigir micra pelo puxador ou pela massa e aumentar ou diminuir a produção mantendo uma relação de referência entre massa e puxador.'
    },
    {
      key:'sacolas',
      title:'Sacolas',
      text:'Na área Sacolas você informa largura, comprimento, densidade e desconto de alça ou recorte. Logo abaixo fica o cálculo de micra para peso do saco. Na outra aba você informa a quantidade de sacos para calcular o peso do rolo. As medidas ficam organizadas para facilitar o uso na produção.'
    },
    {
      key:'custo',
      title:'Custo',
      text:'Na área Custo você calcula o custo do produto, preço de venda, margem e lucro. O sistema pode usar dados vindos de outras partes do aplicativo ou valores digitados manualmente, conforme a tela disponível.'
    },
    {
      key:'formulacao',
      title:'Formulação',
      text:'Na Formulação você cadastra os materiais, informa as porcentagens e a quantidade total que deseja produzir. O sistema calcula automaticamente quantos quilos usar de cada matéria prima. A formulação deve fechar em cem por cento para a mistura ficar correta.'
    },
    {
      key:'op',
      title:'OP e PDF',
      text:'A Ordem de Produção e os relatórios usam os dados preenchidos no sistema para organizar as informações de produção. A OP pode reunir formulação, medidas, micra, materiais, porcentagens, quantidade e campos de acompanhamento da produção. Os relatórios podem ser visualizados e impressos conforme as funções disponíveis no aplicativo.'
    },
    {
      key:'favoritos',
      title:'Favoritos e ajuda',
      text:'Use Favoritos para acessar mais rápido as funções que você usa com frequência. Use Ajuda sempre que quiser consultar este guia ou ouvir as explicações em voz alta.'
    }
  ];

  function canSpeak(){
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function addStyle(){
    if($('dfInlineHelpStyle'))return;
    const s=document.createElement('style');
    s.id='dfInlineHelpStyle';
    s.textContent=`
      #dfInlineHelp{
        grid-column:1/-1!important;
        display:none;
        margin-top:3px;
        padding:15px;
        border:1px solid #334155;
        border-radius:16px;
        background:linear-gradient(180deg,#0e1928,#0a111d);
        box-shadow:0 16px 36px rgba(0,0,0,.28);
        text-align:left;
      }
      #dfInlineHelp.open{display:block!important}
      #dfInlineHelp .dfHelpHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      #dfInlineHelp .dfHelpTitle{font-size:20px;font-weight:950;color:#fff;line-height:1.1}
      #dfInlineHelp .dfHelpSub{margin-top:5px;color:#94a3b8;font-size:12px;line-height:1.4}
      #dfInlineHelp .dfHelpClose{flex:0 0 auto;width:36px;height:36px;border:1px solid #334155;border-radius:10px;background:#111827;color:#e5eef8;font-size:19px;font-weight:900}
      #dfInlineHelp .dfVoiceBox{border:1px solid #f5a000;border-radius:14px;background:#211400;padding:12px;margin:11px 0}
      #dfInlineHelp .dfVoiceTitle{font-size:14px;font-weight:950;color:#ffd36a;margin-bottom:5px}
      #dfInlineHelp .dfVoiceText{font-size:12px;color:#e5e7eb;line-height:1.4;margin-bottom:10px}
      #dfInlineHelp .dfVoiceActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #dfInlineHelp .dfVoiceBtn{min-height:42px;border-radius:11px;border:1px solid #16a34a;background:#0c321c;color:#86efac;font-weight:950;font-size:11px}
      #dfInlineHelp .dfVoiceBtn.stop{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}
      #dfInlineHelp .dfHelpStatus{margin-top:8px;min-height:18px;font-size:11px;font-weight:800;color:#94a3b8}
      #dfInlineHelp .dfHelpTopics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
      #dfInlineHelp .dfHelpTopic{border:1px solid #334155;border-radius:12px;background:#111827;padding:11px;color:#e5eef8;text-align:left;min-height:84px}
      #dfInlineHelp .dfHelpTopic b{display:block;color:#ffd36a;font-size:12px;margin-bottom:5px}
      #dfInlineHelp .dfHelpTopic span{display:block;color:#cbd5e1;font-size:10.5px;line-height:1.35;font-weight:600}
      #dfInlineHelp .dfHelpTopic:active{transform:scale(.985)}
      @media(max-width:560px){
        #dfInlineHelp{padding:13px 11px}
        #dfInlineHelp .dfVoiceActions{grid-template-columns:1fr 1fr}
        #dfInlineHelp .dfHelpTopics{grid-template-columns:1fr}
        #dfInlineHelp .dfHelpTopic{min-height:0}
      }
    `;
    document.head.appendChild(s);
  }

  function panelHtml(){
    const topicHtml=topics.map(t=>
      '<button type="button" class="dfHelpTopic" data-help-topic="'+esc(t.key)+'"><b>'+esc(t.title)+'</b><span>'+esc(t.text)+'</span></button>'
    ).join('');

    return '<div class="dfHelpHead">'+
      '<div><div class="dfHelpTitle">🔊 Assistente de voz</div><div class="dfHelpSub">Explica como usar o DF EXTRUSOR PRO. Você pode ouvir tudo ou tocar em uma parte específica.</div></div>'+
      '<button type="button" class="dfHelpClose" id="dfInlineHelpClose" aria-label="Fechar ajuda">×</button>'+
      '</div>'+
      '<div class="dfVoiceBox">'+
        '<div class="dfVoiceTitle">ASSISTENTE DF</div>'+
        '<div class="dfVoiceText">Toque em OUVIR TUDO para receber uma explicação completa do aplicativo em voz alta.</div>'+
        '<div class="dfVoiceActions"><button type="button" id="dfInlineHelpReadAll" class="dfVoiceBtn">🔊 OUVIR TUDO</button><button type="button" id="dfInlineHelpStop" class="dfVoiceBtn stop">⏹ PARAR</button></div>'+
        '<div id="dfInlineHelpStatus" class="dfHelpStatus">Pronto para ajudar.</div>'+
      '</div>'+
      '<div class="dfHelpTopics">'+topicHtml+'</div>';
  }

  function ensurePanel(){
    addStyle();
    const box=$('dfQuickAccess');
    if(!box)return null;
    let p=$('dfInlineHelp');
    if(!p){
      p=document.createElement('div');
      p.id='dfInlineHelp';
      p.setAttribute('aria-hidden','true');
      p.innerHTML=panelHtml();
      box.appendChild(p);

      $('dfInlineHelpClose')?.addEventListener('click',function(){closePanel()});
      $('dfInlineHelpReadAll')?.addEventListener('click',function(){readAll()});
      $('dfInlineHelpStop')?.addEventListener('click',function(){stopSpeak('Leitura parada.')});
      p.addEventListener('click',function(e){
        const b=e.target.closest('[data-help-topic]');
        if(!b)return;
        const topic=topics.find(t=>t.key===b.dataset.helpTopic);
        if(topic)readTopic(topic);
      });
    }else if(p.parentElement!==box){
      box.appendChild(p);
    }
    return p;
  }

  function setStatus(text,kind){
    const el=$('dfInlineHelpStatus');
    if(!el)return;
    el.textContent=text;
    el.style.color=kind==='ok'?'#86efac':kind==='bad'?'#fca5a5':kind==='warn'?'#fbbf24':'#94a3b8';
  }

  function pickVoice(){
    try{
      const vs=speechSynthesis.getVoices()||[];
      return vs.find(v=>/pt-BR/i.test(v.lang))||vs.find(v=>/^pt/i.test(v.lang))||null;
    }catch(e){return null}
  }

  function speakNext(){
    if(!speaking)return;
    if(partIndex>=parts.length){
      speaking=false;
      setStatus('Explicação finalizada.','ok');
      return;
    }
    const u=new SpeechSynthesisUtterance(parts[partIndex]);
    u.lang='pt-BR';
    u.rate=.92;
    u.pitch=1;
    const v=pickVoice();
    if(v)u.voice=v;
    u.onstart=function(){setStatus('Assistente falando '+(partIndex+1)+' de '+parts.length+'...','ok')};
    u.onend=function(){partIndex++;setTimeout(speakNext,140)};
    u.onerror=function(){speaking=false;setStatus('Não consegui continuar a leitura. Toque em ouvir novamente.','bad')};
    try{
      speechSynthesis.speak(u);
      setTimeout(function(){try{speechSynthesis.resume()}catch(e){}},200);
    }catch(e){
      speaking=false;
      setStatus('Este navegador não liberou a voz.','bad');
    }
  }

  function startParts(list){
    if(!canSpeak()){
      setStatus('Este aparelho ou navegador não suporta leitura em voz alta.','bad');
      return;
    }
    try{speechSynthesis.cancel()}catch(e){}
    parts=list.filter(Boolean);
    partIndex=0;
    speaking=true;
    setStatus('Preparando a explicação...','warn');
    setTimeout(speakNext,100);
  }

  function readAll(){
    startParts([
      'Bem vindo ao assistente do DF EXTRUSOR PRO. Vou explicar as principais partes do aplicativo.'
    ].concat(topics.map(t=>t.title+'. '+t.text)).concat([
      'Fim da explicação. Você pode abrir a ajuda novamente e tocar em qualquer assunto para ouvir somente aquela parte.'
    ]));
  }

  function readTopic(topic){
    startParts([topic.title+'. '+topic.text]);
  }

  function stopSpeak(msg){
    speaking=false;
    try{if(canSpeak())speechSynthesis.cancel()}catch(e){}
    if(msg)setStatus(msg,'warn');
  }

  function openPanel(){
    const p=ensurePanel();
    if(!p)return;
    p.classList.add('open');
    p.setAttribute('aria-hidden','false');
    const help=$('btAj');
    if(help)help.classList.add('on');
    requestAnimationFrame(function(){
      try{p.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
    });
  }

  function closePanel(){
    const p=$('dfInlineHelp');
    if(p){p.classList.remove('open');p.setAttribute('aria-hidden','true')}
    const help=$('btAj');
    if(help)help.classList.remove('on');
    stopSpeak();
  }

  function togglePanel(){
    const p=ensurePanel();
    if(!p)return;
    if(p.classList.contains('open'))closePanel();else openPanel();
  }

  function interceptHelp(e){
    const b=e.target&&e.target.closest?e.target.closest('#btAj'):null;
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    togglePanel();
  }

  function init(){
    addStyle();
    ensurePanel();
    document.addEventListener('click',interceptHelp,true);
    window.addEventListener('df-ui-ready',function(){setTimeout(ensurePanel,80)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(ensurePanel,80)});
    try{if(canSpeak())speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- home-whatsapp-feedback-inline.js ---- */
(function(){
  'use strict';

  const WHATSAPP='5547992825006';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomeContactFeedbackStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeContactFeedbackStyle';
    s.textContent=`
      #dfFavBtn.dfWhatsAppHomeBtn{
        border-color:#16a34a!important;
        background:#0b2517!important;
        color:#86efac!important;
        white-space:normal!important;
        line-height:1.18!important;
      }
      #dfFavBtn.dfWhatsAppHomeBtn .dfWaTitle{display:block;font-weight:950;font-size:11px}
      #dfFavBtn.dfWhatsAppHomeBtn .dfWaNumber{display:block;margin-top:3px;font-weight:800;font-size:9.5px;color:#bbf7d0}

      #dfInlineFeedback{
        grid-column:1/-1!important;
        display:none;
        margin-top:3px;
        padding:15px;
        border:1px solid #334155;
        border-radius:16px;
        background:linear-gradient(180deg,#0e1928,#0a111d);
        box-shadow:0 16px 36px rgba(0,0,0,.28);
        text-align:left;
      }
      #dfInlineFeedback.open{display:block!important}
      #dfInlineFeedback .dfInlineFeedbackHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #dfInlineFeedback .dfInlineFeedbackTitle{font-size:20px;font-weight:950;color:#fff;line-height:1.1}
      #dfInlineFeedback .dfInlineFeedbackSub{margin-top:5px;color:#94a3b8;font-size:12px;line-height:1.4}
      #dfInlineFeedbackClose{flex:0 0 auto;width:36px;height:36px;border:1px solid #334155;border-radius:10px;background:#111827;color:#e5eef8;font-size:19px;font-weight:900}
      #dfInlineFeedbackBody>.card{margin:0 0 12px!important}
      #dfInlineFeedbackBody>.card:last-child{margin-bottom:0!important}
      @media(max-width:560px){#dfInlineFeedback{padding:13px 11px}}
    `;
    document.head.appendChild(s);
  }

  function openWhatsApp(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    const url='https://wa.me/'+WHATSAPP;
    try{
      const w=window.open(url,'_blank','noopener,noreferrer');
      if(!w)location.href=url;
    }catch(err){location.href=url}
  }

  function setupWhatsApp(){
    const b=$('dfFavBtn');
    if(!b)return;
    if(!b.dataset.dfWhatsAppBound){
      b.dataset.dfWhatsAppBound='1';
      b.addEventListener('click',openWhatsApp,true);
    }
    b.classList.add('dfWhatsAppHomeBtn');
    b.setAttribute('aria-label','Abrir WhatsApp da DF Manutenção e Consultoria');
    b.innerHTML='<span class="dfWaTitle">📱 WHATSAPP</span><span class="dfWaNumber">47 99282-5006</span>';
  }

  function closeHelp(){
    const p=$('dfInlineHelp');
    if(p){p.classList.remove('open');p.setAttribute('aria-hidden','true')}
    const b=$('btAj');
    if(b)b.classList.remove('on');
    try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  }

  function ensureFeedbackPanel(){
    const quick=$('dfQuickAccess');
    const page=$('pgFb');
    if(!quick||!page)return null;

    let panel=$('dfInlineFeedback');
    if(!panel){
      panel=document.createElement('div');
      panel.id='dfInlineFeedback';
      panel.setAttribute('aria-hidden','true');
      panel.innerHTML='<div class="dfInlineFeedbackHead"><div><div class="dfInlineFeedbackTitle">💬 Feedback</div><div class="dfInlineFeedbackSub">Envie sugestão, melhoria ou problema sem sair da tela principal.</div></div><button type="button" id="dfInlineFeedbackClose" aria-label="Fechar feedback">×</button></div><div id="dfInlineFeedbackBody"></div>';
      quick.appendChild(panel);
      $('dfInlineFeedbackClose')?.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();closeFeedback()});
    }else if(panel.parentElement!==quick){
      quick.appendChild(panel);
    }

    const body=$('dfInlineFeedbackBody');
    if(body){
      Array.from(page.children).forEach(function(el){
        if(el.classList&&el.classList.contains('card'))body.appendChild(el);
      });
    }
    return panel;
  }

  function openFeedback(){
    const panel=ensureFeedbackPanel();
    if(!panel)return;
    closeHelp();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    const b=$('btFb');
    if(b)b.classList.add('on');
    requestAnimationFrame(function(){
      try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){panel.scrollIntoView()}
    });
  }

  function closeFeedback(){
    const panel=$('dfInlineFeedback');
    if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true')}
    const b=$('btFb');
    if(b)b.classList.remove('on');
  }

  function setupFeedbackButton(){
    const b=$('btFb');
    if(!b)return;
    if(!b.dataset.dfInlineFeedbackBound){
      b.dataset.dfInlineFeedbackBound='1';
      b.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        const panel=ensureFeedbackPanel();
        if(panel&&panel.classList.contains('open'))closeFeedback();
        else openFeedback();
      },true);
    }
  }

  function sync(){
    addStyle();
    setupWhatsApp();
    ensureFeedbackPanel();
    setupFeedbackButton();
  }

  function init(){
    sync();
    requestAnimationFrame(sync);
    setTimeout(sync,120);
    setTimeout(sync,500);
    setTimeout(sync,1200);

    const app=$('appContent')||document.body;
    if(app&&!app.dataset.dfContactFeedbackObserver){
      app.dataset.dfContactFeedbackObserver='1';
      new MutationObserver(function(){requestAnimationFrame(sync)}).observe(app,{childList:true,subtree:true});
    }

    document.addEventListener('click',function(e){
      const help=e.target.closest&&e.target.closest('#btAj');
      if(help)closeFeedback();
    },true);
    window.addEventListener('df-ui-ready',function(){setTimeout(sync,80)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(sync,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- course-lock.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfCourseLockStyle'))return;
    const st=document.createElement('style');
    st.id='dfCourseLockStyle';
    st.textContent=[
      '.dfCourseLocked{opacity:.58!important;filter:grayscale(.35);cursor:not-allowed!important;position:relative}',
      '.dfCourseLocked::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(245,158,11,.28)}'
    ].join('');
    document.head.appendChild(st);
  }

  function isCourseTarget(el){
    if(!el)return false;
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
    const href=String(el.getAttribute&&el.getAttribute('href')||'').toLowerCase();
    const onclick=String(el.getAttribute&&el.getAttribute('onclick')||'').toLowerCase();
    return href.includes('curso.html')||onclick.includes('curso.html')||text==='CURSO'||text==='🔒 CURSO'||text.includes('CONHECER CURSO DE EXTRUSÃO');
  }

  function lockOne(el){
    if(!el||el.dataset.dfCourseLocked==='1')return;
    el.dataset.dfCourseLocked='1';
    el.classList.add('dfCourseLocked');
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
    if(text.toUpperCase()==='CURSO')el.textContent='🔒 CURSO';
    else if(text.toUpperCase()==='CONHECER CURSO DE EXTRUSÃO')el.textContent='🔒 CONHECER CURSO DE EXTRUSÃO';
    if(el.hasAttribute('onclick')){el.dataset.dfCourseOldOnclick=el.getAttribute('onclick')||'';el.removeAttribute('onclick')}
    if(el.tagName==='A'&&el.hasAttribute('href')){el.dataset.dfCourseOldHref=el.getAttribute('href')||'';el.setAttribute('href','#')}
    el.setAttribute('aria-disabled','true');
    el.title='Curso bloqueado temporariamente';
  }

  function lockAll(){
    addStyle();
    document.querySelectorAll('button,a').forEach(function(el){if(isCourseTarget(el))lockOne(el)});
  }

  function blockClick(e){
    const el=e.target&&e.target.closest?e.target.closest('button,a'):null;
    if(!el||!isCourseTarget(el))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    alert('🔒 CURSO BLOQUEADO\n\nEssa área ainda está bloqueada e será liberada depois.');
  }

  function init(){
    lockAll();
    requestAnimationFrame(lockAll);
    document.addEventListener('click',blockClick,true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)lockAll()});
    window.addEventListener('df-ui-ready',lockAll);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();


/* ---- formula-bottom-order.js ---- */
(function(){
  'use strict';

  function cardByText(pg,text){
    const cards=[...pg.querySelectorAll(':scope > .card')];
    return cards.find(function(card){return String(card.textContent||'').replace(/\s+/g,' ').includes(text)})||null;
  }

  let arranging=false;
  let observer=null;

  function arrange(){
    if(arranging)return false;
    const pg=document.getElementById('pgFo');if(!pg)return false;
    const backup=document.getElementById('dfCloudBackupCard')||cardByText(pg,'Backup na nuvem');
    const vendedor=document.getElementById('dfVendedorCard')||cardByText(pg,'WhatsApp / PDF ao salvar');
    const wanted=[backup,vendedor].filter(function(el){return el&&el.parentNode===pg});
    if(!wanted.length)return false;
    const children=[...pg.children],tail=children.slice(-wanted.length);
    if(wanted.every(function(el,i){return tail[i]===el}))return wanted.length===2;
    arranging=true;
    try{wanted.forEach(function(el){pg.appendChild(el)})}finally{arranging=false}
    return wanted.length===2;
  }

  function watchUntilReady(){
    const pg=document.getElementById('pgFo');
    if(!pg||observer)return;
    if(arrange())return;
    observer=new MutationObserver(function(){
      if(arrange()&&observer){observer.disconnect();observer=null}
    });
    observer.observe(pg,{childList:true});
  }

  function init(){
    watchUntilReady();
    document.addEventListener('click',function(ev){
      const el=ev.target&&ev.target.closest?ev.target.closest('#btFo,[onclick*="show(\'fo\')"]'):null;
      if(el)arrange();
    },true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)arrange()});
    window.addEventListener('df-ui-ready',arrange);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* ---- machine-recipe.js ---- */
(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfMachineRecipeStyle'))return;
    const st=document.createElement('style');
    st.id='dfMachineRecipeStyle';
    st.textContent=[
      '#dfRecipeMiniBtn{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;margin-left:8px;min-width:90px;height:34px;padding:0 14px;border:1px solid #7c3aed;background:linear-gradient(180deg,#141226,#0d1020);color:#ddd6fe;border-radius:12px;font:900 12px system-ui;letter-spacing:.02em;box-shadow:0 8px 20px rgba(0,0,0,.18);cursor:pointer}',
      '#dfRecipeMiniBtn:active{transform:translateY(1px)}',
      '#dfRecipeMiniBtn::before{content:"🔒";margin-right:6px;font-size:12px}',
      '#dfRecipePreview{position:fixed;inset:0;z-index:99998;background:#080b13;overflow:auto;padding:18px 14px 40px}',
      '#dfRecipePreview[hidden]{display:none!important}',
      '.dfRecipeWrap{max-width:760px;margin:auto}',
      '.dfRecipeTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}',
      '.dfRecipeBack{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:11px;padding:10px 14px;font-weight:900;cursor:pointer}',
      '.dfRecipeLocked{display:inline-flex;align-items:center;gap:6px;border:1px solid #7c3aed;background:#24133f;color:#ddd6fe;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900}',
      '.dfRecipeHero{background:linear-gradient(180deg,#141226,#0d1020);border:1px solid #7c3aed;border-radius:18px;padding:16px;margin-bottom:14px}',
      '.dfRecipeHero h2{margin:8px 0 6px}',
      '.dfRecipeHint{color:#a5b4fc;font-size:13px;line-height:1.45}',
      '.dfRecipeCard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:14px}',
      '.dfRecipeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dfRecipeCard label{display:block;color:#cbd5e1;font-size:13px;margin:11px 0 6px}',
      '.dfRecipeCard input,.dfRecipeCard textarea{width:100%;box-sizing:border-box;border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:12px;font:600 14px system-ui;opacity:.72;cursor:not-allowed}',
      '.dfRecipeCard textarea{min-height:88px;resize:none}',
      '.dfRecipeActions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}',
      '.dfRecipeActions button{width:100%;border:1px solid #475569;background:#111827;color:#94a3b8;border-radius:12px;padding:12px 8px;font-weight:900;cursor:not-allowed;opacity:.65}',
      '.dfRecipeNotice{border:1px dashed #8b5cf6;background:#1d1433;color:#e9d5ff;border-radius:14px;padding:13px;font-size:12px;line-height:1.5;font-weight:800}',
      '@media(max-width:560px){#dfRecipeMiniBtn{min-width:84px;height:32px;padding:0 12px;font-size:11px;margin-left:6px}.dfRecipeGrid,.dfRecipeActions{grid-template-columns:1fr}.dfRecipeTop{align-items:flex-start}}'
    ].join('');
    document.head.appendChild(st);
  }

  function field(label,placeholder){return '<div><label>'+label+'</label><input disabled type="text" placeholder="'+placeholder+'"></div>'}

  function previewHtml(){
    return '<div id="dfRecipePreview" hidden><div class="dfRecipeWrap"><div class="dfRecipeTop"><button id="dfRecipeBack" class="dfRecipeBack" type="button">← VOLTAR</button><span class="dfRecipeLocked">🔒 EM DESENVOLVIMENTO</span></div><div class="dfRecipeHero"><span class="tag">Receita de máquina</span><h2>⚙️ Receita da extrusora</h2><div class="dfRecipeHint">Prévia da função para salvar a regulagem completa de cada produto e repetir o setup depois. Ainda está bloqueada para os usuários.</div></div><div class="dfRecipeCard"><h2>Identificação da receita</h2><div class="dfRecipeGrid">'+
      field('Nome da máquina','Ex.: Extrusora 01')+field('Produto / nome da receita','Ex.: Saco 75 x 105')+field('Material / formulação','Ex.: PEAD + Linear')+field('Largura do filme (cm)','Ex.: 75')+field('Micra — parede dupla (µm)','Ex.: 45')+field('Peso por metro (g/m)','Ex.: 48')+
      '</div></div><div class="dfRecipeCard"><h2>Regulagem da máquina</h2><div class="dfRecipeGrid">'+
      field('RPM motor de massa','Ex.: 1000')+field('RPM puxador','Ex.: 800')+field('RPM anel de ar','Ex.: 1700')+field('Temperatura zona 1 (°C)','Ex.: 150')+field('Temperatura zona 2 (°C)','Ex.: 165')+field('Temperatura zona 3 (°C)','Ex.: 175')+field('Temperatura zona 4 (°C)','Ex.: 180')+field('Temperatura cabeçote / matriz (°C)','Ex.: 180')+
      '</div><label>Observações da regulagem</label><textarea disabled placeholder="Ex.: altura do balão, posição do banana, pressão, telas, comportamento do filme..."></textarea><div class="dfRecipeActions"><button disabled type="button">SALVAR RECEITA</button><button disabled type="button">ABRIR RECEITAS</button></div></div><div class="dfRecipeNotice">🔒 <b>FUNÇÃO BLOQUEADA:</b> esta tela é somente uma prévia. Nenhum campo pode ser alterado e nada é salvo enquanto terminamos e conferimos juntos o funcionamento.</div></div></div>';
  }

  function closePreview(){const p=$('dfRecipePreview');if(p)p.hidden=true;document.body.style.overflow=''}
  function openPreview(){ensurePreview();const p=$('dfRecipePreview');if(!p)return;p.hidden=false;p.scrollTop=0;document.body.style.overflow='hidden'}
  function ensurePreview(){addStyle();if($('dfRecipePreview'))return;document.body.insertAdjacentHTML('beforeend',previewHtml());const back=$('dfRecipeBack');if(back)back.onclick=closePreview}
  function removeOldCard(){const old=$('dfMachineRecipeCard');if(old)old.remove()}
  function firstExtrusaoCard(){const pg=$('pgEx');return pg?(pg.querySelector(':scope > .card')||null):null}

  function ensureRecipeButton(){
    addStyle();removeOldCard();ensurePreview();
    const card=firstExtrusaoCard();if(!card)return;
    const tag=card.querySelector('.tag');if(!tag)return;
    let btn=$('dfRecipeMiniBtn');
    if(!btn){
      btn=document.createElement('button');btn.id='dfRecipeMiniBtn';btn.type='button';btn.textContent='RECEITA';btn.title='Abrir prévia da Receita da extrusora';
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();openPreview()});
    }
    if(tag.nextElementSibling!==btn)tag.insertAdjacentElement('afterend',btn);
  }

  function init(){
    ensureRecipeButton();
    requestAnimationFrame(ensureRecipeButton);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('dfRecipePreview')&&!$('dfRecipePreview').hidden)closePreview()});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensureRecipeButton()});
    window.addEventListener('df-ui-ready',ensureRecipeButton);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* ---- extrusao-tabs.js ---- */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let current='extrusao';
  let tries=0;
  const groups=[
    {id:'extrusao',label:'EXTRUSÃO'},
    {id:'bobina',label:'BOBINA'},
    {id:'micra',label:'CORRIGIR MICRA'},
    {id:'puxador',label:'PUXADOR / MASSA'},
    {id:'producao',label:'PRODUÇÃO +%'}
  ];

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function classify(card){
    if(card.id==='dfBobinaCard')return 'bobina';
    const t=norm(card.textContent);
    if(t.includes('peso da bobina')||t.includes('altura enrolada')||t.includes('diametro do tubete'))return 'bobina';
    if(t.includes('aumentar / diminuir producao')||t.includes('calcular nova producao')||t.includes('producao estimada')||t.includes('% para aumentar'))return 'producao';
    if(t.includes('corrigir pelo puxador')||t.includes('corrigir pela massa')||t.includes('puxador recomendado')||t.includes('motor de massa recomendado')||t.includes('rpm atual do motor de massa'))return 'puxador';
    if(t.includes('descobrir micra')||t.includes('micra real')||t.includes('peso medido de 1 metro'))return 'micra';
    if(t.includes('peso ideal por metro')||t.includes('peso ideal de 1 metro'))return 'extrusao';
    return 'extrusao';
  }

  function style(){
    if($('dfExTabsStyle'))return;
    const s=document.createElement('style');
    s.id='dfExTabsStyle';
    s.textContent=`
      #dfExTabs{display:none;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px;position:relative;z-index:5}
      body.dfSectionMode #pgEx.dfSectionSelected>#dfExTabs{display:flex!important}
      #dfExTabs::-webkit-scrollbar{display:none}
      .dfExTab{flex:0 0 auto;min-width:82px;min-height:46px;padding:0 10px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;letter-spacing:.15px;line-height:1.1;white-space:normal;text-transform:uppercase}
      .dfExTab.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset}
      body.dfSectionMode #pgEx.dfExTabsReady>.card[data-df-ex-group]{display:none!important}
      body.dfSectionMode #pgEx.dfExTabsReady>.card[data-df-ex-group].dfExVisible{display:block!important}
      body.dfHomeMode #pgEx>.card{display:block!important}
      body.dfSectionMode #pgEx .card{background:linear-gradient(180deg,rgba(12,28,46,.96),rgba(6,14,24,.96))!important;border-color:#29405a!important;border-radius:18px!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}
      body.dfSectionMode #pgEx .card>.tag{display:none!important}
      body.dfSectionMode #pgEx h2{font-size:24px!important;line-height:1.1!important;margin-top:2px!important}
      body.dfSectionMode #pgEx input,body.dfSectionMode #pgEx select{background:#07111d!important;border-color:#36516c!important;border-radius:12px!important;font-size:18px!important;font-weight:800!important}
      body.dfSectionMode #pgEx .result{border-color:#f5a000!important;background:linear-gradient(180deg,rgba(255,176,0,.13),rgba(255,176,0,.04))!important}
      body.dfSectionMode #pgEx .result span,body.dfSectionMode #pgEx .result b{color:#ffd36a!important}
      @media(max-width:560px){.dfExTab{min-width:78px;padding:0 8px;font-size:10px}body.dfSectionMode #pgEx h2{font-size:23px!important}}
    `;
    document.head.appendChild(s);
  }

  function cards(pg){return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'))}
  function ensureNav(pg){
    let nav=$('dfExTabs');
    if(!nav){
      nav=document.createElement('div');
      nav.id='dfExTabs';
      nav.setAttribute('role','tablist');
      nav.innerHTML=groups.map(g=>'<button type="button" class="dfExTab" data-tab="'+g.id+'">'+g.label+'</button>').join('');
      pg.insertBefore(nav,pg.firstChild);
      nav.addEventListener('click',e=>{const b=e.target.closest('.dfExTab');if(b)activate(pg,b.dataset.tab,b)});
    }
  }
  function apply(pg){
    ensureNav(pg);
    cards(pg).forEach(c=>{c.dataset.dfExGroup=classify(c);c.classList.toggle('dfExVisible',c.dataset.dfExGroup===current)});
    pg.classList.add('dfExTabsReady');
    pg.querySelectorAll('.dfExTab').forEach(b=>b.classList.toggle('on',b.dataset.tab===current));
  }
  function activate(pg,id,btn){
    current=id||'extrusao';
    apply(pg);
    try{sessionStorage.setItem('df_ex_tab_v8',current)}catch(e){}
    if(btn)btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }
  function mount(){
    const pg=$('pgEx');if(!pg)return;
    style();
    try{const saved=sessionStorage.getItem('df_ex_tab_v8');if(groups.some(g=>g.id===saved))current=saved}catch(e){}
    apply(pg);
  }
  function resetExtrusao(){current='extrusao';const pg=$('pgEx');if(pg)apply(pg)}
  function init(){
    mount();
    const pg=$('pgEx');
    if(pg&&!pg.dfExTabsObserver){pg.dfExTabsObserver=true;const mo=new MutationObserver(()=>requestAnimationFrame(mount));mo.observe(pg,{childList:true,subtree:false})}
    const bt=$('btEx');
    if(bt&&!bt.dfExTabsBound){bt.dfExTabsBound=true;bt.addEventListener('click',()=>setTimeout(resetExtrusao,40))}
    const iv=setInterval(()=>{tries++;mount();if(tries>25)clearInterval(iv)},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,80));
})();

(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let activeKey='';
  const sections={
    ex:{button:'btEx',page:'pgEx',title:'EXTRUSÃO'},
    sa:{button:'btSa',page:'pgSa',title:'SACOLAS'},
    cu:{button:'btCu',page:'pgCu',title:'CUSTO'},
    fo:{button:'btFo',page:'pgFo',title:'FORMULAÇÃO'}
  };

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
  function app(){return $('appContent')}

  function addStyle(){
    if($('dfSectionModeStyle'))return;
    const s=document.createElement('style');
    s.id='dfSectionModeStyle';
    s.textContent=`
      #dfSectionHeader{display:none;align-items:center;gap:11px;margin:2px 0 13px;padding:1px 0 3px}
      #dfSectionBack{flex:0 0 46px;width:46px;height:46px;border:1px solid #f5a000;border-radius:999px;background:#211400;color:#ffd36a;font-size:27px;font-weight:950;line-height:1;padding:0;display:flex;align-items:center;justify-content:center}
      #dfSectionTitle{font-size:27px;line-height:1;font-weight:950;letter-spacing:.3px;color:#fff}

      /* TELA PRINCIPAL: mantém o aplicativo original inteiro e rolável. */
      body.dfHomeMode #dfSectionHeader{display:none!important}
      body.dfHomeMode #appContent>#pgEx,
      body.dfHomeMode #appContent>#pgSa,
      body.dfHomeMode #appContent>#pgCu,
      body.dfHomeMode #appContent>#pgFo{display:block!important}
      body.dfHomeMode.dfFormulaLocked #appContent>#pgFo{display:none!important}
      body.dfHomeMode .dfAutoTopics{display:none!important}
      body.dfHomeMode .page>.card{display:block!important}

      /* MODO FOCADO: ao tocar no menu, mostra somente a seção escolhida. */
      body.dfSectionMode #appContent>*{display:none!important}
      body.dfSectionMode #appContent>#dfSectionHeader{display:flex!important}
      body.dfSectionMode #appContent>.page.dfSectionSelected{display:block!important}
      body.dfSectionMode #appContent{padding-top:8px!important}
      body.dfSectionMode .foot{display:none!important}
      body.dfSectionMode #dfUpdateNotify,
      body.dfSectionMode .dfUpdateNotify,
      body.dfSectionMode .updateNotify,
      body.dfSectionMode .toast,
      body.dfSectionMode .notification,
      body.dfSectionMode .installBanner,
      body.dfSectionMode .pwaInstall{display:none!important}

      .dfAutoTopics{display:none;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px}
      body.dfSectionMode .page.dfSectionSelected>.dfAutoTopics{display:flex!important}
      .dfAutoTopics::-webkit-scrollbar{display:none}
      .dfAutoTopic{flex:0 0 auto;min-width:94px;min-height:45px;padding:8px 11px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;line-height:1.12;text-transform:uppercase}
      .dfAutoTopic.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset}
      body.dfSectionMode .page.dfTopicReady>.card[data-df-topic]{display:none!important}
      body.dfSectionMode .page.dfTopicReady>.card[data-df-topic].dfTopicVisible{display:block!important}

      @media(max-width:560px){
        body.dfSectionMode .w{padding:8px 10px 28px!important}
        #dfSectionBack{width:43px;height:43px;flex-basis:43px;font-size:25px}
        #dfSectionTitle{font-size:25px}
        .dfAutoTopic{min-width:86px;font-size:10px}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureHeader(){
    const a=app();if(!a)return null;
    let h=$('dfSectionHeader');
    if(!h){
      h=document.createElement('div');
      h.id='dfSectionHeader';
      h.innerHTML='<button id="dfSectionBack" type="button" aria-label="Voltar para o menu">←</button><div id="dfSectionTitle"></div>';
      const firstPage=a.querySelector(':scope > .page');
      if(firstPage)a.insertBefore(h,firstPage);else a.appendChild(h);
      $('dfSectionBack')?.addEventListener('click',returnHome);
    }
    return h;
  }

  function directCards(page){return Array.from(page.children).filter(x=>x.classList&&x.classList.contains('card'))}
  function shortLabel(card,i){
    const h=card.querySelector('h2,h3');
    let t=(h?.textContent||card.querySelector('.tag')?.textContent||('TÓPICO '+(i+1))).trim().replace(/\s+/g,' ');
    return t.length>26?t.slice(0,24)+'…':t;
  }
  function activateAutoTopic(page,key){
    const cs=directCards(page);
    cs.forEach((c,i)=>c.classList.toggle('dfTopicVisible',String(i)===String(key)));
    page.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b.dataset.topic===String(key)));
  }
  function buildAutoTopics(page){
    if(!page||page.id==='pgEx')return;
    const cs=directCards(page);
    let nav=page.querySelector(':scope > .dfAutoTopics');
    if(cs.length<=1){
      nav?.remove();page.classList.remove('dfTopicReady');
      cs.forEach(c=>{delete c.dataset.dfTopic;c.classList.remove('dfTopicVisible')});
      return;
    }
    const sig=cs.map((c,i)=>shortLabel(c,i)).join('|');
    if(!nav){nav=document.createElement('div');nav.className='dfAutoTopics';page.insertBefore(nav,page.firstChild)}
    if(nav.dataset.sig!==sig){
      nav.dataset.sig=sig;
      nav.innerHTML=cs.map((c,i)=>'<button type="button" class="dfAutoTopic" data-topic="'+i+'">'+shortLabel(c,i)+'</button>').join('');
      nav.onclick=e=>{const b=e.target.closest('.dfAutoTopic');if(b)activateAutoTopic(page,b.dataset.topic)};
    }
    cs.forEach((c,i)=>c.dataset.dfTopic=String(i));
    page.classList.add('dfTopicReady');
    let sel=nav.querySelector('.dfAutoTopic.on')?.dataset.topic;
    if(sel==null||!cs[Number(sel)])sel='0';
    activateAutoTopic(page,sel);
  }

  function syncFormulaLock(){
    const locked=!!$('btFo')?.classList.contains('locked');
    document.body.classList.toggle('dfFormulaLocked',locked);
  }
  function clearSelected(){Object.values(sections).forEach(s=>$(s.page)?.classList.remove('dfSectionSelected'))}

  function enterSection(key){
    const cfg=sections[key],a=app();if(!cfg||!a)return;
    const p=$(cfg.page);if(!p)return;
    if(key==='fo'&&$('btFo')?.classList.contains('locked'))return;
    activeKey=key;
    clearSelected();
    p.classList.add('dfSectionSelected');
    ensureHeader();
    const title=$('dfSectionTitle');if(title)title.textContent=cfg.title;
    document.body.classList.remove('dfHomeMode');
    document.body.classList.add('dfSectionMode');
    buildAutoTopics(p);
    try{window.scrollTo({top:0,behavior:'instant'})}catch(e){window.scrollTo(0,0)}
  }

  function returnHome(){
    activeKey='';
    clearSelected();
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    syncFormulaLock();
    Object.values(sections).forEach(s=>$(s.button)?.classList.remove('on'));
    $('btEx')?.classList.add('on');
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function keyForButton(b){
    for(const[k,cfg]of Object.entries(sections))if(b.id===cfg.button)return k;
    const t=norm(b.textContent);
    if(t.includes('extrus'))return'ex';
    if(t.includes('sacola'))return'sa';
    if(t.includes('custo'))return'cu';
    if(t.includes('formula'))return'fo';
    return'';
  }

  function bind(){
    ensureHeader();syncFormulaLock();
    if(!document.body.dataset.dfSectionBound){
      document.body.dataset.dfSectionBound='1';
      document.addEventListener('click',ev=>{
        const b=ev.target?.closest?.('#btEx,#btSa,#btCu,#btFo');
        if(!b)return;
        const key=keyForButton(b);if(!key)return;
        setTimeout(()=>enterSection(key),70);
      },true);
    }
    Object.values(sections).forEach(cfg=>{
      const p=$(cfg.page);if(!p||p.dataset.dfTopicObserve)return;
      p.dataset.dfTopicObserve='1';
      const mo=new MutationObserver(()=>{
        syncFormulaLock();
        if(document.body.classList.contains('dfSectionMode')&&p.classList.contains('dfSectionSelected'))requestAnimationFrame(()=>buildAutoTopics(p));
      });
      mo.observe(p,{childList:true,subtree:false});
    });
    const fo=$('btFo');
    if(fo&&!fo.dataset.dfLockObserve){
      fo.dataset.dfLockObserve='1';
      new MutationObserver(syncFormulaLock).observe(fo,{attributes:true,attributeFilter:['class']});
    }
  }

  function init(){
    addStyle();bind();syncFormulaLock();
    if(!activeKey&&!document.body.classList.contains('dfSectionMode'))document.body.classList.add('dfHomeMode');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
  setTimeout(init,500);
  setTimeout(init,1200);
})();


/* ---- sacolas-merge-micra.js ---- */
(function(){
  'use strict';

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim()}

  function directCards(pg){
    return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'));
  }

  function removeOutros(pg){
    const outros=directCards(pg).find(c=>{
      const h=norm(c.querySelector('h2')?.textContent||'');
      const t=norm(c.textContent||'');
      return h==='OUTROS RESULTADOS'||(t.includes('SACOS POR KG')&&t.includes('PESO DE 1.000 SACOS'));
    });
    if(outros)outros.remove();

    const nav=pg.querySelector(':scope > .dfAutoTopics');
    if(nav){
      const btn=Array.from(nav.querySelectorAll('.dfAutoTopic')).find(b=>norm(b.textContent).includes('OUTROS RESULTADOS'));
      if(btn){
        const wasOn=btn.classList.contains('on');
        btn.remove();
        if(wasOn){
          const peso=Array.from(nav.querySelectorAll('.dfAutoTopic')).find(b=>norm(b.textContent).includes('PESO DO ROLO'));
          const first=nav.querySelector('.dfAutoTopic');
          (peso||first)?.click();
        }
      }
    }
  }

  function locate(pg){
    const cards=directCards(pg);
    const medidas=cards.find(c=>norm(c.querySelector('h2')?.textContent).includes('MEDIDAS E MATERIAL'))||cards[0]||null;
    let micra=cards.find(c=>c.dataset.dfSaMicraSource==='1')||null;
    if(!micra){
      micra=cards.find(c=>{
        const t=norm(c.querySelector('h2')?.textContent||c.textContent);
        return t.includes('MICRA')&&t.includes('PESO DO SACO');
      })||null;
    }
    return {cards,medidas,micra};
  }

  function merge(){
    const pg=document.getElementById('pgSa');
    if(!pg)return;

    removeOutros(pg);

    const found=locate(pg);
    const medidas=found.medidas;
    let micra=found.micra;
    if(!medidas)return;

    let box=document.getElementById('dfSaMicraMerged');

    if(micra&&!box){
      const originalCards=found.cards;
      const sourceIndex=Math.max(0,originalCards.indexOf(micra));
      micra.dataset.dfSaMicraSource='1';
      micra.dataset.dfSaMicraTopic=String(sourceIndex);

      box=document.createElement('div');
      box.id='dfSaMicraMerged';
      box.style.cssText='margin-top:22px;padding-top:18px;border-top:1px solid #263244';

      while(micra.firstChild)box.appendChild(micra.firstChild);
      medidas.appendChild(box);
    }

    if(!micra){
      micra=directCards(pg).find(c=>c.dataset.dfSaMicraSource==='1')||null;
    }

    if(micra){
      micra.style.setProperty('display','none','important');
      micra.setAttribute('aria-hidden','true');
    }

    const nav=pg.querySelector(':scope > .dfAutoTopics');
    if(nav&&micra){
      const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
      const topic=micra.dataset.dfTopic||micra.dataset.dfSaMicraTopic||'1';
      const micraBtn=buttons.find(b=>String(b.dataset.topic)===String(topic))||buttons.find(b=>{
        const t=norm(b.textContent);
        return t.includes('MICRA')&&t.includes('PESO DO SACO');
      });

      if(micraBtn){
        const wasOn=micraBtn.classList.contains('on');
        micraBtn.classList.remove('on');
        micraBtn.style.setProperty('display','none','important');
        micraBtn.setAttribute('aria-hidden','true');
        micraBtn.tabIndex=-1;

        if(wasOn){
          const first=buttons.find(b=>String(b.dataset.topic)==='0')||buttons.find(b=>b!==micraBtn);
          if(first){
            first.classList.add('on');
            const cards=directCards(pg);
            cards.forEach((c,i)=>c.classList.toggle('dfTopicVisible',i===0));
            medidas.classList.add('dfTopicVisible');
          }
        }
      }
    }

    if(box&&medidas.parentElement===pg){
      const navNow=pg.querySelector(':scope > .dfAutoTopics');
      const active=navNow&&navNow.querySelector('.dfAutoTopic.on');
      const firstActive=!active||String(active.dataset.topic)==='0';
      box.style.display=firstActive?'block':'none';
    }

    removeOutros(pg);
  }

  function start(){
    merge();
    requestAnimationFrame(merge);
    setTimeout(merge,120);
    setTimeout(merge,450);
    setTimeout(merge,1000);

    const root=document.getElementById('pgSa');
    if(root&&!root.dataset.dfSaMergeObserver){
      root.dataset.dfSaMergeObserver='1';
      new MutationObserver(()=>requestAnimationFrame(merge)).observe(root,{childList:true,subtree:true});
    }

    window.addEventListener('df-ui-ready',()=>setTimeout(merge,80));
    document.addEventListener('click',()=>setTimeout(merge,70),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();


/* ---- mobile-back-position.js ---- */
(function(){
  'use strict';

  function install(){
    if(document.getElementById('dfMobileBackPositionStyle'))return;

    const s=document.createElement('style');
    s.id='dfMobileBackPositionStyle';
    s.textContent=`
      /* A seta antiga do cabeçalho fica definitivamente escondida.
         O VOLTAR agora existe somente dentro da barra de tópicos de cada módulo. */
      body.dfSectionMode #dfSectionBack{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
        width:0!important;
        min-width:0!important;
        height:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
      }

      body.dfSectionMode #dfSectionHeader{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        position:static!important;
        min-height:40px!important;
        height:auto!important;
        margin:0 0 7px!important;
        padding:0!important;
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }

      body.dfSectionMode #dfSectionTitle{
        width:100%!important;
        margin:0!important;
        padding:0!important;
        text-align:center!important;
        font-size:21px!important;
        line-height:1.1!important;
        font-weight:950!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        pointer-events:none!important;
      }

      @media(max-width:640px){
        body.dfSectionMode #appContent{
          padding-top:44px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  window.addEventListener('df-ui-ready',install);
  setTimeout(install,250);
  setTimeout(install,800);
})();

/* ---- extrusao-back-tab.js ---- */
(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfExBackTabStyle'))return;
    const s=document.createElement('style');
    s.id='dfExBackTabStyle';
    s.textContent=`
      #dfExTabs .dfPersistentMenuBtn{
        position:sticky!important;
        left:0!important;
        z-index:20!important;
        flex:0 0 auto!important;
        min-width:92px!important;
        min-height:46px!important;
        padding:0 12px!important;
        border:1px solid #f5a000!important;
        border-radius:12px!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:10px 0 16px rgba(8,11,19,.92)!important;
        font-weight:950!important;
        font-size:10.5px!important;
        line-height:1.1!important;
        white-space:nowrap!important;
        text-transform:uppercase!important;
      }
      #dfExTabs .dfPersistentMenuBtn:active{
        transform:scale(.96)!important;
        background:#342000!important;
      }

      @media(max-width:640px){
        body.dfSectionMode.dfExBackInTabs #appContent{
          padding-top:max(56px,calc(env(safe-area-inset-top,0px) + 8px))!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionHeader{
          display:flex!important;
          position:static!important;
          height:auto!important;
          min-height:34px!important;
          margin:0 0 8px!important;
          padding:0!important;
          align-items:center!important;
          justify-content:center!important;
          background:transparent!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          -webkit-backdrop-filter:none!important;
          backdrop-filter:none!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionBack{display:none!important}
        body.dfSectionMode.dfExBackInTabs #dfSectionTitle{
          display:block!important;
          width:100%!important;
          margin:0!important;
          padding:0!important;
          text-align:center!important;
          font-size:22px!important;
          line-height:1.1!important;
          font-weight:950!important;
          color:#fff!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfExTabs{margin-top:0!important}
        #dfExTabs .dfPersistentMenuBtn{min-width:88px!important;padding:0 10px!important;font-size:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function focusedExtrusao(){
    const pg=document.getElementById('pgEx');
    return !!(pg&&document.body.classList.contains('dfSectionMode')&&pg.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=document.getElementById('dfSectionBack');
    if(back){back.click();return}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(p=>p.classList.remove('dfSectionSelected'));
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function makeMenuButton(){
    const b=document.createElement('button');
    b.type='button';
    b.className='dfPersistentMenuBtn';
    b.dataset.dfPersistentMenu='1';
    b.textContent='← MENU';
    b.setAttribute('aria-label','Voltar para a tela principal');
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      goHome();
    });
    return b;
  }

  function decorate(){
    addStyle();
    const focused=focusedExtrusao();
    const nav=document.getElementById('dfExTabs');

    if(nav){
      const first=nav.querySelector('.dfExTab[data-tab="extrusao"]');
      if(first){
        if(String(first.textContent||'').trim().toUpperCase().includes('VOLTAR'))first.textContent='EXTRUSÃO';
        first.classList.remove('dfExBackTab');
        first.setAttribute('aria-label','Ir para Extrusão');
        first.setAttribute('title','Extrusão');
      }

      let menu=nav.querySelector(':scope > .dfPersistentMenuBtn');
      if(focused){
        if(!menu){menu=makeMenuButton();nav.insertBefore(menu,nav.firstChild)}
        else if(nav.firstElementChild!==menu)nav.insertBefore(menu,nav.firstChild);
      }else if(menu){menu.remove()}
    }

    document.body.classList.toggle('dfExBackInTabs',focused);
  }

  function init(){
    decorate();
    const root=document.getElementById('appContent')||document.body;
    if(root&&!root.dataset.dfExBackObserver){
      root.dataset.dfExBackObserver='1';
      new MutationObserver(()=>requestAnimationFrame(decorate)).observe(root,{childList:true,subtree:true});
    }
    document.addEventListener('click',()=>setTimeout(decorate,70),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
  setTimeout(decorate,500);
})();


/* ---- extrusao-medidas-auto.js ---- */
(function(){
  'use strict';

  const STORE='df_extrusao_medidas_auto_v1';
  const MAX=80;
  let saveTimer=0;
  let applying=false;
  let bound=false;

  function normText(s){
    return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  }

  function cleanNum(v){
    return String(v==null?'':v).trim().replace(/\s+/g,'').replace(',','.');
  }

  function displayNum(v){
    return String(v==null?'':v).replace('.',',');
  }

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(STORE)||'[]');
      return Array.isArray(v)?v:[];
    }catch(e){return []}
  }

  function write(list){
    try{localStorage.setItem(STORE,JSON.stringify(list.slice(0,MAX)))}catch(e){}
  }

  function findByLabel(root,terms,selector){
    if(!root)return null;
    const wanted=Array.isArray(terms)?terms:[terms];
    const labels=Array.from(root.querySelectorAll('label'));
    for(const label of labels){
      const t=normText(label.textContent);
      if(!wanted.some(x=>t.includes(normText(x))))continue;
      if(label.htmlFor){
        const byFor=document.getElementById(label.htmlFor);
        if(byFor&&(!selector||byFor.matches(selector)))return byFor;
      }
      const parent=label.parentElement;
      if(parent){
        const c=parent.querySelector(selector||'input,select');
        if(c)return c;
      }
      let n=label.nextElementSibling;
      while(n){
        if(!selector&&n.matches&&n.matches('input,select'))return n;
        if(selector&&n.matches&&n.matches(selector))return n;
        const q=n.querySelector&&n.querySelector(selector||'input,select');
        if(q)return q;
        n=n.nextElementSibling;
      }
    }
    return null;
  }

  function fields(){
    const pg=document.getElementById('pgEx');
    if(!pg)return null;
    const card=Array.from(pg.children).find(el=>el.classList&&el.classList.contains('card')) || pg.querySelector('.card');
    if(!card)return null;

    const width=document.getElementById('exL') || findByLabel(card,['largura do filme fechado','largura do filme'],'input');
    const length=findByLabel(card,['comprimento final / saco','comprimento final','comprimento do saco'],'input');
    const micra=document.getElementById('exM') || findByLabel(card,['micra desejada'],'input');
    const density=document.getElementById('exDs') || findByLabel(card,['densidade'],'select');
    const manual=document.getElementById('exDm') || findByLabel(card,['densidade manual'],'input');

    return width&&length&&micra&&density?{pg,card,width,length,micra,density,manual}:null;
  }

  function actualDensity(f){
    if(!f)return '';
    const d=cleanNum(f.density.value);
    if(d==='manual')return cleanNum(f.manual&&f.manual.value);
    return d;
  }

  function snapshot(f){
    return {
      w:cleanNum(f.width.value),
      l:cleanNum(f.length.value),
      m:cleanNum(f.micra.value),
      d:actualDensity(f),
      ts:Date.now()
    };
  }

  function valid(r){
    return !!(r&&r.w&&r.l&&r.m&&r.d&&Number.isFinite(Number(r.w))&&Number.isFinite(Number(r.l))&&Number.isFinite(Number(r.m))&&Number.isFinite(Number(r.d)));
  }

  function key(r){return [r.w,r.l,r.m,r.d].join('|')}

  function saveNow(){
    if(applying)return;
    const f=fields();if(!f)return;
    const r=snapshot(f);if(!valid(r))return;
    const list=read().filter(x=>key(x)!==key(r));
    list.unshift(r);
    write(list);
  }

  function scheduleSave(){
    if(applying)return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveNow,900);
  }

  function fire(el){
    if(!el)return;
    try{el.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}
    try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  }

  function setDensity(f,val){
    const target=cleanNum(val);
    let matched=false;
    Array.from(f.density.options||[]).forEach(o=>{
      if(cleanNum(o.value)===target){f.density.value=o.value;matched=true}
    });
    if(matched){
      fire(f.density);
      return;
    }
    const manualOpt=Array.from(f.density.options||[]).find(o=>cleanNum(o.value)==='manual');
    if(manualOpt){
      f.density.value=manualOpt.value;
      fire(f.density);
      setTimeout(()=>{
        const mf=document.getElementById('exDm')||f.manual||findByLabel(f.card,['densidade manual'],'input');
        if(mf){mf.value=displayNum(target);fire(mf)}
      },20);
    }
  }

  function applyRecipe(r){
    const f=fields();if(!f)return;
    applying=true;
    f.width.value=displayNum(r.w);
    f.length.value=displayNum(r.l);
    f.micra.value=displayNum(r.m);
    fire(f.width);fire(f.length);fire(f.micra);
    setDensity(f,r.d);
    hideSuggest();
    setTimeout(()=>{applying=false},250);
  }

  function addStyle(){
    if(document.getElementById('dfExAutoMeasureStyle'))return;
    const s=document.createElement('style');
    s.id='dfExAutoMeasureStyle';
    s.textContent=`
      .dfMeasureAnchor{position:relative!important}
      #dfMeasureSuggest{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:120;background:#07111d;border:1px solid #36516c;border-radius:14px;overflow:hidden;box-shadow:0 18px 35px rgba(0,0,0,.45)}
      #dfMeasureSuggest.on{display:block}
      .dfMeasureItem{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;border-bottom:1px solid rgba(54,81,108,.55);background:#07111d;color:#f8fafc;padding:12px 13px;text-align:left;font:inherit}
      .dfMeasureItem:last-child{border-bottom:0}
      .dfMeasureItem:active{background:#102238}
      .dfMeasureMain{font-size:14px;font-weight:950;letter-spacing:.1px}
      .dfMeasureSub{display:block;margin-top:2px;color:#94a3b8;font-size:11px;font-weight:700}
      .dfMeasurePull{flex:0 0 auto;color:#ffd36a;font-size:11px;font-weight:950;white-space:nowrap}
      @media(max-width:560px){.dfMeasureItem{padding:13px 12px}.dfMeasureMain{font-size:15px}.dfMeasurePull{font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function ensureSuggest(f){
    addStyle();
    const host=f.width.parentElement||f.card;
    host.classList.add('dfMeasureAnchor');
    let box=document.getElementById('dfMeasureSuggest');
    if(!box){
      box=document.createElement('div');
      box.id='dfMeasureSuggest';
      box.setAttribute('role','listbox');
      host.appendChild(box);
    }else if(box.parentElement!==host){
      host.appendChild(box);
    }
    return box;
  }

  function hideSuggest(){
    const b=document.getElementById('dfMeasureSuggest');
    if(b){b.classList.remove('on');b.innerHTML=''}
  }

  function showSuggest(){
    const f=fields();if(!f)return;
    const q=cleanNum(f.width.value);
    if(!q){hideSuggest();return}
    const matches=read().filter(r=>String(r.w||'').startsWith(q)).slice(0,6);
    if(!matches.length){hideSuggest();return}
    const box=ensureSuggest(f);
    box.innerHTML='';
    matches.forEach(r=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='dfMeasureItem';
      b.innerHTML='<span><span class="dfMeasureMain">'+displayNum(r.w)+' × '+displayNum(r.l)+' × '+displayNum(r.m)+' µm</span><span class="dfMeasureSub">Densidade '+displayNum(r.d)+'</span></span><span class="dfMeasurePull">PUXAR TUDO</span>';
      b.addEventListener('pointerdown',e=>e.preventDefault());
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyRecipe(r)});
      box.appendChild(b);
    });
    box.classList.add('on');
  }

  function bind(){
    const f=fields();if(!f)return false;
    addStyle();ensureSuggest(f);

    [f.width,f.length,f.micra,f.density,f.manual].filter(Boolean).forEach(el=>{
      if(el.dataset.dfAutoMeasureBound)return;
      el.dataset.dfAutoMeasureBound='1';
      el.addEventListener('input',()=>{scheduleSave();if(el===f.width)showSuggest()});
      el.addEventListener('change',()=>{scheduleSave();if(el===f.width)showSuggest()});
    });

    if(!f.width.dataset.dfAutoMeasureFocus){
      f.width.dataset.dfAutoMeasureFocus='1';
      f.width.addEventListener('focus',showSuggest);
      f.width.addEventListener('blur',()=>setTimeout(hideSuggest,180));
    }

    if(!document.body.dataset.dfAutoMeasureOutside){
      document.body.dataset.dfAutoMeasureOutside='1';
      document.addEventListener('pointerdown',e=>{
        const box=document.getElementById('dfMeasureSuggest');
        const fw=fields();
        if(box&&box.classList.contains('on')&&fw&&e.target!==fw.width&&!box.contains(e.target))hideSuggest();
      },true);
    }

    bound=true;
    return true;
  }

  function init(){
    if(bind())return;
    let n=0;
    const iv=setInterval(()=>{n++;if(bind()||n>30)clearInterval(iv)},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,120));
  setTimeout(init,700);
})();


