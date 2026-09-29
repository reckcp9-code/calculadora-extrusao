(function(){
'use strict';
if(window.__DF_RUNTIME_STABILITY_V5)return;window.__DF_RUNTIME_STABILITY_V5=true;
const OPS_KEY='df_formula_ops_auto_v2';
const $=id=>document.getElementById(id);
function localYmd(value){const d=value?new Date(value):new Date();if(Number.isNaN(d.getTime()))return'';const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function load(){try{const a=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(OPS_KEY,JSON.stringify(a))}catch(e){}}
function normalizeDates(){const a=load();let changed=false;for(const o of a){if(!o||!/^DFOP-/i.test(String(o.qr||o.id||'')))continue;const v=o.manualConfirmedAt||o.d1UpdatedAt||o.cloudSyncedAt||o.updatedAt||o.createdAt||'';const d=localYmd(v);if(d&&o.data!==d){o.data=d;changed=true}}if(changed)save(a);return changed}
function ui(){if(!$('dfRuntimeStableStyleV5')){const s=document.createElement('style');s.id='dfRuntimeStableStyleV5';s.textContent='button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}input,textarea,select{font-size:16px}';document.head.appendChild(s)}const h=document.querySelector('#dfFormulaOps .dfOpsHero h2');if(h)h.textContent='📸 OP + QR';const p=document.querySelector('#dfFormulaOps .dfOpsHero > p');if(p)p.textContent='Fotografe a OP, confirme PRODUÇÃO TOTAL e APARA TOTAL e salve. O D1 mantém a OP oficial sincronizada entre os aparelhos.'}
function refresh(){const y=window.scrollY||0,m=$('dfOpMonth');if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){};try{window.DFOpTeamDateCanonical?.run?.()}catch(e){};requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}))}
['df-op-d1-applied','df-op-save-ui-refresh','df-op-record-deleted'].forEach(ev=>window.addEventListener(ev,()=>{if(normalizeDates())refresh();ui()}));
window.addEventListener('pageshow',()=>{normalizeDates();ui()});window.addEventListener('df-ui-ready',()=>setTimeout(()=>{normalizeDates();ui()},100));
function boot(){normalizeDates();ui()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
