(function(){
  'use strict';
  if(window.DFProductionNowOpToolsTestV4)return;
  window.DFProductionNowOpToolsTestV4=true;

  var REG_KEY='df_op_qr_registry_v1';
  var timer=0,busy=false;
  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function loadReg(){try{var r=JSON.parse(localStorage.getItem(REG_KEY)||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
  function saveReg(r){try{localStorage.setItem(REG_KEY,JSON.stringify(r||{}))}catch(e){}}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function normName(v){return String(v||'').trim().toLocaleLowerCase('pt-BR')}
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}
  function entries(){var r=loadReg(),out=[];Object.keys(r).forEach(function(k){var x=r[k];if(!x||typeof x!=='object')return;var id=String(x.id||k||'').trim();if(!/^DFOP-/i.test(id))return;if(!x.id)x.id=id;out.push(x)});out.sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''))});return out}
  function findCode(code){var c=normalize(code),list=entries();for(var i=0;i<list.length;i++){if(normalize(list[i].id)===c)return list[i]}return null}
  function titleOf(x){var e=x&&x.expected||{};return String(e.title||x.title||x.product||'').trim()}

  function style(){
    if($('dfNowOpToolsV4Style'))return;
    var s=document.createElement('style');s.id='dfNowOpToolsV4Style';s.textContent=
      '#dfNowOpSelect,#dfNowOpInfo{display:none!important;visibility:hidden!important;position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}'+
      '#dfNowOpToolsV4{margin-top:7px;border:1px solid #334155;background:#0b1220;border-radius:13px;padding:10px}'+
      '#dfNowOpToolsV4 .bigBtn{width:100%;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:12px;font-size:12px;font-weight:950;margin-bottom:8px}'+
      '#dfNowOpToolsV4 .row{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:8px}'+
      '#dfNowOpToolsV4 input{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:11px;font-size:13px}'+
      '#dfNowOpToolsV4 .go{border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:10px;padding:10px 13px;font-size:11px;font-weight:950}'+
      '#dfNowOpMsgV4{margin-top:9px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:9px;color:#94a3b8;font-size:10px;line-height:1.45}'+
      '#dfNowOpMsgV4.ok{border-color:#166534;color:#86efac}#dfNowOpMsgV4.warn{border-color:#a16207;color:#fde68a}#dfNowOpMsgV4.bad{border-color:#7f1d1d;color:#fca5a5}'+
      '#dfNowNameResultsV4{margin-top:8px;display:grid;gap:6px}#dfNowNameResultsV4 .res{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:8px}'+
      '#dfNowNameResultsV4 .pick{border:0;background:transparent;color:#e2e8f0;text-align:left;font-size:11px;font-weight:850;padding:4px}#dfNowNameResultsV4 .pick small{display:block;color:#94a3b8;font-size:9px;margin-top:2px}'+
      '#dfNowDeleteToggleV4{width:100%;margin-top:10px;border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:10px;padding:10px;font-size:11px;font-weight:900}'+
      '#dfNowDeleteListV4{display:none;margin-top:7px;gap:6px}#dfNowDeleteListV4.on{display:grid}#dfNowDeleteListV4 .delrow{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;border:1px solid #3f1d1d;background:#130b0b;border-radius:10px;padding:8px;color:#e2e8f0;font-size:10px}#dfNowDeleteListV4 .del{border:1px solid #dc2626;background:#3b0b0b;color:#fecaca;border-radius:8px;padding:7px 9px;font-size:10px;font-weight:900}'+
      '@media(max-width:430px){#dfNowOpToolsV4 .row{grid-template-columns:1fr}#dfNowOpToolsV4 .go{width:100%}}';
    document.head.appendChild(s);
  }
  function msg(t,c){var e=$('dfNowOpMsgV4');if(!e)return;e.className=c||'';e.innerHTML=t||''}
  function hiddenSelect(){var s=$('dfNowOpSelect');if(s){s.style.setProperty('display','none','important');s.setAttribute('tabindex','-1');s.setAttribute('aria-hidden','true')}var i=$('dfNowOpInfo');if(i)i.style.setProperty('display','none','important');return s}
  function choose(entry,source){
    if(!entry)return false;var sel=hiddenSelect();if(!sel)return false;
    var id=String(entry.id||'').trim();if(!id)return false;
    var found=false;Array.prototype.forEach.call(sel.options,function(o){if(o.value===id)found=true});
    if(!found){var o=document.createElement('option'),t=titleOf(entry)||'OP encontrada';o.value=id;o.textContent=t+' — '+id;sel.appendChild(o)}
    sel.value=id;try{sel.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){try{if(typeof sel.onchange==='function')sel.onchange()}catch(_){}}
    var title=titleOf(entry);msg('✅ <b>OP identificada:</b> '+esc(id)+(title?'<br><b>Produto:</b> '+esc(title):'')+(source?'<br><span style="color:#94a3b8">Origem: '+esc(source)+'</span>':''),'ok');
    var code=$('dfNowOpCodeV4');if(code)code.value=id;var name=$('dfNowOpNameV4');if(name&&title)name.value=title;clearNameResults();return true
  }
  function lookupCode(raw,source){var code=normalize(raw);if(!code){msg('Digite ou leia o código da OP.','warn');return false}if(!validCode(code)){msg('Código inválido. Use o código DFOP impresso na OP.','bad');return false}var e=findCode(code);if(!e){msg('⚠️ Essa OP não foi encontrada neste aparelho.','warn');return false}return choose(e,source)}
  function clearNameResults(){var r=$('dfNowNameResultsV4');if(r)r.innerHTML=''}
  function lookupName(raw){
    var q=normName(raw);clearNameResults();if(!q){msg('Digite o nome do produto/OP, por exemplo: Pesadão ou Plaschique.','warn');return}
    var matches=entries().filter(function(x){return normName(titleOf(x)).indexOf(q)>=0});
    if(!matches.length){msg('⚠️ Não encontrei OP gerada com esse nome.','warn');return}
    if(matches.length===1){choose(matches[0],'nome');return}
    msg('Encontrei '+matches.length+' OPs. Toque na correta.','warn');
    var box=$('dfNowNameResultsV4');if(!box)return;box.innerHTML=matches.map(function(x,i){return '<div class="res"><button type="button" class="pick" data-pick="'+i+'">'+esc(titleOf(x)||'Sem nome')+'<small>'+esc(x.id)+'</small></button></div>'}).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-pick]'),function(b){b.onclick=function(){choose(matches[Number(b.getAttribute('data-pick'))],'nome')}})
  }

  function loadQR(){return new Promise(function(resolve,reject){if(window.jsQR)return resolve();var old=document.querySelector('script[data-df-op-tools-v4="1"]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',function(){reject(new Error('Falha ao carregar leitor QR'))},{once:true});return}var s=document.createElement('script');s.dataset.dfOpToolsV4='1';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=function(){reject(new Error('Falha ao carregar leitor QR'))};document.head.appendChild(s)})}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file,max){return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var scale=Math.min(1,(max||2400)/Math.max(img.width,img.height)),c=mk(img.width*scale,img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;var sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,scale){x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));var c=mk(w*(scale||1),h*(scale||1)),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function scanCanvas(c){try{var x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function decode(file){await loadQR();var base=await imageCanvas(file,2400),degs=[0,90,180,270];for(var i=0;i<degs.length;i++){var c=rot(base,degs[i]),tries=[c,crop(c,0,0,c.width,c.height*.58,2),crop(c,c.width*.15,0,c.width*.70,c.height*.62,2.4),crop(c,0,0,c.width*.70,c.height*.72,2),crop(c,c.width*.30,0,c.width*.70,c.height*.72,2)];for(var j=0;j<tries.length;j++){var q=scanCanvas(tries[j]);if(q&&validCode(q))return normalize(q)}}return''}
  async function readFile(file){if(!file||busy)return;busy=true;msg('📷 Lendo o QR da OP...','warn');try{var q=await decode(file);if(!q){msg('Não consegui ler o QR. Aproxime mais a câmera ou use DIGITE OP.','bad');return}lookupCode(q,'QR da OP')}catch(e){msg('Não consegui ler o QR: '+esc(e&&e.message||e),'bad')}finally{busy=false;var f=$('dfNowOpQrV4');if(f)try{f.value=''}catch(e){}}}

  function renderDelete(){var box=$('dfNowDeleteListV4');if(!box)return;var list=entries();if(!list.length){box.innerHTML='<div class="delrow">Nenhuma OP gerada salva neste aparelho.</div>';return}box.innerHTML=list.map(function(x){return '<div class="delrow"><div><b>'+esc(titleOf(x)||'Sem nome')+'</b><br><span style="color:#94a3b8">'+esc(x.id)+'</span></div><button class="del" type="button" data-del="'+esc(x.id)+'">🗑 EXCLUIR</button></div>'}).join('');Array.prototype.forEach.call(box.querySelectorAll('[data-del]'),function(b){b.onclick=function(){deleteOp(b.getAttribute('data-del'))}})}
  function deleteOp(id){var r=loadReg(),target=r[id];if(!target){var keys=Object.keys(r);for(var i=0;i<keys.length;i++){if(normalize((r[keys[i]]&&r[keys[i]].id)||keys[i])===normalize(id)){id=keys[i];target=r[id];break}}}if(!target)return;if(!confirm('Excluir esta OP gerada da lista?\n\n'+(titleOf(target)||'Sem nome')+'\n'+String(target.id||id)))return;delete r[id];saveReg(r);var sel=hiddenSelect();if(sel&&normalize(sel.value)===normalize(target.id||id))sel.value='';renderDelete();msg('🗑 OP excluída da lista de OPs geradas deste aparelho.','warn')}

  function mount(){
    var form=$('dfNowAdminForm'),sel=$('dfNowOpSelect');if(!form||!sel)return false;style();hiddenSelect();
    var host=sel.parentNode;if(!host)return false;var label=host.querySelector('label');if(label)label.textContent='OP GERADA';
    var old=$('dfNowOpToolsV4');if(old&&host.contains(old)){hiddenSelect();return true}if(old)old.remove();
    var box=document.createElement('div');box.id='dfNowOpToolsV4';box.innerHTML=
      '<button id="dfNowReadOpV4" class="bigBtn" type="button">📷 LER OP</button>'+ 
      '<div class="row"><input id="dfNowOpCodeV4" autocomplete="off" autocapitalize="characters" placeholder="DIGITE OP (código DFOP)"><button id="dfNowFindCodeV4" class="go" type="button">BUSCAR OP</button></div>'+ 
      '<div class="row"><input id="dfNowOpNameV4" autocomplete="off" placeholder="NOME / PRODUTO (ex.: Pesadão)"><button id="dfNowFindNameV4" class="go" type="button">BUSCAR NOME</button></div>'+ 
      '<input id="dfNowOpQrV4" type="file" accept="image/*" capture="environment" style="display:none">'+ 
      '<div id="dfNowNameResultsV4"></div><div id="dfNowOpMsgV4">Leia o QR, digite o código ou procure pelo nome da OP.</div>'+ 
      '<button id="dfNowDeleteToggleV4" type="button">🗑 EXCLUIR OPS GERADAS</button><div id="dfNowDeleteListV4"></div>';
    host.appendChild(box);
    $('dfNowReadOpV4').onclick=function(){$('dfNowOpQrV4').click()};
    $('dfNowFindCodeV4').onclick=function(){lookupCode($('dfNowOpCodeV4').value,'código digitado')};
    $('dfNowFindNameV4').onclick=function(){lookupName($('dfNowOpNameV4').value)};
    $('dfNowOpCodeV4').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();lookupCode(e.target.value,'código digitado')}});
    $('dfNowOpNameV4').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();lookupName(e.target.value)}});
    $('dfNowOpQrV4').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)readFile(f)});
    $('dfNowDeleteToggleV4').onclick=function(){var d=$('dfNowDeleteListV4');d.classList.toggle('on');if(d.classList.contains('on'))renderDelete()};
    return true
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(mount,60)}
  function boot(){schedule();var mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#dfNowTab,[data-pane="now"]'):null;if(t)setTimeout(schedule,80)},true);setTimeout(schedule,400);setTimeout(schedule,1000);setTimeout(schedule,2200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();