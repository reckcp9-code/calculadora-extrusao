(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  if($('dfProfessionalBackgroundStyle'))return;

  function addStyle(){
    const st=document.createElement('style');
    st.id='dfProfessionalBackgroundStyle';
    st.textContent=`
      html{background:#03070c!important}
      body{
        min-height:100vh!important;
        background:
          linear-gradient(180deg,rgba(2,6,10,.26),rgba(3,8,14,.52) 42%,rgba(3,7,12,.78) 100%),
          url('./df-industrial-bg.webp') center top/cover fixed no-repeat!important;
        color:#f8fafc!important;
      }
      body:before{
        content:'';position:fixed;inset:0;pointer-events:none;z-index:-1;
        background:radial-gradient(circle at 70% 16%,rgba(245,158,11,.10),transparent 34%),linear-gradient(90deg,rgba(3,7,12,.24),transparent 24%,transparent 76%,rgba(3,7,12,.18));
      }
      #appContent{position:relative;z-index:1}
      #appContent.w{max-width:900px!important;padding:30px 16px 44px!important}
      .brand{
        position:relative!important;overflow:hidden!important;
        background:linear-gradient(180deg,rgba(6,13,22,.90),rgba(4,10,18,.86))!important;
        border:1px solid rgba(110,133,154,.60)!important;
        border-radius:28px!important;
        padding:34px 20px 30px!important;
        box-shadow:0 28px 70px rgba(0,0,0,.42),0 -2px 22px rgba(245,158,11,.18),inset 0 1px 0 rgba(255,255,255,.04)!important;
        backdrop-filter:blur(15px)!important;-webkit-backdrop-filter:blur(15px)!important;
      }
      .brand:before,.brand:after{content:'';position:absolute;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,#f59e0b,transparent);opacity:.78}
      .brand:before{top:0}.brand:after{bottom:0}
      .brand .logo{width:min(320px,72vw)!important;border-radius:20px!important;margin-bottom:16px!important;filter:drop-shadow(0 12px 28px rgba(0,0,0,.34))}
      .brand .tag{margin-top:4px!important;background:rgba(35,22,0,.80)!important;border-color:#f59e0b!important;color:#ffd36a!important;padding:8px 18px!important}
      #heroTitle{font-size:38px!important;letter-spacing:-.7px!important;margin-top:16px!important;text-shadow:0 6px 22px rgba(0,0,0,.4)}
      #heroTitle .dfProWord{color:#f59e0b!important}
      #heroSub{font-size:14px!important;letter-spacing:.14em!important;color:#a7b8c8!important}

      #appContent>.tabs{
        position:relative!important;top:auto!important;z-index:3!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:12px!important;margin:14px 0!important;padding:8px!important;
        background:linear-gradient(180deg,rgba(8,17,28,.92),rgba(4,10,18,.88))!important;
        border:1px solid rgba(96,123,147,.58)!important;border-radius:20px!important;
        box-shadow:0 16px 42px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.03)!important;
        backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;
      }
      #appContent>.tabs .tab{min-height:78px!important;border-radius:15px!important;background:linear-gradient(180deg,rgba(21,38,57,.88),rgba(10,23,37,.92))!important;border:1px solid #36516c!important;color:#d8e4ef!important;font-size:12px!important;letter-spacing:.03em!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important}
      #appContent>.tabs .tab.on{border-color:#f59e0b!important;background:linear-gradient(180deg,rgba(62,39,3,.92),rgba(28,18,3,.94))!important;color:#ffd36a!important;box-shadow:0 0 0 1px rgba(245,158,11,.18) inset,0 8px 22px rgba(245,158,11,.10)!important}
      #appContent>.tabs .tab:not(#btEx):not(#btSa):not(#btCu):not(#btFo){display:none!important}

      #dfBetaApp{
        margin:12px 0 14px!important;padding:18px 20px!important;
        background:linear-gradient(90deg,rgba(52,31,2,.88),rgba(22,16,10,.86))!important;
        border:1px solid #f59e0b!important;border-radius:18px!important;
        box-shadow:0 16px 34px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.03)!important;
        backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;
      }
      #dfBetaApp strong{font-size:16px!important}#dfBetaApp span{font-size:13px!important}#dfBetaApp small{font-size:11px!important}

      .card{
        background:linear-gradient(180deg,rgba(8,20,33,.91),rgba(5,12,21,.94))!important;
        border-color:rgba(78,104,128,.55)!important;
        box-shadow:0 18px 48px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.025)!important;
        backdrop-filter:blur(11px)!important;-webkit-backdrop-filter:blur(11px)!important;
      }
      input,select,.kpi,.formRow,.savedItem{background:rgba(8,18,30,.88)!important;border-color:#314a61!important}

      #dfQuickAccess{display:none!important}

      #dfProSide{
        position:fixed;left:0;top:0;bottom:0;width:205px;z-index:50;
        padding:22px 12px 18px;background:linear-gradient(180deg,rgba(4,10,17,.93),rgba(5,13,22,.88));
        border-right:1px solid rgba(98,122,143,.30);box-shadow:18px 0 42px rgba(0,0,0,.20);
        backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);
        display:flex;flex-direction:column;gap:8px;
      }
      #dfProSide .dfSideLogo{width:112px;display:block;margin:2px auto 24px;border-radius:10px}
      #dfProSide button{width:100%;min-height:52px;border:1px solid transparent;border-radius:13px;background:transparent;color:#b8c6d3;font-weight:850;font-size:12px;text-align:left;padding:0 14px;display:flex;align-items:center;gap:11px}
      #dfProSide button:hover{background:rgba(15,29,44,.70);border-color:#2e4357}
      #dfProSide button.on{border-color:#f59e0b;background:linear-gradient(90deg,rgba(75,46,4,.62),rgba(25,19,12,.50));color:#ffd36a;box-shadow:inset 3px 0 0 #f59e0b}
      #dfProSide .ico{width:23px;text-align:center;font-size:18px;opacity:.95}
      #dfProSide .sep{height:1px;background:linear-gradient(90deg,transparent,#415265,transparent);margin:8px 8px}
      #dfProSide .sideBottom{margin-top:auto;color:#8393a2;font-size:10px;line-height:1.45;padding:8px 10px}
      #dfProRightText{position:fixed;right:20px;top:30px;z-index:2;color:#8a99a7;font-size:10px;line-height:1.35;text-align:right;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}
      #dfProRightText b{color:#f59e0b;font-size:11px}

      @media(min-width:1180px){#appContent.w{margin-left:calc(50% - 350px)!important;margin-right:auto!important}}
      @media(max-width:1050px){#dfProSide,#dfProRightText{display:none!important}#appContent.w{max-width:820px!important}}
      @media(max-width:650px){
        body{background-attachment:scroll!important;background-position:center top!important;background-size:auto 105vh!important}
        #appContent.w{padding:14px 12px 36px!important}
        .brand{padding:22px 14px 22px!important;border-radius:22px!important}
        .brand .logo{width:min(250px,74vw)!important}
        #heroTitle{font-size:30px!important}
        #heroSub{font-size:11px!important;letter-spacing:.07em!important}
        #appContent>.tabs{gap:7px!important;padding:6px!important;grid-template-columns:repeat(2,1fr)!important}
        #appContent>.tabs .tab{min-height:58px!important;font-size:10px!important}
        #dfBetaApp{padding:13px 14px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function clickId(id){const e=$(id);if(e){e.click();return true}return false}
  function ensureSide(){
    if($('dfProSide'))return;
    const side=document.createElement('aside');
    side.id='dfProSide';
    side.innerHTML=`
      <img class="dfSideLogo" src="./logo.jpg.jpeg?v=20260904-logo-exata8" alt="DF">
      <button type="button" data-go="home" class="on"><span class="ico">⌂</span>INÍCIO</button>
      <button type="button" data-go="btEx"><span class="ico">⚙</span>EXTRUSÃO</button>
      <button type="button" data-go="btSa"><span class="ico">▣</span>SACOLAS</button>
      <button type="button" data-go="btCu"><span class="ico">▥</span>CUSTO</button>
      <button type="button" data-go="btFo"><span class="ico">⚗</span>FORMULAÇÃO</button>
      <div class="sep"></div>
      <button type="button" data-go="btAj"><span class="ico">?</span>AJUDA</button>
      <button type="button" data-go="btFb"><span class="ico">●</span>FEEDBACK</button>
      <button type="button" data-go="fav"><span class="ico">★</span>FAVORITOS</button>
      <div class="sideBottom">DF EXTRUSOR PRO<br>MANUTENÇÃO E CONSULTORIA</div>`;
    document.body.appendChild(side);
    side.addEventListener('click',e=>{
      const b=e.target.closest('button[data-go]');if(!b)return;
      const go=b.dataset.go;
      if(go==='home'){
        document.body.classList.remove('dfSectionMode');
        try{if(typeof window.show==='function')window.show('ex')}catch(_){clickId('btEx')}
        window.scrollTo({top:0,behavior:'smooth'});
      }else if(go==='fav'){
        if(!clickId('dfFavBtn')){location.hash='#favoritos'}
      }else clickId(go);
      setTimeout(syncSide,80);
    });
  }

  function ensureRight(){
    if($('dfProRightText'))return;
    const d=document.createElement('div');d.id='dfProRightText';d.innerHTML='TECNOLOGIA QUE<br><b>EXTRUSA RESULTADOS</b>';document.body.appendChild(d);
  }

  function styleTitle(){
    const h=$('heroTitle');if(!h)return;
    if((h.textContent||'').trim()==='DF EXTRUSOR PRO'&&!h.querySelector('.dfProWord'))h.innerHTML='DF EXTRUSOR <span class="dfProWord">PRO</span>';
  }

  function reorderHome(){
    const app=$('appContent');if(!app)return;
    const brand=app.querySelector(':scope > .brand');
    const tabs=app.querySelector(':scope > .tabs');
    const beta=$('dfBetaApp');
    if(brand&&tabs&&brand.nextElementSibling!==tabs)brand.insertAdjacentElement('afterend',tabs);
    if(tabs&&beta&&tabs.nextElementSibling!==beta)tabs.insertAdjacentElement('afterend',beta);
  }

  function syncSide(){
    const side=$('dfProSide');if(!side)return;
    side.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    let target='home';
    if($('pgFb')?.classList.contains('on'))target='btFb';
    else if($('pgAj')?.classList.contains('on'))target='btAj';
    else if($('pgFav')?.classList.contains('on'))target='fav';
    else if($('pgFo')?.classList.contains('on'))target='btFo';
    else if($('pgCu')?.classList.contains('on'))target='btCu';
    else if($('pgSa')?.classList.contains('on'))target='btSa';
    else if($('pgEx')?.classList.contains('on')&&window.scrollY>180)target='btEx';
    side.querySelector('[data-go="'+target+'"]')?.classList.add('on');
  }

  function mount(){
    addStyle();ensureSide();ensureRight();styleTitle();reorderHome();syncSide();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,100));
  window.addEventListener('scroll',()=>requestAnimationFrame(syncSide),{passive:true});
  const mo=new MutationObserver(()=>requestAnimationFrame(()=>{styleTitle();reorderHome();syncSide()}));
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  setTimeout(mount,450);setTimeout(mount,1200);
})();
