(function(){
'use strict';
if(window.DFTeamFormulasAutocompleteV1)return;window.DFTeamFormulasAutocompleteV1=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const FORM_KEY='df_formulacoes_v2',MAT_KEY='df_formula_materiais_v2',OPS_KEY='df_formula_ops_auto_v2',TEAM_KEY='df_op_team_v1';
let syncing=false,applying=false,timer=0,lastPull=0,initialized=false,currentTeamId='',pushTimer=0,lastLocalHash='';
const $=id=>document.getElementById(id);
function loadJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function clean(v,max){const s=String(v??'').replace(/\s+/g,' ').trim();return max?s.slice(0,max):s}
function key(v){let s=clean(v);try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t&&t.teamId)return t}}catch(e){}return loadJson(TEAM_KEY,null)}
function isOwner(){return String(team()?.role||'').toLowerCase()==='owner'}
function localForms(){const a=loadJson(FORM_KEY,[]);return Array.isArray(a)?a:[]}
function localMats(){const a=loadJson(MAT_KEY,[]);return Array.isArray(a)?a:[]}
function localOps(){const a=loadJson(OPS_KEY,[]);return Array.isArray(a)?a:[]}
function opProductName(o){return clean(o?.serverProductName||o?.manualProductName||o?.clienteFormulacao||o?.produto||o?.product||o?.nomeProduto||o?.opNome||o?.expected?.title||o?.expected?.produto||'')}
function pickNum(){for(let i=0;i<arguments.length;i++){const n=Number(arguments[i]);if(Number.isFinite(n)&&n>0)return n}return 0}
function fallbackOpForName(name){const k=key(name);if(!k)return null;const list=localOps().filter(o=>key(opProductName(o))===k);list.sort((a,b)=>String(b?.updatedAt||b?.createdAt||b?.data||'').localeCompare(String(a?.updatedAt||a?.createdAt||a?.data||'')));const o=list[0];if(!o)return null;const e=o.expected||{};return{
  largura:pickNum(o.largura,o.width,o.boca,o.balao,e.largura,e.width,e.boca,e.balao),
  comprimento:pickNum(o.comprimento,o.length,e.comprimento,e.length),
  micra:pickNum(o.micra,o.espessura,e.micra,e.espessura),
  grama:pickNum(o.grama,o.gramatura,o.pesoMetro,e.grama,e.gramatura,e.pesoMetro)
}}
function normalizedOp(f){const o=f?.op||{},fb=fallbackOpForName(f?.nome);return{
  largura:pickNum(o.largura,fb?.largura),comprimento:pickNum(o.comprimento,fb?.comprimento),micra:pickNum(o.micra,fb?.micra),grama:pickNum(o.grama,fb?.grama)
}}
function normalizedRows(rows){const mats=localMats(),byId={};mats.forEach(m=>byId[String(m?.id??'')]=m);return (Array.isArray(rows)?rows:[]).slice(0,12).map(r=>{const m=byId[String(r?.id??'')]||{};return{id:String(r?.id??m?.id??''),nome:clean(r?.nome||m?.nome,100),preco:num(r?.preco??m?.preco),pct:num(r?.pct)}}).filter(r=>r.id||r.nome)}
function canonicalForm(f){const nome=clean(f?.nome||f?.name,120);if(!nome)return null;return{id:String(f?.id??''),nome,total:num(f?.total),rows:normalizedRows(f?.rows),custo:num(f?.custo),custoKg:num(f?.custoKg),op:normalizedOp(f),criado:clean(f?.criado||f?.createdAt,64),updatedAt:clean(f?.updatedAt,64)}}
function uniqueForms(list){const out=[],seen=new Set();for(const f of Array.isArray(list)?list:[]){const c=canonicalForm(f),k=c&&key(c.nome);if(!c||!k||seen.has(k))continue;seen.add(k);out.push(c)}return out}
function hashForms(list){try{return JSON.stringify(uniqueForms(list).map(f=>[key(f.nome),f.total,f.rows,f.op,f.custo,f.custoKg]))}catch(e){return''}}

