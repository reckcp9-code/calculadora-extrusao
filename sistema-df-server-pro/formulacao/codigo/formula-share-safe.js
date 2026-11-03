(function(){
  'use strict';
  const BASE_KG=100;
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>'R$ '+fm(Number(v)||0,2);
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function activeRows(f){return (f?.rows||[]).filter(r=>Number(r.pct)>0);}

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=activeRows(f).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:BASE_KG,rows});}catch(e){console.error(e);return null;}
  }

  function rowsHtml(f,srv){
    const items=Array.isArray(srv?.itens)?srv.itens:[];
    let out='';
    activeRows(f).forEach((r,i)=>{
      const m=mat(r.id)||r,it=items[i]||{};
      out+='<tr>'+ 
        '<td class="material">'+esc(m.nome||r.nome||'Material')+'</td>'+ 
        '<td class="num">'+fm(r.pct||0,2)+'%</td>'+ 
        '<td class="num">'+fm(it.kg||0,3)+' kg</td>'+ 
      '</tr>';
    });
    return out||'<tr><td colspan="3">Sem materiais.</td></tr>';
  }

  function validate100(srv){
    const total=Number(srv?.totalPct)||0;
    if(Math.abs(total-100)>0.05){
      alert('Para gerar o relatório, a formulação precisa fechar em 100%. Total atual: '+fm(total,2)+'%.');
      return false;
    }
    return true;
  }

  function loading(win){
    try{
      win.document.open();
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#eee;color:#111}.box{background:#fff;border:1px solid #ccc;padding:22px 28px;font-weight:700}</style></head><body><div class="box">Gerando relatório...</div></body></html>');
      win.document.close();
    }catch(e){}
  }

  async function pdfResinas(f,targetWin){
    if(!f){alert('Nenhuma formulação salva ainda.');return false;}
    const win=targetWin&&!targetWin.closed?targetWin:window.open('about:blank','df_resinas_pdf');
    if(!win){alert('O navegador bloqueou a janela do PDF. Libere pop-up e tente novamente.');return false;}
    loading(win);

    const srv=await calcSaved(f);
    if(!srv){try{win.close()}catch(e){} alert('Não foi possível gerar o PDF.');return false;}
    if(!validate100(srv)){try{win.close()}catch(e){} return false;}

    const now=new Date();
    const data=now.toLocaleDateString('pt-BR');
    const hora=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const gerado=now.toLocaleString('pt-BR');

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Formulação - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#2d2d2d}.tools{width:186mm;margin:8px auto;display:flex;justify-content:flex-end;gap:8px}.tools button{border:1px solid #aaa;background:#fff;color:#111;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer;border-radius:4px}.tools .print{background:#111;color:#fff;border-color:#111}.sheet{width:186mm;min-height:273mm;margin:0 auto 12px;background:#fff;padding:5mm 6mm 6mm}.topline{display:flex;justify-content:space-between;gap:12px;font-size:8.5px;color:#333;margin-bottom:6mm}.header h1{font-size:24px;line-height:1.05;margin:0;font-weight:800}.header p{font-size:12px;margin:2mm 0 0}.rule{height:2px;background:#111;margin:4mm 0 6mm}.formulaRow{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:6mm}.formula{font-size:20px;font-weight:800}.base{font-size:9px;color:#555;font-weight:700}.cards{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-bottom:5mm}.card{border:1px solid #d3d3d3;border-radius:7px;padding:4mm;min-height:18mm}.card span{display:block;font-size:9px;color:#555;margin-bottom:1.5mm}.card b{display:block;font-size:17px;line-height:1.1}.tableWrap{margin-top:2mm}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #c9c9c9;padding:3.4mm 3mm;font-size:10px;text-align:left;vertical-align:middle}th{font-size:9px;font-weight:800;background:#fafafa}.material{font-weight:700}.num{text-align:right}th:nth-child(1){width:50%}th:nth-child(2){width:22%}th:nth-child(3){width:28%}.totalRow{display:grid;grid-template-columns:50% 22% 28%;background:#f3f3f3;border:1px solid #c9c9c9;border-top:0;font-size:10px;font-weight:800}.totalRow div{padding:3.4mm 3mm;border-right:1px solid #c9c9c9}.totalRow div:last-child{border-right:0}.totalRow .num{text-align:right}.footnote{margin-top:6mm;color:#666;font-size:8.5px}.note{margin-top:3mm;color:#555;font-size:8.5px;line-height:1.45}.spacer{height:112mm}@media(max-width:820px){body{background:#fff}.tools{width:auto;margin:8px}.sheet{width:100%;min-height:auto;margin:0;padding:16px}.cards{grid-template-columns:1fr}.formulaRow{align-items:flex-start;flex-direction:column}.spacer{height:28px}th,td{font-size:8px;padding:8px 5px}}@media print{html,body{background:#fff}.tools{display:none!important}.sheet{width:auto;min-height:auto;margin:0;padding:0}.spacer{height:112mm}}'+
      '</style></head><body>'+ 
      '<div class="tools"><button onclick="window.close()">← VOLTAR</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div>'+ 
      '<main class="sheet">'+
        '<div class="topline"><span>'+esc(data)+', '+esc(hora)+'</span><span>Formulação '+esc(f.nome||'Formulação')+'</span></div>'+ 
        '<header class="header"><h1>DF Manutenção e Consultoria</h1><p>Relatório de Formulação</p></header>'+ 
        '<div class="rule"></div>'+ 
        '<div class="formulaRow"><div class="formula">'+esc(f.nome||'Formulação')+'</div><div class="base">BASE PADRÃO: 100 KG</div></div>'+ 
        '<section class="cards">'+
          '<div class="card"><span>Total da porcentagem</span><b>'+fm(srv.totalPct||0,2)+'%</b></div>'+ 
          '<div class="card"><span>Fator KG</span><b>'+money(srv.custoKgFinal||0)+'/kg</b></div>'+ 
        '</section>'+ 
        '<div class="tableWrap"><table><thead><tr><th>Material</th><th class="num">%</th><th class="num">Kg na base 100 kg</th></tr></thead><tbody>'+rowsHtml(f,srv)+'</tbody></table></div>'+ 
        '<div class="totalRow"><div>TOTAL</div><div class="num">'+fm(srv.totalPct||0,2)+'%</div><div class="num">100,000 kg</div></div>'+ 
        '<div class="footnote">Gerado em '+esc(gerado)+' • DF EXTRUSOR PRO</div>'+ 
        '<div class="note">Fator KG referente somente ao custo das resinas da formulação. Não inclui custo fabril.</div>'+ 
        '<div class="spacer"></div>'+ 
      '</main>'+ 
      '</body></html>';

    try{
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      return true;
    }catch(e){
      try{win.close()}catch(x){}
      alert('Não foi possível abrir o relatório.');
      return false;
    }
  }

  window.dfPdfResinasProfissional=pdfResinas;
})();
