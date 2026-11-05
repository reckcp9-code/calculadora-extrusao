(function(){
'use strict';
if(window.DFOpTeamDateCanonicalV1)return;window.DFOpTeamDateCanonicalV1=true;

var OPS='df_formula_ops_auto_v2';
var busy=false,timer=0,observer=null,rootObserver=null;
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function nameFor(id,o){return validName(o&&o.serverProductName)||validName(o&&o.manualProductName)||validName(o&&o.clienteFormulacao)||validName(o&&o.produto)||validName(o&&o.product)||validName(o&&o.nomeProduto)||validName(o&&o.opNome)||''}
function codeStamp(id){var m=norm(id).match(/DFOP-(\d{8})-(\d{6})(?:-|$)/);return m?Number(m[1]+m[2]):0}
function dateStamp(v){var s=String(v==null?'':v).trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):?(\d{2})?:?(\d{2})?)?/);if(!m)return 0;return Number(m[1]+m[2]+m[3]+String(m[4]||'00').padStart(2,'0')+String(m[5]||'00').padStart(2,'0')+String(m[6]||'00').padStart(2,'0'))}
function stamp(o){if(!o)return 0;var a=ids(o);for(var i=0;i<a.length;i++){var s=codeStamp(a[i]);if(s)return s}return dateStamp(o.createdAt)||dateStamp(o.updatedAt)||dateStamp(o.data)||0}
function compare(a,b){var sa=stamp(a),sb=stamp(b);if(sa!==sb)return sb-sa;var ia=ids(a)[0]||'',ib=ids(b)[0]||'';return ib.localeCompare(ia,'pt-BR',{numeric:true,sensitivity:'base'})}
function sortStore(){
  var a=load(OPS,[]);if(!Array.isArray(a)||a.length<2)return Array.isArray(a)?a:[];
  var ok=[],rest=[];a.forEach(function(o){if(o&&o.status==='ok')ok.push(o);else rest.push(o)});ok.sort(compare);
  var next=ok.concat(rest),changed=false;for(var i=0;i<a.length;i++){if(a[i]!==next[i]){changed=true;break}}
  if(changed)save(OPS,next);return ok
}
function sortDom(ops){
  if(busy)return false;var box=document.getElementById('dfOkList');if(!box)return false;ops=ops||sortStore();
  var by={};ops.forEach(function(o){ids(o).forEach(function(id){if(!by[id])by[id]=o})});
  var rows=Array.from(box.children).filter(function(row){return !!(row&&row.querySelector&&row.querySelector('[data-view]'))});if(rows.length<2)return false;
  var sorted=rows.slice().sort(function(ra,rb){var ia=norm(ra.querySelector('[data-view]')&&ra.querySelector('[data-view]').getAttribute('data-view')),ib=norm(rb.querySelector('[data-view]')&&rb.querySelector('[data-view]').getAttribute('data-view'));return compare(by[ia]||{id:ia},by[ib]||{id:ib})});
  var changed=false;for(var i=0;i<rows.length;i++){if(rows[i]!==sorted[i]){changed=true;break}}if(!changed)return false;
  busy=true;try{var cursor=box.firstElementChild;sorted.forEach(function(row){if(row!==cursor)box.insertBefore(row,cursor||null);cursor=row.nextElementSibling});return true}finally{busy=false}
}
function run(){var ok=sortStore();sortDom(ok);attachListObserver();return true}
function schedule(ms){clearTimeout(timer);timer=setTimeout(run,ms==null?90:ms)}
function attachListObserver(){
  var box=document.getElementById('dfOkList');if(!box)return false;if(observer&&observer.__dfBox===box)return true;
  if(observer)try{observer.disconnect()}catch(e){}observer=new MutationObserver(function(){if(!busy)schedule(80)});observer.__dfBox=box;observer.observe(box,{childList:true});return true
}
function boot(){
  run();setTimeout(run,350);setTimeout(run,1000);
  if(!attachListObserver()&&window.MutationObserver){rootObserver=new MutationObserver(function(){if(attachListObserver()){try{rootObserver.disconnect()}catch(e){}}});rootObserver.observe(document.documentElement,{childList:true,subtree:true})}
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-pane="ok"],#dfCloudRefresh,#dfFormTabOps'):null;if(t)schedule(120)},true);
  ['df-product-server-applied','df-op-remote-merged','df-team-changed','df-team-joined','df-op-save-ui-refresh','df-ui-ready'].forEach(function(ev){window.addEventListener(ev,function(){schedule(100)})});
  window.addEventListener('pageshow',function(){schedule(120)});window.addEventListener('focus',function(){schedule(120)});document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule(120)});
}
window.DFOpTeamDateCanonical={run:run,sync:function(){run();return Promise.resolve(true)},compare:compare,stamp:stamp,nameFor:nameFor,enrichNames:function(){return false}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
