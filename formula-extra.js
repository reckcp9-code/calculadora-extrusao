(function(){
  function q(id){return document.getElementById(id)}
  function pn(v){if(window.n&&typeof v==='string')return window.n(v);if(window.parseNum)return window.parseNum(v);let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
  function fmt2(v,d){return window.fmt?window.fmt(v,d):Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
  function esc2(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function material(id){try{return window.materialById?window.materialById(id):(window.loadMats?window.loadMats():[]).find(m=>String(m.id)===String(id))}catch(e){return null}}
  function forms(){try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}}
  function addComprimento(){
    if(q('exComp'))return;
    const exL=q('exL'); if(!exL)return;
    const box=exL.closest('div'); if(!box||!box.parentNode)return;
    const div=document.createElement('div');
    div.innerHTML='<label>Comprimento final / saco (cm)</label><input id="exComp" class="main" inputmode="decimal" placeholder="Ex.: 105"><div class="smallNote">Usado somente para puxar o tamanho final na OP. Não entra na conta de g/m.</div>';
    box.parentNode.insertBefore(div,box.nextSibling);
  }
  window.getExtrusaoOP=function(){
    const largura=window.n?window.n('exL'):pn(q('exL')&&q('exL').value);
    const comprimento=window.n?window.n('exComp'):pn(q('exComp')&&q('exComp').value);
    const micra=window.n?window.n('exM'):pn(q('exM')&&q('exM').value);
    const grama=window.pesoMetroIdeal?window.pesoMetroIdeal():0;
    return {largura:largura||0,comprimento:comprimento||0,micra:micra||0,grama:grama||0};
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
    const a=forms();a.unshift(rec);
    if(window.saveForms)window.saveForms(a);else localStorage.setItem('df_formulacoes_v2',JSON.stringify(a));
    if(window.renderForms)window.renderForms();
    alert('Formulação salva.');
  };
  window.printFormulaOp=function(f){
    if(!f){alert('Formulação não encontrada.');return}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
    const atual=window.getExtrusaoOP?window.getExtrusaoOP():{largura:0,comprimento:0,micra:0,grama:0};
    const op=f.op||{};
    const largura=Number(op.largura||atual.largura)||0;
    const comprimento=Number(op.comprimento||atual.comprimento)||0;
    const micra=Number(op.micra||atual.micra)||0;
    const grama=Number(op.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fmt2(micra/100,2)+'mc':'_____';
    const parede=micra?fmt2(micra/200,2)+'mc':'_____';
    const gram=grama?fmt2(grama,1)+' gramas por mt':'_____';
    const lb=largura?fmt2(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fmt2(largura,0)+' X '+fmt2(comprimento,0)+' X '+fmt2(micra/1000,3)+' mc':'';
    const letras=['A','B','C','D','E','F','G','H'];let matRows='';
    for(let i=0;i<8;i++){
      const r=rows[i]||{},mat=r.id?(material(r.id)||r):{},desc=mat.nome||r.nome||'',pct=Number(r.pct)||0;
      matRows+='<tr><td>'+letras[i]+'</td><td>'+esc2(desc)+'</td><td>'+(pct?fmt2(pct,2)+'%':'')+'</td></tr>';
    }
    let prodRows='';for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OP '+esc2(nome)+'</title><style>@page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:12px}.op{width:100%;border-collapse:collapse;table-layout:fixed}.op td,.op th{border:1px solid #333;padding:4px 5px;vertical-align:middle}.y{background:#fff200;font-weight:700}.center{text-align:center}.b{font-weight:700}.small{font-size:11px}.top td{height:22px}.mat td{height:22px}.prod td{height:24px}.codes td{font-size:11px}.logo{font-weight:700}.printHint{margin:8px 0;color:#555}@media print{.printHint{display:none}}</style></head><body><div class="printHint">OP pronta para imprimir. Escolha salvar como PDF ou imprimir.</div><table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="b center">OS:</td><td></td><td class="b">Data emissão:</td><td>'+esc2(hoje)+'</td></tr><tr><td class="b y">Cliente: '+esc2(nome)+'</td><td colspan="2">Cidade/UF:</td><td>UF:</td><td colspan="2" class="b center">FASE 1: EXTRUSÃO</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3">Tamanho final: '+esc2(tamanho)+'</td><td colspan="3">cod de barra</td><td colspan="3"></td></tr><tr><td colspan="3">Peso liquido: '+fmt2(total,0)+' KG</td><td colspan="3">Peso bruto (kg): '+fmt2(total,0)+' KG</td><td colspan="3">Total (FD):</td></tr></table><table class="op"><tr><td class="b">CP:</td><td colspan="8" class="y">descrição do produto= '+esc2(nome)+'</td></tr><tr><td colspan="3">Espessura de extrusão (dupla): '+dupla+'</td><td colspan="3">Espessura por parede: '+parede+'</td><td colspan="3">gramatura= '+gram+'</td></tr><tr><td colspan="3">Largura da bobina= '+lb+'</td><td colspan="3">largura do balão= '+lb+'</td><td colspan="3"></td></tr><tr><td colspan="9" class="y">&nbsp;</td></tr><tr><td colspan="9">Observações: </td></tr></table><table class="op mat"><tr><th style="width:7%">material</th><th>descrição da materia prima</th><th style="width:10%">%</th></tr>'+matRows+'</table><br><table class="op prod"><tr><th>Data</th><th>Operador</th><th>Maquina</th><th>Aparas(kg)</th><th>Quantidade(kg)</th><th>cod parada</th><th>inicio parada</th><th>final de parada</th><th>inicio de produção</th><th>final de produção</th><th>numero de bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02-acerto</td><td>03-M.mecanica</td><td>04-falta de energia</td><td>05-material molhado</td><td>06-teste</td></tr><tr><td>07-M.eletrica</td><td>08-limpeza da borda</td><td>09-troca de tela</td><td>10-outros</td><td colspan="2"></td></tr></table><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up e tente de novo.');return}w.document.open();w.document.write(html);w.document.close();
  };
  document.addEventListener('click',function(ev){const ds=ev.target&&ev.target.dataset?ev.target.dataset:{};if(ds.opform){ev.preventDefault();ev.stopPropagation();const f=forms().find(x=>String(x.id)===String(ds.opform));window.printFormulaOp(f)}},true);
  function rebind(){
    addComprimento();
    const btn=q('foSave');if(btn&&!btn.dataset.compSave){const clone=btn.cloneNode(true);clone.dataset.compSave='1';btn.parentNode.replaceChild(clone,btn);clone.addEventListener('click',window.salvarFormula)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(rebind,100));else setTimeout(rebind,100);
  setTimeout(rebind,700);
})();
