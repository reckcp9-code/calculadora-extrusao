(function(){
'use strict';
if(window.DF_PRODUCAO_EQUIPE_SEPARADA_V2)return;window.DF_PRODUCAO_EQUIPE_SEPARADA_V2=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
const TEAM_KEY='df_producao_team_v2',TEAM_CODE_KEY='df_producao_team_join_code_v2',NAME_KEY='df_producao_member_display_name_v2';
const OPS_KEY='df_producao_ops_setores_test_v3',QR_KEY='df_op_qr_registry_test_setores_v3',AUTO_KEY='df_producao_ops_auto_v1',CAD_KEY='df_producao_cadastros_v1';
const SNAP_KEY='df_producao_team_snapshot_v2',CFG_SNAP_KEY='df_producao_team_catalog_snapshot_v2',PHOTO_MAP_KEY='df_producao_team_photo_map_v2';
const DB_NAME='df_producao_ops_fotos_v1';
const DELETE_PENDING_KEY='df_producao_delete_pending_v1';
const EXIT_MARK='df_prod_team_explicit_exit_v1';
const STATE_PREFIX='DFPRODSTATE3.',PHOTO_PREFIX='DFPRODPHOTO3.',CFG_PREFIX='DFPRODCFG3.';
const AREA='producao';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
const clean=v=>String(v||'').replace(/\s+/g,' ').trim().slice(0,60);
const num=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
function read(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function remove(k){try{localStorage.removeItem(k)}catch(e){}}
function team(){const t=read(TEAM_KEY,null);return t&&t.teamId?t:null}
const CODE_BACKUP_KEY='df_producao_team_owner_code_backup_v1';
function rememberedCode(t){
 const id=String(t?.teamId||'');if(!id)return '';
 const main=String(localStorage.getItem(TEAM_CODE_KEY)||'').replace(/\D/g,'');
 const backup=read(CODE_BACKUP_KEY,null);
 const stored=String(t?.joinCode||'').replace(/\D/g,'');
 const valid=v=>/^\d{6,8}$/.test(v);
 if(valid(main))return main;
 if(backup?.teamId===id&&valid(String(backup.code||'')))return String(backup.code);
 return valid(stored)?stored:'';
}
function rememberCode(code,t){
 const value=String(code||'').replace(/\D/g,'');
 if(!/^\d{6,8}$/.test(value)||!t?.teamId)return;
 try{localStorage.setItem(TEAM_CODE_KEY,value);write(CODE_BACKUP_KEY,{teamId:String(t.teamId),code:value})}catch(e){}
}

function setTeam(t){const previous=team();if(t&&t.teamId&&previous?.teamId&&previous.teamId!==t.teamId)throw Error('Saia da equipe atual antes de entrar em outra.');if(t&&t.teamId)write(TEAM_KEY,t);else remove(TEAM_KEY);renderTeam();try{window.dispatchEvent(new CustomEvent('df-producao-team-changed',{detail:{team:t||null}}))}catch(e){}}
function displayName(){try{return clean(localStorage.getItem(NAME_KEY)||'')}catch(e){return''}}
function setDisplayName(v){v=clean(v);try{if(v)localStorage.setItem(NAME_KEY,v)}catch(e){}return v}
function orderOps(a){return a.sort((x,y)=>String(y?.createdAt||'').localeCompare(String(x?.createdAt||''))||norm(y?.id).localeCompare(norm(x?.id)))}
function ops(){const a=read(OPS_KEY,[]);return Array.isArray(a)?orderOps(a):[]}
function autos(){const a=read(AUTO_KEY,[]);return Array.isArray(a)?a:[]}
function config(){const c=read(CAD_KEY,{});return c&&typeof c==='object'?c:{}}
function applyMachineDeletions(cfg){for(const sec of ['Picote','Sacoleira','Blocadora']){const c=cfg[sec];if(!c||typeof c!=='object')continue;const marks=c.deletedMachines||{};if(Array.isArray(c.machines))c.machines=c.machines.filter(v=>!marks[norm(v)]);}return cfg}
function recoverCatalogFromOps(){const cfg=config(),list=ops();if(!list.length)return false;let changed=false;for(const op of list){if(!op||typeof op!=='object')continue;const sec=String(op.sector||'').trim();if(!['Picote','Sacoleira','Blocadora'].includes(sec))continue;const c=cfg[sec]&&typeof cfg[sec]==='object'?cfg[sec]:(cfg[sec]={machines:[],operators:[],products:[],productMeasures:{},machineProducts:{}});for(const [field,key] of [['machine','machines'],['operator','operators'],['product','products']]){const v=String(op[field]||'').trim();if(!v||(field==='machine'&&c.deletedMachines?.[norm(v)]))continue;if(!Array.isArray(c[key]))c[key]=[];if(!c[key].some(x=>String(x).trim().toLowerCase()===v.toLowerCase())){c[key].push(v);changed=true}}}if(changed){write(CAD_KEY,cfg);try{window.dispatchEvent(new CustomEvent('df-producao-cadastros-sincronizados'))}catch(e){}}return changed}
function localYmd(v){const d=v?new Date(v):new Date();if(isNaN(d.getTime()))return'';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function monthOffset(off){const d=new Date();d.setMonth(d.getMonth()+(off||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function rolls(){return Array.from({length:56},(_,i)=>({n:i+1,peso:'',apara:''}))}
function stops(){return Array.from({length:8},()=>({code:'',start:'',end:'',minutes:0}))}
function time(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function nowIso(){return new Date().toISOString()}
function hash(v){let s='';try{s=JSON.stringify(v)}catch(e){s=String(v||'')}let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function enc(v){const s=unescape(encodeURIComponent(JSON.stringify(v)));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}

function deviceId(){try{const x=String(window.DFDeviceIdentity?.get?.()||'').trim();if(x)return x}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}const p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw Error('acesso automático indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw Error('sessão vazia');try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify({...body,area:AREA,scope:AREA}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
async function apiBinaryPhoto(form,retry=true){
 const blob=form.get('photo');if(!(blob instanceof Blob)||!blob.size||blob.size>4000000)throw Error('Arquivo da foto inválido ou maior que 4 MB.');
 const fields=['teamId','photoType','formulaId','sourceId','qr','production','scrap','materials','createdAt','area'],meta={};
 for(const key of fields){const value=form.get(key);if(value!=null)meta[key]=String(value)}
 meta.area=AREA;meta.photoType='production_op';
 const token=await renewSession(false),dev=deviceId();
 const res=await fetch(API+'/op/photo/upload-binary?meta='+encodeURIComponent(JSON.stringify(meta)),{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev,'Content-Type':'image/jpeg'},body:blob,cache:'no-store'});
 let data={};try{data=await res.json()}catch(e){}
 if(res.status===401&&retry){await renewSession(true);return apiBinaryPhoto(form,false)}
 if(!res.ok||data.ok===false||!data.photo?.id)throw Error(data.error||('Falha no envio binário: HTTP '+res.status));
 return data;
}
async function apiForm(path,form,retry){
 form.set('area',AREA);form.set('photoType','production_op');
 const token=await renewSession(false),dev=deviceId();
 const r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},body:form,cache:'no-store'});
 let j={};try{j=await r.json()}catch(e){}
 if(r.status===401&&retry!==false){await renewSession(true);return apiForm(path,form,false)}
 if(!r.ok||j.ok===false){
  const reason=String(j.error||('HTTP '+r.status));
  if(path==='/op/photo/upload'&&/Foto obrigat[oó]ria/i.test(reason))return apiBinaryPhoto(form);
  throw Error(reason)
 }
 return j
}
async function apiBlob(id){let token=await renewSession(false),dev=deviceId(),r=await fetch(API+'/op/photo/get?id='+encodeURIComponent(id),{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'});if(r.status===401){token=await renewSession(true);r=await fetch(API+'/op/photo/get?id='+encodeURIComponent(id),{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'})}if(!r.ok)throw Error('Foto não disponível na equipe de Produção.');return r.blob()}
function tinyBlob(){const b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,c=>c.charCodeAt(0))],{type:'image/png'})}

function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoGet(id){try{const d=await dbOpen();return await new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}catch(e){return null}}
async function compressBlob(blob){if(!blob||!String(blob.type||'').startsWith('image/'))return blob;return new Promise(resolve=>{const img=new Image(),u=URL.createObjectURL(blob);img.onload=()=>{try{const max=1800,sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>resolve(b||blob),'image/jpeg',.78)}catch(e){URL.revokeObjectURL(u);resolve(blob)}};img.onerror=()=>{URL.revokeObjectURL(u);resolve(blob)};img.src=u})}

function normalizedState(o,ready){return{op:{id:norm(o.id),sector:String(o.sector||'Picote'),machine:String(o.machine||''),product:String(o.product||''),measure:String(o.measure||''),operator:String(o.operator||''),shift:String(o.shift||''),start:String(o.start||''),end:String(o.end||''),createdAt:String(o.createdAt||''),status:String(o.status||'open')},auto:ready?{opId:norm(o.id),date:String(ready.date||localYmd(ready.completedAt||ready.createdAt)),createdAt:String(ready.createdAt||''),completedAt:String(ready.completedAt||ready.createdAt||o.autoUpdatedAt||''),machine:String(o.machine||ready.machine||''),product:String(o.product||ready.product||''),measure:String(o.measure||ready.measure||''),operator:String(o.operator||ready.operator||''),shift:String(o.shift||ready.shift||''),production:num(ready.production),scrap:num(ready.scrap),net:Math.max(0,num(ready.production)-num(ready.scrap)),status:ready.status==='pending'?'pending':'ok',hasPhoto:!!ready.photoId}:null}}
function currentStates(){const list=ops(),ready=autos().filter(x=>x&&(x.status==='ok'||x.status==='pending')),out=new Map(),deleted=read(DELETE_PENDING_KEY,{});list.forEach(o=>{const id=norm(o?.id);if(!id.startsWith('DFOP-')||deleted[id])return;const r=ready.find(x=>norm(x?.opId||x?.id)===id)||null;out.set(id,normalizedState(o,r))});
 // Uma baixa pode ter sido salva na lista de fotos antes do cadastro local da OP.
 // Nunca deixar essa pendência presa somente no celular do operador.
 ready.forEach(r=>{const id=norm(r?.opId||r?.id);if(!id.startsWith('DFOP-')||deleted[id]||out.has(id))return;const o={id,sector:r.sector||'Picote',machine:r.machine||'',product:r.product||'',measure:r.measure||'',operator:r.operator||'',shift:r.shift||'',createdAt:r.createdAt||nowIso(),status:r.status==='pending'?'pending':'closed'};out.set(id,normalizedState(o,r))});
 return out}
function registerQR(o){try{const r=read(QR_KEY,{});r[o.id]={id:o.id,createdAt:o.createdAt,sector:o.sector||'Picote',expected:{machine:o.machine||'',product:o.product||'',measure:o.measure||'',operator:o.operator||'',shift:o.shift||'',start:o.start||'',end:o.end||''},test:false};write(QR_KEY,r)}catch(e){}}
function refreshUi(){try{window.DFRenderSavedProductionOps?.()}catch(e){}try{const root=$('dfPrRoot');if(root){const c=document.createComment('df-prod-sync');root.appendChild(c);c.remove()}}catch(e){}/* Preserve current pane during background sync; do not simulate a tab click. */try{window.dispatchEvent(new CustomEvent('df-producao-team-synced'))}catch(e){}}

let uploadBusy=false,pullBusy=false,pushTimer=0,pullTimer=0,lastPrevPull=0;
function setStatus(text,type){const e=$('dfProdTeamV2Status');if(!e)return;e.className='dfProdTeamV2Status '+(type||'');e.textContent=text||''}
async function uploadReadyPhoto(t,id,ready){if(!ready?.photoId||String(ready.photoId).startsWith('CLOUDPROD:'))return'';const ph=await photoGet(ready.photoId);if(!ph?.blob)return'';const map=read(PHOTO_MAP_KEY,{}),savedAt=String(ph.savedAt||ph.createdAt||ready.createdAt||''),old=map[id];if(old?.cloudId&&old?.teamId===t.teamId&&String(old.localSavedAt||'')===savedAt)return String(old.cloudId);const small=await compressBlob(ph.blob);if(!(small instanceof Blob)||!small.size)throw Error('Foto original inválida, não foi enviada.');const meta={v:3,area:AREA,teamId:t.teamId,opId:id,updatedAt:savedAt||nowIso()},form=new FormData();form.append('teamId',t.teamId);form.append('sourceId','DFPRODPHOTO3-'+id+'-'+Date.now());form.append('qr',PHOTO_PREFIX+enc(meta));form.append('production',String(num(ready.production)));form.append('scrap',String(num(ready.scrap)));form.append('createdAt',meta.updatedAt);form.append('photo',small,'producao/op-'+id+'.jpg');const j=await apiForm('/op/photo/upload',form),cloudId=String(j.photo?.id||'');if(!cloudId)throw Error('Servidor não confirmou a foto da Produção.');const verified=await apiBlob(cloudId);if(!verified?.size)throw Error('Foto da Produção não está acessível na nuvem.');if(cloudId){map[id]={cloudId,teamId:t.teamId,localSavedAt:savedAt,updatedAt:meta.updatedAt};write(PHOTO_MAP_KEY,map)}return cloudId}
async function publishState(t,id,state,deleted){const updatedAt=nowIso(),payload={v:3,kind:'df-producao',area:AREA,teamId:t.teamId,opId:id,deleted:!!deleted,updatedAt,state:deleted?null:state},fd=new FormData();fd.append('teamId',t.teamId);fd.append('sourceId','DFPRODSTATE3-'+id+'-'+Date.now());fd.append('qr',STATE_PREFIX+enc(payload));fd.append('production',String(deleted?0:num(state?.auto?.production)));fd.append('scrap',String(deleted?0:num(state?.auto?.scrap)));fd.append('createdAt',updatedAt);fd.append('photo',tinyBlob(),'producao/state.png');await apiForm('/op/photo/upload',fd);return{updatedAt,ts:time(updatedAt)}}
async function publishConfig(t,cfg){const updatedAt=nowIso(),payload={v:3,kind:'df-producao-config',area:AREA,teamId:t.teamId,updatedAt,config:cfg},fd=new FormData();fd.append('teamId',t.teamId);fd.append('sourceId','DFPRODCFG3-'+t.teamId+'-'+Date.now());fd.append('qr',CFG_PREFIX+enc(payload));fd.append('production','0');fd.append('scrap','0');fd.append('createdAt',updatedAt);fd.append('photo',tinyBlob(),'producao/config.png');await apiForm('/op/photo/upload',fd);return{updatedAt,ts:time(updatedAt)}}
// D1 é o registro oficial de baixas pendentes; a foto continua no R2.
async function publishOfficialPending(t,id,state,photoId){
 const a=state?.auto;if(!a||!(num(a.production)>0))return null;
 const payload={teamId:t.teamId,opCode:id,production:num(a.production),scrap:num(a.scrap),productName:state.op?.product||a.product||'',operatorName:state.op?.operator||a.operator||'',machine:state.op?.machine||a.machine||'',photoId:String(photoId||''),completedAt:a.completedAt||a.createdAt||nowIso(),localDate:a.date||localYmd(a.completedAt),requestKey:'dfprod-pending-'+id+'-'+String(a.completedAt||a.createdAt||'')+'-'+num(a.production)+'-'+num(a.scrap)};
 const result=await apiPost('/op/record/upsert',payload);
 if(!result.record||result.record.opCode!==id||!['pending','ready'].includes(result.record.state))throw Error('Servidor não confirmou a baixa da OP '+id);
 return result.record;
}
function inferredSector(machine,oldSector){
 const m=norm(machine),cfg=config();
 for(const sec of ['Picote','Sacoleira','Blocadora']){
  const names=Array.isArray(cfg?.[sec]?.machines)?cfg[sec].machines:[];
  if(names.some(x=>norm(x)===m))return sec;
 }
 if(/BLOCADORA|BLOQUEADORA|BLOCAD/.test(m))return 'Blocadora';
 if(/SACOLEIRA|SACOLA.*FLEX/.test(m))return 'Sacoleira';
 return oldSector||'Picote';
}
async function pullOfficialRecords(t){
 const j=await apiPost('/op/record/list',{teamId:t.teamId,includeDeleted:true});
 if(!Array.isArray(j.records))throw Error('Servidor não retornou a lista oficial de OPs.');
 const states=new Map(),photos={};
 // Baixas antigas recuperadas sem foto são oficiais no D1; não reenvie arquivos inexistentes.
 const existingMark=read(HISTORY_MARK,{}),historyIds=existingMark?.teamId===t.teamId?{...(existingMark.ids||{})}:{};
 let historyChanged=false;
 for(const r of j.records){
  const id=norm(r.opCode);if(!id.startsWith('DFOP-'))continue;
  if(r.state==='deleted'){states.set(id,{opId:id,deleted:true,updatedAt:r.updatedAt||nowIso()});continue}
  if(!['pending','ready'].includes(r.state))continue;
  const old=ops().find(o=>norm(o.id)===id)||{};
  if(r.state==='ready'&&!r.photoId&&!historyIds[id]){historyIds[id]=true;historyChanged=true}
  const state={op:{id,sector:inferredSector(r.machine||old.machine,old.sector),machine:r.machine||old.machine||'',product:r.productName||old.product||'',measure:old.measure||'',operator:r.operatorName||old.operator||'',shift:old.shift||'',createdAt:r.createdAt||r.completedAt||'',status:r.state==='pending'?'pending':'closed'},auto:{opId:id,date:r.localDate||localYmd(r.completedAt),createdAt:r.completedAt,completedAt:r.completedAt,machine:r.machine,product:r.productName,operator:r.operatorName,production:num(r.production),scrap:num(r.scrap),status:r.state==='pending'?'pending':'ok',hasPhoto:!!r.photoId}};
  states.set(id,{opId:id,state,updatedAt:r.updatedAt||nowIso(),official:true});
  if(r.photoId)photos[id]={cloudId:String(r.photoId),teamId:t.teamId,updatedAt:r.updatedAt||nowIso(),ts:time(r.updatedAt)};
 }
 if(historyChanged)write(HISTORY_MARK,{teamId:t.teamId,ids:historyIds});
 return {states,photos};
}

// Recuperação excepcional, limitada às baixas antigas do DONO. Novas OPs continuam exigindo foto.
// O D1 é consultado antes de cada envio: nunca substitui OP oficial nem ressuscita uma exclusão.
const HISTORIC_CUTOFF=Date.parse('2026-10-28T12:00:00Z');
const HISTORY_MARK='df_producao_historico_sem_foto_v647';
let historyBusy=false;
function historyMarks(t){const m=read(HISTORY_MARK,{});return m&&m.teamId===t?.teamId?m.ids||{}:{}}
function historicalTime(row){
 const raw=String(row?.completedAt||row?.createdAt||row?.approvedAt||'');
 const ts=Date.parse(raw);
 if(Number.isFinite(ts)&&ts>0)return ts;
 const code=norm(row?.opId||row?.id),match=code.match(/^DFOP-(\d{4})(\d{2})(\d{2})-/);
 return match?Date.parse(match[1]+'-'+match[2]+'-'+match[3]+'T00:00:00Z'):NaN;
}
function historicEligible(row){
 const id=norm(row?.opId||row?.id);
 return /^DFOP-\d{8}-/.test(id)&&row?.status==='ok'&&num(row.production)>0&&
 num(row.scrap)>=0&&num(row.scrap)<=num(row.production)&&
 Number.isFinite(historicalTime(row))&&historicalTime(row)<HISTORIC_CUTOFF;
}
async function migrateHistoricalProductionData(){
 const t=team();
 if(historyBusy){setStatus('⏳ Já existe uma recuperação histórica em andamento. Aguarde a conclusão antes de enviar novamente.','warn');return false}if(!t?.teamId){setStatus('⚠️ Equipe de Produção não conectada.','warn');return false}if(t.role!=='owner'){setStatus('⚠️ Somente o dono pode recuperar a produção histórica.','warn');return false}if(navigator.onLine===false){setStatus('⚠️ Sem internet para enviar o histórico.','warn');return false}
 historyBusy=true;
 let restored=0,already=0,errors=[],total=0,existingCount=0;
 try{
  // Ler o histórico LOCAL antes de qualquer pull, sem apagar ou alterar os pesos armazenados.
  const candidates=autos().filter(historicEligible);
  const unique=new Map();
  for(const row of candidates){const id=norm(row.opId||row.id);if(!unique.has(id))unique.set(id,row)}
  if(!unique.size){const all=autos(),ready=all.filter(x=>x?.status==='ok');const validId=ready.filter(x=>/^DFOP-\d{8}-/.test(norm(x.opId||x.id)));const validKg=validId.filter(x=>num(x.production)>0&&num(x.scrap)>=0&&num(x.scrap)<=num(x.production));const old=validKg.filter(x=>Number.isFinite(historicalTime(x))&&historicalTime(x)<HISTORIC_CUTOFF);setStatus('⚠️ Nenhuma OP histórica elegível: '+all.length+' baixas, '+ready.length+' concluídas, '+validId.length+' com ID DFOP, '+validKg.length+' com pesos válidos, '+old.length+' com data anterior ao limite. Nenhum dado apagado.','warn');return false;}
  const r=await apiPost('/op/record/list',{teamId:t.teamId,includeDeleted:true});
  if(!Array.isArray(r.records))throw Error('Servidor não forneceu a lista oficial.');
  const official=new Map(r.records.map(x=>[norm(x.opCode),x]));
  const mark=read(HISTORY_MARK,{});
  const ids=mark?.teamId===t.teamId?{...(mark.ids||{})}:{};
  const local=ops();
  for(const [id,row] of unique){
   if(official.has(id)){already++;if(official.get(id)?.state==='ready'){ids[id]=true;write(HISTORY_MARK,{teamId:t.teamId,ids})}continue} // Inclui deleted e pending: nunca ressuscitar nem duplicar.
   const op=local.find(x=>norm(x.id)===id)||{};
   const complete=String(row.completedAt||row.createdAt||'');
   const payload={teamId:t.teamId,opCode:id,production:num(row.production),scrap:num(row.scrap),
    productName:String(row.product||op.product||''),operatorName:String(row.operator||op.operator||''),
    machine:String(row.machine||op.machine||''),completedAt:complete,
    localDate:String(row.date||row.productionDay||localYmd(complete)),
    photoId:'',requestKey:'dfprod-legacy-dataonly-v647-'+id};
   try{
    const saved=await apiPost('/op/record/upsert',payload);
    if(!saved.record||norm(saved.record.opCode)!==id||saved.record.state!=='ready')
     throw Error('Servidor não confirmou PRONTAS para '+id);
    official.set(id,saved.record);ids[id]=true;restored++;
    write(HISTORY_MARK,{teamId:t.teamId,ids}); // Recuperação idempotente após interrupção.
   }catch(e){errors.push(id+': '+String(e?.message||e));if(errors.length>4)break}
  }
  const verify=await apiPost('/op/record/list',{teamId:t.teamId,includeDeleted:true});
  const ready=(verify.records||[]).filter(x=>x.state==='ready');
  total=ready.reduce((n,x)=>n+num(x.production),0);existingCount=ready.length;
  setStatus('📦 HISTÓRICO D1: '+restored+' OPs antigas recuperadas, '+already+
   ' já existentes, '+existingCount+' OPs prontas, '+total.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+
   ' kg no servidor.'+(errors.length?' ⚠️ Falhas: '+errors.slice(0,3).join(' | '):' Sem apagar fotos ou dados locais.'),errors.length?'warn':'ok');
  return !errors.length;
 }catch(e){setStatus('⚠️ Recuperação do histórico interrompida sem apagar dados: '+String(e?.message||e),'warn');return false}
 finally{historyBusy=false}
}
async function syncOnePending(rawId){
 const id=norm(rawId),t=team();if(!t?.teamId||leavingProductionTeam)throw Error('Equipe de Produção não conectada.');
 const rec=autos().find(x=>norm(x?.opId||x?.id)===id&&x.status==='pending');
 if(!rec)throw Error('Baixa pendente não encontrada neste aparelho.');
 if(!rec.photoId||String(rec.photoId).startsWith('CLOUDPROD:'))throw Error('Foto original da baixa não encontrada no aparelho.');
 const ph=await photoGet(rec.photoId);if(!ph?.blob)throw Error('Foto da OP não está salva no aparelho. Não foi enviada ao servidor.');
 const cloudId=await uploadReadyPhoto(t,id,rec);
 if(!cloudId)throw Error('Servidor não confirmou a foto da OP.');
 const op=ops().find(x=>norm(x?.id)===id)||{id,sector:rec.sector,machine:rec.machine,product:rec.product,operator:rec.operator,measure:rec.measure,shift:rec.shift,createdAt:rec.createdAt,status:'pending'};
 const state=normalizedState(op,rec);
 const official=await publishOfficialPending(t,id,state,cloudId);
 if(official?.state!=='pending'&&official?.state!=='ready')throw Error('Servidor não confirmou a pendência.');
 setStatus('✅ Baixa e foto da OP '+id+' confirmadas no D1.','ok');
 return official;
}
async function syncOneReady(rawId){
 const id=norm(rawId),t=team();
 if(!t?.teamId||t.role!=='owner')throw Error('Apenas o dono pode registrar a baixa direta em PRONTAS.');
 if(navigator.onLine===false)throw Error('Sem internet para enviar a foto e a baixa ao servidor.');
 const rec=autos().find(x=>norm(x?.opId||x?.id)===id&&x.status==='ok');
 if(!rec)throw Error('Baixa local não encontrada.');
 if(!rec.photoId||String(rec.photoId).startsWith('CLOUDPROD:'))throw Error('Foto original não encontrada neste aparelho.');
 const ph=await photoGet(rec.photoId);
 if(!ph?.blob)throw Error('Foto da OP não encontrada. A baixa permanece neste celular.');
 const photoId=await uploadReadyPhoto(t,id,rec);
 if(!photoId)throw Error('Foto não confirmada na nuvem.');
 const original=ops().find(x=>norm(x.id)===id)||{id,sector:rec.sector,machine:rec.machine,product:rec.product,operator:rec.operator,createdAt:rec.createdAt,status:'closed'};
 const official=await publishOfficialPending(t,id,normalizedState(original,rec),photoId);
 if(official?.state!=='ready')throw Error('D1 não confirmou a baixa em PRONTAS.');
 // Os metadados do cadastro podem continuar sendo sincronizados em separado.
 setStatus('✅ Baixa e foto da OP '+id+' confirmadas no D1/R2 para toda a equipe.','ok');
 return official
}
async function syncLocal(force){if(leavingProductionTeam||historyBusy)return false;const t=team();if(!t?.teamId||navigator.onLine===false||document.hidden||uploadBusy)return false;uploadBusy=true;try{const cfg=config(),cfgHash=hash(cfg),cfgSnap=read(CFG_SNAP_KEY,null);const hasCatalog=Object.values(cfg).some(v=>v&&typeof v==='object'&&((['machines','operators','products'].some(k=>Array.isArray(v[k])&&v[k].length>0)||Object.keys(v.deletedMachines||{}).length>0)));if(hasCatalog&&(force||!cfgSnap||cfgSnap.teamId!==t.teamId||cfgSnap.hash!==cfgHash)){const sent=await publishConfig(t,cfg);write(CFG_SNAP_KEY,{teamId:t.teamId,hash:cfgHash,ts:sent.ts,updatedAt:sent.updatedAt})}const states=currentStates(),snap=read(SNAP_KEY,{}),pending=read(DELETE_PENDING_KEY,{});for(const id of Object.keys(pending)){if(!id.startsWith('DFOP-'))continue;const sent=await publishState(t,id,null,true);snap[id]={hash:'__DELETED__',teamId:t.teamId,ts:sent.ts,updatedAt:sent.updatedAt};write(SNAP_KEY,snap);delete pending[id];write(DELETE_PENDING_KEY,pending)}let sentCount=0,failed=[],skipped=0;
 const entries=[...states].sort((a,b)=>Number(!!b[1]?.auto?.production)-Number(!!a[1]?.auto?.production));
 for(const [id,state] of entries){
  // OPs históricas já migradas por D1 não exigem upload da fotografia antiga.
  if(historyMarks(t)[id]){skipped++;continue}
  const h=hash(state),old=snap[id];
  if(!force&&old?.hash===h&&old?.teamId===t.teamId){skipped++;continue}
  try{
   const ready=autos().find(x=>x&&(x.status==='ok'||x.status==='pending')&&norm(x.opId||x.id)===id)||null;
   let officialPhoto='';
   if(ready?.photoId){if(String(ready.photoId).startsWith('CLOUDPROD:'))officialPhoto=String(read(PHOTO_MAP_KEY,{})[id]?.cloudId||'');else officialPhoto=await uploadReadyPhoto(t,id,ready)}
   if(state.auto&&num(state.auto.production)>0&&!(t.role==='owner'&&state.auto.status==='pending')){
    if(!officialPhoto)throw Error('Foto obrigatória para nova baixa da OP '+id+'. Aguarde o envio para o R2.');
    await publishOfficialPending(t,id,state,officialPhoto)
   }
   const sent=await publishState(t,id,state,false);
   snap[id]={hash:h,teamId:t.teamId,ts:sent.ts,updatedAt:sent.updatedAt};
   write(SNAP_KEY,snap);sentCount++
  }catch(e){
   failed.push({id,reason:String(e?.message||e)});
   console.warn('Produção: OP mantida no aparelho, aguardando nuvem:',id,String(e?.message||e))
  }
 }for(const id of Object.keys(snap)){if(snap[id]?.teamId!==t.teamId||states.has(id)||snap[id]?.hash==='__DELETED__')continue;const sent=await publishState(t,id,null,true);snap[id]={hash:'__DELETED__',teamId:t.teamId,ts:sent.ts,updatedAt:sent.updatedAt};write(SNAP_KEY,snap)}if(failed.length){
  const problems=failed.slice(0,3).map(x=>x.id+': '+x.reason).join(' | ');
  setStatus('⚠️ '+sentCount+' OPs sincronizadas, '+skipped+' já conferidas e '+failed.length+' aguardando envio. Nenhum dado local foi apagado. '+problems,'warn');
  return false
 }
 setStatus('✅ Produção sincronizada na EQUIPE DE PRODUÇÃO: '+sentCount+' OPs enviadas, '+skipped+' já sincronizadas.','ok');return true}catch(e){setStatus('⚠️ Produção aguardando sincronização: '+String(e?.message||e),'warn');return false}finally{uploadBusy=false}}
function schedulePush(ms,force){clearTimeout(pushTimer);pushTimer=setTimeout(()=>syncLocal(!!force),ms==null?450:ms)}

function parseRemote(list,t){const states=new Map(),photos={},configs=[];for(const p of list||[]){const q=String(p?.qr||'');if(q.startsWith(STATE_PREFIX)){const x=dec(q.slice(STATE_PREFIX.length));if(!x||x.kind!=='df-producao'||x.area!==AREA||String(x.teamId||'')!==String(t.teamId)||!x.opId)continue;const id=norm(x.opId),old=states.get(id);if(!old||time(x.updatedAt)>time(old.updatedAt)||(time(x.updatedAt)===time(old.updatedAt)&&x.deleted&&!old.deleted))states.set(id,x)}else if(q.startsWith(PHOTO_PREFIX)){const x=dec(q.slice(PHOTO_PREFIX.length));if(!x||x.area!==AREA||String(x.teamId||'')!==String(t.teamId)||!x.opId)continue;const id=norm(x.opId),old=photos[id],ts=time(x.updatedAt||p.updatedAt||p.createdAt);if(!old||ts>old.ts)photos[id]={cloudId:String(p.id||''),teamId:t.teamId,ts,updatedAt:String(x.updatedAt||p.updatedAt||p.createdAt||'')}}else if(q.startsWith(CFG_PREFIX)){const x=dec(q.slice(CFG_PREFIX.length));if(x&&x.kind==='df-producao-config'&&x.area===AREA&&String(x.teamId||'')===String(t.teamId))configs.push(x)}}configs.sort((a,b)=>time(b.updatedAt)-time(a.updatedAt));const populated=configs.find(x=>x.config&&Object.values(x.config).some(v=>v&&typeof v==='object'&&(['machines','operators','products'].some(k=>Array.isArray(v[k])&&v[k].length>0))));return{states,photos,config:populated||null}}
function mergePhotoMap(photos){const map=read(PHOTO_MAP_KEY,{});let changed=false;for(const [id,p] of Object.entries(photos||{})){if(p.cloudId&&(!map[id]?.cloudId||time(p.updatedAt)>=time(map[id]?.updatedAt))){map[id]={...(map[id]||{}),cloudId:p.cloudId,teamId:p.teamId,updatedAt:p.updatedAt,remote:true};changed=true}}if(changed)write(PHOTO_MAP_KEY,map);return map}
function applyRemoteStates(states,photoMap,t){let list=ops(),ready=autos(),snap=read(SNAP_KEY,{}),changed=false;for(const [id,x] of states){if(read(DELETE_PENDING_KEY,{})[id])continue;const current=list.find(o=>norm(o?.id)===id)||null,currentReady=ready.find(r=>r&&(r.status==='ok'||r.status==='pending')&&norm(r.opId||r.id)===id)||null,currentState=current?normalizedState(current,currentReady):null,currentHash=currentState?hash(currentState):'',old=snap[id],remoteTs=time(x.updatedAt),localReadyTs=time(currentReady?.updatedAt||currentReady?.createdAt||current?.autoUpdatedAt||''),localClosedTs=time(current?.closedAt||current?.autoUpdatedAt||'');if(!x.official&&!x.deleted&&x.state?.auto&&currentState&&((currentReady&&localReadyTs>remoteTs)||(String(current?.status||'')==='closed'&&localClosedTs>remoteTs)))continue;const unsynced=currentState&&old&&old.teamId===t.teamId&&old.hash!==currentHash;if(unsynced&&!x.official&&!x.deleted&&x.state?.auto)continue;if(!x.official&&old&&old.teamId===t.teamId&&remoteTs<=Number(old.ts||0))continue;if(x.deleted){const before=list.length,br=ready.length;list=list.filter(o=>norm(o?.id)!==id);ready=ready.filter(r=>norm(r?.opId||r?.id)!==id);if(before!==list.length||br!==ready.length)changed=true;snap[id]={hash:'__DELETED__',teamId:t.teamId,ts:remoteTs,updatedAt:x.updatedAt};continue}const s=x.state;if(!s?.op)continue;const ro=s.op,idx=list.findIndex(o=>norm(o?.id)===id),base=idx>=0?list[idx]:null,op={...(base||{}),id,sector:ro.sector||base?.sector||'Picote',machine:ro.machine||'',product:ro.product||'',measure:ro.measure||'',operator:ro.operator||'',shift:ro.shift||'',start:ro.start||'',end:ro.end||'',createdAt:ro.createdAt||base?.createdAt||x.updatedAt,status:ro.status||'open',rolls:Array.isArray(base?.rolls)?base.rolls:rolls(),stops:Array.isArray(base?.stops)?base.stops:stops(),test:false,teamUpdatedAt:x.updatedAt,productionTeamId:t.teamId};if(idx>=0)list[idx]=op;else list.push(op);registerQR(op);ready=ready.filter(r=>norm(r?.opId||r?.id)!==id);if(s.auto){const pm=photoMap[id],fake=s.auto.hasPhoto?'CLOUDPROD:'+id:'';ready.unshift({id,opId:id,photoId:fake,createdAt:s.auto.createdAt||x.updatedAt,completedAt:s.auto.completedAt||s.auto.createdAt||x.updatedAt,date:s.auto.date||localYmd(s.auto.completedAt||x.updatedAt),machine:op.machine||s.auto.machine||'',product:op.product||s.auto.product||'',measure:op.measure||s.auto.measure||'',operator:op.operator||s.auto.operator||'',shift:op.shift||s.auto.shift||'',production:num(s.auto.production),scrap:num(s.auto.scrap),net:Math.max(0,num(s.auto.production)-num(s.auto.scrap)),status:s.auto.status==='pending'?'pending':'ok',updatedAt:x.updatedAt,cloudPhotoId:pm?.cloudId||'',productionTeamId:t.teamId});op.autoProduction=num(s.auto.production);op.autoScrap=num(s.auto.scrap);op.autoNet=Math.max(0,num(s.auto.production)-num(s.auto.scrap));op.autoUpdatedAt=x.updatedAt}else{delete op.autoProduction;delete op.autoScrap;delete op.autoNet;delete op.autoUpdatedAt}const normalized=normalizedState(op,s.auto?ready.find(r=>norm(r.opId||r.id)===id):null);snap[id]={hash:hash(normalized),teamId:t.teamId,ts:remoteTs,updatedAt:x.updatedAt};changed=true}if(changed){write(OPS_KEY,orderOps(list));write(AUTO_KEY,ready);write(SNAP_KEY,snap)}return changed}
function applyRemoteConfig(remote,t){if(!remote?.config)return false;const remoteHasCatalog=Object.values(remote.config).some(v=>v&&typeof v==='object'&&(['machines','operators','products'].some(k=>Array.isArray(v[k])&&v[k].length>0)));if(!remoteHasCatalog)return false;const remoteTs=time(remote.updatedAt),snap=read(CFG_SNAP_KEY,null),local=config(),localHash=hash(local);const localHasCatalog=Object.values(local).some(v=>v&&typeof v==='object'&&(['machines','operators','products'].some(k=>Array.isArray(v[k])&&v[k].length>0)));// Remote team catalog is authoritative on first join and when a newer team revision arrives.
// A device-local seed must never prevent the operator from seeing the owner's machines.
if(snap&&snap.teamId===t.teamId&&snap.hash!==localHash){schedulePush(100,false);return false}if(snap&&snap.teamId===t.teamId&&remoteTs<=Number(snap.ts||0))return false;const remoteHash=hash(remote.config),merged=JSON.parse(JSON.stringify(remote.config));for(const sec of ['Picote','Sacoleira','Blocadora']){const localMarks=local[sec]?.deletedMachines||{},remoteMarks=merged[sec]?.deletedMachines||{};if(!merged[sec])merged[sec]={machines:[],operators:[],products:[],productMeasures:{},machineProducts:{}};merged[sec].deletedMachines={...remoteMarks};for(const [name,ts] of Object.entries(localMarks)){if(Number(ts)>Number(merged[sec].deletedMachines[name]||0))merged[sec].deletedMachines[name]=ts}}applyMachineDeletions(merged);write(CAD_KEY,merged);try{window.dispatchEvent(new CustomEvent('df-producao-cadastros-sincronizados',{detail:{teamId:t.teamId}}))}catch(e){}write(CFG_SNAP_KEY,{teamId:t.teamId,hash:remoteHash,ts:remoteTs,updatedAt:remote.updatedAt});if(hash(merged)!==remoteHash)schedulePush(300,false);return true}
async function listMonth(t,m){const j=await apiPost('/op/photo/list',{teamId:t.teamId,month:m,area:AREA,scope:AREA});if(!Array.isArray(j.photos))throw new Error('Resposta inválida ao consultar OPs da equipe.');return j.photos}
async function findRemoteOpById(rawId){const t=team(),id=norm(rawId);if(!t?.teamId)return{found:false,reason:'no-team'};if(!/^DFOP-\d{8}-[A-Z0-9-]+$/.test(id))return{found:false,reason:'invalid-id'};if(navigator.onLine===false)return{found:false,reason:'offline'};const month=id.slice(5,9)+'-'+id.slice(9,11);try{const months=[month,monthOffset(0),monthOffset(-1),monthOffset(-2),monthOffset(-3)].filter((v,i,a)=>a.indexOf(v)===i);let sawResponse=false;for(const m of months){let all;try{all=await listMonth(t,m);sawResponse=true}catch(e){if(!sawResponse)return{found:false,reason:'network-error'};continue}const parsed=parseRemote(all,t),state=parsed.states.get(id);if(!state||state.deleted||!state.state?.op)continue;const pm=mergePhotoMap(parsed.photos);applyRemoteStates(new Map([[id,state]]),pm,t);refreshUi();return{found:!!ops().some(o=>norm(o.id)===id),reason:'found'}}return{found:false,reason:'not-synced'}}catch(e){return{found:false,reason:'network-error'}}}
async function syncRemote(includePrevious){if(leavingProductionTeam||historyBusy)return false;const t=team();if(!t?.teamId||navigator.onLine===false||document.hidden||pullBusy)return false;pullBusy=true;try{const withPrevious=includePrevious||Date.now()-lastPrevPull>60000;const months=withPrevious?[monthOffset(0),monthOffset(-1),monthOffset(-2)]:[monthOffset(0)];const [official,legacy]=await Promise.all([pullOfficialRecords(t),Promise.allSettled(months.map(m=>listMonth(t,m)))]);let all=[];for(const item of legacy){if(item.status==='fulfilled')all.push(...item.value);else console.warn('Consulta mensal indisponível; registros oficiais D1 preservados:',String(item.reason))}if(withPrevious&&legacy.every(x=>x.status==='fulfilled'))lastPrevPull=Date.now();const parsed=parseRemote(all,t);for(const [id,x] of official.states)parsed.states.set(id,x);Object.assign(parsed.photos,official.photos);const pmap=mergePhotoMap(parsed.photos),a=applyRemoteStates(parsed.states,pmap,t),b=applyRemoteConfig(parsed.config,t),c=recoverCatalogFromOps();if(a||b||c)refreshUi();if(c)schedulePush(1500,false);setStatus('✅ EQUIPE DE PRODUÇÃO online • dados atualizados.','ok');return true}catch(e){setStatus('⚠️ Equipe de Produção aguardando sincronização: '+String(e?.message||e),'warn');return false}finally{pullBusy=false}}
function schedulePull(ms,prev){clearTimeout(pullTimer);pullTimer=setTimeout(()=>syncRemote(!!prev),ms==null?500:ms)}

let viewerUrl='';function closeViewer(){const m=$('dfProdTeamV2Viewer');if(m)m.classList.remove('on');if(viewerUrl){try{URL.revokeObjectURL(viewerUrl)}catch(e){}viewerUrl=''}}
function ensureViewer(){let m=$('dfProdTeamV2Viewer');if(m)return m;m=document.createElement('div');m.id='dfProdTeamV2Viewer';m.innerHTML='<div class="box"><button id="dfProdTeamV2Close">FECHAR</button><div id="dfProdTeamV2ViewerBody"></div></div>';document.body.appendChild(m);$('dfProdTeamV2Close').onclick=closeViewer;return m}
async function openRemotePhoto(opId){const t=team();if(!t)return alert('Conecte primeiro a EQUIPE DE PRODUÇÃO.');let map=read(PHOTO_MAP_KEY,{}),cloudId=String(map[opId]?.cloudId||'');if(!cloudId){await syncRemote(true);map=read(PHOTO_MAP_KEY,{});cloudId=String(map[opId]?.cloudId||'')}if(!cloudId)return alert('A foto desta OP ainda está sincronizando.');try{const blob=await apiBlob(cloudId),u=URL.createObjectURL(blob);if(viewerUrl)try{URL.revokeObjectURL(viewerUrl)}catch(e){}viewerUrl=u;ensureViewer();$('dfProdTeamV2ViewerBody').innerHTML='<img src="'+u+'"><div class="tiny">'+esc(opId)+' • EQUIPE DE PRODUÇÃO</div>';$('dfProdTeamV2Viewer').classList.add('on')}catch(e){alert(e.message||e)}}

let membersBusy=false,lastMembersAt=0;
async function refreshMembers(force){const t=team(),host=$('dfProdTeamV2Members');if(!t?.teamId||!host||membersBusy)return;if(!force&&Date.now()-lastMembersAt<5000)return;membersBusy=true;try{const j=await apiPost('/op/team/members',{teamId:t.teamId,area:AREA,scope:AREA});lastMembersAt=Date.now();const a=Array.isArray(j.members)?j.members:[];host.innerHTML='<b>👥 EQUIPE DE PRODUÇÃO • '+a.length+' '+(a.length===1?'pessoa':'pessoas')+'</b>'+a.map((m,i)=>'<div class="member"><span>'+esc(clean(m?.displayName)||(m?.role==='owner'?'Dono':'Operador '+(i+1)))+'</span><small>'+(m?.role==='owner'?'DONO':'OPERADOR')+'</small></div>').join('');const del=$('dfProdTeamV2Delete');if(del){del.hidden=!(t.role==='owner'&&a.length===1&&a[0]?.role==='owner');del.disabled=false;del.onclick=deleteSoloProductionTeam}}catch(e){host.innerHTML='<span class="tiny">Membros serão atualizados quando houver conexão.</span>'}finally{membersBusy=false}}
async function deleteSoloProductionTeam(){
 const t=team();if(!t||t.role!=='owner')return;
 const btn=$('dfProdTeamV2Delete');if(btn)btn.disabled=true;
 try{
  const j=await apiPost('/op/team/members',{teamId:t.teamId,area:AREA,scope:AREA});
  const members=Array.isArray(j.members)?j.members:[];
  if(members.length!==1||members[0]?.role!=='owner')throw Error('Só é permitido apagar a equipe quando o dono é o único membro.');
  if(!confirm('APAGAR DEFINITIVAMENTE A EQUIPE DE PRODUÇÃO? Isso excluirá do servidor as OPs, fotos e cadastros da equipe. Essa ação não poderá ser desfeita.'))return;
  const typed=prompt('Para confirmar a exclusão definitiva, digite APAGAR EQUIPE:');
  if(typed!=='APAGAR EQUIPE')return;
  // A exclusão remota deve ser concluída antes de apagar o vínculo local.
  const result=await apiPost('/op/team/delete',{teamId:t.teamId,area:AREA,scope:AREA});
  if(result.deleted!==true&&result.ok!==true)throw Error('O servidor não confirmou a exclusão.');
  localStorage.setItem(EXIT_MARK,'1');
  clearTimeout(pushTimer);clearTimeout(pullTimer);
  await wipeProductionLocal();
  setTeam(null);renderTeam();refreshUi();
  alert('Equipe excluída no servidor. Os dados locais da Produção foram limpos.');
  location.reload();
 }catch(e){alert('Não foi possível apagar a equipe: '+String(e?.message||e))}
 finally{if(btn)btn.disabled=false}
}
async function createTeam(){const b=$('dfProdTeamV2Create'),name=clean($('dfProdTeamV2OwnerName')?.value)||'Dono';if(b){b.disabled=true;b.textContent='CRIANDO...'}setStatus('Criando uma equipe exclusiva da Produção...','');try{const j=await apiPost('/op/team/create',{name:'DF PRODUÇÃO',displayName:name,area:AREA,scope:AREA});if(!j.team?.teamId)throw Error('Servidor não retornou a equipe.');if(j.joinCode)rememberCode(j.joinCode,j.team);setDisplayName(name);write(SNAP_KEY,{});remove(CFG_SNAP_KEY);write(PHOTO_MAP_KEY,{});localStorage.removeItem(EXIT_MARK);setTeam({...j.team,role:'owner',area:AREA,displayName:j.team.displayName||name});renderTeam();await syncRemote(true);await syncLocal(true);refreshMembers(true)}catch(e){setStatus('⚠️ Não consegui criar a equipe de Produção: '+String(e?.message||e),'warn')}finally{if(b){b.disabled=false;b.textContent='👑 CRIAR EQUIPE DE PRODUÇÃO'}}}
async function joinTeam(){
 const code=String($('dfProdTeamV2Code')?.value||'').replace(/\D/g,''),name=clean($('dfProdTeamV2JoinName')?.value);
 if(code.length<6)return setStatus('Digite o código da equipe de Produção.','warn');
 if(!name)return setStatus('Digite o nome do operador.','warn');
 if(team())return setStatus('Saia da equipe atual antes de entrar em outra.','warn');
 const b=$('dfProdTeamV2Join');if(b){b.disabled=true;b.textContent='VALIDANDO...'}
 try{
   // A equipe é validada pelo servidor; não se publica nenhuma OP local no novo time.
   // A limpeza acontece antes de gravar o novo vínculo no dispositivo.
   if(!confirm('ENTRAR NA EQUIPE DE PRODUÇÃO E APAGAR OS DADOS LOCAIS DE PRODUÇÃO DESTE CELULAR?\n\nSerão apagados somente deste aparelho: fotos de Produção, OPs, baixas, máquinas, produtos e pesos locais.\n\nOs dados do D1/R2 e dos outros aparelhos permanecem salvos. A Formulação não será alterada. Dados de Produção ainda não enviados à nuvem poderão ser perdidos.'))return;
   if(b)b.textContent='VALIDANDO EQUIPE...';
   const j=await apiPost('/op/team/join',{code,displayName:name,area:AREA,scope:AREA});
   if(!j.team?.teamId)throw Error('Equipe não encontrada.');
   // Equipe validada antes de qualquer limpeza local.
   localStorage.setItem(EXIT_MARK,'1');
   clearTimeout(pushTimer);clearTimeout(pullTimer);
   if(b)b.textContent='LIMPANDO APENAS PRODUÇÃO...';
   await wipeProductionLocal();
   localStorage.setItem(EXIT_MARK,'1');
   rememberCode(code,j.team);
   setDisplayName(name);write(SNAP_KEY,{});remove(CFG_SNAP_KEY);write(PHOTO_MAP_KEY,{});
   setTeam({...j.team,area:AREA,displayName:j.team.displayName||name});
   localStorage.removeItem(EXIT_MARK);
   renderTeam();await syncRemote(true);refreshMembers(true);
 }catch(e){
   setStatus('⚠️ Entrada não concluída: '+String(e?.message||e)+'. Os dados locais antigos não serão enviados à nova equipe.','warn');
 }finally{if(b){b.disabled=false;b.textContent='🔗 ENTRAR NA EQUIPE DE PRODUÇÃO'}}
}
async function saveName(){const t=team(),name=clean($('dfProdTeamV2MyName')?.value);if(!t||!name)return;const b=$('dfProdTeamV2SaveName');if(b)b.disabled=true;try{const j=await apiPost('/op/team/member-name',{teamId:t.teamId,displayName:name,area:AREA,scope:AREA});setDisplayName(String(j.displayName||name));setTeam({...t,displayName:String(j.displayName||name)});refreshMembers(true)}catch(e){setStatus('⚠️ Não foi possível salvar o nome agora.','warn')}finally{if(b)b.disabled=false}}
let leavingProductionTeam=false;
async function clearProductionTeam(){
 const t=team();if(!t||leavingProductionTeam)return;
 if(!confirm('SAIR DA EQUIPE DE PRODUÇÃO E APAGAR TODOS OS DADOS LOCAIS DE PRODUÇÃO DESTE APARELHO?\n\nSerão apagados deste celular: fotos locais, OPs, PENDENTES, PRONTAS, baixas, pesos, máquinas, operadores, produtos e configurações da equipe de Produção.\n\nNADA será excluído do servidor (D1/R2), dos outros celulares ou da equipe de Formulação.\n\nAo entrar novamente em outra equipe, o celular sincronizará os dados dela. Informações de Produção ainda não enviadas à nuvem serão perdidas.\n\nA licença e o acesso do aplicativo serão preservados.'))return;
 leavingProductionTeam=true;
 let serverLeft=false;
 try{
   clearTimeout(pushTimer);clearTimeout(pullTimer);
   // Mesmo fluxo da Formulação: primeiro desvincular o membro no servidor.
   // Não sincronizar OPs locais, pois o dono autorizou descartá-las.
   // Marcar saída ANTES da chamada remota para impedir recovery concorrente.
   localStorage.setItem(EXIT_MARK,'1');
   await apiPost('/op/team/leave',{teamId:t.teamId,area:AREA,scope:AREA});
   serverLeft=true;
   await wipeProductionLocal();
   setTeam(null);
   renderTeam();refreshUi();
   alert('Saída concluída. Este aparelho está limpo dos dados da equipe de Produção e pode entrar em outra equipe. Nada foi excluído do servidor.');
   location.reload();
 }catch(e){
   const message=String(e?.message||e);
   // Quando o servidor já removeu/revogou o membro, não há vínculo remoto
   // a encerrar. Permitir saída local explícita, sem tentar acessar outra equipe.
   const revoked=/não faz parte desta equipe|nao faz parte desta equipe|equipe não autorizada|equipe nao autorizada|not a member|not authorized|membership revoked/i.test(message);
   if(!serverLeft&&revoked){
     if(confirm('O servidor informa que este aparelho NÃO pertence mais à equipe de Produção. Deseja concluir a saída LOCAL e apagar os dados de Produção deste celular?\\n\\nNada será apagado da nuvem, dos outros celulares, da Formulação ou da licença. Dados locais ainda não enviados serão perdidos.')){
       try{
         localStorage.setItem(EXIT_MARK,'1');
         await wipeProductionLocal();
         setTeam(null);
         renderTeam();refreshUi();
         alert('Saída local concluída. Os dados de Produção deste aparelho foram limpos; os dados da nuvem foram preservados.');
         location.reload();
         return;
       }catch(cleanError){
         alert('Falha ao limpar os dados locais: '+String(cleanError?.message||cleanError)+'. Não entre em outra equipe até concluir a limpeza.');
         return;
       }
     }
   }
   if(!serverLeft)try{localStorage.removeItem(EXIT_MARK)}catch(_){}
   alert('Não foi possível concluir a saída: '+message+'. Os dados locais não serão considerados limpos até a conclusão.');
 }finally{leavingProductionTeam=false}
}
async function wipeProductionLocal(){
 // Saída da Produção: apagar também o armazenamento legado usado por Fotos/Mês.
 // Preservar somente credencial, licença e dados da equipe independente de Extrusão.
 const exact=new Set([TEAM_KEY,TEAM_CODE_KEY,CODE_BACKUP_KEY,NAME_KEY,OPS_KEY,QR_KEY,AUTO_KEY,CAD_KEY,SNAP_KEY,CFG_SNAP_KEY,PHOTO_MAP_KEY,DELETE_PENDING_KEY,
 'df_producao_ops_favoritas_v1','df_producao_saved_d1_shadow_v550',
 'df_op_qr_registry_test_setores_v3',
]);
 const prefixes=['df_producao_','df_prod_team_','df_production_team_','df_production_now','df_prod_now_','df_prod_ops_'];
 const shouldClear=k=>exact.has(k)||prefixes.some(p=>k.startsWith(p));
 for(const area of [localStorage,sessionStorage]){
  const keys=[];try{for(let i=0;i<area.length;i++){const k=area.key(i);if(k&&shouldClear(k))keys.push(k)}}catch(e){}
  for(const k of keys)try{area.removeItem(k)}catch(e){}
 }
 // Ambos os bancos armazenam fotos da Produção, inclusive fotos antigas da aba Mês.
 if(typeof indexedDB!=='undefined'){
  for(const dbName of [DB_NAME]){
   await new Promise((resolve,reject)=>{
    let request;try{request=indexedDB.open(dbName)}catch(e){reject(e);return}
    request.onerror=()=>reject(new Error('Não foi possível abrir o banco '+dbName+' para limpeza.'));
    request.onsuccess=()=>{
     const db=request.result;
     try{
      const stores=Array.from(db.objectStoreNames);
      if(!stores.length){db.close();resolve();return}
      const tx=db.transaction(stores,'readwrite');
      tx.oncomplete=()=>{db.close();resolve()};
      tx.onerror=()=>{db.close();reject(new Error('Falha ao limpar fotos em '+dbName))};
      tx.onabort=()=>{db.close();reject(new Error('Limpeza de fotos interrompida em '+dbName))};
      stores.forEach(name=>tx.objectStore(name).clear());
     }catch(e){db.close();reject(e)}
    };
   });
  }
 }
 // A marca de saída é necessária para impedir que um sincronizador antigo restaure a equipe.
 localStorage.setItem(EXIT_MARK,'1');
 try{window.dispatchEvent(new CustomEvent('df-producao-team-cleared'))}catch(e){}
}
function restoreOwnerCode(){
 const t=team();
 if(!t||String(t.role||'').toLowerCase()!=='owner')return;
 const value=prompt('Digite o código ORIGINAL de 6 a 8 números da sua Equipe de Produção. Ele será salvo somente neste aparelho; a equipe e os operadores não serão alterados.');
 if(value===null)return;
 const code=String(value).trim();
 if(!/^\d{6,8}$/.test(code)){alert('Código inválido. Digite somente 6 a 8 números.');return}
 rememberCode(code,t);
 renderTeam();
 alert('Código salvo neste aparelho. Atenção: o servidor não validou este número; teste a entrada em um aparelho de teste antes de compartilhar.');
}
async function copyCode(){const code=String(localStorage.getItem(TEAM_CODE_KEY)||'').trim();if(!code)return;try{await navigator.clipboard.writeText(code);const b=$('dfProdTeamV2Copy');if(b){b.textContent='✅ CÓDIGO COPIADO';setTimeout(()=>{if($('dfProdTeamV2Copy'))$('dfProdTeamV2Copy').textContent='📋 COPIAR CÓDIGO'},1200)}}catch(e){prompt('Código da equipe de Produção:',code)}}

function addStyle(){if($('dfProdTeamV2Style'))return;const s=document.createElement('style');s.id='dfProdTeamV2Style';s.textContent=`#dfProdTeamV2{margin-top:14px;border:1.5px solid #2563eb;background:linear-gradient(180deg,#0b1730,#0a1222);border-radius:18px;padding:13px;color:#e2e8f0;box-shadow:0 0 18px rgba(37,99,235,.12)}#dfProdTeamV2 .head{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#93c5fd;font-size:15px;font-weight:950}#dfProdTeamV2 .tiny,#dfProdTeamV2Viewer .tiny{font-size:11px;color:#94a3b8;line-height:1.45;margin-top:6px}#dfProdTeamV2 .isolated{margin-top:8px;border:1px solid #166534;background:#092317;color:#86efac;border-radius:10px;padding:9px;font-size:11px;font-weight:900}#dfProdTeamV2 .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}#dfProdTeamV2 input{width:100%;min-height:44px;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px;text-transform:none}#dfProdTeamV2 button{width:100%;min-height:42px;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:9px;font-size:11px;font-weight:950}#dfProdTeamV2 .create{border-color:#16a34a;background:#0c2b19;color:#86efac}#dfProdTeamV2 .danger{border-color:#7f1d1d;background:#260b0b;color:#fca5a5}#dfProdTeamV2 .code{margin-top:9px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:11px;padding:10px;font-size:13px;font-weight:950;word-break:break-all}.dfProdTeamV2Status{margin-top:9px;border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:10px;padding:9px;font-size:11px;font-weight:850}.dfProdTeamV2Status.ok{border-color:#166534;color:#86efac}.dfProdTeamV2Status.warn{border-color:#a16207;color:#fde68a}#dfProdTeamV2Members{margin-top:9px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:10px;font-size:11px}#dfProdTeamV2Members>b{display:block;margin-bottom:5px}.member{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #1f2937}.member span{font-weight:900;color:#bfdbfe}.member small{color:#86efac;font-weight:850}#dfProdTeamV2Viewer{position:fixed;inset:0;z-index:2147483000;background:#020617f2;display:none;overflow:auto;padding:18px}#dfProdTeamV2Viewer.on{display:block}#dfProdTeamV2Viewer .box{max-width:760px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:12px}#dfProdTeamV2Viewer button{width:100%;border:1px solid #475569;background:#0f172a;color:#fff;border-radius:12px;padding:12px;font-weight:900;margin-bottom:9px}#dfProdTeamV2Viewer img{display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#000}@media(max-width:520px){#dfProdTeamV2 .grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function ensureHost(){addStyle();const hero=document.querySelector('#dfProdAuto .dfPAHero');if(!hero)return false;let box=$('dfProdTeamV2');if(!box){box=document.createElement('div');box.id='dfProdTeamV2';hero.appendChild(box)}renderTeam();return true}
function renderTeam(){const box=$('dfProdTeamV2');if(!box)return;const t=team(),code=rememberedCode(t),name=clean(t?.displayName||displayName());if(!t){box.innerHTML='<div class="head"><span>☁️ EQUIPE DE PRODUÇÃO</span><span>SEPARADA</span></div><div class="tiny">A Produção tem código, membros, OPs e fotos próprios. Nada desta área usa a equipe da Extrusão.</div><div class="isolated">✅ EXTRUSÃO E PRODUÇÃO EM ÁREAS INDEPENDENTES</div><div class="grid"><div><input id="dfProdTeamV2OwnerName" maxlength="60" autocomplete="name" placeholder="SEU NOME (DONO)"><button id="dfProdTeamV2Create" class="create" type="button" style="margin-top:7px">👑 CRIAR EQUIPE DE PRODUÇÃO</button></div><div><input id="dfProdTeamV2JoinName" maxlength="60" autocomplete="name" placeholder="NOME DO OPERADOR"><input id="dfProdTeamV2Code" inputmode="numeric" maxlength="8" placeholder="CÓDIGO DA PRODUÇÃO" style="margin-top:7px"><button id="dfProdTeamV2Join" type="button" style="margin-top:7px">🔗 ENTRAR NA EQUIPE DE PRODUÇÃO</button></div></div><div id="dfProdTeamV2Status" class="dfProdTeamV2Status">Crie uma equipe nova da Produção ou entre com o código da Produção.</div>';$('dfProdTeamV2Create').onclick=createTeam;$('dfProdTeamV2Join').onclick=joinTeam;return}box.innerHTML='<div class="head"><span>☁️ EQUIPE DE PRODUÇÃO</span><span>'+(String(t.role||'operator').toLowerCase()==='owner'?'DONO':'OPERADOR')+'</span></div><div class="isolated">✅ ÁREA DA PRODUÇÃO • equipe e fotos separadas da Extrusão</div><div class="code">Equipe: '+esc(t.name||'DF PRODUÇÃO')+' • CÓDIGO: <b>'+esc(code||'CÓDIGO INDISPONÍVEL')+'</b>'+'</div><div class="grid"><button id="dfProdTeamV2Refresh" type="button">🔄 SINCRONIZAR PRODUÇÃO</button>'+(code&&t.role==='owner'?'<button id="dfProdTeamV2Copy" type="button">📋 COPIAR CÓDIGO</button>':'')+(t.role==='owner'?'<button id="dfProdTeamV2RestoreCode" type="button">🔑 '+(code?'CORRIGIR CÓDIGO':'RECUPERAR CÓDIGO')+'</button>':'')+'</div>'+(t.role==='owner'?'<button id="dfProdTeamV2UploadHistory" type="button" style="width:100%;margin:12px 0;padding:15px;border:2px solid #38bdf8;border-radius:12px;background:#123253;color:white;font-weight:900">☁️ ENVIAR TODA MINHA PRODUÇÃO PARA A NUVEM</button>':'')+'<div class="grid"><input id="dfProdTeamV2MyName" maxlength="60" value="'+esc(name)+'" placeholder="NOME DO OPERADOR"><button id="dfProdTeamV2SaveName" type="button">👤 SALVAR MEU NOME</button></div><div id="dfProdTeamV2Status" class="dfProdTeamV2Status">Sincronização exclusiva da Produção ativa.</div><div id="dfProdTeamV2Members"></div><button id="dfProdTeamV2Delete" class="danger" type="button" hidden style="margin-top:9px">🗑️ APAGAR EQUIPE DEFINITIVAMENTE</button><button id="dfProdTeamV2Leave" class="danger" type="button" style="margin-top:9px">SAIR DA EQUIPE DE PRODUÇÃO NESTE APARELHO</button>';if($('dfProdTeamV2UploadHistory'))$('dfProdTeamV2UploadHistory').onclick=async()=>{const b=$('dfProdTeamV2UploadHistory');if(!confirm('Enviar histórico de OPs concluídas deste celular para a nuvem, sem fotos antigas? Os dados locais serão preservados.'))return;b.disabled=true;b.textContent='⏳ ENVIANDO HISTÓRICO...';try{const ok=await migrateHistoricalProductionData();alert((ok?'Envio histórico processado.\n':'Envio histórico não confirmado.\n')+String($('dfProdTeamV2Status')?.textContent||'Sem diagnóstico disponível.')+'\n\nNenhum dado local foi apagado.')}catch(e){alert('Falha no envio: '+String(e.message||e))}finally{b.disabled=false;b.textContent='☁️ ENVIAR TODA MINHA PRODUÇÃO PARA A NUVEM'}};$('dfProdTeamV2Refresh').onclick=async()=>{setStatus('Sincronizando Produção...','');await syncRemote(true);await syncLocal(true);refreshMembers(true)};if($('dfProdTeamV2Copy'))$('dfProdTeamV2Copy').onclick=copyCode;if($('dfProdTeamV2RestoreCode'))$('dfProdTeamV2RestoreCode').onclick=restoreOwnerCode;$('dfProdTeamV2SaveName').onclick=saveName;$('dfProdTeamV2Leave').onclick=clearProductionTeam;setTimeout(()=>refreshMembers(false),80)}

function afterLocalAction(e){if(e.target?.closest?.('#prGenerate,[data-op-new],[data-op-del],[data-pa-del],#dfPAEditSave,#dfRegSave,[data-del]'))schedulePush(500,false)}
function interceptCloudPhoto(e){const b=e.target?.closest?.('[data-pa-view]');if(!b)return;const v=String(b.getAttribute('data-pa-view')||'');if(!v.startsWith('CLOUDPROD:'))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openRemotePhoto(norm(v.slice('CLOUDPROD:'.length)))}
async function initialSync(){if(!team())return;recoverCatalogFromOps();const t=team(),snap=read(CFG_SNAP_KEY,null),cfg=config();const changed=snap&&snap.teamId===t.teamId&&snap.hash!==hash(cfg);if(changed){await syncLocal(false)}const pulled=await syncRemote(true);if(pulled)await syncLocal(false);else schedulePush(500,false);refreshMembers(true)}
function boot(){let n=0,t=setInterval(()=>{if(ensureHost()||++n>70){clearInterval(t);if(team())initialSync()}},120);document.addEventListener('click',afterLocalAction,true);document.addEventListener('click',interceptCloudPhoto,true);window.addEventListener('df-producao-catalog-local-changed',()=>{schedulePush(80,false);schedulePull(700,false)});window.addEventListener('df-producao-auto-saved',()=>{clearTimeout(pullTimer);schedulePush(30,false);schedulePull(450,true)});window.addEventListener('df-producao-auto-deleted',()=>{clearTimeout(pullTimer);schedulePush(30,false);schedulePull(450,false)});window.addEventListener('online',()=>{schedulePush(250,false);schedulePull(1200,true)});window.addEventListener('offline',()=>setStatus('📴 Sem internet. As alterações ficam neste aparelho até a conexão voltar.','warn'));window.addEventListener('focus',()=>schedulePull(700,false));window.addEventListener('pageshow',()=>{ensureHost();schedulePull(900,true)});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedulePull(700,false)});setInterval(async()=>{if(document.hidden||!team())return;await syncRemote(false);await syncLocal(false);refreshMembers(false)},3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
async function deleteCompletion(rawId){
 const id=norm(rawId),t=team();if(!t?.teamId)throw Error('Equipe de Produção não conectada.');if(navigator.onLine===false)throw Error('Sem internet.');
 const op=ops().find(o=>norm(o?.id)===id);if(!op)throw Error('OP não encontrada na equipe.');
 const opened={...op,status:'open',closedAt:'',autoProduction:0,autoScrap:0,autoNet:0,autoUpdatedAt:''};
 const sent=await publishState(t,id,normalizedState(opened,null),false);
 const list=ops().map(o=>norm(o?.id)===id?opened:o);
 const ready=autos().filter(r=>norm(r?.opId||r?.id)!==id);
 if(!write(OPS_KEY,list)||!write(AUTO_KEY,ready))throw Error('Servidor atualizado, mas não foi possível limpar dados locais; atualize a tela.');
 const snap=read(SNAP_KEY,{});snap[id]={hash:hash(normalizedState(opened,null)),teamId:t.teamId,ts:sent.ts,updatedAt:sent.updatedAt};write(SNAP_KEY,snap);
 refreshUi();return true;
}
async function approveCompletion(rawId){
 const id=norm(rawId),t=team();if(t?.role!=='owner')throw Error('Apenas o dono confirma OPs.');
 const r=autos().find(x=>norm(x?.opId||x?.id)===id&&x.status==='pending');if(!r)throw Error('Baixa pendente não encontrada.');
 const op=ops().find(x=>norm(x?.id)===id);if(!op)throw Error('OP não encontrada.');
 const photoId=String(read(PHOTO_MAP_KEY,{})[id]?.cloudId||'');
 if(!photoId)throw Error('A foto ainda não está disponível na nuvem. Atualize a equipe antes de confirmar a OP.');
 const photo=await apiBlob(photoId);if(!photo?.size)throw Error('Não foi possível conferir a foto da OP no servidor.');
 const approved=await apiPost('/op/record/approve',{teamId:t.teamId,opCode:id});if(approved.record?.state!=='ready')throw Error('O servidor não confirmou a aprovação.');
 const ready={...r,status:'ok',approvedAt:nowIso()};
 const updated={...op,status:'closed',closedAt:ready.approvedAt,autoProduction:num(r.production),autoScrap:num(r.scrap),autoNet:num(r.production)-num(r.scrap),autoUpdatedAt:ready.approvedAt};
 const sent=await publishState(t,id,normalizedState(updated,ready),false);
 write(AUTO_KEY,autos().map(x=>norm(x?.opId||x?.id)===id?ready:x));
 write(OPS_KEY,ops().map(x=>norm(x?.id)===id?updated:x));
 const snap=read(SNAP_KEY,{});snap[id]={hash:hash(normalizedState(updated,ready)),teamId:t.teamId,ts:sent.ts,updatedAt:sent.updatedAt};write(SNAP_KEY,snap);
 refreshUi();return true;
}
async function checkAlreadyCompleted(rawId){
 const id=norm(rawId),t=team();
 if(!t?.teamId)throw Error('Conecte a equipe de Produção antes de dar baixa.');
 if(navigator.onLine===false)throw Error('Sem internet para verificar se esta OP já foi baixada. Conecte e tente novamente.');
 const data=await apiPost('/op/record/list',{teamId:t.teamId,area:AREA,scope:AREA,includeDeleted:true});
 if(!Array.isArray(data.records))throw Error('Não foi possível consultar a situação oficial da OP.');
 const record=data.records.find(x=>norm(x.opCode)===id&&['pending','ready'].includes(String(x.state||'')));
 return record?{state:String(record.state),opCode:id,production:record.production,scrap:record.scrap}:null;
}
// Arquivados: lista oficial de baixas confirmadas (Prontas), sem depender de foto local.
// Cache isolado por equipe apenas para consulta offline; jamais é usado para somar produção.
async function archivedReadyOps(){
 const t=team();
 if(!t?.teamId)throw Error('Conecte a EQUIPE DE PRODUÇÃO.');
 const cacheKey='df_producao_arquivadas_d1_v677_'+String(t.teamId);
 const normalizeRows=rows=>{
  const map=new Map();
  for(const r of Array.isArray(rows)?rows:[]){
   const id=norm(r?.opCode||r?.id||r?.qr);
   if(!/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/.test(id)||r?.state!=='ready')continue;
   const item={opCode:id,completedAt:String(r.completedAt||''),localDate:String(r.localDate||'')};
   if(!map.has(id))map.set(id,item);
  }
  return Array.from(map.values()).sort((a,b)=>
   String(b.completedAt||b.localDate||'').localeCompare(String(a.completedAt||a.localDate||''))||
   b.opCode.localeCompare(a.opCode));
 };
 if(navigator.onLine===false)return {records:normalizeRows(read(cacheKey,[])),offline:true};
 try{
  const result=await apiPost('/op/record/list',{teamId:t.teamId,includeDeleted:false});
  if(!Array.isArray(result?.records))throw Error('O D1 não retornou as OPs arquivadas.');
  const records=normalizeRows(result.records);
  write(cacheKey,records.map(r=>({...r,state:'ready'})));
  return {records,offline:false};
 }catch(e){
  // Erro não autoriza inventar baixa; sinalizar que a lista pode estar desatualizada.
  const cached=normalizeRows(read(cacheKey,[]));
  if(cached.length)return {records:cached,offline:true,error:String(e.message||e)};
  throw e;
 }
}
window.DFProducaoEquipeOnline={migrateHistoricalProductionData,archivedReadyOps,pushOneReady:syncOneReady,checkAlreadyCompleted,deleteCompletion,approveCompletion,pull:()=>syncRemote(true),findOpById:findRemoteOpById,push:()=>syncLocal(false),pushOne:(id)=>syncOnePending(id),team:()=>team(),members:()=>refreshMembers(true),area:AREA};
})();
