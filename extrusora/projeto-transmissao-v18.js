(function(){
'use strict';
if(window.DFTransmissionProjectV18)return;
window.DFTransmissionProjectV18=true;
const KEY='df_private_extruder_calc_machines_v1';
const $=id=>document.getElementById(id);
const ids=['tpNominalRpm','tpNominalHz','tpActualHz','tpActualScrew','tpActualProduction','tpTargetHz','tpTargetScrew','tpMotorPulley'];
const example={tpNominalRpm:'1785',tpNominalHz:'60',tpActualHz:'43',tpActualScrew:'86',tpActualProduction:'242',tpTargetHz:'60',tpTargetScrew:'90',tpMotorPulley:'250'};
function num(value){let s=String(value??'').trim().replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');let v=Number(s);return s&&Number.isFinite(v)?v:0}
function fmt(v,d=1){return Number.isFinite(v)&&v>0?v.toLocaleString('pt-BR',{maximumFractionDigits:d}):'—'}
function machines(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function machine(){return machines().find(m=>m.id===$('spM')?.value)||null}
function set(id,value){$(id).value=value??''}
function values(){return Object.fromEntries(ids.map(id=>[id,$(id).value.trim()]))}
function fill(v){ids.forEach(id=>set(id,v?.[id]??(['tpNominalHz','tpTargetHz'].includes(id)?'60':id==='tpMotorPulley'?'250':'')));calc()}
function load(){const m=machine();fill(m?.transmissionProject||{tpNominalRpm:m?.motorNominalRpm||''});$('tpSave').disabled=!m;$('tpMachine').textContent=m?'Dados do projeto vinculados a '+m.name+'.':'Selecione uma máquina acima para salvar este projeto.';$('tpStatus').textContent=''}
function calc(){
  const v=Object.fromEntries(ids.map(id=>[id,num($(id).value)]));
  const valid=['tpActualHz','tpActualScrew','tpTargetHz','tpTargetScrew','tpMotorPulley'].every(id=>v[id]>0);
  const actualMotor=v.tpNominalRpm>0&&v.tpNominalHz>0?v.tpNominalRpm*v.tpActualHz/v.tpNominalHz:0;
  const reduction=actualMotor>0?actualMotor/v.tpActualScrew:0;
  const neededRatio=valid?(v.tpTargetHz/v.tpActualHz)*(v.tpActualScrew/v.tpTargetScrew):0;
  const neededDriven=v.tpMotorPulley*neededRatio;
  const primaryDiameter=valid?Math.round(neededDriven):0;
  const alternativeDiameter=valid?Math.ceil((neededDriven+0.001)/5)*5:0;
  const result=(driven)=>{
    const ratio=driven/v.tpMotorPulley;
    const rpm=v.tpActualScrew*(v.tpTargetHz/v.tpActualHz)/ratio;
    return {ratio,rpm,production:v.tpActualProduction*rpm/v.tpActualScrew};
  };
  const primary=valid?result(primaryDiameter):null;
  const alternative=valid&&alternativeDiameter!==primaryDiameter?result(alternativeDiameter):null;
  const output=(id,value,d=1,unit='')=>$(id).textContent=valid&&value>0?fmt(value,d)+unit:'—';
  output('tpMotorNow',actualMotor,1,' RPM');
  output('tpReduction',reduction,2,':1');
  output('tpRatioNeeded',neededRatio,3,':1');
  output('tpDrivenNeeded',neededDriven,1,' mm');
  output('tpPrimaryDiameter',primaryDiameter,0,' mm');
  output('tpPrimaryRatio',primary?.ratio,3,':1');
  output('tpPrimaryRpm',primary?.rpm,1,' RPM');
  output('tpPrimaryProduction',primary?.production,1,' kg/h');
  $('tpAlternative').hidden=!alternative;
  if(alternative){$('tpAlternativeTitle').textContent=fmt(v.tpMotorPulley,0)+' × '+fmt(alternativeDiameter,0)+' mm (arredondada para cima em 5 mm)';$('tpAlternativeRatio').textContent=fmt(alternative.ratio,3)+':1';$('tpAlternativeRpm').textContent=fmt(alternative.rpm,1)+' RPM';$('tpAlternativeProduction').textContent=fmt(alternative.production,1)+' kg/h'}
  $('tpPrimaryTitle').textContent=valid?fmt(v.tpMotorPulley,0)+' × '+fmt(primaryDiameter,0)+' mm (teórica, arredondada em 1 mm)':'Polias calculadas';
  $('tpExplanation').textContent=valid?'Relação necessária = (Hz desejado ÷ Hz atual) × (RPM atual da rosca ÷ RPM desejado). Polia movida = polia do motor × relação necessária. RPM projetado = RPM atual da rosca × (Hz desejado ÷ Hz atual) ÷ relação das novas polias. Produção estimada = produção atual × RPM projetado ÷ RPM atual da rosca. Pressupõe ligação direta 1:1 entre motor e caixa atualmente.':'Informe os valores atuais e o RPM desejado; as polias e resultados aparecem automaticamente.';
}
function save(){const m=machine();if(!m)return;const a=machines(),index=a.findIndex(x=>x.id===m.id);if(index<0)return;a[index]={...a[index],transmissionProject:values()};try{localStorage.setItem(KEY,JSON.stringify(a));$('tpStatus').textContent='Projeto de transmissão salvo nesta máquina.'}catch(e){$('tpStatus').textContent='Não foi possível salvar neste aparelho.'}}
function init(){const page=$('screwProjectPage'),anchor=$('ev17Summary')||$('ev16Card')||$('spSave')?.closest('.card');if(!page||!anchor||$('tpCard'))return;
  const style=document.createElement('style');style.textContent='.tpGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.tpResults{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}.tpPanel{padding:12px;border:1px solid #334155;border-radius:12px;background:#0f172a}.tpPanel b{display:block;color:#ffd36a;font-size:16px;margin:3px 0}.tpPanel small{display:block;color:#cbd5e1;line-height:1.55}.tpHint{font-size:11px;line-height:1.5;color:#cbd5e1;margin:8px 0}.tpCaution{padding:11px;background:#241a07;border:1px solid #8a5b00;border-radius:12px;color:#fde68a;font-size:11px;line-height:1.5}.tpButtons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}@media(max-width:560px){.tpGrid,.tpResults{grid-template-columns:1fr}}';document.head.appendChild(style);
  const card=document.createElement('div');card.className='card';card.id='tpCard';
  const input=(id,label,placeholder)=>'<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" inputmode="decimal" placeholder="'+placeholder+'"></div>';
  card.innerHTML='<h2>Projeto de Transmissão - cálculo automático</h2><p class="tpHint" id="tpMachine"></p><p class="tpHint">Informe como a máquina trabalha hoje e a rotação desejada. O app calcula a redução necessária e os diâmetros das polias.</p><div class="tpButtons"><button class="btn secondary" id="tpExample" type="button">CARREGAR EXEMPLO DA RECUPERADORA</button><button class="btn" id="tpSave" type="button">SALVAR NA MÁQUINA</button></div><h3>Como está hoje</h3><div class="grid tpGrid">'+
    input('tpActualHz','Frequência atual (Hz)','Ex.: 43')+input('tpActualScrew','RPM atual medido da rosca','Ex.: 86')+input('tpActualProduction','Produção atual (kg/h)','Ex.: 242')+
    '</div><h3>Como você deseja</h3><div class="grid tpGrid">'+
    input('tpTargetScrew','RPM desejado da rosca','Ex.: 90')+
    '</div><details class="tpHint"><summary>Ajustes avançados (valores sugeridos já preenchidos)</summary><div class="grid tpGrid">'+
    input('tpNominalRpm','RPM nominal do motor (para estimar redução da caixa)','Ex.: 1785')+input('tpNominalHz','Frequência nominal do motor (Hz)','60')+input('tpTargetHz','Frequência desejada do motor (Hz)','60')+input('tpMotorPulley','Diâmetro de referência da polia do motor (mm)','250')+
    '</div></details><div class="tpResults"><div class="tpPanel"><small>RPM atual do motor (estimado)</small><b id="tpMotorNow">—</b><small>Redução estimada da caixa</small><b id="tpReduction">—</b></div><div class="tpPanel"><small>Relação necessária para a meta</small><b id="tpRatioNeeded">—</b><small>Polia da caixa calculada (valor exato)</small><b id="tpDrivenNeeded">—</b></div><div class="tpPanel"><small id="tpPrimaryTitle">Polias calculadas</small><small>Polia da caixa: <span id="tpPrimaryDiameter">—</span> | Relação: <span id="tpPrimaryRatio">—</span></small><b id="tpPrimaryRpm">—</b><small>Produção proporcional: <span id="tpPrimaryProduction">—</span></small></div><div class="tpPanel" id="tpAlternative" hidden><small id="tpAlternativeTitle"></small><small>Relação: <span id="tpAlternativeRatio">—</span></small><b id="tpAlternativeRpm">—</b><small>Produção proporcional: <span id="tpAlternativeProduction">—</span></small></div></div><p id="tpExplanation" class="tpHint"></p><div class="tpCaution">Pressupõe acoplamento atual direto 1:1. Confirme RPM do motor e da rosca com tacômetro, dimensões reais das polias, capacidade radial da caixa, correias, eixos, alinhamento e proteção antes de fabricar. Diâmetros sugeridos são teóricos e a disponibilidade comercial depende do fabricante.</div><div id="tpStatus" class="status"></div>';
  anchor.insertAdjacentElement('afterend',card);
  ids.forEach(id=>$(id).addEventListener('input',calc));
  $('tpExample').addEventListener('click',()=>{fill(example);$('tpStatus').textContent='Exemplo carregado. Salve na máquina se quiser manter estes valores.'});
  $('tpSave').addEventListener('click',save);
  $('spM').addEventListener('change',load);
  load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{const t=setInterval(()=>{if($('screwProjectPage')&&($('ev17Summary')||$('ev16Card'))){clearInterval(t);init()}},100)},{once:true});
else{const t=setInterval(()=>{if($('screwProjectPage')&&($('ev17Summary')||$('ev16Card'))){clearInterval(t);init()}},100)}
})();
