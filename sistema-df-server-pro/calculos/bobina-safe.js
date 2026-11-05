(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const PI=Math.PI;
  const pn=v=>{
    let s=String(v??'').trim().replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(',','.');
    const x=parseFloat(s.replace(/[^0-9.\-]/g,''));
    return Number.isFinite(x)?x:0;
  };
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const fmtInp=(v,d=2)=>Number(v)>0?Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d}):'';
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};
  const setMsg=(t,c)=>{const e=$('bobMsg');if(e){e.textContent=t;e.className='status '+(c||'')}};
  let timer=null;

  function addStyle(){
    if($('dfBobinaStyle'))return;
    const st=document.createElement('style');
    st.id='dfBobinaStyle';
    st.textContent=[
      '.dfBobinaCard{border-color:#3b2b0b!important}',
      '.dfBobinaTop{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
      '.dfBobinaCheck{display:flex;gap:8px;align-items:center;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:10px 12px;color:#cbd5e1;font-size:13px;font-weight:800}',
      '.dfBobinaCheck input{width:auto;transform:scale(1.15)}',
      '.dfBobinaMini{font-size:12px!important;padding:10px 8px!important;margin-top:8px!important}',
      '.dfBobinaResults{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
      '.dfBobinaResults .kpi{margin-top:0}',
      '.dfCalBox{margin-top:14px;padding:14px;border:1px solid #334155;border-radius:16px;background:#0b1220}',
      '.dfCalBox h3{margin:0 0 8px;font-size:16px;color:#facc15}',
      '@media(max-width:560px){.dfBobinaResults{grid-template-columns:1fr}.dfBobinaTop{align-items:stretch}.dfBobinaCheck{width:100%}}'
    ].join('');
    document.head.appendChild(st);
  }

  function cardHtml(){return `<div class="card dfBobinaCard" id="dfBobinaCard">
    <div class="dfBobinaTop"><div><span class="tag">Bobina</span><h2>Peso da bobina pelo raio</h2></div><label class="dfBobinaCheck"><input id="bobAuto" type="checkbox" checked> Puxar largura, micra e densidade da Extrusão</label></div>
    <div class="hint">Cálculo geométrico pelo anel da bobina: usa o <b>raio do tubete ao quadrado</b> e o <b>raio externo ao quadrado</b>. Você pode informar a altura de plástico enrolado ou o peso desejado.</div>
    <button id="bobPull" class="calcBtn alt dfBobinaMini" type="button">PUXAR DADOS DA EXTRUSÃO AGORA</button>
    <div class="grid">
      <div><label>Largura física da bobina / boca fechada (cm)</label><input id="bobL" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Micra parede dupla (µm)</label><input id="bobM" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Densidade</label><input id="bobD" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
      <div><label>Fator de compactação / calibração (%)</label><input id="bobK" inputmode="decimal" value="100" placeholder="100 = geometria pura"></div>
      <div><label>Tipo da bobina</label><select id="bobTipo"><option value="normal">Normal</option><option value="sanfonada">Sanfonada</option></select></div>
    </div>
    <div class="smallNote"><b>Regra sanfonada:</b> no cálculo físico do raio/peso usa metade da largura informada (ex.: 80 cm → 40 cm). Não precisa informar a sanfona de cada lado. O peso por metro usa a largura informada do filme. O padrão matemático é 100%; para compensar ar/pressão do enrolamento, calibre pela balança.</div>
    <div class="grid">
      <div><label>Altura de plástico enrolado (cm)</label><input id="bobRe" class="main" inputmode="decimal" placeholder="Do lado de fora do tubete até a borda"></div>
      <div><label>Diâmetro do tubete / núcleo (cm)</label><input id="bobRi" class="main" inputmode="decimal" value="7,6" placeholder="Ex.: 7,6 ou 10"></div>
      <div><label>Peso do tubete (kg)</label><input id="bobCore" inputmode="decimal" placeholder="Opcional"></div>
      <div><label>Peso desejado da bobina (kg)</label><input id="bobTarget" class="main" inputmode="decimal" placeholder="Para calcular a altura"></div>
    </div>
    <label class="dfBobinaCheck" style="margin-top:10px"><input id="bobTargetTotal" type="checkbox" checked> O peso desejado inclui o tubete</label>
    <div id="bobMsg" class="status warn">Preencha a altura enrolada da bobina ou o peso desejado.</div>
    <div class="result"><span>ALTURA → PESO DA BOBINA</span><b id="bobPesoTotal">—</b></div>
    <div class="dfBobinaResults">
      <div class="kpi"><span>Tipo usado</span><b id="bobTipoUsado">—</b></div>
      <div class="kpi"><span>Largura informada</span><b id="bobLargFis">—</b></div>
      <div class="kpi"><span>Largura usada no raio</span><b id="bobLargRaio">—</b></div>
      <div class="kpi"><span>Largura usada no peso por metro</span><b id="bobLargEquiv">—</b></div>
      <div class="kpi"><span>Fator aplicado</span><b id="bobFatorRaio">—</b></div>
      <div class="kpi"><span>Peso do plástico</span><b id="bobPesoPlastico">—</b></div>
      <div class="kpi"><span>Metros aproximados</span><b id="bobMetros">—</b></div>
      <div class="kpi"><span>Diâmetro externo</span><b id="bobDiametro">—</b></div>
      <div class="kpi"><span>Peso por metro</span><b id="bobGm">—</b></div>
    </div>
    <div class="result"><span>PESO → ALTURA ENROLADA NECESSÁRIA</span><b id="bobRaioNec">—</b></div>
    <div class="dfBobinaResults">
      <div class="kpi"><span>Diâmetro externo necessário</span><b id="bobDiamNec">—</b></div>
      <div class="kpi"><span>Metros nesse peso</span><b id="bobMetrosPeso">—</b></div>
      <div class="kpi"><span>Peso plástico usado</span><b id="bobPesoUsado">—</b></div>
      <div class="kpi"><span>Tubete somado</span><b id="bobTubeteUsado">—</b></div>
    </div>
    <div class="dfCalBox">
      <h3>Calibrar bobina pela balança</h3>
      <div class="hint">Para máxima precisão na sua máquina, use uma bobina real. Informe o peso da balança e a altura enrolada medida. O sistema calcula o fator de compactação real do seu enrolamento.</div>
      <div class="grid"><div><label>Peso real na balança (kg)</label><input id="bobCalPeso" inputmode="decimal" placeholder="Ex.: 100"></div><div><label>O peso da balança inclui tubete?</label><select id="bobCalTipo"><option value="total">Sim, inclui tubete</option><option value="plastico">Não, só plástico</option></select></div></div>
      <button id="bobCalBtn" class="calcBtn alt dfBobinaMini" type="button">CALIBRAR FATOR PELA BALANÇA</button>
      <div class="smallNote" id="bobCalRes">Para calibrar, preencha também altura enrolada, diâmetro do tubete, largura, densidade e tipo da bobina.</div>
    </div>
  </div>`}

  function val(id){return pn($(id)?.value)}
  function densEx(){const s=$('exDs');if(!s)return 0;return s.value==='manual'?val('exDm'):pn(s.value)}
  function schedule(){clearTimeout(timer);timer=setTimeout(calc,120)}
  function sync(force){const a=$('bobAuto');if(!force&&a&&!a.checked)return;const l=val('exL'),m=val('exM'),d=densEx();if(l>0&&$('bobL'))$('bobL').value=fmtInp(l);if(m>0&&$('bobM'))$('bobM').value=fmtInp(m);if(d>0&&$('bobD'))$('bobD').value=fmtInp(d,3);schedule()}
  function updateTipo(){schedule()}
  function limpar(){['bobPesoTotal','bobPesoPlastico','bobMetros','bobDiametro','bobGm','bobRaioNec','bobDiamNec','bobMetrosPeso','bobPesoUsado','bobTubeteUsado','bobTipoUsado','bobLargFis','bobLargRaio','bobLargEquiv','bobFatorRaio'].forEach(id=>set(id,'—'))}

  function medidas(){
    const tipo=$('bobTipo')?.value||'normal';
    const fisica=val('bobL');
    const equivalente=fisica;
    const larguraRaio=tipo==='sanfonada'?fisica/2:fisica;
    const diametroTubete=val('bobRi');
    const raioNucleo=diametroTubete/2;
    const altura=val('bobRe');
    const raioExterno=altura>0&&raioNucleo>0?raioNucleo+altura:0;
    const fatorBase=val('bobK')/100;
    const fatorRaio=fatorBase;
    return {tipo,fisica,equivalente,larguraRaio,diametroTubete,raioNucleo,altura,raioExterno,fatorBase,fatorRaio};
  }

  function resultadoBase(){
    const w=medidas(), micra=val('bobM'), dens=val('bobD');
    const pesoMetroG=(w.equivalente*micra*dens)/100;
    return {w,micra,dens,pesoMetroG,core:val('bobCore'),target:val('bobTarget'),incluiTubete:!!$('bobTargetTotal')?.checked};
  }

  function validar(b){
    if(!(b.w.fisica>0&&b.w.larguraRaio>0&&b.w.equivalente>0&&b.micra>0&&b.dens>0&&b.w.fatorBase>0&&b.w.raioNucleo>0)){
      setMsg('Confira largura, micra, densidade, diâmetro do tubete e fator de compactação.','bad');
      return false;
    }
    return true;
  }

  function preencherFixos(b){
    set('bobTipoUsado',b.w.tipo==='sanfonada'?'Sanfonada — metade da largura no raio':'Normal');
    set('bobLargFis',fmt(b.w.fisica,2)+' cm');
    set('bobLargRaio',fmt(b.w.larguraRaio,2)+' cm');
    set('bobLargEquiv',fmt(b.w.equivalente,2)+' cm');
    set('bobFatorRaio',fmt(b.w.fatorRaio*100,1)+'%');
    set('bobGm',fmt(b.pesoMetroG,2)+' g/m');
  }

  function calc(){
    limpar();
    const b=resultadoBase();
    if(!validar(b))return;
    preencherFixos(b);
    let ok=false;

    if(b.w.altura>0){
      if(!(b.w.raioExterno>b.w.raioNucleo)){setMsg('A altura enrolada precisa ser maior que zero.','bad')}
      else{
        const areaAnel=PI*((b.w.raioExterno*b.w.raioExterno)-(b.w.raioNucleo*b.w.raioNucleo));
        const volumePlastico=areaAnel*b.w.larguraRaio*b.w.fatorRaio;
        const kgPlastico=(volumePlastico*b.dens)/1000;
        const metros=b.pesoMetroG>0?(kgPlastico*1000)/b.pesoMetroG:0;
        const kgTotal=kgPlastico+b.core;
        set('bobPesoTotal',fmt(kgTotal,3)+' kg total');
        set('bobPesoPlastico',fmt(kgPlastico,3)+' kg');
        set('bobMetros',fmt(metros,1)+' m');
        set('bobDiametro',fmt(b.w.raioExterno*2,2)+' cm');
        ok=true;
      }
    }

    if(b.target>0){
      const kgPlasticoDesejado=b.incluiTubete?b.target-b.core:b.target;
      if(kgPlasticoDesejado<=0){set('bobRaioNec','Peso menor que o tubete')}
      else{
        const raioExternoNec=Math.sqrt(
          (b.w.raioNucleo*b.w.raioNucleo)+
          (kgPlasticoDesejado*1000)/(PI*b.w.larguraRaio*b.dens*b.w.fatorRaio)
        );
        const alturaNec=Math.max(0,raioExternoNec-b.w.raioNucleo);
        const metrosPeso=b.pesoMetroG>0?(kgPlasticoDesejado*1000)/b.pesoMetroG:0;
        set('bobRaioNec',fmt(alturaNec,2)+' cm');
        set('bobDiamNec',fmt(raioExternoNec*2,2)+' cm');
        set('bobMetrosPeso',fmt(metrosPeso,1)+' m');
        set('bobPesoUsado',fmt(kgPlasticoDesejado,3)+' kg');
        set('bobTubeteUsado',fmt(b.incluiTubete?b.core:0,3)+' kg');
        ok=true;
      }
    }

    if(ok){
      const extra=b.w.tipo==='sanfonada'?' Na sanfonada foi usada metade da largura no cálculo do raio, conforme sua regra de produção.':'';
      setMsg('Cálculo pelo anel da bobina pronto. O tubete entra pelo raio ao quadrado e a altura informada é somente a camada de plástico.'+extra,'ok');
    }else setMsg('Preencha a altura enrolada para saber o peso ou digite o peso desejado para saber a altura.','warn');
  }

  function calibrar(){
    const b=resultadoBase(), box=$('bobCalRes');
    const pesoReal=val('bobCalPeso'), inclui=($('bobCalTipo')?.value||'total')==='total';
    const r=txt=>{if(box)box.textContent=txt};
    if(!validar(b)||!(b.w.altura>0&&b.w.raioExterno>b.w.raioNucleo&&pesoReal>0)){
      r('Confira peso real, altura enrolada, diâmetro do tubete, largura, densidade e tipo da bobina.');
      setMsg('Não consegui calibrar. Falta algum dado da bobina real.','bad');
      return;
    }
    const kgPlastico=inclui?pesoReal-b.core:pesoReal;
    if(!(kgPlastico>0)){r('Peso plástico ficou menor ou igual a zero. Confira o peso do tubete.');return}
    const areaAnel=PI*((b.w.raioExterno*b.w.raioExterno)-(b.w.raioNucleo*b.w.raioNucleo));
    const fatorEfetivo=(kgPlastico*1000)/(areaAnel*b.w.larguraRaio*b.dens);
    if(!(fatorEfetivo>0&&Number.isFinite(fatorEfetivo))){r('Não consegui calcular o fator. Confira as medidas.');return}
    if($('bobK'))$('bobK').value=fmtInp(fatorEfetivo*100,1);
    r('Fator calibrado: '+fmt(fatorEfetivo*100,1)+'%. Agora o cálculo de raio/peso fica ajustado à bobina real medida na balança.');
    setMsg('Calibração feita pela balança. O fator foi ajustado para o seu enrolamento real.','ok');
    schedule();
  }

  function bind(){
    const pull=$('bobPull'),auto=$('bobAuto'),tipo=$('bobTipo'),cal=$('bobCalBtn');
    if(pull&&!pull.dfBound){pull.dfBound=true;pull.addEventListener('click',()=>{if(auto)auto.checked=true;sync(true)})}
    if(auto&&!auto.dfBound){auto.dfBound=true;auto.addEventListener('change',()=>sync(false))}
    if(tipo&&!tipo.dfBound){tipo.dfBound=true;tipo.addEventListener('change',updateTipo)}
    if(cal&&!cal.dfBound){cal.dfBound=true;cal.addEventListener('click',calibrar)}
    if(!window.dfBobinaMigratedV5){window.dfBobinaMigratedV5=true;const e=$('bobRi');if(e&&String(e.value).replace(',','.')==='3.8')e.value='7,6'}
    ['bobL','bobM','bobD'].forEach(id=>{const e=$(id);if(e&&!e.dfBound){e.dfBound=true;e.addEventListener('input',()=>{if(auto)auto.checked=false;schedule()})}});
    ['bobK','bobRe','bobRi','bobCore','bobTarget','bobTargetTotal'].forEach(id=>{const e=$(id);if(e&&!e.dfBound){e.dfBound=true;e.addEventListener('input',schedule);e.addEventListener('change',schedule)}});
    ['exL','exM','exDm','exDs'].forEach(id=>{const e=$(id);if(e&&!e.dfBobBound){e.dfBobBound=true;e.addEventListener('input',()=>sync(false));e.addEventListener('change',()=>sync(false))}});
    updateTipo();sync(false);
  }

  function add(){addStyle();const pg=$('pgEx');if(!pg||$('dfBobinaCard'))return;const contact=$('dfContact_pgEx');if(contact)contact.insertAdjacentHTML('beforebegin',cardHtml());else pg.insertAdjacentHTML('beforeend',cardHtml());bind()}
  function init(){add();setTimeout(()=>{add();bind()},300);setTimeout(()=>{add();bind()},900)}
  window.dfBobinaCalc=calc;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
