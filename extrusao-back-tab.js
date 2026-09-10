(function(){
  'use strict';
  let scheduled=false;

  function addStyle(){
    if(document.getElementById('dfExBackTabStyle'))return;
    const s=document.createElement('style');
    s.id='dfExBackTabStyle';
    s.textContent=`
      #dfExTabs .dfPersistentMenuBtn{
        position:sticky!important;left:0!important;z-index:20!important;flex:0 0 auto!important;
        min-width:92px!important;min-height:46px!important;padding:0 12px!important;
        border:1px solid #f5a000!important;border-radius:12px!important;background:#211400!important;
        color:#ffd36a!important;box-shadow:10px 0 16px rgba(8,11,19,.92)!important;
        font-weight:950!important;font-size:10.5px!important;line-height:1.1!important;
        white-space:nowrap!important;text-transform:uppercase!important;
      }
      #dfExTabs .dfPersistentMenuBtn:active{transform:scale(.96)!important;background:#342000!important}

      @media(max-width:640px){
        body.dfSectionMode.dfExBackInTabs #appContent{padding-top:max(56px,calc(env(safe-area-inset-top,0px) + 8px))!important}
        body.dfSectionMode.dfExBackInTabs #dfSectionHeader{
          display:flex!important;position:static!important;height:auto!important;min-height:34px!important;
          margin:0 0 8px!important;padding:0!important;align-items:center!important;justify-content:center!important;
          background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;
          -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionBack{display:none!important}
        body.dfSectionMode.dfExBackInTabs #dfSectionTitle{
          display:block!important;width:100%!important;margin:0!important;padding:0!important;text-align:center!important;
          font-size:22px!important;line-height:1.1!important;font-weight:950!important;color:#fff!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfExTabs{margin-top:0!important}
        #dfExTabs .dfPersistentMenuBtn{min-width:88px!important;padding:0 10px!important;font-size:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function focusedExtrusao(){
    const pg=document.getElementById('pgEx');
    return !!(pg&&document.body.classList.contains('dfSectionMode')&&pg.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=document.getElementById('dfSectionBack');
    if(back){back.click();return}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(p=>p.classList.remove('dfSectionSelected'));
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function makeMenuButton(){
    const b=document.createElement('button');
    b.type='button';
    b.className='dfPersistentMenuBtn';
    b.dataset.dfPersistentMenu='1';
    b.textContent='← MENU';
    b.setAttribute('aria-label','Voltar para a tela principal');
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();goHome()});
    return b;
  }

  function decorate(){
    scheduled=false;
    addStyle();
    const focused=focusedExtrusao();
    const nav=document.getElementById('dfExTabs');

    if(nav){
      const first=nav.querySelector('.dfExTab[data-tab="extrusao"]');
      if(first){
        if(String(first.textContent||'').trim().toUpperCase().includes('VOLTAR'))first.textContent='EXTRUSÃO';
        first.classList.remove('dfExBackTab');
        first.setAttribute('aria-label','Ir para Extrusão');
        first.setAttribute('title','Extrusão');
      }

      let menu=nav.querySelector(':scope > .dfPersistentMenuBtn');
      if(focused){
        if(!menu){menu=makeMenuButton();nav.insertBefore(menu,nav.firstChild)}
        else if(nav.firstElementChild!==menu)nav.insertBefore(menu,nav.firstChild);
      }else if(menu){menu.remove()}
    }

    document.body.classList.toggle('dfExBackInTabs',focused);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(decorate);
  }

  function init(){
    decorate();
    const pg=document.getElementById('pgEx');
    if(pg&&!pg.dataset.dfExBackObserverV2){
      pg.dataset.dfExBackObserverV2='1';
      new MutationObserver(schedule).observe(pg,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
    }
    if(!document.body.dataset.dfExBackBodyObserverV2){
      document.body.dataset.dfExBackBodyObserverV2='1';
      new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
    }
    window.addEventListener('df-ui-ready',schedule);
    window.addEventListener('pageshow',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();