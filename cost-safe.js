(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const num=v=>window.parseNum?window.parseNum(v):(parseFloat(String(v||'').replace(',','.'))||0);
  const get=id=>num($(id)?.value);
  const getQtd=id=>{
    const e=$(id); if(!e) return 0;
    const s=String(e.value||'').trim().replace(/\s/g,'');
    if(!s) return 0;
    if(/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g,''),10)||0;
    if(/^\d{1,3}(,\d{3})+$/.test(s)) return parseInt(s.replace(/,/g,''),10)||0;
    const n=parseInt(s.replace(/\D/g,''),10);
    return Number.isFinite(n)?n:0;
  };
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const rs=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};

  const MODE_KEY='df_custo_lucro_modo_v1';
  const CONFIG_KEY='df_custo_config_v1';
  let timer=null;

  function schedule(){clearTimeout(timer);timer=setTimeout(calc,170)}
  function densSacola(){const s=$('saDs');if(!s)return 0;return s.value==='manual'?get('saDm'):num(s.value)}
  function sacolaInput(quantidade){return{largura:get('saL'),comprimento:get('saC'),micra:get('saM'),densidade:densSacola(),descontoPct:get('saDes'),quantidade:Number(quantidade)||0}}
  function lucroModo(){return $('cuLucroModo')?.value||localStorage.getItem(MODE_KEY)||'markup'}
  function precoModo(){return $('cuPrecoModo')?.value||'percentual'}

  function precoPorPercentual(custo,pct,modo){
    if(!(custo>0))return 0;
    if(modo==='margin'){
      if(!(pct>=0&&pct<100))return NaN;
      return custo/(1-pct/100);
    }
    return custo*(1+pct/100);
  }

  function lerConfig(){
    try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')||{}}catch(_){return{}}
  }
  function salvarConfig(){
    const ids=['cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuPrecoModo','cuVendaTipo','cuVendaAlvo','cuLucroPct','cuLucroModo'];
    const c={};
    ids.forEach(id=>{const e=$(id);if(e)c[id]=e.value});
    try{localStorage.setItem(CONFIG_KEY,JSON.stringify(c))}catch(_){}
  }
  function aplicarConfig(){
    const c=lerConfig();
    Object.entries(c).forEach(([id,v])=>{const e=$(id);if(e&&v!==undefined&&v!==null)e.value=v});
    const modoSalvo=localStorage.getItem(MODE_KEY)||c.cuLucroModo||'markup';
    if($('cuLucroModo'))$('cuLucroModo').value=modoSalvo==='margin'?'margin':'markup';
  }

  function atualizarExplicacao(){
    const modo=lucroModo(),pct=get('cuLucroPct');
    const el=$('cuLucroModoInfo');
    if(el){
      if(modo==='margin'){
        if(pct>=100){el.textContent='A margem sobre a venda precisa ser menor que 100%.';el.style.color='#fca5a5'}
        else{
          const markup=pct>0?(pct/(100-pct))*100:0;
          el.textContent=pct>0
            ? fmt(pct,2)+'% de margem sobre a venda. Ex.: custo R$ 100 → venda R$ '+fmt(100/(1-pct/100),2)+'. Acréscimo equivalente sobre o custo: '+fmt(markup,2)+'%.'
            : 'Margem sobre venda: o lucro é uma porcentagem do preço final. Ex.: custo R$ 100 com 50% de margem → venda R$ 200.';
          el.style.color='#94a3b8';
        }
      }else{
        const margem=pct>0?(pct/(100+pct))*100:0;
        el.textContent=pct>0
          ? fmt(pct,2)+'% sobre o custo. Ex.: custo R$ 100 → venda R$ '+fmt(100*(1+pct/100),2)+'. Margem real sobre a venda: '+fmt(margem,2)+'%.'
          : 'Lucro sobre custo (Markup): o percentual é acrescentado ao custo. Ex.: custo R$ 100 + 50% → venda R$ 150.';
        el.style.color='#94a3b8';
      }
    }

    const inv=$('cuPrecoInversoBox');
    const pctBox=$('cuPercentualBox');
    const inverso=precoModo()==='inverso';
    if(inv)inv.style.display=inverso?'block':'none';
    if(pctBox)pctBox.style.display=inverso?'none':'block';

    const pinfo=$('cuPrecoModoInfo');
    if(pinfo){
      pinfo.textContent=inverso
        ? 'Você informa o preço que quer cobrar e o app calcula automaticamente lucro, markup e margem reais.'
        : 'O app calcula o preço de venda a partir do percentual escolhido.';
    }
  }

  async function sacolaData(){
    if(typeof window.dfCalc!=='function')return{};
    const base=await window.dfCalc('sacola',sacolaInput(0));
    const pesoUnidade=Number(base&&base.pesoUnidade)||0;
    const pesoAlvo=get('saPesoAlvo');
    const qtdDigitada=get('saQ');
    let quantidade=0,origem='';

    if(pesoAlvo>0&&pesoUnidade>0){
      quantidade=Math.max(1,Math.round((pesoAlvo*1000)/pesoUnidade));
      origem='peso';
    }else if(qtdDigitada>0){
      quantidade=Math.max(1,Math.round(qtdDigitada));
      origem='quantidade';
    }

    if(!(quantidade>0))return{...base,quantidadeUsada:0,origem:'',pesoAlvo:0};
    const completo=await window.dfCalc('sacola',sacolaInput(quantidade));
    return{...completo,quantidadeUsada:quantidade,origem,pesoAlvo};
  }

  async function fillFromSacolas(force=false){
    const auto=$('cuAuto');
    if(!force&&auto&&!auto.checked)return;
    try{
      const d=await sacolaData();
      const peso=Number(d&&d.pesoQuantidadeKg)||0;
      const qtd=Number(d&&d.quantidadeUsada)||0;
      const pesoUnidade=Number(d&&d.pesoUnidade)||0;

      if($('cuPeso'))$('cuPeso').value=peso>0?fmt(peso,3):'';
      if($('cuUnid'))$('cuUnid').value=qtd>0?String(Math.round(qtd)):'';

      if(peso>0&&qtd>0){
        if(d.origem==='peso'){
          set('cuAutoInfo','Puxado automaticamente da aba Sacolas pelo peso desejado de '+fmt(d.pesoAlvo,3)+' kg: '+fmt(qtd,0)+' sacolas por rolo • peso calculado '+fmt(peso,3)+' kg • '+fmt(pesoUnidade,2)+' g por sacola');
        }else{
          set('cuAutoInfo','Puxado automaticamente da aba Sacolas: '+fmt(pesoUnidade,2)+' g por sacola • '+fmt(qtd,0)+' sacolas por rolo • '+fmt(peso,3)+' kg por rolo');
        }
      }else set('cuAutoInfo','Preencha a aba Sacolas ou digite manualmente abaixo.');
    }catch(e){
      console.error('DF custo automático:',e);
      set('cuAutoInfo','Não consegui puxar os dados da aba Sacolas.');
    }
  }

  function vendaRoloInversa(peso,unid){
    const valor=get('cuVendaAlvo');
    const tipo=$('cuVendaTipo')?.value||'sacola';
    if(!(valor>0))return 0;
    if(tipo==='rolo')return valor;
    if(tipo==='kg')return peso>0?valor*peso:0;
    return unid>0?valor*unid:0;
  }

  async function calc(){
    if(typeof window.dfCalc!=='function')return;
    await fillFromSacolas(false);
    atualizarExplicacao();

    const peso=get('cuPeso');
    const unid=getQtd('cuUnid');
    const custoMaterialKg=get('cuKg');
    const qtdRolos=Math.max(1,getQtd('cuQtd')||1);

    const energiaKg=get('cuEnergiaKg');
    const maoKg=get('cuMaoKg');
    const reprocessoKg=get('cuReprocessoKg');
    const outrosKg=get('cuOutrosKg');
    const embalagemRolo=get('cuEmbalagemRolo');
    const freteRolo=get('cuFreteRolo');
    const impostoPct=get('cuImpostoPct');
    const comissaoPct=get('cuComissaoPct');
    const lucroPct=get('cuLucroPct');
    const modo=lucroModo();

    try{
      const base=await window.dfCalc('custo',{pesoKg:peso,custoKg:custoMaterialKg,vendaKg:custoMaterialKg,quantidade:qtdRolos});
      const custoResinaRolo=Number(base.custoUnidade)||0;
      const custoFabrilKg=energiaKg+maoKg+reprocessoKg+outrosKg;
      const custoFabrilRolo=(peso*custoFabrilKg)+embalagemRolo+freteRolo;
      const custoRealRolo=custoResinaRolo+custoFabrilRolo;
      const custoRealKg=peso>0?custoRealRolo/peso:0;
      const custoUnid=unid>0?custoRealRolo/unid:0;

      let vendaRolo=0;
      if(precoModo()==='inverso'){
        vendaRolo=vendaRoloInversa(peso,unid);
      }else{
        vendaRolo=precoPorPercentual(custoRealRolo,lucroPct,modo);
        if(!Number.isFinite(vendaRolo)){
          set('cuLucro','MARGEM INVÁLIDA');
          ['cuVendaRolo','cuPrecoUnid','cuLucroRolo','cuVendaTotal','cuLucroTotal','cuLucroLiquidoRolo','cuLucroLiquidoTotal'].forEach(id=>set(id,'—'));
          return;
        }
      }

      const vendaUnid=unid>0?vendaRolo/unid:0;
      const vendaKg=peso>0?vendaRolo/peso:0;
      const lucroBrutoRolo=vendaRolo-custoRealRolo;
      const impostoRolo=vendaRolo*(impostoPct/100);
      const comissaoRolo=vendaRolo*(comissaoPct/100);
      const despesasVendaRolo=impostoRolo+comissaoRolo;
      const lucroLiquidoRolo=lucroBrutoRolo-despesasVendaRolo;

      const vendaTotal=vendaRolo*qtdRolos;
      const custoTotal=custoRealRolo*qtdRolos;
      const lucroBrutoTotal=lucroBrutoRolo*qtdRolos;
      const despesasTotal=despesasVendaRolo*qtdRolos;
      const lucroLiquidoTotal=lucroLiquidoRolo*qtdRolos;

      const markupReal=custoRealRolo>0?((vendaRolo/custoRealRolo)-1)*100:0;
      const margemReal=vendaRolo>0?(lucroBrutoRolo/vendaRolo)*100:0;
      const margemLiquida=vendaRolo>0?(lucroLiquidoRolo/vendaRolo)*100:0;

      let titulo='';
      if(precoModo()==='inverso') titulo='PREÇO INFORMADO';
      else titulo=modo==='margin'?'MARGEM '+fmt(lucroPct,2)+'%':'MARKUP +'+fmt(lucroPct,2)+'%';

      set('cuLucro',titulo+' • lucro líquido total '+(vendaRolo>0?rs(lucroLiquidoTotal):'—'));
      set('cuCustoResinaRolo',custoResinaRolo?rs(custoResinaRolo):'—');
      set('cuCustoFabrilRolo',custoFabrilRolo?rs(custoFabrilRolo):rs(0));
      set('cuCustoRealKg',custoRealKg?rs(custoRealKg)+'/kg':'—');
      set('cuCustoRolo',custoRealRolo?rs(custoRealRolo):'—');
      set('cuVendaRolo',vendaRolo?rs(vendaRolo):'—');
      set('cuPrecoKg',vendaKg?rs(vendaKg)+'/kg':'—');
      set('cuPrecoUnid',vendaUnid?rs(vendaUnid):'—');
      set('cuCustoUnid',custoUnid?rs(custoUnid):'—');
      set('cuLucroRolo',lucroBrutoRolo?rs(lucroBrutoRolo):'—');
      set('cuDespesasRolo',vendaRolo?rs(despesasVendaRolo):'—');
      set('cuLucroLiquidoRolo',vendaRolo?rs(lucroLiquidoRolo):'—');
      set('cuVendaTotal',vendaTotal?rs(vendaTotal):'—');
      set('cuCustoTotal',custoTotal?rs(custoTotal):'—');
      set('cuLucroTotal',vendaRolo?rs(lucroBrutoTotal):'—');
      set('cuDespesasTotal',vendaRolo?rs(despesasTotal):'—');
      set('cuLucroLiquidoTotal',vendaRolo?rs(lucroLiquidoTotal):'—');

      set('cuMarkupReal',vendaRolo?fmt(markupReal,2)+'%':'—');
      set('cuMargemReal',vendaRolo?fmt(margemReal,2)+'%':'—');
      set('cuMargemLiquida',vendaRolo?fmt(margemLiquida,2)+'%':'—');

      const invInfo=$('cuVendaAlvoInfo');
      if(invInfo&&precoModo()==='inverso'){
        invInfo.textContent=vendaRolo>0
          ? 'Preço informado resulta em '+fmt(markupReal,2)+'% sobre o custo, '+fmt(margemReal,2)+'% de margem bruta e '+fmt(margemLiquida,2)+'% de margem líquida.'
          : 'Informe um preço válido para calcular o resultado.';
      }

      salvarConfig();
    }catch(e){console.error(e)}
  }

  function build(){
    const pg=$('pgCu');
    if(!pg||pg.dataset.dfCustoAuto==='1')return;
    pg.dataset.dfCustoAuto='1';

    pg.innerHTML='<div class="card">'+
      '<span class="tag">Custo</span><h2>Custo e venda automático</h2>'+
      '<div class="hint">Puxa peso e quantidade da aba Sacolas e calcula custo real, venda, lucro bruto e lucro líquido.</div>'+
      '<button id="cuPull" class="calcBtn alt" type="button">PUXAR DADOS DA ABA SACOLAS</button>'+
      '<label style="display:flex;gap:9px;align-items:center;margin-top:12px"><input id="cuAuto" type="checkbox" checked style="width:auto"> Preencher automático pela aba Sacolas</label>'+
      '<div id="cuAutoInfo" class="smallNote">Preencha a aba Sacolas ou digite manualmente abaixo.</div>'+

      '<h3 style="margin:18px 0 8px">1. Dados do produto</h3>'+
      '<div class="grid">'+
        '<div><label>Peso do rolo (kg)</label><input id="cuPeso" class="main" inputmode="decimal" placeholder="Ex.: 6"></div>'+
        '<div><label>Sacolas por rolo</label><input id="cuUnid" class="main" inputmode="numeric" placeholder="Ex.: 2000"></div>'+
        '<div><label>Custo da resina por kg</label><input id="cuKg" class="main" inputmode="decimal" placeholder="Ex.: 7,50"><div class="smallNote">Valor médio do material/resina usado no produto.</div></div>'+
        '<div><label>Quantidade de rolos</label><input id="cuQtd" class="main" inputmode="numeric" placeholder="Ex.: 10"></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">2. Custo fabril</h3>'+
      '<div class="hint">Todos são opcionais. Deixe 0 ou vazio quando não quiser incluir.</div>'+
      '<div class="grid">'+
        '<div><label>Energia (R$/kg)</label><input id="cuEnergiaKg" class="main" inputmode="decimal" placeholder="Ex.: 0,45"><div class="smallNote">Custo de energia para produzir cada kg.</div></div>'+
        '<div><label>Mão de obra (R$/kg)</label><input id="cuMaoKg" class="main" inputmode="decimal" placeholder="Ex.: 0,60"><div class="smallNote">Custo de mão de obra rateado por kg.</div></div>'+
        '<div><label>Reprocesso / apara (R$/kg)</label><input id="cuReprocessoKg" class="main" inputmode="decimal" placeholder="Ex.: 0,20"><div class="smallNote">Custo adicional de moagem, reprocesso ou perdas.</div></div>'+
        '<div><label>Outros custos (R$/kg)</label><input id="cuOutrosKg" class="main" inputmode="decimal" placeholder="Ex.: 0,15"><div class="smallNote">Outros custos fabris variáveis por kg.</div></div>'+
        '<div><label>Embalagem (R$/rolo)</label><input id="cuEmbalagemRolo" class="main" inputmode="decimal" placeholder="Ex.: 1,50"><div class="smallNote">Tubete, saco, etiqueta e embalagem do rolo.</div></div>'+
        '<div><label>Frete / custo fixo (R$/rolo)</label><input id="cuFreteRolo" class="main" inputmode="decimal" placeholder="Ex.: 2,00"><div class="smallNote">Valor fixo que deseja acrescentar em cada rolo.</div></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">3. Impostos e comissão</h3>'+
      '<div class="grid">'+
        '<div><label>Impostos sobre a venda (%)</label><input id="cuImpostoPct" class="main" inputmode="decimal" placeholder="Ex.: 8"><div class="smallNote">Percentual descontado do valor vendido.</div></div>'+
        '<div><label>Comissão do vendedor (%)</label><input id="cuComissaoPct" class="main" inputmode="decimal" placeholder="Ex.: 3"><div class="smallNote">Comissão calculada sobre o valor da venda.</div></div>'+
      '</div>'+

      '<h3 style="margin:18px 0 8px">4. Formação do preço</h3>'+
      '<div class="grid">'+
        '<div><label>Como deseja formar o preço?</label><select id="cuPrecoModo" class="main"><option value="percentual">Calcular pelo percentual</option><option value="inverso">Quero informar o preço de venda</option></select><div id="cuPrecoModoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
      '</div>'+

      '<div id="cuPercentualBox">'+
        '<div class="grid">'+
          '<div><label>Tipo de lucro</label><select id="cuLucroModo" class="main"><option value="markup">Lucro sobre custo (Markup)</option><option value="margin">Margem sobre venda</option></select><div id="cuLucroModoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
          '<div><label>Percentual desejado (%)</label><input id="cuLucroPct" class="main" inputmode="decimal" placeholder="Ex.: 50"></div>'+
        '</div>'+
      '</div>'+

      '<div id="cuPrecoInversoBox" style="display:none">'+
        '<div class="grid">'+
          '<div><label>Quero vender por</label><select id="cuVendaTipo" class="main"><option value="sacola">Preço por sacola</option><option value="rolo">Preço por rolo</option><option value="kg">Preço por kg</option></select></div>'+
          '<div><label>Preço desejado (R$)</label><input id="cuVendaAlvo" class="main" inputmode="decimal" placeholder="Ex.: 0,08"><div id="cuVendaAlvoInfo" class="smallNote" style="margin-top:6px"></div></div>'+
        '</div>'+
      '</div>'+

      '<div class="result"><span>LUCRO LÍQUIDO TOTAL ESTIMADO</span><b id="cuLucro">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Resumo por rolo</h3>'+
      '<div class="kpi"><span>Custo da resina por rolo</span><b id="cuCustoResinaRolo">—</b></div>'+
      '<div class="kpi"><span>Custo fabril por rolo</span><b id="cuCustoFabrilRolo">—</b></div>'+
      '<div class="kpi"><span>Custo real por kg</span><b id="cuCustoRealKg">—</b></div>'+
      '<div class="kpi"><span>Custo real por rolo</span><b id="cuCustoRolo">—</b></div>'+
      '<div class="kpi"><span>Preço de venda por kg</span><b id="cuPrecoKg">—</b></div>'+
      '<div class="kpi"><span>Preço de venda por rolo</span><b id="cuVendaRolo">—</b></div>'+
      '<div class="kpi"><span>Preço por unidade / sacola</span><b id="cuPrecoUnid">—</b></div>'+
      '<div class="kpi"><span>Custo por unidade / sacola</span><b id="cuCustoUnid">—</b></div>'+
      '<div class="kpi"><span>Lucro bruto por rolo</span><b id="cuLucroRolo">—</b></div>'+
      '<div class="kpi"><span>Impostos + comissão por rolo</span><b id="cuDespesasRolo">—</b></div>'+
      '<div class="kpi"><span>Lucro líquido por rolo</span><b id="cuLucroLiquidoRolo">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Percentuais reais</h3>'+
      '<div class="kpi"><span>Markup real sobre o custo</span><b id="cuMarkupReal">—</b></div>'+
      '<div class="kpi"><span>Margem bruta sobre a venda</span><b id="cuMargemReal">—</b></div>'+
      '<div class="kpi"><span>Margem líquida sobre a venda</span><b id="cuMargemLiquida">—</b></div>'+

      '<h3 style="margin:18px 0 8px">Totais do pedido</h3>'+
      '<div class="kpi"><span>Venda total</span><b id="cuVendaTotal">—</b></div>'+
      '<div class="kpi"><span>Custo total</span><b id="cuCustoTotal">—</b></div>'+
      '<div class="kpi"><span>Lucro bruto total</span><b id="cuLucroTotal">—</b></div>'+
      '<div class="kpi"><span>Impostos + comissão total</span><b id="cuDespesasTotal">—</b></div>'+
      '<div class="kpi"><span>Lucro líquido total</span><b id="cuLucroLiquidoTotal">—</b></div>'+
    '</div>';

    aplicarConfig();
    atualizarExplicacao();

    const ids=['cuPeso','cuUnid','cuKg','cuQtd','cuEnergiaKg','cuMaoKg','cuReprocessoKg','cuOutrosKg','cuEmbalagemRolo','cuFreteRolo','cuImpostoPct','cuComissaoPct','cuLucroPct','cuVendaAlvo','cuAuto'];
    ids.forEach(id=>$(id)?.addEventListener('input',()=>{salvarConfig();schedule()}));

    ['cuLucroModo','cuPrecoModo','cuVendaTipo'].forEach(id=>$(id)?.addEventListener('change',()=>{
      if(id==='cuLucroModo')localStorage.setItem(MODE_KEY,lucroModo());
      salvarConfig();atualizarExplicacao();schedule();
    }));

    ['cuPeso','cuUnid'].forEach(id=>$(id)?.addEventListener('input',()=>{if($('cuAuto'))$('cuAuto').checked=false;schedule()}));
    $('cuPull')?.addEventListener('click',async()=>{if($('cuAuto'))$('cuAuto').checked=true;await fillFromSacolas(true);schedule()});

    ['saL','saC','saM','saQ','saPesoAlvo','saDes','saDm','saDs'].forEach(id=>{
      const e=$(id);e?.addEventListener('input',schedule);e?.addEventListener('change',schedule);
    });

    window.addEventListener('hashchange',()=>{if(location.hash==='#custo')schedule()});
    window.addEventListener('focus',schedule);
    window.calcCu=calc;
    fillFromSacolas(true).then(calc);
  }

  function init(){build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200));else setTimeout(init,200);
})();
