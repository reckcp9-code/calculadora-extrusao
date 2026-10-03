(function(){
'use strict';
if(window.DFProdProdutosPorMaquinaV1)return;window.DFProdProdutosPorMaquinaV1=true;

const CAD_KEY='df_producao_cadastros_v1';
const MAP_KEY='df_producao_produtos_por_maquina_v1';
const USN='Picotadeira USN';
const OLD=[
  ['SACO PARA LIXO ROLO 15 LITROS PRETO','39 x 58'],
  ['SACO PARA LIXO ROLO 30 LITROS PRETO','59 x 62'],
  ['SACO PARA LIXO ROLO 50 LITROS PRETO','63 x 80'],
  ['SACO PARA LIXO ROLO 105 LITROS PRETO','75 x 105'],
  ['SACO PARA LIXO ROLO 150 LITROS PRETO','85 x 100'],
  ['SACO PARA LIXO ROLO 200 LITROS PRETO','85 x 110'],
  ['SACO PARA LIXO ROLO BIO 15 LITROS PRETO','39 x 58'],
  ['SACO PARA LIXO ROLO BIO 30 LITROS PRETO','59 x 62'],
  ['SACO PARA LIXO ROLO BIO 50 LITROS PRETO','63 x 80'],
  ['SACO PARA LIXO ROLO BIO 105 LITROS PRETO','75 x 105'],
  ['SACO PARA LIXO ROLO BIO 10 LITROS ROSA','38 x 40']
];
const USN_PRODUCTS=[
  ['SACO FREEZER 2KG X50','20 x 34'],
  ['SACO FREEZER 3KG X50','23 x 37'],
  ['SACO FREEZER 5KG X50','28 x 40'],
  ['SACO FREEZER 7KG X50','34 x 49'],
  ['SACO FREEZER 2KG X100','20 x 34'],
  ['SACO FREEZER 3KG X100','23 x 37'],
  ['SACO FREEZER 5KG X100','28 x 40'],
  ['SACO FREEZER 7KG X100','34 x 49']
];

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function sector(){const s=window.__DF_PROD_V3_STATE&&window.__DF_PROD_V3_STATE.sector;return ['Picote','Sacoleira','Blocadora'].includes(s)?s:'Picote'}
function readCad(){try{return JSON.parse(localStorage.getItem(CAD_KEY)||'{}')||{}}catch(e){return{}}}
function writeCad(d){try{localStorage.setItem(CAD_KEY,JSON.stringify(d))}catch(e){}}
function readMap(){try{return JSON.parse(localStorage.getItem(MAP_KEY)||'{}')||{}}catch(e){return{}}}
function writeMap(d){try{localStorage.setItem(MAP_KEY,JSON.stringify(d))}catch(e){}}
function ensureSector(d,s){if(!d[s]||typeof d[s]!=='object')d[s]={machines:[],products:[],operators:[],productMeasures:{}};if(!Array.isArray(d[s].machines))d[s].machines=[];if(!Array.isArray(d[s].products))d[s].products=[];if(!Array.isArray(d[s].operators))d[s].operators=[];if(!d[s].productMeasures||typeof d[s].productMeasures!=='object')d[s].productMeasures={};return d[s]}
function key(s,m){return s+'::'+norm(m)}
function pack(rows){const products=[],measures={};rows.forEach(([n,m])=>{products.push(n);measures[n]=m});return{products,measures}}
function seed(){
  const cad=readCad(),pic=ensureSector(cad,'Picote');
  if(!pic.machines.some(x=>norm(x)===norm(USN)))pic.machines.push(USN);
  pic.machines=[...new Set(pic.machines)].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR',{sensitivity:'base'}));
  writeCad(cad);
  const map=readMap(),uk=key('Picote',USN);
  if(!map[uk])map[uk]=pack(USN_PRODUCTS);
  writeMap(map);
}
function selectedMachine(){return String(document.getElementById('prMachine')?.value||'').trim()}
function defaultCatalog(s,m){if(s==='Picote'&&norm(m)!==norm(USN))return pack(OLD);if(s==='Picote'&&norm(m)===norm(USN))return pack(USN_PRODUCTS);return{products:[],measures:{}}}
function getCatalog(s,m){if(!m)return{products:[],measures:{}};const map=readMap(),k=key(s,m);return map[k]||defaultCatalog(s,m)}
function saveCurrentToMap(){
  const s=sector(),m=selectedMachine();if(!m)return;
  const cad=readCad(),sec=ensureSector(cad,s),map=readMap();
  map[key(s,m)]={products:(sec.products||[]).slice(),measures:Object.assign({},sec.productMeasures||{})};
  writeMap(map);
}
function clearProductUI(){
  const p=document.getElementById('prProduct');if(p){p.value='';try{p.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}}
  const t=document.querySelector('[data-df-picker="product"]');if(t){t.textContent='Selecione';t.classList.remove('chosen')}
  const measure=document.getElementById('prMeasure');if(measure)measure.value='';
}
function applyCatalog(){
  const s=sector(),m=selectedMachine();if(!m)return;
  const cat=getCatalog(s,m),cad=readCad(),sec=ensureSector(cad,s);
  sec.products=(cat.products||[]).slice();sec.productMeasures=Object.assign({},cat.measures||{});writeCad(cad);
  clearProductUI();
}
function bindMachine(){
  const m=document.getElementById('prMachine');if(!m||m.dataset.dfMachineCatalog==='1')return false;
  m.dataset.dfMachineCatalog='1';m.addEventListener('change',function(){applyCatalog()});
  const trigger=document.querySelector('[data-df-picker="machine"]');if(trigger&&!trigger.dataset.dfMachineCatalog){trigger.dataset.dfMachineCatalog='1';}
  return true;
}
function bindManageCapture(){
  if(document.documentElement.dataset.dfCatalogCapture==='1')return;document.documentElement.dataset.dfCatalogCapture='1';
  document.addEventListener('click',function(e){
    const save=e.target&&e.target.closest?e.target.closest('#dfRegSave'):null;
    const del=e.target&&e.target.closest?e.target.closest('[data-del]'):null;
    if(save||del)setTimeout(saveCurrentToMap,80);
  },true);
}
function start(){
  seed();bindManageCapture();
  let n=0,t=setInterval(function(){seed();if(bindMachine()){clearInterval(t);const m=selectedMachine();if(m)applyCatalog()}if(++n>50)clearInterval(t)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
