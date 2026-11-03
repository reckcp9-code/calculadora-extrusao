(function(){
  'use strict';
  if(window.DFProducaoPrintScaleExtrusaoV11)return;
  window.DFProducaoPrintScaleExtrusaoV11=true;

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

    // Mantém o cabeçalho/identidade da OP original e troca somente o quadro de apontamento.
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

    // Página visual com a mesma presença/tamanho da OP da Extrusão.
    html=html.replace('<body>','<body><div class="dfA4Page">');
    html=html.replace('</body>','</div></body>');

    const style=`<style>
      @page{size:A4 landscape;margin:4mm}
      *{box-sizing:border-box!important}
      html{background:#f5f5f5!important}
      body{font-family:Arial,Helvetica,sans-serif!important;color:#111!important;margin:0!important;font-size:9px!important;background:#f5f5f5!important;padding:16px!important}
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
      .qrw{gap:8px!important;align-items:center!important}
      .qr{width:84px!important;height:84px!important;min-width:84px!important;min-height:84px!important;border:1px solid #555!important;padding:3px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      .qr img,.qr canvas,.qr svg{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;aspect-ratio:1/1!important;margin:auto!important;background:#fff!important}
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
      @media print{html,body{background:#fff!important;padding:0!important}.dfA4Page{width:auto!important;max-width:none!important;min-height:0!important;aspect-ratio:auto!important;margin:0!important;box-shadow:none!important;overflow:visible!important}.test{display:none!important}body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
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
