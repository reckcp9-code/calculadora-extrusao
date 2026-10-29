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

let recoveryPhoto=null,recoveryPhotoUrl='';
function clearRecoveryPhoto(){
 recoveryPhoto=null;
 if(recoveryPhotoUrl){try{URL.revokeObjectURL(recoveryPhotoUrl)}catch(e){}recoveryPhotoUrl=''}
 const box=$('dfRecPhotoPreviewBox');if(box)box.hidden=true;
 const img=$('dfRecPhotoPreview');if(img)img.removeAttribute('src');
 const state=$('dfRecPhotoStatus');if(state)state.textContent='';
}
function setRecoveryPhoto(file){
 if(!file||(!String(file.type||'').startsWith('image/')&&!/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name||''))||file.size>30000000||file.size===0){
  msg('Escolha uma foto válida da OP (até 30 MB antes da compressão).','warn');return false;
 }
 clearRecoveryPhoto();recoveryPhoto=file;
 recoveryPhotoUrl=URL.createObjectURL(file);
 const image=$('dfRecPhotoPreview'),box=$('dfRecPhotoPreviewBox'),label=$('dfRecPhotoStatus');
 if(image)image.src=recoveryPhotoUrl;
 if(box)box.hidden=false;
 if(label)label.textContent='📷 Foto selecionada: '+String(file.name||'imagem')+' — será enviada ao R2 ao confirmar.';
 return true;
}
async function convertRecoveryPhoto(file){
 if(!file)throw Error('Tire ou escolha a FOTO DA OP antes de confirmar.');
 const inputUrl=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{
   const im=new Image();
   im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Esta imagem não pôde ser aberta. Tire outra foto da OP.'));
   im.src=inputUrl;
  });
  const ratio=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(img.naturalWidth*ratio));
  c.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  const ctx=c.getContext('2d');if(!ctx)throw Error('Não foi possível preparar a foto.');
  ctx.drawImage(img,0,0,c.width,c.height);
  let result=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.78));
  if(!result||result.size===0)throw Error('Não foi possível converter a foto para JPEG.');
  if(result.size>3900000){result=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.58));}
  if(!result||result.size>3900000)throw Error('Foto acima de 4 MB. Tire outra mais próxima da OP.');
  return new File([result],'op-recuperada.jpg',{type:'image/jpeg'});
 }finally{URL.revokeObjectURL(inputUrl)}
}
async function verifyUploadedPhoto(id,retry=true){
 const tok=await session(false),url=API+'/op/photo/get?id='+encodeURIComponent(id);
 const r=await fetch(url,{headers:{'Authorization':'Bearer '+tok,'X-DF-Device':device()},cache:'no-store'});
 if(r.status===401&&retry){await session(true);return verifyUploadedPhoto(id,false)}
 if(!r.ok)throw Error('A foto não ficou disponível no R2. Nenhuma baixa foi confirmada.');
 const image=await r.blob();
 if(image.size<1000||!String(image.type||'').startsWith('image/'))throw Error('O arquivo de foto do servidor está inválido.');
 return true;
}
async function uploadRecoveryPhoto(id,kg,scrap,file){
 const t=team();if(!owner()||!t?.teamId)throw Error('Equipe do dono não identificada.');
 const jpg=await convertRecoveryPhoto(file);
 const form=new FormData();
 form.append('teamId',t.teamId);form.append('area','producao');form.append('scope','producao');
 form.append('photoType','production_op');
 // prefixo diferente de DFOP- para que o upload da foto NÃO registre uma segunda baixa.
 form.append('sourceId','DFPRODRECOVERY-'+id);
 form.append('qr',id);
 form.append('production',String(kg));
 form.append('scrap',String(scrap));
 form.append('createdAt',new Date().toISOString());
 form.append('photo',jpg,'op-recuperada.jpg');
 let auth=await session(false),r=await fetch(API+'/op/photo/upload',{method:'POST',
  headers:{'Authorization':'Bearer '+auth,'X-DF-Device':device()},body:form,cache:'no-store'});
 if(r.status===401){auth=await session(true);r=await fetch(API+'/op/photo/upload',{method:'POST',
  headers:{'Authorization':'Bearer '+auth,'X-DF-Device':device()},body:form,cache:'no-store'})}
 const data=await r.json().catch(()=>({}));
 if(!r.ok||data.ok===false||!/^opp_[a-z0-9]+$/i.test(String(data.photo?.id||'')))
   throw Error(data.error||'O R2 não confirmou o recebimento da foto.');
 const photoId=String(data.photo.id);
 await verifyUploadedPhoto(photoId);
 return photoId;
}
function setRecoveryMode(mode){
 const attach=mode==='attach';
 const fields=['Machine','Date','Product','Operator','Kg','Scrap'];
 for(const key of fields){const el=f(key);if(el)el.readOnly=attach}
 const agree=$('dfRecAgreeText');
 if(agree)agree.textContent=attach?
  'CONFIRMO QUE ESTA FOTO PERTENCE À OP JÁ CONTABILIZADA. NÃO DESEJO ALTERAR OS QUILOS.':
  'CONFIRMO COMO DONO QUE CONFERI A OP IMPRESSA E QUE ESTA BAIXA AINDA NÃO FOI CONTABILIZADA.';
 const btn=f('Save');if(btn)btn.textContent=attach?'📷 VINCULAR FOTO À OP PRONTA':'✅ RECUPERAR COM FOTO PARA PRONTAS';
}
async function refreshAfterPhoto(id){
 // O pull oficial reconstrói o vínculo R2 em Prontas em todos os aparelhos da equipe.
 try{await window.DFProducaoEquipeOnline?.pull?.()}catch(e){}
 try{window.dispatchEvent(new CustomEvent('df-producao-team-synced',{detail:{manualPhoto:true,opCode:id}}))}catch(e){}
}
async function attachToReady(){
 if(busy||!checked||checked.mode!=='attach'||!owner())return;
 const t=team(),id=norm(f('Code')?.value),file=recoveryPhoto;
 if(id!==checked.id||String(t?.teamId)!==checked.teamId)return reset();
 if(!file)return msg('📷 Tire ou selecione a foto da OP antes de vincular.','warn');
 if(!f('Agree')?.checked)return msg('Confirme que a foto pertence a esta OP.','warn');
 if(!confirm('VINCULAR FOTO A ESTA OP QUE JÁ ESTÁ EM PRONTAS?\n\n'+id+'\n\nA produção e a apara NÃO serão alteradas.'))return;
 busy=true;const btn=f('Save');btn.disabled=true;btn.textContent='⏳ ENVIANDO FOTO AO R2...';
 try{
  const before=await post('/op/record/history',{opCode:id}),row=before.record;
  if(!row||row.state!=='ready')throw Error('A OP não está mais em Prontas. Consulte novamente.');
  if(row.photoId)throw Error('Esta OP já tem foto no D1. Atualize Prontas para visualizá-la.');
  if(Number(row.revision)!==checked.revision)throw Error('A OP foi atualizada por outro aparelho. Consulte novamente.');
  const photoId=await uploadRecoveryPhoto(id,Number(row.production),Number(row.scrap),file);
  const saved=await post('/op/record/attach-photo',{opCode:id,photoId,expectedRevision:row.revision});
  if(!saved.record||saved.record.state!=='ready'||saved.record.photoId!==photoId)
    throw Error('O D1 não confirmou o vínculo da foto; consulte antes de repetir.');
  const after=await post('/op/record/history',{opCode:id});
  if(after.record?.state!=='ready'||after.record?.photoId!==photoId||
     Number(after.record.production)!==Number(row.production)||
     Number(after.record.scrap)!==Number(row.scrap))
    throw Error('A confirmação final falhou. Consulte novamente antes de repetir.');
  checked=null;f('Agree').checked=false;clearRecoveryPhoto();setRecoveryMode('recover');
  msg('✅ FOTO VINCULADA NO R2 E EM PRONTAS! OP '+id+
      ' continua com '+Number(row.production).toLocaleString('pt-BR')+
      ' kg. O peso e a apara não foram alterados.','ok');
  await refreshAfterPhoto(id);
 }catch(e){msg('⚠️ '+String(e.message||e)+' Nenhuma baixa adicional foi criada.','warn')}
 finally{busy=false;btn.disabled=!checked;if(checked)setRecoveryMode('attach');else setRecoveryMode('recover')}
}

