(function(){
'use strict';
if(window.DFOpProductHistorySearchV1)return;
window.DFOpProductHistorySearchV1=true;

var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1';
function $(id){return document.getElementById(id)}
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function normId(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function normText(v){try{return String(v==null?'':v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')}catch(e){return String(v==null?'':v).trim().toLowerCase()}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v,d){var n=Number(v||0);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'0'}
function validName(v){var s=String(v==null?'':v).trim();if(!s||/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s))return'';return s}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(normId).filter(Boolean)}
function opName(o){if(!o)return'';return validName(o.manualProductName)||validName(o.clienteFormulacao)||validName(o.produto)||validName(o.product)||validName(o.nomeProduto)||validName(o.opNome)||validName(o.title)||''}
function regName(x){var e=x&&x.expected||{};return validName(e.title)||validName(e.produto)||validName(e.product)||validName(e.clienteFormulacao)||validName(x&&x.title)||''}

function buildIndex(){
  var ops=load(OPS,[]);if(!Array.isArray(ops))ops=[];
  var reg=load(REG,{}),manual=load(MANUAL,{}),map={};
  function ensure(id){var n=normId(id);if(!n)return null;if(!map[n])map[n]={id:id||n,norm:n,name:'',createdAt:'',op:null};return map[n]}
  Object.keys(reg||{}).forEach(function(k){var x=reg[k]||{},id=x.id||k,row=ensure(id);if(!row)return;row.id=String(id||row.id);row.name=regName(x)||validName(manual[row.norm])||row.name;row.createdAt=String(x.createdAt||row.createdAt||'')});
  ops.forEach(function(o){var opids=ids(o);if(!opids.length)return;var row=ensure(opids[0]);if(!row)return;row.id=String(o.id||o.qr||o.numero||row.id);row.op=o;row.name=opName(o)||validName(manual[row.norm])||row.name;row.createdAt=String(o.createdAt||o.data||row.createdAt||'');opids.slice(1).forEach(function(alias){map[alias]=row})});
  Object.keys(manual||{}).forEach(function(k){var row=ensure(k);if(row&&!row.name)row.name=validName(manual[k])});
  var unique=[],seen=[];Object.keys(map).forEach(function(k){var r=map[k];if(!r||seen.indexOf(r)>=0)return;seen.push(r);unique.push(r)});
  return unique;
}
function statusFor(row){
  var o=row&&row.op;if(!o)return{key:'none',label:'NÃO BAIXADA',cls:'none'};
  if(o.status==='ok')return{key:'ok',label:'RODADA / PRONTA',cls:'ok'};
  if(o.status==='pending')return{key:'pending',label:'PENDENTE',cls:'pending'};
  return{key:'other',label:String(o.status||'COM BAIXA').toUpperCase(),cls:'pending'};
}
function openExisting(id){
  var n=normId(id),btn=null;
  /* A pesquisa abre a foto na nuvem diretamente quando existe um vínculo salvo. */
  try{var map=load('df_op_photo_cloud_map_v1',{}),ops=load(OPS,[]),rec=Array.isArray(ops)?ops.find(function(o){return ids(o).some(function(k){return normId(k)===n})}):null;var cloudId=String(rec&&rec.cloudPhotoId||map[n]&&map[n].photoId||'');if(cloudId&&window.DFOpCloud&&typeof window.DFOpCloud.openPhoto==='function'){window.DFOpCloud.openPhoto(cloudId,false);return true}}catch(e){}

  document.querySelectorAll('[data-view]').forEach(function(b){if(!btn&&normId(b.getAttribute('data-view'))===n)btn=b});
  if(btn){try{btn.click();return true}catch(e){}}
  alert('A foto desta OP não está disponível neste aparelho agora.');return false;
}
function render(){
  var input=$('dfProductHistorySearch'),out=$('dfProductHistoryResults');if(!input||!out)return;
  var q=normText(input.value);if(!q){out.innerHTML='<div class="dfPhHint">Digite parte do nome do produto. Ex.: <b>Coque</b>.</div>';return}
  var list=buildIndex().filter(function(r){return r.name&&normText(r.name).indexOf(q)>=0});
  list.sort(function(a,b){return String(b.op&&b.op.data||b.createdAt||'').localeCompare(String(a.op&&a.op.data||a.createdAt||''))});
  var produced=0,ready=0,pending=0,none=0;
  list.forEach(function(r){var s=statusFor(r);if(s.key==='ok')ready++;else if(s.key==='pending')pending++;else if(s.key==='none')none++;if(r.op)produced+=Number(r.op.produzido||0)});
  if(!list.length){out.innerHTML='<div class="dfPhEmpty">Nenhuma OP encontrada com <b>'+esc(input.value.trim())+'</b>.</div>';return}
  var summary='<div class="dfPhSummary"><div><span>OPs encontradas</span><b>'+list.length+'</b></div><div><span>Rodadas / prontas</span><b>'+ready+'</b></div><div><span>Sem baixa</span><b>'+none+'</b></div><div><span>Produção encontrada</span><b>'+fmt(produced,2)+' kg</b></div></div>'+(pending?'<div class="dfPhPendingNote">⚠️ '+pending+' OP(s) aparecem como pendentes.</div>':'');
  var cards=list.map(function(r){var o=r.op,s=statusFor(r),date=String(o&&o.data||r.createdAt||'').slice(0,10),prod=o?Number(o.produzido||0):0,ap=o?Number(o.apara||0):0,canOpen=!!o;return '<div class="dfPhRow"><div class="dfPhTop"><div><strong>'+esc(r.name)+'</strong><small>'+esc(r.id)+'</small></div><span class="dfPhBadge '+s.cls+'">'+esc(s.label)+'</span></div><div class="dfPhMeta">'+(date?esc(date)+' • ':'')+(canOpen?'Produção '+fmt(prod,2)+' kg • Apara '+fmt(ap,2)+' kg':'Ainda não há baixa/foto processada para esta OP')+'</div><button type="button" class="dfPhOpen" data-ph-open="'+esc(r.id)+'" '+(canOpen?'':'disabled')+'>'+(canOpen?'ABRIR FOTO':'SEM FOTO / SEM BAIXA')+'</button></div>'}).join('');
  out.innerHTML=summary+cards;
  out.querySelectorAll('[data-ph-open]').forEach(function(b){b.onclick=function(){openExisting(b.getAttribute('data-ph-open'))}});
}
function style(){if($('dfProductHistoryStyle'))return;var s=document.createElement('style');s.id='dfProductHistoryStyle';s.textContent='\
#dfProductHistoryBox{margin:0 0 15px;padding:13px;border:1px solid #334155;background:#0b1324;border-radius:14px}\
#dfProductHistoryBox h4{margin:0 0 5px;font-size:17px;color:#f8fafc}\
#dfProductHistoryBox .dfPhSub{font-size:12px;line-height:1.45;color:#94a3b8;margin-bottom:9px}\
.dfPhSearchLine{display:grid;grid-template-columns:1fr auto;gap:8px}\
#dfProductHistorySearch{width:100%;box-sizing:border-box;border:1px solid #475569;background:#080f1d;color:#fff;border-radius:10px;padding:12px;font-size:16px}\
#dfProductHistoryBtn{border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:10px;padding:0 15px;font-weight:900}\
#dfProductHistoryResults{margin-top:10px}.dfPhHint,.dfPhEmpty{color:#94a3b8;font-size:12px;padding:8px 2px}.dfPhEmpty b{color:#fff}\
.dfPhSummary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.dfPhSummary div{border:1px solid #263244;background:#0f172a;border-radius:10px;padding:9px}.dfPhSummary span{display:block;color:#94a3b8;font-size:10px}.dfPhSummary b{display:block;margin-top:2px;color:#fff;font-size:14px}.dfPhPendingNote{font-size:11px;color:#fde68a;margin:4px 0 8px}\
.dfPhRow{border:1px solid #263244;background:#111827;border-radius:12px;padding:10px;margin-top:8px}.dfPhTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.dfPhTop strong{display:block;color:#ffd36a;font-size:14px}.dfPhTop small{display:block;color:#94a3b8;font-size:10px;margin-top:3px;word-break:break-all}.dfPhBadge{white-space:nowrap;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950}.dfPhBadge.ok{background:#073b1d;color:#86efac}.dfPhBadge.pending{background:#3b2605;color:#fde68a}.dfPhBadge.none{background:#271018;color:#fca5a5}.dfPhMeta{font-size:11px;color:#cbd5e1;margin:8px 0}.dfPhOpen{width:100%;border:1px solid #475569;background:#0f172a;color:#f8fafc;border-radius:9px;padding:10px;font-weight:900}.dfPhOpen:disabled{opacity:.45}\
@media(max-width:430px){.dfPhSearchLine{grid-template-columns:1fr}.dfPhSummary{grid-template-columns:1fr 1fr}}';document.head.appendChild(s)}
function mount(){
  style();var list=$('dfOkList');if(!list||$('dfProductHistoryBox'))return !!list;
  var box=document.createElement('div');box.id='dfProductHistoryBox';box.innerHTML='<h4>🔎 PESQUISAR PRODUTO / HISTÓRICO DE OP</h4><div class="dfPhSub">Pesquise pelo nome do produto para ver todas as OPs desse produto, o código/QR, o que já teve baixa, quantos quilos foram produzidos e abrir a foto.</div><div class="dfPhSearchLine"><input id="dfProductHistorySearch" placeholder="Ex.: Coque" autocomplete="off"><button id="dfProductHistoryBtn" type="button">PESQUISAR</button></div><div id="dfProductHistoryResults"><div class="dfPhHint">Digite parte do nome do produto.</div></div>';
  list.parentNode.insertBefore(box,list);
  $('dfProductHistoryBtn').onclick=render;$('dfProductHistorySearch').addEventListener('input',function(){clearTimeout(window.__dfPhTimer);window.__dfPhTimer=setTimeout(render,180)});$('dfProductHistorySearch').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();render()}});
  return true;
}
function boot(){if(mount())return;var obs=new MutationObserver(function(){if(mount())obs.disconnect()});obs.observe(document.documentElement,{childList:true,subtree:true});setTimeout(mount,800);setTimeout(mount,1800);window.addEventListener('df-prontas-products-synced',function(){if($('dfProductHistorySearch')&&$('dfProductHistorySearch').value.trim())render()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
