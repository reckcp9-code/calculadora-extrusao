(function(){
  'use strict';

  function norm(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  function addStyle(){
    if(document.getElementById('dfFormulaLayoutTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfFormulaLayoutTestStyle';
    s.textContent=[
      '#pgFo.dfTestVendorOnly > #foDevArea{display:none!important}',
      '#pgFo.dfTestVendorOnly > .card:not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfTestVendorOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfTestBackupOnly > #foDevArea{display:none!important}',
      '#pgFo.dfTestBackupOnly > .card:not(#dfCloudBackupCard){display:none!important}',
      '#pgFo.dfTestBackupOnly > #dfCloudBackupCard{display:block!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function removeLiteralNewline(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    Array.from(page.childNodes).forEach(function(node){
      if(node.nodeType===3)node.nodeValue=String(node.nodeValue||'').replace(/\\n/g,'');
    });
  }

  function syncScreens(){
    const page=document.getElementById('pgFo');
    if(!page)return;
    const nav=page.querySelector(':scope > .dfAutoTopics');
    if(!nav)return;
    const vendor=nav.querySelector('[data-df-vendor-topic="1"]');
    const backup=nav.querySelector('[data-df-backup-top="1"]');
    page.classList.toggle('dfTestVendorOnly',!!(vendor&&vendor.classList.contains('on')));
    page.classList.toggle('dfTestBackupOnly',!!(backup&&backup.classList.contains('on')));
  }

  function setup(){
    addStyle();
    removeLiteralNewline();
    const page=document.getElementById('pgFo');
    const nav=page&&page.querySelector(':scope > .dfAutoTopics');
    const ops=document.getElementById('dfFormTabOps');
    const form=document.getElementById('dfFormTabCore');
    const backupCard=document.getElementById('dfCloudBackupCard');
    if(!page||!nav||!ops||!form||!backupCard)return false;

    let buttons=Array.from(nav.querySelectorAll('.dfAutoTopic'));
    const vendor=buttons.find(function(b){return norm(b.textContent).includes('WHATSAPP / PDF')});
    if(vendor)vendor.dataset.dfVendorTopic='1';

    let opsTop=nav.querySelector('[data-df-open-ops="1"]');
    if(!opsTop){
      opsTop=buttons.find(function(b){
        return norm(b.textContent).includes('BACKUP NA NUVEM')&&!b.dataset.dfBackupTop;
      });
      if(!opsTop)return false;
      opsTop.textContent='🤖 OPS AUTOMÁTICAS';
      opsTop.dataset.dfOpenOps='1';
    }

    let backupTop=nav.querySelector('[data-df-backup-top="1"]');
    if(!backupTop){
      backupTop=document.createElement('button');
      backupTop.type='button';
      backupTop.className='dfAutoTopic';
      backupTop.dataset.dfBackupTop='1';
      backupTop.textContent='☁ BACKUP NA NUVEM';
      if(vendor&&vendor.nextSibling)nav.insertBefore(backupTop,vendor.nextSibling);
      else nav.appendChild(backupTop);
    }

    ops.style.display='none';

    if(!opsTop.dataset.dfBound){
      opsTop.dataset.dfBound='1';
      opsTop.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.toggle('on',b===opsTop)});
        page.querySelectorAll(':scope > .card').forEach(function(card){card.classList.remove('dfTopicVisible')});
        page.classList.remove('dfTestVendorOnly','dfTestBackupOnly');
        ops.click();
        window.scrollTo(0,0);
      },true);
    }

    if(!backupTop.dataset.dfBound){
      backupTop.dataset.dfBound='1';
      backupTop.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.toggle('on',b===backupTop)});
        page.querySelectorAll(':scope > .card').forEach(function(card){card.classList.toggle('dfTopicVisible',card===backupCard)});
        page.classList.remove('dfTestVendorOnly');
        page.classList.add('dfTestBackupOnly');
        window.scrollTo(0,0);
      },true);
    }

    if(!form.dataset.dfTestBound){
      form.dataset.dfTestBound='1';
      form.addEventListener('click',function(){
        nav.querySelectorAll('.dfAutoTopic').forEach(function(b){b.classList.remove('on')});
        page.classList.remove('dfTestVendorOnly','dfTestBackupOnly');
      });
    }

    syncScreens();
    return true;
  }

  function run(){
    setup();
    setTimeout(setup,120);
    setTimeout(setup,500);
    setTimeout(setup,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('click',function(){setTimeout(function(){setup();syncScreens();},80)},true);
})();

