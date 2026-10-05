(function(){
'use strict';
if(window.DF_PRODUCAO_EQUIPE_RECOVERY_V1)return;window.DF_PRODUCAO_EQUIPE_RECOVERY_V1=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const AREA='producao';
const TEAM_KEY='df_producao_team_v2';
const NAME_KEY='df_producao_member_display_name_v2';
const TOKEN_KEY='df_secure_token_v2';
const DEVICE_KEY='df_licenseauth_device_v1';
const ACCESS_KEY='df_auto_access_credential_v1';
const SESSION_MARK='df_prod_team_recovered_v254';
let busy=false,lastTry=0;

function readTeam(){try{const t=JSON.parse(localStorage.getItem(TEAM_KEY)||'null');return t&&t.teamId?t:null}catch(e){return null}}
function validTeam(t){return !!(t&&t.teamId&&String(t.area||'').toLowerCase()===AREA&&!/DF\s*EXTRUSOR/i.test(String(t.name||'')))}
function normalizeLegacy(){
  const t=readTeam();if(!t||validTeam(t))return !!t;
  const area=String(t.area||'').toLowerCase(),name=String(t.name||'');
  if(!area&&/PRODU/i.test(name)&&!/EXTRUSOR/i.test(name)){
    t.area=AREA;try{localStorage.setItem(TEAM_KEY,JSON.stringify(t));return true}catch(e){}
  }
  return false;
}
function deviceId(){try{const x=String(window.DFDeviceIdentity?.get?.()||'').trim();if(x)return x}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){
  let token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
  const p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;
  let credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
  const dev=deviceId();if(!credential||!dev)throw Error('sessao indisponivel');
  const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok||j.ok===false||!j.token)throw Error(j.error||'sessao indisponivel');
  token=String(j.token);try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}return token;
}
async function status(retry){
  const token=await renewSession(false),dev=deviceId();
  const r=await fetch(API+'/op/team/status',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify({area:AREA,scope:AREA}),cache:'no-store'});
  if(r.status===401&&retry!==false){await renewSession(true);return status(false)}
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok||j.ok===false)throw Error(j.error||('HTTP '+r.status));return j;
}
function saveRecovered(t){
  const team={...t,area:AREA};
  try{localStorage.setItem(TEAM_KEY,JSON.stringify(team))}catch(e){return false}
  const n=String(team.displayName||'').trim();if(n)try{localStorage.setItem(NAME_KEY,n)}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-producao-team-changed',{detail:{team,recovered:true}}))}catch(e){}
  return true;
}
async function recover(force){
  if(validTeam(readTeam()))return true;
  if(normalizeLegacy()&&validTeam(readTeam()))return true;
  if(navigator.onLine===false||busy)return false;
  if(!force&&Date.now()-lastTry<5000)return false;
  busy=true;lastTry=Date.now();
  try{
    const j=await status(true),t=j&&j.team;
    if(!t||!t.teamId||String(t.area||j.area||AREA).toLowerCase()!==AREA)return false;
    if(!saveRecovered({...t,area:AREA}))return false;
    let reloaded=false;try{reloaded=sessionStorage.getItem(SESSION_MARK)==='1';sessionStorage.setItem(SESSION_MARK,'1')}catch(e){}
    if(!reloaded)setTimeout(()=>location.reload(),120);
    return true;
  }catch(e){return false}finally{busy=false}
}
function start(){
  if(validTeam(readTeam()))return;
  recover(true);
  setTimeout(()=>recover(false),1200);
  setTimeout(()=>recover(false),3500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('online',()=>recover(true));
window.addEventListener('pageshow',()=>{if(!validTeam(readTeam()))recover(false)});
window.DFProducaoTeamRecovery={recover:()=>recover(true)};
})();
