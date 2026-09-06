(function(){
  'use strict';

  function forms(){
    try{
      return window.loadForms ? window.loadForms() : JSON.parse(localStorage.getItem('df_formulacoes_v2') || '[]');
    }catch(e){
      return [];
    }
  }

  function selected(){
    const id=document.getElementById('foSavedSelect')?.value;
    return forms().find(f=>String(f.id)===String(id));
  }

  function prepararJanela(){
    const w=window.open('about:blank','df_resinas_pdf');
    if(!w)return null;
    try{
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#eee;color:#111}.box{background:#fff;border:1px solid #ccc;padding:22px 28px;font-weight:700}</style></head><body><div class="box">Gerando relatório...</div></body></html>');
      w.document.close();
    }catch(e){}
    return w;
  }

  function configurarVoltar(w){
    try{
      const btn=w.document.querySelector('.tools button');
      if(!btn)return;
      btn.textContent='← VOLTAR PARA FORMULAÇÃO';
      btn.onclick=function(){
        try{
          if(w.opener && !w.opener.closed){
            w.opener.location.hash='#formulacao';
            w.opener.focus();
          }
        }catch(e){}
        w.close();
      };
    }catch(e){}
  }

  async function abrirPdf(f){
    if(!f){alert('Selecione uma formulação.');return;}
    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O PDF ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const w=prepararJanela();
    if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up e tente novamente.');return;}
    const ok=await window.dfPdfResinasProfissional(f,w);
    if(ok){
      configurarVoltar(w);
      setTimeout(()=>configurarVoltar(w),150);
      setTimeout(()=>configurarVoltar(w),500);
    }
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('[data-fosafe="pdf"]'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    abrirPdf(selected());
  },true);
})();
