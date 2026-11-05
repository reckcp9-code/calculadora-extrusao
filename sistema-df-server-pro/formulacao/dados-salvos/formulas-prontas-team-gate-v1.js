(function(){
'use strict';
if(window.DFReadyFormulasTeamGateV1)return;window.DFReadyFormulasTeamGateV1=true;
if(/^\/teste(?:\/|$)/i.test(location.pathname))return;
var loaded=false,timer=0,tries=0;
function api(){return window.DFTeamTabPermissionsV202API||window.DFTeamTabPermissionsV201API||window.DFTeamTabPermissionsV200API||null}
function role(){try{var a=api();return a&&typeof a.getRole==='function'?String(a.getRole()||'').toLowerCase():'unknown'}catch(e){return'unknown'}}
function allowed(){var r=role();return r==='owner'||r==='operator'}
function style(){if(document.getElementById('dfReadyTeamGateStyle'))return;var s=document.createElement('style');s.id='dfReadyTeamGateStyle';s.textContent='body:not(.dfReadyTeamAllowed) #dfRF2wrap,body:not(.dfReadyTeamAllowed) #dfReadyFormulaBtn,body:not(.dfReadyTeamAllowed) .df-rf-modal{display:none!important}';document.head.appendChild(s)}
function lock(){document.body&&document.body.classList.remove('dfReadyTeamAllowed');try{document.querySelectorAll('.df-rf-modal').forEach(function(e){e.remove()})}catch(e){}}
function loadFeature(){if(loaded||window.DFReadyFormulasV2)return;loaded=true;var s=document.createElement('script');s.src='./teste/formulas-prontas-v2.js?v=20261001-team-prod-v1';s.defer=true;s.onerror=function(){loaded=false};document.head.appendChild(s)}
function apply(){style();if(allowed()){document.body&&document.body.classList.add('dfReadyTeamAllowed');loadFeature();return true}lock();return false}
function check(){tries++;apply();if(tries>=24)clearInterval(timer)}
function start(){style();apply();timer=setInterval(check,300);setTimeout(function(){clearInterval(timer)},8000)}
['df-team-tab-permissions','df-team-changed','df-team-joined','online','pageshow','focus'].forEach(function(ev){window.addEventListener(ev,function(){setTimeout(apply,60)})});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(apply,60)});
setInterval(function(){if(!document.hidden)apply()},20000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
