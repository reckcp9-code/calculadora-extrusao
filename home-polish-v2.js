(function(){
  'use strict';

  const PROD_DEST='./op-producao.html?v=20261005-producao-integrada-v279';

  function addStyle(){
    if(document.getElementById('dfHomePolishV2Style'))return;
    const st=document.createElement('style');
    st.id='dfHomePolishV2Style';
    st.textContent=`
      /* Banner beta removido somente da tela principal. */
      #dfBetaApp{display:none!important}

      /* Botoes principais maiores, mantendo o layout compacto. */
      #appContent > .tabs{
        gap:10px!important;
        padding:8px!important;
        border:1px solid #2f3b4e!important;
        border-radius:18px!important;
        background:#090d14f2!important;
      }
      #appContent > .tabs > .tab{
        min-height:64px!important;
        padding:14px 7px!important;
        border:2px solid #40516b!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,#162033 0%,#111827 100%)!important;
        color:#d8e1ee!important;
        font-size:12px!important;
        font-weight:950!important;
        letter-spacing:.02em!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 5px 14px rgba(0,0,0,.20)!important;
      }
      #appContent > .tabs > .tab.on{
        border-color:#f5a000!important;
        background:linear-gradient(180deg,#2d1d04 0%,#211400 100%)!important;
        color:#ffd36a!important;
        box-shadow:inset 0 0 0 1px rgba(245,160,0,.20),0 5px 16px rgba(245,160,0,.10)!important;
      }
      #appContent > .tabs > .tab:active{transform:scale(.97)!important}
      #appContent > .tabs > #btPr{grid-column:1 / -1!important;width:100%!important;min-height:68px!important}

      /* Produção fica pré-carregada sobre o app para abrir sem salto/reload. */
      #dfProductionFrame{
        position:fixed!important;
        inset:0!important;
        width:100vw!important;
        height:100dvh!important;
        min-height:100vh!important;
        border:0!important;
        margin:0!important;
        padding:0!important;
        background:#080b13!important;
        z-index:2147483000!important;
        opacity:0!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }
      #dfProductionFrame.dfProductionOpen{
        opacity:1!important;
        visibility:visible!important;
        pointer-events:auto!important;
      }

      @media(max-width:560px){
        #appContent > .tabs{gap:8px!important;padding:7px!important}
        #appContent > .tabs > .tab{
          min-height:62px!important;
          padding:12px 4px!important;
          font-size:11.5px!important;
          border-width:2px!important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function removeHomeBeta(){
    const beta=document.getElementById('dfBetaApp');
    if(beta)beta.remove();
  }

  let productionOpening=false;
  let productionTimer=0;
  let productionDisposeTimer=0;
  let productionPreloadScheduled=false;

  function scheduleProductionDispose(delay){
    clearTimeout(productionDisposeTimer);
    productionDisposeTimer=setTimeout(function(){
      const frame=document.getElementById('dfProductionFrame');
      if(!frame||frame.classList.contains('dfProductionOpen')||productionOpening)return;
      try{frame.src='about:blank'}catch(_e){}
      frame.remove();
    },Math.max(15000,Number(delay)||30000));
  }

  function scheduleProductionPreload(){
    if(productionPreloadScheduled||document.getElementById('dfProductionFrame'))return;
    productionPreloadScheduled=true;
    const run=function(){
      productionPreloadScheduled=false;
      if(document.hidden)return;
      const frame=ensureProductionFrame();
      if(frame&&frame.dataset.loaded!=='1')scheduleProductionDispose(45000);
    };
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:4500});
    else setTimeout(run,2600);
  }

  function ensureProductionFrame(){
    clearTimeout(productionDisposeTimer);
    let frame=document.getElementById('dfProductionFrame');
    if(frame)return frame;
    frame=document.createElement('iframe');
    frame.id='dfProductionFrame';
    frame.title='Produção — DF Extrusor Pro';
    frame.setAttribute('aria-label','Produção — DF Extrusor Pro');
    frame.src=PROD_DEST;
    frame.dataset.loaded='0';
    frame.addEventListener('load',function(){
      frame.dataset.loaded='1';
      if(productionOpening)showProductionFrame(frame);
      else scheduleProductionDispose(45000);
    });
    document.body.appendChild(frame);
    return frame;
  }

  function showProductionFrame(frame){
    clearTimeout(productionTimer);
    clearTimeout(productionDisposeTimer);
    productionOpening=false;
    window.__dfHomeScrollY=window.scrollY||0;
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    frame.classList.add('dfProductionOpen');
    frame.setAttribute('aria-hidden','false');
    try{frame.contentWindow.postMessage({type:'DF_PRODUCTION_SHOW'},location.origin)}catch(_e){}
  }

  function hideProductionFrame(){
    const frame=document.getElementById('dfProductionFrame');
    if(!frame)return;
    productionOpening=false;
    clearTimeout(productionTimer);
    frame.classList.remove('dfProductionOpen');
    frame.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    const y=Number(window.__dfHomeScrollY)||0;
    requestAnimationFrame(function(){window.scrollTo(0,y)});
    scheduleProductionDispose(30000);
  }

  function goProduction(e){
    if(e){
      try{e.preventDefault()}catch(_e){}
      try{e.stopPropagation()}catch(_e){}
      try{e.stopImmediatePropagation()}catch(_e){}
    }
    const frame=ensureProductionFrame();
    if(frame.dataset.loaded==='1'){
      showProductionFrame(frame);
      return;
    }
    productionOpening=true;
    /* Mantém a tela atual visível até a Produção terminar de carregar. */
    productionTimer=setTimeout(function(){
      if(frame.dataset.loaded!=='1'){
        productionOpening=false;
        location.href=PROD_DEST;
      }
    },5000);
  }

  function installProductionButton(){
    const tabs=document.querySelector('#appContent > .tabs');
    if(!tabs)return false;
    let b=document.getElementById('btPr');
    if(!b){
      b=document.createElement('button');
      b.id='btPr';
      b.className='tab';
      b.type='button';
      b.textContent='PRODUÇÃO';
      tabs.appendChild(b);
    }
    b.setAttribute('aria-label','Produção — OP de produção');
    b.onclick=goProduction;
    return true;
  }

  function sync(){
    addStyle();
    removeHomeBeta();
    installProductionButton();
    /* Precarrega somente quando o navegador estiver ocioso, sem disputar o boot. */
    scheduleProductionPreload();
  }

  window.addEventListener('message',function(e){
    if(e.origin!==location.origin)return;
    if(e.data&&e.data.type==='DF_PRODUCTION_CLOSE')hideProductionFrame();
  });

  document.addEventListener('click',function(e){
    const b=e.target&&e.target.closest?e.target.closest('#btPr'):null;
    if(b)goProduction(e);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
  window.addEventListener('df-ui-ready',sync);
  setTimeout(sync,150);
  setTimeout(sync,700);
  setTimeout(sync,1600);
})();
