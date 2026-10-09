(function(){
'use strict';
if(window.DFOpProntasProductSourceV3)return;
window.DFOpProntasProductSourceV3=true;

var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1';
var syncing=false,pending=false,lastSync=0,observer=null;

function $(id){return document.getElementById(id)}
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function code(v){var s=String(v==null?'':v).trim().toUpperCase(),m=s.match(/DFOP-[A-Z0-9-]+/);return (m?m[0]:s).replace(/\s+/g,'')}
function ids(o){var a=[o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(code).filter(Boolean);return a.filter(function(v,i){return a.indexOf(v)===i})}
function exact(v){var raw=String(v==null?'':v),check=raw.trim();if(!check||/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(check))return'';return raw}
function same(a,b){return String(a==null?'':a)===String(b==null?'':b)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v,d){var n=Number(v||0);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'0'}
function selectedMonth(){var e=$('dfOpMonth');if(e&&/^\d{4}-\d{2}$/.test(String(e.value||'')))return String(e.value);var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}

// Somente campos já salvos na própria OP/registro. Não usa foto, OCR nem tenta adivinhar nome.
function savedProduct(o){
  if(!o)return'';
  var e=o.expected||{},oe=o.original&&o.original.expected||{},me=o.meta&&o.meta.expected||{};
  return exact(o.clienteFormulacao)||exact(o.cliente_formulacao)||exact(o.produto)||exact(o.product)||exact(o.nomeProduto)||exact(o.opNome)||exact(o.title)||
    exact(e.title)||exact(e.produto)||exact(e.product)||exact(e.clienteFormulacao)||
    exact(oe.title)||exact(oe.produto)||exact(oe.product)||exact(oe.clienteFormulacao)||
    exact(me.title)||exact(me.produto)||exact(me.product)||exact(me.clienteFormulacao)||'';
}
function localRegistryMap(){
  var r=load(REG,{}),out={};
  Object.keys(r||{}).forEach(function(k){
    var x=r[k]||{},e=x.expected||{},id=code(x.id||k),name=exact(e.title)||exact(e.produto)||exact(e.product)||exact(e.clienteFormulacao)||exact(x.title);
    if(id&&name)out[id]=name;
  });
  return out;
}
function upsertRegistryName(r,id,name){
  if(!id||!name)return false;
  var key=null;
  Object.keys(r||{}).some(function(k){var x=r[k]||{};if(code(x.id||k)===id){key=k;return true}return false});
  if(!key)key=id;
  var x=r[key]||{id:id,createdAt:new Date().toISOString(),expected:{}};
  if(!x.expected)x.expected={};
  if(same(x.expected.title,name))return false;
  x.expected.title=name;r[key]=x;return true;
}
async function waitRegistryApi(limit){limit=limit||50;for(var i=0;i<limit;i++){var api=window.DFOpRegistryCloudTestV174;if(api&&typeof api.readOriginalProducts==='function')return api;await new Promise(function(res){setTimeout(res,120)})}return null}
async function cloudNames(month){
  var out={},api=await waitRegistryApi();if(!api)return out;
  try{if(typeof api.sync==='function')await api.sync()}catch(e){}
  try{
    var m=await api.readOriginalProducts(month)||{};
    Object.keys(m).forEach(function(k){var x=m[k]||{},name=exact(x.title)||exact(x.produto)||exact(x.product)||exact(x.clienteFormulacao);if(name)out[code(k)]=name});
  }catch(e){}
  return out;
}
function resolvedProduct(o,cloud,local){
  var opids=ids(o),name='';
  for(var i=0;i<opids.length&&!name;i++)name=(cloud&&cloud[opids[i]])||(local&&local[opids[i]])||'';
  return name||savedProduct(o)||'';
}
async function syncProntas(force){
  var now=Date.now();if(syncing){pending=true;return false}if(!force&&now-lastSync<1800)return true;
  syncing=true;lastSync=now;
  try{
    try{if(window.DFOpCloud&&typeof window.DFOpCloud.sync==='function')await window.DFOpCloud.sync(false)}catch(e){}
    var cloud=await cloudNames(selectedMonth()),local=localRegistryMap(),a=load(OPS,[]);if(!Array.isArray(a))a=[];
    var r=load(REG,{}),changed=false,regChanged=false,fixed=0,missing=0;
    a.forEach(function(o){
      if(!o||o.status!=='ok')return;
      var opids=ids(o),name=resolvedProduct(o,cloud,local);
      if(!name){missing++;return}
      if(!same(o.clienteFormulacao,name)){o.clienteFormulacao=name;changed=true}
      if(!same(o.produto,name)){o.produto=name;changed=true}
      if(!same(o.product,name)){o.product=name;changed=true}
      var canonical=opids[0]||code(o.id);
      if(canonical&&upsertRegistryName(r,canonical,name))regChanged=true;
      fixed++;
    });
    if(changed)save(OPS,a);if(regChanged)save(REG,r);
    patchUi();
    try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{fixed:fixed,missing:missing,changed:changed}}))}catch(e){}
    return true;
  }finally{syncing=false;if(pending){pending=false;setTimeout(function(){syncProntas(true)},100)}}
}
function byIdMap(){var a=load(OPS,[]),m={};if(!Array.isArray(a))return m;a.forEach(function(o){ids(o).forEach(function(id){if(!m[id])m[id]=o})});return m}
function patchReadyList(){
  var box=$('dfOkList');if(!box)return;
  var map=byIdMap(),local=localRegistryMap();
  box.querySelectorAll('.dfOpList').forEach(function(row){
    var b=row.querySelector('[data-view]'),id=code(b&&b.getAttribute('data-view'));if(!id)return;
    var o=map[id];if(!o)return;
    var tiny=row.querySelector('.dfOpsTiny');if(!tiny)return;
    var name=resolvedProduct(o,null,local)||'Sem produto';
    var text=String(o.data||'')+' • '+name+' • '+fmt(o.produzido,2)+' kg • Apara '+fmt(o.apara,2)+' kg';
    if(tiny.textContent!==text)tiny.textContent=text;
  });
}
function cleanReportTools(){
  var a=$('dfRecoverPhotoNamesTest'),b=$('dfReviewProductsTest');
  if(a&&a.style.display!=='none')a.style.display='none';if(b&&b.style.display!=='none')b.style.display='none';
  var s=$('dfPhotoRecoveryStatusTest'),text='Produto: nome exato da OP salvo em Prontas, localizado somente pelo código da OP.';if(s&&s.textContent!==text)s.textContent=text;
}
function patchUi(){patchReadyList();cleanReportTools()}
function aggregate(list){var prod=0,ap=0,meters=0,mats={},operators={},machines={};list.forEach(function(o){prod+=+o.produzido||0;ap+=+o.apara||0;if(+o.gm>0)meters+=(+o.produzido||0)*1000/(+o.gm);if(o.operador)operators[o.operador]=(operators[o.operador]||0)+(+o.produzido||0);if(o.maquina)machines[o.maquina]=(machines[o.maquina]||0)+(+o.produzido||0);(o.materials||[]).forEach(function(m){if(m&&m.name)mats[m.name]=(mats[m.name]||0)+(+m.kg||0)})});var liquid=Math.max(0,prod-ap),yieldPct=prod>0?liquid/prod*100:0;return{prod:prod,ap:ap,liquid:liquid,yieldPct:yieldPct,meters:meters,mats:mats,operators:operators,machines:machines}}
function rows(obj){var a=Object.entries(obj||{}).sort(function(x,y){return y[1]-x[1]});return a.length?a.map(function(x){return'<tr><td>'+esc(x[0])+'</td><td>'+fmt(x[1],2)+' kg</td></tr>'}).join(''):'<tr><td colspan="2">—</td></tr>'}
function reportHtml(month){
  var all=load(OPS,[]),ok=(Array.isArray(all)?all:[]).filter(function(o){return o&&o.status==='ok'&&String(o.data||'').slice(0,7)===month}),pendingCount=(Array.isArray(all)?all:[]).filter(function(o){return o&&o.status!=='ok'&&String(o.data||'').slice(0,7)===month}).length,a=aggregate(ok),local=localRegistryMap();
  var body=ok.map(function(o){var product=resolvedProduct(o,null,local)||'Sem produto';return'<tr><td>'+esc(o.data||'')+'</td><td>'+esc(o.numero||o.id||o.qr||'')+'</td><td>'+esc(product)+'</td><td>'+esc(o.operador||'—')+'</td><td>'+esc(o.maquina||'—')+'</td><td>'+fmt(o.produzido,2)+'</td><td>'+fmt(o.apara,2)+'</td></tr>'}).join('');
  return'<!doctype html><html><head><meta charset="utf-8"><title>Relatório '+esc(month)+'</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#111}h1{margin:0}.sub{color:#555;margin:4px 0 14px}.k{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.c{border:1px solid #bbb;border-radius:7px;padding:8px}.c span{display:block;font-size:10px;color:#666}.c b{font-size:16px}table{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px}td,th{border-bottom:1px solid #ddd;padding:5px;text-align:left}th{background:#eee}@media print{#dfVoltarFormulaProntas{display:none!important}}</style></head><body><button id="dfVoltarFormulaProntas" type="button" style="display:inline-flex;align-items:center;margin:0 0 14px;padding:10px 14px;border:1px solid #bbb;border-radius:9px;background:#fff;color:#111;font:700 14px Arial,sans-serif;cursor:pointer" onclick="try{if(window.opener)window.opener.focus()}catch(e){};try{window.close()}catch(e){}">← VOLTAR PARA FORMULAÇÃO</button><h1>DF EXTRUSOR PRO</h1><div class="sub">Relatório automático de OPs — '+esc(month)+' • Pendentes: '+pendingCount+' • Produto localizado pelo código da OP nos dados salvos de Prontas</div><div class="k"><div class="c"><span>OPs</span><b>'+ok.length+'</b></div><div class="c"><span>Produção</span><b>'+fmt(a.prod,2)+' kg</b></div><div class="c"><span>Apara</span><b>'+fmt(a.ap,2)+' kg</b></div><div class="c"><span>Líquido</span><b>'+fmt(a.liquid,2)+' kg</b></div><div class="c"><span>Rendimento</span><b>'+fmt(a.yieldPct,2)+'%</b></div><div class="c"><span>Metros est.</span><b>'+fmt(a.meters,0)+'</b></div></div><h2>OPs concluídas</h2><table><thead><tr><th>Data</th><th>OP/QR</th><th>Produto</th><th>Operador</th><th>Máquina</th><th>Produzido kg</th><th>Apara kg</th></tr></thead><tbody>'+(body||'<tr><td colspan="7">Nenhuma OP concluída.</td></tr>')+'</tbody></table><h2>Materiais</h2><table>'+rows(a.mats)+'</table><h2>Produção por operador</h2><table>'+rows(a.operators)+'</table><h2>Produção por máquina</h2><table>'+rows(a.machines)+'</table></body></html>';
}
async function printFromProntas(button){
  if(button&&button.dataset.dfProntasPrinting==='1')return;button&&button.setAttribute('data-df-prontas-printing','1');
  var w=window.open('','_blank');if(!w){alert('Libere pop-up para gerar o relatório.');button&&button.removeAttribute('data-df-prontas-printing');return}
  try{w.document.open();w.document.write('<!doctype html><html><body style="font-family:Arial;padding:30px">Conferindo cada código de OP em Prontas...</body></html>');w.document.close();await syncProntas(true);var month=selectedMonth();w.document.open();w.document.write(reportHtml(month));w.document.close();setTimeout(function(){try{w.focus();w.print()}catch(e){}},450)}catch(e){try{w.close()}catch(x){}alert('Não consegui gerar o relatório: '+(e&&e.message||e))}finally{button&&button.removeAttribute('data-df-prontas-printing')}
}

