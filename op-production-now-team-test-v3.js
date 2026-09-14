(function(){
  'use strict';
  if(window.DFProductionNowTeamTestV3)return;
  window.DFProductionNowTeamTestV3=true;

  var TEAM_KEY='df_op_team_v1';
  var REG_KEY='df_op_qr_registry_v1';
  var STATUS_KEY='df_production_now_team_test_v3';
  var OLD_TEST_KEY='df_production_now_team_test_v2';
  var OLD_LOCAL_KEY='df_production_now_v1';
  var mountQueued=false;

  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function loadJson(k,f){try{var raw=localStorage.getItem(k);if(!raw)return f;var v=JSON.parse(raw);return v==null?f:v}catch(e){return f}}
  function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function now(){return new Date().toISOString()}
  function hm(v){var d=new Date(v||Date.now());return isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function team(){return loadJson(TEAM_KEY,null)}
  function owner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
  function registry(){var r=loadJson(REG_KEY,{});return r&&typeof r==='object'?r:{}}
  function load(){var a=loadJson(STATUS_KEY,[]);return Array.isArray(a)?a:[]}
  function save(a){saveJson(STATUS_KEY,a);render()}

  function migrate(){
    try{
      if(localStorage.getItem(STATUS_KEY)!==null)return;
      var raw=localStorage.getItem(OLD_TEST_KEY);
      if(raw===null)raw=localStorage.getItem(OLD_LOCAL_KEY);
      if(raw!==null){var a=JSON.parse(raw||'[]');if(Array.isArray(a))saveJson(STATUS_KEY,a)}
    }catch(e){}
  }

  function addStyle(){
    if($('dfProdNowTestV3Style'))return;
    var s=document.createElement('style');s.id='dfProdNowTestV3Style';s.textContent=
      '#dfPaneNow{display:none}#dfPaneNow.on{display:block}'+
      '.dfNowHead{border:1px solid #2563eb;background:linear-gradient(180deg,#0b1f42,#101827);border-radius:18px;padding:14px;margin-bottom:12px}'+
      '.dfNowHead h3{margin:0 0 5px;color:#bfdbfe}.dfNowHead p{margin:0;color:#94a3b8;font-size:11px;line-height:1.45}'+
      '.dfNowKpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.dfNowKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:10px}.dfNowKpi span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.dfNowKpi b{display:block;font-size:20px;margin-top:3px}'+
      '.dfNowCard{border:1px solid #263244;background:#0f172a;border-radius:16px;padding:13px;margin-top:9px}.dfNowCard.run{border-color:#166534}.dfNowCard.stop{border-color:#7f1d1d}.dfNowCard.adjust{border-color:#a16207}'+
      '.dfNowTop{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.dfNowMachine{font-size:17px;font-weight:950}.dfNowBadge{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}.dfNowBadge.run{background:#0c321c;color:#86efac}.dfNowBadge.stop{background:#230b0b;color:#fca5a5}.dfNowBadge.adjust{background:#3a2605;color:#fde68a}.dfNowProduct{font-size:20px;font-weight:950;color:#ffd36a;margin:8px 0 5px}.dfNowMeta{color:#cbd5e1;font-size:11px;line-height:1.55}'+
      '.dfNowActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.dfNowActions button{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:9px;font-size:11px;font-weight:900}.dfNowActions .done{border-color:#7f1d1d;color:#fca5a5}'+
      '#dfNowAdminForm{border:1px solid #f5a000;background:#17120a;border-radius:16px;padding:13px;margin-top:12px}#dfNowAdminForm h4{margin:0 0 8px;color:#ffd36a}#dfNowAdminForm .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#dfNowAdminForm label{display:block;color:#cbd5e1;font-size:10px;font-weight:850;margin:6px 0 4px}#dfNowAdminForm input,#dfNowAdminForm select{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px}#dfNowSave{width:100%;margin-top:10px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:11px;padding:12px;font-weight:950}.dfNowReadOnly{border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:10px;font-size:11px;margin-top:10px}.dfNowOpInfo{margin-top:6px;color:#93c5fd;font-size:10px;line-height:1.4}.dfNowTestNote{margin-top:8px;color:#fde68a;font-size:10px}'+
      '@media(max-width:430px){#dfNowAdminForm .grid{grid-template-columns:1fr}.dfNowProduct{font-size:18px}}';
    document.head.appendChild(s);
  }

  function statusClass(v){v=String(v||'').toLowerCase();if(v==='rodando')return'run';if(v==='parada')return'stop';return'adjust'}
  function opOptions(){
    var r=registry(),out=[];
    Object.keys(r).forEach(function(k){var x=r[k];if(x&&x.id&&String(x.id).indexOf('DFOP-')===0)out.push(x)});
    out.sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''))});
    return out;
  }
  function opLabel(x){var e=x.expected||{},t=String(e.title||'').trim()||'OP sem nome';return t+' — '+x.id}
  function fillOps(selected){var s=$('dfNowOpSelect');if(!s)return;var list=opOptions();s.innerHTML='<option value="">SELECIONE UMA OP GERADA</option>'+list.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(opLabel(x))+'</option>'}).join('');if(selected)s.value=selected;showOpInfo()}
  function showOpInfo(){var s=$('dfNowOpSelect'),e=$('dfNowOpInfo');if(!s||!e)return;var x=registry()[s.value],p=x&&x.expected||{};if(!x){e.textContent='Selecione uma OP para puxar automaticamente o código DFOP e o produto.';return}e.textContent='Código: '+x.id+' • Produto: '+(p.title||'—')+(p.largura?' • Largura: '+p.largura:'')+(p.micra?' • Micra: '+p.micra:'')}

  function build(){
    var edit=owner();
    var admin=edit?'<div id="dfNowAdminForm"><h4>ATUALIZAR PRODUÇÃO</h4><div class="grid"><div><label>MÁQUINA</label><input id="dfNowMachine" placeholder="Ex.: Máquina 1"></div><div><label>STATUS</label><select id="dfNowStatus"><option>RODANDO</option><option>PARADA</option><option>AJUSTE</option><option>TROCA DE MATERIAL</option><option>FINALIZADA</option></select></div><div style="grid-column:1/-1"><label>OP GERADA</label><select id="dfNowOpSelect"></select><div id="dfNowOpInfo" class="dfNowOpInfo"></div></div><div><label>OPERADOR</label><input id="dfNowOperator" placeholder="Nome do operador"></div><div><label>INÍCIO</label><input id="dfNowStart" type="time"></div></div><button id="dfNowSave" type="button">✅ SALVAR STATUS NO TESTE</button><div class="dfNowTestNote">Versão de teste: não publica status na nuvem da equipe.</div></div>':'<div class="dfNowReadOnly">👁️ Somente visualização. Somente o dono da equipe pode definir o que está rodando.</div>';
    return '<div class="dfNowHead"><h3>🏭 PRODUÇÃO AGORA</h3><p>Veja o que está rodando nas máquinas neste momento.</p><div class="dfNowKpis"><div class="dfNowKpi"><span>RODANDO</span><b id="dfNowRunning">0</b></div><div class="dfNowKpi"><span>PARADAS</span><b id="dfNowStopped">0</b></div><div class="dfNowKpi"><span>AJUSTE</span><b id="dfNowAdjust">0</b></div></div></div><div id="dfNowList"></div>'+admin;
  }

  function activeList(){var latest={};load().forEach(function(x){if(!x||!x.machineKey)return;var o=latest[x.machineKey];if(!o||String(x.updatedAt||'')>String(o.updatedAt||''))latest[x.machineKey]=x});return Object.keys(latest).map(function(k){return latest[k]}).filter(function(x){return x.status!=='FINALIZADA'})}
  function render(){
    var list=$('dfNowList');if(!list)return;var a=activeList(),own=owner();
    if($('dfNowRunning'))$('dfNowRunning').textContent=a.filter(function(x){return x.status==='RODANDO'}).length;
    if($('dfNowStopped'))$('dfNowStopped').textContent=a.filter(function(x){return x.status==='PARADA'}).length;
    if($('dfNowAdjust'))$('dfNowAdjust').textContent=a.filter(function(x){return x.status==='AJUSTE'||x.status==='TROCA DE MATERIAL'}).length;
    if(!a.length){list.innerHTML='<div class="dfOpsStatus">Nenhuma máquina marcada como ativa agora.</div>';return}
    a.sort(function(x,y){return String(x.machine||'').localeCompare(String(y.machine||''))});
    list.innerHTML=a.map(function(x){var c=statusClass(x.status),acts=own?'<div class="dfNowActions"><button data-edit="'+esc(x.machineKey)+'">✏️ EDITAR</button><button class="done" data-done="'+esc(x.machineKey)+'">⏹ FINALIZAR</button></div>':'';return '<div class="dfNowCard '+c+'"><div class="dfNowTop"><div class="dfNowMachine">'+esc(x.machine||'Máquina')+'</div><span class="dfNowBadge '+c+'">'+esc(x.status||'')+'</span></div><div class="dfNowProduct">'+esc(x.product||'Sem produto')+'</div><div class="dfNowMeta">OP: <b>'+esc(x.op||'—')+'</b><br>Operador: <b>'+esc(x.operator||'—')+'</b><br>Início: <b>'+hm(x.startedAt)+'</b> • Atualizado: <b>'+hm(x.updatedAt)+'</b></div>'+acts+'</div>'}).join('');
    if(own){Array.prototype.forEach.call(list.querySelectorAll('[data-edit]'),function(b){b.onclick=function(){edit(b.getAttribute('data-edit'))}});Array.prototype.forEach.call(list.querySelectorAll('[data-done]'),function(b){b.onclick=function(){finish(b.getAttribute('data-done'))}})}
  }

  function machineKey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function saveForm(){
    if(!owner())return;
    var m=$('dfNowMachine'),st=$('dfNowStatus'),os=$('dfNowOpSelect'),opn=$('dfNowOperator'),ti=$('dfNowStart');
    if(!m||!st||!os)return;
    var machine=String(m.value||'').trim(),status=st.value,op=os.value,operator=String(opn&&opn.value||'').trim();
    if(!machine){alert('Digite a máquina.');return}if(status==='RODANDO'&&!op){alert('Selecione a OP que está rodando.');return}
    var ent=registry()[op]||{},exp=ent.expected||{},tv=ti&&ti.value||new Date().toTimeString().slice(0,5),d=new Date(),parts=tv.split(':');d.setHours(Number(parts[0])||0,Number(parts[1])||0,0,0);
    var key=machineKey(machine)||('m-'+Date.now()),a=load(),old=null;a.forEach(function(x){if(x&&x.machineKey===key)old=x});
    var rec={machineKey:key,machine:machine,status:status,op:op||'',product:exp.title||(old&&old.product)||'',operator:operator,startedAt:old&&old.status==='RODANDO'&&status==='RODANDO'?old.startedAt:d.toISOString(),updatedAt:now()};
    a=a.filter(function(x){return !x||x.machineKey!==key});a.unshift(rec);save(a);
    m.value='';if(opn)opn.value='';st.value='RODANDO';if(ti)ti.value=new Date().toTimeString().slice(0,5);fillOps();
  }
  function edit(key){if(!owner())return;var x=null;load().forEach(function(v){if(v&&v.machineKey===key)x=v});if(!x)return;if($('dfNowMachine'))$('dfNowMachine').value=x.machine||'';if($('dfNowStatus'))$('dfNowStatus').value=x.status||'RODANDO';if($('dfNowOperator'))$('dfNowOperator').value=x.operator||'';fillOps(x.op||'');try{if($('dfNowStart'))$('dfNowStart').value=new Date(x.startedAt||Date.now()).toTimeString().slice(0,5)}catch(e){}var f=$('dfNowAdminForm');if(f)f.scrollIntoView({behavior:'smooth',block:'center'})}
  function finish(key){if(!owner())return;var a=load(),x=null;a.forEach(function(v){if(v&&v.machineKey===key)x=v});if(!x)return;a=a.filter(function(v){return !v||v.machineKey!==key});a.unshift(Object.assign({},x,{status:'FINALIZADA',updatedAt:now()}));save(a)}

  function bind(){if(!owner())return;var b=$('dfNowSave'),s=$('dfNowOpSelect'),t=$('dfNowStart');if(b)b.onclick=saveForm;if(s)s.onchange=showOpInfo;if(t&&!t.value)t.value=new Date().toTimeString().slice(0,5);fillOps()}
  function openNow(){ensure();var root=$('dfFormulaOps');if(!root)return;Array.prototype.forEach.call(root.querySelectorAll('.dfOpsTabs button'),function(b){b.classList.toggle('on',b.id==='dfNowTab')});Array.prototype.forEach.call(root.querySelectorAll('.dfOpsPane'),function(p){p.classList.remove('on')});var pane=$('dfPaneNow');if(pane)pane.classList.add('on');render()}

  function ensure(){
    addStyle();
    var root=$('dfFormulaOps');if(!root)return false;
    var tabs=root.querySelector('.dfOpsTabs');if(!tabs)return false;
    var tab=$('dfNowTab');
    if(!tab||!tabs.contains(tab)){
      if(tab&&tab.parentNode)tab.parentNode.removeChild(tab);
      tab=document.createElement('button');tab.id='dfNowTab';tab.setAttribute('data-pane','now');tab.textContent='🏭 AGORA';tabs.appendChild(tab);
    }
    tab.onclick=openNow;
    var pane=$('dfPaneNow'),mode=owner()?'owner':'view';
    if(!pane||!root.contains(pane)){
      if(pane&&pane.parentNode)pane.parentNode.removeChild(pane);
      pane=document.createElement('div');pane.id='dfPaneNow';pane.className='dfOpsPane';root.appendChild(pane);
    }
    if(pane.getAttribute('data-mode')!==mode){pane.setAttribute('data-mode',mode);pane.innerHTML=build();bind();render()}
    else{bind();render()}
    return true;
  }
  function queueEnsure(){if(mountQueued)return;mountQueued=true;setTimeout(function(){mountQueued=false;ensure()},40)}

  function boot(){
    migrate();addStyle();queueEnsure();
    var mo=new MutationObserver(function(){queueEnsure()});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('df-ui-ready',queueEnsure);
    window.addEventListener('df-team-changed',queueEnsure);
    window.addEventListener('df-team-joined',queueEnsure);
    window.addEventListener('pageshow',queueEnsure);
    document.addEventListener('click',function(e){var t=e.target;if(t&&(t.id==='dfFormTabOps'||(t.closest&&t.closest('#dfFormTabOps'))))setTimeout(queueEnsure,80)},true);
    setInterval(function(){if(!document.hidden)ensure()},2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
