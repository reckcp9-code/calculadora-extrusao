(function(){
'use strict';
if(window.DFOpProntasStatusBridgeV1)return;window.DFOpProntasStatusBridgeV1=true;
var OPS='df_formula_ops_auto_v2',busy=false,last=0;
function load(){try{var v=JSON.parse(localStorage.getItem(OPS)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function save(v){try{localStorage.setItem(OPS,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){var s=String(v||'').trim().toUpperCase(),m=s.match(/DFOP-[A-Z0-9-]+/);return (m?m[0]:s).replace(/\s+/g,'')}
function ids(o){var a=[o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean);return a.filter(function(v,i){return a.indexOf(v)===i})}
function real(v){var s=String(v||'').trim();return s&&!/^(?:—|-|sem produto|produto não informado(?: na op)?|op sem nome)$/i.test(s)?s:''}
function month(){var e=document.getElementById('dfOpMonth');if(e&&/^\d{4}-\d{2}$/.test(String(e.value||'')))return String(e.value);var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
async function sync(force){var now=Date.now();if(busy||(!force&&now-last<2500))return false;var api=window.DFOpStatusProductHistory;if(!api||typeof api.read!=='function')return false;busy=true;last=now;try{var map=await api.read(month())||{},a=load(),changed=false,fixed=0;a.forEach(function(o){if(!o||o.status!=='ok')return;var current=real(o.clienteFormulacao)||real(o.produto)||real(o.product);if(current)return;var name='';ids(o).some(function(id){if(map[id]){name=map[id];return true}return false});if(!name)return;o.clienteFormulacao=name;o.produto=name;o.product=name;changed=true;fixed++});if(changed)save(a);try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{source:'status-history',fixed:fixed,changed:changed}}))}catch(e){}return changed}finally{busy=false}}
function boot(){setTimeout(function(){sync(true)},500);setTimeout(function(){sync(true)},2200);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfFormTabOps,[data-pane="ok"],[data-pane="month"],#dfPrintReport,#dfCloudRefresh'):null;if(t)setTimeout(function(){sync(true)},50)},true);window.addEventListener('online',function(){sync(true)});window.addEventListener('pageshow',function(){sync(false)});setInterval(function(){if(!document.hidden)sync(false)},12000)}
window.DFOpProntasStatusBridge={sync:function(){return sync(true)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
