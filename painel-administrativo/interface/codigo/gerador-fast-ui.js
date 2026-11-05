(function(){
  'use strict';

  const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
  let activeRequests=0;
  let hideTimer=null;
  let lastActionAt=0;

  function ensureStyle(){
    if(document.getElementById('dfAdminFastStyle'))return;
    const st=document.createElement('style');
    st.id='dfAdminFastStyle';
    st.textContent=[
      '#dfAdminFastStatus{position:fixed;z-index:999999;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);min-width:190px;max-width:calc(100vw - 24px);padding:10px 14px;border:1px solid #334155;border-radius:999px;background:#0f172af2;color:#e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,.35);font:900 12px system-ui;text-align:center;letter-spacing:.02em;opacity:0;pointer-events:none;transition:opacity .12s ease,transform .12s ease}',
      '#dfAdminFastStatus.on{opacity:1;transform:translateX(-50%) translateY(2px)}',
      '#dfAdminFastStatus.busy{border-color:#f59e0b;color:#fde68a;background:#241600f2}',
      '#dfAdminFastStatus.ok{border-color:#22c55e;color:#bbf7d0;background:#052e16f2}',
      '#dfAdminFastStatus.bad{border-color:#ef4444;color:#fecaca;background:#450a0af2}',
      '.dfAdminChecking{filter:brightness(1.08);box-shadow:0 0 0 2px rgba(245,158,11,.18)!important}',
      '@media(max-width:560px){#dfAdminFastStatus{font-size:11px;min-width:170px;padding:9px 12px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function box(){
    ensureStyle();
    let el=document.getElementById('dfAdminFastStatus');
    if(!el){
      el=document.createElement('div');
      el.id='dfAdminFastStatus';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function show(text,kind,hold){
    clearTimeout(hideTimer);
    const el=box();
    el.textContent=text;
    el.className='on '+(kind||'busy');
    if(hold){
      hideTimer=setTimeout(function(){
        if(activeRequests===0)el.className='';
      },hold);
    }
  }

  function actionText(btn){
    const t=String(btn&&btn.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
    if(!t)return '⏳ VERIFICANDO...';
    if(t.includes('PAUSAR'))return '⏳ VERIFICANDO PAUSA...';
    if(t.includes('REATIVAR'))return '⏳ VERIFICANDO REATIVAÇÃO...';
    if(t.includes('RESET'))return '⏳ VERIFICANDO RESET...';
    if(t.includes('EXCLUIR')||t.includes('APAGAR'))return '⏳ VERIFICANDO EXCLUSÃO...';
    if(t.includes('SALVAR NOME'))return '⏳ VERIFICANDO NOME...';
    if(t.includes('DEFINIR DIAS')||t.includes('PRAZO'))return '⏳ VERIFICANDO PRAZO...';
    if(t.includes('NOTIF'))return '⏳ VERIFICANDO NOTIFICAÇÃO...';
    if(t.includes('GERAR')||t.includes('CRIAR'))return '⏳ VERIFICANDO E GERANDO...';
    if(t.includes('ATUALIZAR')||t.includes('STATUS')||t.includes('VERIFICAR'))return '⏳ VERIFICANDO...';
    if(t.includes('COPIAR'))return '📋 COPIANDO...';
    return '⏳ VERIFICANDO...';
  }

  function isActionButton(btn){
    if(!btn||btn.disabled)return false;
    if(btn.matches('[data-copy]'))return true;
    const t=String(btn.textContent||'').toUpperCase();
    return /PAUSAR|REATIVAR|RESET|EXCLUIR|APAGAR|SALVAR|DEFINIR|GERAR|CRIAR|ATUALIZAR|STATUS|VERIFICAR|COPIAR/.test(t) || !!btn.id;
  }

  document.addEventListener('pointerdown',function(e){
    const btn=e.target&&e.target.closest?e.target.closest('button'):null;
    if(!isActionButton(btn))return;
    lastActionAt=Date.now();
    btn.classList.add('dfAdminChecking');
    show(actionText(btn),'busy',2200);
    setTimeout(function(){btn.classList.remove('dfAdminChecking')},900);
  },true);

  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    let u=null;
    try{u=new URL(typeof input==='string'?input:input.url,location.href)}catch(e){}
    const adminCall=!!(u&&u.hostname===API_HOST&&u.pathname.startsWith('/admin/'));
    if(!adminCall)return originalFetch(input,init);

    activeRequests++;
    if(Date.now()-lastActionAt>700)show('⏳ VERIFICANDO NO SERVIDOR...','busy');
    const started=performance.now();
    try{
      const r=await originalFetch(input,init);
      const ms=Math.round(performance.now()-started);
      if(r.ok)show('✅ RESPOSTA RECEBIDA • '+ms+' ms','ok',950);
      else show('⚠️ SERVIDOR RESPONDEU '+r.status,'bad',1800);
      return r;
    }catch(e){
      show('❌ FALHA DE CONEXÃO • TENTE NOVAMENTE','bad',2200);
      throw e;
    }finally{
      activeRequests=Math.max(0,activeRequests-1);
    }
  };

  function preconnect(){
    try{
      if(!document.querySelector('link[data-df-admin-preconnect]')){
        const l=document.createElement('link');
        l.rel='preconnect';
        l.href='https://'+API_HOST;
        l.crossOrigin='anonymous';
        l.dataset.dfAdminPreconnect='1';
        document.head.appendChild(l);
      }
    }catch(e){}
  }

  function init(){
    preconnect();
    show('⚡ PAINEL PRONTO','ok',800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
