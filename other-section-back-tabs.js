(function(){
  'use strict';

  const IDS=['pgSa','pgCu','pgFo'];

  function addStyle(){
    if(document.getElementById('dfOtherBackTabsStyle'))return;
    const s=document.createElement('style');
    s.id='dfOtherBackTabsStyle';
    s.textContent=`
      .dfOtherBackTab{
        border-color:#f5a000!important;
        background:#211400!important;
        color:#ffd36a!important;
      }
      .dfOtherSoloNav{display:flex;gap:7px;overflow-x:auto;margin:0 0 14px;padding:3px 1px 10px}
      .dfOtherSoloBack{min-width:92px;min-height:46px;padding:0 12px;border:1px solid #f5a000;border-radius:12px;background:#211400;color:#ffd36a;font-weight:950;font-size:10.5px}
    `;
    document.head.appendChild(s);
  }

  function isFocused(page){
    return !!(page&&document.body.classList.contains('dfSectionMode')&&page.classList.contains('dfSectionSelected'));
  }

  function goHome(){
    const back=document.getElementById('dfSectionBack');
    if(back)back.click();
  }

  function ensureSolo(page){
    let solo=page.querySelector(':scope > .dfOtherSoloNav');
    const auto=page.querySelector(':scope > .dfAutoTopics');
    if(auto){ if(solo)solo.remove(); return; }
    if(!isFocused(page))return;
    if(!solo){
      solo=document.createElement('div');
      solo.className='dfOtherSoloNav';
      solo.innerHTML='<button type="button" class="dfOtherSoloBack">← VOLTAR</button>';
      page.insertBefore(solo,page.firstChild);
      solo.querySelector('button').addEventListener('click',goHome);
    }
  }

  function decorate(page){
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav){ensureSolo(page);return;}

    const buttons=[...nav.querySelectorAll('.dfAutoTopic')];
    if(!buttons.length){ensureSolo(page);return;}

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
        const btn=this;
        if(btn.classList.contains('dfOtherBackTab')){
          e.preventDefault();
          e.stopPropagation();
          goHome();
          return;
        }
        setTimeout(()=>decorate(page),60);
      },true);
    }

    if(!nav.dataset.dfOtherBackBound){
      nav.dataset.dfOtherBackBound='1';
      nav.addEventListener('click',()=>setTimeout(()=>decorate(page),70),false);
    }
  }

  function sync(){
    addStyle();
    IDS.forEach(id=>decorate(document.getElementById(id)));
  }

  function init(){
    sync();
    const app=document.getElementById('appContent')||document.body;
    if(app&&!app.dataset.dfOtherBackObserver){
      app.dataset.dfOtherBackObserver='1';
      new MutationObserver(()=>requestAnimationFrame(sync)).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    document.addEventListener('click',()=>setTimeout(sync,90),true);
    window.addEventListener('df-ui-ready',()=>setTimeout(sync,100));
    setTimeout(sync,400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();