(function(){'use strict';if(window.DFMaterialsFromClosedOpsV1)return;window.DFMaterialsFromClosedOpsV1=true;
var OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',month=new Date().toISOString().slice(0,7),timer=0;
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch(e){return f}}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(x){if(typeof x==='number')return x;var s=String(x||'').trim().replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');return Number(s)||0}
function fmt(x){return x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function norm(x){return String(x||'').trim().toUpperCase().replace(/\s/g,'')}
function date(o){var v=String(o.data||o.completedAt||o.finishedAt||o.createdAt||'');var m=v.match(/^(\d{4}-\d\d)/);return m?m[1]:''}

// Fonte oficial: OPs baixadas compartilhadas pelo servidor da Equipe de Extrusão.
var cloudRecords=null,cloudTeam='',cloudMonth='',cloudBusy=false,cloudLast=0;
function currentTeam(){try{return window.DFOpCloud&&window.DFOpCloud.team&&window.DFOpCloud.team()||read('df_op_team_v1',null)}catch(e){return null}}
function cloudDevice(){try{return String(window.DFDeviceIdentity?.get?.()||localStorage.getItem('df_licenseauth_device_v1')||'')}catch(e){return''}}
async function cloudPost(path,body){var device=cloudDevice(),token='';try{token=String(sessionStorage.getItem('df_secure_token_v2')||'')}catch(e){}
if(!token||!device)throw Error('Sessão da equipe indisponível');
var res=await fetch('https://df-extrusor-api.reck-cp9.workers.dev'+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':device},body:JSON.stringify(body),cache:'no-store'});
var json=await res.json();if(!res.ok||json.ok===false)throw Error(json.error||'Falha ao sincronizar');return json}
function localClosedForMigration(tid){var ops=read(OPS,[]),reg=read(REG,{}),seen=new Set(),out=[];
(Array.isArray(ops)?ops:[]).forEach(function(o){if(!o||o.status!=='ok')return;var id=norm(o.id||o.qr||o.numero||o.opId||o.codigo);if(!/^DFOP-/i.test(id)||seen.has(id))return;seen.add(id);
var rec=reg[id]||Object.values(reg).find(function(x){return norm(x&&x.id)===id})||{},expected=rec.expected||{};
var materials=(Array.isArray(expected.materials)?expected.materials:[]).map(function(m){return {name:String(m.name||m.nome||'').trim(),kg:num(m.kg),pct:num(m.pct)}}).filter(function(m){return m.name&&(m.kg>0||m.pct>0)});
var prod=num(o.produzido||o.production||o.quantidade||o.kg||o.peso||0);
if(prod<=0)prod=num(expected.production||expected.total||0);
if(prod<=0)return;
materials=materials.map(function(m){var pct=m.pct>0?m.pct:(num(expected.totalKg)>0?100*m.kg/num(expected.totalKg):0);return {name:m.name,pct:pct,kg:Math.round(prod*pct)/100}});
var completed=String(o.completedAt||o.manualConfirmedAt||o.updatedAt||o.createdAt||new Date().toISOString());
var localDate=String(o.data||o.localDate||completed.slice(0,10)).slice(0,10);
out.push({opCode:id,production:prod,scrap:num(o.apara||o.scrap),materials:materials,productName:String(expected.produto||expected.title||o.produto||''),operatorName:String(o.operador||''),machine:String(o.maquina||''),completedAt:completed,localDate:localDate,teamId:tid});
});return out}
var cloudError='',migrating=false;
async function migrateInBackground(tid){
if(migrating)return;migrating=true;
try{
var migrateKey='df_materials_migrated_v395_'+tid,seed=localClosedForMigration(tid),signature=JSON.stringify(seed.map(function(x){return [x.opCode,x.production,x.scrap,x.materials]}));
if(!seed.length||localStorage.getItem(migrateKey)===signature)return;
var migrated=await cloudPost('/op/record/migrate',{teamId:tid,records:seed.slice(0,500)});
if(migrated&&migrated.ok&&migrated.invalid===0)localStorage.setItem(migrateKey,signature);
if(migrated&&migrated.saved>0)setTimeout(function(){syncMaterials(true)},500);
}catch(e){}finally{migrating=false}
}
async function syncMaterials(force){
var team=currentTeam(),tid=String(team&&team.teamId||''),requestedMonth=month;
if(!tid||cloudBusy||navigator.onLine===false)return;
if(!force&&cloudTeam===tid&&cloudMonth===month&&Date.now()-cloudLast<20000)return;
cloudBusy=true;cloudError='';
try{
var result=await Promise.race([cloudPost('/op/record/list',{teamId:tid,month:requestedMonth,includeDeleted:false}),new Promise(function(_,reject){setTimeout(function(){reject(Error('Tempo de espera excedido'))},9000)})]);
if(String(result.teamId||'')!==tid)throw Error('Equipe divergente');
cloudRecords=Array.isArray(result.records)?result.records:[];cloudTeam=tid;cloudMonth=requestedMonth;cloudLast=Date.now();
try{localStorage.setItem('df_materials_team_cache_v397_'+tid+'_'+requestedMonth,JSON.stringify(cloudRecords))}catch(e){}
if(month===requestedMonth)render();
setTimeout(function(){recoverOriginals(tid,requestedMonth)},50);
setTimeout(function(){migrateInBackground(tid)},150);
}catch(e){cloudError='⚠️ Não foi possível atualizar agora. Exibindo últimos dados disponíveis.';cloudLast=Date.now();render()}
finally{cloudBusy=false}
}

// Recupera as formulações originais publicadas na nuvem com o ID de cada OP.
var originalCloud={},originalBusy=false,originalTeam='',originalMonth='';
async function recoverOriginals(tid,m){
if(originalBusy)return;
var api=window.DFOpRegistryCloudTestV174;
if(!api||typeof api.readOriginalProducts!=='function')return;
originalBusy=true;
try{
var originals=await api.readOriginalProducts(m);
if(currentTeam()&&String(currentTeam().teamId||'')===tid&&month===m){
originalCloud=originals||{};originalTeam=tid;originalMonth=m;render();
}
}catch(e){}finally{originalBusy=false}
}
function formulaFor(id,reg,tid){
var entry=reg[id]||Object.values(reg).find(function(r){return norm(r&&r.id)===id})||{};
return (originalTeam===tid&&originalMonth===month&&originalCloud[id])||entry.expected||{};
}
function materialRows(mats,actual,planned){
if(!Array.isArray(mats))return[];
return mats.map(function(m){
var name=String(m.name||m.nome||m.material||'').trim(),pct=num(m.pct||m.percent||m.porcentagem||m.percentage),kg=num(m.kg);
if(!pct&&planned>0&&kg>0)pct=kg*100/planned;
return {name:name,pct:pct,kg:actual>0&&pct>0?actual*pct/100:kg};
}).filter(function(m){return m.name&&m.kg>0});
}
function render(){var pane=document.getElementById('dfPaneNow');if(!pane||!pane.classList.contains('on'))return;var team=currentTeam(),tid=String(team&&team.teamId||''),shared=!!tid,usingCloud=shared&&cloudTeam===tid&&cloudMonth===month&&Array.isArray(cloudRecords);var cached=[];if(shared&&!usingCloud){cached=read('df_materials_team_cache_v397_'+tid+'_'+month,[]);if(!Array.isArray(cached))cached=[]}var showCache=shared&&!usingCloud&&cached.length>0;var ops=usingCloud?cloudRecords:showCache?cached:read(OPS,[]),reg=read(REG,{}),rows={},seen=new Set(),count=0,missing=0,kgTotal=0;
(Array.isArray(ops)?ops:[]).forEach(function(o){if(!o||(usingCloud||showCache?o.state!=='ready':o.status!=='ok')||(usingCloud||showCache?String(o.localDate||o.completedAt||'').slice(0,7):date(o))!==month)return;var id=norm(usingCloud||showCache?o.opCode:(o.id||o.qr||o.numero||o.opId||o.codigo));if(!id||seen.has(id))return;seen.add(id);count++;var expected=formulaFor(id,reg,tid),actual=num(usingCloud||showCache?o.production:o.produzido),mats=materialRows(o.materials,actual,num(expected.totalKg));if(!mats.length)mats=materialRows(expected.materials,actual,num(expected.totalKg));if(!mats.length){missing++;return}mats.forEach(function(m){var n=String(m.name||'').trim(),kg=num(m.kg);var key=n.toLocaleUpperCase('pt-BR');if(!rows[key])rows[key]={name:n,kg:0};rows[key].kg+=kg;kgTotal+=kg})});
var list=Object.values(rows).sort(function(a,b){return b.kg-a.kg});var withMaterials=count-missing;window.DFMaterialsMonthlyReport={month:month,count:count,missing:missing,withMaterials:withMaterials,total:kgTotal,items:list.map(function(x){return {name:x.name,kg:x.kg}})};pane.innerHTML='<section class="dfMaterialsMonth"><h3>📦 MATERIAIS CALCULADOS</h3><p>Somente OPs com baixa concluída no mês. Quantidades previstas na formulação de cada OP, não consumo medido.</p><label for="dfMaterialsMonthSelect">MÊS</label><input id="dfMaterialsMonthSelect" type="month" value="'+esc(month)+'"><div id="dfMaterialsSyncStatus" style="margin-top:9px;color:#93c5fd;font-size:12px">'+(cloudError|| (usingCloud?'☁️ Dados oficiais sincronizados da equipe':showCache?'⏳ Atualizando dados da equipe (última sincronização exibida)':shared?'⏳ Atualizando dados da equipe (dados locais provisórios)':'Dados deste aparelho — conecte-se à equipe para compartilhar'))+'</div><div class="dfMaterialsSummary">OPs baixadas: <b>'+count+'</b> · Total calculado: <b>'+fmt(kgTotal)+' kg</b></div>'+(missing?'<p class="dfMaterialsWarning">⚠️ '+missing+' de '+count+' OP(s) baixada(s) ainda estão sem formulação recuperada. Total de materiais parcial: somente '+withMaterials+' OP(s) incluída(s). Confira os materiais originais dessas OPs.</p>':'')+(list.length?list.map(function(x){return '<div class="dfMaterialsRow"><span>'+esc(x.name)+'</span><b>'+fmt(x.kg)+' kg</b></div>'}).join(''):'<p>Nenhum material calculado encontrado nas OPs baixadas deste mês.</p>')+'<button type="button" id="dfMaterialsPdfBtn" class="dfMaterialsPdfBtn">📄 GERAR RELATÓRIO PDF</button></section>';
var inp=document.getElementById('dfMaterialsMonthSelect');if(inp)inp.onchange=function(){month=inp.value;originalCloud={};originalMonth='';render();syncMaterials(true)};var pdf=document.getElementById('dfMaterialsPdfBtn');if(pdf)pdf.onclick=printMaterialsReport;if(shared&&!usingCloud)syncMaterials(false)}
function printMaterialsReport(){
var data=window.DFMaterialsMonthlyReport;if(!data)return;
var period=String(data.month||'').split('-'),monthNames=['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
var monthLabel=(monthNames[Number(period[1])-1]||data.month)+' DE '+(period[0]||'');
var lines=data.items.map(function(x,i){return '<tr><td class="index">'+String(i+1).padStart(2,'0')+'</td><td>'+esc(x.name)+'</td><td class="quantity">'+fmt(x.kg)+' kg</td></tr>'}).join('');
var html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DF EXTRUSOR PRO | '+esc(monthLabel)+'</title><style>'+
'@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f3f6fa;color:#15243a;margin:0;padding:22px;font-size:13px}.sheet{max-width:900px;margin:auto;background:#fff;padding:28px 30px;border:1px solid #dce3ec;box-shadow:0 6px 28px #0b254012}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0e315d;padding-bottom:18px;gap:12px}.brand{font-size:23px;letter-spacing:.4px;font-weight:900;color:#0c2b51}.subbrand{color:#54708d;font-size:10px;letter-spacing:1.4px;margin-top:4px}.tag{background:#eaf2fc;color:#174b82;border:1px solid #c6dbf5;padding:8px 11px;border-radius:7px;font-size:10px;font-weight:800}.reporttitle{font-size:20px;margin:24px 0 5px;color:#0c2b51}.period{color:#64748b;font-size:12px;font-weight:600}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.stat{background:#f4f8fd;border:1px solid #dce7f3;border-radius:9px;padding:12px}.stat span{display:block;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase}.stat b{display:block;font-size:18px;margin-top:5px;color:#0d3768}.stat.warn b{color:#b45309}table{border-collapse:collapse;width:100%;font-size:12px;table-layout:fixed}thead{display:table-header-group}th{background:#0e315d;color:#fff;text-align:left;font-size:10px;letter-spacing:.6px;text-transform:uppercase}td,th{border-bottom:1px solid #dbe4ef;padding:10px 11px}tbody tr:nth-child(even){background:#f7f9fc}.index{width:52px;color:#64748b}.quantity{text-align:right;white-space:nowrap;font-weight:700}tfoot td{background:#eaf2fc;color:#0d3768;font-weight:900;border-top:2px solid #0e315d}.note{border-left:3px solid #d6a43b;padding:10px 12px;background:#fffbeb;color:#71571b;margin:20px 0;font-size:11px;line-height:1.5}.footer{display:flex;justify-content:space-between;border-top:1px solid #dce3ec;padding-top:13px;margin-top:24px;color:#8190a2;font-size:10px}.tools{max-width:900px;margin:0 auto 14px;display:flex;gap:10px;flex-wrap:wrap}.tools button{border:0;border-radius:9px;padding:13px 18px;font-size:13px;font-weight:800;cursor:pointer}.back{background:#102b4b;color:white}.print{background:#f6b32a;color:#14243a}@media(max-width:560px){body{padding:10px}.sheet{padding:18px 12px}.brand{font-size:18px}.stats{gap:5px}.stat{padding:9px 5px}.stat b{font-size:14px}.tag{font-size:8px;padding:7px 5px}.quantity{font-size:11px}td,th{padding:9px 6px}}@media print{body{padding:0;background:#fff}.sheet{padding:0;border:0;box-shadow:none;max-width:none}.tools{display:none!important}tr{break-inside:avoid}.stat{break-inside:avoid}.footer{break-inside:avoid}}'+
'</style></head><body><div class="tools"><button class="back" id="backToFormula" onclick="returnToFormula()">← VOLTAR PARA FORMULAÇÃO</button><button class="print" onclick="window.print()">📄 IMPRIMIR / SALVAR PDF</button></div><main class="sheet"><header class="header"><div><div class="brand">DF EXTRUSOR PRO</div><div class="subbrand">RELATÓRIO TÉCNICO DE MATERIAIS</div></div><div class="tag">OPs BAIXADAS</div></header><h1 class="reporttitle">Materiais calculados no mês</h1><div class="period">'+esc(monthLabel)+'</div><div class="stats"><div class="stat"><span>OPs concluídas</span><b>'+data.count+'</b></div><div class="stat"><span>Total calculado</span><b>'+fmt(data.total)+' kg</b></div><div class="stat warn"><span>Sem materiais no QR</span><b>'+data.missing+'</b></div></div><table><thead><tr><th style="width:52px">Nº</th><th>MATERIAL</th><th style="text-align:right;width:150px">QUANTIDADE (KG)</th></tr></thead><tbody>'+lines+'</tbody><tfoot><tr><td colspan="2">TOTAL GERAL</td><td class="quantity">'+fmt(data.total)+' kg</td></tr></tfoot></table><div class="note"><b>Critério de apuração:</b> somente OPs com baixa concluída no período. Os valores correspondem às quantidades previstas nas formulações, não ao consumo físico medido. OPs sem materiais vinculados ao QR não foram incluídas na soma.</div><footer class="footer"><span>DF EXTRUSOR PRO • RELATÓRIO MENSAL</span><span>REFERÊNCIA: '+esc(data.month)+'</span></footer></main><script>function returnToFormula(){try{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();return}}catch(e){}try{window.close()}catch(e){}try{history.back()}catch(e){}}<\/script></body></html>';
var w=window.open('','_blank');if(!w){alert('Permita abrir o relatório em uma nova aba.');return}w.document.open();w.document.write(html);w.document.close();w.focus();
}
window.addEventListener('df-team-changed',function(){cloudRecords=null;cloudTeam='';render();syncMaterials(true)});window.addEventListener('df-op-saved',function(){cloudLast=0;setTimeout(function(){syncMaterials(true)},800)});window.addEventListener('online',function(){syncMaterials(true)});document.addEventListener('visibilitychange',function(){if(!document.hidden)syncMaterials(true)});setInterval(function(){if(!document.hidden&&document.getElementById('dfPaneNow')?.classList.contains('on'))syncMaterials(false)},30000);
function init(){if(document.getElementById('dfMaterialsStyle'))return;var st=document.createElement('style');st.id='dfMaterialsStyle';st.textContent='#dfPaneNow{display:none}#dfPaneNow.on{display:block}.dfMaterialsMonth{background:#0b1f36;border:1px solid #2563eb;border-radius:16px;padding:16px;color:#f8fafc}.dfMaterialsMonth h3{color:#bfdbfe;margin:0 0 10px}.dfMaterialsMonth p{color:#94a3b8;font-size:13px}.dfMaterialsMonth label{display:block;margin:16px 0 6px;font-weight:bold}.dfMaterialsMonth input{padding:12px;width:100%;box-sizing:border-box;border:1px solid #475569;border-radius:9px;background:#0f172a;color:white;font-size:16px}.dfMaterialsSummary{margin:14px 0;padding:12px;background:#101c30;border-radius:9px}.dfMaterialsRow{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #334155;padding:12px 0}.dfMaterialsRow b{white-space:nowrap;color:#86efac}.dfMaterialsWarning{color:#fbbf24!important}';st.textContent+=' .dfMaterialsPdfBtn{display:block;width:100%;margin-top:18px;padding:15px;border:1px solid #f59e0b;border-radius:12px;background:#422006;color:#fde68a;font-size:16px;font-weight:800;cursor:pointer}';document.head.appendChild(st);
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('#dfNowTab');if(t)setTimeout(render,30)},true);
var root=document.getElementById('dfFormulaOps')||document.body;new MutationObserver(function(){if(timer)return;timer=setTimeout(function(){timer=0;var tab=document.getElementById('dfNowTab'),pane=document.getElementById('dfPaneNow');if(tab)tab.textContent='📦 MATERIAIS CALCULADOS';if(pane&&pane.classList.contains('on')&&!pane.querySelector('.dfMaterialsMonth'))render()},150)}).observe(root,{childList:true,subtree:true});var tab=document.getElementById('dfNowTab');if(tab)tab.textContent='📦 MATERIAIS CALCULADOS';
window.addEventListener('df-op-d1-applied',function(){if(document.getElementById('dfPaneNow')?.classList.contains('on'))render()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();