(function(){
'use strict';
if(window.DFOpTeamDateCanonicalV1)return;window.DFOpTeamDateCanonicalV1=true;

var OPS='df_formula_ops_auto_v2',TEAM='df_op_team_v1',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1';
var AUTO_KEY='df_team_date_canonical_boot_v3';
var busy=false,observer=null,lastAutoSync=0,syncBusy=false;

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function valid(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function master(){return window.DFOpTeamOwnerMaster||null}
function namesApi(){return window.DFOpTeamSharedNames||null}
function regName(id){var n=norm(id),r=load(REG,{}),name='';Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)!==n)return false;var e=x.expected||{};name=valid(e.title)||valid(e.produto)||valid(e.product)||valid(e.clienteFormulacao);return !!name});return name}
function nameFor(id,o){var n=norm(id),m=load(MANUAL,{});return valid(m[n])||valid(o&&o.manualProductName)||valid(o&&o.clienteFormulacao)||valid(o&&o.produto)||valid(o&&o.product)||valid(o&&o.nomeProduto)||valid(o&&o.opNome)||regName(n)||''}
function enrichNames(){var a=load(OPS,[]);if(!Array.isArray(a))return false;var changed=false;a.forEach(function(o){if(!o)return;var id=ids(o)[0]||'',name=nameFor(id,o);if(!id||!name)return;['manualProductName','clienteFormulacao','produto','product','nomeProduto','opNome'].forEach(function(k){if(o[k]!==name){o[k]=name;changed=true}})});if(changed)save(OPS,a);return changed}

function codeStamp(id){var m=norm(id).match(/DFOP-(\d{8})-(\d{6})(?:-|$)/);return m?Number(m[1]+m[2]):0}
function dateStamp(v){var s=String(v==null?'':v).trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):?(\d{2})?:?(\d{2})?)?/);if(!m)return 0;return Number(m[1]+m[2]+m[3]+String(m[4]||'00').padStart(2,'0')+String(m[5]||'00').padStart(2,'0')+String(m[6]||'00').padStart(2,'0'))}
function stamp(o){if(!o)return 0;var a=ids(o),s=0;for(var i=0;i<a.length;i++){s=codeStamp(a[i]);if(s)return s}return dateStamp(o.createdAt)||dateStamp(o.updatedAt)||dateStamp(o.data)||0}
function compare(a,b){var sa=stamp(a),sb=stamp(b);if(sa!==sb)return sb-sa;var ia=ids(a)[0]||'',ib=ids(b)[0]||'';return ib.localeCompare(ia,'pt-BR',{numeric:true,sensitivity:'base'})}
function sortStore(){var a=load(OPS,[]);if(!Array.isArray(a)||!a.length)return [];var ok=[],rest=[];a.forEach(function(o){if(o&&o.status==='ok')ok.push(o);else rest.push(o)});ok.sort(compare);var next=ok.concat(rest),old=a.map(function(o){return ids(o)[0]||''}).join('|'),neu=next.map(function(o){return ids(o)[0]||''}).join('|');if(old!==neu)save(OPS,next);return ok}
function sortDom(){if(busy)return false;var box=document.getElementById('dfOkList');if(!box)return false;var ops=sortStore(),by={};ops.forEach(function(o){ids(o).forEach(function(id){if(!by[id])by[id]=o})});var rows=Array.from(box.children).filter(function(row){return !!(row&&row.querySelector&&row.querySelector('[data-view]'))});if(!rows.length)return false;rows.sort(function(ra,rb){var ba=ra.querySelector('[data-view]'),bb=rb.querySelector('[data-view]'),ia=norm(ba&&ba.getAttribute('data-view')),ib=norm(bb&&bb.getAttribute('data-view'));return compare(by[ia]||{id:ia},by[ib]||{id:ib})});busy=true;try{rows.forEach(function(row){box.appendChild(row);var b=row.querySelector('[data-view]'),id=norm(b&&b.getAttribute('data-view')),o=by[id],tiny=row.querySelector('.dfOpsTiny');if(o&&tiny){var name=nameFor(id,o)||'Sem produto',prod=Number(o.produzido||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),scrap=Number(o.apara||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});tiny.textContent=String(o.data||'')+' • '+name+' • '+prod+' kg • Apara '+scrap+' kg'}});return true}finally{busy=false}}
function canonicalize(){enrichNames();sortStore();sortDom()}
function burst(){setTimeout(canonicalize,40);setTimeout(canonicalize,180);setTimeout(canonicalize,500);setTimeout(canonicalize,1100)}

