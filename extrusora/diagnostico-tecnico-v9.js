(function(){
'use strict';
if(window.DFDiagnosticoTecnicoV9)return;
window.DFDiagnosticoTecnicoV9=true;

const MACHINES='df_private_extruder_calc_machines_v1';
const LAST_MACHINE='df_private_extruder_last_machine_v1';
const INTENSITY='df_compression_intensity_records_v1';
const TESTS='df_technical_diagnostic_tests_v1';
const STANDARDS='df_technical_good_standards_v1';
const PAGE='technicalDiagnosticPage';
const $=id=>document.getElementById(id);

function num(v){
  let s=String(v==null?'':v).trim().replace(/\s/g,'');
  if(!s)return 0;
  if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
  else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');
  const n=Number(s);return Number.isFinite(n)?n:0;
}
function fmt(v,d=2){return Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d}):'—'}
function signed(v,d=2,suf=''){if(!Number.isFinite(v))return'—';return(v>0?'+':'')+fmt(v,d)+suf}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function readJSON(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(e){return f}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function machines(){const a=readJSON(MACHINES,[]);return Array.isArray(a)?a:[]}
function intensity(){const a=readJSON(INTENSITY,[]);return Array.isArray(a)?a:[]}
function tests(){const a=readJSON(TESTS,[]);return Array.isArray(a)?a:[]}
function standards(){const a=readJSON(STANDARDS,{});return a&&typeof a==='object'&&!Array.isArray(a)?a:{}}
function machineById(id){return machines().find(x=>x&&x.id===id)||null}
function intensityById(id){return intensity().find(x=>x&&x.id===id)||null}
function testById(id){return tests().find(x=>x&&x.id===id)||null}
function nowText(iso){try{return new Date(iso||Date.now()).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return''}}
function val(id){return String($(id)&&$(id).value||'').trim()}
function setText(id,text){if($(id))$(id).textContent=text}

function style(){
 if($('dfDiagnosticV9Style'))return;
 const s=document.createElement('style');s.id='dfDiagnosticV9Style';s.textContent=`
 .diagHero{border:1px solid #5b4715;background:linear-gradient(180deg,#211400,#130f08);border-radius:18px;padding:14px;margin-top:11px}.diagHero b{color:var(--gold);font-size:13px}.diagHero p{color:#e5e7eb;font-size:11px;line-height:1.5;margin:6px 0 0}
 .diagTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.diagTab{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:11px;padding:10px 6px;font-size:10px;font-weight:950}.diagTab.on{border-color:var(--gold2);background:#241600;color:var(--gold)}
 .diagPanel{display:none}.diagPanel.on{display:block}
 .zoneGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:9px}.zoneCard{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:9px;min-width:0}.zoneCard strong{display:block;color:#fff;font-size:11px}.zoneCard small{display:block;color:#94a3b8;font-size:9px;margin-top:4px}.zoneCard b{display:block;font-size:17px;margin-top:6px}.zoneCard.ok{border-color:#166534;background:#081a10}.zoneCard.ok b{color:#86efac}.zoneCard.att{border-color:#7a5600;background:#1b1303}.zoneCard.att b{color:#fde68a}.zoneCard.hot{border-color:#7f1d1d;background:#230b0b}.zoneCard.hot b{color:#fca5a5}
 .diagSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.diagStat{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:10px;min-width:0}.diagStat span{display:block;color:#94a3b8;font-size:9px;font-weight:850}.diagStat b{display:block;color:#f8fafc;font-size:17px;margin-top:4px;word-break:break-word}.diagStat.gold{border-color:#6b4c0a;background:#1a1407}.diagStat.gold b{color:var(--gold)}
 .levelBadge{display:inline-flex;border:1px solid #334155;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:950;margin-top:10px}.levelBadge.low{border-color:#166534;color:#86efac;background:#081a10}.levelBadge.mid{border-color:#7a5600;color:#fde68a;background:#1b1303}.levelBadge.high{border-color:#7f1d1d;color:#fca5a5;background:#230b0b}
 .diagList{display:grid;gap:7px;margin-top:9px}.diagItem{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:11px;color:#e2e8f0;font-size:11px;line-height:1.45}.diagItem b{color:var(--gold)}
 .symptoms{display:grid;grid-template-columns:1fr 1fr;gap:7px}.symptom{display:flex;gap:8px;align-items:flex-start;border:1px solid #334155;background:#0f172a;border-radius:12px;padding:9px;font-size:10px;line-height:1.35;color:#dbe3ef}.symptom input{width:auto;margin-top:2px}
 .testList{display:grid;gap:7px;margin-top:9px}.testRow{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center;border:1px solid #263244;background:#0f172a;border-radius:13px;padding:10px}.testRow b{font-size:12px}.testRow small{display:block;color:#94a3b8;line-height:1.4;margin-top:3px}.testRow button{width:auto;min-height:38px;padding:8px 10px}
 .compareSelect{display:grid;grid-template-columns:1fr 1fr;gap:9px}.compareGrid2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.compareCard2{border:1px solid #334155;background:#0f172a;border-radius:15px;padding:11px;min-width:0}.compareCard2 h3{font-size:12px;margin:0 0 7px}.compareCard2 small{color:#94a3b8;font-size:9px;line-height:1.3}.compareLine{padding:7px 0;border-bottom:1px solid #263244}.compareLine:last-child{border-bottom:0}.compareLine span{display:block;color:#94a3b8;font-size:9px}.compareLine b{display:block;color:#f8fafc;font-size:12px;margin-top:2px}
 .profileWrap{overflow:hidden;border:1px solid #334155;background:#080f1d;border-radius:15px;padding:10px;margin-top:9px}.profileSvg{width:100%;height:180px;display:block}.profileLegend{font-size:10px;color:#94a3b8;line-height:1.4;margin-top:6px}
 .standardBox{border:1px solid #166534;background:#081a10;border-radius:14px;padding:11px;margin-top:9px;color:#bbf7d0;font-size:10px;line-height:1.5}.standardBox.empty{border-color:#334155;background:#0f172a;color:#94a3b8}
 .actionGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
 .reportPreview{border:1px solid #334155;background:#0b0f17;border-radius:14px;padding:12px;font-size:10px;line-height:1.55;color:#cbd5e1;max-height:360px;overflow:auto}.reportPreview h3{color:var(--gold);font-size:13px;margin:10px 0 5px}.reportPreview h3:first-child{margin-top:0}.reportPreview b{color:#fff}
 @media(max-width:650px){.diagTabs{grid-template-columns:1fr 1fr}.zoneGrid{grid-template-columns:1fr 1fr}.diagSummary{grid-template-columns:1fr 1fr}.symptoms,.compareSelect,.compareGrid2,.actionGrid{grid-template-columns:1fr}.testRow{grid-template-columns:1fr 1fr}.testRow>div{grid-column:1/-1}}
 `;document.head.appendChild(s);
}

function pageHtml(){return `
<section id="${PAGE}" class="page">
 <div class="pageHead"><button id="diagBack" class="back" type="button">←</button><div class="pageTitle"><h1>Análise de Cisalhamento</h1><p>Temperaturas • produção • pressão • geometria • testes A/B</p></div></div>
 <div class="diagHero"><b>CENTRAL DE DIAGNÓSTICO TÉCNICO</b><p>Reúne os dados de operação, geometria da rosca e sintomas para criar pontos de atenção, comparar testes e gerar relatório técnico. As indicações são apoio de campo e não substituem medição de temperatura de massa, desenho da rosca ou validação do fabricante.</p></div>
 <div class="diagTabs">
   <button class="diagTab on" type="button" data-diag-tab="operation">1. OPERAÇÃO</button>
   <button class="diagTab" type="button" data-diag-tab="analysis">2. ANÁLISE</button>
   <button class="diagTab" type="button" data-diag-tab="compare">3. COMPARAR</button>
   <button class="diagTab" type="button" data-diag-tab="report">4. RELATÓRIO</button>
 </div>

 <div id="diagPanelOperation" class="diagPanel on">
  <div class="card"><h2>Identificação do teste</h2><div class="grid">
    <div class="field"><label>Máquina</label><select id="diagMachine"><option value="">Selecione</option></select></div>
    <div class="field"><label>Cliente</label><input id="diagClient" autocomplete="off" placeholder="Ex.: Saltiplas"></div>
    <div class="field"><label>Material</label><select id="diagMaterial"><option value="Reciclado">Reciclado</option><option value="Virgem">Virgem</option><option value="Mistura">Mistura</option><option value="Outro">Outro</option></select></div>
    <div class="field"><label>Nome do teste</label><input id="diagTestName" autocomplete="off" placeholder="Ex.: Reciclado tela 60"></div>
  </div></div>

  <div class="card"><h2>Dados de operação</h2><div class="grid">
    <div class="field"><label>RPM do motor</label><input id="diagMotorRpm" inputmode="decimal" placeholder="Ex.: 1000"></div>
    <div class="field"><label>RPM da rosca</label><input id="diagScrewRpm" inputmode="decimal" placeholder="Ex.: 65"></div>
    <div class="field"><label>Produção (kg/h)</label><input id="diagProduction" inputmode="decimal" placeholder="Ex.: 70"></div>
    <div class="field"><label>Corrente do motor (A)</label><input id="diagCurrent" inputmode="decimal" placeholder="Ex.: 61"></div>
    <div class="field"><label>Pressão</label><input id="diagPressure" inputmode="decimal" placeholder="Ex.: 250"></div>
    <div class="field"><label>Observação</label><input id="diagNote" autocomplete="off" placeholder="Ex.: resistências desligadas"></div>
  </div></div>

  <div class="card"><h2>Temperaturas por zona</h2><div class="grid">
    ${[1,2,3,4,5].map(z=>`<div class="field"><label>Zona ${z} — programada (°C)</label><input id="diagSet${z}" inputmode="decimal" placeholder="Ex.: ${135+z*5}"></div><div class="field"><label>Zona ${z} — real (°C)</label><input id="diagReal${z}" inputmode="decimal" placeholder="Ex.: ${145+z*8}"></div>`).join('')}
  </div><div class="hint">O mapa mostra a diferença entre temperatura real e programada. A temperatura indicada no controlador não é necessariamente a temperatura real da massa fundida.</div>
  <div id="diagZoneGrid" class="zoneGrid"></div></div>

  <div class="card"><h2>Geometria da rosca</h2><div class="grid">
    <div class="field full"><label>Resultado salvo em Intensidade de Compressão</label><select id="diagIntensity"><option value="">Sem resultado vinculado</option></select></div>
  </div><div id="diagGeometrySummary" class="machineData">Selecione uma máquina ou um resultado de intensidade.</div><div id="diagProfile" class="profileWrap"></div></div>

  <div class="card"><h2>Sintomas observados</h2><div class="symptoms" id="diagSymptoms">
    <label class="symptom"><input type="checkbox" value="selfHeat">Temperatura real sobe acima do programado mesmo com aquecimento desligado</label>
    <label class="symptom"><input type="checkbox" value="lowProduction">Produção baixa para a rotação usada</label>
    <label class="symptom"><input type="checkbox" value="highPressure">Pressão alta ou maior que o normal da máquina</label>
    <label class="symptom"><input type="checkbox" value="highCurrent">Corrente do motor alta</label>
    <label class="symptom"><input type="checkbox" value="softBubble">Balão / filme sai muito mole e quente</label>
    <label class="symptom"><input type="checkbox" value="scaly">Filme sai escamado / superfície irregular</label>
    <label class="symptom"><input type="checkbox" value="unstableBubble">Balão instável, torto ou oscilando</label>
    <label class="symptom"><input type="checkbox" value="gelsHoles">Gel, pontos ou furos no filme</label>
    <label class="symptom"><input type="checkbox" value="pressureOsc">Pressão oscilando</label>
    <label class="symptom"><input type="checkbox" value="sideLoose">Uma lateral do filme fica frouxa</label>
  </div></div>

  <div class="card"><h2>Teste atual</h2><div class="actionGrid"><button id="diagSaveTest" class="btn" type="button">💾 SALVAR TESTE</button><button id="diagSaveStandard" class="btn secondary" type="button">⭐ SALVAR COMO PADRÃO BOM</button><button id="diagGoAnalysis" class="btn secondary" type="button">ANALISAR →</button></div><div id="diagSaveMsg" class="status"></div><div id="diagStandardBox" class="standardBox empty">Nenhum padrão bom salvo para esta máquina.</div></div>
 </div>

 <div id="diagPanelAnalysis" class="diagPanel">
  <div class="card"><h2>Mapa de aquecimento / autoaquecimento</h2><div id="diagZoneGridAnalysis" class="zoneGrid"></div><div class="notes"><b>Leitura de apoio:</b> ΔT positivo mostra quanto a temperatura real está acima do valor programado. Isso pode ocorrer por calor de cisalhamento, restrição, condição do material, instrumentação ou outras causas. O mapa não identifica sozinho a causa.</div></div>
  <div class="card"><h2>Leitura de cisalhamento aparente</h2><div class="diagSummary"><div class="diagStat gold"><span>LEITURA APARENTE</span><b id="diagShearLevel">—</b></div><div class="diagStat"><span>MAIOR ΔT</span><b id="diagMaxDelta">—</b></div><div class="diagStat"><span>MÉDIA ΔT POSITIVO</span><b id="diagAvgDelta">—</b></div><div class="diagStat"><span>PRODUÇÃO / RPM ROSCA</span><b id="diagYield">—</b></div></div><div id="diagShearBadge" class="levelBadge">Aguardando dados</div><div id="diagReasons" class="diagList"></div></div>
  <div class="card"><h2>Assistente por sintomas</h2><div id="diagSymptomAnalysis" class="diagList"></div><div class="notes"><b>Ponto de atenção:</b> as causas são possibilidades para orientar testes. Confirme com inspeção, medições, histórico da máquina e procedimento seguro antes de qualquer alteração mecânica.</div></div>
  <div class="card"><h2>Comparação com o padrão bom</h2><div id="diagStandardCompare" class="diagList"></div></div>
 </div>

 <div id="diagPanelCompare" class="diagPanel">
  <div class="card"><h2>Virgem × Reciclado / Teste A × B</h2><div class="compareSelect"><div class="field"><label>Teste A</label><select id="diagCompareA"><option value="">Selecione</option></select></div><div class="field"><label>Teste B</label><select id="diagCompareB"><option value="">Selecione</option></select></div></div><div class="compareGrid2"><div id="diagCompareCardA" class="compareCard2"></div><div id="diagCompareCardB" class="compareCard2"></div></div><div id="diagCompareDiff" class="diagList"></div></div>
  <div class="card"><h2>Testes salvos</h2><div id="diagTestList" class="testList"></div></div>
 </div>

 <div id="diagPanelReport" class="diagPanel">
  <div class="card"><h2>Relatório técnico automático</h2><div class="projectLead">O relatório leva identificação do cliente e máquina, material, dados de operação, mapa de temperaturas, geometria vinculada, sintomas, pontos de atenção, comparação com padrão bom e testes sugeridos.</div><div class="actionGrid"><button id="diagPrint" class="btn" type="button">📄 GERAR / IMPRIMIR PDF</button><button id="diagWhats" class="btn secondary" type="button">💬 WHATSAPP</button><button id="diagCopy" class="btn secondary" type="button">📋 COPIAR TEXTO</button></div><div id="diagReportMsg" class="status"></div></div>
  <div class="card"><h2>Prévia do relatório</h2><div id="diagReportPreview" class="reportPreview"></div></div>
 </div>
</section>`}

function ensureUi(){
 style();const app=$('app');if(!app)return false;
 if(!$(PAGE))app.insertAdjacentHTML('beforeend',pageHtml());
 const menu=document.querySelector('.menuTabs');if(menu&&!$('diagMenuButton')){const b=document.createElement('button');b.id='diagMenuButton';b.className='menuBtn';b.type='button';b.textContent='🌡️ ANÁLISE / RELATÓRIO';menu.appendChild(b)}
 return true;
}

function setTab(name){
 ['operation','analysis','compare','report'].forEach(n=>{const p=$('diagPanel'+n.charAt(0).toUpperCase()+n.slice(1));if(p)p.classList.toggle('on',n===name)});
 document.querySelectorAll('[data-diag-tab]').forEach(b=>b.classList.toggle('on',b.dataset.diagTab===name));
 if(name==='analysis')renderAnalysis();if(name==='compare')renderCompare();if(name==='report')renderReportPreview();
 window.scrollTo(0,0);
}
function openPage(){ensureUi();document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));if($('homeView'))$('homeView').classList.add('hidden');$(PAGE).classList.add('on');refreshSelectors();renderOperation();setTab('operation')}
function backHome(){$(PAGE).classList.remove('on');if($('homeView'))$('homeView').classList.remove('hidden');window.scrollTo(0,0)}

