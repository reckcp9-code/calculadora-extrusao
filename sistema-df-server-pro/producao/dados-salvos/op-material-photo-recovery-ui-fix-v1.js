(function(){
'use strict';
if(window.DFOpMaterialPhotoRecoveryUiFixV1)return;window.DFOpMaterialPhotoRecoveryUiFixV1=true;
const OPS='df_formula_ops_auto_v2';
let obs=null,timer=0;
function loadOps(){try{const v=JSON.parse(localStorage.getItem(OPS)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function selectedMonth(){const e=document.getElementById('dfOpMonth');return String(e?.value||new Date().toISOString().slice(0,7)).slice(0,7)}
function monthOf(o){const d=String(o?.data||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(d))return d;const m=String(o?.id||o?.qr||'').match(/DFOP-(\d{4})(\d{2})\d{2}-/i);return m?m[1]+'-'+m[2]:''}
function hasFormula(o){const a=Array.isArray(o?.materials)?o.materials:[];return a.some(m=>String(m?.name||m?.material||m?.nome||'').trim()&&Number(m?.pct??m?.percent??m?.porcentagem??m?.percentage)>0)}
function countMissing(){return loadOps().filter(o=>o&&o.status==='ok'&&monthOf(o)===selectedMonth()&&Number(o?.produzido||0)>0&&!hasFormula(o)).length}
function mount(){
 const box=document.getElementById('dfMaterialConsumption');if(!box)return false;
 const count=countMissing();let w=document.getElementById('dfMatPhotoRecoverSticky');
 if(!w){w=document.createElement('div');w.id='dfMatPhotoRecoverSticky';w.style.cssText='margin:10px 0;padding:10px;border:1px solid #f59e0b;background:#2a1c05;border-radius:11px';const anchor=box.querySelector('.mcKpis')||box.firstChild;if(anchor&&anchor.parentNode===box)anchor.insertAdjacentElement('afterend',w);else box.prepend(w)}
 if(!count){w.innerHTML='<div style="font-size:11px;color:#86efac;font-weight:900">✅ Todas as OPs deste mês têm porcentagens de formulação.</div>';return true}
 w.innerHTML='<button id="dfMatPhotoRecoverStickyBtn" type="button" style="width:100%;border:1px solid #f59e0b;background:#3a2605;color:#fde68a;border-radius:10px;padding:12px;font-weight:950;font-size:12px">📷 RECUPERAR '+count+' FÓRMULA(S) DAS FOTOS</button><div style="margin-top:6px;font-size:10px;color:#fde68a;line-height:1.4">As OPs antigas sem porcentagem serão relidas pelas fotos arquivadas.</div>';
 const b=document.getElementById('dfMatPhotoRecoverStickyBtn');if(b)b.onclick=async()=>{const api=window.DFOpMaterialPhotoRecovery;if(!api||typeof api.recoverAll!=='function'){alert('O recuperador ainda está carregando. Aguarde 2 segundos e tente novamente.');return}b.disabled=true;b.textContent='⏳ LENDO FOTOS...';try{await api.recoverAll()}finally{setTimeout(mount,250)}};
 return true;
}
function ensure(){clearTimeout(timer);timer=setTimeout(()=>{mount();const box=document.getElementById('dfMaterialConsumption');if(box&&!obs){obs=new MutationObserver(()=>{if(!document.getElementById('dfMatPhotoRecoverSticky'))ensure()});obs.observe(box,{childList:true,subtree:false})}},60)}
function boot(){let n=0;const t=setInterval(()=>{if(mount()||++n>40)clearInterval(t)},200);ensure()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="month"]'))ensure()},true);
document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth')ensure()});
window.addEventListener('df-op-remote-merged',ensure);window.addEventListener('storage',e=>{if(e.key===OPS)ensure()});
})();
