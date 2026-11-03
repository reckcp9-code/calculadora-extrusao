(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  if($('dfHomeRefinoV6Style'))return;

  const st=document.createElement('style');
  st.id='dfHomeRefinoV6Style';
  st.textContent=`
    :root{--v6-navy:#07111c;--v6-panel:#0b1724;--v6-card:#0d1b2a;--v6-line:#294057;--v6-text:#f7f8fb;--v6-muted:#98a7ba;--v6-amber:#e6a62a;--v6-amber2:#ffc04a}

    body.dfHomeCompact{
      background:
        linear-gradient(180deg,rgba(4,9,15,.12),rgba(3,7,12,.76)),
        url('./teste/industrial-hero-v6.svg') center top/cover fixed no-repeat!important;
    }
    body.dfSectionMode{background:#080b12!important}

    body.dfHomeCompact .brand,
    body:not(.dfSectionMode) .brand{
      padding:22px 18px 18px!important;
      margin:0 0 22px!important;
      min-height:340px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:flex-end!important;
      border:0!important;
      border-radius:0!important;
      overflow:visible!important;
      background:
        linear-gradient(180deg,rgba(3,8,14,.12) 0%,rgba(3,8,14,.24) 50%,rgba(5,10,17,.86) 100%),
        url('./teste/industrial-hero-v6.svg') center 16%/cover no-repeat!important;
      box-shadow:none!important;
      position:relative!important;
    }
    body.dfHomeCompact .brand::after,
    body:not(.dfSectionMode) .brand::after{
      content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;
      background:linear-gradient(90deg,transparent,rgba(230,166,42,.65),transparent)
    }
    body.dfHomeCompact .brand .logo,
    body:not(.dfSectionMode) .brand .logo{
      width:min(360px,84vw)!important;
      max-width:84vw!important;
      height:176px!important;
      object-fit:contain!important;
      object-position:center!important;
      margin:0 0 10px!important;
      background:transparent!important;
      border-radius:0!important;
      mix-blend-mode:screen!important;
      filter:drop-shadow(0 8px 22px rgba(0,0,0,.48))!important;
    }
    body.dfHomeCompact .brand .tag,
    body:not(.dfSectionMode) .brand .tag{
      margin:0 0 12px!important;padding:6px 14px!important;border-radius:999px!important;
      border:1px solid rgba(230,166,42,.8)!important;background:rgba(18,15,8,.74)!important;
      color:#f3c960!important;font-size:10px!important;letter-spacing:.12em!important;
    }
    body.dfHomeCompact .brand h1,
    body:not(.dfSectionMode) .brand h1{
      margin:0 0 6px!important;font-size:30px!important;letter-spacing:-.6px!important;color:#fff!important;
      text-shadow:0 3px 12px rgba(0,0,0,.52)!important;
    }
    body.dfHomeCompact .brand .sub,
    body:not(.dfSectionMode) .brand .sub{
      margin:0!important;padding:0 8px!important;max-width:620px!important;text-align:center!important;
      font-size:10.5px!important;line-height:1.4!important;letter-spacing:.055em!important;color:#9cacc0!important;
      text-shadow:0 2px 8px rgba(0,0,0,.45)!important;
    }

    #dfHomeLead{margin:0 6px 12px!important}
    #dfHomeLead b{font-size:19px!important;color:#fff!important;letter-spacing:-.15px!important}
    #dfHomeLead span{font-size:10.5px!important;color:#8fa0b5!important}

    body.dfHomeCompact #appContent>.tabs,
    body:not(.dfSectionMode) #appContent>.tabs{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;
      padding:0!important;margin:0 0 14px!important;background:transparent!important;border:0!important;box-shadow:none!important;
    }
    body.dfHomeCompact #appContent>.tabs .tab,
    body:not(.dfSectionMode) #appContent>.tabs .tab{
      min-height:160px!important;border:1.5px solid rgba(230,166,42,.96)!important;border-radius:18px!important;
      padding:18px 16px 16px!important;display:block!important;position:relative!important;overflow:hidden!important;
      text-align:left!important;color:var(--v6-text)!important;background-color:#0a1622!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 12px 28px rgba(0,0,0,.27),0 0 0 .5px rgba(255,255,255,.06)!important;
      transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease!important;
    }
    body.dfHomeCompact #appContent>.tabs .tab::before,
    body:not(.dfSectionMode) #appContent>.tabs .tab::before,
    body.dfHomeCompact #appContent>.tabs .tab::after,
    body:not(.dfSectionMode) #appContent>.tabs .tab::after{content:none!important;display:none!important}

    #btEx{order:1!important;background-image:linear-gradient(90deg,rgba(8,17,28,.99) 0%,rgba(8,17,28,.96) 42%,rgba(8,17,28,.42) 68%,rgba(8,17,28,.10) 100%),url('./teste/card-extrusao-v6.svg'),linear-gradient(145deg,#0f2133,#08131e)!important;background-size:100% 100%,58% auto,100% 100%!important;background-position:center,right 2px center,center!important;background-repeat:no-repeat!important}
    #btFo{order:2!important;background-image:linear-gradient(90deg,rgba(8,17,28,.99) 0%,rgba(8,17,28,.96) 44%,rgba(8,17,28,.38) 69%,rgba(8,17,28,.08) 100%),url('./teste/card-formulacao-v6.svg'),linear-gradient(145deg,#0f2133,#08131e)!important;background-size:100% 100%,61% auto,100% 100%!important;background-position:center,right 2px center,center!important;background-repeat:no-repeat!important}
    #btSa{order:3!important;background-image:linear-gradient(90deg,rgba(8,17,28,.99) 0%,rgba(8,17,28,.96) 42%,rgba(8,17,28,.38) 68%,rgba(8,17,28,.08) 100%),url('./teste/card-sacolas-v6.svg'),linear-gradient(145deg,#0f2133,#08131e)!important;background-size:100% 100%,60% auto,100% 100%!important;background-position:center,right 4px center,center!important;background-repeat:no-repeat!important}
    #btCu{order:4!important;background-image:linear-gradient(90deg,rgba(8,17,28,.99) 0%,rgba(8,17,28,.96) 44%,rgba(8,17,28,.36) 70%,rgba(8,17,28,.08) 100%),url('./teste/card-custo-v6.svg'),linear-gradient(145deg,#0f2133,#08131e)!important;background-size:100% 100%,60% auto,100% 100%!important;background-position:center,right 4px center,center!important;background-repeat:no-repeat!important}

    .dfCardCode{position:absolute;left:16px;top:16px;display:flex;align-items:center;justify-content:center;min-width:42px;height:38px;padding:0 8px;border:1px solid rgba(230,166,42,.92);border-radius:10px;background:rgba(6,13,21,.82);color:#f0b638;font:900 11px/1 system-ui;letter-spacing:.10em;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
    .dfCardTitle{position:absolute;left:16px;bottom:47px;max-width:62%;font:900 16px/1.05 system-ui;letter-spacing:.02em;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.65)}
    .dfCardSub{position:absolute;left:16px;bottom:20px;max-width:68%;font:700 9px/1.25 system-ui;color:#98a7ba;text-shadow:0 2px 8px rgba(0,0,0,.65)}
    .dfCardArrow{position:absolute;right:15px;bottom:14px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #36506a;background:rgba(7,17,28,.88);color:#f0ad20;font:800 23px/1 system-ui;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}

    body.dfHomeCompact #appContent>.tabs .tab:active,
    body:not(.dfSectionMode) #appContent>.tabs .tab:active{transform:translateY(1px) scale(.992)!important;border-color:#ffd16a!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 20px rgba(0,0,0,.31)!important}

    #dfBetaApp{min-height:48px!important;padding:10px 14px!important;border-radius:14px!important;border:1px solid #294057!important;background:linear-gradient(180deg,rgba(12,24,38,.95),rgba(8,17,28,.96))!important;color:#e7ebf0!important}
    #dfBetaApp strong{font-size:10.5px!important;color:#e7ebf0!important;letter-spacing:.055em!important}
    #dfBetaApp strong::after{color:#f0ad20!important}

    #dfSystemBar{min-height:50px!important;padding:8px 12px!important;border:1px solid #294057!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(12,24,38,.96),rgba(8,17,28,.96))!important}
    #dfSystemBar .dfSystemVer{color:#dce4ee!important;font-size:9.5px!important;letter-spacing:.045em!important}
    #dfNetBadge{background:#0a1a25!important;border-color:#38516a!important}
    #dfSystemBar .dfSystemBtn:not(.ok):not(.alt){border-color:#7d5b19!important;color:#e9bb50!important;background:#151208!important}

    #dfHomeMoreToggle{min-height:48px!important;border-radius:14px!important;border-color:#294057!important;background:linear-gradient(180deg,rgba(12,24,38,.95),rgba(8,17,28,.96))!important;color:#d7dee8!important;letter-spacing:.07em!important}
    #dfHomeMoreToggle::before{color:#e3a62b!important}

    @media(max-width:430px){
      body.dfHomeCompact .brand,body:not(.dfSectionMode) .brand{min-height:315px!important;padding:18px 14px 16px!important}
      body.dfHomeCompact .brand .logo,body:not(.dfSectionMode) .brand .logo{height:158px!important;width:min(330px,88vw)!important;max-width:88vw!important}
      body.dfHomeCompact .brand h1,body:not(.dfSectionMode) .brand h1{font-size:27px!important}
      body.dfHomeCompact #appContent>.tabs .tab,body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:150px!important;padding:15px 13px!important}
      .dfCardCode{left:13px;top:13px;min-width:39px;height:35px;font-size:10px}
      .dfCardTitle{left:13px;bottom:44px;font-size:14.5px;max-width:66%}
      .dfCardSub{left:13px;bottom:18px;font-size:8.4px;max-width:70%}
      .dfCardArrow{right:12px;bottom:12px;width:32px;height:32px;font-size:21px}
    }
    @media(max-width:370px){
      body.dfHomeCompact #appContent>.tabs,body:not(.dfSectionMode) #appContent>.tabs{gap:9px!important}
      body.dfHomeCompact #appContent>.tabs .tab,body:not(.dfSectionMode) #appContent>.tabs .tab{min-height:142px!important;border-radius:15px!important}
      .dfCardTitle{font-size:13.5px;max-width:70%}.dfCardSub{font-size:7.9px;max-width:72%}
    }
  `;
  document.head.appendChild(st);

  const data={
    btEx:['EX','EXTRUSÃO','Micra • peso/m • processo'],
    btFo:['FO','FORMULAÇÃO','Misturas • OP • PDF'],
    btSa:['SA','SACOLAS','Medidas • produção'],
    btCu:['R$','CUSTO','Preço • margem • kg']
  };
  function enhance(){
    Object.entries(data).forEach(([id,v])=>{
      const b=$(id);if(!b||b.dataset.dfV6==='1')return;
      b.dataset.dfV6='1';
      b.innerHTML='<span class="dfCardCode">'+v[0]+'</span><span class="dfCardTitle">'+v[1]+'</span><span class="dfCardSub">'+v[2]+'</span><span class="dfCardArrow">›</span>';
      b.setAttribute('aria-label',v[1]+' — '+v[2]);
    });
  }
  function run(){enhance()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',()=>setTimeout(run,40));
  let n=0;const t=setInterval(()=>{run();if(++n>50)clearInterval(t)},140);
})();