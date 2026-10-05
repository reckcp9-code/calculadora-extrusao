(function(){
'use strict';
if(window.DFOpTeamPanelCollapseV1)return;window.DFOpTeamPanelCollapseV1=true;
const TEAM_KEY='df_op_team_v1';
const $=id=>document.getElementById(id);
let collapsed=true,observer=null,timer=0;
function team(){try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function addStyle(){
  if($('dfTeamCollapseStyle'))return;
  const s=document.createElement('style');s.id='dfTeamCollapseStyle';s.textContent=`
#dfOpTeamCloud{transition:padding .16s ease}#dfOpTeamCloud.dfTeamCollapsed{padding:8px!important}#dfOpTeamCloud.dfTeamCollapsed > :not(#dfTeamCollapseToggle){display:none!important}#dfTeamCollapseToggle{width:100%!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:1px solid #2563eb!important;background:#10234a!important;color:#bfdbfe!important;border-radius:11px!important;padding:11px 12px!important;margin:0!important;font-size:12px!important;font-weight:950!important;cursor:pointer!important;text-align:left!important}#dfTeamCollapseToggle .dfTcMain{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#dfTeamCollapseToggle .dfTcAction{display:block;flex:0 0 auto;color:#fde68a;font-size:10px}#dfOpTeamCloud:not(.dfTeamCollapsed) #dfTeamCollapseToggle{margin-bottom:9px!important}@media(max-width:430px){#dfTeamCollapseToggle{padding:12px 10px!important;font-size:11px!important}#dfTeamCollapseToggle .dfTcAction{font-size:9px}}`;
  document.head.appendChild(s);
}
function label(){const t=team();if(!t)return '☁️ CONECTAR EQUIPE';const role=String(t.role||'operator').toLowerCase()==='owner'?'DONO':'OPERADOR';return '☁️ '+String(t.name||'DF EXTRUSOR')+' • '+role}
function apply(){const box=$('dfOpTeamCloud');if(!box)return false;addStyle();let b=$('dfTeamCollapseToggle');if(!b||b.parentNode!==box){if(b)b.remove();b=document.createElement('button');b.id='dfTeamCollapseToggle';b.type='button';box.insertBefore(b,box.firstChild)}box.classList.toggle('dfTeamCollapsed',collapsed);b.setAttribute('aria-expanded',collapsed?'false':'true');b.innerHTML='<span class="dfTcMain">'+esc(label())+'</span><span class="dfTcAction">'+(collapsed?'ABRIR ▼':'MINIMIZAR ▲')+'</span>';b.onclick=function(){collapsed=!collapsed;apply()};return true}
function collapseNow(){collapsed=true;apply()}
function schedule(ms){clearTimeout(timer);timer=setTimeout(apply,ms==null?60:ms)}
function watch(){const box=$('dfOpTeamCloud');if(!box)return false;if(observer&&observer.__box===box)return true;if(observer)observer.disconnect();observer=new MutationObserver(function(){if(!$('dfTeamCollapseToggle')||$('dfTeamCollapseToggle').parentNode!==box)schedule(50)});observer.__box=box;observer.observe(box,{childList:true});return true}
function retry(attempt){attempt=Number(attempt)||0;if(apply()){watch();return}if(attempt>=12)return;setTimeout(()=>retry(attempt+1),350)}
function boot(){addStyle();collapsed=true;retry(0);setTimeout(function(){apply();watch()},1000)}
document.addEventListener('click',function(e){const main=e.target&&e.target.closest?e.target.closest('#dfFormTabOps,#btFo'):null;if(main)setTimeout(collapseNow,50)},true);
window.addEventListener('df-ui-ready',function(){setTimeout(function(){apply();watch()},150)});
window.addEventListener('df-team-changed',function(){schedule(100)});
window.addEventListener('df-team-joined',function(){collapsed=true;schedule(100)});
window.addEventListener('pageshow',function(){collapsed=true;schedule(100)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
