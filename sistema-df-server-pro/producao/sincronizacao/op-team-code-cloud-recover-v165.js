(function(){
  'use strict';
  if(window.DFOpTeamCodeCloudRecoverV165)return;
  window.DFOpTeamCodeCloudRecoverV165=true;
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TEAM_KEY='df_op_team_v1',CODE_KEY='df_op_team_join_code_v1',TOKEN_KEY='df_secure_token_v2',ACCESS_KEY='df_auto_access_credential_v1',DEVICE_KEY='df_licenseauth_device_v1';
  let busy=false,tried=false,timer=0;
  const $=id=>document.getElementById(id);
  const digits=v=>{const s=String(v==null?'':v).replace(/\D/g,'');return s.length>=6&&s.length<=12?s:''};
  function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t)return t}}catch(e){}try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
  function code(){try{return digits(localStorage.getItem(CODE_KEY)||'')}catch(e){return''}}
  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
  function extract(o,depth){if(!o||depth>3)return'';if(typeof o!=='object')return'';for(const k of ['joinCode','join_code','code','inviteCode','invite_code']){const c=digits(o[k]);if(c)return c}for(const k of ['team','data','result']){const c=extract(o[k],depth+1);if(c)return c}return''}
  function saveCode(c){c=digits(c);if(!c)return false;try{localStorage.setItem(CODE_KEY,c);const t=team();if(t&&String(t.role||'').toLowerCase()==='owner'){localStorage.setItem(TEAM_KEY,JSON.stringify(Object.assign({},t,{joinCode:c})))}}catch(e){}try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:team()}}))}catch(e){}return true}
  async function token(){let t='';try{t=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}if(t)return t;let cred='';try{cred=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}const dev=deviceId();if(!cred||!dev)return'';const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:cred,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)return'';t=String(j.token||'').trim();if(t)try{sessionStorage.setItem(TOKEN_KEY,t)}catch(e){}return t}
  async function post(path,body){const t=await token(),dev=deviceId();if(!t||!dev)return null;const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}return r.ok&&j.ok!==false?j:null}
  function addManual(){const owner=team(),actions=$('dfTeamCodeSafeActions');if(!actions||!owner||String(owner.role||'').toLowerCase()!=='owner'||code())return;let b=$('dfTeamCodeManual');if(!b){b=document.createElement('button');b.id='dfTeamCodeManual';b.type='button';b.textContent='✍️ INFORMAR CÓDIGO DA EQUIPE';actions.appendChild(b)}b.onclick=()=>{const v=prompt('Digite o código da sua equipe:');if(saveCode(v)){b.textContent='✅ CÓDIGO SALVO';setTimeout(()=>location.reload(),250)}else if(v!=null)alert('Digite um código válido da equipe.')};
  }
  async function recover(){if(busy||tried||code())return;const t=team();if(!t||String(t.role||'').toLowerCase()!=='owner')return;busy=true;tried=true;try{let j=await post('/op/team/status',{}),c=extract(j,0);if(!c&&t.teamId){j=await post('/op/team/members',{teamId:String(t.teamId)});c=extract(j,0)}if(c){saveCode(c);return}addManual()}catch(e){addManual()}finally{busy=false}}
  function run(){clearTimeout(timer);timer=setTimeout(()=>{if(code())return;addManual();recover()},120)}
  function boot(){run();window.addEventListener('df-ui-ready',run);window.addEventListener('df-team-changed',run);window.addEventListener('df-team-joined',run);window.addEventListener('pageshow',run);setTimeout(run,900);setTimeout(run,2200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
