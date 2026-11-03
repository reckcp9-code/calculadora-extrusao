(function(){
  'use strict';
  if(window.DFCostNavV273)return;
  window.DFCostNavV273=true;

  let observer=null;

  function goHome(){
    const original=document.getElementById('dfSectionBack');
    if(original){original.click();return}
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    document.querySelectorAll('#appContent>.page').forEach(function(p){p.classList.remove('dfSectionSelected')});
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function setMode(mode){
    const pg=document.getElementById('pgCu');
    const nav=document.getElementById('dfCostNavV273');
    if(!pg||!nav)return;
    const fabril=mode==='fabril';
    pg.classList.toggle('dfCostFabrilMode',fabril);
    nav.querySelectorAll('[data-cost-mode]').forEach(function(b){
      b.classList.toggle('active',b.dataset.costMode===(fabril?'fabril':'custo'));
    });
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function addStyle(){
    if(document.getElementById('dfCostNavV273Style'))return;
    const s=document.createElement('style');
    s.id='dfCostNavV273Style';
    s.textContent=`
      #dfCostNavV273{
        width:100%;
        gap:10px;
        margin:0 0 14px;
        padding:3px 0 10px;
        overflow-x:auto;
        -webkit-overflow-scrolling:touch;
        align-items:stretch;
      }
      #dfCostNavV273 button{
        min-height:45px;
        border:1px solid #29405a;
        border-radius:12px;
        background:linear-gradient(180deg,#0c1b2c,#07111d);
        color:#e5eef8;
        padding:8px 11px;
        font:950 10.5px/1.12 system-ui,-apple-system,Segoe UI,Roboto,Arial;
        white-space:nowrap;
        letter-spacing:0;
        box-shadow:none;
        text-transform:uppercase;
      }
      #dfCostNavV273 .menu{
        flex:0 0 92px;
        min-height:46px;
        padding:0 12px;
        border-color:#f5a000;
        background:#211400;
        color:#ffd36a;
      }
      #dfCostNavV273 [data-cost-mode]{flex:1 0 112px}
      #dfCostNavV273 [data-cost-mode].active{
        border-color:#f5a000;
        background:linear-gradient(180deg,#ffc647 0%,#f5a000 100%);
        color:#15110a;
        box-shadow:0 7px 18px rgba(245,160,0,.20);
      }
      #dfCostNavV273 button:active{transform:scale(.97)}
      #dfCostFabrilV273{
        background:#111827;
        border:1px solid #263244;
        border-radius:20px;
        padding:18px 16px;
        margin-bottom:14px;
        box-shadow:0 12px 38px rgba(0,0,0,.16);
      }
      #dfCostFabrilV273 h2{margin:6px 0 6px;font-size:23px}
      #dfCostFabrilV273 .subx{color:#94a3b8;font-size:13px;line-height:1.45}
      @media(max-width:560px){
        #dfCostNavV273{gap:7px}
        #dfCostNavV273 button{min-height:45px;padding:8px 10px;font-size:10px}
        #dfCostNavV273 .menu{flex-basis:88px;min-height:46px;padding:0 10px}
        #dfCostNavV273 [data-cost-mode]{flex-basis:104px}
      }
    `;
    document.head.appendChild(s);
  }

  function ensure(){
    const pg=document.getElementById('pgCu');
    const box=document.getElementById('dfCostSimpleV154');
    if(!pg||!box)return false;

    addStyle();
    document.getElementById('dfCostBackV155')?.remove();

    let nav=document.getElementById('dfCostNavV273');
    if(!nav){
      nav=document.createElement('nav');
      nav.id='dfCostNavV273';
      nav.setAttribute('aria-label','Menu de custo');
      nav.innerHTML='<button type="button" class="menu" id="dfCostMenuV273">← MENU</button><button type="button" data-cost-mode="custo" class="active">CUSTO</button><button type="button" data-cost-mode="fabril">CUSTO FABRIL</button>';
      pg.insertBefore(nav,box);
      nav.querySelector('#dfCostMenuV273').addEventListener('click',goHome);
      nav.querySelector('[data-cost-mode="custo"]').addEventListener('click',()=>setMode('custo'));
      nav.querySelector('[data-cost-mode="fabril"]').addEventListener('click',()=>setMode('fabril'));
    }else if(nav.nextElementSibling!==box){
      pg.insertBefore(nav,box);
    }

    let fab=document.getElementById('dfCostFabrilV273');
    if(!fab){
      fab=document.createElement('section');
      fab.id='dfCostFabrilV273';
      fab.innerHTML='<span class="tag">CUSTO FABRIL</span><h2>Custo fabril</h2><div class="subx">Área separada e pronta para montar o novo projeto de custo fabril.</div>';
      box.insertAdjacentElement('afterend',fab);
    }

    if(!pg.classList.contains('dfCostFabrilMode'))setMode('custo');
    return true;
  }

  function observe(){
    const pg=document.getElementById('pgCu');
    if(!pg)return false;
    if(observer)observer.disconnect();
    observer=new MutationObserver(function(){requestAnimationFrame(ensure)});
    observer.observe(pg,{childList:true});
    return true;
  }

  function start(attempt){
    attempt=Number(attempt)||0;
    if(ensure()){observe();return}
    if(attempt>=16)return;
    setTimeout(()=>start(attempt+1),250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>start(0),{once:true});else start(0);
  document.addEventListener('click',function(e){
    const t=e.target&&e.target.closest?e.target.closest('#btCu'):null;
    if(t){setTimeout(()=>start(0),50)}
  },true);
  window.addEventListener('df-ui-ready',function(){setTimeout(()=>start(0),80)});
  window.addEventListener('pageshow',function(){setTimeout(()=>start(0),80)});
})();