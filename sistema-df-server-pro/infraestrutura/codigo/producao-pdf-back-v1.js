(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_BACK_V1)return;window.DF_PRODUCAO_PDF_BACK_V1=true;
function install(attempt){
  attempt=attempt||0;
  var api=window.DF_PRODUCAO_OP_TEST;
  if(!api||typeof api.print!=='function'){
    if(attempt<80)setTimeout(function(){install(attempt+1)},80);
    return;
  }
  if(api.print.__dfPdfBackPatched)return;
  var original=api.print;
  function wrapped(o){
    var realOpen=window.open;
    window.open=function(){
      var popup=realOpen.apply(window,arguments);
      if(!popup)return popup;
      try{
        var doc=popup.document;
        var realWrite=doc.write.bind(doc);
        doc.write=function(html){
          var style='<style id="dfPdfBackCss">.dfPdfBack{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));width:44px;height:44px;border:1px solid #334155;border-radius:14px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font:900 32px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 4px 16px rgba(0,0,0,.28);cursor:pointer;-webkit-tap-highlight-color:transparent}.dfPdfBack:active{transform:scale(.96)}@media print{.dfPdfBack{display:none!important}}</style>';
          var button='<button type="button" class="dfPdfBack" aria-label="Voltar" title="Voltar" onclick="try{window.close()}catch(e){history.back()}">&#8249;</button>';
          html=String(html||'');
          if(html.indexOf('dfPdfBackCss')<0){
            html=html.replace('</head>',style+'</head>');
            html=html.replace('<body>','<body>'+button);
          }
          return realWrite(html);
        };
      }catch(e){}
      return popup;
    };
    try{return original(o)}finally{window.open=realOpen}
  }
  wrapped.__dfPdfBackPatched=true;
  api.print=wrapped;
}
install(0);
window.addEventListener('pageshow',function(){install(0)},true);
})();
