(function(){
'use strict';
if(window.DFOpTeamSharedReadyV1)return;window.DFOpTeamSharedReadyV1=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev',API_HOST='df-extrusor-api.reck-cp9.workers.dev';
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1';
var PREFIX='DFOPNAME1.',SOURCE='DFNAME-',syncing=false,publishing=false,lastPublish={};
var baseFetch=window.fetch.bind(window);

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso indisponível');var r=await baseFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
async function form(path,fd,retry){var t=await renew(false),d=deviceId(),r=await baseFetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+t,'X-DF-Device':d},body:fd,cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return form(path,fd,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
function enc(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function tiny(){var b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,function(c){return c.charCodeAt(0)})],{type:'image/png'})}
function monthShift(delta){var d=new Date();d.setMonth(d.getMonth()+delta);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function isNameMeta(p){var q=String(p&&p.qr||''),s=String(p&&p.sourceId||'');return q.indexOf(PREFIX)===0||s.indexOf(SOURCE)===0}

// Esconde os registros técnicos de nome das abas de fotos/OPs normais.
window.fetch=async function(input,init){var r=await baseFetch(input,init);try{var u=new URL(typeof input==='string'?input:(input&&input.url)||'',location.href);if(u.hostname===API_HOST&&u.pathname==='/op/photo/list'&&r.ok){var j=await r.clone().json();if(Array.isArray(j.photos)){var clean=j.photos.filter(function(p){return !isNameMeta(p)});if(clean.length!==j.photos.length){j.photos=clean;var h=new Headers(r.headers);h.delete('content-length');h.delete('content-encoding');return new Response(JSON.stringify(j),{status:r.status,statusText:r.statusText,headers:h})}}}}catch(e){}return r};

function applyName(id,name,ts){id=norm(id);name=validName(name);if(!id||!name)return false;var changed=false;
  var a=load(OPS,[]);if(Array.isArray(a)){a.forEach(function(o){if(ids(o).indexOf(id)<0)return;var curTs=Number(o&&o.teamProductNameTs||0);if(curTs>Number(ts||0))return;if(o.manualProductName!==name||o.produto!==name||o.product!==name||o.clienteFormulacao!==name){o.manualProductName=name;o.clienteFormulacao=name;o.produto=name;o.product=name;o.nomeProduto=name;o.opNome=name;changed=true}o.teamProductNameTs=Number(ts||0)});if(changed)save(OPS,a)}
  var r=load(REG,{}),key=null;Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===id){key=k;return true}return false});if(!key)key=id;var x=r[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};var rt=Number(x.teamProductNameTs||0);if(rt<=Number(ts||0)){if(x.expected.title!==name||x.expected.produto!==name||x.expected.product!==name){x.expected.title=name;x.expected.produto=name;x.expected.product=name;changed=true}x.teamProductNameTs=Number(ts||0);r[key]=x;save(REG,r)}
  var m=load(MANUAL,{});if(m[id]!==name){m[id]=name;save(MANUAL,m);changed=true}
  return changed;
}
async function publishName(id,name){if(publishing||navigator.onLine===false)return false;var t=team();id=norm(id);name=validName(name);if(!t||!t.teamId||!id||!name)return false;var sig=id+'|'+name;if(lastPublish[id]===sig)return true;publishing=true;try{var payload={id:id,name:name,ts:Date.now()},fd=new FormData();fd.append('teamId',t.teamId);fd.append('sourceId',SOURCE+id+'-'+payload.ts);fd.append('qr',PREFIX+enc(payload));fd.append('production','0');fd.append('scrap','0');fd.append('createdAt',new Date(payload.ts).toISOString());fd.append('photo',tiny(),'op-name.png');await form('/op/photo/upload',fd);lastPublish[id]=sig;applyName(id,name,payload.ts);setTimeout(syncNames,350);return true}catch(e){return false}finally{publishing=false}}
function localNameFor(id){var n=norm(id),m=load(MANUAL,{}),a=load(OPS,[]),name=validName(m[n]);if(name)return name;if(Array.isArray(a)){for(var i=0;i<a.length;i++){if(ids(a[i]).indexOf(n)>=0){name=validName(a[i].manualProductName)||validName(a[i].clienteFormulacao)||validName(a[i].produto)||validName(a[i].product);if(name)return name}}}return''}
async function syncNames(){if(syncing||navigator.onLine===false)return false;var t=team();if(!t||!t.teamId)return false;syncing=true;try{var latest={};for(var i=0;i<3;i++){try{var j=await post('/op/photo/list',{teamId:t.teamId,month:monthShift(-i)});(j.photos||[]).forEach(function(p){var q=String(p&&p.qr||'');if(q.indexOf(PREFIX)!==0)return;var x=dec(q.slice(PREFIX.length)),id=norm(x&&x.id),name=validName(x&&x.name),ts=Number(x&&x.ts||new Date(p.createdAt||0).getTime()||0);if(!id||!name)return;var old=latest[id];if(!old||ts>old.ts)latest[id]={id:id,name:name,ts:ts}})}catch(e){}}var changed=false;Object.keys(latest).forEach(function(k){var x=latest[k];if(applyName(x.id,x.name,x.ts))changed=true});if(changed){try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{teamSync:true}}))}catch(e){}try{window.dispatchEvent(new CustomEvent('df-op-meta-enriched',{detail:{teamSync:true}}))}catch(e){}}sortReady();return true}finally{syncing=false}}

function sortReady(){var box=document.getElementById('dfOkList');if(!box)return false;var rows=Array.from(box.children).filter(function(x){return x&&x.querySelector&&x.querySelector('[data-view]')});if(rows.length<2)return true;var sorted=rows.slice().sort(function(a,b){var aa=norm(a.querySelector('[data-view]').getAttribute('data-view')),bb=norm(b.querySelector('[data-view]').getAttribute('data-view'));return bb.localeCompare(aa)});var same=rows.every(function(r,i){return r===sorted[i]});if(same)return true;sorted.forEach(function(r){box.appendChild(r)});return true}
function scheduleSort(mutations){if(Array.isArray(mutations)&&!mutations.some(function(m){return m.target&&(m.target.id==='dfOkList'||m.target.closest?.('#dfOkList'))}))return;clearTimeout(window.__dfTeamReadySort);window.__dfTeamReadySort=setTimeout(sortReady,180)}

function onManualEvent(e){var d=e&&e.detail||{};if(!d.manual||!d.id)return;var name=validName(d.name)||localNameFor(d.id);if(name)publishName(d.id,name);/* sem reordenar lista */}
function boot(){
  /* Ordenação automática desligada: evita tremelique nas OPs prontas. */
  setTimeout(syncNames,800);setTimeout(syncNames,3200);
  window.addEventListener('df-prontas-products-synced',onManualEvent);
  window.addEventListener('df-team-joined',function(){setTimeout(syncNames,250)});window.addEventListener('df-team-changed',function(){setTimeout(syncNames,250)});
  window.addEventListener('online',function(){setTimeout(syncNames,180)});window.addEventListener('pageshow',function(){setTimeout(syncNames,180)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(syncNames,180)});
  document.addEventListener('click',function(e){var t=e.target;if(t&&(t.id==='dfCloudRefresh'||t.id==='dfFormTabOps'||(t.closest&&t.closest('[data-pane="ok"]'))))setTimeout(syncNames,160)},true);
  setInterval(function(){if(!document.hidden)syncNames()},8000);
}
window.DFOpTeamSharedReady={sync:syncNames,sort:function(){return true},publish:publishName};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
