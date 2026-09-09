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

      /* HOME COMPACTA: Curso / Ajuda / Feedback / Favoritos são o fim da tela. */
      body.dfHomeCompact #appContent > .page,
      body.dfHomeCompact #appContent > .foot{
        display:none!important;
      }
      body.dfHomeCompact #dfQuickAccess ~ *{
        display:none!important;
      }
      body.dfHomeCompact #dfQuickAccess{
        margin-bottom:0!important;
      }

      body.dfHomeCompact #appContent>.tabs{
        margin:0 0 12px!important;
      }
      body.dfHomeCompact #dfQuickAccess{
        margin-top:12px!important;
      }

      /* Dentro dos módulos: sem a seta redonda antiga. */
      body.dfSectionMode #dfSectionBack{
        display:none!important;
      }
      body.dfSectionMode #dfSectionHeader{
        justify-content:center!important;
        gap:0!important;
      }
      body.dfSectionMode #dfSectionTitle{
        width:100%!important;
        margin:0!important;
        text-align:center!important;
      }

      .dfOtherBackTab{
        border-color:#f5a000!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:none!important;
      }
      .dfOtherBackTab:active{
        transform:scale(.96)!important;
        background:#342000!important;
      }

      .dfOtherSoloNav{
        display:flex!important;
        gap:7px;
        overflow-x:auto;
        margin:0 0 14px;
        padding:3px 1px 10px;
      }
      .dfOtherSoloBack{
        flex:0 0 auto;
        min-width:92px;
        min-height:46px;
        padding:0 12px;
        border:1px solid #f5a000;
        border-radius:12px;
        background:#211400;
        color:#ffd36a;
        font-weight:950;
        font-size:10.5px;
      }

      @media(max-width:560px){
        body.dfHomeCompact #appContent>.tabs{
          margin:0 0 10px!important;
          gap:7px!important;
        }
        body.dfHomeCompact #dfQuickAccess{
          margin-top:10px!important;
          margin-bottom:0!important;
        }
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

    /* Menu dos módulos sobe logo após a marca. */
    if(tabs.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',tabs);
    }

    /* Curso / Ajuda / Feedback / Favoritos vão para o antigo local do menu. */
    if(anchor.parentNode&&quick.nextElementSibling!==anchor){
      anchor.parentNode.insertBefore(quick,anchor);
    }
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

    if(!home){
      restoreMarked();
      return;
    }

    /* Esconde as páginas mesmo se algum script antigo tentar mostrá-las. */
    app.querySelectorAll('.page,.foot').forEach(function(el){
      el.dataset.dfHomeCut='1';
      el.style.setProperty('display','none','important');
    });

    /* E corta fisicamente tudo que estiver depois dos quatro acessos rápidos. */
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

  function ensureSolo(page){
    let solo=page.querySelector(':scope > .dfOtherSoloNav');
    if(!focused(page)){
      if(solo)solo.remove();
      return;
    }
    if(!solo){
      solo=document.createElement('div');
      solo.className='dfOtherSoloNav';
      solo.innerHTML='<button type="button" class="dfOtherSoloBack">← VOLTAR</button>';
      page.insertBefore(solo,page.firstChild);
      solo.querySelector('button').addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();goHome();
      });
    }
  }

  function decorateOther(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav){ensureSolo(page);return}

    const solo=page.querySelector(':scope > .dfOtherSoloNav');
    if(solo)solo.remove();

    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    if(!buttons.length){ensureSolo(page);return}

    const first=buttons[0];
    if(!first.dataset.dfOriginalLabel){
      first.dataset.dfOriginalLabel=String(first.textContent||'').trim();
    }

    const active=buttons.find(b=>b.classList.contains('on'))||first;
    const shouldBack=focused(page)&&active===first;
    const label=shouldBack?'← VOLTAR':first.dataset.dfOriginalLabel;

    if(String(first.textContent||'').trim()!==label)first.textContent=label;
    first.classList.toggle('dfOtherBackTab',shouldBack);
    first.setAttribute('aria-label',shouldBack?'Voltar para a tela principal':first.dataset.dfOriginalLabel);

    if(!first.dataset.dfOtherBackBound){
      first.dataset.dfOtherBackBound='1';
      first.addEventListener('click',function(e){
        if(this.classList.contains('dfOtherBackTab')){
          e.preventDefault();
          e.stopImmediatePropagation();
          goHome();
        }
      },true);
    }

    if(!nav.dataset.dfOtherBackBound){
      nav.dataset.dfOtherBackBound='1';
      nav.addEventListener('click',function(){setTimeout(syncAll,50)},true);
    }
  }

  function syncOthers(){OTHER_IDS.forEach(id=>decorateOther($(id)))}

  function syncAll(){
    if(syncing)return;
    syncing=true;
    try{
      addStyle();
      restoreMarked();
      swapHome();
      compactHome();
      syncOthers();
    }finally{
      syncing=false;
    }
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