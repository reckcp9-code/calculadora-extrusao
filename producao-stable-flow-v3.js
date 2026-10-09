(function(){
'use strict';
if(window.DF_PRODUCAO_STABLE_FLOW_V3)return;window.DF_PRODUCAO_STABLE_FLOW_V3=true;

const KEY='df_producao_ops_setores_test_v3';
const QRKEY='df_op_qr_registry_test_setores_v3';
const FAVKEY='df_producao_ops_favoritas_v1';
const $=id=>document.getElementById(id);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}};
const saveOps=a=>{try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeId=()=>{const d=new Date(),p=x=>String(x).padStart(2,'0');return'DFOP-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()};
const rolls=()=>Array.from({length:56},(_,i)=>({n:i+1,peso:'',apara:''}));
const stops=()=>Array.from({length:8},()=>({code:'',start:'',end:'',minutes:0}));
let mode='all',query='',selectedId='',painting=false,observer=null,observerQueued=false;

function normalizeShift(v){v=String(v??'').trim();if(v==='00:00–07:00')return'1';if(v==='07:00–15:30')return'2';if(v==='15:30–00:00')return'3';return v}
function sameMachineShift(o,sector,machine,shift){return !!o&&o.sector===sector&&String(o.machine||'').trim().toLocaleLowerCase('pt-BR')===String(machine||'').trim().toLocaleLowerCase('pt-BR')&&normalizeShift(o.shift)===normalizeShift(shift)&&o.status==='open'}
function favs(){const a=read(FAVKEY,[]);return new Set(Array.isArray(a)?a:[])}
function saveFavs(s){try{localStorage.setItem(FAVKEY,JSON.stringify([...s]))}catch(e){}}
function allOps(){return read(KEY,[]).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))}
function searchText(o){return[o.machine,o.product,o.measure,o.operator,o.shift,o.id,o.sector].join(' ').toLocaleLowerCase('pt-BR')}
function registerQR(o){try{const r=read(QRKEY,{});r[o.id]={id:o.id,createdAt:o.createdAt,sector:o.sector,expected:{machine:o.machine,product:o.product,measure:o.measure,operator:o.operator,shift:o.shift,start:o.start,end:o.end},test:false};localStorage.setItem(QRKEY,JSON.stringify(r))}catch(e){}}

function notice(msg,type){let n=$('dfStableNotice');if(!n){n=document.createElement('div');n.id='dfStableNotice';n.style.cssText='margin-top:10px;padding:11px;border-radius:11px;font:800 12px system-ui';const b=$('prGenerate');if(b)b.insertAdjacentElement('afterend',n)}if(!n)return;n.textContent=msg;n.style.background=type==='ok'?'#0d2516':'#241600';n.style.color=type==='ok'?'#86efac':'#ffd36a';n.style.border='1px solid '+(type==='ok'?'#166534':'#a16207')}

