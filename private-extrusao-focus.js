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

  function addStyle(){
    if(document.getElementById('dfExtrusaoFocusStyle'))return;
    const st=document.createElement('style');
    st.id='dfExtrusaoFocusStyle';
    st.textContent=`
      body.df-ex-focus{background:#080b13!important}
      body.df-ex-focus #appContent{display:block!important}
      body.df-ex-focus #appContent>.brand,
      body.df-ex-focus #appContent>.tabs,
      body.df-ex-focus #dfProTop,
      body.df-ex-focus #dfQuickPanel,
      body.df-ex-focus #dfSystemMini,
      body.df-ex-focus #dfBetaApp,
      body.df-ex-focus #dfQuickAccessBar,
      body.df-ex-focus #dfFavoritesBar,
      body.df-ex-focus #dfHelpExtra,
      body.df-ex-focus #dfFeedbackExtra,
      body.df-ex-focus #dfInstallArea,
      body.df-ex-focus #dfUpdateArea,
      body.df-ex-focus #dfSystemExtra,
      body.df-ex-focus #dfFormulaBottomOrder,
      body.df-ex-focus #dfWhatsappUserNumber,
      body.df-ex-focus #dfCloudBackupAuto,
      body.df-ex-focus #dfBackupStatus,
      body.df-ex-focus #dfMachineRecipe,
      body.df-ex-focus #dfCourseLock{display:none!important}
      body.df-ex-focus #appContent>.page{display:none!important}
      body.df-ex-focus #pgEx{display:block!important;margin:0!important}
      body.df-ex-focus .w{max-width:820px!important;padding:14px 12px 36px!important}
      body.df-ex-focus #pgEx>.card{margin-bottom:14px!important}
      body.df-ex-focus #pgEx>.card:first-child{margin-top:0!important}
      @media(max-width:560px){body.df-ex-focus .w{padding:10px 9px 30px!important}}
    `;
    document.head.appendChild(st);
  }

  function enter(){
    if(focused)return;
    focused=true;
    addStyle();
    document.body.classList.add('df-ex-focus');
    try{history.pushState({dfExFocus:true},'',location.pathname+location.search+'#extrusao');}catch(e){}
    setTimeout(function(){window.scrollTo(0,0)},0);
  }

  function exit(){
    focused=false;
    document.body.classList.remove('df-ex-focus');
  }

  function bind(){
    const btn=document.getElementById('btEx');
    if(!btn||btn.dataset.dfFocusBound==='1')return;
    btn.dataset.dfFocusBound='1';
    btn.addEventListener('click',function(){setTimeout(enter,0)});

    const quick=document.querySelector('#dfQuickPanel [data-go="btEx"]');
    if(quick&&quick.dataset.dfFocusBound!=='1'){
      quick.dataset.dfFocusBound='1';
      quick.addEventListener('click',function(){setTimeout(enter,0)});
    }
  }

  window.addEventListener('popstate',function(){
    if(focused)exit();
  });

  function init(){
    addStyle();
    bind();
    setTimeout(bind,250);
    setTimeout(bind,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
