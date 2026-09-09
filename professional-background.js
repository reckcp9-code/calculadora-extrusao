(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  if($('dfProfessionalBackgroundStyle'))return;

  function addStyle(){
    const st=document.createElement('style');
    st.id='dfProfessionalBackgroundStyle';
    st.textContent=`
      :root{--dfBlack:#050608;--dfPanel:#0b0d10;--dfPanel2:#11151a;--dfOrange:#ff9800;--dfYellow:#ffd447;--dfWhite:#f7f7f5;--dfMuted:#aeb5bd;--dfLine:#394049}
      html,body{background:#050608!important;color:var(--dfWhite)!important}
      body{min-height:100vh!important;background-image:radial-gradient(circle at 78% 10%,rgba(255,152,0,.13),transparent 30%),radial-gradient(circle at 15% 38%,rgba(255,212,71,.05),transparent 28%),linear-gradient(180deg,#050608 0%,#090b0e 48%,#050608 100%)!important;background-attachment:fixed!important}
      body:before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.24;background:repeating-linear-gradient(135deg,transparent 0 34px,rgba(255,152,0,.035) 35px 36px)}
      #appContent{position:relative;z-index:1;background:transparent!important}
      #appContent.w{max-width:1160px!important;padding:24px 18px 52px!important}

      .brand{position:relative!important;overflow:hidden!important;min-height:390px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;background:linear-gradient(90deg,rgba(2,3,4,.78),rgba(3,4,5,.50) 45%,rgba(3,4,5,.36) 67%,rgba(3,4,5,.76)),url('./df-dashboard-pro.webp?v=20260909-dashboard-pro-1') center 29%/cover no-repeat!important;border:1px solid rgba(255,152,0,.88)!important;border-radius:22px!important;padding:34px 24px 30px!important;box-shadow:0 22px 65px rgba(0,0,0,.58),0 0 28px rgba(255,152,0,.10)!important}
      .brand:after{content:'';position:absolute;inset:auto 0 0;height:3px;background:linear-gradient(90deg,transparent,var(--dfOrange),var(--dfYellow),transparent);opacity:.78}
      .brand>*{position:relative;z-index:1}
      .brand .logo{width:min(300px,56vw)!important;max-height:210px!important;object-fit:contain!important;border-radius:16px!important;margin-bottom:12px!important;box-shadow:0 12px 35px rgba(0,0,0,.48)}
      .brand .tag{background:#151007!important;border:1px solid var(--dfOrange)!important;color:var(--dfYellow)!important;padding:8px 20px!important;font-weight:900!important}
      #heroTitle{font-size:46px!important;line-height:1!important;letter-spacing:-1px!important;margin:17px 0 8px!important;color:var(--dfWhite)!important;text-shadow:0 4px 16px #000!important}
      #heroTitle .dfProWord{color:var(--dfOrange)!important}
      #heroSub{font-size:13px!important;color:#e0e2e5!important;letter-spacing:.14em!important;font-weight:800!important;text-shadow:0 2px 10px #000!important}

      #appContent>.tabs{position:relative!important;top:auto!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:14px!important;margin:16px 0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
      #appContent>.tabs .tab{min-height:112px!important;border-radius:16px!important;background:linear-gradient(180deg,#121519,#090b0e)!important;border:1px solid #3d454e!important;color:var(--dfWhite)!important;font-size:13px!important;font-weight:900!important;letter-spacing:.04em!important;box-shadow:0 12px 28px rgba(0,0,0,.30)!important;transition:.18s ease!important}
      #appContent>.tabs .tab:hover{transform:translateY(-2px);border-color:#757d86!important}
      #appContent>.tabs .tab.on{border:2px solid var(--dfOrange)!important;background:linear-gradient(180deg,#2b1b03,#100c06)!important;color:var(--dfYellow)!important;box-shadow:0 0 0 1px rgba(255,212,71,.12),0 0 24px rgba(255,152,0,.28)!important}
      #appContent>.tabs .tab:not(#btEx):not(#btSa):not(#btCu):not(#btFo){display:none!important}

      #dfBetaApp{margin:16px 0!important;padding:18px 22px!important;background:linear-gradient(105deg,#241503 0%,#120e08 48%,#6a2a00 100%)!important;border:1px solid var(--dfOrange)!important;border-radius:15px!important;box-shadow:0 12px 30px rgba(0,0,0,.32)!important;color:var(--dfWhite)!important}
      #dfBetaApp strong{color:var(--dfYellow)!important;font-size:17px!important}#dfBetaApp span,#dfBetaApp small{color:#f4f4f2!important}

      .card{background:linear-gradient(180deg,rgba(14,16,19,.97),rgba(7,8,10,.98))!important;border:1px solid #363d44!important;border-radius:16px!important;box-shadow:0 16px 38px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.025)!important;color:var(--dfWhite)!important}
      .card h1,.card h2,.card h3,.card h4{color:var(--dfWhite)!important}.card .tag,.card strong{color:var(--dfYellow)}
      input,select,textarea,.kpi,.formRow,.savedItem{background:#0b0e12!important;border-color:#3b434c!important;color:var(--dfWhite)!important}
      button,.btn{border-color:#4a5057}button.primary,.btn.primary,.btn.on{background:linear-gradient(180deg,#ffad19,#f28a00)!important;color:#0b0b0b!important;border-color:#ffc34f!important;font-weight:900!important}
      #dfQuickAccess{display:none!important}

      #dfProSide{position:fixed;left:0;top:0;bottom:0;width:210px;z-index:50;padding:24px 13px 18px;background:linear-gradient(180deg,rgba(4,5,6,.98),rgba(8,9,11,.96));border-right:1px solid #292d32;box-shadow:18px 0 40px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:8px}
      #dfProSide:after{content:'';position:absolute;right:-1px;top:0;bottom:0;width:1px;background:linear-gradient(transparent,var(--dfOrange),transparent);opacity:.45}
      #dfProSide .dfSideLogo{width:120px;display:block;margin:5px auto 22px;border-radius:10px}
      #dfProSide button{width:100%;min-height:54px;border:1px solid transparent;border-radius:12px;background:transparent;color:#e7e9eb;font-weight:850;font-size:12px;text-align:left;padding:0 14px;display:flex;align-items:center;gap:11px}
      #dfProSide button:hover{background:#121416;border-color:#34383d}
      #dfProSide button.on{border-color:var(--dfOrange);background:linear-gradient(90deg,#3a2204,#12100b);color:var(--dfYellow);box-shadow:inset 4px 0 0 var(--dfOrange),0 0 18px rgba(255,152,0,.12)}
      #dfProSide .ico{width:24px;text-align:center;font-size:18px;color:var(--dfOrange)}
      #dfProSide .sep{height:1px;background:linear-gradient(90deg,transparent,#555,transparent);margin:8px}
      #dfProSide .sideBottom{margin-top:auto;color:#8c939a;font-size:10px;line-height:1.55;padding:8px 10px;letter-spacing:.08em}
      #dfProRightText{position:fixed;right:22px;top:24px;z-index:3;color:#92989e;font-size:10px;line-height:1.45;text-align:right;letter-spacing:.14em;text-transform:uppercase;pointer-events:none}#dfProRightText b{color:var(--dfOrange)!important}

      @media(min-width:900px){#appContent.w{max-width:none!important;margin-left:235px!important;margin-right:22px!important}}
      @media(max-width:899px){#dfProSide,#dfProRightText{display:none!important}#appContent.w{max-width:850px!important;margin:auto!important}}
      @media(max-width:650px){body{background-attachment:scroll!important}#appContent.w{padding:12px 10px 36px!important}.brand{min-height:330px!important;padding:22px 14px!important;border-radius:18px!important;background-position:center center!important}.brand .logo{width:min(245px,72vw)!important;max-height:170px!important}#heroTitle{font-size:31px!important}#heroSub{font-size:10px!important;letter-spacing:.07em!important}#appContent>.tabs{grid-template-columns:repeat(2,1fr)!important;gap:9px!important}#appContent>.tabs .tab{min-height:72px!important;font-size:11px!important}#dfBetaApp{padding:14px!important}}
    `;
    document.head.appendChild(st);
  }

  function clickId(id){const e=$(id);if(e){e.click();return true}return false}
  function ensureSide(){if($('dfProSide'))return;const side=document.createElement('aside');side.id='dfProSide';side.innerHTML=`<img class="dfSideLogo" src="./logo.jpg.jpeg?v=20260904-logo-exata8" alt="DF"><button type="button" data-go="home" class="on"><span class="ico">⌂</span>INÍCIO</button><button type="button" data-go="btEx"><span class="ico">⚙</span>EXTRUSÃO</button><button type="button" data-go="btSa"><span class="ico">▣</span>SACOLAS</button><button type="button" data-go="btCu"><span class="ico">▥</span>CUSTO</button><button type="button" data-go="btFo"><span class="ico">⚗</span>FORMULAÇÃO</button><div class="sep"></div><button type="button" data-go="btAj"><span class="ico">?</span>AJUDA</button><button type="button" data-go="btFb"><span class="ico">●</span>FEEDBACK</button><button type="button" data-go="fav"><span class="ico">★</span>FAVORITOS</button><div class="sideBottom">DF EXTRUSOR PRO<br>MANUTENÇÃO E CONSULTORIA</div>`;document.body.appendChild(side);side.addEventListener('click',e=>{const b=e.target.closest('button[data-go]');if(!b)return;const go=b.dataset.go;if(go==='home'){document.body.classList.remove('dfSectionMode');try{if(typeof window.show==='function')window.show('ex')}catch(_){clickId('btEx')}window.scrollTo({top:0,behavior:'smooth'});}else if(go==='fav'){if(!clickId('dfFavBtn'))location.hash='#favoritos';}else clickId(go);setTimeout(syncSide,100);});}
  function ensureRight(){if($('dfProRightText'))return;const d=document.createElement('div');d.id='dfProRightText';d.innerHTML='TECNOLOGIA<br><b>EFICIÊNCIA</b><br>RESULTADOS';document.body.appendChild(d)}
  function styleTitle(){const h=$('heroTitle');if(!h)return;if((h.textContent||'').trim()==='DF EXTRUSOR PRO'&&!h.querySelector('.dfProWord'))h.innerHTML='DF EXTRUSOR <span class="dfProWord">PRO</span>'}
  function reorderHome(){const app=$('appContent');if(!app)return;const brand=app.querySelector(':scope > .brand');const tabs=app.querySelector(':scope > .tabs');const beta=$('dfBetaApp');if(brand&&tabs&&brand.nextElementSibling!==tabs)brand.insertAdjacentElement('afterend',tabs);if(tabs&&beta&&tabs.nextElementSibling!==beta)tabs.insertAdjacentElement('afterend',beta)}
  function syncSide(){const side=$('dfProSide');if(!side)return;side.querySelectorAll('button').forEach(b=>b.classList.remove('on'));let target='home';if($('pgFb')?.classList.contains('on'))target='btFb';else if($('pgAj')?.classList.contains('on'))target='btAj';else if($('pgFav')?.classList.contains('on'))target='fav';else if($('pgFo')?.classList.contains('on'))target='btFo';else if($('pgCu')?.classList.contains('on'))target='btCu';else if($('pgSa')?.classList.contains('on'))target='btSa';else if($('pgEx')?.classList.contains('on')&&window.scrollY>180)target='btEx';side.querySelector('[data-go="'+target+'"]')?.classList.add('on')}
  function mount(){addStyle();ensureSide();ensureRight();styleTitle();reorderHome();syncSide()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();window.addEventListener('df-ui-ready',()=>setTimeout(mount,100));window.addEventListener('scroll',()=>requestAnimationFrame(syncSide),{passive:true});const mo=new MutationObserver(()=>requestAnimationFrame(()=>{styleTitle();reorderHome();syncSide()}));mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});setTimeout(mount,400);setTimeout(mount,1100);
})();
