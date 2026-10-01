(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function load(){
  if(window.DFTeamTabPermissionsV202){try{window.DFTeamTabPermissionsV202API&&window.DFTeamTabPermissionsV202API.sync(true)}catch(e){}return;}
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v202.js?v=202&t='+Date.now();
  s.async=false;
  s.onload=function(){try{window.DFTeamTabPermissionsV202API&&window.DFTeamTabPermissionsV202API.sync(true)}catch(e){}};
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();