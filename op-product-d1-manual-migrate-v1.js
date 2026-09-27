(function(){
'use strict';
if(window.DFOpProductD1ManualMigrateV1)return;window.DFOpProductD1ManualMigrateV1=true;

var MANUAL='df_manual_op_product_v1',TEAM='df_op_team_v1',PREFIX='df_op_product_manual_migrated_v1:';
var running=false;
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function norm(v){return String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,'')}
function validName(v){var s=String(v==null?'':v).trim();return s&&!/^(?:—|-|sem produto|op sem nome|produto não informado(?: na op)?)$/i.test(s)?s:''}
function team(){try{if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){var t=window.DFOpCloud.team();if(t)return t}}catch(e){}return load(TEAM,null)}
function isOwner(){var t=team();return !!(t&&String(t.role||'').toLowerCase()==='owner')}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}

async function run(force){
  if(running||!isOwner()||navigator.onLine===false)return false;
  var t=team(),teamId=String(t&&t.teamId||'').trim();if(!teamId)return false;
  var key=PREFIX+teamId;
  if(!force){try{if(localStorage.getItem(key)==='1')return true}catch(e){}}
  var api=window.DFOpProductD1Authority;if(!api||typeof api.set!=='function')return false;
  var m=load(MANUAL,{}),items=[];
  Object.keys(m||{}).forEach(function(k){var id=norm(k),name=validName(m[k]);if(id&&name)items.push([id,name])});
  running=true;
  try{
    for(var i=0;i<items.length;i++){
      var ok=false;
      for(var n=0;n<12&&!ok;n++){
        try{ok=await api.set(items[i][0],items[i][1])}catch(e){ok=false}
        if(!ok)await sleep(350);
      }
      if(!ok)return false;
    }
    try{localStorage.setItem(key,'1')}catch(e){}
    try{if(typeof api.sync==='function')await api.sync(true)}catch(e){}
    return true;
  }finally{running=false}
}

function boot(){
  setTimeout(function(){run(false)},2200);
  setTimeout(function(){run(false)},5200);
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfCloudRefresh'):null;if(b)setTimeout(function(){run(false)},450)},true);
  window.addEventListener('online',function(){setTimeout(function(){run(false)},300)});
  window.addEventListener('pageshow',function(){setTimeout(function(){run(false)},300)});
}
window.DFOpProductD1ManualMigrate={run:function(){return run(true)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
