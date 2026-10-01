(function(){
  'use strict';
  if(window.DFCostRollProfitV1)return;
  window.DFCostRollProfitV1=true;

  const $=id=>document.getElementById(id);
  const num=v=>{
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  };
  const money=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';

  function calcProfit(){
    const peso=num($('dfCostPeso154')?.value);
    const custoKg=num($('dfCostKg154')?.value);
    const pct=num($('dfCostLucro154')?.value);
    const modo=$('dfCostModo154')?.value||'markup';
    const rolos=Math.max(0,Math.floor(num($('dfCostRolosTest1')?.value)));
    const valid=peso>0&&custoKg>0&&pct>0&&!(modo==='margin'&&pct>=100);
    const factor=modo==='margin'?1/(1-pct/100):1+pct/100;
    const vendaKg=valid?custoKg*factor:0;
    const lucroKg=valid?vendaKg-custoKg:0;
    const lucroRolo=lucroKg*peso;
    const lucroTotal=lucroRolo*rolos;
    const lk=$('dfCostLucroKgTest1'),lr=$('dfCostLucroRoloTest1'),lt=$('dfCostLucroTotalTest1'),lbl=$('dfCostLucroTotalLabelTest1');
    if(lk)lk.textContent=valid?money(lucroKg):'—';
    if(lr)lr.textContent=valid?money(lucroRolo):'—';
    if(lt)lt.textContent=valid&&rolos>0?money(lucroTotal):'—';
    if(lbl)lbl.textContent=rolos>0?'LUCRO TOTAL — '+rolos+' ROLO'+(rolos===1?'':'S'):'LUCRO TOTAL';
  }

  function install(){
    const root=$('dfCostSimpleV154');
    if(!root)return false;
    if($('dfCostRolosTest1')){calcProfit();return true;}

    const units=$('dfCostUnid154')?.closest('.step');
    if(!units)return false;
    const rollStep=document.createElement('div');
    rollStep.className='step';
    rollStep.innerHTML='<label>Quantos rolos?</label><input id="dfCostRolosTest1" inputmode="numeric" type="number" min="1" step="1" value="1" placeholder="Ex.: 100">';
    units.insertAdjacentElement('afterend',rollStep);

    const sale=$('dfCostVenda154');
    const vendaKg=$('dfCostVendaKg154')?.closest('.greenResult');
    if(sale&&vendaKg){
      const lucroKg=document.createElement('div');
      lucroKg.className='greenResult';
      lucroKg.innerHTML='<span>LUCRO / DIFERENÇA POR KG</span><b id="dfCostLucroKgTest1">—</b>';
      vendaKg.insertAdjacentElement('afterend',lucroKg);

      const lucroRolo=document.createElement('div');
      lucroRolo.className='greenResult';
      lucroRolo.innerHTML='<span>LUCRO POR ROLO</span><b id="dfCostLucroRoloTest1">—</b>';
      const vendaTotal=$('dfCostVendaTotal154')?.closest('.greenResult');
      (vendaTotal||lucroKg).insertAdjacentElement('afterend',lucroRolo);

      const lucroTotal=document.createElement('div');
      lucroTotal.className='greenResult';
      lucroTotal.style.borderColor='#3b6b49';
      lucroTotal.innerHTML='<span id="dfCostLucroTotalLabelTest1">LUCRO TOTAL</span><b id="dfCostLucroTotalTest1">—</b>';
      lucroRolo.insertAdjacentElement('afterend',lucroTotal);
    }

    ['dfCostRolosTest1','dfCostPeso154','dfCostKg154','dfCostLucro154','dfCostModo154'].forEach(id=>{
      const el=$(id);
      if(!el)return;
      el.addEventListener('input',()=>setTimeout(calcProfit,0));
      el.addEventListener('change',()=>setTimeout(calcProfit,0));
    });
    calcProfit();
    return true;
  }

  function ensure(){
    if(install())return;
    let n=0;
    const t=setInterval(()=>{if(install()||++n>60)clearInterval(t)},120);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  document.addEventListener('click',e=>{if(e.target?.closest?.('#btCu'))setTimeout(ensure,100)},true);
  window.addEventListener('df-ui-ready',()=>setTimeout(ensure,120));
})();