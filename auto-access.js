(function(){
'use strict';
if(window.DFAutoAccessStableV3)return;window.DFAutoAccessStableV3=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2';
const DEVICE_KEY='df_licenseauth_device_v1';
const ACCESS_KEY='df_auto_access_credential_v1';
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
function device(){
  try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}
  let id='';try{id=String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){}
  if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);try{localStorage.setItem(DEVICE_KEY,id)}catch(e){}}
  return id;
}
function msg(t,ok){const e=document.getElementById('licenseMsg');if(e){e.textContent=t;e.className='licenseMsg '+(ok?'ok':'err')}}
function unlock(){try{if(typeof window.dfUnlocked==='function')window.dfUnlocked();else{const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='none';if(a)a.style.display='block'}window.dispatchEvent(new CustomEvent('df-auth-ready',{detail:{ok:true}}))}catch(e){}}
function gate(){const g=document.getElementById('licenseGate'),a=document.getElementById('appContent');if(g)g.style.display='flex';if(a)a.style.display='none'}
async function request(path,body,timeout){
  const c='AbortController'in window?new AbortController():null;
  const tm=c?setTimeout(()=>c.abort(),timeout||9000):null;
  try{return await previousFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':device()},body:JSON.stringify(body),signal:c?c.signal:undefined})}
  finally{if(tm)clearTimeout(tm)}
}
function save(j){const token=String(j&&j.token||'').trim(),credential=String(j&&j.accessCredential||'').trim();if(!token||!credential)throw Error('Resposta de acesso incompleta.');sessionStorage.setItem(TOKEN_KEY,token);localStorage.setItem(ACCESS_KEY,credential)}
function readCookie(name){try{const p=name+'=';for(const part of String(document.cookie||'').split(';')){const s=part.trim();if(s.startsWith(p))return decodeURIComponent(s.slice(p.length)).trim()}}catch(e){}return''}
function writeCookie(name,value){try{document.cookie=name+'='+encodeURIComponent(value)+'; Max-Age='+COOKIE_MAX_AGE+'; Path=/; SameSite=Lax; Secure'}catch(e){}}
function makeCode(id){let h=2166136261;const s=String(id||'DF');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h>>>=0;const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x=h,out='';for(let i=0;i<4;i++){out+=alphabet[x&31];x=(x>>>5)^Math.imul(x,2654435761);x>>>=0}return'DF-'+out.slice(0,2)+'-'+out.slice(2,4)}
function automaticIdentity(){let code=readCookie(USER_COOKIE);try{if(!code)code=String(localStorage.getItem(USER_KEY)||'').trim()}catch(e){}if(!/^DF-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(code))code=makeCode(device());try{localStorage.setItem(USER_KEY,code)}catch(e){}writeCookie(USER_COOKIE,code);window.DF_AUTO_USER=code;return code}
async function restore(){
  if(!saved())return false;
  gate();
  try{
    const r=await request('/access/session',{credential:saved(),deviceId:device()},25000);let j={};try{j=await r.json()}catch(e){}
    if(r.ok&&j.ok!==false&&j.token){sessionStorage.setItem(TOKEN_KEY,String(j.token));unlock();return true}
    if([401,403,404,410].includes(r.status)){localStorage.removeItem(ACCESS_KEY);sessionStorage.removeItem(TOKEN_KEY);gate();return false}
    gate();return false
  }catch(e){gate();return false}
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
        save(j);msg('Key validada. Abrindo aplicativo...',true);unlock();
        // Recarrega com a credencial validada para que o shell e os módulos de licença
        // iniciem no mesmo estado. Evita permanecer na tela de KEY após a ativação.
        const next=new URL(location.href);next.searchParams.delete('acesso');next.searchParams.set('entrada','key');
        location.replace(next.pathname+next.search+next.hash);
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
function prepare(){
  if(saved()){restore().then(ok=>{if(!ok)prepareManual()});return}
  prepareManual();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});else prepare();
})();