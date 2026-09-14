(function(){
  'use strict';
  if(window.DFCostSimpleOnlyTestV2)return;
  window.DFCostSimpleOnlyTestV2=true;

  const $=id=>document.getElementById(id);
  const fire=el=>{if(!el)return;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
  const setOrig=(id,v)=>{const el=$(id);if(!el)return;el.value=v;fire(el)};
  const read=id=>String($(id)?.value||'');
  const txt=id=>String($(id)?.textContent||'—').trim()||'—';

  function addStyle(){
    if($('dfCostOnlyV2Style'))return;
    const s=document.createElement('style');s.id='dfCostOnlyV2Style';
    s.textContent=`
      #pgCu{overflow:visible!important}
      #pgCu > *{display:none!important}
      #pgCu > #dfCostOnlyV2{display:block!important}
      #dfCostOnlyV2{background:#111827;border:1px solid #263244;border-radius:20px;padding:16px;margin-bottom:14px;box-shadow:0 12px 38px rgba(0,0,0,.16)}
      #dfCostOnlyV2 h2{margin:4px 0 5px;font-size:23px}
      #dfCostOnlyV2 .subx{color:#94a3b8;font-size:13px;line-height:1.4;margin-bottom:14px}
      #dfCostOnlyV2 .step{background:#0f172a;border:1px solid #263244;border-radius:15px;padding:13px;margin-top:10px}
      #dfCostOnlyV2 .step.optional{border-style:dashed}
      #dfCostOnlyV2 label{margin:0 0 8px;font-size:14px;font-weight:800;color:#e2e8f0}
      #dfCostOnlyV2 input{font-size:20px;font-weight:800;padding:14px}
      #dfCostOnlyV2 .autoLine{display:flex;align-items:center;gap:9px;margin:12px 0 2px;color:#cbd5e1;font-size:13px}
      #dfCostOnlyV2 .autoLine input{width:20px;height:20px;margin:0;accent-color:#f5a000}
      #dfCostOnlyV2 .greenResult{background:#0c1c13;border:1px solid #274734;border-radius:16px;padding:15px;text-align:center;margin-top:9px}
      #dfCostOnlyV2 .greenResult span{display:block;color:#bbf7d0;font-size:12px;font-weight:800}
      #dfCostOnlyV2 .greenResult b{display:block;color:#86efac;font-size:29px;margin-top:4px}
      #dfCostOnlyV2 .saleBox{display:none}
      #dfCostOnlyV2 .saleBox.on{display:block}
      #dfCostOnlyV2 small{display:block;color:#94a3b8;font-size:11px;margin-top:5px}
    `;document.head.appendChild(s);
  }

  function sync(){
    const f=document.activeElement?.id||'';
    [['dfV2Peso','cuPeso'],['dfV2Unid','cuUnid'],['dfV2Kg','cuKg'],['dfV2Lucro','cuLucroPct']].forEach(([a,b])=>{if(f!==a&&$(a))$(a).value=read(b)});
    if($('dfV2Auto')&&$('cuAuto'))$('dfV2Auto').checked=!!$('cuAuto').checked;
    if($('dfV2CustoKg'))$('dfV2CustoKg').textContent=txt('cuCustoRealKg');
    if($('dfV2CustoUn'))$('dfV2CustoUn').textContent=txt('cuCustoUnid');
    if($('dfV2CustoTotal'))$('dfV2CustoTotal').textContent=txt('cuCustoRolo');
    if($('dfV2Venda'))$('dfV2Venda').textContent=txt('cuVendaRolo');
    const lucro=String($('dfV2Lucro')?.value||'').trim();
    $('dfV2Sale')?.classList.toggle('on',lucro!==''&&Number(lucro.replace(',','.'))>0);
  }

  function build(){
    const pg=$('pgCu');if(!pg)return false;addStyle();
    if($('dfCostOnlyV2')){sync();return true}
    setOrig('cuQtd','1');setOrig('cuPrecoModo','percentual');setOrig('cuLucroModo','markup');
    const box=document.createElement('div');box.id='dfCostOnlyV2';
    box.innerHTML=`
      <span class="tag">CUSTO SIMPLES — TESTE</span>
      <h2>Custo do produto</h2>
      <div class="subx">Somente os campos combinados.</div>
      <label class="autoLine"><input id="dfV2Auto" type="checkbox"> Puxar peso e quantidade automaticamente da aba Sacolas</label>
      <div class="step"><label>Peso do rolo (kg)</label><input id="dfV2Peso" inputmode="decimal" placeholder="Ex.: 5"></div>
      <div class="step"><label>Quantas unidades tem no rolo?</label><input id="dfV2Unid" inputmode="numeric" placeholder="Ex.: 200"></div>
      <div class="step"><label>Custo do material por kg (R$)</label><input id="dfV2Kg" inputmode="decimal" placeholder="Ex.: 8,50"></div>
      <div class="step optional"><label>Lucro (%) — opcional</label><input id="dfV2Lucro" inputmode="decimal" placeholder="Deixe vazio se não quiser calcular venda"><small>Se preencher, mostra o preço de venda.</small></div>
      <div class="greenResult"><span>CUSTO POR KG</span><b id="dfV2CustoKg">—</b></div>
      <div class="greenResult"><span>CUSTO POR UNIDADE</span><b id="dfV2CustoUn">—</b></div>
      <div class="greenResult"><span>CUSTO TOTAL</span><b id="dfV2CustoTotal">—</b></div>
      <div id="dfV2Sale" class="saleBox"><div class="greenResult"><span>PREÇO DE VENDA COM LUCRO</span><b id="dfV2Venda">—</b></div></div>`;
    pg.insertBefore(box,pg.firstChild);
    [['dfV2Peso','cuPeso'],['dfV2Unid','cuUnid'],['dfV2Kg','cuKg'],['dfV2Lucro','cuLucroPct']].forEach(([a,b])=>{$(a).value=read(b);$(a).addEventListener('input',()=>{setOrig(b,$(a).value);sync()});$(a).addEventListener('change',()=>{setOrig(b,$(a).value);sync()})});
    $('dfV2Auto').checked=!!$('cuAuto')?.checked;
    $('dfV2Auto').addEventListener('change',()=>{if($('cuAuto')){$('cuAuto').checked=$('dfV2Auto').checked;fire($('cuAuto'))}setTimeout(sync,150)});
    sync();setInterval(sync,500);return true;
  }

  function start(){if(build())return;let n=0;const t=setInterval(()=>{n++;if(build()||n>50)clearInterval(t)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',()=>{setTimeout(build,100);setTimeout(build,600)},{once:true});
})();