(function(){
'use strict';
if(window.DFCompressionIntensityV8)return;
window.DFCompressionIntensityV8=true;

const MACHINES='df_private_extruder_calc_machines_v1';
const LAST_MACHINE='df_private_extruder_last_machine_v1';
const RECORDS='df_compression_intensity_records_v1';
const PAGE_ID='compressionIntensityPage';
const $=id=>document.getElementById(id);

function num(v){
  let s=String(v==null?'':v).trim().replace(/\s/g,'');
  if(!s)return 0;
  if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
  else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');
  const n=Number(s);
  return Number.isFinite(n)?n:0;
}
function fmt(v,d=2){return Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d}):'—'}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(e){return fallback}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
function machines(){const a=readJSON(MACHINES,[]);return Array.isArray(a)?a:[]}
function records(){const a=readJSON(RECORDS,[]);return Array.isArray(a)?a:[]}
function saveRecords(a){return writeJSON(RECORDS,a)}
function machineName(id){const m=machines().find(x=>x&&x.id===id);return m?String(m.name||id):id}
function when(iso){try{return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return ''}}

function injectStyle(){
  if($('dfCompressionIntensityStyle'))return;
  const s=document.createElement('style');
  s.id='dfCompressionIntensityStyle';
  s.textContent=`
  .menuTabs.dfIntensityMenu{grid-template-columns:repeat(2,1fr)}
  .ciHero{border:1px solid #5b4715;background:linear-gradient(180deg,#211400,#130f08);border-radius:18px;padding:14px;margin-top:11px}
  .ciHero b{color:var(--gold);font-size:13px}.ciHero p{color:#e5e7eb;font-size:11px;line-height:1.5;margin:6px 0 0}
  .ciResultGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
  .ciBadge{display:inline-flex;align-items:center;gap:7px;border:1px solid #334155;background:#0f172a;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:950;margin-top:10px}
  .ciBadge.suave{border-color:#166534;color:#86efac;background:#081a10}.ciBadge.moderada{border-color:#7a5600;color:#fde68a;background:#1b1303}.ciBadge.agressiva{border-color:#7f1d1d;color:#fca5a5;background:#230b0b}
  .ciActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .ciCompareSelectors{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .ciCompare{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
  .ciCompareBox{border:1px solid #334155;background:#0f172a;border-radius:15px;padding:12px;min-width:0}.ciCompareBox h3{margin:0 0 9px;color:#fff;font-size:12px}.ciCompareBox small{display:block;color:#94a3b8;line-height:1.35;margin-top:-4px;margin-bottom:7px}
  .ciCompareRow{padding:7px 0;border-bottom:1px solid #263244}.ciCompareRow:last-child{border-bottom:0}.ciCompareRow span{display:block;color:#94a3b8;font-size:9px}.ciCompareRow b{display:block;color:#f8fafc;font-size:13px;margin-top:2px;word-break:break-word}
  .ciHistory{display:grid;gap:7px;margin-top:9px}.ciHistoryRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid #263244;background:#0f172a;border-radius:13px;padding:10px}.ciHistoryRow b{font-size:12px}.ciHistoryRow small{display:block;color:#94a3b8;line-height:1.4;margin-top:3px}.ciHistoryRow button{width:auto;min-height:38px;padding:8px 10px}
  @media(max-width:560px){.menuTabs.dfIntensityMenu{grid-template-columns:1fr}.ciResultGrid,.ciCompareSelectors,.ciCompare,.ciActions{grid-template-columns:1fr}.ciHistoryRow{grid-template-columns:1fr}.ciHistoryRow button{width:100%}}
  `;
  document.head.appendChild(s);
}

