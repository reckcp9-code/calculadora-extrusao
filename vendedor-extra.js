(function(){
  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const DEFAULT_NUM='5547992825006';
  const $=id=>document.getElementById(id);

  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function fmt(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'0,00'}
  function money(v){const n=Number(v)||0;return 'R$ '+fmt(n,2)}
  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function mats(){try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}}
  function mat(id){try{return window.materialById?window.materialById(id):mats().find(m=>String(m.id)===String(id))}catch(e){return null}}

  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(!d)d=DEFAULT_NUM;
    if(d.length===10||d.length===11)d='55'+d;
    return d;
  }
  function getPhone(){return normalizePhone(localStorage.getItem(KEY_NUM)||DEFAULT_NUM)}
  function autoOn(){return localStorage.getItem(KEY_AUTO)!=='0'}

  function addStyle(){
    if($('dfVendedorStyle'))return;
    const st=document.createElement('style');
    st.id='dfVendedorStyle';
    st.textContent=[
      '.dfVendedorCard{border-color:#14532d!important;background:linear-gradient(180deg,#101827,#07130d)!important}',
      '.dfVendedorGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dfVendedorCheck{display:flex;align-items:center;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:11px 12px;color:#cbd5e1;font-size:13px;font-weight:900;margin-top:12px}',
      '.dfVendedorCheck input{width:auto;transform:scale(1.15)}',
      '.dfVendedorMini{font-size:12px!important;padding:10px 8px!important;margin-top:10px!important}',
      '@media(max-width:560px){.dfVendedorGrid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function saveCfg(){
    const n=$('foVendWhats');
    const a=$('foVendAuto');
    if(n)localStorage.setItem(KEY_NUM,normalizePhone(n.value));
    if(a)localStorage.setItem(KEY_AUTO,a.checked?'1':'0');
  }

  function configHtml(){
    const phone=localStorage.getItem(KEY_NUM)||DEFAULT_NUM;
    const checked=autoOn()?'checked':'';
    return '<div class="card dfVendedorCard" id="dfVendedorCard">'+
      '<span class="tag">Vendedor</span>'+
      '<h2>WhatsApp automático ao salvar</h2>'+
      '<div class="hint">Quando salvar uma formulação, o sistema abre o WhatsApp do vendedor com a mensagem pronta. No WhatsApp comum ainda precisa apertar ENVIAR.</div>'+ 
      '<div class="dfVendedorGrid">'+
        '<div><label>WhatsApp do vendedor com DDD</label><input id="foVendWhats" inputmode="tel" value="'+esc(phone)+'" placeholder="Ex.: 47992825006"></div>'+
        '<div><label>Ação</label><button id="foVendTest" class="calcBtn alt dfVendedorMini" type="button">ENVIAR ÚLTIMA FORMULAÇÃO</button></div>'+ 
      '</div>'+ 
      '<label class="dfVendedorCheck"><input id="foVendAuto" type="checkbox" '+checked+'> Abrir WhatsApp automaticamente quando salvar formulação</label>'+ 
      '<div id="foVendMsg" class="smallNote">O PDF/OP não anexa sozinho pelo WhatsApp comum. A mensagem vai pronta; o PDF pode ser gerado no botão PDF/OP.</div>'+ 
    '</div>';
  }

  function addConfig(){
    addStyle();
    const pg=$('pgFo');
    if(!pg||$('dfVendedorCard'))return;
    const contact=$('dfContact_pgFo');
    if(contact)contact.insertAdjacentHTML('beforebegin',configHtml());
    else pg.insertAdjacentHTML('afterbegin',configHtml());
    bindConfig();
  }

  function bindConfig(){
    const n=$('foVendWhats'),a=$('foVendAuto'),t=$('foVendTest');
    if(n&&!n.dfVendBound){n.dfVendBound=true;n.addEventListener('input',saveCfg);n.addEventListener('change',saveCfg)}
    if(a&&!a.dfVendBound){a.dfVendBound=true;a.addEventListener('change',saveCfg)}
    if(t&&!t.dfVendBound){t.dfVendBound=true;t.addEventListener('click',function(){saveCfg();const f=forms()[0];if(!f){alert('Nenhuma formulação salva ainda.');return}openWhats(f,true)})}
  }

  function messageFor(f){
    const total=Number(f.total)||0;
    const rows=f.rows||[];
    let linhas=[];
    linhas.push('📋 *NOVA FORMULAÇÃO SALVA*');
    linhas.push('');
    linhas.push('*Formulação:* '+(f.nome||'Formulação'));
    linhas.push('*Total:* '+fmt(total,2)+' kg');
    if(f.custo)linhas.push('*Custo total:* '+money(f.custo));
    if(f.custoKg)linhas.push('*Custo por kg:* '+money(f.custoKg));
    const op=f.op||{};
    if(op.largura||op.comprimento||op.micra||op.grama){
      linhas.push('');
      linhas.push('*Dados da extrusão:*');
      if(op.largura)linhas.push('Largura: '+fmt(op.largura,1)+' cm');
      if(op.comprimento)linhas.push('Comprimento: '+fmt(op.comprimento,1)+' cm');
      if(op.micra)linhas.push('Micra dupla: '+fmt(op.micra,2)+' µm');
      if(op.grama)linhas.push('Peso metro: '+fmt(op.grama,2)+' g/m');
    }
    linhas.push('');
    linhas.push('*Materiais:*');
    if(rows.length){
      rows.forEach(r=>{
        const m=mat(r.id)||r;
        const pct=Number(r.pct)||0;
        const kg=total*pct/100;
        const preco=Number(r.preco||m.preco)||0;
        linhas.push('- '+(m.nome||r.nome||'Material')+': '+fmt(pct,2)+'% = '+fmt(kg,3)+' kg'+(preco?' | '+money(preco)+'/kg':''));
      });
    }else{
      linhas.push('- sem materiais');
    }
    linhas.push('');
    linhas.push('Gerado pelo DF EXTRUSOR PRO');
    return linhas.join('\n');
  }

  function openWhats(f,manual){
    const phone=getPhone();
    const url='https://wa.me/'+phone+'?text='+encodeURIComponent(messageFor(f));
    const w=window.open(url,'_blank','noopener');
    const msg=$('foVendMsg');
    if(msg)msg.textContent='WhatsApp aberto para '+phone+'. Confira e aperte ENVIAR.';
    if(!w)alert('O navegador bloqueou o WhatsApp. Use o botão ENVIAR ÚLTIMA FORMULAÇÃO ou libere pop-up.');
  }

  function wrapSave(){
    const original=window.salvarFormula;
    if(typeof original!=='function'||original.dfVendWrapped)return;
    function wrapped(){
      const before=forms().map(f=>String(f.id));
      const beforeSet=new Set(before);
      const ret=original.apply(this,arguments);
      try{
        saveCfg();
        if(autoOn()){
          const after=forms();
          const novo=after.find(f=>!beforeSet.has(String(f.id)));
          if(novo)openWhats(novo,false);
        }
      }catch(e){}
      return ret;
    }
    wrapped.dfVendWrapped=true;
    wrapped.dfVendOriginal=original;
    window.salvarFormula=wrapped;
  }

  function init(){
    addConfig();
    wrapSave();
    setTimeout(()=>{addConfig();wrapSave();},400);
    setTimeout(()=>{addConfig();wrapSave();},1200);
    setTimeout(()=>{addConfig();wrapSave();},2500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('click',function(){setTimeout(()=>{addConfig();bindConfig();wrapSave();},200)},true);
})();
