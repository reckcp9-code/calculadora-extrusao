(function(){
'use strict';
if(window.DFOpLegacyCleanupV1)return;window.DFOpLegacyCleanupV1=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1';
var MARK='df_legacy_cloud_cleanup_v1:';
var baseFetch=window.fetch.bind(window),running=false;

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function tech(v){var s=norm(v);return /^(?:DFMETA-|DFMASTER\d*-|DFNAME\d*-|DFOPMETA\d+\.|DFMASTER\d+\.|DFOPNAME\d+\.)/.test(s)}
function techObject(x){return !!(x&&(tech(x.id)||tech(x.qr)||tech(x.source)||tech(x.sourceId)||tech(x.cloudSourceId)))}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso automático indisponível');var r=await baseFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false){var er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
function monthShift(delta){var d=new Date();d.setMonth(d.getMonth()+delta);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}

function cleanupLocal(){
  var removedKeys=0,opsRemoved=0,regRemoved=0,manualRemoved=0;
  try{var keys=[];for(var i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));keys.forEach(function(k){if(!k)return;if(/^(?:df_team_owner_master_|df_op_registry_cloud_sent_|df_team_date_canonical_boot_|df_op_product_manual_migrated_v1:)/i.test(k)){localStorage.removeItem(k);removedKeys++}})}catch(e){}
  var a=load(OPS,[]);if(Array.isArray(a)){var b=a.filter(function(x){return !techObject(x)});opsRemoved=a.length-b.length;if(opsRemoved)save(OPS,b)}
  var r=load(REG,{}),next={};Object.keys(r||{}).forEach(function(k){var x=r[k];if(tech(k)||techObject(x)){regRemoved++;return}next[k]=x});if(regRemoved)save(REG,next);
  var m=load(MANUAL,{}),mn={};Object.keys(m||{}).forEach(function(k){if(tech(k)){manualRemoved++;return}mn[k]=m[k]});if(manualRemoved)save(MANUAL,mn);
  return{removedKeys:removedKeys,opsRemoved:opsRemoved,regRemoved:regRemoved,manualRemoved:manualRemoved}
}
async function cleanupCloud(force){
  if(running||navigator.onLine===false||!isOwner())return false;var t=team(),teamId=String(t&&t.teamId||'').trim();if(!teamId)return false;var mark=MARK+teamId;
  if(!force){try{if(localStorage.getItem(mark)==='1')return true}catch(e){}}
  running=true;var photos={},complete=true,deleted=0;
  try{
    for(var i=0;i<6;i++){
      try{var j=await post('/op/photo/list',{teamId:teamId,month:monthShift(-i)});(j.photos||[]).forEach(function(p){if(p&&p.id&&techObject(p))photos[String(p.id)]=p})}catch(e){complete=false}
      await sleep(35)
    }
    var ids=Object.keys(photos);
    for(var n=0;n<ids.length;n++){
      try{await post('/op/photo/delete',{id:ids[n]});deleted++}catch(e){if(Number(e&&e.status)!==404)complete=false}
      if(n%4===3)await sleep(80)
    }
    if(complete){try{localStorage.setItem(mark,'1')}catch(e){}}
    if(deleted&&window.console&&console.info)console.info('[DF] limpeza legada: '+deleted+' fotos técnicas removidas da nuvem.');
    return complete
  }finally{running=false}
}
function idle(fn){if('requestIdleCallback'in window)requestIdleCallback(function(){fn()},{timeout:5000});else setTimeout(fn,500)}
function boot(){
  cleanupLocal();
  setTimeout(function(){idle(function(){cleanupCloud(false)})},9000);
  window.addEventListener('online',function(){setTimeout(function(){idle(function(){cleanupCloud(false)})},2500)});
  window.addEventListener('df-team-changed',function(){setTimeout(function(){idle(function(){cleanupCloud(false)})},2500)});
  window.addEventListener('df-team-joined',function(){setTimeout(function(){idle(function(){cleanupCloud(false)})},2500)});
}
window.DFOpLegacyCleanup={local:cleanupLocal,cloud:function(){return cleanupCloud(true)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