function addStyle(){if($('dfFormulaSuggestStyle'))return;const s=document.createElement('style');s.id='dfFormulaSuggestStyle';s.textContent=`
#dfFormulaSuggest{display:none;margin-top:7px;border:1px solid #2563eb;background:#07111f;border-radius:12px;overflow:hidden;box-shadow:0 16px 36px #0009;position:relative;z-index:30}
#dfFormulaSuggest.on{display:block}.dfFormulaSuggestion{display:block;width:100%;text-align:left;border:0;border-top:1px solid #1e293b;background:#07111f;color:#f8fafc;padding:11px 12px;cursor:pointer}.dfFormulaSuggestion:first-child{border-top:0}.dfFormulaSuggestion b{display:block;color:#fde68a;font-size:13px}.dfFormulaSuggestion span{display:block;color:#cbd5e1;font-size:10px;line-height:1.4;margin-top:3px}.dfFormulaSuggestion:hover,.dfFormulaSuggestion:focus{background:#0b1d38;outline:none}
#dfTeamFormulaStatus{margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:8px 10px;font-size:10px;line-height:1.4;color:#94a3b8}
#dfFormulaLoadedMsg{margin-top:7px;border:1px solid #166534;background:#082414;border-radius:9px;padding:7px 9px;color:#86efac;font-size:10px;font-weight:850}
`;document.head.appendChild(s)}
function ensureStatus(){addStyle();const input=$('foNome');if(!input)return null;let e=$('dfTeamFormulaStatus');if(e)return e;e=document.createElement('div');e.id='dfTeamFormulaStatus';input.insertAdjacentElement('afterend',e);return e}
function status(text,type){const e=ensureStatus();if(!e)return;e.textContent=text;e.style.color=type==='ok'?'#86efac':type==='warn'?'#fde68a':type==='bad'?'#fca5a5':'#94a3b8';e.style.borderColor=type==='ok'?'#166534':type==='warn'?'#a16207':type==='bad'?'#7f1d1d':'#334155'}
function ensureSuggest(){addStyle();const input=$('foNome');if(!input)return null;let box=$('dfFormulaSuggest');if(box&&box.previousElementSibling!==input&&box.parentNode){box.remove();box=null}if(!box){box=document.createElement('div');box.id='dfFormulaSuggest';input.insertAdjacentElement('afterend',box)}return box}
function esc(t){return String(t??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fm(v,d){const n=Number(v);return Number.isFinite(n)&&n>0?n.toLocaleString('pt-BR',{minimumFractionDigits:d??0,maximumFractionDigits:d??2}):''}
function materialSummary(f){const mats=localMats(),by={};mats.forEach(m=>by[String(m?.id??'')]=m);return (f.rows||[]).slice(0,5).map(r=>{const m=by[String(r?.id??'')]||r;const n=clean(m?.nome||r?.nome);return n?(n+(num(r?.pct)>0?' '+fm(r.pct,2)+'%':'')):''}).filter(Boolean).join(' • ')}
function measureSummary(f){const o=normalizedOp(f),bits=[];if(o.largura&&o.comprimento)bits.push(fm(o.largura,1)+' × '+fm(o.comprimento,1)+' cm');else if(o.largura)bits.push('Largura '+fm(o.largura,1)+' cm');if(o.micra)bits.push(fm(o.micra,2)+' micra');return bits.join(' • ')}
function rankedMatches(q){const k=key(q);if(k.length<2)return[];return uniqueForms(localForms()).map((f,i)=>{const fk=key(f.nome);let rank=9;if(fk===k)rank=0;else if(fk.startsWith(k))rank=1;else if(fk.includes(k))rank=2;else if(k.split(' ').every(p=>fk.includes(p)))rank=3;return{f,rank,i}}).filter(x=>x.rank<9).sort((a,b)=>a.rank-b.rank||a.i-b.i).slice(0,7).map(x=>x.f)}
function renderSuggest(value){const box=ensureSuggest();if(!box)return;const list=rankedMatches(value);if(!list.length){box.classList.remove('on');box.innerHTML='';return}box.innerHTML=list.map(f=>{const ms=measureSummary(f),mats=materialSummary(f),sub=[ms,mats].filter(Boolean).join(' • ');return '<button type="button" class="dfFormulaSuggestion" data-dfformula="'+esc(String(f.id))+'"><b>'+esc(f.nome)+'</b><span>'+esc(sub||'Formulação salva da equipe')+'</span></button>'}).join('');box.classList.add('on')}
function setValue(id,v){const e=$(id);if(!e||!(Number(v)>0))return;e.value=String(v).replace('.',',');try{e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}catch(_) {}}
function showLoaded(){let e=$('dfFormulaLoadedMsg');const input=$('foNome');if(!input)return;if(!e){e=document.createElement('div');e.id='dfFormulaLoadedMsg';const st=$('dfTeamFormulaStatus');(st||input).insertAdjacentElement('afterend',e)}e.textContent='✅ Formulação carregada. Confira, edite o que quiser e salve novamente.';clearTimeout(e.__tm);e.__tm=setTimeout(()=>e.remove(),6500)}
function applyFormula(f){if(!f)return;try{if(typeof window.abrirFormula==='function')window.abrirFormula(f,false)}catch(e){}const n=$('foNome');if(n)n.value=f.nome||'';const total=$('foTotal');if(total&&num(f.total)>0)total.value=String(f.total).replace('.',',');const o=normalizedOp(f);setValue('exL',o.largura);setValue('exComp',o.comprimento);setValue('exM',o.micra);try{if(typeof window.calcEx==='function')setTimeout(()=>window.calcEx(),40);if(typeof window.calcFo==='function')setTimeout(()=>window.calcFo(),60)}catch(e){}const box=$('dfFormulaSuggest');if(box){box.classList.remove('on');box.innerHTML=''}showLoaded();try{window.dispatchEvent(new CustomEvent('df-team-formula-selected',{detail:{id:f.id,nome:f.nome}}))}catch(e){}}

async function apiPost(path,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;er.data=j;throw er}return j}
function serverForms(rows){return uniqueForms((Array.isArray(rows)?rows:[]).map(x=>({id:x?.id??x?.formulaId,nome:x?.nome??x?.name,total:x?.total,rows:x?.rows,custo:x?.custo,custoKg:x?.custoKg,op:x?.op,criado:x?.criado??x?.createdAt,updatedAt:x?.updatedAt})))}
function applyServer(rows){const forms=serverForms(rows);applying=true;try{localStorage.setItem(FORM_KEY,JSON.stringify(forms));lastLocalHash=hashForms(forms)}finally{applying=false}try{if(typeof window.renderForms==='function')window.renderForms()}catch(e){}const v=$('foNome')?.value;if(v)renderSuggest(v);try{window.dispatchEvent(new CustomEvent('df-team-formulas-updated',{detail:{count:forms.length,teamId:currentTeamId}}))}catch(e){}return forms}

async function pushForms(fillOnly){const t=team();if(!t?.teamId||!initialized)return false;const forms=uniqueForms(localForms());if(!forms.length)return true;const j=await apiPost('/op/team/formulas/upsert',{teamId:String(t.teamId),fillOnly:!!fillOnly,formulas});applyServer(j.formulas||[]);lastPull=Date.now();status('☁️ Biblioteca de formulações sincronizada • '+(j.formulas||[]).length+' salva'+((j.formulas||[]).length===1?'':'s'),'ok');return true}
async function sync(force){const t=team();if(!t?.teamId){initialized=false;currentTeamId='';status('Formulações salvas somente neste aparelho. Conecte uma equipe para compartilhar.','');return false}if(syncing)return false;if(!force&&Date.now()-lastPull<20000)return true;syncing=true;currentTeamId=String(t.teamId);try{
  let j=await apiPost('/op/team/formulas/list',{teamId:currentTeamId});
  if(!j.initialized){
    if(isOwner()){
      const own=uniqueForms(localForms());status('☁️ Publicando suas formulações para a equipe...','warn');j=await apiPost('/op/team/formulas/seed-owner',{teamId:currentTeamId,formulas:own});
    }else{initialized=false;status('☁️ Aguardando o DONO publicar a biblioteca de formulações.','warn');lastPull=Date.now();return false}
  }
  initialized=true;
  const before=uniqueForms(localForms()),server=serverForms(j.formulas||[]),serverKeys=new Set(server.map(f=>key(f.nome))),missing=before.filter(f=>!serverKeys.has(key(f.nome)));
  if(missing.length){j=await apiPost('/op/team/formulas/upsert',{teamId:currentTeamId,fillOnly:true,formulas:missing})}
  const forms=applyServer(j.formulas||server);lastPull=Date.now();status('☁️ Formulações da equipe sincronizadas • '+forms.length+' salva'+(forms.length===1?'':'s'),'ok');return true
}catch(e){if(Number(e?.status)===404)status('⚠️ Atualize o Worker para ativar as formulações compartilhadas.','warn');else status('⚠️ Formulações aguardando sincronização: '+String(e?.message||e),'warn');return false}finally{syncing=false}}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(()=>sync(!!force),ms==null?250:ms)}
function schedulePush(){if(applying)return;clearTimeout(pushTimer);pushTimer=setTimeout(async()=>{const now=hashForms(localForms());if(now===lastLocalHash)return;lastLocalHash=now;try{if(team()?.teamId){if(!initialized)await sync(true);if(initialized)await pushForms(false)}}catch(e){status('⚠️ A formulação ficou salva neste aparelho e será sincronizada depois.','warn')}},500)}