function pageHtml(){return `
<section id="${PAGE_ID}" class="page">
  <div class="pageHead">
    <button class="back" id="ciBack" type="button" aria-label="Voltar">←</button>
    <div class="pageTitle"><h1>Intensidade de Compressão</h1><p>Geometria da zona de compressão • leitura comparativa</p></div>
  </div>

  <div class="ciHero">
    <b>LEITURA GEOMÉTRICA</b>
    <p>Calcula automaticamente a taxa de compressão, o comprimento da compressão em diâmetros da rosca (D) e a redução relativa da profundidade do canal por D.</p>
  </div>

  <div class="card">
    <h2>Máquina e cliente</h2>
    <div class="grid">
      <div class="field"><label>Máquina</label><select id="ciMachine"><option value="">Selecione a máquina</option></select></div>
      <div class="field"><label>Cliente</label><input id="ciClient" autocomplete="off" placeholder="Ex.: Saltiplas"></div>
    </div>
  </div>

  <div class="card">
    <h2>Dados da rosca</h2>
    <div class="grid">
      <div class="field"><label>Profundidade do canal — alimentação (mm)</label><input id="ciFeedDepth" inputmode="decimal" placeholder="Ex.: 8,0"></div>
      <div class="field"><label>Profundidade do canal — dosagem (mm)</label><input id="ciMeterDepth" inputmode="decimal" placeholder="Ex.: 3,0"></div>
      <div class="field"><label>Diâmetro da rosca (mm)</label><input id="ciDiameter" inputmode="decimal" placeholder="Ex.: 55"></div>
      <div class="field"><label>Comprimento da zona de compressão (mm)</label><input id="ciCompressionLength" inputmode="decimal" placeholder="Ex.: 550"></div>
    </div>
    <div class="hint">Os resultados são atualizados enquanto você digita.</div>
  </div>

  <div class="card">
    <h2>Resultados automáticos</h2>
    <div class="ciResultGrid">
      <div class="res gold"><span>TAXA DE COMPRESSÃO</span><b id="ciRatio">—</b></div>
      <div class="res blue"><span>COMPRIMENTO DA COMPRESSÃO</span><b id="ciCompressionD">—</b><span>em D</span></div>
      <div class="res"><span>REDUÇÃO POR D</span><b id="ciReductionPerD">—</b><span>% da profundidade de alimentação por D</span></div>
    </div>
    <div id="ciMmPerD" class="status"></div>
    <div id="ciAttentionWrap" class="hidden"><div id="ciAttention" class="ciBadge"></div></div>
    <div id="ciCalcMsg" class="status"></div>
    <div class="notes"><b>Ponto de atenção, não diagnóstico:</b> a indicação <b>suave / moderada / agressiva</b> é apenas uma referência geométrica interna baseada na <b>redução relativa da profundidade do canal por D</b>. Ela não determina sozinha se a rosca está correta para um polímero, processo ou produção.<br><br><b>Fórmulas:</b> taxa = alimentação ÷ dosagem; compressão em D = comprimento da zona ÷ diâmetro; redução por D = [(alimentação − dosagem) ÷ alimentação] ÷ D da compressão × 100.</div>
    <div class="ciActions">
      <button id="ciSave" class="btn" type="button">💾 SALVAR RESULTADO</button>
      <button id="ciClear" class="btn secondary" type="button">LIMPAR CAMPOS</button>
    </div>
    <div id="ciSaveMsg" class="status"></div>
  </div>

  <div class="card">
    <h2>Comparar duas roscas lado a lado</h2>
    <div class="ciCompareSelectors">
      <div class="field"><label>Rosca A — resultado salvo</label><select id="ciCompareA"><option value="">Selecione</option></select></div>
      <div class="field"><label>Rosca B — resultado salvo</label><select id="ciCompareB"><option value="">Selecione</option></select></div>
    </div>
    <div class="ciCompare">
      <div class="ciCompareBox" id="ciBoxA"><h3>ROSCA A</h3><small>Selecione um resultado salvo.</small></div>
      <div class="ciCompareBox" id="ciBoxB"><h3>ROSCA B</h3><small>Selecione um resultado salvo.</small></div>
    </div>
    <div id="ciCompareMsg" class="status"></div>
  </div>

  <div class="card">
    <h2>Resultados salvos por máquina e cliente</h2>
    <div id="ciHistory" class="ciHistory"></div>
  </div>
</section>`}

