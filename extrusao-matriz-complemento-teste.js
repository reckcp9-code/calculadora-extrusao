(function(root){
  'use strict';
  // A decisão e a matriz sugerida vêm exclusivamente de extrusao-matriz.js (produção).
  const refs={
    pead:{name:'PEAD',min:1.2,max:1.5},pebd:{name:'PEBD convencional',min:1.2,max:1.2},
    pelbd:{name:'PEBDL / Linear',min:1.8,max:2.1},stretch:{name:'Stretch',min:1.8,max:2.1},
    geomembrana:{name:'Geomembrana',min:3,max:3},raschel80:{name:'Raschel 80 µm',min:1,max:1.2},
    raschel120:{name:'Raschel 120 µm',min:1.5,max:1.5}
  };
  const num=v=>{const t=String(v??'').trim().replace(/\s/g,'');return t?Number(t.includes(',')&&t.includes('.')?t.replace(/\./g,'').replace(',','.'):t.replace(',','.')):NaN};
  const fmt=(v,d=1)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  function calculate({material,widthCm,dieMm,gapMm,micra,micraMode,application}){
    const base=root.DFDieAdvisorTest.analyze({
      material,widthCm,dieMm,gapMm,
      doubleMicra:micraMode==='wall'?num(micra)*2:micra
    });
    const wall=num(micraMode==='wall'?micra:num(micra)/2),gap=num(gapMm);
    const key=application&&application!=='material'?application:
      material==='pead'?'pead':material==='pelbd'?'pelbd':'pebd';
    const ref=refs[key],bur=base.bur;
    return {base,wall,gap,ref,ddr:wall>0&&gap>0&&Number.isFinite(bur)?gap/(wall/1000*bur):NaN,
      gapStatus:gap>0?(gap<ref.min?'abaixo':gap>ref.max?'acima':'dentro'):null};
  }
  root.DFDieAdvisorSupplementTest={calculate};
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);
  let mounted=false;
  function mount(){
    if(mounted||!$('dfDieAdvisorTest')||!root.DFDieAdvisorTest)return;
    const card=$('dfDieAdvisorTest'),width=$('exL'),topMicra=$('exM');
    if(!width||!topMicra)return;
    mounted=true;
    card.querySelector('.tag').textContent='TESTE · EXTRUSÃO';
    const mode=document.createElement('div');
    mode.className='dfDieExtraInputs';
    mode.innerHTML='<label for="dfDieMicraModeTest">Micra usada no DDR</label>'+
      '<select id="dfDieMicraModeTest"><option value="double">Micra dupla (campo acima)</option>'+
      '<option value="wall">Micra por parede (informar abaixo)</option></select>'+
      '<div id="dfDieWallBoxTest" hidden><label for="dfDieWallTest">Micra por parede (µm)</label>'+
      '<input id="dfDieWallTest" inputmode="decimal" placeholder="Ex.: 27,5"></div>';
    $('dfDieReading').before(mode);
    const extra=document.createElement('section');
    extra.id='dfDieTechTest';
    extra.innerHTML='<h3>Informações técnicas</h3>'+
      '<div class="dfDieTechGrid"><div>BUR calculado<strong id="dfDieBurTest">—</strong></div>'+
      '<div>Micra por parede<strong id="dfDieWallOutputTest">—</strong></div>'+
      '<div>GAP da matriz<strong id="dfDieGapOutputTest">—</strong></div>'+
      '<div>DDR estimado<strong id="dfDieDdrTest">—</strong></div></div>'+
      '<label for="dfDieGapAppTest">Referência de GAP</label>'+
      '<select id="dfDieGapAppTest"><option value="material">Padrão do material selecionado</option>'+
      '<option value="stretch">Stretch</option><option value="geomembrana">Geomembrana</option>'+
      '<option value="raschel80">Raschel 80 µm</option><option value="raschel120">Raschel 120 µm</option></select>'+
      '<p id="dfDieGapReferenceTest"></p>'+
      '<p>O BUR mostra a expansão do balão. O DDR usa GAP ÷ (micra por parede ÷ 1000 × BUR).'+
      ' Esses números complementam a escolha de matriz feita acima pela lógica atual.</p>';
    card.querySelector('.dfDieRecommendation').after(extra);
    const style=document.createElement('style');
    style.textContent='#dfDieAdvisorTest .dfDieExtraInputs{margin:14px 0}'+
      '#dfDieAdvisorTest #dfDieTechTest{border:1px solid #36516c;background:#0b1828;border-radius:14px;padding:14px;margin:14px 0}'+
      '#dfDieAdvisorTest #dfDieTechTest h3{font-size:17px;color:#ffd36a;margin:0 0 12px}'+
      '#dfDieAdvisorTest .dfDieTechGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
      '#dfDieAdvisorTest .dfDieTechGrid>div{background:#121e30;border:1px solid #33455b;border-radius:10px;padding:9px;font-size:11px;color:#aebcd0}'+
      '#dfDieAdvisorTest .dfDieTechGrid strong{display:block;color:#fff;font-size:18px;margin-top:5px}'+
      '#dfDieAdvisorTest #dfDieTechTest p{font-size:13px;line-height:1.5;color:#cbd5e1}';
    document.head.appendChild(style);
    let wallEdited=false;
    function update(){
      const selected=$('dfDieMicraModeTest').value;
      $('dfDieWallBoxTest').hidden=selected!=='wall';
      if(selected==='wall'&&!wallEdited){
        const m=num(topMicra.value);$('dfDieWallTest').value=m>0?fmt(m/2):'';
      }
      const micra=selected==='wall'?$('dfDieWallTest').value:topMicra.value;
      const x=calculate({material:$('dfDieMaterial').value,widthCm:width.value,dieMm:$('dfDieDiameter').value,
        gapMm:$('dfDieGap').value,micra,micraMode:selected,application:$('dfDieGapAppTest').value});
      const b=x.base;
      $('dfDieStatus').textContent=b.status==='No limite'?'🟡 NO LIMITE':
        b.status==='Boa para testar'?'🟢 BOA PARA TESTAR':
        b.status==='Não recomendada'?'🔴 NÃO RECOMENDADA':b.status;
      $('dfDieReading').textContent='Largura: '+(num(width.value)>0?width.value+' cm':'—')+
        ' · Micra: '+(num(micra)>0?micra+' µm ('+(selected==='wall'?'por parede':'dupla')+')':'—');
      $('dfDieBurTest').textContent=Number.isFinite(b.bur)?fmt(b.bur,2)+' : 1':'—';
      $('dfDieWallOutputTest').textContent=x.wall>0?fmt(x.wall)+' µm':'—';
      $('dfDieGapOutputTest').textContent=x.gap>0?fmt(x.gap)+' mm':'—';
      $('dfDieDdrTest').textContent=Number.isFinite(x.ddr)?fmt(x.ddr,1)+' : 1':'—';
      const ref=x.ref,min=fmt(ref.min),refText=ref.min===ref.max?min:min+'–'+fmt(ref.max);
      $('dfDieGapReferenceTest').textContent='GAP informado: '+(x.gap>0?fmt(x.gap)+' mm':'—')+
        ' · Referência '+ref.name+': '+refText+' mm · '+(x.gapStatus||'informe o GAP')+'.';
      $('dfDieGapAdvice').textContent=x.gapStatus?
        'GAP '+x.gapStatus+' da referência para '+ref.name+'. Confira pressão, vazão e estabilidade na máquina.':
        'Informe o GAP para comparar com a referência do material ou da aplicação.';
    }
    [width,topMicra,$('dfDieMaterial'),$('dfDieDiameter'),$('dfDieGap'),
      $('dfDieMicraModeTest'),$('dfDieWallTest'),$('dfDieGapAppTest')].forEach(el=>{
        el.addEventListener('input',update);el.addEventListener('change',update);
      });
    $('dfDieWallTest').addEventListener('input',()=>{wallEdited=true});
    $('exDs')?.addEventListener('change',()=>setTimeout(update,0));
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  root.addEventListener('df-ui-ready',mount);
})(typeof window==='undefined'?globalThis:window);
