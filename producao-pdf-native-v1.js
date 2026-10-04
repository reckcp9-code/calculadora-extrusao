(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_NATIVE_V1)return;window.DF_PRODUCAO_PDF_NATIVE_V1=true;

var CDN={
  html2canvas:'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  jspdf:'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  qrcode:'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
};

function load(src,test){
  return new Promise(function(resolve,reject){
    if(test())return resolve();
    var old=document.querySelector('script[data-df-pdf-lib="'+src+'"]');
    if(old){
      var n=0,t=setInterval(function(){if(test()){clearInterval(t);resolve()}else if(++n>80){clearInterval(t);reject(new Error('Falha ao carregar biblioteca do PDF.'))}},100);
      return;
    }
    var s=document.createElement('script');
    s.src=src;s.async=true;s.dataset.dfPdfLib=src;
    s.onload=function(){test()?resolve():reject(new Error('Biblioteca do PDF indisponível.'))};
    s.onerror=function(){reject(new Error('Falha ao carregar biblioteca do PDF.'))};
    document.head.appendChild(s);
  });
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function brDate(v){if(!v)return'—';var p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(v)}
function shift(v){v=String(v==null?'':v);if(v==='00:00–07:00')return'1';if(v==='07:00–15:30')return'2';if(v==='15:30–00:00')return'3';return v}
function rows(){var out='';for(var i=1;i<=28;i++){var r=i+28;out+='<tr><td class="n">'+String(i).padStart(2,'0')+'</td><td></td><td></td><td></td><td class="n">'+String(r).padStart(2,'0')+'</td><td></td><td></td><td></td></tr>'}return out}
function sheetHtml(o){return '<div class="dfPdfPage"><table class="head"><tr><td colspan="3" class="company">DF EXTRUSOR PRO</td><td colspan="3" class="dark">ORDEM DE PRODUÇÃO — '+esc(String(o.sector||'').toUpperCase())+'</td><td colspan="2"><span class="label">Nº / ID DA OP</span><b>'+esc(o.id)+'</b></td></tr><tr><td colspan="2" class="yellow"><span class="label">MÁQUINA</span><span class="big">'+esc(o.machine)+'</span></td><td colspan="2" class="yellow"><span class="label">PRODUTO</span><span class="big">'+esc(o.product)+'</span></td><td colspan="2"><span class="label">MEDIDA</span><b>'+esc(o.measure)+'</b></td><td colspan="2"><span class="label">SETOR</span><b>'+esc(o.sector)+'</b></td></tr><tr><td colspan="2"><span class="label">OPERADOR</span><b>'+esc(o.operator)+'</b></td><td colspan="2"><span class="label">TURNO</span><b>'+esc(shift(o.shift))+'</b></td><td><span class="label">DATA INICIAL</span><b>'+brDate(o.start)+'</b></td><td><span class="label">DATA FINAL</span><b>'+brDate(o.end)+'</b></td><td colspan="2" rowspan="2"><div class="qrw"><div id="dfNativeQr" class="qr"></div><div><b>QR DA OP</b><div class="qid">'+esc(o.id)+'</div></div></div></td></tr><tr><td colspan="3" class="note"><span class="label">SEM TROCA DE PRODUTO / MEDIDA</span><b>MANTER ESTA OP DURANTE A SEMANA</b></td><td colspan="3" class="note"><span class="label">NA TROCA DE PRODUTO / MEDIDA</span><b>ENCERRAR E GERAR NOVA OP</b></td></tr></table><div class="bar">APONTAMENTO DE PRODUÇÃO</div><table class="prod"><colgroup><col style="width:7%"><col style="width:17%"><col style="width:13%"><col style="width:13%"><col style="width:7%"><col style="width:17%"><col style="width:13%"><col style="width:13%"></colgroup><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>'+rows()+'</tbody></table><div class="codes-title">CÓDIGOS DE PARADA</div><table class="codes"><tr><td><b>01</b> Troca de pedido</td><td><b>02</b> Manutenção mecânica</td><td><b>03</b> Manutenção elétrica</td><td><b>04</b> Queda de energia</td></tr></table><table class="foot"><tr><td>DF EXTRUSOR PRO</td><td>OP DE PRODUÇÃO • PADRÃO DF</td></tr></table></div>'}
function buildSheet(o){
  var host=document.createElement('div');host.id='dfNativePdfHost';
  host.style.cssText='position:fixed;left:-200vw;top:0;width:1123px;height:794px;background:#fff;color:#111;z-index:-1;overflow:hidden;font-family:Arial,Helvetica,sans-serif;';
  var style=document.createElement('style');style.textContent='#dfNativePdfHost *{box-sizing:border-box}#dfNativePdfHost .dfPdfPage{width:1123px;height:794px;padding:15px;background:#fff;color:#111;font-size:8px}#dfNativePdfHost table{width:100%;border-collapse:collapse;table-layout:fixed}#dfNativePdfHost td,#dfNativePdfHost th{border:1px solid #333;padding:1.6px 3px;vertical-align:middle}#dfNativePdfHost .head td{height:20px}#dfNativePdfHost .company{font-size:15px;font-weight:900}#dfNativePdfHost .dark{background:#1f2937;color:#fff;text-align:center;font-weight:900}#dfNativePdfHost .yellow{background:#ffef19;font-weight:900}#dfNativePdfHost .label{display:block;font-size:7px;font-weight:900;margin-bottom:1px}#dfNativePdfHost .big{font-size:11px;font-weight:900}#dfNativePdfHost .qrw{display:flex;align-items:center;justify-content:center;gap:8px}#dfNativePdfHost .qr{width:64px;height:64px;background:#fff}#dfNativePdfHost .qr canvas,#dfNativePdfHost .qr img{width:64px!important;height:64px!important}#dfNativePdfHost .qid{font-size:7px;max-width:155px;word-break:break-all}#dfNativePdfHost .bar{margin-top:5px;border:1px solid #555;border-bottom:0;background:#d9d9d9;text-align:center;font-weight:900;font-size:8px;padding:3px}#dfNativePdfHost .prod th{background:#efefef;font-size:7px;height:12px}#dfNativePdfHost .prod td{height:7.2px;text-align:center}#dfNativePdfHost .prod .n{font-weight:900}#dfNativePdfHost .codes-title{border:1px solid #555;border-bottom:0;background:#d9d9d9;text-align:center;font-weight:900;font-size:7px;padding:3px;margin-top:5px}#dfNativePdfHost .codes td{height:13px;font-size:7px;padding:3px 8px}#dfNativePdfHost .codes b{display:inline-block;margin-right:6px}#dfNativePdfHost .foot{margin-top:5px}#dfNativePdfHost .foot td{background:#efefef;font-size:7px;font-weight:900;height:14px}#dfNativePdfHost .foot td:last-child{text-align:right}#dfNativePdfHost .note{font-size:7px}#dfNativePdfHost .note b{display:block;font-size:8px;margin-top:1px}';
  host.appendChild(style);var body=document.createElement('div');body.innerHTML=sheetHtml(o);host.appendChild(body);document.body.appendChild(host);return host;
}
async function createNativePdf(o,popup){
  await Promise.all([
    load(CDN.html2canvas,function(){return !!window.html2canvas}),
    load(CDN.jspdf,function(){return !!(window.jspdf&&window.jspdf.jsPDF)}),
    load(CDN.qrcode,function(){return !!window.QRCode})
  ]);
  var host=buildSheet(o),qr=host.querySelector('#dfNativeQr');
  new QRCode(qr,{text:String(o.id||''),width:128,height:128,correctLevel:QRCode.CorrectLevel.H});
  await new Promise(function(r){setTimeout(r,120)});
  var canvas=await window.html2canvas(host,{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true,width:1123,height:794,windowWidth:1123,windowHeight:794});
  host.remove();
  var jsPDF=window.jspdf.jsPDF,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  var w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight();
  pdf.addImage(canvas.toDataURL('image/jpeg',0.96),'JPEG',0,0,w,h,undefined,'FAST');
  pdf.setProperties({title:'OP '+String(o.id||''),subject:'Ordem de Produção - DF EXTRUSOR PRO',creator:'DF EXTRUSOR PRO'});
  var blob=pdf.output('blob'),url=URL.createObjectURL(blob);
  try{popup.location.replace(url)}catch(e){popup.location.href=url}
  setTimeout(function(){try{URL.revokeObjectURL(url)}catch(e){}},600000);
}
function install(attempt){
  attempt=attempt||0;var api=window.DF_PRODUCAO_OP_TEST;
  if(!api||typeof api.print!=='function'){if(attempt<100)setTimeout(function(){install(attempt+1)},80);return}
  if(api.print.__dfNativePdf)return;
  var fallback=api.print;
  function nativePrint(o){
    var popup=window.open('','_blank');
    if(!popup)return alert('Libere pop-ups para abrir o PDF.');
    try{popup.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#fff;font-family:system-ui;color:#111;display:flex;min-height:100vh;align-items:center;justify-content:center"><b>Gerando PDF...</b></body>');popup.document.close()}catch(e){}
    createNativePdf(o,popup).catch(function(err){try{popup.close()}catch(e){};console.error('DF PDF nativo:',err);try{fallback(o)}catch(x){alert('Não foi possível gerar o PDF.') }});
  }
  nativePrint.__dfNativePdf=true;nativePrint.__dfFallback=fallback;api.print=nativePrint;
}
install(0);
var timer=setInterval(function(){install(0)},500);setTimeout(function(){clearInterval(timer)},30000);
window.addEventListener('pageshow',function(){install(0)},true);
})();
