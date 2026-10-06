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