(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_BACK_V2)return;window.DF_PRODUCAO_PDF_BACK_V2=true;

function wrapPrint(fn){
  if(typeof fn!=='function'||fn.__dfPdfBackPatched)return fn;
  function wrapped(o){
    var realOpen=window.open;
    window.open=function(){
      var popup=realOpen.apply(window,arguments);
      if(!popup)return popup;
      try{
        var doc=popup.document;
        var realWrite=doc.write.bind(doc);
        doc.write=function(html){
          html=String(html||'');
          if(html.indexOf('dfPdfBackCss')<0){
            var style='<style id="dfPdfBackCss">.dfPdfBack{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));width:46px;height:46px;border:1px solid #334155;border-radius:14px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font:900 31px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 5px 18px rgba(0,0,0,.30);cursor:pointer;-webkit-tap-highlight-color:transparent}.dfPdfBack:active{transform:scale(.96)}@media print{.dfPdfBack{display:none!important}}</style>';
            var button='<button type="button" class="dfPdfBack" aria-label="Voltar" title="Voltar" onclick="(function(){try{window.close();setTimeout(function(){if(!window.closed)history.back()},80)}catch(e){history.back()}})()">&#8249;</button>';
            html=html.replace('</head>',style+'</head>');
            html=html.replace('<body>','<body>'+button);
          }
          return realWrite(html);
        };
      }catch(e){}
      return popup;
    };
    try{return fn.call(this,o)}finally{window.open=realOpen}
  }
  wrapped.__dfPdfBackPatched=true;
  wrapped.__dfPdfBackOriginal=fn;
  return wrapped;
}

function patch(){
  var api=window.DF_PRODUCAO_OP_TEST;
  if(!api||typeof api.print!=='function')return false;
  if(!api.print.__dfPdfBackPatched)api.print=wrapPrint(api.print);
  return true;
}

function watch(duration){
  var until=Date.now()+(duration||5000);
  (function tick(){patch();if(Date.now()<until)setTimeout(tick,50)})();
}

watch(7000);
window.addEventListener('pageshow',function(){watch(3500)},true);
window.addEventListener('focus',function(){watch(1200)},true);
document.addEventListener('visibilitychange',function(){if(!document.hidden)watch(1200)},true);
})();
