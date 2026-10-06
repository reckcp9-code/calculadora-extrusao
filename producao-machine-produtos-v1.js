(function(){
'use strict';
if(window.DF_PRODUCAO_MACHINE_PRODUTOS_V1)return;window.DF_PRODUCAO_MACHINE_PRODUTOS_V1=true;

const KEY='df_producao_cadastros_v1';
const OPS_KEYS=['df_producao_ops_setores_test_v3','df_producao_ops_auto_v1'];
const PESADAO=[
  ['Pesadão 15 litros','39 x 58'],
  ['Pesadão 30 litros','59 x 62'],
  ['Pesadão 50 litros','63 x 80'],
  ['Pesadão 100 litros','75 x 90'],
  ['Pesadão 105 litros','75 x 105'],
  ['Pesadão 150 litros','85 x 100'],
  ['Pesadão 200 litros','85 x 110']
];
const SACOLEIRA_VM900=[
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
const PICOTADEIRA_USN=[
  ['Saco Freezer 2KG X 50','20 x 34'],
  ['Saco Freezer 3KG X 50','23 x 37'],
  ['Saco Freezer 5KG X 50','28 x 40'],
  ['Saco Freezer 7KG X 50','34 x 49'],
  ['Saco Freezer 2KG X 100','20 x 34'],
  ['Saco Freezer 3KG X 100','23 x 37'],
  ['Saco Freezer 5KG X 100','28 x 40'],
  ['Saco Freezer 7KG X 100','34 x 49'],
  ['Bobina Picotada Light P/1/2 KG','15 x 28'],
  ['Bobina Picotada Light P/1 KG','19 x 29'],
  ['Bobina Picotada Light P/2 KG','20 x 34'],
  ['Bobina Picotada Light P/3 KG','23 x 37'],
  ['Bobina Picotada Light P/5 KG','28 x 40'],
  ['Bobina Picotada Light P/8 KG','34 x 49'],
  ['Bobina Picotada Light P/10 KG','40 x 60']
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const uniq=a=>[...new Set((a||[]).map(v=>String(v||'').trim()).filter(Boolean))];
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return{}}}
function write(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
function currentSector(){const s=window.__DF_PROD_V3_STATE&&window.__DF_PROD_V3_STATE.sector;return s||'Picote'}
function currentMachine(){return String(document.getElementById('prMachine')?.value||'').trim()}
function machineRule(machine){
  const m=norm(machine);
  if(!m)return'none';
  if(m.includes('picotadeira mkb')||m.includes('picotadeira utz')||m.includes('picotadeira vm'))return'pesadao';
  if(m.includes('sacoleira vm 900 flex'))return'sacoleira-fixed';
  if(m.includes('picotadeira usn')||m.includes('picotadeira uzn')||m.includes('picotadeira uns'))return'custom';
  if(m.includes('sacoleira')||m.includes('blocadora'))return'custom';
  return'free';
}
function ensureSector(d,name){
  if(!d[name]||typeof d[name]!=='object')d[name]={machines:[],products:[],operators:[],productMeasures:{}};
  const s=d[name];
  if(!Array.isArray(s.machines))s.machines=[];
  if(!Array.isArray(s.products))s.products=[];
  if(!Array.isArray(s.operators))s.operators=[];
  if(!s.productMeasures||typeof s.productMeasures!=='object')s.productMeasures={};
  if(!s.machineProducts||typeof s.machineProducts!=='object')s.machineProducts={};
  return s;
}
function addProduct(sec,name,measure){
  const old=sec.products.find(v=>norm(v)===norm(name));
  const key=old||name;
  if(!old)sec.products.push(name);
  if(measure&&!String(sec.productMeasures[key]||'').trim())sec.productMeasures[key]=measure;
}
function assign(sec,machine,product){
  if(!machine||!product)return;
  const k=norm(machine),a=Array.isArray(sec.machineProducts[k])?sec.machineProducts[k]:[];
  if(!a.some(v=>norm(v)===norm(product)))a.push(product);
  sec.machineProducts[k]=uniq(a);
}
function findSectorForMachine(d,machine){
  const target=norm(machine);let fallback=currentSector();
  for(const name of Object.keys(d)){const sec=d[name];if(sec&&Array.isArray(sec.machines)&&sec.machines.some(v=>norm(v)===target))return name}
  return fallback;
}
function seedKnownAssignments(d){
  const pic=ensureSector(d,'Picote');
  PICOTADEIRA_USN.forEach(([p,m])=>{addProduct(pic,p,m);assign(pic,'PICOTADEIRA USN',p)});
  [['PICOTADEIRA UZN','SACO FREEZER 3KG'],['PICOTADEIRA UNS','SACO FREEZER 3KG'],['SACOLEIRA FLEX 900','SACOLA AZUL GRANDE'],['BLOCADORA FLEX 900','AGRANEL PARA LIXO 100 LITROS PRETO']].forEach(([m,p])=>{
    if(pic.products.some(v=>norm(v)===norm(p)))assign(pic,m,p)
  });
}
function walkHistorical(d,node,depth){
  if(depth>7||node==null)return;
  if(Array.isArray(node)){node.forEach(v=>walkHistorical(d,v,depth+1));return}
  if(typeof node!=='object')return;
  const machine=String(node.machine||node.maquina||node.machineName||node.maquinaNome||'').trim();
  const product=String(node.product||node.produto||node.productName||node.product_name||'').trim();
  if(machine&&product&&machineRule(machine)==='custom'){
    const secName=String(node.sector||node.setor||findSectorForMachine(d,machine)||currentSector());
    const sec=ensureSector(d,secName);
    const measure=String(node.measure||node.medida||'').trim();
    addProduct(sec,product,measure);assign(sec,machine,product)
  }
  Object.keys(node).forEach(k=>{const v=node[k];if(v&&typeof v==='object')walkHistorical(d,v,depth+1)})
}
function ensureData(){
  const d=read();
  ['Picote','Sacoleira','Blocadora'].forEach(s=>ensureSector(d,s));
  const pic=ensureSector(d,'Picote'),sac=ensureSector(d,'Sacoleira');
  PESADAO.forEach(([n,m])=>addProduct(pic,n,m));
  SACOLEIRA_VM900.forEach(([n,m])=>addProduct(sac,n,m));
  seedKnownAssignments(d);
  OPS_KEYS.forEach(k=>{try{walkHistorical(d,JSON.parse(localStorage.getItem(k)||'null'),0)}catch(e){}});
  Object.keys(d).forEach(s=>{const sec=d[s];if(sec&&Array.isArray(sec.products))sec.products=uniq(sec.products).sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}))});
  write(d);return d
}
function fixedList(rule){return rule==='pesadao'?PESADAO:rule==='sacoleira-fixed'?SACOLEIRA_VM900:[]}
function allowedNames(machine){
  const rule=machineRule(machine),d=ensureData(),sec=ensureSector(d,currentSector());
  if(rule==='pesadao'||rule==='sacoleira-fixed')return fixedList(rule).map(x=>x[0]);
  if(rule==='custom')return uniq(sec.machineProducts[norm(machine)]||[]);
  return uniq(sec.products||[])
}
function productSelect(){return document.getElementById('prProduct')}
function productTrigger(){return document.querySelector('[data-df-picker="product"]')}
function ensureOptions(){
  const el=productSelect();if(!el)return;
  const d=ensureData(),sec=ensureSector(d,currentSector());
  (sec.products||[]).forEach(name=>{if(!Array.from(el.options||[]).some(o=>norm(o.value)===norm(name)))el.add(new Option(name,name))})
}
function updateTrigger(){const el=productSelect(),b=productTrigger();if(!el||!b)return;const v=String(el.value||'').trim();b.textContent=v||'Selecione';b.classList.toggle('chosen',!!v)}
function filterNative(){
  ensureOptions();const el=productSelect();if(!el)return;
  const machine=currentMachine(),rule=machineRule(machine);if(rule==='none')return;
  const allow=new Set(allowedNames(machine).map(norm));let clear=false;
  [...el.options].forEach(o=>{if(!o.value){o.hidden=false;o.disabled=false;return}const ok=rule==='free'||allow.has(norm(o.value));o.hidden=!ok;o.disabled=!ok;if(!ok&&o.selected)clear=true});
  if(clear){el.value='';el.dispatchEvent(new Event('change',{bubbles:true}))}updateTrigger()
}
function isProductModal(m){return !!m&&norm(m.querySelector('.dfRegHead b')?.textContent).includes('produtos cadastrados')}
function isMachineModal(m){return !!m&&norm(m.querySelector('.dfRegHead b')?.textContent).includes('maquinas cadastradas')}
function filterModal(){
  const m=document.getElementById('dfRegModal');if(!isProductModal(m))return;
  const machine=currentMachine(),rule=machineRule(machine),allow=new Set(allowedNames(machine).map(norm)),items=[...m.querySelectorAll('.dfRegItem')],list=m.querySelector('.dfRegList'),q=norm(m.querySelector('#dfRegSearch')?.value||'');let visible=0;
  m.querySelector('#dfMachineEmpty')?.remove();
  if((rule==='pesadao'||rule==='sacoleira-fixed')&&list&&list.dataset.dfMachineOrder!==rule){
    fixedList(rule).forEach(([name])=>{const item=items.find(el=>norm(el.querySelector('[data-pick]')?.dataset.pick)===norm(name));if(item)list.appendChild(item)});
    list.dataset.dfMachineOrder=rule;
  }
  items.forEach(item=>{
    const name=String(item.querySelector('[data-pick]')?.dataset.pick||''),machineOk=rule==='free'||rule==='none'||allow.has(norm(name));
    const searchOk=!q||norm(name).includes(q)||norm(item.querySelector('.main small')?.textContent||'').includes(q);
    item.dataset.dfMachineMatch=machineOk?'1':'0';item.dataset.dfSearchMatch=searchOk?'1':'0';
    const ok=machineOk&&searchOk;item.style.display=ok?'':'none';
    if(ok){visible++;const a=item.querySelector('.dfRegActions');if(a)a.style.display=''}
  });
  const add=m.querySelector('.dfRegAdd');if(add)add.style.display=(rule==='pesadao'||rule==='sacoleira-fixed')?'none':'';
  const meta=m.querySelector('.dfRegMeta span');if(meta)meta.textContent=rule==='pesadao'?'SÓ PESADÃO':rule==='sacoleira-fixed'?'VM 900 FLEX':rule==='custom'?(machine||'MÁQUINA'):'TODOS';
  const count=m.querySelector('.dfRegCount');if(count)count.textContent=visible+' cadastrado'+(visible===1?'':'s');
  if(visible===0&&list&&!q){const e=document.createElement('div');e.id='dfMachineEmpty';e.className='dfRegEmpty';e.textContent=rule==='custom'?'Nenhum produto cadastrado para esta máquina. Use CADASTRAR para adicionar.':'Nenhum produto disponível para esta máquina.';list.prepend(e)}
}
function schedule(){requestAnimationFrame(()=>{filterNative();filterModal()})}
function openProducts(){setTimeout(()=>{schedule();const b=productTrigger();if(b)b.click();setTimeout(filterModal,0)},70)}
function assignNewProduct(name,oldName){
  const machine=currentMachine();if(machineRule(machine)!=='custom'||!name)return;
  const d=read(),sec=ensureSector(d,currentSector()),k=norm(machine);let a=Array.isArray(sec.machineProducts[k])?sec.machineProducts[k]:[];
  if(oldName)a=a.filter(v=>norm(v)!==norm(oldName));
  if(!a.some(v=>norm(v)===norm(name)))a.push(name);
  sec.machineProducts[k]=uniq(a);write(d)
}
function cleanupDeleted(name){
  const d=read();let exists=false;
  Object.keys(d).forEach(s=>{const sec=ensureSector(d,s);if(sec.products.some(v=>norm(v)===norm(name)))exists=true});
  if(exists)return;
  Object.keys(d).forEach(s=>{const sec=ensureSector(d,s);Object.keys(sec.machineProducts||{}).forEach(k=>{sec.machineProducts[k]=(sec.machineProducts[k]||[]).filter(v=>norm(v)!==norm(name))})});write(d)
}
let editOld='';
function start(){
  ensureData();let tries=0;const boot=setInterval(()=>{schedule();if(document.getElementById('prMachine')&&productSelect()||++tries>40)clearInterval(boot)},100);
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='prMachine'){editOld='';schedule()}},true);
  document.addEventListener('click',e=>{
    const edit=e.target&&e.target.closest&&e.target.closest('#dfRegModal [data-edit]');if(edit)editOld=String(edit.dataset.edit||'');
    const del=e.target&&e.target.closest&&e.target.closest('#dfRegModal [data-del]');if(del){const n=String(del.dataset.del||'');setTimeout(()=>{cleanupDeleted(n);schedule()},40)}
    const save=e.target&&e.target.closest&&e.target.closest('#dfRegSave');if(save){const m=document.getElementById('dfRegModal');if(isProductModal(m)){const name=String(m.querySelector('#dfRegNew')?.value||'').trim(),old=editOld;setTimeout(()=>{assignNewProduct(name,old);editOld='';ensureData();schedule()},20)}}
    const p=e.target&&e.target.closest&&e.target.closest('[data-df-picker="product"]');if(p)setTimeout(filterModal,0);
    const pick=e.target&&e.target.closest&&e.target.closest('#dfRegModal [data-pick]');if(pick){const m=document.getElementById('dfRegModal');if(isMachineModal(m)){const chosen=String(pick.dataset.pick||'');if(machineRule(chosen)!=='free'&&machineRule(chosen)!=='none')setTimeout(openProducts,20)}else if(isProductModal(m))setTimeout(filterModal,0)}
  },true);
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='dfRegSearch')requestAnimationFrame(filterModal)},true);
  window.addEventListener('storage',e=>{if(e.key===KEY){ensureData();schedule()}});
  window.addEventListener('df-producao-team-synced',()=>{ensureData();schedule()});
  document.addEventListener('df-producao-team-synced',()=>{ensureData();schedule()});
  window.addEventListener('pageshow',()=>{ensureData();schedule()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
