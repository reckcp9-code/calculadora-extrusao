(function(){
'use strict';
if(window.DFScrewProjectDimensionV14)return;
window.DFScrewProjectDimensionV14=true;

var MACHINES='df_private_extruder_calc_machines_v1';
var $=function(id){return document.getElementById(id)};
function num(v){var s=String(v==null?'':v).trim().replace(/\s/g,'');if(!s)return 0;if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');var x=Number(s);return Number.isFinite(x)?x:0}
function fmt(v,d){d=d==null?2:d;return Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d}):'—'}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function loadMachines(){try{var a=JSON.parse(localStorage.getItem(MACHINES)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function saveMachines(a){try{localStorage.setItem(MACHINES,JSON.stringify(a))}catch(e){}}
function setv(id,v){var e=$(id);if(e)e.value=v==null?'':v}
function field(label,id,ph){return '<div class="field"><label>'+label+'</label><input id="'+id+'" inputmode="decimal" placeholder="'+ph+'"></div>'}

function style(){
  if($('ps14Style'))return;
  var s=document.createElement('style');s.id='ps14Style';s.textContent=
  '.ps14Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ps14Kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.ps14Kpi{border:1px solid #334155;background:#0b1220;border-radius:13px;padding:10px}.ps14Kpi span{display:block;color:#94a3b8;font-size:10px;font-weight:850}.ps14Kpi b{display:block;margin-top:4px;font-size:16px}.ps14Table{margin-top:10px;border:1px solid #263244;border-radius:13px;overflow:hidden}.ps14Row{display:grid;grid-template-columns:1.05fr .8fr 1fr 1fr;gap:7px;padding:9px 10px;border-bottom:1px solid #263244;align-items:center}.ps14Row:last-child{border-bottom:0}.ps14Row span{font-size:10px;color:#94a3b8}.ps14Row b{font-size:11px}.ps14Graph{margin-top:12px;border:1px solid #334155;background:#07101d;border-radius:14px;padding:10px;overflow:hidden}.ps14Graph svg{display:block;width:100%;height:auto;min-height:190px}.ps14Compare{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.ps14CompareBox{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:11px}.ps14CompareBox.projected{border-color:#9a6b00;background:#171207}.ps14CompareBox h4{margin:0 0 8px;font-size:12px}.ps14Line{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #263244;font-size:11px}.ps14Line:last-child{border-bottom:0}.ps14Line span{color:#94a3b8}.ps14Warn{margin-top:10px;border:1px solid #7c5b12;background:#171207;color:#fde68a;border-radius:12px;padding:10px;font-size:11px;line-height:1.5}.ps14Ok{border-color:#166534;background:#081a10;color:#86efac}.ps14Mode{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}.ps14Mode select{width:100%}.ps14Mini{color:#94a3b8;font-size:10px;line-height:1.45;margin-top:7px}@media(max-width:560px){.ps14Grid,.ps14Compare{grid-template-columns:1fr}.ps14Kpis{grid-template-columns:1fr 1fr}.ps14Row{grid-template-columns:1fr .7fr .9fr .9fr;padding:8px 7px}.ps14Row b{font-size:10px}}';
  document.head.appendChild(s);
}

function defaults(){return{diameter:55,ld:32,feedD:14,compressionD:10,meterD:8,feedDepth:6,compressionRatio:3,lowShear:'on'}}
function selectedMachine(){var id=$('spM')&&$('spM').value;if(!id)return null;return loadMachines().find(function(m){return m&&m.id===id})||null}
function savedData(){var m=selectedMachine(),p=m&&m.screwProject&&m.screwProject.dimensioningV14;return p&&typeof p==='object'?p:null}

function build(){
  var page=$('screwProjectPage');if(!page||$('ps14Card'))return !!page;
  style();
  var cards=page.querySelectorAll(':scope > .card');
  var anchor=cards.length>1?cards[1]:cards[0];
  var c=document.createElement('div');c.className='card';c.id='ps14Card';
  c.innerHTML='<h2>Projeto automático da rosca</h2><div class="hint">Digite os dados abaixo. Comprimentos, profundidade final, núcleo e transição são calculados automaticamente.</div>'+ 
    '<div class="ps14Grid" style="margin-top:10px">'+
      field('Diâmetro da rosca (mm)','ps14D','55')+
      field('L/D total','ps14LD','32')+
      field('Alimentação (D)','ps14F','14')+
      field('Compressão / transição (D)','ps14C','10')+
      field('Dosagem (D)','ps14Z','8')+
      field('Profundidade alimentação (mm)','ps14FD','6')+
      field('Taxa de compressão','ps14CR','3')+
    '</div>'+ 
    '<div class="ps14Kpis"><div class="ps14Kpi"><span>PROFUNDIDADE FINAL</span><b id="ps14Final">—</b></div><div class="ps14Kpi"><span>COMPRIMENTO TOTAL</span><b id="ps14Total">—</b></div><div class="ps14Kpi"><span>SOMA DAS ZONAS</span><b id="ps14Sum">—</b></div></div>'+ 
    '<div class="ps14Table"><div class="ps14Row"><b>ZONA</b><b>D</b><b>mm</b><b>PROFUNDIDADE</b></div><div class="ps14Row"><span>Alimentação</span><b id="ps14FO">—</b><b id="ps14FM">—</b><b id="ps14FDO">—</b></div><div class="ps14Row"><span>Compressão</span><b id="ps14CO">—</b><b id="ps14CM">—</b><b id="ps14CDO">—</b></div><div class="ps14Row"><span>Dosagem</span><b id="ps14ZO">—</b><b id="ps14ZM">—</b><b id="ps14ZDO">—</b></div></div>'+ 
    '<div class="ps14Kpis"><div class="ps14Kpi"><span>NÚCLEO NA ALIMENTAÇÃO</span><b id="ps14CoreF">—</b></div><div class="ps14Kpi"><span>NÚCLEO NA DOSAGEM</span><b id="ps14CoreZ">—</b></div><div class="ps14Kpi"><span>VARIAÇÃO NA COMPRESSÃO</span><b id="ps14Slope">—</b></div></div>'+ 
    '<div id="ps14Check" class="ps14Warn"></div>'+ 
    '<div class="ps14Graph"><div style="font-weight:900;margin-bottom:7px">Vista lateral aproximada da rosca</div><div id="ps14Svg"></div><div class="ps14Mini">O desenho é esquemático. Ele representa a mudança de profundidade do canal e não define passo, filete, folgas ou resistência mecânica.</div></div>'+ 
    '<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Transição linear na compressão</h3><div id="ps14Transition" class="ps14Table"></div></div>'+ 
    '<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Dimensionar para menos cisalhamento</h3><div class="ps14Mode"><select id="ps14Low"><option value="on">Comparar opção com transição mais longa, mantendo a mesma taxa</option><option value="off">Desligado</option></select></div><div id="ps14Compare"></div><div class="ps14Warn"><b>Aviso:</b> esta comparação é somente geométrica e preliminar. Menor variação de profundidade por D pode reduzir a concentração da compressão, mas o resultado real depende de passo, largura de filete, folgas, RPM, torque, material, temperatura, pressão e projeto mecânico. Validar tecnicamente antes de usinar ou fabricar.</div></div>';
  if(anchor&&anchor.nextSibling)anchor.parentNode.insertBefore(c,anchor.nextSibling);else page.appendChild(c);
  ['ps14D','ps14LD','ps14F','ps14C','ps14Z','ps14FD','ps14CR','ps14Low'].forEach(function(id){var e=$(id);if(e){e.addEventListener('input',calc);e.addEventListener('change',calc)}});
  var sm=$('spM');if(sm)sm.addEventListener('change',function(){setTimeout(loadForMachine,50)});
  var sb=$('spSave');if(sb)sb.addEventListener('click',function(){setTimeout(saveDimensioning,0)},true);
  loadForMachine();
  return true;
}

function loadForMachine(){
  if(!$('ps14D'))return;
  var d=savedData()||defaults();
  setv('ps14D',d.diameter||55);setv('ps14LD',d.ld||32);setv('ps14F',d.feedD==null?14:d.feedD);setv('ps14C',d.compressionD==null?10:d.compressionD);setv('ps14Z',d.meterD==null?8:d.meterD);setv('ps14FD',d.feedDepth||6);setv('ps14CR',d.compressionRatio||3);setv('ps14Low',d.lowShear||'on');calc();
}

function syncLegacy(v){
  var map={spD:v.D,spLD:v.LD,spF:v.F,spC:v.C,spZ:v.Z,spFD:v.feedDepth,spZD:v.finalDepth};
  Object.keys(map).forEach(function(id){var e=$(id);if(!e)return;var nv=String(map[id]);if(String(e.value)!==nv){e.value=nv;try{e.dispatchEvent(new Event('input',{bubbles:true}))}catch(err){}}});
}

function transitionRows(v){
  if(!(v.C>0&&v.D>0&&v.feedDepth>0&&v.finalDepth>0))return '<div class="ps14Row"><span>Preencha os dados</span><b>—</b><b>—</b><b>—</b></div>';
  var pts=[],maxRows=24;
  if(v.C<=maxRows){for(var i=0;i<=Math.floor(v.C);i++)pts.push(i);if(Math.abs(v.C-Math.floor(v.C))>.001)pts.push(v.C)}else{for(var j=0;j<=12;j++)pts.push(v.C*j/12)}
  if(pts[pts.length-1]!==v.C)pts.push(v.C);
  return '<div class="ps14Row"><b>POSIÇÃO</b><b>D</b><b>mm</b><b>CANAL</b></div>'+pts.map(function(x){var depth=v.feedDepth-(v.feedDepth-v.finalDepth)*(x/v.C),posD=v.F+x,posMm=posD*v.D,core=v.D-2*depth;return '<div class="ps14Row"><span>Compressão</span><b>'+fmt(posD,2)+'D</b><b>'+fmt(posMm,1)+' mm</b><b>'+fmt(depth,3)+' mm<br><small style="color:#94a3b8">núcleo '+fmt(core,2)+' mm</small></b></div>'}).join('');
}

function graph(v){
  if(!(v.D>0&&v.LD>0&&v.feedDepth>0&&v.finalDepth>0))return '<div class="empty">Preencha os dados para gerar o gráfico.</div>';
  var W=760,H=220,l=34,r=22,top=35,bot=185,mid=(top+bot)/2,usable=W-l-r,total=v.LD,scale=(bot-top)/(v.D||1),x=function(d){return l+usable*(d/total)},yTop=function(depth){return top+depth*scale},yBot=function(depth){return bot-depth*scale};
  var xF=x(v.F),xC=x(v.F+v.C),xEnd=x(v.LD),ptsT=[],ptsB=[];
  ptsT.push(l+','+yTop(v.feedDepth));ptsT.push(xF+','+yTop(v.feedDepth));
  var steps=Math.max(4,Math.min(40,Math.ceil(v.C*2)));
  for(var i=0;i<=steps;i++){var q=i/steps,d=v.feedDepth-(v.feedDepth-v.finalDepth)*q,xx=x(v.F+v.C*q);ptsT.push(xx+','+yTop(d));ptsB.push(xx+','+yBot(d))}
  ptsT.push(xEnd+','+yTop(v.finalDepth));ptsB.unshift(l+','+yBot(v.feedDepth));ptsB.unshift(xF+','+yBot(v.feedDepth));ptsB.push(xEnd+','+yBot(v.finalDepth));
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Perfil lateral aproximado da rosca">'+
    '<rect x="'+l+'" y="20" width="'+(xF-l)+'" height="180" fill="rgba(37,99,235,.10)"/><rect x="'+xF+'" y="20" width="'+(xC-xF)+'" height="180" fill="rgba(245,158,11,.11)"/><rect x="'+xC+'" y="20" width="'+(xEnd-xC)+'" height="180" fill="rgba(34,197,94,.09)"/>'+
    '<line x1="'+l+'" y1="'+top+'" x2="'+xEnd+'" y2="'+top+'" stroke="#64748b" stroke-width="2"/><line x1="'+l+'" y1="'+bot+'" x2="'+xEnd+'" y2="'+bot+'" stroke="#64748b" stroke-width="2"/>'+
    '<polyline points="'+ptsT.join(' ')+'" fill="none" stroke="#ffd36a" stroke-width="4" stroke-linejoin="round"/><polyline points="'+ptsB.join(' ')+'" fill="none" stroke="#ffd36a" stroke-width="4" stroke-linejoin="round"/>'+
    '<line x1="'+xF+'" y1="20" x2="'+xF+'" y2="200" stroke="#334155" stroke-dasharray="5 5"/><line x1="'+xC+'" y1="20" x2="'+xC+'" y2="200" stroke="#334155" stroke-dasharray="5 5"/>'+
    '<text x="'+((l+xF)/2)+'" y="16" text-anchor="middle" fill="#93c5fd" font-size="12">ALIMENTAÇÃO '+fmt(v.F,1)+'D</text><text x="'+((xF+xC)/2)+'" y="16" text-anchor="middle" fill="#fbbf24" font-size="12">COMPRESSÃO '+fmt(v.C,1)+'D</text><text x="'+((xC+xEnd)/2)+'" y="16" text-anchor="middle" fill="#86efac" font-size="12">DOSAGEM '+fmt(v.Z,1)+'D</text>'+
    '<text x="'+l+'" y="215" fill="#94a3b8" font-size="11">0 mm</text><text x="'+xEnd+'" y="215" text-anchor="end" fill="#94a3b8" font-size="11">'+fmt(v.D*v.LD,0)+' mm</text></svg>';
}

function lowShear(v){
  var box=$('ps14Compare');if(!box)return;
  if(($('ps14Low')&&$('ps14Low').value)==='off'){box.innerHTML='';return}
  if(!(v.LD>0&&v.C>0&&v.F>0&&v.Z>0&&v.feedDepth>v.finalDepth)){box.innerHTML='<div class="ps14Warn">Preencha os dados para comparar.</div>';return}
  var add=Math.min(2,Math.max(0,v.F-1)+Math.max(0,v.Z-1));
  if(add<=0){box.innerHTML='<div class="ps14Warn">Não há margem geométrica nas zonas informadas para alongar a compressão mantendo o L/D total.</div>';return}
  var takeF=Math.min(add/2,Math.max(0,v.F-1)),takeZ=add-takeF;if(takeZ>Math.max(0,v.Z-1)){var extra=takeZ-Math.max(0,v.Z-1);takeZ-=extra;takeF+=extra}
  var altF=v.F-takeF,altZ=v.Z-takeZ,altC=v.C+add;
  var slopeNow=(v.feedDepth-v.finalDepth)/v.C,slopeAlt=(v.feedDepth-v.finalDepth)/altC;
  box.innerHTML='<div class="ps14Compare"><div class="ps14CompareBox"><h4>CONFIGURAÇÃO INFORMADA</h4><div class="ps14Line"><span>Zonas</span><b>'+fmt(v.F,1)+'D / '+fmt(v.C,1)+'D / '+fmt(v.Z,1)+'D</b></div><div class="ps14Line"><span>Compressão</span><b>'+fmt(v.C*v.D,0)+' mm</b></div><div class="ps14Line"><span>Taxa</span><b>'+fmt(v.rate,2)+':1</b></div><div class="ps14Line"><span>Queda de canal por D</span><b>'+fmt(slopeNow,3)+' mm/D</b></div></div><div class="ps14CompareBox projected"><h4>TRANSiÇÃO MAIS LONGA — COMPARAÇÃO</h4><div class="ps14Line"><span>Zonas</span><b>'+fmt(altF,1)+'D / '+fmt(altC,1)+'D / '+fmt(altZ,1)+'D</b></div><div class="ps14Line"><span>Compressão</span><b>'+fmt(altC*v.D,0)+' mm</b></div><div class="ps14Line"><span>Taxa mantida</span><b>'+fmt(v.rate,2)+':1</b></div><div class="ps14Line"><span>Queda de canal por D</span><b>'+fmt(slopeAlt,3)+' mm/D</b></div></div></div>';
}

function values(){
  var D=num($('ps14D')&&$('ps14D').value),LD=num($('ps14LD')&&$('ps14LD').value),F=num($('ps14F')&&$('ps14F').value),C=num($('ps14C')&&$('ps14C').value),Z=num($('ps14Z')&&$('ps14Z').value),feedDepth=num($('ps14FD')&&$('ps14FD').value),rate=num($('ps14CR')&&$('ps14CR').value),finalDepth=rate>0?feedDepth/rate:0;
  return{D:D,LD:LD,F:F,C:C,Z:Z,feedDepth:feedDepth,rate:rate,finalDepth:finalDepth,sum:F+C+Z};
}

function calc(){
  if(!$('ps14Card'))return;
  var v=values(),set=function(id,text){if($(id))$(id).textContent=text};
  set('ps14Final',v.finalDepth>0?fmt(v.finalDepth,3)+' mm':'—');set('ps14Total',v.D>0&&v.LD>0?fmt(v.D*v.LD,0)+' mm':'—');set('ps14Sum',fmt(v.sum,2)+'D');
  set('ps14FO',fmt(v.F,2)+'D');set('ps14CO',fmt(v.C,2)+'D');set('ps14ZO',fmt(v.Z,2)+'D');set('ps14FM',v.D&&v.F?fmt(v.D*v.F,0)+' mm':'—');set('ps14CM',v.D&&v.C?fmt(v.D*v.C,0)+' mm':'—');set('ps14ZM',v.D&&v.Z?fmt(v.D*v.Z,0)+' mm':'—');
  set('ps14FDO',v.feedDepth?fmt(v.feedDepth,3)+' mm':'—');set('ps14CDO',v.feedDepth&&v.finalDepth?fmt(v.feedDepth,3)+' → '+fmt(v.finalDepth,3)+' mm':'—');set('ps14ZDO',v.finalDepth?fmt(v.finalDepth,3)+' mm':'—');
  var coreF=v.D-2*v.feedDepth,coreZ=v.D-2*v.finalDepth;set('ps14CoreF',v.D&&v.feedDepth?fmt(coreF,2)+' mm':'—');set('ps14CoreZ',v.D&&v.finalDepth?fmt(coreZ,2)+' mm':'—');set('ps14Slope',v.C&&v.finalDepth?fmt((v.feedDepth-v.finalDepth)/v.C,3)+' mm/D':'—');
  var checks=[];if(v.LD>0&&Math.abs(v.sum-v.LD)>.001)checks.push('A soma das zonas é '+fmt(v.sum,2)+'D, mas o L/D informado é '+fmt(v.LD,2)+'D. Ajuste as zonas para fechar o comprimento total.');if(v.D>0&&(coreF<=0||coreZ<=0))checks.push('A profundidade informada gera diâmetro de núcleo inválido para este diâmetro de rosca.');if(v.rate>0&&v.rate<=1)checks.push('A taxa de compressão deve ser maior que 1 para esta simulação de redução de canal.');if(!checks.length)checks.push('Geometria fechando: profundidade final = alimentação ÷ taxa. A compressão é distribuída linearmente ao longo dos '+fmt(v.C,2)+'D informados.');
  var ch=$('ps14Check');if(ch){ch.className='ps14Warn'+(checks.length===1&&checks[0].indexOf('Geometria fechando')===0?' ps14Ok':'');ch.innerHTML=checks.map(function(x){return '<div>'+x+'</div>'}).join('')}
  if($('ps14Transition'))$('ps14Transition').innerHTML=transitionRows(v);if($('ps14Svg'))$('ps14Svg').innerHTML=graph(v);lowShear(v);syncLegacy(v);
}

function saveDimensioning(){
  var id=$('spM')&&$('spM').value;if(!id)return;var a=loadMachines(),i=a.findIndex(function(m){return m&&m.id===id});if(i<0)return;var v=values();a[i].screwProject=a[i].screwProject||{};a[i].screwProject.dimensioningV14={diameter:v.D,ld:v.LD,feedD:v.F,compressionD:v.C,meterD:v.Z,feedDepth:v.feedDepth,compressionRatio:v.rate,lowShear:$('ps14Low')?$('ps14Low').value:'on',finalDepth:v.finalDepth,updatedAt:new Date().toISOString()};saveMachines(a);var m=$('spSaveM');if(m){m.textContent='✅ Projeto e dimensionamento automático salvos nesta máquina.';m.className='status ok'}
}

function boot(){var tries=0,t=setInterval(function(){tries++;if(build()||tries>80)clearInterval(t)},100);window.addEventListener('pageshow',function(){setTimeout(function(){if(build())loadForMachine()},120)});window.addEventListener('df-ui-ready',function(){setTimeout(build,100)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
