(function(){
'use strict';
if(window.DFOpTeamPanelCollapseV1)return;window.DFOpTeamPanelCollapseV1=true;
const KEY='df_op_team_v1',STATE_KEY='df_op_team_panel_collapsed_v2';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let collapsed=true,observer=null,boxRef=null,timer=0;
try{const saved=sessionStorage.getItem(STATE_KEY);if(saved==='0'||saved==='1')collapsed=saved==='1'}catch(e){}
function team(){try{return window.DFOpCloud?.team?.()||JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
function label(){const t=team();if(!t)return '☁️ CONECTAR EQUIPE';return '☁️ '+String(t.name||'DF EXTRUSOR')+' • '+(String(t.role||'operator').toLowerCase()==='owner'?'DONO':'OPERADOR')}
function addStyle(){
 if($('dfTeamCollapseStyle'))return;
 const s=document.createElement('style');s.id='dfTeamCollapseStyle';
 // Sem botão, o conteúdo permanece visível e utilizável.
 s.textContent=[
  '#dfOpTeamCloud{transition:padding .16s ease}',
  '#dfOpTeamCloud.dfTeamCollapsed{padding:8px!important}',
  '#dfOpTeamCloud.dfTeamCollapsed:has(> #dfTeamCollapseToggle) > :not(#dfTeamCollapseToggle){display:none!important}',
  '#dfTeamCollapseToggle{width:100%!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:1px solid #2563eb!important;background:#10234a!important;color:#bfdbfe!important;border-radius:11px!important;padding:11px 12px!important;margin:0!important;font-size:12px!important;font-weight:950!important;cursor:pointer!important;text-align:left!important}',
  '#dfTeamCollapseToggle .dfTcMain{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '#dfTeamCollapseToggle .dfTcAction{display:block;flex:0 0 auto;color:#fde68a;font-size:10px}',
  '#dfOpTeamCloud:not(.dfTeamCollapsed) #dfTeamCollapseToggle{margin-bottom:9px!important}',
  '@media(max-width:430px){#dfTeamCollapseToggle{padding:12px 10px!important;font-size:11px!important}#dfTeamCollapseToggle .dfTcAction{font-size:9px}}'
 ].join('\n');
 document.head.appendChild(s);
}
function apply(){
 const box=$('dfOpTeamCloud');if(!box)return false;
 addStyle();
 let b=$('dfTeamCollapseToggle');
 if(!b||b.parentElement!==box){
  if(b)b.remove();
  b=document.createElement('button');b.id='dfTeamCollapseToggle';b.type='button';box.insertBefore(b,box.firstChild);
 }
 box.classList.toggle('dfTeamCollapsed',collapsed);
 b.setAttribute('aria-expanded',String(!collapsed));
 const html='<span class="dfTcMain">'+esc(label())+'</span><span class="dfTcAction">'+(collapsed?'ABRIR ▼':'MINIMIZAR ▲')+'</span>';
 if(b.innerHTML!==html)b.innerHTML=html;
 b.onclick=()=>{collapsed=!collapsed;try{sessionStorage.setItem(STATE_KEY,collapsed?'1':'0')}catch(e){}apply()};
 watch(box);
 return true;
}
function watch(box){
 if(observer&&boxRef===box)return;
 if(observer)observer.disconnect();
 boxRef=box;
 observer=new MutationObserver(()=>{
  if(!$('dfTeamCollapseToggle')||$('dfTeamCollapseToggle').parentElement!==box)schedule(30);
 });
 observer.observe(box,{childList:true});
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(()=>{
 if(!apply()&&window.DFOpCloud?.mountTeam){try{window.DFOpCloud.mountTeam();apply()}catch(e){}}
},ms??60)}
function boot(){
 addStyle();schedule(0);
 for(const event of ['df-ui-ready','df-team-changed','df-team-joined','df-op-team-panel-rendered','df-formula-section-entered','pageshow','online'])
  window.addEventListener(event,()=>schedule(70));
 document.addEventListener('click',e=>{
  if(e.target?.closest?.('#dfFormTabOps,#btFo'))schedule(60)
 },true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(80)});
 // Recuperação permanente, sem limite de tentativas.
 setInterval(()=>{if(document.hidden)return;const root=$('dfFormulaOps');if(root?.classList.contains('on'))schedule(0)},1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();