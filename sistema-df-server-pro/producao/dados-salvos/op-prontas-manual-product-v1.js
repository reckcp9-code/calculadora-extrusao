(function(){
'use strict';
if(window.DFOpProntasManualProductV1)return;
window.DFOpProntasManualProductV1=true;

var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',MANUAL='df_manual_op_product_v1';
var currentId='';
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function validName(v){var s=String(v==null?'':v).trim();if(!s||/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s))return'';return s}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function findOp(id){var a=load(OPS,[]),n=norm(id);if(!Array.isArray(a))return null;return a.find(function(o){return ids(o).indexOf(n)>=0})||null}
function findRegName(id){var r=load(REG,{}),n=norm(id),name='';Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)!==n)return false;var e=x.expected||{};name=validName(e.title)||validName(e.produto)||validName(e.product);return !!name});return name}
function currentName(id){var m=load(MANUAL,{}),n=norm(id);return validName(m[n])||validName((findOp(id)||{}).manualProductName)||validName((findOp(id)||{}).produto)||findRegName(id)||''}
function persist(id,name){
  var n=norm(id),v=String(name||'').trim();if(!n||!v)return false;
  var a=load(OPS,[]),changed=false;
  if(Array.isArray(a))a.forEach(function(o){if(ids(o).indexOf(n)<0)return;o.manualProductName=v;o.clienteFormulacao=v;o.produto=v;o.product=v;o.nomeProduto=v;o.opNome=v;changed=true});
  if(changed)save(OPS,a);
  var r=load(REG,{}),key=null;
  Object.keys(r||{}).some(function(k){var x=r[k]||{};if(norm(x.id||k)===n){key=k;return true}return false});
  if(!key)key=id||n;
  var x=r[key]||{id:id||n,createdAt:new Date().toISOString(),expected:{}};if(!x.expected)x.expected={};
  x.expected.title=v;x.expected.produto=v;x.expected.product=v;r[key]=x;save(REG,r);
  var m=load(MANUAL,{});m[n]=v;save(MANUAL,m);
  try{window.dispatchEvent(new CustomEvent('df-prontas-products-synced',{detail:{id:id,name:v,manual:true}}))}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-op-meta-enriched',{detail:{id:id,name:v,manual:true}}))}catch(e){}
  return true;
}
function mount(){
  if(!currentId)return false;
  var body=document.getElementById('dfModalBody'),saveBtn=document.getElementById('dfFixSave');if(!body||!saveBtn)return false;
  var old=document.getElementById('dfManualProductBox');if(old)old.remove();
  var name=currentName(currentId),box=document.createElement('div');box.id='dfManualProductBox';
  box.style.cssText='margin:12px 0;padding:12px;border:1px solid #f5a000;background:#211400;border-radius:12px';
  box.innerHTML='<label for="dfManualProductName" style="display:block;color:#ffd36a;font-size:13px;font-weight:900;margin:0 0 7px">NOME DO PRODUTO</label><input id="dfManualProductName" value="'+esc(name)+'" placeholder="Digite o nome do produto" autocomplete="off" style="width:100%;box-sizing:border-box;border:1px solid #f5a000;background:#0f172a;color:#fff;border-radius:10px;padding:13px;font-size:17px"><div style="margin-top:7px;color:#cbd5e1;font-size:11px;line-height:1.4">Se estiver “Sem produto”, digite o nome correto aqui. Ao salvar, este nome será usado em Prontas e no relatório.</div>';
  saveBtn.parentNode.insertBefore(box,saveBtn);
  saveBtn.textContent='✅ SALVAR DADOS E PRODUTO';
  return true;
}

document.addEventListener('click',function(e){
  var open=e.target&&e.target.closest?e.target.closest('[data-view]'):null;
  if(open){currentId=String(open.getAttribute('data-view')||'').trim();setTimeout(mount,30);setTimeout(mount,180);return}
  var saveBtn=e.target&&e.target.closest?e.target.closest('#dfFixSave'):null;
  if(saveBtn&&currentId){var input=document.getElementById('dfManualProductName'),name=String(input&&input.value||'').trim();if(name)persist(currentId,name)}
  var close=e.target&&e.target.closest?e.target.closest('#dfCloseModal'):null;if(close)currentId='';
},true);

var obs=new MutationObserver(function(){var modal=document.getElementById('dfOpModal');if(currentId&&modal&&modal.classList.contains('on')&&!document.getElementById('dfManualProductName'))mount()});
function boot(){obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
