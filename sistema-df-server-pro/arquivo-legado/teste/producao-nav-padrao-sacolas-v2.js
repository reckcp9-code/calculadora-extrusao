(function(){
'use strict';
if(window.DFProducaoNavPadraoSacolasV2)return;window.DFProducaoNavPadraoSacolasV2=true;

function css(){
  if(document.getElementById('dfProdNavPadraoSacolasCssV2'))return;
  var s=document.createElement('style');
  s.id='dfProdNavPadraoSacolasCssV2';
  s.textContent=`
    body>.back{display:none!important}
    #dfProdTopNavSacolas{
      display:flex;align-items:stretch;gap:7px;
      width:100%;margin:0 0 18px;padding:0 0 4px;
      overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;
      scrollbar-width:none;scroll-snap-type:x proximity;
    }
    #dfProdTopNavSacolas::-webkit-scrollbar{display:none}
    #dfProdTopNavSacolas .dfProdTopNavItem{
      appearance:none;-webkit-appearance:none;text-decoration:none;
      height:46px;min-height:46px;border-radius:11px;padding:0 12px;
      display:flex;align-items:center;justify-content:center;
      white-space:nowrap;scroll-snap-align:start;
      font:950 11.5px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      letter-spacing:.01em;text-transform:uppercase;
      box-sizing:border-box;cursor:pointer;user-select:none;
    }
    #dfProdTopNavSacolas .dfProdTopNavMenu{
      flex:0 0 92px;border:1.5px solid #f5a000;
      background:#211400;color:#ffd36a;
    }
    #dfProdTopNavSacolas .dfProdTopNavActive{
      flex:0 0 138px;border:1.5px solid #f5a000;
      background:linear-gradient(180deg,#ffc647 0%,#f5a000 100%);
      color:#101010;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 4px 12px rgba(245,160,0,.14);
    }
    #dfProdTopNavSacolas #dfPrBadge{
      position:static!important;z-index:auto!important;
      right:auto!important;top:auto!important;
      flex:0 0 148px!important;height:46px!important;min-height:46px!important;
      border:1.5px solid #334b67!important;border-radius:11px!important;
      background:#0f172a!important;color:#dce6f5!important;
      padding:0 12px!important;margin:0!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      font:950 11.5px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial!important;
      letter-spacing:.01em!important;white-space:nowrap!important;
      pointer-events:auto!important;cursor:pointer!important;
    }
    @media(max-width:430px){
      #dfProdTopNavSacolas{gap:7px;margin-bottom:16px}
      #dfProdTopNavSacolas .dfProdTopNavItem{height:45px;min-height:45px;padding:0 11px;font-size:11px;border-radius:10px}
      #dfProdTopNavSacolas .dfProdTopNavMenu{flex-basis:86px}
      #dfProdTopNavSacolas .dfProdTopNavActive{flex-basis:137px}
      #dfProdTopNavSacolas #dfPrBadge{flex-basis:154px!important;height:45px!important;min-height:45px!important;font-size:11px!important;border-radius:10px!important}
    }
  `;
  document.head.appendChild(s);
}

function install(){
  css();
  var wrap=document.querySelector('main.wrap');
  var pg=document.getElementById('pgPr');
  var badge=document.getElementById('dfPrBadge');
  var oldBack=document.querySelector('body>.back');
  if(!wrap||!pg||!badge)return false;

  var nav=document.getElementById('dfProdTopNavSacolas');
  if(!nav){
    nav=document.createElement('nav');
    nav.id='dfProdTopNavSacolas';
    nav.setAttribute('aria-label','Menu da Produção');

    var back=document.createElement('a');
    back.className='dfProdTopNavItem dfProdTopNavMenu';
    back.textContent='← MENU';
    back.href=oldBack&&oldBack.getAttribute('href')?oldBack.getAttribute('href'):'./teste/';

    var active=document.createElement('button');
    active.type='button';
    active.className='dfProdTopNavItem dfProdTopNavActive';
    active.textContent='NOVA OP';
    active.setAttribute('aria-current','page');
    active.onclick=function(){try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}};

    nav.appendChild(back);
    nav.appendChild(active);
    wrap.insertBefore(nav,pg);
  }

  if(badge.parentElement!==nav)nav.appendChild(badge);
  badge.textContent='OPS GERADAS';
  if(oldBack)oldBack.style.setProperty('display','none','important');
  return true;
}

function boot(){
  var tries=0;
  var t=setInterval(function(){if(install()||++tries>80)clearInterval(t)},100);
  setTimeout(install,700);
  setTimeout(install,1600);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('df-ui-ready',function(){setTimeout(install,50)});
})();
