(function(){
'use strict';
if(window.DFManualRecovery675)return;window.DFManualRecovery675=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev',TEAM='df_producao_team_v2';
const $=id=>document.getElementById(id),norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
const valid=id=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/.test(norm(id));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key,def){try{return JSON.parse(localStorage.getItem(key)||'null')??def}catch(e){return def}}
function team(){return window.DFProducaoEquipeOnline?.team?.()||read(TEAM,null)}
function owner(){const t=team();return !!t?.teamId&&String(t.role)==='owner'}
function today(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function amount(s){let v=String(s??'').trim().replace(/\s/g,'');if(!v)return NaN;if(v.includes(',')&&v.includes('.'))v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'');else if(v.includes(','))v=v.replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,'');return Number(v)}
function device(){try{const v=String(window.DFDeviceIdentity?.get?.()||'');if(v)return v}catch(e){}return String(localStorage.getItem('df_licenseauth_device_v1')||'')}
function parseToken(v){try{v=String(v||'').split('.')[0].replace(/-/g,'+').replace(/_/g,'/');while(v.length%4)v+='=';return JSON.parse(decodeURIComponent(Array.from(atob(v)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function session(force){
 let t=String(sessionStorage.getItem('df_secure_token_v2')||'');
 if(!force&&t&&parseToken(t)?.owner)return t;
 const credential=String(localStorage.getItem('df_auto_access_credential_v1')||''),dev=device();
 if(!credential||!dev)throw Error('Acesso indisponível. Reabra com sua key.');
 const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
 const j=await r.json().catch(()=>({}));if(!r.ok||!j.token)throw Error(j.error||'Não foi possível validar o acesso.');
 t=String(j.token);sessionStorage.setItem('df_secure_token_v2',t);return t;
}
async function post(path,body,retry=true){
 if(navigator.onLine===false)throw Error('Conecte a internet para confirmar no D1.');
 const t=team();if(!t?.teamId)throw Error('Equipe de Produção não conectada.');
 const auth=await session(false);
 const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth,'X-DF-Device':device()},body:JSON.stringify({...body,teamId:t.teamId,area:'producao',scope:'producao'}),cache:'no-store'});
 const j=await r.json().catch(()=>({}));
 if(r.status===401&&retry){await session(true);return post(path,body,false)}
 if(!r.ok||j.ok===false)throw Error(j.error||'HTTP '+r.status);
 return j;
}
function catalog(){
 const cfg=read('df_producao_cadastros_v1',{}),a=[];
 for(const sec of ['Picote','Sacoleira','Blocadora']){
  const c=cfg?.[sec]||{};
  for(const m of Array.isArray(c.machines)?c.machines:[]){
   const name=String(m||'').trim();
   if(name&&!c.deletedMachines?.[norm(name)]&&!a.some(x=>norm(x.machine)===norm(name)))a.push({machine:name,sector:sec});
  }
 }
 return a.sort((a,b)=>a.machine.localeCompare(b.machine,'pt-BR'));
}
function localOp(id){
 for(const key of ['df_producao_ops_setores_test_v3','df_producao_ops_auto_v1']){
  const a=read(key,[]);if(Array.isArray(a)){const x=a.find(x=>norm(x?.id||x?.opId)===id);if(x)return x}
 }
 const registry=read('df_op_qr_registry_test_setores_v3',{});
 return registry?.[id]?.expected||{};
}
let checked=null,busy=false;
function msg(s,state=''){const el=$('dfRecMsg');if(el){el.textContent=s;el.dataset.state=state}}
function reset(){checked=null;const b=$('dfRecSave');if(b)b.disabled=true;const c=$('dfRecAgree');if(c)c.checked=false;msg('Consulte o QR no D1 antes de recuperar.')}
function f(k){return $('dfRec'+k)}
function prefill(row,code){
 const local=localOp(code),old=row||{};
 const values={Machine:old.machine||local.machine||local.maquina||'',Product:old.productName||local.product||local.produto||local.title||'',Operator:old.operatorName||local.operator||local.operador||'',Kg:old.production||local.production||'',Scrap:old.scrap??local.scrap??0,Date:old.localDate||local.date||local.productionDay||''};
 for(const [key,value] of Object.entries(values)){
  const el=f(key);
  if(!el||(el.value.trim()&&!(key==='Scrap'&&el.value==='0')&&!(key==='Date'&&el.value===today()))||(key==='Date'&&!/^\d{4}-\d{2}-\d{2}$/.test(String(value))))continue;
  el.value=String(value||'');
 }
}
async function check(){
 if(busy)return;const id=norm(f('Code')?.value);if(!valid(id))return msg('Digite o ID DFOP completo impresso junto ao QR.','warn');
 if(!owner())return msg('A recuperação é exclusiva do DONO da equipe.','warn');
 busy=true;reset();const btn=f('Check');btn.disabled=true;btn.textContent='CONSULTANDO D1...';
 try{
  const h=await post('/op/record/history',{opCode:id}),r=h.record;
  if(r&&['ready','pending'].includes(r.state)){
   // Se já está pronta mas não aparece na tela, faça um pull sem recontabilizar a OP.
   let refreshed=false;
   try{refreshed=await window.DFProducaoEquipeOnline?.pull?.()===true}catch(e){}
   msg('⛔ OP JÁ ESTÁ '+(r.state==='ready'?'EM PRONTAS':'EM PENDENTES')+' no D1: '+Number(r.production||0).toLocaleString('pt-BR')+' kg · Máquina: '+String(r.machine||'não informada')+' · Mês: '+String(r.localDate||'').slice(0,7)+'. '+(refreshed?'Atualização de Produção solicitada. ':'')+'Não será duplicada.','warn');return;
  }
  if(!r&&Array.isArray(h.events)&&h.events.length){
   msg('⛔ Há eventos de baixa desta OP, mas o registro atual não está disponível. Não recupere sem conferência.','warn');return;
  }
  prefill(r,id);
  checked={teamId:String(team().teamId),id};
  f('Save').disabled=false;
  msg(r?.state==='deleted'?'✅ OP EXCLUÍDA no D1. Revise os dados para restaurar.':'✅ Não existe baixa desta OP nesta EQUIPE DE PRODUÇÃO. Revise a OP impressa antes de registrar.','ok');
 }catch(e){msg('⚠️ Consulta ao D1 falhou: '+e.message+'. Nenhuma baixa enviada.','warn')}
 finally{busy=false;btn.disabled=false;btn.textContent='🔎 CONFERIR OP NO D1'}
}
async function recover(){
 if(busy||!checked||!owner())return;
 const t=team(),id=norm(f('Code')?.value);
 if(id!==checked.id||String(t?.teamId)!==checked.teamId)return reset();
 const machine=String(f('Machine')?.value||'').trim(),product=String(f('Product')?.value||'').trim(),operator=String(f('Operator')?.value||'').trim();
 const kg=amount(f('Kg')?.value),scrap=amount(f('Scrap')?.value),day=f('Date')?.value||'';
 if(!valid(id)||!machine||!product||!(kg>0)||!Number.isFinite(scrap)||scrap<0||scrap>kg||! /^\d{4}-\d{2}-\d{2}$/.test(day)||day>today())return msg('Informe QR, máquina, produto, dia, produção e apara válidos.','warn');
 const known=catalog();
 if(known.length&&!known.some(x=>norm(x.machine)===norm(machine)))return msg('Selecione uma MÁQUINA CADASTRADA para a produção somar no setor correto.','warn');
 if(!f('Agree').checked)return msg('Confirme que a OP impressa não foi contabilizada.','warn');
 if(!confirm('RECUPERAR OP MANUALMENTE?\n\n'+id+'\nMáquina: '+machine+'\nProduto: '+product+'\nProdução: '+kg+' kg\nApara: '+scrap+' kg\nDia: '+day+'\n\nEu confirmo que esta baixa NÃO está contabilizada na equipe.'))return;
 busy=true;const btn=f('Save');btn.disabled=true;btn.textContent='⏳ RECUPERANDO...';
 try{
  // Reconsulta no momento da confirmação: nunca substitui Prontas nem Pendentes.
  const hist=await post('/op/record/history',{opCode:id});
  if(hist.record&&['ready','pending'].includes(hist.record.state))throw Error('OP já foi baixada no D1. Sem duplicação.');
  const resp=await post('/op/record/upsert',{opCode:id,production:kg,scrap,productName:product,operatorName:operator,machine,localDate:day,completedAt:new Date().toISOString(),photoId:String(hist.record?.photoId||''),requestKey:'dfprod-owner-recovery-v675-'+id+'-'+Date.now()});
  if(resp.stale||resp.record?.state!=='ready'||norm(resp.record?.opCode)!==id)throw Error('D1 não confirmou a recuperação em Prontas. Confira antes de repetir.');
  const verify=await post('/op/record/history',{opCode:id});
  if(verify.record?.state!=='ready'||Number(verify.record.production)!==kg||Number(verify.record.scrap)!==scrap)throw Error('Não foi possível confirmar a soma. Consulte novamente no D1 antes de repetir.');
  // Remova somente a exclusão local desta OP, após confirmação do D1.
  const pending=read('df_producao_delete_pending_v1',{});
  if(pending&&Object.prototype.hasOwnProperty.call(pending,id)){
    delete pending[id];try{localStorage.setItem('df_producao_delete_pending_v1',JSON.stringify(pending))}catch(e){}
  }
  // A recuperação sem foto é histórica e não deve tentar reenviar a foto apagada.
  const history=read('df_producao_historico_sem_foto_v647',{});
  const historyIds=history?.teamId===t.teamId?{...(history.ids||{})}:{};
  historyIds[id]=true;
  try{localStorage.setItem('df_producao_historico_sem_foto_v647',JSON.stringify({teamId:t.teamId,ids:historyIds}))}catch(e){}
  checked=null;f('Agree').checked=false;
  msg('✅ RECUPERADA NO D1: '+kg.toLocaleString('pt-BR')+' kg em PRONTAS — '+machine+' — mês '+day.slice(0,7)+'.','ok');
  try{await window.DFProducaoEquipeOnline?.pull?.()}catch(e){}
 }catch(e){msg('⚠️ '+e.message+' Nenhuma segunda tentativa automática será feita. Consulte o QR no D1.','warn')}
 finally{busy=false;btn.disabled=true;btn.textContent='✅ RECUPERAR PARA PRONTAS'}
}
function mount(){
 const host=$('dfProdTeamV2'),old=$('dfRecOwner'),t=team();
 if(!host||!t?.teamId||t.role!=='owner'){old?.remove();return false}
 if(old&&old.previousElementSibling===host)return true;
 old?.remove();
 if(!$('dfRecStyle')){const css=document.createElement('style');css.id='dfRecStyle';css.textContent=
 '#dfRecOwner{max-width:850px;margin:10px auto;border:1px solid #475569;border-radius:13px;padding:11px;background:#111827;color:#e2e8f0;font-family:system-ui}'+
 '#dfRecOpen{width:100%;padding:12px;background:#202d3e;color:#cbd5e1;border:1px solid #64748b;border-radius:10px;font:800 12px system-ui}'+
 '#dfRecBody{display:none;margin-top:12px}#dfRecOwner.open #dfRecBody{display:block}'+
 '#dfRecBody label{display:block;font:700 12px system-ui;margin:10px 0 4px}#dfRecBody input:not([type=checkbox]){box-sizing:border-box;width:100%;padding:11px;border:1px solid #485970;border-radius:10px;background:#0b1424;color:#fff;font-size:15px}'+
 '#dfRecBody button{padding:12px;margin-top:10px;border-radius:10px;background:#243347;border:1px solid #53647a;color:#e2e8f0;font-weight:800}#dfRecBody button:disabled{opacity:.5}'+
 '#dfRecBody .dfRecGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}#dfRecBody .dfRecNote{font-size:11px;color:#94a3b8;line-height:1.4;margin:10px 0}'+
 '#dfRecBody #dfRecSave{width:100%;background:#0d3b22;color:#bbf7d0;border-color:#166534}'+
 '#dfRecMsg{padding:10px;border-radius:10px;background:#0e1a2b;border:1px solid #475569;margin:10px 0;font-size:12px;line-height:1.5;white-space:pre-wrap}#dfRecMsg[data-state=warn]{color:#fcd34d}#dfRecMsg[data-state=ok]{color:#86efac}'+
 '#dfRecBody .dfRecAgree{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.45}#dfRecAgree{width:20px;height:20px;flex-shrink:0}';
 document.head.appendChild(css)}
 const el=document.createElement('section');el.id='dfRecOwner';
 el.innerHTML='<button type="button" id="dfRecOpen">↩ RECUPERAR BAIXA DE OP ANTIGA — DONO</button><div id="dfRecBody">'+
 '<div class="dfRecNote">Somente OPs impressas que foram apagadas ou não entraram no D1. Sem foto nova, sem duplicar baixa e sem mexer no histórico existente.</div>'+
 '<label>Código da OP / QR</label><input id="dfRecCode" autocomplete="off" autocapitalize="characters" placeholder="DFOP-20261019-123456-ABCD">'+
 '<button type="button" id="dfRecScan">📷 LER QR DA OP</button><input id="dfRecFile" type="file" accept="image/*" capture="environment" hidden>'+
 '<button type="button" id="dfRecCheck">🔎 CONFERIR OP NO D1</button>'+
 '<div class="dfRecGrid"><div><label>Máquina</label><input id="dfRecMachine" list="dfRecMachineList" placeholder="MÁQUINA CADASTRADA"><datalist id="dfRecMachineList"></datalist></div><div><label>Dia da produção</label><input id="dfRecDate" type="date"></div></div>'+
 '<label>Produto / cliente</label><input id="dfRecProduct" placeholder="PRODUTO">'+
 '<label>Operador (opcional)</label><input id="dfRecOperator" placeholder="OPERADOR">'+
 '<div class="dfRecGrid"><div><label>Produção (kg)</label><input id="dfRecKg" inputmode="decimal" placeholder="EX.: 250"></div><div><label>Apara (kg)</label><input id="dfRecScrap" inputmode="decimal" value="0"></div></div>'+
 '<label class="dfRecAgree"><input type="checkbox" id="dfRecAgree"><span>CONFIRMO COMO DONO QUE CONFERI A OP IMPRESSA E QUE ESTA BAIXA AINDA NÃO FOI CONTABILIZADA.</span></label>'+
 '<div id="dfRecMsg" role="status">Consulte o QR no D1 antes de recuperar.</div>'+
 '<button id="dfRecSave" type="button" disabled>✅ RECUPERAR PARA PRONTAS</button></div>';
 host.insertAdjacentElement('afterend',el);
 f('Date').value=today();$('dfRecMachineList').innerHTML=catalog().map(x=>'<option value="'+esc(x.machine)+'">'+esc(x.sector)+'</option>').join('');
 $('dfRecOpen').onclick=()=>el.classList.toggle('open');
 $('dfRecCheck').onclick=check;$('dfRecSave').onclick=recover;
 f('Code').addEventListener('input',()=>{
   reset();
   // Cada novo QR começa com dados limpos; nunca herdar pesos de outra OP.
   for(const key of ['Machine','Product','Operator','Kg'])f(key).value='';
   f('Scrap').value='0';f('Date').value=today();
 });
 $('dfRecScan').onclick=()=>$('dfRecFile').click();
 $('dfRecFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(!window.jsQR)return msg('Leitor QR ainda não carregado. Digite o ID impresso.','warn');
   const img=await createImageBitmap(file),c=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,c.width,c.height);
   const d=g.getImageData(0,0,c.width,c.height),value=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})?.data||'';
   const code=norm(value.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i)?.[0]||'');
   if(!valid(code))return msg('QR não reconhecido. Digite o ID impresso.','warn');
   f('Code').value=code;reset();
   for(const key of ['Machine','Product','Operator','Kg'])f(key).value='';
   f('Scrap').value='0';f('Date').value=today();
   await check();
  }catch(e){msg('Não foi possível ler o QR da foto. Digite o ID impresso.','warn')}finally{e.target.value=''}
 };
 return true;
}
function boot(){let n=0;const timer=setInterval(()=>{mount();if(++n>120)clearInterval(timer)},350);window.addEventListener('df-producao-team-changed',()=>setTimeout(mount,150));window.addEventListener('pageshow',()=>setTimeout(mount,100))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
