(function(){
'use strict';
if(window.DFOpUniqueQrGuardV1)return;window.DFOpUniqueQrGuardV1=true;
const OPS_KEY='df_formula_ops_auto_v2',DEL_KEY='df_deleted_ops_v1';
const norm=v=>String(v||'').trim().toUpperCase();
const valid=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(norm(v));
function json(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'');return x==null?f:x}catch(e){return f}}
function id(o){return norm(o&&(o.id||o.qr))}
function completed(o){return !!(o&&valid(id(o))&&(o.status==='ok'||o.manualConfirmed||o.source==='foto-equipe'||Number(o.produzido)>0))}
function deleted(qr){const d=json(DEL_KEY,{});return !!(d&&d[norm(qr)])}
function existing(qr){qr=norm(qr);if(!qr||deleted(qr))return null;const a=json(OPS_KEY,[]);return Array.isArray(a)?a.find(o=>id(o)===qr&&completed(o))||null:null}
function qrFromManual(){const t=String(document.getElementById('dfManualConfirm')?.textContent||'');const m=t.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i);return m?norm(m[0]):''}
function qrFromPage(){const selectors=['#dfOpQr','#dfQr','#dfProductionQr','[data-op-qr]','input[name="qr"]'];for(const s of selectors){const e=document.querySelector(s);const v=norm(e?.value||e?.getAttribute?.('data-op-qr'));if(valid(v))return v}return qrFromManual()}
function block(qr){const old=existing(qr);if(!old)return false;alert('⚠️ ESTA OP JÁ FOI BAIXADA.\n\nCódigo: '+qr+'\n\nPara evitar produção duplicada, a segunda baixa foi bloqueada. Se a OP for excluída de Prontas, ela poderá ser baixada novamente.');try{window.dispatchEvent(new CustomEvent('df-op-duplicate-blocked',{detail:{id:qr}}))}catch(e){}return true}
document.addEventListener('click',function(e){const b=e.target?.closest?.('#dfManualSave,[data-finalize-op],#dfProdNowFinalize,#dfProductionFinalize,#dfOpFinalize');if(!b)return;const qr=qrFromPage();if(valid(qr)&&block(qr)){e.preventDefault();e.stopImmediatePropagation();}},true);
window.DFOpUniqueQrGuard={exists:existing,block:block};
})();
