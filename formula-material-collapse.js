(function(){
  'use strict';

  const STORAGE_KEY='df_formula_material_collapsed_v1';

  function addStyle(){
    if(document.getElementById('dfFormulaMaterialCollapseStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaMaterialCollapseStyle';
    s.textContent=`
      .dfMaterialCard .dfMatCollapseHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .dfMaterialCard .dfMatCollapseHead h2{flex:1;margin:5px 0 14px}
      .dfMaterialCard #dfMatCollapseBtn{width:40px;height:40px;min-width:40px;padding:0;margin:0 0 9px;border:1px solid #f5a000;border-radius:11px;background:#211400;color:#ffd36a;font-size:25px;font-weight:950;line-height:1;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .dfMaterialCard #dfMatCollapseBtn:active{transform:scale(.96)}
      .dfMaterialCard.dfMatCollapsed .dfMatCollapseBody{display:none!important}
      .dfMaterialCard.dfMatCollapsed{padding-bottom:12px!important}
      .dfMaterialCard.dfMatCollapsed .dfMatCollapseHead h2{margin-bottom:5px}
      .dfMaterialCard.dfMatCollapsed #dfMatCollapseBtn{margin-bottom:0}
      @media(max-width:560px){.dfMaterialCard #dfMatCollapseBtn{width:38px;height:38px;min-width:38px;font-size:24px}}
    `;
    document.head.appendChild(s);
  }

  function readState(){
    try{return sessionStorage.getItem(STORAGE_KEY)==='1'}catch(e){return false}
  }

  function writeState(collapsed){
    try{sessionStorage.setItem(STORAGE_KEY,collapsed?'1':'0')}catch(e){}
  }

  function apply(card,button,collapsed){
    card.classList.toggle('dfMatCollapsed',collapsed);
    button.textContent=collapsed?'+':'−';
    button.setAttribute('aria-expanded',collapsed?'false':'true');
    button.setAttribute('aria-label',collapsed?'Abrir cadastro de material':'Minimizar cadastro de material');
    button.title=collapsed?'Abrir cadastro de material':'Minimizar cadastro de material';
  }

  function findCard(){
    const area=document.getElementById('foDevArea');
    if(!area)return null;
    return Array.from(area.children).find(function(el){
      if(!el.classList||!el.classList.contains('card'))return false;
      const h2=Array.from(el.children).find(function(ch){return ch.tagName==='H2'});
      return !!(h2&&/cadastrar\s+material/i.test(h2.textContent||''));
    })||null;
  }

  function mount(){
    addStyle();
    const card=findCard();
    if(!card)return;
    if(card.dataset.dfMaterialCollapseMounted==='1')return;

    const h2=Array.from(card.children).find(function(ch){return ch.tagName==='H2'});
    if(!h2)return;

    card.dataset.dfMaterialCollapseMounted='1';
    card.classList.add('dfMaterialCard');

    const head=document.createElement('div');
    head.className='dfMatCollapseHead';
    card.insertBefore(head,h2);
    head.appendChild(h2);

    const button=document.createElement('button');
    button.id='dfMatCollapseBtn';
    button.type='button';
    head.appendChild(button);

    const body=document.createElement('div');
    body.className='dfMatCollapseBody';
    const children=Array.from(card.children).filter(function(ch){
      return ch!==head && !(ch.classList&&ch.classList.contains('tag'));
    });
    children.forEach(function(ch){body.appendChild(ch)});
    card.appendChild(body);

    let collapsed=readState();
    apply(card,button,collapsed);

    button.addEventListener('click',function(){
      collapsed=!card.classList.contains('dfMatCollapsed');
      writeState(collapsed);
      apply(card,button,collapsed);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('df-ui-ready',function(){setTimeout(mount,80)});
  setTimeout(mount,350);
  setTimeout(mount,900);
})();
