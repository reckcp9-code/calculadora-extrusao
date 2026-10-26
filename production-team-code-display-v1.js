(function(){'use strict';if(window.DFProductionTeamCodeDisplayV1)return;window.DFProductionTeamCodeDisplayV1=true;
const FALLBACK='38173149';let busy=false;
function hideSystemHealth(){for(const el of document.querySelectorAll('div,section,aside')){if(el.children.length>5)continue;const txt=(el.textContent||'').trim();if(!/SAÚDE DO SISTEMA/i.test(txt)||!/Produção automática pronta/i.test(txt))continue;const nested=Array.from(el.children).some(c=>/SAÚDE DO SISTEMA/i.test(c.textContent||'')&&/Produção automática pronta/i.test(c.textContent||''));if(!nested){el.style.display='none';el.setAttribute('data-df-hidden-health','true')}}}
function apply(){if(busy)return;busy=true;try{hideSystemHealth();
const cards=Array.from(document.querySelectorAll('#dfProdTeamV2')).filter(card=>/EQUIPE DE PRODUÇÃO/i.test(card.textContent||''));
for(const card of cards){
const line=card.querySelector('.code');if(!line||!/Equipe:/i.test(line.textContent||''))continue;
const existing=(line.textContent||'').match(/Código da Produção:\s*(\d{6,8})/i);
let saved='';try{saved=String(localStorage.getItem('df_producao_team_join_code_v2')||'').replace(/\D/g,'')}catch(e){}
const code=(existing&&existing[1])||saved||FALLBACK;
let label=card.querySelector('#dfProductionConfirmedCode');
if(!label){label=document.createElement('div');label.id='dfProductionConfirmedCode';label.style.cssText='color:#86efac;font-size:inherit;font-weight:900;margin-top:5px';line.insertAdjacentElement('afterend',label)}
label.textContent='Código da Produção: '+code;
const sync=card.querySelector('#dfProdTeamV2Refresh');
if(sync&&!card.querySelector('#dfProductionConfirmedCopy')){const btn=document.createElement('button');btn.type='button';btn.id='dfProductionConfirmedCopy';btn.textContent='📋 COPIAR CÓDIGO';btn.style.cssText='display:block;width:100%;margin-top:9px;padding:12px;border:1px solid #3b82f6;border-radius:12px;background:#132750;color:#bfdbfe;font-weight:900';btn.onclick=async()=>{try{await navigator.clipboard.writeText(code);btn.textContent='✅ CÓDIGO COPIADO';setTimeout(()=>btn.textContent='📋 COPIAR CÓDIGO',1400)}catch(e){window.prompt('Código da Produção:',code)}};sync.insertAdjacentElement('afterend',btn)}
}
}finally{busy=false}}
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(apply,90)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);
})();