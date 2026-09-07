(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfMachineRecipeStyle'))return;
    const st=document.createElement('style');
    st.id='dfMachineRecipeStyle';
    st.textContent=[
      '#dfRecipeMiniBtn{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;margin-left:8px;min-width:90px;height:34px;padding:0 14px;border:1px solid #7c3aed;background:linear-gradient(180deg,#141226,#0d1020);color:#ddd6fe;border-radius:12px;font:900 12px system-ui;letter-spacing:.02em;box-shadow:0 8px 20px rgba(0,0,0,.18);cursor:pointer}',
      '#dfRecipeMiniBtn:active{transform:translateY(1px)}',
      '#dfRecipeMiniBtn::before{content:"🔒";margin-right:6px;font-size:12px}',
      '#dfRecipePreview{position:fixed;inset:0;z-index:99998;background:#080b13;overflow:auto;padding:18px 14px 40px}',
      '#dfRecipePreview[hidden]{display:none!important}',
      '.dfRecipeWrap{max-width:760px;margin:auto}',
      '.dfRecipeTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}',
      '.dfRecipeBack{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:11px;padding:10px 14px;font-weight:900;cursor:pointer}',
      '.dfRecipeLocked{display:inline-flex;align-items:center;gap:6px;border:1px solid #7c3aed;background:#24133f;color:#ddd6fe;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900}',
      '.dfRecipeHero{background:linear-gradient(180deg,#141226,#0d1020);border:1px solid #7c3aed;border-radius:18px;padding:16px;margin-bottom:14px}',
      '.dfRecipeHero h2{margin:8px 0 6px}',
      '.dfRecipeHint{color:#a5b4fc;font-size:13px;line-height:1.45}',
      '.dfRecipeCard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:14px}',
      '.dfRecipeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dfRecipeCard label{display:block;color:#cbd5e1;font-size:13px;margin:11px 0 6px}',
      '.dfRecipeCard input,.dfRecipeCard textarea{width:100%;box-sizing:border-box;border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:12px;padding:12px;font:600 14px system-ui;opacity:.72;cursor:not-allowed}',
      '.dfRecipeCard textarea{min-height:88px;resize:none}',
      '.dfRecipeActions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}',
      '.dfRecipeActions button{width:100%;border:1px solid #475569;background:#111827;color:#94a3b8;border-radius:12px;padding:12px 8px;font-weight:900;cursor:not-allowed;opacity:.65}',
      '.dfRecipeNotice{border:1px dashed #8b5cf6;background:#1d1433;color:#e9d5ff;border-radius:14px;padding:13px;font-size:12px;line-height:1.5;font-weight:800}',
      '@media(max-width:560px){#dfRecipeMiniBtn{min-width:84px;height:32px;padding:0 12px;font-size:11px;margin-left:6px}.dfRecipeGrid,.dfRecipeActions{grid-template-columns:1fr}.dfRecipeTop{align-items:flex-start}}'
    ].join('');
    document.head.appendChild(st);
  }

  function field(label,placeholder){return '<div><label>'+label+'</label><input disabled type="text" placeholder="'+placeholder+'"></div>'}

  function previewHtml(){
    return '<div id="dfRecipePreview" hidden><div class="dfRecipeWrap"><div class="dfRecipeTop"><button id="dfRecipeBack" class="dfRecipeBack" type="button">← VOLTAR</button><span class="dfRecipeLocked">🔒 EM DESENVOLVIMENTO</span></div><div class="dfRecipeHero"><span class="tag">Receita de máquina</span><h2>⚙️ Receita da extrusora</h2><div class="dfRecipeHint">Prévia da função para salvar a regulagem completa de cada produto e repetir o setup depois. Ainda está bloqueada para os usuários.</div></div><div class="dfRecipeCard"><h2>Identificação da receita</h2><div class="dfRecipeGrid">'+
      field('Nome da máquina','Ex.: Extrusora 01')+field('Produto / nome da receita','Ex.: Saco 75 x 105')+field('Material / formulação','Ex.: PEAD + Linear')+field('Largura do filme (cm)','Ex.: 75')+field('Micra — parede dupla (µm)','Ex.: 45')+field('Peso por metro (g/m)','Ex.: 48')+
      '</div></div><div class="dfRecipeCard"><h2>Regulagem da máquina</h2><div class="dfRecipeGrid">'+
      field('RPM motor de massa','Ex.: 1000')+field('RPM puxador','Ex.: 800')+field('RPM anel de ar','Ex.: 1700')+field('Temperatura zona 1 (°C)','Ex.: 150')+field('Temperatura zona 2 (°C)','Ex.: 165')+field('Temperatura zona 3 (°C)','Ex.: 175')+field('Temperatura zona 4 (°C)','Ex.: 180')+field('Temperatura cabeçote / matriz (°C)','Ex.: 180')+
      '</div><label>Observações da regulagem</label><textarea disabled placeholder="Ex.: altura do balão, posição do banana, pressão, telas, comportamento do filme..."></textarea><div class="dfRecipeActions"><button disabled type="button">SALVAR RECEITA</button><button disabled type="button">ABRIR RECEITAS</button></div></div><div class="dfRecipeNotice">🔒 <b>FUNÇÃO BLOQUEADA:</b> esta tela é somente uma prévia. Nenhum campo pode ser alterado e nada é salvo enquanto terminamos e conferimos juntos o funcionamento.</div></div></div>';
  }

  function closePreview(){const p=$('dfRecipePreview');if(p)p.hidden=true;document.body.style.overflow=''}
  function openPreview(){ensurePreview();const p=$('dfRecipePreview');if(!p)return;p.hidden=false;p.scrollTop=0;document.body.style.overflow='hidden'}
  function ensurePreview(){addStyle();if($('dfRecipePreview'))return;document.body.insertAdjacentHTML('beforeend',previewHtml());const back=$('dfRecipeBack');if(back)back.onclick=closePreview}
  function removeOldCard(){const old=$('dfMachineRecipeCard');if(old)old.remove()}
  function firstExtrusaoCard(){const pg=$('pgEx');return pg?(pg.querySelector(':scope > .card')||null):null}

  function ensureRecipeButton(){
    addStyle();removeOldCard();ensurePreview();
    const card=firstExtrusaoCard();if(!card)return;
    const tag=card.querySelector('.tag');if(!tag)return;
    let btn=$('dfRecipeMiniBtn');
    if(!btn){
      btn=document.createElement('button');btn.id='dfRecipeMiniBtn';btn.type='button';btn.textContent='RECEITA';btn.title='Abrir prévia da Receita da extrusora';
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();openPreview()});
    }
    if(tag.nextElementSibling!==btn)tag.insertAdjacentElement('afterend',btn);
  }

  function init(){
    ensureRecipeButton();
    setTimeout(ensureRecipeButton,220);setTimeout(ensureRecipeButton,800);setTimeout(ensureRecipeButton,1800);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('dfRecipePreview')&&!$('dfRecipePreview').hidden)closePreview()});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(ensureRecipeButton,40)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
