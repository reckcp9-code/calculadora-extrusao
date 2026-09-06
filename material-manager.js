(function(){
  'use strict';

  const MAT_KEY='df_formula_materiais_v2';
  const STYLE_ID='dfMaterialManagerStyle';
  const WRAP_ID='dfMaterialManager';
  const PANEL_ID='dfMaterialManagerPanel';

  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const lower=t=>String(t??'').trim().toLocaleLowerCase('pt-BR');
  const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  function parsePrice(v){
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)&&n>=0?n:0;
  }

  function loadMats(){
    try{
      if(typeof window.loadMats==='function')return window.loadMats();
      return JSON.parse(localStorage.getItem(MAT_KEY)||'[]');
    }catch(e){return[];}
  }

  function saveMats(mats){
    if(typeof window.saveMats==='function')window.saveMats(mats);
    else localStorage.setItem(MAT_KEY,JSON.stringify(mats));
  }

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const st=document.createElement('style');
    st.id=STYLE_ID;
    st.textContent=[
      '.dfMatMgr{margin-top:12px}',
      '.dfMatMgrBtn{width:100%;border:1px solid #f59e0b;background:#111827;color:#facc15;border-radius:14px;padding:13px 14px;font:900 13px system-ui;cursor:pointer}',
      '.dfMatPanel{margin-top:12px;border:1px solid #334155;background:#0f172a;border-radius:16px;padding:12px}',
      '.dfMatPanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '.dfMatPanelHead b{color:#f8fafc;font:900 15px system-ui}',
      '.dfMatClose{border:1px solid #475569;background:#111827;color:#e2e8f0;border-radius:10px;padding:7px 10px;font-weight:800;cursor:pointer}',
      '.dfMatEmpty{color:#94a3b8;font:700 13px system-ui;padding:8px 2px}',
      '.dfMatItem{border:1px solid #334155;background:#111827;border-radius:13px;padding:11px;margin-top:9px}',
      '.dfMatSummary{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.dfMatName{font:900 14px system-ui;color:#f8fafc;word-break:break-word}',
      '.dfMatPrice{font:800 12px system-ui;color:#94a3b8;margin-top:3px}',
      '.dfMatActions{display:flex;gap:7px;flex-shrink:0}',
      '.dfMatAction{border:0;border-radius:9px;padding:8px 10px;font:900 11px system-ui;cursor:pointer}',
      '.dfMatEdit{background:#f59e0b;color:#111827}',
      '.dfMatDelete{background:#7f1d1d;color:#fee2e2;border:1px solid #ef4444}',
      '.dfMatEditor{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px;padding-top:11px;border-top:1px solid #334155}',
      '.dfMatEditor label{display:block;color:#cbd5e1;font:800 11px system-ui;margin-bottom:5px}',
      '.dfMatEditor input{width:100%;box-sizing:border-box;background:#0b1220;color:#f8fafc;border:1px solid #475569;border-radius:10px;padding:10px 11px;font:700 14px system-ui}',
      '.dfMatEditorBtns{grid-column:1/-1;display:flex;gap:8px}',
      '.dfMatSave,.dfMatCancel{flex:1;border:0;border-radius:10px;padding:10px;font:900 11px system-ui;cursor:pointer}',
      '.dfMatSave{background:#166534;color:#dcfce7;border:1px solid #22c55e}',
      '.dfMatCancel{background:#1e293b;color:#e2e8f0;border:1px solid #475569}',
      '@media(max-width:560px){.dfMatSummary{align-items:flex-start;flex-direction:column}.dfMatActions{width:100%}.dfMatAction{flex:1}.dfMatEditor{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function renderList(){
    const panel=document.getElementById(PANEL_ID);
    if(!panel)return;
    const mats=loadMats();
    let html='<div class="dfMatPanelHead"><b>Materiais cadastrados</b><button type="button" class="dfMatClose" data-dfmat="close">FECHAR</button></div>';
    if(!mats.length){
      panel.innerHTML=html+'<div class="dfMatEmpty">Nenhum material cadastrado.</div>';
      return;
    }

    html+=mats.map(m=>{
      const preco=Number(m.preco)||0;
      return '<div class="dfMatItem" data-id="'+esc(m.id)+'">'+
        '<div class="dfMatSummary">'+
          '<div><div class="dfMatName">'+esc(m.nome||'Material')+'</div><div class="dfMatPrice">'+(preco>0?'R$ '+fmt(preco)+'/kg':'Sem preço cadastrado')+'</div></div>'+ 
          '<div class="dfMatActions"><button type="button" class="dfMatAction dfMatEdit" data-dfmat="edit" data-id="'+esc(m.id)+'">EDITAR</button><button type="button" class="dfMatAction dfMatDelete" data-dfmat="delete" data-id="'+esc(m.id)+'">EXCLUIR</button></div>'+ 
        '</div>'+ 
        '<div class="dfMatEditor" data-editor="'+esc(m.id)+'" style="display:none">'+
          '<div><label>Nome do material</label><input data-field="name" value="'+esc(m.nome||'')+'"></div>'+ 
          '<div><label>Preço por kg</label><input data-field="price" inputmode="decimal" value="'+(preco>0?fmt(preco):'')+'" placeholder="Ex.: 5,50"></div>'+ 
          '<div class="dfMatEditorBtns"><button type="button" class="dfMatSave" data-dfmat="save" data-id="'+esc(m.id)+'">SALVAR ALTERAÇÃO</button><button type="button" class="dfMatCancel" data-dfmat="cancel" data-id="'+esc(m.id)+'">CANCELAR</button></div>'+ 
        '</div>'+ 
      '</div>';
    }).join('');
    panel.innerHTML=html;
  }

  function openEditor(id){
    document.querySelectorAll('[data-editor]').forEach(el=>{el.style.display=String(el.dataset.editor)===String(id)?'grid':'none';});
    const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');
    if(ed)ed.querySelector('[data-field="name"]')?.focus();
  }

  function saveEdit(id){
    const mats=loadMats();
    const i=mats.findIndex(m=>String(m.id)===String(id));
    if(i<0)return;
    const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');
    if(!ed)return;
    const nome=(ed.querySelector('[data-field="name"]')?.value||'').trim();
    const preco=parsePrice(ed.querySelector('[data-field="price"]')?.value||'');
    if(!nome){alert('Digite o nome do material.');return;}
    if(mats.some((m,idx)=>idx!==i&&lower(m.nome)===lower(nome))){alert('Já existe outro material com esse nome.');return;}
    mats[i]={...mats[i],nome,preco};
    saveMats(mats);
    renderList();
  }

  function deleteMat(id){
    const mats=loadMats();
    const m=mats.find(x=>String(x.id)===String(id));
    if(!m)return;
    if(!confirm('Excluir o material "'+(m.nome||'Material')+'" do cadastro?'))return;

    try{
      if(typeof window.getFoRows==='function'&&typeof window.renderMixRows==='function'){
        const rows=(window.getFoRows()||[]).filter(r=>String(r.id)!==String(id));
        window.renderMixRows(rows);
      }
    }catch(e){}

    saveMats(mats.filter(x=>String(x.id)!==String(id)));
    renderList();
  }

  function bindPanel(panel){
    if(panel.dataset.dfBound==='1')return;
    panel.dataset.dfBound='1';
    panel.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-dfmat]');
      if(!btn)return;
      const act=btn.dataset.dfmat,id=btn.dataset.id;
      if(act==='close'){panel.style.display='none';return;}
      if(act==='edit'){openEditor(id);return;}
      if(act==='cancel'){const ed=document.querySelector('[data-editor="'+CSS.escape(String(id))+'"]');if(ed)ed.style.display='none';return;}
      if(act==='save'){saveEdit(id);return;}
      if(act==='delete'){deleteMat(id);return;}
    });
  }

  function mount(){
    addStyle();
    const saveBtn=document.getElementById('matSave');
    if(!saveBtn||document.getElementById(WRAP_ID))return;

    const wrap=document.createElement('div');
    wrap.id=WRAP_ID;
    wrap.className='dfMatMgr';
    wrap.innerHTML='<button type="button" class="dfMatMgrBtn" id="dfMaterialEditBtn">✎ EDITAR MATERIAIS CADASTRADOS</button><div id="'+PANEL_ID+'" class="dfMatPanel" style="display:none"></div>';
    saveBtn.insertAdjacentElement('afterend',wrap);

    const panel=document.getElementById(PANEL_ID);
    bindPanel(panel);
    document.getElementById('dfMaterialEditBtn').addEventListener('click',()=>{
      renderList();
      panel.style.display=panel.style.display==='none'?'block':'none';
    });
  }

  function init(){
    mount();
    [400,900,1600,2600].forEach(t=>setTimeout(mount,t));
    document.addEventListener('click',()=>setTimeout(mount,80),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
