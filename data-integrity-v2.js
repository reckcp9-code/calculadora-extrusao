(function(){
'use strict';
if(window.DFDataIntegrityV2)return;window.DFDataIntegrityV2=true;

const DB='df_data_integrity_v2',STORE='snapshots',MAX=6;
const KEYS=['df_formula_materiais_v2','df_formulacoes_v2','df_formula_ops_auto_v2'];
let dbPromise=null,timer=0,running=false;
const last=new Map();

function report(message,meta){try{window.DFErrorMonitor?.report?.(message,{filename:'data-integrity-v2.js',...(meta||{})})}catch(e){}}
function valid(raw){if(raw==null||raw==='')return true;try{JSON.parse(raw);return true}catch(e){return false}}
function fingerprint(raw){const s=String(raw||'');let h=2166136261,step=Math.max(1,Math.floor(s.length/4096));for(let i=0;i<s.length;i+=step){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)+':'+s.length}
function openDb(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{try{if(!('indexedDB'in window))throw new Error('IndexedDB indisponível');const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE)){const s=d.createObjectStore(STORE,{keyPath:'id'});s.createIndex('keyAt',['key','at'])}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Falha IndexedDB'));r.onblocked=()=>reject(new Error('IndexedDB bloqueado'))}catch(e){reject(e)}});return dbPromise}
async function list(key){const d=await openDb();return new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readonly'),idx=tx.objectStore(STORE).index('keyAt'),range=IDBKeyRange.bound([key,0],[key,Number.MAX_SAFE_INTEGER]),r=idx.getAll(range);r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>b.at-a.at));r.onerror=()=>reject(r.error)})}
async function prune(key){const all=await list(key);if(all.length<=MAX)return;const d=await openDb();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);all.slice(MAX).forEach(x=>s.delete(x.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function recover(key){try{const all=await list(key),good=all.find(x=>x.raw&&valid(x.raw));if(!good)return false;localStorage.setItem(key,good.raw);last.set(key,fingerprint(good.raw));try{window.dispatchEvent(new CustomEvent('df-data-recovered',{detail:{key,at:good.at}}))}catch(e){}return true}catch(e){report('Falha ao recuperar dados locais',{key,error:String(e&&e.message||e)});return false}}
async function snapshot(key,reason){let raw='';try{raw=localStorage.getItem(key)||''}catch(e){return}if(!raw)return;if(!valid(raw)){await recover(key);return}const fp=fingerprint(raw);if(last.get(key)===fp)return;last.set(key,fp);try{const d=await openDb(),at=Date.now();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:key+':'+at+':'+Math.random().toString(36).slice(2,8),key,at,raw,fp,reason:String(reason||'auto')});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});await prune(key)}catch(e){report('Snapshot de segurança indisponível',{key,error:String(e&&e.message||e)})}}
async function scan(reason){if(running)return;running=true;try{for(const key of KEYS){let raw='';try{raw=localStorage.getItem(key)||''}catch(e){}if(!raw)continue;if(!valid(raw))await recover(key);else await snapshot(key,reason)}}finally{running=false}}
function schedule(reason,delay){clearTimeout(timer);timer=setTimeout(()=>{const fn=()=>scan(reason);if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout:2500});else setTimeout(fn,50)},Math.max(250,Number(delay)||700))}

['df-formula-saved','df-op-saved','df-op-updated','df-op-finalized','df-team-materials-updated','df-team-changed'].forEach(n=>window.addEventListener(n,()=>schedule(n,600),{passive:true}));
window.addEventListener('storage',e=>{if(KEYS.includes(String(e.key||'')))schedule('storage',500)},{passive:true});
window.addEventListener('pagehide',()=>{try{KEYS.forEach(k=>{const raw=localStorage.getItem(k)||'';if(raw&&valid(raw))last.set(k,fingerprint(raw))})}catch(e){}},{passive:true});
window.addEventListener('pageshow',()=>schedule('pageshow',1200),{passive:true});
window.addEventListener('online',()=>schedule('online',1600),{passive:true});

window.DFDataIntegrity={scan:()=>scan('manual'),recover,history:list,keys:[...KEYS]};
function boot(){schedule('boot',1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
