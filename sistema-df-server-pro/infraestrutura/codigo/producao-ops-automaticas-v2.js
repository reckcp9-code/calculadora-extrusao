(function(){
'use strict';
if(window.DF_PRODUCAO_OPS_AUTOMATICAS_V2)return;window.DF_PRODUCAO_OPS_AUTOMATICAS_V2=true;

const OPS_KEY='df_producao_ops_setores_test_v3';
const QR_KEY='df_op_qr_registry_test_setores_v3';
const AUTO_KEY='df_producao_ops_auto_v1';
const DB_NAME='df_producao_ops_fotos_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
const fmt=(v,d=2)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const localYmd=d=>{const x=d instanceof Date?d:new Date(d||Date.now());if(isNaN(x.getTime()))return'';return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const today=()=>localYmd(new Date());
const monthNow=()=>today().slice(0,7);

// Mês de consulta compartilhado entre MÊS, PRONTAS e ARQUIVADAS.
// Nunca remove registros da equipe: somente controla a visualização.
const HISTORY_MONTH_KEY='df_production_history_month_v1';
const validHistoryMonth=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value||''));
function viewingMonth(){
 // O mês escolhido é a única fonte de verdade. Abrir outra aba ou
 // passar um dia não pode substituir a escolha do usuário.
 const now=monthNow();
 try{const value=String(localStorage.getItem(HISTORY_MONTH_KEY)||'');
  return validHistoryMonth(value)?value:now;
 }catch(e){return now}
}
function persistSelectedMonth(value){
 if(!validHistoryMonth(value))return false;
 try{localStorage.setItem(HISTORY_MONTH_KEY,String(value))}catch(e){}
 return true;
}
function completionMonth(row){
 // Data efetiva da baixa: uma OP criada em outubro e baixada em novembro pertence a novembro.
 for(const field of ['date','productionDay','localDate','completedAt','autoUpdatedAt','closedAt','confirmedAt','createdAt']){
  const value=String(row?.[field]||'').trim();
  const match=value.match(/^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?/);
  if(match)return match[1]+'-'+match[2];
 }
 return '';
}
function synchronizeMonthInputs(){
 let month=viewingMonth();
 const picker=$('dfPAMonth');
 // Em iOS, o seletor nativo pode emitir "input" antes de "change".
 // Enquanto está ativo, nunca sobrescrever a escolha com o mês antigo.
 if(picker&&document.activeElement===picker&&validHistoryMonth(picker.value)&&picker.value!==month){
  persistSelectedMonth(picker.value);
  month=picker.value;
 }
 for(const id of ['dfPAReadyMonth','dfPAMonth','dfPAArchiveMonth']){
  const input=$(id);if(input&&input.value!==month)input.value=month;
 }
 return month;
}
function selectMonth(value){
 if(!persistSelectedMonth(value))return;
 // Priorizar a escolha confirmada, mesmo se o iOS ainda mantiver o campo em foco.
 const picker=$('dfPAMonth');if(picker&&picker.value!==value)picker.value=value;
 // Seleção explícita de mês volta ao filtro mensal.
 const all=$('dfPAReadyAllMonths');if(all)all.checked=false;
 lastReadyFilterKey='';lastReadySignature='';
 synchronizeMonthInputs();
 renderAll();
 window.dispatchEvent(new CustomEvent('df-production-month-changed',{detail:{month:value}}));
}
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function ops(){const a=read(OPS_KEY,[]);return Array.isArray(a)?a:[]}
function autos(){const a=read(AUTO_KEY,[]);return Array.isArray(a)?a:[]}
function registry(){const r=read(QR_KEY,{});return r&&typeof r==='object'?r:{}}
function normId(v){const s=String(v||'').trim().toUpperCase().replace(/\s+/g,'');const m=s.match(/DFOP-[A-Z0-9-]+/);return m?m[0]:s}
function normShift(v){v=String(v??'');if(v==='00:00–07:00')return'1';if(v==='07:00–15:30')return'2';if(v==='15:30–00:00')return'3';return v}
function findOp(id){id=normId(id);let op=ops().find(o=>normId(o?.id)===id)||null;if(op)return op;const e=registry()[id];if(e?.expected)return{id,sector:e.sector||'Produção',machine:e.expected.machine||'',product:e.expected.product||'',measure:e.expected.measure||'',operator:e.expected.operator||'',shift:e.expected.shift||'',start:e.expected.start||'',end:e.expected.end||''};return null}
async function requestTeamOpSync(id){
  try{const api=window.DFProducaoEquipeOnline;if(!api?.team?.()?.teamId)return{found:false,reason:'no-team'};
    if(id&&typeof api.findOpById==='function')return await api.findOpById(id);
    if(typeof api.pull==='function')return{found:!!(await api.pull()),reason:'general-sync'};
    return{found:false,reason:'sync-unavailable'};
  }catch(e){return{found:false,reason:'network-error'}}
}


let currentFile=null,currentOp=null,currentPhotoId='',currentPendingId='',working=false,bound=false;

function repairRecords(){if(!window.DFProducaoEquipeOnline?.team?.())return;
  let a=autos(),changed=false;
  a=a.map(r=>{if(r&&r.status!=='ok'&&r.status!=='pending'&&r.opId&&num(r.production)>0){changed=true;return{...r,status:'ok',net:Math.max(0,num(r.production)-num(r.scrap))}}return r});
  const okPhotos=new Set(a.filter(r=>r?.status==='ok'&&r.photoId).map(r=>String(r.photoId)));
  const okOps=new Set(a.filter(r=>r?.status==='ok'&&r.opId).map(r=>normId(r.opId)));
  const filtered=[],seenOk=new Set();
  for(const r of a.sort((x,y)=>String(y?.createdAt||'').localeCompare(String(x?.createdAt||'')))){
    if(!r)continue;
    if(r.status!=='ok'&&((r.photoId&&okPhotos.has(String(r.photoId)))||(r.opId&&okOps.has(normId(r.opId))))){changed=true;continue}
    if(r.status==='ok'){
      const k=normId(r.opId||r.id)||String(r.photoId||r.id||'');
      if(k&&seenOk.has(k)){changed=true;continue}
      if(k)seenOk.add(k)
    }
    filtered.push(r)
  }
  /* Recupera PRONTAS se uma gravação antiga deixou os totais na OP-base. */
  for(const o of ops()){
    const id=normId(o?.id),production=num(o?.autoProduction),scrap=num(o?.autoScrap);
    if(!id.startsWith('DFOP-')||!(production>0)||seenOk.has(id)||filtered.some(r=>normId(r?.opId||r?.id)===id&&r.status==='pending'))continue;
    filtered.unshift({
      id,opId:id,photoId:'',createdAt:String(o.autoUpdatedAt||o.closedAt||o.createdAt||new Date().toISOString()),
      date:localYmd(o.autoUpdatedAt||o.closedAt||o.createdAt)||today(),productionDay:localYmd(o.autoUpdatedAt||o.closedAt||o.createdAt)||today(),
      machine:o.machine||'',product:o.product||'',measure:o.measure||'',operator:o.operator||'',shift:o.shift||'',
      production,scrap,net:Math.max(0,production-scrap),status:'ok',recovered:true
    });
    seenOk.add(id);changed=true
  }
  if(changed)write(AUTO_KEY,filtered);
  return filtered
}

function addStyle(){if($('dfProdAutoCssV2'))return;const s=document.createElement('style');s.id='dfProdAutoCssV2';s.textContent=`#dfProdAuto{display:none}#dfProdAuto.on{display:block}.dfPAHero,.dfPACard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:12px}#dfProdAuto .dfPAOwnerNotice{background:#19202c;color:#fff;border:1px solid #536070;border-radius:14px;padding:13px 14px;margin:0 0 12px}
#dfProdAuto .dfPAOwnerNotice strong{display:block;font-weight:850;font-size:17px;line-height:1.35}
#dfProdAuto .dfPAOwnerNotice p{margin:9px 0 0;color:#e2e8f0;font-size:15px;line-height:1.45}
#dfProdAuto .dfPAOwnerNotice .dfPANoticeRow{border-top:1px solid #435065;margin:10px 0 0;padding-top:9px;font-size:13px;color:#e2e8f0}
#dfProdAuto .dfPAOwnerNotice .dfPANoticeRow small{display:block;margin-top:4px;color:#aebbd0;overflow-wrap:anywhere}
#dfProdAuto .dfPAOwnerNotice .dfPANoticeRow button{margin-top:8px;background:#17345e;border:1px solid #557ab3;border-radius:9px;padding:9px 12px;color:#fff;font-weight:900}
#dfProdAuto .dfPAHealthDetails{margin-top:8px;font-size:11px}
#dfProdAuto .dfPAHealthDetails summary{display:inline-block;list-style:none;border:1px solid #454c58;background:#272b33;border-radius:999px;padding:4px 12px;color:#d1d5db;font-size:11px;cursor:pointer}
#dfProdAuto .dfPAHealthDetails summary::-webkit-details-marker{display:none}
#dfProdAuto .dfPAHealthDetails .dfPAHealthBody{margin-top:8px;border:1px solid #475569;border-radius:10px;background:#0f172a;color:#cbd5e1;padding:10px;line-height:1.5}
.dfPAHero{border-color:#f5a000;background:linear-gradient(180deg,#211400,#14100a)}.dfPAHero h2{margin:0 0 6px;color:#ffd36a;font-size:clamp(16px,5vw,23px);line-height:1.2;letter-spacing:-.025em;white-space:nowrap;padding-right:0;max-width:100%}.dfPAHero p{margin:0;color:#cbd5e1;line-height:1.45;font-size:13px}.dfPAHealth{margin-top:12px;border:1px solid #166534;background:#0d2516;color:#86efac;border-radius:12px;padding:10px;font-size:12px;font-weight:850}.dfPATabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:12px}.dfPATabs button{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:11px 3px;font:950 10px/1.15 system-ui}.dfPATabs button.on{border-color:#f5a000;background:#211400;color:#ffd36a}.dfPAPane{display:none}.dfPAPane.on{display:block}
/* Mesma escala e distribuição da Formulação; somente apresentação. */
#dfProdAuto .dfPAHero{border-radius:24px;padding:20px 18px;margin-bottom:18px}

#dfProdAuto .dfPATabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:100%!important;margin-bottom:18px}
#dfProdAuto .dfPATabs>button{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:normal!important;min-width:0!important;max-width:none!important;width:100%!important;min-height:66px!important;padding:12px 8px!important;font:800 13px/1.2 system-ui!important;border-radius:16px!important}
#dfProdAuto .dfPACard{border-radius:22px;padding:20px;margin-bottom:14px}
#dfProdAuto .dfPACard h3{font-size:21px}
#dfProdAuto .dfPAChoice{gap:10px}
#dfProdAuto .dfPAChoice .dfPABtn{min-height:68px;font-size:14px}
@media(max-width:380px){#dfProdAuto .dfPATabs{gap:7px!important}#dfProdAuto .dfPATabs>button{font-size:12px!important;padding:10px 5px!important}}
.dfPACard h3{margin:0 0 11px;font-size:18px}.dfPAChoice{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfPABtn{width:100%;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:13px;padding:13px 9px;margin-top:9px;font:950 13px/1.15 system-ui}.dfPABtn.alt{border-color:#f5a000;background:#241600;color:#ffd36a}.dfPABtn.gray{border-color:#475569;background:#0f172a;color:#e2e8f0}.dfPABtn.danger{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}.dfPAStatus{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:12px;margin-top:10px;font-size:12px;font-weight:800;line-height:1.45}.dfPAStatus.ok{border-color:#166534;color:#86efac}.dfPAStatus.warn{border-color:#a16207;color:#fde68a}.dfPAStatus.bad{border-color:#7f1d1d;color:#fca5a5}.dfPATiny{color:#94a3b8;font-size:11px;line-height:1.45}.dfPAConfirm{display:none;margin-top:12px;border:1px solid #f5a000;background:#15110a;border-radius:14px;padding:13px}.dfPAConfirm.on{display:block}.dfPAOpTitle{font-weight:950;color:#ffd36a;font-size:15px}.dfPAGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfPAGrid label{display:block;color:#cbd5e1;font-size:11px;margin:8px 0 4px}.dfPAGrid input,#dfPAMonth,#dfPAReadyMonth,#dfPAArchiveMonth,#dfPAManualId{width:100%;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:11px;padding:11px;font-size:16px}.dfPAManual{display:none;margin-top:10px;border:1px solid #f5a000;background:#18120a;border-radius:13px;padding:12px}.dfPAManual.on{display:block}.dfPAManual b{display:block;color:#ffd36a;margin-bottom:5px}.dfPAList{border:1px solid #263244;background:#0f172a;border-radius:14px;padding:12px;margin-top:8px}.dfPAList strong{color:#e8edf5}.dfPABadge{display:inline-block;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;margin-left:5px}.dfPABadge.ok{background:#0c321c;color:#86efac}.dfPABadge.warn{background:#3a2605;color:#fde68a}.dfPAKpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.dfPAKpi{border:1px solid #263244;background:#0f172a;border-radius:13px;padding:11px}.dfPAKpi span{display:block;color:#94a3b8;font-size:10px}.dfPAKpi b{display:block;font-size:18px;margin-top:4px}.dfPAPreview{display:none;width:100%;max-height:380px;object-fit:contain;border:1px solid #334155;border-radius:14px;background:#080b13;margin-top:10px}.dfPAModal{position:fixed;inset:0;z-index:999999;background:#020617ee;display:none;padding:18px;overflow:auto}.dfPAModal.on{display:block}.dfPAModalBox{max-width:720px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:14px}.dfPAModal img{width:100%;max-height:70vh;object-fit:contain;border-radius:12px;background:#000}@media(max-width:640px){.dfPATabs{grid-template-columns:repeat(3,1fr)}.dfPAChoice,.dfPAGrid{grid-template-columns:1fr 1fr}.dfPAKpis{grid-template-columns:repeat(2,minmax(0,1fr))}}#dfPAPaneArchive,#dfPAPaneArchive .dfPACard{max-width:100%;min-width:0;overflow-x:clip}
#dfPAPaneArchive #dfPAArchiveSearch{display:block;width:100%;max-width:100%;box-sizing:border-box;min-height:46px;margin:10px 0 0;border:1px solid #334155;border-radius:10px;background:#0b1220;color:#fff;padding:12px;font-size:16px}
#dfPAPaneArchive #dfPAArchiveRefresh{width:100%;min-height:42px;margin-top:10px;border:1px solid #f5a000;background:#231900;color:#ffd36a;border-radius:10px;font-weight:800}
#dfPAPaneArchive #dfPAArchiveList{width:100%;max-width:100%;min-width:0;margin-top:12px;overflow-wrap:anywhere}
#dfPAPaneArchive .dfMonthlyRow{padding:12px;border:1px solid #334155;border-radius:12px;margin:8px 0;background:#101a2d}
#dfPAPaneArchive .dfMonthlyRow strong{color:#e2e8f0}
#dfPAPaneArchive .dfMonthlyRow .dfMonthlyId{font-size:12px;color:#94a3b8;overflow-wrap:anywhere;margin:3px 0 4px}
#dfPAPaneArchive .dfMonthlyRow .dfMonthlyMeta{color:#e2e8f0}
#dfPAPaneArchive .dfMonthlyRow button{display:block;margin-top:9px;width:100%;min-height:42px;border:1px solid #f5a000;background:#231900;color:#ffd36a;border-radius:10px;font-weight:800}
#dfPAPaneArchive .dfMonthlyRow button:disabled{opacity:.55;cursor:not-allowed}
#dfPAPaneArchive .dfMonthlyEmpty{color:#94a3b8;padding:8px 0;font-size:13px}
`;document.head.appendChild(s)}

function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoPut(id,blob,meta){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').put({id,blob,mime:blob.type||'image/jpeg',savedAt:new Date().toISOString(),...(meta||{})});tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function photoGet(id){const d=await dbOpen();return new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function photoDelete(id){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function photoAll(){const d=await dbOpen();return new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>res(Array.isArray(r.result)?r.result:[]);r.onerror=()=>rej(r.error)})}
async function recoverOrphanPhotos(){
  try{
    repairRecords();
    const photos=await photoAll(),a=autos(),readyIds=new Set(a.filter(r=>r?.status==='ok').map(r=>normId(r.opId||r.id))),knownPhotos=new Set(a.map(r=>String(r?.photoId||'')).filter(Boolean));
    let changed=false;
    const cutoff=Date.now()-3*24*60*60*1000;
    photos.sort((x,y)=>String(y?.savedAt||'').localeCompare(String(x?.savedAt||'')));
    for(const p of photos){
      const opId=normId(p?.opId||''),pt=Date.parse(String(p?.savedAt||p?.createdAt||''));
      if(!opId.startsWith('DFOP-')||readyIds.has(opId)||knownPhotos.has(String(p?.id||''))||!(pt>=cutoff)||!findOp(opId))continue;
      /* Uma foto órfã de OP já encerrada não é prova de baixa perdida: não gerar PENDENTE falso. */
      const original=ops().find(o=>normId(o?.id)===opId);
      if(original?.status==='closed'||original?.status==='completed'||original?.status==='concluida')continue;
      a.unshift({id:'PEND-REC-'+Date.now()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),photoId:String(p.id||''),opId,createdAt:String(p.savedAt||p.createdAt||new Date().toISOString()),date:String(p.savedAt||p.createdAt||today()).slice(0,10),reason:'Foto recuperada após falha de sincronização. Confirme produção e apara.',status:'pending',recovered:true});
      knownPhotos.add(String(p.id||''));changed=true
    }
    if(changed){write(AUTO_KEY,a);renderAll()}
    return changed
  }catch(e){return false}
}
function loadScript(src,check){return new Promise((resolve,reject)=>{if(check())return resolve();const old=document.querySelector('script[data-df-pa-lib="'+src+'"]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.dataset.dfPaLib=src;s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar leitor de QR'));document.head.appendChild(s)})}
const loadQR=()=>loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',()=>!!window.jsQR);
function imageCanvas(file,max=2400){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
function scanCanvas(c){const x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return String(r?.data||'').trim()}
function rotateCanvas(src,turns){turns=((turns%4)+4)%4;if(!turns)return src;const c=document.createElement('canvas');if(turns%2){c.width=src.height;c.height=src.width}else{c.width=src.width;c.height=src.height}const x=c.getContext('2d',{willReadFrequently:true});x.translate(c.width/2,c.height/2);x.rotate(turns*Math.PI/2);x.drawImage(src,-src.width/2,-src.height/2);return c}
function cropCanvas(src,x0,y0,w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.floor(w));c.height=Math.max(1,Math.floor(h));c.getContext('2d',{willReadFrequently:true}).drawImage(src,x0,y0,w,h,0,0,c.width,c.height);return c}
function scaleCanvas(src,factor){const c=document.createElement('canvas');c.width=Math.round(src.width*factor);c.height=Math.round(src.height*factor);const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;x.drawImage(src,0,0,c.width,c.height);return c}
async function decodeQREveryWay(file){
  /* QR pequeno no canto da folha: buscar por regiões e ampliar, inclusive foto girada. */
  const base=await imageCanvas(file,3000);
  const native=typeof window.BarcodeDetector==='function'?new BarcodeDetector({formats:['qr_code']}):null;
  await loadQR();
  const candidates=[base];
  for(let t=0;t<4;t++){
    const c=t?rotateCanvas(base,t):base,w=c.width,h=c.height;
    if(t)candidates.push(c);
    for(const [x,y] of [[0,0],[.5,0],[0,.5],[.5,.5]]){
      candidates.push(cropCanvas(c,Math.floor(w*x),Math.floor(h*y),Math.ceil(w*.5),Math.ceil(h*.5)));
    }
  }
  for(const c of candidates){
    if(native){try{const hits=await native.detect(c);if(hits?.[0]?.rawValue)return String(hits[0].rawValue)}catch(e){}}
    const raw=scanCanvas(c);if(raw)return raw;
    if(c!==base&&Math.max(c.width,c.height)<1800){const enlarged=scaleCanvas(c,2);const zoomed=scanCanvas(enlarged);if(zoomed)return zoomed}
  }
  return '';
}
function extractId(raw){const s=String(raw||'').trim(),direct=s.match(/DFOP-[A-Z0-9-]+/i);if(direct)return direct[0].toUpperCase();try{const u=new URL(s),q=u.searchParams.get('op')||u.searchParams.get('id')||'',m=String(q).match(/DFOP-[A-Z0-9-]+/i);return m?m[0].toUpperCase():''}catch(e){return''}}