let checked=null,busy=false;
function msg(s,state=''){const el=$('dfRecMsg');if(el){el.textContent=s;el.dataset.state=state}}
function reset(){checked=null;setRecoveryMode('recover');const b=$('dfRecSave');if(b)b.disabled=true;const c=$('dfRecAgree');if(c)c.checked=false;msg('Consulte o QR no D1 antes de recuperar.')}
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
   if(r.state==='ready'&&!String(r.photoId||'').trim()){
    // Já contabilizada, mas sem foto (inclusive recuperações anteriores): permitir anexar
    // sem alterar a produção, a apara ou o estado PRONTAS.
    prefill(r,id);
    checked={teamId:String(team().teamId),id,mode:'attach',revision:Number(r.revision||0)};
    setRecoveryMode('attach');f('Save').disabled=false;
    msg('📷 ESTA OP JÁ ESTÁ EM PRONTAS COM '+Number(r.production||0).toLocaleString('pt-BR')+
      ' KG, MAS SEM FOTO. Tire ou escolha a foto e toque em VINCULAR FOTO. Nenhum quilo será somado novamente.','ok');
    return;
   }
   // Se já possui foto ou está pendente, proíbe qualquer nova baixa.
   let refreshed=false;
   try{refreshed=await window.DFProducaoEquipeOnline?.pull?.()===true}catch(e){}
   msg('⛔ OP JÁ ESTÁ '+(r.state==='ready'?'EM PRONTAS':'EM PENDENTES')+' no D1: '+Number(r.production||0).toLocaleString('pt-BR')+
     ' kg · Máquina: '+String(r.machine||'não informada')+' · Mês: '+String(r.localDate||'').slice(0,7)+
     '. '+(r.photoId?'📷 FOTO JÁ VINCULADA. ':'')+(refreshed?'Tela atualizada. ':'')+
     'Não será duplicada.','warn');return;
  }
  if(!r&&Array.isArray(h.events)&&h.events.length){
   msg('⛔ Há eventos de baixa desta OP, mas o registro atual não está disponível. Não recupere sem conferência.','warn');return;
  }
  prefill(r,id);
  checked={teamId:String(team().teamId),id,mode:'recover'};
  setRecoveryMode('recover');f('Save').disabled=false;
  msg(r?.state==='deleted'?'✅ OP EXCLUÍDA no D1. Revise os dados para restaurar.':'✅ Não existe baixa desta OP nesta EQUIPE DE PRODUÇÃO. Revise a OP impressa antes de registrar.','ok');
 }catch(e){msg('⚠️ Consulta ao D1 falhou: '+e.message+'. Nenhuma baixa enviada.','warn')}
 finally{busy=false;btn.disabled=false;btn.textContent='🔎 CONFERIR OP NO D1'}
}
async function recover(){
 if(busy||!checked||!owner())return;
 if(checked.mode==='attach')return attachToReady();
 const t=team(),id=norm(f('Code')?.value),file=recoveryPhoto;
 if(id!==checked.id||String(t?.teamId)!==checked.teamId)return reset();
 const machine=String(f('Machine')?.value||'').trim(),product=String(f('Product')?.value||'').trim(),operator=String(f('Operator')?.value||'').trim();
 const kg=amount(f('Kg')?.value),scrap=amount(f('Scrap')?.value),day=f('Date')?.value||'';
 if(!valid(id)||!machine||!product||!(kg>0)||!Number.isFinite(scrap)||scrap<0||scrap>kg||! /^\d{4}-\d{2}-\d{2}$/.test(day)||day>today())return msg('Informe QR, máquina, produto, dia, produção e apara válidos.','warn');
 const known=catalog();
 if(known.length&&!known.some(x=>norm(x.machine)===norm(machine)))return msg('Selecione uma MÁQUINA CADASTRADA para a produção somar no setor correto.','warn');
 if(!file)return msg('📷 Foto obrigatória. Tire ou escolha a foto da OP antes da recuperação.','warn');
 if(!f('Agree').checked)return msg('Confirme que a OP impressa não foi contabilizada.','warn');
 if(!confirm('RECUPERAR OP MANUALMENTE?\n\n'+id+'\nMáquina: '+machine+'\nProduto: '+product+'\nProdução: '+kg+' kg\nApara: '+scrap+' kg\nDia: '+day+'\n\nEu confirmo que esta baixa NÃO está contabilizada na equipe.'))return;
 busy=true;const btn=f('Save');btn.disabled=true;btn.textContent='⏳ RECUPERANDO...';
 try{
  // Reconsulta no momento da confirmação: nunca substitui Prontas nem Pendentes.
  const hist=await post('/op/record/history',{opCode:id});
  if(hist.record&&['ready','pending'].includes(hist.record.state))throw Error('OP já foi baixada no D1. Sem duplicação.');
  // Primeiro gravar e verificar foto R2; só depois lançar uma nova baixa.
  btn.textContent='⏳ ENVIANDO FOTO AO R2...';
  const photoId=await uploadRecoveryPhoto(id,kg,scrap,file);
  btn.textContent='⏳ CONFIRMANDO PRONTAS NO D1...';
  const resp=await post('/op/record/upsert',{opCode:id,production:kg,scrap,
   productName:product,operatorName:operator,machine,localDate:day,
   completedAt:new Date().toISOString(),photoId,
   requestKey:'dfprod-owner-recovery-photo-v680-'+id+'-'+Date.now()});
  if(resp.stale||resp.record?.state!=='ready'||norm(resp.record?.opCode)!==id||
     resp.record?.photoId!==photoId)
    throw Error('D1 não confirmou a recuperação COM FOTO em Prontas. Consulte a OP antes de repetir.');
  const verify=await post('/op/record/history',{opCode:id});
  if(verify.record?.state!=='ready'||Number(verify.record.production)!==kg||
     Number(verify.record.scrap)!==scrap||verify.record.photoId!==photoId)
    throw Error('A confirmação final do D1/foto falhou. Confira a OP antes de repetir.');
  // Remova somente a exclusão local desta OP, após confirmação do D1.
  const pending=read('df_producao_delete_pending_v1',{});
  if(pending&&Object.prototype.hasOwnProperty.call(pending,id)){
    delete pending[id];try{localStorage.setItem('df_producao_delete_pending_v1',JSON.stringify(pending))}catch(e){}
  }
  // Marcar como histórico já sincronizado: a foto nova pertence ao R2, sem reenvio local duplicado.
  const history=read('df_producao_historico_sem_foto_v647',{});
  const historyIds=history?.teamId===t.teamId?{...(history.ids||{})}:{};
  historyIds[id]=true;
  try{localStorage.setItem('df_producao_historico_sem_foto_v647',JSON.stringify({teamId:t.teamId,ids:historyIds}))}catch(e){}
  checked=null;f('Agree').checked=false;clearRecoveryPhoto();setRecoveryMode('recover');
  msg('✅ OP RECUPERADA COM FOTO NO R2 E VINCULADA AO D1: '+kg.toLocaleString('pt-BR')+
      ' kg em PRONTAS — '+machine+' — mês '+day.slice(0,7)+'. Foto disponível em Prontas para toda a equipe.','ok');
  await refreshAfterPhoto(id);
 }catch(e){msg('⚠️ '+e.message+' Nenhuma segunda tentativa automática será feita. Consulte o QR no D1.','warn')}
 finally{busy=false;btn.disabled=true;btn.textContent='✅ RECUPERAR COM FOTO PARA PRONTAS'}
}
function mount(){
 const header=document.querySelector('main.wrap > header'),nav=$('prodRecoverTab'),t=team(),old=$('dfRecOwner');
 const allowed=!!(t?.teamId&&String(t.role)==='owner');
 if(nav){nav.hidden=!allowed;nav.setAttribute('aria-hidden',allowed?'false':'true')}
 if(!header||!nav||!allowed){
   if(old)old.remove();
   if(document.body.classList.contains('dfRecoveryOnly')){
     document.body.classList.remove('dfRecoveryOnly');
     const next=$('prodNewTab');if(next)next.click();
   }
   return false;
 }
 if(old&&old.parentElement===header.parentElement)return true;
 if(old)old.remove();
 if(!$('dfRecStyle')){const css=document.createElement('style');css.id='dfRecStyle';css.textContent=
 '#dfRecOwner{display:none!important;width:100%;min-width:0;max-width:760px;margin:0 auto 18px;padding:16px;border-radius:16px;border:1px solid #40506a;background:#111827;color:#e2e8f0;font-family:system-ui;overflow:hidden}'+
 'body.dfRecoveryOnly #dfRecOwner{display:block!important}'+
 '#dfRecOwner *{box-sizing:border-box;min-width:0}'+
 '#dfRecOwner .dfRecTitle{font-size:20px;font-weight:850;line-height:1.25;margin:0 0 10px;color:#f1f5f9}'+
 '#dfRecBody{display:block;width:100%;max-width:100%}'+
 '#dfRecBody label{display:block;font:750 13px system-ui;margin:12px 0 6px;line-height:1.35;color:#cbd5e1}'+
 '#dfRecBody input:not([type=checkbox]):not([type=file]){display:block;max-width:100%!important;min-width:0!important;width:100%!important;padding:12px;border:1px solid #485970;border-radius:10px;background:#0b1424;color:#fff;font:600 16px system-ui}'+
 '#dfRecBody #dfRecFile,#dfRecBody #dfRecPhotoFile{display:none!important}'+
 '#dfRecPhotoPreviewBox[hidden]{display:none!important}#dfRecPhotoPreviewBox{margin:10px 0 16px;border:1px solid #475569;border-radius:12px;padding:10px;background:#0b1625}#dfRecPhotoPreview{display:block;width:100%;max-height:280px;object-fit:contain;border-radius:8px}#dfRecPhotoStatus{font:700 12px/1.5 system-ui;color:#86efac;margin-top:8px}'+
 '#dfRecBody input[type=date]{appearance:none;-webkit-appearance:none;min-height:49px}'+
 '#dfRecBody button{display:block;width:100%;min-height:45px;padding:11px;margin-top:10px;border-radius:10px;background:#243347;border:1px solid #53647a;color:#e2e8f0;font:800 12px/1.3 system-ui;white-space:normal}'+
 '#dfRecBody button:disabled{opacity:.5}'+
 '#dfRecBody .dfRecGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:100%}'+
 '#dfRecBody .dfRecGrid>div{min-width:0;width:100%}'+
 '#dfRecBody .dfRecNote{font-size:12px;color:#94a3b8;line-height:1.5;margin:10px 0 14px}'+
 '#dfRecBody #dfRecSave{background:#0d3b22;color:#bbf7d0;border-color:#166534;min-height:52px}'+
 '#dfRecMsg{padding:12px;border-radius:10px;background:#0e1a2b;border:1px solid #475569;margin:12px 0;font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}'+
 '#dfRecMsg[data-state=warn]{color:#fcd34d}#dfRecMsg[data-state=ok]{color:#86efac}'+
 '#dfRecBody .dfRecAgree{display:flex;gap:12px;align-items:flex-start;font-size:12px;line-height:1.45}'+
 '#dfRecBody #dfRecAgree{width:20px!important;min-width:20px!important;height:20px!important;flex:0 0 20px;margin:0}'+
 '@media(max-width:560px){#dfRecBody .dfRecGrid{grid-template-columns:minmax(0,1fr)}#dfRecOwner{padding:13px}}';
 document.head.appendChild(css)}
 const el=document.createElement('section');el.id='dfRecOwner';
 el.innerHTML='<h2 class="dfRecTitle">↩ Recuperar baixa de OP antiga</h2><div id="dfRecBody">'+
 '<div class="dfRecNote">OP antiga impressa: confira o QR, informe os quilos e envie a foto ao R2. Se a OP já estiver em Prontas sem foto, você poderá vincular apenas a imagem, sem somar produção novamente.</div>'+
 '<label>Código da OP / QR</label><input id="dfRecCode" autocomplete="off" autocapitalize="characters" placeholder="DFOP-20261019-123456-ABCD">'+
 '<button type="button" id="dfRecScan">📷 LER QR E GUARDAR FOTO DA OP</button><input id="dfRecFile" type="file" accept="image/*" capture="environment" hidden>'+
 '<button type="button" id="dfRecPhotoPick">📸 TIRAR OU ESCOLHER FOTO DA OP</button><input id="dfRecPhotoFile" type="file" accept="image/*" hidden>'+
 '<div id="dfRecPhotoPreviewBox" hidden><img id="dfRecPhotoPreview" alt="Prévia da OP que será arquivada na nuvem"><div id="dfRecPhotoStatus"></div></div>'+
 '<button type="button" id="dfRecCheck">🔎 CONFERIR OP NO D1</button>'+
 '<div class="dfRecGrid"><div><label>Máquina</label><input id="dfRecMachine" list="dfRecMachineList" placeholder="MÁQUINA CADASTRADA"><datalist id="dfRecMachineList"></datalist></div><div><label>Dia da produção</label><input id="dfRecDate" type="date"></div></div>'+
 '<label>Produto / cliente</label><input id="dfRecProduct" placeholder="PRODUTO">'+
 '<label>Operador (opcional)</label><input id="dfRecOperator" placeholder="OPERADOR">'+
 '<div class="dfRecGrid"><div><label>Produção (kg)</label><input id="dfRecKg" inputmode="decimal" placeholder="EX.: 250"></div><div><label>Apara (kg)</label><input id="dfRecScrap" inputmode="decimal" value="0"></div></div>'+
 '<label class="dfRecAgree"><input type="checkbox" id="dfRecAgree"><span id="dfRecAgreeText">CONFIRMO COMO DONO QUE CONFERI A OP IMPRESSA E QUE ESTA BAIXA AINDA NÃO FOI CONTABILIZADA.</span></label>'+
 '<div id="dfRecMsg" role="status">Consulte o QR no D1 antes de recuperar.</div>'+
 '<button id="dfRecSave" type="button" disabled>✅ RECUPERAR COM FOTO PARA PRONTAS</button></div>';
 header.insertAdjacentElement('afterend',el);
 f('Date').value=today();$('dfRecMachineList').innerHTML=catalog().map(x=>'<option value="'+esc(x.machine)+'">'+esc(x.sector)+'</option>').join('');

 $('dfRecCheck').onclick=check;$('dfRecSave').onclick=recover;
 f('Code').addEventListener('input',()=>{
   reset();clearRecoveryPhoto();
   // Cada novo QR começa com dados limpos; nunca herdar pesos de outra OP.
   for(const key of ['Machine','Product','Operator','Kg'])f(key).value='';
   f('Scrap').value='0';f('Date').value=today();
 });
 $('dfRecScan').onclick=()=>$('dfRecFile').click();
 $('dfRecPhotoPick').onclick=()=>$('dfRecPhotoFile').click();
 $('dfRecPhotoFile').onchange=e=>{const file=e.target.files?.[0];if(file)setRecoveryPhoto(file);e.target.value=''};
 $('dfRecFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  // A mesma fotografia que contém o QR será enviada ao R2 após conferir a baixa.
  if(!setRecoveryPhoto(file)){e.target.value='';return}
  try{
   if(!window.jsQR)return msg('Foto selecionada. Digite o ID impresso no papel para conferir a OP.','warn');
   const img=await createImageBitmap(file),c=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,c.width,c.height);
   const d=g.getImageData(0,0,c.width,c.height),value=window.jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'})?.data||'';
   const code=norm(value.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i)?.[0]||'');
   if(!valid(code))return msg('QR não reconhecido. A foto foi selecionada; digite o ID impresso e confira no D1.','warn');
   f('Code').value=code;reset();
   for(const key of ['Machine','Product','Operator','Kg'])f(key).value='';
   f('Scrap').value='0';f('Date').value=today();
   await check();
  }catch(e){msg('Não foi possível ler o QR. A foto continua selecionada; digite o ID impresso.','warn')}finally{e.target.value=''}
 };
 return true;
}
function boot(){
 let n=0;const timer=setInterval(()=>{mount();if(++n>120)clearInterval(timer)},350);
 window.addEventListener('df-producao-team-changed',()=>setTimeout(mount,150));
 window.addEventListener('pageshow',()=>setTimeout(mount,100));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(mount,100)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
