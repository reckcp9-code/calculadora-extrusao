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
      #dfExTabs{display:none;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px;position:relative;z-index:5}
      body.dfSectionMode #pgEx.dfSectionSelected>#dfExTabs{display:flex!important}
      #dfExTabs::-webkit-scrollbar{display:none}
      .dfExTab{flex:0 0 auto;min-width:82px;min-height:46px;padding:0 10px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;letter-spacing:.15px;line-height:1.1;white-space:normal;text-transform:uppercase}
      .dfExTab.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset}
      body.dfSectionMode #pgEx.dfExTabsReady>.card[data-df-ex-group]{display:none!important}
      body.dfSectionMode #pgEx.dfExTabsReady>.card[data-df-ex-group].dfExVisible{display:block!important}
      body.dfHomeMode #pgEx>.card{display:block!important}
      body.dfSectionMode #pgEx .card{background:linear-gradient(180deg,rgba(12,28,46,.96),rgba(6,14,24,.96))!important;border-color:#29405a!important;border-radius:18px!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}
      body.dfSectionMode #pgEx .card>.tag{display:none!important}
      body.dfSectionMode #pgEx h2{font-size:24px!important;line-height:1.1!important;margin-top:2px!important}
      body.dfSectionMode #pgEx input,body.dfSectionMode #pgEx select{background:#07111d!important;border-color:#36516c!important;border-radius:12px!important;font-size:18px!important;font-weight:800!important}
      body.dfSectionMode #pgEx .result{border-color:#f5a000!important;background:linear-gradient(180deg,rgba(255,176,0,.13),rgba(255,176,0,.04))!important}
      body.dfSectionMode #pgEx .result span,body.dfSectionMode #pgEx .result b{color:#ffd36a!important}
      @media(max-width:560px){.dfExTab{min-width:78px;padding:0 8px;font-size:10px}body.dfSectionMode #pgEx h2{font-size:23px!important}}
    `;
    document.head.appendChild(s);
  }

  function cards(pg){return Array.from(pg.children).filter(el=>el.classList&&el.classList.contains('card'))}
  function ensureNav(pg){
    let nav=$('dfExTabs');
    if(!nav){
      nav=document.createElement('div');
      nav.id='dfExTabs';
      nav.setAttribute('role','tablist');
      nav.innerHTML=groups.map(g=>'<button type="button" class="dfExTab" data-tab="'+g.id+'">'+g.label+'</button>').join('');
      pg.insertBefore(nav,pg.firstChild);
      nav.addEventListener('click',e=>{const b=e.target.closest('.dfExTab');if(b)activate(pg,b.dataset.tab,b)});
    }
  }
  function apply(pg){
    ensureNav(pg);
    cards(pg).forEach(c=>{c.dataset.dfExGroup=classify(c);c.classList.toggle('dfExVisible',c.dataset.dfExGroup===current)});
    pg.classList.add('dfExTabsReady');
    pg.querySelectorAll('.dfExTab').forEach(b=>b.classList.toggle('on',b.dataset.tab===current));
  }
  function activate(pg,id,btn){
    current=id||'extrusao';
    apply(pg);
    try{sessionStorage.setItem('df_ex_tab_v8',current)}catch(e){}
    if(btn)btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }
  function mount(){
    const pg=$('pgEx');if(!pg)return;
    style();
    try{const saved=sessionStorage.getItem('df_ex_tab_v8');if(groups.some(g=>g.id===saved))current=saved}catch(e){}
    apply(pg);
  }
  function resetExtrusao(){current='extrusao';const pg=$('pgEx');if(pg)apply(pg)}
  function init(){
    mount();
    const pg=$('pgEx');
    if(pg&&!pg.dfExTabsObserver){pg.dfExTabsObserver=true;const mo=new MutationObserver(()=>requestAnimationFrame(mount));mo.observe(pg,{childList:true,subtree:false})}
    const bt=$('btEx');
    if(bt&&!bt.dfExTabsBound){bt.dfExTabsBound=true;bt.addEventListener('click',()=>setTimeout(resetExtrusao,40))}
    const iv=setInterval(()=>{tries++;mount();if(tries>25)clearInterval(iv)},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,80));
})();

(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let activeKey='';
  const sections={
    ex:{button:'btEx',page:'pgEx',title:'EXTRUSÃO'},
    sa:{button:'btSa',page:'pgSa',title:'SACOLAS'},
    cu:{button:'btCu',page:'pgCu',title:'CUSTO'},
    fo:{button:'btFo',page:'pgFo',title:'FORMULAÇÃO'}
  };

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
  function app(){return $('appContent')}

  function addStyle(){
    if($('dfSectionModeStyle'))return;
    const s=document.createElement('style');
    s.id='dfSectionModeStyle';
    s.textContent=`
      #dfSectionHeader{display:none;align-items:center;gap:11px;margin:2px 0 13px;padding:1px 0 3px}
      #dfSectionBack{flex:0 0 46px;width:46px;height:46px;border:1px solid #f5a000;border-radius:999px;background:#211400;color:#ffd36a;font-size:27px;font-weight:950;line-height:1;padding:0;display:flex;align-items:center;justify-content:center}
      #dfSectionTitle{font-size:27px;line-height:1;font-weight:950;letter-spacing:.3px;color:#fff}

      /* TELA PRINCIPAL: mantém o aplicativo original inteiro e rolável. */
      body.dfHomeMode #dfSectionHeader{display:none!important}
      body.dfHomeMode #appContent>#pgEx,
      body.dfHomeMode #appContent>#pgSa,
      body.dfHomeMode #appContent>#pgCu,
      body.dfHomeMode #appContent>#pgFo{display:block!important}
      body.dfHomeMode.dfFormulaLocked #appContent>#pgFo{display:none!important}
      body.dfHomeMode .dfAutoTopics{display:none!important}
      body.dfHomeMode .page>.card{display:block!important}

      /* MODO FOCADO: ao tocar no menu, mostra somente a seção escolhida. */
      body.dfSectionMode #appContent>*{display:none!important}
      body.dfSectionMode #appContent>#dfSectionHeader{display:flex!important}
      body.dfSectionMode #appContent>.page.dfSectionSelected{display:block!important}
      body.dfSectionMode #appContent{padding-top:8px!important}
      body.dfSectionMode .foot{display:none!important}
      body.dfSectionMode #dfUpdateNotify,
      body.dfSectionMode .dfUpdateNotify,
      body.dfSectionMode .updateNotify,
      body.dfSectionMode .toast,
      body.dfSectionMode .notification,
      body.dfSectionMode .installBanner,
      body.dfSectionMode .pwaInstall{display:none!important}

      .dfAutoTopics{display:none;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px}
      body.dfSectionMode .page.dfSectionSelected>.dfAutoTopics{display:flex!important}
      .dfAutoTopics::-webkit-scrollbar{display:none}
      .dfAutoTopic{flex:0 0 auto;min-width:94px;min-height:45px;padding:8px 11px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;line-height:1.12;text-transform:uppercase}
      .dfAutoTopic.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset}
      body.dfSectionMode .page.dfTopicReady>.card[data-df-topic]{display:none!important}
      body.dfSectionMode .page.dfTopicReady>.card[data-df-topic].dfTopicVisible{display:block!important}

      @media(max-width:560px){
        body.dfSectionMode .w{padding:8px 10px 28px!important}
        #dfSectionBack{width:43px;height:43px;flex-basis:43px;font-size:25px}
        #dfSectionTitle{font-size:25px}
        .dfAutoTopic{min-width:86px;font-size:10px}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureHeader(){
    const a=app();if(!a)return null;
    let h=$('dfSectionHeader');
    if(!h){
      h=document.createElement('div');
      h.id='dfSectionHeader';
      h.innerHTML='<button id="dfSectionBack" type="button" aria-label="Voltar para o menu">←</button><div id="dfSectionTitle"></div>';
      const firstPage=a.querySelector(':scope > .page');
      if(firstPage)a.insertBefore(h,firstPage);else a.appendChild(h);
      $('dfSectionBack')?.addEventListener('click',returnHome);
    }
    return h;
  }

  function directCards(page){return Array.from(page.children).filter(x=>x.classList&&x.classList.contains('card'))}
  function shortLabel(card,i){
    const h=card.querySelector('h2,h3');
    let t=(h?.textContent||card.querySelector('.tag')?.textContent||('TÓPICO '+(i+1))).trim().replace(/\s+/g,' ');
    return t.length>26?t.slice(0,24)+'…':t;
  }
  function activateAutoTopic(page,key){
    const cs=directCards(page);
    cs.forEach((c,i)=>c.classList.toggle('dfTopicVisible',String(i)===String(key)));
    page.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b.dataset.topic===String(key)));
  }
  function buildAutoTopics(page){
    if(!page||page.id==='pgEx')return;
    const cs=directCards(page);
    let nav=page.querySelector(':scope > .dfAutoTopics');
    if(cs.length<=1){
      nav?.remove();page.classList.remove('dfTopicReady');
      cs.forEach(c=>{delete c.dataset.dfTopic;c.classList.remove('dfTopicVisible')});
      return;
    }
    const sig=cs.map((c,i)=>shortLabel(c,i)).join('|');
    if(!nav){nav=document.createElement('div');nav.className='dfAutoTopics';page.insertBefore(nav,page.firstChild)}
    if(nav.dataset.sig!==sig){
      nav.dataset.sig=sig;
      nav.innerHTML=cs.map((c,i)=>'<button type="button" class="dfAutoTopic" data-topic="'+i+'">'+shortLabel(c,i)+'</button>').join('');
      nav.onclick=e=>{const b=e.target.closest('.dfAutoTopic');if(b)activateAutoTopic(page,b.dataset.topic)};
    }
    cs.forEach((c,i)=>c.dataset.dfTopic=String(i));
    page.classList.add('dfTopicReady');
    let sel=nav.querySelector('.dfAutoTopic.on')?.dataset.topic;
    if(sel==null||!cs[Number(sel)])sel='0';
    activateAutoTopic(page,sel);
  }

  function syncFormulaLock(){
    const locked=!!$('btFo')?.classList.contains('locked');
    document.body.classList.toggle('dfFormulaLocked',locked);
  }
  function clearSelected(){Object.values(sections).forEach(s=>$(s.page)?.classList.remove('dfSectionSelected'))}

  function enterSection(key){
    const cfg=sections[key],a=app();if(!cfg||!a)return;
    const p=$(cfg.page);if(!p)return;
    if(key==='fo'&&$('btFo')?.classList.contains('locked'))return;
    activeKey=key;
    clearSelected();
    p.classList.add('dfSectionSelected');
    ensureHeader();
    const title=$('dfSectionTitle');if(title)title.textContent=cfg.title;
    document.body.classList.remove('dfHomeMode');
    document.body.classList.add('dfSectionMode');
    buildAutoTopics(p);
    try{window.scrollTo({top:0,behavior:'instant'})}catch(e){window.scrollTo(0,0)}
  }

  function returnHome(){
    activeKey='';
    clearSelected();
    document.body.classList.remove('dfSectionMode');
    document.body.classList.add('dfHomeMode');
    syncFormulaLock();
    Object.values(sections).forEach(s=>$(s.button)?.classList.remove('on'));
    $('btEx')?.classList.add('on');
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function keyForButton(b){
    for(const[k,cfg]of Object.entries(sections))if(b.id===cfg.button)return k;
    const t=norm(b.textContent);
    if(t.includes('extrus'))return'ex';
    if(t.includes('sacola'))return'sa';
    if(t.includes('custo'))return'cu';
    if(t.includes('formula'))return'fo';
    return'';
  }

  function bind(){
    ensureHeader();syncFormulaLock();
    if(!document.body.dataset.dfSectionBound){
      document.body.dataset.dfSectionBound='1';
      document.addEventListener('click',ev=>{
        const b=ev.target?.closest?.('#btEx,#btSa,#btCu,#btFo');
        if(!b)return;
        const key=keyForButton(b);if(!key)return;
        setTimeout(()=>enterSection(key),70);
      },true);
    }
    Object.values(sections).forEach(cfg=>{
      const p=$(cfg.page);if(!p||p.dataset.dfTopicObserve)return;
      p.dataset.dfTopicObserve='1';
      const mo=new MutationObserver(()=>{
        syncFormulaLock();
        if(document.body.classList.contains('dfSectionMode')&&p.classList.contains('dfSectionSelected'))requestAnimationFrame(()=>buildAutoTopics(p));
      });
      mo.observe(p,{childList:true,subtree:false});
    });
    const fo=$('btFo');
    if(fo&&!fo.dataset.dfLockObserve){
      fo.dataset.dfLockObserve='1';
      new MutationObserver(syncFormulaLock).observe(fo,{attributes:true,attributeFilter:['class']});
    }
  }

  function init(){
    addStyle();bind();syncFormulaLock();
    if(!activeKey&&!document.body.classList.contains('dfSectionMode'))document.body.classList.add('dfHomeMode');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
  setTimeout(init,500);
  setTimeout(init,1200);
})();
