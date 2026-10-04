(function(){
'use strict';
if(window.DF_PRODUCAO_GERAR_NOVA_V1)return;window.DF_PRODUCAO_GERAR_NOVA_V1=true;
const KEY='df_producao_ops_setores_test_v3',QRKEY='df_op_qr_registry_test_setores_v3';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}};
const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}};
const makeId=()=>{const d=new Date(),p=x=>String(x).padStart(2,'0');return'DFOP-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()};
const rolls=()=>Array.from({length:56},(_,i)=>({n:i+1,peso:'',apara:''}));
const stops=()=>Array.from({length:8},()=>({code:'',start:'',end:'',minutes:0}));
function renameButtons(){document.querySelectorAll('[data-op-copy]').forEach(b=>{if((b.textContent||'').trim().toUpperCase()!=='GERAR NOVA')b.textContent='GERAR NOVA'})}
function registerQR(o){try{const r=read(QRKEY,{});r[o.id]={id:o.id,createdAt:o.createdAt,sector:o.sector,expected:{machine:o.machine,product:o.product,measure:o.measure,operator:o.operator,shift:o.shift,start:o.start,end:o.end},test:false};localStorage.setItem(QRKEY,JSON.stringify(r))}catch(e){}}
function createNewFrom(o){const now=new Date().toISOString();return{id:makeId(),sector:o.sector||'Picote',machine:o.machine||'',product:o.product||'',measure:o.measure||'',operator:o.operator||'',shift:o.shift||'',start:o.start||'',end:o.end||'',createdAt:now,status:'open',rolls:rolls(),stops:stops(),test:false}}
function onClick(e){const b=e.target.closest&&e.target.closest('[data-op-copy]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const a=read(KEY,[]),o=a.find(x=>x&&x.id===b.dataset.opCopy);if(!o)return;const n=createNewFrom(o);a.push(n);if(!save(a)){alert('Não foi possível gerar a nova OP.');return}registerQR(n);if(window.DFRenderSavedProductionOps)window.DFRenderSavedProductionOps();setTimeout(()=>{const s=document.getElementById('dfSavedSelect');if(s){s.value=n.id;s.dispatchEvent(new Event('change'))}renameButtons()},30)}
document.addEventListener('click',onClick,true);
renameButtons();new MutationObserver(renameButtons).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',renameButtons,true);
})();
