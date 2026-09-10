(function(){
  'use strict';

  function $(id){return document.getElementById(id)}
  const OTHER_IDS=['pgSa','pgCu','pgFo'];
  let syncing=false;

  function addStyle(){
    if($('dfHomeSwapMenuStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeSwapMenuStyle';
    s.textContent=`
      #dfHomeMenuAnchor{display:none!important}

      /* HOME COMPACTA: Curso / Ajuda / Feedback / Favoritos sao o fim da tela. */
      body.dfHomeCompact #appContent > .page,
      body.dfHomeCompact #appContent > .foot{display:none!important}
      body.dfHomeCompact #dfQuickAccess ~ *{display:none!important}
      body.dfHomeCompact #dfQuickAccess{margin-bottom:0!important}
      body.dfHomeCompact #appContent>.tabs{margin:0 0 12px!important}
      body.dfHomeCompact #dfQuickAccess{margin-top:12px!important}

      /* Dentro dos modulos: sem a seta redonda antiga. */
      body.dfSectionMode #dfSectionBack{display:none!important}
      body.dfSectionMode #dfSectionHeader{justify-content:center!important;gap:0!important}
      body.dfSectionMode #dfSectionTitle{width:100%!important;margin:0!important;text-align:center!important}

      /* MENU fica sempre visivel no primeiro lugar da barra interna. */
      .dfPersistentMenuBtn{
        position:sticky!important;
        left:0!important;
        z-index:20!important;
        flex:0 0 auto!important;
        min-width:92px!important;
        min-height:46px!important;
        padding:0 12px!important;
        border:1px solid #f5a000!important;
        border-radius:12px!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:10px 0 16px rgba(8,11,19,.92)!important;
        font-weight:950!important;
        font-size:10.5px!important;
        line-height:1.1!important;
        white-space:nowrap!important;
        text-transform:uppercase!important;
      }
      .dfPersistentMenuBtn:active{transform:scale(.96)!important;background:#342000!important}

      .dfOtherSoloNav{display:flex!important;gap:7px;overflow-x:auto;margin:0 0 14px;padding:3px 1px 10px}

      @media(max-width:560px){
        body.dfHomeCompact #appContent>.tabs{margin:0 0 10px!important;gap:7px!important}
        body.dfHomeCompact #dfQuickAccess{margin-top:10px!important;margin-bottom:0!important}
        .dfPersistentMenuBtn{min-width:88px!important;padding:0 10px!important;font-size:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureAnchor(app,tabs){
    let a=$('dfHomeMenuAnchor');
    if(a)return a;
    a=document.createElement('div');
    a.id='dfHomeMenuAnchor';
    a.setAttribute('aria-hidden','true');
    tabs.parentNode.insertBefore(a,tabs);
    return a;
  }

  function swapHome(){
    const app=$('appContent');
    if(!app)return;
    const brand=app.querySelector(':scope > .brand')||app.querySelector('.brand');
    const tabs=app.querySelector(':scope > .tabs')||app.querySelector('.tabs');
    const quick=$('dfQuickAccess');
    if(!brand||!tabs||!quick)return;

    const anchor=ensureAnchor(app,tabs);
    if(tabs.previousElementSibling!==brand)brand.insertAdjacentElement('afterend',tabs);
    if(anchor.parentNode&&quick.nextElementSibling!==anchor)anchor.parentNode.insertBefore(quick,anchor);
  }

  function sectionActive(){
    const app=$('appContent');
    if(!app)return false;
    return document.body.classList.contains('dfSectionMode') && !!app.querySelector(':scope > .page.dfSectionSelected');
  }

  function restoreMarked(){
    document.querySelectorAll('[data-df-home-cut="1"]').forEach(function(el){
      el.style.removeProperty('display');
      delete el.dataset.dfHomeCut;
    });
  }

  function compactHome(){
    const app=$('appContent');
    if(!app)return;
    const home=!sectionActive();
    document.body.classList.toggle('dfHomeCompact',home);

    if(!home){restoreMarked();return}

    app.querySelectorAll('.page,.foot').forEach(function(el){
      el.dataset.dfHomeCut='1';
      el.style.setProperty('display','none','important');
    });

    const quick=$('dfQuickAccess');
    if(quick&&quick.parentElement){
      let el=quick.nextElementSibling;
      while(el){
        el.dataset.dfHomeCut='1';
        el.style.setProperty('display','none','important');
        el=el.nextElementSibling;
      }
    }
  }

  function focused(page){
    return !!(page&&document.body.classList.contains('dfSectionMode')&&page.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=$('dfSectionBack');
    if(back){back.click();setTimeout(syncAll,60);return}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(p=>p.classList.remove('dfSectionSelected'));
    setTimeout(syncAll,20);
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function makeMenuButton(){
    const b=document.createElement('button');
    b.type='button';
    b.className='dfPersistentMenuBtn';
    b.dataset.dfPersistentMenu='1';
    b.textContent='← MENU';
    b.setAttribute('aria-label','Voltar para a tela principal');
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      goHome();
    });
    return b;
  }

  function restoreLegacyFirst(nav){
    if(!nav)return;
    const firstTopic=nav.querySelector('.dfAutoTopic');
    if(!firstTopic)return;
    const original=firstTopic.dataset.dfOriginalLabel||firstTopic.dataset.dfModuleOriginalLabel||'';
    if(original&&String(firstTopic.textContent||'').trim().toUpperCase().includes('VOLTAR'))firstTopic.textContent=original;
    firstTopic.classList.remove('dfOtherBackTab','dfModuleBackTab');
    if(original)firstTopic.setAttribute('aria-label',original);
  }

  function ensureMenu(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    const oldSolo=page.querySelector(':scope > .dfOtherSoloNav');

    if(!focused(page)){
      if(oldSolo)oldSolo.remove();
      if(nav)nav.querySelectorAll(':scope > .dfPersistentMenuBtn').forEach(b=>b.remove());
      return;
    }

    if(!nav){
      let solo=oldSolo;
      if(!solo){
        solo=document.createElement('div');
        solo.className='dfOtherSoloNav';
        solo.appendChild(makeMenuButton());
        page.insertBefore(solo,page.firstChild);
      }
      return;
    }

    if(oldSolo)oldSolo.remove();
    restoreLegacyFirst(nav);

    let menu=nav.querySelector(':scope > .dfPersistentMenuBtn');
    if(!menu){menu=makeMenuButton();nav.insertBefore(menu,nav.firstChild)}
    else if(nav.firstElementChild!==menu)nav.insertBefore(menu,nav.firstChild);
  }

  function syncOthers(){OTHER_IDS.forEach(id=>ensureMenu($(id)))}

  function syncAll(){
    if(syncing)return;
    syncing=true;
    try{
      addStyle();
      restoreMarked();
      swapHome();
      compactHome();
      syncOthers();
    }finally{syncing=false}
  }

  function init(){
    syncAll();
    requestAnimationFrame(syncAll);
    setTimeout(syncAll,120);
    setTimeout(syncAll,500);
    setTimeout(syncAll,1200);

    const app=$('appContent')||document.body;
    if(app&&!app.dataset.dfHomeSwapObserver){
      app.dataset.dfHomeSwapObserver='1';
      const mo=new MutationObserver(function(){requestAnimationFrame(syncAll)});
      mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    const bodyMo=new MutationObserver(function(){requestAnimationFrame(syncAll)});
    bodyMo.observe(document.body,{attributes:true,attributeFilter:['class']});

    window.addEventListener('df-ui-ready',function(){setTimeout(syncAll,80)});
    document.addEventListener('click',function(){setTimeout(syncAll,80)},true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(syncAll,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();