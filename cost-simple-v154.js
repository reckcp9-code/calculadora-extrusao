(function(){
  'use strict';
  if(window.DFCostSimpleV170)return;
  window.DFCostSimpleV170=true;

  const $=id=>document.getElementById(id);
  const num=v=>{
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
    else if((s.match(/\./g)||[]).length>1) s=s.replace(/\./g,'');
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  };
  const money=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';
  const fire=el=>{if(!el)return;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
  let originalBound=false;

  function addStyle(){
    if($('dfCostSimpleV154Style'))return;
    const s=document.createElement('style');
    s.id='dfCostSimpleV154Style';
    s.textContent=`
      #pgCu{overflow:visible!important}
      #pgCu > *{display:none!important}
      #pgCu > #dfCostSimpleV154{display:block!important}
      #dfCostSimpleV154{background:#111827;border:1px solid #263244;border-radius:20px;padding:16px;margin-bottom:14px;box-shadow:0 12px 38px rgba(0,0,0,.16)}
      #dfCostSimpleV154 h2{margin:4px 0 5px;font-size:23px}
      #dfCostSimpleV154 .subx{color:#94a3b8;font-size:13px;line-height:1.4;margin-bottom:14px}
      #dfCostSimpleV154 .step{background:#0f172a;border:1px solid #263244;border-radius:15px;padding:13px;margin-top:10px}
      #dfCostSimpleV154 .step.optional{border-style:dashed;border-color:#475569}
      #dfCostSimpleV154 label{display:block;margin:0 0 8px;font-size:14px;font-weight:800;color:#e2e8f0}
      #dfCostSimpleV154 input,#dfCostSimpleV154 select{width:100%;border:1px solid #334155;background:#0b1220;color:#fff;border-radius:12px;padding:14px 12px;font-size:18px;font-weight:800}
      #dfCostSimpleV154 .autoLine{display:flex;align-items:center;gap:9px;margin:12px 0 2px;color:#cbd5e1;font-size:13px}
      #dfCostSimpleV154 .autoLine input{width:20px;height:20px;margin:0;accent-color:#f5a000}
      #dfCostSimpleV154 .modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #dfCostSimpleV154 .greenResult{background:#0c1c13;border:1px solid #274734;border-radius:16px;padding:15px;text-align:center;margin-top:9px}
      #dfCostSimpleV154 .greenResult span{display:block;color:#bbf7d0;font-size:12px;font-weight:800}
      #dfCostSimpleV154 .greenResult b{display:block;color:#86efac;font-size:28px;margin-top:4px}
      #dfCostSimpleV154 .saleBox{display:none;margin-top:14px;border-top:1px solid #263244;padding-top:8px}
      #dfCostSimpleV154 .saleBox.on{display:block}
      #dfCostSimpleV154 .saleTitle{color:#ffd36a;font-size:13px;font-weight:900;margin:5px 0 2px}
      #dfCostSimpleV154 .saleModeText{color:#94a3b8;font-size:11px;line-height:1.4;margin-bottom:4px}
      #dfCostSimpleV154 .err{display:none;color:#fca5a5;font-size:12px;font-weight:800;margin-top:8px}
      #dfCostSimpleV154 .err.on{display:block}
      #dfCostSimpleV154 small{display:block;color:#94a3b8;font-size:11px;margin-top:5px;line-height:1.4}
      @media(max-width:560px){#dfCostSimpleV154 .modeGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function syncAutoToOriginal(){
    const auto=$('dfCostAuto154'),orig=$('cuAuto');
    if(!auto||!orig)return;
    orig.checked=auto.checked;
    fire(orig);
  }

  function pullFromOriginal(){
    const auto=$('dfCostAuto154');
    if(!auto||!auto.checked)return;
    const p=$('cuPeso'),u=$('cuUnid'),peso=$('dfCostPeso154'),unid=$('dfCostUnid154');
    if(p&&peso&&document.activeElement!==peso)peso.value=p.value||'';
    if(u&&unid&&document.activeElement!==unid)unid.value=u.value||'';
  }

  function calc(){
    const pesoEl=$('dfCostPeso154'),unidEl=$('dfCostUnid154'),kgEl=$('dfCostKg154'),lucroEl=$('dfCostLucro154'),modoEl=$('dfCostModo154');
    const resKg=$('dfCostResKg154'),resUn=$('dfCostResUn154'),resTotal=$('dfCostResTotal154');
    const sale=$('dfCostVenda154'),err=$('dfCostErro154');
    if(!pesoEl||!unidEl||!kgEl||!lucroEl||!modoEl||!resKg||!resUn||!resTotal||!sale||!err)return false;

    const peso=num(pesoEl.value),unid=num(unidEl.value),custoKg=num(kgEl.value),pct=num(lucroEl.value),mode=modoEl.value||'markup';
    const custoTotal=peso>0&&custoKg>0?peso*custoKg:0;
    const custoUn=unid>0&&custoTotal>0?custoTotal/unid:0;

    resKg.textContent=custoKg>0?money(custoKg):'—';
    resUn.textContent=custoUn>0?money(custoUn):'—';
    resTotal.textContent=custoTotal>0?money(custoTotal):'—';

    if(!(pct>0)){sale.classList.remove('on');err.classList.remove('on');return true;}
    if(mode==='margin'&&pct>=100){
      sale.classList.remove('on');
      err.textContent='Na margem sobre a venda, o percentual precisa ser menor que 100%.';
      err.classList.add('on');
      return true;
    }
    err.classList.remove('on');

    const factor=mode==='margin'?1/(1-pct/100):1+pct/100;
    const vendaKg=custoKg>0?custoKg*factor:0,vendaUn=custoUn>0?custoUn*factor:0,vendaTotal=custoTotal>0?custoTotal*factor:0;
    const vk=$('dfCostVendaKg154'),vu=$('dfCostVendaUn154'),vt=$('dfCostVendaTotal154'),mt=$('dfCostModoTexto154');
    if(!vk||!vu||!vt||!mt)return false;
    vk.textContent=vendaKg>0?money(vendaKg):'—';
    vu.textContent=vendaUn>0?money(vendaUn):'—';
    vt.textContent=vendaTotal>0?money(vendaTotal):'—';
    mt.textContent=mode==='margin'
      ?'Margem sobre a venda: o percentual representa a parte do preço final que fica como lucro.'
      :'Markup sobre o custo: o percentual é acrescentado diretamente em cima do custo.';
    sale.classList.add('on');
    return true;
  }

  function bindOriginal(){
    if(originalBound)return;
    const p=$('cuPeso'),u=$('cuUnid');
    if(!p&&!u)return;
    const sync=()=>{if($('dfCostAuto154')?.checked){pullFromOriginal();calc();}};
    [p,u].forEach(el=>{if(el){el.addEventListener('input',sync);el.addEventListener('change',sync);}});
    originalBound=true;
  }

  function build(){
    const pg=$('pgCu');
    if(!pg)return false;
    addStyle();
    let box=$('dfCostSimpleV154');
    if(box){
      bindOriginal();
      pullFromOriginal();
      calc();
      return true;
    }

    box=document.createElement('div');
    box.id='dfCostSimpleV154';
    box.innerHTML=`
      <span class="tag">CUSTO SIMPLES</span>
      <h2>Custo do produto</h2>
      <div class="subx">Somente custo, lucro opcional e preço de venda.</div>
      <label class="autoLine"><input id="dfCostAuto154" type="checkbox"> Puxar peso e quantidade automaticamente da aba Sacolas</label>
      <div class="step"><label>Peso do rolo (kg)</label><input id="dfCostPeso154" inputmode="decimal" placeholder="Ex.: 5"></div>
      <div class="step"><label>Quantas unidades tem no rolo?</label><input id="dfCostUnid154" inputmode="numeric" placeholder="Ex.: 200"></div>
      <div class="step"><label>Custo do material por kg (R$)</label><input id="dfCostKg154" inputmode="decimal" placeholder="Ex.: 8,50"></div>
      <div class="step optional"><label>Lucro (%) — opcional</label><div class="modeGrid"><input id="dfCostLucro154" inputmode="decimal" placeholder="Ex.: 30"><select id="dfCostModo154"><option value="markup">Markup sobre o custo</option><option value="margin">Margem sobre a venda</option></select></div><small>Markup soma o percentual em cima do custo. Margem calcula o preço para que o lucro represente esse percentual da venda.</small><div id="dfCostErro154" class="err"></div></div>
      <div class="greenResult"><span>CUSTO POR KG</span><b id="dfCostResKg154">—</b></div>
      <div class="greenResult"><span>CUSTO POR UNIDADE</span><b id="dfCostResUn154">—</b></div>
      <div class="greenResult"><span>CUSTO TOTAL</span><b id="dfCostResTotal154">—</b></div>
      <div id="dfCostVenda154" class="saleBox"><div class="saleTitle">PREÇO DE VENDA COM LUCRO</div><div id="dfCostModoTexto154" class="saleModeText"></div><div class="greenResult"><span>VENDA POR KG</span><b id="dfCostVendaKg154">—</b></div><div class="greenResult"><span>VENDA POR UNIDADE</span><b id="dfCostVendaUn154">—</b></div><div class="greenResult"><span>VENDA TOTAL</span><b id="dfCostVendaTotal154">—</b></div></div>`;
    pg.insertBefore(box,pg.firstChild);

    const auto=$('dfCostAuto154'),origAuto=$('cuAuto');
    auto.checked=!!origAuto?.checked;
    ['dfCostPeso154','dfCostUnid154','dfCostKg154','dfCostLucro154'].forEach(id=>{const el=$(id);if(el){el.addEventListener('input',calc);el.addEventListener('change',calc);}});
    $('dfCostModo154')?.addEventListener('change',calc);
    auto.addEventListener('change',()=>{syncAutoToOriginal();setTimeout(()=>{pullFromOriginal();calc()},100)});
    bindOriginal();
    pullFromOriginal();
    calc();
    return true;
  }

  function ensure(){if(build())return;let n=0;const t=setInterval(()=>{if(build()||++n>30)clearInterval(t)},120)}
  function boot(){ensure();document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#btCu'))setTimeout(ensure,60)},true);window.addEventListener('pageshow',()=>setTimeout(ensure,80));window.addEventListener('df-ui-ready',()=>setTimeout(ensure,100));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
