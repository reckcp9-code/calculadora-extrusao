(function(){
  'use strict';
  const OLD_KEY='df_vendedor_pdf_auto_v1';
  const PRO_KEY='df_vendedor_pdf_auto_prof_v1';
  const KEY_NUM='df_vendedor_whats_num_v1';
  const DEFAULT_NUM='5547992825006';
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};

  try{localStorage.setItem(OLD_KEY,'0')}catch(e){}

  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(!d)d=DEFAULT_NUM;
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }

  function getPhone(){
    return normalizePhone(localStorage.getItem(KEY_NUM)||DEFAULT_NUM);
  }

  function abrirWhatsCadastrado(f){
    if(!f)return;
    const phone=getPhone();
    const texto='Segue o PDF da formulação '+String(f.nome||'Formulação')+'.';
    const url='https://wa.me/'+phone+'?text='+encodeURIComponent(texto);
    const w=window.open(url,'_blank','noopener');
    const msg=document.getElementById('foVendMsg');
    if(msg)msg.textContent='WhatsApp cadastrado aberto. Salve o relatório profissional em PDF, anexe na conversa e envie.';
    if(!w)alert('O navegador bloqueou o WhatsApp. Libere pop-up e tente novamente.');
  }

  async function abrirProfissional(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return;}
    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O relatório profissional ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }
    const ok=await window.dfPdfResinasProfissional(f);
    const msg=document.getElementById('foVendMsg');
    if(ok&&msg)msg.textContent='WhatsApp cadastrado aberto e relatório profissional pronto. Salve em PDF, anexe na conversa e envie.';
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendPdfTest'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const f=forms()[0];
    if(!f){alert('Nenhuma formulação salva ainda.');return;}
    abrirProfissional(f);
    abrirWhatsCadastrado(f);
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