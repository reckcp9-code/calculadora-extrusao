(function(){
'use strict';
if(window.DFProducaoCadastrosV1)return;window.DFProducaoCadastrosV1=true;

const KEY='df_producao_cadastros_v1';
const SETORES=['Picote','Sacoleira','Blocadora'];
const CFG={
  machine:{id:'prMachine',label:'Máquina',key:'machines',title:'MÁQUINAS CADASTRADAS',placeholder:'Ex.: Picotadeira 01',search:'Pesquisar máquina...'},
  product:{id:'prProduct',label:'Produto',key:'products',title:'PRODUTOS CADASTRADOS',placeholder:'Ex.: Saco 50 x 70',search:'Pesquisar produto...'},
  operator:{id:'prOperator',label:'Operador',key:'operators',title:'OPERADORES CADASTRADOS',placeholder:'Ex.: João',search:'Pesquisar operador...'}
};
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function empty(){return{Picote:{machines:[],products:[],operators:[]},Sacoleira:{machines:[],products:[],operators:[]},Blocadora:{machines:[],products:[],operators:[]}}}
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&typeof x==='object'?Object.assign(empty(),x):empty()}catch(e){return empty()}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
function sector(){const s=window.__DF_PROD_V3_STATE&&window.__DF_PROD_V3_STATE.sector;return SETORES.includes(s)?s:'Picote'}
function list(type){const c=CFG[type],d=read(),s=sector();d[s]=d[s]||{machines:[],products:[],operators:[]};return Array.isArray(d[s][c.key])?d[s][c.key]:[]}
function setList(type,a){const c=CFG[type],d=read(),s=sector();d[s]=d[s]||{machines:[],products:[],operators:[]};d[s][c.key]=[...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));write(d)}
function legacyOptions(el){const id=el&&el.getAttribute&&el.getAttribute('list');if(!id)return[];const dl=document.getElementById(id);return dl?[...dl.querySelectorAll('option')].map(o=>o.value).filter(Boolean):[]}
function optionsFor(type,el){return[...new Set([...list(type),...legacyOptions(el)])].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}))}
function makeSelect(type,el){
  if(!el||el.tagName==='SELECT'&&el.dataset.dfRegistry==='1')return;
  const c=CFG[type],current=String(el.value||'').trim(),vals=optionsFor(type,el),sel=document.createElement('select');
  sel.id=c.id;sel.dataset.dfRegistry='1';sel.innerHTML='<option value="">Selecione</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(v===current?' selected':'')+'>'+esc(v)+'</option>').join('');
  el.replaceWith(sel);
  const box=sel.parentElement;if(box&&!box.dataset.dfRegBox){box.dataset.dfRegBox='1';const lab=[...box.children].find(x=>x.tagName==='LABEL');if(lab){const row=document.createElement('div');row.className='dfRegLabel';lab.before(row);row.appendChild(lab);const b=document.createElement('button');b.type='button';b.className='dfRegBtn';b.textContent='CADASTRAR / EDITAR';b.onclick=()=>open(type);row.appendChild(b)}}
}
function fixShift(){
  const el=document.getElementById('prShift');if(!el||el.dataset.dfShift123==='1')return;
  const old=String(el.value||'');let mapped=old;if(old==='00:00–07:00')mapped='1';else if(old==='07:00–15:30')mapped='2';else if(old==='15:30–00:00')mapped='3';
  el.dataset.dfShift123='1';el.innerHTML='<option value="">Selecione</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>';if(['1','2','3'].includes(mapped))el.value=mapped;
}
function refresh(){Object.keys(CFG).forEach(t=>makeSelect(t,document.getElementById(CFG[t].id)));fixShift()}
function refreshSelect(type,preferred){const c=CFG[type],el=document.getElementById(c.id);if(!el)return;const cur=preferred!==undefined?preferred:el.value,vals=list(type);el.innerHTML='<option value="">Selecione</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(v)+'</option>').join('');if(cur&&!vals.includes(cur))el.value=''}
function close(){document.getElementById('dfRegModal')?.remove()}
function confirmDelete(v){return window.confirm('Excluir "'+v+'" do cadastro?')}
function editItem(type,old){
  const novo=window.prompt('Editar cadastro:',old);if(novo===null)return;const v=novo.trim();if(!v||v===old)return;
  const a=list(type),exists=a.some(x=>norm(x)===norm(v)&&x!==old);if(exists){alert('Já existe um cadastro com esse nome.');return}
  const i=a.indexOf(old);if(i>=0)a[i]=v;setList(type,a);refreshSelect(type,v);renderModal(type);
}
function deleteItem(type,v){
  if(!confirmDelete(v))return;const a=list(type).filter(x=>x!==v);setList(type,a);const el=document.getElementById(CFG[type].id);const wasSelected=el&&el.value===v;refreshSelect(type,wasSelected?'':undefined);renderModal(type)
}
function renderModal(type){
  const c=CFG[type],m=document.getElementById('dfRegModal');if(!m)return;const q=norm(m.querySelector('#dfRegSearch')?.value||''),all=list(type),a=all.filter(v=>!q||norm(v).includes(q)),body=m.querySelector('.dfRegList');
  body.innerHTML=a.length?a.map(v=>'<div class="dfRegItem"><button type="button" class="dfRegPick" data-pick="'+esc(v)+'"><span>'+esc(v)+'</span></button><div class="dfRegActions"><button type="button" class="edit" data-edit="'+esc(v)+'" aria-label="Editar">✎</button><button type="button" class="del" data-del="'+esc(v)+'" aria-label="Excluir">⌫</button></div></div>').join(''):'<div class="dfRegEmpty">'+(q?'Nenhum item encontrado.':'Nenhum cadastro ainda.')+'</div>';
  body.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const el=document.getElementById(c.id);if(el){el.value=b.dataset.pick;el.dispatchEvent(new Event('change',{bubbles:true}))}close()});
  body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();editItem(type,b.dataset.edit)});
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteItem(type,b.dataset.del)});
  const count=m.querySelector('.dfRegCount');if(count)count.textContent=all.length+' cadastrado'+(all.length===1?'':'s');
}
function open(type){
  close();const c=CFG[type],m=document.createElement('div');m.id='dfRegModal';m.className='dfRegModal';m.innerHTML='<div class="dfRegPanel"><div class="dfRegHead"><div><small>'+esc(sector()).toUpperCase()+'</small><b>'+c.title+'</b></div><button type="button" class="dfRegX">×</button></div><div class="dfRegSearch"><span>⌕</span><input id="dfRegSearch" type="search" inputmode="search" autocomplete="off" placeholder="'+esc(c.search)+'"></div><div class="dfRegMeta"><span>TODOS</span><small class="dfRegCount"></small></div><div class="dfRegAdd"><input id="dfRegNew" placeholder="'+esc(c.placeholder)+'"><button id="dfRegSave" type="button">CADASTRAR</button></div><div class="dfRegList"></div></div>';document.body.appendChild(m);
  m.querySelector('.dfRegX').onclick=close;m.onclick=e=>{if(e.target===m)close()};const input=m.querySelector('#dfRegNew'),search=m.querySelector('#dfRegSearch');
  m.querySelector('#dfRegSave').onclick=()=>{const v=input.value.trim();if(!v)return;const a=list(type);if(a.some(x=>norm(x)===norm(v))){alert('Esse item já está cadastrado.');return}a.push(v);setList(type,a);input.value='';search.value='';renderModal(type);refreshSelect(type,v)};
  input.addEventListener('keydown',e=>{if(e.key==='Enter')m.querySelector('#dfRegSave').click()});search.addEventListener('input',()=>renderModal(type));renderModal(type);setTimeout(()=>search.focus(),60)
}
function css(){if(document.getElementById('dfProdCadCss'))return;const s=document.createElement('style');s.id='dfProdCadCss';s.textContent=`
.dfRegLabel{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 6px}.dfRegLabel label{margin:0!important}.dfRegBtn{border:1px solid #475569;background:#111827;color:#cbd5e1;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:900}.dfRegModal{position:fixed;inset:0;z-index:2147483600;background:rgba(2,6,23,.76);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}.dfRegPanel{width:min(560px,100%);max-height:82vh;display:flex;flex-direction:column;background:#111827;border:1px solid #334155;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55)}.dfRegHead{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px}.dfRegHead small{display:block;color:#f5a000;font-weight:900;font-size:10px}.dfRegHead b{display:block;font-size:20px;margin-top:3px}.dfRegX{width:42px;height:42px;border:1px solid #475569;background:#172033;color:#dbe5f4;border-radius:13px;font-size:27px}.dfRegSearch{display:flex;align-items:center;gap:9px;margin:2px 14px 10px;padding:0 13px;background:#0b1220;border:1px solid #475569;border-radius:14px}.dfRegSearch span{font-size:19px}.dfRegSearch input{border:0!important;outline:0!important;background:transparent!important;padding:13px 0!important;margin:0!important;font-size:16px!important;color:#fff!important}.dfRegMeta{display:flex;align-items:center;justify-content:space-between;padding:0 16px 10px}.dfRegMeta span{display:inline-block;border:1px solid #d99a20;background:#211700;color:#ffd36a;border-radius:999px;padding:7px 14px;font-weight:900;font-size:12px}.dfRegMeta small{color:#94a3b8;font-weight:800}.dfRegAdd{display:grid;grid-template-columns:1fr auto;gap:7px;padding:10px 14px 12px;border-top:1px solid #263244;border-bottom:1px solid #263244}.dfRegAdd input{margin:0!important}.dfRegAdd button{border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:11px;padding:0 13px;font-weight:950}.dfRegList{overflow:auto;padding:0 14px 14px;-webkit-overflow-scrolling:touch}.dfRegItem{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;min-height:64px;border-bottom:1px solid #263244}.dfRegPick{border:0;background:transparent;color:#f8fafc;text-align:left;padding:15px 6px;font-size:17px}.dfRegPick span{font-weight:500}.dfRegActions{display:flex;gap:6px}.dfRegActions button{width:38px;height:38px;border-radius:10px;font-size:18px;font-weight:900}.dfRegActions .edit{border:1px solid #475569;background:#172033;color:#dbe5f4}.dfRegActions .del{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5}.dfRegEmpty{padding:28px;text-align:center;color:#94a3b8}@media(max-width:560px){.dfRegModal{align-items:flex-end;padding:0}.dfRegPanel{width:100%;max-height:88vh;border-radius:24px 24px 0 0;padding-bottom:max(8px,env(safe-area-inset-bottom))}.dfRegHead b{font-size:19px}.dfRegPick{font-size:17px}}
`;document.head.appendChild(s)}
function start(){css();refresh();const root=document.getElementById('dfPrRoot');if(root){new MutationObserver(()=>requestAnimationFrame(refresh)).observe(root,{childList:true,subtree:true})}document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-sector],[data-pane]'))setTimeout(refresh,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
