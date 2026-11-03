(function(){
  'use strict';
  if(window.DFProducaoPrintProfV4)return;
  window.DFProducaoPrintProfV4=true;

  const originalOpen=window.open.bind(window);

  function transform(html){
    html=String(html||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    html=html
      .replace('<td colspan="2"><span class="label">Nº / ID DA OP</span>','<td colspan="2" class="dfKey"><span class="label">Nº / ID DA OP</span>')
      .replace('<td colspan="2"><span class="label">MEDIDA</span>','<td colspan="2" class="dfKey"><span class="label">MEDIDA</span>')
      .replace('<td colspan="2" rowspan="2"><div class="qrw">','<td colspan="2" rowspan="2" class="dfQrKey"><div class="qrw">');

    const style=`<style>
      :root{--df-gray-1:#f4f5f6;--df-gray-2:#e3e5e8;--df-gray-3:#c8ccd1;--df-gray-4:#676d75;--df-yellow:#f3cf3f;--df-yellow-soft:#fff2a8;--df-line:#555b63}
      body{font-family:Arial,Helvetica,sans-serif!important;color:#17191c!important;background:#fff!important;font-size:6.15px!important}
      table{border-color:var(--df-line)!important}
      td,th{border-color:var(--df-line)!important;border-width:.7px!important}
      .head td{background:var(--df-gray-1)!important}
      .company{background:var(--df-gray-2)!important;color:#15171a!important;font-size:11px!important;letter-spacing:.02em!important}
      .dark{background:var(--df-gray-3)!important;color:#17191c!important;font-size:7px!important;letter-spacing:.04em!important}
      .yellow,.dfKey,.dfQrKey{background:var(--df-yellow)!important;color:#111!important}
      .blue,.green{background:var(--df-gray-2)!important;color:#202328!important}
      .label{color:#40444a!important;font-size:5px!important;letter-spacing:.025em!important}
      .big{font-size:8.7px!important}
      .qrw{gap:7px!important}
      .qr{border:1px solid #555!important;padding:2px!important;background:#fff!important}
      .qid{font-weight:700!important;color:#222!important}
      .roll{border:1px solid var(--df-line)!important}
      .roll th{background:var(--df-gray-3)!important;color:#17191c!important;font-size:5.3px!important;font-weight:900!important}
      .roll th:nth-child(3){background:var(--df-yellow)!important}
      .roll td{border-color:#737880!important;background:#fff!important}
      .roll td:first-child{background:var(--df-gray-1)!important;color:#30343a!important}
      .roll td:nth-child(3){background:#fffbe8!important}
      .stops{border:1px solid var(--df-line)!important}
      .stops th{background:var(--df-gray-3)!important;color:#17191c!important;font-weight:900!important}
      .stops th:first-child{background:var(--df-yellow)!important}
      .stops td{border-color:#737880!important}
      .legend{background:var(--df-gray-1)!important;border-color:var(--df-line)!important;color:#30343a!important;padding:3px 5px!important}
      .legend span{white-space:nowrap!important}
      .legend b{display:inline-block!important;background:var(--df-yellow)!important;color:#111!important;padding:1px 3px!important;border-radius:1px!important}
      .foot{gap:1.5px!important;margin-top:1.3mm!important}
      .foot div{background:var(--df-yellow)!important;border-color:var(--df-line)!important;min-height:14px!important;padding:2.5px 4px!important}
      .foot .label{color:#36391f!important;font-weight:900!important}
      .foot b{font-size:6.6px!important;color:#111!important}
      .test{color:#8a6200!important;font-weight:700!important}
      @media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.test{display:none!important}}
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
