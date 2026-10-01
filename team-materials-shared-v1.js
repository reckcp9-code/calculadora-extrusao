(function(){
'use strict';
if(window.DFTeamMaterialsSharedV1)return;window.DFTeamMaterialsSharedV1=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const MAT_KEY='df_formula_materiais_v2',FORM_KEY='df_formulacoes_v2',TEAM_KEY='df_op_team_v1';
let syncing=false,actionBusy=false,timer=0,lastPull=0,initialized=false,currentTeamId='';

const $=id=>document.getElementById(id);
function loadJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t&&t.teamId)return t}}catch(e){}return loadJson(TEAM_KEY,null)}
function isOwner(){return String(team()?.role||'').toLowerCase()==='owner'}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function key(v){let s=clean(v);try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)&&n>0?n:0}
function localMats(){const a=loadJson(MAT_KEY,[]);return Array.isArray(a)?a:[]}
function serverMats(rows){return (Array.isArray(rows)?rows:[]).map(m=>({id:String(m?.id??m?.materialId??''),nome:clean(m?.nome??m?.name),preco:Number(m?.preco??m?.price)||0})).filter(m=>m.id&&m.nome)}

function ensureStatus(){
  const save=$('matSave');if(!save)return null;let e=$('dfTeamMaterialsStatus');if(e)return e;
  e=document.createElement('div');e.id='dfTeamMaterialsStatus';e.style.cssText='margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:9px 10px;font-size:11px;line-height:1.4;color:#94a3b8';
  const mgr=$('dfMaterialManager');if(mgr)mgr.insertAdjacentElement('afterend',e);else save.insertAdjacentElement('afterend',e);return e;
}
function status(text,type){const e=ensureStatus();if(!e)return;e.textContent=text;e.style.color=type==='ok'?'#86efac':type==='warn'?'#fde68a':type==='bad'?'#fca5a5':'#94a3b8';e.style.borderColor=type==='ok'?'#166534':type==='warn'?'#a16207':type==='bad'?'#7f1d1d':'#334155'}

async function apiPost(path,body){
  const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}
  if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;er.data=j;throw er}return j;
}

function migrateSavedForms(mats){
  const forms=loadJson(FORM_KEY,[]);if(!Array.isArray(forms)||!forms.length)return false;const by={};mats.forEach(m=>{by[key(m.nome)]=m});let changed=false;
  for(const f of forms){if(!Array.isArray(f?.rows))continue;for(const r of f.rows){const hit=by[key(r?.nome)];if(!hit)continue;if(String(r.id)!==String(hit.id)){r.id=hit.id;changed=true}if(clean(r.nome)!==hit.nome){r.nome=hit.nome;changed=true}if(Number(r.preco||0)!==Number(hit.preco||0)){r.preco=Number(hit.preco||0);changed=true}}}
  if(changed)try{localStorage.setItem(FORM_KEY,JSON.stringify(forms))}catch(e){}return changed;
}
function refreshFormulaUi(mats){
  try{
    if(typeof window.getFoRows==='function'&&typeof window.renderMixRows==='function'){
      const by={};mats.forEach(m=>{by[key(m.nome)]=m});const rows=(window.getFoRows()||[]).map(r=>{const hit=by[key(r?.nome)];return hit?{...r,id:hit.id,nome:hit.nome,preco:hit.preco}:r});window.renderMixRows(rows);
    }
    if(typeof window.renderForms==='function')window.renderForms();
  }catch(e){}
  try{
    const panel=$('dfMaterialManagerPanel'),btn=$('dfMaterialEditBtn');if(panel&&btn&&panel.style.display!=='none'){btn.click();btn.click()}
  }catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-team-materials-updated',{detail:{count:mats.length,teamId:currentTeamId}}))}catch(e){}
}
function apply(rows){const mats=serverMats(rows),raw=JSON.stringify(mats),old=String(localStorage.getItem(MAT_KEY)||'[]');if(raw!==old){localStorage.setItem(MAT_KEY,raw);migrateSavedForms(mats);refreshFormulaUi(mats)}return mats}

async function sync(force){
  const t=team();if(!t?.teamId){initialized=false;currentTeamId='';status('Materiais locais deste aparelho. Conecte uma equipe para compartilhar.','');return false}
  if(syncing)return false;if(!force&&Date.now()-lastPull<15000)return true;syncing=true;currentTeamId=String(t.teamId);
  try{
    let j=await apiPost('/op/team/materials/list',{teamId:currentTeamId});
    if(!j.initialized){
      if(String(t.role||'').toLowerCase()==='owner'){
        const own=localMats().map(m=>({id:String(m?.id??''),nome:clean(m?.nome),preco:Number(m?.preco)||0})).filter(m=>m.nome);
        status('☁️ Publicando sua lista de materiais para a equipe...','warn');
        j=await apiPost('/op/team/materials/seed-owner',{teamId:currentTeamId,materials:own});
      }else{
        initialized=false;status('☁️ Aguardando o DONO publicar a lista oficial de materiais.','warn');lastPull=Date.now();return false;
      }
    }
    initialized=true;const mats=apply(j.materials||[]);lastPull=Date.now();status('☁️ Materiais da equipe sincronizados • '+mats.length+' cadastrado'+(mats.length===1?'':'s'),'ok');return true;
  }catch(e){
    if(Number(e?.status)===404)status('⚠️ Atualize o Worker para ativar materiais compartilhados da equipe.','warn');else status('⚠️ Materiais aguardando sincronização: '+String(e?.message||e),'warn');return false;
  }finally{syncing=false}
}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(()=>sync(!!force),ms==null?250:ms)}

