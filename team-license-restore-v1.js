(function(){
'use strict';
if(window.DFTeamLicenseRestoreV1)return;window.DFTeamLicenseRestoreV1=true;
const API='https://df-team-license-restore-v1.reck-cp9.workers.dev/restore';
const ACCESS='df_auto_access_credential_v1',DEVICE='df_licenseauth_device_v1';
const FORM='df_op_team_v1',PROD='df_producao_team_v2',EXIT='df_prod_team_explicit_exit_v1';
const FLAG='df_license_team_restored_v1',ONCE='df_team_license_reloaded_once_v1';
let busy=false,lastAttempt=0,attempts=0,lastError='',lastResult=null,verifiedThisPage=false,verifiedDevice='',verifiedCredential='';
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
// Restitui o cadastro oficial de máquinas e produtos sem publicar dados vazios do novo iPhone.
function sameHash(v){let data='';try{data=JSON.stringify(v)}catch(e){data=String(v||'')}let h=2166136261;for(let i=0;i<data.length;i++){h^=data.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function hasCatalog(cfg){return cfg&&typeof cfg==='object'&&Object.values(cfg).some(v=>v&&typeof v==='object'&&(['machines','operators','products'].some(k=>Array.isArray(v[k])&&v[k].length>0)))}
function recoverProductionCatalog(t){
 if(t?.area!=='producao'||!t.catalog?.config||!hasCatalog(t.catalog.config))return false;
 const team=read(PROD);if(!team?.teamId||team.teamId!==t.teamId||team.role!=='owner')return false;
 const k='df_producao_cadastros_v1',sk='df_producao_team_catalog_snapshot_v2';
 const old=read(k)||{},snap=read(sk)||{};
 const remoteDate=Date.parse(String(t.catalog.verifiedAt||t.catalog.updatedAt||''));
 const remoteTs=Number.isFinite(remoteDate)?remoteDate:0;
 // Proteger alterações locais ainda não enviadas. Na instalação nova o catálogo fica vazio.
 if(hasCatalog(old)&&!(snap.teamId===t.teamId&&snap.hash===sameHash(old)&&remoteTs>Number(snap.ts||0)))return false;
 const cfg=t.catalog.config;localStorage.setItem(k,JSON.stringify(cfg));
 localStorage.setItem(sk,JSON.stringify({teamId:t.teamId,hash:sameHash(cfg),ts:remoteTs,updatedAt:t.catalog.updatedAt||t.catalog.verifiedAt||''}));
 window.dispatchEvent(new CustomEvent('df-producao-cadastros-sincronizados',{detail:{teamId:t.teamId,restoredFromD1:true}}));
 return true;
}
async function restore(force){
 if(busy||navigator.onLine===false||!credential()||!device())return false;
 // Ter a equipe no localStorage NAO comprova que o servidor reconheceu o novo aparelho.
 if(!force&&verifiedThisPage&&verifiedDevice===device()&&verifiedCredential===credential())return true;
 if(!force&&Date.now()-lastAttempt<12000)return false;
 // Continuar recuperando com intervalo; nao desistir silenciosamente em novos iPhones.
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
  // Uma licença que não possua as equipes atuais não pode validar um cache de outro aparelho.
  const currentForm=read(FORM),currentProd=read(PROD);
  if(currentForm?.teamId&&!teams.some(t=>t.area==='extrusao'&&t.teamId===currentForm.teamId))throw Error('A equipe de Formulação não foi confirmada no D1.');
  if(currentProd?.teamId&&!teams.some(t=>t.area==='producao'&&t.teamId===currentProd.teamId))throw Error('A equipe de Produção não foi confirmada no D1.');
  for(const team of teams)if(persist(team))restored.push(String(team.area));
  const catalogRecovered=teams.some(t=>recoverProductionCatalog(t));
  lastResult={teams:teams.map(t=>t.area),changed:Number(json.changed||0),restored,catalogRecovered};
  lastError='';verifiedThisPage=true;verifiedDevice=device();verifiedCredential=credential();
  try{localStorage.setItem(FLAG,JSON.stringify({at:new Date().toISOString(),areas:lastResult.teams,verifiedBy:'cloudflare-d1-v2'}))}catch(e){}
  if(restored.length)window.dispatchEvent(new CustomEvent('df-license-teams-restored',{detail:{areas:restored}}));
  const needsRebuild=restored.length>0||Number(json.changed||0)>0||catalogRecovered;
  if(needsRebuild&&!sessionStorage.getItem(ONCE)){
   sessionStorage.setItem(ONCE,'1');
   // A transferência de propriedade ou do catálogo exige uma única reconstrução de todas as abas.
   setTimeout(()=>location.reload(),300);
  }else{
   // Se os componentes já existem, reparar a sessão em tempo real sem atualização manual.
   try{await window.DFOpCloud?.refreshTeam?.()}catch(e){}
   try{await window.DFProducaoEquipeOnline?.pull?.()}catch(e){}
   window.dispatchEvent(new CustomEvent('df-license-teams-server-verified',{detail:{areas:lastResult.teams}}));
  }
  return true;
 }catch(e){lastError=String(e?.message||'Não foi possível conferir as equipes na nuvem');console.warn('[DF Teams]',lastError);return false}
 finally{busy=false}
}
function schedule(delay=900,force=false){setTimeout(()=>restore(force),delay)}
function boot(){
 // A recuperação roda em toda abertura, inclusive quando existem equipes no cache.
 schedule(900,true);
 window.addEventListener('df-auth-ready',()=>schedule(600));
 window.addEventListener('df-ui-ready',()=>schedule(1400));
 window.addEventListener('online',()=>schedule(500));
 window.addEventListener('pageshow',()=>schedule(1000));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(600)});
 setInterval(()=>{if(!document.hidden&&!verifiedThisPage)restore(false)},15000);
}
window.DFTeamLicenseRestore={restore:()=>restore(true),status:()=>({busy,attempts,lastError,lastResult})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
