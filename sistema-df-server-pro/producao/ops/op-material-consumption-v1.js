(function(){
'use strict';
if(window.DFOpMaterialConsumptionV1)return;window.DFOpMaterialConsumptionV1=true;
const OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1';
const $=id=>document.getElementById(id);
let baseMode='produzido',timer=0;
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
function fmt(v,d=2){return Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function fold(v){let s=String(v??'').trim();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toUpperCase().replace(/\s+/g,' ')}
function normId(v){return String(v??'').trim().toUpperCase().replace(/\s+/g,'')}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(normId).filter(Boolean)}
function realName(v){const s=String(v??'').trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function productName(o){return realName(o?.serverProductName)||realName(o?.manualProductName)||realName(o?.clienteFormulacao)||realName(o?.produto)||realName(o?.product)||realName(o?.nomeProduto)||'—'}
function monthOf(o){const d=String(o?.data||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(d))return d;const m=String(o?.id||o?.qr||'').match(/DFOP-(\d{4})(\d{2})\d{2}-/i);return m?m[1]+'-'+m[2]:''}
function registryExpected(o){const r=load(REG,{}),opids=ids(o);for(const [k,x] of Object.entries(r||{})){if(opids.includes(normId(x?.id||k)))return x?.expected||null}return null}
function sanitizeMaterials(list){if(!Array.isArray(list))return[];return list.map(m=>({name:String(m?.name||m?.material||m?.nome||'').trim(),pct:num(m?.pct??m?.percent??m?.porcentagem??m?.percentage)})).filter(m=>m.name&&m.pct>0)}
function materialsFor(o){let a=sanitizeMaterials(o?.materials);if(a.length)return a;const exp=registryExpected(o);a=sanitizeMaterials(exp?.materials);if(a.length)return a;a=sanitizeMaterials(o?.expected?.materials);return a}
function baseKg(o){const p=Math.max(0,num(o?.produzido)),a=Math.max(0,num(o?.apara));return baseMode==='processo'?p+a:p}
function monthSelected(){return String($('dfOpMonth')?.value||new Date().toISOString().slice(0,7)).slice(0,7)}
function completedMonthOps(){const m=monthSelected();return (load(OPS,[])||[]).filter(o=>o&&o.status==='ok'&&monthOf(o)===m)}
function calculate(){
  const ops=completedMonthOps(), totals=new Map(), details=new Map(), opRows=[];
  let baseTotal=0,identifiedTotal=0,gapTotal=0,withFormula=0,withoutFormula=0;
  for(const o of ops){
    const base=baseKg(o);if(!(base>0))continue;baseTotal+=base;
    const mats=materialsFor(o),sumPct=mats.reduce((s,m)=>s+m.pct,0);
    if(!mats.length){withoutFormula++;opRows.push({o,base,sumPct:0,gapKg:base,materials:[]});continue}
    withFormula++;
    const rowM=[];
    for(const m of mats){
      const kg=base*m.pct/100,key=fold(m.name);identifiedTotal+=kg;
      if(!totals.has(key))totals.set(key,{name:m.name,kg:0,ops:new Set()});const t=totals.get(key);t.kg+=kg;t.ops.add(String(o.id||o.qr||''));
      if(!details.has(key))details.set(key,[]);details.get(key).push({id:String(o.id||o.qr||''),product:productName(o),base,pct:m.pct,kg,date:String(o.data||'')});
      rowM.push({name:m.name,pct:m.pct,kg});
    }
    const gapPct=100-sumPct,gapKg=base*gapPct/100;gapTotal+=gapKg;
    opRows.push({o,base,sumPct,gapKg,materials:rowM});
  }
  return{ops,totals,details,opRows,baseTotal,identifiedTotal,gapTotal,withFormula,withoutFormula};
}
function addStyle(){if($('dfMaterialConsumptionStyle'))return;const s=document.createElement('style');s.id='dfMaterialConsumptionStyle';s.textContent=`
#dfMaterialConsumption{margin-top:14px;border:1px solid #2563eb;background:#0b1324;border-radius:16px;padding:13px;color:#e2e8f0}
#dfMaterialConsumption h3{margin:0 0 5px;color:#93c5fd}#dfMaterialConsumption .mcTiny{font-size:11px;color:#94a3b8;line-height:1.45}
#dfMaterialConsumption .mcModes{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}#dfMaterialConsumption .mcModes button{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:10px;padding:9px;font-size:10px;font-weight:900}#dfMaterialConsumption .mcModes button.on{border-color:#22c55e;background:#0d2a18;color:#bbf7d0}
#dfMaterialConsumption .mcKpis{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:9px 0}.mcK{border:1px solid #263244;background:#111827;border-radius:11px;padding:9px}.mcK span{display:block;color:#94a3b8;font-size:9px}.mcK b{display:block;margin-top:3px;font-size:16px}
#dfMaterialConsumption details{border:1px solid #263244;background:#0f172a;border-radius:11px;margin-top:7px;padding:9px}#dfMaterialConsumption summary{cursor:pointer;font-weight:900;color:#ffd36a;display:flex;justify-content:space-between;gap:8px}#dfMaterialConsumption table{width:100%;border-collapse:collapse;font-size:10px;margin-top:7px}#dfMaterialConsumption td,#dfMaterialConsumption th{padding:6px 4px;border-bottom:1px solid #263244;text-align:left}#dfMaterialConsumption .mcWarn{margin-top:8px;border:1px solid #a16207;background:#2a1c05;color:#fde68a;border-radius:10px;padding:8px;font-size:10px;line-height:1.4}
` ;document.head.appendChild(s)}
function materialCards(c){
  const arr=[...c.totals.entries()].sort((a,b)=>b[1].kg-a[1].kg);if(!arr.length)return'<div class="mcTiny" style="margin-top:9px">Nenhuma formulação com porcentagens foi encontrada nas OPs concluídas deste mês.</div>';
  return arr.map(([key,t])=>{const d=c.details.get(key)||[];return `<details><summary><span>${esc(t.name)}</span><span>${fmt(t.kg)} kg</span></summary><div class="mcTiny">${t.ops.size} OP(s) usando este material</div><table><thead><tr><th>OP</th><th>Produto</th><th>Base</th><th>%</th><th>Consumo</th></tr></thead><tbody>${d.map(x=>`<tr><td>${esc(x.id)}</td><td>${esc(x.product)}</td><td>${fmt(x.base)} kg</td><td>${fmt(x.pct,2)}%</td><td><b>${fmt(x.kg)} kg</b></td></tr>`).join('')}</tbody></table></details>`}).join('');
}
function opAudit(c){
  if(!c.opRows.length)return'';return `<details style="margin-top:10px"><summary><span>🔎 CONFERIR CÁLCULO POR OP</span><span>${c.opRows.length}</span></summary>${c.opRows.map(r=>{const id=String(r.o?.id||r.o?.qr||'OP');const gap=100-r.sumPct;return `<div style="border-top:1px solid #263244;padding:8px 0"><b style="color:#bfdbfe">${esc(id)}</b><div class="mcTiny">${esc(productName(r.o))} • Base ${fmt(r.base)} kg • Fórmula ${fmt(r.sumPct,2)}%</div>${r.materials.length?r.materials.map(m=>`<div class="mcTiny">${esc(m.name)}: ${fmt(r.base)} × ${fmt(m.pct,2)}% = <b>${fmt(m.kg)} kg</b></div>`).join(''):'<div class="mcWarn">Sem porcentagens da formulação disponíveis nesta OP.</div>'}${Math.abs(gap)>.009?`<div class="mcWarn">${gap>0?'Faltam':'Excedem'} ${fmt(Math.abs(gap),2)}% na formulação (${fmt(Math.abs(r.gapKg))} kg na base desta OP). Não distribuí automaticamente.</div>`:''}</div>`}).join('')}</details>`}
function render(){
  const pane=$('dfPaneMonth'),report=$('dfReport');if(!pane||!report)return false;addStyle();let box=$('dfMaterialConsumption');if(!box){box=document.createElement('div');box.id='dfMaterialConsumption';report.insertAdjacentElement('afterend',box)}
  const c=calculate();const gapAbs=Math.abs(c.gapTotal);
  box.innerHTML=`<h3>📦 CONSUMO DE MATERIAL</h3><div class="mcTiny">Calculado OP por OP pelas porcentagens salvas na formulação. A base padrão é exatamente o <b>Produzido kg</b>.</div><div class="mcModes"><button id="dfMatBaseProd" class="${baseMode==='produzido'?'on':''}">PRODUZIDO</button><button id="dfMatBaseProc" class="${baseMode==='processo'?'on':''}">PRODUZIDO + APARA</button></div><div class="mcKpis"><div class="mcK"><span>OPs concluídas</span><b>${c.ops.length}</b></div><div class="mcK"><span>Com formulação</span><b>${c.withFormula}</b></div><div class="mcK"><span>Base calculada</span><b>${fmt(c.baseTotal)} kg</b></div><div class="mcK"><span>Materiais identificados</span><b>${fmt(c.identifiedTotal)} kg</b></div></div>${c.withoutFormula?`<div class="mcWarn">⚠️ ${c.withoutFormula} OP(s) não têm porcentagens da formulação disponíveis neste aparelho. Elas ficam fora do total por material até a formulação ser encontrada.</div>`:''}${gapAbs>.01?`<div class="mcWarn">⚠️ Diferença acumulada das fórmulas: ${fmt(c.gapTotal)} kg. Quando a soma não fecha 100%, o sistema mostra a diferença e não inventa material.</div>`:''}<h4 style="margin:12px 0 4px;color:#f8fafc">Total do mês por material</h4>${materialCards(c)}${opAudit(c)}`;
  $('dfMatBaseProd').onclick=()=>{baseMode='produzido';render()};$('dfMatBaseProc').onclick=()=>{baseMode='processo';render()};return true;
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(render,ms==null?80:ms)}
function boot(){let n=0;const t=setInterval(()=>{if(render()||++n>30)clearInterval(t)},180);setTimeout(render,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth')schedule(40)});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="month"]'))schedule(80)},true);
window.addEventListener('df-op-saved',()=>schedule(80));window.addEventListener('df-op-remote-merged',()=>schedule(100));window.addEventListener('df-prontas-products-synced',()=>schedule(100));window.addEventListener('storage',e=>{if(e.key===OPS||e.key===REG)schedule(120)});
window.DFOpMaterialConsumption={render,calculate};
})();