(function(){const st=document.createElement('style');st.id='dfPAReadyUnifiedStyle';st.textContent="\n#dfProdAuto .dfPAExclusiveHeader{display:none}\n#dfProdAuto.dfPAExclusive .dfPAExclusiveHeader{display:flex;position:fixed;top:0;left:0;right:0;z-index:10002;box-sizing:border-box;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 8px) 12px 10px;border-bottom:1px solid #334155;background:#080b13;min-height:52px}\n#dfProdAuto .dfPAExclusiveHeader button{flex-shrink:0;background:#241600;color:#ffd36a;border:1px solid #f5a000;border-radius:10px;font-weight:800;padding:10px 12px}\n#dfProdAuto .dfPAExclusiveHeader strong{font-size:16px;color:#fff}\n#dfProdAuto.dfPAExclusive>.dfPAHero,#dfProdAuto.dfPAExclusive>.dfPATabs{display:none!important}\nbody #dfProdAuto.dfPAExclusive{display:block!important}\n#dfProdAuto.dfPAExclusive #dfPAPaneOk{display:block!important;position:fixed!important;inset:0!important;z-index:10000!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;height:100dvh!important;max-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;background:#080b13!important;padding:calc(env(safe-area-inset-top,0px) + 78px) 12px calc(env(safe-area-inset-bottom,0px) + 28px)!important;-webkit-overflow-scrolling:touch!important}\n#dfProdAuto.dfPAExclusive #dfPAPaneOk>.dfPACard{width:100%!important;max-width:680px!important;box-sizing:border-box!important;margin:0 auto 12px!important;padding:14px!important;background:#0b1324!important;border:1px solid #334155!important;border-radius:14px!important;box-shadow:none!important;min-height:0!important;height:auto!important;overflow:visible!important}\n#dfProdAuto.dfPAExclusive #dfPAPaneOk>.dfPACard>h3{display:none!important}\n#dfProdAuto #dfPAPaneOk .dfPAAllMonthsLabel{display:flex;align-items:center;gap:10px;margin:0 0 14px;color:#f8fafc;font-weight:800;font-size:14px;cursor:pointer;position:relative}\n#dfProdAuto #dfPAPaneOk .dfPAAllMonthsLabel input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}\n#dfProdAuto #dfPAPaneOk .dfPAAllMonthsBox{display:flex;align-items:center;justify-content:center;width:25px;height:25px;flex:0 0 25px;border:2px solid #f5a000;border-radius:7px;background:#0f172a;color:transparent;font-weight:900}\n#dfProdAuto #dfPAPaneOk .dfPAAllMonthsLabel input:checked+.dfPAAllMonthsBox{background:#f5a000;color:#fff}\n#dfProdAuto #dfPAPaneOk .dfPAAllMonthsLabel input:focus-visible+.dfPAAllMonthsBox{outline:2px solid #60a5fa;outline-offset:2px}\n#dfProdAuto #dfPAPaneOk #dfPAReadySearch{width:100%!important;box-sizing:border-box!important;border:1px solid #475569!important;background:#080f1d!important;color:#fff!important;border-radius:10px!important;padding:12px!important;font-size:16px!important;min-height:48px!important;margin:0 0 9px!important}\n#dfProdAuto #dfPAPaneOk #dfPAReadyFind{width:100%!important;margin:0 0 10px!important;min-height:42px!important;border:1px solid #f5a000!important;background:#241600!important;color:#ffd36a!important;border-radius:10px!important;font-weight:900!important}\n#dfProdAuto #dfPAPaneOk #dfPAReadySummary{display:none!important}\n#dfProdAuto #dfPAPaneOk #dfPAReadyResults{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;position:static!important;margin:10px 0 0!important}\n#dfProdAuto #dfPAPaneOk .dfPAReadyHint,#dfProdAuto #dfPAPaneOk .dfPAReadyEmpty{color:#94a3b8;font-size:12px;padding:8px 2px}\n#dfProdAuto #dfPAPaneOk .dfPAReadySummary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0 0 8px}\n#dfProdAuto #dfPAPaneOk .dfPAReadySummary>div{border:1px solid #263244;background:#0f172a;border-radius:10px;padding:9px}\n#dfProdAuto #dfPAPaneOk .dfPAReadySummary span{display:block;color:#94a3b8;font-size:10px}\n#dfProdAuto #dfPAPaneOk .dfPAReadySummary b{display:block;margin-top:2px;color:#fff;font-size:14px}\n#dfProdAuto #dfPAPaneOk .dfPAReadyResultCard{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;position:static!important;overflow:visible!important;border:1px solid #263244!important;background:#111827!important;border-radius:12px!important;padding:10px!important;margin:8px 0 0!important}\n#dfProdAuto #dfPAPaneOk .dfPAReadyTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}\n#dfProdAuto #dfPAPaneOk .dfPAReadyTop strong{display:block;color:#ffd36a;font-size:14px}\n#dfProdAuto #dfPAPaneOk .dfPAReadyTop small{display:block;color:#94a3b8;font-size:10px;margin-top:3px;word-break:break-all}\n#dfProdAuto #dfPAPaneOk .dfPAReadyBadge{white-space:nowrap;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950;background:#073b1d;color:#86efac}\n#dfProdAuto #dfPAPaneOk .dfPAReadyMeta{font-size:11px;color:#cbd5e1;margin:8px 0}\n#dfProdAuto #dfPAPaneOk .dfPAReadyPhoto{display:block;width:100%;border:1px solid #475569;background:#0f172a;color:#f8fafc;border-radius:9px;padding:10px;font-weight:900}\n#dfProdAuto #dfPAPaneOk .dfPAReadyActions{margin-top:8px}\n#dfProdAuto #dfPAPaneOk .dfPAReadyActions summary{cursor:pointer;color:#94a3b8;font-weight:800;font-size:11px;padding:8px}\n";document.head.appendChild(st)})();
function build(){return `<div id="dfPAExclusiveHeader" class="dfPAExclusiveHeader"><button id="dfPAExclusiveBack" type="button">← VOLTAR</button><strong id="dfPAExclusiveTitle">✅ OPS PRONTAS</strong></div><section id="dfPAOwnerNotice" class="dfPAOwnerNotice" hidden aria-live="polite"></section><div class="dfPAHero"><h2>🤖 OP DE PRODUÇÃO + QR</h2><p>Fotografe a OP, confirme manualmente somente <b>PRODUÇÃO TOTAL</b> e <b>APARA TOTAL</b> e salve. O D1 mantém a OP oficial sincronizada entre os aparelhos.</p><details class="dfPAHealthDetails"><summary>🩺 SAÚDE DO SISTEMA</summary><div id="dfPAHealthBody" class="dfPAHealthBody">Status da conexão e equipe de Produção.</div></details></div><div class="dfPATabs"><button class="on" data-pa-pane="read">📸 LER OP</button><button data-pa-pane="ok">✅ PRONTAS</button><button data-pa-pane="pending">⚠️ PENDENTES</button><button data-pa-pane="now">🏭 AGORA</button><button data-pa-pane="month">📊 MÊS</button><button data-pa-pane="archive">📸 FOTOS</button></div><div id="dfPAPaneRead" class="dfPAPane on"><div class="dfPACard"><h3>Fotografar OP preenchida</h3><div class="dfPAChoice"><button id="dfPATake" class="dfPABtn alt">📷 TIRAR FOTO DE LADO</button><button id="dfPAUpload" class="dfPABtn gray">🖼️ ENVIAR FOTO</button></div><input id="dfPATakeInput" type="file" accept="image/*" capture="environment" hidden><input id="dfPAUploadInput" type="file" accept="image/*" hidden><img id="dfPAPreview" class="dfPAPreview"><div id="dfPAStatus" class="dfPAStatus">Escolha ou tire uma foto. Assim que selecionar, a leitura do QR começa sozinha.</div><div id="dfPAManual" class="dfPAManual"><b>NÃO IDENTIFICOU O QR?</b><div class="dfPATiny">Digite o ID da OP exatamente como aparece na folha.</div><input id="dfPAManualId" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DFOP-..."><button id="dfPAManualFind" class="dfPABtn alt" type="button">IDENTIFICAR OP PELO ID</button><button id="dfPARecoverMissing" class="dfPABtn alt" type="button" style="display:none;margin-top:10px;border-color:#d99a24">RECUPERAR ESTA OP PARA BAIXA</button></div><div id="dfPAConfirm" class="dfPAConfirm"><div id="dfPAOpInfo"></div><div class="dfPAGrid"><div><label>PRODUÇÃO TOTAL (kg)</label><input id="dfPAProduction" inputmode="decimal" placeholder="0,00"></div><div><label>APARA TOTAL (kg)</label><input id="dfPAScrap" inputmode="decimal" placeholder="0,00"></div></div><button id="dfPASave" class="dfPABtn">SALVAR OP</button></div><div class="dfPATiny" style="margin-top:10px">✅ Fluxo: foto → QR ou ID → produção + apara → SALVAR OP → PRONTAS.</div></div></div><div id="dfPAPaneOk" class="dfPAPane"><div class="dfPACard"><h3>OPs prontas</h3><label for="dfPAReadyMonth" style="display:none">Mês das OPs prontas</label><input id="dfPAReadyMonth" type="month" style="display:none"><label class="dfPAAllMonthsLabel"><input id="dfPAReadyAllMonths" type="checkbox"><span class="dfPAAllMonthsBox">✓</span><span>TODAS — TODOS OS MESES</span></label><input id="dfPAReadySearch" type="search" autocapitalize="characters" autocomplete="off" placeholder="PESQUISAR PRODUTO OU ID DA OP" style="width:100%;min-height:48px;margin:12px 0;padding:12px;background:#0f172a;border:1px solid #475569;border-radius:12px;color:#fff;font-size:16px"><button id="dfPAReadyFind" class="dfPABtn alt" type="button">PESQUISAR</button><div id="dfPAReadySummary" class="dfPATiny" hidden></div><div id="dfPAReadyResults" aria-live="polite"><div class="dfPAReadyHint">Digite o nome do produto ou o ID da OP.</div></div></div></div><div id="dfPAPanePending" class="dfPAPane"><div class="dfPACard"><h3>Pendentes</h3><div class="dfPATiny">Somente fotos que ainda não foram vinculadas e salvas.</div><div id="dfPAPendingList"></div></div></div><div id="dfPAPaneNow" class="dfPAPane"><div class="dfPACard"><h3>Produção agora</h3><div id="dfPANowList"></div></div></div><div id="dfPAPaneMonth" class="dfPAPane"><div class="dfPACard"><h3>Fechamento do mês</h3><label>Mês</label><input id="dfPAMonth" type="month"><div id="dfPAMonthReport"></div></div></div><div id="dfPAPaneArchive" class="dfPAPane"><div class="dfPACard"><h3>📸 FOTOS • OPs BAIXADAS</h3><input id="dfPAArchiveSearch" type="search" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="PESQUISAR PRODUTO OU ID DA OP"><button id="dfPAArchiveRefresh" class="dfPABtn alt" type="button">🔄 ATUALIZAR</button><div id="dfPAArchiveList" aria-live="polite"><div class="dfMonthlyEmpty">Selecione o mês na aba MÊS para consultar as fotos.</div></div></div></div><div id="dfPAModal" class="dfPAModal"><div class="dfPAModalBox"><button id="dfPACloseModal" class="dfPABtn gray" style="margin-top:0">FECHAR</button><div id="dfPAModalBody"></div></div></div>`}

