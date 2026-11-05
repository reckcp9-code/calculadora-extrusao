(function(){
'use strict';
if(window.DFAuthSelfHealV1)return;window.DFAuthSelfHealV1=true;

var API_HOST='df-extrusor-api.reck-cp9.workers.dev';
var ACCESS='df_auto_access_credential_v1';
var DEVICE='df_licenseauth_device_v1';
var previousFetch=window.fetch.bind(window);
var healing=null;

function deviceId(){
  try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){var id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}
  try{return String(localStorage.getItem(DEVICE)||'').trim()}catch(e){return''}
}
function authFailure(r){return !!(r&&[401,403,404,410].indexOf(Number(r.status))>=0)}
async function heal(){
  if(healing)return healing;
  healing=(async function(){
    try{
      var api=window.DFAccessRecovery;
      if(!api||typeof api.repair!=='function')return null;
      return await api.repair();
    }catch(e){return null}
    finally{setTimeout(function(){healing=null},0)}
  })();
  return healing;
}
function apiUrl(input){try{return new URL(typeof input==='string'?input:(input&&input.url)||'',location.href)}catch(e){return null}}
function patchedSessionInit(init,fixed){
  var out=Object.assign({},init||{}),body={};
  try{body=JSON.parse(String(out.body||'{}'))||{}}catch(e){body={}}
  body.credential=String(fixed&&fixed.credential||localStorage.getItem(ACCESS)||'').trim();
  body.deviceId=deviceId();
  out.body=JSON.stringify(body);
  var h=new Headers(out.headers||{});h.set('Content-Type','application/json');if(body.deviceId)h.set('X-DF-Device',body.deviceId);out.headers=h;out.cache='no-store';
  return out;
}

window.fetch=async function(input,init){
  var u=apiUrl(input),r=await previousFetch(input,init);
  if(!u||u.hostname!==API_HOST||u.pathname!=='/access/session'||!authFailure(r))return r;
  var fixed=await heal();if(!fixed||!fixed.credential)return r;
  try{return await previousFetch(input,patchedSessionInit(init,fixed))}catch(e){return r}
};

window.addEventListener('df-access-repaired',function(){
  try{window.dispatchEvent(new CustomEvent('df-auth-ready',{detail:{repaired:true}}))}catch(e){}
});
})();