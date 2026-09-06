(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const num=v=>window.parseNum?window.parseNum(v):(parseFloat(String(v||'').replace(',','.'))||0);
  const get=id=>num($(id)?.value);
  const getQtd=id=>{const e=$(id);if(!e)return 0;const s=String(e.value||'').trim().replace(/\s/g,'');if(!s)return 0;if(/^\d{1,3}(\.\d{3})+$/.test(s))return parseInt(s.replace(/\./g,''),10)||0;if(/^\d{1,3}(,\d{3})+$/.test(s))return parseInt(s.replace(/,/g,''),10)||0;const n=parseInt(s.replace(/\D/g,''),10);return Number.isFinite(n)?n:0};
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const rs=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};
  const MODE_KEY='df_custo_lucro_modo_v1';
  let timer=null;

  function schedule(){clearTimeout(timer);timer=setTimeout(calc,170)}
  function densSacola(){const s=$('saDs');if(!s)return 0;return s.value==='manual'?get('saDm'):num(s.value)}
  function sacolaInput(quantidade){return{largura:get('saL'),comprimento:get('saC'),micra:get('saM'),densidade:densSacola(),descontoPct:get('saDes'),quantidade:Number(quantidade)||0}}
  function lucroModo(){return $('cuLucroModo')?.value||localStorage.getItem(MODE_KEY)||'markup'}
  function vendaKgPorModo(custoKg,pct,modo){
    if(!(custoKg>0))return 0;
    if(modo==='margin'){
      if(!(pct>=0&&pct<100))return NaN;
      return custoKg/(1-pct/100);
    }
    return custoKg*(1+pct/100);
  }
  function atualizarExplicacao(){
    const modo=lucroModo(),pct=get('cuLucroPct');
    const el=$('cuLucroModoInfo');
    if(!el)return;
    if(modo==='margin'){
      if(pct>=100){el.textContent='A margem sobre a venda precisa ser menor que 100%.';el.style.color='#fca5a5';return}
      const markup=pct>0?(pct/(100-pct))*100:0;
      el.textContent=pct>0
        ? fmt(pct,2)+'% de margem sobre a venda. Ex.: custo R$ 100 → venda R$ '+fmt(100/(1-pct/100),2)+'. Acréscimo equivalente sobre o custo: '+fmt(markup,2)+'%.'
        : 'Margem sobre venda: o lucro é uma porcentagem do preço final. Ex.: custo R$ 100 com 50% de margem → venda R$ 200.';
      el.style.color='#94a3b8';
    }else{
      const margem=pct>0?(pct/(100+pct))*100:0;
      el.textContent=pct>0
        ? fmt(pct,2)+'% sobre o custo. Ex.: custo R$ 100 → venda R$ '+fmt(100*(1+pct/100),2)+'. Margem real sobre a venda: '+fmt(margem,2)+'%.'
        : 'Lucro sobre custo (Markup): o percentual é acrescentado ao custo. Ex.: custo R$ 100 + 50% → venda R$ 150.';
      el.style.color='#94a3b8';
    }
  }

  async function sacolaData(){
    if(typeof window.dfCalc!=='function')return{};
    const base=await window.dfCalc('sacola',sacolaInput(0));
    const pesoUnidade=Number(base&&base.pesoUnidade)||0;
    const pesoAlvo=get('saPesoAlvo');
    const qtdDigitada=get('saQ');
    let quantidade=0;
    let origem='';

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
      }else{
        set('cuAutoInfo','Preencha a aba Sacolas ou digite manualmente abaixo.');
      }
    }catch(e){
      console.error('DF custo automático:',e);
      set('cuAutoInfo','Não consegui puxar os dados da aba Sacolas.');
    }
  }

  async function calc(){
    if(typeof window.dfCalc!=='function')return;
    await fillFromSacolas(false);
    const peso=get('cuPeso'),unid=getQtd('cuUnid'),custoKg=get('cuKg'),lucroPct=get('cuLucroPct'),qtdRolos=get('cuQtd')||1,modo=lucroModo();
    atualizarExplicacao();
    const vendaKg=vendaKgPorModo(custoKg,lucroPct,modo);
    if(!Number.isFinite(vendaKg)){
      set('cuLucro','MARGEM INVÁLIDA');
      ['cuVendaRolo','cuPrecoUnid','cuLucroRolo','cuVendaTotal','cuLucroTotal'].forEach(id=>set(id,'—'));
      return;
    }
    try{
      const r=await window.dfCalc('custo',{pesoKg:peso,custoKg,vendaKg,quantidade:qtdRolos});
      const custoRolo=Number(r.custoUnidade)||0,vendaRolo=Number(r.vendaUnidade)||0,lucroRolo=Number(r.lucroUnidade)||0;
      const custoUnid=unid>0?custoRolo/unid:0,vendaUnid=unid>0?vendaRolo/unid:0;
      const titulo=modo==='margin'?'MARGEM '+fmt(lucroPct,2)+'%':'MARKUP +'+fmt(lucroPct,2)+'%';
      set('cuLucro',titulo+' = '+(custoRolo?rs(Number(r.lucroTotal)||0):'—'));
      set('cuCustoRolo',custoRolo?rs(custoRolo):'—');
      set('cuVendaRolo',vendaRolo?rs(vendaRolo):'—');
      set('cuPrecoUnid',vendaUnid?rs(vendaUnid):'—');
      set('cuCustoUnid',custoUnid?rs(custoUnid):'—');
      set('cuLucroRolo',lucroRolo?rs(lucroRolo):'—');
      set('cuVendaTotal',r.vendaTotal?rs(r.vendaTotal):'—');
      set('cuCustoTotal',r.custoTotal?rs(r.custoTotal):'—');
      set('cuLucroTotal',r.lucroTotal?rs(r.lucroTotal):'—');
    }catch(e){console.error(e)}
  }

  function build(){
    const pg=$('pgCu');
    if(!pg||pg.dataset.dfCustoAuto==='1')return;
    pg.dataset.dfCustoAuto='1';
    pg.innerHTML='<div class="card"><span class="tag">Custo</span><h2>Custo e venda automático</h2><div class="hint">Puxa automaticamente o peso do rolo e a quantidade de sacolas da aba Sacolas, inclusive quando você calcula a quantidade pelo peso desejado do rolo. Também permite digitar tudo manualmente.</div><button id="cuPull" class="calcBtn alt" type="button">PUXAR DADOS DA ABA SACOLAS</button><label style="display:flex;gap:9px;align-items:center;margin-top:12px"><input id="cuAuto" type="checkbox" checked style="width:auto"> Preencher automático pela aba Sacolas</label><div id="cuAutoInfo" class="smallNote">Preencha a aba Sacolas ou digite manualmente abaixo.</div><div class="grid"><div><label>Peso do rolo (kg)</label><input id="cuPeso" class="main" inputmode="decimal" placeholder="Ex.: 6"></div><div><label>Sacolas por rolo</label><input id="cuUnid" class="main" inputmode="numeric" placeholder="Ex.: 2000"></div><div><label>Custo do material por kg</label><input id="cuKg" class="main" inputmode="decimal" placeholder="Ex.: 7,50"></div><div><label>Tipo de lucro</label><select id="cuLucroModo" class="main"><option value="markup">Lucro sobre custo (Markup)</option><option value="margin">Margem sobre venda</option></select><div id="cuLucroModoInfo" class="smallNote" style="margin-top:6px"></div></div><div><label>Percentual desejado (%)</label><input id="cuLucroPct" class="main" inputmode="decimal" placeholder="Ex.: 50"></div><div><label>Quantidade de rolos</label><input id="cuQtd" class="main" inputmode="numeric" placeholder="Ex.: 10"></div></div><div class="result"><span>LUCRO TOTAL ESTIMADO</span><b id="cuLucro">—</b></div><div class="kpi"><span>Custo por rolo</span><b id="cuCustoRolo">—</b></div><div class="kpi"><span>Preço de venda por rolo</span><b id="cuVendaRolo">—</b></div><div class="kpi"><span>Preço por unidade / sacola</span><b id="cuPrecoUnid">—</b></div><div class="kpi"><span>Custo por unidade / sacola</span><b id="cuCustoUnid">—</b></div><div class="kpi"><span>Lucro por rolo</span><b id="cuLucroRolo">—</b></div><div class="kpi"><span>Venda total</span><b id="cuVendaTotal">—</b></div><div class="kpi"><span>Custo total</span><b id="cuCustoTotal">—</b></div><div class="kpi"><span>Lucro total</span><b id="cuLucroTotal">—</b></div></div>';

    const modoSalvo=localStorage.getItem(MODE_KEY)||'markup';
    if($('cuLucroModo'))$('cuLucroModo').value=modoSalvo==='margin'?'margin':'markup';
    atualizarExplicacao();
    ['cuPeso','cuUnid','cuKg','cuLucroPct','cuQtd','cuAuto'].forEach(id=>$(id)?.addEventListener('input',schedule));
    $('cuLucroModo')?.addEventListener('change',()=>{localStorage.setItem(MODE_KEY,lucroModo());atualizarExplicacao();schedule()});
    ['cuPeso','cuUnid'].forEach(id=>$(id)?.addEventListener('input',()=>{if($('cuAuto'))$('cuAuto').checked=false;schedule()}));
    $('cuPull')?.addEventListener('click',async()=>{if($('cuAuto'))$('cuAuto').checked=true;await fillFromSacolas(true);schedule()});
    ['saL','saC','saM','saQ','saPesoAlvo','saDes','saDm','saDs'].forEach(id=>{const e=$(id);e?.addEventListener('input',schedule);e?.addEventListener('change',schedule)});
    window.addEventListener('hashchange',()=>{if(location.hash==='#custo')schedule()});
    window.addEventListener('focus',schedule);
    window.calcCu=calc;
    fillFromSacolas(true).then(calc);
  }

  function init(){build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200));else setTimeout(init,200);
})();
