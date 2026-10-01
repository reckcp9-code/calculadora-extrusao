(function(){
'use strict';
if(window.DFDataIntegrityV1)return;window.DFDataIntegrityV1=true;
const DB='df_data_integrity_v1',STORE='snapshots',MAX=5;
const KEYS=['df_formula_materiais_v2','df_formulacoes_v2','df_formula_ops_auto_v2'];
let dbPromise=null,timer=0,last=new Map();
function report(message,meta){try{window.DFErrorMonitor?.report?.(message,{filename:'data-integrity-v1.js',...(meta||{})})}catch(e){}}
function openDb(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE)){const s=d.createObjectStore(STORE,{keyPath:'id'});s.createIndex('keyAt',['key','at'])}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}catch(e){reject(e)}});return dbPromise}
function validRaw(raw){if(raw==null||raw==='')return{ok:true,value:null};try{const v=JSON.parse(raw);return{ok:v!==undefined,value:v}}catch(e){return{ok:false,error:e}}}
function fingerprint(raw){let h=2166136261,s=String(raw||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)+':'+s.length}
async function list(key){const d=await openDb();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>resolve((r.result||[]).filter(x=>x.key===key).sort((a,b)=>b.at-a.at));r.onerror=()=>reject(r.error)})}
async function prune(key){const all=await list(key);if(all.length<=MAX)return;const d=await openDb();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);all.slice(MAX).forEach(x=>s.delete(x.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function snapshot(key,reason){let raw='';try{raw=localStorage.getItem(key)}catch(e){return}if(!raw)return;const chk=validRaw(raw);if(!chk.ok){await recoverCorrupt(key,raw);return}const fp=fingerprint(raw);if(last.get(key)===fp)return;last.set(key,fp);try{const d=await openDb(),at=Date.now();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:key+':'+at+':'+Math.random().toString(36).slice(2,7),key,at,raw,fp,reason:String(reason||'auto')});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});await prune(key)}catch(e){report('Falha ao criar snapshot de segurança',{key,error:String(e&&e.message||e)})}}
async function recoverCorrupt(key,badRaw){try{const all=await list(key),good=all.find(x=>validRaw(x.raw).ok&&x.raw);if(!good){report('Dados locais corrompidos sem snapshot disponível',{key});return false}localStorage.setItem(key,good.raw);last.set(key,fingerprint(good.raw));try{window.dispatchEvent(new CustomEvent('df-data-recovered',{detail:{key,at:good.at}}))}catch(e){}report('Dados locais recuperados de snapshot',{key});return true}catch(e){report('Falha ao recuperar dados locais',{key,error:String(e&&e.message||e)});return false}}
async function scan(reason){for(const key of KEYS){let raw=null;try{raw=localStorage.getItem(key)}catch(e){}if(raw&& !validRaw(raw).ok)await recoverCorrupt(key,raw);else if(raw)await snapshot(key,reason)}}
function schedule(reason,delay){clearTimeout(timer);timer=setTimeout(()=>scan(reason),Number(delay)||350)}
async function recover(key){if(!KEYS.includes(key))return false;const all=await list(key),good=all.find(x=>validRaw(x.raw).ok&&x.raw);if(!good)return false;try{localStorage.setItem(key,good.raw);last.set(key,fingerprint(good.raw));return true}catch(e){return false}}
window.DFDataIntegrity={scan:()=>scan('manual'),recover,history:list,keys:[...KEYS]};
['df-formula-saved','df-op-saved','df-op-updated','df-op-finalized','df-team-changed'].forEach(n=>window.addEventListener(n,()=>schedule(n,120)));
window.addEventListener('online',()=>schedule('online',500));
document.addEventListener('visibilitychange',()=>{if(document.hidden)schedule('hidden',50)});
window.addEventListener('pagehide',()=>schedule('pagehide',0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan('boot');setInterval(()=>scan('periodic'),10000)},{once:true});else{scan('boot');setInterval(()=>scan('periodic'),10000)}
})();