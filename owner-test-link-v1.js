(function(){
'use strict';
var API='https://df-extrusor-api.reck-cp9.workers.dev';
function val(storage,key){try{return String(storage.getItem(key)||'').trim()}catch(e){return''}}
function device(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function')return String(window.DFDeviceIdentity.get()||'').trim()}catch(e){}return val(localStorage,'df_licenseauth_device_v1')}
async function request(path,body,token,dev){
 var r=await fetch(API+path,{method:'POST',headers:Object.assign({'Content-Type':'application/json','X-DF-Device':dev},token?{'Authorization':'Bearer '+token}:{}),body:JSON.stringify(body),cache:'no-store'});
 if(!r.ok)return null;
 var j=await r.json();return j&&j.ok!==false?j:null
}
async function owner(){
 var dev=device();if(!dev)return false;
 var token=val(sessionStorage,'df_secure_token_v2');
 if(token){try{var status=await request('/op/team/status',{},token,dev);if(status&&status.team&&String(status.team.role).toLowerCase()==='owner')return true}catch(e){}}
 var credential=val(localStorage,'df_auto_access_credential_v1');if(!credential)return false;
 try{var session=await request('/access/session',{credential:credential,deviceId:dev},'',dev);if(!session||!session.token)return false;
 var status2=await request('/op/team/status',{},String(session.token),dev);
 return !!(status2&&status2.team&&String(status2.team.role).toLowerCase()==='owner')
 }catch(e){return false}
}
function add(){
 if(document.getElementById('dfOwnerPreviewButton'))return;
 var tabs=document.querySelector('#appContent .tabs');if(!tabs)return;
 var button=document.createElement('button');button.id='dfOwnerPreviewButton';button.type='button';button.className='tab';button.textContent='🧪 VERSÃO TESTE';
 button.addEventListener('click',function(){location.href='./preview-teste.html?origem=app'});
 tabs.appendChild(button)
}
async function boot(){if(await owner())add()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1000)},{once:true});else setTimeout(boot,1000);
window.addEventListener('pageshow',boot)
})();
