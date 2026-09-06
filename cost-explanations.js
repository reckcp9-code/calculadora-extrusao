(function(){
  'use strict';
  const itens={
    cuCustoRolo:'Quanto custa para produzir 1 rolo.',
    cuVendaRolo:'Valor que será cobrado na venda de 1 rolo.',
    cuPrecoUnid:'Valor de venda de cada sacola.',
    cuCustoUnid:'Quanto custa produzir cada sacola.',
    cuLucroRolo:'Ganho obtido em cada rolo vendido.',
    cuVendaTotal:'Valor total recebido na venda de todos os rolos.',
    cuCustoTotal:'Soma de todos os custos da produção.',
    cuLucroTotal:'Ganho final após descontar os custos.'
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
    s.textContent='.kpi .dfKpiTexto{display:flex;flex-direction:column;gap:4px;min-width:0;padding-right:12px}.kpi .dfKpiExp{display:block;color:#8292ad;font-size:11px;line-height:1.25;font-weight:500}.kpi> b{flex:0 0 auto;text-align:right}@media(max-width:560px){.kpi .dfKpiExp{font-size:10px}.kpi{align-items:center}}';
    document.head.appendChild(s);
  }

  function init(){estilo();aplicar();setTimeout(aplicar,300);setTimeout(aplicar,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setInterval(aplicar,1500);
})();
