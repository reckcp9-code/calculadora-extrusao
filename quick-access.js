(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfQuickAccessStyle'))return;
    const st=document.createElement('style');
    st.id='dfQuickAccessStyle';
    st.textContent=[
      '#dfQuickAccess{display:none;grid-template-columns:repeat(3,1fr);gap:8px;background:#08090bee;border:1px solid #263244;border-radius:16px;padding:7px;margin:-4px 0 10px;box-shadow:0 10px 26px rgba(0,0,0,.18)}',
      '#dfQuickAccess .dfQuickBtn{width:100%;min-height:42px;margin:0;border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:11px;padding:10px 4px;font:900 10px system-ui;cursor:pointer}',
      '#dfQuickAccess .dfQuickBtn.on{background:#211400;border-color:#f5a000;color:#ffd36a}',
      '#dfQuickAccess .dfQuickBtn:active{transform:translateY(1px)}',
      '#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}',
      '@media(max-width:560px){#dfQuickAccess{gap:7px;padding:7px;margin:-2px 0 9px}#dfQuickAccess .dfQuickBtn{font-size:10px;padding:10px 2px;min-height:40px}#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function getCourseButton(tabs){
    if(!tabs)return null;
    const list=[...tabs.querySelectorAll('button')];
    return list.find(b=>String(b.textContent||'').trim().replace(/\s+/g,' ').toUpperCase()==='CURSO')||null;
  }

  function ensureBox(){
    const app=$('appContent');
    if(!app)return null;
    const brand=app.querySelector('.brand');
    if(!brand)return null;
    let box=$('dfQuickAccess');
    if(!box){
      box=document.createElement('div');
      box.id='dfQuickAccess';
      brand.insertAdjacentElement('afterend',box);
      box.addEventListener('click',function(e){
        const b=e.target.closest('button');
        if(!b)return;
        if(b.id==='btAj'||b.id==='btFb')box.querySelectorAll('.dfQuickBtn').forEach(x=>x.classList.toggle('on',x===b));
      });
    }else if(box.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',box);
    }
    return box;
  }

  function organize(){
    addStyle();
    const app=$('appContent');
    if(!app)return;
    const tabs=app.querySelector('.tabs');
    const box=ensureBox();
    if(!tabs||!box)return;

    const course=getCourseButton(tabs)||[...box.querySelectorAll('button')].find(b=>String(b.textContent||'').trim().toUpperCase()==='CURSO');
    const help=$('btAj');
    const feedback=$('btFb');

    [course,help,feedback].forEach(function(btn){
      if(!btn)return;
      btn.classList.add('dfQuickBtn');
      if(btn.parentNode!==box)box.appendChild(btn);
    });

    box.style.display=box.querySelector('button')?'grid':'none';
  }

  function init(){
    organize();
    requestAnimationFrame(organize);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)organize()});
    window.addEventListener('df-ui-ready',organize);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

(function(){
  'use strict';

  const DESCS={
    btEx:'Peso por metro, micra, bobina, correção de puxador/massa e aumento de produção.',
    btSa:'Medidas da sacola, peso por saco, peso do rolo, quantidade e cálculos de produção.',
    btCu:'Custo da matéria-prima, custo por kg, custo do produto, venda, margem e lucro.',
    btFo:'Formulações, percentuais, kg de cada material, mistura, produção total e geração da OP.',
    btAj:'Instruções de uso e explicações para entender cada cálculo e cada função do aplicativo.',
    btFb:'Envie sugestões, relate problemas e diga o que pode ser melhorado no DF EXTRUSOR PRO.',
    dfFavBtn:'Abra rapidamente as calculadoras que você marcou como favoritas.',
    curso:'Treinamento e conteúdo sobre extrusão, operação, regulagem e processo produtivo.'
  };

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfHomeSummaryStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeSummaryStyle';
    s.textContent=`
      body.dfHomeMode #appContent>.tabs .tab,
      body.dfHomeMode #dfQuickAccess .dfQuickBtn{
        height:auto!important;
        min-height:88px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:6px!important;
        padding:10px 8px!important;
        white-space:normal!important;
        line-height:1.12!important;
      }
      .dfHomeSummary{
        display:block!important;
        margin-top:2px!important;
        color:#94a3b8!important;
        font-size:10px!important;
        line-height:1.28!important;
        font-weight:650!important;
        text-transform:none!important;
        letter-spacing:0!important;
        text-align:center!important;
      }
      body.dfHomeMode #appContent>.tabs .tab.on .dfHomeSummary,
      body.dfHomeMode #dfQuickAccess .dfQuickBtn.on .dfHomeSummary{
        color:#ffe3a0!important;
      }
      @media(max-width:560px){
        body.dfHomeMode #appContent>.tabs{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
        body.dfHomeMode #appContent>.tabs .tab,
        body.dfHomeMode #dfQuickAccess .dfQuickBtn{
          min-height:104px!important;
          padding:11px 9px!important;
        }
        .dfHomeSummary{font-size:10px!important;line-height:1.3!important}
      }
    `;
    document.head.appendChild(s);
  }

  function plainLabel(btn){
    const c=btn.cloneNode(true);
    c.querySelectorAll('.dfHomeSummary').forEach(x=>x.remove());
    return String(c.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
  }

  function textFor(btn){
    if(!btn)return'';
    if(DESCS[btn.id])return DESCS[btn.id];
    const t=plainLabel(btn);
    if(t.includes('CURSO'))return DESCS.curso;
    if(t.includes('AJUDA'))return DESCS.btAj;
    if(t.includes('FEEDBACK'))return DESCS.btFb;
    if(t.includes('FAVORITO'))return DESCS.dfFavBtn;
    if(t.includes('EXTRUS'))return DESCS.btEx;
    if(t.includes('SACOLA'))return DESCS.btSa;
    if(t.includes('CUSTO'))return DESCS.btCu;
    if(t.includes('FORMULA'))return DESCS.btFo;
    return'';
  }

  function decorate(btn){
    const text=textFor(btn);
    if(!text)return;
    let d=btn.querySelector(':scope > .dfHomeSummary');
    if(!d){
      d=document.createElement('span');
      d.className='dfHomeSummary';
      btn.appendChild(d);
    }
    if(d.textContent!==text)d.textContent=text;
  }

  function apply(){
    addStyle();
    const app=$('appContent');
    if(!app)return;
    app.querySelectorAll(':scope > .tabs button').forEach(decorate);
    const quick=$('dfQuickAccess');
    if(quick)quick.querySelectorAll('button').forEach(decorate);
  }

  function start(){
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply,180);
    setTimeout(apply,700);
    setTimeout(apply,1300);
    const root=$('appContent')||document.body;
    if(root&&!root.dataset.dfHomeSummaryObserver){
      root.dataset.dfHomeSummaryObserver='1';
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(root,{childList:true,subtree:true});
    }
    window.addEventListener('df-ui-ready',()=>setTimeout(apply,80));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
