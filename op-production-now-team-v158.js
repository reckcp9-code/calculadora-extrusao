(function(){
  'use strict';
  if(window.DFProductionNowTeamV158)return;
  window.DFProductionNowTeamV158=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TEAM_KEY='df_op_team_v1';
  const REG_KEY='df_op_qr_registry_v1';
  const OPS_KEY='df_formula_ops_auto_v2';
  const STATUS_KEY='df_production_now_team_v1';
  const TEST_STATUS_KEY='df_production_now_team_test_v2';
  const OLD_STATUS_KEY='df_production_now_v1';
  const ADMIN_SECRET_KEY='df_access_admin_secret_saved_v1';
  const ADMIN_OK_KEY='df_production_admin_verified_v1';
  let isAdmin=false;

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const now=()=>new Date().toISOString();
  const hm=v=>{const d=new Date(v||Date.now());return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  const loadJson=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'');return v??f}catch(e){return f}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const teamNow=()=>loadJson(TEAM_KEY,null);
  const registry=()=>loadJson(REG_KEY,{});

  function migrate(){
    try{
      if(localStorage.getItem(STATUS_KEY)!==null)return;
      const test=localStorage.getItem(TEST_STATUS_KEY),old=localStorage.getItem(OLD_STATUS_KEY);
      if(test!==null)localStorage.setItem(STATUS_KEY,test);
      else if(old!==null){
        const a=JSON.parse(old||'[]');
        if(Array.isArray(a)){
          const mapped=a.map(x=>({machineKey:String(x.id||x.machine||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),machine:x.machine||'',status:x.status||'RODANDO',product:x.product||'',op:x.op||'',operator:x.operator||'',startedAt:x.startedAt||now(),updatedAt:x.updatedAt||now()}));
          localStorage.setItem(STATUS_KEY,JSON.stringify(mapped));
        }
      }
    }catch(e){}
  }
  const load=()=>{const a=loadJson(STATUS_KEY,[]);return Array.isArray(a)?a:[]};
  const save=a=>{saveJson(STATUS_KEY,a);render()};

  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
  async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw new Error('acesso indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token}
  async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
  async function apiForm(path,form,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'X-DF-Device':dev},body:form,cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiForm(path,form,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}

  async function resolveAdmin(){
    let secret='';try{secret=String(localStorage.getItem(ADMIN_SECRET_KEY)||'').trim()}catch(e){}
    if(!secret){isAdmin=false;return false}
    if(navigator.onLine===false){isAdmin=localStorage.getItem(ADMIN_OK_KEY)==='1';return isAdmin}
    try{
      const r=await fetch(API+'/admin/access/status',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':secret},body:'{}',cache:'no-store'});
      let j={};try{j=await r.json()}catch(e){}
      isAdmin=!!(r.ok&&j.ok!==false);
      if(isAdmin)localStorage.setItem(ADMIN_OK_KEY,'1');else localStorage.removeItem(ADMIN_OK_KEY);
    }catch(e){isAdmin=localStorage.getItem(ADMIN_OK_KEY)==='1'}
    return isAdmin;
  }

  function enc(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function dec(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
  function month(off){const d=new Date();d.setMonth(d.getMonth()+(off||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function tinyBlob(){const b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,c=>c.charCodeAt(0))],{type:'image/png'})}

  async function publishCloud(rec){const t=teamNow();if(!t||!t.teamId)return false;const payload={...rec,v:3,updatedAt:now()};const form=new FormData();form.append('teamId',t.teamId);form.append('sourceId','DFSTATUS-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));form.append('qr','DFSTATUS3.'+enc(payload));form.append('production','0');form.append('scrap','0');form.append('createdAt',payload.updatedAt);form.append('photo',tinyBlob(),'status.png');await apiForm('/op/photo/upload',form);return true}
  function applyCloud(photos){const latest={};for(const p of photos||[]){const q=String(p.qr||'');let x=null;if(q.startsWith('DFSTATUS3.'))x=dec(q.slice(10));else if(q.startsWith('DFSTATUS2.'))x=dec(q.slice(10));if(!x||!x.machineKey)continue;const old=latest[x.machineKey];if(!old||String(x.updatedAt||'')>String(old.updatedAt||''))latest[x.machineKey]=x}const vals=Object.values(latest);if(vals.length){saveJson(STATUS_KEY,vals);render()}}
  async function syncCloud(){const t=teamNow();if(!t||!t.teamId||navigator.onLine===false)return;try{const a=await apiPost('/op/photo/list',{teamId:t.teamId,month:month(0)}),b=await apiPost('/op/photo/list',{teamId:t.teamId,month:month(-1)});applyCloud([...(a.photos||[]),...(b.photos||[])]);setCloudMsg('☁️ Status sincronizado com a equipe','ok')}catch(e){setCloudMsg('⚠️ Status aguardando sincronização','warn')}}

  function purgeSynthetic(){const a=loadJson(OPS_KEY,[]);if(!Array.isArray(a))return;const b=a.filter(x=>!String(x&&x.id||'').startsWith('DFSTATUS-'));if(b.length!==a.length)saveJson(OPS_KEY,b)}
  function hideSyntheticCloudRows(){document.querySelectorAll('.dfCloudPhotoRow').forEach(r=>{if(/DFSTATUS[23]\./.test(r.textContent||''))r.style.display='none'})}

  function style(){if($('dfProdNowV158Style'))return;const s=document.createElement('style');s.id='dfProdNowV158Style';s.textContent=`#dfPaneNow{display:none}#dfPaneNow.on{display:block}.dfNowHead{border:1px solid #2563eb;background:linear-gradient(180deg,#0b1f42,#101827);border-radius:18px;padding:14px;margin-bottom:12px}.dfNowHead h3{margin:0 0 5px;color:#bfdbfe}.dfNowHead p{margin:0;color:#94a3b8;font-size:11px;line-height:1.45}.dfNowKpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.dfNowKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:10px}.dfNowKpi span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.dfNowKpi b{display:block;font-size:20px;margin-top:3px}.dfNowCard{border:1px solid #263244;background:#0f172a;border-radius:16px;padding:13px;margin-top:9px}.dfNowCard.run{border-color:#166534}.dfNowCard.stop{border-color:#7f1d1d}.dfNowCard.adjust{border-color:#a16207}.dfNowTop{display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.dfNowMachine{font-size:17px;font-weight:950}.dfNowBadge{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:950}.dfNowBadge.run{background:#0c321c;color:#86efac}.dfNowBadge.stop{background:#230b0b;color:#fca5a5}.dfNowBadge.adjust{background:#3a2605;color:#fde68a}.dfNowProduct{font-size:20px;font-weight:950;color:#ffd36a;margin:8px 0 5px}.dfNowMeta{color:#cbd5e1;font-size:11px;line-height:1.55}.dfNowActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.dfNowActions button{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:9px;font-size:11px;font-weight:900}.dfNowActions .done{border-color:#7f1d1d;color:#fca5a5}#dfNowAdminForm{border:1px solid #f5a000;background:#17120a;border-radius:16px;padding:13px;margin-top:12px}#dfNowAdminForm h4{margin:0 0 8px;color:#ffd36a}#dfNowAdminForm .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#dfNowAdminForm label{display:block;color:#cbd5e1;font-size:10px;font-weight:850;margin:6px 0 4px}#dfNowAdminForm input,#dfNowAdminForm select{width:100%;box-sizing:border-box;border:1px solid #334155;background:#080f1d;color:#fff;border-radius:10px;padding:10px;font-size:14px}#dfNowSave{width:100%;margin-top:10px;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:11px;padding:12px;font-weight:950}.dfNowReadOnly{border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:10px;font-size:11px;margin-top:10px}#dfNowCloudMsg{font-size:10px;margin-top:8px;color:#94a3b8}#dfNowCloudMsg.ok{color:#86efac}#dfNowCloudMsg.warn{color:#fde68a}.dfNowOpInfo{margin-top:6px;color:#93c5fd;font-size:10px;line-height:1.4}@media(max-width:430px){#dfNowAdminForm .grid{grid-template-columns:1fr}.dfNowProduct{font-size:18px}}`;document.head.appendChild(s)}
  function sc(v){v=String(v||'').toLowerCase();if(v==='rodando')return'run';if(v==='parada')return'stop';return'adjust'}
  function setCloudMsg(t,c){const e=$('dfNowCloudMsg');if(e){e.textContent=t;e.className=c||''}}

  function opOptions(){const r=registry();return Object.values(r).filter(x=>x&&x.id&&String(x.id).startsWith('DFOP-')).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))}
  function opLabel(x){const e=x.expected||{},title=String(e.title||'').trim()||'OP sem nome';return title+' — '+x.id}
  function fillOps(selected){const s=$('dfNowOpSelect');if(!s)return;const list=opOptions();s.innerHTML='<option value="">SELECIONE UMA OP GERADA</option>'+list.map(x=>'<option value="'+esc(x.id)+'">'+esc(opLabel(x))+'</option>').join('');if(selected)s.value=selected;showOpInfo()}
  function showOpInfo(){const s=$('dfNowOpSelect'),e=$('dfNowOpInfo');if(!s||!e)return;const x=registry()[s.value],p=x&&x.expected||{};if(!x){e.textContent='Selecione uma OP para puxar automaticamente o código DFOP e o produto.';return}e.textContent='Código: '+x.id+' • Produto: '+(p.title||'—')+(p.largura?' • Largura: '+p.largura:'')+(p.micra?' • Micra: '+p.micra:'')}

  function build(){const admin=isAdmin?`<div id="dfNowAdminForm"><h4>ATUALIZAR PRODUÇÃO</h4><div class="grid"><div><label>MÁQUINA</label><input id="dfNowMachine" placeholder="Ex.: Máquina 1"></div><div><label>STATUS</label><select id="dfNowStatus"><option>RODANDO</option><option>PARADA</option><option>AJUSTE</option><option>TROCA DE MATERIAL</option><option>FINALIZADA</option></select></div><div style="grid-column:1/-1"><label>OP GERADA</label><select id="dfNowOpSelect"></select><div id="dfNowOpInfo" class="dfNowOpInfo"></div></div><div><label>OPERADOR</label><input id="dfNowOperator" placeholder="Nome do operador"></div><div><label>INÍCIO</label><input id="dfNowStart" type="time"></div></div><button id="dfNowSave" type="button">✅ PUBLICAR STATUS</button></div>`:`<div class="dfNowReadOnly">👁️ Somente visualização. O status é atualizado pelo administrador.</div>`;return `<div class="dfNowHead"><h3>🏭 PRODUÇÃO AGORA</h3><p>Veja o que está rodando nas máquinas neste momento.</p><div class="dfNowKpis"><div class="dfNowKpi"><span>RODANDO</span><b id="dfNowRunning">0</b></div><div class="dfNowKpi"><span>PARADAS</span><b id="dfNowStopped">0</b></div><div class="dfNowKpi"><span>AJUSTE</span><b id="dfNowAdjust">0</b></div></div><div id="dfNowCloudMsg"></div></div><div id="dfNowList"></div>${admin}`}

  function mount(){style();const ops=$('dfFormulaOps'),tabs=ops&&ops.querySelector('.dfOpsTabs');if(!ops||!tabs)return false;if(!$('dfNowTab')){const b=document.createElement('button');b.id='dfNowTab';b.dataset.pane='now';b.textContent='🏭 AGORA';tabs.appendChild(b)}if(!$('dfPaneNow')){const p=document.createElement('div');p.id='dfPaneNow';p.className='dfOpsPane';p.innerHTML=build();const first=ops.querySelector('.dfOpsPane');first?ops.insertBefore(p,first):ops.appendChild(p)}$('dfNowTab').onclick=openNow;if(isAdmin&&$('dfNowSave')){$('dfNowSave').onclick=saveForm;$('dfNowOpSelect').onchange=showOpInfo;$('dfNowStart').value=new Date().toTimeString().slice(0,5);fillOps()}render();syncCloud();return true}
  function openNow(){document.querySelectorAll('#dfFormulaOps .dfOpsTabs button').forEach(b=>b.classList.toggle('on',b.id==='dfNowTab'));document.querySelectorAll('#dfFormulaOps .dfOpsPane').forEach(p=>p.classList.remove('on'));$('dfPaneNow')?.classList.add('on');render();syncCloud()}
  function activeList(){const latest={};for(const x of load()){if(!x||!x.machineKey)continue;const o=latest[x.machineKey];if(!o||String(x.updatedAt||'')>String(o.updatedAt||''))latest[x.machineKey]=x}return Object.values(latest).filter(x=>x.status!=='FINALIZADA')}
  function render(){const list=$('dfNowList');if(!list)return;const a=activeList();$('dfNowRunning').textContent=a.filter(x=>x.status==='RODANDO').length;$('dfNowStopped').textContent=a.filter(x=>x.status==='PARADA').length;$('dfNowAdjust').textContent=a.filter(x=>x.status==='AJUSTE'||x.status==='TROCA DE MATERIAL').length;list.innerHTML=a.length?a.sort((x,y)=>String(x.machine).localeCompare(String(y.machine))).map(x=>{const c=sc(x.status),acts=isAdmin?`<div class="dfNowActions"><button data-edit="${esc(x.machineKey)}">✏️ EDITAR</button><button class="done" data-done="${esc(x.machineKey)}">⏹ FINALIZAR</button></div>`:'';return `<div class="dfNowCard ${c}"><div class="dfNowTop"><div class="dfNowMachine">${esc(x.machine||'Máquina')}</div><span class="dfNowBadge ${c}">${esc(x.status)}</span></div><div class="dfNowProduct">${esc(x.product||'Sem produto')}</div><div class="dfNowMeta">OP: <b>${esc(x.op||'—')}</b><br>Operador: <b>${esc(x.operator||'—')}</b><br>Início: <b>${hm(x.startedAt)}</b> • Atualizado: <b>${hm(x.updatedAt)}</b></div>${acts}</div>`}).join(''):'<div class="dfOpsStatus">Nenhuma máquina marcada como ativa agora.</div>';if(isAdmin){list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));list.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>finish(b.dataset.done))}}
  function machineKey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  async function commit(rec){const a=load().filter(x=>x.machineKey!==rec.machineKey);a.unshift(rec);save(a);setCloudMsg('⏳ Publicando para a equipe...','');try{if(await publishCloud(rec)){setCloudMsg('✅ Status publicado para a equipe','ok');setTimeout(syncCloud,500)}else setCloudMsg('⚠️ Sem equipe conectada. Salvo apenas neste aparelho.','warn')}catch(e){setCloudMsg('⚠️ Não consegui publicar agora.','warn')}}
  function saveForm(){const machine=String($('dfNowMachine').value||'').trim(),status=$('dfNowStatus').value,op=$('dfNowOpSelect').value,operator=String($('dfNowOperator').value||'').trim();if(!machine)return alert('Digite a máquina.');if(status==='RODANDO'&&!op)return alert('Selecione a OP que está rodando.');const ent=registry()[op]||{},exp=ent.expected||{},t=$('dfNowStart').value||new Date().toTimeString().slice(0,5),d=new Date(),p=t.split(':');d.setHours(+p[0]||0,+p[1]||0,0,0);const key=machineKey(machine)||('m-'+Date.now()),old=load().find(x=>x.machineKey===key);const rec={machineKey:key,machine,status,op:op||'',product:exp.title||old?.product||'',operator,startedAt:old&&old.status==='RODANDO'&&status==='RODANDO'?old.startedAt:d.toISOString(),updatedAt:now()};commit(rec);$('dfNowMachine').value='';$('dfNowOperator').value='';$('dfNowStatus').value='RODANDO';$('dfNowStart').value=new Date().toTimeString().slice(0,5);fillOps()}
  function edit(key){const x=load().find(v=>v.machineKey===key);if(!x)return;$('dfNowMachine').value=x.machine||'';$('dfNowStatus').value=x.status||'RODANDO';$('dfNowOperator').value=x.operator||'';fillOps(x.op||'');try{$('dfNowStart').value=new Date(x.startedAt||Date.now()).toTimeString().slice(0,5)}catch(e){}$('dfNowAdminForm').scrollIntoView({behavior:'smooth',block:'center'})}
  function finish(key){const x=load().find(v=>v.machineKey===key);if(!x)return;commit({...x,status:'FINALIZADA',updatedAt:now()})}

  function startMount(){let n=0,t=setInterval(()=>{if(mount()||++n>60)clearInterval(t)},250);window.addEventListener('df-ui-ready',()=>setTimeout(mount,200));document.addEventListener('click',e=>{if(e.target?.id==='dfFormTabOps')setTimeout(mount,80)},true)}
  function boot(){migrate();purgeSynthetic();const mo=new MutationObserver(()=>{purgeSynthetic();hideSyntheticCloudRows()});mo.observe(document.documentElement,{childList:true,subtree:true});resolveAdmin().finally(startMount);window.addEventListener('df-op-remote-merged',()=>{purgeSynthetic();setTimeout(hideSyntheticCloudRows,50)});window.addEventListener('online',()=>{resolveAdmin();syncCloud()});setInterval(()=>{purgeSynthetic();hideSyntheticCloudRows();if(!document.hidden)syncCloud()},15000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();