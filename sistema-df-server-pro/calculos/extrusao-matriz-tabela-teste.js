(function(root){
  'use strict';
  // Faixas fornecidas pelo operador. O resultado classifica o BUR pela tabela.
  const specs={
    pebd:{name:'PEBD / convencional',min:1.8,max:3,gap:'pebd'},
    pelbd:{name:'PEBDL / aplicação contrátil',min:2.4,max:3.2,gap:'pelbd'},
    pead:{name:'PEAD / alta',min:4,max:6,gap:'pead'},
    reciclado:{name:'PE reciclado (base PEBD)',min:1.8,max:3,gap:'pebd'},
    peadRec:{name:'PEAD reciclado',min:4,max:6,gap:'pead'}
  };
  const gaps={
    pead:{name:'PEAD',min:1.2,max:1.5},pebd:{name:'PEBD convencional',min:1.2,max:1.2},
    pelbd:{name:'PEBDL / Linear',min:1.8,max:2.1},stretch:{name:'Stretch',min:1.8,max:2.1},
    geomembrana:{name:'Geomembrana',min:3,max:3},raschel80:{name:'Raschel 80 µm',min:1,max:1.2},
    raschel120:{name:'Raschel 120 µm',min:1.5,max:1.5}
  };
  const sizes=[40,50,60,75,90,100,125,150,165,180,200,225,250,300,350,400,450,500,600,750,900];
  const parse=v=>{const t=String(v??'').trim().replace(/\s/g,'');return t?Number(t.includes(',')&&t.includes('.')?t.replace(/\./g,'').replace(',','.'):t.replace(',','.')):NaN};
  const fmt=(n,d=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const bur=(w,d)=>20*w/(Math.PI*d);
  function classify(value,s){
    if(!Number.isFinite(value))return null;
    if(value<s.min||value>s.max)return 'outside';
    return value<=s.min+0.05*(s.max-s.min)||value>=s.max-0.05*(s.max-s.min)?'limit':'inside';
  }
  function analyze(o){
    const s=specs[o.material]||specs.pebd,w=parse(o.widthCm),d=parse(o.dieMm),g=parse(o.gapMm),m=parse(o.micra);
    const ref=gaps[o.gapApplication&&o.gapApplication!=='material'?o.gapApplication:s.gap]||gaps[s.gap];
    const r={material:s.name,min:s.min,max:s.max,width:w,die:d,gap:g,micra:m,
      micraMode:o.micraMode==='wall'?'wall':'double',gapRef:ref,bur:NaN,ddr:NaN,wall:NaN,
      minDie:NaN,maxDie:NaN,suggested:NaN,suggestedBur:NaN,status:null,gapStatus:null,comparison:[]};
    if(!(w>0&&w<=2000))return r;
    r.minDie=20*w/(Math.PI*s.max);r.maxDie=20*w/(Math.PI*s.min);
    const valid=sizes.filter(n=>n>=r.minDie-1e-8&&n<=r.maxDie+1e-8);
    if(valid.length){
      const target=s.max-0.1*(s.max-s.min);
      r.suggested=valid.reduce((a,b)=>Math.abs(bur(w,b)-target)<Math.abs(bur(w,a)-target)?b:a);
      r.suggestedBur=bur(w,r.suggested);
      const index=sizes.indexOf(r.suggested),start=Math.max(0,Math.min(index-1,sizes.length-4));
      r.comparison=sizes.slice(start,start+4);
    }
    if(d>0&&d<=2000){
      r.bur=bur(w,d);r.status=classify(r.bur,s);
      if(!r.comparison.includes(d))r.comparison.push(d);
      r.comparison.sort((a,b)=>a-b);
    }
    r.comparison=r.comparison.map(n=>({die:n,bur:bur(w,n),status:classify(bur(w,n),s)}));
    if(g>0)r.gapStatus=g<ref.min-1e-8?'below':g>ref.max+1e-8?'above':'inside';
    if(m>0)r.wall=r.micraMode==='double'?m/2:m;
    if(g>0&&Number.isFinite(r.bur)&&Number.isFinite(r.wall))r.ddr=g/(r.wall/1000*r.bur);
    return r;
  }
  root.DFDieAdvisorTableTest={analyze};
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);
  let mounted=false;
  function mount(){
    if(mounted||$('dfDieAdvisorTable'))return;
    const page=$('pgEx'),width=$('exL'),topMicra=$('exM');
    if(!page||!width||!topMicra||!page.querySelector(':scope > .card'))return;
    mounted=true;
    const card=document.createElement('div');
    card.id='dfDieAdvisorTable';card.className='card dfExVisible';card.dataset.dfExGroup='extrusao';
    card.innerHTML=[
      '<span class="tag">TESTE · EXTRUSÃO</span><h2>Qual matriz usar neste filme?</h2>',
      '<section class="dfMtBlock"><h3>1. Dados do filme</h3><p>Largura e micra são lidas dos campos acima na Extrusão.</p>',
      '<label for="dfMtMaterial">Material</label><select id="dfMtMaterial"><option value="pebd">PEBD / convencional</option><option value="pelbd">PEBDL / aplicação contrátil</option><option value="pead">PEAD / alta</option><option value="reciclado">PE reciclado (base PEBD)</option><option value="peadRec">PEAD reciclado</option></select>',
      '<label for="dfMtMode">Micra informada</label><select id="dfMtMode"><option value="double">Micra dupla (campo acima)</option><option value="wall">Micra por parede (campo abaixo)</option></select>',
      '<div id="dfMtWallBox" hidden><label for="dfMtWall">Micra por parede (µm)</label><input id="dfMtWall" inputmode="decimal" placeholder="Ex.: 27,5"></div><div id="dfMtFilm"></div></section>',
      '<section class="dfMtBlock"><h3>2. Matriz instalada</h3><label for="dfMtDie">Diâmetro da matriz (mm)</label><input id="dfMtDie" inputmode="decimal" placeholder="Ex.: 150"></section>',
      '<section class="dfMtBlock"><h3>3. BUR e compatibilidade</h3><div class="dfMtNumbers"><div>BUR calculado<strong id="dfMtBur">—</strong></div><div>Faixa da sua tabela<strong id="dfMtRange">—</strong></div></div><div class="dfMtOutcome" id="dfMtOutcome" aria-live="polite"><strong id="dfMtStatus">Informe largura e matriz</strong><p id="dfMtReason"></p></div></section>',
      '<section class="dfMtBlock"><h3>4. Matriz recomendada</h3><p id="dfMtBounds"></p><strong class="dfMtSuggested" id="dfMtSuggested">—</strong><p id="dfMtSuggestedBur"></p></section>',
      '<section class="dfMtBlock"><h3>5. Comparação de matrizes</h3><div id="dfMtComparison"></div></section>',
      '<section class="dfMtBlock"><h3>6. GAP</h3><label for="dfMtGap">Gap informado (mm)</label><input id="dfMtGap" inputmode="decimal" placeholder="Ex.: 1,2"><label for="dfMtGapApp">Aplicação para referência do GAP</label><select id="dfMtGapApp"><option value="material">Padrão do material selecionado</option><option value="stretch">Stretch</option><option value="geomembrana">Geomembrana</option><option value="raschel80">Raschel 80 µm</option><option value="raschel120">Raschel 120 µm</option></select><p id="dfMtGapResult"></p></section>',
      '<section class="dfMtBlock"><h3>7. DDR estimado</h3><p id="dfMtDdr"></p><p>O DDR mostra estiramento estimado e não decide sozinho se o filme roda.</p></section>',
      '<section class="dfMtBlock"><h3>8. Linha de névoa</h3><p>Depende da resina, temperatura, vazão, refrigeração e produção. Não é calculada somente pela largura e matriz; confira nivelamento e estabilidade na máquina.</p></section>',
      '<p>Classificação do BUR conforme sua tabela. Confirme o comportamento real da resina e do balão na máquina.</p>'
    ].join('');
    page.querySelector(':scope > .card').insertAdjacentElement('afterend',card);
    const style=document.createElement('style');style.id='dfMtStyle';style.textContent=[
      '#dfDieAdvisorTable .dfMtBlock{border:1px solid #34465f;border-radius:15px;background:#0a1220;margin:13px 0;padding:14px}',
      '#dfDieAdvisorTable h3{font-size:16px;color:#ffd36a;margin:0 0 12px}',
      '#dfDieAdvisorTable p,#dfMtFilm{color:#c5d1e0;font-size:13px;line-height:1.5}',
      '#dfDieAdvisorTable .dfMtNumbers{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '#dfDieAdvisorTable .dfMtNumbers>div{border:1px solid #34465f;border-radius:12px;padding:11px;font-size:11px;color:#aebed1}',
      '#dfDieAdvisorTable .dfMtNumbers strong{display:block;font-size:21px;color:white;margin-top:5px}',
      '#dfDieAdvisorTable .dfMtOutcome{border:2px solid #465870;background:#101e31;border-radius:14px;padding:14px;margin-top:12px}',
      '#dfDieAdvisorTable .dfMtOutcome strong{font-size:clamp(20px,5vw,29px)}',
      '#dfDieAdvisorTable .dfMtOutcome.inside{border-color:#16a34a;background:#0c2118;color:#86efac}',
      '#dfDieAdvisorTable .dfMtOutcome.limit{border-color:#f5a000;background:#241a08;color:#ffd36a}',
      '#dfDieAdvisorTable .dfMtOutcome.outside{border-color:#d24747;background:#2b1315;color:#fca5a5}',
      '#dfDieAdvisorTable .dfMtSuggested{display:block;color:#ffd36a;font-size:26px}',
      '#dfDieAdvisorTable .dfMtRow{display:flex;justify-content:space-between;align-items:center;gap:6px;border:1px solid #34465f;border-radius:10px;padding:9px;margin:7px 0;font-size:13px}',
      '#dfDieAdvisorTable .dfMtRow span{color:#aebed1}',
      '#dfDieAdvisorTable .dfMtRow em{font-style:normal;font-weight:900}',
      '@media(max-width:390px){#dfDieAdvisorTable .dfMtRow{font-size:11px}}'
    ].join('\n');document.head.appendChild(style);
    let materialChosen=false,wallEdited=false;
    function update(){
      const mode=$('dfMtMode').value;
      $('dfMtWallBox').hidden=mode!=='wall';
      if(mode==='wall'&&!wallEdited){
        const val=parse(topMicra.value);$('dfMtWall').value=val>0?fmt(val/2,1):'';
      }
      const r=analyze({material:$('dfMtMaterial').value,widthCm:width.value,
        micra:mode==='wall'?$('dfMtWall').value:topMicra.value,micraMode:mode,
        dieMm:$('dfMtDie').value,gapMm:$('dfMtGap').value,gapApplication:$('dfMtGapApp').value});
      $('dfMtFilm').textContent='Material: '+r.material+' · Largura: '+(r.width>0?fmt(r.width,1)+' cm':'—')+
        ' · Micra: '+(r.micra>0?fmt(r.micra,1)+' µm ('+(mode==='wall'?'por parede':'dupla')+')':'—')+
        ' · Matriz instalada: '+(r.die>0?fmt(r.die,0)+' mm':'—');
      $('dfMtBur').textContent=Number.isFinite(r.bur)?fmt(r.bur,2)+' : 1':'—';
      $('dfMtRange').textContent=fmt(r.min,2)+'–'+fmt(r.max,2)+' : 1 ('+r.material+')';
      $('dfMtStatus').textContent=r.status==='inside'?'🟢 RODA':r.status==='limit'?'🟡 PRÓXIMO DO LIMITE':r.status==='outside'?'🔴 NÃO RODA PELA TABELA':'Informe largura e matriz';
      $('dfMtReason').textContent=!(r.width>0)?'Informe a largura no campo acima.':!Number.isFinite(r.bur)?'Informe o diâmetro da matriz para avaliar.':
        r.status==='outside'?(r.bur>r.max?'A matriz é pequena para esta largura; BUR acima do máximo da sua tabela.':'A matriz é grande para esta largura; BUR abaixo do mínimo da sua tabela.'):
        r.status==='limit'?'O BUR está dentro da faixa, mas muito próximo de uma das extremidades da sua tabela.':'O BUR está dentro da faixa da sua tabela para este material.';
      $('dfMtOutcome').className='dfMtOutcome '+(r.status||'');
      $('dfMtBounds').textContent=Number.isFinite(r.minDie)?'Diâmetro mínimo calculado: '+fmt(r.minDie,1)+' mm · máximo: '+fmt(r.maxDie,1)+' mm':'Informe largura para calcular.';
      $('dfMtSuggested').textContent=Number.isFinite(r.suggested)?'Matriz sugerida: '+fmt(r.suggested)+' mm':'Sem medida comercial da lista na faixa';
      $('dfMtSuggestedBur').textContent=Number.isFinite(r.suggestedBur)?'BUR com '+fmt(r.suggested)+' mm: '+fmt(r.suggestedBur,2)+' : 1 · 🟢 DENTRO DA FAIXA. Confirme se a matriz está disponível.':'Consulte outros diâmetros comerciais dentro da faixa calculada.';
      const box=$('dfMtComparison');box.replaceChildren();
      if(!r.comparison.length)box.textContent='Informe largura e matriz para comparar.';
      for(const c of r.comparison){
        const row=document.createElement('div');row.className='dfMtRow';
        const a=document.createElement('b');a.textContent=fmt(c.die)+' mm'+(c.die===r.die?' (atual)':c.die===r.suggested?' (sugerida)':'');
        const b=document.createElement('span');b.textContent='BUR '+fmt(c.bur,2);
        const v=document.createElement('em');v.textContent=c.status==='outside'?'🔴 Fora':c.status==='limit'?'🟡 No limite':'🟢 Dentro';
        row.append(a,b,v);box.appendChild(row);
      }
      const ref=r.gapRef,refText=ref.min===ref.max?fmt(ref.min,1):fmt(ref.min,1)+'–'+fmt(ref.max,1);
      $('dfMtGapResult').textContent='GAP informado: '+(r.gap>0?fmt(r.gap,1)+' mm':'—')+
        ' · GAP de referência ('+ref.name+'): '+refText+' mm · '+
        (r.gapStatus==='below'?'ABAIXO':r.gapStatus==='inside'?'DENTRO':r.gapStatus==='above'?'ACIMA':'informe o GAP')+
        '. Referência separada do resultado do BUR.';
      $('dfMtDdr').textContent='Micra '+(mode==='wall'?'por parede':'dupla')+': '+(r.micra>0?fmt(r.micra,1)+' µm':'—')+
        ' · Micra por parede: '+(Number.isFinite(r.wall)?fmt(r.wall,1)+' µm':'—')+
        ' · BUR: '+(Number.isFinite(r.bur)?fmt(r.bur,2)+' : 1':'—')+
        ' · GAP: '+(r.gap>0?fmt(r.gap,1)+' mm':'—')+
        ' · DDR: '+(Number.isFinite(r.ddr)?fmt(r.ddr,1)+' : 1':'—')+
        '. Fórmula: GAP ÷ (micra por parede ÷ 1000 × BUR).';
    }
    [width,topMicra,$('dfMtMaterial'),$('dfMtMode'),$('dfMtWall'),$('dfMtDie'),$('dfMtGap'),$('dfMtGapApp')].forEach(el=>{
      el.addEventListener('input',update);el.addEventListener('change',update);
    });
    $('dfMtMaterial').addEventListener('change',()=>{materialChosen=true});
    $('dfMtWall').addEventListener('input',()=>{wallEdited=true});
    $('exDs')?.addEventListener('change',()=>{
      if(materialChosen)return;
      $('dfMtMaterial').value=$('exDs').value==='0.952'?'pead':$('exDs').value==='0.918'?'pelbd':'pebd';
      update();
    });
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  root.addEventListener('df-ui-ready',mount);
})(typeof window==='undefined'?globalThis:window);
