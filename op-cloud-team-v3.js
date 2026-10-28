(function(){
'use strict';
if(window.DFOpCloudV3)return;window.DFOpCloudV3=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
const OPS_KEY='df_formula_ops_auto_v2',TEAM_KEY='df_op_team_v1',TEAM_CODE_KEY='df_op_team_join_code_v1';
const MAP_KEY='df_op_photo_cloud_map_v1',DB='df_ops_fotos_v2';
let team=null,uploading=false,syncing=false,uploadTimer=0,syncTimer=0,lastPhotos=[],lastHash='',viewerUrl='';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
function localYmd(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function monthNow(){return localYmd().slice(0,7)}
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
function hash(v){let s='';try{s=JSON.stringify(v||[])}catch(e){s=String(v||'')}let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function deviceId(){try{const x=String(window.DFDeviceIdentity?.get?.()||'').trim();if(x)return x}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p?.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw Error('acesso automático indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
async function uploadPhotoBinary(form,retry=true){
 const photo=form.get('photo');
 if(!(photo instanceof Blob)||photo.size<=0||photo.size>4000000)throw Error('Foto inválida para transmissão binária.');
 const fields=['teamId','photoType','formulaId','sourceId','qr','production','scrap','materials','createdAt','area'];
 const meta={};for(const key of fields){const v=form.get(key);if(v!=null)meta[key]=String(v)}
 const token=await renewSession(false),dev=deviceId();
 const endpoint=API+'/op/photo/upload-binary?meta='+encodeURIComponent(JSON.stringify(meta));
 const res=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'X-DF-Device':dev,'Content-Type':'image/jpeg'},body:photo,cache:'no-store'});
 let data={};try{data=await res.json()}catch(e){}
 if(res.status===401&&retry){await renewSession(true);return uploadPhotoBinary(form,false)}
 if(!res.ok||data.ok===false)throw Error(data.error||('HTTP '+res.status));
 if(!data.photo?.id)throw Error('O servidor não confirmou o ID da imagem.');
 return data;
}
async function apiForm(path,form,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},body:form,cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiForm(path,form,false)}if(!r.ok||j.ok===false){
 const reason=String(j.error||('HTTP '+r.status));
 if(path==='/op/photo/upload'&&/Foto obrigat[oó]ria/i.test(reason)){
  const photo=form.get('photo');
  if(!(photo instanceof Blob)||photo.size<1)throw Error('Imagem ausente no formulário antes do envio; a foto local permanece salva.');
  try{return await uploadPhotoBinary(form)}
  catch(e){throw Error('Envio multipart: '+reason+'; envio binário: '+String(e?.message||e))}
 }
 throw Error(reason)
}return j}
async function apiBlobGet(id,download){let token=await renewSession(false),dev=deviceId(),u=API+'/op/photo/get?id='+encodeURIComponent(id)+(download?'&download=1':'');let r=await fetch(u,{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'});if(r.status===401){token=await renewSession(true);r=await fetch(u,{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'})}if(!r.ok)throw Error('Não consegui abrir a foto da nuvem.');return r.blob()}
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoGet(id){try{const d=await dbOpen();return await new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}catch(e){return null}}
async function validPhotoBlob(value,id){
 let blob=value;
 if(typeof blob==='string'&&/^data:image\//i.test(blob)){
  const response=await fetch(blob);blob=await response.blob()
 }
 if(!(blob instanceof Blob)||blob.size<=0)throw Error('A foto da OP '+id+' está em formato inválido neste aparelho. Abra a foto original e reenvie a imagem.');
 const converted=await compressBlob(blob);
 if(!(converted instanceof Blob)||converted.size<=0)throw Error('Não foi possível preparar a imagem da OP '+id+'.');
 if(converted.size>4000000)throw Error('A imagem da OP '+id+' ultrapassa 4 MB. Reenvie em resolução menor.');
 return converted.type?converted:new Blob([converted],{type:'image/jpeg'})
}
async function compressBlob(blob){if(!blob||!String(blob.type||'').startsWith('image/'))return blob;return new Promise(resolve=>{const img=new Image(),u=URL.createObjectURL(blob);img.onload=()=>{try{const max=1800,sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>resolve(b||blob),'image/jpeg',.76)}catch(e){URL.revokeObjectURL(u);resolve(blob)}};img.onerror=()=>{URL.revokeObjectURL(u);resolve(blob)};img.src=u})}
function style(){if($('dfOpTeamStyle'))return;const s=document.createElement('style');s.id='dfOpTeamStyle';s.textContent=`#dfOpTeamCloud{margin-top:11px;border:1px solid #2563eb;background:#0b1324;border-radius:14px;padding:12px;color:#e2e8f0}#dfOpTeamCloud strong{color:#93c5fd}#dfOpTeamCloud .ctTiny{font-size:11px;color:#94a3b8;line-height:1.45;margin-top:4px}#dfOpTeamCloud .ctGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}#dfOpTeamCloud input{width:100%;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:11px;font-size:16px;text-transform:uppercase}#dfOpTeamCloud button,.dfCloudPhotoBtn{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}.ctCode{margin-top:8px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:900;word-break:break-all}#dfCloudRuntimeMsg{margin-top:8px;font-size:11px;font-weight:850;color:#94a3b8}#dfCloudRuntimeMsg.ok{color:#86efac}#dfCloudRuntimeMsg.warn{color:#fde68a}#dfCloudPhotosBox{margin-top:12px;overflow-anchor:none}.dfCloudPhotoRow{border:1px solid #263244;background:#0f172a;border-radius:12px;padding:10px;margin-top:7px;overflow-anchor:none}.dfCloudPhotoRow b{color:#ffd36a}.dfCloudPhotoBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}#dfCloudViewer{position:fixed;z-index:1000001;inset:0;background:#020617f2;display:none;padding:16px;overflow:auto;-webkit-overflow-scrolling:touch}#dfCloudViewer.on{display:block}#dfCloudViewer .box{max-width:760px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:16px;padding:12px}#dfCloudViewer img{display:block;width:100%;max-height:72vh;object-fit:contain;border-radius:10px;background:#000}@media(max-width:430px){#dfOpTeamCloud .ctGrid{grid-template-columns:1fr}.dfCloudPhotoBtns{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s)}
function runtimeMsg(text,type){const box=$('dfOpTeamCloud');if(!box)return;let e=$('dfCloudRuntimeMsg');if(!e){e=document.createElement('div');e.id='dfCloudRuntimeMsg';box.appendChild(e)}e.textContent=text;e.className=type||''}
function clearViewerUrl(){if(viewerUrl){try{URL.revokeObjectURL(viewerUrl)}catch(e){}viewerUrl=''}}
function mountViewer(){if($('dfCloudViewer'))return;const v=document.createElement('div');v.id='dfCloudViewer';v.innerHTML='<div class="box"><button id="dfCloudClose" class="dfCloudPhotoBtn" style="width:100%;margin-bottom:9px">FECHAR</button><div id="dfCloudViewerBody"></div></div>';document.body.appendChild(v);$('dfCloudClose').onclick=()=>{v.classList.remove('on');$('dfCloudViewerBody').innerHTML='';clearViewerUrl()}}
function setTeam(t,emit){const next=t||null,changed=!same(team,next);team=next;if(team)save(TEAM_KEY,team);else localStorage.removeItem(TEAM_KEY);renderTeam();if(changed&&emit)try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team}}))}catch(e){}}
function renderTeam(){const box=$('dfOpTeamCloud');if(!box)return;const code=String(localStorage.getItem(TEAM_CODE_KEY)||'').trim();if(team){box.innerHTML='<strong>☁️ FOTOS ENTRE CELULARES: ATIVO</strong><div class="ctTiny">Equipe conectada. As fotos são sincronizadas sem alterar Prontas ou Produção.</div><div class="ctCode">Equipe: '+esc(team.name||'DF EXTRUSOR')+' • '+esc(team.role==='owner'?'DONO':'OPERADOR')+'</div>'+(team.role==='owner'&&code?'<div class="ctCode">Código para conectar outro celular: <b>'+esc(code)+'</b></div>':'')+'<div class="ctGrid"><button id="dfCloudRefresh">🔄 ATUALIZAR FOTOS</button><button id="dfCloudRecover">📷 REENVIAR FOTO PELO ID</button>'+(team.role==='owner'&&code?'<button id="dfCloudCopy">📋 COPIAR CÓDIGO</button>':'')+'</div><div id="dfCloudRuntimeMsg"></div>';$('dfCloudRefresh').onclick=async()=>{await uploadPending();await syncRemote(true)};$('dfCloudRecover').onclick=async()=>{const example=localOps().find(o=>o?.status==='pending')?.id||'';const id=String(prompt('Informe o ID da OP cuja foto já está neste celular:',example)||'').trim().toUpperCase();if(!id)return;const b=$('dfCloudRecover');b.disabled=true;try{await recoverLocalPhoto(id);runtimeMsg('✅ Foto da OP '+id+' confirmada no servidor.','ok')}catch(e){runtimeMsg('⚠️ '+String(e?.message||e),'warn')}finally{b.disabled=false}};if($('dfCloudCopy'))$('dfCloudCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('dfCloudCopy').textContent='✅ COPIADO';setTimeout(()=>{if($('dfCloudCopy'))$('dfCloudCopy').textContent='📋 COPIAR CÓDIGO'},1200)}catch(e){prompt('Código da equipe:',code)}};runtimeMsg(navigator.onLine===false?'📴 Sem internet. As fotos aguardam conexão.':'☁️ Fotos sincronizadas separadamente das OPs.',navigator.onLine===false?'warn':'ok');return}box.innerHTML='<strong>☁️ CONECTAR APARELHOS</strong><div class="ctTiny">Crie a equipe no aparelho principal e use o código nos outros aparelhos.</div><div class="ctGrid"><button id="dfCloudCreate">👑 CRIAR MINHA EQUIPE</button><div><input id="dfCloudCode" inputmode="numeric" maxlength="8" placeholder="CÓDIGO DA EQUIPE"><button id="dfCloudJoin" style="width:100%;margin-top:6px">🔗 ENTRAR NA EQUIPE</button></div></div><div id="dfCloudMsg" class="ctTiny"></div>';$('dfCloudCreate').onclick=createTeam;$('dfCloudJoin').onclick=joinTeam}
function mountTeam(){style();mountViewer();const hero=document.querySelector('#dfFormulaOps .dfOpsHero');if(!hero)return false;let box=$('dfOpTeamCloud');if(!box){box=document.createElement('div');box.id='dfOpTeamCloud';hero.appendChild(box)}renderTeam();return true}
async function loadTeam(){const cached=load(TEAM_KEY,null);if(cached&&!team){team=cached;renderTeam()}try{const j=await apiPost('/op/team/status',{});setTeam(j.team||null,false);if(team){scheduleRemote(180,false);scheduleUpload(250)}}catch(e){}}
async function createTeam(){const m=$('dfCloudMsg');if(m)m.textContent='Criando equipe...';try{const j=await apiPost('/op/team/create',{name:'DF EXTRUSOR'});if(j.joinCode)localStorage.setItem(TEAM_CODE_KEY,String(j.joinCode));setTeam(j.team,true);try{window.dispatchEvent(new CustomEvent('df-team-joined',{detail:{team:j.team,created:true}}))}catch(e){}scheduleRemote(120,true)}catch(e){if(m)m.textContent='Não foi possível criar: '+(e.message||e)}}
async function joinTeam(){
 const code=String($('dfCloudCode')?.value||'').replace(/\D/g,''),m=$('dfCloudMsg'),btn=$('dfCloudJoin');
 if(code.length<6){if(m)m.textContent='Digite o código da equipe.';return}
 const ok=confirm('ENTRAR NA EQUIPE E APAGAR TODOS OS DADOS LOCAIS DESTE CELULAR?\n\nAo entrar, serão apagados neste aparelho: fotos, formulações, materiais, pesos, OPs, pendentes, prontas e produção local de qualquer equipe anterior.\n\nNÃO apaga nada do servidor ou dos outros celulares. Os dados já enviados à nuvem poderão ser sincronizados ao entrar. Dados que existem somente neste celular serão perdidos.\n\nA licença e o acesso ao aplicativo permanecem.');
 if(!ok)return;
 if(!window.DFTeamLocalCleanup?.clear){if(m)m.textContent='Rotina de limpeza indisponível. Atualize o aplicativo e tente novamente.';return}
 if(btn){btn.disabled=true;btn.textContent='⏳ ENTRANDO E LIMPANDO...'}
 if(m)m.textContent='Verificando equipe no servidor...';
 try{
  // A participação só é criada depois da confirmação; nunca apagamos o banco remoto.
  const j=await apiPost('/op/team/join',{code});
  if(!j?.team?.teamId)throw Error('Servidor não confirmou a entrada na equipe.');
  if(m)m.textContent='Limpando somente este celular...';
  await window.DFTeamLocalCleanup.clear();
  setTeam(j.team,true);
  if(m)m.textContent='✅ Aparelho limpo. Carregando dados da nova equipe...';
  location.reload();
 }catch(e){
  if(m)m.textContent='Não foi possível concluir a entrada: '+String(e?.message||e);
  if(btn){btn.disabled=false;btn.textContent='🔗 ENTRAR NA EQUIPE'}
 }
}
function selectedMonth(){return String($('dfOpMonth')?.value||monthNow()).slice(0,7)}
function selectedPhotoType(){try{return localStorage.getItem('df_op_photo_type_v1')==='formulation'?'formulation':'production_op'}catch(e){return 'production_op'}}
function selectedFormulaId(){try{return String(localStorage.getItem('df_op_photo_formula_id_v1')||'').trim()}catch(e){return ''}}
function photoMapKey(type,id){return String(type||'production_op')+':'+String(id||'').trim().toUpperCase()}
function remoteCode(p){const q=String(p?.qr||p?.sourceId||'').trim().toUpperCase();return validQr(q)?q:''}
function sortPhotos(a){return [...(a||[])].filter(p=>p&&String(p.id||'').trim()).sort((x,y)=>String(y.createdAt||y.updatedAt||'').localeCompare(String(x.createdAt||x.updatedAt||''))||String(x.id||'').localeCompare(String(y.id||'')))}
function localDateText(v){const d=new Date(String(v||''));return Number.isNaN(d.getTime())?String(v||'').replace('T',' ').slice(0,16):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function ensurePhotoBox(){const pane=$('dfPaneArchive');if(!pane)return null;let box=$('dfCloudPhotosBox');if(!box){box=document.createElement('div');box.id='dfCloudPhotosBox';box.innerHTML='<h3 style="margin:0 0 8px">📸 Fotos das OPs</h3><div class="dfOpsTiny">Fotos compartilhadas pela equipe, mesmo quando a OP ainda não sincronizou neste celular.</div><div id="dfCloudPhotosRows"></div>';const card=pane.querySelector('.dfOpsCard');if(card)card.insertBefore(box,card.firstChild)}return box}
function reconcileRows(host,list){
  const by=new Map([...host.querySelectorAll(':scope > .dfCloudPhotoRow')].map(r=>[String(r.dataset.photoId||''),r]));
  let cursor=host.firstElementChild;
  for(const p of list){
    const id=String(p.id||'');let row=by.get(id);
    if(!row){row=makeRow(p)}else by.delete(id);
    updateRow(row,p);
    if(row!==cursor)host.insertBefore(row,cursor||null);
    cursor=row.nextElementSibling;
  }
  for(const row of by.values())row.remove();
}
function makeRow(p){const row=document.createElement('div');row.className='dfCloudPhotoRow';row.dataset.photoId=String(p.id||'');return row}
function updateRow(row,p){const code=remoteCode(p),sig=[code,p.createdAt,p.updatedAt,p.production,p.scrap].join('|');if(row.dataset.sig===sig)return;row.dataset.sig=sig;row.innerHTML='<b>'+esc(code)+'</b><div class="dfOpsTiny">'+esc(localDateText(p.createdAt||p.updatedAt||''))+' • Produção '+Number(p.production||0).toLocaleString('pt-BR')+' kg • Apara '+Number(p.scrap||0).toLocaleString('pt-BR')+' kg</div><div class="dfCloudPhotoBtns"><button class="dfCloudPhotoBtn" data-cloud-open="'+esc(p.id)+'">👁️ ABRIR FOTO</button><button class="dfCloudPhotoBtn" data-cloud-down="'+esc(p.id)+'">⬇️ BAIXAR</button></div>';row.querySelector('[data-cloud-open]').onclick=()=>openCloud(p.id,false);row.querySelector('[data-cloud-down]').onclick=()=>openCloud(p.id,true)}
function officialPhotoList(photos){const seen=new Set(),out=[];for(const p of sortPhotos(photos)){const id=String(p?.id||'').trim(),code=String(remoteCode(p)||'').trim().toUpperCase();if(!id||!validQr(code)||seen.has(code))continue;seen.add(code);out.push(p)}return out.sort((x,y)=>String(y.createdAt||y.updatedAt||'').localeCompare(String(x.createdAt||x.updatedAt||''))||String(x.id||'').localeCompare(String(y.id||'')))}
function renderCloudPhotos(photos,force){/* A aba FOTOS mostra somente o arquivo local; fotos da API continuam disponíveis por ID/QR e na nuvem. */const cloudBox=$('dfCloudPhotosBox');if(cloudBox)cloudBox.remove();return;const pane=$('dfPaneArchive');if(!pane)return;const list=officialPhotoList(photos),sig=hash(list.map(p=>[p.id,remoteCode(p),p.updatedAt,p.createdAt,p.production,p.scrap]));if(sig===lastHash&&$('dfCloudPhotosBox')&&$('dfCloudPhotosRows'))return;const box=ensurePhotoBox();if(!box)return;const host=$('dfCloudPhotosRows');if(!host)return;reconcileRows(host,list);lastHash=sig;host.querySelectorAll(':scope > .dfOpsTiny[data-empty-cloud]').forEach(x=>x.remove());if(!list.length){const e=document.createElement('div');e.className='dfOpsTiny';e.dataset.emptyCloud='1';e.style.marginTop='8px';e.textContent='Nenhuma foto sincronizada para o mês selecionado.';host.appendChild(e)}try{window.dispatchEvent(new CustomEvent('df-cloud-photos-rendered',{detail:{count:list.length}}))}catch(e){}}
async function syncRemote(forceRender,monthOverride){if(!team||syncing||navigator.onLine===false||document.hidden)return false;syncing=true;runtimeMsg('🔄 Atualizando fotos da equipe...','');try{const photoType=selectedPhotoType();const j=await apiPost('/op/photo/list',{teamId:team.teamId,month:monthOverride||selectedMonth(),photoType});const photos=Array.isArray(j.photos)?j.photos:[];lastPhotos=photos;const map=load(MAP_KEY,{});for(const p of sortPhotos(photos)){const code=remoteCode(p);if(code&&p.id){const k=photoMapKey(photoType,code),current=map[k]||(photoType==='production_op'?map[code]:{})||{};map[k]={...current,photoId:String(p.id),remoteUpdatedAt:String(p.updatedAt||p.createdAt||'')};if(photoType==='production_op')map[code]=map[k]}}save(MAP_KEY,map);const pane=$('dfPaneArchive');if(forceRender||(pane&&pane.classList.contains('on')))renderCloudPhotos(photos,false);runtimeMsg('✅ Fotos da equipe sincronizadas.','ok');return true}catch(e){runtimeMsg('⚠️ Não consegui atualizar as fotos agora.','warn');return false}finally{syncing=false}}
async function openCloud(id,download){try{const blob=await apiBlobGet(id,download);if(download){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='OP-'+id+'.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);return}clearViewerUrl();viewerUrl=URL.createObjectURL(blob);$('dfCloudViewerBody').innerHTML='<img src="'+viewerUrl+'"><button id="dfCloudDownloadCurrent" class="dfCloudPhotoBtn" style="width:100%;margin-top:9px">⬇️ BAIXAR FOTO</button>';$('dfCloudViewer').classList.add('on');$('dfCloudDownloadCurrent').onclick=()=>openCloud(id,true)}catch(e){alert(e.message||e)}}
function localOps(){const a=load(OPS_KEY,[]);return Array.isArray(a)?a:[]}
async function nextUpload(){
 const map=load(MAP_KEY,{}),ops=localOps();
 for(let i=0;i<ops.length;i++){
  const rec=ops[i],id=String(rec?.id||rec?.qr||'').trim().toUpperCase();
  if(!validQr(id)||!['ok','pending'].includes(String(rec?.status||'')))continue;
  const ph=await photoGet(id);if(!ph?.blob)continue;
  let formulaId=String(rec?.formulaId||'').trim();
  if(!formulaId){try{formulaId=String(resolveFormulationId(id,rec,ph,false)||'').trim()}catch(e){}}
  const photoType=formulaId?'formulation':'production_op';
  if(formulaId&&(String(rec?.formulaId||'').trim()!==formulaId||rec?.photoType!=='formulation')){
   ops[i]={...rec,id,qr:id,formulaId,photoType:'formulation'};
   save(OPS_KEY,ops);
  }
  const savedAt=String(ph.savedAt||''),m=map[photoMapKey(photoType,id)]||(photoType==='production_op'?map[id]:null);
  if(m&&String(m.localSavedAt||'')===savedAt&&m.photoId)continue;
  return{rec:{...rec,id,qr:id,formulaId,photoType},ph,map,photoType,formulaId}
 }
 return null
}
async function uploadPending(){if(!team||uploading||navigator.onLine===false||document.hidden)return false;const item=await nextUpload();if(!item)return false;uploading=true;runtimeMsg('⏳ Enviando foto para a nuvem...','');try{const {rec,ph,map,photoType,formulaId}=item,small=await validPhotoBlob(ph.blob,rec.id),form=new FormData();form.append('teamId',team.teamId);form.append('photoType',photoType);if(photoType==='formulation')form.append('formulaId',formulaId);form.append('sourceId',rec.id);form.append('qr',rec.qr||rec.id);form.append('production',String(+rec.produzido||0));form.append('scrap',String(+rec.apara||0));form.append('materials',JSON.stringify((rec.materials||[]).map(m=>({name:m.name,pct:+m.pct||0}))));form.append('createdAt',rec.manualConfirmedAt||rec.updatedAt||rec.createdAt||new Date().toISOString());form.append('photo',small,'op.jpg');const j=await apiForm('/op/photo/upload',form),photoId=String(j.photo?.id||'');if(!photoId)throw Error('Servidor não confirmou a foto.');const verified=await apiBlobGet(photoId,false);if(!verified?.size)throw Error('Arquivo não está disponível no servidor.');const now=new Date().toISOString();const entry={photoId,localSavedAt:String(ph.savedAt||''),uploadedAt:now,photoType,formulaId:formulaId||rec.formulaId||''};map[photoMapKey(photoType,rec.id)]=entry;if(photoType==='production_op')map[rec.id]=entry;save(MAP_KEY,map);runtimeMsg('✅ Foto salva na nuvem.','ok');const decorated={...rec,cloudPhotoId:photoId,cloudTeamId:team.teamId,cloudSyncedAt:now};try{window.dispatchEvent(new CustomEvent('df-op-cloud-synced',{detail:{id:rec.id,photoId}}))}catch(e){}try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:decorated,photoSync:true}}))}catch(e){}scheduleRemote(250,false);scheduleUpload(500);return true}catch(e){const reason=String(e?.message||e||'Falha desconhecida');runtimeMsg('⚠️ OP '+String(item?.rec?.id||'')+': foto não enviada — '+reason+'. A imagem local foi preservada.','warn');console.warn('Falha no upload da foto da OP:',item?.rec?.id,reason);setTimeout(()=>{if(navigator.onLine!==false&&!document.hidden&&team)scheduleUpload(200)},30000);return false}finally{uploading=false}}
function scheduleUpload(ms){clearTimeout(uploadTimer);uploadTimer=setTimeout(uploadPending,ms||250)}
function scheduleRemote(ms,force){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncRemote(!!force),ms||400)}
function resolveFormulationId(id,rec,photo,promptIfAmbiguous=true){
 // O QR é a identidade fixa da OP; jamais pedir para o operador escolher outra
 // formulação de uma lista, pois ela pode ter sido excluída ou substituída.
 const code=String(id||rec?.qr||rec?.id||'').trim().toUpperCase();
 const registry=load('df_op_qr_registry_v1',{});
 const entry=registry?.[code]||{};
 const expected=entry.expected||{};
 const explicit=[
   rec?.formulaId,rec?.formula_id,rec?.expected?.formulaId,
   photo?.formulaId,photo?.formula_id,expected?.formulaId,expected?.__dfFormulaId,
   entry?.formulaId
 ].map(v=>String(v||'').trim()).find(Boolean);
 if(explicit)return explicit;
 // Recupera por NOME EXATO somente quando existe um único correspondente;
 // nunca usa automaticamente a última formulação, que pode ser de outra OP.
 const forms=load('df_formulacoes_v2',[]);
 const normName=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const names=[expected?.title,expected?.produto,rec?.produto,rec?.product,rec?.serverProductName,photo?.produto]
   .map(normName).filter(Boolean);
 const matches=Array.isArray(forms)?forms.filter(f=>names.includes(normName(f?.nome||f?.name||f?.produto))):[];
 if(matches.length===1&&matches[0]?.id!=null)return String(matches[0].id).trim();
 // OP antiga sem formulação recuperável: vínculo virtual estável e ÚNICO
 // pelo QR, sem inventar que ela pertence a outra fórmula atual da equipe.
 if(/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/.test(code))return 'LEGACY-'+code;
 return '';
}
async function recoverLocalPhoto(id){
 id=String(id||'').trim().toUpperCase();
 if(!team?.teamId||!validQr(id))throw Error('Conecte à equipe e informe um ID DFOP válido.');
 if(navigator.onLine===false)throw Error('Sem internet: a foto continua preservada neste celular.');
 let ph=await photoGet(id);
 if(!ph?.blob){const d=await dbOpen();ph=await new Promise((resolve,reject)=>{const tx=d.transaction('photos','readonly'),req=tx.objectStore('photos').openCursor();req.onsuccess=()=>{const cursor=req.result;if(!cursor){resolve(null);return}const v=cursor.value;if(String(v?.qr||v?.opId||'').trim().toUpperCase()===id&&v?.blob){resolve(v);return}cursor.continue()};req.onerror=()=>reject(req.error)})}
 if(!ph?.blob)throw Error('Foto original não está armazenada neste aparelho. Use o celular que tirou a foto.');
 const rec=localOps().find(o=>String(o?.id||o?.qr||'').trim().toUpperCase()===id)||{};
 const formulaId=String(resolveFormulationId(id,rec,ph,false)||'').trim(),type=formulaId?'formulation':'production_op';
 const form=new FormData(),blob=await validPhotoBlob(ph.blob,id);
 form.append('teamId',team.teamId);form.append('photoType',type);if(formulaId)form.append('formulaId',formulaId);form.append('sourceId',id);form.append('qr',id);
 form.append('production',String(Number(rec.produzido??ph.produzido??0)||0));
 form.append('scrap',String(Number(rec.apara??ph.apara??0)||0));
 form.append('materials',JSON.stringify((rec.materials||ph.materials||[]).map(m=>({name:String(m?.name||''),pct:Number(m?.pct||0)}))));
 form.append('createdAt',String(rec.manualConfirmedAt||rec.createdAt||rec.updatedAt||ph.savedAt||new Date().toISOString()));
 form.append('photo',blob,'op.jpg');
 const result=await apiForm('/op/photo/upload',form);
 const photoId=String(result?.photo?.id||'');
 if(!photoId)throw Error('O servidor não confirmou a gravação da foto.');
 const confirmed=await apiBlobGet(photoId,false);
 if(!confirmed?.size)throw Error('A foto foi enviada, mas a leitura no servidor falhou.');
 const map=load(MAP_KEY,{}),entry={photoId,photoType:type,formulaId,localSavedAt:String(ph.savedAt||''),uploadedAt:new Date().toISOString()};
 map[photoMapKey(type,id)]=entry;if(type==='production_op')map[id]=entry;save(MAP_KEY,map);
 try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:{...rec,id,qr:id,photoType:type,formulaId,cloudPhotoId:photoId},photoSync:true}}))}catch(e){}
 scheduleRemote(200,true);
 return photoId;
}
async function photoForOp(id,photoType){
 id=String(id||'').trim().toUpperCase();photoType=photoType==='formulation'?'formulation':(photoType==='production_op'?'production_op':selectedPhotoType());if(!team?.teamId||!validQr(id))throw Error('Equipe ou ID inválido.');
 const map=load(MAP_KEY,{}),key=photoMapKey(photoType,id);
 let photoId=String((map[key]||(photoType==='production_op'?map[id]:null))?.photoId||'');
 if(photoId){try{await apiBlobGet(photoId,false);return photoId}catch(e){photoId=''}}
 const match=id.match(/^DFOP-(\d{4})(\d{2})/);
 const months=[selectedMonth(),match?match[1]+'-'+match[2]:''].filter((v,i,a)=>v&&a.indexOf(v)===i);
 for(const month of months){const result=await apiPost('/op/photo/list',{teamId:team.teamId,month,photoType});const p=(result.photos||[]).find(x=>remoteCode(x)===id);if(p?.id){photoId=String(p.id);map[key]={...(map[key]||{}),photoId,photoType};if(photoType==='production_op')map[id]=map[key];save(MAP_KEY,map);return photoId}}
 throw Error('A foto ainda não foi enviada para a nuvem pelo operador.');
}

async function viewPhotoByOp(id){let photoId='';try{photoId=await photoForOp(id,'formulation')}catch(e){photoId=await photoForOp(id,'production_op')}return openCloud(photoId,false)}
async function ensurePhotoTeam(){if(team?.teamId)return team;const cached=load(TEAM_KEY,null);if(cached?.teamId){team=cached;return team}await loadTeam();if(!team?.teamId)throw Error('Conecte este aparelho a uma equipe antes de enviar a foto.');return team}
async function uploadFormulaPhoto(formulaId,blob){const t=await ensurePhotoTeam(),fid=String(formulaId||'').trim();if(!fid)throw Error('ID da formulação ausente.');if(!blob||!String(blob.type||'').startsWith('image/'))throw Error('Selecione uma imagem.');const small=await compressBlob(blob),form=new FormData(),sourceId='FORMULA:'+fid,createdAt=new Date().toISOString();form.append('teamId',t.teamId);form.append('photoType','formulation');form.append('formulaId',fid);form.append('sourceId',sourceId);form.append('qr',sourceId);form.append('production','0');form.append('scrap','0');form.append('materials','[]');form.append('createdAt',createdAt);form.append('photo',small,'formula.jpg');const j=await apiForm('/op/photo/upload',form);return j.photo||{id:''}}
async function formulaPhotoId(formulaId){const t=await ensurePhotoTeam(),fid=String(formulaId||'').trim();if(!fid)throw Error('ID da formulação ausente.');const j=await apiPost('/op/photo/list',{teamId:t.teamId,photoType:'formulation',formulaId:fid}),sourceId='FORMULA:'+fid,p=(j.photos||[]).find(x=>String(x.sourceId||'')===sourceId||String(x.formulaId||'')===fid);if(!p?.id)throw Error('Ainda não há foto vinculada a esta formulação.');return String(p.id)}
function interceptRemoteOpen(){document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-view]');if(!b||!team)return;const id=String(b.dataset.view||'').toUpperCase();if(!validQr(id))return;const map=load(MAP_KEY,{}),type=selectedPhotoType(),rec=localOps().find(o=>String(o?.id||o?.qr||'').toUpperCase()===id),photoId=String((map[photoMapKey(type,id)]||(type==='production_op'?map[id]:null))?.photoId||(type==='production_op'?rec?.cloudPhotoId:'')||'');if(!photoId)return;e.preventDefault();e.stopImmediatePropagation();openCloud(photoId,false)},true)}
function boot(){team=load(TEAM_KEY,null);let n=0,t=setInterval(()=>{n++;if(mountTeam()||n>20)clearInterval(t)},250);setTimeout(()=>{mountTeam();loadTeam()},650);interceptRemoteOpen();window.addEventListener('df-op-saved',e=>{if(!e?.detail?.photoSync)scheduleUpload(150)});window.addEventListener('df-prontas-products-synced',()=>scheduleUpload(200));window.addEventListener('df-op-meta-enriched',()=>scheduleUpload(250));window.addEventListener('storage',e=>{if(e.key===OPS_KEY)scheduleUpload(250)});window.addEventListener('online',()=>{scheduleUpload(200);scheduleRemote(400,true)});window.addEventListener('offline',()=>runtimeMsg('📴 Sem internet. As fotos aguardam conexão.','warn'));window.addEventListener('df-ui-ready',()=>setTimeout(()=>{mountTeam();if(team)scheduleRemote(350,false)},200));document.addEventListener('change',e=>{if((e.target?.id==='dfOpMonth'||e.target?.id==='dfOpPhotoType'||e.target?.id==='dfOpPhotoFormula')&&e.isTrusted&&team)scheduleRemote(150,true)},true);document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="archive"]')){renderCloudPhotos(lastPhotos,false);if(team)scheduleRemote(150,false)}},true);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&team){scheduleUpload(250);scheduleRemote(600,false)}});setInterval(()=>{if(!document.hidden&&team){scheduleUpload(250);scheduleRemote(500,false)}},60000)}
window.DFOpCloud={sync:(force)=>syncRemote(!!force),syncMonth:(month)=>syncRemote(false,month),uploadPending,uploadFormulaPhoto,formulaPhotoId,resolveFormulationId:(id,rec,photo)=>resolveFormulationId(String(id||'').trim().toUpperCase(),rec||{},photo||{}),team:()=>team,openPhoto:openCloud,getPhotoBlob:(id)=>apiBlobGet(id,false),photos:()=>lastPhotos,viewPhotoByOp,photoForOp};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
