(function(){
  'use strict';
  const KEY='df_section_view_mode_v1';
  let mode='topics';
  try{mode=sessionStorage.getItem(KEY)||'topics'}catch(e){}
  if(mode!=='scroll')mode='topics';

  function addStyle(){
    if(document.getElementById('dfSectionScrollStyle'))return;
    const s=document.createElement('style');
    s.id='dfSectionScrollStyle';
    s.textContent=`
      #dfSectionViewToggle{display:none;margin-left:auto;min-height:40px;padding:8px 12px;border:1px solid #f5a000;border-radius:12px;background:#211400;color:#ffd36a;font-size:10.5px;font-weight:950;line-height:1.05;white-space:nowrap}
      body.dfSectionMode #dfSectionViewToggle{display:block!important}
      body.dfSectionMode.dfSectionScroll #pgEx>#dfExTabs{display:none!important}
      body.dfSectionMode.dfSectionScroll .page.dfSectionSelected>.dfAutoTopics{display:none!important}
      body.dfSectionMode.dfSectionScroll #pgEx.dfExTabsReady>.card[data-df-ex-group]{display:block!important}
      body.dfSectionMode.dfSectionScroll .page.dfSectionSelected.dfTopicReady>.card[data-df-topic]{display:block!important}
      body.dfSectionMode.dfSectionScroll .page.dfSectionSelected>.card{display:block!important}
      @media(max-width:560px){#dfSectionViewToggle{padding:7px 9px;font-size:9.5px;min-height:39px}}
    `;
    document.head.appendChild(s);
  }

  function apply(){
    const body=document.body;
    if(!body)return;
    body.classList.toggle('dfSectionScroll',mode==='scroll');
    const b=document.getElementById('dfSectionViewToggle');
    if(b){
      b.textContent=mode==='scroll'?'▦ USAR TÓPICOS':'↕ ROLAR TUDO';
      b.setAttribute('aria-pressed',mode==='scroll'?'true':'false');
      b.title=mode==='scroll'?'Mostrar uma função por vez':'Mostrar todas as funções para rolar';
    }
  }

  function toggle(){
    mode=mode==='scroll'?'topics':'scroll';
    try{sessionStorage.setItem(KEY,mode)}catch(e){}
    apply();
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function mount(){
    addStyle();
    const h=document.getElementById('dfSectionHeader');
    if(h&&!document.getElementById('dfSectionViewToggle')){
      const b=document.createElement('button');
      b.id='dfSectionViewToggle';
      b.type='button';
      b.addEventListener('click',toggle);
      h.appendChild(b);
    }
    apply();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,120));
  const mo=new MutationObserver(()=>requestAnimationFrame(mount));
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(mount,500);
  setTimeout(mount,1200);
})();
