(function(){
'use strict';
if(window.DFTeamTabPermissionsV178)return;window.DFTeamTabPermissionsV178=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1',CACHE_KEY='df_team_tab_permissions_v1';
var TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
var PREFIX='DFPERM1.',SOURCE='DFPERM-';
var rawFetch=window.fetch.bind(window),syncing=false,observer=null;
var DEFAULT_TABS={extrusao:true,formulacao:true,sacolas:true,custo:true,curso:true};
var activeTabs=Object.assign({},DEFAULT_TABS);

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function team(){var t=load(TEAM_KEY,null);return t&&typeof t==='object'?t:null}
function isOwner(t){return String(t&&t.role||'').toLowerCase()==='owner'}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{var s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var tok='';try{tok=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}var p=tokenPayload(tok);if(tok&&!force&&p&&p.owner)return tok;var cred='';try{cred=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}var dev=deviceId();if(!cred||!dev)throw new Error('acesso indisponível');var r=await rawFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:cred,deviceId:dev}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');tok=String(j.token||'').trim();if(!tok)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN_KEY,tok)}catch(e){}return tok}
async function post(path,body,retry){var tok=await renew(false),dev=deviceId(),r=await rawFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
function month(off){var d=new Date();d.setMonth(d.getMonth()+(off||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function isArtifact(p){var q=String(p&&p.qr||''),s=String(p&&p.sourceId||'');return q.indexOf(PREFIX)===0||s.indexOf(SOURCE)===0}

function normalizeTabs(v){var x=v&&typeof v==='object'?v:{};return{
  extrusao:x.extrusao!==false,
  formulacao:x.formulacao!==false,
  sacolas:x.sacolas!==false,
  custo:x.custo!==false,
  curso:x.curso!==false
}}
function readCached(t){if(!t||!t.teamId)return null;var all=load(CACHE_KEY,{}),p=all&&all[t.teamId];return p&&p.tabs?Object.assign({},p,{tabs:normalizeTabs(p.tabs)}):null}
function cachePayload(p){if(!p||!p.teamId||!p.tabs)return;var all=load(CACHE_KEY,{});if(!all||typeof all!=='object')all={};all[p.teamId]={teamId:p.teamId,tabs:normalizeTabs(p.tabs),updatedAt:p.updatedAt||new Date().toISOString()};save(CACHE_KEY,all)}

function deniedKeyFromNode(node){if(!node||node.nodeType!==1)return'';var id=String(node.id||'');if(id==='btEx'||id==='pgEx')return'extrusao';if(id==='btFo'||id==='pgFo')return'formulacao';if(id==='btSa'||id==='pgSa')return'sacolas';if(id==='btCu'||id==='pgCu')return'custo';var oc=String(node.getAttribute&&node.getAttribute('onclick')||'');if(/curso\.html/i.test(oc))return'curso';if(/show\(['"]ex['"]\)/i.test(oc))return'extrusao';if(/show\(['"]fo['"]\)/i.test(oc))return'formulacao';if(/show\(['"]sa['"]\)/i.test(oc))return'sacolas';if(/show\(['"]cu['"]\)/i.test(oc))return'custo';return''}
function addStyle(){if(document.getElementById('dfTeamTabPermStyleV178'))return;var s=document.createElement('style');s.id='dfTeamTabPermStyleV178';s.textContent='.dfTeamPermDenied{display:none!important}';document.head.appendChild(s)}
function selectorNodes(){var out=[];['btEx','btFo','btSa','btCu','pgEx','pgFo','pgSa','pgCu'].forEach(function(id){var e=document.getElementById(id);if(e)out.push(e)});try{document.querySelectorAll('.tabs [onclick],.tab[onclick]').forEach(function(e){if(out.indexOf(e)<0)out.push(e)})}catch(e){}return out}
function fallbackAllowed(){if(activeTabs.extrusao)return'ex';if(activeTabs.formulacao)return'fo';if(activeTabs.sacolas)return'sa';if(activeTabs.custo)return'cu';return''}
function enforce(){addStyle();var t=team();if(!t||isOwner(t)){activeTabs=Object.assign({},DEFAULT_TABS);selectorNodes().forEach(function(e){e.classList.remove('dfTeamPermDenied')});return}
  selectorNodes().forEach(function(e){var k=deniedKeyFromNode(e);if(!k)return;if(activeTabs[k]===false)e.classList.add('dfTeamPermDenied');else e.classList.remove('dfTeamPermDenied')});
  var active=document.querySelector('.page.on');if(active){var k=deniedKeyFromNode(active);if(k&&activeTabs[k]===false){var f=fallbackAllowed();if(f&&typeof window.show==='function'){try{window.show(f)}catch(e){}}}}
}
function applyPayload(p){var t=team();if(!t||isOwner(t)){activeTabs=Object.assign({},DEFAULT_TABS);enforce();return}if(p&&p.teamId===t.teamId&&p.tabs){activeTabs=normalizeTabs(p.tabs);cachePayload(p)}else{var c=readCached(t);activeTabs=c&&c.tabs?normalizeTabs(c.tabs):Object.assign({},DEFAULT_TABS)}enforce();try{window.dispatchEvent(new CustomEvent('df-team-tab-permissions',{detail:{tabs:Object.assign({},activeTabs),teamId:t.teamId}}))}catch(e){}}
function latestFrom(photos,t){var best=null;(photos||[]).forEach(function(p){var q=String(p&&p.qr||'');if(q.indexOf(PREFIX)!==0)return;var x=dec(q.slice(PREFIX.length));if(!x||String(x.teamId||'')!==String(t.teamId||''))return;var stamp=String(x.updatedAt||p.updatedAt||p.createdAt||'');if(!best||stamp>String(best.updatedAt||''))best={teamId:x.teamId,tabs:normalizeTabs(x.tabs),updatedAt:stamp||new Date().toISOString()}});return best}
async function refreshTeam(){try{var j=await post('/op/team/status',{});if(j&&Object.prototype.hasOwnProperty.call(j,'team')){if(j.team)save(TEAM_KEY,j.team);else try{localStorage.removeItem(TEAM_KEY)}catch(e){}return j.team||null}}catch(e){}return team()}
async function sync(force){if(syncing||navigator.onLine===false||document.hidden)return false;syncing=true;try{var t=await refreshTeam();if(!t){activeTabs=Object.assign({},DEFAULT_TABS);enforce();return false}if(isOwner(t)){activeTabs=Object.assign({},DEFAULT_TABS);enforce();return true}var a=await post('/op/photo/list',{teamId:t.teamId,month:month(0)}),b={photos:[]};try{b=await post('/op/photo/list',{teamId:t.teamId,month:month(-1)})}catch(e){}var p=latestFrom([].concat(a.photos||[],b.photos||[]),t);applyPayload(p);return true}catch(e){applyPayload(null);return false}finally{syncing=false}}

window.fetch=async function(input,init){var r=await rawFetch(input,init);try{var u=new URL(typeof input==='string'?input:(input&&input.url)||'',location.href);if(u.hostname==='df-extrusor-api.reck-cp9.workers.dev'&&u.pathname==='/op/photo/list'&&r.ok){var j=await r.clone().json();if(Array.isArray(j.photos)){var clean=j.photos.filter(function(p){return !isArtifact(p)});if(clean.length!==j.photos.length){j.photos=clean;var h=new Headers(r.headers);h.delete('content-length');h.delete('content-encoding');return new Response(JSON.stringify(j),{status:r.status,statusText:r.statusText,headers:h})}}}}catch(e){}return r};

document.addEventListener('click',function(e){var n=e.target&&e.target.closest?e.target.closest('#btEx,#btFo,#btSa,#btCu,.tabs [onclick],.tab[onclick]'):null;if(!n)return;var t=team();if(!t||isOwner(t))return;var k=deniedKeyFromNode(n);if(k&&activeTabs[k]===false){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}},true);
function observe(){if(observer)return;observer=new MutationObserver(function(){enforce()});observer.observe(document.documentElement,{childList:true,subtree:true})}
function boot(){var t=team(),c=readCached(t);if(t&&!isOwner(t))activeTabs=c&&c.tabs?normalizeTabs(c.tabs):Object.assign({},DEFAULT_TABS);enforce();observe();setTimeout(function(){sync(false)},650);setTimeout(enforce,1300);window.addEventListener('online',function(){setTimeout(function(){sync(true)},180)});window.addEventListener('pageshow',function(){setTimeout(function(){sync(false)},220)});window.addEventListener('df-team-changed',function(){setTimeout(function(){sync(true)},120)});window.addEventListener('df-team-joined',function(){setTimeout(function(){sync(true)},120)});window.addEventListener('df-ui-ready',function(){setTimeout(enforce,80)});setInterval(function(){if(!document.hidden)sync(false)},60000)}
window.DFTeamTabPermissions={sync:sync,get:function(){return Object.assign({},activeTabs)},apply:applyPayload};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();