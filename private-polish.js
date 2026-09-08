(function(){
  'use strict';
  const KEY='df_private_polish_v1';
  let active=false;
  try{
    const u=new URL(location.href);
    const mode=String(u.searchParams.get('visual')||'').toLowerCase();
    if(mode==='normal'){localStorage.removeItem(KEY);return;}
    if(mode==='privado'){localStorage.setItem(KEY,'1');active=true;}
    else active=localStorage.getItem(KEY)==='1';
  }catch(e){}
  if(!active)return;

  function addStyle(){
    if(document.getElementById('dfPrivatePolishStyle'))return;
    const st=document.createElement('style');
    st.id='dfPrivatePolishStyle';
    st.textContent=`
      :root{--df-bg:#080b13;--df-card:#111827;--df-card2:#0f172a;--df-line:#2a3548;--df-gold:#f5a000;--df-gold2:#ffd36a;--df-text:#f8fafc;--df-muted:#94a3b8;--df-green:#86efac}
      body{background:radial-gradient(circle at 50% -10%,#131b2b 0,#080b13 38%,#080b13 100%)!important}
      .w{max-width:780px!important;padding:16px 14px 42px!important}
      .brand{border-radius:22px!important;border-color:#2a3038!important;padding:20px 14px 22px!important;box-shadow:0 18px 50px rgba(0,0,0,.34)!important}
      .brand .logo{filter:drop-shadow(0 10px 20px rgba(0,0,0,.25))}
      .brand h1{letter-spacing:-.7px!important;margin-top:14px!important}
      .brand .sub{max-width:620px;margin-left:auto;margin-right:auto;line-height:1.5!important}
      .tag{border-radius:999px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}
      .tabs{top:8px!important;padding:7px!important;gap:7px!important;border-color:#252e3d!important;border-radius:17px!important;box-shadow:0 10px 28px rgba(0,0,0,.32)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .tab{min-height:44px;border-radius:11px!important;transition:transform .12s ease,border-color .12s ease,background .12s ease!important}
      .tab:active{transform:scale(.97)}
      .tab.on{box-shadow:0 5px 16px rgba(245,160,0,.10)}
      .card{border-color:var(--df-line)!important;border-radius:17px!important;padding:17px!important;margin-bottom:13px!important;box-shadow:0 10px 30px rgba(0,0,0,.18)!important}
      .card h2{letter-spacing:-.25px;margin-bottom:15px!important}
      label{font-weight:700;color:#d5deea!important;margin-bottom:7px!important}
      input,select,textarea{background:#0b1322!important;border-color:#344157!important;border-radius:11px!important;min-height:48px;outline:none!important;transition:border-color .14s ease,box-shadow .14s ease,background .14s ease!important}
      input:focus,select:focus,textarea:focus{border-color:#d79318!important;box-shadow:0 0 0 3px rgba(245,160,0,.13)!important;background:#0d1627!important}
      button{cursor:pointer;-webkit-tap-highlight-color:transparent}
      .calcBtn,.licenseBtn,.miniBtn,.delBtn{border-radius:11px!important;transition:transform .12s ease,filter .12s ease,box-shadow .12s ease!important}
      .calcBtn:active,.licenseBtn:active,.miniBtn:active,.delBtn:active{transform:scale(.985)}
      .calcBtn{min-height:48px;box-shadow:0 7px 18px rgba(0,0,0,.14)}
      .result{border-radius:14px!important;padding:16px!important;border-color:#2d503c!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      .result b{letter-spacing:-.45px}
      .kpi{border-radius:11px!important;border-color:#2c3749!important;background:#0c1422!important}
      .formRow,.savedItem{border-color:#2c3749!important;box-shadow:0 6px 16px rgba(0,0,0,.12)}
      .hint,.smallNote,.formNote{line-height:1.55!important}
      .foot{padding-top:4px}
      .licenseBox{border-radius:21px!important;border-color:#2c3749!important;box-shadow:0 28px 90px rgba(0,0,0,.5)!important}
      .dfBetaBox{border-radius:14px!important}
      @media(max-width:560px){
        .w{padding:12px 11px 38px!important}.brand{margin-top:2px!important;padding:17px 11px 20px!important}.brand h1{font-size:29px!important}.tabs{margin:12px 0 14px!important}.card{padding:15px!important}.result b{font-size:29px!important}.grid{gap:10px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function badge(){
    const brand=document.querySelector('#appContent .brand');
    if(!brand||document.getElementById('dfPrivateVisualBadge'))return;
    const b=document.createElement('div');
    b.id='dfPrivateVisualBadge';
    b.textContent='VISUAL EM TESTE — SOMENTE NESTE APARELHO';
    b.style.cssText='margin:10px auto 0;width:max-content;max-width:95%;padding:6px 10px;border:1px solid #334155;border-radius:999px;background:#0f172a;color:#94a3b8;font:800 10px system-ui;letter-spacing:.04em';
    brand.appendChild(b);
  }

  function init(){addStyle();badge();setTimeout(badge,250);setTimeout(badge,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
