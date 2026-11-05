(function(){
'use strict';
if(window.DFOpMaterialCloudBridgeV1)return;window.DFOpMaterialCloudBridgeV1=true;
const OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1';
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(v){return String(v??'').trim().toUpperCase().replace(/\s+/g,'')}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
function cleanMaterials(list){if(!Array.isArray(list))return[];return list.slice(0,40).map(m=>({name:String(m?.name||m?.material||m?.nome||'').trim().slice(0,100),pct:Math.max(0,Math.min(100,num(m?.pct??m?.percent??m?.porcentagem??m?.percentage)))})).filter(m=>m.name&&m.pct>0)}
function regMaterials(op){const r=load(REG,{}),opids=ids(op);for(const [k,x] of Object.entries(r||{})){if(opids.includes(norm(x?.id||k)))return cleanMaterials(x?.expected?.materials)}return[]}
function materialsForId(id){const a=load(OPS,[]),n=norm(id),op=Array.isArray(a)?a.find(o=>ids(o).includes(n)):null;if(!op)return[];const own=cleanMaterials(op.materials);return own.length?own:regMaterials(op)}
function mergeRemoteMaterials(photos){if(!Array.isArray(photos)||!photos.length)return false;const a=load(OPS,[]);if(!Array.isArray(a))return false;let changed=false;for(const p of photos){const mats=cleanMaterials(p?.materials);if(!mats.length)continue;const sid=norm(p?.sourceId||p?.qr||'');if(!sid)continue;const i=a.findIndex(o=>ids(o).includes(sid));if(i<0)continue;const current=cleanMaterials(a[i]?.materials);if(JSON.stringify(current)!==JSON.stringify(mats)){a[i].materials=mats.map(m=>({name:m.name,pct:m.pct,kg:(+a[i].produzido||0)*m.pct/100}));changed=true}}
if(changed){save(OPS,a);try{window.dispatchEvent(new CustomEvent('df-op-remote-merged',{detail:{materials:true}}))}catch(e){}}return changed}
const prev=window.fetch.bind(window);
window.fetch=async function(input,init){
  let url='';try{url=typeof input==='string'?input:String(input&&input.url||'')}catch(e){}
  try{
    if(url.includes('/op/photo/upload')&&init&&init.body instanceof FormData){const form=init.body;if(!form.has('materials')){const sid=String(form.get('sourceId')||form.get('qr')||'');const mats=materialsForId(sid);if(mats.length)form.append('materials',JSON.stringify(mats))}}
  }catch(e){}
  const r=await prev(input,init);
  try{
    if(url.includes('/op/photo/list')&&r&&r.ok){r.clone().json().then(j=>mergeRemoteMaterials(j&&j.photos)).catch(()=>{})}
  }catch(e){}
  return r;
};
})();
