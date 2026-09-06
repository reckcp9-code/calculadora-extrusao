(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>'R$ '+fm(Number(v)||0,2);
  const load=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const selected=()=>{const id=q('foSavedSelect')?.value;return load().find(f=>String(f.id)===String(id));};
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=(f.rows||[]).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:Number(f.total)||0,rows});}catch(e){console.error(e);return null;}
  }

  function resinRowsText(f){
    return (f.rows||[]).filter(r=>Number(r.pct)>0).map(r=>{
      const m=mat(r.id)||r;
      return '• '+String(m.nome||r.nome||'Material')+' — '+fm(r.pct||0,2)+'%';
    }).join('\n');
  }

  function resinRowsHtml(f){
    let trs='';
    (f.rows||[]).filter(r=>Number(r.pct)>0).forEach(r=>{
      const m=mat(r.id)||r;
      trs+='<tr><td>'+esc(m.nome||r.nome||'Material')+'</td><td class="pct">'+fm(r.pct||0,2)+'%</td></tr>';
    });
    return trs||'<tr><td colspan="2">Sem materiais.</td></tr>';
  }

  function validate100(srv){
    const total=Number(srv?.totalPct)||0;
    if(Math.abs(total-100)>0.05){
      alert('Para compartilhar, a formulação precisa fechar em 100%. Total atual: '+fm(total,2)+'%.');
      return false;
    }
    return true;
  }

  async function shareWhatsApp(){
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível calcular a formulação no servidor.');return;}
    if(!validate100(srv))return;

    const msg='*DF EXTRUSOR PRO – FORMULAÇÃO*\n'+
      '*'+String(f.nome||'Formulação')+'*\n\n'+
      resinRowsText(f)+'\n\n'+
      '*TOTAL DA FORMULAÇÃO: '+fm(srv.totalPct||0,2)+'%*\n'+
      '*FATOR KG – RESINAS: '+money(srv.custoKgFinal||0)+'/kg*\n\n'+
      '_Custo referente apenas à formulação das resinas. Não inclui custo fabril._';

    const url='https://api.whatsapp.com/send?text='+encodeURIComponent(msg);
    const w=window.open(url,'_blank');
    if(!w)location.href=url;
  }

  async function pdfResinas(){
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível gerar o PDF.');return;}
    if(!validate100(srv))return;

    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação de Resinas - '+esc(f.nome||'')+'</title><style>'+ 
      '@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0}.head{border-bottom:3px solid #111;padding-bottom:10px}.head h1{margin:0;font-size:22px}.head div{margin-top:4px;color:#555}.name{margin:20px 0 12px;font-size:20px}.kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 18px}.kpi{border:1px solid #bbb;border-radius:10px;padding:14px}.kpi span{display:block;color:#555;font-size:12px;text-transform:uppercase;font-weight:700}.kpi b{display:block;margin-top:5px;font-size:22px}.factor{border:2px solid #111}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #bbb;padding:10px;font-size:13px}th{background:#eee;text-align:left}.pct{text-align:right;font-weight:700;width:25%}.note{margin-top:20px;border:1px solid #999;border-radius:8px;padding:12px;font-size:12px;line-height:1.45}.foot{margin-top:24px;color:#666;font-size:11px}@media print{body{margin:0}}'+
      '</style></head><body><div class="head"><h1>DF EXTRUSOR PRO</h1><div>Formulação de Resinas</div></div><div class="name"><b>'+esc(f.nome||'Formulação')+'</b></div><div class="kpis"><div class="kpi"><span>Formulação</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="kpi factor"><span>Fator KG – Resinas</span><b>'+money(srv.custoKgFinal||0)+'/kg</b></div></div><table><thead><tr><th>Resina / Material</th><th class="pct">%</th></tr></thead><tbody>'+resinRowsHtml(f)+'</tbody></table><div class="note"><b>Importante:</b> custo referente apenas à formulação das resinas. Não inclui custo fabril, mão de obra, energia, extrusão ou demais despesas de fabricação.</div><div class="foot">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},350)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  function mount(){
    const saved=q('foSaved');if(!saved)return;
    const base=saved.querySelector('.savedBtns');if(!base)return;
    if(q('foResinShareBtns'))return;
    const wrap=document.createElement('div');
    wrap.id='foResinShareBtns';
    wrap.innerHTML='<div class="savedBtns" style="grid-template-columns:repeat(2,1fr);margin-top:8px"><button id="foWhatsResina" class="miniBtn" type="button">WHATSAPP RESINAS</button><button id="foPdfResina" class="miniBtn" type="button">PDF RESINAS</button></div><div class="formNote" style="margin-top:6px">Compartilha somente a formulação 100% e o Fator KG das resinas. Sem custo fabril.</div>';
    base.insertAdjacentElement('afterend',wrap);
    q('foWhatsResina')?.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();shareWhatsApp();});
    q('foPdfResina')?.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();pdfResinas();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,500));else setTimeout(mount,500);
  const obs=new MutationObserver(()=>mount());
  obs.observe(document.documentElement,{childList:true,subtree:true});
  [900,1600,2600].forEach(t=>setTimeout(mount,t));
})();
