(function(){
  'use strict';

  const FAST_IDS=new Set(['saL','saC','saDes','saM','saQ','saDm','saPesoAlvo']);

  function eligible(el){
    return !!(el && FAST_IDS.has(el.id));
  }

  function arm(el){
    if(eligible(el)) el.dataset.dfReplaceOnNextType='1';
  }

  function disarm(el){
    if(eligible(el)) el.dataset.dfReplaceOnNextType='0';
  }

  document.addEventListener('pointerdown',function(e){arm(e.target)},true);
  document.addEventListener('touchstart',function(e){arm(e.target)},true);
  document.addEventListener('focusin',function(e){arm(e.target)},true);
  document.addEventListener('focusout',function(e){disarm(e.target)},true);

  document.addEventListener('beforeinput',function(e){
    const el=e.target;
    if(!eligible(el) || el.dataset.dfReplaceOnNextType!=='1') return;

    const type=String(e.inputType||'');
    if(type.indexOf('insert')===0){
      let text='';
      if(typeof e.data==='string') text=e.data;
      else if(e.dataTransfer) text=e.dataTransfer.getData('text/plain')||'';
      if(text==='') return;

      e.preventDefault();
      el.value=text;
      el.dataset.dfReplaceOnNextType='0';
      el.dispatchEvent(new Event('input',{bubbles:true}));
      try{el.setSelectionRange(el.value.length,el.value.length)}catch(_e){}
    }else if(type.indexOf('delete')===0){
      e.preventDefault();
      el.value='';
      el.dataset.dfReplaceOnNextType='0';
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
  },true);

  function setLabelForInput(id,text){
    const input=document.getElementById(id);
    if(!input) return;
    let label=null;
    if(input.id){
      try{label=document.querySelector('label[for="'+CSS.escape(input.id)+'"]')}catch(_e){}
    }
    if(!label){
      const prev=input.previousElementSibling;
      if(prev && prev.tagName==='LABEL') label=prev;
    }
    if(!label){
      const parent=input.parentElement;
      if(parent){
        const labels=parent.querySelectorAll('label');
        if(labels.length) label=labels[labels.length-1];
      }
    }
    if(label && label.textContent!==text) label.textContent=text;
  }

  function applyTexts(){
    setLabelForInput('saQ','Quantidade de sacos na caixa / fardo');
    setLabelForInput('saPesoAlvo','Peso desejado na caixa / fardo (kg)');

    const q=document.getElementById('saQ');
    const card=q&&q.closest('.card');
    if(card){
      const spans=card.querySelectorAll('.result span');
      for(const span of spans){
        const t=String(span.textContent||'').trim().toUpperCase();
        if(t==='PESO DO ROLO' || t==='PESO DO FARDO / CAIXA'){
          span.textContent='PESO DO FARDO / CAIXA';
          break;
        }
      }
    }
  }

  let scheduled=false;
  function scheduleTexts(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;applyTexts()});
  }

  function init(){
    applyTexts();
    const root=document.body||document.documentElement;
    if(root && 'MutationObserver' in window){
      new MutationObserver(scheduleTexts).observe(root,{childList:true,subtree:true});
    }
    setTimeout(applyTexts,300);
    setTimeout(applyTexts,1000);
    setTimeout(applyTexts,2500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
