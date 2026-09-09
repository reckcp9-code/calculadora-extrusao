(function(){
  'use strict';

  function $(id){return document.getElementById(id)}
  const OTHER_IDS=['pgSa','pgCu','pgFo'];

  function addStyle(){
    if($('dfHomeSwapMenuStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeSwapMenuStyle';
    s.textContent=`
      #dfHomeMenuAnchor{display:none!important}

      /* Tela principal limpa: não mostra as calculadoras abaixo do menu. */
      body.dfHomeMode #appContent > .page,
      body.dfHomeMode #appContent > .foot{
        display:none!important;
      }

      body.dfHomeMode #appContent>.tabs{
        margin:0 0 12px!important;
      }
      body.dfHomeMode #dfQuickAccess{
        margin:12px 0 10px!important;
      }

      .dfOtherBackTab{
        border-color:#f5a000!important;
        background:#211400!important;
        color:#ffd36a!important;
      }
      .dfOtherSoloNav{
        display:flex;gap:7px;overflow-x:auto;margin:0 0 14px;padding:3px 1px 10px
      }
      .dfOtherSoloBack{
        min-width:92px;min-height:46px;padding:0 12px;border:1px solid #f5a000;border-radius:12px;background:#211400;color:#ffd36a;font-weight:950;font-size:10.5px
      }

      @media(max-width:560px){
        body.dfHomeMode #appContent>.tabs{
          margin:0 0 10px!important;
          gap:7px!important;
        }
        body.dfHomeMode #dfQuickAccess{
          margin:10px 0 9px!important;
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

  function swap(){
    addStyle();
    const app=$('appContent');
    if(!app)return;
    const brand=app.querySelector(':scope > .brand')||app.querySelector('.brand');
    const tabs=app.querySelector(':scope > .tabs')||app.querySelector('.tabs');
    const quick=$('dfQuickAccess');
    if(!brand||!tabs||!quick)return;

    const anchor=ensureAnchor(app,tabs);

    /* Menu principal sobe para onde ficavam CURSO / AJUDA / FEEDBACK / FAVORITOS. */
    if(tabs.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',tabs);
    }

    /* CURSO / AJUDA / FEEDBACK / FAVORITOS descem para o ponto antigo do menu principal. */
    if(anchor.parentNode&&quick.nextElementSibling!==anchor){
      anchor.parentNode.insertBefore(quick,anchor);
    }
  }

  function isFocused(page){
    return !!(page&&document.body.classList.contains('dfSectionMode')&&page.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=$('dfSectionBack');
    if(back)back.click();
  }

  function ensureSolo(page){
    let solo=page.querySelector(':scope > .dfOtherSoloNav');
    const auto=page.querySelector(':scope > .dfAutoTopics');
    if(auto){if(solo)solo.remove();return}
    if(!isFocused(page)){if(solo)solo.remove();return}
    if(!solo){
      solo=document.createElement('div');
      solo.className='dfOtherSoloNav';
      solo.innerHTML='<button type="button" class="dfOtherSoloBack">← VOLTAR</button>';
      page.insertBefore(solo,page.firstChild);
      solo.querySelector('button').addEventListener('click',goHome);
    }
  }

  function decorateOther(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav){ensureSolo(page);return}

    const buttons=[...nav.querySelectorAll('.dfAutoTopic')];
    if(!buttons.length){ensureSolo(page);return}

    const first=buttons[0];
    if(!first.dataset.dfOriginalLabel)first.dataset.dfOriginalLabel=first.textContent.trim();
    const active=buttons.find(b=>b.classList.contains('on'))||first;
    const onFirst=active===first;

    if(onFirst){
      first.textContent='← VOLTAR';
      first.classList.add('dfOtherBackTab');
      first.setAttribute('aria-label','Voltar para a tela principal');
    }else{
      first.textContent=first.dataset.dfOriginalLabel;
      first.classList.remove('dfOtherBackTab');
      first.setAttribute('aria-label',first.dataset.dfOriginalLabel);
    }

    if(!first.dataset.dfOtherBackBound){
      first.dataset.dfOtherBackBound='1';
      first.addEventListener('click',function(e){
        if(this.classList.contains('dfOtherBackTab')){
          e.preventDefault();
          e.stopPropagation();
          goHome();
          return;
        }
        setTimeout(()=>decorateOther(page),60);
      },true);
    }

    if(!nav.dataset.dfOtherBackBound){
      nav.dataset.dfOtherBackBound='1';
      nav.addEventListener('click',()=>setTimeout(()=>decorateOther(page),70));
    }
  }

  function syncOthers(){
    OTHER_IDS.forEach(id=>decorateOther($(id)));
  }

  function syncAll(){
    addStyle();
    swap();
    syncOthers();
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
      const mo=new MutationObserver(()=>requestAnimationFrame(syncAll));
      mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    window.addEventListener('df-ui-ready',()=>setTimeout(syncAll,80));
    document.addEventListener('click',()=>setTimeout(syncOthers,90),true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(syncAll,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();