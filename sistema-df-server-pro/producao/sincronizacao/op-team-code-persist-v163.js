(function(){
  'use strict';
  if(window.DFOpTeamCodePersistV163)return;
  window.DFOpTeamCodePersistV163=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TEAM_KEY='df_op_team_v1';
  const CODE_KEY='df_op_team_join_code_v1';
  let recovering=false,timer=0;

  const $=id=>document.getElementById(id);
  const loadJson=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  function teamNow(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t)return t}}catch(e){}return loadJson(TEAM_KEY,null)}
  function digits(v){const s=String(v==null?'':v).replace(/\D/g,'');return s.length>=6&&s.length<=12?s:''}
  function extractCode(o){if(!o)return'';return digits(o.joinCode||o.join_code||o.code||o.inviteCode||o.invite_code||(o.team&&extractCode(o.team)))}
  function currentCode(){return digits(localStorage.getItem(CODE_KEY)||'')||extractCode(teamNow())}
  function remember(code){code=digits(code);if(!code)return'';try{localStorage.setItem(CODE_KEY,code)}catch(e){}const t=teamNow();if(t&&String(t.role||'').toLowerCase()==='owner'&&extractCode(t)!==code){const next=Object.assign({},t,{joinCode:code});saveJson(TEAM_KEY,next)}return code}
  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
  async function renew(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw new Error('acesso indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token}
  async function post(path,body,retry){const token=await renew(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}

  function ensureStyle(){if($('dfTeamCodePersistStyle'))return;const s=document.createElement('style');s.id='dfTeamCodePersistStyle';s.textContent='#dfTeamJoinCodePersist{margin-top:8px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:900;word-break:break-all}#dfTeamCodeActionsPersist{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}#dfTeamCodeActionsPersist button{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}@media(max-width:430px){#dfTeamCodeActionsPersist{grid-template-columns:1fr}}';document.head.appendChild(s)}
  async function copy(code){try{await navigator.clipboard.writeText(code)}catch(e){prompt('Código da equipe:',code)}}
  function patchOwner(){const t=teamNow(),box=$('dfOpTeamCloud');if(!box||!t||String(t.role||'').toLowerCase()!=='owner')return false;ensureStyle();let code=remember(currentCode());let line=$('dfTeamJoinCodePersist');if(!line){line=document.createElement('div');line.id='dfTeamJoinCodePersist';const teamLine=Array.from(box.querySelectorAll('.ctCode')).find(e=>/Equipe:/i.test(e.textContent||''));if(teamLine)teamLine.insertAdjacentElement('afterend',line);else box.prepend(line)}line.innerHTML=code?'Código da equipe para conectar outro celular: <b>'+code+'</b>':'Código da equipe: <b>recuperando...</b>';
    let actions=$('dfTeamCodeActionsPersist');if(!actions){actions=document.createElement('div');actions.id='dfTeamCodeActionsPersist';line.insertAdjacentElement('afterend',actions)}actions.innerHTML=code?'<button id="dfTeamCodeCopyPersist">📋 COPIAR CÓDIGO</button>':'<button id="dfTeamCodeRecoverPersist">🔄 RECUPERAR CÓDIGO</button>';
    if(code){const b=$('dfTeamCodeCopyPersist');if(b)b.onclick=async()=>{await copy(code);b.textContent='✅ COPIADO';setTimeout(()=>{if($('dfTeamCodeCopyPersist'))$('dfTeamCodeCopyPersist').textContent='📋 COPIAR CÓDIGO'},1300)}}else{const b=$('dfTeamCodeRecoverPersist');if(b)b.onclick=()=>recover(true);recover(false)}return true}

  async function recover(manual){if(recovering)return;const t=teamNow();if(!t||String(t.role||'').toLowerCase()!=='owner')return;const existing=currentCode();if(existing){remember(existing);patchOwner();return}recovering=true;try{let j=await post('/op/team/status',{});let code=extractCode(j);if(!code&&t.teamId){try{const m=await post('/op/team/members',{teamId:String(t.teamId)});code=extractCode(m)}catch(e){}}if(code){remember(code);patchOwner();try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:teamNow()}}))}catch(e){}}else if(manual){alert('O servidor reconheceu sua equipe, mas não devolveu o código de entrada. Toque em ATUALIZAR AGORA e tente novamente.')}}catch(e){if(manual)alert('Não consegui recuperar o código agora: '+(e.message||e))}finally{recovering=false}}

  function ensureJoin(){const box=$('dfOpTeamCloud'),t=teamNow();if(!box||t)return;const input=$('dfCloudCode'),join=$('dfCloudJoin');if(input&&join)return;/* o módulo principal já monta o formulário de entrada; apenas pede uma nova montagem se sumir */try{window.dispatchEvent(new CustomEvent('df-ui-ready'))}catch(e){}}
  function run(){clearTimeout(timer);timer=setTimeout(()=>{patchOwner();ensureJoin()},60)}
  function boot(){run();const mo=new MutationObserver(run);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',run);window.addEventListener('df-team-changed',run);window.addEventListener('df-team-joined',run);window.addEventListener('pageshow',run);window.addEventListener('online',()=>{run();recover(false)});setInterval(()=>{if(!document.hidden)run()},1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
