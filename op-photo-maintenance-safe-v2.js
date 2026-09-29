(function(){
'use strict';
if(window.DFOpPhotoMaintenanceSafeV2)return;window.DFOpPhotoMaintenanceSafeV2=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
const OPS_KEY='df_formula_ops_auto_v2',TEAM_KEY='df_op_team_v1';
let busy=false,timer=0;
const $=id=>document.getElementById(id);
const norm=v=>String(v||'').trim().toUpperCase();
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function selectedMonth(){return String($('dfOpMonth')?.value||new Date().toLocaleDateString('en-CA').slice(0,7)).slice(0,7)}
function codeOfPhoto(p){const q=norm(p?.qr||p?.sourceId);return validQr(q)?q:''}
function officialOps(){const month=selectedMonth(),a=load(OPS_KEY,[]);return (Array.isArray(a)?a:[]).filter(o=>String(o?.data||'').slice(0,7)===month&&String(o?.status||'')==='ok'&&validQr(o?.id||o?.qr))}
function photoList(){try{return Array.isArray(window.DFOpCloud?.photos?.())?window.DFOpCloud.photos():[]}catch(e){return[]}}
function team(){try{const t=window.DFOpCloud?.team?.();if(t?.teamId)return t}catch(e){}const t=load(TEAM_KEY,null);return t&&t.teamId?t:null}
function deviceId(){try{const x=String(window.DFDeviceIdentity?.get?.()||'').trim();if(x)return x}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p?.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw Error('Sessão indisponível.');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw Error(j.error||'Não consegui renovar a sessão.');token=String(j.token||'').trim();sessionStorage.setItem(TOKEN_KEY,token);return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
function analyze(){
  const ops=officialOps(),photos=photoList(),official=new Map(),groups=new Map();
  for(const o of ops)official.set(norm(o.id||o.qr),o);
  for(const p of photos){const c=codeOfPhoto(p);if(!c)continue;if(!groups.has(c))groups.set(c,[]);groups.get(c).push(p)}
  for(const a of groups.values())a.sort((x,y)=>String(y.updatedAt||y.createdAt||'').localeCompare(String(x.updatedAt||x.createdAt||'')));
  const missing=[],duplicates=[],orphans=[],kept=new Map();
  for(const [code,o] of official){const list=groups.get(code)||[];let keep=null;const linked=String(o.cloudPhotoId||'');if(linked)keep=list.find(p=>String(p.id||'')===linked)||null;if(!keep&&list.length)keep=list[0];if(keep)kept.set(code,keep);else missing.push({code,op:o});if(list.length>1)for(const p of list)if(!keep||String(p.id)!==String(keep.id))duplicates.push({code,photo:p,keep})}
  for(const [code,list] of groups)if(!official.has(code))for(const p of list)orphans.push({code,photo:p});
  return{ops,photos,official,groups,kept,missing,duplicates,orphans};
}
function addStyle(){if($('dfPhotoMaintSafeStyle'))return;const s=document.createElement('style');s.id='dfPhotoMaintSafeStyle';s.textContent=`#dfPhotoMaintSafePanel{margin-top:10px;border:1px solid #334155;background:#0b1324;border-radius:12px;padding:10px}#dfPhotoMaintSafePanel b{color:#86efac}#dfPhotoMaintSafePanel .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}#dfPhotoMaintSafePanel button{width:100%;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:10px;font-weight:900}#dfPhotoMaintSafePanel button.danger{border-color:#b45309;background:#2a1605;color:#fde68a}@media(max-width:430px){#dfPhotoMaintSafePanel .grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function inject(){
  addStyle();const body=$('dfSystemModalBody');if(!body||!$('dfSystemModal')?.classList.contains('on'))return false;
  $('dfPhotoMaintSafePanel')?.remove();const a=analyze(),p=document.createElement('div');p.id='dfPhotoMaintSafePanel';
  p.innerHTML=`<b>🧹 CONSISTÊNCIA DO ARQUIVO</b><div style="font-size:10px;color:#cbd5e1;margin-top:5px">${a.duplicates.length} duplicada(s) • ${a.orphans.length} foto(s) sem OP oficial • ${a.missing.length} OP(s) oficial(is) sem foto encontrada.</div><div class="grid"><button id="dfPmSafeFix">🛠️ CORRIGIR VÍNCULOS</button><button id="dfPmSafeClean" class="danger">🗑️ LIMPAR DUPLICADAS SEGURAS</button></div><div id="dfPmSafeMsg" style="font-size:10px;color:#94a3b8;margin-top:7px"></div>`;
  body.appendChild(p);$('dfPmSafeFix').onclick=fixLinks;$('dfPmSafeClean').onclick=cleanDuplicates;return true;
}
async function fixLinks(){if(busy)return;busy=true;const b=$('dfPmSafeFix'),m=$('dfPmSafeMsg');if(b){b.disabled=true;b.textContent='⏳ CORRIGINDO...'}if(m)m.textContent='Conferindo D1 e fotos...';try{await window.DFOpServerAuthority?.sync?.(true);await window.DFOpCloud?.sync?.(true);const a=analyze(),ops=load(OPS_KEY,[]);let changed=0;for(const [code,p] of a.kept){const i=ops.findIndex(o=>norm(o?.id||o?.qr)===code&&String(o?.status||'')==='ok');if(i<0)continue;const pid=String(p?.id||'');if(pid&&String(ops[i].cloudPhotoId||'')!==pid){ops[i].cloudPhotoId=pid;ops[i].cloudSyncedAt=String(p.updatedAt||p.createdAt||new Date().toISOString());changed++;try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:ops[i],photoRelink:true}}))}catch(e){}}}if(changed)save(OPS_KEY,ops);await window.DFOpServerAuthority?.flush?.();await window.DFOpServerAuthority?.sync?.(true);if(m)m.textContent=changed?`✅ ${changed} vínculo(s) corrigido(s).`:'✅ Nenhum vínculo quebrado.';setTimeout(inject,250)}catch(e){if(m)m.textContent='⚠️ '+String(e?.message||e)}finally{busy=false;if(b){b.disabled=false;b.textContent='🛠️ CORRIGIR VÍNCULOS'}}}
async function cleanDuplicates(){
  if(busy)return;await window.DFOpServerAuthority?.sync?.(true);await window.DFOpCloud?.sync?.(true);const a=analyze(),m=$('dfPmSafeMsg');
  if(!a.duplicates.length){if(m)m.textContent='✅ Não há duplicadas seguras.';return}
  if(!confirm(`Excluir ${a.duplicates.length} foto(s) duplicada(s)?\n\nSerá mantida uma foto oficial por OP. Esta limpeza usa a rota segura e NÃO exclui a OP nem desconta produção.`))return;
  busy=true;const b=$('dfPmSafeClean');if(b){b.disabled=true;b.textContent='⏳ LIMPANDO...'}let ok=0,fail=0;
  try{for(const x of a.duplicates){const id=String(x.photo?.id||'');if(!id)continue;try{await apiPost('/op/photo/delete-duplicate',{id},true);ok++}catch(e){fail++}}await window.DFOpCloud?.sync?.(true);window.DFOpArchiveStability?.paginate?.();if(m)m.textContent=`✅ ${ok} duplicada(s) removida(s)`+(fail?` • ${fail} preservada(s) por segurança.`:'.');setTimeout(inject,300)}finally{busy=false;if(b){b.disabled=false;b.textContent='🗑️ LIMPAR DUPLICADAS SEGURAS'}}
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(inject,ms==null?900:ms)}
document.addEventListener('click',e=>{if(e.target?.closest?.('#dfSystemHealthBtn,#dfHealthForceSync'))schedule(950)},true);
window.addEventListener('df-op-d1-applied',()=>{if($('dfSystemModal')?.classList.contains('on'))schedule(350)});
window.DFOpPhotoMaintenanceSafe={analyze,fixLinks,cleanDuplicates};
})();
