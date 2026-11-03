(function(root){
  'use strict';
  // A decisão e a matriz sugerida vêm exclusivamente do módulo BUR usado na prévia.
  const refs={
    pead:{name:'PEAD',min:1.2,max:1.5},pebd:{name:'PEBD convencional',min:1.2,max:1.2},
    pelbd:{name:'PEBDL / Linear',min:1.8,max:2.1},stretch:{name:'Stretch',min:1.8,max:2.1},
    geomembrana:{name:'Geomembrana',min:3,max:3},raschel80:{name:'Raschel 80 µm',min:1,max:1.2},
    raschel120:{name:'Raschel 120 µm',min:1.5,max:1.5}
  };
  // BUR é uma conferência separada; não altera a matriz que a lógica publicada escolheu.
  const burRefs={
    pead:{name:'PEAD',min:4,max:6},pebd:{name:'PEBD',min:1.8,max:3},
    pelbd:{name:'PEBDL / contrátil',min:2.4,max:3.2},
    reciclado:{name:'PEBD (base do reciclado)',min:1.8,max:3}
  };
  const diameters=[60,75,90,100,125,135,150,165,175,180,200,225,250,300,350,400,450,500,600,750,900];
  const num=v=>{const t=String(v??'').trim().replace(/\s/g,'');return t?Number(t.includes(',')&&t.includes('.')?t.replace(/\./g,'').replace(',','.'):t.replace(',','.')):NaN};
  const fmt=(v,d=1)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const fmtWidth=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
  function calculate({material,widthCm,dieMm,gapMm,micra,micraMode,application}){
    const base=root.DFDieAdvisorTest.analyze({
      material,widthCm,dieMm,gapMm,
      doubleMicra:micraMode==='wall'?num(micra)*2:micra
    });
    const wall=num(micraMode==='wall'?micra:num(micra)/2),gap=num(gapMm);
    const key=application&&application!=='material'?application:
      material==='pead'?'pead':material==='pelbd'?'pelbd':'pebd';
    const ref=refs[key],bur=base.bur;
    const width=num(widthCm),die=num(dieMm),burRef=burRefs[material]||burRefs.pebd;
    // Largura achatada é metade da circunferência do balão redondo.
    const balloonMm=width>0?20*width/Math.PI:NaN;
    const burFor=size=>Number.isFinite(balloonMm)&&size>0?balloonMm/size:NaN;
    const withinBur=value=>Number.isFinite(value)&&value>=burRef.min-1e-9&&value<=burRef.max+1e-9;
    const suggestedBur=base.ready?burFor(base.recommended):NaN;
    const candidates=[...new Set([...diameters,die,base.recommended].filter(n=>Number.isFinite(n)&&n>0))].sort((a,b)=>a-b);
    const comparison=base.ready?candidates.map(size=>{
      const value=burFor(size);
      return {die:size,bur:value,ddr:wall>0&&gap>0?gap/(wall/1000*value):NaN,
        burOk:withinBur(value)};
    }):[];
    const acceptable=comparison.filter(c=>c.burOk);
    const compromise=acceptable.length?acceptable.reduce((a,b)=>
      Math.abs(b.die-base.recommended)<Math.abs(a.die-base.recommended)?b:a):null;
    const diameterMin=die>0?die*burRef.min:NaN;
    const diameterMax=die>0?die*burRef.max:NaN;
    return {base,wall,gap,ref,burRef,widthCm:width,balloonMm,dieMm:die,
      diameterMin,diameterMax,flatMinCm:diameterMin*Math.PI/20,
      flatMaxCm:diameterMax*Math.PI/20,suggestedBur,compromise,comparison,
      suggestedWithinBur:withinBur(suggestedBur),
      ddr:wall>0&&gap>0&&Number.isFinite(bur)?gap/(wall/1000*bur):NaN,
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
    extra.innerHTML='<h3>Verificação técnica da matriz</h3>'+
      '<div class="dfDieTechGrid"><div>Matriz atual<strong id="dfDieCurrentTest">—</strong></div>'+
      '<div>BUR atual<strong id="dfDieCurrentBurTest">—</strong></div>'+
      '<div>Matriz recomendada<strong id="dfDieSuggestedTest">—</strong></div>'+
      '<div>BUR previsto<strong id="dfDieSuggestedBurTest">—</strong></div></div>'+
      '<div class="dfDieTechVerdict" id="dfDieSuggestedVerdictTest"></div>'+
      '<div class="dfDieTechCompromise" id="dfDieCompromiseTest"></div>'+
      '<button type="button" id="dfDieCompareButtonTest" aria-expanded="false">Ver efeito de outras matrizes</button>'+
      '<div id="dfDieCompareTest" hidden><div class="dfDieCompareScroll"><table><thead><tr><th>Diâmetro</th><th>BUR</th><th>DDR</th><th>Situação</th></tr></thead><tbody id="dfDieCompareRowsTest"></tbody></table></div></div>'+
      '<h3>EXPANSÃO</h3><div class="dfDieTechGrid">'+
      '<div>Largura achatada<strong id="dfDieFlatWidthTest">—</strong></div>'+
      '<div>Diâmetro real do balão<strong id="dfDieBalloonTest">—</strong></div>'+
      '<div>Matriz instalada<strong id="dfDieMatrixDiameterTest">—</strong></div>'+
      '<div>BUR atual<strong id="dfDieBurTest">—</strong></div>'+
      '<div>Faixa de BUR<strong id="dfDieBurRangeTest">—</strong></div></div>'+
      '<div class="dfDieTechVerdict" id="dfDieBurStatusTest"></div>'+
      '<div class="dfDieBalloonRange"><b>Capacidade desta matriz em diâmetro de balão</b>'+
      '<strong id="dfDieBalloonRangeTest">—</strong>'+
      '<small id="dfDieFlatRangeTest">—</small></div>'+
      '<h3>ESTIRAMENTO</h3><div class="dfDieTechGrid"><div>GAP<strong id="dfDieGapOutputTest">—</strong></div>'+
      '<div>Micra por parede<strong id="dfDieWallOutputTest">—</strong></div>'+
      '<div>DDR estimado<strong id="dfDieDdrTest">—</strong></div></div>'+
      '<label for="dfDieGapAppTest">Referência de GAP</label>'+
      '<select id="dfDieGapAppTest"><option value="material">Padrão do material selecionado</option>'+
      '<option value="stretch">Stretch</option><option value="geomembrana">Geomembrana</option>'+
      '<option value="raschel80">Raschel 80 µm</option><option value="raschel120">Raschel 120 µm</option></select>'+
      '<p id="dfDieGapReferenceTest"></p>'+
      '<details class="dfDieHowTest"><summary>ⓘ Como funciona</summary>'+
      '<p>Diâmetro do balão (mm) = 2 × largura achatada (mm) ÷ π. Matriz × BUR = diâmetro do balão; diâmetro do balão ÷ matriz = BUR. Na prévia, a referência de BUR define a avaliação da matriz.</p>'+
      '<p>O DDR estimado é GAP ÷ (micra por parede ÷ 1000 × BUR); ele não decide sozinho se a matriz roda.</p>'+
      '<p>As faixas de GAP são referências, não limites obrigatórios. A linha de névoa depende de resina, temperatura da massa, vazão, refrigeração e produção.</p></details>';
    card.querySelector('.dfDieRecommendation').after(extra);
    const style=document.createElement('style');
    style.textContent='#dfDieAdvisorTest .dfDieExtraInputs{margin:14px 0}'+
      '#dfDieAdvisorTest #dfDieTechTest{border:1px solid #36516c;background:#0b1828;border-radius:14px;padding:14px;margin:14px 0}'+
      '#dfDieAdvisorTest #dfDieTechTest h3{font-size:17px;color:#ffd36a;margin:16px 0 12px}'+
      '#dfDieAdvisorTest #dfDieTechTest h3:first-child{margin-top:0}'+
      '#dfDieAdvisorTest .dfDieTechGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
      '#dfDieAdvisorTest .dfDieTechGrid>div{background:#121e30;border:1px solid #33455b;border-radius:10px;padding:9px;font-size:11px;color:#aebcd0}'+
      '#dfDieAdvisorTest .dfDieTechGrid strong{display:block;color:#fff;font-size:18px;margin-top:5px}'+
      '#dfDieAdvisorTest .dfDieBalloonRange{background:#13243a;border:1px solid #47617d;border-radius:11px;padding:12px;margin:12px 0}'+
      '#dfDieAdvisorTest .dfDieBalloonRange b,#dfDieAdvisorTest .dfDieBalloonRange strong,#dfDieAdvisorTest .dfDieBalloonRange small{display:block}'+
      '#dfDieAdvisorTest .dfDieBalloonRange b{color:#ffd36a;font-size:13px}'+
      '#dfDieAdvisorTest .dfDieBalloonRange strong{color:#fff;font-size:21px;margin:6px 0}'+
      '#dfDieAdvisorTest .dfDieBalloonRange small{color:#cbd5e1;font-size:12px}'+
      '#dfDieAdvisorTest #dfDieTechTest p{font-size:13px;line-height:1.5;color:#cbd5e1}'+
      '#dfDieAdvisorTest .dfDieIntro,#dfDieAdvisorTest .dfDieLimit,#dfDieAdvisorTest .dfDieGuidance{display:none}'+
      '#dfDieAdvisorTest .dfDieTechVerdict{font-size:14px;font-weight:800;line-height:1.45;margin:10px 0}'+
      '#dfDieAdvisorTest .dfDieTechCompromise{border:1px solid #2d8955;background:#0b2417;border-radius:10px;padding:11px;color:#86efac;font-weight:800;margin:10px 0}'+
      '#dfDieAdvisorTest #dfDieCompareButtonTest{width:100%;border-radius:10px;border:1px solid #b98516;background:#251a09;color:#ffd36a;font-weight:900;padding:12px;margin:6px 0 10px}'+
      '#dfDieAdvisorTest .dfDieCompareScroll{overflow-x:auto}'+
      '#dfDieAdvisorTest #dfDieCompareTest table{width:100%;border-collapse:collapse;font-size:12px;min-width:355px}'+
      '#dfDieAdvisorTest #dfDieCompareTest th,#dfDieAdvisorTest #dfDieCompareTest td{text-align:left;padding:8px 5px;border-bottom:1px solid #34465f}'+
      '#dfDieAdvisorTest #dfDieCompareTest th{color:#ffd36a}'+
      '#dfDieAdvisorTest .dfDieHowTest{border-top:1px solid #34465f;padding-top:12px;margin-top:13px}'+
      '#dfDieAdvisorTest .dfDieHowTest summary{cursor:pointer;color:#ffd36a;font-weight:900}';
    document.head.appendChild(style);
    let wallEdited=false;
    $('dfDieCompareButtonTest').addEventListener('click',()=>{
      const panel=$('dfDieCompareTest'),open=panel.hidden;
      panel.hidden=!open;
      $('dfDieCompareButtonTest').setAttribute('aria-expanded',String(open));
      $('dfDieCompareButtonTest').textContent=open?'Ocultar outras matrizes':'Ver efeito de outras matrizes';
    });
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
      if(b.ready)$('dfDieSuggestedNote').textContent='Diâmetros pela referência BUR: aproximadamente '+
        fmt(b.referenceMin,0)+'–'+fmt(b.referenceMax,0)+' mm.';
      $('dfDieStatus').textContent=b.status==='Recomendada'?'🟢 RECOMENDADA':
        b.status==='Fora da referência'?'🔴 FORA DA REFERÊNCIA':b.status;
      $('dfDieReading').textContent='Largura achatada: '+(x.widthCm>0?fmtWidth(x.widthCm)+' cm':'—')+
        ' · Diâmetro do balão: '+(Number.isFinite(x.balloonMm)?fmt(x.balloonMm,0)+' mm':'—')+
        ' · Micra: '+(num(micra)>0?micra+' µm ('+(selected==='wall'?'por parede':'dupla')+')':'—');
      $('dfDieBurTest').textContent=Number.isFinite(b.bur)?fmt(b.bur,2)+' : 1':'—';
      $('dfDieFlatWidthTest').textContent=x.widthCm>0?fmtWidth(x.widthCm)+' cm':'—';
      $('dfDieBalloonTest').textContent=Number.isFinite(x.balloonMm)?fmt(x.balloonMm,0)+' mm':'—';
      $('dfDieMatrixDiameterTest').textContent=x.dieMm>0?fmtWidth(x.dieMm)+' mm':'—';
      $('dfDieCurrentTest').textContent=num($('dfDieDiameter').value)>0?fmt(num($('dfDieDiameter').value),0)+' mm':'—';
      $('dfDieCurrentBurTest').textContent=Number.isFinite(b.bur)?fmt(b.bur,2)+' : 1':'—';
      $('dfDieSuggestedTest').textContent=b.ready?fmt(b.recommended,0)+' mm':'—';
      $('dfDieSuggestedBurTest').textContent=Number.isFinite(x.suggestedBur)?fmt(x.suggestedBur,2)+' : 1':'—';
      $('dfDieBurRangeTest').textContent=fmt(x.burRef.min,2)+'–'+fmt(x.burRef.max,2)+' : 1';
      $('dfDieBalloonRangeTest').textContent=Number.isFinite(x.diameterMin)?
        fmt(x.diameterMin,0)+' a '+fmt(x.diameterMax,0)+' mm':'Informe o diâmetro da matriz.';
      $('dfDieFlatRangeTest').textContent=Number.isFinite(x.flatMinCm)?
        'Equivale a aproximadamente '+fmt(x.flatMinCm,1)+' a '+fmt(x.flatMaxCm,1)+' cm de largura achatada.':'';
      $('dfDieBurStatusTest').textContent=Number.isFinite(b.bur)?
        (b.bur>=x.burRef.min&&b.bur<=x.burRef.max?'🟢 BUR atual dentro da referência '+x.burRef.name:
        '🔴 BUR atual fora da referência '+x.burRef.name):'Informe largura e matriz para conferir o BUR.';
      $('dfDieSuggestedVerdictTest').textContent=Number.isFinite(x.suggestedBur)?
        (b.keepCurrent?'🟢 MANTENHA A MATRIZ ATUAL. O BUR está dentro da referência configurada.':
        x.suggestedWithinBur?'🟢 Alternativa com BUR dentro da referência. Confira se essa matriz está disponível.':
        '⚠️ A alternativa calculada produz BUR '+fmt(x.suggestedBur,2)+
        ':1, fora da referência '+fmt(x.burRef.min,2)+'–'+fmt(x.burRef.max,2)+':1.'):
        'Informe a largura para verificar a sugestão.';
      $('dfDieCompromiseTest').textContent=!b.keepCurrent&&x.compromise?
        'Alternativa dentro da faixa BUR: '+fmt(x.compromise.die,0)+' mm → BUR '+fmt(x.compromise.bur,2)+
        ':1. Confirme disponibilidade e condições do processo.':
        !b.keepCurrent&&b.ready?'Nenhuma matriz comparada atende à referência BUR.':'';
      $('dfDieCompromiseTest').hidden=!b.ready||b.keepCurrent;
      const rows=$('dfDieCompareRowsTest');rows.replaceChildren();
      for(const item of x.comparison){
        const tr=document.createElement('tr');
        const situation=item.burOk?'🟢 BUR dentro':'🔴 BUR fora';
        for(const value of [
          fmt(item.die,0)+' mm'+(item.die===num($('dfDieDiameter').value)?' (atual)':
            item.die===b.recommended?' (recomendada)':''),
          fmt(item.bur,2)+':1',Number.isFinite(item.ddr)?fmt(item.ddr,1)+':1':'—',situation]){
          const td=document.createElement('td');td.textContent=value;tr.appendChild(td);
        }
        rows.appendChild(tr);
      }
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
