(function(){
  'use strict';
  const OLD_KEY='df_vendedor_pdf_auto_v1';
  const PRO_KEY='df_vendedor_pdf_auto_prof_v1';
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};

  try{localStorage.setItem(OLD_KEY,'0')}catch(e){}

  async function abrirProfissional(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return;}
    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O relatório profissional ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const ok=await window.dfPdfResinasProfissional(f);
    const msg=document.getElementById('foVendMsg');
    if(ok&&msg)msg.textContent='Relatório profissional aberto. Use IMPRIMIR / SALVAR PDF para compartilhar.';
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendPdfTest'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    abrirProfissional(forms()[0]);
  },true);

  function ajustarAuto(){
    const cb=document.getElementById('foVendPdfAuto');
    if(!cb||cb.dataset.dfPdfProf==='1')return;
    cb.dataset.dfPdfProf='1';
    cb.checked=localStorage.getItem(PRO_KEY)!=='0';
    try{localStorage.setItem(OLD_KEY,'0')}catch(e){}
    cb.addEventListener('change',function(ev){
      ev.stopImmediatePropagation();
      try{
        localStorage.setItem(OLD_KEY,'0');
        localStorage.setItem(PRO_KEY,cb.checked?'1':'0');
      }catch(e){}
    },true);
    const label=cb.closest('label');
    if(label){
      const nodes=[...label.childNodes].filter(n=>n.nodeType===3);
      if(nodes.length)nodes[nodes.length-1].textContent=' Abrir relatório profissional quando salvar formulação';
    }
  }

  let lastId='';
  function initLast(){const f=forms()[0];lastId=f?String(f.id):'';}
  function watchNew(){
    ajustarAuto();
    try{localStorage.setItem(OLD_KEY,'0')}catch(e){}
    const f=forms()[0];
    const id=f?String(f.id):'';
    if(lastId&&id&&id!==lastId&&localStorage.getItem(PRO_KEY)!=='0'){
      lastId=id;
      setTimeout(()=>abrirProfissional(f),250);
      return;
    }
    if(id)lastId=id;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initLast();setTimeout(ajustarAuto,500)});
  else{initLast();setTimeout(ajustarAuto,500)}
  setInterval(watchNew,700);
})();
