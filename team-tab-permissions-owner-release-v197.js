(function(){
'use strict';
if(window.DFTeamPermOwnerReleaseV197)return;window.DFTeamPermOwnerReleaseV197=true;
var TEAM_KEY='df_op_team_v1',TEAM_CODE_KEY='df_op_team_join_code_v1',ADMIN_SECRET_KEY='df_access_admin_secret_saved_v1';
var DENY=['dfPermDenied196','dfTeamPermDenied195','dfTeamPermDenied','dfTeamPermDenied178','dfPermDenied197Fix'];
function load(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function raw(k){try{return String(localStorage.getItem(k)||'').trim()}catch(e){return''}}
function team(){var t=load(TEAM_KEY);return t&&typeof t==='object'?t:null}
function ownerRole(t){return String(t&&t.role||'').toLowerCase()==='owner'}
function realOwner(t){return ownerRole(t)&&!!(raw(TEAM_CODE_KEY)||raw(ADMIN_SECRET_KEY))}
function key(n){if(!n||n.nodeType!==1)return'';var id=String(n.id||'');if(id==='btEx'||id==='pgEx')return'extrusao';if(id==='btFo'||id==='pgFo')return'formulacao';if(id==='btSa'||id==='pgSa')return'sacolas';if(id==='btCu'||id==='pgCu')return'custo';var oc=String(n.getAttribute&&n.getAttribute('onclick')||''),tx=String(n.textContent||'').trim().toUpperCase();if(/curso\.html/i.test(oc)||tx.indexOf('CURSO')===0)return'curso';if(tx.indexOf('SACOLA')===0)return'sacolas';if(tx.indexOf('CUSTO')===0)return'custo';if(tx.indexOf('EXTRUS')===0)return'extrusao';if(tx.indexOf('FORMULA')===0)return'formulacao';return''}
function nodes(){var a=[];try{document.querySelectorAll('#btEx,#btFo,#btSa,#btCu,#pgEx,#pgFo,#pgSa,#pgCu,.tabs .tab,.tabs button,.page').forEach(function(e){if(a.indexOf(e)<0)a.push(e)})}catch(e){}return a}
function clearDeny(e){DENY.forEach(function(c){try{e.classList.remove(c)}catch(x){}})}
function ensureStyle(){if(document.getElementById('dfPermFix197Style'))return;var s=document.createElement('style');s.id='dfPermFix197Style';s.textContent='.dfPermDenied197Fix{display:none!important}';document.head.appendChild(s)}
function apply(){ensureStyle();var t=team(),api=window.DFTeamTabPermissionsV196API||window.DFTeamTabPermissionsV182API,all={extrusao:true,formulacao:true,sacolas:true,custo:true,curso:true},tabs=api&&typeof api.get==='function'?api.get():all,owner=realOwner(t);nodes().forEach(function(e){var k=key(e);if(!k)return;if(owner||!t||tabs[k]!==false){clearDeny(e)}else{clearDeny(e);e.classList.add('dfPermDenied197Fix')}});if(owner){try{window.dispatchEvent(new CustomEvent('df-owner-tabs-restored',{detail:{owner:true}}))}catch(e){}}}
function sync(){var api=window.DFTeamTabPermissionsV196API||window.DFTeamTabPermissionsV182API;if(api&&typeof api.sync==='function'){Promise.resolve(api.sync(true)).finally(function(){setTimeout(apply,40);setTimeout(apply,250)})}else apply()}
function boot(){apply();[100,400,900,1800].forEach(function(ms){setTimeout(sync,ms)});var mo=new MutationObserver(function(){apply()});try{mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}catch(e){}setInterval(function(){if(!document.hidden)sync()},3500);['online','pageshow','focus','df-ui-ready','df-team-changed','df-team-joined','df-team-tab-permissions','df-team-permissions-published'].forEach(function(ev){window.addEventListener(ev,function(){setTimeout(sync,60)})});document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(sync,60)})}
window.DFTeamPermOwnerReleaseV197API={apply:apply,sync:sync,isRealOwner:function(){return realOwner(team())}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();