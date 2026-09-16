(function(){
'use strict';
if(window.DFGeradorTeamDevicesV188)return;window.DFGeradorTeamDevicesV188=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1';
var OWNER_TOKEN_KEY='df_gerador_owner_token_v181';
var OWNER_DEVICE_KEY='df_gerador_owner_device_v181';
var CACHE_KEY='df_team_members_cache_v188';
var busy=false,timer=0;

function $(id){return document.getElementById(id)}
function loadTeam(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
function loadCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'null')}catch(e){return null}}
function saveCache(teamId,j){try{localStorage.setItem(CACHE_KEY,JSON.stringify({teamId:String(teamId||''),j:j,updatedAt:new Date().toISOString()}))}catch(e){}}
function clearSession(){try{sessionStorage.removeItem(OWNER_TOKEN_KEY);sessionStorage.removeItem(OWNER_DEVICE_KEY)}catch(e){}}
function session(){try{var token=String(sessionStorage.getItem(OWNER_TOKEN_KEY)||'').trim(),deviceId=String(sessionStorage.getItem(OWNER_DEVICE_KEY)||'').trim();return token&&deviceId?{token:token,deviceId:deviceId}:null}catch(e){return null}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v){try{var d=new Date(v);if(!Number.isFinite(d.getTime()))return'';return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
function stamp(m){var x=m&&(m.lastActivity||m.lastSeen||m.updatedAt||m.joinedAt||'');var n=Date.parse(String(x||''));return Number.isFinite(n)?n:0}
function fetchJson(url,opt,ms){return new Promise(function(resolve,reject){var done=false,c=null,t=null;try{if('AbortController' in window){c=new AbortController();opt=Object.assign({},opt||{},{signal:c.signal})}}catch(e){}t=setTimeout(function(){if(done)return;done=true;try{if(c)c.abort()}catch(e){}reject(new Error('tempo esgotado'))},ms||7000);fetch(url,opt||{}).then(async function(r){if(done)return;var j={};try{j=await r.json()}catch(e){}if(done)return;done=true;clearTimeout(t);resolve({r:r,j:j})}).catch(function(e){if(done)return;done=true;clearTimeout(t);reject(e)})})}

function style(){if($('dfTeamDevicesStyle188'))return;var s=document.createElement('style');s.id='dfTeamDevicesStyle188';s.textContent='#dfTeamDevices188{margin-top:9px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:11px;color:#e2e8f0}#dfTeamDevices188 .tdTop{font-size:13px;font-weight:950;color:#f8fafc}#dfTeamDevices188 .tdMeta{font-size:11px;color:#93c5fd;margin-top:5px;font-weight:850}#dfTeamDevices188 .tdList{display:grid;gap:6px;margin-top:9px}#dfTeamDevices188 .tdRow{border:1px solid #263244;background:#111827;border-radius:9px;padding:8px;font-size:11px;color:#cbd5e1}#dfTeamDevices188 .tdRow b{color:#bfdbfe}#dfTeamDevices188 .tdMuted{font-size:11px;color:#94a3b8;margin-top:5px}#dfTeamDevices188 .tdWarn{font-size:11px;color:#fde68a;margin-top:7px;line-height:1.4}#dfTeamDevices188 .tdRetry{margin-top:9px;width:100%;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:9px;padding:9px;font-size:11px;font-weight:900}';document.head.appendChild(s)}
function mount(){var host=$('dfTeamPermTeam');if(!host)return false;style();['dfTeamDevices182','dfTeamDevices183','dfTeamDevices184','dfTeamDevices185','dfTeamDevices186','dfTeamDevices187'].forEach(function(id){var e=$(id);if(e)e.remove()});var box=$('dfTeamDevices188');if(!box){box=document.createElement('div');box.id='dfTeamDevices188';host.insertAdjacentElement('afterend',box)}return true}
function loading(text){if(!mount())return;var b=$('dfTeamDevices188');b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">'+esc(text||'Atualizando...')+'</div>'}
function errorBox(text,teamId){if(!mount())return;var c=loadCache();if(c&&String(c.teamId||'')===String(teamId||'')&&c.j){render(c.j,'Mostrando a última leitura salva enquanto reconecto.');return}var b=$('dfTeamDevices188');b.innerHTML='<div class="tdTop">📱 Aparelhos conectados</div><div class="tdMuted">'+esc(text||'Não foi possível atualizar agora.')+'</div><button type="button" class="tdRetry" id="dfTeamDevicesRetry188">🔄 TENTAR NOVAMENTE</button>';var bt=$('dfTeamDevicesRetry188');if(bt)bt.onclick=function(){refresh(true)}}
function render(j,note){if(!mount())return;var members=Array.isArray(j&&j.members)?j.members.slice():[],total=Number(j&&j.memberCount||members.length||0);if(!total&&members.length)total=members.length;var rawOwners=members.filter(function(m){return String(m&&m.role||'').toLowerCase()==='owner'}),principal=rawOwners.slice().sort(function(a,b){return stamp(b)-stamp(a)})[0]||null;var owners=total>0?1:0,ops=Math.max(0,total-owners),html='<div class="tdTop">📱 Aparelhos conectados: '+total+'</div><div class="tdMeta">👑 Dono: '+owners+' • 👷 Operadores: '+ops+'</div>';
  if(note)html+='<div class="tdMuted">'+esc(note)+'</div>';
  if(rawOwners.length>1)html+='<div class="tdWarn">O servidor ainda retornou '+rawOwners.length+' registros marcados como dono. Para a equipe, considero como DONO PRINCIPAL somente o mais recente; os antigos aparecem como operador até o cadastro do servidor ser normalizado.</div>';
  if(members.length){html+='<div class="tdList">';members.forEach(function(m,i){var rawOwner=String(m&&m.role||'').toLowerCase()==='owner',isPrincipal=!!(rawOwner&&principal&&String(m.id||'')===String(principal.id||''));var role=isPrincipal?'DONO PRINCIPAL':'OPERADOR';var last=fmt(m&&(m.lastActivity||m.lastSeen||m.updatedAt||m.joinedAt));html+='<div class="tdRow"><b>'+(isPrincipal?'👑 ':'👷 ')+role+'</b> • Aparelho '+(i+1)+(last?'<br>Última atividade: '+esc(last):'')+'</div>'});html+='</div>'}
  var b=$('dfTeamDevices188');if(b)b.innerHTML=html
}

async function recover(force){var p=window.DFGeradorTeamPermissions;if(p&&typeof p.recoverOwner==='function'){try{await Promise.race([p.recoverOwner(!!force),sleep(15000)])}catch(e){}}for(var i=0;i<60;i++){var s=session();if(s)return s;await sleep(200)}return null}
async function callMembers(teamId,s){if(!s||!s.token||!s.deviceId)throw new Error('sessão inválida');var x=await fetchJson(API+'/op/team/members',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.token,'X-DF-Device':s.deviceId},body:JSON.stringify({teamId:String(teamId||'')}),cache:'no-store'},8000);if(!x.r.ok||x.j.ok===false){var er=new Error(x.j.error||('HTTP '+x.r.status));er.status=x.r.status;throw er}return x.j}
async function members(teamId,force){var s=session();if(!s||force)s=await recover(!!force);if(!s)throw new Error('sessão do dono não localizada');try{return await callMembers(teamId,s)}catch(e){clearSession();s=await recover(true);if(!s)throw e;return await callMembers(teamId,s)}}

async function refresh(force){if(busy||!mount())return false;busy=true;var teamId='';try{var t=loadTeam();if(!t||!t.teamId){loading('Localizando equipe...');await recover(false);t=loadTeam()}if(!t||!t.teamId){errorBox('Equipe não localizada.','');return false}teamId=String(t.teamId);loading('Buscando os aparelhos da equipe...');var j=await members(teamId,!!force);saveCache(teamId,j);render(j);return true}catch(e){errorBox('Reconectando ao acesso do dono. Toque em tentar novamente se não atualizar.',teamId);return false}finally{busy=false}}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(function(){refresh(!!force)},ms||100)}
function boot(){var tries=0,iv=setInterval(function(){tries++;if(mount()||tries>60){clearInterval(iv);schedule(900,false)}},100);window.addEventListener('pageshow',function(){schedule(350,false)});window.addEventListener('online',function(){schedule(250,true)});window.addEventListener('df-team-changed',function(){schedule(250,false)});window.addEventListener('df-team-joined',function(){schedule(250,false)});setInterval(function(){if(!document.hidden)refresh(false)},30000)}
window.DFGeradorTeamDevices={refresh:refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();