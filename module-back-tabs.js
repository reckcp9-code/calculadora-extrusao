(function(){
  'use strict';

  const PAGE_IDS=['pgSa','pgCu','pgFo'];
  let scheduled=false;

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfModuleBackTabsStyle'))return;
    const s=document.createElement('style');
    s.id='dfModuleBackTabsStyle';
    s.textContent=`
      body.dfSectionMode #dfSectionHeader{
        justify-content:center!important;
      }
      body.dfSectionMode #dfSectionBack{
        display:none!important;
      }
      body.dfSectionMode #dfSectionTitle{
        width:100%!important;
        text-align:center!important;
        margin:0!important;
      }
      .dfModuleBackTab{
        border-color:#f5a000!important;
        background:#211400!important;
        color:#ffd36a!important;
        box-shadow:none!important;
      }
      .dfModuleBackTab:active{transform:scale(.96)}
      .dfModuleBackOnlyNav{
        display:flex!important;
        gap:7px;
        overflow-x:auto;
        margin:0 0 14px;
        padding:3px 1px 10px;
      }
      .dfModuleBackOnlyBtn{
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
    `;
    document.head.appendChild(s);
  }

  function focused(page){
    return !!(page && document.body.classList.contains('dfSectionMode') && page.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=$('dfSectionBack');
    if(back){ back.click(); return; }
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(p=>p.classList.remove('dfSectionSelected'));
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function ensureOnlyBack(page){
    let only=page.querySelector(':scope > .dfModuleBackOnlyNav');
    if(!focused(page)){
      if(only)only.remove();
      return;
    }
    if(!only){
      only=document.createElement('div');
      only.className='dfModuleBackOnlyNav';
      const b=document.createElement('button');
      b.type='button';
      b.className='dfModuleBackOnlyBtn';
      b.textContent='← VOLTAR';
      b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();goHome()});
      only.appendChild(b);
      page.insertBefore(only,page.firstChild);
    }
  }

  function syncPage(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav){ensureOnlyBack(page);return}

    const oldOnly=page.querySelector(':scope > .dfModuleBackOnlyNav');
    if(oldOnly)oldOnly.remove();

    const buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    if(!buttons.length){ensureOnlyBack(page);return}

    const first=buttons[0];
    if(!first.dataset.dfModuleOriginalLabel){
      first.dataset.dfModuleOriginalLabel=String(first.textContent||'').trim();
    }

    const active=buttons.find(b=>b.classList.contains('on')) || first;
    const shouldBack=focused(page) && active===first;
    const wanted=shouldBack?'← VOLTAR':first.dataset.dfModuleOriginalLabel;

    if(String(first.textContent||'').trim()!==wanted)first.textContent=wanted;
    first.classList.toggle('dfModuleBackTab',shouldBack);
    first.setAttribute('aria-label',shouldBack?'Voltar para a tela principal':first.dataset.dfModuleOriginalLabel);

    if(!first.dataset.dfModuleBackBound){
      first.dataset.dfModuleBackBound='1';
      first.addEventListener('click',function(e){
        if(this.classList.contains('dfModuleBackTab')){
          e.preventDefault();
          e.stopImmediatePropagation();
          goHome();
        }
      },true);
    }

    if(!nav.dataset.dfModuleBackNavBound){
      nav.dataset.dfModuleBackNavBound='1';
      nav.addEventListener('click',function(){setTimeout(schedule,40)},true);
    }
  }

  function sync(){
    scheduled=false;
    addStyle();
    PAGE_IDS.forEach(id=>syncPage($(id)));
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(sync);
  }

  function init(){
    addStyle();
    sync();
    setTimeout(sync,100);
    setTimeout(sync,400);
    setTimeout(sync,900);

    const root=$('appContent')||document.body;
    if(root&&!root.dataset.dfModuleBackObserver){
      root.dataset.dfModuleBackObserver='1';
      new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    document.addEventListener('click',function(){setTimeout(schedule,60)},true);
    window.addEventListener('df-ui-ready',function(){setTimeout(sync,80)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(sync,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
