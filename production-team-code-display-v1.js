(function(){'use strict';if(window.DFProductionTeamCodeDisplayV1)return;window.DFProductionTeamCodeDisplayV1=true;
const CODE='38173149',NAME='DF PRODUÇÃO';let busy=false;
function apply(){if(busy)return;busy=true;try{
const leaves=Array.from(document.querySelectorAll('div,span,b,strong,p')).filter(e=>e.children.length===0&&/Equipe:\\s*DF PRODUÇÃO/i.test(e.textContent||''));
for(const line of leaves){let card=line;for(let i=0;i<7&&card;i++,card=card.parentElement){if((card.textContent||'').includes('SINCRONIZAR PRODUÇÃO')&&(card.textContent||'').includes('EQUIPE DE PRODUÇÃO'))break}
if(!card||!(card.textContent||'').includes('SINCRONIZAR PRODUÇÃO'))continue;
let label=card.querySelector('#dfProductionConfirmedCode');if(!label){label=document.createElement('div');label.id='dfProductionConfirmedCode';label.style.cssText='color:#86efac;font-size:inherit;font-weight:900;margin-top:5px';line.insertAdjacentElement('afterend',label)}
label.textContent='Código da Produção: '+CODE;
const sync=Array.from(card.querySelectorAll('button')).find(b=>/SINCRONIZAR PRODUÇÃO/i.test(b.textContent||''));
if(sync&&!card.querySelector('#dfProductionConfirmedCopy')){const btn=document.createElement('button');btn.type='button';btn.id='dfProductionConfirmedCopy';btn.textContent='📋 COPIAR CÓDIGO';btn.style.cssText='display:block;width:100%;margin-top:9px;padding:12px;border:1px solid #3b82f6;border-radius:12px;background:#132750;color:#bfdbfe;font-weight:900';btn.onclick=async()=>{try{await navigator.clipboard.writeText(CODE);btn.textContent='✅ CÓDIGO COPIADO';setTimeout(()=>btn.textContent='📋 COPIAR CÓDIGO',1400)}catch(e){window.prompt('Código da Produção:',CODE)}};sync.insertAdjacentElement('afterend',btn)}
break}
}finally{busy=false}}
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(apply,90)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);
})();