try{const previousSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const watch=this===localStorage&&String(k)===FORM_KEY,old=watch?String(this.getItem(k)||''):'';const out=previousSetItem.call(this,k,v);if(watch&&!applying&&old!==String(v||''))schedulePush();return out}}catch(e){}

async function deleteTeamFormula(f){const t=team();if(!t?.teamId||!f)return false;if(!isOwner()){alert('Somente o dono pode excluir uma formulação da biblioteca da equipe.');return false}if(!confirm('Excluir a formulação "'+String(f.nome||'Formulação')+'" para toda a equipe?'))return false;try{const j=await apiPost('/op/team/formulas/delete',{teamId:String(t.teamId),formulaId:String(f.id||'')});applyServer(j.formulas||[]);status('✅ Formulação excluída da biblioteca da equipe.','ok');return true}catch(e){alert(String(e?.message||e));return false}}
function selectedFormula(){const id=$('foSavedSelect')?.value;return localForms().find(f=>String(f?.id)===String(id))}

function boot(){addStyle();lastLocalHash=hashForms(localForms());setTimeout(()=>{ensureStatus();ensureSuggest();sync(true)},850);setTimeout(()=>{ensureStatus();ensureSuggest()},1700);setTimeout(()=>{ensureStatus();ensureSuggest()},3200);
  document.addEventListener('input',e=>{if(e.target?.id==='foNome')renderSuggest(e.target.value)},true);
  document.addEventListener('focusin',e=>{if(e.target?.id==='foNome')renderSuggest(e.target.value)},true);
  document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-dfformula]');if(b){e.preventDefault();e.stopPropagation();const f=localForms().find(x=>String(x?.id)===String(b.dataset.dfformula));applyFormula(f);return}if(!e.target?.closest?.('#foNome,#dfFormulaSuggest')){$('dfFormulaSuggest')?.classList.remove('on')}if(e.target?.closest?.('#btFo,#dfFormTabCore,#dfCloudRefresh'))schedule(200,true)},true);
  window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-fosafe="del"]');if(!b||!team()?.teamId)return;e.preventDefault();e.stopImmediatePropagation();deleteTeamFormula(selectedFormula())},true);
  ['df-team-joined','df-team-changed','online','pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>schedule(320,true)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(350,false)});
  setInterval(()=>{if(!document.hidden&&team()?.teamId&&Date.now()-lastPull>55000)sync(false)},60000);
}
window.DFTeamFormulasShared={sync:()=>sync(true),select:applyFormula,initialized:()=>initialized};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
