(function(){
  'use strict';

  const PAGE_ID='pgFo';
  let observer=null;

  function $(id){return document.getElementById(id)}
  function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase()}

  function addStyle(){
    if($('dfFormulaLayoutTestStyleV2'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutTestStyleV2';
    s.textContent=`
      #${PAGE_ID} #foLocked{display:none!important}
      #${PAGE_ID} #dfFormulaSubnav{display:none!important}
      #${PAGE_ID}[data-df-layout-test-mode="formula"] > .card,
      #${PAGE_ID}[data-df-layout-test-mode="ops"] > .card{display:none!important}
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="formula"],
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="ops"]{min-width:112px!important}

      /* TESTE: aba WhatsApp limpa. Mantém só número + WhatsApp + PDF + Salvar. */
      #${PAGE_ID} #dfVendedorCard.dfWhatsCompactTest{
        padding:16px!important;
      }
      #${PAGE_ID} #dfVendedorCard.dfWhatsCompactTest > *:not(#dfWhatsCompactTest){
        display:none!important;
      }
      #dfWhatsCompactTest{
        display:block!important;
      }
      #dfWhatsCompactTest .dfWhatsCompactTitle{
        margin:0 0 14px!important;
        font-size:22px!important;
        font-weight:950!important;
        color:#f8fafc!important;
      }
      #dfWhatsCompactTest .dfWhatsCompactField label{
        display:block!important;
        margin:0 0 7px!important;
        color:#cbd5e1!important;
        font-size:13px!important;
      }
      #dfWhatsCompactTest #foVendWhats{
        display:block!important;
        width:100%!important;
        margin:0!important;
      }
      #dfWhatsCompactTest .dfWhatsCompactActions{
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:8px!important;
        margin-top:12px!important;
      }
      #dfWhatsCompactTest .dfWhatsCompactActions button{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        margin:0!important;
        padding:12px 5px!important;
        font-size:11px!important;
        font-weight:950!important;
        white-space:nowrap!important;
      }
      @media(max-width:390px){
        #dfWhatsCompactTest .dfWhatsCompactActions{gap:6px!important}
        #dfWhatsCompactTest .dfWhatsCompactActions button{font-size:10px!important;padding:11px 3px!important}
      }
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

    const whats=topics.find(b=>/WHATSAPP/i.test(String(b.textContent||'')));
    if(whats&&!whats.dataset.dfWhatsTestLabel){
      whats.dataset.dfWhatsTestLabel='1';
      whats.textContent='💬 WHATSAPP';
      whats.setAttribute('aria-label','Abrir WhatsApp');
    }

    return !!(formula&&ops);
  }

  function simplifyWhatsApp(){
    const card=$('dfVendedorCard');
    const input=$('foVendWhats');
    const whats=$('foVendTest');
    const pdf=$('foVendPdfTest');
    const save=$('foVendSaveNumber');
    if(!card||!input||!whats||!pdf||!save)return false;

    card.classList.add('dfWhatsCompactTest');
    let box=$('dfWhatsCompactTest');
    if(!box){
      box=document.createElement('div');
      box.id='dfWhatsCompactTest';
      box.innerHTML='<h2 class="dfWhatsCompactTitle">WhatsApp</h2><div class="dfWhatsCompactField"><label>Número com DDD</label><div id="dfWhatsCompactInput"></div></div><div class="dfWhatsCompactActions" id="dfWhatsCompactActions"></div>';
      card.insertBefore(box,card.firstChild);
    }

    const inputSlot=$('dfWhatsCompactInput');
    const actions=$('dfWhatsCompactActions');
    if(inputSlot&&input.parentNode!==inputSlot)inputSlot.appendChild(input);
    if(actions){
      if(whats.parentNode!==actions)actions.appendChild(whats);
      if(pdf.parentNode!==actions)actions.appendChild(pdf);
      if(save.parentNode!==actions)actions.appendChild(save);
    }

    whats.textContent='WHATSAPP';
    pdf.textContent='PDF';
    save.textContent='SALVAR';
    whats.setAttribute('aria-label','Abrir WhatsApp');
    pdf.setAttribute('aria-label','Gerar PDF');
    save.setAttribute('aria-label','Salvar número do WhatsApp');

    return true;
  }

  function cleanMarkedArea(){
    addStyle();
    const locked=$('foLocked');if(locked)locked.setAttribute('aria-hidden','true');
    const sub=$('dfFormulaSubnav');if(sub)sub.setAttribute('aria-hidden','true');
  }

  function apply(){
    cleanMarkedArea();
    prepareTopTabs();
    simplifyWhatsApp();
    const page=$(PAGE_ID);if(!page)return;
    if(!page.dataset.dfLayoutTestMode)showFormula();
  }

  function bindClicks(){
    const page=$(PAGE_ID);if(!page||page.dataset.dfLayoutTestBoundV2==='1')return;
    page.dataset.dfLayoutTestBoundV2='1';
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
    setTimeout(function(){watch();prepareTopTabs();simplifyWhatsApp()},1200);
    setTimeout(function(){watch();prepareTopTabs();simplifyWhatsApp()},2200);
    setTimeout(function(){watch();prepareTopTabs();simplifyWhatsApp()},3500);
    window.addEventListener('df-ui-ready',function(){setTimeout(function(){watch();prepareTopTabs();simplifyWhatsApp()},120)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(function(){watch();prepareTopTabs();simplifyWhatsApp()},80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
