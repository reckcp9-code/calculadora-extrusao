(function(){
  'use strict';

  const KEY='df_formula_ops_relatorio_v1';
  let selectedFile=null;
  let ocrText='';

  function $(id){return document.getElementById(id)}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function num(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
  function fmt(v,d=2){return Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){localStorage.setItem(KEY,JSON.stringify(a));renderSaved();renderReport()}
  function today(){const d=new Date();return d.toISOString().slice(0,10)}
  function monthNow(){return today().slice(0,7)}
  function addStyle(){
    if($('dfOpsStyle'))return;
    const s=document.createElement('style');s.id='dfOpsStyle';s.textContent=`
      #dfFormulaSubnav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px}
      #dfFormulaSubnav button{border:1px solid #334155;background:#0f172a;color:#cbd5e1;border-radius:13px;padding:12px 8px;font-weight:950;font-size:12px}
      #dfFormulaSubnav button.on{border-color:#f5a000;background:#211400;color:#ffd36a}
      #dfFormulaOps{display:none}
      #dfFormulaOps.on{display:block}
      .dfOpsHero{border:1px solid #f5a000;background:linear-gradient(180deg,#211400,#14100a);border-radius:18px;padding:16px;margin-bottom:14px}
      .dfOpsHero h2{margin:0 0 6px;color:#ffd36a}.dfOpsHero p{margin:0;color:#cbd5e1;line-height:1.45;font-size:13px}
      .dfOpsCard{background:#111827;border:1px solid #263244;border-radius:18px;padding:16px;margin-bottom:14px}
      .dfOpsCard h3{margin:0 0 12px;font-size:19px}.dfOpsGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .dfOpsGrid .full{grid-column:1/-1}.dfOpsCard label{display:block;color:#cbd5e1;font-size:12px;margin:9px 0 5px}
      .dfOpsCard input,.dfOpsCard textarea,.dfOpsCard select{width:100%;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:12px;font-size:16px}
      .dfOpsCard textarea{min-height:86px;resize:vertical}.dfOpsBtn{width:100%;border:1px solid #16a34a;background:#0c321c;color:#86efac;border-radius:13px;padding:13px 10px;margin-top:10px;font-size:14px;font-weight:950}
      .dfOpsBtn.alt{border-color:#f5a000;background:#241600;color:#ffd36a}.dfOpsBtn.danger{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}
      #dfOpPreview{width:100%;max-height:360px;object-fit:contain;border-radius:14px;border:1px solid #334155;background:#080b13;display:none;margin-top:10px}
      #dfOpOcrStatus{margin-top:10px;font-size:12px;font-weight:800;color:#94a3b8}.dfOpKpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.dfOpKpi{background:#0f172a;border:1px solid #263244;border-radius:13px;padding:11px}.dfOpKpi span{display:block;color:#94a3b8;font-size:11px}.dfOpKpi b{display:block;color:#f8fafc;font-size:20px;margin-top:4px}
      .dfOpSaved{background:#0f172a;border:1px solid #263244;border-radius:14px;padding:12px;margin-top:9px}.dfOpSavedTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.dfOpSaved strong{color:#ffd36a}.dfOpTiny{font-size:11px;color:#94a3b8;line-height:1.4}.dfOpMaterialRow{display:grid;grid-template-columns:1fr 100px 42px;gap:6px;align-items:end;margin-top:6px}.dfOpMaterialRow button{height:44px;border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:10px;font-weight:900}
      #dfOpReportBox{margin-top:10px}.dfOpReportTable{width:100%;border-collapse:collapse;font-size:11px}.dfOpReportTable th,.dfOpReportTable td{border-bottom:1px solid #263244;padding:7px 4px;text-align:left}.dfOpReportTable th{color:#94a3b8}.dfOpsNotice{border:1px dashed #f5a000;background:#211400;color:#fef3c7;border-radius:12px;padding:10px;font-size:11px;line-height:1.45;margin-top:10px}
      @media(max-width:560px){.dfOpsGrid{grid-template-columns:1fr}.dfOpKpis{grid-template-columns:1fr 1fr}.dfOpMaterialRow{grid-template-columns:1fr 86px 40px}#dfFormulaSubnav button{font-size:11px;padding:11px 5px}}
    `;document.head.appendChild(s)
  }

  function mount(){
    addStyle();
    const area=$('foDevArea');if(!area||$('dfFormulaSubnav'))return;
    const core=document.createElement('div');core.id='dfFormulaCore';
    Array.from(area.children).forEach(ch=>core.appendChild(ch));
    const nav=document.createElement('div');nav.id='dfFormulaSubnav';nav.innerHTML='<button id="dfFormTabCore" class="on" type="button">🧪 FORMULAÇÃO</button><button id="dfFormTabOps" type="button">📸 OPS / RELATÓRIO</button>';
    const ops=document.createElement('div');ops.id='dfFormulaOps';ops.innerHTML=buildOpsHtml();
    area.appendChild(nav);area.appendChild(core);area.appendChild(ops);
    $('dfFormTabCore').onclick=()=>switchTab(false);$('dfFormTabOps').onclick=()=>switchTab(true);
    bindOps();renderSaved();renderReport();
    const q=new URLSearchParams(location.search);if(q.get('ops')==='1')switchTab(true);
  }

  function switchTab(ops){
    const core=$('dfFormulaCore'),box=$('dfFormulaOps');if(!core||!box)return;
    core.style.display=ops?'none':'block';box.classList.toggle('on',ops);
    $('dfFormTabCore')?.classList.toggle('on',!ops);$('dfFormTabOps')?.classList.toggle('on',ops);
  }

  function buildOpsHtml(){return `
    <div class="dfOpsHero"><h2>📸 OPs + Relatório mensal</h2><p>Envie ou tire uma foto da OP preenchida. A leitura tenta preencher os dados automaticamente. Confira antes de salvar. No fechamento do mês, o sistema soma tudo e monta o relatório.</p></div>
    <div class="dfOpsCard"><h3>1. Foto da OP</h3><input id="dfOpPhoto" type="file" accept="image/*" capture="environment"><img id="dfOpPreview" alt="Prévia da OP"><button id="dfOpRead" class="dfOpsBtn alt" type="button">📷 LER FOTO DA OP</button><div id="dfOpOcrStatus">Nenhuma foto selecionada.</div><div class="dfOpsNotice">No teste, a leitura usa OCR no próprio navegador. A foto não fica salva: só os dados que você confirmar. A primeira leitura pode demorar um pouco.</div></div>
    <div class="dfOpsCard"><h3>2. Conferir dados lidos</h3><div class="dfOpsGrid">
      <div><label>Nº da OP</label><input id="dfOpNumero" placeholder="Ex.: 2451"></div>
      <div><label>Data</label><input id="dfOpData" type="date"></div>
      <div><label>Operador</label><input id="dfOpOperador" placeholder="Nome"></div>
      <div><label>Máquina</label><input id="dfOpMaquina" placeholder="Ex.: Extrusora 01"></div>
      <div class="full"><label>Produto</label><input id="dfOpProduto" placeholder="Produto / medida"></div>
      <div class="full"><label>Formulação</label><input id="dfOpFormula" placeholder="Nome da formulação"></div>
      <div><label>Largura (cm)</label><input id="dfOpLargura" inputmode="decimal" placeholder="Ex.: 75"></div>
      <div><label>Espessura / micra</label><input id="dfOpMicra" inputmode="decimal" placeholder="Ex.: 45"></div>
      <div><label>Gramas por metro (g/m)</label><input id="dfOpGM" inputmode="decimal" placeholder="Ex.: 48"></div>
      <div><label>Peso produzido (kg)</label><input id="dfOpProduzido" inputmode="decimal" placeholder="Ex.: 601"></div>
      <div><label>Apara / perda (kg)</label><input id="dfOpApara" inputmode="decimal" placeholder="Ex.: 20"></div>
      <div><label>Reprocesso (kg)</label><input id="dfOpReprocesso" inputmode="decimal" placeholder="Ex.: 15"></div>
      <div class="full"><label>Observações</label><textarea id="dfOpObs" placeholder="Observações da OP"></textarea></div>
    </div>
    <h3 style="margin-top:16px">Materiais usados</h3><div id="dfOpMaterials"></div><button id="dfOpAddMat" class="dfOpsBtn alt" type="button">+ ADICIONAR MATERIAL</button><button id="dfOpSave" class="dfOpsBtn" type="button">💾 SALVAR OP</button></div>
    <div class="dfOpsCard"><h3>3. OPs salvas</h3><div id="dfOpSavedList"></div></div>
    <div class="dfOpsCard"><h3>4. Fechamento do mês</h3><label>Mês do relatório</label><input id="dfOpMonth" type="month"><div id="dfOpReportBox"></div><button id="dfOpPrint" class="dfOpsBtn alt" type="button">📄 GERAR / SALVAR RELATÓRIO PDF</button></div>
  `}

  function bindOps(){
    $('dfOpData').value=today();$('dfOpMonth').value=monthNow();addMaterialRow();
    $('dfOpPhoto').addEventListener('change',onPhoto);
    $('dfOpRead').addEventListener('click',readPhoto);
    $('dfOpAddMat').addEventListener('click',()=>addMaterialRow());
    $('dfOpSave').addEventListener('click',saveOp);
    $('dfOpMonth').addEventListener('change',renderReport);
    $('dfOpPrint').addEventListener('click',printReport);
  }

  function addMaterialRow(name='',kg=''){
    const box=$('dfOpMaterials');if(!box)return;
    const row=document.createElement('div');row.className='dfOpMaterialRow';row.innerHTML=`<div><label>Material</label><input class="dfMatName" value="${esc(name)}" placeholder="Ex.: Canela"></div><div><label>kg</label><input class="dfMatKg" inputmode="decimal" value="${esc(kg)}" placeholder="0"></div><button type="button">×</button>`;row.querySelector('button').onclick=()=>row.remove();box.appendChild(row)
  }

  function onPhoto(e){selectedFile=e.target.files?.[0]||null;const img=$('dfOpPreview');if(!selectedFile){img.style.display='none';$('dfOpOcrStatus').textContent='Nenhuma foto selecionada.';return}img.src=URL.createObjectURL(selectedFile);img.style.display='block';$('dfOpOcrStatus').textContent='Foto pronta. Toque em LER FOTO DA OP.'}

  function loadTesseract(){return new Promise((resolve,reject)=>{if(window.Tesseract)return resolve(window.Tesseract);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>resolve(window.Tesseract);s.onerror=()=>reject(new Error('Não foi possível carregar a leitura de imagem.'));document.head.appendChild(s)})}

  async function prepareImage(file){return new Promise((resolve,reject)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{try{const max=1800,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(u);resolve(b||file)},'image/jpeg',0.88)}catch(e){URL.revokeObjectURL(u);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Foto inválida'))};img.src=u})}

  async function readPhoto(){
    if(!selectedFile){alert('Primeiro envie ou tire uma foto da OP.');return}
    const st=$('dfOpOcrStatus'),btn=$('dfOpRead');btn.disabled=true;st.textContent='Preparando a foto...';
    try{
      const T=await loadTesseract();const input=await prepareImage(selectedFile);
      const res=await T.recognize(input,'por',{logger:m=>{if(m.status==='recognizing text')st.textContent='Lendo OP... '+Math.round((m.progress||0)*100)+'%';else if(m.status)st.textContent='Preparando leitura: '+m.status}});
      ocrText=res?.data?.text||'';if(!ocrText.trim())throw new Error('Não consegui encontrar texto nessa foto.');
      applyParsed(parseOcr(ocrText));st.textContent='Leitura concluída. Confira os campos antes de salvar.';
    }catch(e){st.textContent='Falha na leitura automática: '+(e.message||'erro desconhecido')+' Você ainda pode preencher os campos manualmente.'}finally{btn.disabled=false}
  }

  function first(re,text){const m=text.match(re);return m?String(m[1]||'').trim():''}
  function parseDate(v){if(!v)return'';const m=v.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(!m)return'';let y=m[3];if(y.length===2)y='20'+y;return y.padStart(4,'0')+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
  function parseOcr(text){
    const t=text.replace(/\r/g,'\n').replace(/[ \t]+/g,' ');
    const out={
      numero:first(/(?:\bOP\b|ordem(?:\s+de)?\s+produ[cç][aã]o)\s*[:#\-]?\s*([0-9]{1,12})/i,t),
      data:parseDate(first(/(?:data)\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,t)),
      operador:first(/operador(?:\(a\))?\s*[:\-]?\s*([^\n]{2,45})/i,t),
      maquina:first(/m[aá]quina\s*[:\-]?\s*([^\n]{2,45})/i,t),
      produto:first(/(?:produto|descri[cç][aã]o)\s*[:\-]?\s*([^\n]{2,70})/i,t),
      formula:first(/formula[cç][aã]o\s*[:\-]?\s*([^\n]{2,70})/i,t),
      largura:first(/largura[^0-9]{0,15}([0-9.,]+)/i,t),
      micra:first(/(?:micra|espessura)[^0-9]{0,15}([0-9.,]+)/i,t),
      gm:first(/(?:g\s*\/\s*m|gramas?(?:\s+por)?\s+metro|peso(?:\s+por)?\s+metro)[^0-9]{0,15}([0-9.,]+)/i,t),
      produzido:first(/(?:peso\s+produzido|produ[cç][aã]o|total\s+produzido)[^0-9]{0,20}([0-9.,]+)\s*kg/i,t),
      apara:first(/(?:apara|refugo|perda)[^0-9]{0,20}([0-9.,]+)\s*kg/i,t),
      reprocesso:first(/(?:reprocesso|reprocessado)[^0-9]{0,20}([0-9.,]+)\s*kg/i,t),
      materials:[]
    };
    const ignore=/produz|apara|refugo|perda|reprocess|total|peso|largura|micra|espessura/i;
    t.split('\n').forEach(line=>{const m=line.trim().match(/^([A-Za-zÀ-ÿ0-9 ._\-]{2,45}?)\s+([0-9.,]+)\s*kg\b/i);if(m&&!ignore.test(m[1]))out.materials.push({name:m[1].trim(),kg:m[2]})});
    return out
  }

  function setIf(id,v){if(v&&$(id))$(id).value=v}
  function applyParsed(p){setIf('dfOpNumero',p.numero);setIf('dfOpData',p.data);setIf('dfOpOperador',p.operador);setIf('dfOpMaquina',p.maquina);setIf('dfOpProduto',p.produto);setIf('dfOpFormula',p.formula);setIf('dfOpLargura',p.largura);setIf('dfOpMicra',p.micra);setIf('dfOpGM',p.gm);setIf('dfOpProduzido',p.produzido);setIf('dfOpApara',p.apara);setIf('dfOpReprocesso',p.reprocesso);if(p.materials?.length){$('dfOpMaterials').innerHTML='';p.materials.forEach(m=>addMaterialRow(m.name,m.kg))}}

  function materialsFromForm(){return Array.from(document.querySelectorAll('#dfOpMaterials .dfOpMaterialRow')).map(r=>({name:(r.querySelector('.dfMatName')?.value||'').trim(),kg:num(r.querySelector('.dfMatKg')?.value)})).filter(m=>m.name&&m.kg>0)}
  function val(id){return ($(id)?.value||'').trim()}

  function saveOp(){
    const op={id:Date.now(),numero:val('dfOpNumero'),data:val('dfOpData')||today(),operador:val('dfOpOperador'),maquina:val('dfOpMaquina'),produto:val('dfOpProduto'),formula:val('dfOpFormula'),largura:num(val('dfOpLargura')),micra:num(val('dfOpMicra')),gm:num(val('dfOpGM')),produzido:num(val('dfOpProduzido')),apara:num(val('dfOpApara')),reprocesso:num(val('dfOpReprocesso')),obs:val('dfOpObs'),materials:materialsFromForm(),ocr:ocrText?true:false};
    if(!(op.numero||op.produto||op.produzido)){alert('Confira a OP: informe pelo menos número, produto ou peso produzido.');return}
    const a=load();a.push(op);save(a);clearForm();alert('OP salva. Ela já entrou no fechamento do mês.')
  }

  function clearForm(){['dfOpNumero','dfOpOperador','dfOpMaquina','dfOpProduto','dfOpFormula','dfOpLargura','dfOpMicra','dfOpGM','dfOpProduzido','dfOpApara','dfOpReprocesso','dfOpObs'].forEach(id=>{if($(id))$(id).value=''});$('dfOpData').value=today();$('dfOpMaterials').innerHTML='';addMaterialRow();$('dfOpPhoto').value='';$('dfOpPreview').style.display='none';$('dfOpOcrStatus').textContent='Nenhuma foto selecionada.';selectedFile=null;ocrText=''}

  function deleteOp(id){if(!confirm('Excluir esta OP do relatório?'))return;save(load().filter(x=>x.id!==id))}

  function renderSaved(){const box=$('dfOpSavedList');if(!box)return;const a=load().slice().sort((x,y)=>(y.data||'').localeCompare(x.data||'')||y.id-x.id);if(!a.length){box.innerHTML='<div class="dfOpTiny">Nenhuma OP salva ainda.</div>';return}box.innerHTML=a.slice(0,50).map(o=>`<div class="dfOpSaved"><div class="dfOpSavedTop"><div><strong>OP ${esc(o.numero||'—')}</strong><div class="dfOpTiny">${esc(o.data||'')} • ${esc(o.produto||o.formula||'Sem produto')}</div><div class="dfOpTiny">Produzido: ${fmt(+o.produzido||0,2)} kg • Apara: ${fmt(+o.apara||0,2)} kg</div></div><button class="dfOpsBtn danger" style="width:auto;margin:0;padding:8px 10px;font-size:11px" data-del="${o.id}">EXCLUIR</button></div></div>`).join('');box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteOp(+b.dataset.del))}

  function monthOps(){const m=$('dfOpMonth')?.value||monthNow();return load().filter(o=>(o.data||'').slice(0,7)===m)}
  function aggregate(list){
    let prod=0,ap=0,rep=0,meters=0,gms=[],mics=[];const mats={},ops={},machines={},products={};
    list.forEach(o=>{const p=+o.produzido||0,a=+o.apara||0,r=+o.reprocesso||0;prod+=p;ap+=a;rep+=r;if(+o.gm>0&&p>0)meters+=p*1000/(+o.gm);if(+o.gm>0)gms.push(+o.gm);if(+o.micra>0)mics.push(+o.micra);if(o.operador)ops[o.operador]=(ops[o.operador]||0)+p;if(o.maquina)machines[o.maquina]=(machines[o.maquina]||0)+p;if(o.produto)products[o.produto]=(products[o.produto]||0)+p;(o.materials||[]).forEach(m=>{if(m.name)mats[m.name]=(mats[m.name]||0)+(+m.kg||0)})});
    const bom=Math.max(0,prod-ap),rend=prod>0?bom/prod*100:0,avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
    return{prod,ap,rep,bom,rend,meters,gm:avg(gms),micra:avg(mics),mats,ops,machines,products}
  }
  function mapRows(obj,suffix=' kg'){const e=Object.entries(obj).sort((a,b)=>b[1]-a[1]);return e.length?e.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${fmt(v,2)}${suffix}</td></tr>`).join(''):'<tr><td colspan="2">—</td></tr>'}

  function renderReport(){const box=$('dfOpReportBox');if(!box)return;const list=monthOps(),a=aggregate(list);box.innerHTML=`<div class="dfOpKpis"><div class="dfOpKpi"><span>OPs no mês</span><b>${list.length}</b></div><div class="dfOpKpi"><span>Produção total</span><b>${fmt(a.prod,2)} kg</b></div><div class="dfOpKpi"><span>Apara / perda</span><b>${fmt(a.ap,2)} kg</b></div><div class="dfOpKpi"><span>Produção líquida</span><b>${fmt(a.bom,2)} kg</b></div><div class="dfOpKpi"><span>Reprocesso</span><b>${fmt(a.rep,2)} kg</b></div><div class="dfOpKpi"><span>Rendimento</span><b>${fmt(a.rend,2)}%</b></div><div class="dfOpKpi"><span>Metros estimados</span><b>${fmt(a.meters,0)} m</b></div><div class="dfOpKpi"><span>Média g/m</span><b>${a.gm?fmt(a.gm,2):'—'}</b></div></div><h3 style="margin-top:16px">Materiais consumidos</h3><table class="dfOpReportTable"><tbody>${mapRows(a.mats)}</tbody></table>`}

  function reportHtml(){const list=monthOps(),a=aggregate(list),m=$('dfOpMonth')?.value||monthNow();const title=m.split('-').reverse().join('/');const rows=list.map(o=>`<tr><td>${esc(o.data||'')}</td><td>${esc(o.numero||'—')}</td><td>${esc(o.produto||o.formula||'—')}</td><td>${esc(o.operador||'—')}</td><td>${fmt(+o.produzido||0,2)}</td><td>${fmt(+o.apara||0,2)}</td><td>${+o.gm?fmt(+o.gm,2):'—'}</td></tr>`).join('');return `<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${esc(title)}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111}h1{margin:0 0 4px}h2{margin-top:22px}.sub{color:#555;margin-bottom:18px}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.c{border:1px solid #ccc;border-radius:8px;padding:10px}.c span{display:block;font-size:11px;color:#666}.c b{font-size:19px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}th{background:#eee}</style></head><body><h1>DF Manutenção e Consultoria</h1><div class="sub">Relatório mensal de OPs — ${esc(title)}</div><div class="k"><div class="c"><span>OPs</span><b>${list.length}</b></div><div class="c"><span>Produção total</span><b>${fmt(a.prod,2)} kg</b></div><div class="c"><span>Apara</span><b>${fmt(a.ap,2)} kg</b></div><div class="c"><span>Produção líquida</span><b>${fmt(a.bom,2)} kg</b></div><div class="c"><span>Reprocesso</span><b>${fmt(a.rep,2)} kg</b></div><div class="c"><span>Rendimento</span><b>${fmt(a.rend,2)}%</b></div><div class="c"><span>Metros estimados</span><b>${fmt(a.meters,0)} m</b></div><div class="c"><span>Média g/m</span><b>${a.gm?fmt(a.gm,2):'—'}</b></div></div><h2>OPs do mês</h2><table><thead><tr><th>Data</th><th>OP</th><th>Produto</th><th>Operador</th><th>Produzido kg</th><th>Apara kg</th><th>g/m</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Nenhuma OP neste mês.</td></tr>'}</tbody></table><h2>Materiais consumidos</h2><table><thead><tr><th>Material</th><th>Total</th></tr></thead><tbody>${mapRows(a.mats)}</tbody></table><h2>Produção por operador</h2><table><tbody>${mapRows(a.ops)}</tbody></table><h2>Produção por máquina</h2><table><tbody>${mapRows(a.machines)}</tbody></table></body></html>`}

  function printReport(){const w=window.open('','_blank');if(!w){alert('Permita abrir nova janela para gerar o relatório.');return}w.document.open();w.document.write(reportHtml());w.document.close();setTimeout(()=>{w.focus();w.print()},500)}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,500),{once:true});else setTimeout(mount,500);
  window.addEventListener('df-ui-ready',()=>setTimeout(mount,350));
  setTimeout(mount,1200);setTimeout(mount,2200);
})();
