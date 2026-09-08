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

  function addStyle(){
    if($('dfSectionModeStyle'))return;
    const s=document.createElement('style');
    s.id='dfSectionModeStyle';
    s.textContent=`
      #dfSectionHeader{display:none;align-items:center;gap:11px;margin:2px 0 13px;padding:1px 0 3px}
      #dfSectionBack{flex:0 0 46px;width:46px;height:46px;border:1px solid #f5a000;border-radius:999px;background:#211400;color:#ffd36a;font-size:27px;font-weight:950;line-height:1;padding:0;display:flex;align-items:center;justify-content:center}
      #dfSectionTitle{font-size:27px;line-height:1;font-weight:950;letter-spacing:.3px;color:#fff}

      body.dfHomeMode #appContent>.page{display:none!important}
      body.dfHomeMode #dfSectionHeader{display:none!important}

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

      .dfAutoTopics{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 0 14px;padding:3px 1px 10px}
      .dfAutoTopics::-webkit-scrollbar{display:none}
      .dfAutoTopic{flex:0 0 auto;min-width:94px;min-height:45px;padding:8px 11px;border:1px solid #29405a;border-radius:12px;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;font-weight:950;font-size:10.5px;line-height:1.12;text-transform:uppercase}
      .dfAutoTopic.on{border-color:#f59e0b;background:linear-gradient(180deg,#ffc43b,#f59e0b);color:#111;box-shadow:0 0 0 1px rgba(245,158,11,.35) inset}
      .page.dfTopicReady>.card[data-df-topic]{display:none!important}
      .page.dfTopicReady>.card[data-df-topic].dfTopicVisible{display:block!important}

      @media(max-width:560px){
        body.dfSectionMode .w{padding:8px 10px 28px!important}
        #dfSectionBack{width:43px;height:43px;flex-basis:43px;font-size:25px}
        #dfSectionTitle{font-size:25px}
        .dfAutoTopic{min-width:86px;font-size:10px}
      }
    `;
    document.head.appendChild(s);
  }

  function app(){return $('appContent')}

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
    let t=(h?.textContent||card.querySelector('.tag')?.textContent||('TÓPICO '+(i+1))).trim();
    t=t.replace(/\s+/g,' ');
    return t.length>26?t.slice(0,24)+'…':t;
  }

  function activateAutoTopic(page,key){
    const cards=directCards(page);
    cards.forEach((c,i)=>c.classList.toggle('dfTopicVisible',String(i)===String(key)));
    page.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b.dataset.topic===String(key)));
  }

  function buildAutoTopics(page){
    if(!page||page.id==='pgEx')return;
    const cards=directCards(page);
    let nav=page.querySelector(':scope > .dfAutoTopics');
    if(cards.length<=1){
      nav?.remove();
      page.classList.remove('dfTopicReady');
      cards.forEach(c=>{delete c.dataset.dfTopic;c.classList.remove('dfTopicVisible')});
      return;
    }
    const signature=cards.map((c,i)=>shortLabel(c,i)).join('|');
    if(!nav){
      nav=document.createElement('div');nav.className='dfAutoTopics';
      page.insertBefore(nav,page.firstChild);
    }
    if(nav.dataset.sig!==signature){
      nav.dataset.sig=signature;
      nav.innerHTML=cards.map((c,i)=>'<button type="button" class="dfAutoTopic" data-topic="'+i+'">'+shortLabel(c,i)+'</button>').join('');
      nav.onclick=e=>{const b=e.target.closest('.dfAutoTopic');if(b)activateAutoTopic(page,b.dataset.topic)};
    }
    cards.forEach((c,i)=>c.dataset.dfTopic=String(i));
    page.classList.add('dfTopicReady');
    let selected=nav.querySelector('.dfAutoTopic.on')?.dataset.topic;
    if(selected==null||!cards[Number(selected)])selected='0';
    activateAutoTopic(page,selected);
  }

  function clearSelected(){
    Object.values(sections).forEach(s=>$(s.page)?.classList.remove('dfSectionSelected'));
  }

  function enterSection(key){
    const cfg=sections[key],a=app();if(!cfg||!a)return;
    const p=$(cfg.page);if(!p)return;
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
    Object.values(sections).forEach(s=>$(s.button)?.classList.remove('on'));
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function keyForButton(b){
    for(const [k,cfg] of Object.entries(sections))if(b.id===cfg.button)return k;
    const t=norm(b.textContent);
    if(t.includes('extrus'))return'ex';
    if(t.includes('sacola'))return'sa';
    if(t.includes('custo'))return'cu';
    if(t.includes('formula'))return'fo';
    return'';
  }

  function bind(){
    ensureHeader();
    if(!document.body.dataset.dfSectionBound){
      document.body.dataset.dfSectionBound='1';
      document.addEventListener('click',ev=>{
        const b=ev.target?.closest?.('#btEx,#btSa,#btCu,#btFo');
        if(!b)return;
        const key=keyForButton(b);if(!key)return;
        setTimeout(()=>{
          const p=$(sections[key].page);
          if(!p)return;
          if(key==='fo'&&b.classList.contains('locked')&&!p.classList.contains('on'))return;
          enterSection(key);
        },70);
      },true);
    }
    Object.values(sections).forEach(cfg=>{
      const p=$(cfg.page);if(!p||p.dataset.dfTopicObserve)return;
      p.dataset.dfTopicObserve='1';
      const mo=new MutationObserver(()=>{if(document.body.classList.contains('dfSectionMode')&&p.classList.contains('dfSectionSelected'))requestAnimationFrame(()=>buildAutoTopics(p))});
      mo.observe(p,{childList:true,subtree:false});
    });
  }

  function init(){
    addStyle();bind();
    if(!activeKey&&!document.body.classList.contains('dfSectionMode'))document.body.classList.add('dfHomeMode');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('df-ui-ready',()=>setTimeout(init,100));
  setTimeout(init,500);
  setTimeout(init,1200);
})();
