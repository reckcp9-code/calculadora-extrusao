(function(){
'use strict';
if(window.DFOpReportPrintFixV206)return;window.DFOpReportPrintFixV206=true;
function install(){
  var b=document.getElementById('dfPrintReport');
  if(!b||b.dataset.dfBack206)return;
  b.dataset.dfBack206='1';
  b.addEventListener('click',function(e){
    e.preventDefault();e.stopImmediatePropagation();
    try{
      var month=document.getElementById('dfOpMonth');
      var oldOpen=window.open;
      window.open=function(){
        var w=oldOpen.call(window,'','_blank');
        if(!w)return w;
        var oldWrite=w.document.write.bind(w.document);
        w.document.write=function(html){
          var back='<button id="dfBackToApp" onclick="history.back();setTimeout(function(){window.close()},80)" style="position:sticky;top:8px;z-index:999999;border:0;background:#111827;color:#fff;border-radius:10px;padding:10px 14px;margin:0 0 12px;font:700 14px Arial;box-shadow:0 2px 8px #0003">← VOLTAR PARA FORMULAÇÃO / RELATÓRIO</button>';
          html=String(html).replace('<body>','<body>'+back).replace('</style>','#dfBackToApp{display:block}@media print{#dfBackToApp{display:none!important}}</style>');
          return oldWrite(html);
        };
        setTimeout(function(){window.open=oldOpen},1000);
        return w;
      };
      b.onclick&&b.onclick();
      setTimeout(function(){window.open=oldOpen},1200);
    }catch(err){location.reload()}
  },true);
}
function boot(){install();setTimeout(install,500);setTimeout(install,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('df-ui-ready',boot);
})();