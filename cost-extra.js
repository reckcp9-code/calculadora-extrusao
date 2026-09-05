(function(){
  const $=id=>document.getElementById(id);
  function num(v){
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const n=parseFloat(s);
    return Number.isFinite(n)?n:0;
  }
  function get(id){const el=$(id);return el?num(el.value):0}
  function fmt(v,d=2){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
  function rs(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}
  function set(id,txt){const el=$(id);if(el)el.textContent=txt}
  function densSacola(){const s=$('saDs');if(!s)return 0;if(s.value==='manual')return get('saDm');return num(s.value)}
  function sacolaData(){
    const L=get('saL'),C=get('saC'),M=get('saM'),d=densSacola(),desc=get('saDes'),qtd=get('saQ');
    const pesoSaco=L&&C&&M&&d?L*C*M*d/10000*(1-desc/100):0;
    const pesoRolo=pesoSaco&&qtd?pesoSaco*qtd/1000:0;
    return{pesoSaco,qtd,pesoRolo};
  }
  function fillFromSacolas(force=false){
    const auto=$('cuAuto');
    if(!force&&auto&&!auto.checked)return;
    const d=sacolaData();
    if($('cuPeso')&&d.pesoRolo>0)$('cuPeso').value=fmt(d.pesoRolo,3);
    if($('cuUnid')&&d.qtd>0)$('cuUnid').value=fmt(d.qtd,0);
    set('cuAutoInfo',d.pesoRolo>0?'Puxado da aba Sacolas: '+fmt(d.pesoSaco,2)+' g por sacola • '+fmt(d.qtd,0)+' sacolas por rolo • '+fmt(d.pesoRolo,3)+' kg por rolo':'Preencha a aba Sacolas ou digite manualmente abaixo.');
  }
  function calcCusto(){
    fillFromSacolas(false);
    const peso=get('cuPeso'),unid=get('cuUnid'),custoKg=get('cuKg'),lucroPct=get('cuLucroPct'),qtdRolos=get('cuQtd')||1;
    const custoRolo=peso*custoKg;
    const vendaRolo=custoRolo*(1+lucroPct/100);
    const lucroRolo=vendaRolo-custoRolo;
    const custoUnid=unid>0?custoRolo/unid:0;
    const vendaUnid=unid>0?vendaRolo/unid:0;
    set('cuLucro','+'+fmt(lucroPct,2)+'% = '+(custoRolo?rs(lucroRolo*qtdRolos):'—'));
    set('cuCustoRolo',custoRolo?rs(custoRolo):'—');
    set('cuVendaRolo',vendaRolo?rs(vendaRolo):'—');
    set('cuPrecoUnid',vendaUnid?rs(vendaUnid):'—');
    set('cuCustoUnid',custoUnid?rs(custoUnid):'—');
    set('cuLucroRolo',lucroRolo?rs(lucroRolo):'—');
    set('cuVendaTotal',vendaRolo?rs(vendaRolo*qtdRolos):'—');
    set('cuCustoTotal',custoRolo?rs(custoRolo*qtdRolos):'—');
    set('cuLucroTotal',lucroRolo?rs(lucroRolo*qtdRolos):'—');
  }
  function buildCusto(){
    const pg=$('pgCu');
    if(!pg||pg.dataset.dfCustoAuto==='1')return;
    pg.dataset.dfCustoAuto='1';
    pg.innerHTML='<div class="card"><span class="tag">Custo</span><h2>Custo e venda automático</h2><div class="hint">Puxa o peso do rolo e a quantidade de sacolas da aba Sacolas. Também permite digitar tudo manualmente.</div><button id="cuPull" class="calcBtn alt" type="button">PUXAR DADOS DA ABA SACOLAS</button><label style="display:flex;gap:9px;align-items:center;margin-top:12px"><input id="cuAuto" type="checkbox" checked style="width:auto"> Preencher automático pela aba Sacolas</label><div id="cuAutoInfo" class="smallNote">Preencha a aba Sacolas ou digite manualmente abaixo.</div><div class="grid"><div><label>Peso do rolo (kg)</label><input id="cuPeso" class="main" inputmode="decimal" placeholder="Ex.: 6"></div><div><label>Sacolas por rolo</label><input id="cuUnid" class="main" inputmode="numeric" placeholder="Ex.: 2000"></div><div><label>Custo do material por kg</label><input id="cuKg" class="main" inputmode="decimal" placeholder="Ex.: 7,50"></div><div><label>Lucro desejado (%)</label><input id="cuLucroPct" class="main" inputmode="decimal" placeholder="Ex.: 30"></div><div><label>Quantidade de rolos</label><input id="cuQtd" class="main" inputmode="numeric" placeholder="Ex.: 10"></div></div><div class="result"><span>LUCRO TOTAL ESTIMADO</span><b id="cuLucro">—</b></div><div class="kpi"><span>Custo por rolo</span><b id="cuCustoRolo">—</b></div><div class="kpi"><span>Preço de venda por rolo</span><b id="cuVendaRolo">—</b></div><div class="kpi"><span>Preço por unidade / sacola</span><b id="cuPrecoUnid">—</b></div><div class="kpi"><span>Custo por unidade / sacola</span><b id="cuCustoUnid">—</b></div><div class="kpi"><span>Lucro por rolo</span><b id="cuLucroRolo">—</b></div><div class="kpi"><span>Venda total</span><b id="cuVendaTotal">—</b></div><div class="kpi"><span>Custo total</span><b id="cuCustoTotal">—</b></div><div class="kpi"><span>Lucro total</span><b id="cuLucroTotal">—</b></div></div>';
    const recalc=['cuPeso','cuUnid','cuKg','cuLucroPct','cuQtd','cuAuto'];
    recalc.forEach(id=>$(id)&&$(id).addEventListener('input',calcCusto));
    ['cuPeso','cuUnid'].forEach(id=>$(id)&&$(id).addEventListener('input',function(){if($('cuAuto'))$('cuAuto').checked=false;calcCusto()}));
    if($('cuPull'))$('cuPull').addEventListener('click',function(){if($('cuAuto'))$('cuAuto').checked=true;fillFromSacolas(true);calcCusto()});
    ['saL','saC','saM','saQ','saDes','saDm','saDs'].forEach(id=>$(id)&&$(id).addEventListener('input',calcCusto));
    ['saDs'].forEach(id=>$(id)&&$(id).addEventListener('change',calcCusto));
    window.calcCu=calcCusto;
    fillFromSacolas(true);
    calcCusto();
  }
  function init(){buildCusto();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250));
  else setTimeout(init,250);
  setTimeout(init,900);
})();
