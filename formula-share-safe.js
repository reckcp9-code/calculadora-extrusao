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

  async function pdfResinas(f){
    if(!f){alert('Nenhuma formulação salva ainda.');return false;}
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível gerar o PDF.');return false;}
    if(!validate100(srv))return false;

    const logoUrl=new URL('./logo.jpg.jpeg',location.href).href;
    const now=new Date();
    const data=now.toLocaleDateString('pt-BR');
    const hora=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resinas - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;background:#eef2f7}.tools{max-width:794px;margin:14px auto 8px;display:flex;gap:8px;justify-content:flex-end}.tools button{border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer;font-size:12px}.print{background:#0f172a;color:#fff}.back{background:#fff;color:#0f172a;border:1px solid #cbd5e1!important}.sheet{width:100%;max-width:794px;min-height:1070px;margin:0 auto 18px;background:#fff;box-shadow:0 12px 40px rgba(15,23,42,.15);position:relative;overflow:hidden}.accent{height:8px;background:#d4a017}.header{background:#0f172a;color:#fff;padding:24px 28px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{display:flex;align-items:center;gap:14px}.brand img{width:58px;height:58px;object-fit:contain;background:#fff;border-radius:12px;padding:5px}.brand h1{margin:0;font-size:24px;letter-spacing:.3px}.brand p{margin:5px 0 0;color:#cbd5e1;font-size:12px;text-transform:uppercase;letter-spacing:1.2px}.docmeta{text-align:right;font-size:11px;color:#cbd5e1;line-height:1.5}.content{padding:28px}.titleRow{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;border-bottom:1px solid #e2e8f0;padding-bottom:18px}.eyebrow{font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.2px}.formula{font-size:26px;font-weight:900;margin-top:5px;color:#0f172a}.seal{background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;color:#475569;white-space:nowrap}.cards{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:12px;margin:20px 0 24px}.card{border:1px solid #e2e8f0;border-radius:14px;padding:15px 16px;background:#f8fafc}.card span{display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:800}.card b{display:block;margin-top:6px;font-size:21px;color:#0f172a}.card.factor{background:#0f172a;border-color:#0f172a}.card.factor span{color:#cbd5e1}.card.factor b{color:#f8d65a;font-size:23px}.sectionTitle{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#334155;margin:0 0 9px}.tableBox{border:1px solid #dbe3ec;border-radius:14px;overflow:hidden}table{width:100%;border-collapse:collapse}th{background:#eaf0f6;color:#334155;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.8px;padding:11px 13px}th.num{text-align:right}td{padding:13px;border-top:1px solid #e5eaf0;font-size:13px}td.material{font-weight:700}td.num{text-align:right;font-variant-numeric:tabular-nums}td.kg{font-weight:800;color:#0f172a}.totalRow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.totalBox{border-radius:12px;padding:13px 15px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}.totalBox span{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase}.totalBox b{font-size:17px}.notice{margin-top:24px;border-left:4px solid #d4a017;background:#fffbea;padding:14px 16px;border-radius:0 10px 10px 0;font-size:11.5px;line-height:1.55;color:#475569}.notice b{color:#0f172a}.footer{position:absolute;left:28px;right:28px;bottom:22px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;gap:15px;color:#64748b;font-size:10px}.footer b{color:#0f172a}@media(max-width:680px){body{background:#fff}.tools{margin:8px}.sheet{min-height:auto;box-shadow:none;margin:0}.header{padding:18px}.content{padding:18px}.brand img{width:48px;height:48px}.brand h1{font-size:19px}.docmeta{font-size:9px}.formula{font-size:22px}.cards{grid-template-columns:1fr}.footer{position:static;margin-top:42px}.titleRow{align-items:flex-start;flex-direction:column}.seal{white-space:normal}}@media print{body{background:#fff}.tools{display:none}.sheet{box-shadow:none;min-height:270mm;margin:0}.footer{position:absolute}}'+
      '</style></head><body><div class="tools"><button class="back" onclick="window.close()">← VOLTAR</button><button class="print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div><div class="sheet"><div class="accent"></div><header class="header"><div class="brand"><img src="'+esc(logoUrl)+'" alt="DF"><div><h1>DF EXTRUSOR PRO</h1><p>Relatório de Formulação de Resinas</p></div></div><div class="docmeta"><b>DOCUMENTO DE CUSTO DE RESINAS</b><br>Emitido em '+esc(data)+' às '+esc(hora)+'</div></header><main class="content"><div class="titleRow"><div><div class="eyebrow">Nome da formulação</div><div class="formula">'+esc(f.nome||'Formulação')+'</div></div><div class="seal">BASE PADRÃO • 100 KG</div></div><section class="cards"><div class="card"><span>Base da formulação</span><b>100,00 kg</b></div><div class="card"><span>Total da formulação</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="card factor"><span>Fator KG • Resinas</span><b>'+money(srv.custoKgFinal||0)+'/kg</b></div></section><h2 class="sectionTitle">Composição da formulação</h2><div class="tableBox"><table><thead><tr><th>Resina / Material</th><th class="num">Percentual</th><th class="num">Kg na base 100 kg</th></tr></thead><tbody>'+resinRowsHtml(f,srv)+'</tbody></table></div><div class="totalRow"><div class="totalBox"><span>Total percentual</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="totalBox"><span>Peso base</span><b>100,000 kg</b></div></div><div class="notice"><b>Informação de custo:</b> o Fator KG apresentado neste relatório considera somente o custo das resinas que compõem a formulação. Não inclui custo fabril, mão de obra, energia, extrusão, perdas, impostos ou demais despesas de fabricação.</div></main><footer class="footer"><span><b>DF EXTRUSOR PRO</b> • Formulação de Resinas</span><span>Base de cálculo: 100 kg</span></footer></div></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return false;}w.document.open();w.document.write(html);w.document.close();return true;
  }

  window.dfPdfResinasProfissional=pdfResinas;
})();
