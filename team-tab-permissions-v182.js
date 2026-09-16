(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function load(){
  if(window.DFTeamTabPermissionsV201){try{window.DFTeamTabPermissionsV201API&&window.DFTeamTabPermissionsV201API.sync(true)}catch(e){}return;}
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v201.js?v=201&t='+Date.now();
  s.async=false;
  s.onload=function(){try{window.DFTeamTabPermissionsV201API&&window.DFTeamTabPermissionsV201API.sync(true)}catch(e){}};
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();