// Garante que nenhuma recuperação por foto/OCR seja usada nesta versão de teste.
try{['df_test_photo_names_confirmed_v1','df_test_photo_names_confirmed_v2','df_test_photo_names_confirmed_v3'].forEach(function(k){localStorage.removeItem(k)})}catch(e){}

document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('#dfPrintReport'):null;
  if(t){e.preventDefault();e.stopImmediatePropagation();printFromProntas(t);return}
  var q=e.target&&e.target.closest?e.target.closest('#dfFormTabOps,[data-pane="ok"],[data-pane="month"],#dfCloudRefresh'):null;
  if(q)setTimeout(function(){syncProntas(true)},80);
},true);
function queue(force){setTimeout(function(){syncProntas(!!force)},120)}
function watch(){if(observer)return;var box=document.getElementById('dfOkList');if(!box){setTimeout(watch,500);return}var pending=0;observer=new MutationObserver(function(mutations){if(!mutations.some(function(m){return m.type==='childList'&&m.addedNodes.length>0}))return;clearTimeout(pending);pending=setTimeout(patchUi,300)});observer.observe(box,{childList:true})}
function boot(){watch();patchUi();queue(false);setTimeout(function(){queue(true)},1600);setTimeout(function(){queue(true)},4200);window.addEventListener('df-op-remote-merged',function(){queue(true)});window.addEventListener('df-op-cloud-synced',function(){queue(true)});window.addEventListener('df-op-qr-created',function(){queue(true)});window.addEventListener('df-prontas-products-synced',function(){patchUi()});window.addEventListener('pageshow',function(){queue(false)});window.addEventListener('online',function(){queue(true)});setInterval(function(){if(!document.hidden)syncProntas(false)},15000)}
window.DFOpProntasProductSource={sync:function(){return syncProntas(true)},product:function(o){return savedProduct(o)||'Sem produto'}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
