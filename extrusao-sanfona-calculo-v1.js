(function(){'use strict';
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s)||0}
function update(){const el=id=>document.getElementById(id),on=!!el('exSanfonado')?.checked,box=el('exSanfonaBox');if(box)box.style.display=on?'block':'none';const l=num(el('exL')?.value),a=num(el('exSanfona')?.value),middle=l-4*a,ok=on&&l>0&&a>0&&middle>=0;const fmt=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});for(const [id,value] of [['exSanfEsq',2*a],['exSanfMeio',middle],['exSanfDir',2*a]]){const node=el(id);if(node)node.textContent=ok?fmt(value)+' CM':'—'}const total=el('exSanfTotal');if(total)total.textContent=ok?'TOTAL: '+fmt(l)+' CM':on&&a>0&&l>0&&middle<0?'SANFONA MAIOR QUE A LARGURA DISPONÍVEL':'TOTAL: —'}
window.dfUpdateSanfona=update;
document.addEventListener('input',e=>{if(e.target?.matches?.('#exSanfona,#exL'))update()},true);
document.addEventListener('change',e=>{if(e.target?.matches?.('#exSanfonado'))update()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update);else update();
})();