function ensureUi(){
  injectStyle();
  const app=$('app');
  if(!app)return false;
  if(!$(PAGE_ID))app.insertAdjacentHTML('beforeend',pageHtml());
  const menu=document.querySelector('.menuTabs');
  if(menu&&!$('ciMenuButton')){
    menu.classList.add('dfIntensityMenu');
    const b=document.createElement('button');
    b.id='ciMenuButton';b.className='menuBtn';b.type='button';b.textContent='🧪 INTENSIDADE DE COMPRESSÃO';
    menu.appendChild(b);
  }
  return true;
}

function openPage(){
  if(!ensureUi())return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const home=$('homeView');if(home)home.style.display='none';
  $(PAGE_ID).classList.add('on');
  document.querySelectorAll('.menuBtn').forEach(b=>b.classList.remove('active'));
  if($('ciMenuButton'))$('ciMenuButton').classList.add('active');
  refreshMachines();renderHistory();renderCompareOptions();calc();
  try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
}
function backHome(){
  const p=$(PAGE_ID);if(p)p.classList.remove('on');
  const home=$('homeView');if(home)home.style.display='block';
  if($('ciMenuButton'))$('ciMenuButton').classList.remove('active');
  const first=document.querySelector('.menuTabs .menuBtn');if(first)first.classList.add('active');
  try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
}

function refreshMachines(){
  const sel=$('ciMachine');if(!sel)return;
  const a=machines(),keep=sel.value;
  sel.innerHTML='<option value="">Selecione a máquina</option>'+a.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||m.id)+'</option>').join('');
  if(a.some(m=>m.id===keep))sel.value=keep;
  else{
    let last='';try{last=localStorage.getItem(LAST_MACHINE)||''}catch(e){}
    if(a.some(m=>m.id===last))sel.value=last;else if(a.length)sel.value=a[0].id;
  }
}

function calculation(){
  const feed=num($('ciFeedDepth')&&$('ciFeedDepth').value),meter=num($('ciMeterDepth')&&$('ciMeterDepth').value),diameter=num($('ciDiameter')&&$('ciDiameter').value),length=num($('ciCompressionLength')&&$('ciCompressionLength').value);
  const ratio=feed>0&&meter>0?feed/meter:0;
  const compD=diameter>0&&length>0?length/diameter:0;
  const relativeReduction=feed>0&&meter>0?(feed-meter)/feed:0;
  const reductionPerD=compD>0?relativeReduction/compD*100:0;
  const mmPerD=compD>0?(feed-meter)/compD:0;
  let attention='';
  if(ratio>1&&reductionPerD>0){attention=reductionPerD<4?'suave':reductionPerD<=8?'moderada':'agressiva'}
  return{feed,meter,diameter,length,ratio,compD,reductionPerD,mmPerD,attention};
}

function calc(){
  if(!ensureUi())return;
  const c=calculation();
  $('ciRatio').textContent=c.ratio>0?fmt(c.ratio,2)+':1':'—';
  $('ciCompressionD').textContent=c.compD>0?fmt(c.compD,2)+' D':'—';
  $('ciReductionPerD').textContent=c.reductionPerD>0?fmt(c.reductionPerD,2)+'%/D':'—';
  $('ciMmPerD').textContent=c.mmPerD>0?'Redução geométrica equivalente: '+fmt(c.mmPerD,3)+' mm de profundidade por D.':'';
  const wrap=$('ciAttentionWrap'),badge=$('ciAttention');
  if(c.attention){wrap.classList.remove('hidden');badge.className='ciBadge '+c.attention;badge.textContent='Ponto de atenção: intensidade '+c.attention.toUpperCase()}else{wrap.classList.add('hidden');badge.className='ciBadge';badge.textContent=''}
  let msg='';
  if((c.feed||c.meter||c.diameter||c.length)&&!(c.feed>0&&c.meter>0&&c.diameter>0&&c.length>0))msg='Preencha as quatro medidas para completar o cálculo.';
  else if(c.feed>0&&c.meter>0&&c.meter>=c.feed)msg='Confira as profundidades: para uma compressão geométrica convencional, a dosagem deve ser menor que a alimentação.';
  else if(c.compD>0&&c.compD<1)msg='A zona de compressão informada tem menos de 1 D. Confira o comprimento e o diâmetro.';
  $('ciCalcMsg').textContent=msg;$('ciCalcMsg').className='status '+(msg?'warn':'ok');
  return c;
}

