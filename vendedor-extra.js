(function(){
  const KEY_NUM='df_vendedor_whats_num_v1';
  const KEY_AUTO='df_vendedor_whats_auto_v1';
  const KEY_PDF_AUTO='df_vendedor_pdf_auto_v1';
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
  function pdfAutoOn(){return localStorage.getItem(KEY_PDF_AUTO)!=='0'}

  function addStyle(){
    if($('dfVendedorStyle'))return;
    const st=document.createElement('style');
    st.id='dfVendedorStyle';
    st.textContent=[
      '#pgFo.dfVendedorOnly > *:not(.dfAutoTopics):not(#dfVendedorCard){display:none!important}',
      '#pgFo.dfVendedorOnly > #dfVendedorCard{display:block!important}',
      '#pgFo.dfFormulaAutoOnly > *:not(.dfAutoTopics):not(#foDevArea){display:none!important}',
      '#pgFo.dfFormulaAutoOnly > #foDevArea{display:block!important}',
      '.dfVendedorCard{border-color:#14532d!important;background:linear-gradient(180deg,#101827,#07130d)!important}',
      '.dfVendedorGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.dfVendedorCheck{display:flex;align-items:center;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:11px 12px;color:#cbd5e1;font-size:13px;font-weight:900;margin-top:12px}',
      '.dfVendedorCheck input{width:auto;transform:scale(1.15)}',
      '.dfVendedorMini{font-size:12px!important;padding:10px 8px!important;margin-top:10px!important}',
      '.dfVendedorPdf{border-color:#22c55e!important;background:#0c321c!important;color:#bbf7d0!important}',
      '@media(max-width:560px){.dfVendedorGrid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(st);
  }

  function saveCfg(){
    const n=$('foVendWhats'),a=$('foVendAuto'),p=$('foVendPdfAuto');
    if(n)localStorage.setItem(KEY_NUM,normalizePhone(n.value));
    if(a)localStorage.setItem(KEY_AUTO,a.checked?'1':'0');
    if(p)localStorage.setItem(KEY_PDF_AUTO,p.checked?'1':'0');
  }

  function configHtml(){
    const phone=localStorage.getItem(KEY_NUM)||DEFAULT_NUM;
    const checked=autoOn()?'checked':'';
    const pdfChecked=pdfAutoOn()?'checked':'';
    return '<div class="card dfVendedorCard" id="dfVendedorCard">'+
      '<span class="tag">Vendedor</span>'+
      '<h2>WhatsApp / PDF ao salvar</h2>'+
      '<div class="hint">Quando salvar uma formulação, o sistema pode abrir diretamente o WhatsApp cadastrado com a mensagem pronta e também gerar o PDF para anexar.</div>'+ 
      '<div class="dfVendedorGrid">'+
        '<div><label>WhatsApp do vendedor com DDD</label><input id="foVendWhats" inputmode="tel" value="'+esc(phone)+'" placeholder="Ex.: 47992825006"></div>'+
        '<div><label>Teste mensagem</label><button id="foVendTest" class="calcBtn alt dfVendedorMini" type="button">ENVIAR MSG DA ÚLTIMA</button></div>'+ 
        '<div><label>Teste PDF</label><button id="foVendPdfTest" class="calcBtn dfVendedorPdf dfVendedorMini" type="button">ENVIAR PDF DA ÚLTIMA</button></div>'+ 
      '</div>'+ 
      '<label class="dfVendedorCheck"><input id="foVendAuto" type="checkbox" '+checked+'> Abrir WhatsApp com mensagem quando salvar formulação</label>'+ 
      '<label class="dfVendedorCheck"><input id="foVendPdfAuto" type="checkbox" '+pdfChecked+'> Gerar PDF e abrir o WhatsApp cadastrado quando salvar formulação</label>'+ 
      '<div id="foVendMsg" class="smallNote">Ao clicar em ENVIAR PDF DA ÚLTIMA, o PDF é baixado e a conversa do WhatsApp cadastrado abre direto. Depois é só anexar o PDF e enviar.</div>'+ 
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

  function ensureFormulaAutoTopic(){
    const pg=$('pgFo'),nav=pg&&pg.querySelector(':scope > .dfAutoTopics');
    if(!nav||nav.querySelector('[data-topic="formula-auto"]'))return;
    const b=document.createElement('button');
    b.type='button';
    b.className='dfAutoTopic';
    b.dataset.topic='formula-auto';
    b.textContent='FORMULAÇÃO AUTOMÁTICA';
    const menu=nav.querySelector(':scope > .dfPersistentMenuBtn');
    if(menu&&menu.nextSibling)nav.insertBefore(b,menu.nextSibling);
    else if(menu)nav.appendChild(b);
    else nav.insertBefore(b,nav.firstChild);
  }

  function syncTopicView(){
    const pg=$('pgFo'),card=$('dfVendedorCard');
    if(!pg||!card)return;
    ensureFormulaAutoTopic();
    const auto=!!pg.querySelector('.dfAutoTopic[data-topic="formula-auto"].on');
    pg.classList.toggle('dfFormulaAutoOnly',auto);
    pg.classList.toggle('dfVendedorOnly',!auto&&card.classList.contains('dfTopicVisible'));
  }

  function bindConfig(){
    const n=$('foVendWhats'),a=$('foVendAuto'),p=$('foVendPdfAuto'),t=$('foVendTest'),pdf=$('foVendPdfTest');
    if(n&&!n.dfVendBound){n.dfVendBound=true;n.addEventListener('input',saveCfg);n.addEventListener('change',saveCfg)}
    if(a&&!a.dfVendBound){a.dfVendBound=true;a.addEventListener('change',saveCfg)}
    if(p&&!p.dfVendBound){p.dfVendBound=true;p.addEventListener('change',saveCfg)}
    if(t&&!t.dfVendBound){t.dfVendBound=true;t.addEventListener('click',function(){saveCfg();const f=forms()[0];if(!f){alert('Nenhuma formulação salva ainda.');return}openWhats(f,true)})}
    if(pdf&&!pdf.dfVendBound){pdf.dfVendBound=true;pdf.addEventListener('click',function(){saveCfg();const f=forms()[0];if(!f){alert('Nenhuma formulação salva ainda.');return}sharePdf(f,true)})}
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

  function pdfLines(f){
    const total=Number(f.total)||0,rows=f.rows||[],op=f.op||{};
    let l=[];
    l.push('DF EXTRUSOR PRO');
    l.push('RELATORIO DE FORMULACAO');
    l.push('Gerado em: '+new Date().toLocaleString('pt-BR'));
    l.push('');
    l.push('FORMULACAO: '+(f.nome||'Formulação'));
    l.push('TOTAL: '+fmt(total,2)+' kg');
    if(f.custo)l.push('CUSTO TOTAL: '+money(f.custo));
    if(f.custoKg)l.push('CUSTO POR KG: '+money(f.custoKg));
    if(op.largura||op.comprimento||op.micra||op.grama){
      l.push('');
      l.push('DADOS DA EXTRUSAO');
      if(op.largura)l.push('Largura: '+fmt(op.largura,1)+' cm');
      if(op.comprimento)l.push('Comprimento: '+fmt(op.comprimento,1)+' cm');
      if(op.micra)l.push('Micra dupla: '+fmt(op.micra,2)+' um');
      if(op.grama)l.push('Peso metro: '+fmt(op.grama,2)+' g/m');
    }
    l.push('');
    l.push('MATERIAIS');
    if(rows.length){
      rows.forEach(r=>{
        const m=mat(r.id)||r;
        const pct=Number(r.pct)||0,kg=total*pct/100,preco=Number(r.preco||m.preco)||0;
        l.push((m.nome||r.nome||'Material')+' | '+fmt(pct,2)+'% | '+fmt(kg,3)+' kg'+(preco?' | '+money(preco)+'/kg':''));
      });
    }else l.push('Sem materiais.');
    l.push('');
    l.push('Observacao: confira os dados antes de produzir. Resultado depende de densidade, medicao e materia-prima.');
    return l;
  }

  function ascii(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ')}
  function pdfEsc(t){return ascii(t).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
  function wrap(arr,max){
    const out=[];
    arr.forEach(line=>{
      let s=ascii(line);
      if(!s){out.push('');return}
      while(s.length>max){
        let cut=s.lastIndexOf(' ',max);
        if(cut<25)cut=max;
        out.push(s.slice(0,cut));
        s=s.slice(cut).trim();
      }
      out.push(s);
    });
    return out.slice(0,46);
  }
  function safeName(f){
    const base=ascii(f&&f.nome?f.nome:'formulacao').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'formulacao';
    return 'DF-'+base+'.pdf';
  }

  function makePdfBlob(f){
    const lines=wrap(pdfLines(f),82);
    let body='BT\n/F2 18 Tf\n50 800 Td\n(DF EXTRUSOR PRO) Tj\n/F1 11 Tf\n0 -24 Td\n';
    lines.slice(1).forEach((line,i)=>{
      if(i>0)body+='0 -15 Td\n';
      body+='('+pdfEsc(line)+') Tj\n';
    });
    body+='ET\n';
    const objects=[];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    objects.push('<< /Length '+body.length+' >>\nstream\n'+body+'endstream');
    let pdf='%PDF-1.4\n';
    const offsets=[0];
    objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n'});
    const xref=pdf.length;
    pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
    for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }

  function downloadPdf(f){
    const blob=makePdfBlob(f);
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=safeName(f);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }

  async function sharePdf(f,manual){
    const msg=$('foVendMsg');
    downloadPdf(f);
    if(msg)msg.textContent='PDF gerado. Abrindo diretamente o WhatsApp cadastrado. Anexe o PDF baixado e envie.';
    openWhats(f,manual);
  }

  function openWhats(f,manual){
    const phone=getPhone();
    const url='https://wa.me/'+phone+'?text='+encodeURIComponent(messageFor(f));
    const w=window.open(url,'_blank','noopener');
    const msg=$('foVendMsg');
    if(msg)msg.textContent='WhatsApp cadastrado aberto. Anexe o PDF baixado e aperte ENVIAR.';
    if(!w)alert('O navegador bloqueou o WhatsApp. Libere pop-up e tente novamente.');
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
        const after=forms();
        const novo=after.find(f=>!beforeSet.has(String(f.id)));
        if(novo){
          if(pdfAutoOn())sharePdf(novo,false);
          if(autoOn())openWhats(novo,false);
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
    ensureFormulaAutoTopic();
    syncTopicView();
    wrapSave();
    setTimeout(()=>{addConfig();bindConfig();wrapSave();syncTopicView();},400);
    setTimeout(()=>{addConfig();bindConfig();wrapSave();syncTopicView();},1200);
    setTimeout(()=>{addConfig();bindConfig();wrapSave();syncTopicView();},2500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('click',function(){setTimeout(()=>{addConfig();bindConfig();wrapSave();syncTopicView();},200)},true);
})();