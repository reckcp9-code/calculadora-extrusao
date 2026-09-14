(function(){
  'use strict';
  if(window.DFProductionNowOpScanTestV2)return;
  window.DFProductionNowOpScanTestV2=true;

  var REG_KEY='df_op_qr_registry_v1';
  var timer=0,busy=false;
  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function registry(){try{var r=JSON.parse(localStorage.getItem(REG_KEY)||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}
  function findEntry(code){var c=normalize(code),r=registry(),keys=Object.keys(r);for(var i=0;i<keys.length;i++){var x=r[keys[i]],id=normalize((x&&x.id)||keys[i]);if(id===c){if(x&&!x.id)x.id=keys[i];return x||{id:keys[i]}}}return null}

  function style(){
    if($('dfNowOpScanOnlyStyle'))return;
    var s=document.createElement('style');s.id='dfNowOpScanOnlyStyle';s.textContent=
      '#dfNowOpSelect{display:none!important}#dfNowOpInfo{display:none!important}'+
      '#dfNowOpScanOnly{margin-top:8px;border:1px solid #334155;background:#0b1220;border-radius:13px;padding:10px}'+
      '#dfNowOpScanOnly .opBtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
      '#dfNowOpScanOnly button{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:11px;font-size:12px;font-weight:900}'+
      '#dfNowOpManualOnly{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}'+
      '#dfNowOpManualInput{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:11px;font-size:13px;text-transform:uppercase}'+
      '#dfNowOpSelected{margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:9px;color:#93c5fd;font-size:11px;line-height:1.45}'+
      '#dfNowOpSelected.ok{border-color:#166534;color:#86efac}#dfNowOpSelected.bad{border-color:#7f1d1d;color:#fca5a5}#dfNowOpSelected.warn{border-color:#a16207;color:#fde68a}'+
      '@media(max-width:430px){#dfNowOpScanOnly .opBtns{grid-template-columns:1fr}#dfNowOpManualOnly{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function msg(text,cls){var e=$('dfNowOpSelected');if(!e)return;e.className=cls||'';e.innerHTML=text||''}

  function choose(entry,source){
    if(!entry)return false;
    var id=String(entry.id||'').trim(),sel=$('dfNowOpSelect');if(!id||!sel)return false;
    var found=false;Array.prototype.forEach.call(sel.options,function(o){if(o.value===id)found=true});
    if(!found){var exp=entry.expected||{},o=document.createElement('option');o.value=id;o.textContent=(exp.title||'OP encontrada')+' — '+id;sel.appendChild(o)}
    sel.value=id;
    try{sel.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){try{if(typeof sel.onchange==='function')sel.onchange()}catch(_){} }
    var exp=entry.expected||{};
    msg('✅ <b>OP identificada:</b> '+esc(id)+(exp.title?'<br><b>Produto:</b> '+esc(exp.title):'')+(source?'<br><span style="color:#94a3b8">Origem: '+esc(source)+'</span>':''),'ok');
    return true;
  }
  function lookup(raw,source){
    var code=normalize(raw);if(!code){msg('Digite ou leia o código da OP.','warn');return false}
    if(!validCode(code)){msg('Código inválido. Use o código DFOP impresso na OP.','bad');return false}
    var entry=findEntry(code);
    if(!entry){msg('⚠️ Essa OP não foi encontrada neste aparelho. Confira o código ou leia novamente o QR.','warn');return false}
    return choose(entry,source);
  }

  function loadQR(){return new Promise(function(resolve,reject){if(window.jsQR)return resolve();var old=document.querySelector('script[data-df-now-jsqr="2"]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',function(){reject(new Error('Falha ao carregar leitor QR'))},{once:true});return}var s=document.createElement('script');s.dataset.dfNowJsqr='2';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=function(){reject(new Error('Falha ao carregar leitor QR'))};document.head.appendChild(s)})}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file,max){return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var scale=Math.min(1,(max||2400)/Math.max(img.width,img.height)),c=mk(img.width*scale,img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;var sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,scale){x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));var c=mk(w*(scale||1),h*(scale||1)),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function scanCanvas(c){try{var x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function decodeQR(file){
    await loadQR();var base=await imageCanvas(file,2400),degs=[0,90,180,270];
    for(var i=0;i<degs.length;i++){
      var c=rot(base,degs[i]),tries=[c,crop(c,0,0,c.width,c.height*.58,2),crop(c,c.width*.15,0,c.width*.70,c.height*.62,2.4),crop(c,0,0,c.width*.70,c.height*.72,2),crop(c,c.width*.30,0,c.width*.70,c.height*.72,2)];
      for(var j=0;j<tries.length;j++){var q=scanCanvas(tries[j]);if(q&&validCode(q))return normalize(q)}
    }
    return'';
  }
  async function readFile(file){
    if(!file||busy)return;busy=true;msg('📷 Lendo o QR da OP...','warn');
    try{var q=await decodeQR(file);if(!q){msg('Não consegui ler o QR. Aproxime mais a câmera e tente novamente, ou digite o código abaixo.','bad');return}var inp=$('dfNowOpManualInput');if(inp)inp.value=q;lookup(q,'QR da OP')}catch(e){msg('Não consegui ler o QR: '+esc(e&&e.message||e),'bad')}finally{busy=false;var f=$('dfNowOpQrOnlyFile');if(f)try{f.value=''}catch(e){}}
  }

  function mount(){
    var form=$('dfNowAdminForm'),sel=$('dfNowOpSelect');if(!form||!sel)return false;
    style();
    var host=sel.parentNode;if(!host)return false;
    var label=host.querySelector('label');if(label)label.textContent='IDENTIFICAR OP';
    var old=$('dfNowOpScanOnly');if(old&&host.contains(old))return true;if(old)old.remove();
    var box=document.createElement('div');box.id='dfNowOpScanOnly';
    box.innerHTML='<div class="opBtns"><button id="dfNowOpReadOnly" type="button">📷 LER QR DA OP</button><button id="dfNowOpFocusManual" type="button">⌨️ DIGITAR CÓDIGO DA OP</button></div><div id="dfNowOpManualOnly"><input id="dfNowOpManualInput" autocomplete="off" autocapitalize="characters" placeholder="DFOP-20260914-..."><button id="dfNowOpSearchOnly" type="button">🔎 BUSCAR OP</button></div><input id="dfNowOpQrOnlyFile" type="file" accept="image/*" capture="environment" style="display:none"><div id="dfNowOpSelected">Leia o QR da OP ou digite o código impresso nela.</div>';
    host.appendChild(box);
    $('dfNowOpReadOnly').onclick=function(){$('dfNowOpQrOnlyFile').click()};
    $('dfNowOpFocusManual').onclick=function(){setTimeout(function(){$('dfNowOpManualInput').focus()},40)};
    $('dfNowOpSearchOnly').onclick=function(){lookup($('dfNowOpManualInput').value,'código digitado')};
    $('dfNowOpManualInput').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();lookup(e.target.value,'código digitado')}});
    $('dfNowOpQrOnlyFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)readFile(f)});
    if(sel.value){var e=findEntry(sel.value);if(e)choose(e,'OP já selecionada')}
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(mount,70)}
  function boot(){schedule();var mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfNowTab,[data-pane="now"]'):null;if(t)setTimeout(schedule,100)},true);setTimeout(schedule,500);setTimeout(schedule,1400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
