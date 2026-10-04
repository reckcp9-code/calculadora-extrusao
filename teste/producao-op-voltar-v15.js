(function(){
  'use strict';
  if(window.DFProducaoVoltarV16)return;
  window.DFProducaoVoltarV16=true;

  // NÃO altera o HTML da OP. Apenas injeta o botão depois que a folha já foi gerada.
  const previousOpen=window.open.bind(window);

  function addBackButton(child){
    let tries=0;
    const timer=setInterval(function(){
      tries++;
      try{
        const doc=child&&child.document;
        if(!doc||!doc.body){if(tries>100)clearInterval(timer);return;}
        const txt=String(doc.body.textContent||'');
        if(!txt.includes('ORDEM DE PRODUÇÃO')){if(tries>100)clearInterval(timer);return;}
        if(doc.getElementById('dfPrintBackV16')){clearInterval(timer);return;}

        const style=doc.createElement('style');
        style.id='dfPrintBackV16Style';
        style.textContent=`
          #dfPrintBackV16{
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
          @media print{#dfPrintBackV16{display:none!important}}
        `;
        (doc.head||doc.documentElement).appendChild(style);

        const btn=doc.createElement('button');
        btn.id='dfPrintBackV16';
        btn.type='button';
        btn.textContent='‹ VOLTAR PARA PRODUÇÃO';
        btn.onclick=function(){
          try{
            if(child.opener&&!child.opener.closed){child.opener.focus();child.close();return;}
          }catch(e){}
          child.location.href='/op-producao-teste-v27.html?v=20261004-voltar-v16';
        };
        doc.body.appendChild(btn);
        clearInterval(timer);
      }catch(e){if(tries>100)clearInterval(timer);}
    },60);
  }

  window.open=function(){
    const child=previousOpen.apply(window,arguments);
    if(child)addBackButton(child);
    return child;
  };
})();
