(function(){
  'use strict';
  const itens={
    cuCustoResinaRolo:'Somente o custo da matéria-prima usada em 1 rolo.',
    cuCustoFabrilRolo:'Energia, mão de obra, reprocesso, outros custos, embalagem e frete incluídos no rolo.',
    cuCustoRealKg:'Custo final por kg depois de somar resina e custos fabris.',
    cuCustoRolo:'Custo completo para produzir 1 rolo.',
    cuPrecoKg:'Preço de venda equivalente por kg.',
    cuVendaRolo:'Valor cobrado pela venda de 1 rolo.',
    cuPrecoUnid:'Valor de venda de cada sacola.',
    cuCustoUnid:'Custo completo para produzir cada sacola.',
    cuLucroRolo:'Venda menos o custo real, antes de impostos e comissão.',
    cuDespesasRolo:'Total de impostos e comissão descontados da venda de 1 rolo.',
    cuLucroLiquidoRolo:'Quanto realmente sobra em 1 rolo depois dos custos, impostos e comissão.',
    cuMarkupReal:'Quanto o preço ficou acima do custo real.',
    cuMargemReal:'Percentual do preço de venda que sobra como lucro bruto.',
    cuMargemLiquida:'Percentual da venda que realmente sobra depois de impostos e comissão.',
    cuVendaTotal:'Faturamento de todos os rolos informados.',
    cuCustoTotal:'Custo completo de todos os rolos.',
    cuLucroTotal:'Lucro bruto total antes de impostos e comissão.',
    cuDespesasTotal:'Total de impostos e comissão de todo o pedido.',
    cuLucroLiquidoTotal:'Ganho final do pedido depois de todos os custos, impostos e comissão.'
  };

  function aplicar(){
    Object.entries(itens).forEach(([id,texto])=>{
      const valor=document.getElementById(id);
      const kpi=valor&&valor.closest('.kpi');
      if(!kpi||kpi.dataset.dfExplicado==='1')return;
      const titulo=kpi.querySelector('span');
      if(!titulo)return;

      const box=document.createElement('div');
      box.className='dfKpiTexto';
      titulo.parentNode.insertBefore(box,titulo);
      box.appendChild(titulo);

      const exp=document.createElement('small');
      exp.className='dfKpiExp';
      exp.textContent=texto;
      box.appendChild(exp);
      kpi.dataset.dfExplicado='1';
    });
  }

  function estilo(){
    if(document.getElementById('dfKpiExpStyle'))return;
    const s=document.createElement('style');
    s.id='dfKpiExpStyle';
    s.textContent='.kpi .dfKpiTexto{display:flex;flex-direction:column;gap:4px;min-width:0;padding-right:12px}.kpi .dfKpiExp{display:block;color:#8292ad;font-size:11px;line-height:1.25;font-weight:500}.kpi>b{flex:0 0 auto;text-align:right}.card h3{color:#dbeafe;font-size:14px}@media(max-width:560px){.kpi .dfKpiExp{font-size:10px}.kpi{align-items:center}}';
    document.head.appendChild(s);
  }

  function init(){estilo();aplicar();setTimeout(aplicar,300);setTimeout(aplicar,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setInterval(aplicar,1500);
})();
