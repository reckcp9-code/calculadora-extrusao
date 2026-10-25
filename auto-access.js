(function(){
'use strict';
if(window.DFAutoAccessStableV3)return;window.DFAutoAccessStableV3=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2';
const DEVICE_KEY='df_licenseauth_device_v1';
const ACCESS_KEY='df_auto_access_credential_v1';
const SAVE_DEVICE_KEY='df_access_save_device_v1';
const USER_KEY='df_auto_user_code_v1';
const USER_COOKIE='df_auto_user_code_v1';
const COOKIE_MAX_AGE=315360000;
const previousFetch=window.fetch.bind(window);
const initialUrl=new URL(location.href);
const generalMode=String(initialUrl.searchParams.get('acesso')||'').trim().toLowerCase()!=='restrito';
let identifying=false;
let autoStarted=false;

// Remove o parâmetro imediatamente para impedir que a rotina antiga embutida
// no app-bundle assuma o mesmo fluxo de acesso ao mesmo tempo.
if(generalMode){
  try{
    const clean=new URL(location.href);
    clean.searchParams.delete('acesso');
    history.replaceState(null,'',clean.pathname+(clean.search||'')+(clean.hash||''));
  }catch(e){}
}

function saved(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
function savedOnDevice(){try{return localStorage.getItem(SAVE_DEVICE_KEY)!=='0'}catch(e){return true}}
function device(){
  try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}
  let id='';try{id=String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){}
  if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);try{localStorage.setItem(DEVICE_KEY,id)}catch(e){}}
  return id;
}
function msg(t,ok){const e=document.getElementById('licenseMsg');if(e){e.textContent=t;e.className='licenseMsg '+(ok?'ok':'err')}}
function unlock(){try{removeSavedTransition();document.documentElement.classList.remove('df-access-restoring');document.documentElement.classList.remove('df-license-locked');document.getElementById('licenseGate')?.style.removeProperty('display');document.getElementById('appContent')?.style.removeProperty('display');if(typeof window.dfUnlocked==='function')window.dfUnlocked();else{const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='none';if(a)a.style.display='block'}window.dispatchEvent(new CustomEvent('df-auth-ready',{detail:{ok:true}}))}catch(e){}}
function gate(){
  document.documentElement.classList.add('df-license-locked');
  const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');
  if(g)g.style.setProperty('display',document.documentElement.classList.contains('df-access-restoring')?'none':'flex','important');
  if(a)a.style.setProperty('display','none','important');
}
(function(){
  const st=document.createElement('style');
  st.textContent='html.df-license-locked:not(.df-access-restoring) #licenseGate{display:flex!important;visibility:visible!important}html.df-access-restoring #licenseGate{display:none!important;visibility:hidden!important}html.df-license-locked #appContent{display:none!important;visibility:hidden!important}';
  document.head.appendChild(st);
  // Quem já tem KEY salva vê apenas a transição discreta do aplicativo, nunca o formulário da KEY.
  if(saved()){
    const overlay=document.createElement('div');
    overlay.id='dfSavedAccessTransition';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#080b13;color:#f8fafc;display:flex;align-items:center;justify-content:center;text-align:center;font:700 19px system-ui,-apple-system,sans-serif';
    overlay.textContent='DF EXTRUSOR PRO';
    const mount=()=>{if(!overlay.isConnected)document.body.appendChild(overlay)};
    if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
    // A transição é apenas visual: nunca pode bloquear o aplicativo após uma atualização.
    const release=()=>{const app=document.getElementById('appContent');if(app&&app.children.length)removeSavedTransition()};
    document.addEventListener('DOMContentLoaded',release,{once:true});
    window.addEventListener('df-ui-ready',release,{once:true});
    setTimeout(()=>{removeSavedTransition();document.documentElement.classList.remove('df-access-restoring')},2500);
  }
})();
function removeSavedTransition(){document.getElementById('dfSavedAccessTransition')?.remove()}

