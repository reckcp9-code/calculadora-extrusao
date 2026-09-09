(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfHomeSwapMenuStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeSwapMenuStyle';
    s.textContent=`
      #dfHomeMenuAnchor{display:none!important}
      body.dfHomeMode #appContent>.tabs{
        margin:0 0 12px!important;
      }
      body.dfHomeMode #dfQuickAccess{
        margin:12px 0 10px!important;
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

    /* Acessos rápidos descem exatamente para o local original do menu principal. */
    if(anchor.parentNode&&quick.nextElementSibling!==anchor){
      anchor.parentNode.insertBefore(quick,anchor);
    }
  }

  function init(){
    swap();
    requestAnimationFrame(swap);
    setTimeout(swap,120);
    setTimeout(swap,500);
    setTimeout(swap,1200);

    const app=$('appContent')||document.body;
    if(app&&!app.dataset.dfHomeSwapObserver){
      app.dataset.dfHomeSwapObserver='1';
      const mo=new MutationObserver(()=>requestAnimationFrame(swap));
      mo.observe(app,{childList:true,subtree:true});
    }

    window.addEventListener('df-ui-ready',()=>setTimeout(swap,80));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(swap,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();