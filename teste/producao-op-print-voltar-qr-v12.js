(function(){
  'use strict';
  if(window.DFProducaoPrintVoltarQrV12)return;
  window.DFProducaoPrintVoltarQrV12=true;

  const previousOpen=window.open.bind(window);

  function transform(markup){
    let html=String(markup||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    const extraStyle=`<style>
      .dfPrintBack{
        position:fixed!important;
        z-index:2147483647!important;
        left:max(12px,env(safe-area-inset-left))!important;
        top:max(12px,env(safe-area-inset-top))!important;
        appearance:none!important;
        border:2px solid #64748b!important;
        background:#111827!important;
        color:#f8fafc!important;
        border-radius:999px!important;
        padding:10px 16px!important;
        font:900 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial!important;
        box-shadow:0 2px 8px rgba(0,0,0,.22)!important;
      }
      html body .dfA4Page .qrw{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      html body .dfA4Page #qr.qr{
        width:84px!important;
        height:84px!important;
        min-width:84px!important;
        min-height:84px!important;
        padding:7px!important;
        background:#fff!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
        line-height:0!important;
      }
      html body .dfA4Page #qr.qr canvas{
        display:block!important;
        width:68px!important;
        height:68px!important;
        max-width:68px!important;
        max-height:68px!important;
        margin:auto!important;
      }
      html body .dfA4Page #qr.qr img{
        display:none!important;
      }
      @media print{.dfPrintBack{display:none!important}}
    </style>`;

    const back=`<button type="button" class="dfPrintBack" onclick="(function(){try{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();return}}catch(e){}location.href='./op-producao-teste-v27.html?v=20261003-print-v12'})()">‹ VOLTAR</button>`;

    const qrFix=`<script>(function(){
      function fixQr(){
        var q=document.getElementById('qr');
        if(!q)return;
        q.style.setProperty('display','flex','important');
        q.style.setProperty('align-items','center','important');
        q.style.setProperty('justify-content','center','important');
        q.style.setProperty('overflow','hidden','important');
        q.style.setProperty('padding','7px','important');
        var c=q.querySelector('canvas');
        var imgs=q.querySelectorAll('img');
        if(c){
          c.style.setProperty('display','block','important');
          c.style.setProperty('width','68px','important');
          c.style.setProperty('height','68px','important');
          c.style.setProperty('max-width','68px','important');
          c.style.setProperty('max-height','68px','important');
          c.style.setProperty('margin','auto','important');
          imgs.forEach(function(i){i.style.setProperty('display','none','important')});
        }else if(imgs[0]){
          imgs[0].style.setProperty('display','block','important');
          imgs[0].style.setProperty('width','68px','important');
          imgs[0].style.setProperty('height','68px','important');
          imgs[0].style.setProperty('margin','auto','important');
        }
      }
      var n=0,t=setInterval(function(){fixQr();if(++n>30)clearInterval(t)},80);
      fixQr();
    })();<\/script>`;

    html=html.replace('</head>',extraStyle+'</head>');
    html=html.replace('<body>','<body>'+back);
    html=html.replace('</body>',qrFix+'</body>');
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
