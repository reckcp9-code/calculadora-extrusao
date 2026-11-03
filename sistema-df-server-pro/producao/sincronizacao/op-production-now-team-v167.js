(function(){
  'use strict';
  if(window.DFProductionNowTeamV167)return;
  window.DFProductionNowTeamV167=true;

  var API='https://df-extrusor-api.reck-cp9.workers.dev';
  var TOKEN_KEY='df_secure_token_v2';
  var DEVICE_KEY='df_licenseauth_device_v1';
  var ACCESS_KEY='df_auto_access_credential_v1';
  var TEAM_KEY='df_op_team_v1';
  var REG_KEY='df_op_qr_registry_v1';
  var OPS_KEY='df_formula_ops_auto_v2';
  var STATUS_KEY='df_production_now_team_v1';
  var OLD_TEST_KEY='df_production_now_team_test_v6';
  var OLD_LOCAL_KEY='df_production_now_v1';
  var mountedRoot=null,mountTimer=0,mountAttempts=0,qrBusy=false,syncBusy=false;

  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function loadJson(k,f){try{var raw=localStorage.getItem(k);if(!raw)return f;var v=JSON.parse(raw);return v==null?f:v}catch(e){return f}}
  function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function now(){return new Date().toISOString()}
  function hm(v){var d=new Date(v||Date.now());return isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function normalize(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
  function machineKey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function registry(){var r=loadJson(REG_KEY,{});return r&&typeof r==='object'?r:{}}
  function statuses(){var a=loadJson(STATUS_KEY,[]);return Array.isArray(a)?a:[]}
  function saveStatuses(a){saveJson(STATUS_KEY,a);render()}

  function currentTeam(){
    try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var live=window.DFOpCloud.team();if(live)return live}}catch(e){}
    var saved=loadJson(TEAM_KEY,null);if(saved)return saved;
    var box=$('dfOpTeamCloud'),txt=box?String(box.textContent||''):'';
    if(/\bDONO\b/i.test(txt))return{role:'owner'};
    if(/\bOPERADOR\b/i.test(txt))return{role:'operator'};
    return null;
  }
  function canEdit(){var t=currentTeam();return String(t&&t.role||'').toLowerCase()==='owner'}

  function migrate(){
    try{
      if(localStorage.getItem(STATUS_KEY)!==null)return;
      var test=localStorage.getItem(OLD_TEST_KEY),old=localStorage.getItem(OLD_LOCAL_KEY);
      if(test!==null){localStorage.setItem(STATUS_KEY,test);return}
      if(old!==null){
        var a=JSON.parse(old||'[]');
        if(Array.isArray(a))localStorage.setItem(STATUS_KEY,JSON.stringify(a.map(function(x){return{machineKey:machineKey(x.id||x.machine||''),machine:x.machine||'',status:x.status||'RODANDO',product:x.product||'',op:x.op||'',operator:x.operator||'',startedAt:x.startedAt||now(),updatedAt:x.updatedAt||now()}})));
      }
    }catch(e){}
  }

  function entries(){
    var r=registry(),out=[];
    Object.keys(r).forEach(function(k){var x=r[k];if(!x)return;var id=String(x.id||k||'').trim();if(!/^DFOP-/i.test(id))return;if(!x.id)x.id=id;out.push(x)});
    out.sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''))});
    return out;
  }
  function findCode(v){var c=normalize(v),a=entries();for(var i=0;i<a.length;i++){if(normalize(a[i].id)===c)return a[i]}return null}
  function validCode(v){return /^DFOP-[A-Z0-9-]{8,}$/i.test(String(v||'').trim())}
  function recoverCode(v){
    var code=normalize(v);if(!validCode(code))return null;
    var x=findCode(code);if(x)return x;
    var r=registry(),e={id:code,createdAt:now(),recoveredAt:now(),recovered:true,source:'producao-agora',expected:{}};r[code]=e;saveJson(REG_KEY,r);
    try{window.dispatchEvent(new CustomEvent('df-op-qr-created',{detail:e}))}catch(err){}
    return e;
  }
  function findName(v){
    var q=String(v||'').trim().toLowerCase();if(!q)return[];
    return entries().filter(function(x){var e=x.expected||{},title=String(e.title||'').toLowerCase(),id=String(x.id||'').toLowerCase();return title.indexOf(q)>=0||id.indexOf(q)>=0}).slice(0,12);
  }
  function deleteEntry(id){
    var r=registry(),changed=false;
    Object.keys(r).forEach(function(k){var x=r[k]||{},rid=String(x.id||k||'');if(rid===id){delete r[k];changed=true}});
    if(changed){saveJson(REG_KEY,r);try{window.dispatchEvent(new CustomEvent('df-op-qr-deleted',{detail:{id:id}}))}catch(e){}}
    return changed;
  }

  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
  function tokenPayload(token){try{var s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
  async function renewSession(force){
    var token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
    var p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;
    var credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
    var dev=deviceId();if(!credential||!dev)throw new Error('acesso indisponível');
    var r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:credential,deviceId:dev}),cache:'no-store'}),j={};
    try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');
    token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');
    try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}
    return token;
  }
  async function apiPost(path,body,retry){
    var token=await renewSession(false),dev=deviceId();
    var r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'}),j={};
    try{j=await r.json()}catch(e){}
    if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;
  }
  async function apiForm(path,form,retry){
    var token=await renewSession(false),dev=deviceId();
    var r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},body:form,cache:'no-store'}),j={};
    try{j=await r.json()}catch(e){}
    if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiForm(path,form,false)}
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;
  }
  function enc(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
  function month(off){var d=new Date();d.setMonth(d.getMonth()+(off||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function tinyBlob(){var b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,function(c){return c.charCodeAt(0)})],{type:'image/png'})}
  async function publishCloud(rec){
    var t=currentTeam();if(!t||!t.teamId)return false;
    var payload=Object.assign({},rec,{v:4,updatedAt:now()}),form=new FormData();
    form.append('teamId',t.teamId);form.append('sourceId','DFSTATUS-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));form.append('qr','DFSTATUS4.'+enc(payload));form.append('production','0');form.append('scrap','0');form.append('createdAt',payload.updatedAt);form.append('photo',tinyBlob(),'status.png');
    await apiForm('/op/photo/upload',form);return true;
  }
  function applyCloud(photos){
    var latest={};(photos||[]).forEach(function(p){var q=String(p.qr||''),x=null;if(q.indexOf('DFSTATUS4.')===0)x=dec(q.slice(10));else if(q.indexOf('DFSTATUS3.')===0)x=dec(q.slice(10));else if(q.indexOf('DFSTATUS2.')===0)x=dec(q.slice(10));if(!x||!x.machineKey)return;var old=latest[x.machineKey];if(!old||String(x.updatedAt||'')>String(old.updatedAt||''))latest[x.machineKey]=x});
    var vals=Object.keys(latest).map(function(k){return latest[k]});if(vals.length){saveJson(STATUS_KEY,vals);render()}
  }
  async function syncCloud(){
    if(syncBusy||navigator.onLine===false)return;
    var t=currentTeam();if(!t||!t.teamId)return;
    syncBusy=true;
    try{var a=await apiPost('/op/photo/list',{teamId:t.teamId,month:month(0)}),b=await apiPost('/op/photo/list',{teamId:t.teamId,month:month(-1)});applyCloud([].concat(a.photos||[],b.photos||[]));setCloudMsg('☁️ Status sincronizado com a equipe','ok');purgeSynthetic();setTimeout(hideSyntheticCloudRows,30)}catch(e){setCloudMsg('⚠️ Status aguardando sincronização','warn')}finally{syncBusy=false}
  }
  function purgeSynthetic(){var a=loadJson(OPS_KEY,[]);if(!Array.isArray(a))return;var b=a.filter(function(x){return String(x&&x.id||'').indexOf('DFSTATUS-')!==0});if(b.length!==a.length)saveJson(OPS_KEY,b)}
  function hideSyntheticCloudRows(){try{document.querySelectorAll('.dfCloudPhotoRow').forEach(function(r){if(/DFSTATUS[234]\./.test(r.textContent||''))r.style.display='none'})}catch(e){}}

  function addStyle(){
    if($('dfProdNowV167Style'))return;
    var s=document.createElement('style');s.id='dfProdNowV167Style';s.textContent=
      '#dfPaneNow{display:none}#dfPaneNow.on{display:block}.dfNowHead{border:1px solid #2563eb;background:linear-gradient(180deg,#0b1f42,#101827);border-radius:18px;padding:14px;margin-bottom:12px}.dfNowHead h3{margin:0 0 5px;color:#bfdbfe}.dfNowHead p{margin:0;color:#94a3b8;font-size:11px;line-height:1.45}.dfNowOwnerOk{margin-top:9px;border:1px solid #166534;background:#052e16;color:#86efac;border-radius:11px;padding:9px 10px;font-size:11px;font-weight:900}.dfNowKpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.dfNowKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:10px}.dfNowKpi span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.dfNowKpi b{display:block;font-size:20px;margin-top:3px}.dfNowCard{border:1px solid #263244;background:#0f172a;border-radius:16px;padding:13px;margin-top:9px}.dfNowCard.run{border-color:#166534}.dfNowCard.stop{border-color:#7f1d1d}.dfNowCard.adjust{border-color:#a16207}.dfNowTop{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.dfNowMachine{font-size:17px;font-weight:950}.dfNowBadge{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}.dfNowBadge.run{background:#0c321c;color:#86efac}.dfNowBadge.stop{background:#230b0b;color:#fca5a5}.dfNowBadge.adjust{background:#3a2605;color:#fde68a}.dfNowProduct{font-size:20px;font-weight:950;color:#ffd36a;margin:8px 0 5px}.dfNowMeta{color:#cbd5e1;font-size:11px;line-height:1.55}.dfNowActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.dfNowActions button{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:9px;font-size:11px;font-weight:900}.dfNowActions .done{border-color:#7f1d1d;color:#fca5a5}#dfNowAdminForm{border:1px solid #f5a000;background:#17120a;border-radius:16px;padding:13px;margin-top:12px}#dfNowAdminForm h4{margin:0 0 8px;color:#ffd36a}#dfNowAdminForm .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#dfNowAdminForm label{display:block;color:#cbd5e1;font-size:10px;font-weight:850;margin:6px 0 4px}#dfNowAdminForm input,#dfNowAdminForm select{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px}#dfNowIdentify{grid-column:1/-1;border:1px solid #334155;background:#0b1220;border-radius:13px;padding:10px}.dfNowMethod{display:grid;grid-template-columns:1fr;gap:8px}.dfNowMethod button,.dfNowRow button{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:11px;font-size:11px;font-weight:900}.dfNowRow{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.dfNowRow button{border-color:#16a34a;background:#0c321c;color:#86efac}.dfNowInfo{margin-top:8px;border:1px solid #334155;background:#0f172a;border-radius:10px;padding:9px;color:#93c5fd;font-size:11px;line-height:1.45}.dfNowResults{display:grid;gap:6px;margin-top:7px}.dfNowResults button{width:100%;text-align:left;border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:10px}.dfNowDelete{width:100%;margin-top:9px;border:1px solid #7f1d1d;background:#2a0d0d;color:#fca5a5;border-radius:10px;padding:10px;font-weight:900}#dfNowDeletePanel{display:none;margin-top:8px}.dfNowDelItem{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #331313}.dfNowDelItem button{border:1px solid #7f1d1d;background:#2a0d0d;color:#fca5a5;border-radius:8px;padding:7px}#dfNowSave{width:100%;margin-top:10px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:11px;padding:12px;font-weight:950}.dfNowReadOnly{border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:10px;font-size:11px;margin-top:10px}#dfNowCloudMsg{font-size:10px;margin-top:8px;color:#94a3b8}#dfNowCloudMsg.ok{color:#86efac}#dfNowCloudMsg.warn{color:#fde68a}@media(max-width:430px){#dfNowAdminForm .grid,.dfNowRow{grid-template-columns:1fr}.dfNowProduct{font-size:18px}}';
    document.head.appendChild(s);
  }
  function sc(v){v=String(v||'').toLowerCase();if(v==='rodando')return'run';if(v==='parada')return'stop';return'adjust'}
  function setCloudMsg(t,c){var e=$('dfNowCloudMsg');if(e){e.textContent=t||'';e.className=c||''}}
  function activeList(){var latest={};statuses().forEach(function(x){if(!x||!x.machineKey)return;var o=latest[x.machineKey];if(!o||String(x.updatedAt||'')>String(o.updatedAt||''))latest[x.machineKey]=x});return Object.keys(latest).map(function(k){return latest[k]}).filter(function(x){return x.status!=='FINALIZADA'})}

  function build(){
    var edit=canEdit(),role=edit?'<div class="dfNowOwnerOk">👑 DONO RECONHECIDO — você pode definir o que está rodando.</div>':'';
    var admin=edit?'<div id="dfNowAdminForm"><h4>DEFINIR O QUE ESTÁ RODANDO</h4><div class="grid"><div><label>MÁQUINA</label><input id="dfNowMachine" placeholder="Ex.: Máquina 1"></div><div><label>STATUS</label><select id="dfNowStatus"><option>RODANDO</option><option>PARADA</option><option>AJUSTE</option><option>TROCA DE MATERIAL</option><option>FINALIZADA</option></select></div><div id="dfNowIdentify"><label>OP GERADA</label><input id="dfNowSelectedOp" type="hidden"><div class="dfNowMethod"><button id="dfNowReadOp" type="button">📷 LER OP</button></div><div class="dfNowRow"><input id="dfNowCode" autocomplete="off" autocapitalize="characters" placeholder="DIGITE O CÓDIGO DFOP"><button id="dfNowFindCode" type="button">BUSCAR OP</button></div><div class="dfNowRow"><input id="dfNowName" autocomplete="off" placeholder="NOME / PRODUTO: Ex. Pesadão, Plaschique"><button id="dfNowFindName" type="button">BUSCAR NOME</button></div><input id="dfNowQrFile" type="file" accept="image/*" capture="environment" style="display:none"><div id="dfNowSelectedInfo" class="dfNowInfo">Leia o QR, digite o código ou procure pelo nome.</div><div id="dfNowNameResults" class="dfNowResults"></div><button id="dfNowDeleteOpen" class="dfNowDelete" type="button">🗑 EXCLUIR OPS GERADAS</button><div id="dfNowDeletePanel"></div></div><div><label>OPERADOR</label><input id="dfNowOperator" placeholder="Nome do operador"></div><div><label>INÍCIO</label><input id="dfNowStart" type="time"></div></div><button id="dfNowSave" type="button">✅ PUBLICAR STATUS</button></div>':'<div class="dfNowReadOnly">👁️ Somente visualização. Somente o dono da equipe pode definir o que está rodando.</div>';
    return '<div class="dfNowHead"><h3>🏭 PRODUÇÃO AGORA</h3><p>Veja o que está rodando nas máquinas neste momento.</p>'+role+'<div class="dfNowKpis"><div class="dfNowKpi"><span>RODANDO</span><b id="dfNowRunning">0</b></div><div class="dfNowKpi"><span>PARADAS</span><b id="dfNowStopped">0</b></div><div class="dfNowKpi"><span>AJUSTE</span><b id="dfNowAdjust">0</b></div></div><div id="dfNowCloudMsg"></div></div><div id="dfNowList"></div>'+admin;
  }

  function render(){
    var list=$('dfNowList');if(!list)return;var a=activeList(),own=canEdit();
    if($('dfNowRunning'))$('dfNowRunning').textContent=a.filter(function(x){return x.status==='RODANDO'}).length;
    if($('dfNowStopped'))$('dfNowStopped').textContent=a.filter(function(x){return x.status==='PARADA'}).length;
    if($('dfNowAdjust'))$('dfNowAdjust').textContent=a.filter(function(x){return x.status==='AJUSTE'||x.status==='TROCA DE MATERIAL'}).length;
    if(!a.length){list.innerHTML='<div class="dfOpsStatus">Nenhuma máquina marcada como ativa agora.</div>';return}
    a.sort(function(x,y){return String(x.machine||'').localeCompare(String(y.machine||''))});
    list.innerHTML=a.map(function(x){var c=sc(x.status),acts=own?'<div class="dfNowActions"><button data-now-edit="'+esc(x.machineKey)+'">✏️ EDITAR</button><button class="done" data-now-done="'+esc(x.machineKey)+'">⏹ FINALIZAR</button></div>':'';return '<div class="dfNowCard '+c+'"><div class="dfNowTop"><div class="dfNowMachine">'+esc(x.machine||'Máquina')+'</div><span class="dfNowBadge '+c+'">'+esc(x.status||'')+'</span></div><div class="dfNowProduct">'+esc(x.product||'Sem produto')+'</div><div class="dfNowMeta">OP: <b>'+esc(x.op||'—')+'</b><br>Operador: <b>'+esc(x.operator||'—')+'</b><br>Início: <b>'+hm(x.startedAt)+'</b> • Atualizado: <b>'+hm(x.updatedAt)+'</b></div>'+acts+'</div>'}).join('');
    if(own){Array.prototype.forEach.call(list.querySelectorAll('[data-now-edit]'),function(b){b.onclick=function(){edit(b.getAttribute('data-now-edit'))}});Array.prototype.forEach.call(list.querySelectorAll('[data-now-done]'),function(b){b.onclick=function(){finish(b.getAttribute('data-now-done'))}})}
  }
  function msg(t){var e=$('dfNowSelectedInfo');if(e)e.innerHTML=t||''}
  function choose(x,source){if(!x)return false;var e=x.expected||{};if($('dfNowSelectedOp'))$('dfNowSelectedOp').value=x.id||'';if($('dfNowCode'))$('dfNowCode').value=x.id||'';msg('✅ <b>OP:</b> '+esc(x.id||'')+(e.title?'<br><b>Produto:</b> '+esc(e.title):'')+(source?'<br><span style="color:#94a3b8">'+esc(source)+'</span>':'') );if($('dfNowNameResults'))$('dfNowNameResults').innerHTML='';return true}
  function chooseCode(v,source){var code=normalize(v);if(!validCode(code)){msg('⚠️ Digite um código DFOP válido.');return false}var x=findCode(code)||recoverCode(code);return choose(x,source||'Código informado')}
  function searchName(){var q=$('dfNowName'),r=$('dfNowNameResults');if(!q||!r)return;var a=findName(q.value);if(!a.length){r.innerHTML='';msg('⚠️ Nenhuma OP encontrada com esse nome.');return}r.innerHTML=a.map(function(x,i){var e=x.expected||{};return '<button type="button" data-now-result="'+i+'"><b>'+esc(e.title||'Sem nome')+'</b><br>'+esc(x.id)+'</button>'}).join('');Array.prototype.forEach.call(r.querySelectorAll('[data-now-result]'),function(b){b.onclick=function(){choose(a[Number(b.getAttribute('data-now-result'))],'Encontrada pelo nome')}})}
  function deletePanel(){
    var p=$('dfNowDeletePanel');if(!p)return;p.style.display=p.style.display==='block'?'none':'block';if(p.style.display!=='block')return;
    var a=entries();p.innerHTML=a.length?a.map(function(x,i){var e=x.expected||{};return '<div class="dfNowDelItem"><span>'+esc(e.title||'Sem nome')+'<br><small>'+esc(x.id)+'</small></span><button type="button" data-now-del="'+i+'">EXCLUIR</button></div>'}).join(''):'<div class="dfNowInfo">Nenhuma OP gerada.</div>';
    Array.prototype.forEach.call(p.querySelectorAll('[data-now-del]'),function(b){b.onclick=function(){var x=a[Number(b.getAttribute('data-now-del'))];if(!x)return;if(!confirm('Excluir a OP '+x.id+' da lista de OPs geradas?'))return;deleteEntry(x.id);if($('dfNowSelectedOp')&&$('dfNowSelectedOp').value===x.id){$('dfNowSelectedOp').value='';if($('dfNowCode'))$('dfNowCode').value='';msg('OP excluída. Leia, digite ou procure outra OP.')}p.style.display='none';deletePanel()}})
  }

  function loadQR(){return new Promise(function(res,rej){if(window.jsQR)return res();var old=document.querySelector('script[data-df-now-qr="167"]');if(old){old.addEventListener('load',res,{once:true});old.addEventListener('error',function(){rej(new Error('Falha ao carregar leitor'))},{once:true});return}var s=document.createElement('script');s.dataset.dfNowQr='167';s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=res;s.onerror=function(){rej(new Error('Falha ao carregar leitor'))};document.head.appendChild(s)})}
  function canvas(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function imageCanvas(file){return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){var sc=Math.min(1,1800/Math.max(img.width,img.height)),c=canvas(img.width*sc,img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Foto inválida'))};img.src=u})}
  function rotate(src,d){d=((d%360)+360)%360;if(!d)return src;var swap=d===90||d===270,c=canvas(swap?src.height:src.width,swap?src.width:src.height),g=c.getContext('2d',{willReadFrequently:true});g.save();if(d===90){g.translate(c.width,0);g.rotate(Math.PI/2)}else if(d===180){g.translate(c.width,c.height);g.rotate(Math.PI)}else{g.translate(0,c.height);g.rotate(-Math.PI/2)}g.drawImage(src,0,0);g.restore();return c}
  function scan(c){try{var g=c.getContext('2d',{willReadFrequently:true}),d=g.getImageData(0,0,c.width,c.height),r=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});return r&&r.data||''}catch(e){return''}}
  async function readQR(file){if(!file||qrBusy)return;qrBusy=true;msg('📷 Lendo QR da OP...');try{await loadQR();var base=await imageCanvas(file),degs=[0,90,180,270],q='';for(var i=0;i<degs.length&&!q;i++)q=scan(rotate(base,degs[i]));if(!q){msg('⚠️ Não consegui ler o QR. Digite o código ou procure pelo nome.');return}chooseCode(q,'Lida pelo QR')}catch(e){msg('⚠️ Não consegui ler o QR. Digite o código ou procure pelo nome.')}finally{qrBusy=false;try{if($('dfNowQrFile'))$('dfNowQrFile').value=''}catch(e){}}}

  async function commit(rec){
    if(!canEdit())return;var a=statuses().filter(function(x){return x.machineKey!==rec.machineKey});a.unshift(rec);saveStatuses(a);setCloudMsg('⏳ Publicando para a equipe...','');
    try{if(await publishCloud(rec)){setCloudMsg('✅ Status publicado para a equipe','ok');setTimeout(syncCloud,500)}else setCloudMsg('⚠️ Sem equipe conectada. Salvo apenas neste aparelho.','warn')}catch(e){setCloudMsg('⚠️ Não consegui publicar agora. Salvo neste aparelho.','warn')}
  }
  function saveForm(){
    if(!canEdit())return;var m=$('dfNowMachine'),st=$('dfNowStatus'),sel=$('dfNowSelectedOp'),opn=$('dfNowOperator'),ti=$('dfNowStart');if(!m||!st||!sel)return;
    var machine=String(m.value||'').trim(),status=st.value,op=sel.value,operator=String(opn&&opn.value||'').trim();if(!machine){alert('Digite a máquina.');return}if(status==='RODANDO'&&!op){alert('Leia, digite ou procure a OP que está rodando.');return}
    var ent=findCode(op)||{},exp=ent.expected||{},tv=ti&&ti.value||new Date().toTimeString().slice(0,5),d=new Date(),parts=tv.split(':');d.setHours(Number(parts[0])||0,Number(parts[1])||0,0,0);
    var key=machineKey(machine)||('m-'+Date.now()),old=statuses().find(function(x){return x&&x.machineKey===key}),rec={machineKey:key,machine:machine,status:status,op:op||'',product:exp.title||(old&&old.product)||'',operator:operator,startedAt:old&&old.status==='RODANDO'&&status==='RODANDO'?old.startedAt:d.toISOString(),updatedAt:now()};
    commit(rec);m.value='';if(opn)opn.value='';st.value='RODANDO';sel.value='';if($('dfNowCode'))$('dfNowCode').value='';if($('dfNowName'))$('dfNowName').value='';if($('dfNowNameResults'))$('dfNowNameResults').innerHTML='';if(ti)ti.value=new Date().toTimeString().slice(0,5);msg('Leia o QR, digite o código ou procure pelo nome.');
  }
  function edit(key){if(!canEdit())return;var x=statuses().find(function(v){return v&&v.machineKey===key});if(!x)return;if($('dfNowMachine'))$('dfNowMachine').value=x.machine||'';if($('dfNowStatus'))$('dfNowStatus').value=x.status||'RODANDO';if($('dfNowOperator'))$('dfNowOperator').value=x.operator||'';if($('dfNowStart'))try{$('dfNowStart').value=new Date(x.startedAt||Date.now()).toTimeString().slice(0,5)}catch(e){}var ent=findCode(x.op)||recoverCode(x.op);if(ent)choose(ent,'Status atual');var f=$('dfNowAdminForm');if(f)f.scrollIntoView({behavior:'smooth',block:'center'})}
  function finish(key){if(!canEdit())return;var x=statuses().find(function(v){return v&&v.machineKey===key});if(!x)return;commit(Object.assign({},x,{status:'FINALIZADA',updatedAt:now()}))}

  function bind(){
    if(!canEdit())return;
    if($('dfNowReadOp'))$('dfNowReadOp').onclick=function(){if($('dfNowQrFile'))$('dfNowQrFile').click()};
    if($('dfNowQrFile'))$('dfNowQrFile').onchange=function(e){var f=e.target.files&&e.target.files[0];if(f)readQR(f)};
    if($('dfNowFindCode'))$('dfNowFindCode').onclick=function(){chooseCode($('dfNowCode').value,'Código digitado')};
    if($('dfNowCode'))$('dfNowCode').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();chooseCode(e.target.value,'Código digitado')}};
    if($('dfNowFindName'))$('dfNowFindName').onclick=searchName;
    if($('dfNowName'))$('dfNowName').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();searchName()}};
    if($('dfNowDeleteOpen'))$('dfNowDeleteOpen').onclick=deletePanel;
    if($('dfNowSave'))$('dfNowSave').onclick=saveForm;
    if($('dfNowStart')&&!$('dfNowStart').value)$('dfNowStart').value=new Date().toTimeString().slice(0,5);
  }

  function positionTab(tabs,tab){var pending=tabs.querySelector('[data-pane="pending"]');if(pending&&pending.nextElementSibling!==tab)pending.insertAdjacentElement('afterend',tab)}
  function renderPane(pane){pane.dataset.dfNowVersion='167';pane.dataset.mode=canEdit()?'owner':'view';pane.innerHTML=build();bind();render()}
  function mount(){
    addStyle();var root=$('dfFormulaOps');if(!root)return false;var tabs=root.querySelector('.dfOpsTabs');if(!tabs)return false;
    var tab=$('dfNowTab');if(!tab||!tabs.contains(tab)){if(tab&&tab.parentNode)tab.parentNode.removeChild(tab);tab=document.createElement('button');tab.id='dfNowTab';tab.setAttribute('data-pane','now');tab.textContent='🏭 AGORA';tabs.appendChild(tab)}positionTab(tabs,tab);
    var pane=$('dfPaneNow');if(!pane||!root.contains(pane)){if(pane&&pane.parentNode)pane.parentNode.removeChild(pane);pane=document.createElement('div');pane.id='dfPaneNow';pane.className='dfOpsPane';root.appendChild(pane);renderPane(pane)}else if(pane.dataset.dfNowVersion!=='167'||pane.dataset.mode!==(canEdit()?'owner':'view'))renderPane(pane);
    tab.onclick=openNow;mountedRoot=root;mountAttempts=0;return true;
  }
  function openNow(){if(!mount())return;var root=$('dfFormulaOps');if(!root)return;Array.prototype.forEach.call(root.querySelectorAll('.dfOpsTabs button'),function(b){b.classList.toggle('on',b.id==='dfNowTab')});Array.prototype.forEach.call(root.querySelectorAll('.dfOpsPane'),function(p){p.classList.remove('on')});if($('dfPaneNow'))$('dfPaneNow').classList.add('on');render();syncCloud()}
  function scheduleMount(delay){clearTimeout(mountTimer);mountTimer=setTimeout(function(){if(!mount()&&mountAttempts++<16)scheduleMount(250)},delay==null?80:delay)}
  function paneOpen(){var p=$('dfPaneNow');return !!(p&&p.classList.contains('on'))}
  function boot(){
    migrate();purgeSynthetic();scheduleMount(60);
    window.addEventListener('df-ui-ready',function(){scheduleMount(80)});
    window.addEventListener('df-team-changed',function(){scheduleMount(80)});
    window.addEventListener('df-team-joined',function(){scheduleMount(80)});
    window.addEventListener('pageshow',function(){scheduleMount(80);if(paneOpen())syncCloud()});
    window.addEventListener('online',function(){if(paneOpen())syncCloud()});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&paneOpen())syncCloud()});
    window.addEventListener('df-op-remote-merged',function(){purgeSynthetic();setTimeout(hideSyntheticCloudRows,40)});
    document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('#btFo,#dfFormTabOps,[data-pane="ops"],[data-pane="ok"],[data-pane="pending"],[data-pane="archive"]'):null;if(t)scheduleMount(80)},true);
    setInterval(function(){if(!document.hidden&&paneOpen())syncCloud()},30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
