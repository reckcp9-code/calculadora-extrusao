(function(){
  'use strict';

  const TOKEN_KEY='df_secure_token_v2';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const DISMISS_KEY='df_install_dismiss_until_v1';
  let deferredPrompt=null;
  let showing=false;
  let promptedThisSession=false;

  function isIos(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isAndroid(){return /Android/i.test(navigator.userAgent)}

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || navigator.standalone===true;
  }

  function hasAccess(){
    return !!String(sessionStorage.getItem(TOKEN_KEY)||'').trim() || !!String(localStorage.getItem(ACCESS_KEY)||'').trim();
  }

  function appUnlocked(){
    const gate=document.getElementById('licenseGate');
    const app=document.getElementById('appContent');
    if(app){
      const s=getComputedStyle(app);
      if(s.display==='none' || s.visibility==='hidden')return false;
    }
    if(gate){
      const s=getComputedStyle(gate);
      if(s.display!=='none' && s.visibility!=='hidden')return false;
    }
    return hasAccess();
  }

  function dismissed(){
    const until=Number(localStorage.getItem(DISMISS_KEY)||0);
    return Number.isFinite(until) && Date.now()<until;
  }

  function dismissForDay(){
    try{localStorage.setItem(DISMISS_KEY,String(Date.now()+24*60*60*1000))}catch(e){}
    close();
  }

  function ensureHead(){
    if(!document.querySelector('link[rel="manifest"]')){
      const l=document.createElement('link');l.rel='manifest';l.href='./manifest.webmanifest';document.head.appendChild(l);
    }
    if(!document.querySelector('link[rel="apple-touch-icon"]')){
      const l=document.createElement('link');l.rel='apple-touch-icon';l.href='./logo.jpg.jpeg';document.head.appendChild(l);
    }
    const metas=[
      ['apple-mobile-web-app-capable','yes'],
      ['apple-mobile-web-app-status-bar-style','black-translucent'],
      ['apple-mobile-web-app-title','DF EXTRUSOR']
    ];
    metas.forEach(([name,content])=>{
      if(document.querySelector('meta[name="'+name+'"]'))return;
      const m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m);
    });
  }

  function close(){
    const el=document.getElementById('dfInstallOverlay');if(el)el.remove();
    showing=false;
  }

  function commonShell(title,body,buttonText){
    const overlay=document.createElement('div');
    overlay.id='dfInstallOverlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(3,7,18,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial';
    overlay.innerHTML='<div style="width:min(94vw,520px);background:#0f172a;border:1px solid #334155;border-radius:20px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.5);color:#f8fafc">'+
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><img src="./logo.jpg.jpeg" alt="DF" style="width:54px;height:54px;border-radius:14px;object-fit:cover;background:#111827"><div><div style="font-size:18px;font-weight:950">'+title+'</div><div style="font-size:12px;color:#94a3b8;margin-top:2px">DF EXTRUSOR PRO</div></div></div>'+
      '<div style="font-size:14px;line-height:1.5;color:#dbeafe;margin-bottom:14px">'+body+'</div>'+
      '<button id="dfInstallNow" style="width:100%;border:1px solid #16a34a;background:#064e2a;color:#bbf7d0;border-radius:12px;padding:13px;font-weight:950;cursor:pointer">'+buttonText+'</button>'+
      '<button id="dfInstallLater" style="width:100%;border:0;background:transparent;color:#94a3b8;padding:12px 8px 4px;font-weight:800;cursor:pointer">DEPOIS</button>'+
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('dfInstallLater').onclick=dismissForDay;
    showing=true;
    return overlay;
  }

  function showIosGuide(){
    if(showing||isStandalone()||dismissed()||promptedThisSession||!appUnlocked())return;
    promptedThisSession=true;
    commonShell(
      'Adicionar à Tela de Início',
      'No iPhone/iPad, o iOS não permite instalar automaticamente. Toque no botão abaixo para ver o passo a passo: <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.',
      'VER COMO INSTALAR'
    );
    document.getElementById('dfInstallNow').onclick=()=>{
      const b=document.getElementById('dfInstallNow');
      if(b){b.disabled=true;b.textContent='COMPARTILHAR → ADICIONAR À TELA DE INÍCIO';}
      const card=b&&b.parentElement;
      if(card){
        const help=document.createElement('div');
        help.style.cssText='margin-top:12px;background:#07101f;border:1px solid #2563eb;border-radius:12px;padding:12px;color:#bfdbfe;font-size:13px;line-height:1.5;text-align:left';
        help.innerHTML='<b>1.</b> Toque no botão <b>Compartilhar</b> do Safari (quadrado com seta para cima).<br><b>2.</b> Escolha <b>Adicionar à Tela de Início</b>.<br><b>3.</b> Toque em <b>Adicionar</b>.';
        card.insertBefore(help,document.getElementById('dfInstallLater'));
      }
    };
  }

  function showInstallPrompt(){
    if(showing||isStandalone()||dismissed()||promptedThisSession||!appUnlocked())return;
    if(isIos()){showIosGuide();return}
    if(!deferredPrompt)return;
    promptedThisSession=true;
    commonShell(
      'Instalar DF EXTRUSOR',
      isAndroid()?'Instale o DF EXTRUSOR na tela inicial para abrir como aplicativo.':'Instale o DF EXTRUSOR no computador para abrir pelo ícone como aplicativo.',
      'INSTALAR DF EXTRUSOR'
    );
    document.getElementById('dfInstallNow').onclick=async()=>{
      const p=deferredPrompt;
      if(!p)return;
      const b=document.getElementById('dfInstallNow');if(b){b.disabled=true;b.textContent='ABRINDO INSTALAÇÃO...'}
      try{
        await p.prompt();
        const choice=await p.userChoice;
        deferredPrompt=null;
        if(choice&&choice.outcome==='accepted')close();
        else{if(b){b.disabled=false;b.textContent='INSTALAR DF EXTRUSOR'}}
      }catch(e){if(b){b.disabled=false;b.textContent='INSTALAR DF EXTRUSOR'}}
    };
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    setTimeout(showInstallPrompt,250);
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    try{localStorage.removeItem(DISMISS_KEY)}catch(e){}
    close();
  });

  function watchAccess(){
    if(isStandalone())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(appUnlocked()){
        if(isIos())showIosGuide();else showInstallPrompt();
      }
      if(tries>180||isStandalone())clearInterval(timer);
    },500);
  }

  function init(){
    ensureHead();
    watchAccess();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&appUnlocked()){if(isIos())showIosGuide();else showInstallPrompt()}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
