(function(){
'use strict';
if(window.DFProductionMonthlyReadyV1)return;
window.DFProductionMonthlyReadyV1=true;
const STORE='df_formula_ops_auto_v2',KEY='df_production_history_month_v1';
let running=false,timer=0,boxObserver=null,boxRef=null;
const $=id=>document.getElementById(id);
const current=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
function selected(){const now=current();const anchor=localStorage.getItem(KEY+'_calendar');if(anchor!==now){localStorage.setItem(KEY+'_calendar',now);localStorage.setItem(KEY,now);window.dispatchEvent(new CustomEvent('df-production-month-changed',{detail:{month:now}}))}const v=String(localStorage.getItem(KEY)||'');return /^\d{4}-(0[1-9]|1[0-2])$/.test(v)?v:now}
function records(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function id(o){return String(o?.id||o?.qr||'').trim().toUpperCase()}
function month(o){const d=[o?.manualConfirmedAt,o?.completedAt,o?.confirmedAt,o?.baixaAt,o?.finalizedAt,o?.dataBaixa,o?.data,o?.createdAt,o?.updatedAt].find(v=>/^\d{4}-\d{2}/.test(String(v||'')));if(d)return String(d).slice(0,7);const m=id(o).match(/^DFOP-(\d{4})(\d{2})/);return m?m[1]+'-'+m[2]:''}
function panel(){return $('dfOkList')}
function ensurePicker(){const list=panel();if(!list)return null;let wrap=$('dfProductionMonthPicker');if(!wrap){wrap=document.createElement('div');wrap.id='dfProductionMonthPicker';wrap.style.cssText='padding:12px 14px;margin:10px 0 14px;background:#101a2d;border:1px solid #334155;border-radius:14px;color:#e2e8f0;font-weight:700';const label=document.createElement('label');label.textContent='📅 MÊS DAS OPs PRONTAS E FOTOS';label.htmlFor='dfProductionMonthInput';label.style.cssText='display:block;margin-bottom:8px';const input=document.createElement('input');input.type='month';input.id='dfProductionMonthInput';input.style.cssText='width:100%;padding:11px;border:1px solid #4b6387;border-radius:10px;background:#0b1220;color:#f8fafc;font-size:16px';input.addEventListener('change',()=>{if(!/^\d{4}-\d{2}$/.test(input.value))return;localStorage.setItem(KEY,input.value);window.dispatchEvent(new CustomEvent('df-production-month-changed',{detail:{month:input.value}}));const global=$('dfOpMonth');if(global&&global.value!==input.value){global.value=input.value;global.dispatchEvent(new Event('change',{bubbles:true}))}schedule();window.DFOpCloud?.syncMonth?.(input.value);window.DFOpServerAuthority?.sync?.(true,input.value)});wrap.append(label,input);list.parentElement.insertBefore(wrap,list)}const input=$('dfProductionMonthInput');if(input&&input.value!==selected())input.value=selected();return wrap}
function apply(){if(running)return;running=true;try{
const list=panel();if(!list){return;}ensurePicker();const all=records(),byId=new Map();
for(const r of all){if(id(r)&&r.status==='ok')byId.set(id(r),r)}
const chosen=selected();let shown=0;
for(const row of Array.from(list.children)){
  const trigger=row.querySelector?.('[data-view]');let code=String(trigger?.getAttribute('data-view')||row.getAttribute('data-op-id')||'').trim().toUpperCase();
  if(!code){const match=(row.textContent||'').match(/DFOP-\d{8}-\d{6}-[A-Z0-9]+/i);if(match)code=match[0].toUpperCase()}
  const rec=byId.get(code);
  const stamp=rec?month(rec):'';
  const idStamp=(code.match(/^DFOP-(\d{4})(\d{2})/)||[]).slice(1).join('-');
  // Never carry an unidentifiable old OP into a new month's visible list.
  const visible=!!(stamp||idStamp)&&(stamp||idStamp)===chosen;
  row.hidden=!visible;
  row.style.setProperty('display',visible?'':'none',visible?'':'important');
  if(visible)shown++;
}
let empty=$('dfProductionMonthEmpty');if(!empty){empty=document.createElement('div');empty.id='dfProductionMonthEmpty';empty.style.cssText='padding:24px 12px;text-align:center;color:#a7b7cf;font-weight:700';list.insertAdjacentElement('afterend',empty)}
empty.textContent=shown?'':'Nenhuma OP pronta neste mês. Selecione um mês anterior para consultar o histórico.';
empty.style.display=shown?'none':'block';
}catch(e){console.warn('[DF mês Produção]',e)}finally{running=false}try{applyArchive();applyActualReady()}catch(e){console.warn('[DF arquivo mensal]',e)}}

// Archived OPs share the same monthly view as ready OPs. Do not modify records.
function applyArchive(){
 // O painel de Produção Automática filtra por mês na própria fonte dos dados.
 if(document.getElementById('dfPAPaneArchive'))return;
 const title=Array.from(document.querySelectorAll('h1,h2,h3,h4')).find(e=>/^OPs arquivadas$/i.test((e.textContent||'').trim()));
 if(!title)return;
 const area=title.parentElement;if(!area)return;
 const chosen=selected(),items=records().filter(r=>r&&r.status==='ok'&&month(r)===chosen);
 // The archive's original all-time counter is not a monthly count.
 const counters=Array.from(area.querySelectorAll('div,span,p,small')).filter(e=>e.children.length===0&&/^\s*\d+\s+OPs? com baixa confirmada\s*$/i.test(e.textContent||''));
 for(const el of counters)el.textContent=items.length+' OPs com baixa confirmada neste mês';
 const input=area.querySelector('input[placeholder*="OP"],input[placeholder*="op"]');
 if(input){input.dataset.dfMonth=chosen;}
 // Existing archive search results must not leak records from other months.
 for(const node of Array.from(area.querySelectorAll('[data-view],[data-op-id]'))){
   const code=String(node.getAttribute('data-view')||node.getAttribute('data-op-id')||'').toUpperCase();
   const rec=records().find(r=>id(r)===code);
   const m=rec?month(rec):((code.match(/^DFOP-(\d{4})(\d{2})/)||[]).slice(1).join('-'));
   const row=node.closest('[data-op-row]')||node.parentElement;
   if(row&&row!==area)row.style.setProperty('display',m===chosen?'':'none',m===chosen?'':'important');
 }
}

function applyActualReady(){
 // Não aplicar filtro DOM legado sobre a lista mensal nativa de Produção.
 if(document.getElementById('dfPAPaneOk'))return;
 const heading=Array.from(document.querySelectorAll('h1,h2,h3,h4,div,span,strong')).find(el=>el.children.length===0&&/^OPs prontas$/i.test((el.textContent||'').trim()));
 if(!heading)return;
 const area=heading.parentElement;
 if(!area)return;
 const selectedMonth=selected();
 let picker=document.getElementById('dfReadyActualMonth');
 if(!picker){picker=document.createElement('input');picker.id='dfReadyActualMonth';picker.type='month';picker.setAttribute('aria-label','Mês das OPs prontas');picker.style.cssText='display:block;width:100%;margin:12px 0;padding:12px;border-radius:10px;background:#0b1220;color:#f8fafc;border:1px solid #405476;font-size:16px';picker.addEventListener('change',()=>{if(!/^\d{4}-\d{2}$/.test(picker.value))return;localStorage.setItem(KEY,picker.value);window.dispatchEvent(new CustomEvent('df-production-month-changed',{detail:{month:picker.value}}));schedule()});heading.insertAdjacentElement('afterend',picker)}
 if(picker.value!==selectedMonth)picker.value=selectedMonth;
 const sourceKeys=['df_producao_ops_auto_v1','df_formula_ops_auto_v2'];
 const source=[];
 for(const key of sourceKeys){try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(data))source.push(...data)}catch(e){}}
 const completed=source.filter(r=>r&&(r.status==='ok'||r.status==='ready'||r.status==='completed'));
 const dates=completed.map(r=>({r,m:month(r),machine:String(r.machine||r.maquina||'').trim().toUpperCase()}));
 const cards=Array.from(area.children).filter(el=>el!==heading&&el.id!=='dfReadyActualMonth'&&el.id!=='dfMonthlyReadyNotice'&&/ABRIR FOTO/i.test(el.textContent||''));
 for(const card of cards){
   const raw=card.textContent||'';
   const idMatch=raw.match(/DFOP-\d{8}-\d{6}-[A-Z0-9]+/i);
   const opCode=idMatch?.[0]?.toUpperCase();
   const match=opCode?dates.find(x=>id(x.r)===opCode||String(x.r.opId||'').toUpperCase()===opCode):dates.find(x=>x.machine&&raw.toUpperCase().includes(x.machine));
   // With no completed OPs for the chosen month, show an empty monthly view.
   const anyThisMonth=dates.some(x=>x.m===selectedMonth);
   const visible=match?match.m===selectedMonth:anyThisMonth;
   card.hidden=!visible;
   card.style.setProperty('display',visible?'':'none',visible?'':'important');
 }
 let notice=document.getElementById('dfMonthlyReadyNotice');
 if(!notice){notice=document.createElement('p');notice.id='dfMonthlyReadyNotice';notice.style.cssText='padding:12px;color:#aabbd3;text-align:center';heading.insertAdjacentElement('afterend',notice)}
 const visibleCards=cards.filter(c=>!c.hidden);
 notice.textContent=visibleCards.length?'':'Nenhuma OP pronta neste mês. O histórico permanece disponível nos meses anteriores.';
 notice.style.display=visibleCards.length?'none':'block';
}

function schedule(){clearTimeout(timer);timer=setTimeout(()=>{apply();applyActualReady();applyArchive()},120)}
function observe(){const b=panel();if(!b||b===boxRef)return;boxObserver?.disconnect();boxRef=b;boxObserver=new MutationObserver(schedule);boxObserver.observe(b,{childList:true,subtree:true});schedule()}
function boot(){observe();schedule();new MutationObserver(()=>{if(!panel()||panel()!==boxRef)observe()}).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target?.closest?.('button,[data-pane]'))schedule()},true);window.addEventListener('df-op-save-ui-refresh',schedule);window.addEventListener('df-op-remote-merged',schedule);window.addEventListener('df-op-d1-applied',schedule);window.addEventListener('focus',schedule);setInterval(schedule,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();