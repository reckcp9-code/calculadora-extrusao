(function(){
'use strict';
if(window.DFGeradorTeamPwaRecoveryV180)return;window.DFGeradorTeamPwaRecoveryV180=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var ADMIN_SECRET_KEY='df_access_admin_secret_saved_v1';
var TEAM_KEY='df_op_team_v1';
var GEN_CRED_KEY='df_gerador_owner_access_credential_v1';
var GEN_DEVICE_KEY='df_gerador_owner_device_v1';
var ACCESS_KEY='df_auto_access_credential_v1';
var DEVICE_KEY='df_licenseauth_device_v1';
var TOKEN_KEY='df_secure_token_v2';
var running=false,done=false;
var rawFetch=window.fetch.bind(window);

function $(id){return document.getElementById(id)}
function secret(){var v='';try{v=String($('secret')&&$('secret').value||'').trim()}catch(e){}if(v)return v;try{return String(localStorage.getItem(ADMIN_SECRET_KEY)||'').trim()}catch(e){return''}}
function saveTeam(t){try{if(t)localStorage.setItem(TEAM_KEY,JSON.stringify(t))}catch(e){}}
function hasPair(){try{return !!(String(localStorage.getItem(ACCESS_KEY)||'').trim()&&String(localStorage.getItem(DEVICE_KEY)||'').trim())}catch(e){return false}}
function savePair(cred,dev,token){try{if(cred){localStorage.setItem(GEN_CRED_KEY,String(cred));localStorage.setItem(ACCESS_KEY,String(cred))}if(dev){localStorage.setItem(GEN_DEVICE_KEY,String(dev));localStorage.setItem(DEVICE_KEY,String(dev))}if(token)sessionStorage.setItem(TOKEN_KEY,String(token))}catch(e){}}
function setMsg(text,kind){var teamBox=$('dfTeamPermTeam');if(teamBox)teamBox.textContent=text;var m=$('dfTeamPermMsg');if(m){m.textContent=text;m.className='status '+(kind||'')}}
async function adminPost(path,body){var s=secret();if(!s)throw new Error('Painel administrativo ainda não autenticado.');var r=await rawFetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':s},body:JSON.stringify(body||{}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}
async function session(cred,dev){var r=await rawFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:cred,deviceId:dev}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false||!j.token)return null;return String(j.token||'')}
async function teamStatus(token,dev){var r=await rawFetch(API+'/op/team/status',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:'{}',cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)return null;return j&&j.team?j.team:null}
function directTeam(obj){if(!obj||typeof obj!=='object')return null;var t=obj.team||obj.ownerTeam||obj.opTeam||null;if(t&&typeof t==='object'&&t.teamId)return t;if(obj.teamId&&(String(obj.role||'').toLowerCase()==='owner'||obj.teamName))return{teamId:obj.teamId,name:obj.teamName||obj.name||'DF EXTRUSOR',role:obj.role||'owner'};return null}
function first(v,names){for(var i=0;i<names.length;i++){var x=v&&v[names[i]];if(x!==undefined&&x!==null&&String(x).trim())return String(x).trim()}return''}
function candidates(items){var out=[],seen={};(items||[]).forEach(function(it){if(!it||typeof it!=='object')return;var dev=first(it,['deviceId','device_id','device','boundDeviceId']);if(!dev)return;var vals=[];['accessCredential','access_credential','autoAccessCredential','sessionCredential','credential','accessToken','licenseKey'].forEach(function(k){var v=it[k];if(v!==undefined&&v!==null&&String(v).trim())vals.push(String(v).trim())});vals.forEach(function(cred){var key=dev+'|'+cred;if(seen[key])return;seen[key]=1;out.push({cred:cred,dev:dev,item:it})})});return out.slice(0,120)}
async function tryAdminTeam(){var s=secret();if(!s)return null;try{var r=await rawFetch(API+'/op/team/status',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Admin':s},body:JSON.stringify({admin:true}),cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(r.ok&&j&&j.team)return j.team}catch(e){}return null}
async function recover(){
  if(running||done||navigator.onLine===false)return;running=true;
  try{
    var local=null;try{local=JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){}
    if(local&&local.teamId&&hasPair()){done=true;return}
    var s=secret();if(!s){setMsg('Aguardando o acesso administrativo para localizar sua equipe...','');return}
    setMsg('Buscando sua equipe e o acesso do dono...','');

    var direct=await tryAdminTeam();if(direct&&direct.teamId)saveTeam(direct);
    var j=await adminPost('/admin/access/list-used',{}),items=Array.isArray(j.items)?j.items:[];
    var td=directTeam(j);if(td)saveTeam(td);
    for(var z=0;z<items.length;z++){var ti=directTeam(items[z]);if(ti&&String(ti.role||'').toLowerCase()==='owner')saveTeam(ti)}

    var list=candidates(items),found=null;
    for(var i=0;i<list.length;i++){
      var c=list[i],tok=null,t=null;
      try{tok=await session(c.cred,c.dev);if(!tok)continue;t=await teamStatus(tok,c.dev)}catch(e){continue}
      if(!t||!t.teamId)continue;
      if(String(t.role||'').toLowerCase()==='owner'){found={team:t,cred:c.cred,dev:c.dev,token:tok};break}
      if(!found)found={team:t,cred:c.cred,dev:c.dev,token:tok};
    }
    if(found){
      saveTeam(found.team);savePair(found.cred,found.dev,found.token);done=true;
      setMsg('Equipe: '+String(found.team.name||'DF EXTRUSOR')+' • '+(String(found.team.role||'').toLowerCase()==='owner'?'DONO':'OPERADOR'),'ok');
      try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:found.team,source:'pwa-recovery-v180'}}))}catch(e){}
      setTimeout(function(){try{window.DFGeradorTeamPermissions&&window.DFGeradorTeamPermissions.load&&window.DFGeradorTeamPermissions.load()}catch(e){}},100);
      return;
    }
    var cached=null;try{cached=JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){}
    if(cached&&cached.teamId){setMsg('Equipe encontrada, mas ainda estou recuperando o acesso do dono.','');return}
    setMsg('Não encontrei a equipe neste acesso ainda. Vou tentar novamente automaticamente.','bad');
  }catch(e){setMsg('Não consegui localizar a equipe agora. Vou tentar novamente automaticamente.','bad')}
  finally{running=false}
}
function boot(){var n=0,t=setInterval(function(){n++;if($('dfTeamPermCard')&&$('statusMsg')){clearInterval(t);setTimeout(recover,250)}else if(n>80)clearInterval(t)},100);var tries=0,again=setInterval(function(){tries++;if(done||tries>20){clearInterval(again);return}recover()},2000);window.addEventListener('online',function(){done=false;setTimeout(recover,250)});window.addEventListener('pageshow',function(){if(!done)setTimeout(recover,250)});var b=$('statusBtn');if(b)b.addEventListener('click',function(){done=false;setTimeout(recover,700)})}
window.DFGeradorTeamPwaRecovery={recover:recover};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
