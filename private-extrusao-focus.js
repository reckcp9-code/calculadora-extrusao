(function(){
  'use strict';
  const KEY='df_private_polish_v1';
  let active=false;
  try{
    const u=new URL(location.href);
    const mode=String(u.searchParams.get('visual')||'').toLowerCase();
    active=mode==='privado'||localStorage.getItem(KEY)==='1';
  }catch(e){}
  if(!active)return;

  let focused=false;
  let currentPage='';
  const map={btEx:'pgEx',btSa:'pgSa',btCu:'pgCu',btFo:'pgFo'};

  function addStyle(){
    if(document.getElementById('dfSectionFocusStyle'))return;
    const st=document.createElement('style');
    st.id='dfSectionFocusStyle';
    st.textContent=`
      body.df-section-focus{background:#080b13!important}
      body.df-section-focus #appContent{display:block!important;max-width:820px!important;padding:10px 10px 34px!important;margin:0 auto!important}
      body.df-section-focus #appContent>:not(.page){display:none!important}
      body.df-section-focus #appContent>.page{display:none!important}
      body.df-section-focus #appContent>.page.df-current-section{display:block!important;margin:0!important;padding:0!important}
      body.df-section-focus #appContent>.page.df-current-section>.card{margin:0 0 12px!important;border-radius:16px!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:first-child{margin-top:0!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:last-child{margin-bottom:0!important}
      @media(max-width:560px){
        body.df-section-focus #appContent{padding:8px 8px 26px!important}
        body.df-section-focus #appContent>.page.df-current-section>.card{padding:15px!important;margin-bottom:10px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function clearCurrent(){
    document.querySelectorAll('#appContent>.page.df-current-section').forEach(function(p){p.classList.remove('df-current-section')});
  }

  function enter(pageId){
    const page=document.getElementById(pageId);
    if(!page)return;
    addStyle();
    clearCurrent();
    page.classList.add('df-current-section');
    currentPage=pageId;
    focused=true;
    document.body.classList.add('df-section-focus');
    try{history.pushState({dfSectionFocus:pageId},'',location.pathname+location.search+'#'+pageId.replace('pg','').toLowerCase());}catch(e){}
    setTimeout(function(){window.scrollTo(0,0)},0);
  }

  function exit(){
    focused=false;
    currentPage='';
    clearCurrent();
    document.body.classList.remove('df-section-focus');
    setTimeout(function(){window.scrollTo(0,0)},0);
  }

  function bindOne(btnId,pageId){
    const btn=document.getElementById(btnId);
    if(!btn||btn.dataset.dfSectionFocusBound==='1')return;
    btn.dataset.dfSectionFocusBound='1';
    btn.addEventListener('click',function(){setTimeout(function(){enter(pageId)},0)});
  }

  function bind(){
    Object.keys(map).forEach(function(id){bindOne(id,map[id])});
  }

  window.addEventListener('popstate',function(){if(focused)exit()});

  function init(){
    addStyle();
    bind();
    setTimeout(bind,220);
    setTimeout(bind,800);
    setTimeout(bind,1600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
