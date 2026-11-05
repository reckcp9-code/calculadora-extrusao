(function(){
'use strict';
if(window.DFTeamTabPermissionsV182Loader)return;window.DFTeamTabPermissionsV182Loader=true;
function loadReadyGate(){
  if(/^\/teste(?:\/|$)/i.test(location.pathname)||window.DFReadyFormulasTeamGateV1)return;
  if(document.querySelector('script[data-df-ready-team-gate="1"]'))return;
  var g=document.createElement('script');
  g.src='./formulas-prontas-team-gate-v1.js?v=20261001-team-prod-v1&t='+Date.now();
  g.defer=true;
  g.dataset.dfReadyTeamGate='1';
  document.head.appendChild(g);
}
function afterSync(){try{window.DFTeamTabPermissionsV202API&&window.DFTeamTabPermissionsV202API.sync(true)}catch(e){}setTimeout(loadReadyGate,40)}
function load(){
  if(window.DFTeamTabPermissionsV202){afterSync();return;}
  var s=document.createElement('script');
  s.src='./team-tab-permissions-v202.js?v=202&t='+Date.now();
  s.async=false;
  s.onload=afterSync;
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();