(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function loadFix(){
  if(window.DFTeamPermOwnerReleaseV197)return;
  var f=document.createElement('script');
  f.src='./team-tab-permissions-owner-release-v197.js?v=197&t='+Date.now();
  f.async=false;
  document.head.appendChild(f);
}
function load(){
  if(window.DFTeamTabPermissionsV196){loadFix();return;}
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v196.js?v=196&t='+Date.now();
  s.async=false;
  s.onload=function(){try{window.DFTeamTabPermissionsV196API&&window.DFTeamTabPermissionsV196API.sync(true)}catch(e){}loadFix();};
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();