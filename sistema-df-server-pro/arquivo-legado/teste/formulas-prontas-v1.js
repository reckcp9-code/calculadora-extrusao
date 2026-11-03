(function(){
'use strict';
if(window.DFReadyFormulasV1)return; window.DFReadyFormulasV1=true;

const DATA={
 'Fundo estrela':[
  ['Estrela 01 — Alta resistência',[['PEAD (alta)',80],['PEBDL (linear)',20]]],
  ['Estrela 02 — Equilibrada',[['PEAD (alta)',75],['PEBDL (linear)',25]]],
  ['Estrela 03 — Mais tenacidade',[['PEAD (alta)',70],['PEBDL (linear)',30]]],
  ['Estrela 04 — Flexível',[['PEAD (alta)',65],['PEBDL (linear)',35]]],
  ['Estrela 05 — Linear reforçado',[['PEAD (alta)',60],['PEBDL (linear)',40]]],
  ['Estrela 06 — Processo estável',[['PEAD (alta)',75],['PEBDL (linear)',20],['PEBD (baixa)',5]]],
  ['Estrela 07 — Selagem melhorada',[['PEAD (alta)',70],['PEBDL (linear)',20],['PEBD (baixa)',10]]],
  ['Estrela 08 — Maciez controlada',[['PEAD (alta)',65],['PEBDL (linear)',25],['PEBD (baixa)',10]]],
  ['Estrela 09 — Impacto reforçado',[['PEAD (alta)',70],['PEBDL (linear)',25],['PEBD (baixa)',5]]],
  ['Estrela 10 — Filme firme',[['PEAD (alta)',85],['PEBDL (linear)',15]]],
  ['Estrela 11 — Filme muito firme',[['PEAD (alta)',90],['PEBDL (linear)',10]]],
  ['Estrela 12 — Equilíbrio 3 resinas',[['PEAD (alta)',60],['PEBDL (linear)',30],['PEBD (baixa)',10]]],
  ['Estrela 13 — Mais linear',[['PEAD (alta)',55],['PEBDL (linear)',40],['PEBD (baixa)',5]]],
  ['Estrela 14 — Flexível 3 resinas',[['PEAD (alta)',55],['PEBDL (linear)',35],['PEBD (baixa)',10]]],
  ['Estrela 15 — Alta dominante',[['PEAD (alta)',80],['PEBDL (linear)',15],['PEBD (baixa)',5]]],
  ['Estrela 16 — Selagem reforçada',[['PEAD (alta)',65],['PEBDL (linear)',20],['PEBD (baixa)',15]]],
  ['Estrela 17 — Tenacidade 50/50',[['PEAD (alta)',50],['PEBDL (linear)',50]]],
  ['Estrela 18 — Corpo e flexibilidade',[['PEAD (alta)',60],['PEBDL (linear)',25],['PEBD (baixa)',15]]],
  ['Estrela 19 — Alta 72/23/5',[['PEAD (alta)',72],['PEBDL (linear)',23],['PEBD (baixa)',5]]],
  ['Estrela 20 — Alta 68/27/5',[['PEAD (alta)',68],['PEBDL (linear)',27],['PEBD (baixa)',5]]]
 ],
 'Fundo reto':[
  ['Reto 01 — Equilibrada',[['PEAD (alta)',70],['PEBDL (linear)',30]]],
  ['Reto 02 — Mais firme',[['PEAD (alta)',75],['PEBDL (linear)',25]]],
  ['Reto 03 — Mais flexível',[['PEAD (alta)',60],['PEBDL (linear)',40]]],
  ['Reto 04 — Selagem suave',[['PEAD (alta)',60],['PEBDL (linear)',30],['PEBD (baixa)',10]]],
  ['Reto 05 — Selagem reforçada',[['PEAD (alta)',55],['PEBDL (linear)',30],['PEBD (baixa)',15]]],
  ['Reto 06 — Processo estável',[['PEAD (alta)',65],['PEBDL (linear)',25],['PEBD (baixa)',10]]],
  ['Reto 07 — Alta resistência',[['PEAD (alta)',80],['PEBDL (linear)',20]]],
  ['Reto 08 — Tenacidade',[['PEAD (alta)',65],['PEBDL (linear)',35]]],
  ['Reto 09 — Flexível 50/50',[['PEAD (alta)',50],['PEBDL (linear)',50]]],
  ['Reto 10 — Baixa moderada',[['PEAD (alta)',70],['PEBDL (linear)',20],['PEBD (baixa)',10]]],
  ['Reto 11 — Alta dominante',[['PEAD (alta)',85],['PEBDL (linear)',15]]],
  ['Reto 12 — Linear reforçado',[['PEAD (alta)',55],['PEBDL (linear)',40],['PEBD (baixa)',5]]],
  ['Reto 13 — Equilíbrio 60/35/5',[['PEAD (alta)',60],['PEBDL (linear)',35],['PEBD (baixa)',5]]],
  ['Reto 14 — Equilíbrio 70/25/5',[['PEAD (alta)',70],['PEBDL (linear)',25],['PEBD (baixa)',5]]],
  ['Reto 15 — Mais baixa',[['PEAD (alta)',55],['PEBDL (linear)',25],['PEBD (baixa)',20]]],
  ['Reto 16 — Corpo e selagem',[['PEAD (alta)',65],['PEBDL (linear)',20],['PEBD (baixa)',15]]],
  ['Reto 17 — Linear 45%',[['PEAD (alta)',50],['PEBDL (linear)',45],['PEBD (baixa)',5]]],
  ['Reto 18 — Filme firme 78/22',[['PEAD (alta)',78],['PEBDL (linear)',22]]],
  ['Reto 19 — Filme flexível 58/37/5',[['PEAD (alta)',58],['PEBDL (linear)',37],['PEBD (baixa)',5]]],
  ['Reto 20 — Uso geral 68/27/5',[['PEAD (alta)',68],['PEBDL (linear)',27],['PEBD (baixa)',5]]]
 ],
 'Sacolas':[
  ['Sacola 01 — Uso geral',[['PEAD (alta)',75],['PEBDL (linear)',25]]],
  ['Sacola 02 — Mais firme',[['PEAD (alta)',80],['PEBDL (linear)',20]]],
  ['Sacola 03 — Alta rigidez',[['PEAD (alta)',85],['PEBDL (linear)',15]]],
  ['Sacola 04 — Mais resistente',[['PEAD (alta)',70],['PEBDL (linear)',30]]],
  ['Sacola 05 — Flexível',[['PEAD (alta)',60],['PEBDL (linear)',40]]],
  ['Sacola 06 — Equilíbrio 3 resinas',[['PEAD (alta)',70],['PEBDL (linear)',25],['PEBD (baixa)',5]]],
  ['Sacola 07 — Processo suave',[['PEAD (alta)',70],['PEBDL (linear)',20],['PEBD (baixa)',10]]],
  ['Sacola 08 — Selagem melhorada',[['PEAD (alta)',65],['PEBDL (linear)',25],['PEBD (baixa)',10]]],
  ['Sacola 09 — Mais macia',[['PEAD (alta)',60],['PEBDL (linear)',25],['PEBD (baixa)',15]]],
  ['Sacola 10 — Alta dominante',[['PEAD (alta)',90],['PEBDL (linear)',10]]],
  ['Sacola 11 — Linear reforçado',[['PEAD (alta)',65],['PEBDL (linear)',35]]],
  ['Sacola 12 — Resistência e processo',[['PEAD (alta)',75],['PEBDL (linear)',20],['PEBD (baixa)',5]]],
  ['Sacola 13 — Flexibilidade alta',[['PEAD (alta)',55],['PEBDL (linear)',40],['PEBD (baixa)',5]]],
  ['Sacola 14 — Uso geral 60/35/5',[['PEAD (alta)',60],['PEBDL (linear)',35],['PEBD (baixa)',5]]],
  ['Sacola 15 — Corpo e selagem',[['PEAD (alta)',65],['PEBDL (linear)',20],['PEBD (baixa)',15]]],
  ['Sacola 16 — Tenacidade 50/50',[['PEAD (alta)',50],['PEBDL (linear)',50]]],
  ['Sacola 17 — Firme 82/18',[['PEAD (alta)',82],['PEBDL (linear)',18]]],
  ['Sacola 18 — Equilibrada 72/23/5',[['PEAD (alta)',72],['PEBDL (linear)',23],['PEBD (baixa)',5]]],
  ['Sacola 19 — Flexível 58/32/10',[['PEAD (alta)',58],['PEBDL (linear)',32],['PEBD (baixa)',10]]],
  ['Sacola 20 — Uso geral 68/27/5',[['PEAD (alta)',68],['PEBDL (linear)',27],['PEBD (baixa)',5]]]
 ]
};

function css(){if(document.getElementById('dfReadyFormulaCss'))return;const s=document.createElement('style');s.id='dfReadyFormulaCss';s.textContent=`
#dfReadyFormulaBtn{margin-left:auto;border:1px solid #22c55e;background:#0b2417;color:#bbf7d0;border-radius:999px;padding:10px 14px;font-weight:900;font-size:12px;letter-spacing:.02em;box-shadow:0 0 0 1px rgba(34,197,94,.12) inset}
#dfReadyFormulaBtn:active{transform:scale(.98)}
.df-rf-modal{position:fixed;inset:0;z-index:999999;background:rgba(2,6,12,.82);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:12px}
.df-rf-panel{width:min(680px,100%);max-height:88vh;overflow:hidden;background:#0f172a;border:1px solid #334155;border-radius:22px;box-shadow:0 24px 80px #000;display:flex;flex-direction:column}
.df-rf-head{display:flex;align-items:center;justify-content:space-between;padding:17px 18px;border-bottom:1px solid #263244}.df-rf-head b{font-size:20px}.df-rf-x{border:1px solid #475569;background:#111827;color:#fff;width:40px;height:40px;border-radius:12px;font-size:22px}
.df-rf-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:12px}.df-rf-tab{border:1px solid #475569;background:#111827;color:#cbd5e1;border-radius:12px;padding:11px 5px;font-weight:900}.df-rf-tab.on{border-color:#f5a000;background:#211400;color:#ffd36a}
.df-rf-search{margin:0 12px 10px;width:calc(100% - 24px);border:1px solid #334155;background:#080f1c;color:#fff;border-radius:12px;padding:12px 13px;font-size:16px}
.df-rf-list{overflow:auto;padding:0 12px 16px}.df-rf-card{border:1px solid #2b3a50;background:#111827;border-radius:15px;padding:13px;margin-top:9px}.df-rf-name{font-weight:900;color:#f8fafc;margin-bottom:9px}.df-rf-mats{display:flex;flex-wrap:wrap;gap:6px}.df-rf-chip{border:1px solid #3b4b63;background:#0b1220;border-radius:999px;padding:6px 9px;color:#cbd5e1;font-size:12px}.df-rf-chip b{color:#ffd36a}.df-rf-note{padding:0 14px 13px;color:#94a3b8;font-size:11px;line-height:1.35}
@media(min-width:700px){.df-rf-modal{align-items:center}}
`;document.head.appendChild(s)}
function target(){const hs=[...document.querySelectorAll('h2')];return hs.find(h=>/Montar formula/i.test(h.textContent||''));}
function install(){css();const h=target();if(!h)return false;if(document.getElementById('dfReadyFormulaBtn'))return true;const wrap=document.createElement('div');wrap.style.cssText='display:flex;align-items:center;gap:10px;margin:0 0 10px';const badge=h.previousElementSibling&&h.previousElementSibling.classList?.contains('tag')?h.previousElementSibling:null;if(badge){badge.parentNode.insertBefore(wrap,badge);wrap.appendChild(badge)}else h.parentNode.insertBefore(wrap,h);const b=document.createElement('button');b.id='dfReadyFormulaBtn';b.type='button';b.textContent='✓ FORMULAÇÕES PRONTAS';wrap.appendChild(b);b.addEventListener('click',open);return true}
function open(){let cat='Fundo estrela',q='';const modal=document.createElement('div');modal.className='df-rf-modal';modal.innerHTML=`<div class="df-rf-panel"><div class="df-rf-head"><b>Formulações prontas</b><button class="df-rf-x" type="button">×</button></div><div class="df-rf-tabs">${Object.keys(DATA).map((x,i)=>`<button type="button" class="df-rf-tab ${i?'':'on'}" data-cat="${x}">${x}</button>`).join('')}</div><input class="df-rf-search" placeholder="Pesquisar formulação ou material"><div class="df-rf-note">20 opções por categoria • 2 ou 3 resinas por formulação. Base inicial de processo: valide selagem, resistência, espessura e comportamento na sua máquina.</div><div class="df-rf-list"></div></div>`;document.body.appendChild(modal);const list=modal.querySelector('.df-rf-list');function render(){const arr=DATA[cat].filter(x=>(x[0]+' '+x[1].map(m=>m[0]).join(' ')).toLowerCase().includes(q.toLowerCase()));list.innerHTML=arr.map(x=>`<div class="df-rf-card"><div class="df-rf-name">${x[0]}</div><div class="df-rf-mats">${x[1].map(m=>`<span class="df-rf-chip">${m[0]} <b>${m[1]}%</b></span>`).join('')}</div></div>`).join('')||'<div style="padding:22px;color:#94a3b8;text-align:center">Nenhuma formulação encontrada.</div>'}render();modal.querySelector('.df-rf-x').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();const t=e.target.closest?.('.df-rf-tab');if(t){cat=t.dataset.cat;modal.querySelectorAll('.df-rf-tab').forEach(z=>z.classList.toggle('on',z===t));render()}});modal.querySelector('.df-rf-search').addEventListener('input',e=>{q=e.target.value;render()})}
function ensure(){if(install())return;let n=0;const t=setInterval(()=>{if(install()||++n>80)clearInterval(t)},150)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();document.addEventListener('click',e=>{if(e.target?.closest?.('#btFo'))setTimeout(ensure,150)},true);window.addEventListener('df-ui-ready',()=>setTimeout(ensure,180));
})();