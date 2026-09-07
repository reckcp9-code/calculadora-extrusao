(function(){
  'use strict';

  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const KEY_PDF_AUTO='df_vendedor_pdf_auto_v1';
  const KEY_PDF_PRO='df_vendedor_pdf_auto_prof_v1';
  const OLD_DEFAULT='5547992825006';
  const MIGRATION='df_whatsapp_default_removed_v1';

  function $(id){return document.getElementById(id)}
  function digits(v){return String(v||'').replace(/\D/g,'')}
  function normalize(v){
    let d=digits(v);
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }
  function valid(v){return /^55\d{10,11}$/.test(String(v||''))}

  function removeOldDefault(){
    try{
      const current=digits(localStorage.getItem(KEY_NUM)||'');
      if(current===OLD_DEFAULT)localStorage.removeItem(KEY_NUM);
      ['df_vendedor_whatsapp','df_whatsapp_vendedor','vendedorWhatsapp'].forEach(function(k){
        if(digits(localStorage.getItem(k)||'')===OLD_DEFAULT)localStorage.removeItem(k);
      });
      localStorage.setItem(MIGRATION,'1');
    }catch(e){}
  }

  function disableAutoIfNoNumber(){
    let phone='';
    try{phone=normalize(localStorage.getItem(KEY_NUM)||'')}catch(e){}
    if(valid(phone))return;
    try{
      localStorage.setItem(KEY_AUTO,'0');
      localStorage.setItem(KEY_PDF_AUTO,'0');
      localStorage.setItem(KEY_PDF_PRO,'0');
    }catch(e){}
  }

  function saveNumber(showMessage){
    const input=$('foVendWhats');
    if(!input)return false;
    const raw=String(input.value||'').trim();
    const phone=normalize(raw);
    const msg=$('foVendMsg');

    if(!raw){
      try{localStorage.removeItem(KEY_NUM)}catch(e){}
      input.value='';
      disableAutoIfNoNumber();
      if(showMessage&&msg)msg.textContent='Número removido. Digite o WhatsApp que deseja usar e toque em SALVAR NÚMERO.';
      return false;
    }

    if(!valid(phone)){
      if(showMessage)alert('Digite um WhatsApp válido com DDD. Ex.: 47999999999.');
      return false;
    }

    try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
    input.value=phone.startsWith('55')?phone.slice(2):phone;
    if(showMessage&&msg)msg.textContent='WhatsApp salvo neste aparelho. Os próximos envios usarão este número.';
    return true;
  }

  function ensureUi(){
    removeOldDefault();
    disableAutoIfNoNumber();

    const input=$('foVendWhats');
    if(!input)return;

    const currentStored=normalize(localStorage.getItem(KEY_NUM)||'');
    const currentField=normalize(input.value||'');

    if(currentField===OLD_DEFAULT||!valid(currentStored)){
      if(currentField===OLD_DEFAULT||!currentStored)input.value='';
    }else if(valid(currentStored)&&currentField!==currentStored){
      input.value=currentStored.startsWith('55')?currentStored.slice(2):currentStored;
    }

    input.placeholder='Ex.: 47999999999';
    input.autocomplete='tel';

    if(!input.dataset.dfUserNumberBound){
      input.dataset.dfUserNumberBound='1';
      input.addEventListener('input',function(){
        const raw=String(input.value||'').trim();
        if(!raw){try{localStorage.removeItem(KEY_NUM)}catch(e){};disableAutoIfNoNumber();return;}
        const phone=normalize(raw);
        if(valid(phone)){try{localStorage.setItem(KEY_NUM,phone)}catch(e){}}
      },true);
      input.addEventListener('change',function(){saveNumber(false)},true);
    }

    if(!$('foVendSaveNumber')){
      const btn=document.createElement('button');
      btn.id='foVendSaveNumber';
      btn.type='button';
      btn.className='calcBtn alt dfVendedorMini';
      btn.textContent='SALVAR NÚMERO';
      btn.style.marginTop='8px';
      btn.addEventListener('click',function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        saveNumber(true);
      });
      input.insertAdjacentElement('afterend',btn);
    }

    const hint=$('dfWhatsUserHint');
    if(!hint){
      const div=document.createElement('div');
      div.id='dfWhatsUserHint';
      div.className='smallNote';
      div.style.marginTop='6px';
      div.textContent='Cada usuário cadastra e salva o próprio número neste aparelho. Nenhum número vem preenchido por padrão.';
      const btn=$('foVendSaveNumber');
      if(btn)btn.insertAdjacentElement('afterend',div);
    }
  }

  function guardActions(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendTest,#foVendPdfTest'):null;
    if(!btn)return;
    const input=$('foVendWhats');
    const phone=normalize(input&&input.value||localStorage.getItem(KEY_NUM)||'');
    if(valid(phone)){
      try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    alert('Digite e salve o WhatsApp com DDD antes de enviar.');
    if(input)input.focus();
  }

  function init(){
    removeOldDefault();
    disableAutoIfNoNumber();
    ensureUi();
    setTimeout(ensureUi,200);
    setTimeout(ensureUi,600);
    setTimeout(ensureUi,1200);
    document.addEventListener('click',guardActions,true);
    try{
      const observer=new MutationObserver(function(){setTimeout(ensureUi,20)});
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
