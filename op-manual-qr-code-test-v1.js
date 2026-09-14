(function(){
  'use strict';
  if(window.DFManualQrCodeTestV1)return;
  window.DFManualQrCodeTestV1=true;

  const KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const DB='df_ops_fotos_v2';
  const $=id=>document.getElementById(id);

  function registry(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'{}')}catch(e){return{}}}
  function loadOps(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function saveOps(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function norm(v){return String(v||'').trim().toUpperCase()}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function addStyle(){
    if($('dfManualQrCodeTestV1Style'))return;
    const s=document.createElement('style');
    s.id='dfManualQrCodeTestV1Style';
    s.textContent=`
      #dfManualQrFallback{margin:10px 0 2px;border:1px dashed #f5a000;background:#16110a;border-radius:12px;padding:11px}
      #dfManualQrFallback label{display:block;color:#ffd36a;font-size:11px;font-weight:900;margin-bottom:6px}
      #dfManualQrFallback input{width:100%;border:1px solid #475569;background:#080f1d;color:#fff;border-radius:11px;padding:12px 10px;font-size:15px;font-weight:900;text-align:center;text-transform:uppercase}
      #dfManualQrFallback small{display:block;color:#94a3b8;font-size:10px;line-height:1.35;margin-top:6px}
      #dfManualQrFallback .ok{color:#86efac}
      #dfManualQrFallback .bad{color:#fca5a5}
    `;
    document.head.appendChild(s);
  }

  function manualNeeded(form){
    const qr=form&&form.querySelector('.mcQr');
    return !!(qr&&/QR\s+n[aã]o\s+identificado/i.test(qr.textContent||''));
  }

  function validateCode(showMsg=true){
    const input=$('dfManualQrCode');
    const msg=$('dfManualQrMsg');
    if(!input)return {ok:false,code:''};
    const code=norm(input.value);
    const reg=registry();
    const found=!!reg[code];
    if(msg&&showMsg){
      if(!code){msg.textContent='Digite o código impresso abaixo do QR Code.';msg.className='bad'}
      else if(!/^DFOP-/i.test(code)){msg.textContent='Código inválido. O código da OP começa com DFOP-.';msg.className='bad'}
      else if(!found){msg.textContent='Esse código não foi encontrado nas OPs deste aparelho.';msg.className='bad'}
      else{msg.textContent='✅ OP encontrada: '+code;msg.className='ok'}
    }
    return {ok:found&&/^DFOP-/i.test(code),code,entry:reg[code]||null};
  }

  function injectField(form){
    if(!form||form.querySelector('#dfManualQrFallback')||!manualNeeded(form))return;
    addStyle();
    const qr=form.querySelector('.mcQr');
    const box=document.createElement('div');
    box.id='dfManualQrFallback';
    box.innerHTML=`<label>DIGITAR CÓDIGO DO QR / OP</label>
      <input id="dfManualQrCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ex.: DFOP-20260914-123456-ABCD">
      <small>Use esta opção somente quando a câmera não conseguir ler o QR. Digite exatamente o código que aparece impresso abaixo do QR Code.</small>
      <small id="dfManualQrMsg"></small>`;
    qr.insertAdjacentElement('afterend',box);
    const input=$('dfManualQrCode');
    input?.addEventListener('input',()=>validateCode(false));
    input?.addEventListener('change',()=>validateCode(true));
    input?.addEventListener('blur',()=>validateCode(true));
  }

  function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function latestPendingPhoto(){
    try{
      const d=await dbOpen();
      return await new Promise((resolve,reject)=>{
        const tx=d.transaction('photos','readonly'),st=tx.objectStore('photos'),rq=st.openCursor();
        let best=null;
        rq.onsuccess=()=>{const c=rq.result;if(!c)return resolve(best);const v=c.value||{};if(v.manualPending===true&&(!best||String(v.savedAt||'')>String(best.savedAt||'')))best=v;c.continue()};
        rq.onerror=()=>reject(rq.error);
      });
    }catch(e){return null}
  }

  async function duplicatePhotoToQr(code,prod,apara){
    const src=await latestPendingPhoto();
    if(!src||!src.blob)return;
    try{
      const d=await dbOpen();
      await new Promise((resolve,reject)=>{
        const tx=d.transaction('photos','readwrite'),st=tx.objectStore('photos');
        st.put({...src,id:code,qr:code,manualPending:false,produzido:prod,apara:apara,savedAt:new Date().toISOString()});
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
    }catch(e){}
  }

  async function convertLatestPending(code,entry){
    const ops=loadOps();
    const idx=ops.findIndex(x=>String(x&&x.id||'').startsWith('SEMQR-')&&x&&x.manualConfirmed===true);
    if(idx<0)return false;
    const rec=ops[idx];
    const exp=entry&&entry.expected||{};
    rec.id=code;
    rec.qr=code;
    rec.status='ok';
    rec.reasons=[];
    rec.produto=exp.title||rec.produto||'';
    rec.largura=+exp.largura||rec.largura||0;
    rec.micra=+exp.micra||rec.micra||0;
    rec.gm=+exp.gm||rec.gm||0;
    rec.expectedTotal=+exp.totalKg||rec.expectedTotal||0;
    rec.source='foto+codigo-qr-manual+confirmacao-manual';
    rec.updatedAt=new Date().toISOString();
    if(Array.isArray(exp.materials)&&rec.produzido>0){rec.materials=exp.materials.map(m=>({name:m.name,pct:+m.pct||0,kg:rec.produzido*(+m.pct||0)/100}))}
    ops.splice(idx,1);
    const existing=ops.findIndex(x=>x.id===code);
    if(existing>=0)ops[existing]={...ops[existing],...rec};else ops.unshift(rec);
    saveOps(ops);
    await duplicatePhotoToQr(code,rec.produzido||0,rec.apara||0);
    return true;
  }

  function hookSave(form){
    const btn=form&&form.querySelector('#dfManualSave');
    if(!btn||btn.dataset.dfManualQrHook==='1')return;
    btn.dataset.dfManualQrHook='1';
    btn.addEventListener('click',function(e){
      const field=$('dfManualQrCode');
      if(!field)return;
      const v=validateCode(true);
      if(!v.ok){e.preventDefault();e.stopImmediatePropagation();field.focus();return;}
      sessionStorage.setItem('df_manual_qr_override_v1',JSON.stringify({code:v.code,at:Date.now()}));
      setTimeout(async()=>{await convertLatestPending(v.code,v.entry)},80);
      setTimeout(async()=>{await convertLatestPending(v.code,v.entry)},350);
    },true);
  }

  function scan(){
    const form=$('dfManualConfirm');
    if(!form)return;
    injectField(form);
    hookSave(form);
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(scan));
  function start(){addStyle();scan();const root=document.body||document.documentElement;if(root)obs.observe(root,{childList:true,subtree:true});setInterval(scan,700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',()=>setTimeout(scan,250));
})();
