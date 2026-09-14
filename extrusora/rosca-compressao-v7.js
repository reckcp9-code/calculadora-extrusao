(function(){
'use strict';
if(window.DFRoscaCompressaoV7)return;window.DFRoscaCompressaoV7=true;
const MACHINES='df_private_extruder_calc_machines_v1';
const $=id=>document.getElementById(id);
const num=v=>{let s=String(v==null?'':v).trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)?n:0};
const fmt=(v,d=3)=>Number.isFinite(v)&&v>0?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d}):'—';
const signed=(v,d=3)=>{if(!Number.isFinite(v))return'—';const a=Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d});return(v>0?'+':v<0?'−':'')+a};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function machines(){try{const a=JSON.parse(localStorage.getItem(MACHINES)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function saveMachines(a){try{localStorage.setItem(MACHINES,JSON.stringify(a))}catch(e){}}
function currentId(){return String($('screwMachineSelect')&&$('screwMachineSelect').value||'').trim()}
function currentMachine(){const id=currentId();return machines().find(x=>x&&x.id===id)||null}
function makeField(label,id,placeholder,kind){const d=document.createElement('div');d.className='field';if(kind==='select'){d.innerHTML='<label>'+label+'</label><select id="'+id+'"><option value="keepFeed">Manter alimentação e calcular dosagem</option><option value="keepMeter">Manter dosagem e calcular alimentação</option><option value="manual">Manual / manter simulador anterior</option></select>'}else{d.innerHTML='<label>'+label+'</label><input id="'+id+'" inputmode="decimal" placeholder="'+placeholder+'">'}return d}
function ensureUi(){
 const page=$('screwPage');if(!page)return false;
 const title=page.querySelector('.pageTitle h1'),sub=page.querySelector('.pageTitle p');if(title)title.textContent='Rosca e Taxa de Compressão';if(sub)sub.textContent='Geometria por máquina, taxa atual e simulação de reforma';
 const menu=document.querySelector('[data-open="screwPage"]');if(menu)menu.textContent='🧰 ROSCA / TAXA';
 const grid=$('screwDiameter')&&$('screwDiameter').closest('.grid');if(!grid)return false;
 if(!$('feedZoneLength')){
   const ld=$('screwLD')&&$('screwLD').closest('.field');
   const f1=makeField('Comprimento zona de alimentação (mm)','feedZoneLength','Ex.: 550');
   const f2=makeField('Comprimento zona de compressão / transição (mm)','compressionZoneLength','Ex.: 660');
   const f3=makeField('Comprimento zona de dosagem (mm)','meterZoneLength','Ex.: 550');
   if(ld){ld.insertAdjacentElement('afterend',f3);ld.insertAdjacentElement('afterend',f2);ld.insertAdjacentElement('afterend',f1)}else{grid.prepend(f1,f2,f3)}
 }
 if(!$('desiredCompression')){
   const pitch=$('meterPitch')&&$('meterPitch').closest('.field');
   const target=makeField('Taxa de compressão desejada','desiredCompression','Ex.: 3,0');
   const mode=makeField('Como deseja simular?','compressionMode','', 'select');
   if(pitch){pitch.insertAdjacentElement('afterend',mode);pitch.insertAdjacentElement('afterend',target)}else grid.append(target,mode)
 }
 const fp=$('feedDepthProjected'),mp=$('meterDepthProjected');if(fp)fp.placeholder='Calculado automaticamente';if(mp)mp.placeholder='Calculado automaticamente';
 const tech=page.querySelector('.techGrid');if(tech){
   if(!$('screwTheoreticalLength')){const d=document.createElement('div');d.className='techStat';d.innerHTML='<span>COMPRIMENTO TEÓRICO D × L/D</span><b id="screwTheoreticalLength">—</b>';tech.appendChild(d)}
   if(!$('screwZonesLength')){const d=document.createElement('div');d.className='techStat';d.innerHTML='<span>SOMA DAS ZONAS</span><b id="screwZonesLength">—</b>';tech.appendChild(d)}
 }
 const cardHead=Array.from(page.querySelectorAll('.card h2')).find(x=>/Taxa de compressão/i.test(x.textContent||''));if(cardHead)cardHead.textContent='Taxa de compressão e simulador geométrico';
 const notes=Array.from(page.querySelectorAll('.notes')).find(x=>/taxa mostrada usa|reforma/i.test(x.textContent||''));if(notes)notes.innerHTML='<b>Validação técnica obrigatória:</b> este módulo faz um <b>cálculo geométrico simplificado</b> da taxa de compressão usando <b>profundidade de alimentação ÷ profundidade de dosagem</b>. Ao manter a alimentação, a nova dosagem é <b>alimentação ÷ taxa desejada</b>. Ao manter a dosagem, a nova alimentação é <b>taxa desejada × dosagem</b>.<br><br>O resultado não define sozinho uma reforma de rosca. Antes de usinar, valide desenho completo, diâmetro de raiz, largura e passo dos filetes, folgas, comprimentos das zonas, material, tratamento, torque, pressão e aplicação do polímero.';
 return true;
}
function updateProjectedState(){const mode=String($('compressionMode')&&$('compressionMode').value||'keepFeed');const manual=mode==='manual';if($('feedDepthProjected')){$('feedDepthProjected').readOnly=!manual;$('feedDepthProjected').placeholder=manual?'Ex.: 7,0':'Calculado automaticamente'}if($('meterDepthProjected')){$('meterDepthProjected').readOnly=!manual;$('meterDepthProjected').placeholder=manual?'Ex.: 3,0':'Calculado automaticamente'}}
function loadGeometry(){ensureUi();const m=currentMachine(),g=m&&m.screw||{};['feedZoneLength','compressionZoneLength','meterZoneLength','desiredCompression'].forEach(id=>{if($(id))$(id).value=String(g[id]||'')});if($('compressionMode'))$('compressionMode').value=String(g.compressionMode||'keepFeed');if(!$('compressionMode').value)$('compressionMode').value='keepFeed';if(!$('desiredCompression').value){const fp=num(g.feedDepthProjected),mp=num(g.meterDepthProjected);if(fp>0&&mp>0)$('desiredCompression').value=String((fp/mp).toFixed(2)).replace('.',',')}updateProjectedState();setTimeout(calc,0)}
function calc(){
 if(!ensureUi())return;updateProjectedState();
 const D=num($('screwDiameter')&&$('screwDiameter').value),ld=num($('screwLD')&&$('screwLD').value),zf=num($('feedZoneLength')&&$('feedZoneLength').value),zc=num($('compressionZoneLength')&&$('compressionZoneLength').value),zm=num($('meterZoneLength')&&$('meterZoneLength').value),fc=num($('feedDepthCurrent')&&$('feedDepthCurrent').value),mc=num($('meterDepthCurrent')&&$('meterDepthCurrent').value),target=num($('desiredCompression')&&$('desiredCompression').value),mode=String($('compressionMode')&&$('compressionMode').value||'keepFeed');
 let fp=num($('feedDepthProjected')&&$('feedDepthProjected').value),mp=num($('meterDepthProjected')&&$('meterDepthProjected').value);
 if(mode==='keepFeed'){fp=fc;mp=fc>0&&target>0?fc/target:0;if($('feedDepthProjected'))$('feedDepthProjected').value=fp>0?String(fp.toFixed(3)).replace('.',','):'';if($('meterDepthProjected'))$('meterDepthProjected').value=mp>0?String(mp.toFixed(3)).replace('.',','):''}
 else if(mode==='keepMeter'){mp=mc;fp=mc>0&&target>0?target*mc:0;if($('feedDepthProjected'))$('feedDepthProjected').value=fp>0?String(fp.toFixed(3)).replace('.',','):'';if($('meterDepthProjected'))$('meterDepthProjected').value=mp>0?String(mp.toFixed(3)).replace('.',','):''}
 const cr=fc>0&&mc>0?fc/mc:0,cpr=fp>0&&mp>0?fp/mp:0,theoretical=D>0&&ld>0?D*ld:0,zones=zf+zc+zm;const root=d=>D>0&&d>0?D-2*d:0;const cfr=root(fc),cmr=root(mc),pfr=root(fp),pmr=root(mp);
 if($('compressionCurrent'))$('compressionCurrent').textContent=cr>0?fmt(cr,2)+':1':'—';if($('compressionProjected'))$('compressionProjected').textContent=cpr>0?fmt(cpr,2)+':1':'—';if($('compressionDiff'))$('compressionDiff').textContent=cr>0&&cpr>0?signed(cpr-cr,2):'—';if($('screwTheoreticalLength'))$('screwTheoreticalLength').textContent=theoretical>0?fmt(theoretical,1)+' mm':'—';if($('screwZonesLength'))$('screwZonesLength').textContent=zones>0?fmt(zones,1)+' mm':'—';
 const put=(id,v,d=3,suf=' mm')=>{if($(id))$(id).textContent=v>0?fmt(v,d)+suf:'—'};const diff=(id,a,b)=>{if($(id))$(id).textContent=a>0&&b>0?signed(b-a,3)+' mm':'—'};
 put('scCurFeed',fc);put('scCurMeter',mc);put('scProjFeed',fp);put('scProjMeter',mp);put('scCurFeedRoot',cfr);put('scCurMeterRoot',cmr);put('scProjFeedRoot',pfr);put('scProjMeterRoot',pmr);diff('scDiffFeed',fc,fp);diff('scDiffMeter',mc,mp);diff('scDiffFeedRoot',cfr,pfr);diff('scDiffMeterRoot',cmr,pmr);
 let msg='';if(!currentMachine())msg='Selecione uma máquina.';else if(!(fc>0&&mc>0))msg='Preencha as profundidades atuais para calcular a taxa de compressão.';else if(mode!=='manual'&&!(target>0))msg='Informe a taxa de compressão desejada para simular.';else if(!(fp>0&&mp>0))msg='Complete as medidas projetadas para comparar a reforma.';else if(D>0&&(cfr<=0||cmr<=0||pfr<=0||pmr<=0))msg='Confira as profundidades: alguma medida é incompatível com o diâmetro da rosca.';else if(theoretical>0&&zones>0&&Math.abs(theoretical-zones)>Math.max(5,theoretical*.03))msg='A soma das zonas difere do comprimento teórico D × L/D. Confira as medidas antes de validar o projeto.';if($('screwCalcMsg')){$('screwCalcMsg').textContent=msg;$('screwCalcMsg').className='status '+(msg?'warn':'ok')}
}
function saveGeometry(ev){
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();const id=currentId();if(!id){if($('screwSaveMsg')){$('screwSaveMsg').textContent='Selecione uma máquina.';$('screwSaveMsg').className='status warn'}return}
 const a=machines(),i=a.findIndex(x=>x&&x.id===id);if(i<0)return;const old=a[i].screw||{},ids=['screwDiameter','screwLD','feedZoneLength','compressionZoneLength','meterZoneLength','feedDepthCurrent','meterDepthCurrent','feedPitch','meterPitch','desiredCompression','compressionMode','feedDepthProjected','meterDepthProjected'],g=Object.assign({},old);ids.forEach(k=>g[k]=String($(k)&&$(k).value||'').trim());a[i]=Object.assign({},a[i],{screw:g,updatedAt:new Date().toISOString()});saveMachines(a);if($('screwSaveMsg')){$('screwSaveMsg').textContent='✅ Rosca e taxa de compressão salvas na máquina.';$('screwSaveMsg').className='status ok'}calc()
}
function bind(){
 if(!ensureUi())return false;['feedZoneLength','compressionZoneLength','meterZoneLength','desiredCompression','compressionMode','screwDiameter','screwLD','feedDepthCurrent','meterDepthCurrent','feedDepthProjected','meterDepthProjected'].forEach(id=>{const e=$(id);if(!e||e.dataset.dfRoscaV7)return;e.dataset.dfRoscaV7='1';e.addEventListener('input',()=>setTimeout(calc,0));e.addEventListener('change',()=>setTimeout(calc,0))});
 const save=$('saveScrewGeometry');if(save&&!save.dataset.dfRoscaV7){save.dataset.dfRoscaV7='1';save.addEventListener('click',saveGeometry,true)}
 const sel=$('screwMachineSelect');if(sel&&!sel.dataset.dfRoscaV7){sel.dataset.dfRoscaV7='1';sel.addEventListener('change',()=>setTimeout(loadGeometry,20))}
 document.querySelectorAll('[data-open="screwPage"]').forEach(b=>{if(!b.dataset.dfRoscaV7){b.dataset.dfRoscaV7='1';b.addEventListener('click',()=>setTimeout(()=>{loadGeometry();calc()},30))}});return true
}
function boot(){let n=0;const t=setInterval(()=>{n++;if(bind()||n>40){clearInterval(t);loadGeometry();calc()}},100);window.addEventListener('pageshow',()=>setTimeout(()=>{bind();loadGeometry();calc()},100))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();