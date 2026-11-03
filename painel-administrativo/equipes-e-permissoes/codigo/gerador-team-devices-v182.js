(function(){
'use strict';
if(window.DFGeradorTeamDevicesV182)return;window.DFGeradorTeamDevicesV182=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1';
var OWNER_TOKEN_KEY='df_gerador_owner_token_v181';
var OWNER_DEVICE_KEY='df_gerador_owner_device_v181';
var busy=false,timer=0;

function $(id){return document.getElementById(id)}
function loadTeam(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
function ownerSession(){try{var token=String(sessionStorage.getItem(OWNER_TOKEN_KEY)||'').trim(),deviceId=String(sessionStorage.getItem(OWNER_DEVICE_KEY)||'').trim();return token&&deviceId?{token:token,deviceId:deviceId}:null}catch(e){return null}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v){try{var d=new Date(v);if(!Number.isFinite(d.getTime()))return'';return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}

function style(){if($('dfTeamDevicesStyle182'))return;var s=document.createElement('style');s.id='dfTeamDevicesStyle182';s.textContent='#dfTeamDevices182{margin-top:9px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:11px;color:#e2e8f0}#dfTeamDevices182 .tdTop{font-size:13px;font-weight:950;color:#f8fafc}#dfTeamDevices182 .tdMeta{font-size:11px;color:#93c5fd;margin-top:5px;font-weight:850}#dfTeamDevices182 .tdList{display:grid;gap:6px;margin-top:9px}#dfTeamDevices182 .tdRow{border:1px solid #263244;background:#111827;border-radius:9px;padding:8px;font-size:11px;color:#cbd5e1}#dfTeamDevices182 .tdRow b{color:#bfdbfe}#dfTeamDevices182 .tdMuted{font-size:11px;color:#94a3b8;margin-top:5px}';document.head.appendChild(s)}
function mount(){var host=$('dfTeamPermTeam');if(!host)return false;style();var box=$('dfTeamDevices182');if(!box){box=document.createElement('div');box.id='dfTeamDevices182';host.insertAdjacentElement('afterend',box)}return true}
function renderLoading(){if(!mount())return;var b=$('dfTeamDevices182');b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">Atualizando equipe...</div>'}
function renderError(text){if(!mount())return;var b=$('dfTeamDevices182');b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">'+esc(text||'Não foi possível consultar agora.')+'</div>'}
function render(members){if(!mount())return;members=Array.isArray(members)?members:[];var owners=members.filter(function(m){return String(m&&m.role||'').toLowerCase()==='owner'});var ops=members.filter(function(m){return String(m&&m.role||'').toLowerCase()!=='owner'});var html='<div class="tdTop">📱 Aparelhos conectados: '+members.length+'</div><div class="tdMeta">👑 Dono: '+owners.length+' • 👷 Operadores: '+ops.length+'</div>';
  if(members.length){html+='<div class="tdList">';members.forEach(function(m,i){var role=String(m&&m.role||'').toLowerCase()==='owner'?'DONO':'OPERADOR';var last=fmt(m&& (m.lastActivity||m.lastSeen||m.updatedAt||m.joinedAt));html+='<div class="tdRow"><b>'+(role==='DONO'?'👑 ':'👷 ')+role+'</b> • Aparelho '+(i+1)+(last?'<br>Última atividade: '+esc(last):'')+'</div>'});html+='</div>'}else html+='<div class="tdMuted">Nenhum aparelho retornado pela equipe.</div>';b.innerHTML=html
}
async function postMembers(teamId){var o=ownerSession();if(!o)throw new Error('sessão do dono não pronta');var r=await fetch(API+'/op/team/members',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+o.token,'X-DF-Device':o.deviceId},body:JSON.stringify({teamId:String(teamId||'')}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return Array.isArray(j.members)?j.members:[]}
async function refresh(force){if(busy)return false;if(!mount())return false;busy=true;try{var t=loadTeam();if((!t||!t.teamId||String(t.role||'').toLowerCase()!=='owner')&&window.DFGeradorTeamPermissions&&typeof window.DFGeradorTeamPermissions.recoverOwner==='function'){renderLoading();try{t=await window.DFGeradorTeamPermissions.recoverOwner(!!force)}catch(e){}}
    if(!t||!t.teamId){renderError('Equipe ainda não localizada.');return false}
    var members=await postMembers(t.teamId);render(members);return true
  }catch(e){renderError('Não foi possível atualizar os aparelhos agora.');return false}finally{busy=false}}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(function(){refresh(!!force)},ms||100)}
function boot(){var tries=0,iv=setInterval(function(){tries++;if(mount()||tries>60){clearInterval(iv);schedule(350,false)}},100);window.addEventListener('pageshow',function(){schedule(250,false)});window.addEventListener('online',function(){schedule(200,true)});window.addEventListener('focus',function(){schedule(200,false)});window.addEventListener('df-team-changed',function(){schedule(200,true)});window.addEventListener('df-team-joined',function(){schedule(200,true)});setInterval(function(){if(!document.hidden)refresh(false)},30000)}
window.DFGeradorTeamDevices={refresh:refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();