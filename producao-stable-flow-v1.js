(function(){
'use strict';
if(window.DF_PRODUCAO_STABLE_FLOW_V1)return;window.DF_PRODUCAO_STABLE_FLOW_V1=true;
const KEY='df_producao_ops_setores_test_v3',QRKEY='df_op_qr_registry_test_setores_v3';
const $=id=>document.getElementById(id);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}};
const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>{const d=new Date(),p=x=>String(x).padStart(2,'0');return'DFOP-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()};
const rolls=()=>Array.from({length:56},(_,i)=>({n:i+1,peso:'',apara:''}));
const stops=()=>Array.from({length:8},()=>({code:'',start:'',end:'',minutes:0}));
function notice(msg,type){let n=$('dfStableNotice');if(!n){n=document.createElement('div');n.id='dfStableNotice';n.style.cssText='margin-top:10px;padding:11px;border-radius:11px;font:800 12px system-ui';const b=$('prGenerate');if(b)b.insertAdjacentElement('afterend',n)}if(!n)return;n.textContent=msg;n.style.background=type==='ok'?'#0d2516':'#241600';n.style.color=type==='ok'?'#86efac':'#ffd36a';n.style.border='1px solid '+(type==='ok'?'#166534':'#a16207')}
function generateSafe(e){const b=e.target.closest&&e.target.closest('#prGenerate');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(b.dataset.busy==='1')return;b.dataset.busy='1';setTimeout(()=>delete b.dataset.busy,700);
 const S=window.__DF_PROD_V3_STATE||{},sector=S.sector||'Picote';
 const machine=$('prMachine')?.value.trim()||'',product=$('prProduct')?.value.trim()||'',measure=$('prMeasure')?.value.trim()||'',operator=$('prOperator')?.value.trim()||'',shift=$('prShift')?.value||'',start=$('prStart')?.value||'',end=$('prEnd')?.value||'';
 if(!machine||!product||!measure||!operator||!shift||!start||!end){notice('Preencha máquina, produto, medida, operador, turno e período.');return}
 const a=read(KEY,[]);const old=a.find(x=>x&&x.sector===sector&&String(x.machine||'').toLowerCase()===machine.toLowerCase()&&x.status==='open');
 if(old){const same=String(old.product||'').toLowerCase()===product.toLowerCase()&&String(old.measure||'').toLowerCase()===measure.toLowerCase();notice(same?'Já existe uma OP aberta nessa máquina para esse produto/medida. Você pode alterar os campos normalmente.':'Essa máquina já possui uma OP aberta. Encerre a atual antes de trocar produto ou medida.');return}
 const o={id:id(),sector,machine,product,measure,operator,shift,start,end,createdAt:new Date().toISOString(),status:'open',rolls:rolls(),stops:stops(),test:false};a.push(o);
 if(!save(a)){notice('Não foi possível salvar a OP neste aparelho. Libere espaço e tente novamente.');return}
 try{const r=read(QRKEY,{});r[o.id]={id:o.id,createdAt:o.createdAt,sector:o.sector,expected:{machine,product,measure,operator,shift,start,end},test:false};localStorage.setItem(QRKEY,JSON.stringify(r))}catch(x){}
 notice('OP '+o.id+' gerada com sucesso. Abra OPS / DAR BAIXA para visualizar ou imprimir.','ok');
 setTimeout(()=>{if(window.__DF_PROD_V3_STATE){window.__DF_PROD_V3_STATE.pane='list';window.__DF_PROD_V3_STATE.editing=null}const tab=document.querySelector('[data-pane="list"]');if(tab)tab.click()},450)
}
document.addEventListener('click',generateSafe,true);
function unlock(){document.documentElement.style.pointerEvents='';document.body.style.pointerEvents='';document.documentElement.style.overflow='';document.body.style.overflow=''}
window.addEventListener('pageshow',unlock,true);window.addEventListener('focus',unlock,true);document.addEventListener('visibilitychange',()=>{if(!document.hidden)unlock()});
})();