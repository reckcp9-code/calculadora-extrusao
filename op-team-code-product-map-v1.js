(function(){
'use strict';
if(window.DFOpTeamCodeProductMapV1)return;window.DFOpTeamCodeProductMapV1=true;

var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var CACHE='df_team_owner_master_cache_v3',SIG='df_team_owner_master_sig_v3';
var busy=false,timer=0;

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}

function registryName(id){
  id=norm(id);var r=load(REG,{}),name='';
  Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)!==id)return false;var e=x.expected||{};name=validName(e.title)||validName(e.produto)||validName(e.product);return !!name});
  return name;
}
function opName(o){return validName(o&&o.manualProductName)||validName(o&&o.clienteFormulacao)||validName(o&&o.produto)||validName(o&&o.product)||validName(o&&o.nomeProduto)||validName(o&&o.opNome)||''}
function exactOwnerName(id,o){
  id=norm(id);var m=load(MANUAL,{}),name=validName(m[id]);
  if(name)return name;
  name=registryName(id);if(name)return name;
  name=opName(o);if(name)return name;
  return '';
}
function writeName(id,name,ts){
  id=norm(id);name=validName(name);if(!id||!name)return false;var changed=false,a=load(OPS,[]);if(!Array.isArray(a))a=[];
  a.forEach(function(o){if(ids(o).indexOf(id)<0)return;if(opName(o)!==name||o.manualProductName!==name){o.manualProductName=name;o.clienteFormulacao=name;o.produto=name;o.product=name;o.nomeProduto=name;o.opNome=name;changed=true}o.teamProductNameTs=Number(ts||Date.now())});
  if(changed)save(OPS,a);
  var m=load(MANUAL,{});if(m[id]!==name){m[id]=name;save(MANUAL,m);changed=true}
  var r=load(REG,{}),key=null;Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===id){key=k;return true}return false});if(!key)key=id;
  var x=r[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};
  if(x.expected.title!==name||x.expected.produto!==name||x.expected.product!==name){x.expected.title=name;x.expected.produto=name;x.expected.product=name;changed=true}x.teamProductNameTs=Number(ts||Date.now());r[key]=x;save(REG,r);
  return changed;
}
function ownerMap(){
  var a=load(OPS,[]),map={};if(!Array.isArray(a))return map;
  a.forEach(function(o){if(!o||o.status!=='ok')return;var id=ids(o)[0];if(!id)return;var name=exactOwnerName(id,o);if(name){map[id]=name;writeName(id,name,Date.now())}});
  return map;
}
function cacheMap(){
  var snap=load(CACHE,null),map={};if(!snap||!Array.isArray(snap.rows))return map;
  snap.rows.forEach(function(r){var id=norm(r&&r[0]),name=validName(r&&r[1]);if(id&&name)map[id]=name});return map;
}
function applyMap(map){
  var changed=false;Object.keys(map||{}).forEach(function(id){if(writeName(id,map[id],Date.now()))changed=true});
  if(changed){try{var m=document.getElementById('dfOpMonth');if(m)m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}try{window.dispatchEvent(new CustomEvent('df-op-code-product-applied'))}catch(e){}}
  return changed;
}
async function publishOwnerNames(forceMaster){
  if(!isOwner()||busy)return false;busy=true;
  try{
    ownerMap();
    if(forceMaster){try{localStorage.removeItem(SIG)}catch(e){}var master=window.DFOpTeamOwnerMaster;if(master&&typeof master.publish==='function')try{await master.publish(true)}catch(e){}}
    return true;
  }finally{busy=false}
}
async function pullOperatorNames(){
  if(isOwner()||busy)return false;busy=true;
  try{
    var master=window.DFOpTeamOwnerMaster;if(master&&typeof master.pull==='function')try{await master.pull(true)}catch(e){}
    applyMap(cacheMap());
    setTimeout(function(){applyMap(cacheMap())},250);
    setTimeout(function(){applyMap(cacheMap())},900);
    return true;
  }finally{busy=false}
}
function syncNow(){return isOwner()?publishOwnerNames(true):pullOperatorNames()}
function queueSync(delay){clearTimeout(timer);timer=setTimeout(syncNow,delay==null?200:delay)}

function boot(){
  if(isOwner())ownerMap();else applyMap(cacheMap());
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(b)queueSync(300)},true);
  window.addEventListener('df-prontas-products-synced',function(e){var d=e&&e.detail||{};if(isOwner()&&d.id&&d.name){writeName(d.id,d.name,Date.now());queueSync(100)}else if(!isOwner())setTimeout(function(){applyMap(cacheMap())},80)});
  window.addEventListener('df-owner-master-applied',function(){if(!isOwner())setTimeout(function(){applyMap(cacheMap())},30)});
  window.addEventListener('pageshow',function(){queueSync(250)});
  window.addEventListener('focus',function(){queueSync(250)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)queueSync(250)});
  window.addEventListener('online',function(){queueSync(250)});
  setTimeout(syncNow,1200);setTimeout(syncNow,3500);
  setInterval(function(){if(!document.hidden)syncNow()},7000);
}
window.DFOpTeamCodeProductMap={sync:syncNow,apply:function(){return applyMap(cacheMap())},ownerMap:ownerMap};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
