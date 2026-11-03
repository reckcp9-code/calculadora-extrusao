(function(){
'use strict';
if(window.DFMonthlyPhotoEditorV1)return;
window.DFMonthlyPhotoEditorV1=true;

const OPS='df_formula_ops_auto_v2',MONTH_KEY='df_production_history_month_v1';
const TOMB_KEY='df_deleted_ops_v1',SNAP_PREFIX='df_monthly_ready_photos_v2:';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=o=>String(o?.id||o?.qr||'').trim().toUpperCase();
const validMonth=s=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(s||''));
const currentMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const month=o=>String(o?.data||o?.localDate||o?.manualConfirmedAt||o?.completedAt||o?.baixadoEm||o?.createdAt||o?.updatedAt||'').slice(0,7);
const name=o=>String(o?.serverProductName||o?.manualProductName||o?.clienteFormulacao||o?.nomeProduto||o?.produto||o?.title||'PRODUTO NÃO INFORMADO').trim();
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function teamId(){try{return String(window.DFOpCloud?.team?.()?.teamId||load('df_op_team_v1',null)?.teamId||'')}catch(e){return ''}}
function selectedMonth(){const m=String($('dfOpMonth')?.value||'').slice(0,7);if(validMonth(m))return m;const s=String(localStorage.getItem(MONTH_KEY)||'').slice(0,7);return validMonth(s)?s:currentMonth()}
function tombstones(){return load(TOMB_KEY,{})||{}}
function rowsFor(m){
 const deleted=tombstones(),items=load(OPS,[]);
 return (Array.isArray(items)?items:[]).filter(o=>o?.status==='ok'&&o?.d1State!=='pending'&&code(o)&&month(o)===m&&!o?.deletedAt&&!deleted[code(o)])
 .sort((a,b)=>String(b.manualConfirmedAt||b.completedAt||b.data||b.createdAt||'').localeCompare(String(a.manualConfirmedAt||a.completedAt||a.data||a.createdAt||''))||code(b).localeCompare(code(a)));
}
function snapshotKey(m){return SNAP_PREFIX+(teamId()||'sem-equipe')+':'+m}
function readSnapshot(m){
 const data=load(snapshotKey(m),null),deleted=tombstones();
 return Array.isArray(data?.rows)?data.rows.filter(o=>o&&o.status==='ok'&&code(o)&&!deleted[code(o)]):[];
}
function putSnapshot(m,rows){
 if(!rows.length||!teamId())return;
 save(snapshotKey(m),{savedAt:new Date().toISOString(),rows:rows.slice(0,1000).map(o=>({
 id:code(o),qr:code(o),status:'ok',data:String(o.data||o.localDate||month(o)+'-01'),createdAt:String(o.createdAt||''),
 manualConfirmedAt:String(o.manualConfirmedAt||o.completedAt||''),produto:name(o),
 produzido:Number(o.produzido||0),apara:Number(o.apara||0),cloudPhotoId:String(o.cloudPhotoId||'')
 }))});
}
let active=null,busy=false,pendingMonth='',timer=0,lastSig='',confirmedEmpty=new Set();
function render(){
 if(!active||!document.contains(active.pane))return;
 const {pane,m,search,host,status}=active,selected=selectedMonth();
 if(m.value!==selected)m.value=selected;
 const q=search.value.trim().toUpperCase(),key=snapshotKey(selected);
 const local=rowsFor(selected);if(local.length){putSnapshot(selected,local);confirmedEmpty.delete(key)}
 const usingCopy=!local.length&&!confirmedEmpty.has(key);
 const source=local.length?local:(usingCopy?readSnapshot(selected):[]);
 const rows=source.filter(o=>!q||code(o).includes(q)||name(o).toUpperCase().includes(q));
 const label=new Date(Number(selected.slice(0,4)),Number(selected.slice(5,7))-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 status.textContent=busy?'🔄 Conferindo OPs e fotos na nuvem...':usingCopy&&source.length?'☁️ Mostrando última lista salva enquanto confirma a sincronização.':source.length?'✅ Fotos das OPs prontas • '+label:'📅 '+label+' • '+(navigator.onLine===false?'Sem conexão; nenhum registro salvo neste aparelho.':'Nenhuma OP pronta carregada para este mês.');
 const sig=selected+'|'+q+'|'+rows.map(o=>[code(o),name(o),o.produzido,o.apara,o.cloudPhotoId].join(':')).join(';');
 if(sig===lastSig&&host.dataset.dfPhotoRendered==='1')return;
 lastSig=sig;host.dataset.dfPhotoRendered='1';
 const fragment=document.createDocumentFragment();
 if(!rows.length){const msg=document.createElement('div');msg.className='dfOpsTiny';msg.style.margin='16px 0';msg.textContent=busy?'Carregando as OPs do D1. A lista anterior não será apagada.':'Não há fotos de OPs prontas para este período. Selecione outro mês acima.';fragment.appendChild(msg)}
 rows.forEach(o=>{
  const row=document.createElement('div');row.className='dfMonthlyRow';
  row.innerHTML='<strong>'+esc(name(o))+'</strong><div style="font-size:12px;color:#94a3b8;overflow-wrap:anywhere">'+esc(code(o))+'</div><div>Produção: '+esc(o.produzido||0)+' kg • Apara: '+esc(o.apara||0)+' kg</div><button type="button">📸 ABRIR FOTO DA NUVEM</button><button type="button" class="dfMonthlyEditOp">✏️ EDITAR OP</button>';
  row.querySelector('button').onclick=async()=>{
   const btn=row.querySelector('button');btn.disabled=true;
   try{if(window.DFOpCloud?.viewPhotoByOp){await window.DFOpCloud.viewPhotoByOp(code(o));return}
    if(typeof window.DFOpenStoredOpPhoto==='function'){await window.DFOpenStoredOpPhoto(code(o));return}
    alert('Visualizador indisponível. Verifique a conexão.')}
   catch(e){alert('Não consegui abrir a foto da nuvem: '+String(e?.message||e))}
   finally{btn.disabled=false}
  };
  row.querySelector('.dfMonthlyEditOp').onclick=async()=>{
   if(typeof window.DFOpenStoredOpPhoto==='function'){await window.DFOpenStoredOpPhoto(code(o));if($('dfOpModal')?.classList.contains('on'))window.DFOpReadyEditMount?.(code(o))}
   else alert('Editor de OP indisponível.');
  };
  fragment.appendChild(row);
 });
 host.replaceChildren(fragment);
}
async function refreshRemote(force){
 if(!active||document.hidden||navigator.onLine===false){render();return false}
 const m=selectedMonth();
 if(busy){pendingMonth=m;return false}
 busy=true;render();let serverOk=false;
 try{
  if(window.DFOpServerAuthority?.sync)serverOk=(await window.DFOpServerAuthority.sync(true,m))===true;
  if(serverOk){
   const k=snapshotKey(m);
   if(!rowsFor(m).length){confirmedEmpty.add(k);try{localStorage.removeItem(k)}catch(e){}}
   else confirmedEmpty.delete(k);
  }
  if(window.DFOpCloud?.syncMonth)try{await window.DFOpCloud.syncMonth(m)}catch(e){}
 }catch(e){console.warn('[DF fotos] Falha ao sincronizar, mantendo lista local:',e)}
 finally{
  busy=false;lastSig='';render();
  if(pendingMonth){const next=pendingMonth;pendingMonth='';if(next!==m)setTimeout(()=>refreshRemote(true),100)}
 }
 return serverOk;
}
function openPhotos(){
 if(!mount())return false;
 const {b,pane,tabs}=active;
 tabs.querySelectorAll('[data-pane]').forEach(x=>x.classList.remove('on'));
 tabs.parentElement.querySelectorAll('.dfOpsPane').forEach(x=>x.classList.remove('on'));
 b.classList.add('on');pane.classList.add('on');b.removeAttribute('aria-busy');b.textContent='📸 FOTOS';
 lastSig='';render();refreshRemote(true);return true;
}
function mount(){
 const tabs=document.querySelector('.dfOpsTabs'),monthBtn=tabs?.querySelector('[data-pane="month"]');
 if(!tabs||!monthBtn)return false;
 let b=$('dfMonthlyPhotoButton');
 if(!b){b=document.createElement('button');b.id='dfMonthlyPhotoButton';b.type='button';b.textContent='📸 FOTOS';monthBtn.insertAdjacentElement('afterend',b)}
 else if(b.parentElement!==tabs)monthBtn.insertAdjacentElement('afterend',b);
 let pane=$('dfMonthlyPhotoPane');
 if(pane?.dataset.dfPhotoBound==='1'&&active?.pane===pane)return true;
 if(!pane){pane=document.createElement('section');pane.id='dfMonthlyPhotoPane';pane.className='dfOpsPane';tabs.parentElement.appendChild(pane)}
 pane.dataset.dfPhotoBound='1';
 pane.innerHTML='<div class="dfOpsCard"><h3>📸 FOTOS • OPs BAIXADAS</h3><label for="dfMonthlyPhotoMonth">MÊS DAS FOTOS</label><input type="month" id="dfMonthlyPhotoMonth" style="width:100%;min-height:46px"><input id="dfMonthlyPhotoSearch" placeholder="PESQUISAR PRODUTO OU ID DA OP" style="width:100%;min-height:46px;margin-top:10px"><button id="dfMonthlyPhotoRefresh" class="dfOpsBtn alt" style="margin-top:10px">🔄 SINCRONIZAR FOTOS</button><div id="dfMonthlyPhotoStatus" class="dfOpsTiny" style="margin:12px 0;color:#a8c9ed"></div><div id="dfMonthlyPhotoRows" style="margin-top:12px"></div></div>';
 if(!$('dfMonthlyPhotoEditorCss')){const css=document.createElement('style');css.id='dfMonthlyPhotoEditorCss';css.textContent='#dfMonthlyPhotoPane{display:none}#dfMonthlyPhotoPane.on{display:block}#dfMonthlyPhotoPane .dfMonthlyRow{padding:12px;border:1px solid #334155;border-radius:12px;margin:8px 0;background:#101a2d}#dfMonthlyPhotoPane .dfMonthlyRow button{margin-top:9px;width:100%;min-height:42px;border:1px solid #f5a000;background:#231900;color:#ffd36a;border-radius:10px;font-weight:800}#dfMonthlyPhotoPane input{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:12px;color:#fff;font-size:16px}';document.head.appendChild(css)}
 const m=pane.querySelector('#dfMonthlyPhotoMonth'),search=pane.querySelector('#dfMonthlyPhotoSearch'),host=pane.querySelector('#dfMonthlyPhotoRows'),status=pane.querySelector('#dfMonthlyPhotoStatus');
 active={b,pane,m,search,host,status,tabs};lastSig='';
 m.value=selectedMonth();
 b.onclick=openPhotos;
 tabs.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane]')){b.classList.remove('on');pane.classList.remove('on')}},true);
 m.onchange=()=>{
  if(!validMonth(m.value))return;
  localStorage.setItem(MONTH_KEY,m.value);
  const global=$('dfOpMonth');if(global&&global.value!==m.value){global.value=m.value;global.dispatchEvent(new Event('change',{bubbles:true}))}
  window.dispatchEvent(new CustomEvent('df-production-month-changed',{detail:{month:m.value}}));
  lastSig='';render();refreshRemote(true);
 };
 search.oninput=()=>{lastSig='';render()};
 pane.querySelector('#dfMonthlyPhotoRefresh').onclick=()=>refreshRemote(true);
 window.DFMonthlyPhotoEditorOpen=openPhotos;
 if(b.dataset.dfRequested==='1'){delete b.dataset.dfRequested;setTimeout(openPhotos,0)}
 render();return true;
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(()=>{if(mount())render()},ms==null?100:ms)}
function boot(){
 schedule(50);setTimeout(()=>mount(),500);setTimeout(()=>mount(),1200);
 window.addEventListener('df-op-d1-applied',()=>schedule(80));
 window.addEventListener('df-op-team-sync-result',()=>schedule(100));
 window.addEventListener('df-op-remote-merged',()=>schedule(100));
 window.addEventListener('df-prontas-products-synced',()=>schedule(100));
 window.addEventListener('df-op-record-deleted',()=>schedule(120));
 window.addEventListener('df-op-saved',()=>schedule(100));
 window.addEventListener('df-production-month-changed',()=>{lastSig='';schedule(90)});
 window.addEventListener('df-ui-ready',()=>schedule(130));
 window.addEventListener('online',()=>{schedule(100);if(active?.pane.classList.contains('on'))setTimeout(()=>refreshRemote(true),350)});
 window.addEventListener('pageshow',()=>{schedule(120);if(active?.pane.classList.contains('on'))setTimeout(()=>refreshRemote(true),500)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){schedule(150);if(active?.pane.classList.contains('on'))setTimeout(()=>refreshRemote(true),450)}});
 document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth'){lastSig='';schedule(90)}},true);
 // Se outra rotina reconstruir as abas, reinstalar somente o componente FOTOS.
 setInterval(()=>{if(document.hidden)return;if(!active||!document.contains(active.b)||!document.contains(active.pane))mount()},2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