async function forceOwnerPublish(){if(syncBusy)return false;syncBusy=true;lastAutoSync=Date.now();try{canonicalize();var n=namesApi();if(n&&typeof n.sync==='function')try{await n.sync()}catch(e){}enrichNames();var m=master();if(!isOwner()||!m||typeof m.publish!=='function')return false;var ok=await m.publish(false);burst();return ok}catch(e){return false}finally{syncBusy=false}}
async function forceOperatorPull(){if(syncBusy)return false;syncBusy=true;lastAutoSync=Date.now();try{canonicalize();var m=master();if(isOwner()||!m||typeof m.pull!=='function')return false;var ok=await m.pull(true);var n=namesApi();if(n&&typeof n.sync==='function')try{await n.sync()}catch(e){}enrichNames();burst();return ok}catch(e){return false}finally{syncBusy=false}}
function forceSync(){return isOwner()?forceOwnerPublish():forceOperatorPull()}
async function manualSaved(d){if(!d||!d.id)return;var id=norm(d.id),name=valid(d.name)||nameFor(id,null);if(!name)return;enrichNames();burst();var n=namesApi();if(n&&typeof n.publish==='function')try{await n.publish(id,name)}catch(e){}if(isOwner()){var m=master();if(m&&typeof m.publish==='function')try{await m.publish(false)}catch(e){}}setTimeout(forceSync,400)}

function boot(){
  canonicalize();burst();
  if(!observer){observer=new MutationObserver(function(){if(!busy)setTimeout(canonicalize,25)});observer.observe(document.documentElement,{childList:true,subtree:true})}
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(!t)return;setTimeout(forceSync,180);setTimeout(forceSync,1350);burst()},true);
  window.addEventListener('df-prontas-products-synced',function(e){var d=e&&e.detail||{};if(d.manual)manualSaved(d);else burst()});
  ['df-owner-master-applied','df-team-names-synced','df-op-remote-merged','df-team-changed','df-team-joined','df-op-meta-enriched'].forEach(function(ev){window.addEventListener(ev,function(){burst();if(ev==='df-team-changed'||ev==='df-team-joined')setTimeout(forceSync,350)})});
  window.addEventListener('pageshow',function(){burst();setTimeout(forceSync,350)});window.addEventListener('focus',function(){burst();setTimeout(forceSync,300)});window.addEventListener('online',function(){burst();setTimeout(forceSync,500)});document.addEventListener('visibilitychange',function(){if(!document.hidden){burst();setTimeout(forceSync,300)}});
  setInterval(function(){if(document.hidden)return;canonicalize();if(Date.now()-lastAutoSync>8000)forceSync()},2500);
  setTimeout(function(){var done='';try{done=String(localStorage.getItem(AUTO_KEY)||'')}catch(e){}var tries=0,timer=setInterval(function(){tries++;var m=master(),t=team();if(m&&t&&t.teamId){clearInterval(timer);forceSync().then(function(ok){if(ok)try{localStorage.setItem(AUTO_KEY,'1')}catch(e){}})}else if(tries>12)clearInterval(timer)},400);if(done==='1')setTimeout(forceSync,450)},700);
}
window.DFOpTeamDateCanonical={run:canonicalize,sync:forceSync,compare:compare,stamp:stamp,nameFor:nameFor,enrichNames:enrichNames};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
