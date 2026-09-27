(function(){
'use strict';
if(window.DFOpProductD1AuthorityV1)return;window.DFOpProductD1AuthorityV1=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1';
var CACHE_PREFIX='df_op_product_server_cache_v1:';
var busy=false,supported=false,unsupportedUntil=0,lastPull=0,timer=0,observer=null;
var baseFetch=window.fetch.bind(window);

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function cacheKey(){var t=team();return CACHE_PREFIX+String(t&&t.teamId||'none')}
function cache(){return load(cacheKey(),{products:[],revision:0,updatedAt:''})}
function status(text,type){var m=document.getElementById('dfCloudRuntimeMsg');if(m&&text){m.textContent=text;m.className=type||''}}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso automático indisponível');var r=await baseFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false){var er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}

function registryName(id){id=norm(id);var r=load(REG,{}),name='';Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)!==id)return false;var e=x.expected||{};name=validName(e.title)||validName(e.produto)||validName(e.product)||validName(e.clienteFormulacao);return !!name});return name}
function opName(o){return validName(o&&o.manualProductName)||validName(o&&o.serverProductName)||validName(o&&o.clienteFormulacao)||validName(o&&o.produto)||validName(o&&o.product)||validName(o&&o.nomeProduto)||validName(o&&o.opNome)||''}
function localOwnerMap(){
  var out={},m=load(MANUAL,{}),a=load(OPS,[]);
  Object.keys(m||{}).forEach(function(k){var n=validName(m[k]);if(n)out[norm(k)]=n});
  if(Array.isArray(a))a.forEach(function(o){if(!o||o.status!=='ok')return;var id=ids(o)[0];if(!id)return;var n=validName(m[id])||registryName(id)||opName(o);if(n)out[id]=n});
  return out;
}
function writeName(id,name,revision,updatedAt){
  id=norm(id);name=validName(name);if(!id||!name)return false;var changed=false,a=load(OPS,[]);if(!Array.isArray(a))a=[];
  a.forEach(function(o){if(ids(o).indexOf(id)<0)return;var rev=Number(revision||0);if(Number(o.serverProductRevision||0)>rev&&rev>0)return;if(o.serverProductName!==name||o.manualProductName!==name||o.clienteFormulacao!==name||o.produto!==name||o.product!==name){o.serverProductName=name;o.manualProductName=name;o.clienteFormulacao=name;o.produto=name;o.product=name;o.nomeProduto=name;o.opNome=name;changed=true}o.serverProductRevision=rev;o.serverProductUpdatedAt=String(updatedAt||'')});
  if(changed)save(OPS,a);
  var m=load(MANUAL,{});if(m[id]!==name){m[id]=name;save(MANUAL,m);changed=true}
  var r=load(REG,{}),key=null;Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===id){key=k;return true}return false});if(!key)key=id;var x=r[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};if(x.expected.title!==name||x.expected.produto!==name||x.expected.product!==name){x.expected.title=name;x.expected.produto=name;x.expected.product=name;changed=true}x.serverProductRevision=Number(revision||0);x.serverProductUpdatedAt=String(updatedAt||'');r[key]=x;save(REG,r);return changed
}
function rowsMap(rows){var out={};(rows||[]).forEach(function(x){var id=norm(x&&x.opCode||x&&x.id),name=validName(x&&x.productName||x&&x.name);if(id&&name)out[id]={name:name,revision:Number(x&&x.revision||0),updatedAt:String(x&&x.updatedAt||'')}});return out}
function patchUi(map){
  map=map||rowsMap(cache().products);var box=document.getElementById('dfOkList');if(!box)return;
  var a=load(OPS,[]),by={};if(Array.isArray(a))a.forEach(function(o){ids(o).forEach(function(id){if(!by[id])by[id]=o})});
  box.querySelectorAll('.dfOpList').forEach(function(row){var b=row.querySelector('[data-view]'),id=norm(b&&b.getAttribute('data-view')),sv=map[id],o=by[id];if(!id||!sv||!o)return;var tiny=row.querySelector('.dfOpsTiny');if(!tiny)return;var n=Number(o.produzido||0),ap=Number(o.apara||0);var text=String(o.data||'')+' • '+sv.name+' • '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' kg • Apara '+ap.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' kg';if(tiny.textContent!==text)tiny.textContent=text});
}
function applyRows(rows,revision,updatedAt){
  var map=rowsMap(rows),changed=false;Object.keys(map).forEach(function(id){var x=map[id];if(writeName(id,x.name,x.revision||revision,x.updatedAt||updatedAt))changed=true});
  save(cacheKey(),{products:rows||[],revision:Number(revision||0),updatedAt:String(updatedAt||new Date().toISOString())});patchUi(map);
  if(changed){try{window.dispatchEvent(new CustomEvent('df-product-server-applied',{detail:{count:Object.keys(map).length,revision:Number(revision||0)}}))}catch(e){}try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{server:true,count:Object.keys(map).length}}))}catch(e){}}
  return changed
}
async function pull(forceMsg){
  if(busy||navigator.onLine===false){applyRows(cache().products,cache().revision,cache().updatedAt);return false}
  if(!forceMsg&&Date.now()<unsupportedUntil)return false;var t=team();if(!t||!t.teamId)return false;busy=true;
  try{var j=await post('/op/product/list',{teamId:t.teamId});supported=true;unsupportedUntil=0;lastPull=Date.now();applyRows(j.products||[],j.revision,j.updatedAt);if(forceMsg)status('✅ Produtos sincronizados pelo servidor.','ok');return true}catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000;return false}if(forceMsg)status('⚠️ Não consegui sincronizar os produtos: '+String(e&&e.message||e),'warn');return false}finally{busy=false}
}
async function seedMissing(forceMsg){
  var t=team();if(!t||!t.teamId||!isOwner())return pull(forceMsg);if(busy)return false;busy=true;
  try{
    var j=await post('/op/product/list',{teamId:t.teamId});supported=true;unsupportedUntil=0;applyRows(j.products||[],j.revision,j.updatedAt);
    var server=rowsMap(j.products||[]),local=localOwnerMap(),missing=[];Object.keys(local).forEach(function(id){if(!server[id])missing.push({opCode:id,productName:local[id]})});
    if(missing.length){await post('/op/product/sync',{teamId:t.teamId,fillOnly:true,products:missing});j=await post('/op/product/list',{teamId:t.teamId});applyRows(j.products||[],j.revision,j.updatedAt)}
    lastPull=Date.now();if(forceMsg)status('✅ Produtos oficiais sincronizados: '+Object.keys(rowsMap(j.products||[])).length+' OPs.','ok');return true
  }catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000;return false}if(forceMsg)status('⚠️ Não consegui sincronizar os produtos: '+String(e&&e.message||e),'warn');return false}finally{busy=false}
}
async function setOne(id,name){
  id=norm(id);name=validName(name);var t=team();if(!isOwner()||!t||!t.teamId||!id||!name)return false;if(busy){setTimeout(function(){setOne(id,name)},250);return false}busy=true;
  try{await post('/op/product/sync',{teamId:t.teamId,fillOnly:false,products:[{opCode:id,productName:name}]});supported=true;unsupportedUntil=0;var j=await post('/op/product/list',{teamId:t.teamId});applyRows(j.products||[],j.revision,j.updatedAt);return true}catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000;return false}return false}finally{busy=false}
}
function syncNow(forceMsg){return isOwner()?seedMissing(!!forceMsg):pull(!!forceMsg)}
function queue(delay,forceMsg){clearTimeout(timer);timer=setTimeout(function(){syncNow(!!forceMsg)},delay==null?150:delay)}

