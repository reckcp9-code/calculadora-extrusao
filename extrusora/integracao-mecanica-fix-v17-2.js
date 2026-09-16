(function(){
'use strict';
if(window.DFMechanicalIntegrationFixV172)return;window.DFMechanicalIntegrationFixV172=true;
var K='df_private_extruder_calc_machines_v1',LAST='df_private_extruder_last_machine_v1';
function $(id){return document.getElementById(id)}
function load(){try{var a=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function current(){var id='';try{id=localStorage.getItem(LAST)||''}catch(e){}return load().find(function(x){return x&&x.id===id})||null}
function fill(){var m=current();if(!m)return;if($('mi17MachinePower'))$('mi17MachinePower').value=m.motorPowerCV||m.powerCV||'';if($('mi17MachineMotorRpm'))$('mi17MachineMotorRpm').value=m.motorNominalRpm||'';if($('motorRpm')&&!String($('motorRpm').value||'').trim()&&m.motorNominalRpm)$('motorRpm').value=m.motorNominalRpm}
document.addEventListener('click',function(e){var t=e.target;if(!t)return;if(t.closest&&t.closest('.machine,[data-go-machines],[data-open="machinesPage"]'))setTimeout(fill,70)},true);
window.addEventListener('pageshow',function(){setTimeout(fill,80)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(fill,80)});
setInterval(function(){if(!document.hidden)fill()},3000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(fill,120)},{once:true});else setTimeout(fill,120);
})();