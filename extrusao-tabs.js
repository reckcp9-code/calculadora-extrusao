(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let current='extrusao';
  let tries=0;

  const groups=[
    {id:'extrusao',label:'EXTRUSÃO'},
    {id:'bobina',label:'BOBINA'},
    {id:'micra',label:'CORRIGIR MICRA'},
    {id:'puxador',label:'PUXADOR / MASSA'},
    {id:'producao',label:'PRODUÇÃO +%'}
  ];

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function isExOpen(){const pg=$('pgEx'),app=$('appContent');return !!(pg&&pg.classList.contains('on')&&app&&getComputedStyle(app).display!=='none')}

  function classify(card){
    if(card.id==='dfBobinaCard')return 'bobina';
    const t=norm(card.textContent);
    if(t.includes('peso da bobina')||t.includes('altura enrolada')||t.includes('diametro do tubete'))return 'bobina';
    if(t.includes('aumentar / diminuir producao')||t.includes('calcular nova producao')||t.includes('producao estimada')||t.includes('% para aumentar'))return 'producao';
    if(t.includes('corrigir pelo puxador')||t.includes('corrigir pela massa')||t.includes('puxador recomendado')||t.includes('motor de massa recomendado')||t.includes('rpm atual do motor de massa'))return 'puxador';
    if(t.includes('descobrir micra')||t.includes('micra real')||t.includes('peso medido de 1 metro'))return 'micra';
    if(t.includes('peso ideal por metro')||t.includes('peso ideal de 1 metro'))return 'extrusao';
    return 'extrusao';
  }

  function style(){
    if($('dfExTabsStyle'))return;
    const s=document.createElement('style');
    s.id='dfExTabsStyle';
    s.textContent=`
      body.dfExActive #appContent>.brand{display:none!important}
      body.dfExActive #appContent{padding-top:8px!important}
      body.dfExActive .foot{display:none!important}
      body.dfExActive #dfUpdateNotify,body.dfExActive .dfUpdateNotify,body.dfExActive .updateNotify,body.dfExActive .toast,body.dfExActive .notification,body.dfExActive .installBanner,body.dfExActive .pwaInstall{display:none!important}
      body.dfExActive #pgEx{margin-top:0!important}
      #dfExCleanHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
      #dfExCleanTitle{font-size:22px;font-weight:950;letter-spacing:.4px;color:#fff}
      #dfExCleanBadge{font-size:11px;color:#ffd36a;border:1px solid rgba(245,160,0,.55);background:rgba(245,160,0,.10);border-radius:999px;padding:6px 9px;font-weight:950}
      #dfExTabs{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px;position:relative;z-index:5}
      #dfExTabs::-webkit-scrollbar{display:none}
      .dfExTab{flex:0 0 auto;min-width:82px;min-height:46px;padding:0 10px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;letter-spacing:.15px;line-height:1.1;white-space:normal;text-transform:uppercase}
      .dfExTab.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset,0 8px 26px rgba(245,158,11,.14)}
      #pgEx.dfExTabsReady>.card[data-df-ex-group]{display:none!important}
      #pgEx.dfExTabsReady>.card[data-df-ex-group].dfExVisible{display:block!important}
      body.dfExActive #pgEx .card{background:linear-gradient(180deg,rgba(12,28,46,.96),rgba(6,14,24,.96))!important;border-color:#29405a!important;border-radius:18px!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}
      body.dfExActive #pgEx .card>.tag{display:none!important}
      body.dfExActive #pgEx h2{font-size:24px!important;line-height:1.1!important;margin-top:2px!important}
      body.dfExActive #pgEx input,body.dfExActive #pgEx select{background:#07111d!important;border-color:#36516c!important;border-radius:12px!important;font-size:18px!important;font-weight:800!important}
      body.dfExActive #pgEx .result{border-color:#f5a000!important;background:linear-gradient(180deg,rgba(255,176,0,.13),rgba(255,176,0,.04))!important}
      body.dfExActive #pgEx .result span{color:#ffd36a!important;font-weight:950!important}
      body.dfExActive #pgEx .result b{color:#ffd36a!important}
      @media(max-width:560px){body.dfExActive .w{padding:8px 10px 26px!important}body.dfExActive .tabs{margin:0 0 8px!important;top:0!important}#dfExCleanTitle{font-size:21px}.dfExTab{min-width:78px;padding:0 8px;font-size:10px}body.dfExActive #pgEx h2{font-size:23px!important}}
    `;
    document.head.appendChild(s);
  }

  function cards(pg){return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'))}

  function ensureNav(pg){
    let head=$('dfExCleanHead');
    if(!head){
      head=document.createElement('div');
      head.id='dfExCleanHead';
      head.innerHTML='<div id="dfExCleanTitle">EXTRUSÃO</div><div id="dfExCleanBadge">MODO LIMPO</div>';
      pg.insertBefore(head,pg.firstChild);
    }
    let nav=$('dfExTabs');
    if(!nav){
      nav=document.createElement('div');
      nav.id='dfExTabs';
      nav.setAttribute('role','tablist');
      nav.innerHTML=groups.map(g=>'<button type="button" class="dfExTab" data-tab="'+g.id+'">'+g.label+'</button>').join('');
      head.insertAdjacentElement('afterend',nav);
      nav.addEventListener('click',e=>{const b=e.target.closest('.dfExTab');if(b)activate(pg,b.dataset.tab,b)});
    }
  }

  function apply(pg){
    ensureNav(pg);
    cards(pg).forEach(c=>{
      c.dataset.dfExGroup=classify(c);
      c.classList.toggle('dfExVisible',c.dataset.dfExGroup===current);
    });
    pg.classList.add('dfExTabsReady');
    pg.querySelectorAll('.dfExTab').forEach(b=>b.classList.toggle('on',b.dataset.tab===current));
    document.body.classList.toggle('dfExActive',isExOpen());
  }

  function activate(pg,id,btn){
    current=id||'extrusao';
    apply(pg);
    try{sessionStorage.setItem('df_ex_tab_v2',current)}catch(e){}
    if(btn)btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    try{pg.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  }

  function mount(){
    const pg=$('pgEx');
    if(!pg)return;
    style();
    try{const saved=sessionStorage.getItem('df_ex_tab_v2');if(groups.some(g=>g.id===saved))current=saved}catch(e){}
    apply(pg);
    document.body.classList.toggle('dfExActive',isExOpen());
  }

  function init(){
    mount();
    const pg=$('pgEx');
    if(pg&&!pg.dfExTabsObserver){
      pg.dfExTabsObserver=true;
      const mo=new MutationObserver(()=>requestAnimationFrame(mount));
      mo.observe(pg,{childList:true,subtree:false});
    }
    document.addEventListener('click',ev=>{
      if(ev.target&&ev.target.closest&&ev.target.closest('.tab'))setTimeout(mount,80);
    },true);
    const bt=$('btEx');
    if(bt&&!bt.dfExTabsBound){
      bt.dfExTabsBound=true;
      bt.addEventListener('click',()=>setTimeout(()=>{current='extrusao';mount();},60));
    }
    const iv=setInterval(()=>{tries++;mount();if(tries>30)clearInterval(iv)},300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,80));
})();
