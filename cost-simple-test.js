(function(){
  'use strict';
  if(window.DFCostSimpleTestV1)return;
  window.DFCostSimpleTestV1=true;

  const ADVANCED_IDS=[
    'cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo',
    'cuImpostoPct','cuComissaoPct','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuLucroModo'
  ];

  function fieldWrap(el){
    if(!el)return null;
    let p=el.parentElement;
    while(p&&p.id!=='pgCu'){
      if(p.tagName==='DIV' && (p.querySelector('label')||p.classList.contains('grid'))) return p;
      p=p.parentElement;
    }
    return el.parentElement;
  }

  function addStyle(){
    if(document.getElementById('dfCostSimpleStyle'))return;
    const s=document.createElement('style');
    s.id='dfCostSimpleStyle';
    s.textContent=`
      #pgCu .df-cost-simple-head{background:#0f172a;border:1px solid #263244;border-radius:16px;padding:14px;margin:0 0 14px}
      #pgCu .df-cost-simple-head b{display:block;font-size:18px;color:#f8fafc;margin-bottom:4px}
      #pgCu .df-cost-simple-head span{display:block;color:#94a3b8;font-size:13px;line-height:1.4}
      #pgCu .df-cost-simple-toggle{width:100%;border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:12px;padding:12px;margin:4px 0 14px;font-weight:900}
      #pgCu .df-cost-advanced-hidden{display:none!important}
      #pgCu .df-cost-primary .result{margin-top:10px}
      #pgCu .df-cost-primary .kpi{padding:11px 12px}
      #pgCu .df-cost-muted{opacity:.78}
      #pgCu .df-cost-simple-badge{display:inline-block;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;margin-bottom:8px}
    `;
    document.head.appendChild(s);
  }

  function markAdvanced(hidden){
    ADVANCED_IDS.forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      const w=fieldWrap(el);
      if(w)w.classList.toggle('df-cost-advanced-hidden',hidden);
    });

    ['cuLucroModoInfo','cuPrecoModoInfo','cuPrecoInversoBox','cuVendaAlvoInfo'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.classList.toggle('df-cost-advanced-hidden',hidden);
    });
  }

  function setup(){
    const pg=document.getElementById('pgCu');
    if(!pg||pg.dataset.dfSimpleReady==='1')return;
    pg.dataset.dfSimpleReady='1';
    addStyle();

    const firstCard=pg.querySelector('.card');
    if(firstCard){
      const head=document.createElement('div');
      head.className='df-cost-simple-head';
      head.innerHTML='<span class="df-cost-simple-badge">MODO SIMPLES — TESTE</span><b>Custo e preço de venda</b><span>Preencha só o essencial. As opções avançadas continuam disponíveis abaixo quando você precisar.</span>';
      firstCard.insertBefore(head,firstCard.firstChild);
    }

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='df-cost-simple-toggle';
    btn.textContent='MOSTRAR MAIS OPÇÕES';
    btn.dataset.open='0';
    btn.onclick=function(){
      const open=btn.dataset.open==='1';
      btn.dataset.open=open?'0':'1';
      btn.textContent=open?'MOSTRAR MAIS OPÇÕES':'OCULTAR OPÇÕES AVANÇADAS';
      markAdvanced(open);
    };

    if(firstCard) firstCard.appendChild(btn);
    else pg.insertBefore(btn,pg.firstChild);

    markAdvanced(true);

    // Prioriza visualmente os campos que o operador realmente usa no dia a dia.
    ['cuPeso','cuUnid','cuKg','cuQtd','cuLucroPct'].forEach(id=>{
      const el=document.getElementById(id); const w=fieldWrap(el); if(w)w.classList.add('df-cost-primary');
    });

    // Mantém todos os cálculos existentes; apenas reduz a poluição visual no teste.
    pg.querySelectorAll('.smallNote,.hint').forEach(el=>el.classList.add('df-cost-muted'));
  }

  window.addEventListener('df-ui-ready',()=>setTimeout(setup,250),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,700),{once:true});
  else setTimeout(setup,700);
})();
