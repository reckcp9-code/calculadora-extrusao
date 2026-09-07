(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function addStyle(){
    if ($('dfMachineRecipeStyle')) return;
    const st = document.createElement('style');
    st.id = 'dfMachineRecipeStyle';
    st.textContent = [
      '#dfRecipeMiniBtn{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;margin-left:8px;min-width:90px;height:34px;padding:0 14px;border:1px solid #7c3aed;background:linear-gradient(180deg,#141226,#0d1020);color:#ddd6fe;border-radius:12px;font:900 12px system-ui;letter-spacing:.02em;box-shadow:0 8px 20px rgba(0,0,0,.18);cursor:pointer}',
      '#dfRecipeMiniBtn:active{transform:translateY(1px)}',
      '#dfRecipeMiniBtn::before{content:"🔒";margin-right:6px;font-size:12px}',
      '@media(max-width:560px){#dfRecipeMiniBtn{min-width:84px;height:32px;padding:0 12px;font-size:11px;margin-left:6px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function removeOldCard(){
    const old = $('dfMachineRecipeCard');
    if (old) old.remove();
  }

  function firstExtrusaoCard(){
    const pg = $('pgEx');
    if (!pg) return null;
    return pg.querySelector(':scope > .card') || null;
  }

  function ensureRecipeButton(){
    addStyle();
    removeOldCard();

    const card = firstExtrusaoCard();
    if (!card) return;

    const tag = card.querySelector('.tag');
    if (!tag) return;

    let btn = $('dfRecipeMiniBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'dfRecipeMiniBtn';
      btn.type = 'button';
      btn.textContent = 'RECEITA';
      btn.title = 'Receita da extrusora em ajuste';
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        alert('Receita da extrusora ainda está em ajuste e continua bloqueada para os usuários.');
      });
    }

    if (tag.nextElementSibling !== btn) {
      tag.insertAdjacentElement('afterend', btn);
    }
  }

  function init(){
    ensureRecipeButton();
    setTimeout(ensureRecipeButton, 180);
    setTimeout(ensureRecipeButton, 650);
    setTimeout(ensureRecipeButton, 1400);
    try{
      const root = $('appContent') || document.documentElement;
      const observer = new MutationObserver(function(){ setTimeout(ensureRecipeButton, 30); });
      observer.observe(root, { childList:true, subtree:true });
    }catch(e){}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
