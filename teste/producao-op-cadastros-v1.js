(function(){
'use strict';
if(window.DFProducaoCadastrosV1)return;window.DFProducaoCadastrosV1=true;

const KEY='df_producao_cadastros_v1';
const SETORES=['Picote','Sacoleira','Blocadora'];
const CFG={
  machine:{id:'prMachine',label:'Máquina',key:'machines',title:'MÁQUINAS CADASTRADAS',placeholder:'Ex.: Picotadeira 01'},
  product:{id:'prProduct',label:'Produto',key:'products',title:'PRODUTOS CADASTRADOS',placeholder:'Ex.: Saco 50 x 70'},
  operator:{id:'prOperator',label:'Operador',key:'operators',title:'OPERADORES CADASTRADOS',placeholder:'Ex.: João'}
};
const $=s=>document.querySelector(s);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  const box=sel.parentElement;if(box&&!box.dataset.dfRegBox){box.dataset.dfRegBox='1';const lab=[...box.children].find(x=>x.tagName==='LABEL');if(lab){const row=document.createElement('div');row.className='dfRegLabel';lab.before(row);row.appendChild(lab);const b=document.createElement('button');b.type='button';b.className='dfRegBtn';b.textContent='CADASTRAR';b.onclick=()=>open(type);row.appendChild(b)}}
}
function fixShift(){
  const el=document.getElementById('prShift');if(!el||el.dataset.dfShift123==='1')return;
  const old=String(el.value||'');let mapped=old;if(old==='00:00–07:00')mapped='1';else if(old==='07:00–15:30')mapped='2';else if(old==='15:30–00:00')mapped='3';
  el.dataset.dfShift123='1';el.innerHTML='<option value="">Selecione</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>';if(['1','2','3'].includes(mapped))el.value=mapped;
}
function refresh(){Object.keys(CFG).forEach(t=>makeSelect(t,document.getElementById(CFG[t].id)));fixShift()}
function refreshSelect(type){const c=CFG[type],el=document.getElementById(c.id);if(!el)return;const cur=el.value,vals=list(type);el.innerHTML='<option value="">Selecione</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(v)+'</option>').join('')}
function close(){document.getElementById('dfRegModal')?.remove()}
function renderModal(type){
  const c=CFG[type],m=document.getElementById('dfRegModal');if(!m)return;const a=list(type),body=m.querySelector('.dfRegList');body.innerHTML=a.length?a.map((v,i)=>'<div class="dfRegItem"><span>'+esc(v)+'</span><button type="button" data-del="'+i+'">EXCLUIR</button></div>').join(''):'<div class="dfRegEmpty">Nenhum cadastro ainda.</div>';
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const x=list(type);x.splice(Number(b.dataset.del),1);setList(type,x);renderModal(type);refreshSelect(type)});
}
function open(type){
  close();const c=CFG[type],m=document.createElement('div');m.id='dfRegModal';m.className='dfRegModal';m.innerHTML='<div class="dfRegPanel"><div class="dfRegHead"><div><small>'+esc(sector()).toUpperCase()+'</small><b>'+c.title+'</b></div><button type="button" class="dfRegX">×</button></div><div class="dfRegAdd"><input id="dfRegNew" placeholder="'+esc(c.placeholder)+'"><button id="dfRegSave" type="button">SALVAR</button></div><div class="dfRegList"></div></div>';document.body.appendChild(m);m.querySelector('.dfRegX').onclick=close;m.onclick=e=>{if(e.target===m)close()};const input=m.querySelector('#dfRegNew');m.querySelector('#dfRegSave').onclick=()=>{const v=input.value.trim();if(!v)return;const a=list(type);if(!a.some(x=>x.toLowerCase()===v.toLowerCase())){a.push(v);setList(type,a)}input.value='';renderModal(type);refreshSelect(type)};input.addEventListener('keydown',e=>{if(e.key==='Enter')m.querySelector('#dfRegSave').click()});renderModal(type);setTimeout(()=>input.focus(),60)
}
function css(){if(document.getElementById('dfProdCadCss'))return;const s=document.createElement('style');s.id='dfProdCadCss';s.textContent=`
.dfRegLabel{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 6px}.dfRegLabel label{margin:0!important}.dfRegBtn{border:1px solid #475569;background:#111827;color:#cbd5e1;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900}.dfRegModal{position:fixed;inset:0;z-index:2147483600;background:rgba(2,6,23,.76);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px}.dfRegPanel{width:min(520px,100%);max-height:78vh;display:flex;flex-direction:column;background:#111827;border:1px solid #334155;border-radius:20px;overflow:hidden}.dfRegHead{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #263244}.dfRegHead small{display:block;color:#f5a000;font-weight:900;font-size:10px}.dfRegHead b{display:block;font-size:18px;margin-top:2px}.dfRegX{width:38px;height:38px;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:12px;font-size:24px}.dfRegAdd{display:grid;grid-template-columns:1fr auto;gap:7px;padding:12px;border-bottom:1px solid #263244}.dfRegAdd input{margin:0!important}.dfRegAdd button{border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:11px;padding:0 13px;font-weight:950}.dfRegList{overflow:auto;padding:8px 12px 14px}.dfRegItem{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 4px;border-bottom:1px solid #263244}.dfRegItem span{font-weight:750}.dfRegItem button{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900}.dfRegEmpty{padding:20px;text-align:center;color:#94a3b8}@media(max-width:560px){.dfRegModal{align-items:flex-end;padding:0}.dfRegPanel{width:100%;max-height:84vh;border-radius:22px 22px 0 0;padding-bottom:max(8px,env(safe-area-inset-bottom))}}
`;document.head.appendChild(s)}
function start(){css();refresh();const root=document.getElementById('dfPrRoot');if(root){new MutationObserver(()=>requestAnimationFrame(refresh)).observe(root,{childList:true,subtree:true})}document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-sector],[data-pane]'))setTimeout(refresh,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
