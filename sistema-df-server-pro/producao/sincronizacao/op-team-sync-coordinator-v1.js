(function(){'use strict';
if(window.DFOpTeamSyncCoordinatorV1)return;
window.DFOpTeamSyncCoordinatorV1=true;
const PERIOD=7000,REQUEST_TIMEOUT=8500;
let busy=false,last=0,pending=false,attempt=0,booted=false;
const inflight=new Map();
function team(key){try{return key==='production'?JSON.parse(localStorage.getItem('df_producao_team_v2')||'null'):(window.DFOpCloud?.team?.()||JSON.parse(localStorage.getItem('df_op_team_v1')||'null'))}catch(e){return null}}
function notify(detail){try{window.dispatchEvent(new CustomEvent('df-op-team-sync-result',{detail}))}catch(e){}}
async function limited(fn,name){let timeout;
 // Uma requisição lenta pode continuar após o timeout visual. Nunca duplicá-la.
 if(inflight.has(name))return{ok:false,name,error:'request still in progress'};
 const running=Promise.resolve().then(fn);
 inflight.set(name,running);
 running.then(()=>{if(inflight.get(name)===running)inflight.delete(name)},()=>{if(inflight.get(name)===running)inflight.delete(name)});
 try{
 const result=await Promise.race([running,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error(name+' timeout')),REQUEST_TIMEOUT)})]);
 return{ok:result!==false,name};
 }catch(e){return{ok:false,name,error:String(e?.message||e)}}finally{clearTimeout(timeout)}}
async function sync(force){
 if(navigator.onLine===false||document.hidden)return false;
 if(busy){pending=true;return false}
 if(!team()?.teamId&&!team('production')?.teamId)return false;
 if(!force&&Date.now()-last<PERIOD)return true;
 busy=true;let results=[];
 try{
 const jobs=[],a=window.DFOpServerAuthority,b=window.DFOpCloud,c=window.DFOpSyncLite;
 if(team()?.teamId){
  if(a?.sync)jobs.push(['formula-d1',()=>a.sync(true)]);
  if(a?.flush)jobs.push(['formula-queue',()=>a.flush()]);
  if(window.DFTeamFormulasShared?.sync)jobs.push(['formulas-d1',()=>window.DFTeamFormulasShared.sync()]);
  if(b?.sync)jobs.push(['formula-photos-d1',()=>b.sync(true)]);
  if(b?.uploadPending)jobs.push(['formula-photos-upload',()=>b.uploadPending()]);
  if(c?.sync)jobs.push(['formula-light',()=>c.sync(true)]);
 }
 if(team('production')?.teamId&&window.DFProducaoEquipeOnline?.pull)jobs.push(['production-d1',()=>window.DFProducaoEquipeOnline.pull()]);
 // Independent modules: one slow photo upload cannot block D1 record sync.
 results=await Promise.all(jobs.map(([name,fn])=>limited(fn,name)));
 // Fotos são auxiliares; uma falha nelas não invalida OPs sincronizadas.
 const essential=results.filter(x=>['formula-d1','formulas-d1','production-d1'].includes(x.name));
 const ok=essential.length>0&&essential.every(x=>x.ok);
 if(ok){last=Date.now();attempt=0}else attempt=Math.min(5,attempt+1);
 notify({ok,steps:results.length,modules:results});
 return ok;
 }catch(e){notify({ok:false,error:String(e?.message||e),modules:results});return false}
 finally{busy=false;if(pending){pending=false;setTimeout(()=>sync(true),Math.min(12000,1000*2**Math.min(attempt,4)))}}}
setInterval(()=>{if(!document.hidden&&navigator.onLine!==false)sync(false)},PERIOD);
document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();if(t.includes('SINCRONIZAR PRODUÇÃO')||t.includes('ATUALIZAR PRODUÇÃO'))setTimeout(()=>sync(true),150)});
for(const event of ['df-op-saved','df-op-record-deleted','df-team-joined'])window.addEventListener(event,()=>setTimeout(()=>sync(true),700));
window.addEventListener('online',()=>setTimeout(()=>sync(true),100));
window.addEventListener('df-license-teams-server-verified',()=>setTimeout(()=>sync(true),80));
window.addEventListener('df-license-teams-restored',()=>setTimeout(()=>sync(true),100));
window.addEventListener('df-auth-ready',()=>setTimeout(()=>sync(true),120));
window.addEventListener('df-ui-ready',()=>setTimeout(()=>sync(true),100));
// Start immediately when both modules already have a valid team in this device.
function quickStart(){if(booted)return;booted=true;setTimeout(()=>sync(true),80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',quickStart,{once:true});else quickStart();
window.addEventListener('pageshow',()=>setTimeout(()=>sync(true),120));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>sync(true),120)});
window.DFOpTeamSyncCoordinator={sync,status:()=>({busy,last,attempt})};
})();