(function(){
  'use strict';
  const BASE_KG=100;
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>'R$ '+fm(Number(v)||0,2);
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function activeRows(f){
    return (f?.rows||[]).filter(r=>Number(r.pct)>0);
  }

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
      trs+='<tr><td class="material">'+esc(m.nome||r.nome||'Material')+'</td><td class="num">'+fm(r.pct||0,2)+'%</td><td class="num kg">'+fm(it.kg||0,3)+' kg</td></tr>';
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
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>DF EXTRUSOR PRO</title><style>body{font-family:Arial,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f3f4f6;color:#111827}.box{background:#fff;border:1px solid #d1d5db;padding:24px 30px;border-radius:8px;font-weight:700}</style></head><body><div class="box">Gerando relatório A4...</div></body></html>');
      win.document.close();
    }catch(e){}
  }

  async function pdfResinas(f,targetWin){
    if(!f){alert('Nenhuma formulação salva ainda.');return false;}
    const win=targetWin&& !targetWin.closed ? targetWin : window.open('about:blank','df_resinas_pdf');
    if(!win){alert('O navegador bloqueou a janela do PDF. Libere pop-up e tente novamente.');return false;}
    loading(win);

    const srv=await calcSaved(f);
    if(!srv){try{win.close()}catch(e){} alert('Não foi possível gerar o PDF.');return false;}
    if(!validate100(srv)){try{win.close()}catch(e){} return false;}

    const logoUrl=new URL('./logo.jpg.jpeg',location.href).href;
    const now=new Date();
    const data=now.toLocaleDateString('pt-BR');
    const hora=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Formulação de Resinas - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#e5e7eb}.tools{width:210mm;margin:10px auto 8px;display:flex;gap:8px;justify-content:flex-end}.tools button{border:1px solid #9ca3af;background:#fff;color:#111;border-radius:5px;padding:9px 13px;font-size:12px;font-weight:700;cursor:pointer}.tools .print{background:#111;color:#fff;border-color:#111}.sheet{width:210mm;min-height:297mm;margin:0 auto 16px;background:#fff;box-shadow:0 8px 26px rgba(0,0,0,.12);padding:15mm 16mm 13mm;display:flex;flex-direction:column}.header{display:flex;justify-content:space-between;align-items:center;gap:18px;padding-bottom:10mm;border-bottom:2px solid #111}.brand{display:flex;align-items:center;gap:11px}.brand img{width:16mm;height:16mm;object-fit:contain;border:1px solid #b7b7b7;border-radius:4px;padding:2px;background:#fff}.brand h1{margin:0;font-size:20px;letter-spacing:.2px}.brand p{margin:4px 0 0;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555}.docmeta{text-align:right;font-size:9.5px;line-height:1.5;color:#444}.docmeta b{color:#111}.titleRow{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;padding:9mm 0 5mm;border-bottom:1px solid #cfcfcf}.eyebrow{font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#666}.formula{font-size:22px;font-weight:800;margin-top:3px;color:#111}.baseTag{font-size:10px;font-weight:700;border:1px solid #999;padding:7px 10px;border-radius:4px;white-space:nowrap;background:#fff}.summary{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:4mm;margin:6mm 0 8mm}.summaryBox{border:1px solid #bdbdbd;padding:4.5mm 4mm;min-height:22mm;background:#fff}.summaryBox span{display:block;font-size:8.5px;color:#666;text-transform:uppercase;letter-spacing:.7px;font-weight:700}.summaryBox b{display:block;margin-top:5px;font-size:17px;color:#111}.summaryBox.factor{border:2px solid #111}.summaryBox.factor b{font-size:19px}.sectionTitle{font-size:10.5px;text-transform:uppercase;letter-spacing:.9px;font-weight:800;margin:0 0 3mm;color:#222}.tableBox{border:1px solid #bdbdbd}table{width:100%;border-collapse:collapse}thead th{background:#f1f1f1;color:#333;font-size:9px;text-transform:uppercase;letter-spacing:.6px;text-align:left;padding:3.2mm 3.5mm;border-bottom:1px solid #bdbdbd}thead th.num{text-align:right}tbody td{padding:3.5mm;border-top:1px solid #d7d7d7;font-size:11px}tbody tr:first-child td{border-top:0}td.material{font-weight:700}td.num{text-align:right;font-variant-numeric:tabular-nums}td.kg{font-weight:700}.totals{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:4mm}.totalBox{border:1px solid #bdbdbd;padding:3.5mm 4mm;display:flex;align-items:center;justify-content:space-between}.totalBox span{font-size:9px;text-transform:uppercase;color:#666;font-weight:700}.totalBox b{font-size:13px}.notice{margin-top:7mm;border:1px solid #bdbdbd;background:#fafafa;padding:4mm;font-size:10px;line-height:1.55;color:#444}.notice b{color:#111}.footer{margin-top:auto;padding-top:8mm;border-top:1px solid #cfcfcf;display:flex;justify-content:space-between;gap:10px;font-size:9px;color:#666}.footer b{color:#111}@media(max-width:820px){body{background:#fff}.tools{width:auto;margin:8px}.sheet{width:100%;min-height:auto;margin:0;box-shadow:none;padding:18px}.header{padding-bottom:18px;align-items:flex-start}.brand img{width:48px;height:48px}.brand h1{font-size:18px}.docmeta{font-size:8.5px}.titleRow{padding:20px 0 12px;align-items:flex-start;flex-direction:column}.summary{grid-template-columns:1fr}.footer{margin-top:36px}}@media print{html,body{background:#fff}.tools{display:none!important}.sheet{width:210mm;min-height:297mm;margin:0;box-shadow:none;padding:15mm 16mm 13mm;break-after:page}}'+
      '</style></head><body><div class="tools"><button onclick="window.close()">← VOLTAR</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div><div class="sheet"><header class="header"><div class="brand"><img src="'+esc(logoUrl)+'" alt="DF"><div><h1>DF EXTRUSOR PRO</h1><p>Relatório de Formulação de Resinas</p></div></div><div class="docmeta"><b>DOCUMENTO DE CUSTO DE RESINAS</b><br>Emitido em '+esc(data)+' às '+esc(hora)+'</div></header><div class="titleRow"><div><div class="eyebrow">Nome da formulação</div><div class="formula">'+esc(f.nome||'Formulação')+'</div></div><div class="baseTag">BASE PADRÃO: 100 KG</div></div><section class="summary"><div class="summaryBox"><span>Base da formulação</span><b>100,00 kg</b></div><div class="summaryBox"><span>Total da formulação</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="summaryBox factor"><span>Fator KG • Resinas</span><b>'+money(srv.custoKgFinal||0)+'/kg</b></div></section><h2 class="sectionTitle">Composição da formulação</h2><div class="tableBox"><table><thead><tr><th>Resina / Material</th><th class="num">Percentual</th><th class="num">Kg na base 100 kg</th></tr></thead><tbody>'+resinRowsHtml(f,srv)+'</tbody></table></div><div class="totals"><div class="totalBox"><span>Total percentual</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="totalBox"><span>Peso base</span><b>100,000 kg</b></div></div><div class="notice"><b>Informação de custo:</b> o Fator KG apresentado considera somente o custo das resinas da formulação. Não inclui custo fabril, mão de obra, energia, extrusão, perdas, impostos ou demais despesas de fabricação.</div><footer class="footer"><span><b>DF EXTRUSOR PRO</b> • Formulação de Resinas</span><span>Base de cálculo: 100 kg</span></footer></div></body></html>';

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
