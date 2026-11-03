(function(){
'use strict';
if(window.DFPulleyRatioV11)return;window.DFPulleyRatioV11=true;
const $=id=>document.getElementById(id);
function num(v){let s=String(v==null?'':v).trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}
function fmt(v){return Number.isFinite(v)&&v>0?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:3}):'—'}
function ensure(){
 const pm=$('motorPulley'),pc=$('boxPulley');if(!pm||!pc)return false;
 if(!$('pulleyRatioInfo')){
   const boxField=pc.closest('.field')||pc.parentElement;
   const info=document.createElement('div');info.id='pulleyRatioInfo';info.className='field full';
   info.innerHTML='<div style="border:1px solid #334155;background:#0f172a;border-radius:12px;padding:12px 13px"><span style="display:block;color:#94a3b8;font-size:10px;font-weight:850;margin-bottom:4px">RELAÇÃO DAS POLIAS — CAIXA ÷ MOTOR</span><b id="pulleyRatioValue" style="display:block;color:#ffd36a;font-size:17px">—</b><small id="pulleyRatioCalc" style="display:block;color:#94a3b8;font-size:10px;margin-top:4px"></small></div>';
   if(boxField)boxField.insertAdjacentElement('afterend',info);
 }
 return true;
}
function update(){if(!ensure())return;const pm=num($('motorPulley').value),pc=num($('boxPulley').value),v=$('pulleyRatioValue'),c=$('pulleyRatioCalc');if(pm>0&&pc>0){const r=pc/pm;v.textContent=fmt(r)+' : 1';c.textContent=fmt(pc)+' ÷ '+fmt(pm)+' = '+fmt(r)}else{v.textContent='—';c.textContent='Informe as duas polias para visualizar a relação.'}}
function boot(){let n=0;const t=setInterval(()=>{n++;if(ensure()){update();const pm=$('motorPulley'),pc=$('boxPulley');if(!pm.dataset.dfRatio){pm.dataset.dfRatio='1';pm.addEventListener('input',update);pm.addEventListener('change',update)}if(!pc.dataset.dfRatio){pc.dataset.dfRatio='1';pc.addEventListener('input',update);pc.addEventListener('change',update)}if(n>30)clearInterval(t)}else if(n>80)clearInterval(t)},250);window.addEventListener('pageshow',()=>setTimeout(update,100));document.addEventListener('click',()=>setTimeout(update,50),true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
