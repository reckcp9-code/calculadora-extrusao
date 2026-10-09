(function(){
'use strict';
if(window.DFProducaoCadastrosV2)return;window.DFProducaoCadastrosV2=true;

const KEY='df_producao_cadastros_v1';
const SEED='df_producao_produtos_seed_proposta_v1';
const DELETED_KEY='df_producao_produtos_deleted_v1';
const SETORES=['Picote','Sacoleira','Blocadora'];
const CFG={
  machine:{id:'prMachine',label:'Máquina',key:'machines',title:'Máquinas cadastradas',placeholder:'Ex.: Picotadeira 01',search:'Pesquisar máquina...'},
  product:{id:'prProduct',label:'Produto',key:'products',title:'Produtos cadastrados',placeholder:'Nome do produto',search:'Pesquisar produto...'},
  operator:{id:'prOperator',label:'Operador',key:'operators',title:'Operadores cadastrados',placeholder:'Nome do operador',search:'Pesquisar operador...'}
};
const PROPOSTA=[
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
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function blankSector(){return{machines:[],products:[],operators:[],productMeasures:{},machineProducts:{}}}
function empty(){return{Picote:blankSector(),Sacoleira:blankSector(),Blocadora:blankSector()}}
function read(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null'),out=empty();
    if(raw&&typeof raw==='object')SETORES.forEach(s=>{
      const x=raw[s]||{};
      out[s].machines=Array.isArray(x.machines)?x.machines.slice():[];
      out[s].products=Array.isArray(x.products)?x.products.slice():[];
      out[s].operators=Array.isArray(x.operators)?x.operators.slice():[];
      out[s].productMeasures=x.productMeasures&&typeof x.productMeasures==='object'?Object.assign({},x.productMeasures):{};
      out[s].machineProducts=x.machineProducts&&typeof x.machineProducts==='object'?Object.fromEntries(Object.entries(x.machineProducts).map(([k,v])=>[k,Array.isArray(v)?v.slice():[]])):{};
    });
    return out;
  }catch(e){return empty()}
}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
function readDeleted(){try{const x=JSON.parse(localStorage.getItem(DELETED_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function isDeleted(name){return !!readDeleted()[norm(name)]}
function markDeleted(name){const k=norm(name);if(!k)return;const d=readDeleted();d[k]={name:String(name||'').trim(),at:Date.now()};try{localStorage.setItem(DELETED_KEY,JSON.stringify(d))}catch(e){}}
function unmarkDeleted(name){const k=norm(name);if(!k)return;const d=readDeleted();if(d[k]){delete d[k];try{localStorage.setItem(DELETED_KEY,JSON.stringify(d))}catch(e){}}}
function sector(){const s=window.__DF_PROD_V3_STATE&&window.__DF_PROD_V3_STATE.sector;return SETORES.includes(s)?s:'Picote'}
function sort(a){return [...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}))}
function seedProducts(){
  let seeded=false;try{seeded=localStorage.getItem(SEED)==='1'}catch(e){}
  if(seeded)return;
  const d=read();
  SETORES.forEach(s=>{
    PROPOSTA.forEach(([name,measure])=>{
      if(isDeleted(name))return;
      if(!d[s].products.some(x=>norm(x)===norm(name)))d[s].products.push(name);
      d[s].productMeasures[name]=measure;
    });
    d[s].products=sort(d[s].products);
  });
  write(d);try{localStorage.setItem(SEED,'1')}catch(e){}
}
function list(type){const d=read(),s=sector(),c=CFG[type],vals=d[s][c.key]||[];return sort(type==='product'?vals.filter(v=>!isDeleted(v)):vals)}
function measureFor(name){const d=read(),s=sector();return String((d[s].productMeasures||{})[name]||'')}
function setList(type,a){const d=read(),s=sector(),c=CFG[type];d[s][c.key]=sort(a);write(d)}
function saveProduct(name,measure,oldName){
  unmarkDeleted(name);
  const d=read(),s=sector(),sec=d[s];
  if(oldName&&oldName!==name){sec.products=sec.products.filter(x=>x!==oldName);delete sec.productMeasures[oldName]}
  if(!sec.products.some(x=>norm(x)===norm(name)))sec.products.push(name);
  sec.products=sort(sec.products);sec.productMeasures[name]=String(measure||'').trim();write(d)
}
function removeProduct(name){
  markDeleted(name);
  const d=read(),target=norm(name);
  SETORES.forEach(s=>{
    d[s].products=(d[s].products||[]).filter(x=>norm(x)!==target);
    Object.keys(d[s].productMeasures||{}).forEach(k=>{if(norm(k)===target)delete d[s].productMeasures[k]});
  });
  write(d);
  try{window.dispatchEvent(new CustomEvent('df-product-deleted',{detail:{name:String(name||'')}}))}catch(e){}
}
function syncMeasure(product){const el=document.getElementById('prMeasure');if(!el)return;const m=measureFor(product);if(m)el.value=m}
function nativeOptions(type,el){const vals=list(type),cur=String(el.value||'').trim();el.innerHTML='<option value="">Selecione</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(v)+'</option>').join('')}
function triggerText(type,el){const v=String(el.value||'').trim();return v||'Selecione'}
function updateTrigger(type){const el=document.getElementById(CFG[type].id),b=document.querySelector('[data-df-picker="'+type+'"]');if(el&&b){b.textContent=triggerText(type,el);b.classList.toggle('chosen',!!el.value)}}
function buildPicker(type,el){
  if(!el||el.dataset.dfPickerV2==='1')return;
  const c=CFG[type],cur=String(el.value||'').trim();
  if(el.tagName!=='SELECT'){
    const sel=document.createElement('select');sel.id=c.id;sel.value='';sel.dataset.dfPickerV2='1';el.replaceWith(sel);el=sel;if(cur)el.dataset.pendingValue=cur;
  }else el.dataset.dfPickerV2='1';
  nativeOptions(type,el);if(cur&&list(type).includes(cur))el.value=cur;
  el.classList.add('dfNativeHidden');
  const trig=document.createElement('button');trig.type='button';trig.className='dfPickerTrigger'+(el.value?' chosen':'');trig.dataset.dfPicker=type;trig.textContent=triggerText(type,el);trig.onclick=()=>openModal(type,'pick');el.insertAdjacentElement('afterend',trig);
  el.addEventListener('change',()=>{updateTrigger(type);if(type==='product')syncMeasure(el.value)});
  const box=trig.parentElement;if(box&&!box.dataset.dfRegBox){
    box.dataset.dfRegBox='1';const lab=[...box.children].find(x=>x.tagName==='LABEL');
    if(lab){const row=document.createElement('div');row.className='dfRegLabel';lab.before(row);row.appendChild(lab);const b=document.createElement('button');b.type='button';b.className='dfRegBtn';b.textContent='CADASTRAR / EDITAR';b.onclick=()=>openModal(type,'manage');row.appendChild(b)}
  }
}
function fixShift(){
  const el=document.getElementById('prShift');if(!el||el.dataset.dfShift123==='1')return;
  const old=String(el.value||'');let mapped=old;if(old==='00:00–07:00')mapped='1';else if(old==='07:00–15:30')mapped='2';else if(old==='15:30–00:00')mapped='3';
  el.dataset.dfShift123='1';el.innerHTML='<option value="">Selecione</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>';if(['1','2','3'].includes(mapped))el.value=mapped;
}
function refresh(){seedProducts();Object.keys(CFG).forEach(t=>buildPicker(t,document.getElementById(CFG[t].id)));fixShift()}
function refreshType(type,preferred){const el=document.getElementById(CFG[type].id);if(!el)return;nativeOptions(type,el);if(preferred&&list(type).includes(preferred))el.value=preferred;updateTrigger(type);if(type==='product'&&el.value)syncMeasure(el.value)}
function close(){document.getElementById('dfRegModal')?.remove()}
function choose(type,value){const el=document.getElementById(CFG[type].id);if(el){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))}close()}
function confirmDelete(v){return window.confirm('Excluir "'+v+'" do cadastro?')}
let editing=null;
function startEdit(type,name){editing={type,old:name};const m=document.getElementById('dfRegModal');if(!m)return;const nameEl=m.querySelector('#dfRegNew'),measureEl=m.querySelector('#dfRegMeasure'),save=m.querySelector('#dfRegSave');nameEl.value=name;if(type==='product'&&measureEl)measureEl.value=measureFor(name);save.textContent='SALVAR ALTERAÇÃO';nameEl.focus()}
function cancelEdit(){editing=null;const m=document.getElementById('dfRegModal');if(!m)return;m.querySelector('#dfRegNew').value='';const me=m.querySelector('#dfRegMeasure');if(me)me.value='';m.querySelector('#dfRegSave').textContent='CADASTRAR'}
function removeItem(type,name){
  if(!confirmDelete(name))return;
  if(type==='product')removeProduct(name);else setList(type,list(type).filter(x=>x!==name));
  const el=document.getElementById(CFG[type].id);if(el&&el.value===name){el.value='';el.dispatchEvent(new Event('change',{bubbles:true}))}
  render(type);refreshType(type)
}
function filterSearch(type){
  const m=document.getElementById('dfRegModal');if(!m)return;
  const search=m.querySelector('#dfRegSearch'),q=norm(search?.value||''),items=[...m.querySelectorAll('.dfRegItem')];
  let visible=0;
  items.forEach(item=>{
    const name=String(item.querySelector('[data-pick]')?.dataset.pick||''),measure=type==='product'?measureFor(name):'';
    const ok=!q||norm(name).includes(q)||(type==='product'&&norm(measure).includes(q));
    item.dataset.dfSearchMatch=ok?'1':'0';
    const machineOk=item.dataset.dfMachineMatch!=='0';
    item.style.display=(ok&&machineOk)?'':'none';
    if(ok&&machineOk)visible++;
  });
  let empty=m.querySelector('#dfRegSearchEmpty');
  if(q&&items.length&&visible===0){
    if(!empty){empty=document.createElement('div');empty.id='dfRegSearchEmpty';empty.className='dfRegEmpty';empty.textContent='Nenhum item encontrado.';m.querySelector('.dfRegList')?.appendChild(empty)}
  }else if(empty)empty.remove();
}
function render(type){
  const m=document.getElementById('dfRegModal');if(!m)return;const all=list(type),body=m.querySelector('.dfRegList'),selected=String(document.getElementById(CFG[type].id)?.value||'');
  body.innerHTML=all.length?all.map(v=>{
    const measure=type==='product'?measureFor(v):'';
    return '<div class="dfRegItem'+(v===selected?' selected':'')+'" data-df-search-match="1"><button type="button" class="dfRegPick" data-pick="'+esc(v)+'"><span class="check">'+(v===selected?'✓':'')+'</span><span class="main"><b>'+esc(v)+'</b>'+(measure?'<small>Medida: '+esc(measure)+'</small>':'')+'</span></button><div class="dfRegActions"><button type="button" class="edit" data-edit="'+esc(v)+'" aria-label="Editar">✎</button><button type="button" class="del" data-del="'+esc(v)+'" aria-label="Excluir">⌫</button></div></div>'
  }).join(''):'<div class="dfRegEmpty">Nenhum cadastro ainda.</div>';
  body.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>choose(type,b.dataset.pick));
  body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();startEdit(type,b.dataset.edit)});
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeItem(type,b.dataset.del)});
  const count=m.querySelector('.dfRegCount');if(count)count.textContent=all.length+' cadastrado'+(all.length===1?'':'s');
  filterSearch(type)
}
function saveFromModal(type){
  const m=document.getElementById('dfRegModal'),name=String(m.querySelector('#dfRegNew')?.value||'').trim(),measure=String(m.querySelector('#dfRegMeasure')?.value||'').trim();if(!name)return;
  const old=editing&&editing.type===type?editing.old:null;
  if(list(type).some(x=>norm(x)===norm(name)&&x!==old)){alert('Esse item já está cadastrado.');return}
  if(type==='product'){if(!measure){alert('Informe a medida do produto.');return}saveProduct(name,measure,old)}else{let a=list(type);if(old)a=a.filter(x=>x!==old);a.push(name);setList(type,a)}
  cancelEdit();refreshType(type,name);render(type)
}
function openModal(type,mode){
  close();editing=null;const c=CFG[type],m=document.createElement('div');m.id='dfRegModal';m.className='dfRegModal';
  const add=mode==='manage'?'<div class="dfRegAdd '+(type==='product'?'product':'')+'"><input id="dfRegNew" placeholder="'+esc(c.placeholder)+'">'+(type==='product'?'<input id="dfRegMeasure" placeholder="Medida. Ex.: 39 x 58">':'')+'<button id="dfRegSave" type="button">CADASTRAR</button></div>':'';
  m.innerHTML='<div class="dfRegPanel"><div class="dfRegHead"><div><small>'+esc(sector()).toUpperCase()+'</small><b>'+esc(c.title)+'</b></div><button type="button" class="dfRegX">×</button></div><div class="dfRegSearch"><span>⌕</span><input id="dfRegSearch" type="search" autocomplete="off" placeholder="'+esc(c.search)+'"></div><div class="dfRegMeta"><span>TODOS</span><small class="dfRegCount"></small></div>'+add+'<div class="dfRegList"></div></div>';
  document.body.appendChild(m);m.querySelector('.dfRegX').onclick=close;m.onclick=e=>{if(e.target===m)close()};const search=m.querySelector('#dfRegSearch');search.addEventListener('input',()=>filterSearch(type),{passive:true});
  const save=m.querySelector('#dfRegSave');if(save){save.onclick=()=>saveFromModal(type);m.querySelector('#dfRegNew').addEventListener('keydown',e=>{if(e.key==='Enter')save.click()});const me=m.querySelector('#dfRegMeasure');if(me)me.addEventListener('keydown',e=>{if(e.key==='Enter')save.click()})}
  render(type);setTimeout(()=>search.focus(),60)
}
function css(){if(document.getElementById('dfProdCadCssV2'))return;const s=document.createElement('style');s.id='dfProdCadCssV2';s.textContent=`
.dfNativeHidden{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;margin:0!important;padding:0!important;border:0!important}.dfPickerTrigger{width:100%;min-height:52px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:13px 42px 13px 12px;font-size:17px;text-align:left;position:relative}.dfPickerTrigger:after{content:'⌄';position:absolute;right:15px;top:50%;transform:translateY(-54%);font-size:22px;color:#94a3b8}.dfPickerTrigger.chosen{color:#fff}.dfRegLabel{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 6px}.dfRegLabel label{margin:0!important}.dfRegBtn{border:1px solid #475569;background:#111827;color:#cbd5e1;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:900}.dfRegModal{position:fixed;inset:0;z-index:2147483600;background:rgba(2,6,23,.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}.dfRegPanel{width:min(560px,100%);max-height:84vh;display:flex;flex-direction:column;background:#111827;border:1px solid #334155;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.58)}.dfRegHead{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px}.dfRegHead small{display:block;color:#f5a000;font-weight:900;font-size:10px}.dfRegHead b{display:block;font-size:20px;margin-top:3px}.dfRegX{width:42px;height:42px;border:1px solid #475569;background:#172033;color:#dbe5f4;border-radius:13px;font-size:27px}.dfRegSearch{display:flex;align-items:center;gap:9px;margin:2px 14px 10px;padding:0 13px;background:#0b1220;border:1px solid #475569;border-radius:14px}.dfRegSearch input{border:0!important;outline:0!important;background:transparent!important;padding:13px 0!important;margin:0!important;font-size:16px!important;color:#fff!important}.dfRegMeta{display:flex;align-items:center;justify-content:space-between;padding:0 16px 10px}.dfRegMeta span{display:inline-block;border:1px solid #d99a20;background:#211700;color:#ffd36a;border-radius:999px;padding:7px 14px;font-weight:900;font-size:12px}.dfRegMeta small{color:#94a3b8;font-weight:800}.dfRegAdd{display:grid;grid-template-columns:1fr auto;gap:7px;padding:10px 14px 12px;border-top:1px solid #263244;border-bottom:1px solid #263244}.dfRegAdd.product{grid-template-columns:minmax(0,1.6fr) minmax(110px,.7fr) auto}.dfRegAdd input{margin:0!important}.dfRegAdd button{border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:11px;padding:0 13px;font-weight:950}.dfRegList{overflow:auto;padding:0 14px 14px;-webkit-overflow-scrolling:touch}.dfRegItem{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;min-height:66px;border-bottom:1px solid #263244}.dfRegItem.selected{background:#13223a}.dfRegPick{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:5px;border:0;background:transparent;color:#f8fafc;text-align:left;padding:13px 6px;font-size:16px}.dfRegPick .check{color:#86efac;font-size:18px}.dfRegPick .main b{display:block;font-weight:600}.dfRegPick .main small{display:block;color:#94a3b8;font-size:13px;margin-top:4px}.dfRegActions{display:flex;gap:6px}.dfRegActions button{width:38px;height:38px;border-radius:10px;font-size:18px;font-weight:900}.dfRegActions .edit{border:1px solid #475569;background:#172033;color:#dbe5f4}.dfRegActions .del{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5}.dfRegEmpty{padding:28px;text-align:center;color:#94a3b8}@media(max-width:560px){.dfRegModal{align-items:flex-end;padding:0}.dfRegPanel{width:100%;max-height:89vh;border-radius:24px 24px 0 0;padding-bottom:max(8px,env(safe-area-inset-bottom))}.dfRegHead b{font-size:19px}.dfRegAdd.product{grid-template-columns:1fr 115px}.dfRegAdd.product button{grid-column:1/-1;min-height:42px}.dfRegPick{font-size:16px}}
`;document.head.appendChild(s)}
function start(){css();seedProducts();refresh();window.addEventListener('df-producao-cadastros-sincronizados',()=>{refresh();});const root=document.getElementById('dfPrRoot');if(root)new MutationObserver(()=>requestAnimationFrame(refresh)).observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-sector],[data-pane]'))setTimeout(refresh,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
