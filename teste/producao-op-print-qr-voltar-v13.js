(function(){
  'use strict';
  if(window.DFProducaoPrintQrVoltarV13)return;
  window.DFProducaoPrintQrVoltarV13=true;

  // Este wrapper deve carregar ANTES do ajuste de escala v11.
  // Assim ele recebe o HTML final da OP e altera somente QR + botão voltar.
  const previousOpen=window.open.bind(window);

  function transform(markup){
    let html=String(markup||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    // QR: mantém somente o ID único da OP, reduz a densidade (M) e gera bitmap maior.
    html=html
      .replace('width:128,height:128,correctLevel:QRCode.CorrectLevel.H','width:320,height:320,correctLevel:QRCode.CorrectLevel.M')
      .replace('width:128,height:128, correctLevel:QRCode.CorrectLevel.H','width:320,height:320, correctLevel:QRCode.CorrectLevel.M');

    // Barra de retorno fica fora da folha A4 e não aparece na impressão.
    const toolbar=`<div class="dfPrintToolbar"><a class="dfPrintBack" href="/op-producao-teste-v27.html?v=20261004-qr-v13" onclick="try{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();return false}}catch(e){}">‹ VOLTAR PARA PRODUÇÃO</a></div>`;
    html=html.replace('<body>','<body>'+toolbar);

    const style=`<style>
      .dfPrintToolbar{
        width:100%;max-width:1122px;margin:10px auto 8px;padding:0 2px;
        display:flex;align-items:center;justify-content:flex-start;
      }
      .dfPrintBack{
        display:inline-flex;align-items:center;justify-content:center;
        min-height:42px;padding:0 17px;border:2px solid #64748b;
        border-radius:999px;background:#111827;color:#f8fafc!important;
        text-decoration:none!important;font:900 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;
        box-shadow:0 2px 8px rgba(0,0,0,.18);
      }
      html body .dfA4Page .qrw{
        display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;
      }
      html body .dfA4Page #qr.qr{
        width:112px!important;height:112px!important;
        min-width:112px!important;min-height:112px!important;
        padding:12px!important;margin:0!important;
        border:1px solid #555!important;background:#fff!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        overflow:hidden!important;line-height:0!important;
      }
      html body .dfA4Page #qr.qr canvas,
      html body .dfA4Page #qr.qr img{
        display:block!important;width:88px!important;height:88px!important;
        min-width:88px!important;min-height:88px!important;
        max-width:88px!important;max-height:88px!important;
        margin:0 auto!important;object-fit:contain!important;
        image-rendering:pixelated!important;background:#fff!important;
      }
      html body .dfA4Page #qr.qr img+img{display:none!important}
      @media print{
        .dfPrintToolbar{display:none!important}
      }
    </style>`;
    html=html.replace('</head>',style+'</head>');

    // Depois do QR ser criado, mantém uma única representação centralizada.
    const fix=`<script>(function(){
      function normalizeQr(){
        var q=document.getElementById('qr');
        if(!q)return;
        var c=q.querySelector('canvas');
        var imgs=q.querySelectorAll('img');
        q.style.setProperty('display','flex','important');
        q.style.setProperty('align-items','center','important');
        q.style.setProperty('justify-content','center','important');
        q.style.setProperty('padding','12px','important');
        if(c){
          c.style.setProperty('display','block','important');
          c.style.setProperty('width','88px','important');
          c.style.setProperty('height','88px','important');
          c.style.setProperty('margin','0 auto','important');
          imgs.forEach(function(i){i.style.setProperty('display','none','important')});
        }else if(imgs[0]){
          imgs[0].style.setProperty('display','block','important');
          imgs[0].style.setProperty('width','88px','important');
          imgs[0].style.setProperty('height','88px','important');
          imgs[0].style.setProperty('margin','0 auto','important');
          for(var j=1;j<imgs.length;j++)imgs[j].style.setProperty('display','none','important');
        }
      }
      var n=0,t=setInterval(function(){normalizeQr();if(++n>50)clearInterval(t)},60);
      normalizeQr();
    })();<\/script>`;
    html=html.replace('</body>',fix+'</body>');
    return html;
  }

  window.open=function(){
    const child=previousOpen.apply(window,arguments);
    if(!child||!child.document)return child;
    try{
      const realWrite=child.document.write.bind(child.document);
      child.document.write=function(markup){return realWrite(transform(markup))};
    }catch(e){}
    return child;
  };
})();
