(function(){
  'use strict';
  if(window.DFCostFabrilV1)return;
  window.DFCostFabrilV1=true;

  const KEY='df_custo_fabril_v1';
  const $=id=>document.getElementById(id);

  function num(v){
    let s=String(v??'').trim().replace(/R\$/gi,'').replace(/\s+/g,'');
    if(!s)return 0;
    if(s.includes(',')){
      s=s.replace(/\./g,'').replace(',','.');
    }else{
      const dots=(s.match(/\./g)||[]).length;
      if(dots>1)s=s.replace(/\./g,'');
      else if(dots===1){
        const p=s.split('.');
        if(p[1]&&p[1].length===3&&/^\d+$/.test(p[0]+p[1]))s=p.join('');
      }
    }
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }

  const money=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}):'R$ 0,00';
  const kgMoney=v=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:4})+'/kg';
  const pct=v=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';

  const GROUP_KEYS=new Set(['aluguel','energia','folha','producao','aparaKg','embalagem','depBase','manValor']);
  const DECIMAL_KEYS=new Set(['reprocKg','formula','depPct','manPct']);

  function groupDigits(digits){
    digits=String(digits||'').replace(/^0+(?=\d)/,'');
    if(!digits)return'';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  }

  function formatGrouped(el){
    if(!el)return;
    let s=String(el.value||'').replace(/[^\d,.-]/g,'').replace(/-/g,'');
    if(!s){el.value='';return}
    const comma=s.indexOf(',');
    let intPart,decPart='';
    if(comma>=0){
      intPart=s.slice(0,comma).replace(/\D/g,'');
      decPart=s.slice(comma+1).replace(/\D/g,'').slice(0,2);
      el.value=groupDigits(intPart)+(decPart!==''||s.endsWith(',')?','+decPart:'');
    }else{
      intPart=s.replace(/\D/g,'');
      el.value=groupDigits(intPart);
    }
  }

  function formatDecimal(el){
    if(!el||!String(el.value||'').trim())return;
    const n=num(el.value);
    el.value=n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function formatRestoredFields(){
    document.querySelectorAll('#dfCostFabrilV273 input[data-cf]').forEach(el=>{
      const key=el.dataset.cf;
      if(GROUP_KEYS.has(key))formatGrouped(el);
      else if(DECIMAL_KEYS.has(key))formatDecimal(el);
    });
  }

  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'{}');
      return x&&typeof x==='object'?x:{};
    }catch(e){return{}}
  }
  function save(){
    const data={};
    document.querySelectorAll('#dfCostFabrilV273 [data-cf]').forEach(el=>{data[el.dataset.cf]=el.value});
    try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}
  }
  function restore(){
    const data=read();
    document.querySelectorAll('#dfCostFabrilV273 [data-cf]').forEach(el=>{
      const k=el.dataset.cf;
      if(Object.prototype.hasOwnProperty.call(data,k))el.value=data[k];
    });
  }

  function addStyle(){
    if($('dfCostFabrilV1Style'))return;
    const s=document.createElement('style');
    s.id='dfCostFabrilV1Style';
    s.textContent=`
      #dfCostFabrilV273{padding:16px!important}
      #dfCostFabrilV273 .cfTitle{margin:4px 0 3px;font-size:23px;font-weight:950;color:#f8fafc}
      #dfCostFabrilV273 .cfSub{color:#94a3b8;font-size:12px;line-height:1.4;margin-bottom:14px}
      #dfCostFabrilV273 .cfGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #dfCostFabrilV273 .cfField{background:#0f172a;border:1px solid #263244;border-radius:15px;padding:13px;margin-top:10px}
      #dfCostFabrilV273 .cfField.full{grid-column:1/-1}
      #dfCostFabrilV273 .cfField label{display:block;margin:0 0 7px;color:#e2e8f0;font-size:13px;font-weight:850}
      #dfCostFabrilV273 .cfField input,#dfCostFabrilV273 .cfField select{width:100%;min-height:48px;border:1px solid #334155;background:#0b1220;color:#fff;border-radius:12px;padding:11px 12px;font-size:17px;font-weight:800}
      #dfCostFabrilV273 .cfPair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #dfCostFabrilV273 .cfHelp{margin-top:7px;color:#94a3b8;font-size:11px;line-height:1.4}
      #dfCostFabrilV273 .cfMiniResult{margin-top:9px;padding:10px 12px;border:1px solid #263244;border-radius:12px;background:#0b1220}
      #dfCostFabrilV273 .cfMiniResult div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 0;color:#aebbd0;font-size:12px}
      #dfCostFabrilV273 .cfMiniResult b{color:#f8fafc;font-size:12px;text-align:right}
      #dfCostFabrilV273 .cfConditional{display:none;margin-top:10px}
      #dfCostFabrilV273 .cfConditional.on{display:block}
      #dfCostFabrilV273 .cfMainResult{margin-top:16px;padding:18px 14px;border-radius:18px;background:#0c1c13;border:1px solid #2e5b3d;text-align:center}
      #dfCostFabrilV273 .cfMainResult span{display:block;color:#bbf7d0;font-size:12px;font-weight:900}
      #dfCostFabrilV273 .cfMainResult b{display:block;color:#86efac;font-size:30px;line-height:1.15;margin-top:6px}
      #dfCostFabrilV273 .cfSummary{margin-top:12px;border:1px solid #263244;border-radius:15px;background:#0f172a;overflow:hidden}
      #dfCostFabrilV273 .cfSummary h3{margin:0;padding:13px 14px;border-bottom:1px solid #263244;font-size:14px;color:#ffd36a}
      #dfCostFabrilV273 .cfRow{display:grid;grid-template-columns:1fr auto;gap:12px;padding:10px 14px;border-bottom:1px solid #202c3d;color:#aebbd0;font-size:12px}
      #dfCostFabrilV273 .cfRow:last-child{border-bottom:0}
      #dfCostFabrilV273 .cfRow b{color:#f8fafc;text-align:right}
      #dfCostFabrilV273 .cfRow.strong{background:#101a2b;font-weight:900}
      #dfCostFabrilV273 .cfRow.strong b{color:#ffd36a}
      #dfCostFabrilV273 .cfReportWrap{margin-top:14px}
      #dfCostFabrilV273 .cfReportBtn{width:100%;min-height:50px;border:1px solid #f5a000;border-radius:13px;background:linear-gradient(180deg,#ffc647 0%,#f5a000 100%);color:#15110a;font-size:13px;font-weight:950;letter-spacing:.2px;box-shadow:0 8px 20px rgba(245,160,0,.18)}
      #dfCostFabrilV273 .cfReportBtn:active{transform:scale(.985)}
      #dfCostFabrilV273 .cfReportHint{margin:7px 2px 0;color:#94a3b8;font-size:10.5px;line-height:1.4;text-align:center}
      @media(max-width:560px){
        #dfCostFabrilV273 .cfGrid,#dfCostFabrilV273 .cfPair{grid-template-columns:1fr}
        #dfCostFabrilV273 .cfField.full{grid-column:auto}
        #dfCostFabrilV273 .cfMainResult b{font-size:26px}
      }
    `;
    document.head.appendChild(s);
  }

  function field(label,key,placeholder,inputmode){
    return '<div class="cfField"><label>'+label+'</label><input data-cf="'+key+'" inputmode="'+(inputmode||'decimal')+'" placeholder="'+placeholder+'"></div>';
  }

  function build(){
    const root=$('dfCostFabrilV273');
    if(!root)return false;
    if(root.dataset.dfCostFabrilBuilt==='1')return true;
    root.dataset.dfCostFabrilBuilt='1';
    addStyle();
    root.innerHTML=`
      <span class="tag">CUSTO FABRIL</span>
      <div class="cfTitle">Custo fabril</div>
      <div class="cfSub">Preencha os valores mensais. Os cálculos são atualizados automaticamente e ficam salvos neste aparelho.</div>

      <div class="cfGrid">
        ${field('1. Aluguel — R$/mês','aluguel','Ex.: 8.000')}
        ${field('2. Energia — R$/mês','energia','Ex.: 35.000')}
        ${field('3. Folha salarial total — R$/mês','folha','Ex.: 45.000')}
        ${field('4. Produção total — kg/mês','producao','Ex.: 80.000')}
      </div>

      <div class="cfField full">
        <label>5. Apara</label>
        <div class="cfPair">
          <div><label>Apara total — kg/mês</label><input data-cf="aparaKg" inputmode="decimal" placeholder="Ex.: 20.000"></div>
          <div><label>Custo de reprocesso — R$/kg</label><input data-cf="reprocKg" inputmode="decimal" placeholder="Ex.: 2,00"></div>
        </div>
        <div class="cfMiniResult">
          <div><span>Percentual de apara</span><b id="cfAparaPct">0,00%</b></div>
          <div><span>Custo total mensal do reprocesso</span><b id="cfReprocMes">R$ 0,00</b></div>
          <div><span>Reprocesso por kg produzido</span><b id="cfReprocKgProd">R$ 0,00/kg</b></div>
        </div>
      </div>

      <div class="cfGrid">
        ${field('6. Preço da formulação — R$/kg','formula','Ex.: 7,50')}
        ${field('7. Embalagem personalizada — R$/mês','embalagem','Ex.: 5.000')}
      </div>

      <div class="cfField full">
        <label>8. Depreciação das máquinas</label>
        <select data-cf="depIncluir" id="cfDepIncluir">
          <option value="nao">Não incluir depreciação</option>
          <option value="sim">Sim, incluir depreciação</option>
        </select>
        <div id="cfDepCampos" class="cfConditional">
          <div class="cfPair">
            <div><label>Base de cálculo — R$</label><input data-cf="depBase" inputmode="decimal" placeholder="Ex.: 500.000"></div>
            <div><label>Percentual de depreciação — % ao mês</label><input data-cf="depPct" inputmode="decimal" placeholder="Ex.: 1,00"></div>
          </div>
          <div class="cfMiniResult">
            <div><span>Depreciação mensal</span><b id="cfDepMes">R$ 0,00</b></div>
            <div><span>Depreciação por kg produzido</span><b id="cfDepKg">R$ 0,00/kg</b></div>
          </div>
        </div>
      </div>

      <div class="cfField full">
        <label>9. Manutenção fabril</label>
        <select data-cf="manModo" id="cfManModo">
          <option value="valor">Valor mensal — R$</option>
          <option value="percentual">Percentual — %</option>
        </select>
        <div id="cfManValorBox" class="cfConditional on">
          <label>Valor mensal — R$</label>
          <input data-cf="manValor" inputmode="decimal" placeholder="Ex.: 6.000">
        </div>
        <div id="cfManPctBox" class="cfConditional">
          <label>Percentual — %</label>
          <input data-cf="manPct" inputmode="decimal" placeholder="Ex.: 5,00">
          <div class="cfHelp" id="cfManBaseTexto">Base: custos fabris mensais antes da manutenção.</div>
        </div>
        <div class="cfMiniResult">
          <div><span>Manutenção mensal</span><b id="cfManMes">R$ 0,00</b></div>
          <div><span>Manutenção por kg produzido</span><b id="cfManKg">R$ 0,00/kg</b></div>
        </div>
      </div>

      <div class="cfMainResult">
        <span>CUSTO FINAL DO PRODUTO</span>
        <b id="cfCustoFinal">R$ 0,00/kg</b>
      </div>

      <div class="cfSummary">
        <h3>DETALHAMENTO DO CUSTO</h3>
        <div class="cfRow"><span>Aluguel por kg</span><b id="cfAluguelKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Energia por kg</span><b id="cfEnergiaKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Folha salarial por kg</span><b id="cfFolhaKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Reprocesso da apara por kg</span><b id="cfReprocessoKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Embalagem personalizada por kg</span><b id="cfEmbalagemKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Manutenção por kg</span><b id="cfManutencaoKg">R$ 0,00/kg</b></div>
        <div class="cfRow" id="cfDepRow"><span>Depreciação por kg</span><b id="cfDepreciacaoKg">R$ 0,00/kg</b></div>
        <div class="cfRow strong"><span>Custo industrial por kg</span><b id="cfIndustrialKg">R$ 0,00/kg</b></div>
        <div class="cfRow"><span>Preço da formulação por kg</span><b id="cfFormulaKg">R$ 0,00/kg</b></div>
        <div class="cfRow strong"><span>Total dos custos mensais</span><b id="cfTotalMensal">R$ 0,00</b></div>
      </div>

      <div class="cfReportWrap">
        <button type="button" class="cfReportBtn" id="cfGerarRelatorioPdf">GERAR RELATÓRIO PDF</button>
        <div class="cfReportHint">Gera um relatório completo com os custos mensais, custo por kg e os cálculos usados.</div>
      </div>
    `;

    restore();
    formatRestoredFields();
    syncConditionalUI();

    root.addEventListener('change',e=>{
      const t=e.target;
      if(t&&(t.id==='cfDepIncluir'||t.id==='cfManModo')){
        syncConditionalUI();
        save();
        calc();
        requestAnimationFrame(syncConditionalUI);
      }
    },true);

    root.addEventListener('click',e=>{
      const btn=e.target&&e.target.closest?e.target.closest('#cfGerarRelatorioPdf'):null;
      if(!btn)return;
      e.preventDefault();
      save();
      calc();
      gerarRelatorioPdf();
    });

    root.querySelectorAll('[data-cf]').forEach(el=>{
      const key=el.dataset.cf;
      el.addEventListener('input',()=>{
        if(el.tagName==='INPUT'&&GROUP_KEYS.has(key))formatGrouped(el);
        save();calc();
      });
      el.addEventListener('change',()=>{save();calc()});
      if(el.tagName==='INPUT'){
        el.addEventListener('blur',()=>{
          if(DECIMAL_KEYS.has(key))formatDecimal(el);
          else if(GROUP_KEYS.has(key))formatGrouped(el);
          save();calc();
        });
      }
    });
    save();
    calc();
    return true;
  }

  function val(key){
    const el=document.querySelector('#dfCostFabrilV273 [data-cf="'+key+'"]');
    return el?num(el.value):0;
  }
  function setText(id,text){const el=$(id);if(el)el.textContent=text}

  function syncConditionalUI(){
    const root=$('dfCostFabrilV273');
    if(!root)return;

    const depOn=String(root.querySelector('#cfDepIncluir')?.value||'nao')==='sim';
    const depBox=root.querySelector('#cfDepCampos');
    const depRow=root.querySelector('#cfDepRow');
    if(depBox){
      depBox.classList.toggle('on',depOn);
      depBox.style.setProperty('display',depOn?'block':'none','important');
    }
    if(depRow)depRow.style.setProperty('display',depOn?'grid':'none','important');

    const manMode=String(root.querySelector('#cfManModo')?.value||'valor');
    const manValorBox=root.querySelector('#cfManValorBox');
    const manPctBox=root.querySelector('#cfManPctBox');
    if(manValorBox){
      const show=manMode==='valor';
      manValorBox.classList.toggle('on',show);
      manValorBox.style.setProperty('display',show?'block':'none','important');
    }
    if(manPctBox){
      const show=manMode==='percentual';
      manPctBox.classList.toggle('on',show);
      manPctBox.style.setProperty('display',show?'block':'none','important');
    }
  }

  function calc(){
    const prod=val('producao');
    const aluguel=val('aluguel');
    const energia=val('energia');
    const folha=val('folha');
    const apara=val('aparaKg');
    const reprocUnit=val('reprocKg');
    const formula=val('formula');
    const embalagem=val('embalagem');

    const aparaPct=prod>0?apara/prod*100:0;
    const reprocMes=apara*reprocUnit;
    const reprocKg=prod>0?reprocMes/prod:0;

    const root=$('dfCostFabrilV273');
    const depOn=String(root?.querySelector('#cfDepIncluir')?.value||'nao')==='sim';
    syncConditionalUI();
    const depBase=depOn?val('depBase'):0;
    const depPct=depOn?val('depPct'):0;
    const depMes=depOn?depBase*depPct/100:0;
    const depKg=prod>0?depMes/prod:0;

    const embalagemKg=prod>0?embalagem/prod:0;
    const aluguelKg=prod>0?aluguel/prod:0;
    const energiaKg=prod>0?energia/prod:0;
    const folhaKg=prod>0?folha/prod:0;

    const baseMan=aluguel+energia+folha+reprocMes+embalagem+depMes;
    const manMode=String(root?.querySelector('#cfManModo')?.value||'valor');
    const manMes=manMode==='percentual'?baseMan*val('manPct')/100:val('manValor');
    const manKg=prod>0?manMes/prod:0;

    const industrialMes=baseMan+manMes;
    const industrialKg=prod>0?industrialMes/prod:0;
    const formulaMes=prod*formula;
    const totalMensal=industrialMes+formulaMes;
    const finalKg=industrialKg+formula;

    setText('cfAparaPct',pct(aparaPct));
    setText('cfReprocMes',money(reprocMes));
    setText('cfReprocKgProd',kgMoney(reprocKg));
    setText('cfDepMes',money(depMes));
    setText('cfDepKg',kgMoney(depKg));
    setText('cfManMes',money(manMes));
    setText('cfManKg',kgMoney(manKg));
    setText('cfManBaseTexto','Base: aluguel + energia + folha + reprocesso + embalagem'+(depOn?' + depreciação':'')+' = '+money(baseMan)+'.');

    setText('cfAluguelKg',kgMoney(aluguelKg));
    setText('cfEnergiaKg',kgMoney(energiaKg));
    setText('cfFolhaKg',kgMoney(folhaKg));
    setText('cfReprocessoKg',kgMoney(reprocKg));
    setText('cfEmbalagemKg',kgMoney(embalagemKg));
    setText('cfManutencaoKg',kgMoney(manKg));
    setText('cfDepreciacaoKg',kgMoney(depKg));
    setText('cfIndustrialKg',kgMoney(industrialKg));
    setText('cfFormulaKg',kgMoney(formula));
    setText('cfTotalMensal',money(totalMensal));
    setText('cfCustoFinal',kgMoney(finalKg));
  }


  function reportData(){
    const prod=val('producao');
    const aluguel=val('aluguel');
    const energia=val('energia');
    const folha=val('folha');
    const apara=val('aparaKg');
    const reprocUnit=val('reprocKg');
    const formula=val('formula');
    const embalagem=val('embalagem');
    const root=$('dfCostFabrilV273');
    const depOn=String(root?.querySelector('#cfDepIncluir')?.value||'nao')==='sim';
    const depBase=depOn?val('depBase'):0;
    const depPct=depOn?val('depPct'):0;
    const depMes=depOn?depBase*depPct/100:0;
    const depKg=prod>0?depMes/prod:0;
    const aparaPct=prod>0?apara/prod*100:0;
    const reprocMes=apara*reprocUnit;
    const reprocKg=prod>0?reprocMes/prod:0;
    const aluguelKg=prod>0?aluguel/prod:0;
    const energiaKg=prod>0?energia/prod:0;
    const folhaKg=prod>0?folha/prod:0;
    const embalagemKg=prod>0?embalagem/prod:0;
    const baseMan=aluguel+energia+folha+reprocMes+embalagem+depMes;
    const manMode=String(root?.querySelector('#cfManModo')?.value||'valor');
    const manPct=manMode==='percentual'?val('manPct'):0;
    const manMes=manMode==='percentual'?baseMan*manPct/100:val('manValor');
    const manKg=prod>0?manMes/prod:0;
    const industrialMes=baseMan+manMes;
    const industrialKg=prod>0?industrialMes/prod:0;
    const formulaMes=prod*formula;
    const totalMensal=industrialMes+formulaMes;
    const finalKg=industrialKg+formula;
    return {prod,aluguel,energia,folha,apara,reprocUnit,formula,embalagem,depOn,depBase,depPct,depMes,depKg,aparaPct,reprocMes,reprocKg,aluguelKg,energiaKg,folhaKg,embalagemKg,baseMan,manMode,manPct,manMes,manKg,industrialMes,industrialKg,formulaMes,totalMensal,finalKg};
  }

  function reportNumber(v,dec){
    return (Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:dec??2,maximumFractionDigits:dec??2});
  }

  function pdfBytes(str){
    return new TextEncoder().encode(str);
  }

  function concatBytes(parts){
    let total=0;
    parts.forEach(p=>total+=p.length);
    const out=new Uint8Array(total);
    let pos=0;
    parts.forEach(p=>{out.set(p,pos);pos+=p.length});
    return out;
  }

  function dataUrlBytes(url){
    const raw=atob(String(url).split(',')[1]||'');
    const out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }

  function makeImagePdf(jpeg,width,height){
    const enc=pdfBytes,parts=[],offs=[0];
    let pos=0;
    function add(v){const a=typeof v==='string'?enc(v):v;parts.push(a);pos+=a.length}
    function obj(n,body){
      offs[n]=pos;add(n+' 0 obj\n');
      if(Array.isArray(body))body.forEach(add);else add(body);
      add('\nendobj\n');
    }
    add('%PDF-1.4\n%DFEX\n');
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    obj(4,['<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n',jpeg,'\nendstream']);
    const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n',sb=enc(stream);
    obj(5,['<< /Length '+sb.length+' >>\nstream\n',sb,'endstream']);
    const xref=pos;
    let tail='xref\n0 6\n0000000000 65535 f \n';
    for(let n=1;n<=5;n++)tail+=String(offs[n]).padStart(10,'0')+' 00000 n \n';
    tail+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
    add(tail);
    return new Blob(parts,{type:'application/pdf'});
  }

  function drawReportCanvas(d){
    const W=1240,H=1754,M=70;
    const c=document.createElement('canvas');
    c.width=W;c.height=H;
    const ctx=c.getContext('2d',{alpha:false});
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#111827';
    ctx.fillRect(0,0,W,170);

    function font(size,bold){ctx.font=(bold?'700 ':'400 ')+size+'px Arial, Helvetica, sans-serif'}
    function text(v,x,y,size,bold,color,align){
      font(size,bold);ctx.fillStyle=color||'#111827';ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';ctx.fillText(String(v??''),x,y);
    }
    function line(y,color){ctx.strokeStyle=color||'#d1d5db';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke()}
    function box(x,y,w,h,fill,stroke){
      if(fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}
    }
    function row(label,monthly,perKg,y,strong){
      if(strong)box(M,y-32,W-M*2,48,'#f8fafc');
      text(label,M+12,y,22,!!strong,'#111827');
      text(monthly,W-390,y,21,!!strong,'#111827','right');
      text(perKg,W-M-12,y,21,!!strong,strong?'#b45309':'#111827','right');
      line(y+16,'#e5e7eb');
      return y+50;
    }
    function wrap(v,x,y,maxW,size,color,bold){
      font(size,!!bold);ctx.fillStyle=color||'#374151';ctx.textAlign='left';ctx.textBaseline='alphabetic';
      const words=String(v??'').split(/\s+/);let ln='',yy=y;
      for(const word of words){
        const test=ln?ln+' '+word:word;
        if(ctx.measureText(test).width>maxW&&ln){ctx.fillText(ln,x,yy);ln=word;yy+=size+8}else ln=test;
      }
      if(ln)ctx.fillText(ln,x,yy);
      return yy;
    }

    text('DF EXTRUSOR PRO',M,72,34,true,'#f8fafc');
    text('RELATÓRIO DE CUSTO FABRIL',M,118,29,true,'#f59e0b');
    const now=new Date();
    const stamp=now.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    text('Gerado em '+stamp,W-M,118,18,false,'#cbd5e1','right');

    let y=220;
    text('RESUMO PRINCIPAL',M,y,22,true,'#92400e');y+=28;
    box(M,y,W-M*2,112,'#fff7ed','#fdba74');
    text('Produção mensal',M+22,y+38,18,true,'#7c2d12');
    text(reportNumber(d.prod,0)+' kg',M+22,y+78,30,true,'#111827');
    text('Custo industrial',M+365,y+38,18,true,'#7c2d12');
    text(kgMoney(d.industrialKg),M+365,y+78,30,true,'#111827');
    text('CUSTO FINAL DO PRODUTO',W-M-22,y+38,18,true,'#166534','right');
    text(kgMoney(d.finalKg),W-M-22,y+80,34,true,'#15803d','right');
    y+=155;

    text('DETALHAMENTO DOS CUSTOS',M,y,22,true,'#111827');y+=36;
    text('Item',M+12,y,18,true,'#6b7280');
    text('Valor mensal',W-390,y,18,true,'#6b7280','right');
    text('Impacto por kg',W-M-12,y,18,true,'#6b7280','right');
    line(y+14,'#9ca3af');y+=48;

    y=row('Aluguel',money(d.aluguel),kgMoney(d.aluguelKg),y,false);
    y=row('Energia elétrica',money(d.energia),kgMoney(d.energiaKg),y,false);
    y=row('Folha salarial total',money(d.folha),kgMoney(d.folhaKg),y,false);
    y=row('Reprocesso da apara',money(d.reprocMes),kgMoney(d.reprocKg),y,false);
    y=row('Embalagem personalizada',money(d.embalagem),kgMoney(d.embalagemKg),y,false);
    y=row('Manutenção fabril',money(d.manMes),kgMoney(d.manKg),y,false);
    if(d.depOn)y=row('Depreciação das máquinas',money(d.depMes),kgMoney(d.depKg),y,false);
    y=row('Custo industrial',money(d.industrialMes),kgMoney(d.industrialKg),y,true);
    y=row('Formulação',money(d.formulaMes),kgMoney(d.formula),y,false);
    y=row('TOTAL DOS CUSTOS MENSAIS',money(d.totalMensal),kgMoney(d.finalKg),y,true);

    y+=26;
    text('APARA E REPROCESSO',M,y,21,true,'#111827');y+=34;
    box(M,y,W-M*2,112,'#f9fafb','#d1d5db');
    text('Apara total: '+reportNumber(d.apara,0)+' kg/mês',M+18,y+30,18,true,'#111827');
    text('Percentual de apara: '+pct(d.aparaPct),M+18,y+60,18,false,'#374151');
    text('Custo de reprocesso: '+kgMoney(d.reprocUnit),M+18,y+90,18,false,'#374151');
    text('Custo mensal do reprocesso: '+money(d.reprocMes),W-M-18,y+30,18,true,'#111827','right');
    text('Reprocesso por kg produzido: '+kgMoney(d.reprocKg),W-M-18,y+65,18,false,'#374151','right');
    y+=145;

    text('MANUTENÇÃO E DEPRECIAÇÃO',M,y,21,true,'#111827');y+=34;
    box(M,y,W-M*2,d.depOn?170:135,'#f9fafb','#d1d5db');
    const manText=d.manMode==='percentual'
      ?'Manutenção por percentual: '+pct(d.manPct)+' sobre a base de '+money(d.baseMan)+'.'
      :'Manutenção por valor mensal informado: '+money(d.manMes)+'.';
    wrap(manText,M+18,y+34,W-M*2-36,18,'#374151',false);
    text('Manutenção por kg: '+kgMoney(d.manKg),M+18,y+70,18,true,'#111827');
    if(d.depOn){
      text('Depreciação incluída: SIM',M+18,y+108,18,true,'#111827');
      text('Base: '+money(d.depBase)+' | Percentual mensal: '+pct(d.depPct)+' | Depreciação mensal: '+money(d.depMes),M+18,y+140,17,false,'#374151');
    }else{
      text('Depreciação incluída: NÃO',M+18,y+108,18,true,'#6b7280');
    }
    y+=d.depOn?205:170;

    text('COMO O RESULTADO FOI CALCULADO',M,y,21,true,'#111827');y+=34;
    const notes=[
      'Cada custo por kg é calculado dividindo o respectivo custo mensal pela produção mensal.',
      'O custo do reprocesso é apara total (kg) × custo de reprocesso (R$/kg).',
      d.manMode==='percentual'
        ?'A manutenção percentual é aplicada sobre aluguel + energia + folha + reprocesso + embalagem'+(d.depOn?' + depreciação':'')+'.'
        :'A manutenção foi lançada pelo valor mensal informado.',
      d.depOn
        ?'A depreciação mensal é base de cálculo × percentual mensal.'
        :'A depreciação não foi incluída neste relatório.',
      'Custo industrial por kg = custos fabris mensais ÷ produção mensal.',
      'Custo final por kg = custo industrial por kg + preço da formulação por kg.'
    ];
    for(const n of notes){text('•',M+4,y,19,true,'#f59e0b');y=wrap(n,M+28,y,W-M*2-28,17,'#374151',false)+30}

    text('Relatório gerado pelo DF EXTRUSOR PRO',W/2,H-42,15,false,'#9ca3af','center');
    return c;
  }

  function loadingPdfWindow(w){
    try{
      w.document.open();
      w.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#111;font-family:system-ui"><div style="font-weight:800">Gerando relatório de custo fabril...</div></body>');
      w.document.close();
    }catch(e){}
  }

  function gerarRelatorioPdf(){
    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou o PDF. Libere pop-ups para este site e tente novamente.');return}
    loadingPdfWindow(w);
    try{
      const d=reportData();
      const canvas=drawReportCanvas(d);
      const jpeg=dataUrlBytes(canvas.toDataURL('image/jpeg',0.96));
      const blob=makeImagePdf(jpeg,canvas.width,canvas.height);
      const url=URL.createObjectURL(blob);
      try{w.location.replace(url)}catch(e){w.location.href=url}
      setTimeout(()=>{try{URL.revokeObjectURL(url)}catch(e){}},600000);
    }catch(e){
      console.error('DF Custo Fabril PDF',e);
      try{
        w.document.open();
        w.document.write('<!doctype html><body style="font-family:system-ui;padding:32px"><b>Não foi possível gerar o PDF.</b><div style="margin-top:10px">Feche esta janela e tente novamente.</div></body>');
        w.document.close();
      }catch(_){}
    }
  }

  function ensure(attempt){
    attempt=attempt||0;
    if(build())return;
    if(attempt<24)setTimeout(()=>ensure(attempt+1),200);
  }

  function boot(){
    ensure(0);
    document.addEventListener('click',e=>{
      if(e.target&&e.target.closest&&e.target.closest('[data-cost-mode="fabril"]'))setTimeout(()=>{ensure(0);calc()},40);
    },true);
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>ensure(0),80));
    window.addEventListener('pageshow',()=>setTimeout(()=>ensure(0),80));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();