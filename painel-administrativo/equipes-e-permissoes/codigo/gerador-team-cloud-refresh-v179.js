(function(){
'use strict';
if(window.DFGeradorTeamCloudRefreshV179)return;window.DFGeradorTeamCloudRefreshV179=true;

var API='https://df-extrusor-api.reck-cp9.workers.dev';
var TEAM_KEY='df_op_team_v1';
var TOKEN_KEY='df_secure_token_v2';
var DEVICE_KEY='df_licenseauth_device_v1';
var ACCESS_KEY='df_auto_access_credential_v1';
var rawFetch=window.fetch.bind(window);
var running=false;

function $(id){return document.getElementById(id)}
function saveTeam(t){try{if(t)localStorage.setItem(TEAM_KEY,JSON.stringify(t));else localStorage.removeItem(TEAM_KEY)}catch(e){}}
function deviceId(){try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{var s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(function(c){return'%'+c.charCodeAt(0).toString(16).padStart(2,'0')}).join('')))}catch(e){return null}}
async function renew(force){
  var tok='';try{tok=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
  var p=tokenPayload(tok);if(tok&&!force&&p&&p.owner)return tok;
  var cred='';try{cred=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
  var dev=deviceId();
  if(!cred||!dev)throw new Error('acesso do aparelho indisponível');
  var r=await rawFetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential:cred,deviceId:dev}),cache:'no-store'}),j={};
  try{j=await r.json()}catch(e){}
  if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');
  tok=String(j.token||'').trim();if(!tok)throw new Error('sessão vazia');
  try{sessionStorage.setItem(TOKEN_KEY,tok)}catch(e){}
  return tok;
}
async function status(retry){
  var tok=await renew(false),dev=deviceId();
  var r=await rawFetch(API+'/op/team/status',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok,'X-DF-Device':dev},body:'{}',cache:'no-store'}),j={};
  try{j=await r.json()}catch(e){}
  if(r.status===401&&retry!==false){await renew(true);return status(false)}
  if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));
  return j;
}
function setText(text,kind){
  var box=$('dfTeamPermTeam');if(box)box.textContent=text;
  var msg=$('dfTeamPermMsg');if(msg){msg.textContent=text;msg.className='status '+(kind||'')}
}
async function refresh(){
  if(running)return;running=true;
  try{
    if(navigator.onLine===false)return;
    setText('Buscando sua equipe na nuvem...','');
    var j=await status(true);
    if(j&&j.team){
      saveTeam(j.team);
      var role=String(j.team.role||'').toLowerCase()==='owner'?'DONO':'OPERADOR';
      var label='Equipe: '+String(j.team.name||'DF EXTRUSOR')+' • '+role;
      setText(label,'ok');
      setTimeout(function(){try{window.DFGeradorTeamPermissions&&window.DFGeradorTeamPermissions.load&&window.DFGeradorTeamPermissions.load()}catch(e){}},80);
      try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:j.team,source:'cloud-refresh-v179'}}))}catch(e){}
      return;
    }
    saveTeam(null);
    setText('Nenhuma equipe vinculada a este acesso.','bad');
  }catch(e){
    var local=null;try{local=JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(x){}
    if(local){
      var role2=String(local.role||'').toLowerCase()==='owner'?'DONO':'OPERADOR';
      setText('Equipe: '+String(local.name||'DF EXTRUSOR')+' • '+role2,'ok');
      try{window.DFGeradorTeamPermissions&&window.DFGeradorTeamPermissions.load&&window.DFGeradorTeamPermissions.load()}catch(x){}
    }else setText('Não consegui buscar sua equipe agora. Atualize a página.','bad');
  }finally{running=false}
}
function boot(){
  var tries=0,t=setInterval(function(){
    tries++;
    if($('dfTeamPermCard')||tries>50){clearInterval(t);refresh()}
  },100);
  window.addEventListener('pageshow',function(){setTimeout(refresh,120)});
  window.addEventListener('online',function(){setTimeout(refresh,180)});
}
window.DFGeradorTeamCloudRefresh={refresh:refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
