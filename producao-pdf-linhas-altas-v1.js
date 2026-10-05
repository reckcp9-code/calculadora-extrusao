(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_LINHAS_ALTAS_V1)return;window.DF_PRODUCAO_PDF_LINHAS_ALTAS_V1=true;
function apply(host){
  if(!host||host.dataset.dfLinhasAltas==='1')return;
  host.dataset.dfLinhasAltas='1';
  var s=document.createElement('style');
  s.textContent='#dfNativePdfHost .prod td{height:18.5px!important;padding:1px 3px!important;text-align:center!important}#dfNativePdfHost .prod th{height:14px!important}';
  host.appendChild(s);
}
function scan(){apply(document.getElementById('dfNativePdfHost'))}
scan();
new MutationObserver(function(m){for(var i=0;i<m.length;i++){for(var j=0;j<m[i].addedNodes.length;j++){var n=m[i].addedNodes[j];if(n&&n.nodeType===1){if(n.id==='dfNativePdfHost')apply(n);else if(n.querySelector)apply(n.querySelector('#dfNativePdfHost'))}}}}).observe(document.documentElement,{childList:true,subtree:true});
})();