(function(){
  'use strict';
  const KEY='df_litragens_teste_v1';
  const q=id=>document.getElementById(id);
  const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const num=v=>{let s=String(v||'').trim().replace(/\s/g,'').replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const initial=[{id:'75x105',nome:'75 × 105',largura:75,comprimento:105}];

  function load(){
    try{const a=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(a)&&a.length?a:initial.slice()}catch(e){return initial.slice()}
  }
  function save(a){localStorage.setItem(KEY,JSON.stringify(a));renderList();renderSelect()}

  function style(){
    if(q('dfLitStyle'))return;
    const s=document.createElement('style');s.id='dfLitStyle';s.textContent=`
      .dfFoTitleRow{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .dfFoTitleRow h2{margin:5px 0 14px}
      #dfOpenLit{width:auto;margin:0 0 9px;padding:10px 13px;border-color:#f5a000;background:#211400;color:#ffd36a}
      #dfLitModal{position:fixed;z-index:1000002;inset:0;background:#020617ee;display:none;padding:14px;overflow:auto}
      #dfLitModal.on{display:block}#dfLitModal .box{max-width:650px;margin:24px auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:16px}
      .dfLitHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.dfLitHead h2{margin:0}
      #dfLitClose{width:auto;margin:0;padding:10px 14px;border-color:#475569;background:#0f172a;color:#fff}
      .dfLitRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid #263244;background:#0f172a;border-radius:12px;padding:10px;margin-top:8px}
      .dfLitRow button{width:auto;margin:0;padding:9px 11px}.dfLitGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      @media(max-width:560px){.dfLitGrid{grid-template-columns:1fr}.dfFoTitleRow{align-items:flex-start;flex-direction:column}#dfOpenLit{width:100%}}
    `;document.head.appendChild(s);
  }

  function renderList(){
    const box=q('dfLitList');if(!box)return;
    const a=load();
    box.innerHTML=a.map(x=>'<div class="dfLitRow"><div><b>'+esc(x.nome)+'</b><div class="smallNote" style="margin-top:3px">'+x.largura+' × '+x.comprimento+' cm</div></div><button class="delBtn" type="button" data-lit-del="'+esc(x.id)+'">EXCLUIR</button></div>').join('');
  }

  function renderSelect(){
    const sel=q('dfFoLitragem');if(!sel)return;
    const old=sel.value,a=load();
    sel.innerHTML='<option value="">Selecione a litragem / medida</option>'+a.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome)+' — '+x.largura+' × '+x.comprimento+' cm</option>').join('');
    if(a.some(x=>x.id===old))sel.value=old;
  }

  function mount(){
    style();
    const nome=q('foNome');if(!nome)return false;
    const label=nome.parentElement&&nome.parentElement.querySelector('label');
    if(label)label.textContent='Cliente:';
    nome.placeholder='Ex.: Nome do cliente';

    const card=nome.closest('.card');if(!card)return false;
    let h=Array.from(card.querySelectorAll('h2')).find(x=>/Montar formula/i.test(x.textContent||''));
    if(h&&!q('dfOpenLit')){
      const row=document.createElement('div');row.className='dfFoTitleRow';
      h.parentNode.insertBefore(row,h);row.appendChild(h);
      const b=document.createElement('button');b.id='dfOpenLit';b.type='button';b.className='calcBtn';b.textContent='🔒 LITRAGENS';row.appendChild(b);
      b.onclick=()=>q('dfLitModal').classList.add('on');
    }

    if(!q('dfFoLitragem')){
      const grid=nome.closest('.grid');
      const wrap=document.createElement('div');
      wrap.innerHTML='<label>Litragem / medida do saco</label><select id="dfFoLitragem"></select>';
      grid.appendChild(wrap);
      const mic=document.createElement('div');
      mic.innerHTML='<label>Micra — parede dupla (µm)</label><input id="dfFoMicra" class="main" inputmode="decimal" placeholder="Ex.: 27">';
      grid.appendChild(mic);
      renderSelect();
    }

    if(!q('dfLitModal')){
      const modal=document.createElement('div');modal.id='dfLitModal';
      modal.innerHTML='<div class="box"><div class="dfLitHead"><h2>🔒 Litragens</h2><button id="dfLitClose" class="calcBtn" type="button">FECHAR</button></div><div class="hint">Cadastre as medidas que serão usadas na formulação e na OP.</div><div class="dfLitGrid"><div><label>Nome / litragem</label><input id="dfLitNome" placeholder="Ex.: 100 L"></div><div><label>Largura (cm)</label><input id="dfLitL" inputmode="decimal" placeholder="Ex.: 75"></div><div><label>Comprimento (cm)</label><input id="dfLitC" inputmode="decimal" placeholder="Ex.: 105"></div></div><button id="dfLitAdd" class="calcBtn" type="button">ADICIONAR LITRAGEM</button><div id="dfLitList"></div></div>';
      document.body.appendChild(modal);
      q('dfLitClose').onclick=()=>modal.classList.remove('on');
      q('dfLitAdd').onclick=()=>{
        const nome=(q('dfLitNome').value||'').trim(),largura=num(q('dfLitL').value),comprimento=num(q('dfLitC').value);
        if(!nome||!largura||!comprimento){alert('Preencha nome, largura e comprimento.');return}
        const a=load();a.push({id:Date.now().toString(36),nome,largura,comprimento});save(a);
        q('dfLitNome').value='';q('dfLitL').value='';q('dfLitC').value='';
      };
      modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('on')});
      q('dfLitList').addEventListener('click',e=>{const id=e.target&&e.target.dataset&&e.target.dataset.litDel;if(!id)return;if(confirm('Excluir esta litragem?'))save(load().filter(x=>x.id!==id))});
      renderList();
    }

    bindSave();
    return true;
  }

  function density(){
    const sel=q('exDs');
    if(sel&&sel.value==='manual')return num(q('exDm')&&q('exDm').value);
    return num(sel&&sel.value)||0.922;
  }

  function bindSave(){
    const btn=q('foSave');if(!btn||btn.dataset.dfLitBound)return;
    btn.dataset.dfLitBound='1';
    btn.addEventListener('click',function(){
      const before=new Set((window.loadForms?window.loadForms():[]).map(x=>String(x.id)));
      setTimeout(function(){
        const a=window.loadForms?window.loadForms():[];
        const f=a.find(x=>!before.has(String(x.id)));if(!f)return;
        const item=load().find(x=>x.id===q('dfFoLitragem')?.value);
        const micra=num(q('dfFoMicra')?.value);
        if(!item||!micra)return;
        const dens=density();
        const gm=item.largura*micra*dens/100;
        f.nome=(q('foNome')?.value||f.nome||'Cliente').trim();
        f.cliente=f.nome;
        f.litragem=item.nome;
        f.op={...(f.op||{}),largura:item.largura,comprimento:item.comprimento,micra,grama:gm,densidade:dens};
        if(window.saveForms)window.saveForms(a);else localStorage.setItem('df_formulacoes_v2',JSON.stringify(a));
      },500);
    },true);
  }

  function run(){mount();setTimeout(mount,150);setTimeout(mount,600);setTimeout(mount,1400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('click',()=>setTimeout(mount,80),true);
})();