(function(){
'use strict';
if(window.DFOpTeamOwnerMasterV2)return;window.DFOpTeamOwnerMasterV2=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev',API_HOST='df-extrusor-api.reck-cp9.workers.dev';
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1';
var CACHE='df_team_owner_master_cache_v2',SIG='df_team_owner_master_sig_v2';
var PREFIX='DFMASTER2.',SOURCE='DFMASTER2-',busyPull=false,busyPush=false,domBusy=false,publishTimer=0;
var baseFetch=window.fetch.bind(window);

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso automático indisponível');var r=await baseFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
async function form(path,fd,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+t,'X-DF-Device':d},body:fd,cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return form(path,fd,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
function enc(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function tiny(){var b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,function(c){return c.charCodeAt(0)})],{type:'image/png'})}
function monthShift(delta){var d=new Date();d.setMonth(d.getMonth()+delta);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function isMeta(p){var q=String(p&&p.qr||''),s=String(p&&p.sourceId||'');return q.indexOf(PREFIX)===0||s.indexOf(SOURCE)===0}

window.fetch=async function(input,init){var r=await baseFetch(input,init);try{var u=new URL(typeof input==='string'?input:(input&&input.url)||'',location.href);if(u.hostname===API_HOST&&u.pathname==='/op/photo/list'&&r.ok){var j=await r.clone().json();if(Array.isArray(j.photos)){var clean=j.photos.filter(function(p){return !isMeta(p)});if(clean.length!==j.photos.length){j.photos=clean;var h=new Headers(r.headers);h.delete('content-length');h.delete('content-encoding');return new Response(JSON.stringify(j),{status:r.status,statusText:r.statusText,headers:h})}}}}catch(e){}return r};

function opName(o){return validName(o&&o.manualProductName)||validName(o&&o.clienteFormulacao)||validName(o&&o.produto)||validName(o&&o.product)||validName(o&&o.nomeProduto)||validName(o&&o.opNome)||''}
function ownerOrder(){
  var out=[],box=document.getElementById('dfOkList');
  if(box){Array.from(box.children).forEach(function(row){var b=row&&row.querySelector&&row.querySelector('[data-view]');if(!b)return;var id=norm(b.getAttribute('data-view'));if(id&&out.indexOf(id)<0)out.push(id)})}
  if(out.length)return out;
  var a=load(OPS,[]);if(Array.isArray(a))a.forEach(function(o){if(o&&o.status==='ok'){var z=ids(o)[0];if(z&&out.indexOf(z)<0)out.push(z)}});
  return out;
}
function buildSnapshot(){
  var t=team();if(!t||!t.teamId||!isOwner())return null;
  var a=load(OPS,[]);if(!Array.isArray(a))a=[];
  var ts=Date.now(),order=ownerOrder(),rows=[];
  order.forEach(function(id){var o=a.find(function(x){return ids(x).indexOf(id)>=0});if(!o||o.status!=='ok')return;rows.push({id:id,name:opName(o),data:String(o.data||''),produzido:Number(o.produzido||0),apara:Number(o.apara||0),cloudPhotoId:String(o.cloudPhotoId||''),nameTs:ts})});
  return{v:2,team:String(t.teamId),ts:ts,rows:rows};
}
function signature(s){try{return JSON.stringify((s&&s.rows||[]).map(function(r){return[r.id,r.name,r.data,r.produzido,r.apara,r.cloudPhotoId]}))}catch(e){return''}}
function status(text,type){var m=document.getElementById('dfCloudRuntimeMsg');if(m){m.textContent=text;m.className=type||''}}
async function publishMaster(force){
  if(busyPush||navigator.onLine===false||!isOwner())return false;
  var snap=buildSnapshot();if(!snap||!snap.rows.length)return false;
  var sig=signature(snap),old='';try{old=String(localStorage.getItem(SIG)||'')}catch(e){}
  if(!force&&old===sig)return true;
  busyPush=true;
  try{var fd=new FormData();fd.append('teamId',snap.team);fd.append('sourceId',SOURCE+snap.team+'-'+snap.ts);fd.append('qr',PREFIX+enc(snap));fd.append('production','0');fd.append('scrap','0');fd.append('createdAt',new Date(snap.ts).toISOString());fd.append('photo',tiny(),'team-master-v2.png');await form('/op/photo/upload',fd);save(CACHE,snap);try{localStorage.setItem(SIG,sig)}catch(e){}status('✅ Lista do dono publicada para a equipe.','ok');return true}catch(e){status('⚠️ Não consegui publicar a lista do dono: '+(e&&e.message||e),'warn');return false}finally{busyPush=false}
}
function queuePublish(force,delay){clearTimeout(publishTimer);publishTimer=setTimeout(function(){publishMaster(!!force)},delay==null?180:delay)}

function applyNameStores(id,name,ts){
  name=validName(name);if(!name)return;
  var r=load(REG,{}),key=null;Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===id){key=k;return true}return false});if(!key)key=id;
  var x=r[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};x.expected.title=name;x.expected.produto=name;x.expected.product=name;x.teamProductNameTs=Number(ts||Date.now());r[key]=x;save(REG,r);
  var m=load(MANUAL,{});m[id]=name;save(MANUAL,m);
}
function applyMaster(snap){
  if(!snap||!Array.isArray(snap.rows)||isOwner())return false;
  var a=load(OPS,[]);if(!Array.isArray(a))a=[];var byId={},changed=false;
  a.forEach(function(o){ids(o).forEach(function(id){if(!byId[id])byId[id]=o})});
  var orderedReady=[],masterIds={};
  snap.rows.forEach(function(r){
    var id=norm(r&&r.id),name=validName(r&&r.name),date=String(r&&r.data||''),prod=Number(r&&r.produzido||0),scrap=Number(r&&r.apara||0),cloudId=String(r&&r.cloudPhotoId||''),nameTs=Number(r&&r.nameTs||snap.ts||Date.now());if(!id)return;masterIds[id]=1;
    var o=byId[id];if(!o){o={id:id,qr:id,createdAt:date?date+'T12:00:00':new Date().toISOString(),updatedAt:new Date().toISOString(),numero:'',operador:'',maquina:'',produto:'',largura:0,micra:0,gm:0,bobinas:0,materials:[],expectedTotal:0,reasons:[],status:'ok',manualConfirmed:true,source:'owner-master-v2'};changed=true}
    if(o.status!=='ok'){o.status='ok';o.reasons=[];o.manualConfirmed=true;changed=true}
    if(date&&o.data!==date){o.data=date;changed=true}
    if(prod>0&&Number(o.produzido||0)!==prod){o.produzido=prod;changed=true}
    if(scrap>=0&&Number(o.apara||0)!==scrap){o.apara=scrap;changed=true}
    if(cloudId&&o.cloudPhotoId!==cloudId){o.cloudPhotoId=cloudId;changed=true}
    if(name&&opName(o)!==name){o.manualProductName=name;o.clienteFormulacao=name;o.produto=name;o.product=name;o.nomeProduto=name;o.opNome=name;changed=true}
    if(name){o.teamProductNameTs=nameTs;applyNameStores(id,name,nameTs)}
    orderedReady.push(o);
  });
  var rest=[];a.forEach(function(o){var id=ids(o)[0];if(!id||masterIds[id])return;rest.push(o)});
  var next=orderedReady.concat(rest);
  if(JSON.stringify(a.map(function(o){return ids(o)[0]||''}))!==JSON.stringify(next.map(function(o){return ids(o)[0]||''})))changed=true;
  if(changed)save(OPS,next);else save(CACHE,snap);
  save(CACHE,snap);
  var month=document.getElementById('dfOpMonth');if(month)try{month.dispatchEvent(new Event('change'))}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-owner-master-applied',{detail:{rows:snap.rows.length,ts:snap.ts}}))}catch(e){}
  setTimeout(canonicalize,80);setTimeout(canonicalize,350);setTimeout(canonicalize,900);
  return true;
}
async function pullMaster(forceMsg){
  if(busyPull||navigator.onLine===false||isOwner())return false;var t=team();if(!t||!t.teamId)return false;busyPull=true;
  try{var latest=null;for(var i=0;i<4;i++){try{var j=await post('/op/photo/list',{teamId:t.teamId,month:monthShift(-i)});(j.photos||[]).forEach(function(p){var q=String(p&&p.qr||'');if(q.indexOf(PREFIX)!==0)return;var s=dec(q.slice(PREFIX.length));if(!s||String(s.team||'')!==String(t.teamId)||!Array.isArray(s.rows))return;if(!latest||Number(s.ts||0)>Number(latest.ts||0))latest=s})}catch(e){}}
    if(latest){applyMaster(latest);if(window.DFOpTeamSharedNames&&typeof window.DFOpTeamSharedNames.sync==='function')try{await window.DFOpTeamSharedNames.sync()}catch(e){}setTimeout(canonicalize,120);if(forceMsg)status('✅ Equipe atualizada exatamente como o celular do dono.','ok');return true}
    if(forceMsg)status('⚠️ Ainda não encontrei a lista publicada pelo celular do dono.','warn');return false;
  }catch(e){if(forceMsg)status('⚠️ Não consegui puxar a lista do dono: '+(e&&e.message||e),'warn');return false}finally{busyPull=false}
}
function canonicalize(){
  if(domBusy||isOwner())return false;var snap=load(CACHE,null);if(!snap||!Array.isArray(snap.rows)||!snap.rows.length)return false;var box=document.getElementById('dfOkList');if(!box)return false;domBusy=true;
  try{var order={},nodes={};snap.rows.forEach(function(r,i){order[norm(r.id)]=i});Array.from(box.children).forEach(function(row){var b=row&&row.querySelector&&row.querySelector('[data-view]');if(!b)return;var id=norm(b.getAttribute('data-view'));nodes[id]=row;row.style.display=Object.prototype.hasOwnProperty.call(order,id)?'':'none'});snap.rows.forEach(function(r){var row=nodes[norm(r.id)];if(row)box.appendChild(row)});return true}finally{domBusy=false}
}
function boot(){
  var obs=new MutationObserver(function(muts){if(isOwner()){var relevant=false;for(var i=0;i<muts.length;i++){var t=muts[i].target;if(t&&(t.id==='dfOkList'||(t.closest&&t.closest('#dfOkList')))){relevant=true;break}}if(relevant)queuePublish(false,300)}else setTimeout(canonicalize,30)});obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  if(isOwner()){setTimeout(function(){publishMaster(true)},1800);setTimeout(function(){publishMaster(true)},5000)}else{setTimeout(function(){pullMaster(false)},2200);setTimeout(function(){pullMaster(false)},5200)}
  window.addEventListener('df-prontas-products-synced',function(e){if(isOwner())queuePublish(true,220)});
  window.addEventListener('df-team-names-synced',function(){if(isOwner())queuePublish(true,250)});
  window.addEventListener('df-op-remote-merged',function(){if(isOwner())queuePublish(true,300)});
  window.addEventListener('df-team-joined',function(){setTimeout(function(){if(isOwner())publishMaster(true);else pullMaster(false)},450)});
  window.addEventListener('df-team-changed',function(){setTimeout(function(){if(isOwner())publishMaster(true);else pullMaster(false)},450)});
  document.addEventListener('click',function(e){var t=e.target;if(!t)return;
    if(t.id==='dfCloudRefresh'){
      if(isOwner()){status('🔄 Publicando lista do dono para a equipe...','');setTimeout(function(){publishMaster(true)},250);setTimeout(function(){publishMaster(true)},1200);setTimeout(function(){publishMaster(true)},2600)}
      else{status('🔄 Puxando lista do celular do dono...','');setTimeout(function(){pullMaster(true)},350);setTimeout(function(){pullMaster(true)},1350);setTimeout(function(){pullMaster(true)},2800)}
    }else if(t.closest&&t.closest('[data-pane="ok"]')){if(isOwner())setTimeout(function(){publishMaster(true)},500);else setTimeout(canonicalize,180)}
  },true);
  window.addEventListener('pageshow',function(){setTimeout(function(){if(isOwner())publishMaster(false);else pullMaster(false)},350)});
  window.addEventListener('online',function(){setTimeout(function(){if(isOwner())publishMaster(true);else pullMaster(false)},350)});
  setInterval(function(){if(document.hidden)return;if(isOwner())publishMaster(false);else pullMaster(false)},10000);
}
window.DFOpTeamOwnerMaster={publish:publishMaster,pull:pullMaster,apply:applyMaster,canonicalize:canonicalize};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
