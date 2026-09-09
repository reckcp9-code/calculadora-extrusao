(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfExBackTabStyle'))return;
    const s=document.createElement('style');
    s.id='dfExBackTabStyle';
    s.textContent=`
      #dfExTabs .dfExBackTab{
        border-color:#f5a000!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:none!important;
      }
      #dfExTabs .dfExBackTab:active{
        transform:scale(.96);
        background:#342000!important;
      }

      @media(max-width:640px){
        body.dfSectionMode.dfExBackInTabs #appContent{
          padding-top:max(56px,calc(env(safe-area-inset-top,0px) + 8px))!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionHeader{
          display:flex!important;
          position:static!important;
          height:auto!important;
          min-height:34px!important;
          margin:0 0 8px!important;
          padding:0!important;
          align-items:center!important;
          justify-content:center!important;
          background:transparent!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          -webkit-backdrop-filter:none!important;
          backdrop-filter:none!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionBack{
          display:none!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfSectionTitle{
          display:block!important;
          width:100%!important;
          margin:0!important;
          padding:0!important;
          text-align:center!important;
          font-size:22px!important;
          line-height:1.1!important;
          font-weight:950!important;
          color:#fff!important;
        }
        body.dfSectionMode.dfExBackInTabs #dfExTabs{
          margin-top:0!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function focusedExtrusao(){
    const pg=document.getElementById('pgEx');
    return !!(pg&&document.body.classList.contains('dfSectionMode')&&pg.classList.contains('dfSectionSelected'));
  }

  function syncBodyClass(){
    document.body.classList.toggle('dfExBackInTabs',focusedExtrusao());
  }

  function decorate(){
    addStyle();
    const nav=document.getElementById('dfExTabs');
    if(nav){
      const first=nav.querySelector('.dfExTab[data-tab="extrusao"]');
      if(first){
        first.textContent='← VOLTAR';
        first.classList.add('dfExBackTab');
        first.setAttribute('aria-label','Voltar para a tela principal');
        if(!first.dataset.dfBackBound){
          first.dataset.dfBackBound='1';
          first.addEventListener('click',function(e){
            e.preventDefault();
            e.stopPropagation();
            const back=document.getElementById('dfSectionBack');
            if(back)back.click();
          });
        }
      }
    }
    syncBodyClass();
  }

  function init(){
    decorate();
    const root=document.getElementById('appContent')||document.body;
    if(root&&!root.dataset.dfExBackObserver){
      root.dataset.dfExBackObserver='1';
      new MutationObserver(()=>requestAnimationFrame(decorate)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    document.addEventListener('click',()=>setTimeout(decorate,90),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
  setTimeout(decorate,500);
})();