function ensureStyle(){if($('dfSavedOpsV3Css'))return;const s=document.createElement('style');s.id='dfSavedOpsV3Css';s.textContent=`#dfSavedOps{margin:18px 0 0!important;padding:18px!important;border-radius:18px!important}#dfSavedOps h2{font-size:22px!important;margin:0 0 16px!important}.dfOpSearch{position:relative;margin-bottom:12px}.dfOpSearch input{width:100%;min-height:52px;padding:12px 14px 12px 44px!important;border:1px solid #334155!important;background:#0f172a!important;color:#fff!important;border-radius:14px!important;font-size:16px!important}.dfOpSearch:before{content:'⌕';position:absolute;left:16px;top:50%;transform:translateY(-50%);font:900 22px/1 system-ui;color:#cbd5e1;z-index:1}.dfOpFilters{display:flex;gap:10px;margin:4px 0 14px}.dfOpFilter{border:1.5px solid #3b4b63;background:#0f172a;color:#aebbd0;border-radius:999px;padding:9px 16px;font:900 12px system-ui}.dfOpFilter.on{border-color:#f5a000;background:#241600;color:#ffd36a}.dfOpList{border:1px solid #263244;background:#0f172a;border-radius:16px;overflow:hidden}.dfOpRow{position:relative;padding:15px 52px 14px 14px;border-bottom:1px solid #263244;cursor:pointer}.dfOpRow:last-child{border-bottom:0}.dfOpRow.sel{background:#121d31}.dfOpTitle{font-size:15px;font-weight:900;color:#e8edf5;line-height:1.25}.dfOpProduct{margin-top:4px;color:#aab6c9;font-size:13px;line-height:1.3}.dfOpMeta{margin-top:5px;color:#93a4bc;font-size:12px;line-height:1.35}.dfOpId{margin-top:4px;color:#7f91aa;font-size:10px;overflow-wrap:anywhere}.dfOpStar{position:absolute;right:9px;top:10px;width:40px;height:40px;border:0;background:transparent;color:#71829a;font:400 32px/1 system-ui;padding:0;display:flex;align-items:center;justify-content:center}.dfOpStar.on{color:#f5a000}.dfOpActions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:12px 0 0;margin-top:12px;border-top:1px solid #263244}.dfOpActions button{min-height:44px;min-width:0;padding:7px 2px;border:1px solid #334155;border-radius:11px;background:#111827;color:#eef2f7;font:900 9px/1.15 system-ui}.dfOpActions .danger{border-color:#991b1b;background:#230b0b;color:#fca5a5}.dfOpEmpty{padding:18px;color:#94a3b8;text-align:center;font-size:13px}`;document.head.appendChild(s)}

function actionHtml(o){return `<div class="dfOpActions"><button type="button" data-op-open="${esc(o.id)}">ABRIR</button><button type="button" data-op-pdf="${esc(o.id)}">PDF</button><button type="button" data-op-new="${esc(o.id)}">GERAR NOVA</button><button type="button" class="danger" data-op-del="${esc(o.id)}">EXCLUIR</button></div>`}
function savedRowsHtml(shown,fs){
  return shown.length?shown.map(o=>`<div class="dfOpRow ${o.id===selectedId?'sel':''}" data-op-row="${esc(o.id)}"><button type="button" class="dfOpStar ${fs.has(o.id)?'on':''}" data-op-star="${esc(o.id)}" aria-label="Favoritar">${fs.has(o.id)?'★':'☆'}</button><div class="dfOpTitle">${esc(o.machine)} — ${esc(o.measure)}</div><div class="dfOpProduct">${esc(o.product)}</div><div class="dfOpMeta">${esc(o.operator)} • Turno ${esc(normalizeShift(o.shift))} • ${o.status==='open'?'OP aberta':'Encerrada'}</div><div class="dfOpId">${esc(o.id)}</div>${o.id===selectedId?actionHtml(o):''}</div>`).join(''):'<div class="dfOpEmpty">Nenhuma OP encontrada.</div>'
}
function ensureSavedShell(box){
  if(box.dataset.dfSavedShell==='1')return;
  box.dataset.dfSavedShell='1';
  box.innerHTML='<h2>OPs salvas</h2><div class="dfOpSearch"><input id="dfOpSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="Pesquisar OP..."></div><div class="dfOpFilters"><button type="button" class="dfOpFilter" data-op-filter="all">Todas</button><button type="button" class="dfOpFilter" data-op-filter="fav">★ Favoritas</button></div><div class="dfOpList"></div>';
  const input=box.querySelector('#dfOpSearchInput');
  if(input)input.addEventListener('input',e=>{query=e.target.value;renderSaved()},{passive:true});
  box.addEventListener('click',e=>{
    const filter=e.target.closest&&e.target.closest('[data-op-filter]');
    if(filter){mode=filter.dataset.opFilter;selectedId='';renderSaved();return}
    const star=e.target.closest&&e.target.closest('[data-op-star]');
    if(star){e.preventDefault();e.stopPropagation();const s=favs(),id=star.dataset.opStar;s.has(id)?s.delete(id):s.add(id);saveFavs(s);renderSaved();return}
    if(e.target.closest&&e.target.closest('[data-op-open],[data-op-pdf],[data-op-new],[data-op-del]'))return;
    const row=e.target.closest&&e.target.closest('[data-op-row]');
    if(row){selectedId=selectedId===row.dataset.opRow?'':row.dataset.opRow;renderSaved()}
  });
}
function renderSaved(){if(painting)return;const root=$('dfPrRoot')||$('pgPr');if(!root)return;painting=true;try{
  ensureStyle();
  let box=$('dfSavedOps');if(!box){box=document.createElement('section');box.id='dfSavedOps';box.className='dfPrCard';root.appendChild(box)}
  ensureSavedShell(box);
  const all=allOps(),ids=new Set(all.map(o=>o.id)),fs=favs();let favDirty=false;
  [...fs].forEach(id=>{if(!ids.has(id)){fs.delete(id);favDirty=true}});if(favDirty)saveFavs(fs);
  if(selectedId&&!ids.has(selectedId))selectedId='';
  const q=query.trim().toLocaleLowerCase('pt-BR'),shown=all.filter(o=>(mode==='fav'?fs.has(o.id):true)&&(!q||searchText(o).includes(q)));
  box.dataset.dfSavedV3='1';
  const input=box.querySelector('#dfOpSearchInput');
  if(input&&document.activeElement!==input&&input.value!==query)input.value=query;
  box.querySelectorAll('[data-op-filter]').forEach(b=>b.classList.toggle('on',b.dataset.opFilter===mode));
  const list=box.querySelector('.dfOpList');if(list)list.innerHTML=savedRowsHtml(shown,fs);
}finally{painting=false}}
window.DFRenderSavedProductionOps=renderSaved;