function mount(){addStyle();let panel=$('dfProdAuto');if(!panel){panel=document.createElement('section');panel.id='dfProdAuto';panel.innerHTML=build();(document.querySelector('main.wrap')||document.body).appendChild(panel)}if(!bound)bind();repairRecords();renderAll();setTimeout(()=>recoverOrphanPhotos(),80);return panel}
function setNav(auto){window.__DF_PROD_AUTO_ACTIVE=!!auto;[['prodNewTab',!auto],['prodAutoTab',!!auto]].forEach(([id,on])=>{const b=$(id);if(!b)return;b.className=on?'active':'secondary';if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function show(){const panel=mount(),pg=$('pgPr');if(pg)pg.style.setProperty('display','none','important');panel.classList.add('on');setNav(true);renderAll();window.scrollTo({top:0,behavior:'smooth'})}
function hide(){window.__DF_PROD_AUTO_ACTIVE=false;const panel=$('dfProdAuto');if(panel)panel.classList.remove('on');const pg=$('pgPr');if(pg){pg.style.display='block';pg.classList.add('on')}}
window.DFShowProductionAuto=show;window.DFHideProductionAuto=hide;

const paneId=name=>'dfPAPane'+({read:'Read',ok:'Ok',pending:'Pending',now:'Now',month:'Month',archive:'Archive'}[name]||'Read');
function switchPane(name){if(name!=='month'&&$('dfPAPaneMonth')?.classList.contains('on'))persistSelectedMonth($('dfPAMonth')?.value);synchronizeMonthInputs();const panel=$('dfProdAuto');if(panel){panel.dataset.dfActivePane=name;panel.classList.toggle('dfPAExclusive',name==='ok');}document.querySelectorAll('#dfProdAuto [data-pa-pane]').forEach(b=>b.classList.toggle('on',b.dataset.paPane===name));document.querySelectorAll('#dfProdAuto .dfPAPane').forEach(p=>p.classList.remove('on'));$(paneId(name))?.classList.add('on');if(name==='ok')renderOk();if(name==='pending')renderPending();if(name==='now')renderNow();if(name==='month')renderMonth();if(name==='archive'){renderArchive();loadArchive(false)}}
function card(r,pending){return '<div class="dfPAList"><strong>'+esc(r.machine||r.opId||r.id)+'</strong><span class="dfPABadge '+(pending?'warn':'ok')+'">'+(pending?'PENDENTE':'OK')+'</span><div class="dfPATiny">'+esc(r.product||r.reason||'')+(r.measure?' • '+esc(r.measure):'')+(pending?'':'<br>Produção '+fmt(r.production)+' kg • Apara '+fmt(r.scrap)+' kg • Líquida '+fmt(r.net)+' kg')+'</div>'+(r.photoId?'<button class="dfPABtn gray" data-pa-view="'+esc(r.photoId)+'">ABRIR FOTO</button>':'')+(pending?(r.status==='pending'?(window.DFProducaoEquipeOnline?.team?.()?.role==='owner'?'<button class="dfPABtn" data-pa-approve="'+esc(r.id)+'">CONFIRMAR OP</button>':'<div class="dfPATiny">AGUARDANDO CONFIRMAÇÃO DO DONO</div>'):'<button class="dfPABtn alt" data-pa-retry="'+esc(r.id)+'">IDENTIFICAR PELO ID</button>'):'')+(pending?'':'<button class="dfPAEditBtn" data-pa-edit="'+esc(r.id)+'">EDITAR</button><button class="dfPAEditBtn" data-pa-machine-edit="'+esc(r.id)+'">EDITAR MÁQUINA</button>')+'<button class="dfPABtn danger" data-pa-del="'+esc(r.id)+'">EXCLUIR REGISTRO</button></div>'}
function renderProductionNotice(){
 const host=$('dfPAOwnerNotice'),health=$('dfPAHealthBody');if(!host)return;
 const team=window.DFProducaoEquipeOnline?.team?.();
 const month=viewingMonth();
 const current=autos().filter(r=>r?.status==='pending'&&completionMonth(r)===month);
 const isOwner=String(team?.role||'').toLowerCase()==='owner';
 if(!team?.teamId){host.hidden=true}
 else{
  host.hidden=false;
  const head=isOwner?'OPs aguardando sua confirmação':'OPs aguardando confirmação do dono';
  let html='<strong>'+head+' ('+current.length+')</strong>';
  if(!current.length)html+='<p>Nenhuma OP pendente neste mês.</p>';
  else html+=current.map(r=>'<div class="dfPANoticeRow"><b>'+esc(r.product||r.machine||r.opId||'OP')+'</b><small>'+esc(r.opId||r.id||'')+' · '+fmt(r.production||0)+' kg · apara '+fmt(r.scrap||0)+' kg</small><button type="button" data-pa-show-pending>VER PENDENTES</button></div>').join('');
  if(host.innerHTML!==html)host.innerHTML=html;
 }
 if(health){
  const online=navigator.onLine!==false;
  const status='Conexão do aparelho: '+(online?'online':'offline')+'. '+(team?.teamId?'Equipe de Produção vinculada.':'Equipe de Produção não vinculada.')+' O status online do aparelho não confirma, sozinho, o acesso ao D1.';
  if(health.textContent!==status)health.textContent=status;
 }
}
function renderAll(){renderProductionNotice();if(document.getElementById('dfPAEditModal')?.classList.contains('on'))return;if(!window.DFProducaoEquipeOnline?.team?.()){for(const id of ['dfPAPendingList','dfPANowList','dfPAMonthList','dfPAArchiveList']){const el=$(id);if(el){delete el.dataset.dfListSignature;el.innerHTML='<div class="dfPATiny">Entre na Equipe de Produção para visualizar os dados.</div>'}}return}repairRecords();synchronizeMonthInputs();renderOk();renderPending();renderNow();renderMonth();renderArchive()}

let lastReadySignature='',lastPendingSignature='',lastReadyFilterKey='';
function renderOk(force=false){
 const b=$('dfPAReadyResults'),input=$('dfPAReadySearch');if(!b||!input)return;
 const query=String(input.value||'').trim().toUpperCase();
 const allMonths=!!$('dfPAReadyAllMonths')?.checked,month=synchronizeMonthInputs();
 const teamId=String(window.DFProducaoEquipeOnline?.team?.()?.teamId||'');
 const filterKey=JSON.stringify([teamId,month,allMonths,query]);
 if(!query){
  const hint='<div class="dfPAReadyHint">Digite o nome do produto ou o ID da OP.</div>';
  if(b.innerHTML!==hint)b.innerHTML=hint;
  lastReadySignature='';lastReadyFilterKey=filterKey;
  return;
 }
 if(!teamId)return;
 // Como na Formulação: sincronização não desmonta uma pesquisa já exibida.
 // Nova busca, seleção de mês ou equipe trocada continuam atualizando normalmente.
 if(!force&&lastReadyFilterKey===filterKey&&b.childElementCount>0)return;
 const matches=autos().filter(x=>x?.status==='ok'&&(allMonths||completionMonth(x)===month)&&[x.id,x.opId,x.product,x.machine,x.measure].some(v=>String(v||'').toUpperCase().includes(query))).sort((x,y)=>String(y.date||y.completedAt||y.createdAt||'').localeCompare(String(x.date||x.completedAt||x.createdAt||'')));
 const signature=JSON.stringify([teamId,month,allMonths,query,matches.map(x=>[x.id,x.opId,x.product,x.machine,x.measure,x.date,x.productionDay,x.completedAt,x.createdAt,x.production,x.scrap,x.photoId])]);
 if(!force&&signature===lastReadySignature&&b.childElementCount>0)return;
 const total=matches.reduce((v,x)=>v+num(x.production),0);
 const summary='<div class="dfPAReadySummary"><div><span>OPs baixadas</span><b>'+matches.length+'</b></div><div><span>Produção encontrada</span><b>'+fmt(total)+' kg</b></div></div>';
 const result=matches.length?matches.map(x=>readyCompactCard(x)).join(''):'<div class="dfPAReadyEmpty">Nenhuma OP baixada encontrada com <b>'+esc(input.value.trim())+'</b>.</div>';
 const html=summary+result;
 if(b.innerHTML!==html)b.innerHTML=html;
 lastReadySignature=signature;lastReadyFilterKey=filterKey;
}
function readyCompactCard(r){
 const title=esc(r.product||r.machine||r.opId||r.id||'OP');
 const id=esc(r.opId||r.id||'');
 const date=esc(String(r.productionDay||r.date||r.completedAt||r.createdAt||'').slice(0,10));
 const photo=r.photoId?'<button type="button" class="dfPAReadyPhoto" data-pa-view="'+esc(r.photoId)+'">ABRIR FOTO</button>':'<button type="button" class="dfPAReadyPhoto" disabled>SEM FOTO</button>';
 return '<div class="dfPAReadyResultCard"><div class="dfPAReadyTop"><div><strong>'+title+'</strong><small>'+id+'</small></div><span class="dfPAReadyBadge">RODADA / PRONTA</span></div><div class="dfPAReadyMeta">'+date+' • Produção '+fmt(r.production)+' kg • Apara '+fmt(r.scrap)+' kg</div>'+photo+'<details class="dfPAReadyActions"><summary>MAIS OPÇÕES</summary><button class="dfPAEditBtn" data-pa-edit="'+esc(r.id)+'">EDITAR</button><button class="dfPAEditBtn" data-pa-machine-edit="'+esc(r.id)+'">EDITAR MÁQUINA</button><button class="dfPABtn danger" data-pa-del="'+esc(r.id)+'">EXCLUIR REGISTRO</button></details></div>';
}

function renderPending(){const b=$('dfPAPendingList');if(!b)return;const a=autos().filter(x=>x.status!=='ok').sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));const signature=JSON.stringify([window.DFProducaoEquipeOnline?.team?.()?.teamId,window.DFProducaoEquipeOnline?.team?.()?.role,a.map(x=>[x.id,x.opId,x.machine,x.product,x.reason,x.measure,x.status,x.photoId,x.createdAt])]);
 if(b.dataset.dfListSignature===signature&&b.childElementCount)return;
 b.innerHTML=a.length?a.map(x=>card(x,true)).join(''):'<div class="dfPATiny">Nenhuma pendência.</div>';b.dataset.dfListSignature=signature}
function renderNow(){if(window.DF_PRODUCAO_AGORA_MAQUINAS_V3)return;const b=$('dfPANowList');if(!b)return;const all=autos(),a=ops().filter(x=>x.status==='open').sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));b.innerHTML=a.length?a.map(o=>{const r=all.find(x=>x.status==='ok'&&normId(x.opId)===normId(o.id));return '<div class="dfPAList"><strong>'+esc(o.machine)+' — '+esc(o.measure)+'</strong><div class="dfPATiny">'+esc(o.product)+'<br>'+esc(o.operator)+' • Turno '+esc(normShift(o.shift))+'<br>'+esc(o.id)+'</div>'+(r?'<div class="dfPAKpis"><div class="dfPAKpi"><span>PRODUÇÃO</span><b>'+fmt(r.production)+' kg</b></div><div class="dfPAKpi"><span>APARA</span><b>'+fmt(r.scrap)+' kg</b></div><div class="dfPAKpi"><span>LÍQUIDA</span><b>'+fmt(r.net)+' kg</b></div></div>':'<div class="dfPAStatus warn">Aguardando leitura automática da OP.</div>')+'</div>'}).join(''):'<div class="dfPATiny">Nenhuma OP aberta agora.</div>'}
function renderMonth(){if(!$('dfPAPaneMonth')?.classList.contains('on'))return;const b=$('dfPAMonthReport');if(!b)return;const m=synchronizeMonthInputs(),a=autos().filter(x=>x.status==='ok'&&completionMonth(x)===m),p=a.reduce((s,x)=>s+num(x.production),0),s=a.reduce((v,x)=>v+num(x.scrap),0),n=Math.max(0,p-s),scrapPercent=p>0?s/p*100:0;b.innerHTML='<div class="dfPAKpis"><div class="dfPAKpi"><span>PRODUÇÃO</span><b>'+fmt(p)+' kg</b></div><div class="dfPAKpi"><span>APARA</span><b>'+fmt(s)+' kg</b></div><div class="dfPAKpi"><span>LÍQUIDA</span><b>'+fmt(n)+' kg</b></div><div class="dfPAKpi"><span>APARA (%)</span><b>'+scrapPercent.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%</b></div></div>'+(a.length?a.map(x=>'<div class="dfPAList"><strong>'+esc(x.machine||x.opId)+'</strong><div class="dfPATiny">'+esc(x.product||'')+' • '+fmt(x.production)+' kg</div></div>').join(''):'<div class="dfPATiny">Nenhuma OP processada neste mês.</div>')}
// Somente registros oficiais do D1 em Prontas; fotos e pendências não entram na lista.
let archivedRows=[],archivedTeam='',archivedLastPull=0,archivedLoading=false,archivedOffline=false,archivedError='';
function archiveOpen(){return !!$('dfPAPaneArchive')?.classList.contains('on')}

function renderArchive(){
 const pane=$('dfPAPaneArchive');
 if(!pane?.classList.contains('on'))return;
 const box=$('dfPAArchiveList');if(!box)return;
 const teamId=String(window.DFProducaoEquipeOnline?.team?.()?.teamId||'');
 const selected=synchronizeMonthInputs();
 const query=String($('dfPAArchiveSearch')?.value||'').trim().toUpperCase();
 const official=(teamId&&archivedTeam===teamId?archivedRows:[]).filter(
   r=>completionMonth({date:r.localDate,completedAt:r.completedAt})===selected
 );
 // A lista oficial do D1 decide quais OPs existem. Dados locais apenas
 // completam nomes, pesos e vínculos de foto sem criar OPs antigas fictícias.
 const local=new Map(autos().filter(r=>r?.status==='ok').map(r=>[normId(r.opId||r.id),r]));
 const found=official.map(r=>{
   const item=local.get(normId(r.opCode))||{};
   return{
     ...r,
     productName:String(r.productName||item.product||item.machine||r.machine||r.opCode||''),
     production:r.production!=null?num(r.production):num(item.production),
     scrap:r.scrap!=null?num(r.scrap):num(item.scrap),
     photoRef:r.photoId?'CLOUDPROD:'+normId(r.opCode):String(item.photoId||''),
     editId:String(item.id||r.opCode)
   };
 }).filter(r=>!query||[r.opCode,r.productName,r.machine].some(v=>String(v||'').toUpperCase().includes(query)));
 let notice='';
 if(!teamId)notice='Entre na Equipe de Produção para consultar as fotos.';
 else if(!archivedLastPull&&archivedLoading)notice='Consultando OPs do mês no D1...';
 else if(archivedError&&!official.length)notice=archivedError;
 else if(!found.length)notice=query?'Nenhuma OP baixada encontrada com esse produto ou ID neste mês.':'Nenhuma OP baixada encontrada neste mês.';
 const signature=JSON.stringify([teamId,selected,query,notice,found.map(r=>[r.opCode,r.productName,r.production,r.scrap,r.photoRef,r.editId])]);
 if(box.dataset.dfArchiveSignature===signature&&box.childElementCount)return;
 const html=notice?'<div class="dfMonthlyEmpty">'+esc(notice)+'</div>':found.map(r=>
   '<div class="dfMonthlyRow"><strong>'+esc(r.productName)+'</strong>'+
   '<div class="dfMonthlyId">'+esc(r.opCode)+'</div>'+
   '<div class="dfMonthlyMeta">Produção: '+fmt(r.production)+' kg • Apara: '+fmt(r.scrap)+' kg</div>'+
   (r.photoRef?'<button type="button" data-pa-view="'+esc(r.photoRef)+'">📸 ABRIR FOTO DA NUVEM</button>':
     '<button type="button" disabled>📸 FOTO NÃO DISPONÍVEL</button>')+
   '<button type="button" class="dfPAArchiveEdit" data-pa-edit="'+esc(r.editId)+'">✏️ EDITAR OP</button></div>'
 ).join('');
 if(box.innerHTML!==html)box.innerHTML=html;
 box.dataset.dfArchiveSignature=signature;
}

async function loadArchive(force=false){
 const api=window.DFProducaoEquipeOnline,t=api?.team?.();
 if(!archiveOpen()||!t?.teamId||!api?.archivedReadyOps)return;
 const teamId=String(t.teamId);
 if(archivedTeam!==teamId){archivedRows=[];archivedTeam=teamId;archivedLastPull=0;archivedError=''}
 if(archivedLoading||(!force&&Date.now()-archivedLastPull<10000))return;
 archivedLoading=true;renderArchive();
 try{
  const result=await api.archivedReadyOps();
  if(String(api?.team?.()?.teamId||'')!==teamId)return;
  archivedRows=Array.isArray(result?.records)?result.records:[];
  archivedOffline=!!result?.offline;
  archivedError=result?.error?'⚠️ D1 indisponível; mostrando última consulta salva.':'';
  archivedLastPull=Date.now();
 }catch(e){
  archivedError='⚠️ Não foi possível buscar os IDs no D1: '+String(e?.message||e);
 }finally{archivedLoading=false;renderArchive()}
}


function setStatus(text,type=''){const st=$('dfPAStatus');if(st){st.className='dfPAStatus'+(type?' '+type:'');st.innerHTML=text}}
function resetCurrent(){currentOp=null;currentPendingId='';currentFile=null;currentPhotoId='';const img=$('dfPAPreview');if(img){img.removeAttribute('src');img.style.display='none'}$('dfPAConfirm')?.classList.remove('on');$('dfPAManual')?.classList.remove('on');if($('dfPAManualId'))$('dfPAManualId').value='';if($('dfPAProduction'))$('dfPAProduction').value='';if($('dfPAScrap'))$('dfPAScrap').value=''}
function showManual(prefill=''){offerRecovery(prefill);const box=$('dfPAManual');if(box)box.classList.add('on');const i=$('dfPAManualId');if(i){i.value=prefill||'';setTimeout(()=>i.focus(),20)}}
function offerRecovery(id){const btn=$('dfPARecoverMissing');if(btn)btn.style.display=/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(normId(id))?'block':'none'}
function recoverMissingOp(){const id=normId($('dfPAManualId')?.value);if(!/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(id))return setStatus('⚠️ Confira o código completo da OP antes de recuperar.','warn');const existing=findOp(id);if(existing){showConfirm(existing);return}if(!confirm('A OP '+id+' não foi encontrada na equipe. Criar um cadastro de RECUPERAÇÃO com esse mesmo ID, sem inventar máquina, produto ou operador? A baixa só será registrada quando você informar os quilos e clicar em SALVAR OP.'))return;const list=ops();if(list.some(o=>normId(o?.id)===id)){showConfirm(findOp(id));return}const recovered={id,sector:'Picote',machine:'',product:'',measure:'',operator:'',shift:'',createdAt:new Date().toISOString(),status:'open',recoveredFromPrintedOp:true,needsCatalogReview:true,productionTeamId:window.DFProducaoEquipeOnline?.team?.()?.teamId||''};list.unshift(recovered);if(!write(OPS_KEY,list))return setStatus('❌ Não foi possível salvar o cadastro de recuperação.','bad');try{window.dispatchEvent(new CustomEvent('df-producao-op-updated',{detail:{opId:id}}))}catch(e){}showConfirm(recovered);setStatus('✅ Cadastro de recuperação criado com o ID da folha. Confira a OP e informe produção e apara para dar baixa.','ok')}
function showConfirm(op){currentOp=op;const info=$('dfPAOpInfo');if(info)info.innerHTML='<div class="dfPAOpTitle">'+esc(op.machine||'')+' — '+esc(op.measure||'')+'</div><div class="dfPATiny">'+esc(op.product||'')+'<br>'+esc(op.operator||'')+' • Turno '+esc(normShift(op.shift))+'<br>'+esc(op.id)+'</div>';$('dfPAManual')?.classList.remove('on');$('dfPAConfirm')?.classList.add('on');setStatus('✅ OP identificada. Informe <b>PRODUÇÃO TOTAL</b> e <b>APARA TOTAL</b> para salvar.','ok');setTimeout(()=>$('dfPAProduction')?.focus(),20)}
function pendingRecord(reason,prefill=''){/* Falha de leitura não é pendência de produção: manter a foto temporária sem criar PEND. */currentPendingId='';showManual(prefill);setStatus('⚠️ QR não identificado automaticamente. A foto está nesta tela, mas <b>nenhuma pendência foi criada</b>. Digite o ID ou tire outra foto.','warn')}
async function handleFile(file){
 if(!file||working)return;
 working=true;resetCurrent();currentFile=file;
 currentPhotoId='PHOTO-'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
 const img=$('dfPAPreview');
 if(img){img.src=URL.createObjectURL(file);img.style.display='block'}
 setStatus('🔎 Lendo QR da OP...','');
 try{
  const raw=await decodeQREveryWay(file),id=extractId(raw);
  if(id){
   // Antes de salvar a foto ou abrir os campos, verificar a baixa no D1.
   // Nenhuma consulta de listagem completa e nenhum upload para OP duplicada.
   try{
    const available=await checkBeforeOpen(id);
    if(!available)return;
   }catch(e){
    resetCurrent();
    setStatus('⚠️ Não foi possível conferir esta OP no D1: '+esc(String(e?.message||e))+
      '. Nenhuma baixa foi iniciada. Conecte à internet e tente novamente.','warn');
    return;
   }
   await photoPut(currentPhotoId,file,{createdAt:new Date().toISOString(),opId:id});
   let op=findOp(id);
   if(!op){
    setStatus('🔄 OP nova. Buscando cadastro na equipe...','warn');
    await requestTeamOpSync(id);op=findOp(id);
   }
   if(op)showConfirm(op);
   else pendingRecord('QR identificado, mas a OP não foi encontrada.',id);
  }else{
   // Sem QR legível: mantém a recuperação normal por ID manual.
   await photoPut(currentPhotoId,file,{createdAt:new Date().toISOString()});
   pendingRecord('QR da OP não foi identificado.');
  }
 }catch(e){
  pendingRecord('Não foi possível concluir a leitura automática.');
 }finally{working=false}
}
async function identifyManual(){const id=normId($('dfPAManualId')?.value);if(!/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(id))return setStatus('⚠️ Digite o ID completo da OP, como na folha.','warn');if(working)return;working=true;try{
  // O ID manual recebe a mesma conferência imediata do QR da fotografia.
  if(!await checkBeforeOpen(id))return;
  let op=findOp(id);if(!op){setStatus('🔄 Consultando a OP na equipe...','warn');await requestTeamOpSync(id);op=findOp(id)}if(!op){const prior=autos().find(r=>normId(r?.opId||r?.id)===id&&r.status==='ok');if(prior)return setStatus('⚠️ Esta OP já possui baixa em PRONTAS. Confira antes de lançar novamente.','warn');const machine=prompt('OP '+id+' não localizada na equipe. Informe o NOME EXATO da máquina impresso na folha para criar o cadastro de recuperação e abrir a baixa. Cancelar não cria nada.','');if(machine===null)return setStatus('Nenhum cadastro criado. Foto preservada.','warn');const clean=machine.trim();if(!clean)return setStatus('⚠️ Informe a máquina para não registrar a baixa no equipamento errado.','warn');if(!confirm('Confirma a OP '+id+' na máquina '+clean+'? Confira com a folha antes de continuar.'))return;op={id,sector:'Picote',machine:clean,product:'',measure:'',operator:'',shift:'',createdAt:new Date().toISOString(),status:'open',recoveredFromPrintedOp:true,needsCatalogReview:true,productionTeamId:window.DFProducaoEquipeOnline?.team?.()?.teamId||''};const list=ops();if(!list.some(x=>normId(x?.id)===id)){list.unshift(op);if(!write(OPS_KEY,list))return setStatus('❌ Não foi possível salvar a OP recuperada.','bad')}else op=findOp(id)||op;try{window.dispatchEvent(new CustomEvent('df-producao-op-updated',{detail:{opId:id}}))}catch(e){}try{await window.DFProducaoEquipeOnline?.push?.()}catch(e){}}if(currentPhotoId)photoGet(currentPhotoId).then(r=>{if(r?.blob)photoPut(currentPhotoId,r.blob,{opId:op.id,createdAt:r.savedAt||new Date().toISOString()})}).catch(()=>{});showConfirm(op)}catch(e){
  setStatus('⚠️ Não foi possível conferir esta OP no D1: '+esc(String(e?.message||e))+'. Nenhuma nova baixa foi iniciada.','warn');
 }finally{working=false}}
async function checkBeforeOpen(rawId){
 const id=normId(rawId);
 const local=alreadyCompletedLocally(id);
 if(local){
  resetCurrent();
  setStatus('⛔ ESTA OP JÁ FOI DADA BAIXA NO SISTEMA. ID: '+esc(id)+
    (local==='pending'?' • AGUARDANDO CONFIRMAÇÃO DO DONO.':' • JÁ ESTÁ EM PRONTAS.'),'bad');
  alertDuplicateCompletion(id,local);
  return false;
 }
 const checker=window.DFProducaoEquipeOnline?.checkAlreadyCompleted;
 if(typeof checker!=='function')throw Error('Verificação de baixa indisponível.');
 setStatus('🔎 QR '+esc(id)+' identificado. Conferindo baixa no D1...','');
 const official=await checker(id);
 if(official&&['pending','ready'].includes(official.state)){
  resetCurrent();
  setStatus('⛔ ESTA OP JÁ FOI DADA BAIXA NO SISTEMA. ID: '+esc(id)+
    (official.state==='pending'?' • EM PENDENTES.':' • EM PRONTAS.'),'bad');
  alertDuplicateCompletion(id,official.state);
  return false;
 }
 return true;
}
function alreadyCompletedLocally(id){
 const completed=autos().find(x=>normId(x?.opId||x?.id)===id&&['pending','ok'].includes(String(x?.status||'')));
 if(completed)return completed.status==='pending'?'pending':'ready';
 const op=ops().find(x=>normId(x?.id)===id);
 return op?.status==='closed'?'ready':op?.status==='pending'&&Number(op?.autoProduction)>0?'pending':null;
}
function alertDuplicateCompletion(id,state){
 const label=state==='pending'?'EM PENDENTES, AGUARDANDO A CONFIRMAÇÃO DO DONO':'EM PRONTAS, COM BAIXA JÁ REGISTRADA';
 alert('⛔ ESTA OP JÁ FOI DADA BAIXA NO SISTEMA.\\n\\nCódigo: '+id+'\\nSituação: '+label+'\\n\\nNenhuma foto ou produção nova foi registrada.');
}
async function saveCurrent(){
  if(!currentOp||working)return;
  const production=num($('dfPAProduction')?.value),scrap=num($('dfPAScrap')?.value);
  if(!(production>0))return setStatus('⚠️ Informe a <b>PRODUÇÃO TOTAL</b> para salvar.','warn');
  if(scrap<0||scrap>production)return setStatus('⚠️ A <b>APARA TOTAL</b> precisa ficar entre 0 e a produção total.','warn');
  working=true;
  const btn=$('dfPASave'),oldText=btn?.textContent||'SALVAR OP';
  if(btn){btn.disabled=true;btn.textContent='SALVANDO...'}
  try{
    const opId=normId(currentOp.id),photoId=currentPhotoId||('PHOTO-'+Date.now()),pendingId=currentPendingId,photoAt=new Date().toISOString();
    // Bloqueia antes de salvar foto, peso ou mudar a OP. Confere o celular E o servidor.
    const localState=alreadyCompletedLocally(opId);
    if(localState){alertDuplicateCompletion(opId,localState);return}
    const check=window.DFProducaoEquipeOnline?.checkAlreadyCompleted;
    if(typeof check!=='function')throw Error('Verificação de duplicidade indisponível. Atualize o aplicativo para salvar com segurança.');
    const official=await check(opId);
    if(official){alertDuplicateCompletion(opId,official.state);return}


    /* Garante a foto antes de confirmar a baixa. */
    if(currentFile)await photoPut(photoId,currentFile,{opId,createdAt:photoAt});
    else if(photoId){
      const ph=await photoGet(photoId).catch(()=>null);
      if(ph?.blob&&normId(ph.opId)!==opId)await photoPut(photoId,ph.blob,{opId,createdAt:ph.savedAt||photoAt});
    }

    /* O horário oficial da baixa nasce somente depois de a foto estar persistida. */
    const createdAt=new Date().toISOString();
    const isOperator=window.DFProducaoEquipeOnline?.team?.()?.role==='operator';
    const rec={id:opId,opId,photoId,createdAt,completedAt:createdAt,date:today(),productionDay:today(),sector:currentOp.sector||'Picote',machine:currentOp.machine||'',product:currentOp.product||'',measure:currentOp.measure||'',operator:currentOp.operator||'',shift:currentOp.shift||'',production,scrap,net:Math.max(0,production-scrap),status:isOperator?'pending':'ok'};
    if(currentFile)await photoPut(photoId,currentFile,{opId,createdAt});

    let a=autos();
    /* Remove somente a pendência da mesma foto/OP concluída, sem afetar outras fotos pendentes. */
    a=a.filter(r=>r&&r.id!==pendingId&&normId(r.opId||r.id)!==opId&&(!photoId||r.photoId!==photoId));
    a.unshift(rec);
    if(!write(AUTO_KEY,a))throw new Error('Não foi possível gravar PRONTAS.');

    let list=ops(),i=list.findIndex(x=>normId(x?.id)===opId);
    const base={
      ...(i>=0?list[i]:currentOp),id:opId,status:isOperator?'pending':'closed',closedAt:isOperator?'':createdAt,
      autoProduction:isOperator?0:production,autoScrap:isOperator?0:scrap,autoNet:isOperator?0:rec.net,autoUpdatedAt:createdAt
    };
    if(i>=0)list[i]=base;else list.unshift(base);
    if(!write(OPS_KEY,list))throw new Error('Não foi possível fechar a OP.');

    /* Conferência após a baixa: a pendência da foto usada não pode continuar visível. */
    const after=autos();const stale=after.filter(r=>r&&r.status!=='ok'&&r.status!=='pending'&&((photoId&&r.photoId===photoId)||(r.opId&&normId(r.opId)===opId)));if(stale.length){if(!write(AUTO_KEY,after.filter(r=>!stale.includes(r))))throw new Error('Não foi possível finalizar a limpeza da pendência.');}
    const saved=autos().find(r=>r&&r.status===(isOperator?'pending':'ok')&&normId(r.opId||r.id)===opId);
    const savedOp=ops().find(o=>normId(o?.id)===opId);
    if(!saved||!savedOp||!['closed','pending'].includes(savedOp.status))throw new Error('A conferência da baixa falhou.');

    // Confirmar baixa e foto no D1/R2 antes de disparar a sincronização geral.
    let cloudConfirmed=false,cloudError='';
    try{
      const fn=isOperator?window.DFProducaoEquipeOnline?.pushOne:window.DFProducaoEquipeOnline?.pushOneReady;
      if(typeof fn!=='function')throw Error('Sincronizador D1 da Produção indisponível.');
      const result=await fn(opId);
      if(!result)throw Error('Servidor não confirmou a baixa e a foto.');
      cloudConfirmed=true;
    }catch(e){
      cloudError=String(e?.message||e);
      console.warn('Baixa preservada neste aparelho, aguardando nuvem:',opId,cloudError);
    }
    // Atualização/retry único após a tentativa de confirmação oficial, evitando concorrência.
    try{window.dispatchEvent(new CustomEvent('df-producao-auto-saved',{detail:{opId,createdAt,photoId,cloudConfirmed}}))}catch(e){}
    setStatus(cloudConfirmed?(isOperator?
     '✅ <b>OP e foto sincronizadas na nuvem. Aguardando aprovação do dono em PENDENTES.</b>':
     '✅ <b>OP e foto confirmadas no servidor e disponíveis em PRONTAS para a equipe.</b><br>Produção: '+fmt(production)+' kg • Apara: '+fmt(scrap)+' kg'):
     '⚠️ <b>Baixa salva somente neste aparelho, ainda NÃO confirmada no servidor.</b> '+esc(cloudError)+'. Não exclua a OP; use SINCRONIZAR PRODUÇÃO para reenviar a foto.',''+(cloudConfirmed?'ok':'warn'));
    currentOp=null;currentPendingId='';
    $('dfPAConfirm')?.classList.remove('on');$('dfPAManual')?.classList.remove('on');
    renderAll();
    setTimeout(()=>switchPane(isOperator?'pending':'ok'),120)
  }catch(e){
    setStatus('❌ <b>A baixa não foi concluída.</b><br>'+esc(String(e?.message||e)),'bad')
  }finally{
    working=false;
    if(btn){btn.disabled=false;btn.textContent=oldText}
  }
}
async function openPhoto(id){try{const r=await photoGet(id);if(!r?.blob)return alert('Foto não encontrada neste aparelho.');const u=URL.createObjectURL(r.blob);$('dfPAModalBody').innerHTML='<img src="'+u+'"><div class="dfPATiny" style="margin-top:8px">'+esc(r.opId||id)+'</div>';$('dfPAModal').classList.add('on')}catch(e){alert('Não foi possível abrir a foto.')}}
function closeModal(){$('dfPAModal')?.classList.remove('on');$('dfPAModalBody').innerHTML=''}
async function deleteAuto(id){
 const r=autos().find(x=>x.id===id);if(!r)return alert('OP não encontrada.');
 const opId=normId(r.opId||r.id);if(!confirm('Excluir a baixa desta OP da Equipe de Produção? Ela sairá dos totais e poderá receber nova baixa.'))return;
 const api=window.DFProducaoEquipeOnline;if(!api?.deleteCompletion)return alert('Sincronização de Produção indisponível. Atualize o aplicativo.');
 try{await api.deleteCompletion(opId);if(r.photoId)try{await photoDelete(r.photoId)}catch(e){}renderAll();alert('Baixa excluída da Equipe de Produção.');}
 catch(e){alert('Exclusão não concluída: '+String(e.message||e))}
}
function editCompletedMachine(id){
 const records=autos(),record=records.find(x=>String(x.id)===String(id)&&x.status==='ok');
 if(!record)return alert('OP pronta não encontrada.');
 const cad=read('df_producao_cadastros_v1',{}),names=[];
 for(const sector of ['Picote','Sacoleira','Blocadora']){
  const arr=cad?.[sector]?.machines;
  if(Array.isArray(arr))for(const item of arr){
   const name=String(typeof item==='string'?item:(item?.name||item?.nome||'')).trim();
   if(name&&!names.some(x=>x.toLocaleUpperCase('pt-BR')===name.toLocaleUpperCase('pt-BR')))names.push(name);
  }
 }
 if(!names.length)return alert('Nenhuma máquina cadastrada. Cadastre a máquina primeiro.');
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#000b;display:flex;align-items:center;justify-content:center;padding:18px';
 const box=document.createElement('div');box.style.cssText='background:#101a2d;color:white;border:1px solid #40516e;border-radius:16px;padding:20px;width:min(100%,520px);box-sizing:border-box';
 box.innerHTML='<h2 style="margin:0 0 12px">EDITAR MÁQUINA</h2><p style="color:#b9c5da">Produção: '+fmt(record.production)+' kg • Apara: '+fmt(record.scrap)+' kg</p><p>Máquina atual: <b>'+esc(record.machine)+'</b></p><label for="dfChangeMachineSelect">SELECIONAR MÁQUINA</label><select id="dfChangeMachineSelect" style="width:100%;padding:15px;background:#0c1527;color:white;border:1px solid #526482;border-radius:9px;font-size:16px;margin:12px 0"><option value="">Selecione...</option>'+names.sort((a,b)=>a.localeCompare(b,'pt-BR')).map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('')+'</select><div style="display:flex;gap:10px"><button type="button" id="dfChangeMachineCancel" style="flex:1;padding:14px">CANCELAR</button><button type="button" id="dfChangeMachineSave" style="flex:1;padding:14px;background:#f7af22;color:#101010;font-weight:bold">SALVAR</button></div>';
 overlay.appendChild(box);document.body.appendChild(overlay);
 box.querySelector('#dfChangeMachineCancel').onclick=()=>overlay.remove();
 box.querySelector('#dfChangeMachineSave').onclick=()=>{
  const machine=box.querySelector('#dfChangeMachineSelect').value;
  if(!machine)return alert('Selecione uma máquina cadastrada.');
  if(machine===record.machine){overlay.remove();return}
  if(!confirm('Mover '+fmt(record.production)+' kg e '+fmt(record.scrap)+' kg de apara de '+record.machine+' para '+machine+'?'))return;
  const latest=autos(),i=latest.findIndex(x=>String(x.id)===String(id)&&x.status==='ok');
  if(i<0)return alert('Registro não encontrado. Atualize a tela.');
  const oldMachine=latest[i].machine;
  latest[i]={...latest[i],machine};
  if(!write(AUTO_KEY,latest))return alert('Não foi possível salvar. Nada foi alterado.');
  const opId=normId(latest[i].opId||'');
  if(opId){
   const allOps=ops(),j=allOps.findIndex(o=>normId(o?.id)===opId);
   if(j>=0){allOps[j]={...allOps[j],machine};write(OPS_KEY,allOps)}
   const reg=registry();if(reg[opId]?.expected){reg[opId].expected.machine=machine;write(QR_KEY,reg)}
  }
  try{window.dispatchEvent(new CustomEvent('df-producao-auto-saved',{detail:{opId,oldMachine,machine,machineChanged:true}}))}catch(e){}
  try{window.DFProducaoEquipeOnline?.push?.()}catch(e){}
  overlay.remove();renderAll();alert('Máquina alterada. Produção e apara transferidas sem duplicar os totais.');
 };
}
function retryPending(id){const r=autos().find(x=>x.id===id);if(!r)return;currentPendingId=r.id||'';currentPhotoId=r.photoId||'';currentFile=null;currentOp=null;switchPane('read');setStatus('⚠️ Digite o ID da OP para concluir este registro.','warn');showManual(normId(r.opId||''));if(currentPhotoId)photoGet(currentPhotoId).then(p=>{if(p?.blob){const img=$('dfPAPreview');if(img){img.src=URL.createObjectURL(p.blob);img.style.display='block'}}}).catch(()=>{})}

function bind(){if(bound)return;bound=true;const panel=$('dfProdAuto');if(!panel)return;panel.addEventListener('click',e=>{if(e.target.closest('[data-pa-show-pending]')){switchPane('pending');return}if(e.target.closest('#dfPAExclusiveBack')){switchPane('read');return}const pane=e.target.closest('[data-pa-pane]');if(pane){switchPane(pane.dataset.paPane);return}const view=e.target.closest('[data-pa-view]');if(view){openPhoto(view.dataset.paView);return}const change=e.target.closest('[data-pa-machine]');if(change){editCompletedMachine(change.dataset.paMachine);return}const del=e.target.closest('[data-pa-del]');if(del){deleteAuto(del.dataset.paDel);return}const approve=e.target.closest('[data-pa-approve]');if(approve){const api=window.DFProducaoEquipeOnline;if(!api?.approveCompletion)return alert('Sincronização indisponível.');api.approveCompletion(approve.dataset.paApprove).then(()=>{renderAll();switchPane('ok')}).catch(err=>alert('Aprovação não concluída: '+String(err.message||err)));return}const retry=e.target.closest('[data-pa-retry]');if(retry){retryPending(retry.dataset.paRetry);return}if(e.target.closest('#dfPATake')){$('dfPATakeInput')?.click();return}if(e.target.closest('#dfPAUpload')){$('dfPAUploadInput')?.click();return}if(e.target.closest('#dfPAArchiveRefresh')){loadArchive(true);return}if(e.target.closest('#dfPAReadyFind')){renderOk(true);return}if(e.target.closest('#dfPAManualFind')){identifyManual();return}if(e.target.closest('#dfPARecoverMissing')){recoverMissingOp();return}if(e.target.closest('#dfPASave')){saveCurrent();return}if(e.target.closest('#dfPACloseModal')){closeModal();return}});panel.addEventListener('change',e=>{if(e.target.id==='dfPAReadyAllMonths'){renderOk(true);return}if(e.target.id==='dfPATakeInput'||e.target.id==='dfPAUploadInput'){const f=e.target.files?.[0];e.target.value='';handleFile(f);return}if(['dfPAMonth','dfPAReadyMonth','dfPAArchiveMonth'].includes(e.target.id))selectMonth(e.target.value)});panel.addEventListener('input',e=>{if(e.target.id==='dfPAMonth'){persistSelectedMonth(e.target.value);return}if(e.target.id==='dfPAManualId')offerRecovery(e.target.value);if(e.target.id==='dfPAArchiveSearch')renderArchive();if(e.target.id==='dfPAReadySearch'){clearTimeout(window.__dfPAReadyTimer);window.__dfPAReadyTimer=setTimeout(()=>renderOk(true),180)}});panel.addEventListener('keydown',e=>{if(e.target.id==='dfPAManualId'&&e.key==='Enter'){e.preventDefault();identifyManual()}});synchronizeMonthInputs()}

window.addEventListener('df-production-month-changed',()=>{synchronizeMonthInputs();renderAll()});
window.addEventListener('df-producao-team-changed',()=>{lastReadyFilterKey='';lastReadySignature='';const results=$('dfPAReadyResults');if(results)results.innerHTML='<div class="dfPAReadyHint">Digite o nome do produto ou o ID da OP.</div>';archivedLastPull=0;archivedRows=[];archivedTeam='';setTimeout(()=>{renderAll();loadArchive(true)},0)});
window.addEventListener('df-producao-auto-saved',()=>{if(archiveOpen())setTimeout(()=>loadArchive(true),800)});
window.addEventListener('df-producao-auto-deleted',()=>{if(archiveOpen())setTimeout(()=>loadArchive(true),800)});
window.addEventListener('df-producao-team-cleared',()=>{lastReadyFilterKey='';lastReadySignature='';const results=$('dfPAReadyResults');if(results)results.innerHTML='<div class="dfPAReadyHint">Entre na Equipe de Produção para visualizar os dados.</div>';setTimeout(renderAll,0)});
window.addEventListener('df-producao-team-synced',()=>{setTimeout(renderAll,0);if(archiveOpen())setTimeout(()=>loadArchive(false),200)});
function start(){mount()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('pageshow',()=>{repairRecords();recoverOrphanPhotos();if(window.__DF_PROD_AUTO_ACTIVE)show();if(archiveOpen())loadArchive(true)},true);
})();