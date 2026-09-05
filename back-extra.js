(function(){
  function showFormulaOnOpener(w){
    try{
      if(w && w.opener && !w.opener.closed){
        if(typeof w.opener.show==='function') w.opener.show('fo');
        const btn=w.opener.document && w.opener.document.getElementById('btFo');
        if(btn) btn.click();
        w.opener.focus();
        return true;
      }
    }catch(e){}
    return false;
  }

  function addBackButton(w, tipo){
    function run(){
      try{
        if(!w || w.closed || !w.document || !w.document.body) return;
        if(w.document.getElementById('dfBackFormula')) return;

        const st=w.document.createElement('style');
        st.textContent='.dfBackBar{position:sticky;top:0;z-index:99999;background:#080b13;padding:10px 12px;border-bottom:2px solid #facc15;font-family:Arial,Helvetica,sans-serif}.dfBackBtn{appearance:none;border:0;border-radius:10px;background:#facc15;color:#111827;font-weight:900;padding:10px 14px;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.18)}.dfBackTxt{color:#e5e7eb;font-size:11px;margin-left:10px}@media print{.dfBackBar{display:none!important}}';
        w.document.head.appendChild(st);

        const bar=w.document.createElement('div');
        bar.id='dfBackFormula';
        bar.className='dfBackBar';

        const btn=w.document.createElement('button');
        btn.type='button';
        btn.className='dfBackBtn';
        btn.textContent='← VOLTAR PARA FORMULAÇÃO';
        btn.onclick=function(){
          const ok=showFormulaOnOpener(w);
          try{w.close()}catch(e){}
          if(!ok){
            try{w.location.href='./#formulação'}catch(e){}
          }
          return false;
        };

        const txt=w.document.createElement('span');
        txt.className='dfBackTxt';
        txt.textContent=tipo+' pronta. Use imprimir/salvar ou volte para editar.';

        bar.appendChild(btn);
        bar.appendChild(txt);
        w.document.body.insertBefore(bar,w.document.body.firstChild);
      }catch(e){}
    }
    setTimeout(run,80);
    setTimeout(run,350);
    setTimeout(run,900);
  }

  function wrapPrint(name,tipo){
    const old=window[name];
    if(typeof old!=='function' || old.dfBackWrapped) return false;
    const wrapped=function(){
      let captured=null;
      const realOpen=window.open;
      window.open=function(){
        captured=realOpen.apply(window,arguments);
        return captured;
      };
      try{
        return old.apply(this,arguments);
      }finally{
        window.open=realOpen;
        if(captured) addBackButton(captured,tipo);
      }
    };
    wrapped.dfBackWrapped=true;
    window[name]=wrapped;
    return true;
  }

  function init(){
    wrapPrint('printFormulaPdf','PDF');
    wrapPrint('printFormulaOp','OP');
  }

  init();
  setTimeout(init,200);
  setTimeout(init,800);
  setTimeout(init,1600);
})();
