(function(){
  'use strict';
  if(window.DFProducaoPrintFinalV14)return;
  window.DFProducaoPrintFinalV14=true;

  const originalOpen=window.open.bind(window);

  function bodyRows(start,end){
    let out='';
    for(let i=start;i<end;i++){
      out+='<tr><td class="n">'+String(i+1).padStart(2,'0')+'</td><td></td><td></td><td></td></tr>';
    }
    return out;
  }

  function transform(markup){
    let html=String(markup||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    // Mantém o cabeçalho original e troca somente o apontamento aprovado.
    const start=html.indexOf('<div class="cols">');
    const script=html.indexOf('<script>(function(){var id=',start);
    if(start>=0&&script>start){
      const body=`<div class="dfBodyTitle">APONTAMENTO DE PRODUÇÃO</div>
      <div class="dfCompactCols">
        <table class="dfCompact"><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>${bodyRows(0,28)}</tbody></table>
        <table class="dfCompact"><thead><tr><th>BOBINA</th><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>${bodyRows(28,56)}</tbody></table>
      </div>
      <div class="dfCodesTitle">CÓDIGOS DE PARADA</div>
      <div class="dfCodes"><span><b>01</b> Troca de pedido</span><span><b>02</b> Manutenção mecânica</span><span><b>03</b> Manutenção elétrica</span><span><b>04</b> Queda de energia</span></div>
      <div class="dfFooter"><b>DF EXTRUSOR PRO</b><span>OP DE PRODUÇÃO • PADRÃO DF</span></div>`;
      html=html.slice(0,start)+body+html.slice(script);
    }

    const toolbar='<div class="dfPrintToolbar"><button type="button" class="dfPrintBack" onclick="(function(){try{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();return}}catch(e){}location.href=\'/op-producao-teste-v27.html?v=20261004-print-v14\'})()">‹ VOLTAR PARA PRODUÇÃO</button></div>';
    html=html.replace('<body>','<body>'+toolbar+'<div class="dfA4Page">');

    // Recria o QR usando o ID único visível na própria OP. O padding branco vira quiet-zone.
    const qrScript=`<script>(function(){
      var tries=0;
      function rebuild(){
        tries++;
        var q=document.getElementById('qr');
        var txt=(document.querySelector('.qid')||document.body).textContent||'';
        var m=txt.match(/DFOP-[A-Z0-9-]+/i);
        if(!q||!m||typeof QRCode==='undefined'){
          if(tries<40)setTimeout(rebuild,80);
          return;
        }
        var code=String(m[0]).toUpperCase();
        try{
          q.innerHTML='';
          new QRCode(q,{text:code,width:360,height:360,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.L});
        }catch(e){if(tries<40)setTimeout(rebuild,80);return;}
        setTimeout(function(){
          var c=q.querySelector('canvas');
          var imgs=q.querySelectorAll('img');
          var keep=c||imgs[0];
          if(keep){
            keep.style.setProperty('display','block','important');
            keep.style.setProperty('width','104px','important');
            keep.style.setProperty('height','104px','important');
            keep.style.setProperty('max-width','104px','important');
            keep.style.setProperty('max-height','104px','important');
            keep.style.setProperty('margin','auto','important');
            keep.style.setProperty('image-rendering','pixelated','important');
          }
          for(var i=0;i<imgs.length;i++)if(imgs[i]!==keep)imgs[i].style.setProperty('display','none','important');
        },20);
      }
      setTimeout(rebuild,20);
    })();<\/script>`;
    html=html.replace('</body>','</div>'+qrScript+'</body>');

    const style=`<style>
      @page{size:A4 landscape;margin:4mm}
      *{box-sizing:border-box!important}
      html{background:#f5f5f5!important}
      body{font-family:Arial,Helvetica,sans-serif!important;color:#111!important;margin:0!important;font-size:9px!important;background:#f5f5f5!important;padding:16px!important}
      .dfPrintToolbar{width:100%;max-width:1122px;margin:0 auto 10px;display:flex;justify-content:flex-start;align-items:center}
      .dfPrintBack{appearance:none;border:2px solid #64748b;background:#111827;color:#f8fafc;border-radius:999px;padding:11px 18px;font:900 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 2px 8px rgba(0,0,0,.18)}
      .dfA4Page{width:100%;max-width:1122px;min-height:793px;margin:0 auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.20);padding:0;overflow:hidden}
      table{border-collapse:collapse!important;width:100%}
      td,th{border-color:#555!important;border-width:.8px!important}
      .head td{background:#f2f2f2!important;padding:3px!important}
      .company{background:#dedede!important;color:#111!important;font-size:17px!important;font-weight:900!important;letter-spacing:.02em!important}
      .dark{background:#c8c8c8!important;color:#111!important;font-size:9px!important;font-weight:900!important;letter-spacing:.04em!important}
      .head td.yellow{background:#f2df55!important;color:#111!important}
      .blue,.green{background:#dedede!important;color:#202020!important}
      .label{color:#3f3f3f!important;font-size:7px!important;font-weight:900!important;letter-spacing:.02em!important}
      .big{font-size:13px!important}
      .qrw{gap:9px!important;align-items:center!important}
      #qr.qr{width:124px!important;height:124px!important;min-width:124px!important;min-height:124px!important;border:1px solid #555!important;padding:10px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;line-height:0!important}
      #qr.qr canvas,#qr.qr img{display:block!important;width:104px!important;height:104px!important;min-width:104px!important;min-height:104px!important;max-width:104px!important;max-height:104px!important;object-fit:contain!important;aspect-ratio:1/1!important;margin:auto!important;background:#fff!important;image-rendering:pixelated!important}
      #qr.qr img+img{display:none!important}
      .qid{font-size:9px!important;font-weight:700!important;color:#222!important;line-height:1.25!important}
      .dfBodyTitle{margin-top:6px;background:#c8c8c8;border:1px solid #555;padding:4px 6px;text-align:center;font-weight:900;font-size:9px;letter-spacing:.04em}
      .dfCompactCols{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:6px}
      .dfCompact{width:100%;table-layout:fixed;border:1px solid #555}
      .dfCompact th{background:#dedede!important;color:#111!important;font-size:7px;font-weight:900;text-align:center;height:18px;padding:2px 2px;line-height:1.1}
      .dfCompact th:nth-child(1){width:12%}.dfCompact th:nth-child(2){width:35%}.dfCompact th:nth-child(3){width:18%}.dfCompact th:nth-child(4){width:35%}
      .dfCompact td{height:12px;background:#fff!important;border:1px solid #737373;padding:1px 2px}
      .dfCompact td.n{background:#f2f2f2!important;text-align:center;font-weight:900;color:#333!important;font-size:7px}
      .dfCodesTitle{margin-top:6px;background:#dedede!important;border:1px solid #555;border-bottom:0;padding:3px 5px;text-align:center;font-weight:900;font-size:7px}
      .dfCodes{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #555;background:#f2f2f2!important}
      .dfCodes span{padding:4px 6px;border-right:1px solid #555;font-size:7px;white-space:nowrap}.dfCodes span:last-child{border-right:0}
      .dfCodes b{display:inline-block;background:#c8c8c8!important;color:#111!important;padding:1px 4px;margin-right:4px}
      .dfFooter{margin-top:5px;display:flex;justify-content:space-between;align-items:center;border:1px solid #555;background:#dedede!important;padding:4px 6px;font-size:7px}.dfFooter b{font-size:8px}.dfFooter span{color:#555;font-weight:700}
      .test{color:#777!important;font-weight:700!important}
      @media(max-width:700px){body{padding:15px!important}.dfA4Page{min-height:0;aspect-ratio:297/210}.company{font-size:15px!important}.big{font-size:12px!important}}
      @media print{html,body{background:#fff!important;padding:0!important}.dfPrintToolbar{display:none!important}.dfA4Page{width:auto!important;max-width:none!important;min-height:0!important;aspect-ratio:auto!important;margin:0!important;box-shadow:none!important;overflow:visible!important}.test{display:none!important}body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
    </style>`;
    return html.replace('</head>',style+'</head>');
  }

  window.open=function(){
    const child=originalOpen.apply(window,arguments);
    if(!child||!child.document)return child;
    try{
      const realWrite=child.document.write.bind(child.document);
      child.document.write=function(markup){return realWrite(transform(markup))};
    }catch(e){}
    return child;
  };
})();
