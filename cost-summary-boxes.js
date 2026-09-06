(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  let observer=null;

  function texto(id){
    const e=$(id);
    return e&&e.textContent?e.textContent.trim():'—';
  }

  function sync(){
    const map={
      dfResumoFardo:'cuVendaRolo',
      dfResumoKg:'cuPrecoKg',
      dfResumoUnidade:'cuPrecoUnid',
      dfResumoLucro:'cuLucroLiquidoRolo'
    };
    Object.entries(map).forEach(([dest,src])=>{
      const d=$(dest);
      if(d)d.textContent=texto(src);
    });
  }

  function estilo(){
    if($('dfCostSummaryStyle'))return;
    const s=document.createElement('style');
    s.id='dfCostSummaryStyle';
    s.textContent='\
      .dfCostSummaryArea{display:grid;gap:12px;margin:14px 0}\
      .dfCostMainBox,.dfCostProfitBox{display:block!important;padding:16px 18px!important}\
      .dfCostBoxTitle{font-size:11px;font-weight:900;letter-spacing:.08em;opacity:.82;margin-bottom:8px}\
      .dfCostMainRow{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:10px 0;border-top:1px solid rgba(255,255,255,.12)}\
      .dfCostMainRow:first-of-type{border-top:0}\
      .dfCostMainRow span{font-size:13px;font-weight:750}\
      .dfCostMainRow b{font-size:20px;white-space:nowrap;text-align:right}\
      .dfCostProfitBox{display:flex!important;align-items:center;justify-content:space-between;gap:18px}\
      .dfCostProfitLabel{display:flex;flex-direction:column;gap:3px}\
      .dfCostProfitLabel strong{font-size:13px;letter-spacing:.05em}\
      .dfCostProfitLabel small{font-size:10px;opacity:.72}\
      .dfCostProfitBox>b{font-size:24px;white-space:nowrap;text-align:right}\
      @media(max-width:560px){.dfCostMainRow b{font-size:18px}.dfCostProfitBox>b{font-size:22px}}';
    document.head.appendChild(s);
  }

  function montar(){
    const lucro=$('cuLucro');
    const original=lucro&&lucro.closest('.result');
    if(!original)return false;
    if($('dfCostSummaryArea')){sync();return true}

    estilo();
    original.style.display='none';

    const area=document.createElement('div');
    area.id='dfCostSummaryArea';
    area.className='dfCostSummaryArea';
    area.innerHTML='\
      <div class="result dfCostMainBox">\
        <div class="dfCostBoxTitle">PREÇOS PRINCIPAIS</div>\
        <div class="dfCostMainRow"><span>Preço total do fardo</span><b id="dfResumoFardo">—</b></div>\
        <div class="dfCostMainRow"><span>Preço por kg</span><b id="dfResumoKg">—</b></div>\
        <div class="dfCostMainRow"><span>Preço por unidade</span><b id="dfResumoUnidade">—</b></div>\
      </div>\
      <div class="result dfCostProfitBox">\
        <div class="dfCostProfitLabel"><strong>LUCRO</strong><small>Lucro líquido do fardo</small></div>\
        <b id="dfResumoLucro">—</b>\
      </div>';

    original.parentNode.insertBefore(area,original.nextSibling);
    sync();

    const pg=$('pgCu');
    if(pg&&!observer){
      observer=new MutationObserver(sync);
      observer.observe(pg,{subtree:true,childList:true,characterData:true});
    }
    return true;
  }

  function init(){
    if(!montar())setTimeout(init,250);
    setTimeout(montar,700);
    setTimeout(montar,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('hashchange',()=>setTimeout(()=>{montar();sync()},80));
  window.addEventListener('focus',sync);
})();
