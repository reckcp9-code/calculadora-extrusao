(function(){
'use strict';
if(window.DFGeradorTeamDevicesV184)return;window.DFGeradorTeamDevicesV184=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1';
var TOKEN_KEY='df_secure_token_v2';
var DEVICE_KEY='df_licenseauth_device_v1';
var ACCESS_KEY='df_auto_access_credential_v1';
var busy=false,timer=0,lastMembers=[];

function $(id){return document.getElementById(id)}
function loadTeam(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function credential(){try{return String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return''}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v){try{var d=new Date(v);if(!Number.isFinite(d.getTime()))return'';return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
function fetchTimeout(url,opt,ms){var c=null,t=null;try{if('AbortController' in window){c=new AbortController();opt=Object.assign({},opt||{},{signal:c.signal});t=setTimeout(function(){try{c.abort()}catch(e){}},ms||8000)}}catch(e){}return fetch(url,opt).finally(function(){if(t)clearTimeout(t)})}

function style(){if($('dfTeamDevicesStyle184'))return;var s=document.createElement('style');s.id='dfTeamDevicesStyle184';s.textContent='#dfTeamDevices184{margin-top:9px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:11px;color:#e2e8f0}#dfTeamDevices184 .tdTop{font-size:13px;font-weight:950;color:#f8fafc}#dfTeamDevices184 .tdMeta{font-size:11px;color:#93c5fd;margin-top:5px;font-weight:850}#dfTeamDevices184 .tdList{display:grid;gap:6px;margin-top:9px}#dfTeamDevices184 .tdRow{border:1px solid #263244;background:#111827;border-radius:9px;padding:8px;font-size:11px;color:#cbd5e1}#dfTeamDevices184 .tdRow b{color:#bfdbfe}#dfTeamDevices184 .tdMuted{font-size:11px;color:#94a3b8;margin-top:5px}';document.head.appendChild(s)}
function mount(){var host=$('dfTeamPermTeam');if(!host)return false;style();['dfTeamDevices182','dfTeamDevices183'].forEach(function(id){var e=$(id);if(e)e.remove()});var box=$('dfTeamDevices184');if(!box){box=document.createElement('div');box.id='dfTeamDevices184';host.insertAdjacentElement('afterend',box)}return true}
function renderLoading(){if(!mount())return;var b=$('dfTeamDevices184');b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">Atualizando aparelhos...</div>'}
function renderError(text){if(!mount())return;var b=$('dfTeamDevices184');if(lastMembers.length){render(lastMembers);return}b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">'+esc(text||'Não foi possível consultar agora.')+'</div>'}
function render(members){if(!mount())return;members=Array.isArray(members)?members:[];lastMembers=members.slice();var owners=members.filter(function(m){return String(m&&m.role||'').toLowerCase()==='owner'}),ops=members.filter(function(m){return String(m&&m.role||'').toLowerCase()!=='owner'});var html='<div class="tdTop">📱 Aparelhos conectados: '+members.length+'</div><div class="tdMeta">👑 Dono: '+owners.length+' • 👷 Operadores: '+ops.length+'</div>';if(members.length){html+='<div class="tdList">';members.forEach(function(m,i){var role=String(m&&m.role||'').toLowerCase()==='owner'?'DONO':'OPERADOR',last=fmt(m&&(m.lastActivity||m.lastSeen||m.updatedAt||m.joinedAt));html+='<div class="tdRow"><b>'+(role==='DONO'?'👑 ':'👷 ')+role+'</b> • Aparelho '+(i+1)+(last?'<br>Última atividade: '+esc(last):'')+'</div>'});html+='</div>'}b.innerHTML=html}

async function renewSession(){var cred=credential(),dev=deviceId();if(!cred||!dev)throw new Error('acesso automático indisponível');var r=await fetchTimeout(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:cred,deviceId:dev}),cache:'no-store'},8000),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false||!j.token)throw new Error(j.error||'sessão indisponível');try{sessionStorage.setItem(TOKEN_KEY,String(j.token))}catch(e){}return String(j.token)}
async function currentToken(force){var tok='';try{tok=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}if(tok&&!force)return tok;return renewSession()}
async function apiPost(path,body,retry){var dev=deviceId(),tok=await currentToken(false);var r=await fetchTimeout(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'},8000),j={};try{j=await r.json()}catch(e){}if((r.status===401||r.status===403)&&retry!==false){await currentToken(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}

async function refresh(force){if(busy)return false;if(!mount())return false;busy=true;try{renderLoading();var t=loadTeam();if(!t||!t.teamId){try{var st=await apiPost('/op/team/status',{},true);if(st&&st.team){t=st.team;try{localStorage.setItem(TEAM_KEY,JSON.stringify(t))}catch(e){}}}catch(e){}}
    if(!t||!t.teamId){renderError('Equipe não localizada neste aparelho.');return false}
    var j=await apiPost('/op/team/members',{teamId:String(t.teamId)},true),members=Array.isArray(j.members)?j.members:[];render(members);return true
  }catch(e){renderError('Não foi possível atualizar agora.');return false}finally{busy=false}}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(function(){refresh(!!force)},ms||100)}
function boot(){var tries=0,iv=setInterval(function(){tries++;if(mount()||tries>60){clearInterval(iv);schedule(300,true)}},100);window.addEventListener('pageshow',function(){schedule(200,true)});window.addEventListener('online',function(){schedule(150,true)});window.addEventListener('focus',function(){schedule(150,true)});window.addEventListener('df-team-changed',function(){schedule(150,true)});window.addEventListener('df-team-joined',function(){schedule(150,true)});setInterval(function(){if(!document.hidden)refresh(false)},20000)}
window.DFGeradorTeamDevices={refresh:refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();