(function(){
'use strict';
if(window.DFFormulaAllowSameNameV1)return;window.DFFormulaAllowSameNameV1=true;
const KEY='df_formulacoes_v2';
const $=id=>document.getElementById(id);
function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function norm(v){let s=String(v||'').trim();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toLowerCase().replace(/\s+/g,' ')}
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
function uid(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
async function saveDuplicate(){
  const nome=String($('foNome')?.value||'').trim()||'Formulação';
  const forms=load();
  if(!forms.some(f=>norm(f?.nome)===norm(nome)))return false;
  const total=num($('foTotal')?.value);
  const rows=(typeof window.getFoRows==='function'?window.getFoRows():[]).filter(r=>r&&r.id&&Number(r.pct)>0).map(r=>({...r}));
  if(!total){alert('Digite quantos kg quer fazer.');return true}
  if(!rows.length){alert('Escolha pelo menos 1 material.');return true}
  let r={};
  try{if(typeof window.calcFo==='function')r=await window.calcFo()||{}}catch(e){}
  const d=Number(r?.diferencaPara100)||0;
  if(Math.abs(d)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return true;
  let op={};try{if(typeof window.getExtrusaoOP==='function')op=window.getExtrusaoOP()||{}}catch(e){}
  const rec={id:uid(),nome,total,rows,custo:Number(r?.custoTotal)||0,custoKg:Number(r?.custoKgFinal)||0,op,criado:new Date().toISOString(),updatedAt:new Date().toISOString()};
  forms.unshift(rec);
  try{if(typeof window.saveForms==='function')window.saveForms(forms);else localStorage.setItem(KEY,JSON.stringify(forms))}catch(e){localStorage.setItem(KEY,JSON.stringify(forms))}
  try{if(typeof window.renderForms==='function')window.renderForms()}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-formula-saved',{detail:{id:rec.id,nome:rec.nome,duplicateName:true}}))}catch(e){}
  alert('Formulação salva. O mesmo nome foi mantido como uma nova versão.');
  return true;
}
document.addEventListener('click',async e=>{
  const b=e.target?.closest?.('#foSave');if(!b)return;
  const nome=String($('foNome')?.value||'').trim()||'Formulação';
  if(!load().some(f=>norm(f?.nome)===norm(nome)))return;
  e.preventDefault();e.stopImmediatePropagation();
  await saveDuplicate();
},true);
})();