(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function load(){
  if(window.DFTeamTabPermissionsV200){try{window.DFTeamTabPermissionsV200API&&window.DFTeamTabPermissionsV200API.sync(true)}catch(e){}return;}
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v200.js?v=200&t='+Date.now();
  s.async=false;
  s.onload=function(){try{window.DFTeamTabPermissionsV200API&&window.DFTeamTabPermissionsV200API.sync(true)}catch(e){}};
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();