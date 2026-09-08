(function(){
  'use strict';
  try{localStorage.removeItem('df_private_polish_v1')}catch(e){}

  function addStyle(){
    if(document.getElementById('dfClassicReleaseStyle'))return;
    const st=document.createElement('style');
    st.id='dfClassicReleaseStyle';
    st.textContent=`
      body{background:radial-gradient(circle at 50% -10%,#131b2b 0,#080b13 38%,#080b13 100%)!important}
      .w{max-width:780px!important;padding:16px 14px 42px!important}
      .brand{border-radius:22px!important;border-color:#2a3038!important;padding:20px 14px 22px!important;box-shadow:0 18px 50px rgba(0,0,0,.34)!important}
      .brand .logo{filter:drop-shadow(0 10px 20px rgba(0,0,0,.25))}
      .brand h1{letter-spacing:-.7px!important;margin-top:14px!important}
      .brand .sub{max-width:620px;margin-left:auto;margin-right:auto;line-height:1.5!important}
      .tag{border-radius:999px!important}
      .tabs{top:8px!important;padding:7px!important;gap:7px!important;border-color:#252e3d!important;border-radius:17px!important;box-shadow:0 10px 28px rgba(0,0,0,.32)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .tab{min-height:44px;border-radius:11px!important;transition:transform .12s ease,border-color .12s ease,background .12s ease!important}
      .tab:active{transform:scale(.97)}
      .tab.on{box-shadow:0 5px 16px rgba(245,160,0,.10)}
      .card{border-color:#2a3548!important;border-radius:17px!important;padding:17px!important;margin-bottom:13px!important;box-shadow:0 10px 30px rgba(0,0,0,.18)!important}
      .card h2{letter-spacing:-.25px;margin-bottom:15px!important}
      label{font-weight:700;color:#d5deea!important;margin-bottom:7px!important}
      input,select,textarea{background:#0b1322!important;border-color:#344157!important;border-radius:11px!important;min-height:48px;outline:none!important;transition:border-color .14s ease,box-shadow .14s ease,background .14s ease!important}
      input:focus,select:focus,textarea:focus{border-color:#d79318!important;box-shadow:0 0 0 3px rgba(245,160,0,.13)!important;background:#0d1627!important}
      .calcBtn,.licenseBtn,.miniBtn,.delBtn{border-radius:11px!important}
      .calcBtn{min-height:48px;box-shadow:0 7px 18px rgba(0,0,0,.14)}
      .result{border-radius:14px!important;padding:16px!important;border-color:#2d503c!important}
      .kpi{border-radius:11px!important;border-color:#2c3749!important;background:#0c1422!important}
      .dfBetaBox{border-radius:14px!important}
      @media(max-width:560px){
        .w{padding:12px 11px 38px!important}
        .brand{margin-top:2px!important;padding:17px 11px 20px!important}
        .brand h1{font-size:29px!important}
        .tabs{margin:12px 0 14px!important}
        .card{padding:15px!important}
        .result b{font-size:29px!important}
        .grid{gap:10px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function cleanup(){
    ['dfPrivateVisualBadge','dfProTop','dfQuickPanel','dfSystemMini','dfSectionBack'].forEach(function(id){
      const el=document.getElementById(id); if(el) el.remove();
    });
    document.body.classList.remove('df-section-focus','df-ex-focus');
    document.querySelectorAll('.df-current-section').forEach(function(el){el.classList.remove('df-current-section')});
  }

  function init(){addStyle();cleanup()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setTimeout(init,250);
  setTimeout(init,900);
})();