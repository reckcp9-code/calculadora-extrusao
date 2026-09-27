(function(){
'use strict';
if(window.DFOpTeamDateCanonicalV1)return;window.DFOpTeamDateCanonicalV1=true;

var OPS='df_formula_ops_auto_v2',TEAM='df_op_team_v1';
var AUTO_KEY='df_team_date_canonical_boot_v2';
var busy=false,observer=null,lastAutoSync=0;

function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function master(){return window.DFOpTeamOwnerMaster||null}

function codeStamp(id){
  var m=norm(id).match(/DFOP-(\d{8})-(\d{6})(?:-|$)/);
  return m?Number(m[1]+m[2]):0;
}
function dateStamp(v){
  var s=String(v==null?'':v).trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):?(\d{2})?:?(\d{2})?)?/);
  if(!m)return 0;
  return Number(m[1]+m[2]+m[3]+String(m[4]||'00').padStart(2,'0')+String(m[5]||'00').padStart(2,'0')+String(m[6]||'00').padStart(2,'0'));
}
function stamp(o){
  if(!o)return 0;
  var a=ids(o),s=0;
  for(var i=0;i<a.length;i++){s=codeStamp(a[i]);if(s)return s}
  return dateStamp(o.createdAt)||dateStamp(o.updatedAt)||dateStamp(o.data)||0;
}
function compare(a,b){
  var sa=stamp(a),sb=stamp(b);if(sa!==sb)return sb-sa;
  var ia=ids(a)[0]||'',ib=ids(b)[0]||'';return ib.localeCompare(ia,'pt-BR',{numeric:true,sensitivity:'base'});
}
function sortStore(){
  var a=load(OPS,[]);if(!Array.isArray(a)||!a.length)return [];
  var ok=[],rest=[];a.forEach(function(o){if(o&&o.status==='ok')ok.push(o);else rest.push(o)});ok.sort(compare);
  var next=ok.concat(rest),old=a.map(function(o){return ids(o)[0]||''}).join('|'),neu=next.map(function(o){return ids(o)[0]||''}).join('|');
  if(old!==neu)save(OPS,next);
  return ok;
}
function sortDom(){
  if(busy)return false;var box=document.getElementById('dfOkList');if(!box)return false;var ops=sortStore(),by={};ops.forEach(function(o){ids(o).forEach(function(id){if(!by[id])by[id]=o})});
  var rows=Array.from(box.children).filter(function(row){return !!(row&&row.querySelector&&row.querySelector('[data-view]'))});if(!rows.length)return false;
  rows.sort(function(ra,rb){var ba=ra.querySelector('[data-view]'),bb=rb.querySelector('[data-view]'),ia=norm(ba&&ba.getAttribute('data-view')),ib=norm(bb&&bb.getAttribute('data-view'));return compare(by[ia]||{id:ia},by[ib]||{id:ib})});
  busy=true;try{rows.forEach(function(row){box.appendChild(row)});return true}finally{busy=false}
}
function canonicalize(){sortStore();sortDom();}

function forceOwnerPublish(){
  canonicalize();var m=master();if(!isOwner()||!m||typeof m.publish!=='function')return Promise.resolve(false);
  // Não apaga mais a assinatura antes de cada atualização. Assim o app não cria
  // novas fotos técnicas quando a lista e os nomes não mudaram.
  return Promise.resolve(m.publish(false)).then(function(ok){setTimeout(canonicalize,120);return ok}).catch(function(){return false});
}
function forceOperatorPull(){
  canonicalize();var m=master();if(isOwner()||!m||typeof m.pull!=='function')return Promise.resolve(false);
  return Promise.resolve(m.pull(true)).then(function(ok){setTimeout(canonicalize,120);setTimeout(canonicalize,650);return ok}).catch(function(){return false});
}
function forceSync(){lastAutoSync=Date.now();return isOwner()?forceOwnerPublish():forceOperatorPull()}

function boot(){
  canonicalize();setTimeout(canonicalize,300);setTimeout(canonicalize,1200);
  if(!observer){observer=new MutationObserver(function(){if(!busy)setTimeout(canonicalize,25)});observer.observe(document.documentElement,{childList:true,subtree:true})}
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(!t)return;setTimeout(forceSync,650);setTimeout(canonicalize,1400)},true);
  ['df-owner-master-applied','df-prontas-products-synced','df-team-names-synced','df-op-remote-merged','df-team-changed','df-team-joined'].forEach(function(ev){window.addEventListener(ev,function(){setTimeout(canonicalize,80)})});
  window.addEventListener('pageshow',function(){setTimeout(canonicalize,120);setTimeout(forceSync,600)});window.addEventListener('online',function(){setTimeout(canonicalize,160);setTimeout(forceSync,700)});
  setInterval(function(){if(document.hidden)return;canonicalize();if(Date.now()-lastAutoSync>15000)forceSync()},5000);
  setTimeout(function(){
    var done='';try{done=String(localStorage.getItem(AUTO_KEY)||'')}catch(e){}
    if(done==='1'){setTimeout(forceSync,500);return}
    var tries=0,timer=setInterval(function(){tries++;var m=master(),t=team();if(m&&t&&t.teamId){clearInterval(timer);forceSync().then(function(ok){if(ok)try{localStorage.setItem(AUTO_KEY,'1')}catch(e){}})}else if(tries>12)clearInterval(timer)},500);
  },1000);
}
window.DFOpTeamDateCanonical={run:canonicalize,sync:forceSync,compare:compare,stamp:stamp};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
