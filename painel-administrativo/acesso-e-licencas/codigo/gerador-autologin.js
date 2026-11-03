(function(){
  'use strict';

  const KEY='df_access_admin_secret_saved_v1';
  let tried=false;

  function setHidden(secretInput,remember,hidden){
    const label=secretInput&&secretInput.previousElementSibling;
    const help=remember&&remember.parentElement&&remember.parentElement.nextElementSibling;
    if(secretInput)secretInput.style.display=hidden?'none':'';
    if(label&&label.tagName==='LABEL')label.style.display=hidden?'none':'';
    if(remember&&remember.parentElement)remember.parentElement.style.display=hidden?'none':'';
    if(help&&help.classList&&help.classList.contains('sub'))help.style.display=hidden?'none':'';

    let badge=document.getElementById('dfAdminAutoBadge');
    if(hidden){
      if(!badge){
        badge=document.createElement('div');
        badge.id='dfAdminAutoBadge';
        badge.style.cssText='margin:10px 0 2px;padding:10px 12px;border:1px solid #166534;background:#052e16;color:#bbf7d0;border-radius:12px;font-size:12px;font-weight:900;text-align:center';
        badge.textContent='🔓 ACESSO AUTOMÁTICO NESTE APARELHO';
        const statusBtn=document.getElementById('statusBtn');
        if(statusBtn&&statusBtn.parentNode)statusBtn.parentNode.insertBefore(badge,statusBtn);
      }
    }else if(badge){badge.remove()}
  }

  function reveal(secretInput,remember){
    setHidden(secretInput,remember,false);
    try{localStorage.removeItem(KEY)}catch(e){}
    if(secretInput){secretInput.value='';secretInput.focus()}
    if(remember)remember.checked=true;
  }

  function restore(){
    if(tried)return;
    const secretInput=document.getElementById('secret');
    const remember=document.getElementById('rememberSecret');
    const statusBtn=document.getElementById('statusBtn');
    const statusMsg=document.getElementById('statusMsg');
    if(!secretInput||!remember||!statusBtn)return;

    tried=true;
    let saved='';
    try{saved=String(localStorage.getItem(KEY)||'').trim()}catch(e){}

    if(!saved)return;

    secretInput.value=saved;
    remember.checked=true;
    setHidden(secretInput,remember,true);

    // Usa somente a credencial já salva neste aparelho. Nada é colocado no código público.
    setTimeout(function(){
      try{statusBtn.click()}catch(e){}
    },100);

    // Se a credencial salva deixou de funcionar, mostra o campo novamente para recuperar o acesso.
    setTimeout(function(){
      if(statusMsg&&statusMsg.classList.contains('bad'))reveal(secretInput,remember);
    },1800);
  }

  function watch(){
    restore();
    if(tried)return;
    let n=0;
    const timer=setInterval(function(){
      restore();
      n++;
      if(tried||n>40)clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);
  else watch();
})();
