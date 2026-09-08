(function(){
  'use strict';

  const ACCESS_KEY='df_auto_access_credential_v1';

  function hasCredential(){
    try{return !!String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){return false}
  }

  function setMessage(text,ok){
    const e=document.getElementById('licenseMsg');
    if(!e)return;
    e.textContent=text;
    e.className='licenseMsg '+(ok?'ok':'err');
  }

  function unlock(){
    try{
      if(typeof window.dfUnlocked==='function')window.dfUnlocked();
      else{
        const gate=document.getElementById('licenseGate');
        const app=document.getElementById('appContent');
        if(gate)gate.style.display='none';
        if(app)app.style.display='block';
      }
    }catch(e){}
  }

  function cleanGeneralParam(){
    try{
      const u=new URL(location.href);
      if(String(u.searchParams.get('acesso')||'').toLowerCase()!=='geral')return;
      u.searchParams.delete('acesso');
      history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||''));
    }catch(e){}
  }

  function hideVerification(){
    if(!hasCredential())return;
    const wrap=document.getElementById('dfAccessIdentityWrap');
    const key=document.getElementById('licenseKey');
    if(wrap)wrap.style.display='none';
    if(key)key.style.display='none';
  }

  function replaceOldText(){
    try{
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;
      while((n=walker.nextNode())){
        if(n.nodeValue&&n.nodeValue.includes('O vínculo é feito pelo ID deste aparelho no LicenseAuth.')){
          n.nodeValue=n.nodeValue.replace('O vínculo é feito pelo ID deste aparelho no LicenseAuth.','O vínculo é controlado pelo sistema DF EXTRUSOR.');
        }
      }
    }catch(e){}
  }

  function guard(){
    replaceOldText();
    if(!hasCredential())return;

    // A renovação da sessão pertence exclusivamente ao auto-access.js.
    // Antes este arquivo também chamava /access/session no boot, criando duas
    // restaurações concorrentes, mais tráfego e estados visuais diferentes.
    hideVerification();
    cleanGeneralParam();
    unlock();
    setMessage('Acesso salvo restaurado.',true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guard,{once:true});
  else guard();
})();
