(function(){
'use strict';
if(window.DFFormulaDeleteTombstoneV1)return;
window.DFFormulaDeleteTombstoneV1=true;

const FORM_KEY='df_formulacoes_v2';
const TEAM_KEY='df_op_team_v1';
const TOMB_KEY='df_formula_deleted_tombstones_v1';
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TTL=90*24*60*60*1000;

function readJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){const t=window.DFOpCloud.team();if(t&&t.teamId)return t}}catch(e){}return readJson(TEAM_KEY,null)}
function scope(){const t=team();return t&&t.teamId?String(t.teamId):'__local__'}
function idOf(f){return String(f?.id??f?.formulaId??'').trim()}
function allTombs(){const x=readJson(TOMB_KEY,{});return x&&typeof x==='object'?x:{}}
function saveTombs(x){try{localStorage.setItem(TOMB_KEY,JSON.stringify(x))}catch(e){}}
function getScopeTombs(){const all=allTombs(),s=scope(),now=Date.now(),src=all[s]&&typeof all[s]==='object'?all[s]:{},out={};for(const [id,ts] of Object.entries(src)){if(id&&now-Number(ts||0)<TTL)out[id]=Number(ts||now)}if(JSON.stringify(src)!==JSON.stringify(out)){all[s]=out;saveTombs(all)}return out}
function markDeleted(id){id=String(id||'').trim();if(!id)return;const all=allTombs(),s=scope();if(!all[s]||typeof all[s]!=='object')all[s]={};all[s][id]=Date.now();saveTombs(all)}
function isDeleted(id){id=String(id||'').trim();if(!id)return false;return !!getScopeTombs()[id]}
function filterDeleted(list){return (Array.isArray(list)?list:[]).filter(f=>{const id=idOf(f);return !id||!isDeleted(id)})}
function parseForms(v){try{const x=JSON.parse(String(v||'[]'));return Array.isArray(x)?x:[]}catch(e){return null}}

// Bloqueia qualquer sincronização que tente ressuscitar formulações já excluídas.
try{
  const prev=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage&&String(k)===FORM_KEY){
      const a=parseForms(v);
      if(a)v=JSON.stringify(filterDeleted(a));
    }
    return prev.call(this,k,v);
  };
}catch(e){}

// Marca a formulação ANTES do manipulador antigo processar o clique de exclusão.
window.addEventListener('click',function(e){
  const b=e.target&&e.target.closest?e.target.closest('[data-fosafe="del"]'):null;
  if(!b)return;
  try{
    const sel=document.getElementById('foSavedSelect');
    const selectedId=String(sel?.value||'').trim();
    if(selectedId){markDeleted(selectedId);return}
    const forms=readJson(FORM_KEY,[]);
    const name=String(document.getElementById('foNome')?.value||'').trim();
    const f=(Array.isArray(forms)?forms:[]).find(x=>String(x?.nome||x?.name||'').trim()===name);
    const id=idOf(f);if(id)markDeleted(id);
  }catch(_e){}
},true);

async function apiDelete(teamId,id){
  const r=await fetch(API+'/op/team/formulas/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamId:String(teamId),formulaId:String(id)}),cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  let j={};try{j=await r.json()}catch(e){}
  if(j&&j.ok===false)throw new Error(j.error||'Falha ao excluir');
  return true;
}
async function flush(){
  const t=team();
  if(!t?.teamId||String(t.role||'').toLowerCase()!=='owner'||!navigator.onLine)return;
  const tombs=getScopeTombs();
  for(const id of Object.keys(tombs)){
    try{await apiDelete(t.teamId,id)}catch(e){}
  }
}
function scrub(){
  try{
    const cur=readJson(FORM_KEY,[]),clean=filterDeleted(cur);
    if(Array.isArray(cur)&&clean.length!==cur.length)localStorage.setItem(FORM_KEY,JSON.stringify(clean));
  }catch(e){}
}

function boot(){
  scrub();
  setTimeout(scrub,700);
  setTimeout(flush,1200);
  window.addEventListener('online',()=>setTimeout(flush,300));
  window.addEventListener('focus',()=>{setTimeout(scrub,100);setTimeout(flush,400)});
  window.addEventListener('pageshow',()=>{setTimeout(scrub,100);setTimeout(flush,400)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){setTimeout(scrub,100);setTimeout(flush,400)}});
  setInterval(()=>{if(!document.hidden){scrub();flush()}},60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
