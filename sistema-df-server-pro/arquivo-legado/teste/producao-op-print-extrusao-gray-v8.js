(function(){
  'use strict';
  if(window.DFProducaoPrintExtrusaoGrayV8)return;
  window.DFProducaoPrintExtrusaoGrayV8=true;

  const originalOpen=window.open.bind(window);

  function bodyRows(start,end){
    let out='';
    for(let i=start;i<end;i++){
      out+='<tr><td></td><td></td><td></td></tr>';
    }
    return out;
  }

  function transform(html){
    html=String(html||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    // Mantém exatamente o mesmo padrão visual/tamanho da V6.
    html=html
      .replace('<td colspan="2"><span class="label">Nº / ID DA OP</span>','<td colspan="2" class="dfGrayKey"><span class="label">Nº / ID DA OP</span>')
      .replace('<td colspan="2"><span class="label">MEDIDA</span>','<td colspan="2" class="dfYellowKey"><span class="label">MEDIDA</span>')
      .replace('<td colspan="2" rowspan="2"><div class="qrw">','<td colspan="2" rowspan="2" class="dfGrayKey"><div class="qrw">');

    const start=html.indexOf('<div class="cols">');
    const script=html.indexOf('<script>(function(){var id=',start);
    if(start>=0&&script>start){
      const compact=`<div class="dfBodyTitle">APONTAMENTO DE PRODUÇÃO</div>
      <div class="dfCompactCols">
        <table class="dfCompact"><thead><tr><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>${bodyRows(0,28)}</tbody></table>
        <table class="dfCompact"><thead><tr><th>PESO BOBINA (kg)</th><th>APARA (kg)</th><th>CÓDIGO PARADA</th></tr></thead><tbody>${bodyRows(28,56)}</tbody></table>
      </div>
      <div class="dfCodesTitle">CÓDIGOS DE PARADA</div>
      <div class="dfCodes"><span><b>01</b> Troca de pedido</span><span><b>02</b> Manutenção mecânica</span><span><b>03</b> Manutenção elétrica</span><span><b>04</b> Queda de energia</span></div>
      <div class="dfFooter"><b>DF EXTRUSOR PRO</b><span>OP DE PRODUÇÃO • PADRÃO DF</span></div>`;
      html=html.slice(0,start)+compact+html.slice(script);
    }

    const style=`<style>
      :root{--g0:#fff;--g1:#f2f2f2;--g2:#dedede;--g3:#c8c8c8;--g4:#9b9b9b;--line:#555;--yellow:#f2df55}
      body{font-family:Arial,Helvetica,sans-serif!important;color:#111!important;background:#fff!important;font-size:6.1px!important}
      table{border-collapse:collapse!important}
      td,th{border-color:var(--line)!important;border-width:.7px!important}
      .head td{background:var(--g1)!important}
      .company{background:var(--g2)!important;color:#111!important;font-size:11px!important;font-weight:900!important;letter-spacing:.02em!important}
      .dark{background:var(--g3)!important;color:#111!important;font-size:7px!important;font-weight:900!important;letter-spacing:.04em!important}

      .head td.yellow,.dfYellowKey{background:var(--yellow)!important;color:#111!important}
      .dfGrayKey{background:var(--g1)!important;color:#111!important}
      .blue,.green{background:var(--g2)!important;color:#202020!important}

      .label{color:#3f3f3f!important;font-size:5px!important;font-weight:900!important;letter-spacing:.02em!important}
      .big{font-size:8.5px!important}

      /* Mesmo espaço do QR da V6; apenas impede deformação. */
      .qrw{gap:7px!important}
      .qr{border:1px solid var(--line)!important;padding:2px!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      .qr img,.qr canvas,.qr svg{display:block!important;aspect-ratio:1/1!important;object-fit:contain!important;max-width:100%!important;max-height:100%!important;margin:auto!important;background:#fff!important}
      .qid{font-weight:700!important;color:#222!important}

      .dfBodyTitle{margin-top:2.1mm;background:var(--g3);border:1px solid var(--line);padding:2.1px 4px;text-align:center;font-weight:900;font-size:6.4px;letter-spacing:.04em}
      .dfCompactCols{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:1.1mm}
      .dfCompact{width:100%;table-layout:fixed;border:1px solid var(--line)}
      .dfCompact th{background:var(--g3)!important;color:#111!important;font-size:5px;font-weight:900;text-align:center;height:9px;padding:1.4px 1px}
      .dfCompact th:nth-child(1){width:42%}.dfCompact th:nth-child(2){width:28%}.dfCompact th:nth-child(3){width:30%}
      .dfCompact td{height:4.35px;background:#fff!important;border:1px solid #737373;padding:.5px 1.5px}

      .dfCodesTitle{margin-top:1.3mm;background:var(--g2)!important;border:1px solid var(--line);border-bottom:0;padding:1.7px 4px;text-align:center;font-weight:900;font-size:5.5px}
      .dfCodes{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);background:var(--g1)!important}
      .dfCodes span{padding:2.3px 4px;border-right:1px solid var(--line);font-size:5px;white-space:nowrap}.dfCodes span:last-child{border-right:0}
      .dfCodes b{display:inline-block;background:var(--g3)!important;color:#111!important;padding:1px 3px;margin-right:3px}

      .dfFooter{margin-top:1mm;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--line);background:var(--g2)!important;padding:2px 5px;font-size:5px}.dfFooter b{font-size:6px}.dfFooter span{color:#555;font-weight:700}
      .test{color:#777!important;font-weight:700!important}
      @media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.test{display:none!important}}
    </style>`;

    const qrFix=`<script>(function(){function fixQr(){var q=document.querySelector('.qr');if(!q)return;var el=q.querySelector('img,canvas,svg');if(!el)return;var s=Math.min(q.clientWidth||0,q.clientHeight||0);if(s>0){el.style.width=s+'px';el.style.height=s+'px';el.style.maxWidth='100%';el.style.maxHeight='100%';}el.style.objectFit='contain';el.style.display='block';el.style.margin='auto';}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixQr,{once:true});else fixQr();setTimeout(fixQr,80);setTimeout(fixQr,250);})();<\/script>`;

    html=html.replace('</head>',style+'</head>');
    return html.replace('</body>',qrFix+'</body>');
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
