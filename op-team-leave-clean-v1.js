(function(){
'use strict';
if(window.DFOpTeamLeaveCleanV1)return;window.DFOpTeamLeaveCleanV1=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1',TEAM='df_op_team_v1';
var leaving=false;
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}}
function tokenPayload(t){try{var s=String(t||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){var t='';try{t=String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){}var p=tokenPayload(t);if(t&&!force&&p&&p.owner)return t;var c='';try{c=String(localStorage.getItem(ACCESS)||'').trim()}catch(e){}var d=deviceId();if(!c||!d)throw new Error('acesso indisponível');var r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':d},body:JSON.stringify({credential:c,deviceId:d}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');t=String(j.token||'').trim();if(!t)throw new Error('sessão vazia');try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function post(path,body,retry){var t=await renew(false),d=deviceId(),r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t,'X-DF-Device':d},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renew(true);return post(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}

function shouldRemoveKey(k){
 if(!k)return false;
 // Remove apenas dados locais operacionais; preserva licença, device ID, login e configurações gerais.
 return /^(df_op_|df_ops_|df_formula_|df_formulac|df_formulas|df_favoritos|df_resinas|df_materiais|df_material_|df_team_formula|df_team_material|df_production_|df_producao_|df_now_|df_test_photo_names_confirmed_|df_extrusao_medidas|df_manual_op_product_v1|df_cloud_pending)/i.test(k);
}
function clearStorageArea(area){try{var keys=[];for(var i=0;i<area.length;i++)keys.push(area.key(i));keys.forEach(function(k){if(shouldRemoveKey(k))try{area.removeItem(k)}catch(e){}})}catch(e){}}
function clearPhotoDb(){return new Promise(function(resolve){
  if(!('indexedDB'in window)){resolve();return}
  var done=false;function finish(){if(done)return;done=true;resolve()}
  try{
    var req=indexedDB.open('df_ops_fotos_v2',1);
    req.onupgradeneeded=function(){try{var db=req.result;if(!db.objectStoreNames.contains('photos'))db.createObjectStore('photos',{keyPath:'id'})}catch(e){}};
    req.onerror=finish;
    req.onsuccess=function(){var db=req.result;try{if(db.objectStoreNames.contains('photos')){var tx=db.transaction('photos','readwrite');tx.objectStore('photos').clear();tx.oncomplete=function(){try{db.close()}catch(e){}finish()};tx.onerror=function(){try{db.close()}catch(e){}finish()};tx.onabort=tx.onerror}else{try{db.close()}catch(e){}finish()}}catch(e){try{db.close()}catch(x){}finish()}};
    setTimeout(finish,1800);
  }catch(e){finish()}
})}
async function clearLocalTeamData(){
  await clearPhotoDb();
  clearStorageArea(localStorage);clearStorageArea(sessionStorage);
}
async function leave(team,btn){
  if(leaving)return;
  var teamId=String(team&&team.teamId||'').trim();if(!teamId)return;
  if(!confirm('SAIR DA EQUIPE E APAGAR TODOS OS DADOS LOCAIS DESTE APARELHO?\n\nSerão apagados somente neste celular: fotos locais, formulações, materiais, pesos, OPs, PRONTAS, PENDENTES e dados de produção.\n\nNADA será excluído do servidor (D1/R2), da equipe ou dos outros aparelhos.\n\nAo entrar novamente, os dados já sincronizados na nuvem serão recuperados. Dados que ainda não foram enviados ao servidor não poderão ser recuperados.\n\nA licença e o login deste aplicativo serão preservados.'))return;
  leaving=true;if(btn){btn.disabled=true;btn.textContent='LIMPANDO E SAINDO...'}
  try{
    var j=await post('/op/team/leave',{teamId:teamId});
    await clearLocalTeamData();
    alert((j&&j.message?j.message+'\n\n':'')+'Dados locais deste aparelho limpos. Os dados do servidor foram preservados. Entre novamente na equipe para sincronizar.');
    location.reload();
  }catch(e){leaving=false;if(btn){btn.disabled=false;btn.textContent='🚪 SAIR DA EQUIPE'}alert('Não foi possível sair: '+(e&&e.message||e))}
}

document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('#dfTeamLeaveBtn'):null;if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  var team=load(TEAM,null);if(!team){alert('Equipe não encontrada neste aparelho.');return}
  leave(team,btn);
},true);
})();
