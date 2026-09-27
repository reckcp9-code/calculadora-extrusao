(function(){
'use strict';
if(window.DFOpMaterialPhotoRecoveryV1)return;window.DFOpMaterialPhotoRecoveryV1=true;

const OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1',DB='df_ops_fotos_v2';
const API='https://df-extrusor-api.reck-cp9.workers.dev',TOKEN='df_secure_token_v2',ACCESS='df_auto_access_credential_v1',DEVICE='df_licenseauth_device_v1',TEAM='df_op_team_v1';
let running=false,timer=0;
const $=id=>document.getElementById(id);
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
function norm(v){return String(v??'').trim().toUpperCase().replace(/\s+/g,'')}
function fold(v){let s=String(v??'').trim();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}catch(e){}return s.toUpperCase().replace(/\s+/g,' ')}
function ids(o){return [o&&o.id,o&&o.qr,o&&o.numero,o&&o.op,o&&o.codigo,o&&o.opId].map(norm).filter(Boolean)}
function monthOf(o){const d=String(o?.data||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(d))return d;const m=String(o?.id||o?.qr||'').match(/DFOP-(\d{4})(\d{2})\d{2}-/i);return m?m[1]+'-'+m[2]:''}
function selectedMonth(){return String($('dfOpMonth')?.value||new Date().toISOString().slice(0,7)).slice(0,7)}
function cleanMaterials(list){if(!Array.isArray(list))return[];return list.map(m=>({name:String(m?.name||m?.material||m?.nome||'').trim(),pct:num(m?.pct??m?.percent??m?.porcentagem??m?.percentage)})).filter(m=>m.name&&m.pct>0&&m.pct<=100)}
function regMaterials(op){const r=load(REG,{}),opids=ids(op);for(const [k,x] of Object.entries(r||{})){if(opids.includes(norm(x?.id||k)))return cleanMaterials(x?.expected?.materials)}return[]}
function hasFormula(op){return cleanMaterials(op?.materials).length>0||regMaterials(op).length>0}
function missingOps(){return (load(OPS,[])||[]).filter(o=>o&&o.status==='ok'&&monthOf(o)===selectedMonth()&&!hasFormula(o)&&(+o.produzido||0)>0)}
function cleanName(s){
  s=String(s||'').replace(/[|]/g,' ').replace(/\s+/g,' ').trim();
  s=s.replace(/^[-–—:;,.\s]+|[-–—:;,.\s]+$/g,'').trim();
  s=s.replace(/\b(?:MATERIAL|DESCRI[CÇ][AÃ]O\s+DA\s+MAT[EÉ]RIA\s+PRIMA|KG\s+DA\s+MISTURA|PERCENTUAL|PORCENTAGEM)\b/ig,' ').replace(/\s+/g,' ').trim();
  if(s.length>60)s=s.slice(0,60).trim();
  const f=fold(s);
  if(!s||s.length<2||/^\d/.test(s)||/^(?:DATA|OPERADOR|MAQUINA|MÁQUINA|QUANTIDADE|PESO|TOTAL|FASE|EXTRUSAO|EXTRUSÃO|ORDEM|PRODUCAO|PRODUÇÃO|LARGURA|MICRA|GRAMATURA|CLIENTE|FORMULACAO|FORMULAÇÃO|PREVISAO|PREVISÃO|PEDIDO|UF|QTD|BOBINAS?)\b/.test(f))return'';
  if(!/[A-ZÀ-Ú]/i.test(s))return'';
  return s;
}
function pctTokens(line){const out=[];const re=/(\d{1,3}(?:[.,]\d{1,2})?)\s*%/g;let m;while((m=re.exec(String(line||'')))){const p=num(m[1]);if(p>0&&p<=100)out.push(p)}return out}
function bestPctRun(vals){if(!vals.length)return[];let best=[];for(let i=0;i<vals.length;i++){let sum=0;for(let j=i;j<Math.min(vals.length,i+15);j++){sum+=vals[j];const len=j-i+1;if(len>=1&&sum>=95&&sum<=105){const cand=vals.slice(i,j+1);if(!best.length||Math.abs(sum-100)<Math.abs(best.reduce((a,b)=>a+b,0)-100))best=cand}if(sum>115)break}}return best.length?best:vals.filter(x=>x>0&&x<=100).slice(0,12)}
function parseFormula(text){
  const raw=String(text||'').replace(/\r/g,'');if(!raw)return[];
  const lines=raw.split(/\n+/).map(x=>String(x||'').replace(/[|]/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
  const direct=[];
  for(const line of lines){
    let m=line.match(/^(.{2,60}?)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s*$/);if(m){const name=cleanName(m[1]),pct=num(m[2]);if(name&&pct>0&&pct<=100)direct.push({name,pct});continue}
    m=line.match(/^(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s+(.{2,60})$/);if(m){const name=cleanName(m[2]),pct=num(m[1]);if(name&&pct>0&&pct<=100)direct.push({name,pct})}
  }
  const dsum=direct.reduce((s,m)=>s+m.pct,0);if(direct.length>=2&&dsum>=90&&dsum<=110)return direct;

  let start=lines.findIndex(l=>/^MATERIAL\b/i.test(fold(l))||/\bMATERIAL\b/.test(fold(l)));
  let scope=start>=0?lines.slice(start,Math.min(lines.length,start+45)):lines;
  const allPct=[];scope.forEach(l=>allPct.push(...pctTokens(l)));const pcts=bestPctRun(allPct);
  if(!pcts.length)return[];

  const names=[];
  for(const line of scope){
    if(pctTokens(line).length)continue;
    let c=cleanName(line);if(!c)continue;
    const f=fold(c);
    if(/^(?:A|B|C|D|E|F|G|H|I|J)$/.test(f))continue;
    if(/(?:KG|CM|MM|MICRA|LITROS?|FASE|TOTAL|ORDEM|QR|DFOP)/.test(f)&&/\d/.test(c))continue;
    if(!names.some(x=>fold(x)===f))names.push(c);
  }
  if(names.length>=pcts.length){
    const likely=names.slice(0,pcts.length);const out=likely.map((name,i)=>({name,pct:pcts[i]}));const sum=out.reduce((s,m)=>s+m.pct,0);if(sum>=90&&sum<=110)return out;
    for(let i=0;i<=names.length-pcts.length;i++){const out2=names.slice(i,i+pcts.length).map((name,j)=>({name,pct:pcts[j]}));const sum2=out2.reduce((s,m)=>s+m.pct,0);if(sum2>=95&&sum2<=105)return out2}
  }
  return[];
}
function saveFormula(opId,mats,ocrText,source){
  const a=load(OPS,[]),n=norm(opId);if(!Array.isArray(a))return false;const i=a.findIndex(o=>ids(o).includes(n));if(i<0)return false;
  const prod=+a[i].produzido||0;a[i].materials=mats.map(m=>({name:m.name,pct:m.pct,kg:prod*m.pct/100}));a[i].materialFormulaRecovered=true;a[i].materialFormulaSource=source||'foto';a[i].materialFormulaRecoveredAt=new Date().toISOString();if(ocrText&&!a[i].ocrText)a[i].ocrText=String(ocrText).slice(0,15000);save(OPS,a);
  try{window.dispatchEvent(new CustomEvent('df-op-remote-merged',{detail:{materials:true,recovered:true,id:opId}}))}catch(e){}return true;
}
function repairFromStoredText(){let fixed=0;for(const o of missingOps()){const mats=parseFormula(o.ocrText||'');if(mats.length&&saveFormula(o.id||o.qr,mats,'','ocr salvo'))fixed++}return fixed}
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function localPhoto(op){try{const d=await dbOpen();for(const id of [op.id,op.qr,op.cloudPhotoId].filter(Boolean)){const x=await new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});if(x&&x.blob)return x.blob}}catch(e){}return null}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}return String(localStorage.getItem(DEVICE)||'').trim()}
function tokenPayload(t){try{let s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function session(force){let t=String(sessionStorage.getItem(TOKEN)||'').trim(),p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;const credential=String(localStorage.getItem(ACCESS)||'').trim(),dev=deviceId();if(!credential||!dev)throw Error('sessão indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false||!j.token)throw Error(j.error||'sessão indisponível');t=String(j.token);sessionStorage.setItem(TOKEN,t);return t}
async function authFetch(url,opt,retry){let t=await session(false),dev=deviceId();const o=Object.assign({},opt||{});o.headers=Object.assign({},o.headers||{}, {'Authorization':'Bearer '+t,'X-DF-Device':dev});let r=await fetch(url,o);if(r.status===401&&retry!==false){await session(true);return authFetch(url,opt,false)}return r}
async function cloudPhotoId(op){if(op.cloudPhotoId)return String(op.cloudPhotoId);const team=load(TEAM,null);if(!team?.teamId)return'';const r=await authFetch(API+'/op/photo/list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamId:team.teamId,month:monthOf(op)||selectedMonth()}),cache:'no-store'});if(!r.ok)return'';const j=await r.json().catch(()=>({})),nids=ids(op);const p=(j.photos||[]).find(x=>nids.includes(norm(x?.sourceId||x?.qr||'')));return p?String(p.id||''):''}
async function cloudPhoto(op){try{const id=await cloudPhotoId(op);if(!id)return null;const r=await authFetch(API+'/op/photo/get?id='+encodeURIComponent(id),{cache:'no-store'});if(!r.ok)return null;return await r.blob()}catch(e){return null}}
function loadTess(){return new Promise((res,rej)=>{if(window.Tesseract)return res();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>res();s.onerror=()=>rej(Error('não consegui carregar o leitor da foto'));document.head.appendChild(s)})}
function imageCanvas(blob,max){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(blob);img.onload=()=>{try{const sc=Math.min(1,(max||2200)/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)}catch(e){URL.revokeObjectURL(u);rej(e)}};img.onerror=()=>{URL.revokeObjectURL(u);rej(Error('foto inválida'))};img.src=u})}
function setProgress(t,type){const e=$('dfMatPhotoRecoverMsg');if(!e)return;e.textContent=t;e.style.color=type==='ok'?'#86efac':type==='bad'?'#fca5a5':'#fde68a'}
async function recoverOne(op,index,total){setProgress('Lendo foto '+index+' de '+total+' — '+String(op.id||op.qr||'OP')+'...');let blob=await localPhoto(op);if(!blob)blob=await cloudPhoto(op);if(!blob)return{ok:false,why:'foto não encontrada'};await loadTess();const c=await imageCanvas(blob,2200);const res=await window.Tesseract.recognize(c,'por');const text=String(res?.data?.text||'');const mats=parseFormula(text);if(!mats.length)return{ok:false,why:'porcentagens não identificadas'};return{ok:saveFormula(op.id||op.qr,mats,text,'foto OCR'),mats}}
async function recoverAll(){if(running)return;running=true;let fixed=repairFromStoredText();let list=missingOps(),fail=0;mount();const btn=$('dfMatPhotoRecoverBtn');if(btn)btn.disabled=true;try{for(let i=0;i<list.length;i++){const r=await recoverOne(list[i],i+1,list.length);if(r.ok)fixed++;else fail++;await new Promise(res=>setTimeout(res,80))}setProgress('✅ Recuperadas '+fixed+' formulação(ões)'+(fail?' • '+fail+' foto(s) precisam de conferência manual.':''),'ok');try{window.DFOpMaterialConsumption?.render?.()}catch(e){}}catch(e){setProgress('⚠️ Falha na recuperação: '+(e.message||e),'bad')}finally{running=false;mount()}}
function mount(){
  const box=$('dfMaterialConsumption');if(!box)return false;const count=missingOps().length;let wrap=$('dfMatPhotoRecoverWrap');if(!wrap){wrap=document.createElement('div');wrap.id='dfMatPhotoRecoverWrap';wrap.style.cssText='margin:10px 0;padding:10px;border:1px solid #a16207;background:#2a1c05;border-radius:11px';const anchor=box.querySelector('.mcKpis')||box.firstChild;anchor.insertAdjacentElement('afterend',wrap)}
  if(!count&&!running){wrap.innerHTML='<div style="font-size:11px;color:#86efac;font-weight:850">✅ Todas as OPs deste mês têm porcentagens de formulação.</div>';return true}
  wrap.innerHTML='<button id="dfMatPhotoRecoverBtn" type="button" style="width:100%;border:1px solid #f59e0b;background:#3a2605;color:#fde68a;border-radius:10px;padding:11px;font-weight:950;font-size:12px">📷 RECUPERAR '+count+' FÓRMULA(S) DAS FOTOS</button><div id="dfMatPhotoRecoverMsg" style="margin-top:7px;font-size:10px;line-height:1.4;color:#fde68a">Primeiro aproveita o OCR já salvo. Só lê a foto novamente quando realmente precisar.</div>';
  $('dfMatPhotoRecoverBtn').onclick=recoverAll;if(running)$('dfMatPhotoRecoverBtn').disabled=true;return true;
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(()=>{const f=repairFromStoredText();if(f){try{window.DFOpMaterialConsumption?.render?.()}catch(e){}}mount()},ms||100)}
function boot(){setTimeout(()=>schedule(0),700);let n=0;const t=setInterval(()=>{if(mount()||++n>30)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="month"]'))schedule(100)},true);document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth')schedule(100)});window.addEventListener('df-op-remote-merged',()=>schedule(120));window.addEventListener('storage',e=>{if(e.key===OPS||e.key===REG)schedule(150)});
window.DFOpMaterialPhotoRecovery={recoverAll,parseFormula,repairFromStoredText};
})();
