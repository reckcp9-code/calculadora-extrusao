(function(){
  'use strict';

  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const KEY_PDF_AUTO='df_vendedor_pdf_auto_v1';
  const KEY_PDF_PRO='df_vendedor_pdf_auto_prof_v1';
  const OLD_DEFAULT='5547992825006';

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
      if(digits(localStorage.getItem(KEY_NUM)||'')===OLD_DEFAULT)localStorage.removeItem(KEY_NUM);
      ['df_vendedor_whatsapp','df_whatsapp_vendedor','vendedorWhatsapp'].forEach(function(k){
        if(digits(localStorage.getItem(k)||'')===OLD_DEFAULT)localStorage.removeItem(k);
      });
    }catch(e){}
  }

  function storedPhone(){
    try{return normalize(localStorage.getItem(KEY_NUM)||'')}catch(e){return''}
  }

  function disableAutoIfNoNumber(){
    if(valid(storedPhone()))return;
    try{
      localStorage.setItem(KEY_AUTO,'0');
      localStorage.setItem(KEY_PDF_AUTO,'0');
      localStorage.setItem(KEY_PDF_PRO,'0');
    }catch(e){}
    const a=$('foVendAuto'),p=$('foVendPdfAuto');
    if(a)a.checked=false;
    if(p)p.checked=false;
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

    const saved=storedPhone();
    const shown=normalize(input.value||'');
    if(shown===OLD_DEFAULT){
      input.value='';
    }else if(valid(saved)){
      const local=saved.startsWith('55')?saved.slice(2):saved;
      if(String(input.value||'').trim()!==local)input.value=local;
    }else if(!saved){
      input.value='';
    }

    input.placeholder='Ex.: 47999999999';
    input.autocomplete='tel';

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

    if(!$('dfWhatsUserHint')){
      const div=document.createElement('div');
      div.id='dfWhatsUserHint';
      div.className='smallNote';
      div.style.marginTop='6px';
      div.textContent='Cada usuário cadastra e salva o próprio número neste aparelho. Nenhum número vem preenchido por padrão.';
      const btn=$('foVendSaveNumber');
      if(btn)btn.insertAdjacentElement('afterend',div);
    }
  }

  function capturePhoneEdit(ev){
    const input=ev.target;
    if(!input||input.id!=='foVendWhats')return;
    ev.stopImmediatePropagation();
    const raw=String(input.value||'').trim();
    if(!raw){
      try{localStorage.removeItem(KEY_NUM)}catch(e){}
      disableAutoIfNoNumber();
      return;
    }
    const phone=normalize(raw);
    if(valid(phone)){
      try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
    }
  }

  function captureAutoChange(ev){
    const el=ev.target;
    if(!el||!['foVendAuto','foVendPdfAuto'].includes(el.id))return;
    ev.stopImmediatePropagation();
    const phone=normalize(($('foVendWhats')&&$('foVendWhats').value)||storedPhone());
    if(el.checked&&!valid(phone)){
      el.checked=false;
      alert('Digite e salve um WhatsApp com DDD antes de ativar o envio automático.');
      const input=$('foVendWhats');if(input)input.focus();
      return;
    }
    if(valid(phone))try{localStorage.setItem(KEY_NUM,phone)}catch(e){}
    try{
      if(el.id==='foVendAuto')localStorage.setItem(KEY_AUTO,el.checked?'1':'0');
      if(el.id==='foVendPdfAuto'){
        localStorage.setItem(KEY_PDF_AUTO,'0');
        localStorage.setItem(KEY_PDF_PRO,el.checked?'1':'0');
      }
    }catch(e){}
  }

  function guardActions(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('#foVendTest,#foVendPdfTest'):null;
    if(!btn)return;
    const input=$('foVendWhats');
    const phone=normalize((input&&input.value)||storedPhone());
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
    document.addEventListener('input',capturePhoneEdit,true);
    document.addEventListener('change',function(ev){capturePhoneEdit(ev);captureAutoChange(ev)},true);
    document.addEventListener('click',guardActions,true);
    try{
      const observer=new MutationObserver(function(){setTimeout(ensureUi,20)});
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
