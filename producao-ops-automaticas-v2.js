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

function addStyle(){if($('dfProdAutoCssV2'))return;const s=document.createElement('style');s.id='dfProdAutoCssV2';s.textContent=`#dfProdAuto{display:none}#dfProdAuto.on{display:block}.dfPAHero,.dfPACard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:12px}.dfPAHero{border-color:#f5a000;background:linear-gradient(180deg,#211400,#14100a)}.dfPAHero h2{margin:0 0 6px;color:#ffd36a;font-size:22px}.dfPAHero p{margin:0;color:#cbd5e1;line-height:1.45;font-size:13px}.dfPAHealth{margin-top:12px;border:1px solid #166534;background:#0d2516;color:#86efac;border-radius:12px;padding:10px;font-size:12px;font-weight:850}.dfPATabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:12px}.dfPATabs button{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:11px 3px;font:950 10px/1.15 system-ui}.dfPATabs button.on{border-color:#f5a000;background:#211400;color:#ffd36a}.dfPAPane{display:none}.dfPAPane.on{display:block}.dfPACard h3{margin:0 0 11px;font-size:18px}.dfPAChoice{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfPABtn{width:100%;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:13px;padding:13px 9px;margin-top:9px;font:950 13px/1.15 system-ui}.dfPABtn.alt{border-color:#f5a000;background:#241600;color:#ffd36a}.dfPABtn.gray{border-color:#475569;background:#0f172a;color:#e2e8f0}.dfPABtn.danger{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}.dfPAStatus{border:1px solid #334155;background:#0f172a;border-radius:13px;padding:12px;margin-top:10px;font-size:12px;font-weight:800;line-height:1.45}.dfPAStatus.ok{border-color:#166534;color:#86efac}.dfPAStatus.warn{border-color:#a16207;color:#fde68a}.dfPAStatus.bad{border-color:#7f1d1d;color:#fca5a5}.dfPATiny{color:#94a3b8;font-size:11px;line-height:1.45}.dfPAConfirm{display:none;margin-top:12px;border:1px solid #f5a000;background:#15110a;border-radius:14px;padding:13px}.dfPAConfirm.on{display:block}.dfPAOpTitle{font-weight:950;color:#ffd36a;font-size:15px}.dfPAGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfPAGrid label{display:block;color:#cbd5e1;font-size:11px;margin:8px 0 4px}.dfPAGrid input,#dfPAMonth,#dfPAManualId{width:100%;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:11px;padding:11px;font-size:16px}.dfPAManual{display:none;margin-top:10px;border:1px solid #f5a000;background:#18120a;border-radius:13px;padding:12px}.dfPAManual.on{display:block}.dfPAManual b{display:block;color:#ffd36a;margin-bottom:5px}.dfPAList{border:1px solid #263244;background:#0f172a;border-radius:14px;padding:12px;margin-top:8px}.dfPAList strong{color:#e8edf5}.dfPABadge{display:inline-block;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;margin-left:5px}.dfPABadge.ok{background:#0c321c;color:#86efac}.dfPABadge.warn{background:#3a2605;color:#fde68a}.dfPAKpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.dfPAKpi{border:1px solid #263244;background:#0f172a;border-radius:13px;padding:11px}.dfPAKpi span{display:block;color:#94a3b8;font-size:10px}.dfPAKpi b{display:block;font-size:18px;margin-top:4px}.dfPAPreview{display:none;width:100%;max-height:380px;object-fit:contain;border:1px solid #334155;border-radius:14px;background:#080b13;margin-top:10px}.dfPAModal{position:fixed;inset:0;z-index:999999;background:#020617ee;display:none;padding:18px;overflow:auto}.dfPAModal.on{display:block}.dfPAModalBox{max-width:720px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:14px}.dfPAModal img{width:100%;max-height:70vh;object-fit:contain;border-radius:12px;background:#000}@media(max-width:640px){.dfPATabs{grid-template-columns:repeat(3,1fr)}.dfPAChoice,.dfPAGrid{grid-template-columns:1fr 1fr}.dfPAKpis{grid-template-columns:repeat(2,minmax(0,1fr))}}`;document.head.appendChild(s)}

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

