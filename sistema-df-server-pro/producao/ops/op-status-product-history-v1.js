(function(){
'use strict';
if(window.DFOpStatusProductHistoryV1)return;window.DFOpStatusProductHistoryV1=true;
var API='https://df-extrusor-api.reck-cp9.workers.dev',TOKEN='df_secure_token_v2',DEVICE='df_licenseauth_device_v1',ACCESS='df_auto_access_credential_v1',TEAM='df_op_team_v1';
var B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function norm(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
function exact(v){var s=String(v||'').trim();return s&&!/^(?:—|-|sem produto|produto não informado|op sem nome)$/i.test(s)?s:''}
function device(){try{if(window.DFDeviceIdentity&&window.DFDeviceIdentity.get){var x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}return String(localStorage.getItem(DEVICE)||'').trim()}
function token(){try{return String(sessionStorage.getItem(TOKEN)||'').trim()}catch(e){return''}}
function b32d(text){try{var s=String(text||'').toUpperCase().replace(/[^A-Z2-7]/g,''),out='',buf=0,bits=0;for(var i=0;i<s.length;i++){var v=B32.indexOf(s[i]);if(v<0)continue;buf=(buf<<5)|v;bits+=5;if(bits>=8){out+=String.fromCharCode((buf>>(bits-8))&255);bits-=8}}return decodeURIComponent(escape(out))}catch(e){return''}}
function dec64(s){try{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function parse(p){var qr=String(p&&p.qr||''),sid=String(p&&p.sourceId||''),x=null;if(qr.indexOf('DFOP-STATUS6-')===0){try{var a=JSON.parse(b32d(qr.slice(13)));if(Array.isArray(a)&&a.length>=5)x={op:a[2],product:a[3]}}catch(e){}}
if(!x){[sid,qr].some(function(s){if(s.indexOf('DFOPSTATUS5-')===0){var y=dec64(s.slice(12));if(y){x={op:y.op,product:y.product};return true}}if(s.indexOf('DFSTATUS4.')===0||s.indexOf('DFSTATUS3.')===0||s.indexOf('DFSTATUS2.')===0){var z=dec64(s.slice(10));if(z){x={op:z.op,product:z.product};return true}}return false})}
var op=norm(x&&x.op),product=exact(x&&x.product);return op&&product?{op:op,product:product}:null}
function monthShift(m,delta){var y=+String(m).slice(0,4),mo=+String(m).slice(5,7)-1,d=new Date(y,mo+delta,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function xhr(method,path,body,tok){return new Promise(function(resolve,reject){var x=new XMLHttpRequest();x.open(method,API+path,true);x.setRequestHeader('X-DF-Device',device());if(tok)x.setRequestHeader('Authorization','Bearer '+tok);if(body)x.setRequestHeader('Content-Type','application/json');x.onload=function(){var j={};try{j=JSON.parse(x.responseText||'{}')}catch(e){}if(x.status>=200&&x.status<300&&j.ok!==false)resolve(j);else reject(new Error(j.error||('HTTP '+x.status)))};x.onerror=function(){reject(new Error('rede'))};x.send(body?JSON.stringify(body):null)})}
async function session(){var t=token();if(t)return t;var c=String(localStorage.getItem(ACCESS)||'').trim(),d=device();if(!c||!d)return'';var j=await xhr('POST','/access/session',{credential:c,deviceId:d},'');t=String(j.token||'').trim();if(t)try{sessionStorage.setItem(TOKEN,t)}catch(e){}return t}
async function read(reportMonth){var out={},team=load(TEAM,null);if(!team||!team.teamId||navigator.onLine===false)return out;var m=/^\d{4}-\d{2}$/.test(String(reportMonth||''))?String(reportMonth):new Date().toISOString().slice(0,7),months=[m,monthShift(m,-1),monthShift(m,1)],t=await session();if(!t)return out;for(var i=0;i<months.length;i++){try{var j=await xhr('POST','/op/photo/list',{teamId:team.teamId,month:months[i]},t);(j.photos||[]).forEach(function(p){var x=parse(p);if(x&&!out[x.op])out[x.op]=x.product})}catch(e){}}
return out}
window.DFOpStatusProductHistory={read:read};
})();
