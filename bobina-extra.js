(function(){
  const $=id=>document.getElementById(id);
  const PI=Math.PI;

  function n(v){
    let s=String(v??'').trim();
    if(!s)return 0;
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    return parseFloat(s.replace(/[^0-9.\-]/g,''))||0;
  }
  function fmt(v,d=2){
    if(!isFinite(v))return '—';
    return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  }
  function fmtInp(v,d=2){
    if(!isFinite(v)||v<=0)return '';
    return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d});
  }
  function set(id,txt){const el=$(id);if(el)el.textContent=txt}
  function setMsg(txt,cls){const el=$('bobMsg');if(el){el.textContent=txt;el.className='status '+(cls||'')}}

  function densExtrusao(){
    const sel=$('exDs');
    if(!sel)return 0;
    if(sel.value==='manual')return n($('exDm')?.value);
    return n(sel.value);
  }

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
      '.dfBobinaBox{display:none}',
      '.dfBobinaBox.on{display:block}',
      '@media(max-width:560px){.dfBobinaResults{grid-template-columns:1fr}.dfBobinaTop{align-items:stretch}.dfBobinaCheck{width:100%}}'
    ].join('');
    document.head.appendChild(st);
  }

  function cardHtml(){return `
    <div class="card dfBobinaCard" id="dfBobinaCard">
      <div class="dfBobinaTop">
        <div>
          <span class="tag">Bobina</span>
          <h2>Peso da bobina pelo raio</h2>
        </div>
        <label class="dfBobinaCheck"><input id="bobAuto" type="checkbox" checked> Puxar largura, micra e densidade da Extrusão</label>
      </div>
      <div class="hint">Calcula <b>raio → peso</b> e também <b>peso → raio</b>. Se for sanfonada, selecione o tipo e informe a sanfona de cada lado.</div>
      <button id="bobPull" class="calcBtn alt dfBobinaMini" type="button">PUXAR DADOS DA EXTRUSÃO AGORA</button>

      <div class="grid">
        <div><label>Largura base da bobina / filme fechado (cm)</label><input id="bobL" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
        <div><label>Micra parede dupla (µm)</label><input id="bobM" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
        <div><label>Densidade</label><input id="bobD" inputmode="decimal" placeholder="Puxa da Extrusão"></div>
        <div><label>Fator de aperto da bobina (%)</label><input id="bobK" inputmode="decimal" value="92" placeholder="Ex.: 92"></div>
        <div><label>Tipo da bobina</label><select id="bobTipo"><option value="normal">Normal</option><option value="sanfonada">Sanfonada</option></select></div>
        <div id="bobSanfonaBox" class="dfBobinaBox"><label>Sanfona de cada lado (cm)</label><input id="bobSanfona" inputmode="decimal" placeholder="Ex.: 5"></div>
      </div>
      <div class="smallNote">Na sanfonada, a calculadora soma a sanfona dos dois lados: largura de cálculo = largura base + sanfona + sanfona.</div>

      <div class="grid">
        <div><label>Raio externo da bobina (cm)</label><input id="bobRe" class="main" inputmode="decimal" placeholder="Centro até a borda"></div>
        <div><label>Raio do tubete / núcleo (cm)</label><input id="bobRi" class="main" inputmode="decimal" value="3,8" placeholder="Ex.: 3,8"></div>
        <div><label>Peso do tubete (kg)</label><input id="bobCore" inputmode="decimal" placeholder="Opcional"></div>
        <div><label>Peso desejado da bobina (kg)</label><input id="bobTarget" class="main" inputmode="decimal" placeholder="Para calcular o raio"></div>
      </div>
      <label class="dfBobinaCheck" style="margin-top:10px"><input id="bobTargetTotal" type="checkbox" checked> O peso desejado inclui o tubete</label>

      <div id="bobMsg" class="status warn">Preencha o raio da bobina ou o peso desejado.</div>

      <div class="result"><span>RAIO → PESO DA BOBINA</span><b id="bobPesoTotal">—</b></div>
      <div class="dfBobinaResults">
        <div class="kpi"><span>Tipo usado</span><b id="bobTipoUsado">—</b></div>
        <div class="kpi"><span>Largura de cálculo</span><b id="bobLargCalc">—</b></div>
        <div class="kpi"><span>Peso do plástico</span><b id="bobPesoPlastico">—</b></div>
        <div class="kpi"><span>Metros aproximados</span><b id="bobMetros">—</b></div>
        <div class="kpi"><span>Diâmetro externo</span><b id="bobDiametro">—</b></div>
        <div class="kpi"><span>Peso por metro</span><b id="bobGm">—</b></div>
      </div>

      <div class="result"><span>PESO → RAIO NECESSÁRIO</span><b id="bobRaioNec">—</b></div>
      <div class="dfBobinaResults">
        <div class="kpi"><span>Diâmetro necessário</span><b id="bobDiamNec">—</b></div>
        <div class="kpi"><span>Metros nesse peso</span><b id="bobMetrosPeso">—</b></div>
        <div class="kpi"><span>Peso plástico usado</span><b id="bobPesoUsado">—</b></div>
        <div class="kpi"><span>Tubete somado</span><b id="bobTubeteUsado">—</b></div>
      </div>
      <div class="smallNote">Para ajustar fino: pese uma bobina pronta, digite o raio dela e mude o fator de aperto até o resultado bater com a balança.</div>
    </div>`}

  function larguraCalc(){
    const L=n($('bobL')?.value);
    const tipo=$('bobTipo')?.value||'normal';
    const sanfona=tipo==='sanfonada'?Math.max(0,n($('bobSanfona')?.value)):0;
    return {base:L,tipo,sanfona,calc:L+(sanfona*2)};
  }

  function updateTipo(){
    const tipo=$('bobTipo')?.value||'normal';
    const box=$('bobSanfonaBox');
    if(box)box.classList.toggle('on',tipo==='sanfonada');
    calc();
  }

  function syncFromExtrusao(force){
    const auto=$('bobAuto');
    if(!force && auto && !auto.checked)return;
    const l=n($('exL')?.value), m=n($('exM')?.value), d=densExtrusao();
    if(l>0&&$('bobL'))$('bobL').value=fmtInp(l,2);
    if(m>0&&$('bobM'))$('bobM').value=fmtInp(m,2);
    if(d>0&&$('bobD'))$('bobD').value=fmtInp(d,3);
    calc();
  }

  function calc(){
    const w=larguraCalc();
    const L=w.calc;
    const M=n($('bobM')?.value), D=n($('bobD')?.value);
    const k=n($('bobK')?.value)/100;
    const re=n($('bobRe')?.value), ri=n($('bobRi')?.value);
    const core=n($('bobCore')?.value);
    const target=n($('bobTarget')?.value);
    const incluiTubete=!!$('bobTargetTotal')?.checked;

    ['bobPesoTotal','bobPesoPlastico','bobMetros','bobDiametro','bobGm','bobRaioNec','bobDiamNec','bobMetrosPeso','bobPesoUsado','bobTubeteUsado','bobTipoUsado','bobLargCalc'].forEach(id=>set(id,'—'));

    if(!(w.base>0&&L>0&&M>0&&D>0&&k>0&&ri>=0)){
      setMsg('Confira largura, micra, densidade, raio do tubete e fator de aperto.','bad');
      return;
    }

    const gMetro=(L*M*D)/100;
    set('bobGm',fmt(gMetro,2)+' g/m');
    set('bobTipoUsado',w.tipo==='sanfonada'?'Sanfonada':'Normal');
    set('bobLargCalc',fmt(L,2)+' cm');
    let ok=false;

    if(re>0){
      if(re<=ri){
        setMsg('O raio externo precisa ser maior que o raio do tubete.','bad');
      }else{
        const area=PI*(re*re-ri*ri);
        const volPlastico=area*L*k;
        const kgPlastico=(volPlastico*D)/1000;
        const metros=(kgPlastico*1000)/gMetro;
        const kgTotal=kgPlastico+core;
        set('bobPesoTotal',fmt(kgTotal,3)+' kg total');
        set('bobPesoPlastico',fmt(kgPlastico,3)+' kg');
        set('bobMetros',fmt(metros,1)+' m');
        set('bobDiametro',fmt(re*2,2)+' cm');
        ok=true;
      }
    }

    if(target>0){
      let plasticoDesejado=incluiTubete?target-core:target;
      if(plasticoDesejado<=0){
        set('bobRaioNec','Peso menor que o tubete');
      }else{
        const reNec=Math.sqrt(ri*ri+(plasticoDesejado*1000)/(PI*L*D*k));
        const metrosPeso=(plasticoDesejado*1000)/gMetro;
        set('bobRaioNec',fmt(reNec,2)+' cm');
        set('bobDiamNec',fmt(reNec*2,2)+' cm');
        set('bobMetrosPeso',fmt(metrosPeso,1)+' m');
        set('bobPesoUsado',fmt(plasticoDesejado,3)+' kg');
        set('bobTubeteUsado',fmt(incluiTubete?core:0,3)+' kg');
        ok=true;
      }
    }

    if(ok){
      const extra=w.tipo==='sanfonada'?' Sanfona considerada na largura de cálculo.':'';
      setMsg('Cálculo pronto. Resultado aproximado pelo volume da bobina e fator de aperto.'+extra,'ok');
    }else setMsg('Preencha o raio externo para saber o peso ou digite o peso desejado para saber o raio.','warn');
  }

  function bind(){
    const pull=$('bobPull'),auto=$('bobAuto'),tipo=$('bobTipo');
    if(pull&&!pull.dfBound){pull.dfBound=true;pull.addEventListener('click',()=>{if(auto)auto.checked=true;syncFromExtrusao(true)})}
    if(auto&&!auto.dfBound){auto.dfBound=true;auto.addEventListener('change',()=>syncFromExtrusao(false))}
    if(tipo&&!tipo.dfTipoBound){tipo.dfTipoBound=true;tipo.addEventListener('change',updateTipo)}
    ['bobL','bobM','bobD'].forEach(id=>{const el=$(id);if(el&&!el.dfManualBound){el.dfManualBound=true;el.addEventListener('input',()=>{const a=$('bobAuto');if(a)a.checked=false;calc()})}});
    ['bobK','bobRe','bobRi','bobCore','bobTarget','bobTargetTotal','bobSanfona'].forEach(id=>{const el=$(id);if(el&&!el.dfCalcBound){el.dfCalcBound=true;el.addEventListener('input',calc);el.addEventListener('change',calc)}});
    ['exL','exM','exDm','exDs'].forEach(id=>{const el=$(id);if(el&&!el.dfBobExBound){el.dfBobExBound=true;el.addEventListener('input',()=>syncFromExtrusao(false));el.addEventListener('change',()=>syncFromExtrusao(false))}});
    updateTipo();
    syncFromExtrusao(false);
  }

  function addBobina(){
    addStyle();
    const page=$('pgEx');
    if(!page||$('dfBobinaCard'))return;
    const contact=$('dfContact_pgEx');
    if(contact)contact.insertAdjacentHTML('beforebegin',cardHtml());
    else page.insertAdjacentHTML('beforeend',cardHtml());
    bind();
  }

  function init(){
    addBobina();
    setTimeout(()=>{addBobina();bind();},300);
    setTimeout(()=>{addBobina();bind();},900);
    setTimeout(()=>{addBobina();bind();},1800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
  document.addEventListener('click',()=>setTimeout(()=>{addBobina();bind();},200),true);
})();