(function(){'use strict';
if(window.DFOpTeamSyncCoordinatorV1)return;
window.DFOpTeamSyncCoordinatorV1=true;
const PERIOD=12000,REQUEST_TIMEOUT=11000;
let busy=false,last=0,pending=false,attempt=0;
function team(key){try{return key==='production'?JSON.parse(localStorage.getItem('df_producao_team_v2')||'null'):(window.DFOpCloud?.team?.()||JSON.parse(localStorage.getItem('df_op_team_v1')||'null'))}catch(e){return null}}
function notify(detail){try{window.dispatchEvent(new CustomEvent('df-op-team-sync-result',{detail}))}catch(e){}}
async function limited(fn,name){let timeout;try{
 const result=await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error(name+' timeout')),REQUEST_TIMEOUT)})]);
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
  if(a?.flush)jobs.push(['formula-queue',()=>a.flush()]);
  if(a?.sync)jobs.push(['formula-d1',()=>a.sync(true)]);
  if(window.DFTeamFormulasShared?.sync)jobs.push(['formulas-d1',()=>window.DFTeamFormulasShared.sync()]);
  if(b?.uploadPending)jobs.push(['formula-photos-upload',()=>b.uploadPending()]);
  if(b?.sync)jobs.push(['formula-photos-d1',()=>b.sync(true)]);
  if(c?.sync)jobs.push(['formula-light',()=>c.sync(true)]);
 }
 if(team('production')?.teamId&&window.DFProducaoEquipeOnline?.pull)jobs.push(['production-d1',()=>window.DFProducaoEquipeOnline.pull()]);
 // Independent modules: one slow photo upload cannot block D1 record sync.
 results=await Promise.all(jobs.map(([name,fn])=>limited(fn,name)));
 const ok=results.length>0&&results.every(x=>x.ok);
 if(ok){last=Date.now();attempt=0}else attempt=Math.min(5,attempt+1);
 notify({ok,steps:results.length,modules:results});
 return ok;
 }catch(e){notify({ok:false,error:String(e?.message||e),modules:results});return false}
 finally{busy=false;if(pending){pending=false;setTimeout(()=>sync(true),Math.min(12000,1000*2**Math.min(attempt,4)))}}}
setInterval(()=>{if(!document.hidden&&navigator.onLine!==false)sync(false)},PERIOD);
document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();if(t.includes('SINCRONIZAR PRODUÇÃO')||t.includes('ATUALIZAR PRODUÇÃO'))setTimeout(()=>sync(true),150)});
for(const event of ['df-op-saved','df-op-record-deleted','df-team-joined'])window.addEventListener(event,()=>setTimeout(()=>sync(true),700));
window.addEventListener('online',()=>setTimeout(()=>sync(true),500));
window.addEventListener('pageshow',()=>setTimeout(()=>sync(false),900));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>sync(false),500)});
window.DFOpTeamSyncCoordinator={sync,status:()=>({busy,last,attempt})};
})();