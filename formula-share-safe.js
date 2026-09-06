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

  function resinRowsHtml(f,srv){
    const items=Array.isArray(srv?.itens)?srv.itens:[];
    let trs='';
    activeRows(f).forEach((r,i)=>{
      const m=mat(r.id)||r,it=items[i]||{};
      trs+='<tr><td class="material">'+esc(m.nome||r.nome||'Material')+'</td><td class="num">'+fm(r.pct||0,2)+'%</td><td class="num">'+fm(it.kg||0,3)+' kg</td></tr>';
    });
    return trs||'<tr><td colspan="3">Sem materiais.</td></tr>';
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
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f3f4f6;color:#111}.box{background:#fff;border:1px solid #ccc;padding:24px 30px;font-weight:700}</style></head><body><div class="box">Gerando relatório A4...</div></body></html>');
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

    const logoUrl=new URL('./logo.jpg.jpeg',location.href).href;
    const now=new Date();
    const data=now.toLocaleDateString('pt-BR');
    const hora=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const doc=String(now.getFullYear()).slice(-2)+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Formulação de Resinas - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#101010;background:#e9e9e9}.tools{width:210mm;margin:10px auto 8px;display:flex;gap:8px;justify-content:flex-end}.tools button{border:1px solid #aaa;background:#fff;color:#111;padding:9px 13px;font-size:12px;font-weight:700;cursor:pointer}.tools .print{background:#111;color:#fff;border-color:#111}.sheet{width:210mm;min-height:297mm;margin:0 auto 16px;background:#fff;padding:14mm 14mm 12mm;display:flex;flex-direction:column;box-shadow:0 7px 24px rgba(0,0,0,.10)}.header{display:grid;grid-template-columns:47mm 1fr 45mm;align-items:center;gap:6mm;padding-bottom:9mm;border-bottom:1.5px solid #222}.logoWrap{display:flex;align-items:center;gap:5mm;padding-right:5mm;border-right:1px solid #777}.logoWrap img{width:34mm;height:20mm;object-fit:contain}.headTitle{padding-left:1mm}.headTitle h1{margin:0;font-size:20px;letter-spacing:.2px}.headTitle p{margin:4px 0 0;font-size:9.5px;text-transform:uppercase;letter-spacing:1.6px;color:#555}.docmeta{border-left:1px solid #777;padding-left:5mm;font-size:9px;line-height:1.75;color:#333}.docmeta b{display:inline-block;width:17mm;color:#111}.formulaRow{display:flex;justify-content:space-between;align-items:flex-start;gap:10mm;padding:11mm 0 9mm}.label{font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:800;color:#4b4b4b}.formulaName{font-size:27px;font-weight:800;margin-top:2mm}.baseBox{background:#f3f3f3;padding:6mm 8mm;min-width:49mm}.baseBox span{display:block;font-size:9px;font-weight:800;text-transform:uppercase;color:#444}.baseBox b{display:block;margin-top:2mm;font-size:20px}.tableBox{border:1px solid #bdbdbd}table{width:100%;border-collapse:collapse}thead th{background:#ededed;color:#333;font-size:9px;text-transform:uppercase;text-align:left;padding:4mm;border-right:1px solid #c7c7c7}thead th:last-child{border-right:0}thead th.num{text-align:right}tbody td{padding:4.2mm;border-top:1px solid #cfcfcf;border-right:1px solid #cfcfcf;font-size:11px}tbody td:last-child{border-right:0}tbody td.material{font-weight:700}td.num{text-align:right;font-variant-numeric:tabular-nums}.totalLine{display:grid;grid-template-columns:1.45fr 1fr 1.12fr;background:#ededed;border:1px solid #bdbdbd;border-top:0;font-size:12px;font-weight:800}.totalLine div{padding:4.2mm;border-right:1px solid #c7c7c7}.totalLine div:last-child{border-right:0}.totalLine .num{text-align:right}.factor{margin-top:8mm;border:1px solid #bdbdbd;background:#f7f7f7;display:grid;grid-template-columns:1fr 58mm;align-items:center}.factor .ftitle{padding:6mm;font-size:12px;font-weight:700;text-transform:uppercase;color:#3d3d3d}.factor .fvalue{padding:5mm 6mm;border-left:1px solid #aaa;text-align:right;font-size:24px;font-weight:800}.spacer{flex:1;min-height:42mm}.obs{border-top:1.5px solid #222;padding-top:5mm;font-size:9.5px;line-height:1.55;color:#333}.obs b{display:block;font-size:9.5px;color:#111;text-transform:uppercase;margin-bottom:1mm}.footer{margin-top:7mm;border-top:1px solid #777;padding-top:6mm;display:grid;grid-template-columns:1fr 1px 1fr;gap:8mm;align-items:center}.footer .brandf b{display:block;font-size:14px}.footer .brandf span{display:block;margin-top:1mm;font-size:9px;letter-spacing:1.5px}.footer .line{height:14mm;background:#777}.footer .right{text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:1.8px;line-height:1.6;color:#444}@media(max-width:820px){body{background:#fff}.tools{width:auto;margin:8px}.sheet{width:100%;min-height:auto;margin:0;box-shadow:none;padding:18px}.header{grid-template-columns:1fr;gap:12px}.logoWrap{border-right:0;border-bottom:1px solid #ddd;padding:0 0 12px}.docmeta{border-left:0;padding-left:0}.formulaRow{padding:22px 0 18px}.factor{grid-template-columns:1fr}.factor .fvalue{border-left:0;border-top:1px solid #aaa}.spacer{min-height:30px}.footer{grid-template-columns:1fr}.footer .line{display:none}.footer .right{text-align:left}}@media print{html,body{background:#fff}.tools{display:none!important}.sheet{width:210mm;min-height:297mm;margin:0;box-shadow:none;padding:14mm 14mm 12mm}}'+
      '</style></head><body><div class="tools"><button onclick="window.close()">← VOLTAR</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div><main class="sheet"><header class="header"><div class="logoWrap"><img src="'+esc(logoUrl)+'" alt="DF"></div><div class="headTitle"><h1>DF EXTRUSOR PRO</h1><p>Relatório de Formulação de Resinas</p></div><div class="docmeta"><div><b>DATA:</b>'+esc(data)+'</div><div><b>HORA:</b>'+esc(hora)+'</div><div><b>DOCUMENTO:</b>'+esc(doc)+'</div></div></header><section class="formulaRow"><div><div class="label">Formulação</div><div class="formulaName">'+esc(f.nome||'Formulação')+'</div></div><div class="baseBox"><span>Base padrão</span><b>100,00 kg</b></div></section><section class="tableBox"><table><thead><tr><th>Material / Resina</th><th class="num">Percentual (%)</th><th class="num">Kg na base 100 kg</th></tr></thead><tbody>'+resinRowsHtml(f,srv)+'</tbody></table></section><div class="totalLine"><div>TOTAL</div><div class="num">'+fm(srv.totalPct||0,2)+'%</div><div class="num">100,000 kg</div></div><section class="factor"><div class="ftitle">Fator KG – Resinas</div><div class="fvalue">'+money(srv.custoKgFinal||0)+'/kg</div></section><div class="spacer"></div><section class="obs"><b>Observações</b>O Fator KG apresentado neste relatório considera somente o custo das resinas que compõem a formulação.<br>Não inclui custo fabril, mão de obra, energia, extrusão, perdas, impostos ou demais despesas de fabricação.</section><footer class="footer"><div class="brandf"><b>DF EXTRUSOR PRO</b><span>MANUTENÇÃO E CONSULTORIA</span><span>EXTRUSÃO &nbsp; | &nbsp; CONSULTORIA &nbsp; | &nbsp; RESULTADOS</span></div><div class="line"></div><div class="right">Processo mais estável<br>Produção mais eficiente</div></footer></main></body></html>';

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
