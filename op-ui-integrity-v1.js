(function(){
'use strict';
if(window.DFOpUIIntegrityV1)return;window.DFOpUIIntegrityV1=true;
const MODULES=[
 {file:'formula-op-relatorio.js',alive:()=>!!window.DFFormulaOpsUI?.bootstrapped},
 {file:'op-cloud-team-v3.js',alive:()=>!!window.DFOpCloud?.mountTeam},
 {file:'op-team-panel-collapse-v1.js',alive:()=>!!window.DFOpTeamPanelCollapseV1},
 {file:'op-ready-fullscreen-v1.js',alive:()=>!!window.DFReadyFullScreenV1},
 {file:'op-monthly-photo-editor-v1.js',alive:()=>!!window.DFMonthlyPhotoEditorOpen}
];
const attempts=new Map(),inflight=new Set();let pulse=0,lastIssue='';
function visible(){return !document.hidden&&!!document.getElementById('pgFo')}
function issue(message){if(lastIssue===message)return;lastIssue=message;console.warn('[DF OP UI]',message)}
function reloadMissing(m){
 if(inflight.has(m.file))return;
 const count=attempts.get(m.file)||0;
 if(count>=3)return issue('Falha persistente no componente '+m.file+'. Verifique a rede.');
 inflight.add(m.file);attempts.set(m.file,count+1);
 const prev=Array.from(document.scripts).find(x=>{try{return new URL(x.src).pathname.endsWith('/'+m.file)}catch(e){return false}});
 const src=prev?.src||new URL('./'+m.file,location.href).href;
 const url=new URL(src,location.href);url.searchParams.set('uirepair',String(count+1));
 const s=document.createElement('script');s.src=url.href;s.async=false;
 s.onload=()=>{inflight.delete(m.file);if(!m.alive())issue(m.file+' foi recebido, mas não inicializou.');setTimeout(check,180)};
 s.onerror=()=>{inflight.delete(m.file);issue('Sem acesso ao módulo '+m.file+'; nova tentativa na próxima retomada.')};
 document.head.appendChild(s);
}
function check(){
 if(!visible())return;
 try{window.DFFormulaOpsUI?.ensure?.()}catch(e){issue('Interface de Formulação indisponível: '+String(e.message||e))}
 const root=document.getElementById('dfFormulaOps');
 if(!root||!root.classList.contains('on'))return;
 // A barra de equipe e o modo PRONTAS não podem depender de atualização geral do PWA.
 try{if(!document.getElementById('dfOpTeamCloud'))window.DFOpCloud?.mountTeam?.()}catch(e){}
 const teamBox=document.getElementById('dfOpTeamCloud');
 if(teamBox&&!document.getElementById('dfTeamCollapseToggle')&&window.DFOpTeamPanelCollapseV1){
  try{window.dispatchEvent(new Event('df-op-team-panel-rendered'))}catch(e){}
 }
 for(const m of MODULES)if(!m.alive())reloadMissing(m);
 const ready=document.querySelector('#dfFormulaOps .dfOpsTabs [data-pane="ok"]');
 if(ready?.classList.contains('on')&&!document.getElementById('dfReadyFullClose'))issue('Cabeçalho de Prontas em recuperação.');
}
function schedule(ms){clearTimeout(pulse);pulse=setTimeout(check,ms??90)}
function boot(){
 schedule(300);
 for(const ev of ['df-ui-ready','df-formula-section-entered','df-op-d1-applied','df-op-team-panel-rendered','online','pageshow'])
  window.addEventListener(ev,()=>schedule(200));
 document.addEventListener('click',e=>{if(e.target?.closest?.('#dfFormTabOps,#btFo,[data-pane="ok"],#dfMonthlyPhotoButton'))schedule(120)},true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){attempts.clear();schedule(250)}});
 setInterval(check,2400);
}
window.DFOpUIIntegrity={check:()=>{check();return {loaded:MODULES.filter(m=>m.alive()).map(m=>m.file),missing:MODULES.filter(m=>!m.alive()).map(m=>m.file),lastIssue}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
