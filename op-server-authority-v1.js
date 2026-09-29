(function(){
'use strict';
if(window.DFOpServerAuthorityV1)return;window.DFOpServerAuthorityV1=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
const OPS_KEY='df_formula_ops_auto_v2',TEAM_KEY='df_op_team_v1',TOMB_KEY='df_deleted_ops_v1';
const QUEUE_KEY='df_op_server_queue_v1',MIG_PREFIX='df_op_d1_migrated_v1:';
let syncing=false,flushing=false,migrating=false,timer=0,lastPull=0,supported=null,lastSummary=null,currentMonth='',booted=false;
const $=id=>document.getElementById(id);
const norm=v=>String(v||'').trim().toUpperCase();
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function team(){try{const t=window.DFOpCloud?.team?.();if(t?.teamId)return t}catch(e){}const t=load(TEAM_KEY,null);return t&&t.teamId?t:null}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function stamp(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function localYmd(value){const d=value?new Date(value):new Date();if(Number.isNaN(d.getTime()))return'';const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function localMonth(){return localYmd().slice(0,7)}
function selectedMonth(){return String($('dfOpMonth')?.value||localMonth()).slice(0,7)}
function opId(o){const a=norm(o?.id),q=norm(o?.qr);return validQr(a)?a:(validQr(q)?q:'')}
function completionValue(o){return o?.manualConfirmedAt||o?.cloudSyncedAt||o?.updatedAt||o?.createdAt||''}
function completed(o){return !!(o&&opId(o)&&num(o.produzido)>0&&Number.isFinite(Number(o.apara))&&Number(o.apara)>=0&&(o.manualConfirmed||String(o.status||'')==='ok'||o.source==='foto-equipe'||/^foto\+recuperacao-prontas/i.test(String(o.source||''))||o.source==='d1-authority'))}
function productName(o){return clean(o?.serverProductName||o?.manualProductName||o?.clienteFormulacao||o?.produto||o?.product||o?.nomeProduto||o?.expected?.title||'')}
function materials(o){return (Array.isArray(o?.materials)?o.materials:[]).slice(0,40).map(m=>({name:clean(m?.name||m?.nome||m?.material),pct:Math.max(0,num(m?.pct??m?.percent??m?.porcentagem)),kg:Math.max(0,num(m?.kg))})).filter(m=>m.name&&(m.pct>0||m.kg>0))}
function localDateFor(o){const d=String(o?.data||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:localYmd(completionValue(o))}
function recordPayload(o){const id=opId(o),completedAt=completionValue(o)||new Date().toISOString();return{opCode:id,productName:productName(o),production:num(o?.produzido),scrap:num(o?.apara),materials:materials(o),operatorName:clean(o?.operador),machine:clean(o?.maquina),photoId:clean(o?.cloudPhotoId),completedAt,localDate:localDateFor(o),requestKey:'save:'+id+':'+String(completedAt)+':'+num(o?.produzido)+':'+num(o?.apara)}}

function deviceId(){try{if(window.DFDeviceIdentity?.get){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}const p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;let credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}const dev=deviceId();if(!credential||!dev)throw Error('Acesso automático indisponível.');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw Error(j.error||'Não consegui renovar a sessão.');token=String(j.token||'').trim();if(!token)throw Error('Sessão vazia.');try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=Error(j.error||('HTTP '+r.status));er.status=r.status;er.data=j;throw er}return j}

function queue(){const q=load(QUEUE_KEY,[]);return Array.isArray(q)?q:[]}
function saveQueue(q){save(QUEUE_KEY,q);emitStatus()}
function enqueue(type,payload,key){const q=queue(),k=String(key||type+':'+Date.now());const i=q.findIndex(x=>x&&x.key===k);const item={key:k,type,payload,createdAt:new Date().toISOString(),tries:i>=0?Number(q[i]?.tries||0):0};if(i>=0)q[i]=item;else q.push(item);saveQueue(q.slice(-300));return item}
function removeQueue(key){const q=queue(),n=q.filter(x=>x?.key!==key);if(n.length!==q.length)saveQueue(n)}
function emitStatus(){try{window.dispatchEvent(new CustomEvent('df-op-server-status',{detail:{supported,queue:queue().length,summary:lastSummary,month:currentMonth,lastPull}}))}catch(e){}}
async function sendItem(item){const t=team();if(!t?.teamId)throw Error('Equipe não conectada.');if(item.type==='upsert')return apiPost('/op/record/upsert',{teamId:t.teamId,...item.payload});if(item.type==='delete')return apiPost('/op/record/delete',{teamId:t.teamId,...item.payload});throw Error('Mutação desconhecida.')}
async function flushQueue(){if(flushing||navigator.onLine===false||document.hidden)return false;const t=team();if(!t?.teamId)return false;flushing=true;try{let q=queue();for(const item of q.slice()){try{await sendItem(item);removeQueue(item.key);supported=true}catch(e){if(Number(e?.status)===404){supported=false;emitStatus();return false}item.tries=Number(item.tries||0)+1;saveQueue(queue().map(x=>x.key===item.key?item:x));if(navigator.onLine===false)return false}}return true}finally{flushing=false}}

function localOps(){const a=load(OPS_KEY,[]);return Array.isArray(a)?a:[]}
function localTombs(){const d=load(TOMB_KEY,{});return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}
function migratePayloads(){return localOps().filter(completed).map(recordPayload).filter(x=>validQr(x.opCode)&&x.production>0)}
async function migrateOnce(){const t=team();if(!t?.teamId||migrating||supported===false)return false;const key=MIG_PREFIX+String(t.teamId);if(localStorage.getItem(key)==='1')return true;migrating=true;try{const all=migratePayloads();for(let i=0;i<all.length;i+=200){await apiPost('/op/record/migrate',{teamId:t.teamId,records:all.slice(i,i+200)});supported=true}localStorage.setItem(key,'1');try{window.dispatchEvent(new CustomEvent('df-op-server-migrated',{detail:{teamId:t.teamId,count:all.length}}))}catch(e){}return true}catch(e){if(Number(e?.status)===404)supported=false;return false}finally{migrating=false;emitStatus()}}

function serverRecToLocal(sr,base){const id=norm(sr?.opCode),ts=String(sr?.completedAt||sr?.updatedAt||new Date().toISOString()),p=num(sr?.production),a=num(sr?.scrap);return{...(base||{}),id,qr:id,createdAt:String(base?.createdAt||ts),updatedAt:String(sr?.updatedAt||ts),data:String(sr?.localDate||localYmd(ts)),numero:base?.numero||'',operador:clean(sr?.operatorName)||base?.operador||'',maquina:clean(sr?.machine)||base?.maquina||'',produto:clean(sr?.productName)||productName(base)||'',serverProductName:clean(sr?.productName)||base?.serverProductName||'',produzido:p,apara:a,materials:Array.isArray(sr?.materials)?sr.materials:materials(base),status:'ok',reasons:[],manualConfirmed:true,manualConfirmedAt:ts,source:'d1-authority',cloudPhotoId:clean(sr?.photoId)||base?.cloudPhotoId||'',d1Revision:num(sr?.revision),d1UpdatedAt:String(sr?.updatedAt||''),d1State:'ready'} }
function recordMonth(o){const d=String(o?.data||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(d))return d;return localYmd(completionValue(o)).slice(0,7)}
function applyServerMonth(month,records,summary){
  if(!/^\d{4}-\d{2}$/.test(month))return false;const old=localOps(),oldBy=new Map();for(const o of old){const id=opId(o);if(id&&!oldBy.has(id))oldBy.set(id,o)}
  const tombs=localTombs(),server=Array.isArray(records)?records:[],serverIds=new Set(server.map(x=>norm(x?.opCode)).filter(validQr));
  const next=old.filter(o=>{const id=opId(o);if(!id)return true;if(recordMonth(o)!==month)return true;if(!completed(o))return true;return false});
  let changed=false;
  for(const sr of server){const id=norm(sr?.opCode);if(!validQr(id))continue;if(String(sr?.state||'ready')==='deleted'){const at=stamp(sr?.deletedAt)||Date.now();const prev=tombs[id];if(!prev||Number(prev.at||0)!==at||!prev.server){tombs[id]={at,server:true,cloudIds:sr?.photoId?[String(sr.photoId)]:[],produto:clean(sr?.productName),produzido:num(sr?.production),apara:num(sr?.scrap)};changed=true}continue}
    if(tombs[id]){delete tombs[id];changed=true}
    next.unshift(serverRecToLocal(sr,oldBy.get(id)));
  }
  for(const [id,t] of Object.entries(tombs)){if(!t?.server)continue;const base=oldBy.get(id);if(base&&recordMonth(base)===month&&!serverIds.has(id)){delete tombs[id];changed=true}}
  try{const before=JSON.stringify(old),after=JSON.stringify(next);if(before!==after){save(OPS_KEY,next);changed=true}}catch(e){save(OPS_KEY,next);changed=true}
  save(TOMB_KEY,tombs);lastSummary=summary||lastSummary;currentMonth=month;
  if(changed){const m=$('dfOpMonth');if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){};try{window.DFOpTeamDateCanonical?.run?.()}catch(e){};try{window.dispatchEvent(new CustomEvent('df-op-d1-applied',{detail:{month,summary:lastSummary}}))}catch(e){}}
  emitStatus();return changed
}

async function pullMonth(force,month){const t=team();if(!t?.teamId||syncing||navigator.onLine===false||document.hidden)return false;month=String(month||selectedMonth()).slice(0,7);if(!force&&month===currentMonth&&Date.now()-lastPull<20000)return true;syncing=true;try{await migrateOnce();if(supported===false)return false;await flushQueue();const j=await apiPost('/op/record/list',{teamId:t.teamId,month,includeDeleted:true});supported=true;lastPull=Date.now();applyServerMonth(month,j.records||[],j.summary||null);return true}catch(e){if(Number(e?.status)===404)supported=false;emitStatus();return false}finally{syncing=false}}
function schedule(ms,force,month){clearTimeout(timer);timer=setTimeout(()=>pullMonth(!!force,month),ms==null?250:ms)}

async function onSaved(rec){if(!rec||!completed(rec))return;const t=team();if(!t?.teamId)return;const p=recordPayload(rec),key=p.requestKey;enqueue('upsert',p,key);if(navigator.onLine!==false){await flushQueue();schedule(250,true,String(p.localDate||'').slice(0,7)||selectedMonth())}}
async function onDeleted(id){id=norm(id);if(!validQr(id))return;const t=team();if(!t?.teamId)return;const key='delete:'+id+':'+Date.now();enqueue('delete',{opCode:id,requestKey:key},key);if(navigator.onLine!==false){await flushQueue();schedule(300,true,selectedMonth())}}

function install(){if(booted)return;booted=true;
  window.addEventListener('df-op-saved',e=>{const r=e?.detail?.record;if(r&&r.source!=='d1-authority')onSaved(r)});
  window.addEventListener('df-op-record-deleted',e=>onDeleted(e?.detail?.id));
  window.addEventListener('df-team-joined',()=>{supported=null;localStorage.removeItem(MIG_PREFIX+String(team()?.teamId||''));schedule(500,true)});
  window.addEventListener('df-team-changed',()=>{supported=null;schedule(500,true)});
  window.addEventListener('online',()=>{flushQueue();schedule(500,true)});
  window.addEventListener('pageshow',()=>schedule(700,false));
  window.addEventListener('focus',()=>schedule(700,false));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){flushQueue();schedule(700,false)}});
  document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth')schedule(180,true,String(e.target.value||''))},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#dfCloudRefresh,[data-pane="month"],[data-pane="ok"],[data-pane="archive"]'))schedule(250,true)},true);
  setInterval(()=>{if(!document.hidden&&team()?.teamId&&Date.now()-lastPull>55000){flushQueue();pullMonth(false)}},60000);
  setTimeout(()=>{migrateOnce().then(()=>schedule(300,true))},1300);
}

window.DFOpServerAuthority={sync:(force=true,month)=>pullMonth(force,month),flush:flushQueue,migrate:migrateOnce,queueCount:()=>queue().length,supported:()=>supported,summary:()=>lastSummary,health:async()=>{const t=team();if(!t?.teamId)throw Error('Equipe não conectada.');return apiPost('/op/system/health',{teamId:t.teamId,month:selectedMonth()})},history:async opCode=>{const t=team();if(!t?.teamId)throw Error('Equipe não conectada.');return apiPost('/op/record/history',{teamId:t.teamId,opCode})}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
