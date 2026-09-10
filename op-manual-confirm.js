(function(){
  'use strict';

  const KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const DB='df_ops_fotos_v2';
  let currentFile=null,currentQr='',currentId='',busy=false;

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const today=()=>new Date().toISOString().slice(0,10);
  function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return NaN;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:NaN}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function registry(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'{}')}catch(e){return{}}}
  function expectedFor(id){return registry()[id]?.expected||null}
  function buildMaterials(exp,produzido){return (exp?.materials||[]).map(m=>({name:m.name,pct:+m.pct||0,kg:produzido>0?produzido*(+m.pct||0)/100:0}))}

  function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function photoPut(id,blob,meta={}){const d=await dbOpen();return new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').put({id,blob,mime:blob.type||'image/jpeg',savedAt:new Date().toISOString(),...meta});tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}

  function ensureStyle(){
    if($('dfManualConfirmStyle'))return;
    const s=document.createElement('style');s.id='dfManualConfirmStyle';s.textContent=`
      #dfManualConfirm{margin-top:12px;border:1px solid #f5a000;background:linear-gradient(180deg,#211400,#111827);border-radius:16px;padding:14px}
      #dfManualConfirm h3{margin:0 0 5px;color:#ffd36a;font-size:18px}
      #dfManualConfirm .mcSub{color:#cbd5e1;font-size:12px;line-height:1.45;margin-bottom:10px}
      #dfManualConfirm .mcQr{border:1px solid #334155;background:#0f172a;border-radius:11px;padding:9px 10px;margin-bottom:10px;color:#86efac;font-size:11px;word-break:break-all;font-weight:850}
      #dfManualConfirm .mcGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      #dfManualConfirm label{display:block;color:#cbd5e1;font-size:11px;font-weight:850;margin-bottom:5px}
      #dfManualConfirm input{width:100%;border:1px solid #475569;background:#080f1d;color:#fff;border-radius:12px;padding:13px;font-size:20px;font-weight:900;text-align:center}
      #dfManualConfirm input:focus{outline:none;border-color:#f5a000;box-shadow:0 0 0 2px #f5a00022}
      #dfManualSave{width:100%;margin-top:11px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:13px;padding:14px 10px;font-size:15px;font-weight:950}
      #dfManualCancel{width:100%;margin-top:7px;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:13px;padding:11px 10px;font-size:13px;font-weight:850}
      .dfManualBadge{margin-top:10px;border:1px solid #166534;background:#0c321c;color:#86efac;border-radius:12px;padding:10px;font-size:12px;font-weight:900}
      @media(max-width:430px){#dfManualConfirm .mcGrid{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s);
  }

  function status(t,c='warn'){
    const b=$('dfOpStatus');if(!b)return;b.className='dfOpsStatus '+c;b.innerHTML=t;
  }
  function removeForm(){const x=$('dfManualConfirm');if(x)x.remove()}
  function showForm(qr,exp){
    removeForm();
    const host=$('dfOpStatus')?.parentNode;if(!host)return;
    const box=document.createElement('div');box.id='dfManualConfirm';
    box.innerHTML=`<h3>✍️ CONFIRMAR PRODUÇÃO E APARA</h3>
      <div class="mcSub">A foto já foi arquivada. Agora digite somente os dois totais e salve.</div>
      <div class="mcQr">${qr?('✅ OP identificada: '+esc(qr)):'⚠️ QR não identificado'}${exp?.title?('<br>Produto: '+esc(exp.title)):''}</div>
      <div class="mcGrid">
        <div><label>PRODUÇÃO TOTAL (kg)</label><input id="dfManualProd" inputmode="decimal" autocomplete="off" placeholder="Ex.: 558"></div>
        <div><label>APARA TOTAL (kg)</label><input id="dfManualApara" inputmode="decimal" autocomplete="off" placeholder="Ex.: 11"></div>
      </div>
      <button id="dfManualSave" type="button">✅ SALVAR OP</button>
      <button id="dfManualCancel" type="button">↩️ TIRAR / ENVIAR OUTRA FOTO</button>`;
    const demo=host.querySelector('.dfQrDemo');host.insertBefore(box,demo||null);
    $('dfManualSave').onclick=saveManual;
    $('dfManualCancel').onclick=()=>{removeForm();currentFile=null;currentQr='';currentId='';const input=$('dfOpPhoto');if(input){try{input.value=''}catch(e){}}status('Escolha ou tire outra foto.','')};
    setTimeout(()=>$('dfManualProd')?.focus(),120);
  }

  function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;const sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,s=1){x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));const c=mk(w*s,h*s),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function imageCanvas(file,max=2200){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height)),c=mk(img.width*scale,img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function loadQR(){return new Promise((resolve,reject)=>{if(window.jsQR)return resolve();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar leitor QR'));document.head.appendChild(s)})}
  function scanCanvas(c){try{const x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r?.data||''}catch(e){return''}}
  async function decodeQR(file){
    await loadQR();const base=await imageCanvas(file,2400);
    for(const deg of [0,90,180,270]){
      const c=rot(base,deg),tries=[c,crop(c,0,0,c.width,c.height*.58,2),crop(c,c.width*.15,0,c.width*.70,c.height*.62,2.4),crop(c,0,0,c.width*.70,c.height*.72,2),crop(c,c.width*.30,0,c.width*.70,c.height*.72,2)];
      for(const t of tries){const q=scanCanvas(t);if(q&&/^DFOP-/i.test(q))return q;}
    }
    return'';
  }

  async function handlePhoto(file){
    if(!file||busy)return;busy=true;currentFile=file;removeForm();
    const preview=$('dfOpPreview');if(preview){preview.src=URL.createObjectURL(file);preview.style.display='block'}
    status('📷 Foto recebida. Identificando o QR da OP...','warn');
    try{
      currentQr=await decodeQR(file);
      currentId=currentQr||('SEMQR-'+Date.now());
      await photoPut(currentId,file,{qr:currentQr||'',month:today().slice(0,7),manualPending:true});
      const exp=currentQr?expectedFor(currentQr):null;
      if(currentQr){
        status('✅ <b>OP identificada.</b> Foto arquivada.<br>Digite a produção total e a apara total abaixo.','ok');
      }else{
        status('⚠️ Foto arquivada, mas o QR não foi identificado. Você pode digitar os totais, porém a OP ficará como pendente até identificar o QR.','warn');
      }
      showForm(currentQr,exp);
    }catch(err){status('❌ Não consegui preparar a OP: '+esc(err.message||err),'bad')}
    finally{busy=false}
  }

  function upsert(rec){const a=load(),i=a.findIndex(x=>x.id===rec.id);if(i>=0)a[i]=rec;else a.unshift(rec);save(a)}
  async function saveManual(){
    const prod=num($('dfManualProd')?.value),ap=num($('dfManualApara')?.value);
    if(!(prod>0)){alert('Digite a PRODUÇÃO TOTAL em kg.');$('dfManualProd')?.focus();return}
    if(!Number.isFinite(ap)||ap<0){alert('Digite a APARA TOTAL em kg. Pode ser 0.');$('dfManualApara')?.focus();return}
    if(ap>prod){alert('A apara não pode ser maior que a produção. Confira os valores.');return}
    const exp=currentQr?expectedFor(currentQr):null;
    const old=load().find(x=>x.id===currentId)||{};
    const reasons=currentQr?[]:['QR da OP não foi identificado'];
    const rec={...old,id:currentId,qr:currentQr||'',createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),data:old.data||today(),numero:old.numero||'',operador:old.operador||'',maquina:old.maquina||'',produto:exp?.title||old.produto||'',largura:+exp?.largura||old.largura||0,micra:+exp?.micra||old.micra||0,gm:+exp?.gm||old.gm||0,produzido:prod,apara:ap,bobinas:old.bobinas||0,materials:buildMaterials(exp,prod),expectedTotal:+exp?.totalKg||old.expectedTotal||0,ocrConfidence:100,status:reasons.length?'pending':'ok',reasons,manualConfirmed:true,manualConfirmedAt:new Date().toISOString(),source:'foto+confirmacao-manual'};
    upsert(rec);
    try{await photoPut(currentId,currentFile,{qr:currentQr||'',month:today().slice(0,7),manualPending:false,produzido:prod,apara:ap})}catch(e){}
    status('✅ <b>OP SALVA.</b><br>Produção total: <b>'+prod.toLocaleString('pt-BR')+' kg</b><br>Apara total: <b>'+ap.toLocaleString('pt-BR')+' kg</b>','ok');
    removeForm();
    const host=$('dfOpStatus')?.parentNode;if(host){const d=document.createElement('div');d.className='dfManualBadge';d.innerHTML='✅ Foto + produção + apara vinculados à '+esc(currentQr||currentId);host.insertBefore(d,host.querySelector('.dfQrDemo')||null)}
    const input=$('dfOpPhoto');if(input){try{input.value=''}catch(e){}}
    try{sessionStorage.setItem('df_op_manual_saved','1')}catch(e){}
    setTimeout(()=>{try{location.reload()}catch(e){}},900);
  }

  function install(){
    ensureStyle();
    const input=$('dfOpPhoto');if(!input)return false;
    if(input.dataset.dfManualConfirm==='1')return true;
    input.dataset.dfManualConfirm='1';
    document.addEventListener('change',function onManualPhoto(e){
      if(e.target!==input)return;
      e.preventDefault();e.stopImmediatePropagation();
      const f=input.files?.[0];if(f)handlePhoto(f);
    },true);
    const take=$('dfOpTakePhoto');if(take)take.textContent='📷 TIRAR FOTO DE LADO';
    const hero=document.querySelector('.dfOpsHero p');if(hero)hero.textContent='Fotografe a OP, confirme manualmente somente PRODUÇÃO TOTAL e APARA TOTAL e salve. A foto fica vinculada ao QR da OP.';
    const demo=document.querySelector('.dfQrDemo');if(demo)demo.innerHTML='✅ Fluxo simples: <b>foto → QR → digitar produção + apara → SALVAR OP.</b> Sem depender da leitura automática da caneta.';
    try{if(sessionStorage.getItem('df_op_manual_saved')==='1'){sessionStorage.removeItem('df_op_manual_saved');setTimeout(()=>{document.getElementById('dfFormTabOps')?.click();setTimeout(()=>document.querySelector('[data-pane="ok"]')?.click(),250)},300)}}catch(e){}
    return true;
  }

  function boot(){if(install())return;const root=document.body||document.documentElement;if(!root)return;const obs=new MutationObserver(()=>{if(install())obs.disconnect()});obs.observe(root,{childList:true,subtree:true});setTimeout(()=>{if(install())obs.disconnect()},800);setTimeout(()=>{if(install())obs.disconnect()},1800);setTimeout(()=>{if(install())obs.disconnect()},3500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(install,180));
})();
