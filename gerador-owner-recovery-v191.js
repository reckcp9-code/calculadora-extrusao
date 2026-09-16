(function(){
'use strict';
if(window.DFGeradorOwnerRecoveryV191)return;window.DFGeradorOwnerRecoveryV191=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1';
var ADMIN_SECRET_KEY='df_access_admin_secret_saved_v1';
var OWNER_TOKEN_KEY='df_gerador_owner_token_v181';
var OWNER_DEVICE_KEY='df_gerador_owner_device_v181';
var busy=null,lastOk=0;

function $(id){return document.getElementById(id)}
function loadTeam(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
function saveTeam(t){try{if(t)localStorage.setItem(TEAM_KEY,JSON.stringify(t))}catch(e){}}
function secret(){var s='';try{s=String($('secret')&&$('secret').value||'').trim()}catch(e){}if(s)return s;try{return String(localStorage.getItem(ADMIN_SECRET_KEY)||'').trim()}catch(e){return''}}
function savedSession(){try{var token=String(sessionStorage.getItem(OWNER_TOKEN_KEY)||'').trim(),dev=String(sessionStorage.getItem(OWNER_DEVICE_KEY)||'').trim();return token&&dev?{token:token,deviceId:dev}:null}catch(e){return null}}
function saveSession(s){if(!s||!s.token||!s.deviceId)return;try{sessionStorage.setItem(OWNER_TOKEN_KEY,String(s.token));sessionStorage.setItem(OWNER_DEVICE_KEY,String(s.deviceId))}catch(e){}}
function first(o,names){for(var i=0;i<names.length;i++){var v=o&&o[names[i]];if(v!==undefined&&v!==null&&String(v).trim())return String(v).trim()}return''}
function when(o){var v=first(o,['lastUsedAt','lastActivity','lastSeen','updatedAt','usedAt','createdAt']);var n=Date.parse(v||'');return Number.isFinite(n)?n:0}
function timeoutFetch(url,opt,ms){return new Promise(function(resolve,reject){var done=false,c=null,to=null;try{if('AbortController'in window){c=new AbortController();opt=Object.assign({},opt||{},{signal:c.signal})}}catch(e){}to=setTimeout(function(){if(done)return;done=true;try{if(c)c.abort()}catch(e){}reject(new Error('timeout'))},ms||4500);fetch(url,opt||{}).then(async function(r){if(done)return;var j={};try{j=await r.json()}catch(e){}if(done)return;done=true;clearTimeout(to);resolve({r:r,j:j})}).catch(function(e){if(done)return;done=true;clearTimeout(to);reject(e)})})}
async function statusWith(s){if(!s)return null;try{var x=await timeoutFetch(API+'/op/team/status',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.token,'X-DF-Device':s.deviceId},body:'{}',cache:'no-store'},3500);if(!x.r.ok||x.j.ok===false||!x.j.team)return null;return x.j.team}catch(e){return null}}
function isTarget(t,target){if(!t||String(t.role||'').toLowerCase()!=='owner')return false;if(target&&target.teamId)return String(t.teamId||'')===String(target.teamId);return String(t.name||'').trim().toUpperCase()==='DF EXTRUSOR'}
async function validateSaved(target){var s=savedSession();if(!s)return null;var t=await statusWith(s);if(isTarget(t,target)){saveTeam(t);lastOk=Date.now();return s}return null}
async function adminList(){var sec=secret();if(!sec)throw new Error('senha administrativa indisponível');var x=await timeoutFetch(API+'/admin/access/list-used',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':sec},body:'{}',cache:'no-store'},5500);if(!x.r.ok||x.j.ok===false)throw new Error(x.j.error||('HTTP '+x.r.status));return Array.isArray(x.j.items)?x.j.items:[]}
function candidates(items,target){var seen={},out=[];(items||[]).forEach(function(it){if(!it||typeof it!=='object')return;var dev=first(it,['deviceId','device_id','device','boundDeviceId']);if(!dev)return;var cred=first(it,['accessCredential','access_credential','autoAccessCredential','sessionCredential','credential']);var key=first(it,['licenseKey','license_key','key']);if(!cred&&!key)return;var directTeam=first(it,['teamId','team_id']),role=first(it,['teamRole','team_role','role']);var k=dev+'|'+cred+'|'+key;if(seen[k])return;seen[k]=1;var score=when(it);if(target&&target.teamId&&directTeam===String(target.teamId))score+=1e15;if(String(role).toLowerCase()==='owner')score+=5e14;out.push({dev:dev,cred:cred,key:key,directTeam:directTeam,role:role,score:score})});out.sort(function(a,b){return b.score-a.score});return out.slice(0,40)}
async function tokenFor(c){try{if(c.cred){var x=await timeoutFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':c.dev},body:JSON.stringify({credential:c.cred,deviceId:c.dev}),cache:'no-store'},3000);if(x.r.ok&&x.j&&x.j.token)return String(x.j.token)}if(c.key){var y=await timeoutFetch(API+'/auth',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':c.dev},body:JSON.stringify({licenseKey:c.key,deviceId:c.dev}),cache:'no-store'},3000);if(y.r.ok&&y.j&&y.j.token)return String(y.j.token)}}catch(e){}return''}
async function testCandidate(c,target){var tok=await tokenFor(c);if(!tok)return null;var s={token:tok,deviceId:c.dev},t=await statusWith(s);if(!isTarget(t,target))return null;saveSession(s);saveTeam(t);lastOk=Date.now();return s}
async function recoverInternal(){var target=loadTeam();var valid=await validateSaved(target);if(valid)return valid;var items=await adminList(),list=candidates(items,target);if(!list.length)throw new Error('nenhum acesso disponível');for(var base=0;base<list.length;base+=6){var batch=list.slice(base,base+6),found=null;await Promise.all(batch.map(async function(c){if(found)return;var s=await testCandidate(c,target);if(s&&!found)found=s}));if(found)return found}throw new Error('dono da equipe não localizado')}
async function recover(force){if(!force&&Date.now()-lastOk<30000){var s=savedSession();if(s)return s}if(busy)return busy;busy=recoverInternal().finally(function(){busy=null});return busy}
function boot(){var n=0,iv=setInterval(function(){n++;if(secret()){clearInterval(iv);recover(false).then(function(){try{window.dispatchEvent(new CustomEvent('df-gerador-owner-ready'))}catch(e){}}).catch(function(){})}else if(n>80)clearInterval(iv)},150);window.addEventListener('online',function(){recover(true).then(function(){try{window.dispatchEvent(new CustomEvent('df-gerador-owner-ready'))}catch(e){}}).catch(function(){})});window.addEventListener('pageshow',function(){setTimeout(function(){recover(false).then(function(){try{window.dispatchEvent(new CustomEvent('df-gerador-owner-ready'))}catch(e){}}).catch(function(){})},300)})}
window.DFGeradorOwnerRecovery={recover:recover,getSession:savedSession};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
