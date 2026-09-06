(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const LICENSE_KEY='df_licenseauth_license_v1';
  const LAST_KEY='df_cloud_last_backup_v1';
  const PENDING_KEY='df_cloud_pending_v1';
  const DATA_KEYS=[
    'df_formula_materiais_v2',
    'df_formulacoes_v2',
    'df_vendedor_whats_num_v1',
    'df_vendedor_whats_auto_v1',
    'df_vendedor_pdf_auto_prof_v1',
    'df_vendedor_pdf_auto_v1'
  ];
  let busy=false,lastHash='',serverReady=null;

  function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function unb64(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
  function quickHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
  function fmtDate(v){if(!v)return'Nunca';try{return new Date(v).toLocaleString('pt-BR')}catch(e){return String(v)}}
  function setStatus(text,type=''){const e=document.getElementById('dfCloudStatus');if(!e)return;e.textContent=text;e.className='dfCloudStatus '+type}

  function syncVisibleFields(){
    try{if(typeof window.dfGetVendedorWhats==='function')window.dfGetVendedorWhats()}catch(e){}
    const n=document.getElementById('foVendWhats');if(n&&n.value){try{let d=String(n.value).replace(/\D/g,'');if(d.length===10||d.length===11)d='55'+d;if(d)localStorage.setItem('df_vendedor_whats_num_v1',d)}catch(e){}}
  }
  function snapshot(){
    syncVisibleFields();
    const data={};
    for(const k of DATA_KEYS){const v=localStorage.getItem(k);if(v!==null)data[k]=v}
    return{v:1,createdAt:new Date().toISOString(),origin:location.origin,data};
  }
  function snapshotHash(){return quickHash(JSON.stringify(snapshot().data))}

  async function deriveKey(license){
    const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v1|'+license));
    return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
  }
  async function encrypt(data,license){
    const key=await deriveKey(license),iv=crypto.getRandomValues(new Uint8Array(12));
    const plain=new TextEncoder().encode(JSON.stringify(data));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);
    return{v:1,alg:'A256GCM',iv:b64(iv),ct:b64(new Uint8Array(ct))};
  }
  async function decrypt(env,license){
    if(!env||env.alg!=='A256GCM')throw new Error('Formato de backup inválido.');
    const key=await deriveKey(license),iv=unb64(env.iv),ct=unb64(env.ct);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  async function apiPost(path,body,retry=true){
    const token=sessionStorage.getItem(TOKEN_KEY)||'';
    const device=localStorage.getItem(DEVICE_KEY)||'';
    if(!token||!device){const e=new Error('Sessão ausente.');e.status=401;throw e}
    let r;
    try{r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':device},body:JSON.stringify(body||{}),cache:'no-store'})}
    catch(e){e.network=true;throw e}
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false){
      if(r.status===401&&retry){
        const lic=localStorage.getItem(LICENSE_KEY)||'';
        if(lic&&typeof window.dfLicenseAuthLogin==='function'&&await window.dfLicenseAuthLogin(lic,true))return apiPost(path,body,false);
      }
      const e=new Error(j.error||('Erro HTTP '+r.status));e.status=r.status;e.detail=j.detail||'';throw e;
    }
    return j;
  }

  function markPending(){try{localStorage.setItem(PENDING_KEY,'1')}catch(e){};updateCard()}
  function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(e){}}
  function lastBackup(){return localStorage.getItem(LAST_KEY)||''}

  async function saveNow(){
    if(busy)return false;
    if(navigator.onLine===false){markPending();setStatus('Sem internet. Backup ficou na fila e será enviado automaticamente quando voltar.','warn');return false}
    const license=localStorage.getItem(LICENSE_KEY)||'';
    if(!license){setStatus('Entre com sua licença para ativar o backup na nuvem.','warn');return false}
    busy=true;toggleButtons(true);setStatus('Enviando backup criptografado...','');
    try{
      const snap=snapshot();
      const envelope=await encrypt(snap,license);
      const j=await apiPost('/backup/save',{backup:envelope,clientTime:snap.createdAt});
      serverReady=true;
      const when=j.updatedAt||new Date().toISOString();
      localStorage.setItem(LAST_KEY,when);clearPending();lastHash=snapshotHash();
      setStatus('Backup automático ativo • último: '+fmtDate(when),'ok');
      return true;
    }catch(e){
      if(e.status===404||/D1|DB|backup/i.test(String(e.message||'')+' '+String(e.detail||''))){serverReady=false;setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn')}
      else if(e.network){markPending();setStatus('Sem conexão com o servidor. Backup ficou na fila.','warn')}
      else setStatus('Não foi possível salvar o backup: '+String(e.message||e),'bad');
      return false;
    }finally{busy=false;toggleButtons(false);updateCard()}
  }

  async function restore(){
    if(busy)return;
    if(navigator.onLine===false){setStatus('Para restaurar da nuvem, conecte o aparelho à internet.','warn');return}
    const license=localStorage.getItem(LICENSE_KEY)||'';
    if(!license){setStatus('Entre com sua licença antes de restaurar.','warn');return}
    if(!confirm('Restaurar o backup da nuvem neste aparelho? Os materiais e formulações atuais serão substituídos pelos dados do backup.'))return;
    busy=true;toggleButtons(true);setStatus('Buscando backup na nuvem...','');
    try{
      const j=await apiPost('/backup/load',{});
      serverReady=true;
      if(!j.backup){setStatus('Ainda não existe backup salvo nesta licença.','warn');return}
      const snap=await decrypt(j.backup,license);
      if(!snap||!snap.data)throw new Error('Backup vazio ou inválido.');
      for(const k of DATA_KEYS){if(Object.prototype.hasOwnProperty.call(snap.data,k))localStorage.setItem(k,String(snap.data[k]));else localStorage.removeItem(k)}
      localStorage.setItem(LAST_KEY,j.updatedAt||snap.createdAt||new Date().toISOString());clearPending();
      setStatus('Backup restaurado. Reabrindo o app...','ok');
      setTimeout(()=>location.reload(),700);
    }catch(e){
      if(e.status===404||/D1|DB|backup/i.test(String(e.message||'')+' '+String(e.detail||''))){serverReady=false;setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn')}
      else if(e.name==='OperationError')setStatus('Não foi possível descriptografar o backup com esta licença.','bad');
      else setStatus('Não foi possível restaurar: '+String(e.message||e),'bad');
    }finally{busy=false;toggleButtons(false);updateCard()}
  }

  function toggleButtons(dis){['dfCloudSave','dfCloudRestore'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!!dis})}
  function addStyle(){
    if(document.getElementById('dfCloudStyle'))return;
    const s=document.createElement('style');s.id='dfCloudStyle';
    s.textContent='.dfCloudCard{border-color:#1d4ed8!important;background:linear-gradient(180deg,#101827,#07101f)!important}.dfCloudHead{display:flex;justify-content:space-between;align-items:center;gap:10px}.dfCloudPill{border:1px solid #2563eb;background:#0b1d3a;color:#bfdbfe;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900}.dfCloudGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.dfCloudBtn{border:1px solid #2563eb;background:#0b1d3a;color:#dbeafe;border-radius:12px;padding:11px 9px;font-weight:900;cursor:pointer}.dfCloudBtn.restore{border-color:#475569;background:#0f172a;color:#e2e8f0}.dfCloudBtn:disabled{opacity:.55}.dfCloudStatus{margin-top:11px;font-size:12px;color:#94a3b8;line-height:1.4}.dfCloudStatus.ok{color:#86efac}.dfCloudStatus.warn{color:#fbbf24}.dfCloudStatus.bad{color:#fca5a5}.dfCloudMeta{margin-top:8px;color:#64748b;font-size:10px}@media(max-width:560px){.dfCloudGrid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function ensureCard(){
    addStyle();
    const pg=document.getElementById('pgFo');if(!pg||document.getElementById('dfCloudBackupCard'))return;
    const card=document.createElement('div');card.className='card dfCloudCard';card.id='dfCloudBackupCard';
    card.innerHTML='<div class="dfCloudHead"><div><span class="tag">Nuvem</span><h2 style="margin-bottom:4px">☁ Backup na nuvem</h2></div><span class="dfCloudPill">CRIPTOGRAFADO</span></div><div class="hint">Salva materiais, formulações, WhatsApp cadastrado e preferências. A licença e o ID do aparelho não são enviados no backup.</div><div class="dfCloudGrid"><button id="dfCloudSave" class="dfCloudBtn" type="button">FAZER BACKUP AGORA</button><button id="dfCloudRestore" class="dfCloudBtn restore" type="button">RESTAURAR BACKUP</button></div><div id="dfCloudStatus" class="dfCloudStatus">Preparando backup...</div><div class="dfCloudMeta">Backup automático: alterações ficam na fila offline e sincronizam quando a internet voltar.</div>';
    const vendor=document.getElementById('dfVendedorCard'),contact=document.getElementById('dfContact_pgFo');
    if(vendor&&vendor.parentNode)vendor.parentNode.insertBefore(card,vendor);
    else if(contact&&contact.parentNode)contact.parentNode.insertBefore(card,contact);
    else pg.insertBefore(card,pg.firstChild);
    document.getElementById('dfCloudSave').onclick=()=>saveNow();
    document.getElementById('dfCloudRestore').onclick=restore;
    updateCard();
  }
  function updateCard(){
    const e=document.getElementById('dfCloudStatus');if(!e)return;
    if(navigator.onLine===false){setStatus('Modo offline: alterações protegidas neste aparelho e aguardando sincronização.','warn');return}
    if(serverReady===false){setStatus('Nuvem preparada no app. Falta ativar o banco D1 no servidor Cloudflare.','warn');return}
    const last=lastBackup(),pending=localStorage.getItem(PENDING_KEY)==='1';
    if(pending)setStatus('Há alterações aguardando envio para a nuvem.','warn');
    else if(last)setStatus('Backup automático ativo • último: '+fmtDate(last),'ok');
    else setStatus('Pronto para fazer o primeiro backup na nuvem.','');
  }

  function detectChanges(){
    const h=snapshotHash();
    if(!lastHash){lastHash=h;return}
    if(h!==lastHash){lastHash=h;markPending();if(navigator.onLine!==false)setTimeout(()=>saveNow(),1200)}
  }
  async function sync(){
    ensureCard();
    if(navigator.onLine===false){updateCard();return false}
    if(localStorage.getItem(PENDING_KEY)==='1')return saveNow();
    return false;
  }

  window.dfBackupSync=sync;
  window.dfBackupNow=saveNow;
  window.dfBackupRestore=restore;
  window.addEventListener('online',()=>setTimeout(sync,700));
  window.addEventListener('df-network-state',e=>{if(e.detail&&e.detail.online)setTimeout(sync,700);else updateCard()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(ensureCard,700);setTimeout(()=>{lastHash=snapshotHash();if(!lastBackup())markPending();sync()},2500)});
  else{setTimeout(ensureCard,700);setTimeout(()=>{lastHash=snapshotHash();if(!lastBackup())markPending();sync()},2500)}
  setInterval(ensureCard,1500);setInterval(detectChanges,12000);setInterval(sync,60000);
})();
