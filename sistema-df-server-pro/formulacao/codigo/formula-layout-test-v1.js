(function(){
  'use strict';

  const PAGE_ID='pgFo';
  let observer=null;

  function $(id){return document.getElementById(id)}
  function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase()}

  function addStyle(){
    if($('dfFormulaLayoutTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutTestStyle';
    s.textContent=`
      #${PAGE_ID} #foLocked{display:none!important}
      #${PAGE_ID} #dfFormulaSubnav{display:none!important}
      #${PAGE_ID}[data-df-layout-test-mode="formula"] > .card,
      #${PAGE_ID}[data-df-layout-test-mode="ops"] > .card{display:none!important}
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="formula"],
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="ops"]{min-width:112px!important}
    `;
    document.head.appendChild(s);
  }

  function nav(){return $(PAGE_ID)?.querySelector(':scope > .dfAutoTopics')||null}

  function setActive(mode){
    const n=nav();if(!n)return;
    n.querySelectorAll('.dfAutoTopic').forEach(b=>b.classList.toggle('on',b.dataset.dfLayoutTest===mode));
  }

  function showFormula(){
    const page=$(PAGE_ID);if(!page)return;
    page.dataset.dfLayoutTestMode='formula';
    const core=$('dfFormulaCore');if(core)core.style.display='block';
    const ops=$('dfFormulaOps');if(ops)ops.classList.remove('on');
    setActive('formula');
  }

  function showOps(){
    const page=$(PAGE_ID);if(!page)return;
    page.dataset.dfLayoutTestMode='ops';
    const core=$('dfFormulaCore');if(core)core.style.display='none';
    const ops=$('dfFormulaOps');if(ops)ops.classList.add('on');
    setActive('ops');
  }

  function prepareTopTabs(){
    const n=nav();if(!n)return false;
    const topics=Array.from(n.querySelectorAll(':scope > .dfAutoTopic'));
    if(!topics.length)return false;

    let formula=topics.find(b=>b.dataset.dfLayoutTest==='formula');
    if(!formula){
      formula=topics.find(b=>/^TÓPICO\s*1$/i.test(String(b.textContent||'').trim()))||topics[0];
      if(formula){
        formula.dataset.dfLayoutTest='formula';
        formula.textContent='🧪 FORMULAÇÃO';
        formula.setAttribute('aria-label','Abrir Formulação');
      }
    }

    let ops=topics.find(b=>b.dataset.dfLayoutTest==='ops');
    if(!ops){
      ops=topics.find(b=>/BACKUP\s+NA\s+NUVEM/i.test(String(b.textContent||'')));
      if(ops){
        ops.dataset.dfLayoutTest='ops';
        ops.textContent='🤖 OPS';
        ops.setAttribute('aria-label','Abrir OPs');
      }
    }

    return !!(formula&&ops);
  }

  function cleanMarkedArea(){
    addStyle();
    const locked=$('foLocked');if(locked)locked.setAttribute('aria-hidden','true');
    const sub=$('dfFormulaSubnav');if(sub)sub.setAttribute('aria-hidden','true');
  }

  function apply(){
    cleanMarkedArea();
    prepareTopTabs();
    const page=$(PAGE_ID);if(!page)return;
    if(!page.dataset.dfLayoutTestMode)showFormula();
  }

  function bindClicks(){
    const page=$(PAGE_ID);if(!page||page.dataset.dfLayoutTestBound==='1')return;
    page.dataset.dfLayoutTestBound='1';
    page.addEventListener('click',function(e){
      const b=e.target&&e.target.closest?e.target.closest('.dfAutoTopic'):null;
      if(!b)return;
      const mode=b.dataset.dfLayoutTest;
      if(mode==='formula'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showFormula();
        return;
      }
      if(mode==='ops'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showOps();
        return;
      }
      // Outros tópicos continuam funcionando como antes e voltam a exibir a Formulação.
      page.removeAttribute('data-df-layout-test-mode');
      const core=$('dfFormulaCore');if(core)core.style.display='block';
      const ops=$('dfFormulaOps');if(ops)ops.classList.remove('on');
    },true);
  }

  function watch(){
    const page=$(PAGE_ID);if(!page)return;
    bindClicks();apply();
    if(observer)return;
    observer=new MutationObserver(function(){requestAnimationFrame(apply)});
    observer.observe(page,{childList:true,subtree:true});
  }

  function openFormula(){
    try{
      const b=$('btFo');
      if(b)b.click();
      else if(typeof window.show==='function')window.show('fo');
    }catch(e){}
    setTimeout(function(){watch();showFormula()},180);
  }

  function init(){
    watch();
    setTimeout(openFormula,700);
    setTimeout(function(){watch();prepareTopTabs()},1200);
    setTimeout(function(){watch();prepareTopTabs()},2200);
    window.addEventListener('df-ui-ready',function(){setTimeout(function(){watch();prepareTopTabs()},120)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(function(){watch();prepareTopTabs()},80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
