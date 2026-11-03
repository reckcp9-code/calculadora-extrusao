(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>Number(v)>0?'R$ '+fm(v,2):'sem custo';
  const load=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const save=a=>{try{localStorage.setItem('df_formulacoes_v2',JSON.stringify(a))}catch(e){}render();};
  const selected=()=>{const id=q('foSavedSelect')?.value;return load().find(f=>String(f.id)===String(id));};
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function addComp(){
    if(q('exComp'))return;
    const exL=q('exL');if(!exL)return;
    const box=exL.closest('div');if(!box||!box.parentNode)return;
    const div=document.createElement('div');
    div.innerHTML='<label>Comprimento final / saco (cm)</label><input id="exComp" class="main" inputmode="decimal" placeholder="Ex.: 105"><div class="smallNote">Usado somente para puxar o tamanho final na OP. Não entra na conta de g/m.</div>';
    box.parentNode.insertBefore(div,box.nextSibling);
  }

  function getExtrusaoOP(){
    return{
      largura:pn(q('exL')?.value),
      comprimento:pn(q('exComp')?.value),
      micra:pn(q('exM')?.value),
      grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0
    };
  }

  function info(){
    const b=q('foSavedInfo'),f=selected();if(!b)return;
    if(!f){b.innerHTML='Selecione uma formulação salva.';return;}
    b.innerHTML='<b>'+esc(f.nome||'Formulação')+'</b><br>'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+money(f.custo||0);
  }

  function render(){
    const b=q('foSaved'),a=load();if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return;}
    const current=q('foSavedSelect')?.value;
    const opts=a.map((f,i)=>'<option value="'+esc(f.id)+'" '+((current&&String(current)===String(f.id))||(!current&&i===0)?'selected':'')+'>'+esc(f.nome||'Formulação')+' — '+fm(f.total||0,2)+' kg</option>').join('');
    b.innerHTML='<div class="formRow"><label>Formulação salva</label><select id="foSavedSelect">'+opts+'</select><div id="foSavedInfo" class="formNote"></div><div class="savedBtns" style="grid-template-columns:repeat(5,1fr)"><button class="miniBtn" data-fosafe="open">ABRIR</button><button class="miniBtn" data-fosafe="pdf">PDF</button><button class="miniBtn" data-fosafe="op">OP</button><button class="miniBtn" data-fosafe="dup">DUPLICAR</button><button class="delBtn" data-fosafe="del">EXCLUIR</button></div></div>';
    q('foSavedSelect')?.addEventListener('change',info);info();
  }

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=(f.rows||[]).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:Number(f.total)||0,rows});}catch(e){console.error(e);return null;}
  }

  async function saveFormulaSafe(){
    const nome=(q('foNome')?.value||'').trim()||'Formulação';
    const total=pn(q('foTotal')?.value);
    const rows=(typeof window.getFoRows==='function'?window.getFoRows():[]).filter(r=>r.id&&Number(r.pct)>0);
    if(!total){alert('Digite quantos kg quer fazer.');return;}
    if(!rows.length){alert('Escolha pelo menos 1 material.');return;}
    const tmp={total,rows};
    const srv=await calcSaved(tmp);if(!srv){alert('Não foi possível calcular a formulação no servidor.');return;}
    const d=Number(srv.diferencaPara100)||0;
    if(Math.abs(d)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;
    const rec={id:Date.now(),nome,total,rows,custo:Number(srv.custoTotal)||0,custoKg:Number(srv.custoKgFinal)||0,op:getExtrusaoOP(),criado:new Date().toISOString()};
    const a=load();a.unshift(rec);save(a);alert('Formulação salva.');
  }

  async function pdf(f){
    if(!f)return;
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível gerar o PDF.');return;}
    const total=Number(f.total)||0,rows=f.rows||[],items=Array.isArray(srv.itens)?srv.itens:[];
    let trs='';
    rows.forEach((r,i)=>{const m=mat(r.id)||r,it=items[i]||{};trs+='<tr><td>'+esc(m.nome||r.nome||'')+'</td><td>'+fm(r.pct||0,2)+'%</td><td>'+fm(it.kg||0,3)+' kg</td><td>'+money(m.preco||r.preco||0)+'</td><td>'+money(it.custo||0)+'</td></tr>';});
    if(!trs)trs='<tr><td colspan="5">Sem materiais.</td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação '+esc(f.nome||'')+'</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{margin:0 0 4px}.top{border-bottom:3px solid #111;padding-bottom:12px}.box{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#555;font-size:12px}.kpi b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#eee}.foot{margin-top:26px;color:#666;font-size:12px}@media print{body{margin:18px}}</style></head><body><div class="top"><h1>DF Manutenção e Consultoria</h1><div>Relatório de Formulação</div></div><h2>'+esc(f.nome||'Formulação')+'</h2><div class="box"><div class="kpi"><span>Quantidade total</span><b>'+fm(total,3)+' kg</b></div><div class="kpi"><span>Total da porcentagem</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="kpi"><span>Custo total</span><b>'+money(srv.custoTotal||0)+'</b></div><div class="kpi"><span>Custo por kg final</span><b>'+money(srv.custoKgFinal||0)+'</b></div></div><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Valor/kg</th><th>Custo</th></tr></thead><tbody>'+trs+'</tbody></table><div class="foot">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  function op(f){
    if(!f){alert('Formulação não encontrada.');return;}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
    const atual=getExtrusaoOP(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'';
    const letras=['A','B','C','D','E','F','G','H'];
    let matRows='';for(let i=0;i<8;i++){const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;matRows+='<tr class="'+((desc||pct)?'matFilled':'')+'"><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';}
    let prodRows='';for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OP '+esc(nome)+'</title><style>@page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11.5px;background:#fff}.page{border:2px solid #111;padding:6px}.op{width:100%;border-collapse:collapse;table-layout:fixed}.op td,.op th{border:1px solid #333;padding:4px 5px;vertical-align:middle}.center{text-align:center}.b{font-weight:700}.logo{font-size:16px;font-weight:900;letter-spacing:.4px}.title{background:#111827!important;color:#fff!important;text-align:center;font-weight:900;letter-spacing:.4px}.hl{background:#fff200!important;font-weight:900}.hl2{background:#eaf3ff!important;font-weight:900}.hl3{background:#eaffea!important;font-weight:900}.top td{height:21px}.big{font-size:15px}.xbig{font-size:18px}.mat th{background:#111827!important;color:#fff!important}.mat td{height:22px}.matFilled td{background:#fffbe6!important;font-weight:700}.prod th{background:#e5e7eb!important;font-size:10px}.prod td{height:23px}.codes td{font-size:10.5px;background:#fafafa}.sectionGap{height:6px;border:0}.printHint{margin:0 0 6px;color:#555;font-size:11px}.obs{height:34px}.stamp{float:right;border:1px solid #333;border-radius:8px;padding:5px 12px;font-weight:900;background:#fff200}.miniTitle{font-size:10px;color:#333;font-weight:700;text-transform:uppercase}.value{font-size:14px;font-weight:900}@media print{body{margin:0}.printHint{display:none}.page{border:0;padding:0}}</style></head><body><div class="printHint">OP pronta para imprimir. Escolha salvar como PDF ou imprimir.</div><div class="page">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="hl center">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="hl"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho||'_____')+'</span></td><td colspan="3">cod de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="hl3"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div><table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="hl"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="hl3"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div><table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table><div class="sectionGap"></div><table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02-acerto</td><td>03-M.mecânica</td><td>04-falta de energia</td><td>05-material molhado</td><td>06-teste</td></tr><tr><td>07-M.elétrica</td><td>08-limpeza da borda</td><td>09-troca de tela</td><td>10-outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  document.addEventListener('click',function(ev){
    if(ev.target?.id==='foSave'){
      ev.preventDefault();ev.stopImmediatePropagation();saveFormulaSafe();return;
    }
    const act=ev.target?.dataset?.fosafe;if(!act)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    if(act==='open'){if(window.abrirFormula)window.abrirFormula(f,false);return;}
    if(act==='pdf'){pdf(f);return;}
    if(act==='op'){op(f);return;}
    if(act==='dup'){const a=load(),cp=JSON.parse(JSON.stringify(f));cp.id=Date.now();cp.nome=(f.nome||'Formulação')+' cópia';cp.criado=new Date().toISOString();a.unshift(cp);save(a);return;}
    if(act==='del'){if(!confirm('Excluir esta formulação?'))return;save(load().filter(x=>String(x.id)!==String(f.id)));}
  },true);

  function force(){window.renderForms=render;window.salvarFormula=saveFormulaSafe;window.getExtrusaoOP=getExtrusaoOP;window.printFormulaOp=op;addComp();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(force,250));else setTimeout(force,250);
  [600,1200,2200].forEach(t=>setTimeout(force,t));
  document.addEventListener('click',()=>setTimeout(()=>{if(q('foSaved')&&!q('foSavedSelect'))force();},120),true);
})();
