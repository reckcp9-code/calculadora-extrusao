(function(){
  'use strict';
  if(window.DFProductionNowOpScanTestV1)return;
  window.DFProductionNowOpScanTestV1=true;

  var REG_KEY='df_op_qr_registry_v1';
  var timer=0,busy=false;
  function $(id){return document.getElementById(id)}
  function registry(){try{var r=JSON.parse(localStorage.getItem(REG_KEY)||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function findEntry(code){var c=normalize(code),r=registry(),keys=Object.keys(r);for(var i=0;i<keys.length;i++){var x=r[keys[i]],id=normalize((x&&x.id)||keys[i]);if(id===c){if(x&&!x.id)x.id=keys[i];return x||{id:keys[i]}}}return null}
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}

  function style(){
    if($('dfNowOpScanTestStyle'))return;
    var s=document.createElement('style');s.id='dfNowOpScanTestStyle';s.textContent=
      '#dfNowOpSelect{display:none!important}'+
      '#dfNowOpScanTools{margin-top:6px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:10px}'+
      '#dfNowOpScanBtn{width:100%;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:12px;font-size:12px;font-weight:950}'+
      '#dfNowOpManualRow{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:9px}'+
      '#dfNowOpManualCode{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:11px;font-size:13px;text-transform:uppercase}'+
      '#dfNowOpFindBtn{border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:10px;padding:10px 13px;font-size:11px;font-weight:950}'+
      '#dfNowOpLookupMsg{margin-top:8px;color:#94a3b8;font-size:10px;line-height:1.45}'+
      '#dfNowOpLookupMsg.ok{color:#86efac}#dfNowOpLookupMsg.warn{color:#fde68a}#dfNowOpLookupMsg.bad{color:#fca5a5}'+
      '@media(max-width:430px){#dfNowOpManualRow{grid-template-columns:1fr}#dfNowOpFindBtn{width:100%}}';
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
    msg('✅ OP '+id+' identificada'+(exp.title?' • '+exp.title:'')+(source?' pelo '+source:''), 'ok');
    return true;
  }
  function lookup(raw,source){
    var code=normalize(raw);if(!code){msg('Digite ou leia o código da OP.','warn');return false}
    if(!validCode(code)){msg('Código inválido. Use o código DFOP impresso na OP.','bad');return false}
    var entry=findEntry(code);
    if(!entry){msg('⚠️ Não encontrei essa OP gerada neste aparelho. Confira o código.','warn');return false}
    return selectEntry(entry,source);
  }

  function loadQR(){return new Promise(function(resolve,reject){if(window.jsQR)return resolve();var old=document.querySelector('script[data-df-now-jsqr="1"]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',function(){reject(new Error('Falha ao carregar leitor QR'))},{once:true});return}var s=document.createElement('script');s.dataset.dfNowJsqr='1';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=function(){reject(new Error('Falha ao carregar leitor QR'))};document.head.appendChild(s)})}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file,max){max=max||2200;return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var scale=Math.min(1,max/Math.max(img.width,img.height)),c=mk(img.width*scale,img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;var sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,s){s=s||1;x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));var c=mk(w*s,h*s),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function scanCanvas(c){try{var x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function decode(file){await loadQR();var base=await imageCanvas(file,2400),degs=[0,90,180,270];for(var i=0;i<degs.length;i++){var c=rot(base,degs[i]),tries=[c,crop(c,0,0,c.width,c.height*.65,1.8),crop(c,c.width*.1,0,c.width*.8,c.height*.7,2)];for(var j=0;j<tries.length;j++){var q=scanCanvas(tries[j]);if(q&&validCode(q))return q}}return''}
  async function handleFile(file){if(!file||busy)return;busy=true;msg('📷 Lendo QR da OP...','warn');try{var q=await decode(file);if(!q){msg('Não consegui ler o QR. Aproxime a câmera ou digite o código da OP abaixo.','bad');return}var manual=$('dfNowOpManualCode');if(manual)manual.value=normalize(q);lookup(q,'QR')}catch(e){msg('Não consegui ler o QR: '+String(e&&e.message||e),'bad')}finally{busy=false;var input=$('dfNowOpQrFile');if(input)try{input.value=''}catch(e){}}}

  function mount(){
    var form=$('dfNowAdminForm'),sel=$('dfNowOpSelect');if(!form||!sel)return false;
    style();
    var host=sel.parentNode;if(!host)return false;
    var label=host.querySelector('label');if(label)label.textContent='IDENTIFICAR OP';
    var old=$('dfNowOpScanTools');if(old&&form.contains(old))return true;if(old)old.remove();
    var box=document.createElement('div');box.id='dfNowOpScanTools';
    box.innerHTML='<button id="dfNowOpScanBtn" type="button">📷 LER QR DA OP</button><div id="dfNowOpManualRow"><input id="dfNowOpManualCode" autocomplete="off" autocapitalize="characters" placeholder="DIGITE O CÓDIGO DA OP"><button id="dfNowOpFindBtn" type="button">🔎 BUSCAR OP</button></div><input id="dfNowOpQrFile" type="file" accept="image/*" capture="environment" style="display:none"><div id="dfNowOpLookupMsg">Leia o QR da OP ou digite o código impresso.</div>';
    sel.insertAdjacentElement('afterend',box);
    $('dfNowOpScanBtn').onclick=function(){$('dfNowOpQrFile').click()};
    $('dfNowOpFindBtn').onclick=function(){lookup($('dfNowOpManualCode').value,'código digitado')};
    $('dfNowOpManualCode').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();lookup(e.target.value,'código digitado')}});
    $('dfNowOpQrFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)handleFile(f)});
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(mount,80)}
  function boot(){schedule();var mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfNowTab,[data-pane="now"]'):null;if(t)setTimeout(schedule,120)},true);setTimeout(schedule,700);setTimeout(schedule,1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