function boot(){
  applyRows(cache().products,cache().revision,cache().updatedAt);
  if(!observer){observer=new MutationObserver(function(){patchUi()});observer.observe(document.documentElement,{childList:true,subtree:true})}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(b)queue(300,true)},true);
  window.addEventListener('df-prontas-products-synced',function(e){var d=e&&e.detail||{};if(d.server)return;if(isOwner()&&d.manual&&d.id&&d.name)setTimeout(function(){setOne(d.id,d.name)},40);else if(supported)setTimeout(function(){applyRows(cache().products,cache().revision,cache().updatedAt)},30)});
  window.addEventListener('df-owner-master-applied',function(){if(supported)setTimeout(function(){applyRows(cache().products,cache().revision,cache().updatedAt)},20)});
  ['df-team-joined','df-team-changed','online','pageshow','focus'].forEach(function(ev){window.addEventListener(ev,function(){queue(250,false)})});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)queue(200,false)});
  setTimeout(function(){queue(0,false)},1200);setTimeout(function(){queue(0,false)},4500);
  setInterval(function(){if(document.hidden||navigator.onLine===false)return;if(Date.now()-lastPull>7000)pull(false);else patchUi()},5000)
}
window.DFOpProductD1Authority={sync:syncNow,pull:pull,set:setOne,active:function(){return supported===true},cache:function(){return cache()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
