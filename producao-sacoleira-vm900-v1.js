(function(){
'use strict';
if(window.DF_PRODUCAO_SACOLEIRA_VM900_V1)return;window.DF_PRODUCAO_SACOLEIRA_VM900_V1=true;

const KEY='df_producao_cadastros_v1';
const SECTOR='Sacoleira';
const MACHINE='Sacoleira VM 900 Flex';
const PRODUCTS=[
  ['Sacola M branca','38 x 48'],
  ['Sacola M reciclada azul','38 x 48'],
  ['Sacola M reciclada verde','38 x 48'],
  ['Sacola M virgem amarela','38 x 48'],
  ['Sacola M transparente virgem','38 x 48'],
  ['Sacola M vermelha Dona B','38 x 48'],
  ['Sacola G branca','48 x 58'],
  ['Sacola G vermelha Dona B','48 x 58'],
  ['Sacola P branca','30 x 40'],
  ['Sacola P reciclada verde','30 x 40'],
  ['Sacola P reciclada azul','30 x 40'],
  ['Sacola P vermelha Dona B','30 x 40']
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const allowed=new Map(PRODUCTS.map(([name,measure])=>[norm(name),{name,measure}]));
const isTargetMachine=v=>norm(v)===norm(MACHINE);

function blankSector(){return{machines:[],products:[],operators:[],productMeasures:{}}}
function seed(){
  let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){data={}}
  if(!data[SECTOR]||typeof data[SECTOR]!=='object')data[SECTOR]=blankSector();
  const sec=data[SECTOR];
  if(!Array.isArray(sec.machines))sec.machines=[];
  if(!Array.isArray(sec.products))sec.products=[];
  if(!Array.isArray(sec.operators))sec.operators=[];
  if(!sec.productMeasures||typeof sec.productMeasures!=='object')sec.productMeasures={};
  let changed=false;
  if(!sec.machines.some(v=>isTargetMachine(v))){sec.machines.push(MACHINE);changed=true}
  PRODUCTS.forEach(([name,measure])=>{
    const existing=sec.products.find(v=>norm(v)===norm(name));
    if(!existing){sec.products.push(name);changed=true}
    const key=existing||name;
    if(String(sec.productMeasures[key]||'').trim()!==measure){sec.productMeasures[key]=measure;changed=true}
  });
  if(changed){
    sec.machines=[...new Set(sec.machines.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
    sec.products=[...new Set(sec.products.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
    try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}
  }
  return changed;
}
function currentMachine(){return String(document.getElementById('prMachine')?.value||'').trim()}
function productSelect(){return document.getElementById('prProduct')}
function productTrigger(){return document.querySelector('[data-df-picker="product"]')}
function ensureNativeOptions(){
  const machine=document.getElementById('prMachine');
  if(machine&&!Array.from(machine.options||[]).some(o=>isTargetMachine(o.value))){machine.add(new Option(MACHINE,MACHINE))}
  const product=productSelect();
  if(product)PRODUCTS.forEach(([name])=>{if(!Array.from(product.options||[]).some(o=>norm(o.value)===norm(name)))product.add(new Option(name,name))})
}
function updateTrigger(){
  const el=productSelect(),b=productTrigger();if(!el||!b)return;
  const v=String(el.value||'').trim();b.textContent=v||'Selecione';b.classList.toggle('chosen',!!v)
}
function allowedForMachine(name,machine){return isTargetMachine(machine)?allowed.has(norm(name)):!allowed.has(norm(name))}
function filterNativeProducts(){
  ensureNativeOptions();
  const el=productSelect();if(!el)return;
  const machine=currentMachine();
  let clear=false;
  [...el.options].forEach(o=>{
    if(!o.value){o.hidden=false;o.disabled=false;return}
    const ok=allowedForMachine(o.value,machine);o.hidden=!ok;o.disabled=!ok;
    if(!ok&&o.selected)clear=true;
  });
  if(clear){el.value='';el.dispatchEvent(new Event('change',{bubbles:true}))}
  updateTrigger()
}
function isProductModal(m){return !!m&&norm(m.querySelector('.dfRegHead b')?.textContent).includes('produtos cadastrados')}
function isMachineModal(m){return !!m&&norm(m.querySelector('.dfRegHead b')?.textContent).includes('maquinas cadastradas')}
function filterProductModal(){
  const m=document.getElementById('dfRegModal');if(!isProductModal(m))return;
  const machine=currentMachine(),target=isTargetMachine(machine),list=m.querySelector('.dfRegList');
  let visible=0;
  const items=[...m.querySelectorAll('.dfRegItem')];
  items.forEach(item=>{
    const pick=item.querySelector('[data-pick]'),name=String(pick?.dataset.pick||'');
    const ok=allowedForMachine(name,machine);item.style.display=ok?'':'none';if(ok)visible++;
    if(target){const actions=item.querySelector('.dfRegActions');if(actions)actions.style.display='none'}
  });
  if(target&&list){
    PRODUCTS.forEach(([name])=>{const item=items.find(el=>norm(el.querySelector('[data-pick]')?.dataset.pick)===norm(name));if(item)list.appendChild(item)})
  }
  const add=m.querySelector('.dfRegAdd');if(add)add.style.display=target?'none':'';
  const meta=m.querySelector('.dfRegMeta span');if(meta&&target)meta.textContent='VM 900 FLEX';
  const count=m.querySelector('.dfRegCount');if(count)count.textContent=visible+' cadastrado'+(visible===1?'':'s');
  const empty=m.querySelector('.dfRegEmpty');if(empty&&target&&visible===0)empty.textContent='Nenhum produto desta máquina encontrado.'
}
function scheduleFilter(){requestAnimationFrame(()=>{ensureNativeOptions();filterNativeProducts();filterProductModal()})}
function openVmProductList(){setTimeout(()=>{ensureNativeOptions();filterNativeProducts();const b=productTrigger();if(b)b.click();setTimeout(filterProductModal,0)},80)}
function boot(attempt){
  ensureNativeOptions();scheduleFilter();
  if((!document.getElementById('prMachine')||!productSelect())&&attempt<40)setTimeout(()=>boot(attempt+1),100)
}

function start(){
  seed();boot(0);
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='prMachine')scheduleFilter()},true);
  document.addEventListener('click',e=>{
    const trigger=e.target&&e.target.closest&&e.target.closest('[data-df-picker="product"]');if(trigger)setTimeout(filterProductModal,0);
    const pick=e.target&&e.target.closest&&e.target.closest('#dfRegModal [data-pick]');if(!pick)return;
    const modal=document.getElementById('dfRegModal');
    if(isMachineModal(modal)&&isTargetMachine(pick.dataset.pick))openVmProductList();
    else if(isProductModal(modal))setTimeout(filterProductModal,0)
  },true);
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='dfRegSearch')setTimeout(filterProductModal,0)},true);
  window.addEventListener('storage',e=>{if(e.key===KEY){seed();scheduleFilter()}});
  window.addEventListener('df-producao-team-synced',()=>{seed();scheduleFilter()});
  document.addEventListener('df-producao-team-synced',()=>{seed();scheduleFilter()});
  window.addEventListener('pageshow',()=>{seed();scheduleFilter()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
