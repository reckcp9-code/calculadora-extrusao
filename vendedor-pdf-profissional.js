(function(){
  'use strict';
  const OLD_KEY='df_vendedor_pdf_auto_v1';
  const PRO_KEY='df_vendedor_pdf_auto_prof_v1';
  const KEY_NUM='df_vendedor_whats_num_v1';
  const LEGACY_KEYS=['df_vendedor_whatsapp','df_whatsapp_vendedor','vendedorWhatsapp'];
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};

  try{localStorage.setItem(OLD_KEY,'0')}catch(e){}

  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }

  function phoneFromField(){
    const el=document.getElementById('foVendWhats');
    return normalizePhone(el&&el.value);
  }

  function syncPhone(){
    let phone=phoneFromField();
    if(!phone){
      try{phone=normalizePhone(localStorage.getItem(KEY_NUM)||'')}catch(e){}
    }
    if(!phone){
      for(const k of LEGACY_KEYS){
        try{phone=normalizePhone(localStorage.getItem(k)||'')}catch(e){}
        if(phone)break;
      }
    }
    if(phone){
      try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
      const el=document.getElementById('foVendWhats');
      if(el&&normalizePhone(el.value)!==phone)el.value=phone;
    }
    return phone;
  }

  function validPhone(phone){
    return /^55\d{10,11}$/.test(String(phone||''));
  }

  function whatsUrl(f,phone){
    const texto='Segue o PDF da formulação '+String(f?.nome||'Formulação')+'.';
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(mobile)return 'https://wa.me/'+phone+'?text='+encodeURIComponent(texto);
    return 'https://web.whatsapp.com/send?phone='+phone+'&text='+encodeURIComponent(texto);
  }

  function prepararJanelaPdf(){
    const w=window.open('about:blank','df_resinas_pdf');
    if(!w)return null;
    try{
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f3f4f6;color:#111}.box{background:#fff;border:1px solid #bbb;padding:24px 30px;border-radius:6px;font-weight:700}</style></head><body><div class="box">Gerando relatório A4...</div></body></html>');
      w.document.close();
    }catch(e){}
    return w;
  }

  async function enviarPdfUltima(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return;}

    const phone=syncPhone();
    if(!validPhone(phone)){
      alert('Cadastre o WhatsApp com DDD antes de enviar o PDF. Ex.: 47999999999.');
      const el=document.getElementById('foVendWhats');
      if(el)el.focus();
      return;
    }

    if(typeof window.dfPdfResinasProfissional!=='function'){
      alert('O relatório profissional ainda está carregando. Tente novamente em alguns segundos.');
      return;
    }

    const pdfWin=prepararJanelaPdf();
    if(!pdfWin){
      alert('O navegador bloqueou a janela do PDF. Libere pop-up para este site e tente novamente.');
      return;
    }

    const msg=document.getElementById('foVendMsg');
    if(msg)msg.textContent='Gerando relatório e abrindo direto o WhatsApp cadastrado...';

    const ok=await window.dfPdfResinasProfissional(f,pdfWin);
    if(!ok){try{pdfWin.close()}catch(e){} return;}

    if(msg)msg.textContent='Relatório pronto. Abrindo a conversa do número cadastrado: '+phone+'.';

    window.location.href=whatsUrl(f,phone);
  }

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
    syncPhone();
    enviarPdfUltima(forms()[0]);
  },true);

  document.addEventListener('input',function(ev){
    if(ev.target&&ev.target.id==='foVendWhats')syncPhone();
  },true);
  document.addEventListener('change',function(ev){
    if(ev.target&&ev.target.id==='foVendWhats')syncPhone();
  },true);

  function ajustarAuto(){
    syncPhone();
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
  function initLast(){const f=forms()[0];lastId=f?String(f.id):'';syncPhone();}
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

  window.dfGetVendedorWhats=syncPhone;
  window.dfEnviarPdfUltima=enviarPdfUltima;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initLast();setTimeout(ajustarAuto,500)});
  else{initLast();setTimeout(ajustarAuto,500)}
  setInterval(watchNew,700);
})();
