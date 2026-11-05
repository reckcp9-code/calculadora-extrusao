(function(){
'use strict';
if(window.DFGeradorPermSessionFixV202)return;window.DFGeradorPermSessionFixV202=true;
var V200_TOKEN='df_gerador_owner_token_v200',V200_DEVICE='df_gerador_owner_device_v200';
var V181_TOKEN='df_gerador_owner_token_v181',V181_DEVICE='df_gerador_owner_device_v181';
var running=false;
function $(id){return document.getElementById(id)}
function setMsg(text,kind){var e=$('dfTeamPermMsg');if(!e)return;e.textContent=text||'';e.className='status '+(kind||'')}
function saveSession(s){if(!s||!s.token||!s.deviceId)return null;try{sessionStorage.setItem(V200_TOKEN,String(s.token));sessionStorage.setItem(V200_DEVICE,String(s.deviceId));sessionStorage.setItem(V181_TOKEN,String(s.token));sessionStorage.setItem(V181_DEVICE,String(s.deviceId))}catch(e){}return s}
async function recover(force){var r=window.DFGeradorOwnerRecovery,s=null;if(r){try{if(!force&&typeof r.getSession==='function')s=r.getSession()}catch(e){}if((!s||!s.token||!s.deviceId)&&typeof r.recover==='function'){try{s=await r.recover(!!force)}catch(e){s=null}}}return saveSession(s)}
async function run(){if(running)return;running=true;var b=$('dfPermSave'),old=b&&b.textContent;if(b){b.disabled=true;b.textContent='VALIDANDO DONO...'}setMsg('Validando sua sessão de DONO para salvar...','');try{var s=await recover(true);if(!s)throw new Error('não consegui recuperar a sessão do dono');var api=window.DFGeradorTeamPermissionsV200API;if(!api||typeof api.publish!=='function')throw new Error('módulo de permissões ainda não carregou');if(b){b.disabled=false;b.textContent=old||'SALVAR NOS APARELHOS MARCADOS'}running=false;await api.publish();return}catch(e){setMsg('Não consegui validar o DONO agora: '+String(e&&e.message||e)+'. Toque novamente em SALVAR.','bad')}finally{running=false;if(b){b.disabled=false;b.textContent=old||'SALVAR NOS APARELHOS MARCADOS'}}}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfPermSave'):null;if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();run()},true);
window.addEventListener('df-gerador-owner-ready',function(){recover(false)});
window.addEventListener('pageshow',function(){setTimeout(function(){recover(false)},250)});
window.DFGeradorPermSessionFixV202API={recover:recover,run:run};
})();
