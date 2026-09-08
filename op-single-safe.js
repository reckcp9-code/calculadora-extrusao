(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};

  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function mats(){try{return window.loadMats?window.loadMats():JSON.parse(localStorage.getItem('df_formula_materiais_v2')||'[]')}catch(e){return[]}}
  function mat(id){return mats().find(m=>String(m.id)===String(id))}
  function selected(){const id=q('foSavedSelect')?.value;return forms().find(f=>String(f.id)===String(id))}
  function currentOp(){return{largura:pn(q('exL')?.value),comprimento:pn(q('exComp')?.value),micra:pn(q('exM')?.value),grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0}}

  function openOP(f){
    if(!f){alert('Formulação não encontrada.');return;}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
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
      const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;
      matRows+='<tr><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';
    }

    let prodRows='';
    for(let i=0;i<8;i++){
      prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    }

    const style=`
      @page{size:A4 landscape;margin:6mm}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#dfe3e8}
      .toolbar{position:sticky;top:0;z-index:20;display:flex;gap:8px;align-items:center;padding:9px 12px;background:#111827;color:#fff;box-shadow:0 2px 10px #0003}
      .toolbar button{border:0;border-radius:7px;padding:9px 13px;font-weight:900;cursor:pointer}.back{background:#e5e7eb;color:#111827}.print{background:#111;color:#fff;border:1px solid #fff!important}.hint{font-size:13px;opacity:.9}
      .sheet{width:285mm;min-height:190mm;margin:10px auto;background:#fff;padding:3mm;box-shadow:0 6px 26px #0002;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
      .op{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4px;line-height:1.02}.op td,.op th{border:1px solid #333;padding:2px 3px;vertical-align:middle;height:17px}.center{text-align:center}.b{font-weight:800}
      .logo{font-size:16px;font-weight:900;letter-spacing:.3px}.title{background:#d1d5db;color:#111;text-align:center;font-weight:900}.shade{background:#f3f4f6}.shade2{background:#e5e7eb}.top td{height:21px}.big{font-size:13px}.xbig{font-size:16px}.mat th{background:#d1d5db;color:#111}.mat td{height:19px}.prod th{background:#e5e7eb;font-size:8px}.prod td{height:18px}.codes td{font-size:8px;background:#f8fafc;height:15px}.sectionGap{height:2px;flex:0 0 2px}.obs{height:25px}.miniTitle{font-size:8px;color:#333;font-weight:800;text-transform:uppercase}.value{font-size:12px;font-weight:900}.stamp{float:right;border:1px solid #333;border-radius:5px;padding:3px 8px;font-weight:900;background:#fff}
      @media(max-width:900px){.sheet{width:285mm;transform-origin:top left;transform:scale(calc((100vw - 14px) / 1077));margin-left:7px;margin-right:0}}
      @media print{
        @page{size:A4 landscape;margin:6mm}
        html,body{background:#fff!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:hidden!important}
        .toolbar{display:none!important}
        .sheet{position:relative!important;left:auto!important;top:auto!important;width:285mm!important;height:188mm!important;min-height:188mm!important;max-height:188mm!important;margin:0!important;padding:2mm!important;box-shadow:none!important;transform:none!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;page-break-before:avoid!important;page-break-after:avoid!important;page-break-inside:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important;break-inside:avoid-page!important}
        .op{font-size:9.1px!important;line-height:.98!important;break-inside:avoid-page!important;page-break-inside:avoid!important;flex:0 0 auto!important}
        .op td,.op th{height:4.9mm!important;padding:.55mm .8mm!important}
        .top td{height:6.1mm!important}.mat td,.mat th{height:4.9mm!important}.prod td,.prod th{height:5.05mm!important}.codes td,.codes th{height:3.8mm!important}.obs{height:6.8mm!important}.sectionGap{height:.35mm!important;flex:0 0 .35mm!important}.logo{font-size:16px!important}.xbig{font-size:16px!important}.big{font-size:13px!important}.value{font-size:12px!important}.miniTitle{font-size:7.3px!important}
        .sheet,.sheet *{page-break-before:avoid!important;page-break-after:avoid!important;break-before:avoid-page!important;break-after:avoid-page!important}
        body::before,body::after,html::before,html::after,.sheet::before,.sheet::after{content:none!important;display:none!important}
      }`;

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OP '+esc(nome)+'</title><style>'+style+'</style></head><body><div class="toolbar"><button class="back" onclick="try{if(window.opener&&!window.opener.closed)window.opener.focus()}catch(e){};window.close()">← VOLTAR PARA FORMULAÇÃO</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button><span class="hint">OP em A4 deitado — 1 folha preenchida</span></div><div class="sheet">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="center b">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho)+'</span></td><td colspan="3">cód. de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="shade"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div>'+
      '<table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="shade"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="shade2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="shade2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="shade"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="shade"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div>'+
      '<table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table><div class="sectionGap"></div>'+
      '<table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table>'+ 
      '<table class="op codes"><tr><td>01- troca de TELA</td><td>02- acerto</td><td>03- M. mecânica</td><td>04- falta de energia</td><td>05- material molhado</td><td>06- teste</td></tr><tr><td>07- M. elétrica</td><td>08- limpeza da borda</td><td>09- troca de tela</td><td>10- outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div></body></html>';

    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}
    w.document.open();w.document.write(html);w.document.close();
  }

  document.addEventListener('click',function(ev){
    if(ev.target?.dataset?.fosafe!=='op')return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    openOP(f);
  },true);
})();
