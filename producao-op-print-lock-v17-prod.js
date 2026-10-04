(function(){
'use strict';
if(window.DFProducaoPrintLockV18Prod)return;window.DFProducaoPrintLockV18Prod=true;
const originalOpen=window.open.bind(window);
function rows(a,b){let s='';for(let i=a;i<b;i++)s+='<tr><td class="n">'+String(i+1).padStart(2,'0')+'</td><td></td><td></td><td></td></tr>';return s}
function transform(markup){
 let html=String(markup||'');
 if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;
 const start=html.indexOf('<div class="cols">');
 let marker=html.indexOf('<script>(function(){var id=',Math.max(0,start));
 if(marker<0)marker=html.lastIndexOf('<script>');
 if(start>=0&&marker>start){
   const body='<div class="dfBodyTitle">APONTAMENTO DE PRODUÇÃO</div><div class="dfCompactCols">'+
   '<table class="dfCompact"><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>'+rows(0,28)+'</tbody></table>'+
   '<table class="dfCompact"><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>'+rows(28,56)+'</tbody></table></div>'+
   '<div class="dfCodesTitle">CÓDIGOS DE PARADA</div><div class="dfCodes"><span><b>01</b> Troca de pedido</span><span><b>02</b> Manutenção mecânica</span><span><b>03</b> Manutenção elétrica</span><span><b>04</b> Queda de energia</span></div>'+
   '<div class="dfFooter"><b>DF EXTRUSOR PRO</b><span>OP DE PRODUÇÃO • PADRÃO DF</span></div>';
   html=html.slice(0,start)+body+html.slice(marker);
 }
 const btn='<button type="button" class="dfPrintBackV17" onclick="history.length>1?history.back():location.replace(\'/op-producao.html?v=20261004-producao-v31-prod\')">‹ VOLTAR PARA PRODUÇÃO</button>';
 html=html.replace(/<body([^>]*)>/i,function(m){return m+btn+'<div class="dfA4Page">'});
 html=html.replace(/<\/body>/i,'</div></body>');
 const style='<style>@page{size:A4 landscape;margin:4mm}*{box-sizing:border-box!important}html{background:#f5f5f5!important}body{font-family:Arial,Helvetica,sans-serif!important;color:#111!important;margin:0!important;font-size:9px!important;background:#f5f5f5!important;padding:16px!important}.dfPrintBackV17{position:fixed!important;z-index:2147483647!important;top:max(10px,env(safe-area-inset-top))!important;left:max(10px,env(safe-area-inset-left))!important;border:2px solid #64748b!important;background:#111827!important;color:#f8fafc!important;border-radius:999px!important;min-height:42px!important;padding:0 17px!important;font:900 13px/1 system-ui!important}.dfA4Page{width:100%;max-width:1122px;min-height:793px;margin:0 auto;background:#fff;padding:0;overflow:hidden}table{border-collapse:collapse!important;width:100%}td,th{border-color:#555!important;border-width:.8px!important}.head td{background:#f2f2f2!important;padding:3px!important}.company{background:#dedede!important;color:#111!important;font-size:17px!important;font-weight:900!important}.dark{background:#c8c8c8!important;color:#111!important;font-size:9px!important;font-weight:900!important}.head td.yellow{background:#f2df55!important;color:#111!important}.blue,.green{background:#dedede!important;color:#202020!important}.label{color:#3f3f3f!important;font-size:7px!important;font-weight:900!important}.big{font-size:13px!important}#qr.qr{width:124px!important;height:124px!important;padding:10px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important}#qr.qr canvas,#qr.qr img{width:104px!important;height:104px!important}.dfBodyTitle{margin-top:6px;background:#c8c8c8;border:1px solid #555;padding:4px 6px;text-align:center;font-weight:900}.dfCompactCols{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:6px}.dfCompact{table-layout:fixed;border:1px solid #555}.dfCompact th{background:#dedede!important;font-size:7px;height:18px}.dfCompact td{height:12px;border:1px solid #737373}.dfCompact td.n{text-align:center;font-weight:900}.dfCodesTitle{margin-top:6px;background:#dedede;border:1px solid #555;padding:3px;text-align:center}.dfCodes{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #555}.dfCodes span{padding:4px 6px;font-size:7px}.dfFooter{margin-top:5px;display:flex;justify-content:space-between;border:1px solid #555;background:#dedede;padding:4px 6px}.test{display:none!important}@media print{html,body{background:#fff!important;padding:0!important}.dfPrintBackV17{display:none!important}.dfA4Page{max-width:none!important;min-height:0!important}}</style>';
 html=html.replace(/<\/head>/i,style+'</head>');
 return html;
}
window.open=function(url,target,features){
 const child=originalOpen(url||'about:blank','_self',features);
 if(!child||!child.document)return child;
 try{
   const write=child.document.write.bind(child.document);
   child.document.write=function(markup){const out=transform(markup);const r=write(out);try{child.document.close()}catch(e){}return r};
 }catch(e){}
 return child;
};
})();