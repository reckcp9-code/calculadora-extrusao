(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfBetaLaunchStyle'))return;
    const st=document.createElement('style');
    st.id='dfBetaLaunchStyle';
    st.textContent=[
      '.dfBetaBox{border:1px solid #f59e0b;background:linear-gradient(180deg,#241600,#15100a);border-radius:16px;padding:12px 14px;color:#fde68a;box-shadow:0 10px 28px rgba(0,0,0,.18)}',
      '.dfBetaBox strong{display:block;color:#facc15;font-size:13px;letter-spacing:.03em}',
      '.dfBetaBox span{display:block;margin-top:4px;color:#f8fafc;font-size:12px;line-height:1.42}',
      '.dfBetaBox small{display:block;margin-top:6px;color:#cbd5e1;font-size:10px;line-height:1.35}',
      '#dfBetaApp{margin:-4px 0 10px}',
      '#dfBetaGate{margin:12px 0 4px;text-align:left}',
      '@media(max-width:560px){.dfBetaBox{padding:10px 11px}.dfBetaBox strong{font-size:12px}.dfBetaBox span{font-size:11px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function html(){
    return '<strong>🎁 PERÍODO BETA — ACESSO GRATUITO</strong>'+ 
      '<span>Use o DF EXTRUSOR PRO normalmente enquanto estamos aperfeiçoando o sistema.</span>'+ 
      '<small>Usuários atuais terão condição especial quando o lançamento oficial acontecer.</small>';
  }

  function ensureGate(){
    const box=document.querySelector('#licenseGate .licenseBox');
    if(!box)return;
    let beta=$('dfBetaGate');
    if(!beta){
      beta=document.createElement('div');
      beta.id='dfBetaGate';
      beta.className='dfBetaBox';
      beta.innerHTML=html();
    }
    const msg=$('licenseMsg');
    if(msg&&beta.parentNode!==box)msg.insertAdjacentElement('beforebegin',beta);
    else if(beta.parentNode!==box)box.appendChild(beta);
  }

  function ensureApp(){
    const app=$('appContent');
    if(!app)return;
    const brand=app.querySelector('.brand');
    if(!brand)return;
    let beta=$('dfBetaApp');
    if(!beta){
      beta=document.createElement('div');
      beta.id='dfBetaApp';
      beta.className='dfBetaBox';
      beta.innerHTML=html();
    }
    if(beta.previousElementSibling!==brand)brand.insertAdjacentElement('afterend',beta);
  }

  function ensure(){addStyle();ensureGate();ensureApp()}

  function init(){
    ensure();
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensure()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
