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
      body.df-section-focus #appContent>:not(.page):not(#dfSectionBack){display:none!important}
      body.df-section-focus #appContent>.page{display:none!important}
      body.df-section-focus #appContent>.page.df-current-section{display:block!important;margin:0!important;padding:0!important}
      body.df-section-focus #appContent>.page.df-current-section>.card{margin:0 0 12px!important;border-radius:16px!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:first-child{margin-top:0!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:last-child{margin-bottom:0!important}
      #dfSectionBack{display:none;align-items:center;gap:8px;width:max-content;max-width:100%;margin:2px 0 10px;padding:10px 14px;border:1px solid #34445b;border-radius:12px;background:#0d1522;color:#f8fafc;font:900 13px system-ui;box-shadow:0 6px 16px rgba(0,0,0,.18)}
      body.df-section-focus #dfSectionBack{display:flex!important}
      #dfSectionBack .arr{font-size:20px;line-height:1;color:#ffd36a}
      @media(max-width:560px){
        body.df-section-focus #appContent{padding:8px 8px 26px!important}
        body.df-section-focus #appContent>.page.df-current-section>.card{padding:15px!important;margin-bottom:10px!important}
        #dfSectionBack{margin:0 0 8px;padding:9px 12px}
      }
    `;
    document.head.appendChild(st);
  }

  function ensureBack(){
    const app=document.getElementById('appContent');
    if(!app||document.getElementById('dfSectionBack'))return;
    const b=document.createElement('button');
    b.id='dfSectionBack';
    b.type='button';
    b.innerHTML='<span class="arr">←</span><span>VOLTAR</span>';
    b.addEventListener('click',function(){
      try{history.back();}catch(e){exit();}
    });
    app.insertBefore(b,app.firstChild);
  }

  function clearCurrent(){
    document.querySelectorAll('#appContent>.page.df-current-section').forEach(function(p){p.classList.remove('df-current-section')});
  }

  function enter(pageId){
    const page=document.getElementById(pageId);
    if(!page)return;
    addStyle();
    ensureBack();
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

  function bind(){Object.keys(map).forEach(function(id){bindOne(id,map[id])});}
  window.addEventListener('popstate',function(){if(focused)exit()});

  function init(){
    addStyle();
    ensureBack();
    bind();
    setTimeout(function(){ensureBack();bind()},220);
    setTimeout(function(){ensureBack();bind()},800);
    setTimeout(function(){ensureBack();bind()},1600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
