(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_NATIVE_V5)return;window.DF_PRODUCAO_PDF_NATIVE_V5=true;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function brDate(v){if(!v)return'—';var p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(v)}
function shift(v){v=String(v==null?'':v);if(v==='00:00–07:00')return'1';if(v==='07:00–15:30')return'2';if(v==='15:30–00:00')return'3';return v}
function rows(){var out='';for(var i=1;i<=28;i++){var r=i+28;out+='<tr><td class="n">'+String(i).padStart(2,'0')+'</td><td></td><td></td><td></td><td class="n">'+String(r).padStart(2,'0')+'</td><td></td><td></td><td></td></tr>'}return out}
function safeJson(v){return JSON.stringify(String(v==null?'':v)).replace(/</g,'\\u003c')}

function pageHtml(o){
  var id=String(o&&o.id||'');
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>OP '+esc(id)+'</title><style>'+
  '@page{size:A4 landscape;margin:4mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}body{padding:6px}.back{position:fixed;z-index:99999;left:12px;top:max(12px,env(safe-area-inset-top));border:1px solid #64748b;background:#111827;color:#fff;border-radius:999px;padding:10px 15px;font:900 12px system-ui;box-shadow:0 2px 8px rgba(0,0,0,.18)}.sheet{width:100%;max-width:1123px;margin:0 auto;background:#fff;font-size:8px}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #333;padding:1.6px 3px;vertical-align:middle}.head td{height:20px}.company{font-size:15px;font-weight:900}.dark{background:#1f2937;color:#fff;text-align:center;font-weight:900}.yellow{background:#ffef19;font-weight:900}.label{display:block;font-size:7px;font-weight:900;margin-bottom:1px}.big{font-size:11px;font-weight:900}.qrw{display:flex;align-items:center;justify-content:center;gap:8px}.qr{width:64px;height:64px;background:#fff;display:flex;align-items:center;justify-content:center}.qr canvas,.qr img{width:64px!important;height:64px!important}.qrFallback{font-size:6px;line-height:1.15;text-align:center;word-break:break-all}.qid{font-size:7px;max-width:155px;word-break:break-all}.note{font-size:7px}.note b{display:block;font-size:8px;margin-top:1px}.bar{margin-top:2px;border:1px solid #555;border-bottom:0;background:#d9d9d9;text-align:center;font-weight:900;font-size:8px;padding:2px}.prod th{background:#efefef;font-size:7px;height:14px}.prod td{height:19.4px;padding:1px 3px;text-align:center}.prod .n{font-weight:900}.codes-title{border:1px solid #555;border-bottom:0;background:#d9d9d9;text-align:center;font-weight:900;font-size:7px;padding:2px;margin-top:2px}.codes td{height:12px;font-size:7px;padding:2px 8px}.codes b{display:inline-block;margin-right:6px}.foot{margin-top:2px}.foot td{background:#efefef;font-size:7px;font-weight:900;height:12px}.foot td:last-child{text-align:right}@media print{body{padding:0}.back{display:none!important}.sheet{max-width:none!important;width:100%!important}}'+
  '</style></head><body><button class="back" type="button" onclick="try{if(window.opener&&!window.opener.closed){window.opener.focus()}}catch(e){};try{window.close()}catch(e){}">‹ VOLTAR PARA PRODUÇÃO</button><div class="sheet">'+
  '<table class="head"><tr><td colspan="3" class="company">DF EXTRUSOR PRO</td><td colspan="3" class="dark">ORDEM DE PRODUÇÃO — '+esc(String(o&&o.sector||'').toUpperCase())+'</td><td colspan="2"><span class="label">Nº / ID DA OP</span><b>'+esc(id)+'</b></td></tr>'+
  '<tr><td colspan="2" class="yellow"><span class="label">MÁQUINA</span><span class="big">'+esc(o&&o.machine)+'</span></td><td colspan="2" class="yellow"><span class="label">PRODUTO</span><span class="big">'+esc(o&&o.product)+'</span></td><td colspan="2"><span class="label">MEDIDA</span><b>'+esc(o&&o.measure)+'</b></td><td colspan="2"><span class="label">SETOR</span><b>'+esc(o&&o.sector)+'</b></td></tr>'+
  '<tr><td colspan="2"><span class="label">OPERADOR</span><b>'+esc(o&&o.operator)+'</b></td><td colspan="2"><span class="label">TURNO</span><b>'+esc(shift(o&&o.shift))+'</b></td><td><span class="label">DATA INICIAL</span><b>'+brDate(o&&o.start)+'</b></td><td><span class="label">DATA FINAL</span><b>'+brDate(o&&o.end)+'</b></td><td colspan="2" rowspan="2"><div class="qrw"><div id="dfPrintQr" class="qr"><span class="qrFallback">'+esc(id)+'</span></div><div><b>QR DA OP</b><div class="qid">'+esc(id)+'</div></div></div></td></tr>'+
  '<tr><td colspan="3" class="note"><span class="label">SEM TROCA DE PRODUTO / MEDIDA</span><b>MANTER ESTA OP DURANTE A SEMANA</b></td><td colspan="3" class="note"><span class="label">NA TROCA DE PRODUTO / MEDIDA</span><b>ENCERRAR E GERAR NOVA OP</b></td></tr></table>'+
  '<div class="bar">APONTAMENTO DE PRODUÇÃO</div><table class="prod"><colgroup><col style="width:7%"><col style="width:17%"><col style="width:13%"><col style="width:13%"><col style="width:7%"><col style="width:17%"><col style="width:13%"><col style="width:13%"></colgroup><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>'+rows()+'</tbody></table>'+
  '<div class="codes-title">CÓDIGOS DE PARADA</div><table class="codes"><tr><td><b>01</b> Troca de pedido</td><td><b>02</b> Manutenção mecânica</td><td><b>03</b> Manutenção elétrica</td><td><b>04</b> Queda de energia</td></tr></table><table class="foot"><tr><td>DF EXTRUSOR PRO</td><td>OP DE PRODUÇÃO • PADRÃO DF</td></tr></table></div>'+
  '<script>(function(){var id='+safeJson(id)+',printed=false,tries=0;function doPrint(){if(printed)return;printed=true;setTimeout(function(){try{window.focus();window.print()}catch(e){}},180)}function makeQr(){try{var e=document.getElementById("dfPrintQr");if(!e||!window.QRCode)return false;e.innerHTML="";new QRCode(e,{text:id,width:128,height:128,correctLevel:QRCode.CorrectLevel.H});setTimeout(doPrint,140);return true}catch(e){return false}}function load(src,next){var s=document.createElement("script");s.src=src;s.async=true;s.onload=function(){if(!makeQr())next()};s.onerror=next;document.head.appendChild(s)}function next(){if(++tries===1)load("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",next);else doPrint()}if(!makeQr())load("https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",next);setTimeout(doPrint,2200)})();<\/script></body></html>';
}

function directPrint(o){
  var w=window.open('','_blank');
  if(!w){alert('Libere pop-ups para abrir a impressão da OP.');return}
  try{w.document.open();w.document.write(pageHtml(o||{}));w.document.close();w.focus()}catch(e){try{w.close()}catch(x){};alert('Não foi possível abrir a impressão da OP.')}
}

function install(attempt){
  attempt=attempt||0;
  var api=window.DF_PRODUCAO_OP_TEST;
  if(!api||typeof api.print!=='function'){
    if(attempt<120)setTimeout(function(){install(attempt+1)},80);
    return false;
  }
  if(api.print&&api.print.__dfDirectPrintV5)return true;
  directPrint.__dfDirectPrintV5=true;
  api.print=directPrint;
  return true;
}

install(0);
var timer=setInterval(function(){install(0)},400);
setTimeout(function(){clearInterval(timer)},30000);
window.addEventListener('pageshow',function(){install(0)},true);
window.addEventListener('focus',function(){install(0)},true);
})();