function setField(id,value){const el=$(id);if(!el)return false;const v=String(value??'');if(el.tagName==='SELECT'&&v&&!Array.from(el.options).some(o=>String(o.value)===v)){const opt=document.createElement('option');opt.value=v;opt.textContent=v;el.appendChild(opt)}el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true}
function applyOpenedFields(o){setField('prMachine',o.machine);setField('prProduct',o.product);setField('prMeasure',o.measure);setField('prOperator',o.operator);setField('prShift',normalizeShift(o.shift));setField('prStart',o.start);setField('prEnd',o.end)}
function fillOpenedOP(o,attempt){attempt=attempt||0;const ids=['prMachine','prProduct','prMeasure','prOperator','prShift','prStart','prEnd'];if(!ids.every(id=>$(id))){if(attempt<24)setTimeout(()=>fillOpenedOP(o,attempt+1),100);return}applyOpenedFields(o);setTimeout(()=>applyOpenedFields(o),140);setTimeout(()=>applyOpenedFields(o),360);notice('OP aberta. Todos os campos foram preenchidos novamente.','ok');const body=$('dfPrBody');if(body)body.scrollIntoView({behavior:'smooth',block:'start'})}
function openIntoForm(o){const S=window.__DF_PROD_V3_STATE||(window.__DF_PROD_V3_STATE={sector:o.sector||'Picote',pane:'new',editing:null});S.sector=o.sector||S.sector||'Picote';S.pane='new';S.editing=null;const top=$('prodNewTab'),pane=document.querySelector('#dfPrRoot [data-pane="new"]');if(top)top.click();else if(pane)pane.click();setTimeout(()=>fillOpenedOP(o,0),60)}

function generateSafe(e){const b=e.target.closest&&e.target.closest('#prGenerate');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(b.dataset.busy==='1')return;b.dataset.busy='1';setTimeout(()=>delete b.dataset.busy,700);const S=window.__DF_PROD_V3_STATE||{},sector=S.sector||'Picote',machine=$('prMachine')?.value.trim()||'',product=$('prProduct')?.value.trim()||'',measure=$('prMeasure')?.value.trim()||'',operator=$('prOperator')?.value.trim()||'',shift=$('prShift')?.value||'',start=$('prStart')?.value||'',end=$('prEnd')?.value||'';if(!machine||!product||!measure||!operator||!shift||!start||!end){notice('Preencha máquina, produto, medida, operador, turno e período.');return}const a=read(KEY,[]),old=a.find(x=>sameMachineShift(x,sector,machine,shift));if(old){notice('Essa máquina já possui uma OP aberta no Turno '+normalizeShift(shift)+'. Use a OP atual ou encerre esse turno antes de gerar outra.');return}const o={id:makeId(),sector,machine,product,measure,operator,shift,start,end,createdAt:new Date().toISOString(),status:'open',rolls:rolls(),stops:stops(),test:false};a.push(o);if(!saveOps(a)){notice('Não foi possível salvar a OP neste aparelho.');return}registerQR(o);selectedId=o.id;mode='all';query='';notice('OP salva com sucesso. Esta máquina pode ter outra OP aberta em outro turno.','ok');renderSaved();setTimeout(()=>{const box=$('dfSavedOps');if(box)box.scrollIntoView({behavior:'smooth',block:'start'})},60)}