function build(){return `<div class="dfPAHero"><h2>📸 OP + QR</h2><p>Fotografe a OP, confirme <b>PRODUÇÃO TOTAL</b> e <b>APARA TOTAL</b> e salve. O resultado fica vinculado à própria OP pelo QR ou pelo ID.</p></div><div class="dfPATabs"><button class="on" data-pa-pane="read">📸 LER OP</button><button data-pa-pane="ok">✅ PRONTAS</button><button data-pa-pane="pending">⚠️ PENDENTES</button><button data-pa-pane="now">🏭 AGORA</button><button data-pa-pane="month">📊 MÊS</button><button data-pa-pane="archive">📦 FOTOS</button></div><div id="dfPAPaneRead" class="dfPAPane on"><div class="dfPACard"><h3>Fotografar OP preenchida</h3><div class="dfPAChoice"><button id="dfPATake" class="dfPABtn alt">📷 TIRAR FOTO DE LADO</button><button id="dfPAUpload" class="dfPABtn gray">🖼️ ENVIAR FOTO</button></div><input id="dfPATakeInput" type="file" accept="image/*" capture="environment" hidden><input id="dfPAUploadInput" type="file" accept="image/*" hidden><img id="dfPAPreview" class="dfPAPreview"><div id="dfPAStatus" class="dfPAStatus">Escolha ou tire uma foto. Assim que selecionar, a leitura do QR começa sozinha.</div><div id="dfPAManual" class="dfPAManual"><b>NÃO IDENTIFICOU O QR?</b><div class="dfPATiny">Digite o ID da OP exatamente como aparece na folha.</div><input id="dfPAManualId" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DFOP-..."><button id="dfPAManualFind" class="dfPABtn alt" type="button">IDENTIFICAR OP PELO ID</button><button id="dfPARecoverMissing" class="dfPABtn alt" type="button" style="display:none;margin-top:10px;border-color:#d99a24">RECUPERAR ESTA OP PARA BAIXA</button></div><div id="dfPAConfirm" class="dfPAConfirm"><div id="dfPAOpInfo"></div><div class="dfPAGrid"><div><label>PRODUÇÃO TOTAL (kg)</label><input id="dfPAProduction" inputmode="decimal" placeholder="0,00"></div><div><label>APARA TOTAL (kg)</label><input id="dfPAScrap" inputmode="decimal" placeholder="0,00"></div></div><button id="dfPASave" class="dfPABtn">SALVAR OP</button></div><div class="dfPATiny" style="margin-top:10px">✅ Fluxo: foto → QR ou ID → produção + apara → SALVAR OP → PRONTAS.</div></div></div><div id="dfPAPaneOk" class="dfPAPane"><div class="dfPACard"><h3>OPs prontas</h3><div id="dfPAOkList"></div></div></div><div id="dfPAPanePending" class="dfPAPane"><div class="dfPACard"><h3>Pendentes</h3><div class="dfPATiny">Somente fotos que ainda não foram vinculadas e salvas.</div><div id="dfPAPendingList"></div></div></div><div id="dfPAPaneNow" class="dfPAPane"><div class="dfPACard"><h3>Produção agora</h3><div id="dfPANowList"></div></div></div><div id="dfPAPaneMonth" class="dfPAPane"><div class="dfPACard"><h3>Fechamento do mês</h3><label>Mês</label><input id="dfPAMonth" type="month"><div id="dfPAMonthReport"></div></div></div><div id="dfPAPaneArchive" class="dfPAPane"><div class="dfPACard"><h3>Fotos arquivadas</h3><div id="dfPAArchiveList"></div></div></div><div id="dfPAModal" class="dfPAModal"><div class="dfPAModalBox"><button id="dfPACloseModal" class="dfPABtn gray" style="margin-top:0">FECHAR</button><div id="dfPAModalBody"></div></div></div>`}

