(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>Number(v)>0?'R$ '+fm(v,2):'sem custo';
  const load=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const save=a=>{try{if(window.saveForms){window.saveForms(a);return}}catch(e){}localStorage.setItem('df_formulacoes_v2',JSON.stringify(a));render();};
  const selected=()=>{const id=q('foSavedSelect')?.value;return load().find(f=>String(f.id)===String(id));};
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};

  function info(){
    const b=q('foSavedInfo'),f=selected();
    if(!b)return;
    if(!f){b.innerHTML='Selecione uma formulação salva.';return;}
    b.innerHTML='<b>'+esc(f.nome||'Formulação')+'</b><br>'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+money(f.custo||0);
  }

  function render(){
    const b=q('foSaved'),a=load();
    if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return;}
    const current=q('foSavedSelect')?.value;
    const opts=a.map((f,i)=>'<option value="'+esc(f.id)+'" '+((current&&String(current)===String(f.id))||(!current&&i===0)?'selected':'')+'>'+esc(f.nome||'Formulação')+' — '+fm(f.total||0,2)+' kg</option>').join('');
    b.innerHTML='<div class="formRow"><label>Formulação salva</label><select id="foSavedSelect">'+opts+'</select><div id="foSavedInfo" class="formNote"></div><div class="savedBtns" style="grid-template-columns:repeat(5,1fr)"><button class="miniBtn" data-fosafe="open">ABRIR</button><button class="miniBtn" data-fosafe="pdf">PDF</button><button class="miniBtn" data-fosafe="op">OP</button><button class="miniBtn" data-fosafe="dup">DUPLICAR</button><button class="delBtn" data-fosafe="del">EXCLUIR</button></div></div>';
    q('foSavedSelect')?.addEventListener('change',info);
    info();
  }

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=(f.rows||[]).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:Number(f.total)||0,rows});}catch(e){return null;}
  }

  async function pdf(f){
    if(!f)return;
    const srv=await calcSaved(f);
    const total=Number(f.total)||0,rows=f.rows||[],items=Array.isArray(srv?.itens)?srv.itens:[];
    let trs='';
    rows.forEach((r,i)=>{
      const m=mat(r.id)||r,it=items[i]||{};
      trs+='<tr><td>'+esc(m.nome||r.nome||'')+'</td><td>'+fm(r.pct||0,2)+'%</td><td>'+fm(it.kg||0,3)+' kg</td><td>'+money(m.preco||r.preco||0)+'</td><td>'+money(it.custo||0)+'</td></tr>';
    });
    if(!trs)trs='<tr><td colspan="5">Sem materiais.</td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação '+esc(f.nome||'')+'</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{margin:0 0 4px}.top{border-bottom:3px solid #111;padding-bottom:12px}.box{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#555;font-size:12px}.kpi b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#eee}.foot{margin-top:26px;color:#666;font-size:12px}@media print{body{margin:18px}}</style></head><body><div class="top"><h1>DF Manutenção e Consultoria</h1><div>Relatório de Formulação</div></div><h2>'+esc(f.nome||'Formulação')+'</h2><div class="box"><div class="kpi"><span>Quantidade total</span><b>'+fm(total,3)+' kg</b></div><div class="kpi"><span>Total da porcentagem</span><b>'+fm(srv?.totalPct||0,2)+'%</b></div><div class="kpi"><span>Custo total</span><b>'+money(srv?.custoTotal||0)+'</b></div><div class="kpi"><span>Custo por kg final</span><b>'+money(srv?.custoKgFinal||0)+'</b></div></div><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Valor/kg</th><th>Custo</th></tr></thead><tbody>'+trs+'</tbody></table><div class="foot">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  function op(f){
    if(!f)return;
    if(typeof window.printFormulaOp==='function' && !window.printFormulaOp.dfSafePlaceholder){window.printFormulaOp(f);return;}
    alert('A função OP será mantida igual ao projeto principal na próxima revisão visual.');
  }

  document.addEventListener('click',function(ev){
    const act=ev.target?.dataset?.fosafe;if(!act)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    if(act==='open'){if(window.abrirFormula)window.abrirFormula(f,false);return;}
    if(act==='pdf'){pdf(f);return;}
    if(act==='op'){op(f);return;}
    if(act==='dup'){const a=load(),cp=JSON.parse(JSON.stringify(f));cp.id=Date.now();cp.nome=(f.nome||'Formulação')+' cópia';cp.criado=new Date().toISOString();a.unshift(cp);save(a);setTimeout(render,30);return;}
    if(act==='del'){if(!confirm('Excluir esta formulação?'))return;save(load().filter(x=>String(x.id)!==String(f.id)));setTimeout(render,30);}
  },true);

  function force(){window.renderForms=render;render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(force,250));else setTimeout(force,250);
  [600,1200,2200].forEach(t=>setTimeout(force,t));
  document.addEventListener('click',()=>setTimeout(()=>{if(q('foSaved')&&!q('foSavedSelect'))force();},120),true);
})();
