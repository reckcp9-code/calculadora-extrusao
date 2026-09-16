(function(){
'use strict';
if(window.DFOpReportBackV207)return;window.DFOpReportBackV207=true;
var nativeOpen=window.open;
window.open=function(){
  var w=nativeOpen.apply(window,arguments);
  if(!w)return w;
  try{
    var nativeWrite=w.document.write.bind(w.document);
    w.document.write=function(html){
      var s=String(html||'');
      if(s.indexOf('Relatório automático de OPs')>=0&&s.indexOf('dfVoltarFormula207')<0){
        var css='<style>#dfVoltarFormula207{display:inline-flex;align-items:center;gap:7px;margin:0 0 14px;padding:10px 14px;border:1px solid #bbb;border-radius:9px;background:#fff;color:#111;font:700 14px Arial,sans-serif;cursor:pointer}@media print{#dfVoltarFormula207{display:none!important}}</style>';
        var btn='<button id="dfVoltarFormula207" type="button" onclick="if(window.opener&&!window.opener.closed){window.opener.focus();window.close()}else{history.back()}">← VOLTAR PARA FORMULAÇÃO</button>';
        s=s.replace('</head>',css+'</head>');
        s=s.replace('<body>','<body>'+btn);
      }
      return nativeWrite(s);
    };
  }catch(e){}
  return w;
};
})();