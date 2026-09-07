(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfMachineRecipeStyle'))return;
    const st=document.createElement('style');
    st.id='dfMachineRecipeStyle';
    st.textContent=[
      '.dfMachineRecipeCard{border-color:#7c3aed!important;background:linear-gradient(180deg,#141226,#0d1020)!important;position:relative;overflow:hidden}',
      '.dfMachineRecipeHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
      '.dfMachineRecipeLock{display:inline-flex;align-items:center;gap:6px;border:1px solid #7c3aed;background:#24133f;color:#ddd6fe;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900;white-space:nowrap}',
      '.dfMachineRecipeCard .dfMachineGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
      '.dfMachineRecipeCard input,.dfMachineRecipeCard textarea{opacity:.58;cursor:not-allowed}',
      '.dfMachineRecipeCard textarea{width:100%;min-height:82px;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:12px;font:600 14px system-ui;resize:none}',
      '.dfMachineRecipeActions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}',
      '.dfMachineRecipeActions button{width:100%;border:1px solid #475569;background:#111827;color:#94a3b8;border-radius:12px;padding:12px 8px;font-weight:900;cursor:not-allowed;opacity:.65}',
      '.dfMachineRecipeNotice{margin-top:12px;border:1px dashed #8b5cf6;background:#1d1433;color:#e9d5ff;border-radius:13px;padding:12px;font-size:12px;line-height:1.5;font-weight:800}',
      '@media(max-width:560px){.dfMachineRecipeCard .dfMachineGrid,.dfMachineRecipeActions{grid-template-columns:1fr}.dfMachineRecipeHead{display:block}.dfMachineRecipeLock{margin-top:8px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function field(label,placeholder){
    return '<div><label>'+label+'</label><input type="text" disabled placeholder="'+placeholder+'"></div>';
  }

  function cardHtml(){
    return '<div class="card dfMachineRecipeCard" id="dfMachineRecipeCard">'+
      '<div class="dfMachineRecipeHead">'+
        '<div><span class="tag">Receita de máquina</span><h2 style="margin-bottom:5px">⚙️ Receita da extrusora</h2><div class="hint">Salve a regulagem completa de cada produto para repetir o setup da máquina depois.</div></div>'+
        '<span class="dfMachineRecipeLock">🔒 BLOQUEADO</span>'+
      '</div>'+
      '<div class="dfMachineGrid">'+
        field('Nome da máquina','Ex.: Extrusora 01')+
        field('Produto / receita','Ex.: Saco 75 x 105')+
        field('Material / formulação','Ex.: PEAD + Linear')+
        field('Largura do filme (cm)','Ex.: 75')+
        field('Micra — parede dupla (µm)','Ex.: 45')+
        field('RPM motor de massa','Ex.: 1000')+
        field('RPM puxador','Ex.: 800')+
        field('RPM anel de ar','Ex.: 1700')+
        field('Temperatura zona 1 (°C)','Ex.: 150')+
        field('Temperatura zona 2 (°C)','Ex.: 165')+
        field('Temperatura zona 3 (°C)','Ex.: 175')+
        field('Temperatura zona 4 (°C)','Ex.: 180')+
        field('Temperatura cabeçote / matriz (°C)','Ex.: 180')+
        field('Peso por metro (g/m)','Ex.: 48')+
      '</div>'+
      '<label>Observações da regulagem</label><textarea disabled placeholder="Ex.: altura do balão, posição do banana, pressão, telas, comportamento do filme..."></textarea>'+
      '<div class="dfMachineRecipeActions"><button type="button" disabled>SALVAR RECEITA</button><button type="button" disabled>ABRIR RECEITAS</button></div>'+
      '<div class="dfMachineRecipeNotice">🔒 <b>EM AJUSTE:</b> esta função está visível na aba EXTRUSÃO, mas permanece bloqueada para os usuários até terminarmos e conferirmos juntos todos os campos e o funcionamento.</div>'+
    '</div>';
  }

  function ensureCard(){
    addStyle();
    const pg=$('pgEx');
    if(!pg||$('dfMachineRecipeCard'))return;
    pg.insertAdjacentHTML('beforeend',cardHtml());
  }

  function init(){
    ensureCard();
    setTimeout(ensureCard,250);
    setTimeout(ensureCard,800);
    setTimeout(ensureCard,1600);
    try{
      const root=$('appContent')||document.documentElement;
      const observer=new MutationObserver(function(){setTimeout(ensureCard,30)});
      observer.observe(root,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