function createNewFrom(o){return{id:makeId(),sector:o.sector||'Picote',machine:o.machine||'',product:o.product||'',measure:o.measure||'',operator:o.operator||'',shift:o.shift||'',start:o.start||'',end:o.end||'',createdAt:new Date().toISOString(),status:'open',rolls:rolls(),stops:stops(),test:false}}
function handleActions(e){const el=e.target.closest&&e.target.closest('[data-op-open],[data-op-pdf],[data-op-new],[data-op-del]');if(!el)return;const id=el.dataset.opOpen||el.dataset.opPdf||el.dataset.opNew||el.dataset.opDel,a=read(KEY,[]),o=a.find(x=>x&&x.id===id);if(!o)return;if(el.dataset.opDel){e.preventDefault();e.stopPropagation();if(confirm('Excluir esta OP?')){saveOps(a.filter(x=>x.id!==id));if(selectedId===id)selectedId='';renderSaved()}return}if(el.dataset.opNew){e.preventDefault();e.stopPropagation();const n=createNewFrom(o);while(a.some(x=>x&&x.id===n.id))n.id=makeId();if(!confirm('Gerar uma nova OP com os mesmos dados de '+o.machine+' e '+o.operator+'? Ela terá ID e QR Code novos, sem copiar pesos e apontamentos.'))return;a.push(n);if(!saveOps(a)){alert('Não foi possível gerar a nova OP.');return}registerQR(n);selectedId=n.id;mode='all';query='';notice('Nova OP gerada com ID e QR Code diferentes.','ok');renderSaved();return}if(el.dataset.opPdf){e.preventDefault();e.stopPropagation();window.DF_PRODUCAO_OP_TEST?.print(o);return}if(el.dataset.opOpen){e.preventDefault();e.stopPropagation();openIntoForm(o)}}

function clearLegacyGeneratedPane(){const S=window.__DF_PROD_V3_STATE||{};if(S.pane!=='list')return;const body=$('dfPrBody');if(body&&body.childNodes.length)body.innerHTML=''}
function cleanLegacy(){clearLegacyGeneratedPane();const box=$('dfSavedOps');if(box&&box.dataset.dfSavedV3!=='1')renderSaved();document.querySelectorAll('[data-op-down]').forEach(el=>el.remove())}
function cleanAdded(node){if(!node||node.nodeType!==1)return;if(node.matches&&node.matches('[data-op-down]'))node.remove();else if(node.querySelectorAll)node.querySelectorAll('[data-op-down]').forEach(el=>el.remove())}
function queueObserverRefresh(){if(observerQueued||painting)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;if(painting)return;clearLegacyGeneratedPane();const box=$('dfSavedOps');if(box&&box.dataset.dfSavedV3!=='1')renderSaved()})}
function installObserver(){const root=$('dfPrRoot');if(!root||observer)return;observer=new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)cleanAdded(n);queueObserverRefresh()});observer.observe(root,{childList:true,subtree:true})}
function boot(attempt){attempt=attempt||0;if($('dfPrRoot')){renderSaved();cleanLegacy();installObserver();return}if(attempt<40)setTimeout(()=>boot(attempt+1),150)}

document.addEventListener('click',generateSafe,true);
document.addEventListener('click',handleActions,true);
boot(0);
window.addEventListener('pageshow',()=>{setTimeout(()=>{renderSaved();cleanLegacy();installObserver()},80)},true);
window.addEventListener('focus',()=>setTimeout(cleanLegacy,80),true);
})();
