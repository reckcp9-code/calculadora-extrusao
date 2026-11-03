(function(){
  const q=id=>document.getElementById(id);

  function pn(v){
    try{if(typeof v==='string'&&window.n&&q(v))return window.n(v)}catch(e){}
    try{if(window.parseNum)return window.parseNum(v)}catch(e){}
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)?n:0;
  }
  function fm(v,d){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
  function money(v){const n=Number(v);return n>0?'R$ '+fm(n,2):'—'}
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function mats(){try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}}
  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function saveForms(a){try{if(window.saveForms){window.saveForms(a);return}}catch(e){}localStorage.setItem('df_formulacoes_v2',JSON.stringify(a));try{window.renderForms&&window.renderForms()}catch(e){}}
  function mat(id){try{return window.materialById?window.materialById(id):mats().find(m=>String(m.id)===String(id))}catch(e){return null}}

  function bindLogin(){
    const btn=q('licenseBtn'),inp=q('licenseKey'),msg=q('licenseMsg');
    if(!btn||!inp||btn.dataset.dfFixedLogin)return;
    btn.dataset.dfFixedLogin='1';
    try{if(q('licenseDevice')&&window.deviceId)q('licenseDevice').textContent='ID deste aparelho: '+window.deviceId()}catch(e){}
    function go(ev){
      if(ev){ev.preventDefault();ev.stopImmediatePropagation()}
      const k=(inp.value||'').trim();
      if(!k){
        if(window.dfMsg)window.dfMsg('Digite sua licença.');
        else if(msg){msg.textContent='Digite sua licença.';msg.className='licenseMsg err'}
        return;
      }
      if(typeof window.dfLicenseAuthLogin==='function'){
        if(window.dfMsg)window.dfMsg('Verificando licença no LicenseAuth...');
        else if(msg){msg.textContent='Verificando licença no LicenseAuth...';msg.className='licenseMsg'}
        window.dfLicenseAuthLogin(k,false);
        setTimeout(()=>{if(msg&&/Verificando/i.test(msg.textContent||''))msg.textContent='Ainda verificando... aperte Ctrl + F5 e tente novamente se travar.'},10000);
      }else if(msg){msg.textContent='Erro interno da licença. Aperte Ctrl + F5.';msg.className='licenseMsg err'}
    }
    btn.addEventListener('click',go,true);
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')go(e)},true);
  }

  function addComp(){
    if(q('exComp'))return;
    const exL=q('exL');
    if(!exL)return;
    const box=exL.closest('div');
    if(!box||!box.parentNode)return;
    const div=document.createElement('div');
    div.innerHTML='<label>Comprimento final / saco (cm)</label><input id="exComp" class="main" inputmode="decimal" placeholder="Ex.: 105"><div class="smallNote">Usado somente para puxar o tamanho final na OP. Não entra na conta de g/m.</div>';
    box.parentNode.insertBefore(div,box.nextSibling);
  }

  window.getExtrusaoOP=function(){
    const largura=window.n?window.n('exL'):pn(q('exL')&&q('exL').value);
    const comprimento=window.n?window.n('exComp'):pn(q('exComp')&&q('exComp').value);
    const micra=window.n?window.n('exM'):pn(q('exM')&&q('exM').value);
    const grama=window.pesoMetroIdeal?window.pesoMetroIdeal():0;
    return{largura:largura||0,comprimento:comprimento||0,micra:micra||0,grama:grama||0};
  };

  window.salvarFormula=function(){
    const nome=(q('foNome')&&q('foNome').value||'').trim()||'Formulação';
    const total=window.n?window.n('foTotal'):pn(q('foTotal')&&q('foTotal').value);
    const rows=(window.getFoRows?window.getFoRows():[]).filter(r=>r.id&&r.pct>0);
    const pct=rows.reduce((s,r)=>s+(+r.pct||0),0);
    if(!total){alert('Digite quantos kg quer fazer.');return}
    if(!rows.length){alert('Escolha pelo menos 1 material.');return}
    if(Math.abs(100-pct)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;
    const custo=rows.reduce((s,r)=>s+(total*r.pct/100)*(r.preco||0),0);
    const rec={id:Date.now(),nome,total,rows,custo,custoKg:custo&&total?custo/total:0,op:window.getExtrusaoOP(),criado:new Date().toISOString()};
    const a=forms();
    a.unshift(rec);
    saveForms(a);
    alert('Formulação salva.');
  };

  window.renderForms=function(){
    const b=q('foSaved'),a=forms();
    if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return}
    b.innerHTML=a.map(f=>'<div class="savedItem"><b>'+esc(f.nome||'Formulação')+'</b><div class="formNote">'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+(f.custo?money(f.custo):'sem custo')+'</div><div class="savedBtns" style="grid-template-columns:repeat(5,1fr)"><button class="miniBtn" data-openform="'+f.id+'">ABRIR</button><button class="miniBtn" data-pdfform="'+f.id+'">PDF</button><button class="miniBtn" data-opform="'+f.id+'">OP</button><button class="miniBtn" data-dupform="'+f.id+'">DUPLICAR</button><button class="delBtn" data-delform="'+f.id+'">EXCLUIR</button></div></div>').join('');
  };

  window.printFormulaPdf=function(f){
    if(!f){alert('Formulação não encontrada.');return}
    const total=Number(f.total)||0,rows=f.rows||[];
    let pct=0,custoTotal=0,trs='';
    rows.forEach(r=>{
      const m=mat(r.id)||r,nome=m.nome||r.nome||'',preco=Number(r.preco||m.preco)||0,p=Number(r.pct)||0,kg=total*p/100,custo=preco>0?kg*preco:0;
      pct+=p;custoTotal+=custo;
      trs+='<tr><td>'+esc(nome)+'</td><td>'+fm(p,2)+'%</td><td>'+fm(kg,3)+' kg</td><td>'+money(preco)+'</td><td>'+money(custo)+'</td></tr>';
    });
    if(!trs)trs='<tr><td colspan="5">Sem materiais.</td></tr>';
    const custoKg=custoTotal&&total?custoTotal/total:0,hoje=new Date().toLocaleString('pt-BR');
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação '+esc(f.nome||'')+'</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{margin:0 0 4px}.top{border-bottom:3px solid #111;padding-bottom:12px}.box{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#555;font-size:12px}.kpi b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#eee}.foot{margin-top:26px;color:#666;font-size:12px}@media print{body{margin:18px}}</style></head><body><div class="top"><h1>DF Manutenção e Consultoria</h1><div>Relatório de Formulação</div></div><h2>'+esc(f.nome||'Formulação')+'</h2><div class="box"><div class="kpi"><span>Quantidade total</span><b>'+fm(total,3)+' kg</b></div><div class="kpi"><span>Total da porcentagem</span><b>'+fm(pct,2)+'%</b></div><div class="kpi"><span>Custo total</span><b>'+money(custoTotal)+'</b></div><div class="kpi"><span>Custo por kg final</span><b>'+money(custoKg)+'</b></div></div><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Valor/kg</th><th>Custo</th></tr></thead><tbody>'+trs+'</tbody></table><div class="foot">Gerado em '+esc(hoje)+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return}
    w.document.open();w.document.write(html);w.document.close();
  };

  window.printFormulaOp=function(f){
    if(!f){alert('Formulação não encontrada.');return}
    const nome=f.nome||'Formulação';
    const total=Number(f.total)||0;
    const rows=f.rows||[];
    const atual=window.getExtrusaoOP?window.getExtrusaoOP():{largura:0,comprimento:0,micra:0,grama:0};
    const op=f.op||{};
    const largura=Number(op.largura||atual.largura)||0;
    const comprimento=Number(op.comprimento||atual.comprimento)||0;
    const micra=Number(op.micra||atual.micra)||0;
    const grama=Number(op.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'';
    const letras=['A','B','C','D','E','F','G','H'];
    let matRows='';
    for(let i=0;i<8;i++){
      const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;
      const filled=desc||pct;
      matRows+='<tr class="'+(filled?'matFilled':'')+'"><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';
    }
    let prodRows='';
    for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OP '+esc(nome)+'</title><style>'+ 
      '@page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11.5px;background:#fff}.page{border:2px solid #111;padding:6px}.op{width:100%;border-collapse:collapse;table-layout:fixed}.op td,.op th{border:1px solid #333;padding:4px 5px;vertical-align:middle}.center{text-align:center}.b{font-weight:700}.logo{font-size:16px;font-weight:900;letter-spacing:.4px}.title{background:#111827!important;color:#fff!important;text-align:center;font-weight:900;letter-spacing:.4px}.hl{background:#fff200!important;font-weight:900}.hl2{background:#eaf3ff!important;font-weight:900}.hl3{background:#eaffea!important;font-weight:900}.muted{color:#555}.top td{height:21px}.big{font-size:15px}.xbig{font-size:18px}.mat th{background:#111827!important;color:#fff!important}.mat td{height:22px}.matFilled td{background:#fffbe6!important;font-weight:700}.prod th{background:#e5e7eb!important;font-size:10px}.prod td{height:23px}.codes td{font-size:10.5px;background:#fafafa}.sectionGap{height:6px;border:0}.printHint{margin:0 0 6px;color:#555;font-size:11px}.obs{height:34px}.stamp{float:right;border:1px solid #333;border-radius:8px;padding:5px 12px;font-weight:900;background:#fff200}.miniTitle{font-size:10px;color:#333;font-weight:700;text-transform:uppercase}.value{font-size:14px;font-weight:900}@media print{body{margin:0}.printHint{display:none}.page{border:0;padding:0}}'+
      '</style></head><body><div class="printHint">OP pronta para imprimir. Escolha salvar como PDF ou imprimir.</div><div class="page">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="hl center">'+esc(hoje)+'</td></tr>'+ 
      '<tr><td colspan="3" class="hl"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr>'+ 
      '<tr><td colspan="3" class="hl2"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho||'_____')+'</span></td><td colspan="3">cod de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr>'+ 
      '<tr><td colspan="3" class="hl3"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="hl3"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table>'+ 
      '<div class="sectionGap"></div><table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="hl"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr>'+ 
      '<tr><td colspan="3" class="hl2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr>'+ 
      '<tr><td colspan="3" class="hl3"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="hl3"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr>'+ 
      '<tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table>'+ 
      '<div class="sectionGap"></div><table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table>'+ 
      '<div class="sectionGap"></div><table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table>'+ 
      '<table class="op codes"><tr><td>01- troca de TELA</td><td>02-acerto</td><td>03-M.mecânica</td><td>04-falta de energia</td><td>05-material molhado</td><td>06-teste</td></tr><tr><td>07-M.elétrica</td><td>08-limpeza da borda</td><td>09-troca de tela</td><td>10-outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table>'+ 
      '</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return}
    w.document.open();w.document.write(html);w.document.close();
  };

  document.addEventListener('click',ev=>{
    const ds=ev.target&&ev.target.dataset?ev.target.dataset:{};
    if(ds.pdfform){ev.preventDefault();ev.stopImmediatePropagation();const f=forms().find(x=>String(x.id)===String(ds.pdfform));window.printFormulaPdf(f)}
    if(ds.opform){ev.preventDefault();ev.stopImmediatePropagation();const f=forms().find(x=>String(x.id)===String(ds.opform));window.printFormulaOp(f)}
  },true);

  function rebind(){
    bindLogin();
    addComp();
    try{window.renderForms&&window.renderForms()}catch(e){}
    const btn=q('foSave');
    if(btn&&!btn.dataset.dfSaveOp){
      const c=btn.cloneNode(true);
      c.dataset.dfSaveOp='1';
      btn.parentNode.replaceChild(c,btn);
      c.addEventListener('click',window.salvarFormula);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(rebind,100));
  else setTimeout(rebind,100);
  setTimeout(rebind,600);
  setTimeout(rebind,1500);
})();