function refreshSelectors(){
 const ms=machines();const machine=$('diagMachine');if(machine){const keep=machine.value;machine.innerHTML='<option value="">Selecione</option>'+ms.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||m.id)+'</option>').join('');if(ms.some(m=>m.id===keep))machine.value=keep;else{let last='';try{last=localStorage.getItem(LAST_MACHINE)||''}catch(e){}if(ms.some(m=>m.id===last))machine.value=last;else if(ms[0])machine.value=ms[0].id}}
 refreshIntensity();refreshTests();
}
function refreshIntensity(){
 const sel=$('diagIntensity');if(!sel)return;const mid=val('diagMachine'),keep=sel.value;const a=intensity().filter(r=>!mid||r.machineId===mid);sel.innerHTML='<option value="">Sem resultado vinculado</option>'+a.map(r=>'<option value="'+esc(r.id)+'">'+esc((r.client||'Cliente')+' • '+fmt(r.ratio,2)+':1 • '+fmt(r.compD,2)+' D • '+String(r.attention||'').toUpperCase())+'</option>').join('');if(a.some(r=>r.id===keep))sel.value=keep;else if(a[0])sel.value=a[0].id;
}
function refreshTests(){
 const a=tests();['diagCompareA','diagCompareB'].forEach((id,idx)=>{const s=$(id);if(!s)return;const keep=s.value;s.innerHTML='<option value="">Selecione</option>'+a.map(t=>'<option value="'+esc(t.id)+'">'+esc((t.machineName||'Máquina')+' • '+(t.material||'')+' • '+(t.testName||nowText(t.createdAt)))+'</option>').join('');if(a.some(t=>t.id===keep))s.value=keep;else if(a[idx])s.value=a[idx].id});renderTestList();
}

