(function(){
  'use strict';
  if(window.DFCostSimpleV154)return;
  window.DFCostSimpleV154=true;

  const $=id=>document.getElementById(id);
  const num=v=>{
    const n=Number(String(v??'').replace(/\s/g,'').replace(/\./g,'').replace(',','.'));
    return Number.isFinite(n)?n:0;
  };
  const money=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';
  const fire=el=>{if(!el)return;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};

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
    const auto=$('dfCostAuto154');
    const orig=$('cuAuto');
    if(!auto||!orig)return;
    orig.checked=auto.checked;
    fire(orig);
  }

  function pullFromOriginal(){
    if(!$('dfCostAuto154')?.checked)return;
    const p=$('cuPeso'),u=$('cuUnid');
    if(p&&document.activeElement!==$('dfCostPeso154'))$('dfCostPeso154').value=p.value||'';
    if(u&&document.activeElement!==$('dfCostUnid154'))$('dfCostUnid154').value=u.value||'';
  }

  function calc(){
    const peso=num($('dfCostPeso154')?.value);
    const unid=num($('dfCostUnid154')?.value);
    const custoKg=num($('dfCostKg154')?.value);
    const pct=num($('dfCostLucro154')?.value);
    const mode=$('dfCostModo154')?.value||'markup';

    const custoTotal=peso>0&&custoKg>0?peso*custoKg:0;
    const custoUn=unid>0&&custoTotal>0?custoTotal/unid:0;

    $('dfCostResKg154').textContent=custoKg>0?money(custoKg):'—';
    $('dfCostResUn154').textContent=custoUn>0?money(custoUn):'—';
    $('dfCostResTotal154').textContent=custoTotal>0?money(custoTotal):'—';

    const sale=$('dfCostVenda154');
    const err=$('dfCostErro154');
    const hasProfit=pct>0;
    if(!hasProfit){sale.classList.remove('on');err.classList.remove('on');return;}

    if(mode==='margin'&&pct>=100){
      sale.classList.remove('on');
      err.textContent='Na margem sobre a venda, o percentual precisa ser menor que 100%.';
      err.classList.add('on');
      return;
    }
    err.classList.remove('on');

    const factor=mode==='margin' ? 1/(1-pct/100) : 1+pct/100;
    const vendaKg=custoKg>0?custoKg*factor:0;
    const vendaUn=custoUn>0?custoUn*factor:0;
    const vendaTotal=custoTotal>0?custoTotal*factor:0;

    $('dfCostVendaKg154').textContent=vendaKg>0?money(vendaKg):'—';
    $('dfCostVendaUn154').textContent=vendaUn>0?money(vendaUn):'—';
    $('dfCostVendaTotal154').textContent=vendaTotal>0?money(vendaTotal):'—';
    $('dfCostModoTexto154').textContent=mode==='margin'
      ? 'Margem sobre a venda: o percentual representa a parte do preço final que fica como lucro.'
      : 'Markup sobre o custo: o percentual é acrescentado diretamente em cima do custo.';
    sale.classList.add('on');
  }

  function build(){
    const pg=$('pgCu');
    if(!pg)return false;
    addStyle();
    if($('dfCostSimpleV154')){pullFromOriginal();calc();return true;}

    const box=document.createElement('div');
    box.id='dfCostSimpleV154';
    box.innerHTML=`
      <span class="tag">CUSTO SIMPLES</span>
      <h2>Custo do produto</h2>
      <div class="subx">Somente custo, lucro opcional e preço de venda.</div>

      <label class="autoLine"><input id="dfCostAuto154" type="checkbox"> Puxar peso e quantidade automaticamente da aba Sacolas</label>

      <div class="step"><label>Peso do rolo (kg)</label><input id="dfCostPeso154" inputmode="decimal" placeholder="Ex.: 5"></div>
      <div class="step"><label>Quantas unidades tem no rolo?</label><input id="dfCostUnid154" inputmode="numeric" placeholder="Ex.: 200"></div>
      <div class="step"><label>Custo do material por kg (R$)</label><input id="dfCostKg154" inputmode="decimal" placeholder="Ex.: 8,50"></div>

      <div class="step optional">
        <label>Lucro (%) — opcional</label>
        <div class="modeGrid">
          <input id="dfCostLucro154" inputmode="decimal" placeholder="Ex.: 30">
          <select id="dfCostModo154">
            <option value="markup">Markup sobre o custo</option>
            <option value="margin">Margem sobre a venda</option>
          </select>
        </div>
        <small>Markup soma o percentual em cima do custo. Margem calcula o preço para que o lucro represente esse percentual da venda.</small>
        <div id="dfCostErro154" class="err"></div>
      </div>

      <div class="greenResult"><span>CUSTO POR KG</span><b id="dfCostResKg154">—</b></div>
      <div class="greenResult"><span>CUSTO POR UNIDADE</span><b id="dfCostResUn154">—</b></div>
      <div class="greenResult"><span>CUSTO TOTAL</span><b id="dfCostResTotal154">—</b></div>

      <div id="dfCostVenda154" class="saleBox">
        <div class="saleTitle">PREÇO DE VENDA COM LUCRO</div>
        <div id="dfCostModoTexto154" class="saleModeText"></div>
        <div class="greenResult"><span>VENDA POR KG</span><b id="dfCostVendaKg154">—</b></div>
        <div class="greenResult"><span>VENDA POR UNIDADE</span><b id="dfCostVendaUn154">—</b></div>
        <div class="greenResult"><span>VENDA TOTAL</span><b id="dfCostVendaTotal154">—</b></div>
      </div>
    `;
    pg.insertBefore(box,pg.firstChild);

    const origAuto=$('cuAuto');
    $('dfCostAuto154').checked=!!origAuto?.checked;
    pullFromOriginal();

    ['dfCostPeso154','dfCostUnid154','dfCostKg154','dfCostLucro154'].forEach(id=>{
      $(id).addEventListener('input',calc);
      $(id).addEventListener('change',calc);
    });
    $('dfCostModo154').addEventListener('change',calc);
    $('dfCostAuto154').addEventListener('change',()=>{syncAutoToOriginal();setTimeout(()=>{pullFromOriginal();calc()},150)});

    calc();
    setInterval(()=>{pullFromOriginal();calc()},600);
    return true;
  }

  function start(){if(build())return;let n=0;const t=setInterval(()=>{n++;if(build()||n>50)clearInterval(t)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',()=>{setTimeout(build,100);setTimeout(build,600)},{once:true});
})();
