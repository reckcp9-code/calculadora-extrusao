(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let current='extrusao';

  const groups=[
    {id:'extrusao',label:'EXTRUSÃO'},
    {id:'bobina',label:'PESO DA BOBINA'},
    {id:'micra',label:'CORRIGIR MICRA'},
    {id:'puxador',label:'PUXADOR / MASSA'},
    {id:'producao',label:'PRODUÇÃO +%'}
  ];

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

  function classify(card){
    if(card.id==='dfBobinaCard')return 'bobina';
    const t=norm(card.textContent);
    if(t.includes('bobina'))return 'bobina';
    if((t.includes('corrigir')||t.includes('correcao'))&&t.includes('micra'))return 'micra';
    if(t.includes('puxador')||((t.includes('massa')||t.includes('rpm'))&&(t.includes('corrigir')||t.includes('correcao'))))return 'puxador';
    if((t.includes('aument')||t.includes('producao'))&&(t.includes('%')||t.includes('percent')))return 'producao';
    return 'extrusao';
  }

  function style(){
    if($('dfExTabsStyle'))return;
    const s=document.createElement('style');s.id='dfExTabsStyle';s.textContent=`
      #dfExTabs{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 16px;padding:4px 1px 8px;position:relative;z-index:5}
      #dfExTabs::-webkit-scrollbar{display:none}
      .dfExTab{flex:0 0 auto;min-height:44px;padding:0 15px;border:1px solid #334155;border-radius:14px;background:#0d1525;color:#dbe4f0;font-weight:900;font-size:12px;letter-spacing:.25px;white-space:nowrap;box-shadow:none}
      .dfExTab.on{border-color:#f59e0b;background:#211708;color:#ffd166;box-shadow:0 0 0 1px #f59e0b inset}
      #pgEx.dfExTabsReady .card[data-df-ex-group]{display:none!important}
      #pgEx.dfExTabsReady .card[data-df-ex-group].dfExVisible{display:block!important}
    `;document.head.appendChild(s);
  }

  function getCards(pg){
    return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'));
  }

  function apply(pg){
    const cards=getCards(pg);
    cards.forEach(c=>{c.dataset.dfExGroup=classify(c);c.classList.toggle('dfExVisible',c.dataset.dfExGroup===current)});
    pg.classList.add('dfExTabsReady');
    pg.querySelectorAll('.dfExTab').forEach(b=>b.classList.toggle('on',b.dataset.tab===current));
  }

  function activate(pg,id,btn){
    current=id;
    apply(pg);
    try{sessionStorage.setItem('df_ex_tab_v1',id)}catch(e){}
    if(btn)btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    try{pg.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  }

  function mount(){
    const pg=$('pgEx');if(!pg)return;
    style();
    let nav=$('dfExTabs');
    if(!nav){
      nav=document.createElement('div');nav.id='dfExTabs';nav.setAttribute('role','tablist');
      nav.innerHTML=groups.map(g=>'<button type="button" class="dfExTab" data-tab="'+g.id+'">'+g.label+'</button>').join('');
      pg.insertBefore(nav,pg.firstChild);
      nav.addEventListener('click',e=>{const b=e.target.closest('.dfExTab');if(b)activate(pg,b.dataset.tab,b)});
    }
    try{const saved=sessionStorage.getItem('df_ex_tab_v1');if(groups.some(g=>g.id===saved))current=saved}catch(e){}
    apply(pg);
  }

  function init(){
    mount();
    window.addEventListener('df-ui-ready',mount,{once:true});
    const pg=$('pgEx');
    if(pg){
      const mo=new MutationObserver(()=>requestAnimationFrame(()=>apply(pg)));
      mo.observe(pg,{childList:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
