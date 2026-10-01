(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomePraticoTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomePraticoTestStyle';
    s.textContent=`
      /* TESTE V2: home limpa, com foco total nas 4 funções principais */
      body{padding-bottom:24px!important}

      body.dfHomeCompact .brand,
      body:not(.dfSectionMode) .brand{
        padding:14px 12px 16px!important;
        margin:2px 0 12px!important;
        border-radius:20px!important;
      }
      body.dfHomeCompact .brand .logo,
      body:not(.dfSectionMode) .brand .logo{
        width:min(190px,58vw)!important;
        margin-bottom:5px!important;
      }
      body.dfHomeCompact .brand .tag,
      body:not(.dfSectionMode) .brand .tag{
        padding:5px 10px!important;
        font-size:10px!important;
        margin-top:4px!important;
      }
      body.dfHomeCompact .brand h1,
      body:not(.dfSectionMode) .brand h1{
        font-size:27px!important;
        margin:11px 0 5px!important;
      }
      body.dfHomeCompact .brand .sub,
      body:not(.dfSectionMode) .brand .sub{
        font-size:11px!important;
        line-height:1.3!important;
      }

      #dfHomeLead{
        margin:2px 2px 8px;
        display:flex;align-items:end;justify-content:space-between;gap:10px;
      }
      #dfHomeLead b{display:block;font-size:19px;color:#f8fafc;line-height:1.1}
      #dfHomeLead span{display:block;margin-top:3px;font-size:11px;color:#94a3b8;font-weight:700}
      #dfHomeLead em{font-style:normal;font-size:9px;font-weight:900;color:#ffd36a;border:1px solid #7c4a03;background:#211400;border-radius:999px;padding:5px 8px;white-space:nowrap}

      body.dfHomeCompact #appContent>.tabs,
      body:not(.dfSectionMode) #appContent>.tabs{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:11px!important;
        padding:8px!important;
        margin:0 0 10px!important;
        border-radius:20px!important;
        background:#090d16!important;
        border:1px solid #263244!important;
        position:relative!important;
        top:auto!important;
        box-shadow:0 12px 30px rgba(0,0,0,.20)!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab,
      body:not(.dfSectionMode) #appContent>.tabs .tab{
        min-height:104px!important;
        border-radius:17px!important;
        padding:13px 8px 11px!important;
        font-size:15px!important;
        line-height:1.08!important;
        letter-spacing:.02em!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:5px!important;
        position:relative!important;
        overflow:hidden!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 8px 20px rgba(0,0,0,.22)!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab::before,
      body:not(.dfSectionMode) #appContent>.tabs .tab::before{font-size:27px;line-height:1;margin-bottom:3px}
      body.dfHomeCompact #appContent>.tabs .tab::after,
      body:not(.dfSectionMode) #appContent>.tabs .tab::after{
        display:block;font:750 9px/1.25 system-ui;color:#94a3b8;text-transform:none;letter-spacing:0;text-align:center
      }
      #btEx{order:1;border-color:#f59e0b!important;background:linear-gradient(180deg,#2b1b05,#171109)!important;color:#ffd36a!important}
      #btFo{order:2;border-color:#2563eb!important;background:linear-gradient(180deg,#10264b,#0d1729)!important;color:#dbeafe!important}
      #btSa{order:3;border-color:#334155!important;background:linear-gradient(180deg,#142033,#101827)!important}
      #btCu{order:4;border-color:#16a34a!important;background:linear-gradient(180deg,#0d2919,#0b1c13)!important;color:#bbf7d0!important}
      #btEx::before{content:'⚙️'} #btFo::before{content:'🧪'} #btSa::before{content:'🛍️'} #btCu::before{content:'💰'}
      #btEx::after{content:'Micra • peso/m • processo'}
      #btFo::after{content:'Misturas • OP • PDF'}
      #btSa::after{content:'Medidas • produção'}
      #btCu::after{content:'Preço • margem • kg'}
      body.dfSectionMode #appContent>.tabs{display:none!important}

      #dfBetaApp{
        cursor:pointer!important;
        padding:8px 11px!important;
        margin:0 0 8px!important;
        border-radius:12px!important;
        min-height:38px!important;
      }
      #dfBetaApp strong{font-size:10.5px!important;padding-right:22px;position:relative;line-height:1.2!important}
      #dfBetaApp strong::after{content:'▾';position:absolute;right:0;top:-2px;font-size:15px;color:#facc15}
      #dfBetaApp span,#dfBetaApp small{display:none!important}
      #dfBetaApp.dfBetaOpen span,#dfBetaApp.dfBetaOpen small{display:block!important}
      #dfBetaApp.dfBetaOpen span{font-size:10.5px!important;margin-top:6px!important}
      #dfBetaApp.dfBetaOpen small{font-size:9.5px!important}
      #dfBetaApp.dfBetaOpen strong::after{content:'▴'}

      #dfSystemBar{
        padding:7px 9px!important;
        margin:0 0 8px!important;
        border-radius:12px!important;
        align-items:center!important;
        gap:6px!important;
      }
      #dfSystemBar .dfSystemVer{font-size:9.5px!important;padding:0!important}
      #dfSystemBar .dfSystemActions{flex-direction:row!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:4px!important}
      #dfSystemBar .dfSystemBtn{font-size:8.5px!important;padding:6px 8px!important;min-height:28px!important;border-radius:9px!important}
      #dfNetBadge{font-size:8.5px!important;padding:4px 6px!important}

      #dfHomeMoreToggle{
        width:100%;min-height:44px;margin:0;border:1px solid #334155;background:#111827;color:#e2e8f0;
        border-radius:12px;padding:10px 12px;font:950 11px system-ui;letter-spacing:.03em;cursor:pointer
      }
      #dfHomeMoreToggle::before{content:'☰ ';color:#facc15}
      #dfHomeMoreToggle.on{border-color:#f59e0b;background:#211400;color:#ffd36a}
      #dfQuickAccess.dfTestMorePanel{display:none!important;margin-top:7px!important}
      #dfQuickAccess.dfTestMorePanel.dfMoreOpen{display:grid!important}
      #dfBottomTestNav{display:none!important}

      @media(max-width:390px){
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:98px!important;font-size:14px!important}
        body.dfHomeCompact #appContent>.tabs .tab::after,
        body:not(.dfSectionMode) #appContent>.tabs .tab::after{font-size:8.5px}
      }
      @media(min-width:700px){
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:116px!important;font-size:17px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function lead(){
    const app=$('appContent'),tabs=app&&app.querySelector(':scope > .tabs');
    if(!app||!tabs)return false;
    let l=$('dfHomeLead');
    if(!l){
      l=document.createElement('div');l.id='dfHomeLead';
      l.innerHTML='<div><b>Acesso rápido</b><span>Escolha a função que você precisa</span></div><em>4 PRINCIPAIS</em>';
    }
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
      b=document.createElement('button');b.id='dfHomeMoreToggle';b.type='button';b.textContent='MAIS — AJUDA, FEEDBACK E WHATSAPP';
      b.addEventListener('click',()=>{
        const open=q.classList.toggle('dfMoreOpen');b.classList.toggle('on',open);
        b.textContent=open?'FECHAR MAIS':'MAIS — AJUDA, FEEDBACK E WHATSAPP';
        if(open)setTimeout(()=>q.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
      });
    }
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