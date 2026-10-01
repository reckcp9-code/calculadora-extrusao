(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomePraticoTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomePraticoTestStyle';
    s.textContent=`
      /* TESTE V4 — home industrial refinada */
      :root{
        --df-bg:#080b12;
        --df-panel:#0d1420;
        --df-card:#111a27;
        --df-card2:#0f1723;
        --df-line:#2b3748;
        --df-line2:#3a475a;
        --df-text:#f4f7fb;
        --df-muted:#8f9bad;
        --df-accent:#d7a526;
        --df-accent-soft:#2a220f;
      }
      *{-webkit-tap-highlight-color:transparent}
      body{padding-bottom:24px!important;background:var(--df-bg)!important}

      /* CABEÇALHO — imagem ocupa toda a área visual superior */
      body.dfHomeCompact .brand,
      body:not(.dfSectionMode) .brand{
        padding:0 0 15px!important;
        margin:2px 0 16px!important;
        border-radius:20px!important;
        overflow:hidden!important;
        background:linear-gradient(180deg,#05080d 0%,#090d14 100%)!important;
        border:1px solid #273244!important;
        box-shadow:0 18px 42px rgba(0,0,0,.30)!important;
      }
      body.dfHomeCompact .brand .logo,
      body:not(.dfSectionMode) .brand .logo{
        display:block!important;
        width:100%!important;
        max-width:none!important;
        height:238px!important;
        object-fit:cover!important;
        object-position:center!important;
        margin:0 0 12px!important;
        border-radius:0!important;
        background:#000!important;
      }
      body.dfHomeCompact .brand .tag,
      body:not(.dfSectionMode) .brand .tag{
        padding:5px 11px!important;
        font-size:9px!important;
        margin-top:0!important;
        color:#d9be73!important;
        background:#17140d!important;
        border-color:#645425!important;
        box-shadow:none!important;
      }
      body.dfHomeCompact .brand h1,
      body:not(.dfSectionMode) .brand h1{
        font-size:25px!important;
        margin:11px 14px 4px!important;
        letter-spacing:-.5px!important;
      }
      body.dfHomeCompact .brand .sub,
      body:not(.dfSectionMode) .brand .sub{
        font-size:10px!important;
        line-height:1.35!important;
        color:#8490a2!important;
        letter-spacing:.025em!important;
        padding:0 18px!important;
      }

      /* TÍTULO DA ÁREA PRINCIPAL */
      #dfHomeLead{margin:0 4px 10px;padding:0 2px}
      #dfHomeLead b{display:block;font-size:18px;color:var(--df-text);line-height:1.15;letter-spacing:-.2px}
      #dfHomeLead span{display:block;margin-top:4px;font-size:10.5px;color:var(--df-muted);font-weight:650}
      #dfHomeLead em{display:none!important}

      /* GRID — sem caixa dentro de caixa */
      body.dfHomeCompact #appContent>.tabs,
      body:not(.dfSectionMode) #appContent>.tabs{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:10px!important;
        padding:0!important;
        margin:0 0 13px!important;
        border-radius:0!important;
        background:transparent!important;
        border:0!important;
        position:relative!important;
        top:auto!important;
        box-shadow:none!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab,
      body:not(.dfSectionMode) #appContent>.tabs .tab{
        min-height:104px!important;
        border:1px solid var(--df-line)!important;
        border-radius:16px!important;
        padding:14px 12px 12px!important;
        font-size:14.5px!important;
        line-height:1.08!important;
        letter-spacing:.02em!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:flex-start!important;
        justify-content:center!important;
        gap:5px!important;
        position:relative!important;
        overflow:hidden!important;
        text-align:left!important;
        color:var(--df-text)!important;
        background:linear-gradient(145deg,#141e2c 0%,#101824 62%,#0d1520 100%)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 22px rgba(0,0,0,.20)!important;
        transition:transform .14s ease,border-color .14s ease,background .14s ease!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab::before,
      body:not(.dfSectionMode) #appContent>.tabs .tab::before{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:35px!important;
        height:27px!important;
        margin:0 0 5px!important;
        border-radius:8px!important;
        border:1px solid #4b586b!important;
        background:#0b111a!important;
        color:var(--df-accent)!important;
        font:900 10px/1 system-ui!important;
        letter-spacing:.09em!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03)!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab::after,
      body:not(.dfSectionMode) #appContent>.tabs .tab::after{
        display:block!important;
        font:650 9px/1.3 system-ui!important;
        color:#8996a9!important;
        text-transform:none!important;
        letter-spacing:0!important;
        text-align:left!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab:active,
      body:not(.dfSectionMode) #appContent>.tabs .tab:active{
        transform:translateY(1px) scale(.992)!important;
        border-color:#77652f!important;
        background:linear-gradient(145deg,#172230,#111a26 65%,#0e1621 100%)!important;
      }
      #btEx{order:1} #btFo{order:2} #btSa{order:3} #btCu{order:4}
      #btEx,#btFo{border-color:#4f4933!important}
      #btEx::before{content:'EX'} #btFo::before{content:'FO'} #btSa::before{content:'SA'} #btCu::before{content:'R$'}
      #btEx::after{content:'Micra • peso/m • processo'}
      #btFo::after{content:'Misturas • OP • PDF'}
      #btSa::after{content:'Medidas • produção'}
      #btCu::after{content:'Preço • margem • kg'}
      body.dfSectionMode #appContent>.tabs{display:none!important}

      /* BETA — secundário, sem chamar mais atenção que os módulos */
      #dfBetaApp{
        cursor:pointer!important;
        padding:8px 11px!important;
        margin:0 0 9px!important;
        border-radius:12px!important;
        min-height:36px!important;
        background:#0f141b!important;
        border:1px solid #343b45!important;
        color:#c7ced8!important;
        box-shadow:none!important;
      }
      #dfBetaApp strong{font-size:10px!important;padding-right:22px;position:relative;line-height:1.2!important;color:#cdd4de!important}
      #dfBetaApp strong::after{content:'▾';position:absolute;right:0;top:-2px;font-size:14px;color:#9b7c2c}
      #dfBetaApp span,#dfBetaApp small{display:none!important}
      #dfBetaApp.dfBetaOpen span,#dfBetaApp.dfBetaOpen small{display:block!important}
      #dfBetaApp.dfBetaOpen span{font-size:10px!important;margin-top:6px!important;color:#d7dce5!important}
      #dfBetaApp.dfBetaOpen small{font-size:9px!important;color:#8995a6!important}
      #dfBetaApp.dfBetaOpen strong::after{content:'▴'}

      /* STATUS — painel técnico discreto */
      #dfSystemBar{
        padding:8px 10px!important;
        margin:0 0 9px!important;
        border-radius:12px!important;
        align-items:center!important;
        gap:6px!important;
        background:linear-gradient(180deg,#101824,#0d141f)!important;
        border-color:#2e3a4c!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }
      #dfSystemBar .dfSystemVer{font-size:9.5px!important;padding:0!important;color:#cbd3df!important;letter-spacing:.015em!important}
      #dfSystemBar .dfSystemActions{flex-direction:row!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:4px!important}
      #dfSystemBar .dfSystemBtn{font-size:8.5px!important;padding:6px 8px!important;min-height:28px!important;border-radius:8px!important;box-shadow:none!important}
      #dfSystemBar .dfSystemBtn:not(.ok):not(.alt){background:#14171a!important;color:#d4bc78!important;border:1px solid #645426!important}
      #dfSystemBar .dfSystemBtn.ok{background:#111922!important;color:#bfc8d4!important;border:1px solid #344152!important}
      #dfSystemBar .dfSystemBtn.alt{background:#111922!important;color:#cbd5e1!important;border:1px solid #344152!important}
      #dfNetBadge{font-size:8.5px!important;padding:4px 7px!important;background:#111925!important;border-color:#354256!important;color:#cbd5e1!important}

      /* MAIS */
      #dfHomeMoreToggle{
        width:100%!important;
        min-height:43px!important;
        margin:0!important;
        border:1px solid #2e3a4b!important;
        background:linear-gradient(180deg,#111925,#0e1621)!important;
        color:#cbd5e1!important;
        border-radius:12px!important;
        padding:10px 12px!important;
        font:850 10.5px system-ui!important;
        letter-spacing:.04em!important;
        cursor:pointer!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }
      #dfHomeMoreToggle::before{content:'⋯  ';color:#a88732}
      #dfHomeMoreToggle.on{border-color:#645426!important;background:#17150f!important;color:#ddd2af!important}
      #dfQuickAccess.dfTestMorePanel{display:none!important;margin-top:7px!important}
      #dfQuickAccess.dfTestMorePanel.dfMoreOpen{display:grid!important}
      #dfBottomTestNav{display:none!important}

      @media(max-width:390px){
        body.dfHomeCompact .brand .logo,
        body:not(.dfSectionMode) .brand .logo{height:220px!important}
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:96px!important;font-size:13.5px!important}
        body.dfHomeCompact #appContent>.tabs .tab::after,
        body:not(.dfSectionMode) #appContent>.tabs .tab::after{font-size:8.2px!important}
      }
      @media(min-width:700px){
        body.dfHomeCompact .brand .logo,
        body:not(.dfSectionMode) .brand .logo{height:270px!important}
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
    b.setAttribute('role','button');
    b.setAttribute('tabindex','0');
    b.setAttribute('aria-label','Abrir detalhes do período beta');
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
      b=document.createElement('button');
      b.id='dfHomeMoreToggle';
      b.type='button';
      b.addEventListener('click',()=>{
        const open=q.classList.toggle('dfMoreOpen');
        b.classList.toggle('on',open);
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
    let tries=0;
    const t=setInterval(()=>{tries++;ensure();if(tries>70)clearInterval(t)},120);
    window.addEventListener('df-ui-ready',()=>setTimeout(ensure,30));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensure,30)});
    const mo=new MutationObserver(()=>requestAnimationFrame(ensure));
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();