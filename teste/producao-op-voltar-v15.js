(function(){
  'use strict';
  if(window.DFProducaoVoltarV15)return;
  window.DFProducaoVoltarV15=true;

  const previousOpen=window.open.bind(window);

  function transform(markup){
    let html=String(markup||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;
    if(html.includes('dfPrintBackV15'))return html;

    const button=`<button type="button" class="dfPrintBackV15" onclick="(function(){try{if(window.opener&&!window.opener.closed){window.opener.focus();window.close();return}}catch(e){}location.href='/op-producao-teste-v27.html?v=20261004-voltar-v15'})()">‹ VOLTAR PARA PRODUÇÃO</button>`;
    html=html.replace(/<body([^>]*)>/i,function(m){return m+button});

    const style=`<style>
      .dfPrintBackV15{
        position:fixed!important;
        z-index:2147483647!important;
        top:max(10px,env(safe-area-inset-top))!important;
        left:max(10px,env(safe-area-inset-left))!important;
        appearance:none!important;
        border:2px solid #64748b!important;
        background:#111827!important;
        color:#f8fafc!important;
        border-radius:999px!important;
        min-height:42px!important;
        padding:0 17px!important;
        font:900 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial!important;
        box-shadow:0 3px 12px rgba(0,0,0,.28)!important;
        cursor:pointer!important;
      }
      @media print{.dfPrintBackV15{display:none!important}}
    </style>`;
    return html.replace(/<\/head>/i,style+'</head>');
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
