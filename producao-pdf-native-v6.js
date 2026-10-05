(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_NATIVE_V6)return;window.DF_PRODUCAO_PDF_NATIVE_V6=true;

var W=1123,H=794,M=10;
function s(v){return String(v==null?'':v)}
function brDate(v){if(!v)return'—';var p=s(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s(v)}
function shift(v){v=s(v);if(v==='00:00–07:00')return'1';if(v==='07:00–15:30')return'2';if(v==='15:30–00:00')return'3';return v}
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function bytes(str){return new TextEncoder().encode(str)}
function concat(parts){var n=0,i;for(i=0;i<parts.length;i++)n+=parts[i].length;var out=new Uint8Array(n),p=0;for(i=0;i<parts.length;i++){out.set(parts[i],p);p+=parts[i].length}return out}
function dataUrlBytes(url){var b=atob(String(url).split(',')[1]||''),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function makePdf(jpeg){
  var enc=bytes,parts=[],offs=[0],pos=0;
  function add(x){var a=typeof x==='string'?enc(x):x;parts.push(a);pos+=a.length}
  function obj(n,body){offs[n]=pos;add(n+' 0 obj\n');if(Array.isArray(body)){for(var i=0;i<body.length;i++)add(body[i])}else add(body);add('\nendobj\n')}
  add('%PDF-1.4\n%DFEX\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  obj(4,['<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n',jpeg,'\nendstream']);
  var stream='q\n841.89 0 0 595.28 0 0 cm\n/Im0 Do\nQ\n',sb=enc(stream);
  obj(5,['<< /Length '+sb.length+' >>\nstream\n',sb,'endstream']);
  var xref=pos,tail='xref\n0 6\n0000000000 65535 f \n';
  for(var n=1;n<=5;n++)tail+=String(offs[n]).padStart(10,'0')+' 00000 n \n';
  tail+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  add(tail);
  return new Blob(parts,{type:'application/pdf'});
}
function loadScript(src,test,ms){return new Promise(function(resolve,reject){if(test())return resolve();var sc=document.createElement('script'),done=false,t=setTimeout(function(){if(done)return;done=true;try{sc.remove()}catch(e){}reject(new Error('timeout'))},ms||2600);sc.async=true;sc.src=src;sc.onload=function(){if(done)return;done=true;clearTimeout(t);test()?resolve():reject(new Error('indisponivel'))};sc.onerror=function(){if(done)return;done=true;clearTimeout(t);reject(new Error('falha'))};document.head.appendChild(sc)})}
async function ensureQr(){if(window.QRCode)return true;var urls=['https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js','https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'];for(var i=0;i<urls.length;i++){try{await loadScript(urls[i],function(){return!!window.QRCode},2600);if(window.QRCode)return true}catch(e){}}return false}
async function qrSource(id){if(!(await ensureQr()))return null;var d=document.createElement('div');d.style.cssText='position:fixed;left:-9999px;top:0;width:256px;height:256px;background:#fff';document.body.appendChild(d);try{new QRCode(d,{text:s(id),width:256,height:256,correctLevel:QRCode.CorrectLevel.H});await wait(100);var c=d.querySelector('canvas');if(c)return c;var im=d.querySelector('img');if(im){if(!im.complete)await new Promise(function(r){im.onload=r;im.onerror=r;setTimeout(r,700)});return im}return null}finally{setTimeout(function(){try{d.remove()}catch(e){}},0)}}
function font(ctx,size,bold){ctx.font=(bold?'700 ':'400 ')+size+'px Arial,Helvetica,sans-serif'}
function fit(ctx,text,maxW,start,min,bold){var z=start;for(;z>min;z-=.5){font(ctx,z,bold);if(ctx.measureText(s(text)).width<=maxW)return z}return min}
function line(ctx,x1,y1,x2,y2,w){ctx.beginPath();ctx.lineWidth=w||1;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function box(ctx,x,y,w,h,fill){if(fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}ctx.strokeStyle='#333';ctx.lineWidth=1.4;ctx.strokeRect(x+.5,y+.5,w-1,h-1)}
function text(ctx,value,x,y,w,h,opt){opt=opt||{};var pad=opt.pad==null?5:opt.pad,sz=fit(ctx,s(value),w-pad*2,opt.size||13,opt.min||7,!!opt.bold);font(ctx,sz,!!opt.bold);ctx.fillStyle=opt.color||'#111';ctx.textBaseline='middle';ctx.textAlign=opt.align||'left';var tx=opt.align==='center'?x+w/2:opt.align==='right'?x+w-pad:x+pad;ctx.fillText(s(value),tx,y+h/2,Math.max(1,w-pad*2))}
function wrap(ctx,value,x,y,w,h,opt){opt=opt||{};var pad=opt.pad==null?5:opt.pad,size=opt.size||11,bold=!!opt.bold;var words=s(value).split(/\s+/),lines=[],cur='';font(ctx,size,bold);for(var i=0;i<words.length;i++){var t=cur?cur+' '+words[i]:words[i];if(ctx.measureText(t).width>w-pad*2&&cur){lines.push(cur);cur=words[i]}else cur=t}if(cur)lines.push(cur);while(lines.length>3){size-=.5;if(size<7)break;lines=[];cur='';font(ctx,size,bold);for(i=0;i<words.length;i++){t=cur?cur+' '+words[i]:words[i];if(ctx.measureText(t).width>w-pad*2&&cur){lines.push(cur);cur=words[i]}else cur=t}if(cur)lines.push(cur)}ctx.fillStyle=opt.color||'#111';ctx.textAlign=opt.align||'left';ctx.textBaseline='middle';font(ctx,size,bold);var lh=size+2,total=lines.length*lh,sy=y+(h-total)/2+lh/2;for(i=0;i<lines.length;i++){var tx=opt.align==='center'?x+w/2:x+pad;ctx.fillText(lines[i],tx,sy+i*lh,w-pad*2)}}
function labelValue(ctx,x,y,w,h,label,value,fill,valueSize){box(ctx,x,y,w,h,fill);font(ctx,8,true);ctx.fillStyle='#222';ctx.textBaseline='top';ctx.textAlign='left';ctx.fillText(label,x+5,y+4,w-10);text(ctx,value,x,y+11,w,h-11,{size:valueSize||15,min:8,bold:true,pad:5})}
async function draw(o){
  var c=document.createElement('canvas');c.width=W;c.height=H;var ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#333';ctx.fillStyle='#111';
  var x=M,y=M,U=(W-M*2)/8,h1=34,h2=38,h3=42,h4=38;
  box(ctx,x,y,U*3,h1,'#fff');text(ctx,'DF EXTRUSOR PRO',x,y,U*3,h1,{size:26,min:16,bold:true,pad:8});
  box(ctx,x+U*3,y,U*3,h1,'#1f2937');text(ctx,'ORDEM DE PRODUÇÃO — '+s(o.sector).toUpperCase(),x+U*3,y,U*3,h1,{size:17,min:11,bold:true,align:'center',color:'#fff'});
  labelValue(ctx,x+U*6,y,U*2,h1,'Nº / ID DA OP',o.id,'#fff',12);y+=h1;
  labelValue(ctx,x,y,U*2,h2,'MÁQUINA',o.machine,'#ffef19',18);labelValue(ctx,x+U*2,y,U*2,h2,'PRODUTO',o.product,'#ffef19',18);labelValue(ctx,x+U*4,y,U*2,h2,'MEDIDA',o.measure,'#fff',14);labelValue(ctx,x+U*6,y,U*2,h2,'SETOR',o.sector,'#fff',14);y+=h2;
  labelValue(ctx,x,y,U*2,h3,'OPERADOR',o.operator,'#fff',13);labelValue(ctx,x+U*2,y,U*2,h3,'TURNO',shift(o.shift),'#fff',14);labelValue(ctx,x+U*4,y,U,h3,'DATA INICIAL',brDate(o.start),'#fff',12);labelValue(ctx,x+U*5,y,U,h3,'DATA FINAL',brDate(o.end),'#fff',12);
  box(ctx,x+U*6,y,U*2,h3+h4,'#fff');
  var q=await qrSource(o.id),qs=68,qx=x+U*6+8,qy=y+7;if(q)try{ctx.drawImage(q,qx,qy,qs,qs)}catch(e){}else{box(ctx,qx,qy,qs,qs,'#f3f4f6');wrap(ctx,'QR indisponível',qx,qy,qs,qs,{size:9,bold:true,align:'center'})}
  text(ctx,'QR DA OP',qx+qs+5,y+5,U*2-qs-18,18,{size:10,min:8,bold:true});wrap(ctx,o.id,qx+qs+5,y+22,U*2-qs-18,h3+h4-25,{size:9,bold:true});
  y+=h3;box(ctx,x,y,U*3,h4,'#fff');font(ctx,8,true);ctx.fillStyle='#222';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('SEM TROCA DE PRODUTO / MEDIDA',x+5,y+4);wrap(ctx,'MANTER ESTA OP DURANTE A SEMANA',x,y+11,U*3,h4-11,{size:11,bold:true});
  box(ctx,x+U*3,y,U*3,h4,'#fff');font(ctx,8,true);ctx.fillText('NA TROCA DE PRODUTO / MEDIDA',x+U*3+5,y+4);wrap(ctx,'ENCERRAR E GERAR NOVA OP',x+U*3,y+11,U*3,h4-11,{size:11,bold:true});y+=h4;
  var full=W-M*2;box(ctx,x,y,full,22,'#d9d9d9');text(ctx,'APONTAMENTO DE PRODUÇÃO',x,y,full,22,{size:12,bold:true,align:'center'});y+=22;
  var ratios=[.07,.16,.09,.09,.09,.07,.16,.09,.09,.09],heads=['BOBINA','PESO BOBINA (kg)','APARA (kg)','CÓDIGO PARADA','EXTRUSOR','BOBINA','PESO BOBINA (kg)','APARA (kg)','CÓDIGO PARADA','EXTRUSOR'],cx=x,i,rw;
  for(i=0;i<10;i++){rw=full*ratios[i];box(ctx,cx,y,rw,24,'#efefef');wrap(ctx,heads[i],cx,y,rw,24,{size:8.5,bold:true,align:'center',pad:2});cx+=rw}y+=24;
  var rh=18;for(var r=1;r<=28;r++){cx=x;for(i=0;i<10;i++){rw=full*ratios[i];box(ctx,cx,y,rw,rh,'#fff');if(i===0)text(ctx,String(r).padStart(2,'0'),cx,y,rw,rh,{size:10,bold:true,align:'center',pad:2});if(i===5)text(ctx,String(r+28).padStart(2,'0'),cx,y,rw,rh,{size:10,bold:true,align:'center',pad:2});cx+=rw}y+=rh}
  box(ctx,x,y,full,18,'#d9d9d9');text(ctx,'CÓDIGOS DE PARADA',x,y,full,18,{size:10,bold:true,align:'center'});y+=18;
  var codes=[['01','Troca de pedido'],['02','Manutenção mecânica'],['03','Manutenção elétrica'],['04','Queda de energia']],cw=full/4;for(i=0;i<4;i++){box(ctx,x+i*cw,y,cw,24,'#fff');text(ctx,codes[i][0]+'   '+codes[i][1],x+i*cw,y,cw,24,{size:9,min:7,bold:i===0,pad:8})}y+=24;
  box(ctx,x,y,full/2,22,'#efefef');text(ctx,'DF EXTRUSOR PRO',x,y,full/2,22,{size:10,bold:true,pad:8});box(ctx,x+full/2,y,full/2,22,'#efefef');text(ctx,'OP DE PRODUÇÃO • PADRÃO DF',x+full/2,y,full/2,22,{size:10,bold:true,align:'right',pad:8});
  return c;
}
function loading(w){try{w.document.open();w.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;font-family:system-ui"><b>Gerando PDF...</b></body>');w.document.close()}catch(e){}}
function errorPage(w){try{w.document.open();w.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;font-family:system-ui"><div style="text-align:center;padding:24px"><b>Não foi possível abrir o PDF.</b><div style="margin-top:8px">Feche e toque em PDF novamente.</div></div></body>');w.document.close()}catch(e){try{w.close()}catch(x){}}}
async function generate(o){var c=await draw(o||{}),url=c.toDataURL('image/jpeg',.96),jpg=dataUrlBytes(url);return makePdf(jpg)}
function directPdf(o){var w=window.open('','_blank');if(!w){alert('Libere pop-ups para abrir o PDF.');return}loading(w);generate(o||{}).then(function(blob){var url=URL.createObjectURL(blob);try{w.location.replace(url)}catch(e){w.location.href=url}setTimeout(function(){try{URL.revokeObjectURL(url)}catch(e){}},600000)}).catch(function(e){console.error('DF PDF v6',e);errorPage(w)})}
function install(n){n=n||0;var api=window.DF_PRODUCAO_OP_TEST;if(!api||typeof api.print!=='function'){if(n<120)setTimeout(function(){install(n+1)},80);return false}if(api.print&&api.print.__dfNativePdfV6)return true;directPdf.__dfNativePdf=true;directPdf.__dfNativePdfV6=true;api.print=directPdf;return true}
install(0);var timer=setInterval(function(){install(0)},400);setTimeout(function(){clearInterval(timer)},30000);window.addEventListener('pageshow',function(){install(0)},true);window.addEventListener('focus',function(){install(0)},true);
})();
