(function(){
'use strict';
if(window.DFProducaoDuplicateGuardV2)return;window.DFProducaoDuplicateGuardV2=true;
const KEY='df_producao_ops_setores_test_v3';
function val(id){const e=document.getElementById(id);return e?String(e.value||'').trim():''}
function norm(v){return String(v||'').trim().toLowerCase()}
function ops(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function sector(){return window.__DF_PROD_V3_STATE&&window.__DF_PROD_V3_STATE.sector||'Picote'}
function message(text){
 let m=document.getElementById('dfDuplicateMsgV2');
 if(!m){m=document.createElement('div');m.id='dfDuplicateMsgV2';m.style.cssText='margin-top:10px;border:1px solid #f59e0b;background:#241600;color:#ffd36a;border-radius:12px;padding:12px;font:800 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial';const b=document.getElementById('prGenerate');if(b)b.insertAdjacentElement('afterend',m)}
 if(m)m.textContent=text;
}
function guard(ev){
 const b=ev.target&&ev.target.closest&&ev.target.closest('#prGenerate');if(!b)return;
 const machine=val('prMachine'),product=val('prProduct'),measure=val('prMeasure');if(!machine)return;
 const old=ops().find(x=>x&&x.sector===sector()&&norm(x.machine)===norm(machine)&&x.status==='open');if(!old)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 const same=norm(old.product)===norm(product)&&norm(old.measure)===norm(measure);
 message(same?'Já existe uma OP aberta nessa máquina para esse produto/medida. Altere os campos ou use a OP existente.':'Essa máquina já tem uma OP aberta. Encerre a OP atual antes de gerar outra.');
 try{b.disabled=false;b.style.pointerEvents='auto';document.body.style.pointerEvents='auto';document.documentElement.style.pointerEvents='auto';document.body.style.overflow='';}catch(e){}
}
document.addEventListener('click',guard,true);
})();
