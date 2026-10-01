(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomePraticoTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomePraticoTestStyle';
    s.textContent=`
      /* TESTE: tela inicial prática — não altera produção */
      body{padding-bottom:78px!important}

      body.dfHomeCompact #appContent>.tabs,
      body:not(.dfSectionMode) #appContent>.tabs{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:12px!important;
        padding:10px!important;
        margin:12px 0 12px!important;
        border-radius:20px!important;
        background:#090d16!important;
        border:1px solid #263244!important;
        position:relative!important;
        top:auto!important;
      }
      body.dfHomeCompact #appContent>.tabs .tab,
      body:not(.dfSectionMode) #appContent>.tabs .tab{
        min-height:82px!important;
        border-radius:17px!important;
        padding:13px 8px!important;
        font-size:14px!important;
        line-height:1.12!important;
        letter-spacing:.02em!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:7px!important;
        box-shadow:0 8px 20px rgba(0,0,0,.18)!important;
      }
      #btEx{order:1} #btFo{order:2} #btSa{order:3} #btCu{order:4}
      #btEx::before{content:'⚙️';font-size:23px;line-height:1}
      #btFo::before{content:'🧪';font-size:23px;line-height:1}
      #btSa::before{content:'🛍️';font-size:23px;line-height:1}
      #btCu::before{content:'💰';font-size:23px;line-height:1}
      body.dfSectionMode #appContent>.tabs{display:none!important}

      #dfBetaApp{
        cursor:pointer!important;
        padding:10px 13px!important;
        margin:0 0 10px!important;
        border-radius:14px!important;
      }
      #dfBetaApp strong{font-size:12px!important;padding-right:24px;position:relative}
      #dfBetaApp strong::after{content:'▾';position:absolute;right:0;top:-1px;font-size:16px;color:#facc15}
      #dfBetaApp span,#dfBetaApp small{display:none!important}
      #dfBetaApp.dfBetaOpen span,#dfBetaApp.dfBetaOpen small{display:block!important}
      #dfBetaApp.dfBetaOpen strong::after{content:'▴'}

      #dfSystemBar{
        padding:8px 10px!important;
        margin:0 0 10px!important;
        border-radius:14px!important;
        align-items:center!important;
      }
      #dfSystemBar .dfSystemVer{font-size:10.5px!important;padding:0!important}
      #dfSystemBar .dfSystemActions{
        flex-direction:row!important;
        flex-wrap:wrap!important;
        justify-content:flex-end!important;
        gap:5px!important;
      }
      #dfSystemBar .dfSystemBtn{font-size:9px!important;padding:7px 9px!important;min-height:31px!important}
      #dfNetBadge{font-size:9px!important;padding:5px 7px!important}

      #dfHomeMoreToggle{
        width:100%;min-height:48px;margin:2px 0 0;border:1px solid #334155;background:#111827;color:#e2e8f0;
        border-radius:14px;padding:11px 14px;font:950 12px system-ui;letter-spacing:.03em;cursor:pointer
      }
      #dfHomeMoreToggle::before{content:'☰ ';color:#facc15}
      #dfHomeMoreToggle.on{border-color:#f59e0b;background:#211400;color:#ffd36a}
      #dfQuickAccess.dfTestMorePanel{display:none!important;margin-top:8px!important}
      #dfQuickAccess.dfTestMorePanel.dfMoreOpen{display:grid!important}

      #dfBottomTestNav{
        position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));z-index:99990;
        width:min(730px,calc(100% - 20px));display:grid;grid-template-columns:repeat(4,1fr);gap:6px;
        padding:7px;border:1px solid #334155;background:rgba(8,11,19,.96);backdrop-filter:blur(12px);
        border-radius:18px;box-shadow:0 12px 35px rgba(0,0,0,.45)
      }
      #dfBottomTestNav button{
        border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:12px;min-height:47px;padding:6px 2px;
        font:900 9.5px system-ui;line-height:1.15
      }
      #dfBottomTestNav button b{display:block;font-size:17px;line-height:1.1;margin-bottom:2px}
      #dfBottomTestNav button:active{transform:scale(.97)}
      #dfBottomTestNav .hot{border-color:#f59e0b;color:#ffd36a;background:#211400}

      @media(min-width:700px){
        body.dfHomeCompact #appContent>.tabs .tab,
        body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:92px!important;font-size:15px!important}
      }
    `;
    document.head.appendChild(s);
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
    const q=$('dfQuickAccess');
    if(!q)return false;
    q.classList.add('dfTestMorePanel');
    let b=$('dfHomeMoreToggle');
    if(!b){
      b=document.createElement('button');
      b.id='dfHomeMoreToggle';
      b.type='button';
      b.textContent='MAIS — AJUDA, FEEDBACK E WHATSAPP';
      q.parentNode.insertBefore(b,q);
      b.addEventListener('click',()=>{
        const open=q.classList.toggle('dfMoreOpen');
        b.classList.toggle('on',open);
        b.textContent=open?'FECHAR MAIS':'MAIS — AJUDA, FEEDBACK E WHATSAPP';
        if(open)setTimeout(()=>q.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
      });
    }
    return true;
  }

  function goHome(){
    const menu=document.querySelector('[data-df-persistent-menu="1"]');
    if(menu){menu.click();return}
    try{history.replaceState(null,'','./teste-formulacoes.html')}catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function openMore(){
    const run=()=>{
      const b=$('dfHomeMoreToggle'),q=$('dfQuickAccess');
      if(b&&q){if(!q.classList.contains('dfMoreOpen'))b.click();setTimeout(()=>b.scrollIntoView({behavior:'smooth',block:'center'}),50)}
    };
    const menu=document.querySelector('[data-df-persistent-menu="1"]');
    if(menu){menu.click();setTimeout(run,120)}else run();
  }

  function bottom(){
    if($('dfBottomTestNav'))return true;
    const nav=document.createElement('div');
    nav.id='dfBottomTestNav';
    nav.innerHTML='<button type="button" data-home><b>⌂</b>INÍCIO</button><button type="button" data-go="btEx"><b>⚙️</b>EXTRUSÃO</button><button type="button" class="hot" data-go="btFo"><b>🧪</b>FORMULAÇÃO</button><button type="button" data-more><b>☰</b>MAIS</button>';
    nav.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-home')){goHome();return}
      if(b.hasAttribute('data-more')){openMore();return}
      const id=b.dataset.go,el=$(id);if(el)el.click();
    });
    document.body.appendChild(nav);
    return true;
  }

  function ensure(){addStyle();mainTabs();beta();more();bottom()}

  function start(){
    ensure();
    let tries=0;
    const t=setInterval(()=>{tries++;ensure();if(tries>60)clearInterval(t)},120);
    window.addEventListener('df-ui-ready',()=>setTimeout(ensure,30));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensure,30)});
    const mo=new MutationObserver(()=>requestAnimationFrame(ensure));
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),12000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();