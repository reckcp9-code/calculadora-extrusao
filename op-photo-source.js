(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfOpPhotoSourceStyle'))return;
    const s=document.createElement('style');
    s.id='dfOpPhotoSourceStyle';
    s.textContent=`
      #dfOpPhotoSource{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:2px 0 10px}#dfOpPhotoTypeWrap,#dfOpPhotoFormulaWrap{grid-column:1/-1;display:grid;gap:5px;color:#94a3b8;font-size:11px;font-weight:900}#dfOpPhotoType,#dfOpPhotoFormula{width:100%;min-height:44px;border:1px solid #475569;border-radius:11px;background:#0f172a;color:#e2e8f0;padding:10px;font-weight:850;font-size:14px}#dfOpPhotoFormulaWrap[hidden]{display:none!important}
      #dfOpPhotoSource button{min-height:48px;border-radius:13px;padding:12px 10px;font-size:13px;font-weight:950;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #dfOpTakePhoto{border:1px solid #f5a000;background:#241600;color:#ffd36a}
      #dfOpUploadPhoto{border:1px solid #475569;background:#0f172a;color:#e2e8f0}
      #dfOpPhoto.dfOpPhotoHidden{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}
      @media(max-width:420px){#dfOpPhotoSource{grid-template-columns:1fr 1fr}#dfOpPhotoSource button{min-height:46px}}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    addStyle();
    const input=document.getElementById('dfOpPhoto');
    if(!input)return false;
    if(input.dataset.dfPhotoSourceMounted==='1')return true;
    input.dataset.dfPhotoSourceMounted='1';
    input.classList.add('dfOpPhotoHidden');

    const wrap=document.createElement('div');
    wrap.id='dfOpPhotoSource';

    const typeWrap=document.createElement('label');
    typeWrap.id='dfOpPhotoTypeWrap';
    typeWrap.textContent='TIPO DA FOTO';
    const typeSelect=document.createElement('select');
    typeSelect.id='dfOpPhotoType';
    typeSelect.innerHTML='<option value="production_op">PRODUÇÃO DA OP • ligada ao OPID</option><option value="formulation">FORMULAÇÃO • ligada ao ID da fórmula</option>';
    try{const saved=localStorage.getItem('df_op_photo_type_v1');if(saved==='formulation'||saved==='production_op')typeSelect.value=saved}catch(e){}
    typeSelect.addEventListener('change',function(){try{localStorage.setItem('df_op_photo_type_v1',typeSelect.value)}catch(e){};formulaWrap.hidden=typeSelect.value!=='formulation';if(typeSelect.value==='formulation')refreshFormulas()});
    typeWrap.appendChild(typeSelect);

    const formulaWrap=document.createElement('label');
    formulaWrap.id='dfOpPhotoFormulaWrap';
    formulaWrap.className='dfOpPhotoFormulaWrap';
    formulaWrap.textContent='FORMULAÇÃO DE ORIGEM';
    const formulaSelect=document.createElement('select');
    formulaSelect.id='dfOpPhotoFormula';
    formulaWrap.appendChild(formulaSelect);
    function refreshFormulas(){
      let rows=[];try{rows=JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){}
      const previous=String(localStorage.getItem('df_op_photo_formula_id_v1')||'');
      formulaSelect.innerHTML='<option value="">ESCOLHA A FORMULAÇÃO</option>';
      (Array.isArray(rows)?rows:[]).filter(f=>f&&f.id!=null).forEach(f=>{const o=document.createElement('option');o.value=String(f.id);o.textContent=String(f.nome||'Formulação')+' • ID '+String(f.id);formulaSelect.appendChild(o)});
      if(previous&&Array.from(formulaSelect.options).some(o=>o.value===previous))formulaSelect.value=previous;
    }
    refreshFormulas();
    formulaWrap.hidden=typeSelect.value!=='formulation';
    formulaSelect.addEventListener('change',function(){try{localStorage.setItem('df_op_photo_formula_id_v1',formulaSelect.value)}catch(e){}});
    formulaSelect.addEventListener('focus',refreshFormulas);
    formulaSelect.addEventListener('click',refreshFormulas);

    const camera=document.createElement('button');
    camera.id='dfOpTakePhoto';
    camera.type='button';
    camera.textContent='📷 TIRAR FOTO';

    const upload=document.createElement('button');
    upload.id='dfOpUploadPhoto';
    upload.type='button';
    upload.textContent='🖼️ ENVIAR FOTO';

    camera.addEventListener('click',function(){
      try{input.value=''}catch(e){}
      input.setAttribute('accept','image/*');
      input.setAttribute('capture','environment');
      input.click();
    });

    upload.addEventListener('click',function(){
      try{input.value=''}catch(e){}
      input.setAttribute('accept','image/*');
      input.removeAttribute('capture');
      input.click();
    });

    wrap.append(typeWrap,formulaWrap,camera,upload);
    input.parentNode.insertBefore(wrap,input);
    return true;
  }

  function boot(){
    if(mount())return;
    const root=document.body||document.documentElement;
    if(!root)return;
    const obs=new MutationObserver(function(){if(mount())obs.disconnect()});
    obs.observe(root,{childList:true,subtree:true});
    setTimeout(function(){if(mount())obs.disconnect()},500);
    setTimeout(function(){if(mount())obs.disconnect()},1500);
    setTimeout(function(){if(mount())obs.disconnect()},3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('df-ui-ready',function(){setTimeout(mount,100)});
})();
