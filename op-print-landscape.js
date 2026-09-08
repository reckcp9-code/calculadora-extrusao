(function(){
  'use strict';
  if(window.__dfOpLandscapeInstalled)return;
  window.__dfOpLandscapeInstalled=true;

  const originalOpen=window.open;
  window.open=function(){
    const w=originalOpen.apply(window,arguments);
    if(!w||!w.document||!w.document.write)return w;
    try{
      const originalWrite=w.document.write.bind(w.document);
      w.document.write=function(html){
        try{
          if(typeof html==='string' && /<title>OP\s/i.test(html)){
            html=html.replace('@page{size:A4 landscape;margin:6mm}','@page{size:297mm 210mm;margin:0}');
            html=html.replace('body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11.5px;background:#fff}', 'html,body{width:297mm;height:210mm;margin:0;padding:0;background:#fff}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11.5px;background:#fff}');
            html=html.replace('.page{border:2px solid #111;padding:6px}', '.page{width:297mm;height:210mm;border:2px solid #111;padding:5mm;overflow:hidden}');
            html=html.replace('@media print{body{margin:0}.printHint{display:none}.page{border:0;padding:0}}', '@media print{html,body{width:297mm!important;height:210mm!important;margin:0!important;padding:0!important}.printHint{display:none!important}.page{width:297mm!important;height:210mm!important;border:0!important;padding:5mm!important;overflow:hidden!important;page-break-after:avoid!important}}');
          }
        }catch(e){}
        return originalWrite(html);
      };
    }catch(e){}
    return w;
  };
})();
