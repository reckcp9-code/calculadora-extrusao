(function(){
  'use strict';
  if(window.DFCostSimpleTestV3)return;
  window.DFCostSimpleTestV3=true;

  const $=id=>document.getElementById(id);

  function fire(el){
    if(!el)return;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function setOriginal(id,value){
    const el=$(id); if(!el)return;
    el.value=value; fire(el);
  }
  function read(id){return String($(id)?.value||'')}
  function text(id){return String($(id)?.textContent||'—').trim()||'—'}

  function addStyle(){
    if($('dfCostUltraStyle'))return;
    const s=document.createElement('style');
    s.id='dfCostUltraStyle';
    s.textContent=`
      #pgCu.df-cost-ultra > .card{display:none!important}
      #pgCu .dfCostUltra{display:block!important;background:#111827;border:1px solid #263244;border-radius:20px;padding:16px;margin-bottom:14px;box-shadow:0 12px 38px rgba(0,0,0,.16)}
      #pgCu .dfCostUltra h2{margin:4px 0 5px;font-size:23px}
      #pgCu .dfCostUltra .subx{color:#94a3b8;font-size:13px;line-height:1.4;margin-bottom:14px}
      #pgCu .dfCostUltra .step{background:#0f172a;border:1px solid #263244;border-radius:15px;padding:13px;margin-top:10px}
      #pgCu .dfCostUltra .stepNo{display:inline-flex;width:27px;height:27px;border-radius:50%;align-items:center;justify-content:center;background:#241600;border:1px solid #f5a000;color:#ffd36a;font-weight:900;margin-right:7px}
      #pgCu .dfCostUltra label{margin:0 0 8px;font-size:14px;font-weight:800;color:#e2e8f0}
      #pgCu .dfCostUltra input{font-size:20px;font-weight:800;padding:14px}
      #pgCu .dfCostUltra .autoLine{display:flex;align-items:center;gap:9px;margin:12px 0 2px;color:#cbd5e1;font-size:13px}
      #pgCu .dfCostUltra .autoLine input{width:20px;height:20px;margin:0;accent-color:#f5a000}
      #pgCu .dfCostUltra .resTitle{margin:18px 0 8px;color:#94a3b8;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
      #pgCu .dfCostUltra .greenGrid{display:grid;grid-template-columns:1fr;gap:9px;margin-top:9px}
      #pgCu .dfCostUltra .greenResult{background:#0c1c13;border:1px solid #274734;border-radius:16px;padding:15px;text-align:center}
      #pgCu .dfCostUltra .greenResult span{display:block;color:#bbf7d0;font-size:12px;font-weight:800}
      #pgCu .dfCostUltra .greenResult b{display:block;color:#86efac;font-size:29px;margin-top:4px}
      #pgCu .dfCostUltra .optional{border-style:dashed}
      #pgCu .dfCostUltra .optional small{display:block;color:#94a3b8;font-size:11px;margin-top:5px;font-weight:600}
      #pgCu .dfCostUltra .saleBox{display:none;margin-top:10px}
      #pgCu .dfCostUltra .saleBox.on{display:block}
      #pgCu .dfCostUltra .fullBtn{width:100%;border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:11px;margin-top:14px;font-size:12px;font-weight:900}
      #pgCu.df-cost-full > .card{display:block!important}
      #pgCu.df-cost-full .dfCostUltra{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function build(){
    const pg=$('pgCu');
    if(!pg||$('dfCostUltra'))return;
    addStyle();
    pg.classList.add('df-cost-ultra');

    setOriginal('cuQtd','1');
    setOriginal('cuPrecoModo','percentual');
    setOriginal('cuLucroModo','markup');

    const box=document.createElement('div');
    box.id='dfCostUltra';
    box.className='dfCostUltra';
    box.innerHTML=`
      <span class="tag">CUSTO SIMPLES — TESTE</span>
      <h2>Custo do produto</h2>
      <div class="subx">Preencha o básico. O lucro é opcional.</div>

      <label class="autoLine"><input id="dfCuAuto" type="checkbox"> Puxar peso e quantidade automaticamente da aba Sacolas</label>

      <div class="step"><label><span class="stepNo">1</span>Peso do rolo (kg)</label><input id="dfCuPeso" inputmode="decimal" placeholder="Ex.: 5"></div>
      <div class="step"><label><span class="stepNo">2</span>Quantas unidades tem no rolo?</label><input id="dfCuUnid" inputmode="numeric" placeholder="Ex.: 200"></div>
      <div class="step"><label><span class="stepNo">3</span>Custo do material por kg (R$)</label><input id="dfCuKg" inputmode="decimal" placeholder="Ex.: 8,50"></div>
      <div class="step optional"><label>Lucro (%) — opcional</label><input id="dfCuLucro" inputmode="decimal" placeholder="Deixe vazio se não quiser calcular venda"><small>Se preencher, o app mostra o preço de venda automaticamente.</small></div>

      <div class="resTitle">Resultado</div>
      <div class="greenGrid">
        <div class="greenResult"><span>CUSTO POR KG</span><b id="dfCuCustoKg">—</b></div>
        <div class="greenResult"><span>CUSTO POR UNIDADE</span><b id="dfCuCustoUn">—</b></div>
        <div class="greenResult"><span>CUSTO TOTAL</span><b id="dfCuCustoTotal">—</b></div>
      </div>
      <div id="dfCuSaleBox" class="saleBox"><div class="greenResult"><span>PREÇO DE VENDA COM LUCRO</span><b id="dfCuVenda">—</b></div></div>
      <button id="dfCuCompleto" class="fullBtn" type="button">ABRIR CÁLCULO COMPLETO</button>
    `;
    pg.insertBefore(box,pg.firstChild);

    const autoOrig=$('cuAuto');
    $('dfCuAuto').checked=!!autoOrig?.checked;

    const map=[['dfCuPeso','cuPeso'],['dfCuUnid','cuUnid'],['dfCuKg','cuKg'],['dfCuLucro','cuLucroPct']];
    map.forEach(([simple,orig])=>{
      const a=$(simple); a.value=read(orig);
      a.addEventListener('input',()=>{setOriginal(orig,a.value);syncFromOriginal()});
      a.addEventListener('change',()=>{setOriginal(orig,a.value);syncFromOriginal()});
    });

    $('dfCuAuto').addEventListener('change',()=>{
      if(autoOrig){autoOrig.checked=$('dfCuAuto').checked;fire(autoOrig)}
      setTimeout(syncFromOriginal,180);
    });

    $('dfCuCompleto').onclick=()=>{
      pg.classList.remove('df-cost-ultra');
      pg.classList.add('df-cost-full');
    };

    syncFromOriginal();
    setInterval(()=>{
      if(pg.classList.contains('on')||pg.classList.contains('dfSectionSelected'))syncFromOriginal();
    },500);
  }

  function syncFromOriginal(){
    const focused=document.activeElement?.id||'';
    const map=[['dfCuPeso','cuPeso'],['dfCuUnid','cuUnid'],['dfCuKg','cuKg'],['dfCuLucro','cuLucroPct']];
    map.forEach(([simple,orig])=>{if(focused!==simple && $(simple))$(simple).value=read(orig)});
    if($('dfCuAuto')&&$('cuAuto'))$('dfCuAuto').checked=!!$('cuAuto').checked;

    if($('dfCuCustoKg'))$('dfCuCustoKg').textContent=text('cuCustoRealKg');
    if($('dfCuCustoUn'))$('dfCuCustoUn').textContent=text('cuCustoUnid');
    if($('dfCuCustoTotal'))$('dfCuCustoTotal').textContent=text('cuCustoRolo');
    if($('dfCuVenda'))$('dfCuVenda').textContent=text('cuVendaRolo');

    const lucro=String($('dfCuLucro')?.value||'').trim();
    const hasLucro=lucro!=='' && Number(lucro.replace(',','.'))>0;
    $('dfCuSaleBox')?.classList.toggle('on',hasLucro);
  }

  window.addEventListener('df-ui-ready',()=>setTimeout(build,250),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,700),{once:true});
  else setTimeout(build,700);
})();
