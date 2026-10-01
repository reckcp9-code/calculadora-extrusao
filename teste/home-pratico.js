(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomePraticoTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomePraticoTestStyle';
    s.textContent=`
      /* TESTE V3 — visual industrial premium, uma única cor de destaque */
      :root{--df-bg:#080b12;--df-panel:#0d1420;--df-card:#111a27;--df-line:#2a3647;--df-line2:#37465b;--df-text:#f4f7fb;--df-muted:#8e9bae;--df-accent:#f2b21b;--df-accent-soft:#2a210d}
      body{padding-bottom:24px!important;background:var(--df-bg)!important}

      body.dfHomeCompact .brand,
      body:not(.dfSectionMode) .brand{
        padding:12px 12px 14px!important;
        margin:2px 0 14px!important;
        border-radius:18px!important;
        background:#06080d!important;
        border:1px solid #202a38!important;
        box-shadow:0 14px 34px rgba(0,0,0,.28)!important;
      }
      body.dfHomeCompact .brand .logo,
      body:not(.dfSectionMode) .brand .logo{
        width:min(158px,48vw)!important;
        margin-bottom:4px!important;
        border-radius:10px!important;
      }
      body.dfHomeCompact .brand .tag,
      body:not(.dfSectionMode) .brand .tag{
        padding:4px 9px!important;
        font-size:9px!important;
        margin-top:2px!important;
        color:#e8c15d!important;
        background:#17130a!important;
        border-color:#6a5318!important;
      }
      body.dfHomeCompact .brand h1,
      body:not(.dfSectionMode) .brand h1{
        font-size:25px!important;
        margin:9px 0 4px!important;
        letter-spacing:-.45px!important;
      }
      body.dfHomeCompact .brand .sub,
      body:not(.dfSectionMode) .brand .sub{
        font-size:10px!important;
        line-height:1.25!important;
        color:#7f8ca0!important;
        letter-spacing:.02em!important;
      }

      #dfHomeLead{margin:0 2px 9px;padding:0 2px}
      #dfHomeLead b{display:block;font-size:18px;color:var(--df-text);line-height:1.15;letter-spacing:-.2px}
      #dfHomeLead span{display:block;margin-top:3px;font-size:10.5px;color:var(--df-muted);font-weight:650}
      #dfHomeLead em{display:none!important}

      body.dfHomeCompact #appContent>.tabs,
      body:not(.dfSectionMode) #appContent>.tabs{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:10px!important;
        padding:9px!important;
        margin:0 0 11px!important;
        border-radius:18px!important;
        background:#0a1019!important;
        border:1px solid #253143!important;
        position:relative!important;
        top:auto!important;
        box-shadow:0 12px 30px rgba(0,0,0,.22)!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab,
      body:not(.dfSectionMode) #appContent>.tabs .tab{
        min-height:104px!important;
        border:1px solid var(--df-line)!important;
        border-radius:14px!important;
        padding:14px 10px 12px!important;
        font-size:14.5px!important;
        line-height:1.08!important;
        letter-spacing:.025em!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:flex-start!important;
        justify-content:center!important;
        gap:5px!important;
        position:relative!important;
        overflow:hidden!important;
        text-align:left!important;
        color:var(--df-text)!important;
        background:linear-gradient(180deg,#121b29,#0e1622)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 7px 16px rgba(0,0,0,.18)!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab::before,
      body:not(.dfSectionMode) #appContent>.tabs .tab::before{
        display:flex!important;align-items:center;justify-content:center;
        width:34px;height:26px;margin:0 0 4px!important;border-radius:7px;
        border:1px solid #485569;background:#0b111a;color:var(--df-accent);
        font:900 10px/1 system-ui;letter-spacing:.08em
      }
      body.dfHomeCompact #appContent>.tabs .tab::after,
      body:not(.dfSectionMode) #appContent>.tabs .tab::after{
        display:block;font:650 9px/1.28 system-ui;color:#8794a8;text-transform:none;letter-spacing:0;text-align:left
      }
      body.dfHomeCompact #appContent>.tabs .tab:hover,
      body:not(.dfSectionMode) #appContent>.tabs .tab:hover,
      body.dfHomeCompact #appContent>.tabs .tab:active,
      body:not(.dfSectionMode) #appContent>.tabs .tab:active{
        border-color:#8a6a1f!important;background:linear-gradient(180deg,#171d27,#111823)!important
      }
      #btEx{order:1} #btFo{order:2} #btSa{order:3} #btCu{order:4}
      #btEx,#btFo{border-color:#6f5920!important}
      #btEx::before{content:'EX'} #btFo::before{content:'FO'} #btSa::before{content:'SA'} #btCu::before{content:'R$'}
      #btEx::after{content:'Micra • peso/m • processo'}
      #btFo::after{content:'Misturas • OP • PDF'}
      #btSa::after{content:'Medidas • produção'}
      #btCu::after{content:'Preço • margem • kg'}
      body.dfSectionMode #appContent>.tabs{display:none!important}

      #dfBetaApp{
        cursor:pointer!important;padding:8px 11px!important;margin:0 0 8px!important;border-radius:11px!important;min-height:36px!important;
        background:#12100b!important;border:1px solid #584719!important;color:#dbc16d!important;box-shadow:none!important
      }
      #dfBetaApp strong{font-size:10px!important;padding-right:22px;position:relative;line-height:1.2!important;color:#e5c66b!important}
      #dfBetaApp strong::after{content:'▾';position:absolute;right:0;top:-2px;font-size:14px;color:#c99a28}
      #dfBetaApp span,#dfBetaApp small{display:none!important}
      #dfBetaApp.dfBetaOpen span,#dfBetaApp.dfBetaOpen small{display:block!important}
      #dfBetaApp.dfBetaOpen span{font-size:10px!important;margin-top:6px!important;color:#d7dce5!important}
      #dfBetaApp.dfBetaOpen small{font-size:9px!important;color:#8995a6!important}
      #dfBetaApp.dfBetaOpen strong::after{content:'▴'}

      #dfSystemBar{
        padding:7px 9px!important;margin:0 0 8px!important;border-radius:11px!important;align-items:center!important;gap:6px!important;
        background:#0d1420!important;border-color:#293649!important;box-shadow:none!important
      }
      #dfSystemBar .dfSystemVer{font-size:9.5px!important;padding:0!important;color:#cdd5e0!important}
      #dfSystemBar .dfSystemActions{flex-direction:row!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:4px!important}
      #dfSystemBar .dfSystemBtn{font-size:8.5px!important;padding:6px 8px!important;min-height:28px!important;border-radius:8px!important;box-shadow:none!important}
      #dfSystemBar .dfSystemBtn:not(.ok):not(.alt){background:#211a0b!important;color:#e1bd59!important;border:1px solid #6d5418!important}
      #dfSystemBar .dfSystemBtn.ok{background:#121a17!important;color:#b9c9c0!important;border:1px solid #3a4b43!important}
      #dfSystemBar .dfSystemBtn.alt{background:#121a26!important;color:#cbd5e1!important;border:1px solid #344255!important}
      #dfNetBadge{font-size:8.5px!important;padding:4px 6px!important;background:#111925!important;border-color:#354256!important;color:#cbd5e1!important}

      #dfHomeMoreToggle{
        width:100%;min-height:42px;margin:0;border:1px solid #2d394b;background:#0f1723;color:#cbd5e1;
        border-radius:11px;padding:10px 12px;font:850 10.5px system-ui;letter-spacing:.04em;cursor:pointer
      }
      #dfHomeMoreToggle::before{content:'⋯  ';color:#c99a28}
      #dfHomeMoreToggle.on{border-color:#6b551d;background:#17130a;color:#e7cf87}
      #dfQuickAccess.dfTestMorePanel{display:none!important;margin-top:7px!important}
      #dfQuickAccess.dfTestMorePanel.dfMoreOpen{display:grid!important}
      #dfBottomTestNav{display:none!important}

      @media(max-width:390px){
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:96px!important;font-size:13.5px!important}
        body.dfHomeCompact #appContent>.tabs .tab::after,
        body:not(.dfSectionMode) #appContent>.tabs .tab::after{font-size:8.2px}
      }
      @media(min-width:700px){
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:112px!important;font-size:16px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function lead(){
    const app=$('appContent'),tabs=app&&app.querySelector(':scope > .tabs');
    if(!app||!tabs)return false;
    let l=$('dfHomeLead');
    if(!l){l=document.createElement('div');l.id='dfHomeLead'}
    l.innerHTML='<div><b>Funções principais</b><span>Acesso direto aos módulos do sistema</span></div>';
    if(l.nextElementSibling!==tabs)tabs.parentNode.insertBefore(l,tabs);
    return true;
  }

  function mainTabs(){
    const tabs=document.querySelector('#appContent>.tabs');
    if(!tabs)return false;
    tabs.classList.add('dfMainGridTest');
    return true;
  }

  function beta(){
    const b=$('dfBetaApp');
    if(!b||b.dataset.dfCompactBound==='1')return !!b;
    b.dataset.dfCompactBound='1';
    b.setAttribute('role','button');b.setAttribute('tabindex','0');b.setAttribute('aria-label','Abrir detalhes do período beta');
    const toggle=()=>b.classList.toggle('dfBetaOpen');
    b.addEventListener('click',toggle);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    return true;
  }

  function more(){
    const q=$('dfQuickAccess');if(!q)return false;
    q.classList.add('dfTestMorePanel');
    let b=$('dfHomeMoreToggle');
    if(!b){
      b=document.createElement('button');b.id='dfHomeMoreToggle';b.type='button';
      b.addEventListener('click',()=>{
        const open=q.classList.toggle('dfMoreOpen');b.classList.toggle('on',open);
        b.textContent=open?'FECHAR OPÇÕES':'MAIS OPÇÕES';
        if(open)setTimeout(()=>q.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
      });
    }
    b.textContent=q.classList.contains('dfMoreOpen')?'FECHAR OPÇÕES':'MAIS OPÇÕES';
    if(b.nextElementSibling!==q)q.parentNode.insertBefore(b,q);
    return true;
  }

  function order(){
    const app=$('appContent'),tabs=app&&app.querySelector(':scope > .tabs');if(!app||!tabs)return;
    const l=$('dfHomeLead');if(l&&l.nextElementSibling!==tabs)tabs.parentNode.insertBefore(l,tabs);
    const beta=$('dfBetaApp');if(beta&&tabs.nextElementSibling!==beta)tabs.insertAdjacentElement('afterend',beta);
    const sys=$('dfSystemBar');if(sys&&beta&&beta.nextElementSibling!==sys)beta.insertAdjacentElement('afterend',sys);
    const moreBtn=$('dfHomeMoreToggle');if(moreBtn&&sys&&sys.nextElementSibling!==moreBtn)sys.insertAdjacentElement('afterend',moreBtn);
    const quick=$('dfQuickAccess');if(quick&&moreBtn&&moreBtn.nextElementSibling!==quick)moreBtn.insertAdjacentElement('afterend',quick);
    const bottom=$('dfBottomTestNav');if(bottom)bottom.remove();
  }

  function ensure(){addStyle();lead();mainTabs();beta();more();order()}

  function start(){
    ensure();
    let tries=0;const t=setInterval(()=>{tries++;ensure();if(tries>70)clearInterval(t)},120);
    window.addEventListener('df-ui-ready',()=>setTimeout(ensure,30));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensure,30)});
    const mo=new MutationObserver(()=>requestAnimationFrame(ensure));
    mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();