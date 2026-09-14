(function(){
  'use strict';
  if(window.DFProductionNowOpScanTestV1)return;
  window.DFProductionNowOpScanTestV1=true;

  var REG_KEY='df_op_qr_registry_v1';
  var timer=0,busy=false;
  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function registry(){try{var r=JSON.parse(localStorage.getItem(REG_KEY)||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function findEntry(code){var c=normalize(code),r=registry(),keys=Object.keys(r);for(var i=0;i<keys.length;i++){var x=r[keys[i]],id=normalize((x&&x.id)||keys[i]);if(id===c)return x||{id:keys[i]}}return null}
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}

  function style(){
    if($('dfNowOpScanTestStyle'))return;
    var s=document.createElement('style');s.id='dfNowOpScanTestStyle';s.textContent=
      '#dfNowOpScanTools{margin-top:8px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:9px}'+
      '#dfNowOpScanTools .dfNowOpToolBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px}'+
      '#dfNowOpScanTools button{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}'+
      '#dfNowOpManualRow{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:8px}'+
      '#dfNowOpManualCode{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:13px;text-transform:uppercase}'+
      '#dfNowOpLookupMsg{margin-top:7px;color:#94a3b8;font-size:10px;line-height:1.4}'+
      '#dfNowOpLookupMsg.ok{color:#86efac}#dfNowOpLookupMsg.warn{color:#fde68a}#dfNowOpLookupMsg.bad{color:#fca5a5}'+
      '@media(max-width:430px){#dfNowOpScanTools .dfNowOpToolBtns{grid-template-columns:1fr}#dfNowOpManualRow{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function msg(t,c){var e=$('dfNowOpLookupMsg');if(!e)return;e.textContent=t||'';e.className=c||''}

  function selectEntry(entry,source){
    if(!entry)return false;
    var id=String(entry.id||'').trim(),sel=$('dfNowOpSelect');if(!id||!sel)return false;
    var exists=false;Array.prototype.forEach.call(sel.options,function(o){if(o.value===id)exists=true});
    if(!exists){var exp=entry.expected||{},opt=document.createElement('option');opt.value=id;opt.textContent=(exp.title||'OP encontrada')+' — '+id;sel.appendChild(opt)}
    sel.value=id;
    try{sel.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){if(typeof sel.onchange==='function')sel.onchange()}
    var exp=entry.expected||{};
    msg('✅ OP '+id+' encontrada'+(exp.title?' • '+exp.title:'')+(source?' pelo '+source:''), 'ok');
    return true;
  }
  function lookup(raw,source){
    var code=normalize(raw);if(!code){msg('Digite ou leia o código da OP.','warn');return false}
    if(!validCode(code)){msg('Código inválido. Use o código DFOP impresso na OP.','bad');return false}
    var entry=findEntry(code);
    if(!entry){msg('⚠️ Código lido, mas essa OP ainda não está cadastrada neste aparelho.','warn');return false}
    return selectEntry(entry,source);
  }

  function loadQR(){return new Promise(function(resolve,reject){if(window.jsQR)return resolve();var old=document.querySelector('script[data-df-now-jsqr="1"]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',function(){reject(new Error('Falha ao carregar leitor QR'))},{once:true});return}var s=document.createElement('script');s.dataset.dfNowJsqr='1';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=function(){reject(new Error('Falha ao carregar leitor QR'))};document.head.appendChild(s)})}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file,max){max=max||2200;return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var scale=Math.min(1,max/Math.max(img.width,img.height)),c=mk(img.width*scale,img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;var sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function scanCanvas(c){try{var x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function decode(file){await loadQR();var base=await imageCanvas(file,2400),degs=[0,90,180,270];for(var i=0;i<degs.length;i++){var q=scanCanvas(rot(base,degs[i]));if(q&&validCode(q))return q}return''}
  async function handleFile(file){if(!file||busy)return;busy=true;msg('📷 Lendo QR da OP...','warn');try{var q=await decode(file);if(!q){msg('Não consegui ler o QR. Aproxime mais a câmera ou use DIGITAR CÓDIGO.','bad');return}var manual=$('dfNowOpManualCode');if(manual)manual.value=normalize(q);lookup(q,'QR')}catch(e){msg('Não consegui ler o QR: '+String(e&&e.message||e),'bad')}finally{busy=false;var input=$('dfNowOpQrFile');if(input)try{input.value=''}catch(e){}}}

  function mount(){
    var form=$('dfNowAdminForm'),sel=$('dfNowOpSelect');if(!form||!sel)return false;
    style();
    var old=$('dfNowOpScanTools');if(old&&form.contains(old))return true;if(old)old.remove();
    var host=sel.parentNode;if(!host)return false;
    var box=document.createElement('div');box.id='dfNowOpScanTools';
    box.innerHTML='<div class="dfNowOpToolBtns"><button id="dfNowOpScanBtn" type="button">📷 LER QR DA OP</button><button id="dfNowOpTypeBtn" type="button">⌨️ DIGITAR CÓDIGO</button></div><div id="dfNowOpManualRow" style="display:none"><input id="dfNowOpManualCode" autocomplete="off" autocapitalize="characters" placeholder="Ex.: DFOP-20260914-..."><button id="dfNowOpFindBtn" type="button">🔎 BUSCAR</button></div><input id="dfNowOpQrFile" type="file" accept="image/*" capture="environment" style="display:none"><div id="dfNowOpLookupMsg">Você pode selecionar na lista, ler o QR ou digitar o código da OP.</div>';
    host.appendChild(box);
    $('dfNowOpScanBtn').onclick=function(){$('dfNowOpQrFile').click()};
    $('dfNowOpTypeBtn').onclick=function(){var r=$('dfNowOpManualRow');r.style.display=r.style.display==='none'?'grid':'none';if(r.style.display!=='none')setTimeout(function(){$('dfNowOpManualCode').focus()},60)};
    $('dfNowOpFindBtn').onclick=function(){lookup($('dfNowOpManualCode').value,'código digitado')};
    $('dfNowOpManualCode').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();lookup(e.target.value,'código digitado')}});
    $('dfNowOpQrFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)handleFile(f)});
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(mount,80)}
  function boot(){schedule();var mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfNowTab,[data-pane="now"]'):null;if(t)setTimeout(schedule,120)},true);setTimeout(schedule,700);setTimeout(schedule,1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