async function ensureReady(){const t=team();if(!t?.teamId)return false;if(!initialized||String(t.teamId)!==currentTeamId)await sync(true);return initialized}
async function addMaterial(){
  if(actionBusy)return;const t=team();if(!t?.teamId)return;const ne=$('matNome1'),pe=$('matPreco1'),nome=clean(ne?.value||''),preco=num(pe?.value||'');if(!nome){alert('Digite o nome do material.');ne?.focus();return}
  actionBusy=true;const b=$('matSave'),old=b?.textContent;if(b){b.disabled=true;b.textContent='SALVANDO NA EQUIPE...'}
  try{
    if(!await ensureReady())throw new Error('A lista oficial ainda não foi publicada pelo dono.');
    const j=await apiPost('/op/team/materials/add',{teamId:String(t.teamId),nome,preco});const mats=apply(j.materials||[]);status('✅ Material cadastrado para toda a equipe • '+mats.length+' materiais','ok');if(ne)ne.value='';if(pe)pe.value='';ne?.focus();
  }catch(e){alert(e?.data?.duplicate?'Esse material já está cadastrado na equipe.':String(e?.message||e))}
  finally{actionBusy=false;if(b){b.disabled=false;b.textContent=old||'CADASTRAR MATERIAL'}}
}
async function updateMaterial(id){
  if(actionBusy)return;const t=team();if(!t?.teamId)return;if(!isOwner()){alert('Somente o dono pode editar materiais da equipe.');return}
  const escId=window.CSS&&CSS.escape?CSS.escape(String(id)):String(id).replace(/["\\]/g,'\\$&'),ed=document.querySelector('[data-editor="'+escId+'"]');if(!ed)return;const nome=clean(ed.querySelector('[data-field="name"]')?.value||''),preco=num(ed.querySelector('[data-field="price"]')?.value||'');if(!nome){alert('Digite o nome do material.');return}
  actionBusy=true;try{const j=await apiPost('/op/team/materials/update',{teamId:String(t.teamId),materialId:String(id),nome,preco});apply(j.materials||[]);status('✅ Material atualizado para toda a equipe.','ok')}catch(e){alert(e?.data?.duplicate?'Já existe outro material com esse nome na equipe.':String(e?.message||e))}finally{actionBusy=false}
}
async function deleteMaterial(id){
  if(actionBusy)return;const t=team();if(!t?.teamId)return;if(!isOwner()){alert('Somente o dono pode excluir materiais da equipe.');return}const m=localMats().find(x=>String(x.id)===String(id));if(!confirm('Excluir o material "'+String(m?.nome||'Material')+'" da lista de toda a equipe?'))return;
  actionBusy=true;try{const j=await apiPost('/op/team/materials/delete',{teamId:String(t.teamId),materialId:String(id)});apply(j.materials||[]);status('✅ Material excluído da lista da equipe.','ok')}catch(e){alert(String(e?.message||e))}finally{actionBusy=false}
}

function captureClick(e){
  const t=team();if(!t?.teamId)return;
  const add=e.target?.closest?.('#matSave');if(add){e.preventDefault();e.stopImmediatePropagation();addMaterial();return}
  const m=e.target?.closest?.('[data-dfmat]');if(!m)return;const act=String(m.dataset.dfmat||''),id=m.dataset.id;
  if(act==='edit'&&!isOwner()){e.preventDefault();e.stopImmediatePropagation();alert('Somente o dono pode editar ou excluir materiais. Você pode cadastrar novos materiais diferentes.');return}
  if(act==='save'){e.preventDefault();e.stopImmediatePropagation();updateMaterial(id);return}
  if(act==='delete'){e.preventDefault();e.stopImmediatePropagation();deleteMaterial(id);return}
}
function captureKey(e){const t=team();if(!t?.teamId||e.key!=='Enter')return;if(e.target?.id==='matNome1'||e.target?.id==='matPreco1'){e.preventDefault();e.stopImmediatePropagation();addMaterial()}}

function boot(){
  setTimeout(()=>{ensureStatus();sync(true)},900);setTimeout(ensureStatus,1800);setTimeout(ensureStatus,3200);
  document.addEventListener('click',captureClick,true);document.addEventListener('keydown',captureKey,true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#btFo,#dfFormTabCore,#dfCloudRefresh,#dfMaterialEditBtn'))schedule(180,true)},true);
  ['df-team-joined','df-team-changed','online','pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>schedule(300,true)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(350,false)});
  setInterval(()=>{if(!document.hidden&&team()?.teamId&&Date.now()-lastPull>55000)sync(false)},60000);
}
window.DFTeamMaterialsShared={sync:()=>sync(true),initialized:()=>initialized};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
