(function(){
  'use strict';
  if(window.DFProductionNowTeamTestV5)return;
  window.DFProductionNowTeamTestV5=true;

  var TEAM_KEY='df_op_team_v1';
  var REG_KEY='df_op_qr_registry_v1';
  var STATUS_KEY='df_production_now_team_test_v5';
  var HIDDEN_KEY='df_op_hidden_test_v5';
  var timer=0,busy=false,observer=null;

  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot',"'":'&#39;'}[m]})}
  function loadJson(k,f){try{var raw=localStorage.getItem(k);if(!raw)return f;var v=JSON.parse(raw);return v==null?f:v}catch(e){return f}}
  function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function now(){return new Date().toISOString()}
  function hm(v){var d=new Date(v||Date.now());return isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function team(){return loadJson(TEAM_KEY,null)}
  function owner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
  function registry(){var r=loadJson(REG_KEY,{});return r&&typeof r==='object'?r:{}}
  function hidden(){var a=loadJson(HIDDEN_KEY,[]);return Array.isArray(a)?a:[]}
  function statuses(){var a=loadJson(STATUS_KEY,[]);return Array.isArray(a)?a:[]}
  function saveStatuses(a){saveJson(STATUS_KEY,a);render()}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function machineKey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

  function entries(){
    var r=registry(),hid=hidden(),out=[];
    Object.keys(r).forEach(function(k){
      var x=r[k];if(!x)return;
      var id=String(x.id||k||'').trim();if(!/^DFOP-/i.test(id))return;
      if(hid.indexOf(id)>=0)return;
      if(!x.id)x.id=id;
      out.push(x);
    });
    out.sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''))});
    return out;
  }
  function findByCode(code){var c=normalize(code),a=entries();for(var i=0;i<a.length;i++){if(normalize(a[i].id)===c)return a[i]}return null}
  function searchByName(q){
    q=String(q||'').trim().toLowerCase();if(!q)return[];
    return entries().filter(function(x){var e=x.expected||{},title=String(e.title||'').toLowerCase(),id=String(x.id||'').toLowerCase();return title.indexOf(q)>=0||id.indexOf(q)>=0}).slice(0,12);
  }
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}

  function addStyle(){
    if($('dfProdNowV5Style'))return;
    var s=document.createElement('style');s.id='dfProdNowV5Style';s.textContent=
      '#dfPaneNowV5{display:none}#dfPaneNowV5.on{display:block}'+
      '.dfNowHead{border:1px solid #2563eb;background:linear-gradient(180deg,#0b1f42,#101827);border-radius:18px;padding:14px;margin-bottom:12px}.dfNowHead h3{margin:0 0 5px;color:#bfdbfe}.dfNowHead p{margin:0;color:#94a3b8;font-size:11px;line-height:1.45}'+
      '.dfNowKpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.dfNowKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:10px}.dfNowKpi span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.dfNowKpi b{display:block;font-size:20px;margin-top:3px}'+
      '.dfNowCard{border:1px solid #263244;background:#0f172a;border-radius:16px;padding:13px;margin-top:9px}.dfNowCard.run{border-color:#166534}.dfNowCard.stop{border-color:#7f1d1d}.dfNowCard.adjust{border-color:#a16207}.dfNowTop{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.dfNowMachine{font-size:17px;font-weight:950}.dfNowBadge{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}.dfNowBadge.run{background:#0c321c;color:#86efac}.dfNowBadge.stop{background:#230b0b;color:#fca5a5}.dfNowBadge.adjust{background:#3a2605;color:#fde68a}.dfNowProduct{font-size:20px;font-weight:950;color:#ffd36a;margin:8px 0 5px}.dfNowMeta{color:#cbd5e1;font-size:11px;line-height:1.55}'+
      '.dfNowActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.dfNowActions button{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:9px;font-size:11px;font-weight:900}.dfNowActions .done{border-color:#7f1d1d;color:#fca5a5}'+
      '#dfNowAdminV5{border:1px solid #f5a000;background:#17120a;border-radius:16px;padding:13px;margin-top:12px}#dfNowAdminV5 h4{margin:0 0 8px;color:#ffd36a}#dfNowAdminV5 .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#dfNowAdminV5 label{display:block;color:#cbd5e1;font-size:10px;font-weight:850;margin:6px 0 4px}#dfNowAdminV5 input,#dfNowAdminV5 select{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px}'+
      '#dfOpIdentifyV5{grid-column:1/-1;border:1px solid #334155;background:#0b1220;border-radius:13px;padding:10px}.dfOpMethodsV5{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfOpMethodsV5 button,#dfOpDeleteOpenV5{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:11px;font-size:12px;font-weight:900}.dfOpInputRowV5{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.dfOpInputRowV5 button{border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:10px;padding:10px 13px;font-size:11px;font-weight:950}.dfOpSelectedV5{margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:10px;color:#93c5fd;font-size:11px;line-height:1.45}.dfOpSelectedV5.ok{border-color:#166534;color:#86efac}.dfOpSelectedV5.warn{border-color:#a16207;color:#fde68a}.dfOpSelectedV5.bad{border-color:#7f1d1d;color:#fca5a5}.dfOpResultV5{margin-top:8px;display:grid;gap:6px}.dfOpResultV5 button{width:100%;text-align:left;border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:10px;font-size:11px}.dfOpResultV5 b{color:#ffd36a}'+
      '#dfOpDeleteOpenV5{width:100%;margin-top:10px;border-color:#7f1d1d;background:#2a0d0d;color:#fca5a5}#dfOpDeletePanelV5{display:none;margin-top:8px;border:1px solid #7f1d1d;background:#160909;border-radius:12px;padding:9px}.dfOpDelItemV5{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border-bottom:1px solid #331313;padding:8px 0}.dfOpDelItemV5:last-child{border-bottom:0}.dfOpDelItemV5 button{border:1px solid #7f1d1d;background:#2a0d0d;color:#fca5a5;border-radius:9px;padding:8px;font-weight:900;font-size:10px}'+
      '#dfNowSaveV5{width:100%;margin-top:10px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:11px;padding:12px;font-weight:950}.dfNowReadOnly{border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:10px;font-size:11px;margin-top:10px}.dfNowTestNote{margin-top:8px;color:#fde68a;font-size:10px}'+
      '@media(max-width:430px){#dfNowAdminV5 .grid{grid-template-columns:1fr}.dfOpMethodsV5{grid-template-columns:1fr}.dfOpInputRowV5{grid-template-columns:1fr}.dfNowProduct{font-size:18px}}';
    document.head.appendChild(s);
  }

  function statusClass(v){v=String(v||'').toLowerCase();if(v==='rodando')return'run';if(v==='parada')return'stop';return'adjust'}
  function activeList(){var latest={};statuses().forEach(function(x){if(!x||!x.machineKey)return;var o=latest[x.machineKey];if(!o||String(x.updatedAt||'')>String(o.updatedAt||''))latest[x.machineKey]=x});return Object.keys(latest).map(function(k){return latest[k]}).filter(function(x){return x.status!=='FINALIZADA'})}

  function build(){
    var edit=owner();
    var admin=edit?'<div id="dfNowAdminV5"><h4>ATUALIZAR PRODUÇÃO</h4><div class="grid"><div><label>MÁQUINA</label><input id="dfNowMachineV5" placeholder="Ex.: Máquina 1"></div><div><label>STATUS</label><select id="dfNowStatusV5"><option>RODANDO</option><option>PARADA</option><option>AJUSTE</option><option>TROCA DE MATERIAL</option><option>FINALIZADA</option></select></div><div id="dfOpIdentifyV5"><label>OP GERADA</label><input id="dfNowSelectedOpV5" type="hidden"><div class="dfOpMethodsV5"><button id="dfNowReadOpV5" type="button">📷 LER OP</button><button id="dfNowFocusCodeV5" type="button">⌨️ DIGITE OP</button></div><div class="dfOpInputRowV5"><input id="dfNowCodeV5" autocomplete="off" autocapitalize="characters" placeholder="DIGITE O CÓDIGO DFOP"><button id="dfNowFindCodeV5" type="button">BUSCAR OP</button></div><div class="dfOpInputRowV5"><input id="dfNowNameV5" autocomplete="off" placeholder="NOME / PRODUTO: Ex. Pesadão, Plaschique"><button id="dfNowFindNameV5" type="button">BUSCAR NOME</button></div><input id="dfNowQrFileV5" type="file" accept="image/*" capture="environment" style="display:none"><div id="dfNowSelectedInfoV5" class="dfOpSelectedV5">Leia o QR, digite o código ou procure pelo nome.</div><div id="dfNowNameResultsV5" class="dfOpResultV5"></div><button id="dfOpDeleteOpenV5" type="button">🗑 EXCLUIR OPS GERADAS DO TESTE</button><div id="dfOpDeletePanelV5"></div></div><div><label>OPERADOR</label><input id="dfNowOperatorV5" placeholder="Nome do operador"></div><div><label>INÍCIO</label><input id="dfNowStartV5" type="time"></div></div><button id="dfNowSaveV5" type="button">✅ SALVAR STATUS NO TESTE</button><div class="dfNowTestNote">Versão de teste: não publica status na nuvem da equipe. Exclusões aqui só escondem a OP neste teste.</div></div>':'<div class="dfNowReadOnly">👁️ Somente visualização. Somente o dono da equipe pode definir o que está rodando.</div>';
    return '<div class="dfNowHead"><h3>🏭 PRODUÇÃO AGORA</h3><p>Veja o que está rodando nas máquinas neste momento.</p><div class="dfNowKpis"><div class="dfNowKpi"><span>RODANDO</span><b id="dfNowRunningV5">0</b></div><div class="dfNowKpi"><span>PARADAS</span><b id="dfNowStoppedV5">0</b></div><div class="dfNowKpi"><span>AJUSTE</span><b id="dfNowAdjustV5">0</b></div></div></div><div id="dfNowListV5"></div>'+admin;
  }

  function render(){
    var list=$('dfNowListV5');if(!list)return;var a=activeList(),own=owner();
    if($('dfNowRunningV5'))$('dfNowRunningV5').textContent=a.filter(function(x){return x.status==='RODANDO'}).length;
    if($('dfNowStoppedV5'))$('dfNowStoppedV5').textContent=a.filter(function(x){return x.status==='PARADA'}).length;
    if($('dfNowAdjustV5'))$('dfNowAdjustV5').textContent=a.filter(function(x){return x.status==='AJUSTE'||x.status==='TROCA DE MATERIAL'}).length;
    if(!a.length){list.innerHTML='<div class="dfOpsStatus">Nenhuma máquina marcada como ativa agora.</div>';return}
    a.sort(function(x,y){return String(x.machine||'').localeCompare(String(y.machine||''))});
    list.innerHTML=a.map(function(x){var c=statusClass(x.status),acts=own?'<div class="dfNowActions"><button data-v5-edit="'+esc(x.machineKey)+'">✏️ EDITAR</button><button class="done" data-v5-done="'+esc(x.machineKey)+'">⏹ FINALIZAR</button></div>':'';return '<div class="dfNowCard '+c+'"><div class="dfNowTop"><div class="dfNowMachine">'+esc(x.machine||'Máquina')+'</div><span class="dfNowBadge '+c+'">'+esc(x.status||'')+'</span></div><div class="dfNowProduct">'+esc(x.product||'Sem produto')+'</div><div class="dfNowMeta">OP: <b>'+esc(x.op||'—')+'</b><br>Operador: <b>'+esc(x.operator||'—')+'</b><br>Início: <b>'+hm(x.startedAt)+'</b> • Atualizado: <b>'+hm(x.updatedAt)+'</b></div>'+acts+'</div>'}).join('');
    if(own){Array.prototype.forEach.call(list.querySelectorAll('[data-v5-edit]'),function(b){b.onclick=function(){edit(b.getAttribute('data-v5-edit'))}});Array.prototype.forEach.call(list.querySelectorAll('[data-v5-done]'),function(b){b.onclick=function(){finish(b.getAttribute('data-v5-done'))}})}
  }

  function msg(text,cls){var e=$('dfNowSelectedInfoV5');if(!e)return;e.className='dfOpSelectedV5 '+(cls||'');e.innerHTML=text||''}
  function selectEntry(entry,source){
    if(!entry)return false;var id=String(entry.id||'').trim();if(!id)return false;var e=entry.expected||{};
    $('dfNowSelectedOpV5').value=id;
    $('dfNowCodeV5').value=id;
    msg('✅ <b>OP identificada:</b> '+esc(id)+(e.title?'<br><b>Produto:</b> '+esc(e.title):'')+(e.largura?'<br>Largura: '+esc(e.largura):'')+(e.micra?' • Micra: '+esc(e.micra):'')+(source?'<br><span style="color:#94a3b8">Origem: '+esc(source)+'</span>':''),'ok');
    var r=$('dfNowNameResultsV5');if(r)r.innerHTML='';return true;
  }
  function findCode(){var c=normalize($('dfNowCodeV5').value);if(!c){msg('Digite o código da OP.','warn');return}if(!validCode(c)){msg('Código inválido. Use o código DFOP impresso na OP.','bad');return}var x=findByCode(c);if(!x){msg('Não encontrei essa OP neste aparelho. Confira o código.','bad');return}selectEntry(x,'código digitado')}
  function findName(){
    var q=$('dfNowNameV5').value,res=searchByName(q),box=$('dfNowNameResultsV5');
    if(!String(q||'').trim()){msg('Digite o nome do produto, por exemplo Pesadão ou Plaschique.','warn');return}
    if(!res.length){box.innerHTML='';msg('Nenhuma OP encontrada com esse nome.','bad');return}
    if(res.length===1){selectEntry(res[0],'nome do produto');return}
    msg('Encontrei '+res.length+' OPs. Toque na correta abaixo.','warn');
    box.innerHTML=res.map(function(x){var e=x.expected||{};return '<button type="button" data-v5-use="'+esc(x.id)+'"><b>'+esc(e.title||'Sem nome')+'</b><br>'+esc(x.id)+'</button>'}).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-v5-use]'),function(b){b.onclick=function(){var x=findByCode(b.getAttribute('data-v5-use'));if(x)selectEntry(x,'nome do produto')}})
  }

  function renderDeletePanel(){
    var p=$('dfOpDeletePanelV5');if(!p)return;var a=entries();
    if(!a.length){p.innerHTML='<div style="color:#94a3b8;font-size:11px">Nenhuma OP disponível neste teste.</div>';return}
    p.innerHTML=a.map(function(x){var e=x.expected||{};return '<div class="dfOpDelItemV5"><div><b>'+esc(e.title||'Sem nome')+'</b><br><span style="font-size:10px;color:#94a3b8">'+esc(x.id)+'</span></div><button type="button" data-v5-del="'+esc(x.id)+'">EXCLUIR</button></div>'}).join('')+'<button id="dfOpRestoreV5" type="button" style="width:100%;margin-top:8px;border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:9px;padding:9px;font-weight:900">RESTAURAR EXCLUÍDAS DO TESTE</button>';
    Array.prototype.forEach.call(p.querySelectorAll('[data-v5-del]'),function(b){b.onclick=function(){var id=b.getAttribute('data-v5-del'),h=hidden();if(h.indexOf(id)<0)h.push(id);saveJson(HIDDEN_KEY,h);if($('dfNowSelectedOpV5').value===id){$('dfNowSelectedOpV5').value='';$('dfNowCodeV5').value='';msg('OP removida deste teste.','warn')}renderDeletePanel()}});
    var r=$('dfOpRestoreV5');if(r)r.onclick=function(){saveJson(HIDDEN_KEY,[]);renderDeletePanel();msg('OPs restauradas neste teste.','ok')};
  }

  function loadQR(){return new Promise(function(resolve,reject){if(window.jsQR)return resolve();var s=document.querySelector('script[data-df-v5-jsqr="1"]');if(s){s.addEventListener('load',resolve,{once:true});s.addEventListener('error',function(){reject(new Error('Falha ao carregar leitor QR'))},{once:true});return}s=document.createElement('script');s.dataset.dfV5Jsqr='1';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=resolve;s.onerror=function(){reject(new Error('Falha ao carregar leitor QR'))};document.head.appendChild(s)})}
  function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file,max){return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var sc=Math.min(1,(max||2400)/Math.max(img.width,img.height)),c=mk(img.width*sc,img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rot(src,d){d=((d%360)+360)%360;if(!d)return src;var sw=d===90||d===270,c=mk(sw?src.height:src.width,sw?src.width:src.height),x=c.getContext('2d',{willReadFrequently:true});x.save();if(d===90){x.translate(c.width,0);x.rotate(Math.PI/2)}else if(d===180){x.translate(c.width,c.height);x.rotate(Math.PI)}else{x.translate(0,c.height);x.rotate(-Math.PI/2)}x.drawImage(src,0,0);x.restore();return c}
  function crop(src,x,y,w,h,s){s=s||1;x=Math.max(0,Math.round(x));y=Math.max(0,Math.round(y));w=Math.max(1,Math.min(src.width-x,Math.round(w)));h=Math.max(1,Math.min(src.height-y,Math.round(h)));var c=mk(w*s,h*s),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function scanCanvas(c){try{var x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function decodeQR(file){await loadQR();var base=await imageCanvas(file,2400),degs=[0,90,180,270];for(var i=0;i<degs.length;i++){var c=rot(base,degs[i]),tries=[c,crop(c,0,0,c.width,c.height*.58,2),crop(c,c.width*.15,0,c.width*.70,c.height*.62,2.4),crop(c,0,0,c.width*.70,c.height*.72,2),crop(c,c.width*.30,0,c.width*.70,c.height*.72,2)];for(var j=0;j<tries.length;j++){var q=scanCanvas(tries[j]);if(q&&validCode(q))return normalize(q)}}return''}
  async function readQr(file){if(!file||busy)return;busy=true;msg('📷 Lendo o QR da OP...','warn');try{var q=await decodeQR(file);if(!q){msg('Não consegui ler o QR. Aproxime a câmera e tente novamente, ou digite o código.','bad');return}$('dfNowCodeV5').value=q;var x=findByCode(q);if(!x){msg('QR lido: '+esc(q)+'<br>Mas essa OP não está cadastrada neste aparelho.','bad');return}selectEntry(x,'QR da OP')}catch(e){msg('Erro ao ler QR: '+esc(e&&e.message||e),'bad')}finally{busy=false;var f=$('dfNowQrFileV5');if(f)try{f.value=''}catch(e){}}}

  function saveForm(){
    if(!owner())return;var machine=String($('dfNowMachineV5').value||'').trim(),status=$('dfNowStatusV5').value,op=$('dfNowSelectedOpV5').value,operator=String($('dfNowOperatorV5').value||'').trim();
    if(!machine){alert('Digite a máquina.');return}if(status==='RODANDO'&&!op){alert('Identifique a OP pelo QR, código ou nome.');return}
    var ent=findByCode(op)||{},exp=ent.expected||{},tv=$('dfNowStartV5').value||new Date().toTimeString().slice(0,5),d=new Date(),parts=tv.split(':');d.setHours(Number(parts[0])||0,Number(parts[1])||0,0,0);
    var key=machineKey(machine)||('m-'+Date.now()),a=statuses(),old=null;a.forEach(function(x){if(x&&x.machineKey===key)old=x});
    var rec={machineKey:key,machine:machine,status:status,op:op||'',product:exp.title||(old&&old.product)||'',operator:operator,startedAt:old&&old.status==='RODANDO'&&status==='RODANDO'?old.startedAt:d.toISOString(),updatedAt:now()};
    a=a.filter(function(x){return !x||x.machineKey!==key});a.unshift(rec);saveStatuses(a);
    $('dfNowMachineV5').value='';$('dfNowOperatorV5').value='';$('dfNowStatusV5').value='RODANDO';$('dfNowSelectedOpV5').value='';$('dfNowCodeV5').value='';$('dfNowNameV5').value='';$('dfNowNameResultsV5').innerHTML='';$('dfNowStartV5').value=new Date().toTimeString().slice(0,5);msg('Leia o QR, digite o código ou procure pelo nome.','');
  }
  function edit(key){if(!owner())return;var x=null;statuses().forEach(function(v){if(v&&v.machineKey===key)x=v});if(!x)return;$('dfNowMachineV5').value=x.machine||'';$('dfNowStatusV5').value=x.status||'RODANDO';$('dfNowOperatorV5').value=x.operator||'';try{$('dfNowStartV5').value=new Date(x.startedAt||Date.now()).toTimeString().slice(0,5)}catch(e){}if(x.op){var ent=findByCode(x.op);if(ent)selectEntry(ent,'status atual')}var f=$('dfNowAdminV5');if(f)f.scrollIntoView({behavior:'smooth',block:'center'})}
  function finish(key){if(!owner())return;var a=statuses(),x=null;a.forEach(function(v){if(v&&v.machineKey===key)x=v});if(!x)return;a=a.filter(function(v){return !v||v.machineKey!==key});a.unshift(Object.assign({},x,{status:'FINALIZADA',updatedAt:now()}));saveStatuses(a)}

  function bind(){
    if(!owner())return;
    $('dfNowSaveV5').onclick=saveForm;
    $('dfNowReadOpV5').onclick=function(){$('dfNowQrFileV5').click()};
    $('dfNowFocusCodeV5').onclick=function(){setTimeout(function(){$('dfNowCodeV5').focus()},30)};
    $('dfNowFindCodeV5').onclick=findCode;
    $('dfNowCodeV5').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();findCode()}});
    $('dfNowFindNameV5').onclick=findName;
    $('dfNowNameV5').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();findName()}});
    $('dfNowQrFileV5').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(f)readQr(f)});
    $('dfOpDeleteOpenV5').onclick=function(){var p=$('dfOpDeletePanelV5');p.style.display=p.style.display==='block'?'none':'block';if(p.style.display==='block')renderDeletePanel()};
    if(!$('dfNowStartV5').value)$('dfNowStartV5').value=new Date().toTimeString().slice(0,5);
  }

  function openNow(){ensure();var root=$('dfFormulaOps');if(!root)return;Array.prototype.forEach.call(root.querySelectorAll('.dfOpsTabs button'),function(b){b.classList.toggle('on',b.id==='dfNowTabV5')});Array.prototype.forEach.call(root.querySelectorAll('.dfOpsPane'),function(p){p.classList.remove('on')});var pane=$('dfPaneNowV5');if(pane)pane.classList.add('on');render()}
  function ensure(){
    addStyle();var root=$('dfFormulaOps');if(!root)return false;var tabs=root.querySelector('.dfOpsTabs');if(!tabs)return false;
    var old=$('dfNowTab');if(old)old.style.display='none';var oldPane=$('dfPaneNow');if(oldPane)oldPane.style.display='none';
    var tab=$('dfNowTabV5');if(!tab||!tabs.contains(tab)){if(tab&&tab.parentNode)tab.parentNode.removeChild(tab);tab=document.createElement('button');tab.id='dfNowTabV5';tab.setAttribute('data-pane','now-v5');tab.textContent='🏭 AGORA';tabs.appendChild(tab)}tab.onclick=openNow;
    var pane=$('dfPaneNowV5'),mode=owner()?'owner':'view';if(!pane||!root.contains(pane)){if(pane&&pane.parentNode)pane.parentNode.removeChild(pane);pane=document.createElement('div');pane.id='dfPaneNowV5';pane.className='dfOpsPane';pane.dataset.mode=mode;pane.innerHTML=build();root.appendChild(pane);bind();render()}else if(pane.dataset.mode!==mode){pane.dataset.mode=mode;pane.innerHTML=build();bind();render()}
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(ensure,80)}
  function boot(){schedule();observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('df-team-changed',schedule);window.addEventListener('pageshow',schedule);setTimeout(schedule,600);setTimeout(schedule,1600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
