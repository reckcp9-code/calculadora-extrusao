(function(){
  'use strict';

  const q=id=>document.getElementById(id);
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const forms=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const mats=()=>{try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}};
  const mat=id=>{try{return window.materialById?window.materialById(id):mats().find(m=>String(m.id)===String(id))}catch(e){return null}};
  const selected=()=>{const id=q('foSavedSelect')?.value;return forms().find(f=>String(f.id)===String(id));};

  function currentRows(){
    try{if(typeof window.getFoRows==='function')return window.getFoRows().filter(r=>r.id&&Number(r.pct)>0)}catch(e){}
    return [];
  }

  function mixData(total,rows){
    let pct=0;
    const items=(rows||[]).map(r=>{
      const m=mat(r.id)||r;
      const p=Number(r.pct)||0;
      const kg=Number(total||0)*p/100;
      pct+=p;
      return{nome:m.nome||r.nome||'Material',pct:p,kg};
    });
    return{pct,items};
  }

  function addMixBox(){
    if(q('dfMixKgBox'))return;
    const total=q('foTotal');
    if(!total)return;
    const grid=total.closest('.grid')||total.parentElement;
    if(!grid||!grid.parentNode)return;

    const box=document.createElement('div');
    box.id='dfMixKgBox';
    box.className='formRow';
    box.style.marginTop='14px';
    box.innerHTML=`
      <div class="rowTitle">Calcular mistura em kg</div>
      <div class="formNote">O campo “Quantos kg quer fazer?” continua sendo a quantidade total que será produzida nessa medida. Aqui embaixo você digita separadamente o tamanho da mistura que quer preparar.</div>
      <label>Quantos kg quer preparar nesta mistura?</label>
      <input id="dfMixBatchKg" class="main" inputmode="decimal" placeholder="Ex.: 100, 250 ou 750">
      <button id="dfCalcMixKg" class="calcBtn alt" type="button">CALCULAR MISTURA</button>
      <div id="dfMixKgResult" style="margin-top:10px"></div>`;

    grid.insertAdjacentElement('afterend',box);
    q('dfCalcMixKg')?.addEventListener('click',renderMix);
    q('dfMixBatchKg')?.addEventListener('keydown',e=>{if(e.key==='Enter')renderMix()});
  }

  function renderMix(){
    const producao=pn(q('foTotal')?.value);
    const mistura=pn(q('dfMixBatchKg')?.value);
    const rows=currentRows();
    const out=q('dfMixKgResult');
    if(!out)return;

    if(!(mistura>0)){
      alert('Digite quantos kg quer preparar nesta mistura.');
      q('dfMixBatchKg')?.focus();
      return;
    }
    if(!rows.length){alert('Adicione os materiais e as porcentagens primeiro.');return;}

    const d=mixData(mistura,rows);
    window.dfMixBatchKgCurrent=mistura;

    let html='';
    if(producao>0)html+='<div class="kpi"><span>Quantidade que será produzida</span><b>'+fm(producao,2)+' kg</b></div>';
    html+='<div class="kpi"><span>Tamanho desta mistura</span><b>'+fm(mistura,2)+' kg</b></div>';
    d.items.forEach(it=>{
      html+='<div class="kpi"><span>'+esc(it.nome)+' — '+fm(it.pct,2)+'%</span><b>'+fm(it.kg,3)+' kg</b></div>';
    });

    if(Math.abs(d.pct-100)<=0.05){
      html+='<div class="status ok" style="margin-top:10px">MISTURA FECHADA EM '+fm(d.pct,2)+'% ✅</div>';
    }else{
      html+='<div class="status bad" style="margin-top:10px">ATENÇÃO: porcentagens somam '+fm(d.pct,2)+'%. Ajuste para 100%.</div>';
    }
    out.innerHTML=html;
  }

  function currentOp(){
    return{
      largura:pn(q('exL')?.value),
      comprimento:pn(q('exComp')?.value),
      micra:pn(q('exM')?.value),
      grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0
    };
  }

  function openOP(f){
    if(!f){alert('Formulação não encontrada.');return;}

    const nome=f.nome||'Formulação';
    const totalProducao=Number(f.total)||0;
    const rows=f.rows||[];
    const pctInfo=mixData(1,rows);
    if(Math.abs(pctInfo.pct-100)>0.05){
      alert('A formulação soma '+fm(pctInfo.pct,2)+'%. Ajuste para 100% antes de gerar a OP.');
      return;
    }

    const digitado=pn(q('dfMixBatchKg')?.value);
    const totalMistura=digitado>0?digitado:(Number(window.dfMixBatchKgCurrent)||totalProducao);
    const atual=currentOp(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'_____';
    const letras=['A','B','C','D','E','F','G','H'];

    let matRows='';
    for(let i=0;i<8;i++){
      const r=rows[i]||{};
      const m=r.id?(mat(r.id)||r):{};
      const desc=m.nome||r.nome||'';
      const pct=Number(r.pct)||0;
      const kg=totalMistura*pct/100;
      matRows+='<tr><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td><td class="center b mixkg">'+(pct?fm(kg,3)+' kg':'')+'</td></tr>';
    }

    let prodRows='';
    for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

    if(window.DFOPLandscapePdf&&typeof window.DFOPLandscapePdf.open==='function'){
      window.DFOPLandscapePdf.open({
        name:nome,
        date:hoje,
        size:tamanho,
        production:fm(totalProducao,0)+' KG',
        mix:fm(totalMistura,0)+' KG',
        doubleMicra:dupla,
        wallMicra:parede,
        grams:gram,
        width:lb,
        materials:rows.slice(0,8).map(function(r,i){
          const m=r.id?(mat(r.id)||r):r;
          const pct=Number(r.pct)||0;
          return{
            code:letras[i],
            name:m.nome||r.nome||'',
            pct:pct?fm(pct,2)+'%':'',
            kg:pct?fm(totalMistura*pct/100,3)+' kg':''
          };
        })
      });
      return;
    }

    const style=`
      @page{size:A4 landscape;margin:4mm}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#dfe3e8}
      .toolbar{position:sticky;top:0;z-index:20;display:flex;gap:8px;align-items:center;padding:9px 12px;background:#111827;color:#fff;box-shadow:0 2px 10px #0003}
      .toolbar button{border:0;border-radius:7px;padding:9px 13px;font-weight:900;cursor:pointer}.back{background:#e5e7eb;color:#111827}.print{background:#111;color:#fff;border:1px solid #fff!important}.hint{font-size:13px;opacity:.9}
      .sheet{width:285mm;min-height:190mm;margin:10px auto;background:#fff;padding:3mm;box-shadow:0 6px 26px #0002;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
      .op{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4px;line-height:1.02}.op td,.op th{border:1.5px solid #111;padding:2px 3px;vertical-align:middle;height:17px}.center{text-align:center}.b{font-weight:800}
      .logo{font-size:16px;font-weight:900;letter-spacing:.3px}.title{background:#d1d5db;color:#111;text-align:center;font-weight:900}.shade{background:#f3f4f6}.shade2{background:#e5e7eb}.top td{height:21px}.big{font-size:13px}.xbig{font-size:16px}
      .mat th{background:#d1d5db;color:#111;font-weight:900}.mat td{height:19px}.mat .cMat{width:7%}.mat .cDesc{width:60%}.mat .cPct{width:12%}.mat .cKg{width:21%}.mixkg{white-space:nowrap}
      .prod th{background:#e5e7eb;font-size:8px}.prod td{height:18px}.codes td{font-size:8px;background:#f8fafc;height:15px}.sectionGap{height:2px;flex:0 0 2px}.obs{height:25px}.miniTitle{font-size:8px;color:#333;font-weight:800;text-transform:uppercase}.value{font-size:12px;font-weight:900}.stamp{float:right;border:1.5px solid #111;border-radius:5px;padding:3px 8px;font-weight:900;background:#fff}
      @media(max-width:900px){.sheet{width:285mm;transform-origin:top left;transform:scale(calc((100vw - 14px) / 1077));margin-left:7px;margin-right:0}}
      @media print{
        @page{size:A4 landscape;margin:4mm}
        html,body{margin:0!important;padding:0!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}
        .toolbar{display:none!important}
        .sheet{display:block!important;position:static!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;box-shadow:none!important;transform:none!important;overflow:visible!important;page-break-inside:avoid!important;break-inside:avoid-page!important}
        .op{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:7.6px!important;line-height:.88!important;margin:0!important;page-break-inside:avoid!important;break-inside:avoid-page!important}
        .op td,.op th{border:.32mm solid #111!important;height:3.6mm!important;min-height:0!important;padding:.22mm .45mm!important;vertical-align:middle!important;line-height:.88!important}
        .top td{height:4.4mm!important}.mat td,.mat th{height:3.4mm!important}.prod td,.prod th{height:3.25mm!important;font-size:6.5px!important}.codes td,.codes th{height:2.7mm!important;font-size:6.1px!important}.obs{height:4.6mm!important}.sectionGap{display:block!important;height:.15mm!important;min-height:0!important;flex:none!important}.logo{font-size:11px!important}.title{font-size:7.4px!important}.xbig{font-size:10px!important}.big{font-size:8.5px!important}.value{font-size:8px!important}.miniTitle{font-size:5.8px!important}.stamp{padding:.6mm 1.5mm!important;font-size:6px!important}
        .sheet,.sheet *{page-break-before:avoid!important;page-break-after:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important}
      }
    `;

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OP '+esc(nome)+'</title><style>'+style+'</style></head><body><div class="toolbar"><button class="back" onclick="window.close()">← VOLTAR PARA FORMULAÇÃO</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button><span class="hint">OP A4 deitado — produção e mistura separadas</span></div><div class="sheet">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="center b">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho)+'</span></td><td colspan="3">cód. de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Peso líquido / produção</span><br><span class="value">'+fm(totalProducao,0)+' KG</span></td><td colspan="3" class="shade"><span class="miniTitle">Mistura calculada</span><br><span class="value">'+fm(totalMistura,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div>'+
      '<table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="shade"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="shade2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="shade"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div>'+
      '<table class="op mat"><colgroup><col class="cMat"><col class="cDesc"><col class="cPct"><col class="cKg"></colgroup><tr><th>MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th>%</th><th>KG DA MISTURA</th></tr>'+matRows+'</table><div class="sectionGap"></div>'+
      '<table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02- acerto</td><td>03- M. mecânica</td><td>04- falta de energia</td><td>05- material molhado</td><td>06- teste</td></tr><tr><td>07- M. elétrica</td><td>08- limpeza da borda</td><td>09- troca de tela</td><td>10- outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div></body></html>';

    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  document.addEventListener('click',function(ev){
    const b=ev.target?.closest?.('[data-fosafe="op"]');
    if(!b)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const f=selected();
    if(!f){alert('Selecione uma formulação.');return;}
    openOP(f);
  },true);

  function mount(){addMixBox();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,120));
  setTimeout(mount,500);
  setTimeout(mount,1300);
})();
