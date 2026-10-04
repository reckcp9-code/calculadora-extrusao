(function(){
  'use strict';
  if(window.DFProducaoPrintColumnsOnlyV10)return;
  window.DFProducaoPrintColumnsOnlyV10=true;

  const originalOpen=window.open.bind(window);

  function transform(markup){
    let html=String(markup||'');
    if(!html.includes('ORDEM DE PRODUÇÃO —'))return html;

    // IMPORTANTE: não altera estrutura, tamanho, QR, estilos, linhas ou proporções.
    // Apenas reaproveita as 4 colunas já existentes do modelo aprovado.
    html=html
      .replaceAll('QUANTIDADE / PESO<br>POR BOBINA (kg)','PESO BOBINA (kg)')
      .replaceAll('QUANTIDADE/PESO<br>POR BOBINA (kg)','PESO BOBINA (kg)')
      .replaceAll('QUANTIDADE / PESO POR BOBINA (kg)','PESO BOBINA (kg)')
      .replaceAll('QUANTIDADE/PESO POR BOBINA (kg)','PESO BOBINA (kg)')
      .replaceAll('CÓDIGO DE<br>PARADA','APARA (kg)')
      .replaceAll('CODIGO DE<br>PARADA','APARA (kg)')
      .replaceAll('CÓDIGO DE PARADA','APARA (kg)')
      .replaceAll('CODIGO DE PARADA','APARA (kg)')
      .replaceAll('>MOTIVO<','>CÓDIGO PARADA<');

    return html;
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