function selectedSymptoms(){return Array.from(document.querySelectorAll('#diagSymptoms input[type="checkbox"]:checked')).map(x=>x.value)}
function zoneData(){return [1,2,3,4,5].map(z=>{const set=num(val('diagSet'+z)),real=num(val('diagReal'+z));return{zone:z,set,real,delta:set>0&&real>0?real-set:NaN}})}
function zoneClass(d){if(!Number.isFinite(d))return'';if(d>=30)return'hot';if(d>=10)return'att';return'ok'}
function renderZoneCards(target){const box=$(target);if(!box)return;box.innerHTML=zoneData().map(x=>'<div class="zoneCard '+zoneClass(x.delta)+'"><strong>ZONA '+x.zone+'</strong><small>Prog. '+(x.set>0?fmt(x.set,0)+'°C':'—')+'</small><small>Real '+(x.real>0?fmt(x.real,0)+'°C':'—')+'</small><b>'+(Number.isFinite(x.delta)?signed(x.delta,0,'°C'):'—')+'</b></div>').join('')}

function currentIntensity(){return intensityById(val('diagIntensity'))}
function geometry(){
 const m=machineById(val('diagMachine')),ir=currentIntensity(),s=m&&m.screw||{};
 const D=ir&&ir.diameter||num(s.screwDiameter),feed=ir&&ir.feed||num(s.feedDepthCurrent),meter=ir&&ir.meter||num(s.meterDepthCurrent),comp=ir&&ir.length||num(s.compressionZoneLength),zf=num(s.feedZoneLength),zm=num(s.meterZoneLength),ld=num(s.screwLD);
 const ratio=ir&&ir.ratio||feed>0&&meter>0?feed/meter:0;const compD=ir&&ir.compD||D>0&&comp>0?comp/D:0;const redD=ir&&ir.reductionPerD||feed>0&&meter>0&&compD>0?((feed-meter)/feed)/compD*100:0;
 return{D,feed,meter,comp,zf,zm,ld,ratio,compD,redD,attention:ir&&ir.attention||''};
}
function renderGeometry(){
 const g=geometry();const ir=currentIntensity();setText('diagGeometrySummary',g.D>0?('Diâmetro: '+fmt(g.D,1)+' mm • alimentação: '+fmt(g.feed,3)+' mm • dosagem: '+fmt(g.meter,3)+' mm • compressão: '+fmt(g.comp,1)+' mm / '+fmt(g.compD,2)+' D • taxa: '+fmt(g.ratio,2)+':1 • redução: '+fmt(g.redD,2)+'%/D'+(ir?' • leitura '+String(ir.attention||'—').toUpperCase():'')):'Sem geometria suficiente vinculada. Você pode salvar primeiro na tela Intensidade de Compressão.');
 renderProfile(g);
}
function renderProfile(g){
 const box=$('diagProfile');if(!box)return;if(!(g.D>0&&g.feed>0&&g.meter>0)){box.innerHTML='<div class="empty">Informe/salve a geometria da rosca para visualizar o perfil.</div>';return}
 let zf=g.zf>0?g.zf:g.D*8,zc=g.comp>0?g.comp:g.D*8,zm=g.zm>0?g.zm:g.D*8,total=zf+zc+zm;if(total<=0)total=1;
 const x0=28,x3=672,w=644,x1=x0+w*zf/total,x2=x1+w*zc/total;const scale=42/Math.max(g.feed,g.meter);const y=90,fd=g.feed*scale,md=g.meter*scale;
 box.innerHTML='<svg class="profileSvg" viewBox="0 0 700 180" role="img" aria-label="Perfil geométrico simplificado da rosca"><line x1="28" y1="90" x2="672" y2="90" stroke="#94a3b8" stroke-width="2"/><polygon points="'+x0+','+(y-fd)+' '+x1+','+(y-fd)+' '+x2+','+(y-md)+' '+x3+','+(y-md)+' '+x3+','+(y+md)+' '+x2+','+(y+md)+' '+x1+','+(y+fd)+' '+x0+','+(y+fd)+'" fill="#1f2937" stroke="#f5a000" stroke-width="3"/><line x1="'+x1+'" y1="38" x2="'+x1+'" y2="142" stroke="#475569" stroke-dasharray="5 4"/><line x1="'+x2+'" y1="38" x2="'+x2+'" y2="142" stroke="#475569" stroke-dasharray="5 4"/><text x="'+((x0+x1)/2)+'" y="25" text-anchor="middle" fill="#cbd5e1" font-size="13">ALIMENTAÇÃO</text><text x="'+((x1+x2)/2)+'" y="25" text-anchor="middle" fill="#ffd36a" font-size="13">COMPRESSÃO</text><text x="'+((x2+x3)/2)+'" y="25" text-anchor="middle" fill="#cbd5e1" font-size="13">DOSAGEM</text></svg><div class="profileLegend">Perfil visual simplificado: '+fmt(zf,0)+' mm alimentação • '+fmt(zc,0)+' mm compressão • '+fmt(zm,0)+' mm dosagem. Serve para visualizar a transição; não representa filete, largura, passo ou diâmetro de raiz reais.</div>';
}

