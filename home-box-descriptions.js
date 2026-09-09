(function(){
  'use strict';

  const DESCS={
    btEx:'Cálculos de extrusão: peso por metro, micra, bobina, correções de puxador/massa e aumento de produção.',
    btSa:'Cálculos para sacolas: medidas, peso por saco, peso do rolo, quantidade e conversões de produção.',
    btCu:'Cálculos de custo: matéria-prima, custo por kg, custo do produto, venda, margem e lucro.',
    btFo:'Formulações e misturas: percentuais, kg de cada matéria-prima, produção total e geração da OP.',
    btAj:'Veja instruções de uso, explicações dos cálculos e orientação rápida para cada área do app.',
    btFb:'Envie sugestões, informe problemas e diga o que pode ser melhorado no DF EXTRUSOR PRO.',
    dfFavBtn:'Acesse rapidamente as calculadoras que você marcou como favoritas.',
    __curso:'Conteúdo e treinamento sobre extrusão, operação, regulagem e processo produtivo.'
  };

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfHomeBoxDescStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeBoxDescStyle';
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
        white-space:normal!important;
        line-height:1.12!important;
        padding:11px 8px!important;
      }
      .dfHomeBoxDesc{
        display:block;
        max-width:100%;
        color:#94a3b8;
        font-size:10px;
        font-weight:650;
        line-height:1.25;
        text-transform:none;
        letter-spacing:0;
        text-align:center;
      }
      body.dfHomeMode #appContent>.tabs .tab.on .dfHomeBoxDesc,
      body.dfHomeMode #dfQuickAccess .dfQuickBtn.on .dfHomeBoxDesc{
        color:#ffe7a6;
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
        .dfHomeBoxDesc{font-size:10px;line-height:1.28}
      }
    `;
    document.head.appendChild(s);
  }

  function labelText(btn){
    const clone=btn.cloneNode(true);
    clone.querySelectorAll('.dfHomeBoxDesc').forEach(x=>x.remove());
    return String(clone.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
  }

  function descFor(btn){
    if(!btn)return'';
    if(DESCS[btn.id])return DESCS[btn.id];
    const t=labelText(btn);
    if(t==='CURSO'||t.includes('CURSO'))return DESCS.__curso;
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
    if(!btn)return;
    const text=descFor(btn);
    if(!text)return;
    let d=btn.querySelector(':scope > .dfHomeBoxDesc');
    if(!d){
      d=document.createElement('span');
      d.className='dfHomeBoxDesc';
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

  function init(){
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply,200);
    setTimeout(apply,800);
    const root=$('appContent')||document.body;
    if(root&&!root.dataset.dfHomeDescObserver){
      root.dataset.dfHomeDescObserver='1';
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(root,{childList:true,subtree:true});
    }
    window.addEventListener('df-ui-ready',()=>setTimeout(apply,80));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();