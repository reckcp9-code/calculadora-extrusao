(function(){
  'use strict';
  const originalOpen=window.open.bind(window);

  window.open=function(){
    const w=originalOpen.apply(window,arguments);
    if(!w)return w;

    let tentativas=0;
    const timer=setInterval(function(){
      tentativas++;
      try{
        if(w.closed){clearInterval(timer);return;}
        const d=w.document;
        const titulo=String(d.title||'');
        if(/^OP\s/i.test(titulo) && d.body && !d.getElementById('dfVoltarFormulaBar')){
          const style=d.createElement('style');
          style.textContent='#dfVoltarFormulaBar{display:flex;align-items:center;gap:12px;padding:8px 10px;background:#111827;border-bottom:1px solid #334155;font-family:Arial,sans-serif}#dfVoltarFormulaBtn{border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:9px;padding:9px 14px;font-weight:900;cursor:pointer;font-size:12px}#dfVoltarFormulaTxt{color:#e5e7eb;font-size:11px}@media print{#dfVoltarFormulaBar{display:none!important}}';
          d.head.appendChild(style);

          const bar=d.createElement('div');
          bar.id='dfVoltarFormulaBar';
          bar.innerHTML='<button id="dfVoltarFormulaBtn" type="button">← VOLTAR PARA FORMULAÇÃO</button><span id="dfVoltarFormulaTxt">OP pronta para imprimir ou salvar em PDF.</span>';
          d.body.insertBefore(bar,d.body.firstChild);
          d.getElementById('dfVoltarFormulaBtn').onclick=function(){
            try{w.close()}catch(e){}
          };
          clearInterval(timer);
          return;
        }
      }catch(e){}
      if(tentativas>50)clearInterval(timer);
    },100);

    return w;
  };
})();