function capture(){
 const m=machineById(val('diagMachine')),g=geometry(),zones=zoneData(),nom=num(m&&m.nominalCurrent);
 return{id:'dt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),machineId:val('diagMachine'),machineName:m&&m.name||'',client:val('diagClient'),material:val('diagMaterial'),testName:val('diagTestName'),motorRpm:num(val('diagMotorRpm')),screwRpm:num(val('diagScrewRpm')),production:num(val('diagProduction')),current:num(val('diagCurrent')),nominalCurrent:nom,pressure:num(val('diagPressure')),note:val('diagNote'),zones,symptoms:selectedSymptoms(),intensityId:val('diagIntensity'),geometry:g,createdAt:new Date().toISOString()}
}
function heatMetrics(t){const ds=(t.zones||[]).map(z=>z.delta).filter(Number.isFinite),pos=ds.filter(d=>d>0);return{max:pos.length?Math.max.apply(null,pos):0,avg:pos.length?pos.reduce((a,b)=>a+b,0)/pos.length:0}}
function shearReading(t){
 const h=heatMetrics(t),g=t.geometry||{},std=standards()[t.machineId],sym=t.symptoms||[];let score=0,reasons=[];
 if(h.max>=50){score+=3;reasons.push('Maior ΔT ≥ 50°C: autoaquecimento muito elevado em pelo menos uma zona.')}else if(h.max>=30){score+=2;reasons.push('Maior ΔT ≥ 30°C: autoaquecimento elevado em pelo menos uma zona.')}else if(h.max>=15){score+=1;reasons.push('Maior ΔT ≥ 15°C: existe desvio térmico relevante.')}
 if(h.avg>=30){score+=2;reasons.push('A média dos ΔT positivos está elevada.')}else if(h.avg>=15){score+=1;reasons.push('A média dos ΔT positivos merece acompanhamento.')}
 if(g.attention==='agressiva'||g.redD>8){score+=2;reasons.push('A geometria vinculada apresenta redução por D classificada como agressiva.')}else if(g.attention==='moderada'||g.redD>=4){score+=1;reasons.push('A geometria vinculada apresenta redução por D moderada.')}
 if(sym.includes('selfHeat')){score+=2;reasons.push('Foi marcado aquecimento acima do programado mesmo com aquecimento desligado.')}
 if(std){const hs=heatMetrics(std);if(t.production>0&&std.production>0&&t.production<std.production*.8&&h.avg>hs.avg+10){score+=1;reasons.push('Produção caiu mais de 20% versus padrão bom enquanto o ΔT médio aumentou.')}if(t.pressure>0&&std.pressure>0&&t.pressure>std.pressure*1.25){score+=1;reasons.push('Pressão está mais de 25% acima do padrão bom.')}}
 if(t.current>0&&t.nominalCurrent>0&&t.current>t.nominalCurrent){score+=1;reasons.push('Corrente informada está acima da nominal cadastrada.')}
 const level=score>=6?'ELEVADO':score>=3?'MODERADO':'BAIXO';return{score,level,reasons,h};
}

function symptomGuidance(t){
 const s=t.symptoms||[],out=[];
 if(s.includes('selfHeat'))out.push(['Autoaquecimento','Verificar tendência de ΔT por zona, rotação, pressão/restrição, condição do material e geometria. Comparar com material virgem e com uma tela mais aberta pode ajudar a separar efeito de material/restrição.']);
 if(s.includes('lowProduction'))out.push(['Produção baixa','Comparar kg/h por RPM da rosca com o padrão bom. Alimentação insuficiente, restrição, escorregamento do material, geometria inadequada ou condição do reciclado podem reduzir rendimento.']);
 if(s.includes('highPressure'))out.push(['Pressão alta','Inspecionar conjunto de telas, placa quebra-fluxo, canais do cabeçote/matriz e viscosidade do material. Compare com o padrão bom antes de concluir.']);
 if(s.includes('highCurrent'))out.push(['Corrente alta','Conferir corrente nominal, torque/carga, pressão, temperatura da massa, rotação e possíveis restrições.']);
 if(s.includes('softBubble'))out.push(['Balão muito mole/quente','Revisar temperatura real da massa, capacidade de resfriamento/anel de ar e excesso de geração de calor por processo.']);
 if(s.includes('scaly'))out.push(['Filme escamado','Temperatura alta não garante homogeneização. Verificar mistura de reciclado, incompatibilidade/contaminação, dispersão, estado de telas, cabeçote e lábio da matriz.']);
 if(s.includes('unstableBubble'))out.push(['Balão instável','Verificar anel de ar, centralização do cabeçote, distribuição de fluxo, alinhamento e tração/puxador antes de atribuir à rosca.']);
 if(s.includes('gelsHoles'))out.push(['Gel / furos','Verificar contaminação, degradação térmica, material mal fundido, mistura e pontos de retenção no conjunto de extrusão.']);
 if(s.includes('pressureOsc'))out.push(['Pressão oscilando','Observar alimentação, ponte/escorregamento na garganta, variação do reciclado, tela e estabilidade da rotação.']);
 if(s.includes('sideLoose'))out.push(['Uma lateral frouxa','Verificar alinhamento do balão, puxador, rolos, distribuição de ar e uniformidade de espessura/fluxo.']);
 if(!out.length)out.push(['Sem sintomas marcados','Marque os sintomas observados para o assistente cruzar os dados com pontos de atenção e testes sugeridos.']);
 return out;
}

function renderOperation(){renderZoneCards('diagZoneGrid');renderGeometry();renderStandardBox()}
function renderAnalysis(){
 const t=capture(),r=shearReading(t);renderZoneCards('diagZoneGridAnalysis');
 setText('diagShearLevel',r.level);setText('diagMaxDelta',r.h.max>0?signed(r.h.max,0,'°C'):'—');setText('diagAvgDelta',r.h.avg>0?signed(r.h.avg,1,'°C'):'—');setText('diagYield',t.production>0&&t.screwRpm>0?fmt(t.production/t.screwRpm,3)+' kg/h/RPM':'—');
 const b=$('diagShearBadge');if(b){b.className='levelBadge '+(r.level==='ELEVADO'?'high':r.level==='MODERADO'?'mid':'low');b.textContent='Ponto de atenção: cisalhamento aparente '+r.level+' • escore interno '+r.score}
 const rs=$('diagReasons');if(rs)rs.innerHTML=(r.reasons.length?r.reasons:['Não há dados suficientes indicando autoaquecimento/cisalhamento elevado neste momento.']).map(x=>'<div class="diagItem">'+esc(x)+'</div>').join('');
 const sg=$('diagSymptomAnalysis');if(sg)sg.innerHTML=symptomGuidance(t).map(x=>'<div class="diagItem"><b>'+esc(x[0])+':</b> '+esc(x[1])+'</div>').join('');renderStandardCompare(t);
}

function renderStandardBox(){const mid=val('diagMachine'),std=standards()[mid],box=$('diagStandardBox');if(!box)return;if(!std){box.className='standardBox empty';box.textContent='Nenhum padrão bom salvo para esta máquina.';return}const h=heatMetrics(std);box.className='standardBox';box.innerHTML='<b>⭐ PADRÃO BOM:</b> '+esc(std.testName||std.material||'Teste')+' • '+fmt(std.production,1)+' kg/h • '+fmt(std.pressure,0)+' pressão • '+fmt(std.current,1)+' A • ΔT médio +'+fmt(h.avg,1)+'°C • '+esc(nowText(std.createdAt))}
function renderStandardCompare(t){const box=$('diagStandardCompare');if(!box)return;const std=standards()[t.machineId];if(!std){box.innerHTML='<div class="diagItem">Nenhum padrão bom salvo para a máquina selecionada.</div>';return}const h=heatMetrics(t),hs=heatMetrics(std),items=[];if(t.production>0&&std.production>0)items.push('Produção: '+signed(t.production-std.production,1,' kg/h')+' versus padrão.');if(t.pressure>0&&std.pressure>0)items.push('Pressão: '+signed(t.pressure-std.pressure,0)+' versus padrão.');if(t.current>0&&std.current>0)items.push('Corrente: '+signed(t.current-std.current,1,' A')+' versus padrão.');items.push('ΔT médio positivo: '+signed(h.avg-hs.avg,1,'°C')+' versus padrão.');if(t.screwRpm>0&&std.screwRpm>0&&t.production>0&&std.production>0)items.push('Rendimento kg/h/RPM: '+signed(t.production/t.screwRpm-std.production/std.screwRpm,3)+' versus padrão.');box.innerHTML=items.map(x=>'<div class="diagItem">'+esc(x)+'</div>').join('')}

function saveTest(){const t=capture();if(!t.machineId){setMsg('diagSaveMsg','Selecione a máquina.','warn');return}if(!t.client){setMsg('diagSaveMsg','Informe o cliente.','warn');return}if(!(t.production>0||t.current>0||t.pressure>0||t.zones.some(z=>z.real>0))){setMsg('diagSaveMsg','Preencha os dados do teste antes de salvar.','warn');return}let a=tests();a.unshift(t);if(a.length>200)a.length=200;if(!writeJSON(TESTS,a)){setMsg('diagSaveMsg','Não foi possível salvar neste aparelho.','err');return}setMsg('diagSaveMsg','✅ Teste salvo: '+(t.testName||t.material)+' / '+t.machineName+'.','ok');refreshTests();renderReportPreview()}
function saveStandard(){const t=capture();if(!t.machineId){setMsg('diagSaveMsg','Selecione a máquina.','warn');return}const st=standards();st[t.machineId]=t;if(!writeJSON(STANDARDS,st)){setMsg('diagSaveMsg','Não foi possível salvar o padrão.','err');return}setMsg('diagSaveMsg','⭐ Padrão bom salvo para '+(t.machineName||'a máquina')+'.','ok');renderStandardBox();renderAnalysis()}
function setMsg(id,text,kind){const e=$(id);if(e){e.textContent=text;e.className='status '+(kind||'')}}

function testSummary(t){const h=heatMetrics(t),r=shearReading(t);return[['Material',t.material||'—'],['Produção',t.production>0?fmt(t.production,1)+' kg/h':'—'],['RPM rosca',t.screwRpm>0?fmt(t.screwRpm,1):'—'],['Rendimento',t.production>0&&t.screwRpm>0?fmt(t.production/t.screwRpm,3):'—'],['Corrente',t.current>0?fmt(t.current,1)+' A':'—'],['Pressão',t.pressure>0?fmt(t.pressure,0):'—'],['ΔT máx.',h.max>0?signed(h.max,0,'°C'):'—'],['ΔT médio',h.avg>0?signed(h.avg,1,'°C'):'—'],['Cisalhamento aparente',r.level]]}
function renderCompareCard(id,title,t){const e=$(id);if(!e)return;if(!t){e.innerHTML='<h3>'+title+'</h3><small>Selecione um teste.</small>';return}e.innerHTML='<h3>'+title+'</h3><small>'+esc((t.machineName||'Máquina')+' • '+(t.client||'Cliente')+' • '+(t.testName||nowText(t.createdAt)))+'</small>'+testSummary(t).map(x=>'<div class="compareLine"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('')}
function renderCompare(){const a=testById(val('diagCompareA')),b=testById(val('diagCompareB'));renderCompareCard('diagCompareCardA','TESTE A',a);renderCompareCard('diagCompareCardB','TESTE B',b);const out=$('diagCompareDiff');if(!out)return;if(!(a&&b)){out.innerHTML='<div class="diagItem">Selecione dois testes para comparar.</div>';return}const ha=heatMetrics(a),hb=heatMetrics(b),items=[];if(a.production>0&&b.production>0)items.push('Produção B − A: '+signed(b.production-a.production,1,' kg/h'));if(a.screwRpm>0&&b.screwRpm>0&&a.production>0&&b.production>0)items.push('Rendimento B − A: '+signed(b.production/b.screwRpm-a.production/a.screwRpm,3,' kg/h/RPM'));if(a.current>0&&b.current>0)items.push('Corrente B − A: '+signed(b.current-a.current,1,' A'));if(a.pressure>0&&b.pressure>0)items.push('Pressão B − A: '+signed(b.pressure-a.pressure,0));items.push('ΔT médio B − A: '+signed(hb.avg-ha.avg,1,'°C'));if(a.material!==b.material)items.unshift('Comparação de material: '+a.material+' → '+b.material+'.');out.innerHTML=items.map(x=>'<div class="diagItem">'+esc(x)+'</div>').join('')}
function renderTestList(){const box=$('diagTestList');if(!box)return;const a=tests();if(!a.length){box.innerHTML='<div class="empty">Nenhum teste salvo.</div>';return}box.innerHTML='';a.slice(0,30).forEach(t=>{const r=document.createElement('div');r.className='testRow';const d=document.createElement('div');const h=heatMetrics(t);d.innerHTML='<b>'+esc(t.machineName||'Máquina')+' • '+esc(t.client||'Cliente')+'</b><small>'+esc(t.material||'')+' • '+esc(t.testName||'Teste')+' • '+fmt(t.production,1)+' kg/h • ΔT '+fmt(h.avg,1)+'°C • '+esc(nowText(t.createdAt))+'</small>';const use=document.createElement('button');use.className='btn secondary';use.type='button';use.textContent='USAR A/B';use.onclick=()=>{if($('diagCompareA'))$('diagCompareA').value=t.id;renderCompare()};const del=document.createElement('button');del.className='btn danger';del.type='button';del.textContent='EXCLUIR';del.onclick=()=>{writeJSON(TESTS,tests().filter(x=>x.id!==t.id));refreshTests();renderCompare()};r.append(d,use,del);box.appendChild(r)})}

function reportData(){const t=capture(),r=shearReading(t),guides=symptomGuidance(t),std=standards()[t.machineId]||null;return{t,r,guides,std}}
function reportHtmlBody(){
 const d=reportData(),t=d.t,r=d.r,g=t.geometry||{},std=d.std;let html='';
 html+='<h3>Identificação</h3><b>Cliente:</b> '+esc(t.client||'—')+'<br><b>Máquina:</b> '+esc(t.machineName||'—')+'<br><b>Material:</b> '+esc(t.material||'—')+'<br><b>Teste:</b> '+esc(t.testName||'—')+'<br><b>Data:</b> '+esc(nowText(t.createdAt));
 html+='<h3>Dados de operação</h3>RPM motor: <b>'+esc(t.motorRpm>0?fmt(t.motorRpm,0):'—')+'</b> • RPM rosca: <b>'+esc(t.screwRpm>0?fmt(t.screwRpm,1):'—')+'</b><br>Produção: <b>'+esc(t.production>0?fmt(t.production,1)+' kg/h':'—')+'</b> • Corrente: <b>'+esc(t.current>0?fmt(t.current,1)+' A':'—')+'</b> • Pressão: <b>'+esc(t.pressure>0?fmt(t.pressure,0):'—')+'</b>';
 html+='<h3>Temperaturas</h3>'+t.zones.map(z=>'Zona '+z.zone+': programada <b>'+(z.set>0?fmt(z.set,0)+'°C':'—')+'</b> • real <b>'+(z.real>0?fmt(z.real,0)+'°C':'—')+'</b> • ΔT <b>'+(Number.isFinite(z.delta)?signed(z.delta,0,'°C'):'—')+'</b>').join('<br>');
 html+='<h3>Geometria vinculada</h3>Diâmetro: <b>'+(g.D>0?fmt(g.D,1)+' mm':'—')+'</b> • alimentação: <b>'+(g.feed>0?fmt(g.feed,3)+' mm':'—')+'</b> • dosagem: <b>'+(g.meter>0?fmt(g.meter,3)+' mm':'—')+'</b><br>Taxa: <b>'+(g.ratio>0?fmt(g.ratio,2)+':1':'—')+'</b> • compressão: <b>'+(g.compD>0?fmt(g.compD,2)+' D':'—')+'</b> • redução: <b>'+(g.redD>0?fmt(g.redD,2)+'%/D':'—')+'</b>';
 html+='<h3>Leitura de cisalhamento aparente</h3><b>'+esc(r.level)+'</b> • maior ΔT '+fmt(r.h.max,0)+'°C • média positiva '+fmt(r.h.avg,1)+'°C.<br>'+esc((r.reasons.length?r.reasons:['Sem alerta forte pelos dados preenchidos.']).join(' '));
 html+='<h3>Pontos de atenção e testes</h3>'+d.guides.map(x=>'<b>'+esc(x[0])+':</b> '+esc(x[1])).join('<br><br>');
 if(std){const hs=heatMetrics(std);html+='<h3>Comparação com padrão bom</h3>Produção padrão: <b>'+fmt(std.production,1)+' kg/h</b> • pressão: <b>'+fmt(std.pressure,0)+'</b> • corrente: <b>'+fmt(std.current,1)+' A</b> • ΔT médio: <b>'+fmt(hs.avg,1)+'°C</b>.'}
 if(t.note)html+='<h3>Observação</h3>'+esc(t.note);
 html+='<h3>Observação técnica</h3>Este relatório é uma ferramenta de apoio de campo. As indicações são pontos de atenção e não constituem diagnóstico definitivo. Alterações de rosca, rotação, temperatura, pressão, telas ou componentes devem respeitar os limites e procedimentos seguros da máquina e do fabricante.';
 return html;
}
function renderReportPreview(){const box=$('diagReportPreview');if(box)box.innerHTML=reportHtmlBody()}
function reportText(){const d=reportData(),t=d.t,r=d.r,g=t.geometry||{};let s='DF EXTRUSOR • RELATÓRIO TÉCNICO\n\n';s+='Cliente: '+(t.client||'—')+'\nMáquina: '+(t.machineName||'—')+'\nMaterial: '+(t.material||'—')+'\nTeste: '+(t.testName||'—')+'\n\n';s+='OPERAÇÃO\nProdução: '+(t.production?fmt(t.production,1)+' kg/h':'—')+'\nRPM rosca: '+(t.screwRpm?fmt(t.screwRpm,1):'—')+'\nCorrente: '+(t.current?fmt(t.current,1)+' A':'—')+'\nPressão: '+(t.pressure?fmt(t.pressure,0):'—')+'\n\n';s+='TEMPERATURAS\n'+t.zones.map(z=>'Z'+z.zone+': '+(z.set?fmt(z.set,0):'—')+' → '+(z.real?fmt(z.real,0):'—')+' °C | ΔT '+(Number.isFinite(z.delta)?signed(z.delta,0,'°C'):'—')).join('\n')+'\n\n';s+='GEOMETRIA\nTaxa '+(g.ratio?fmt(g.ratio,2)+':1':'—')+' | compressão '+(g.compD?fmt(g.compD,2)+' D':'—')+' | redução '+(g.redD?fmt(g.redD,2)+'%/D':'—')+'\n\n';s+='CISALHAMENTO APARENTE: '+r.level+'\n'+(r.reasons.length?r.reasons.join(' '):'Sem alerta forte pelos dados preenchidos.')+'\n\n';s+='PONTOS DE ATENÇÃO\n'+d.guides.map(x=>'- '+x[0]+': '+x[1]).join('\n')+'\n\nFerramenta de apoio; não é diagnóstico definitivo.';return s}
function printReport(){const body=reportHtmlBody(),w=window.open('','_blank');if(!w){setMsg('diagReportMsg','O navegador bloqueou a janela. Permita pop-ups e tente novamente.','warn');return}w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório Técnico DF Extrusor</title><style>body{font-family:Arial,sans-serif;color:#111;padding:24px;line-height:1.5;max-width:820px;margin:auto}h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;color:#555;margin:0 0 22px}h3{font-size:14px;border-bottom:1px solid #ccc;padding-bottom:5px;margin-top:18px}b{font-weight:700}.foot{margin-top:28px;border-top:1px solid #ccc;padding-top:10px;font-size:10px;color:#555}@media print{body{padding:0}}</style></head><body><h1>DF EXTRUSOR • RELATÓRIO TÉCNICO</h1><h2>Análise de extrusão / cisalhamento aparente</h2>'+body+'<div class="foot">DF Manutenção e Consultoria • Relatório gerado pelo DF Extrusor</div><script>setTimeout(function(){window.print()},400)<\/script></body></html>');w.document.close();setMsg('diagReportMsg','Relatório aberto. No iPhone use Imprimir → Compartilhar/Salvar em PDF.','ok')}
function whats(){const u='https://wa.me/?text='+encodeURIComponent(reportText());window.open(u,'_blank')}
async function copyReport(){try{await navigator.clipboard.writeText(reportText());setMsg('diagReportMsg','✅ Texto do relatório copiado.','ok')}catch(e){setMsg('diagReportMsg','Não foi possível copiar automaticamente.','warn')}}

function bind(){
 if(!ensureUi())return false;
 if($('diagMenuButton')&&!$('diagMenuButton').dataset.bound){$('diagMenuButton').dataset.bound='1';$('diagMenuButton').addEventListener('click',openPage)}
 if($('diagBack')&&!$('diagBack').dataset.bound){$('diagBack').dataset.bound='1';$('diagBack').addEventListener('click',backHome)}
 document.querySelectorAll('[data-diag-tab]').forEach(b=>{if(!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',()=>setTab(b.dataset.diagTab))}});
 const watch=['diagClient','diagMaterial','diagTestName','diagMotorRpm','diagScrewRpm','diagProduction','diagCurrent','diagPressure','diagNote','diagIntensity'];for(let z=1;z<=5;z++){watch.push('diagSet'+z,'diagReal'+z)}watch.forEach(id=>{const e=$(id);if(e&&!e.dataset.bound){e.dataset.bound='1';e.addEventListener('input',()=>{renderOperation();renderReportPreview()});e.addEventListener('change',()=>{renderOperation();renderReportPreview()})}});
 if($('diagMachine')&&!$('diagMachine').dataset.bound){$('diagMachine').dataset.bound='1';$('diagMachine').addEventListener('change',function(){try{if(this.value)localStorage.setItem(LAST_MACHINE,this.value)}catch(e){}refreshIntensity();renderOperation();renderReportPreview()})}
 document.querySelectorAll('#diagSymptoms input').forEach(e=>{if(!e.dataset.bound){e.dataset.bound='1';e.addEventListener('change',()=>{renderAnalysis();renderReportPreview()})}});
 if($('diagSaveTest')&&!$('diagSaveTest').dataset.bound){$('diagSaveTest').dataset.bound='1';$('diagSaveTest').addEventListener('click',saveTest)}
 if($('diagSaveStandard')&&!$('diagSaveStandard').dataset.bound){$('diagSaveStandard').dataset.bound='1';$('diagSaveStandard').addEventListener('click',saveStandard)}
 if($('diagGoAnalysis')&&!$('diagGoAnalysis').dataset.bound){$('diagGoAnalysis').dataset.bound='1';$('diagGoAnalysis').addEventListener('click',()=>setTab('analysis'))}
 ['diagCompareA','diagCompareB'].forEach(id=>{const e=$(id);if(e&&!e.dataset.bound){e.dataset.bound='1';e.addEventListener('change',renderCompare)}});
 if($('diagPrint')&&!$('diagPrint').dataset.bound){$('diagPrint').dataset.bound='1';$('diagPrint').addEventListener('click',printReport)}
 if($('diagWhats')&&!$('diagWhats').dataset.bound){$('diagWhats').dataset.bound='1';$('diagWhats').addEventListener('click',whats)}
 if($('diagCopy')&&!$('diagCopy').dataset.bound){$('diagCopy').dataset.bound='1';$('diagCopy').addEventListener('click',copyReport)}
 return true;
}

function boot(){let n=0;const t=setInterval(()=>{n++;if(bind()||n>60){clearInterval(t);refreshSelectors();renderOperation();renderReportPreview()}},100);window.addEventListener('pageshow',()=>setTimeout(()=>{bind();refreshSelectors();renderOperation();renderReportPreview()},150))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();