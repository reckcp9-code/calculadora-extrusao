(function(){
'use strict';
if(window.DFTeamFormulasDuplicatesV2)return;window.DFTeamFormulasDuplicatesV2=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const FORM_KEY='df_formulacoes_v2',MAT_KEY='df_formula_materiais_v2',TEAM_KEY='df_op_team_v1';
let syncing=false,applying=false,initialized=false,currentTeamId='',lastPull=0,pushTimer=0,lastHash='';
const $=id=>document.getElementById(id);
function loadJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function clean(v,max){const s=String(v??'').replace(/\s+/g,' ').trim();return max?s.slice(0,max):s}
function nameKey(v){let s=clean(v);try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t&&t.teamId)return t}}catch(e){}return loadJson(TEAM_KEY,null)}
function isOwner(){return String(team()?.role||'').toLowerCase()==='owner'}

// Recovery v670: these IDs were explicitly restored from the owner's encrypted Oct 26 backup.
// Local tombstones are cleared ONLY if the official D1 list actually contains the restored ID.
const DF_RESTORED_20261028=new Set(["1792770750930","1792702477892","1792668582615","1792668274510","1792589603137","1792498045545","1792437936659","1792264172208","1792179028278","1792178852701","1792178633396","1791461437561","1791461307470","1791459733048","1791401717846","1790957159575","1790957080478","1790957013712","1790882060228","1790869103414","1790798602554","1790798535834","1790713322203","1790592004891","1790591907399","1790591571634","1790013671103","1790013434740","1790004888305","1790004739812","1789761198552","1789598676532","1789575833975","1789481263517","1789411418564","1789218541352","1789063985509","1788891895995","1788884225216"]);
function clearRestoredLocalTombstones(serverRows){
 const t=team(),teamId=String(t?.teamId||'');
 if(teamId!=='team_QBsSzFYgdcZ_b-cY'||!Array.isArray(serverRows))return;
 const present=serverRows.map(x=>String(x?.id??x?.formulaId??'')).filter(x=>DF_RESTORED_20261028.has(x));
 if(!present.length)return;
 const key='df_formula_deleted_tombstones_v1',all=loadJson(key,{});
 const tomb=all?.[teamId];
 if(!tomb||typeof tomb!=='object')return;
 let changed=false;
 for(const id of present){if(Object.prototype.hasOwnProperty.call(tomb,id)){delete tomb[id];changed=true}}
 if(changed)try{localStorage.setItem(key,JSON.stringify(all))}catch(e){}
}

