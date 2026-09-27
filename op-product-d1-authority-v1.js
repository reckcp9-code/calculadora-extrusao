(function(){
'use strict';
if(window.DFOpProductD1AuthorityV1)return;window.DFOpProductD1AuthorityV1=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1';
var CACHE_PREFIX='df_op_product_server_cache_v1:',PENDING_PREFIX='df_op_product_pending_v1:';
var busy=false,supported=false,unsupportedUntil=0,lastPull=0,timer=0,uiTimer=0,listObserver=null,rootObserver=null;
var baseFetch=window.fetch.bind(window);

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function teamId(){var t=team();return String(t&&t.teamId||'').trim()}
function cacheKey(){return CACHE_PREFIX+(teamId()||'none')}
function pendingKey(){return PENDING_PREFIX+(teamId()||'none')}
function cache(){return load(cacheKey(),{products:[],revision:0,updatedAt:''})}
function status(text,type){var m=document.getElementById('dfCloudRuntimeMsg');if(m&&text){m.textContent=text;m.className=type||''}}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso automático indisponível');var r=await baseFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false){var er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}

function opName(o){return validName(o&&o.serverProductName)||validName(o&&o.manualProductName)||validName(o&&o.clienteFormulacao)||validName(o&&o.produto)||validName(o&&o.product)||validName(o&&o.nomeProduto)||validName(o&&o.opNome)||''}
function rowsMap(rows){var out={};(rows||[]).forEach(function(x){var id=norm(x&&x.opCode||x&&x.id),name=validName(x&&x.productName||x&&x.name);if(id&&name)out[id]={name:name,revision:Number(x&&x.revision||0),updatedAt:String(x&&x.updatedAt||'')}});return out}
function localOwnerMap(){
  var out={},manual=load(MANUAL,{}),reg=load(REG,{}),regNames={},a=load(OPS,[]);
  Object.keys(reg||{}).forEach(function(k){var x=reg[k]||{},id=norm(x.id||k),e=x.expected||{},n=validName(e.title)||validName(e.produto)||validName(e.product)||validName(e.clienteFormulacao);if(id&&n)regNames[id]=n});
  Object.keys(manual||{}).forEach(function(k){var n=validName(manual[k]);if(n)out[norm(k)]=n});
  if(Array.isArray(a))a.forEach(function(o){if(!o||o.status!=='ok')return;var id=ids(o)[0];if(!id)return;var n=validName(manual[id])||regNames[id]||opName(o);if(n)out[id]=n});
  return out
}
function patchUi(map,ops){
  map=map||rowsMap(cache().products);var box=document.getElementById('dfOkList');if(!box)return;
  ops=Array.isArray(ops)?ops:load(OPS,[]);var by={};if(Array.isArray(ops))ops.forEach(function(o){ids(o).forEach(function(id){if(!by[id])by[id]=o})});
  box.querySelectorAll('.dfOpList').forEach(function(row){var b=row.querySelector('[data-view]'),id=norm(b&&b.getAttribute('data-view')),sv=map[id],o=by[id];if(!id||!sv||!o)return;var tiny=row.querySelector('.dfOpsTiny');if(!tiny)return;var prod=Number(o.produzido||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),ap=Number(o.apara||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});var text=String(o.data||'')+' • '+sv.name+' • '+prod+' kg • Apara '+ap+' kg';if(tiny.textContent!==text)tiny.textContent=text})
}
function scheduleUi(ms){clearTimeout(uiTimer);uiTimer=setTimeout(function(){patchUi()},ms==null?80:ms)}
function applyRows(rows,revision,updatedAt){
  rows=Array.isArray(rows)?rows:[];var map=rowsMap(rows),a=load(OPS,[]),manual=load(MANUAL,{}),reg=load(REG,{}),opsChanged=false,manualChanged=false,regChanged=false;
  if(!Array.isArray(a))a=[];
  var regKeyById={};Object.keys(reg||{}).forEach(function(k){var x=reg[k]||{},id=norm(x.id||k);if(id&&!regKeyById[id])regKeyById[id]=k});
  a.forEach(function(o){var list=ids(o),hit=null,id='';for(var i=0;i<list.length;i++){if(map[list[i]]){id=list[i];hit=map[id];break}}if(!hit)return;var n=hit.name,rev=Number(hit.revision||revision||0),at=String(hit.updatedAt||updatedAt||'');
    ['serverProductName','manualProductName','clienteFormulacao','produto','product','nomeProduto','opNome'].forEach(function(k){if(o[k]!==n){o[k]=n;opsChanged=true}});if(Number(o.serverProductRevision||0)!==rev){o.serverProductRevision=rev;opsChanged=true}if(String(o.serverProductUpdatedAt||'')!==at){o.serverProductUpdatedAt=at;opsChanged=true}
  });
  Object.keys(map).forEach(function(id){var x=map[id],n=x.name,rev=Number(x.revision||revision||0),at=String(x.updatedAt||updatedAt||'');if(manual[id]!==n){manual[id]=n;manualChanged=true}var key=regKeyById[id]||id,r=reg[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};if(!r.expected)r.expected={};if(r.expected.title!==n||r.expected.produto!==n||r.expected.product!==n){r.expected.title=n;r.expected.produto=n;r.expected.product=n;regChanged=true}if(Number(r.serverProductRevision||0)!==rev){r.serverProductRevision=rev;regChanged=true}if(String(r.serverProductUpdatedAt||'')!==at){r.serverProductUpdatedAt=at;regChanged=true}reg[key]=r});
  if(opsChanged)save(OPS,a);if(manualChanged)save(MANUAL,manual);if(regChanged)save(REG,reg);
  var old=cache();if(Number(old.revision||0)!==Number(revision||0)||String(old.updatedAt||'')!==String(updatedAt||'')||old.products.length!==rows.length)save(cacheKey(),{products:rows,revision:Number(revision||0),updatedAt:String(updatedAt||new Date().toISOString())});
  patchUi(map,a);
  if(opsChanged||manualChanged||regChanged){try{window.dispatchEvent(new CustomEvent('df-product-server-applied',{detail:{count:Object.keys(map).length,revision:Number(revision||0)}}))}catch(e){}try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{server:true,count:Object.keys(map).length}}))}catch(e){}}
  return opsChanged||manualChanged||regChanged
}
function readPending(){var p=load(pendingKey(),{});return p&&typeof p==='object'?p:{}}
function queuePending(id,name){id=norm(id);name=validName(name);if(!id||!name)return false;var p=readPending();p[id]=name;save(pendingKey(),p);return true}
function clearPending(){try{localStorage.removeItem(pendingKey())}catch(e){}}
async function flushPending(){var p=readPending(),items=[];Object.keys(p).forEach(function(id){var n=validName(p[id]);if(id&&n)items.push({opCode:id,productName:n})});if(!items.length)return false;await post('/op/product/sync',{teamId:teamId(),fillOnly:false,products:items});clearPending();return true}
async function pull(forceMsg){
  if(busy||navigator.onLine===false){var c=cache();applyRows(c.products,c.revision,c.updatedAt);return false}
  if(!forceMsg&&Date.now()<unsupportedUntil)return false;var tid=teamId();if(!tid)return false;busy=true;
  try{var j=await post('/op/product/list',{teamId:tid});supported=true;unsupportedUntil=0;lastPull=Date.now();applyRows(j.products||[],j.revision,j.updatedAt);if(forceMsg)status('✅ Produtos sincronizados pelo servidor.','ok');return true}catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000;return false}if(forceMsg)status('⚠️ Não consegui sincronizar os produtos: '+String(e&&e.message||e),'warn');return false}finally{busy=false}
}
async function seedMissing(forceMsg){
  var tid=teamId();if(!tid||!isOwner())return pull(forceMsg);if(busy)return false;busy=true;
  try{
    if(navigator.onLine===false)return false;
    try{await flushPending()}catch(e){}
    var j=await post('/op/product/list',{teamId:tid});supported=true;unsupportedUntil=0;applyRows(j.products||[],j.revision,j.updatedAt);
    var server=rowsMap(j.products||[]),local=localOwnerMap(),missing=[];Object.keys(local).forEach(function(id){if(!server[id])missing.push({opCode:id,productName:local[id]})});
    if(missing.length){await post('/op/product/sync',{teamId:tid,fillOnly:true,products:missing});j=await post('/op/product/list',{teamId:tid});applyRows(j.products||[],j.revision,j.updatedAt)}
    lastPull=Date.now();if(forceMsg)status('✅ Produtos oficiais sincronizados: '+Object.keys(rowsMap(j.products||[])).length+' OPs.','ok');return true
  }catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000;return false}if(forceMsg)status('⚠️ Não consegui sincronizar os produtos: '+String(e&&e.message||e),'warn');return false}finally{busy=false}
}
async function setOne(id,name){
  id=norm(id);name=validName(name);var tid=teamId();if(!isOwner()||!tid||!id||!name)return false;queuePending(id,name);if(navigator.onLine===false)return false;if(busy){setTimeout(function(){setOne(id,name)},350);return false}busy=true;
  try{await flushPending();supported=true;unsupportedUntil=0;var j=await post('/op/product/list',{teamId:tid});lastPull=Date.now();applyRows(j.products||[],j.revision,j.updatedAt);return true}catch(e){if(Number(e&&e.status)===404){supported=false;unsupportedUntil=Date.now()+30000}return false}finally{busy=false}
}
function syncNow(forceMsg){return isOwner()?seedMissing(!!forceMsg):pull(!!forceMsg)}
function queue(delay,forceMsg){clearTimeout(timer);timer=setTimeout(function(){syncNow(!!forceMsg)},delay==null?180:delay)}
function attachListObserver(){var box=document.getElementById('dfOkList');if(!box)return false;if(listObserver&&listObserver.__dfBox===box)return true;if(listObserver)try{listObserver.disconnect()}catch(e){}listObserver=new MutationObserver(function(){scheduleUi(90)});listObserver.__dfBox=box;listObserver.observe(box,{childList:true});return true}
function boot(){
  var c=cache();applyRows(c.products,c.revision,c.updatedAt);attachListObserver();
  if(!attachListObserver()&&window.MutationObserver){rootObserver=new MutationObserver(function(){if(attachListObserver()){try{rootObserver.disconnect()}catch(e){}}});rootObserver.observe(document.documentElement,{childList:true,subtree:true})}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(b)queue(220,true)},true);
  window.addEventListener('df-prontas-products-synced',function(e){var d=e&&e.detail||{};if(d.server)return;if(isOwner()&&d.manual&&d.id&&d.name)setTimeout(function(){setOne(d.id,d.name)},30);else scheduleUi(60)});
  ['df-team-joined','df-team-changed','online','pageshow','focus'].forEach(function(ev){window.addEventListener(ev,function(){queue(300,false)})});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)queue(250,false)});
  setTimeout(function(){queue(0,false)},900);setTimeout(function(){queue(0,false)},3500);
  setInterval(function(){if(document.hidden||navigator.onLine===false)return;if(Date.now()-lastPull>40000)pull(false)},45000)
}
window.DFOpProductD1Authority={sync:syncNow,pull:pull,set:setOne,active:function(){return supported===true},cache:function(){return cache()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
