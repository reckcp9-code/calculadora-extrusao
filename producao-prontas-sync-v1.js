(function(){
'use strict';
if(window.DF_PRODUCAO_PRONTAS_SYNC_V1)return;window.DF_PRODUCAO_PRONTAS_SYNC_V1=true;
const OPS_KEY='df_producao_ops_setores_test_v3';
const AUTO_KEY='df_producao_ops_auto_v1';
const TEAM_KEY='df_producao_team_v2';
const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
function read(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function rolls(){return Array.from({length:56},(_,i)=>({n:i+1,peso:'',apara:''}))}
function stops(){return Array.from({length:8},()=>({code:'',start:'',end:'',minutes:0}))}
function sectorFor(machine){const m=String(machine||'').toUpperCase();if(m.includes('SACOLEIRA'))return'Sacoleira';if(m.includes('BLOCADORA'))return'Blocadora';return'Picote'}
function repairReadyOps(){
  const team=read(TEAM_KEY,null);if(!team?.teamId)return false;
  const ready=read(AUTO_KEY,[]),ops=read(OPS_KEY,[]);if(!Array.isArray(ready)||!Array.isArray(ops))return false;
  let changed=false;
  for(const r of ready){
    if(!r||r.status!=='ok')continue;
    const id=norm(r.opId||r.id);if(!id.startsWith('DFOP-'))continue;
    if(ops.some(o=>norm(o?.id)===id))continue;
    ops.unshift({
      id,
      sector:sectorFor(r.machine),
      machine:String(r.machine||''),product:String(r.product||''),measure:String(r.measure||''),
      operator:String(r.operator||''),shift:String(r.shift||''),
      start:String(r.start||r.date||''),end:String(r.end||r.date||''),
      createdAt:String(r.createdAt||new Date().toISOString()),status:'closed',closedAt:String(r.updatedAt||r.createdAt||new Date().toISOString()),
      rolls:rolls(),stops:stops(),test:false,
      autoProduction:Number(r.production||0)||0,autoScrap:Number(r.scrap||0)||0,
      autoNet:Math.max(0,(Number(r.production||0)||0)-(Number(r.scrap||0)||0)),
      autoUpdatedAt:String(r.updatedAt||r.createdAt||new Date().toISOString()),
      productionTeamId:String(team.teamId)
    });
    changed=true;
  }
  if(changed)write(OPS_KEY,ops);
  return changed;
}
let busy=false;
async function syncNow(force){
  if(busy||document.hidden||navigator.onLine===false)return;
  const api=window.DFProducaoEquipeOnline;if(!api?.team?.()?.teamId)return;
  busy=true;
  try{
    const repaired=repairReadyOps();
    if(repaired||force)await api.push?.();
    await api.pull?.();
  }catch(e){}finally{busy=false}
}
function boot(){
  let tries=0;
  const t=setInterval(()=>{tries++;if(window.DFProducaoEquipeOnline?.team){clearInterval(t);repairReadyOps();setTimeout(()=>syncNow(true),500)}else if(tries>80)clearInterval(t)},100);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#dfPAEditSave,[data-pa-del]'))setTimeout(()=>syncNow(true),700)},true);
  window.addEventListener('df-producao-auto-saved',()=>setTimeout(()=>syncNow(true),80));
  window.addEventListener('df-producao-auto-deleted',()=>setTimeout(()=>syncNow(true),80));
  window.addEventListener('focus',()=>setTimeout(()=>syncNow(false),300));
  window.addEventListener('pageshow',()=>setTimeout(()=>syncNow(false),500));
  window.addEventListener('online',()=>setTimeout(()=>syncNow(true),500));
  setInterval(()=>syncNow(false),7000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
