(function(){
  'use strict';
  if(window.DFOpCloudV2)return;
  window.DFOpCloudV2=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const OPS_KEY='df_formula_ops_auto_v2';
  const TEAM_KEY='df_op_team_v1';
  const TEAM_CODE_KEY='df_op_team_join_code_v1';
  const DB='df_ops_fotos_v2';
  let team=null,uploading=false,syncing=false,uploadTimer=0,syncTimer=0,lastPhotosHash='',lastPhotos=[];
  let viewerUrl='';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function localYmd(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
  const monthNow=()=>localYmd().slice(0,7);
  const loadJson=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  function sameJson(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
  function quickHash(v){let s='';try{s=JSON.stringify(v||[])}catch(e){s=String(v||'')}let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}

  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
  async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw new Error('acesso automático indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token}
  async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
  async function apiForm(path,form,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},body:form,cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiForm(path,form,false)}if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;throw er}return j}
  async function apiBlobGet(id,download){let token=await renewSession(false),dev=deviceId(),u=API+'/op/photo/get?id='+encodeURIComponent(id)+(download?'&download=1':'');let r=await fetch(u,{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'});if(r.status===401){token=await renewSession(true);r=await fetch(u,{headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},cache:'no-store'})}if(!r.ok)throw new Error('Não consegui abrir a foto da nuvem.');return r.blob()}

  function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function photoGet(id){const d=await dbOpen();return new Promise((res,rej)=>{const r=d.transaction('photos').objectStore('photos').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
  async function compressBlob(blob){if(!blob||!String(blob.type||'').startsWith('image/'))return blob;return new Promise(resolve=>{const img=new Image(),u=URL.createObjectURL(blob);img.onload=()=>{try{const max=1800,sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>resolve(b||blob),'image/jpeg',.76)}catch(e){URL.revokeObjectURL(u);resolve(blob)}};img.onerror=()=>{URL.revokeObjectURL(u);resolve(blob)};img.src=u})}

  function style(){if($('dfOpTeamStyle'))return;const s=document.createElement('style');s.id='dfOpTeamStyle';s.textContent=`#dfOpTeamCloud{margin-top:11px;border:1px solid #2563eb;background:#0b1324;border-radius:14px;padding:12px;color:#e2e8f0}#dfOpTeamCloud strong{color:#93c5fd}#dfOpTeamCloud .ctTiny{font-size:11px;color:#94a3b8;line-height:1.45;margin-top:4px}#dfOpTeamCloud .ctGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}#dfOpTeamCloud input{width:100%;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:11px;font-size:16px;text-transform:uppercase}#dfOpTeamCloud button,.dfCloudPhotoBtn{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}.ctCode{margin-top:8px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:900;word-break:break-all}#dfCloudRuntimeMsg{margin-top:8px;font-size:11px;font-weight:850;color:#94a3b8}#dfCloudRuntimeMsg.ok{color:#86efac}#dfCloudRuntimeMsg.warn{color:#fde68a}#dfCloudPhotosBox{margin-top:12px}.dfCloudPhotoRow{border:1px solid #263244;background:#0f172a;border-radius:12px;padding:10px;margin-top:7px}.dfCloudPhotoRow b{color:#ffd36a}.dfCloudPhotoBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}#dfCloudViewer{position:fixed;z-index:1000001;inset:0;background:#020617f2;display:none;padding:16px;overflow:auto}#dfCloudViewer.on{display:block}#dfCloudViewer .box{max-width:760px;margin:20px auto;background:#111827;border:1px solid #334155;border-radius:16px;padding:12px}#dfCloudViewer img{display:block;width:100%;max-height:72vh;object-fit:contain;border-radius:10px;background:#000}@media(max-width:430px){#dfOpTeamCloud .ctGrid{grid-template-columns:1fr}.dfCloudPhotoBtns{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s)}
  function runtimeMsg(text,type){const box=$('dfOpTeamCloud');if(!box)return;let e=$('dfCloudRuntimeMsg');if(!e){e=document.createElement('div');e.id='dfCloudRuntimeMsg';box.appendChild(e)}if(e.textContent!==text)e.textContent=text;e.className=type||''}
  function clearViewerUrl(){if(viewerUrl){try{URL.revokeObjectURL(viewerUrl)}catch(e){}viewerUrl=''}}
  function mountViewer(){if($('dfCloudViewer'))return;const v=document.createElement('div');v.id='dfCloudViewer';v.innerHTML='<div class="box"><button id="dfCloudClose" class="dfCloudPhotoBtn" style="width:100%;margin-bottom:9px">FECHAR</button><div id="dfCloudViewerBody"></div></div>';document.body.appendChild(v);$('dfCloudClose').onclick=()=>{v.classList.remove('on');$('dfCloudViewerBody').innerHTML='';clearViewerUrl()}}
  function setTeam(t,emit){const next=t||null;const changed=!sameJson(team,next);team=next;if(team)saveJson(TEAM_KEY,team);else{try{localStorage.removeItem(TEAM_KEY)}catch(e){}}renderTeam();if(changed&&emit){try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team}}))}catch(e){}}}
  function renderTeam(){const box=$('dfOpTeamCloud');if(!box)return;const savedCode=String(localStorage.getItem(TEAM_CODE_KEY)||'').trim();if(team){box.innerHTML='<strong>☁️ FOTOS ENTRE CELULARES: ATIVO</strong><div class="ctTiny">Equipe conectada. Fotos salvas pelos aparelhos desta equipe aparecem aqui automaticamente.</div><div class="ctCode">Equipe: '+esc(team.name||'DF EXTRUSOR')+' • '+esc(team.role==='owner'?'DONO':'OPERADOR')+'</div>'+(team.role==='owner'&&savedCode?'<div class="ctCode">Código para conectar outro celular: <b>'+esc(savedCode)+'</b></div>':'')+'<div class="ctGrid"><button id="dfCloudRefresh">🔄 ATUALIZAR AGORA</button>'+(team.role==='owner'&&savedCode?'<button id="dfCloudCopy">📋 COPIAR CÓDIGO</button>':'')+'</div><div id="dfCloudRuntimeMsg"></div>';$('dfCloudRefresh').onclick=()=>syncRemote(true);if($('dfCloudCopy'))$('dfCloudCopy').onclick=async()=>{try{await navigator.clipboard.writeText(savedCode);$('dfCloudCopy').textContent='✅ COPIADO';setTimeout(()=>{if($('dfCloudCopy'))$('dfCloudCopy').textContent='📋 COPIAR CÓDIGO'},1400)}catch(e){prompt('Código da equipe:',savedCode)}};runtimeMsg(navigator.onLine===false?'📴 Sem internet. As fotos aguardam conexão.':'☁️ Equipe pronta para sincronizar.',navigator.onLine===false?'warn':'ok');return}box.innerHTML='<strong>☁️ CONECTAR APARELHOS</strong><div class="ctTiny">No seu celular, crie uma equipe. No celular do operador, digite o código. Depois as fotos ficam compartilhadas entre os dois.</div><div class="ctGrid"><button id="dfCloudCreate">👑 CRIAR MINHA EQUIPE</button><div><input id="dfCloudCode" inputmode="numeric" maxlength="8" placeholder="CÓDIGO DA EQUIPE"><button id="dfCloudJoin" style="width:100%;margin-top:6px">🔗 ENTRAR NA EQUIPE</button></div></div><div id="dfCloudMsg" class="ctTiny"></div>';$('dfCloudCreate').onclick=createTeam;$('dfCloudJoin').onclick=joinTeam}
  function mountTeam(){style();mountViewer();const hero=document.querySelector('#dfFormulaOps .dfOpsHero');if(!hero)return false;let box=$('dfOpTeamCloud');if(!box){box=document.createElement('div');box.id='dfOpTeamCloud';hero.appendChild(box)}renderTeam();return true}

  async function loadTeam(){const cached=loadJson(TEAM_KEY,null);if(cached&&!team){team=cached;renderTeam()}try{const j=await apiPost('/op/team/status',{});setTeam(j.team||null,false);if(team){scheduleRemote(120,true);scheduleUpload(180)}}catch(e){if(!cached){const b=$('dfOpTeamCloud');if(b)b.innerHTML='<strong>☁️ CONECTAR APARELHOS</strong><div class="ctTiny">Não consegui consultar a equipe agora. Confira a internet e tente novamente.</div>'}}}
  async function createTeam(){const m=$('dfCloudMsg');if(m)m.textContent='Criando equipe...';try{const j=await apiPost('/op/team/create',{name:'DF EXTRUSOR'});if(j.joinCode){try{localStorage.setItem(TEAM_CODE_KEY,String(j.joinCode))}catch(e){}}setTeam(j.team,true);try{window.dispatchEvent(new CustomEvent('df-team-joined',{detail:{team:j.team,created:true}}))}catch(e){}scheduleRemote(100,true)}catch(e){if(m)m.textContent='Não foi possível criar: '+(e.message||e)}}
  async function joinTeam(){const code=String($('dfCloudCode')?.value||'').replace(/\D/g,'');const m=$('dfCloudMsg');if(code.length<6){if(m)m.textContent='Digite o código da equipe.';return}if(m)m.textContent='Conectando...';try{const j=await apiPost('/op/team/join',{code});setTeam(j.team,true);try{window.dispatchEvent(new CustomEvent('df-team-joined',{detail:{team:j.team,created:false}}))}catch(e){}scheduleRemote(100,true);scheduleUpload(180)}catch(e){if(m)m.textContent='Não foi possível conectar: '+(e.message||e)}}

  function selectedMonth(){return String($('dfOpMonth')?.value||monthNow()).slice(0,7)}
  function normalizedRemote(p){return{cloudPhotoId:String(p.id||''),cloudTeamId:String(p.teamId||team?.teamId||''),cloudSyncedAt:String(p.updatedAt||p.createdAt||''),qr:String(p.qr||p.sourceId||''),produzido:+p.production||0,apara:+p.scrap||0,data:String(p.createdAt||'').slice(0,10)||localYmd()}}
  function mergeRemote(photos){if(!Array.isArray(photos)||!photos.length)return false;const a=loadJson(OPS_KEY,[]);let changed=false;for(const p of photos){const sid=String(p.sourceId||p.qr||p.id||'').trim();if(!sid)continue;const cloud=normalizedRemote(p);let i=a.findIndex(o=>o&&o.id===sid);if(i>=0){const old=a[i];const next={...old};if(next.cloudPhotoId!==cloud.cloudPhotoId){next.cloudPhotoId=cloud.cloudPhotoId;changed=true}if(next.cloudTeamId!==cloud.cloudTeamId){next.cloudTeamId=cloud.cloudTeamId;changed=true}if(next.cloudSyncedAt!==cloud.cloudSyncedAt){next.cloudSyncedAt=cloud.cloudSyncedAt;changed=true}if(!next.qr&&cloud.qr){next.qr=cloud.qr;changed=true}if(!(next.produzido>0)&&cloud.produzido>0){next.produzido=cloud.produzido;changed=true}if(!(next.apara>=0)&&cloud.apara>=0){next.apara=cloud.apara;changed=true}if(!next.data&&cloud.data){next.data=cloud.data;changed=true}a[i]=next}else{a.unshift({id:sid,createdAt:p.createdAt||new Date().toISOString(),updatedAt:p.updatedAt||p.createdAt||new Date().toISOString(),numero:'',operador:'',maquina:'',produto:'',largura:0,micra:0,gm:0,bobinas:0,materials:[],expectedTotal:0,reasons:[],status:'ok',manualConfirmed:true,source:'foto-equipe',...cloud});changed=true}}
    if(changed){saveJson(OPS_KEY,a);const month=$('dfOpMonth');if(month)month.dispatchEvent(new Event('change'));try{window.dispatchEvent(new CustomEvent('df-op-remote-merged'))}catch(e){}}
    return changed
  }

  function sortPhotos(photos){return [...(photos||[])].sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')))}
  function renderCloudPhotos(photos,force){const pane=$('dfPaneArchive');if(!pane)return;const list=sortPhotos(photos),hash=quickHash(list);if(!force&&hash===lastPhotosHash&&$('dfCloudPhotosBox'))return;lastPhotosHash=hash;let box=$('dfCloudPhotosBox');if(!box){box=document.createElement('div');box.id='dfCloudPhotosBox';const card=pane.querySelector('.dfOpsCard');if(card)card.insertBefore(box,card.firstChild)}box.innerHTML='<h3 style="margin:0 0 8px">☁️ Fotos da equipe</h3><div class="dfOpsTiny">Fotos enviadas por qualquer aparelho conectado à sua equipe.</div>'+(list.length?list.map(p=>'<div class="dfCloudPhotoRow"><b>'+esc(p.qr||p.sourceId||'OP')+'</b><div class="dfOpsTiny">'+esc(String(p.createdAt||'').replace('T',' ').slice(0,16))+' • Produção '+Number(p.production||0).toLocaleString('pt-BR')+' kg • Apara '+Number(p.scrap||0).toLocaleString('pt-BR')+' kg</div><div class="dfCloudPhotoBtns"><button class="dfCloudPhotoBtn" data-cloud-open="'+esc(p.id)+'">👁️ ABRIR FOTO</button><button class="dfCloudPhotoBtn" data-cloud-down="'+esc(p.id)+'">⬇️ BAIXAR</button></div></div>').join(''):'<div class="dfOpsTiny" style="margin-top:8px">Nenhuma foto da equipe neste mês.</div>');box.querySelectorAll('[data-cloud-open]').forEach(b=>b.onclick=()=>openCloud(b.dataset.cloudOpen,false));box.querySelectorAll('[data-cloud-down]').forEach(b=>b.onclick=()=>openCloud(b.dataset.cloudDown,true))}

  async function syncRemote(forceRender){if(!team||syncing||navigator.onLine===false||document.hidden)return false;syncing=true;runtimeMsg('🔄 Atualizando fotos da equipe...','');try{const j=await apiPost('/op/photo/list',{teamId:team.teamId,month:selectedMonth()});const photos=Array.isArray(j.photos)?j.photos:[];lastPhotos=photos;mergeRemote(photos);const archive=$('dfPaneArchive');if(forceRender||(archive&&archive.classList.contains('on')))renderCloudPhotos(photos,!!forceRender);runtimeMsg('✅ Fotos da equipe sincronizadas.','ok');return true}catch(e){runtimeMsg('⚠️ Não consegui atualizar agora. Vou tentar novamente.','warn');return false}finally{syncing=false}}

  async function openCloud(id,download){try{const blob=await apiBlobGet(id,download);if(download){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='OP-'+id+'.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);return}clearViewerUrl();viewerUrl=URL.createObjectURL(blob);$('dfCloudViewerBody').innerHTML='<img src="'+viewerUrl+'"><button id="dfCloudDownloadCurrent" class="dfCloudPhotoBtn" style="width:100%;margin-top:9px">⬇️ BAIXAR FOTO</button>';$('dfCloudViewer').classList.add('on');$('dfCloudDownloadCurrent').onclick=()=>openCloud(id,true)}catch(e){alert(e.message||e)}}

  async function uploadPending(){
    if(!team||uploading||navigator.onLine===false||document.hidden)return false;
    const a=loadJson(OPS_KEY,[]),rec=a.find(o=>o&&o.manualConfirmed&&o.status==='ok'&&!o.cloudPhotoId);
    if(!rec)return false;
    uploading=true;runtimeMsg('⏳ Enviando foto para a nuvem...','');
    try{
      const ph=await photoGet(rec.id);if(!ph?.blob){runtimeMsg('⚠️ A foto local desta OP não foi encontrada.','warn');return false}
      const small=await compressBlob(ph.blob),form=new FormData();
      form.append('teamId',team.teamId);form.append('sourceId',rec.id);form.append('qr',rec.qr||rec.id);form.append('production',String(+rec.produzido||0));form.append('scrap',String(+rec.apara||0));form.append('createdAt',rec.createdAt||new Date().toISOString());form.append('photo',small,'op.jpg');
      const j=await apiForm('/op/photo/upload',form),latest=loadJson(OPS_KEY,[]),i=latest.findIndex(x=>x&&x.id===rec.id);
      if(i>=0){latest[i].cloudPhotoId=j.photo?.id||'';latest[i].cloudTeamId=team.teamId;latest[i].cloudSyncedAt=new Date().toISOString();saveJson(OPS_KEY,latest)}
      runtimeMsg('✅ Foto salva na nuvem. Pode apagar da galeria.','ok');
      try{window.dispatchEvent(new CustomEvent('df-op-cloud-synced',{detail:{id:rec.id,photoId:j.photo?.id||''}}))}catch(e){}
      scheduleRemote(250,true);scheduleUpload(500);return true;
    }catch(e){runtimeMsg('⚠️ Foto aguardando envio. Não apague ainda.','warn');return false}
    finally{uploading=false}
  }
  function scheduleUpload(ms){clearTimeout(uploadTimer);uploadTimer=setTimeout(uploadPending,ms||250)}
  function scheduleRemote(ms,force){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncRemote(!!force),ms||400)}

  function interceptRemoteOpen(){document.addEventListener('click',function(e){const b=e.target?.closest?.('[data-view]');if(!b)return;const id=b.dataset.view,rec=loadJson(OPS_KEY,[]).find(o=>o&&o.id===id);if(!rec?.cloudPhotoId)return;photoGet(id).then(local=>{if(local?.blob)return;e.preventDefault();e.stopImmediatePropagation();openCloud(rec.cloudPhotoId,false)}).catch(()=>{})},true)}

  function boot(){
    team=loadJson(TEAM_KEY,null);
    let n=0;const t=setInterval(()=>{if(mountTeam()||++n>24)clearInterval(t)},250);
    setTimeout(()=>{mountTeam();loadTeam()},700);
    interceptRemoteOpen();
    window.addEventListener('df-op-saved',()=>scheduleUpload(120));
    window.addEventListener('online',()=>{scheduleUpload(180);scheduleRemote(300,true)});
    window.addEventListener('offline',()=>runtimeMsg('📴 Sem internet. As fotos aguardam conexão.','warn'));
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>{mountTeam();if(team)scheduleRemote(250,false)},180));
    document.addEventListener('change',e=>{if(e.target?.id==='dfOpMonth'&&team)scheduleRemote(80,true)});
    document.addEventListener('click',e=>{const p=e.target?.closest?.('[data-pane="archive"]');if(p){renderCloudPhotos(lastPhotos,true);if(team)scheduleRemote(80,true)}},true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&team){scheduleUpload(180);scheduleRemote(350,false)}});
    setInterval(()=>{if(!document.hidden&&team){scheduleUpload(100);scheduleRemote(300,false)}},30000);
  }

  window.DFOpCloud={sync:(force)=>syncRemote(!!force),uploadPending,team:()=>team,openPhoto:openCloud};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();