async function request(path,body,timeout){
  const c='AbortController'in window?new AbortController():null;
  const tm=c?setTimeout(()=>c.abort(),timeout||9000):null;
  try{return await previousFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':device()},body:JSON.stringify(body),signal:c?c.signal:undefined})}
  finally{if(tm)clearTimeout(tm)}
}
function save(j,persist=true){const token=String(j&&j.token||'').trim(),credential=String(j&&j.accessCredential||'').trim();if(!token||!credential)throw Error('Resposta de acesso incompleta.');sessionStorage.setItem(TOKEN_KEY,token);if(persist){localStorage.setItem(ACCESS_KEY,credential);localStorage.setItem(SAVE_DEVICE_KEY,'1')}else{localStorage.removeItem(ACCESS_KEY);localStorage.setItem(SAVE_DEVICE_KEY,'0')}}
function readCookie(name){try{const p=name+'=';for(const part of String(document.cookie||'').split(';')){const s=part.trim();if(s.startsWith(p))return decodeURIComponent(s.slice(p.length)).trim()}}catch(e){}return''}
function writeCookie(name,value){try{document.cookie=name+'='+encodeURIComponent(value)+'; Max-Age='+COOKIE_MAX_AGE+'; Path=/; SameSite=Lax; Secure'}catch(e){}}
function makeCode(id){let h=2166136261;const s=String(id||'DF');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h>>>=0;const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x=h,out='';for(let i=0;i<4;i++){out+=alphabet[x&31];x=(x>>>5)^Math.imul(x,2654435761);x>>>=0}return'DF-'+out.slice(0,2)+'-'+out.slice(2,4)}
function automaticIdentity(){let code=readCookie(USER_COOKIE);try{if(!code)code=String(localStorage.getItem(USER_KEY)||'').trim()}catch(e){}if(!/^DF-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(code))code=makeCode(device());try{localStorage.setItem(USER_KEY,code)}catch(e){}writeCookie(USER_COOKIE,code);window.DF_AUTO_USER=code;return code}
async function restore(){
  const credential=saved();
  if(!credential)return false;
  // Atualizações e quedas de internet não são revogações de licença.
  // Mantenha a tela do app visível enquanto o servidor responde.
  try{
    const r=await request('/access/session',{credential,deviceId:device()},9000);
    let j={};try{j=await r.json()}catch(e){}
    if(r.ok&&j.ok!==false&&j.token){sessionStorage.setItem(TOKEN_KEY,String(j.token));unlock();return true}
    if(j.paused===true||r.status===423){dfAccessLock('KEY pausada pelo administrador.');return false}
    if(j.revoked===true||r.status===410){dfAccessLock('Acesso resetado. Digite sua KEY novamente.',true);return false}
    if(r.status===401||r.status===403){gate();msg('Não foi possível validar a licença. Tente novamente quando houver conexão.',false);return true}
    // Respostas temporárias não apagam a KEY nem forçam um novo login.
    unlock();return true
  }catch(e){unlock();return true}
}
function ensureIdentityUi(){
  gate();
  const old=document.getElementById('licenseKey');if(old)old.style.display='none';
  const btn=document.getElementById('licenseBtn');if(!btn)return null;
  let wrap=document.getElementById('dfAccessIdentityWrap');
  if(!wrap){wrap=document.createElement('div');wrap.id='dfAccessIdentityWrap';wrap.innerHTML='<input id="dfAccessIdentity" type="text" autocomplete="username" placeholder="Código de acesso" style="display:none;width:100%;box-sizing:border-box;min-height:52px;border:1px solid #475569;background:#111827;color:#fff;border-radius:12px;padding:12px 14px;font:600 16px system-ui;margin:12px 0">';btn.parentNode.insertBefore(wrap,btn)}
  const input=document.getElementById('dfAccessIdentity');if(input&&!input.value)input.value=automaticIdentity();
  btn.disabled=false;btn.textContent='ACESSAR';
  let manual=document.getElementById('dfManualKeyOption');
  if(!manual){
    manual=document.createElement('div');manual.id='dfManualKeyOption';
    manual.innerHTML='<button type="button" id="dfManualKeyToggle" style="width:100%;margin:12px 0;padding:14px;border:1px solid #e5a500;border-radius:12px;background:#251800;color:#ffd56c;font-weight:800">🔑 DIGITAR KEY MANUALMENTE</button><div id="dfManualKeyForm" style="display:none"><input id="dfManualKeyValue" placeholder="Digite sua key" autocomplete="off" style="box-sizing:border-box;width:100%;padding:14px;background:#0f172a;color:white;border:1px solid #64748b;border-radius:12px"><button type="button" id="dfManualKeyConfirm" style="width:100%;margin:10px 0;padding:14px;background:#064e3b;color:#a7f3d0;border:1px solid #16a34a;border-radius:12px;font-weight:800">VALIDAR KEY</button></div>';
    btn.insertAdjacentElement('afterend',manual);
    const formEl=manual.querySelector('#dfManualKeyForm');
    const remember=document.createElement('label');remember.style.cssText='display:flex;align-items:center;gap:10px;margin:14px 0;color:#e2e8f0;font:600 14px system-ui';remember.innerHTML='<input type="checkbox" id="dfSaveKeyDevice" checked style="width:20px;height:20px;accent-color:#16a34a"> SALVAR ACESSO NESTE DISPOSITIVO';formEl.insertBefore(remember,formEl.querySelector('#dfManualKeyConfirm'));
    manual.querySelector('#dfManualKeyToggle').onclick=()=>{const form=manual.querySelector('#dfManualKeyForm');form.style.display=form.style.display==='none'?'block':'none'};
    manual.querySelector('#dfManualKeyConfirm').onclick=async()=>{
      const key=manual.querySelector('#dfManualKeyValue').value.trim();
      if(!key){msg('Digite sua key.',false);return}
      const submit=manual.querySelector('#dfManualKeyConfirm');submit.disabled=true;submit.textContent='VALIDANDO...';
      try{
        msg('Consultando a licença no servidor...',true);
        const r=await request('/access/manual-key',{licenseKey:key,deviceId:device()},20000);
        let j={};try{j=await r.json()}catch(e){throw Error('Servidor retornou uma resposta inválida ('+r.status+').')}
        if(!r.ok||j.ok===false)throw Error(j.error||j.message||('Falha na validação da KEY (HTTP '+r.status+').'));
        const rememberChoice=!!manual.querySelector('#dfSaveKeyDevice')?.checked;
        localStorage.removeItem('df_manual_key_required_after_reset');save(j,rememberChoice);msg('Key validada. Abrindo aplicativo...',true);unlock();
        // A KEY já foi autorizada. Nunca recarregar aqui: o reload fazia o shell
        // antigo exibir novamente a licença antes de recuperar a sessão.
        // A transição deve ser imediata, sem navegação e sem perder a credencial.
        window.dispatchEvent(new CustomEvent('df-access-authorized',{detail:{persisted:rememberChoice}}));
      }catch(e){const timeout=e&&e.name==='AbortError';msg(timeout?'Servidor de licenças demorou mais de 25 segundos. Verifique a conexão e tente novamente.':String(e.message||'Não foi possível validar a key.'),false)}
      finally{submit.disabled=false;submit.textContent='VALIDAR KEY'}
    };
  }

  return btn;
}
async function identify(){
  if(identifying)return false;
  const btn=ensureIdentityUi();if(!btn)return false;
  const input=document.getElementById('dfAccessIdentity');const identity=String(input&&input.value||automaticIdentity()).trim();
  identifying=true;btn.disabled=true;btn.textContent='VALIDANDO ACESSO...';msg('Validando seu acesso...',true);
  try{
    const r=await request('/access/identify',{identity,deviceId:device()},20000);let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw Error(j.error||('Falha no acesso ('+r.status+').'));
    save(j);msg('Acesso liberado. Entrando...',true);btn.textContent='ACESSO LIBERADO';unlock();return true
  }catch(err){
    const timeout=err&&err.name==='AbortError';
    msg(timeout?'Servidor demorou para responder. Tente novamente ou use KEY manual.':String(err&&err.message||err),false);
    btn.disabled=false;btn.textContent='TENTAR NOVAMENTE';return false
  }finally{identifying=false}
}
function prepareIdentityFallback(){prepareManual()}
function prepareManual(){
  removeSavedTransition();
  document.documentElement.classList.remove('df-access-restoring');
  const btn=ensureIdentityUi();if(!btn)return;
  btn.style.display='none';
  const option=document.getElementById('dfManualKeyOption');
  const toggle=document.getElementById('dfManualKeyToggle');
  const form=document.getElementById('dfManualKeyForm');
  if(option)option.style.display='block';
  if(toggle)toggle.style.display='none';
  if(form)form.style.display='block';
  msg('Digite a KEY fornecida pelo administrador para acessar.',true);
}
async function recoverExisting(){
  // Após reset, nunca recuperar a licença automaticamente por identificação.
  if(localStorage.getItem('df_manual_key_required_after_reset')==='1')return false;
  // Primeiro recuperar os acessos antigos, sem consumir outra KEY.
  if(saved()){
    if(await restore())return true;
    try{const repair=window.DFAccessRecovery?.repair;if(typeof repair==='function'&&await repair()){if(await restore())return true}}catch(e){}
  }else{
    try{const repair=window.DFAccessRecovery?.repair;if(typeof repair==='function'&&await repair()){if(await restore())return true}}catch(e){}
  }
  // A identificacao antiga so pode recuperar uma licenca ja existente no D1.
  // O servidor nao distribui KEY nova por esta rota.
  try{
    const identity=automaticIdentity();
    const r=await request('/access/identify',{identity,deviceId:device()},15000);
    const j=await r.json();
    if(r.ok&&j.ok!==false&&j.token&&j.accessCredential){save(j,true);unlock();return true}
  }catch(e){}
  return false;
}

// Revalida a credencial periodicamente: pausar/revogar no painel bloqueia
// também uma sessão que já estava aberta, sem depender de recarregar a página.
let dfAccessChecking=false;
let dfAccessLastVerified=0;
function dfAccessLock(reason,reset=false){
  removeSavedTransition();
  document.documentElement.classList.remove('df-access-restoring');
  try{sessionStorage.removeItem(TOKEN_KEY)}catch(e){}
  if(reset){
    try{localStorage.removeItem(ACCESS_KEY);localStorage.setItem('df_manual_key_required_after_reset','1')}catch(e){}
    try{sessionStorage.removeItem('df_secure_token_v2')}catch(e){}
  }
  gate();
  if(reset)prepareManual();
  msg(reason||(reset?'Aparelho resetado. Digite uma KEY para entrar.':'Acesso pausado ou bloqueado pelo administrador.'),false);
}
async function dfAccessRevalidate(){
  if(dfAccessChecking||document.hidden)return;
  const credential=saved();
  if(!credential){
    // Acesso manual sem persistência ou formulário de login: não interferir.
    return;
  }
  dfAccessChecking=true;
  try{
    const r=await request('/access/session',{credential,deviceId:device()},12000);
    let j={};try{j=await r.json()}catch(e){}
    if(r.ok&&j.ok!==false&&j.token){
      sessionStorage.setItem(TOKEN_KEY,String(j.token));
      dfAccessLastVerified=Date.now();
    }else if(r.status===423||j.paused===true||r.status===410||j.revoked===true){
      const reset=r.status===410||j.revoked===true;
      dfAccessLock(reset?'Aparelho resetado. Digite a mesma KEY ou outra KEY para entrar.':'KEY pausada, vencida ou bloqueada. Solicite a liberação ao administrador.',reset);
    }else{
      // Falha temporária ou resposta ambígua: manter sessão e KEY intactas.
    }
  }catch(e){
    // Offline: não forçar retorno à tela de licença.
  }finally{dfAccessChecking=false}
}
window.addEventListener('df-auth-ready',function(){
  dfAccessLastVerified=Date.now();
  dfAccessRevalidate();
});
document.addEventListener('visibilitychange',function(){if(!document.hidden)dfAccessRevalidate()});
window.addEventListener('focus',function(){dfAccessRevalidate()});
setInterval(dfAccessRevalidate,15000);

function prepare(){
  if(saved())document.documentElement.classList.add('df-access-restoring');
  gate();
  msg('Verificando acesso já instalado neste aparelho...',true);
  recoverExisting().then(ok=>{if(!ok)prepareManual()}).catch(()=>prepareManual());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});else prepare();
})();