(function(){
'use strict';
/* Hotfix 207: o interceptor anterior do clique do relatório podia abrir uma aba branca no iOS.
   Este módulo não intercepta mais o botão. O relatório volta a ser aberto pela função original
   de formula-op-relatorio.js. */
if(window.DFOpReportPrintFixV207)return;
window.DFOpReportPrintFixV207=true;
function cleanup(){
  var b=document.getElementById('dfPrintReport');
  if(b){
    try{delete b.dataset.dfBack206}catch(e){}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanup,{once:true});else cleanup();
window.addEventListener('df-ui-ready',cleanup);
})();