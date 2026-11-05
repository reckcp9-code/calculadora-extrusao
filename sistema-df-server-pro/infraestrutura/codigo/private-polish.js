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
      :root{--dfbg:#070b12;--dfpanel:#0c1320;--dfpanel2:#111a2a;--dfline:#26354a;--dfgold:#f5a000;--dfgold2:#ffd36a;--dftext:#f8fafc;--dfmuted:#94a3b8;--dfgreen:#45e07a;--dfblue:#4ca7ff}
      body{background:linear-gradient(180deg,#070b12 0,#0a101b 55%,#070b12 100%)!important;color:var(--dftext)!important}
      .w{max-width:1180px!important;padding:14px 18px 46px!important}
      #dfProTop{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#080d16;border:1px solid #1f2b3b;border-radius:16px;padding:11px 14px;margin:0 0 12px;box-shadow:0 14px 35px rgba(0,0,0,.28)}
      .dfProTitle{display:flex;align-items:center;gap:11px;min-width:0}.dfProMark{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#17100a,#392300);border:1px solid #8b5b00;color:var(--dfgold2);font-weight:1000}.dfProName{font-size:16px;font-weight:1000;letter-spacing:.02em;white-space:nowrap}.dfProSub{font-size:10px;color:#7f8da2;margin-top:2px;letter-spacing:.08em}.dfProStatus{display:flex;align-items:center;gap:8px;border:1px solid #165c33;background:#082417;color:#8cf0ad;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:900;white-space:nowrap}.dfDot{width:8px;height:8px;background:#3ee878;border-radius:50%;box-shadow:0 0 12px #3ee878}
      .brand{position:relative;overflow:hidden;text-align:left!important;min-height:260px;border-radius:22px!important;border-color:#29384c!important;padding:30px 32px!important;background:radial-gradient(circle at 82% 40%,rgba(245,160,0,.12),transparent 28%),linear-gradient(135deg,#05080d,#0b121e 58%,#101827)!important;box-shadow:0 20px 55px rgba(0,0,0,.35)!important}
      .brand:after{content:'';position:absolute;right:-45px;top:-65px;width:330px;height:330px;border-radius:50%;border:1px solid rgba(245,160,0,.12);box-shadow:0 0 0 45px rgba(245,160,0,.025),0 0 0 90px rgba(245,160,0,.018);pointer-events:none}
      .brand .logo{width:min(245px,48vw)!important;margin:0 0 14px!important;position:relative;z-index:1;filter:drop-shadow(0 14px 25px rgba(0,0,0,.35))}.brand h1{font-size:38px!important;letter-spacing:-1px!important;margin:12px 0 7px!important;position:relative;z-index:1}.brand .sub{margin:0!important;max-width:690px!important;color:#aab8cb!important;line-height:1.5!important;position:relative;z-index:1}.brand>.tag{position:relative;z-index:1}.tag{border-radius:999px!important}
      #dfPrivateVisualBadge{position:relative;z-index:1!important;margin:14px 0 0!important}
      #dfQuickPanel{margin:14px 0 15px}.dfQuickHead{display:flex;align-items:center;justify-content:space-between;margin:0 2px 9px}.dfQuickHead b{font-size:14px;letter-spacing:.06em}.dfQuickHead span{font-size:10px;color:#708096}.dfQuickGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.dfQuick{border:1px solid #2b3a4e;background:linear-gradient(145deg,#111a2a,#0a111d);color:white;border-radius:15px;padding:16px;text-align:left;min-height:112px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 10px 25px rgba(0,0,0,.18);transition:.14s transform,.14s border-color}.dfQuick:hover{border-color:#4b607d}.dfQuick:active{transform:scale(.985)}.dfQuick.gold{border-color:#8f6200;background:linear-gradient(145deg,#2b1b02,#11100d)}.dfQuick .ico{font-size:24px}.dfQuick strong{font-size:14px}.dfQuick small{display:block;color:#93a3ba;font-size:10px;line-height:1.35;margin-top:4px}.dfQuick.gold small{color:#d7c08a}
      .tabs{top:8px!important;padding:6px!important;gap:7px!important;border-color:#27364a!important;border-radius:15px!important;background:#080e18ee!important;box-shadow:0 10px 28px rgba(0,0,0,.28)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .tab{min-height:45px;border-radius:10px!important;transition:.14s transform,.14s border-color,.14s background!important}.tab:active{transform:scale(.98)}.tab.on{box-shadow:inset 0 0 0 1px rgba(255,211,106,.08),0 6px 18px rgba(245,160,0,.08)}
      .card{border-color:#2a394d!important;border-radius:16px!important;padding:18px!important;margin-bottom:13px!important;background:linear-gradient(180deg,#111827,#0d1522)!important;box-shadow:0 10px 30px rgba(0,0,0,.16)!important}.card h2{letter-spacing:-.25px!important;margin-bottom:15px!important}
      label{font-weight:750;color:#d4deea!important;margin-bottom:7px!important}input,select,textarea{background:#09111d!important;border-color:#34445b!important;border-radius:10px!important;min-height:48px;outline:none!important;transition:.14s border-color,.14s box-shadow!important}input:focus,select:focus,textarea:focus{border-color:#d9981e!important;box-shadow:0 0 0 3px rgba(245,160,0,.12)!important}
      .calcBtn,.licenseBtn,.miniBtn,.delBtn{border-radius:10px!important;transition:.12s transform,.12s filter!important}.calcBtn:active,.licenseBtn:active,.miniBtn:active,.delBtn:active{transform:scale(.985)}.result{border-radius:13px!important;padding:16px!important}.kpi,.formRow,.savedItem{border-radius:11px!important;border-color:#2c3b50!important}.hint,.smallNote,.formNote{line-height:1.55!important}.dfBetaBox{border-radius:13px!important}
      #dfSystemMini{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:12px 0 16px}.dfMini{border:1px solid #26364a;background:#0c1421;border-radius:12px;padding:12px}.dfMini span{display:block;color:#74849a;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.dfMini b{display:block;margin-top:5px;font-size:12px}.dfMini .ok{color:#71e49a!important}
      @media(max-width:760px){.w{padding:10px 10px 40px!important}.brand{min-height:0!important;padding:22px 18px!important;text-align:center!important}.brand .logo{margin:0 auto 12px!important}.brand h1{font-size:30px!important}.brand .sub{margin:0 auto!important}.brand #dfPrivateVisualBadge{margin:12px auto 0!important}.dfQuickGrid{grid-template-columns:1fr 1fr}.dfQuick{min-height:104px;padding:14px}#dfSystemMini{grid-template-columns:1fr 1fr}.dfProSub{display:none}}
      @media(max-width:430px){#dfProTop{padding:9px 10px}.dfProName{font-size:13px}.dfProStatus{padding:7px 9px}.brand h1{font-size:27px!important}.dfQuick strong{font-size:13px}.tabs{gap:5px!important}.tab{font-size:9px!important}}
    `;
    document.head.appendChild(st);
  }

  function badge(){
    const brand=document.querySelector('#appContent .brand');
    if(!brand||document.getElementById('dfPrivateVisualBadge'))return;
    const b=document.createElement('div');
    b.id='dfPrivateVisualBadge';
    b.textContent='VISUAL PROFISSIONAL EM TESTE — SOMENTE NESTE APARELHO';
    b.style.cssText='width:max-content;max-width:95%;padding:6px 10px;border:1px solid #3b4a60;border-radius:999px;background:#0b1422;color:#9aabc0;font:800 9px system-ui;letter-spacing:.07em';
    brand.appendChild(b);
  }

  function go(id){
    const el=document.getElementById(id);
    if(el){el.click();setTimeout(function(){const t=document.querySelector('.tabs');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},40)}
  }

  function dashboard(){
    const app=document.getElementById('appContent');
    const brand=app&&app.querySelector('.brand');
    const tabs=app&&app.querySelector('.tabs');
    if(!app||!brand||!tabs)return;

    if(!document.getElementById('dfProTop')){
      const top=document.createElement('div');top.id='dfProTop';
      top.innerHTML='<div class="dfProTitle"><div class="dfProMark">DF</div><div><div class="dfProName">DF EXTRUSOR <span style="color:#f5a000">PRO</span></div><div class="dfProSub">MANUTENÇÃO E CONSULTORIA</div></div></div><div class="dfProStatus"><i class="dfDot"></i>Sistema Online</div>';
      app.insertBefore(top,brand);
    }

    if(!document.getElementById('dfQuickPanel')){
      const q=document.createElement('section');q.id='dfQuickPanel';
      q.innerHTML='<div class="dfQuickHead"><b>⚡ ACESSO RÁPIDO</b><span>FERRAMENTAS PRINCIPAIS</span></div><div class="dfQuickGrid">'+
        '<button class="dfQuick gold" data-go="btEx"><span class="ico">⚙️</span><div><strong>EXTRUSÃO</strong><small>Peso por metro, micra e ajustes.</small></div></button>'+
        '<button class="dfQuick" data-go="btSa"><span class="ico">🛍️</span><div><strong>SACOLAS</strong><small>Pacotes, fardos e quantidades.</small></div></button>'+
        '<button class="dfQuick" data-go="btCu"><span class="ico">🧮</span><div><strong>CUSTO</strong><small>Cálculo de custos de produção.</small></div></button>'+
        '<button class="dfQuick" data-go="btFo"><span class="ico">🧪</span><div><strong>FORMULAÇÃO</strong><small>Misturas, materiais e percentuais.</small></div></button>'+
      '</div>';
      tabs.parentNode.insertBefore(q,tabs);
      q.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-go'))})});
    }

    if(!document.getElementById('dfSystemMini')){
      const s=document.createElement('div');s.id='dfSystemMini';
      s.innerHTML='<div class="dfMini"><span>Status</span><b class="ok">● Online</b></div><div class="dfMini"><span>Versão</span><b>v1.0.84</b></div><div class="dfMini"><span>Modo</span><b>PRO Beta</b></div><div class="dfMini"><span>Visual</span><b>Privado</b></div>';
      tabs.insertAdjacentElement('afterend',s);
    }
  }

  function init(){addStyle();dashboard();badge();setTimeout(function(){dashboard();badge()},220);setTimeout(function(){dashboard();badge()},850)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
