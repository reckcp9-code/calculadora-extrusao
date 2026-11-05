(function(){
  'use strict';
  if(window.__DF_RENEW_EXPIRED_V1)return;
  window.__DF_RENEW_EXPIRED_V1=true;

  function addStyle(){
    if(document.getElementById('dfRenewExpiredStyle'))return;
    const s=document.createElement('style');
    s.id='dfRenewExpiredStyle';
    s.textContent='\n      .dfRenewExpired{margin-top:10px;padding:11px;border:1px solid #7f1d1d;background:#210b0b;border-radius:12px}\n      .dfRenewExpiredTitle{font-size:11px;font-weight:1000;color:#fecaca;margin-bottom:8px}\n      .dfRenewExpiredBtns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}\n      .dfRenewExpiredBtns button{border:1px solid #ef4444;background:#3b0d0d;color:#fee2e2;border-radius:9px;padding:9px 7px;font:900 10px system-ui;cursor:pointer}\n      .dfRenewExpiredBtns button:hover{background:#4c1111}\n      @media(max-width:520px){.dfRenewExpiredBtns{grid-template-columns:1fr 1fr}}\n    ';
    document.head.appendChild(s);
  }

  function enhance(){
    addStyle();
    const list=document.getElementById('usedList');
    if(list&&!document.getElementById('dfExpiredRenewInfo')){const info=document.createElement('div');info.id='dfExpiredRenewInfo';info.style.cssText='padding:12px;margin:10px 0;border:1px solid #f59e0b;border-radius:12px;background:#2b1d00;color:#fde68a;font-weight:800;font-size:13px';info.textContent='🔴 RENOVAR ACESSOS VENCIDOS — localize o usuário abaixo e escolha +7, +15, +30 ou +90 dias.';list.parentElement.insertBefore(info,list)}
    document.querySelectorAll('.usedItem').forEach(function(item){
      const pill=item.querySelector('.pill.expired, .pill.paused.expired');
      if(!pill||item.querySelector('.dfRenewExpired'))return;
      const input=item.querySelector('[data-days-input]');
      const save=item.querySelector('[data-days-save]');
      if(!input||!save)return;

      const box=document.createElement('div');
      box.className='dfRenewExpired';
      box.innerHTML='<div class="dfRenewExpiredTitle">🔴 USUÁRIO VENCIDO — DAR MAIS ACESSO</div><div class="dfRenewExpiredBtns"><button type="button" data-renew-days="7">+ 7 DIAS</button><button type="button" data-renew-days="15">+ 15 DIAS</button><button type="button" data-renew-days="30">+ 30 DIAS</button><button type="button" data-renew-days="90">+ 90 DIAS</button></div>';
      const daysControl=item.querySelector('.daysControl');
      if(daysControl)daysControl.insertAdjacentElement('beforebegin',box);else item.appendChild(box);

      box.querySelectorAll('[data-renew-days]').forEach(function(btn){
        btn.addEventListener('click',function(){
          const days=Number(btn.dataset.renewDays)||0;
          if(!confirm('Renovar este usuário vencido por '+days+' dias?'))return;
          input.value=String(days);
          input.dispatchEvent(new Event('input',{bubbles:true}));
          save.click();
        });
      });
    });
  }

  const obs=new MutationObserver(function(){enhance()});
  function init(){enhance();const list=document.getElementById('usedList');if(list)obs.observe(list,{childList:true,subtree:true});setInterval(enhance,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