function localForms(){const a=loadJson(FORM_KEY,[]);const rows=Array.isArray(a)?a:[];return window.DFFormulaTombstones?.filterDeleted?window.DFFormulaTombstones.filterDeleted(rows):rows}
function localMats(){const a=loadJson(MAT_KEY,[]);return Array.isArray(a)?a:[]}
function canonicalRows(rows){const mats=localMats(),by={};mats.forEach(m=>by[String(m?.id??'')]=m);return (Array.isArray(rows)?rows:[]).slice(0,12).map(r=>{const m=by[String(r?.id??'')]||{};return{id:String(r?.id??m?.id??''),nome:clean(r?.nome||m?.nome,100),preco:num(r?.preco??m?.preco),pct:num(r?.pct)}}).filter(r=>r.id||r.nome)}
function canonicalForm(f){const nome=clean(f?.nome||f?.name,120);if(!nome)return null;const id=clean(f?.id??f?.formulaId,120);return{id:id||String(Date.now())+'-'+Math.random().toString(36).slice(2,8),nome,total:num(f?.total),rows:canonicalRows(f?.rows),custo:num(f?.custo),custoKg:num(f?.custoKg),op:f?.op&&typeof f.op==='object'?f.op:{},criado:clean(f?.criado||f?.createdAt,64),updatedAt:clean(f?.updatedAt,64)}}
function identity(f){const id=clean(f?.id??f?.formulaId,120);if(id)return 'id:'+id;return 'legacy:'+nameKey(f?.nome)+'|'+num(f?.total)+'|'+JSON.stringify(canonicalRows(f?.rows))+'|'+clean(f?.criado||f?.createdAt,64)}
function uniqueForms(list){const out=[],seen=new Set();for(const f of Array.isArray(list)?list:[]){const c=canonicalForm(f);if(!c)continue;const k=identity(c);if(seen.has(k))continue;seen.add(k);out.push(c)}return out}
function hashForms(list){try{return JSON.stringify(uniqueForms(list).map(f=>[identity(f),nameKey(f.nome),f.total,f.rows,f.op,f.custo,f.custoKg]))}catch(e){return''}}
function esc(t){return String(t??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fm(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):''}

function addStyle(){if($('dfFormulaSameNameStyle'))return;const s=document.createElement('style');s.id='dfFormulaSameNameStyle';s.textContent=`
#dfFormulaSuggest{display:none;margin-top:7px;border:1px solid #6b531b;background:#08111c;border-radius:12px;overflow:hidden;box-shadow:0 16px 36px #0009;position:relative;z-index:30}
#dfFormulaSuggest.on{display:block}.dfFormulaSuggestion{display:block;width:100%;text-align:left;border:0;border-top:1px solid #263244;background:#08111c;color:#f8fafc;padding:11px 12px;cursor:pointer}.dfFormulaSuggestion:first-child{border-top:0}.dfFormulaSuggestion b{display:block;color:#f3c45c;font-size:13px}.dfFormulaSuggestion span{display:block;color:#aab6c6;font-size:10px;line-height:1.4;margin-top:3px}.dfFormulaSuggestion:hover,.dfFormulaSuggestion:focus{background:#101b29;outline:none}
#dfTeamFormulaStatus{margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:8px 10px;font-size:10px;line-height:1.4;color:#94a3b8}
#dfFormulaLoadedMsg{margin-top:7px;border:1px solid #166534;background:#082414;border-radius:9px;padding:7px 9px;color:#86efac;font-size:10px;font-weight:850}
`;document.head.appendChild(s)}
function ensureStatus(){addStyle();const input=$('foNome');if(!input)return null;let e=$('dfTeamFormulaStatus');if(e)return e;e=document.createElement('div');e.id='dfTeamFormulaStatus';input.insertAdjacentElement('afterend',e);return e}
function status(text,type){const e=ensureStatus();if(!e)return;e.textContent=text;e.style.color=type==='ok'?'#86efac':type==='warn'?'#fde68a':type==='bad'?'#fca5a5':'#94a3b8';e.style.borderColor=type==='ok'?'#166534':type==='warn'?'#a16207':type==='bad'?'#7f1d1d':'#334155'}
function ensureSuggest(){addStyle();const input=$('foNome');if(!input)return null;let box=$('dfFormulaSuggest');if(box&&box.previousElementSibling!==input&&box.parentNode){box.remove();box=null}if(!box){box=document.createElement('div');box.id='dfFormulaSuggest';input.insertAdjacentElement('afterend',box)}return box}
function materialSummary(f){const mats=localMats(),by={};mats.forEach(m=>by[String(m?.id??'')]=m);return (f.rows||[]).slice(0,5).map(r=>{const m=by[String(r?.id??'')]||r;const n=clean(m?.nome||r?.nome);return n?(n+(num(r?.pct)>0?' '+fm(r.pct)+'%':'')):''}).filter(Boolean).join(' • ')}
function rankedMatches(q){const k=nameKey(q);if(k.length<2)return[];return uniqueForms(localForms()).map((f,i)=>{const fk=nameKey(f.nome);let rank=9;if(fk===k)rank=0;else if(fk.startsWith(k))rank=1;else if(fk.includes(k))rank=2;else if(k.split(' ').every(p=>fk.includes(p)))rank=3;return{f,rank,i}}).filter(x=>x.rank<9).sort((a,b)=>a.rank-b.rank||a.i-b.i).slice(0,12).map(x=>x.f)}
function renderSuggest(value){const box=ensureSuggest();if(!box)return;const list=rankedMatches(value);if(!list.length){box.classList.remove('on');box.innerHTML='';return}box.innerHTML=list.map(f=>'<button type="button" class="dfFormulaSuggestion" data-dfformula="'+esc(String(f.id))+'"><b>'+esc(f.nome)+'</b><span>'+esc(materialSummary(f)||('ID '+String(f.id).slice(-6)))+'</span></button>').join('');box.classList.add('on')}
function showLoaded(){let e=$('dfFormulaLoadedMsg');const input=$('foNome');if(!input)return;if(!e){e=document.createElement('div');e.id='dfFormulaLoadedMsg';const st=$('dfTeamFormulaStatus');(st||input).insertAdjacentElement('afterend',e)}e.textContent='✅ Formulação carregada. Pode alterar porcentagens e salvar com o mesmo nome.';clearTimeout(e.__tm);e.__tm=setTimeout(()=>e.remove(),6500)}
function applyFormula(f){if(!f)return;try{if(typeof window.abrirFormula==='function')window.abrirFormula(f,false)}catch(e){}if($('foNome'))$('foNome').value=f.nome||'';if($('foTotal')&&num(f.total)>0)$('foTotal').value=String(f.total).replace('.',',');try{if(typeof window.calcFo==='function')setTimeout(()=>window.calcFo(),60)}catch(e){}const box=$('dfFormulaSuggest');if(box){box.classList.remove('on');box.innerHTML=''}showLoaded();try{window.dispatchEvent(new CustomEvent('df-team-formula-selected',{detail:{id:f.id,nome:f.nome}}))}catch(e){}}

async function apiPost(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
function serverForms(rows){return uniqueForms((Array.isArray(rows)?rows:[]).filter(x=>!window.DFFormulaTombstones?.isDeleted?.(String(x?.id??x?.formulaId??''))).map(x=>({id:x?.id??x?.formulaId,nome:x?.nome??x?.name,total:x?.total,rows:x?.rows,custo:x?.custo,custoKg:x?.custoKg,op:x?.op,criado:x?.criado??x?.createdAt,updatedAt:x?.updatedAt})))}
function newestFirst(forms){return uniqueForms(forms).sort((a,b)=>{const ta=Date.parse(a.updatedAt||a.criado||'')||Number(a.id)||0;const tb=Date.parse(b.updatedAt||b.criado||'')||Number(b.id)||0;return tb-ta||String(b.id).localeCompare(String(a.id))})}
function selectLatestForTeam(){const forms=newestFirst(localForms()),id=forms[0]?.id,sel=$('foSavedSelect');if(!id||!sel)return;const option=Array.from(sel.options).find(o=>String(o.value)===String(id));if(!option)return;sel.value=String(id);sel.dispatchEvent(new Event('change',{bubbles:true}))}
function writeForms(forms){applying=true;try{localStorage.setItem(FORM_KEY,JSON.stringify(newestFirst(forms)));lastHash=hashForms(forms)}finally{applying=false}try{if(typeof window.renderForms==='function')window.renderForms()}catch(e){}selectLatestForTeam();setTimeout(selectLatestForTeam,100);const v=$('foNome')?.value;if(v)renderSuggest(v);try{window.dispatchEvent(new CustomEvent('df-team-formulas-updated',{detail:{count:uniqueForms(forms).length,teamId:currentTeamId}}))}catch(e){}}
function applyServer(rows,preserve){const server=serverForms(rows),all=server.slice(),seen=new Set(server.map(identity));for(const f of uniqueForms(preserve||[])){const k=identity(f);if(!seen.has(k)){seen.add(k);all.push(f)}}writeForms(all);return all}

async function pushForms(fillOnly){const t=team();if(!t?.teamId||!initialized)return false;const forms=uniqueForms(localForms());if(!forms.length)return true;const sent=forms.slice();const j=await apiPost('/op/team/formulas/upsert',{teamId:String(t.teamId),fillOnly:!!fillOnly,formulas:sent});if(!Array.isArray(j.formulas))throw new Error('Servidor não confirmou as formulações.');applyServer(j.formulas);lastPull=Date.now();status('☁️ Biblioteca sincronizada • nomes repetidos liberados por ID','ok');return true}
async function sync(force){const t=team();if(!t?.teamId){initialized=false;currentTeamId='';status('Formulações salvas neste aparelho. Nomes repetidos estão liberados.','ok');return false}if(syncing)return false;if(!force&&Date.now()-lastPull<20000)return true;syncing=true;currentTeamId=String(t.teamId);try{let j=await apiPost('/op/team/formulas/list',{teamId:currentTeamId});if(!j.initialized){if(isOwner()){const own=uniqueForms(localForms());status('☁️ Publicando biblioteca da equipe...','warn');j=await apiPost('/op/team/formulas/seed-owner',{teamId:currentTeamId,formulas:own})}else{initialized=false;status('☁️ Aguardando o DONO publicar a biblioteca de formulações.','warn');lastPull=Date.now();return false}}initialized=true;
const migrationKey='df_team_formulas_migrated_v1_'+currentTeamId;
const migrationDone=localStorage.getItem(migrationKey)==='1';
if(!migrationDone){
  const server=serverForms(j.formulas||[]),known=new Set(server.map(identity));
  const missing=uniqueForms(localForms()).filter(f=>!known.has(identity(f))&&!window.DFFormulaTombstones?.isDeleted?.(String(f.id)));
  if(missing.length){
    status('☁️ Unificando '+missing.length+' formulações deste aparelho com a equipe...','warn');
    j=await apiPost('/op/team/formulas/upsert',{teamId:currentTeamId,fillOnly:true,formulas:missing});
    if(!Array.isArray(j.formulas))throw new Error('Servidor não confirmou a unificação.');
  }
  localStorage.setItem(migrationKey,'1');
}
clearRestoredLocalTombstones(j.formulas||[]);
const server=newestFirst(serverForms(j.formulas||[]));applyServer(server);lastPull=Date.now();status('☁️ Formulações sincronizadas • '+uniqueForms(localForms()).length+' salvas','ok');return true}catch(e){status('⚠️ Formulações salvas localmente; sincronização pendente: '+String(e?.message||e),'warn');return false}finally{syncing=false}}
function schedulePush(){if(applying)return;clearTimeout(pushTimer);pushTimer=setTimeout(async()=>{const now=hashForms(localForms());if(now===lastHash)return;lastHash=now;try{if(team()?.teamId){if(!initialized)await sync(true);if(initialized)await pushForms(false)}}catch(e){status('⚠️ Formulação salva neste aparelho; sincronização pendente.','warn')}},500)}
try{const previousSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const watch=this===localStorage&&String(k)===FORM_KEY,old=watch?String(this.getItem(k)||''):'';const out=previousSetItem.call(this,k,v);if(watch&&!applying&&old!==String(v||''))schedulePush();return out}}catch(e){}
async function deleteTeamFormula(f){if(!f)return false;const t=team();if(!confirm('Excluir esta formulação "'+String(f.nome||'Formulação')+'" para toda a equipe?'))return false;if(!t?.teamId){window.DFFormulaTombstones?.markDeleted?.(String(f.id));writeForms(localForms().filter(x=>identity(x)!==identity(f)));return true}try{const j=await apiPost('/op/team/formulas/delete',{teamId:String(t.teamId),formulaId:String(f.id||'')});window.DFFormulaTombstones?.markDeleted?.(String(f.id));applyServer(j.formulas||[]);status('✅ Formulação excluída para a equipe.','ok');return true}catch(e){status('⚠️ Exclusão não confirmada pelo servidor. Nenhum dado foi apagado neste aparelho: '+String(e?.message||e),'warn');return false}}
function selectedFormula(){const id=$('foSavedSelect')?.value;return localForms().find(f=>String(f?.id)===String(id))}

function boot(){addStyle();lastHash=hashForms(localForms());setTimeout(()=>{ensureStatus();ensureSuggest()},700);setTimeout(()=>sync(true),1800);document.addEventListener('input',e=>{if(e.target?.id==='foNome')renderSuggest(e.target.value)},true);document.addEventListener('focusin',e=>{if(e.target?.id==='foNome')renderSuggest(e.target.value)},true);document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-dfformula]');if(b){e.preventDefault();e.stopPropagation();const f=localForms().find(x=>String(x?.id)===String(b.dataset.dfformula));applyFormula(f);return}if(!e.target?.closest?.('#foNome,#dfFormulaSuggest'))$('dfFormulaSuggest')?.classList.remove('on');if(e.target?.closest?.('#btFo,#dfFormTabCore,#dfCloudRefresh,#foSaved'))setTimeout(()=>sync(true),250)},true);window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-fosafe="del"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();deleteTeamFormula(selectedFormula())},true);['df-team-joined','df-team-changed','df-team-materials-updated','online','pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(()=>sync(true),320)));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>sync(false),350)});setInterval(()=>{if(!document.hidden&&team()?.teamId&&Date.now()-lastPull>55000)sync(false)},60000)}
window.DFTeamFormulasShared={sync:()=>sync(true),deleteFormula:deleteTeamFormula,select:applyFormula,initialized:()=>initialized,allowSameName:true};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();