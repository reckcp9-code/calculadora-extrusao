(function(){
  'use strict';

  const KEY='df_access_admin_secret_saved_v1';
  let tried=false;

  function restore(){
    if(tried)return;
    const secretInput=document.getElementById('secret');
    const remember=document.getElementById('rememberSecret');
    const statusBtn=document.getElementById('statusBtn');
    if(!secretInput||!remember||!statusBtn)return;

    tried=true;
    let saved='';
    try{saved=String(localStorage.getItem(KEY)||'').trim()}catch(e){}

    if(!saved)return;

    secretInput.value=saved;
    remember.checked=true;

    // Entra automaticamente no painel usando a senha já salva neste aparelho.
    // A senha continua somente no localStorage do próprio navegador/aparelho.
    setTimeout(function(){
      try{statusBtn.click()}catch(e){}
    },120);
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
