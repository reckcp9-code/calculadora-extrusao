(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function load(){
  if(window.DFTeamTabPermissionsV196)return;
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v196.js?v=196&t='+Date.now();
  s.async=false;
  s.onload=function(){try{window.DFTeamTabPermissionsV196API&&window.DFTeamTabPermissionsV196API.sync(true)}catch(e){}};
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