function mount(){addStyle();let panel=$('dfProdAuto');if(!panel){panel=document.createElement('section');panel.id='dfProdAuto';panel.innerHTML=build();(document.querySelector('main.wrap')||document.body).appendChild(panel)}if(!bound)bind();repairRecords();renderAll();setTimeout(()=>recoverOrphanPhotos(),80);return panel}
function setNav(auto){window.__DF_PROD_AUTO_ACTIVE=!!auto;[['prodNewTab',!auto],['prodAutoTab',!!auto]].forEach(([id,on])=>{const b=$(id);if(!b)return;b.className=on?'active':'secondary';if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function show(){const panel=mount(),pg=$('pgPr');if(pg)pg.style.setProperty('display','none','important');panel.classList.add('on');setNav(true);renderAll();window.scrollTo({top:0,behavior:'smooth'})}
function hide(){window.__DF_PROD_AUTO_ACTIVE=false;const panel=$('dfProdAuto');if(panel)panel.classList.remove('on');const pg=$('pgPr');if(pg){pg.style.display='block';pg.classList.add('on')}}
window.DFShowProductionAuto=show;window.DFHideProductionAuto=hide;

const paneId=name=>'dfPAPane'+({read:'Read',ok:'Ok',pending:'Pending',now:'Now',month:'Month',archive:'Archive'}[name]||'Read');
function switchPane(name){document.querySelectorAll('#dfProdAuto [data-pa-pane]').forEach(b=>b.classList.toggle('on',b.dataset.paPane===name));document.querySelectorAll('#dfProdAuto .dfPAPane').forEach(p=>p.classList.remove('on'));$(paneId(name))?.classList.add('on');if(name==='ok')renderOk();if(name==='pending')renderPending();if(name==='now')renderNow();if(name==='month')renderMonth();if(name==='archive')renderArchive()}
function card(r,pending){return '<div class="dfPAList"><strong>'+esc(r.machine||r.opId||r.id)+'</strong><span class="dfPABadge '+(pending?'warn':'ok')+'">'+(pending?'PENDENTE':'OK')+'</span><div class="dfPATiny">'+esc(r.product||r.reason||'')+(r.measure?' • '+esc(r.measure):'')+(pending?'':'<br>Produção '+fmt(r.production)+' kg • Apara '+fmt(r.scrap)+' kg • Líquida '+fmt(r.net)+' kg')+'</div>'+(r.photoId?'<button class="dfPABtn gray" data-pa-view="'+esc(r.photoId)+'">ABRIR FOTO</button>':'')+(pending?(r.status==='pending'?(window.DFProducaoEquipeOnline?.team?.()?.role==='owner'?'<button class="dfPABtn" data-pa-approve="'+esc(r.id)+'">CONFIRMAR OP</button>':'<div class="dfPATiny">AGUARDANDO CONFIRMAÇÃO DO DONO</div>'):'<button class="dfPABtn alt" data-pa-retry="'+esc(r.id)+'">IDENTIFICAR PELO ID</button>'):'')+(pending?'':'<button class="dfPABtn alt" data-pa-machine="'+esc(r.id)+'">EDITAR MÁQUINA</button>')+'<button class="dfPABtn danger" data-pa-del="'+esc(r.id)+'">EXCLUIR REGISTRO</button></div>'}
function renderAll(){if(!window.DFProducaoEquipeOnline?.team?.()){for(const id of ['dfPAOkList','dfPAPendingList','dfPANowList','dfPAMonthList','dfPAArchiveList']){const el=$(id);if(el)el.innerHTML='<div class="dfPATiny">Entre na Equipe de Produção para visualizar os dados.</div>'}return}repairRecords();renderOk();renderPending();renderNow();renderMonth();renderArchive()}
function renderOk(){const b=$('dfPAOkList');if(!b)return;const a=autos().filter(x=>x.status==='ok').sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));b.innerHTML=a.length?a.map(x=>card(x,false)).join(''):'<div class="dfPATiny">Nenhuma OP pronta ainda.</div>'}
function renderPending(){const b=$('dfPAPendingList');if(!b)return;const a=autos().filter(x=>x.status!=='ok').sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));b.innerHTML=a.length?a.map(x=>card(x,true)).join(''):'<div class="dfPATiny">Nenhuma pendência.</div>'}
function renderNow(){const b=$('dfPANowList');if(!b)return;const all=autos(),a=ops().filter(x=>x.status==='open').sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));b.innerHTML=a.length?a.map(o=>{const r=all.find(x=>x.status==='ok'&&normId(x.opId)===normId(o.id));return '<div class="dfPAList"><strong>'+esc(o.machine)+' — '+esc(o.measure)+'</strong><div class="dfPATiny">'+esc(o.product)+'<br>'+esc(o.operator)+' • Turno '+esc(normShift(o.shift))+'<br>'+esc(o.id)+'</div>'+(r?'<div class="dfPAKpis"><div class="dfPAKpi"><span>PRODUÇÃO</span><b>'+fmt(r.production)+' kg</b></div><div class="dfPAKpi"><span>APARA</span><b>'+fmt(r.scrap)+' kg</b></div><div class="dfPAKpi"><span>LÍQUIDA</span><b>'+fmt(r.net)+' kg</b></div></div>':'<div class="dfPAStatus warn">Aguardando leitura automática da OP.</div>')+'</div>'}).join(''):'<div class="dfPATiny">Nenhuma OP aberta agora.</div>'}
function renderMonth(){const b=$('dfPAMonthReport');if(!b)return;const m=$('dfPAMonth')?.value||monthNow(),a=autos().filter(x=>x.status==='ok'&&String(x.date||x.createdAt||'').slice(0,7)===m),p=a.reduce((s,x)=>s+num(x.production),0),s=a.reduce((v,x)=>v+num(x.scrap),0),n=Math.max(0,p-s),scrapPercent=p>0?s/p*100:0;b.innerHTML='<div class="dfPAKpis"><div class="dfPAKpi"><span>PRODUÇÃO</span><b>'+fmt(p)+' kg</b></div><div class="dfPAKpi"><span>APARA</span><b>'+fmt(s)+' kg</b></div><div class="dfPAKpi"><span>LÍQUIDA</span><b>'+fmt(n)+' kg</b></div><div class="dfPAKpi"><span>APARA (%)</span><b>'+scrapPercent.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%</b></div></div>'+(a.length?a.map(x=>'<div class="dfPAList"><strong>'+esc(x.machine||x.opId)+'</strong><div class="dfPATiny">'+esc(x.product||'')+' • '+fmt(x.production)+' kg</div></div>').join(''):'<div class="dfPATiny">Nenhuma OP processada neste mês.</div>')}
function renderArchive(){const b=$('dfPAArchiveList');if(!b)return;const a=autos().filter(x=>x.photoId).sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')));b.innerHTML=a.length?a.map(x=>'<div class="dfPAList"><strong>'+esc(x.opId||x.id)+'</strong><div class="dfPATiny">'+esc(String(x.createdAt||'').replace('T',' ').slice(0,16))+'</div><button class="dfPABtn gray" data-pa-view="'+esc(x.photoId)+'">ABRIR FOTO</button></div>').join(''):'<div class="dfPATiny">Nenhuma foto arquivada ainda.</div>'}

function setStatus(text,type=''){const st=$('dfPAStatus');if(st){st.className='dfPAStatus'+(type?' '+type:'');st.innerHTML=text}}
function resetCurrent(){currentOp=null;currentPendingId='';currentFile=null;currentPhotoId='';const img=$('dfPAPreview');if(img){img.removeAttribute('src');img.style.display='none'}$('dfPAConfirm')?.classList.remove('on');$('dfPAManual')?.classList.remove('on');if($('dfPAManualId'))$('dfPAManualId').value='';if($('dfPAProduction'))$('dfPAProduction').value='';if($('dfPAScrap'))$('dfPAScrap').value=''}
function showManual(prefill=''){offerRecovery(prefill);const box=$('dfPAManual');if(box)box.classList.add('on');const i=$('dfPAManualId');if(i){i.value=prefill||'';setTimeout(()=>i.focus(),20)}}
function offerRecovery(id){const btn=$('dfPARecoverMissing');if(btn)btn.style.display=/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(normId(id))?'block':'none'}
function recoverMissingOp(){const id=normId($('dfPAManualId')?.value);if(!/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(id))return setStatus('⚠️ Confira o código completo da OP antes de recuperar.','warn');const existing=findOp(id);if(existing){showConfirm(existing);return}if(!confirm('A OP '+id+' não foi encontrada na equipe. Criar um cadastro de RECUPERAÇÃO com esse mesmo ID, sem inventar máquina, produto ou operador? A baixa só será registrada quando você informar os quilos e clicar em SALVAR OP.'))return;const list=ops();if(list.some(o=>normId(o?.id)===id)){showConfirm(findOp(id));return}const recovered={id,sector:'Picote',machine:'',product:'',measure:'',operator:'',shift:'',createdAt:new Date().toISOString(),status:'open',recoveredFromPrintedOp:true,needsCatalogReview:true,productionTeamId:window.DFProducaoEquipeOnline?.team?.()?.teamId||''};list.unshift(recovered);if(!write(OPS_KEY,list))return setStatus('❌ Não foi possível salvar o cadastro de recuperação.','bad');try{window.dispatchEvent(new CustomEvent('df-producao-op-updated',{detail:{opId:id}}))}catch(e){}let cloudConfirmed=!isOperator,cloudError='';
    if(isOperator){try{const result=await window.DFProducaoEquipeOnline?.pushOne?.(opId);if(!result)throw Error('Sincronizador D1 indisponível.');cloudConfirmed=true}catch(e){cloudError=String(e?.message||e);console.warn('Baixa salva localmente, ainda não enviada ao D1:',cloudError)}}
    else {try{const result=await window.DFProducaoEquipeOnline?.pushReady?.(opId);if(!result)throw Error('Sincronizador D1 indisponível.');cloudConfirmed=true}catch(e){cloudConfirmed=false;cloudError=String(e?.message||e);console.warn('OP pronta salva localmente, mas D1 ainda não confirmou:',cloudError)}}showConfirm(recovered);setStatus('✅ Cadastro de recuperação criado com o ID da folha. Confira a OP e informe produção e apara para dar baixa.','ok')}
function showConfirm(op){currentOp=op;const info=$('dfPAOpInfo');if(info)info.innerHTML='<div class="dfPAOpTitle">'+esc(op.machine||'')+' — '+esc(op.measure||'')+'</div><div class="dfPATiny">'+esc(op.product||'')+'<br>'+esc(op.operator||'')+' • Turno '+esc(normShift(op.shift))+'<br>'+esc(op.id)+'</div>';$('dfPAManual')?.classList.remove('on');$('dfPAConfirm')?.classList.add('on');setStatus('✅ OP identificada. Informe <b>PRODUÇÃO TOTAL</b> e <b>APARA TOTAL</b> para salvar.','ok');setTimeout(()=>$('dfPAProduction')?.focus(),20)}
function pendingRecord(reason,prefill=''){/* Falha de leitura não é pendência de produção: manter a foto temporária sem criar PEND. */currentPendingId='';showManual(prefill);setStatus('⚠️ QR não identificado automaticamente. A foto está nesta tela, mas <b>nenhuma pendência foi criada</b>. Digite o ID ou tire outra foto.','warn')}
async function handleFile(file){if(!file||working)return;working=true;resetCurrent();currentFile=file;currentPhotoId='PHOTO-'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();const img=$('dfPAPreview');if(img){img.src=URL.createObjectURL(file);img.style.display='block'}setStatus('🔎 Procurando o QR da OP...','');try{await photoPut(currentPhotoId,file,{createdAt:new Date().toISOString()});const raw=await decodeQREveryWay(file),id=extractId(raw);if(id){let op=findOp(id);if(!op){setStatus('🔄 QR lido. Buscando OP na equipe...','warn');await requestTeamOpSync(id);op=findOp(id)}if(op){await photoPut(currentPhotoId,file,{opId:op.id,createdAt:new Date().toISOString()});showConfirm(op)}else pendingRecord('QR identificado, mas a OP não foi encontrada.',id)}else pendingRecord('QR da OP não foi identificado.')}catch(e){pendingRecord('Não foi possível concluir a leitura automática.')}finally{working=false}}
async function identifyManual(){const id=normId($('dfPAManualId')?.value);if(!/^DFOP-\d{8}-\d{6}-[A-Z0-9]{4,8}$/.test(id))return setStatus('⚠️ Digite o ID completo da OP, como na folha.','warn');if(working)return;working=true;try{let op=findOp(id);if(!op){setStatus('🔄 Consultando a OP na equipe...','warn');await requestTeamOpSync(id);op=findOp(id)}if(!op){const prior=autos().find(r=>normId(r?.opId||r?.id)===id&&r.status==='ok');if(prior)return setStatus('⚠️ Esta OP já possui baixa em PRONTAS. Confira antes de lançar novamente.','warn');const machine=prompt('OP '+id+' não localizada na equipe. Informe o NOME EXATO da máquina impresso na folha para criar o cadastro de recuperação e abrir a baixa. Cancelar não cria nada.','');if(machine===null)return setStatus('Nenhum cadastro criado. Foto preservada.','warn');const clean=machine.trim();if(!clean)return setStatus('⚠️ Informe a máquina para não registrar a baixa no equipamento errado.','warn');if(!confirm('Confirma a OP '+id+' na máquina '+clean+'? Confira com a folha antes de continuar.'))return;op={id,sector:'Picote',machine:clean,product:'',measure:'',operator:'',shift:'',createdAt:new Date().toISOString(),status:'open',recoveredFromPrintedOp:true,needsCatalogReview:true,productionTeamId:window.DFProducaoEquipeOnline?.team?.()?.teamId||''};const list=ops();if(!list.some(x=>normId(x?.id)===id)){list.unshift(op);if(!write(OPS_KEY,list))return setStatus('❌ Não foi possível salvar a OP recuperada.','bad')}else op=findOp(id)||op;try{window.dispatchEvent(new CustomEvent('df-producao-op-updated',{detail:{opId:id}}))}catch(e){}try{await window.DFProducaoEquipeOnline?.push?.()}catch(e){}}if(currentPhotoId)photoGet(currentPhotoId).then(r=>{if(r?.blob)photoPut(currentPhotoId,r.blob,{opId:op.id,createdAt:r.savedAt||new Date().toISOString()})}).catch(()=>{});showConfirm(op)}finally{working=false}}
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

    try{window.dispatchEvent(new CustomEvent('df-producao-auto-saved',{detail:{opId,createdAt,photoId}}))}catch(e){}
    try{window.DFProducaoEquipeOnline?.push?.()}catch(e){}

    setStatus(isOperator?(cloudConfirmed?'✅ <b>OP e foto recebidas pelo servidor D1. Aguardando aprovação do dono.</b>':'⚠️ <b>OP salva neste celular, MAS NÃO ENVIADA AO SERVIDOR.</b> Erro: '+esc(cloudError)+'. Use SINCRONIZAR PRODUÇÃO para tentar novamente.'):(cloudConfirmed?'✅ <b>OP pronta e contabilizada no servidor D1.</b><br>':'⚠️ <b>OP PRONTA SALVA NESTE CELULAR, MAS AINDA NÃO CONFIRMADA NO D1.</b> '+esc(cloudError)+'<br>')+'Produção: '+fmt(production)+' kg • Apara: '+fmt(scrap)+' kg • Líquida: '+fmt(rec.net)+' kg',cloudConfirmed?'ok':'warn');
    currentOp=null;currentPendingId='';
    $('dfPAConfirm')?.classList.remove('on');$('dfPAManual')?.classList.remove('on');
    renderAll();
    try{window.dispatchEvent(new CustomEvent('df-producao-team-synced',{detail:{opId,reason:'completion'}}))}catch(e){}
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

function bind(){if(bound)return;bound=true;const panel=$('dfProdAuto');if(!panel)return;panel.addEventListener('click',e=>{const pane=e.target.closest('[data-pa-pane]');if(pane){switchPane(pane.dataset.paPane);return}const view=e.target.closest('[data-pa-view]');if(view){openPhoto(view.dataset.paView);return}const change=e.target.closest('[data-pa-machine]');if(change){editCompletedMachine(change.dataset.paMachine);return}const del=e.target.closest('[data-pa-del]');if(del){deleteAuto(del.dataset.paDel);return}const approve=e.target.closest('[data-pa-approve]');if(approve){const api=window.DFProducaoEquipeOnline;if(!api?.approveCompletion)return alert('Sincronização indisponível.');api.approveCompletion(approve.dataset.paApprove).then(()=>{renderAll();switchPane('ok')}).catch(err=>alert('Aprovação não concluída: '+String(err.message||err)));return}const retry=e.target.closest('[data-pa-retry]');if(retry){retryPending(retry.dataset.paRetry);return}if(e.target.closest('#dfPATake')){$('dfPATakeInput')?.click();return}if(e.target.closest('#dfPAUpload')){$('dfPAUploadInput')?.click();return}if(e.target.closest('#dfPAManualFind')){identifyManual();return}if(e.target.closest('#dfPARecoverMissing')){recoverMissingOp();return}if(e.target.closest('#dfPASave')){saveCurrent();return}if(e.target.closest('#dfPACloseModal')){closeModal();return}});panel.addEventListener('change',e=>{if(e.target.id==='dfPATakeInput'||e.target.id==='dfPAUploadInput'){const f=e.target.files?.[0];e.target.value='';handleFile(f);return}if(e.target.id==='dfPAMonth')renderMonth()});panel.addEventListener('input',e=>{if(e.target.id==='dfPAManualId')offerRecovery(e.target.value)});panel.addEventListener('keydown',e=>{if(e.target.id==='dfPAManualId'&&e.key==='Enter'){e.preventDefault();identifyManual()}});if($('dfPAMonth'))$('dfPAMonth').value=monthNow()}

window.addEventListener('df-producao-team-changed',()=>setTimeout(renderAll,0));
window.addEventListener('df-producao-team-cleared',()=>setTimeout(renderAll,0));
window.addEventListener('df-producao-team-synced',()=>setTimeout(renderAll,0));
function start(){mount()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('pageshow',()=>{repairRecords();recoverOrphanPhotos();if(window.__DF_PROD_AUTO_ACTIVE)show()},true);
})();