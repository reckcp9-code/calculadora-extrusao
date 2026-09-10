(function(){
  'use strict';

  const PAGE_ID='pgFo';
  let observer=null;

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfFormulaLayoutTestStyleV2'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutTestStyleV2';
    s.textContent=`
      #${PAGE_ID} #foLocked{display:none!important}
      #${PAGE_ID} #dfFormulaSubnav{display:none!important}

      /* Cada aba mostra somente o conteúdo dela. */
      #${PAGE_ID}[data-df-layout-test-mode="formula"] > .card,
      #${PAGE_ID}[data-df-layout-test-mode="ops"] > .card{display:none!important}
      #${PAGE_ID}[data-df-layout-test-mode="formula"] #dfVendedorCard,
      #${PAGE_ID}[data-df-layout-test-mode="ops"] #dfVendedorCard{display:none!important}

      /* WHATSAPP CUSTOM: deixa dentro da aba somente o cartão do vendedor. */
      #${PAGE_ID}[data-df-layout-test-mode="whats"] > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}
      #${PAGE_ID}[data-df-layout-test-mode="whats"] > .dfAutoTopics{display:flex!important}
      #${PAGE_ID}[data-df-layout-test-mode="whats"] > #dfVendedorCard{display:block!important}

      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="formula"],
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="ops"],
      #${PAGE_ID} .dfAutoTopic[data-df-layout-test="whats"]{min-width:112px!important}

      /* Conteúdo enxuto pedido para o WhatsApp custom. */
      #${PAGE_ID} #dfVendedorCard.dfWhatsCompactTest{padding:16px!important;margin-top:8px!important}
      #${PAGE_ID} #dfVendedorCard.dfWhatsCompactTest > *:not(#dfWhatsCompactTest){display:none!important}
      #dfWhatsCompactTest{display:block!important}
      #dfWhatsCompactTest .dfWhatsCompactField label{display:block!important;margin:0 0 7px!important;color:#cbd5e1!important;font-size:13px!important}
      #dfWhatsCompactTest #foVendWhats{display:block!important;width:100%!important;margin:0!important}
      #dfWhatsCompactTest .dfWhatsCompactActions{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;margin-top:12px!important}
      #dfWhatsCompactTest .dfWhatsCompactActions button{display:block!important;width:100%!important;min-width:0!important;margin:0!important;padding:14px 10px!important;font-size:14px!important;font-weight:950!important;white-space:normal!important;line-height:1.15!important}
      #dfWhatsCompactTest #foVendPdfTest{border-color:#22c55e!important;background:#0c321c!important;color:#bbf7d0!important}
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

  function showWhats(){
    const page=$(PAGE_ID);if(!page)return;
    simplifyWhatsApp();
    page.dataset.dfLayoutTestMode='whats';
    const core=$('dfFormulaCore');if(core)core.style.display='none';
    const ops=$('dfFormulaOps');if(ops)ops.classList.remove('on');
    const card=$('dfVendedorCard');if(card)card.style.display='block';
    setActive('whats');
  }

  function prepareTopTabs(){
    const n=nav();if(!n)return false;
    const topics=Array.from(n.querySelectorAll(':scope > .dfAutoTopic'));
    if(!topics.length)return false;

    let formula=topics.find(b=>b.dataset.dfLayoutTest==='formula');
    if(!formula){
      formula=topics.find(b=>/^TÓPICO\s*1$/i.test(String(b.textContent||'').trim()))||topics[0];
      if(formula)formula.dataset.dfLayoutTest='formula';
    }
    if(formula){formula.textContent='🧪 FORMULAÇÃO';formula.setAttribute('aria-label','Abrir Formulação')}

    let ops=topics.find(b=>b.dataset.dfLayoutTest==='ops');
    if(!ops){
      ops=topics.find(b=>/BACKUP\s+NA\s+NUVEM/i.test(String(b.textContent||'')));
      if(ops)ops.dataset.dfLayoutTest='ops';
    }
    if(ops){ops.textContent='🤖 OPS';ops.setAttribute('aria-label','Abrir OPs')}

    let whats=topics.find(b=>b.dataset.dfLayoutTest==='whats'||/WHATSAPP/i.test(String(b.textContent||''))||b.dataset.dfWhatsTestLabel==='1');
    if(whats){
      whats.dataset.dfLayoutTest='whats';
      whats.dataset.dfWhatsTestLabel='1';
      whats.textContent='💬 WHATSAPP CUSTOM';
      whats.setAttribute('aria-label','Abrir WhatsApp custom');
    }

    return !!(formula&&ops&&whats);
  }

  function simplifyWhatsApp(){
    const page=$(PAGE_ID);
    const card=$('dfVendedorCard');
    const input=$('foVendWhats');
    const send=$('foVendTest');
    const pdf=$('foVendPdfTest');
    const save=$('foVendSaveNumber');
    if(!page||!card||!input||!send||!pdf||!save)return false;

    /* Move o cartão para ser conteúdo exclusivo da aba WhatsApp Custom. */
    const n=nav();
    if(card.parentNode!==page){
      if(n&&n.nextSibling)page.insertBefore(card,n.nextSibling);
      else page.appendChild(card);
    }

    card.classList.add('dfWhatsCompactTest');
    let box=$('dfWhatsCompactTest');
    if(!box){
      box=document.createElement('div');
      box.id='dfWhatsCompactTest';
      box.innerHTML='<div class="dfWhatsCompactField"><label>WhatsApp do vendedor com DDD</label><div id="dfWhatsCompactInput"></div></div><div class="dfWhatsCompactActions" id="dfWhatsCompactActions"></div>';
      card.insertBefore(box,card.firstChild);
    }

    const inputSlot=$('dfWhatsCompactInput');
    const actions=$('dfWhatsCompactActions');
    if(inputSlot&&input.parentNode!==inputSlot)inputSlot.appendChild(input);
    if(actions){
      if(save.parentNode!==actions)actions.appendChild(save);
      if(send.parentNode!==actions)actions.appendChild(send);
      if(pdf.parentNode!==actions)actions.appendChild(pdf);
    }

    save.textContent='SALVAR NÚMERO';
    send.textContent='ENVIAR MSG DA ÚLTIMA';
    pdf.textContent='ENVIAR PDF DA ÚLTIMA';
    save.setAttribute('aria-label','Salvar número do WhatsApp');
    send.setAttribute('aria-label','Enviar mensagem da última formulação pelo WhatsApp');
    pdf.setAttribute('aria-label','Enviar PDF da última formulação');

    return true;
  }

  function cleanMarkedArea(){
    addStyle();
    const locked=$('foLocked');if(locked)locked.setAttribute('aria-hidden','true');
    const sub=$('dfFormulaSubnav');if(sub)sub.setAttribute('aria-hidden','true');
  }

  function apply(){
    cleanMarkedArea();prepareTopTabs();simplifyWhatsApp();
    const page=$(PAGE_ID);if(!page)return;
    if(!page.dataset.dfLayoutTestMode)showFormula();
  }

  function bindClicks(){
    const page=$(PAGE_ID);if(!page||page.dataset.dfLayoutTestBoundV2==='1')return;
    page.dataset.dfLayoutTestBoundV2='1';
    page.addEventListener('click',function(e){
      const b=e.target&&e.target.closest?e.target.closest('.dfAutoTopic'):null;if(!b)return;
      const mode=b.dataset.dfLayoutTest;
      if(mode==='formula'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showFormula();return;
      }
      if(mode==='ops'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showOps();return;
      }
      if(mode==='whats'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showWhats();return;
      }
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
    try{const b=$('btFo');if(b)b.click();else if(typeof window.show==='function')window.show('fo')}catch(e){}
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
