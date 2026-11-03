(function(){
'use strict';
if(window.DFTeamLicenseRestoreV1)return;window.DFTeamLicenseRestoreV1=true;
const API='https://df-team-license-restore-v1.reck-cp9.workers.dev/restore';
const ACCESS='df_auto_access_credential_v1',DEVICE='df_licenseauth_device_v1';
const FORM='df_op_team_v1',PROD='df_producao_team_v2',EXIT='df_prod_team_explicit_exit_v1';
const FLAG='df_license_team_restored_v1',ONCE='df_team_license_reloaded_once_v1';
let busy=false,lastAttempt=0,attempts=0,lastError='',lastResult=null;
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function credential(){try{return String(localStorage.getItem(ACCESS)||'').trim()}catch(e){return ''}}
function device(){try{return String(window.DFDeviceIdentity?.get?.()||localStorage.getItem(DEVICE)||'').trim()}catch(e){return ''}}
function missing(){
 const form=read(FORM),prod=read(PROD);
 const exited=localStorage.getItem(EXIT)==='1';
 return !form?.teamId||(!prod?.teamId&&!exited);
}
function persist(t){
 if(!t?.teamId||t.role!=='owner')return false;
 const area=String(t.area||'');
 const name=String(t.name||'');
 const displayName=String(t.displayName||'DF PRO');
 if(area==='extrusao'){
  const old=read(FORM);
  if(old?.teamId&&old.teamId!==t.teamId)return false;
  if(old?.teamId===t.teamId&&old.role==='owner')return false;
  localStorage.setItem(FORM,JSON.stringify({...old,teamId:t.teamId,name,role:'owner',area,displayName}));
  window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:{teamId:t.teamId,name,role:'owner'}}}));
  return true;
 }
 if(area==='producao'){
  if(localStorage.getItem(EXIT)==='1')return false;
  const old=read(PROD);
  if(old?.teamId&&old.teamId!==t.teamId)return false;
  if(old?.teamId===t.teamId&&old.role==='owner')return false;
  localStorage.setItem(PROD,JSON.stringify({...old,teamId:t.teamId,name,role:'owner',area,displayName}));
  localStorage.setItem('df_producao_member_display_name_v2',displayName);
  window.dispatchEvent(new CustomEvent('df-producao-team-changed',{detail:{team:{teamId:t.teamId,name,role:'owner',area}}}));
  return true;
 }
 return false;
}
async function restore(force){
 if(busy||navigator.onLine===false||!credential()||!device())return false;
 if(!force&&!missing())return true;
 if(!force&&Date.now()-lastAttempt<12000)return false;
 if(attempts>12&&!force)return false;
 busy=true;attempts++;lastAttempt=Date.now();
 try{
  const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({credential:credential(),deviceId:device()}),cache:'no-store',redirect:'error'});
  let json={};try{json=await res.json()}catch(e){}
  if(!res.ok||json.ok!==true){
   lastError=String(json.error||'Restauração de equipe indisponível (HTTP '+res.status+')');
   console.warn('[DF Teams]',lastError);return false;
  }
  const teams=Array.isArray(json.teams)?json.teams:[],restored=[];
  for(const team of teams)if(persist(team))restored.push(String(team.area));
  lastResult={teams:teams.map(t=>t.area),changed:Number(json.changed||0),restored};
  lastError='';
  try{localStorage.setItem(FLAG,JSON.stringify({at:new Date().toISOString(),areas:lastResult.teams}))}catch(e){}
  if(restored.length){
   window.dispatchEvent(new CustomEvent('df-license-teams-restored',{detail:{areas:restored}}));
   if(!sessionStorage.getItem(ONCE)){
    sessionStorage.setItem(ONCE,'1');
    // One local refresh is needed only to mount the recovered team screens.
    setTimeout(()=>location.reload(),260);
   }else{
    try{window.DFOpCloud?.refreshTeam?.()}catch(e){}
    try{window.DFProducaoEquipeOnline?.pull?.()}catch(e){}
   }
  }else{
   try{window.DFOpCloud?.refreshTeam?.()}catch(e){}
  }
  return true;
 }catch(e){lastError='Não foi possível conferir as equipes na nuvem';console.warn('[DF Teams]',lastError);return false}
 finally{busy=false}
}
function schedule(delay=900,force=false){setTimeout(()=>restore(force),delay)}
function boot(){
 schedule(900);
 window.addEventListener('df-auth-ready',()=>schedule(600));
 window.addEventListener('df-ui-ready',()=>schedule(1400));
 window.addEventListener('online',()=>schedule(500));
 window.addEventListener('pageshow',()=>schedule(1000));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(600)});
 setInterval(()=>{if(!document.hidden&&missing())restore(false)},30000);
}
window.DFTeamLicenseRestore={restore:()=>restore(true),status:()=>({busy,attempts,lastError,lastResult})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