function recordLabel(r){return [r.machineName||'Máquina',r.client||'Cliente',when(r.createdAt)].filter(Boolean).join(' • ')}
function saveCurrent(){
  const c=calc(),machineId=String($('ciMachine').value||''),client=String($('ciClient').value||'').trim();
  if(!machineId){$('ciSaveMsg').textContent='Selecione a máquina para salvar o resultado.';$('ciSaveMsg').className='status warn';return}
  if(!client){$('ciSaveMsg').textContent='Informe o cliente para salvar o resultado.';$('ciSaveMsg').className='status warn';return}
  if(!(c.feed>0&&c.meter>0&&c.diameter>0&&c.length>0&&c.ratio>1&&c.compD>0&&c.reductionPerD>0)){$('ciSaveMsg').textContent='Complete medidas válidas antes de salvar.';$('ciSaveMsg').className='status warn';return}
  const a=records();
  const r={id:'ci-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),machineId,machineName:machineName(machineId),client,feed:c.feed,meter:c.meter,diameter:c.diameter,length:c.length,ratio:c.ratio,compD:c.compD,reductionPerD:c.reductionPerD,mmPerD:c.mmPerD,attention:c.attention,createdAt:new Date().toISOString()};
  a.unshift(r);if(a.length>150)a.length=150;
  if(!saveRecords(a)){$('ciSaveMsg').textContent='Não foi possível salvar neste aparelho.';$('ciSaveMsg').className='status err';return}
  $('ciSaveMsg').textContent='✅ Resultado salvo para '+r.machineName+' / '+client+'.';$('ciSaveMsg').className='status ok';
  renderHistory();renderCompareOptions(r.id);
}

function clearFields(){
  ['ciFeedDepth','ciMeterDepth','ciDiameter','ciCompressionLength'].forEach(id=>{if($(id))$(id).value=''});
  $('ciSaveMsg').textContent='';calc();
}

function removeRecord(id){
  const a=records().filter(r=>r&&r.id!==id);saveRecords(a);renderHistory();renderCompareOptions();renderCompare();
}

function renderHistory(){
  const box=$('ciHistory');if(!box)return;
  const a=records();
  if(!a.length){box.innerHTML='<div class="empty">Nenhum resultado salvo ainda.</div>';return}
  box.innerHTML='';
  a.slice(0,20).forEach(r=>{
    const row=document.createElement('div');row.className='ciHistoryRow';
    const info=document.createElement('div');
    info.innerHTML='<b>'+esc(r.machineName||'Máquina')+' • '+esc(r.client||'Cliente')+'</b><small>'+esc(when(r.createdAt))+' • '+fmt(r.ratio,2)+':1 • '+fmt(r.compD,2)+' D • '+fmt(r.reductionPerD,2)+'%/D • '+esc(r.attention||'—')+'</small>';
    const del=document.createElement('button');del.className='btn danger';del.type='button';del.textContent='EXCLUIR';del.addEventListener('click',()=>removeRecord(r.id));
    row.append(info,del);box.appendChild(row);
  });
}

function renderCompareOptions(preferId){
  const a=records();
  ['ciCompareA','ciCompareB'].forEach((id,idx)=>{
    const sel=$(id);if(!sel)return;const keep=sel.value;
    sel.innerHTML='<option value="">Selecione</option>'+a.map(r=>'<option value="'+esc(r.id)+'">'+esc(recordLabel(r))+'</option>').join('');
    if(a.some(r=>r.id===keep))sel.value=keep;
    else if(preferId&&idx===0&&a.some(r=>r.id===preferId))sel.value=preferId;
    else if(a[idx])sel.value=a[idx].id;
  });
  renderCompare();
}

function compareBox(id,title,r){
  const el=$(id);if(!el)return;
  if(!r){el.innerHTML='<h3>'+title+'</h3><small>Selecione um resultado salvo.</small>';return}
  el.innerHTML='<h3>'+title+'</h3><small>'+esc(r.machineName||'Máquina')+' • '+esc(r.client||'Cliente')+' • '+esc(when(r.createdAt))+'</small>'+[
    ['Alimentação',fmt(r.feed,3)+' mm'],['Dosagem',fmt(r.meter,3)+' mm'],['Diâmetro',fmt(r.diameter,1)+' mm'],['Zona de compressão',fmt(r.length,1)+' mm'],['Taxa de compressão',fmt(r.ratio,2)+':1'],['Compressão em D',fmt(r.compD,2)+' D'],['Redução por D',fmt(r.reductionPerD,2)+'%/D'],['Leitura',String(r.attention||'—').toUpperCase()]
  ].map(x=>'<div class="ciCompareRow"><span>'+x[0]+'</span><b>'+esc(x[1])+'</b></div>').join('');
}
function renderCompare(){
  const a=records(),ra=a.find(r=>r&&r.id===String($('ciCompareA')&&$('ciCompareA').value||'')),rb=a.find(r=>r&&r.id===String($('ciCompareB')&&$('ciCompareB').value||''));
  compareBox('ciBoxA','ROSCA A',ra);compareBox('ciBoxB','ROSCA B',rb);
  let msg='';
  if(ra&&rb){
    if(ra.id===rb.id)msg='Selecione dois resultados diferentes para uma comparação útil.';
    else{
      const dRate=rb.reductionPerD-ra.reductionPerD,dRatio=rb.ratio-ra.ratio,dD=rb.compD-ra.compD;
      msg='B − A: taxa de compressão '+(dRatio>=0?'+':'')+fmt(dRatio,2)+' • compressão '+(dD>=0?'+':'')+fmt(dD,2)+' D • redução '+(dRate>=0?'+':'')+fmt(dRate,2)+'%/D.';
    }
  }
  $('ciCompareMsg').textContent=msg;$('ciCompareMsg').className='status '+(ra&&rb&&ra.id===rb.id?'warn':'');
}

function bind(){
  if(!ensureUi())return false;
  if($('ciMenuButton')&&!$('ciMenuButton').dataset.bound){$('ciMenuButton').dataset.bound='1';$('ciMenuButton').addEventListener('click',openPage)}
  if($('ciBack')&&!$('ciBack').dataset.bound){$('ciBack').dataset.bound='1';$('ciBack').addEventListener('click',backHome)}
  ['ciFeedDepth','ciMeterDepth','ciDiameter','ciCompressionLength'].forEach(id=>{const e=$(id);if(e&&!e.dataset.bound){e.dataset.bound='1';e.addEventListener('input',calc);e.addEventListener('change',calc)}});
  if($('ciSave')&&!$('ciSave').dataset.bound){$('ciSave').dataset.bound='1';$('ciSave').addEventListener('click',saveCurrent)}
  if($('ciClear')&&!$('ciClear').dataset.bound){$('ciClear').dataset.bound='1';$('ciClear').addEventListener('click',clearFields)}
  ['ciCompareA','ciCompareB'].forEach(id=>{const e=$(id);if(e&&!e.dataset.bound){e.dataset.bound='1';e.addEventListener('change',renderCompare)}});
  if($('ciMachine')&&!$('ciMachine').dataset.bound){$('ciMachine').dataset.bound='1';$('ciMachine').addEventListener('change',function(){try{if(this.value)localStorage.setItem(LAST_MACHINE,this.value)}catch(e){}})}
  return true;
}

function boot(){
  let n=0;const t=setInterval(()=>{n++;if(bind()||n>50){clearInterval(t);refreshMachines();renderHistory();renderCompareOptions();calc()}},100);
  window.addEventListener('pageshow',()=>setTimeout(()=>{bind();refreshMachines();renderHistory();renderCompareOptions();calc()},100));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();