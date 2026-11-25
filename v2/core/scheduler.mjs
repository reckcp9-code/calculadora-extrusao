// DF v2: scheduler independente, sem alterar timers globais.
export function createScheduler({delay=120,onError=console.error}={}){
 const jobs=new Map();let timer=null,disposed=false;
 function flush(){timer=null;if(disposed||document.hidden)return;
 const batch=[...jobs.values()];jobs.clear();
 for(const job of batch){try{job()}catch(e){onError(e)}}
 }
 function arm(){if(timer===null&&!disposed&&!document.hidden)timer=setTimeout(flush,delay)}
 function resume(){arm()}
 document.addEventListener('visibilitychange',resume);
 return {schedule(key,job){if(disposed)return;jobs.set(key,job);arm()},cancel(key){jobs.delete(key)},dispose(){disposed=true;clearTimeout(timer);jobs.clear();document.removeEventListener('visibilitychange',resume)}};
}
export function createSingleFlight(){
 const active=new Map();
 return function run(key,task){if(active.has(key))return active.get(key);
 const p=Promise.resolve().then(task).finally(()=>{if(active.get(key)===p)active.delete(key)});
 active.set(key,p);return p};
}
