(function(){
  'use strict';
  const KEY='df_private_polish_v1';
  let active=false;
  let abrir='';
  try{
    const u=new URL(location.href);
    const mode=String(u.searchParams.get('visual')||'').toLowerCase();
    abrir=String(u.searchParams.get('abrir')||'').toLowerCase();
    active=mode==='privado'||localStorage.getItem(KEY)==='1';
  }catch(e){}
  if(!active)return;

  let focused=false;
  let currentPage='';
  const map={btEx:'pgEx',btSa:'pgSa',btCu:'pgCu',btFo:'pgFo'};
  const direct={ex:'pgEx',sa:'pgSa',cu:'pgCu',fo:'pgFo'};

  function addStyle(){
    if(document.getElementById('dfSectionFocusStyle'))return;
    const st=document.createElement('style');
    st.id='dfSectionFocusStyle';
    st.textContent=`
      body.df-section-focus{background:#080b13!important}
      body.df-section-focus #appContent{display:block!important;max-width:980px!important;padding:8px 10px 24px!important;margin:0 auto!important}
      body.df-section-focus #appContent>:not(.page):not(#dfSectionBack){display:none!important}
      body.df-section-focus #appContent>.page{display:none!important}
      body.df-section-focus #appContent>.page.df-current-section{display:block!important;margin:0!important;padding:0!important}

      body.df-section-focus #appContent>.page.df-current-section>.card{margin:0 0 8px!important;border-radius:13px!important;padding:12px 13px!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:first-child{margin-top:0!important}
      body.df-section-focus #appContent>.page.df-current-section>.card:last-child{margin-bottom:0!important}
      body.df-section-focus #appContent>.page.df-current-section h2{font-size:18px!important;margin:2px 0 9px!important;line-height:1.1!important}
      body.df-section-focus #appContent>.page.df-current-section .tag{padding:4px 8px!important;font-size:9px!important;margin-top:0!important}
      body.df-section-focus #appContent>.page.df-current-section .grid{gap:8px!important}
      body.df-section-focus #appContent>.page.df-current-section label{font-size:11px!important;margin:6px 0 4px!important;line-height:1.2!important}
      body.df-section-focus #appContent>.page.df-current-section input,
      body.df-section-focus #appContent>.page.df-current-section select,
      body.df-section-focus #appContent>.page.df-current-section textarea{min-height:39px!important;padding:9px 10px!important;font-size:15px!important;border-radius:9px!important}
      body.df-section-focus #appContent>.page.df-current-section .main{font-size:16px!important}
      body.df-section-focus #appContent>.page.df-current-section .manual{margin-top:6px!important}
      body.df-section-focus #appContent>.page.df-current-section .hint,
      body.df-section-focus #appContent>.page.df-current-section .smallNote,
      body.df-section-focus #appContent>.page.df-current-section .formNote,
      body.df-section-focus #appContent>.page.df-current-section .licenseTiny{font-size:10px!important;line-height:1.35!important;margin-top:7px!important}
      body.df-section-focus #appContent>.page.df-current-section .calcBtn{min-height:40px!important;padding:9px 8px!important;margin-top:7px!important;font-size:12px!important;border-radius:9px!important}
      body.df-section-focus #appContent>.page.df-current-section .result{margin-top:8px!important;padding:10px 11px!important;border-radius:11px!important}
      body.df-section-focus #appContent>.page.df-current-section .result span{font-size:10px!important}
      body.df-section-focus #appContent>.page.df-current-section .result b{font-size:23px!important;margin-top:2px!important;line-height:1.15!important}
      body.df-section-focus #appContent>.page.df-current-section .result b.smallRes,
      body.df-section-focus #appContent>.page.df-current-section .result b.midRes{font-size:18px!important}
      body.df-section-focus #appContent>.page.df-current-section .status{font-size:10px!important;margin-top:4px!important;line-height:1.25!important}
      body.df-section-focus #appContent>.page.df-current-section .kpi{padding:8px 10px!important;margin-top:6px!important;border-radius:9px!important;font-size:11px!important;gap:8px!important}
      body.df-section-focus #appContent>.page.df-current-section .formRow,
      body.df-section-focus #appContent>.page.df-current-section .savedItem{padding:9px 10px!important;margin-top:7px!important;border-radius:10px!important}
      body.df-section-focus #appContent>.page.df-current-section .rowTitle{font-size:12px!important}
      body.df-section-focus #appContent>.page.df-current-section .delBtn,
      body.df-section-focus #appContent>.page.df-current-section .miniBtn{padding:7px 8px!important;font-size:10px!important;border-radius:8px!important}
      body.df-section-focus #appContent>.page.df-current-section .savedBtns{gap:5px!important;margin-top:6px!important}
      body.df-section-focus #appContent>.page.df-current-section .savedBtns button{padding:7px 4px!important;font-size:10px!important}
      body.df-section-focus #appContent>.page.df-current-section .pill{padding:3px 6px!important;font-size:9px!important;margin:3px 3px 0 0!important}
      body.df-section-focus #appContent>.page.df-current-section .lockBox{padding:9px 10px!important;font-size:11px!important;border-radius:10px!important}

      #dfSectionBack{display:none;align-items:center;gap:7px;width:max-content;max-width:100%;margin:0 0 7px;padding:7px 11px;border:1px solid #34445b;border-radius:10px;background:#0d1522;color:#f8fafc;font:900 11px system-ui;box-shadow:0 5px 14px rgba(0,0,0,.16)}
      body.df-section-focus #dfSectionBack{display:flex!important}
      #dfSectionBack .arr{font-size:17px;line-height:1;color:#ffd36a}

      @media(min-width:640px){
        body.df-section-focus #appContent>.page.df-current-section .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
      @media(max-width:560px){
        body.df-section-focus #appContent{padding:6px 6px 20px!important}
        body.df-section-focus #appContent>.page.df-current-section>.card{padding:10px!important;margin-bottom:7px!important}
        body.df-section-focus #appContent>.page.df-current-section h2{font-size:16px!important;margin-bottom:7px!important}
        body.df-section-focus #appContent>.page.df-current-section .grid{gap:6px!important}
        body.df-section-focus #appContent>.page.df-current-section label{font-size:10px!important;margin:5px 0 3px!important}
        body.df-section-focus #appContent>.page.df-current-section input,
        body.df-section-focus #appContent>.page.df-current-section select,
        body.df-section-focus #appContent>.page.df-current-section textarea{min-height:36px!important;padding:8px 9px!important;font-size:14px!important}
        body.df-section-focus #appContent>.page.df-current-section .result{margin-top:6px!important;padding:9px!important}
        body.df-section-focus #appContent>.page.df-current-section .result b{font-size:21px!important}
        body.df-section-focus #appContent>.page.df-current-section .calcBtn{min-height:38px!important;padding:8px!important;font-size:11px!important}
        #dfSectionBack{margin:0 0 6px;padding:7px 10px}
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
      if(abrir){location.href='./teste-dashboard.html';return;}
      try{history.back();}catch(e){exit();}
    });
    app.insertBefore(b,app.firstChild);
  }

  function clearCurrent(){
    document.querySelectorAll('#appContent>.page.df-current-section').forEach(function(p){p.classList.remove('df-current-section')});
  }

  function enter(pageId,push){
    const page=document.getElementById(pageId);
    if(!page)return;
    addStyle();
    ensureBack();
    clearCurrent();
    page.classList.add('df-current-section');
    currentPage=pageId;
    focused=true;
    document.body.classList.add('df-section-focus');
    if(push!==false){try{history.pushState({dfSectionFocus:pageId},'',location.pathname+location.search+'#'+pageId.replace('pg','').toLowerCase());}catch(e){}}
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
    btn.addEventListener('click',function(){setTimeout(function(){enter(pageId,true)},0)});
  }

  function bind(){Object.keys(map).forEach(function(id){bindOne(id,map[id])});}
  window.addEventListener('popstate',function(){if(focused)exit()});

  function maybeOpenDirect(){
    if(!abrir||!direct[abrir])return false;
    if(document.getElementById(direct[abrir])){enter(direct[abrir],false);return true;}
    return false;
  }

  function init(){
    addStyle();
    ensureBack();
    bind();
    maybeOpenDirect();
    setTimeout(function(){ensureBack();bind();maybeOpenDirect()},220);
    setTimeout(function(){ensureBack();bind();maybeOpenDirect()},800);
    setTimeout(function(){ensureBack();bind();maybeOpenDirect()},1600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
