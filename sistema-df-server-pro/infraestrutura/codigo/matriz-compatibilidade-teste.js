(function (root) {
  'use strict';

  // Triagem inicial; estas janelas não são limites universais de resina/máquina.
  // BUR = 2 × largura achatada / (π × diâmetro da matriz).
  // DDR aproximado = gap / (espessura de uma parede × BUR).
  // Referência das fórmulas: LyondellBasell, How to Solve Blown Film Problems.
  const materials = {
    pead: { name: 'PEAD', family: 'PEAD' },
    pebd: { name: 'PEBD convencional', family: 'PEBD' },
    pelbd: { name: 'PEBDL / Linear', family: 'PELBD' }
  };
  // Valores de referência informados pelo operador. Variam com resina e linha.
  const gapReferences = {
    pead: { name: 'PEAD', min: 1.2, max: 1.5 },
    pebd: { name: 'PEBD convencional', min: 1.2, max: 1.2 },
    pelbd: { name: 'PEBDL / Linear', min: 1.8, max: 2.1 },
    stretch: { name: 'Stretch', min: 1.8, max: 2.1 },
    geomembrana: { name: 'Geomembrana', min: 3, max: 3 },
    raschel80: { name: 'Raschel 80 µm', min: 1, max: 1.2 },
    raschel120: { name: 'Raschel 120 µm', min: 1.5, max: 1.5 }
  };
  const windows = {
    PEAD: { min: 2.5, max: 4, extremeMin: 1.7, extremeMax: 5.5 },
    PEBD: { min: 2, max: 3.2, extremeMin: 1.4, extremeMax: 4.6 },
    PELBD: { min: 2, max: 3.2, extremeMin: 1.4, extremeMax: 4.6 }
  };
  const labels = { alta: 'Alta / PEAD', baixa: 'Baixa / PEBD' };
  const fmt = (value, digits) => value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  const fmtInput = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  function number(value) {
    const raw = String(value == null ? '' : value).trim().replace(/\s/g, '');
    if (!raw) return NaN;
    const normalized = raw.includes(',') && raw.includes('.')
      ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(',', '.');
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function analyze(input) {
    const material = materials[input.material];
    const origin = input.origin;
    const dieMm = number(input.dieMm);
    const gapMm = number(input.gapMm);
    const widthCm = number(input.widthCm);
    const micra = number(input.micra);
    const micraMode = input.micraMode;
    const preliminaryBur = dieMm >= 10 && dieMm <= 2000 && widthCm >= 1 && widthCm <= 2000
      ? (2 * widthCm * 10) / (Math.PI * dieMm) : NaN;
    const incomplete = message => ({ ready: false, message, bur: preliminaryBur });
    if (!material) return incomplete('Selecione o material do filme.');
    if (!['virgem', 'reciclado', 'mistura'].includes(origin)) return incomplete('Selecione se o material é virgem, reciclado ou mistura.');
    if (!labels[input.dieType]) return incomplete('Selecione o tipo da matriz.');
    if (!['dupla', 'parede'].includes(micraMode)) return incomplete('Selecione como a micra está informada.');
    const application = input.application || 'padrao';
    const gapReference = gapReferences[application === 'padrao' ? input.material : application];
    if (!gapReference) return incomplete('Selecione a aplicação do filme.');
    const fields = [
      [dieMm, 10, 2000, 'diâmetro da matriz (10 a 2.000 mm)'],
      [gapMm, 0.1, 10, 'abertura do lábio (0,1 a 10 mm)'],
      [widthCm, 1, 2000, 'largura do filme fechado no campo acima (1 a 2.000 cm)'],
      [micra, 1, 1000, micraMode === 'dupla' ? 'micra dupla no campo acima (1 a 1.000 µm)' : 'micra por parede nesta seção (1 a 1.000 µm)']
    ];
    const missing = fields.find(([value, min, max]) => !Number.isFinite(value) || value < min || value > max);
    if (missing) return incomplete('Informe ou confira ' + missing[3] + '.');

    const bur = (2 * widthCm * 10) / (Math.PI * dieMm);
    const oneWallMicra = micraMode === 'dupla' ? micra / 2 : micra;
    const doubleMicra = oneWallMicra * 2;
    const ddr = gapMm / ((oneWallMicra / 1000) * bur);
    const band = windows[material.family];
    const risks = [];
    const adjustments = [];
    const explanations = [];
    let score = 0;
    let severe = false;
    const add = (points, risk, adjustment, explanation) => {
      score += points;
      risks.push(risk);
      adjustments.push(adjustment);
      explanations.push(explanation);
    };

    if (bur < band.min) {
      add(2, 'BUR abaixo da janela inicial: pouca expansão lateral para ' + material.family + '; confira orientação e formato do balão.',
        'Para esta largura, avalie uma matriz menor ou aumente a largura se o produto permitir.',
        'o BUR ficou abaixo da faixa inicial do material');
    } else if (bur > band.max) {
      add(2, 'BUR acima da janela inicial: maior expansão lateral e risco de instabilidade do balão.',
        'Para esta largura, avalie uma matriz maior ou reduza a largura se o produto permitir.',
        'o BUR ficou acima da faixa inicial do material');
    }
    if (bur < band.extremeMin || bur > band.extremeMax) {
      severe = true;
      risks.push('A expansão está muito distante da janela inicial adotada para ' + material.family + '.');
    }

    const mismatch = (material.family === 'PEAD') !== (input.dieType === 'alta');
    if (mismatch) {
      add(1, material.name + ' ' + origin + ' em matriz de ' + labels[input.dieType] + ': pode rodar, mas o nome da matriz não informa sua geometria interna nem a pressão que a resina terá.',
        'Faça teste gradual e acompanhe pressão, temperatura da massa, formação do pescoço e estabilidade do balão.',
        'o material e o tipo de matriz pedem conferência na máquina');
    }

    const distanceFromReference = gapMm < gapReference.min ? gapReference.min - gapMm :
      gapMm > gapReference.max ? gapMm - gapReference.max : 0;
    if (distanceFromReference > 0.15) {
      const direction = gapMm < gapReference.min ? 'abaixo' : 'acima';
      const referenceText = gapReference.min === gapReference.max ? fmtInput(gapReference.min) + ' mm' :
        fmtInput(gapReference.min) + ' a ' + fmtInput(gapReference.max) + ' mm';
      add(1, 'GAP de ' + fmtInput(gapMm) + ' mm está ' + direction + ' da referência de ' + gapReference.name + ' (' + referenceText + '). É referência de partida, não impedimento automático.',
        'Compare o GAP real com a ficha da resina e a pressão da sua linha antes de ajustar o lábio.',
        'o GAP está fora da referência escolhida');
    }
    if (gapMm < 0.8) {
      add(1, 'Lábio de ' + fmtInput(gapMm) + ' mm é estreito como ponto de partida: verifique pressão, aquecimento por cisalhamento e uniformidade.',
        'Confira a abertura real e a pressão; revise o lábio só dentro da especificação da matriz.',
        'a abertura do lábio é estreita');
    } else if (gapMm > 2.5) {
      add(1, 'Lábio de ' + fmtInput(gapMm) + ' mm é largo como ponto de partida: confira o estiramento necessário para atingir a micra.',
        'Revise abertura, micra e estabilidade antes de elevar a velocidade do puxador.',
        'a abertura do lábio é larga');
    }
    if (gapMm < 0.5 || gapMm > 5) severe = true;

    const ddrAttention = origin === 'reciclado' ? 40 : origin === 'mistura' ? 45 : 55;
    const ddrHigh = origin === 'reciclado' ? 65 : origin === 'mistura' ? 70 : 85;
    if (ddr > ddrHigh) {
      add(2, 'Para ' + fmtInput(doubleMicra) + ' µm duplos, o estiramento geométrico estimado é ' + fmt(ddr, 1) + ':1; é alto para uma partida sem validar a estabilidade.',
        'Confira micra real, vazão e refrigeração; considere diminuir o lábio ou rever a micra desejada dentro da ficha do produto.',
        'o lábio e a micra exigem muito estiramento');
    } else if (ddr > ddrAttention) {
      add(1, 'Estiramento geométrico de ' + fmt(ddr, 1) + ':1: observe variação de micra e estabilidade do balão.',
        'Suba a produção gradualmente e confira micra e linha de névoa.',
        'o estiramento merece atenção');
    } else if (ddr < 1.5) {
      add(2, 'Estiramento geométrico de ' + fmt(ddr, 1) + ':1 é muito baixo para a micra e o lábio informados.',
        'Confira se a micra é dupla e se o gap medido está correto; reavalie o conjunto antes da partida.',
        'a micra está espessa em relação ao lábio e ao BUR');
    }
    if (ddr < 0.8 || ddr > 140) severe = true;

    if (origin === 'reciclado' && doubleMicra < 25) {
      add(1, 'Filme de ' + fmtInput(doubleMicra) + ' µm duplos com reciclado: variação do lote pode tornar a micra e o balão instáveis.',
        'Confirme a ficha do lote e meça a micra em vários pontos após estabilizar.',
        'a micra fina com reciclado exige controle do lote');
    } else if (doubleMicra < 10) {
      add(1, 'Micra dupla abaixo de 10 µm: confira a capacidade da linha e a uniformidade em toda a largura.',
        'Valide o mínimo de espessura que a linha e a resina conseguem manter.',
        'a micra é muito fina para uma avaliação só geométrica');
    }
    if (origin === 'mistura') {
      add(1, 'Mistura com base ' + material.name + ': sem proporções e ficha das resinas, a estabilidade e a pressão podem variar.',
        'Confirme a proporção da mistura e compare com a ficha dos componentes antes de aumentar a produção.',
        'a composição da mistura precisa ser confirmada');
    }

    const status = severe || score >= 4 ? 'NÃO RECOMENDADO' : score ? 'RODA COM ATENÇÃO' : 'RODA';
    const level = status === 'RODA' ? 'Alta' : status === 'RODA COM ATENÇÃO' ? 'Média' : 'Baixa';
    const geometry = `Com ${fmtInput(widthCm)} cm de largura fechada e matriz de ${fmtInput(dieMm)} mm, o BUR é ${fmt(bur, 2)}:1. ` +
      `O GAP de ${fmtInput(gapMm)} mm e ${fmtInput(oneWallMicra)} µm por parede (${fmtInput(doubleMicra)} µm duplos) dão DDR estimado de ${fmt(ddr, 1)}:1.`;
    const reason = geometry + ' Janela inicial de ' + material.family + ': ' + fmt(band.min, 1) + ' a ' + fmt(band.max, 1) + ':1. ' +
      (explanations.length ? 'Classificação: ' + explanations.slice(0, 3).join('; ') + '.' :
        'Material e tipo de matriz correspondem, sem alerta geométrico forte nos valores informados.');
    if (!risks.length) risks.push('Sem alerta geométrico forte; pressão, temperatura da massa e estabilidade só podem ser confirmadas na máquina.');
    if (!adjustments.length) adjustments.push('Faça partida gradual e confirme micra real, pressão, temperatura da massa e estabilidade do balão.');
    if (origin === 'reciclado' && !mismatch) {
      adjustments.push('Confirme a estabilidade do lote reciclado antes de manter a produção.');
    }
    return { ready: true, status, level, score, bur, ddr, reason, risks, adjustments,
      oneWallMicra, doubleMicra, gapReference, gapReferenceText: gapReference.min === gapReference.max ? fmtInput(gapReference.min) + ' mm' :
        fmtInput(gapReference.min) + ' a ' + fmtInput(gapReference.max) + ' mm',
      material: material.name, dieType: labels[input.dieType], matrixFit: mismatch ? 'Possível, exige conferência' : 'Família correspondente',
      drawLevel: ddr > ddrHigh ? 'Alto' : ddr > ddrAttention ? 'Elevado' : ddr < 1.5 ? 'Baixo' : 'Dentro da triagem', band };
  }

  root.DFMatrixCompatibilityTest = { analyze };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  let mounted = false;

  function mount() {
    if (mounted || $('dfMatrixCompatCard')) return;
    const page = $('pgEx');
    const width = $('exL');
    const topMicra = $('exM');
    const first = page?.querySelector(':scope > .card');
    if (!page || !width || !topMicra || !first) return;
    mounted = true;
    const card = document.createElement('div');
    card.className = 'card dfExVisible';
    card.id = 'dfMatrixCompatCard';
    card.dataset.dfExGroup = 'extrusao';
    card.innerHTML = `
      <span class="tag">TESTE · EXTRUSÃO</span>
      <h2>Compatibilidade da Matriz</h2>
      <p class="dfMcIntro">A largura e a micra dupla vêm dos campos de cima. Complete os dados da matriz para avaliar esta combinação.</p>
      <div class="dfMcLinked">Largura de cima: <b id="dfMcLinkedWidth">—</b> · Micra dupla de cima: <b id="dfMcLinkedMicra">—</b></div>
      <label for="dfMcMaterial">Material</label>
      <select id="dfMcMaterial"><option value="">Selecione o material</option>
        <option value="pead">PEAD / Alta</option><option value="pebd">PEBD convencional / Baixa</option>
        <option value="pelbd">PEBDL / Linear</option></select>
      <label for="dfMcOrigin">Condição do material</label>
      <select id="dfMcOrigin"><option value="">Selecione a condição</option><option value="virgem">Virgem</option>
        <option value="reciclado">Reciclado</option><option value="mistura">Mistura (material predominante acima)</option></select>
      <label for="dfMcType">Tipo da matriz</label>
      <select id="dfMcType"><option value="">Selecione a matriz</option><option value="alta">Alta / PEAD</option><option value="baixa">Baixa / PEBD</option></select>
      <label for="dfMcApplication">Aplicação para referência de GAP</label>
      <select id="dfMcApplication"><option value="padrao">Filme comum — referência do material</option>
        <option value="stretch">Stretch</option><option value="geomembrana">Geomembrana</option>
        <option value="raschel80">Raschel 80 µm</option><option value="raschel120">Raschel 120 µm</option></select>
      <div class="grid dfMcInputs">
        <div><label for="dfMcDie">Diâmetro da matriz (mm)</label><input id="dfMcDie" inputmode="decimal" placeholder="Ex.: 150"></div>
        <div><label for="dfMcGap">GAP / abertura do lábio (mm)</label><input id="dfMcGap" inputmode="decimal" placeholder="Ex.: 1,5"></div>
      </div>
      <label for="dfMcMode">Micra usada nesta análise</label>
      <select id="dfMcMode"><option value="dupla">Micra dupla — usar campo de cima</option>
        <option value="parede">Micra por parede — informar abaixo</option></select>
      <div id="dfMcWallBox" hidden><label for="dfMcWallMicra">Micra por parede (µm)</label>
        <input id="dfMcWallMicra" inputmode="decimal" placeholder="Ex.: 22,5">
        <p class="dfMcIntro">Sugestão inicial: metade da micra dupla digitada acima. Você pode corrigir este valor aqui.</p></div>
      <div class="dfMcOutcome waiting" id="dfMcOutcome" aria-live="polite">
        <strong id="dfMcStatus">Preencha os campos</strong>
        <p id="dfMcReason">O resultado aparece automaticamente.</p>
      </div>
      <div class="dfMcStats">
        <div><span>BUR</span><b id="dfMcBur">—</b></div><div><span>DDR ESTIMADO</span><b id="dfMcDdr">—</b></div>
        <div><span>GAP UTILIZADO</span><b id="dfMcUsedGap">—</b></div><div><span>GAP DE REFERÊNCIA</span><b id="dfMcReference">—</b></div>
        <div><span>MATERIAL × MATRIZ</span><b id="dfMcFit">—</b></div><div><span>NÍVEL DE ESTIRAMENTO</span><b id="dfMcDrawLevel">—</b></div>
      </div>
      <div class="dfMcInfo"><h3>Principais riscos</h3><ul id="dfMcRisks"><li>Informe todos os campos para avaliar.</li></ul></div>
      <div class="dfMcInfo"><h3>Sugestão de regulagem</h3><ul id="dfMcAdjust"><li>Informe todos os campos para receber sugestões.</li></ul></div>
      <p class="dfMcLimit">Avaliação inicial. “RODA” indica geometria favorável com os dados digitados; confirme na máquina a resina, vazão, pressão, temperatura da massa e estabilidade.</p>
      <details class="dfMcMethod"><summary>Como o app chega ao resultado</summary><p>BUR = 2 × largura fechada (mm) ÷ (π × diâmetro da matriz em mm). DDR aproximado = GAP (mm) ÷ (micra de uma parede convertida para mm × BUR). Se escolher micra dupla, o app divide por dois antes do DDR. As janelas de BUR (PEAD 2,5–4,0; PEBD/PEBDL 2,0–3,2) e os níveis de DDR são pontos de partida, não limites universais. As referências de GAP acima também não bloqueiam sozinhas uma combinação. <a href="https://www.lyondellbasell.com/globalassets/lyb/our-solutions/products/documents/polymers-technical-literature/blown_film_problems.pdf" target="_blank" rel="noopener noreferrer">Referência das fórmulas</a>.</p></details>`;
    ($('dfDieAdvisorTest') || first).insertAdjacentElement('afterend', card);

    const style = document.createElement('style');
    style.id = 'dfMatrixCompatStyle';
    style.textContent = `
      #dfMatrixCompatCard .dfMcIntro,#dfMatrixCompatCard .dfMcLimit,#dfMatrixCompatCard .dfMcMethod{color:#aeb8c7;font-size:13px;line-height:1.5}
      #dfMatrixCompatCard .dfMcLinked{color:#d4e5f4;border:1px solid #36516c;background:#07111d;border-radius:12px;padding:12px;margin:12px 0;font-size:13px;line-height:1.5}
      #dfMatrixCompatCard .dfMcLinked b{color:#ffd36a}
      #dfMatrixCompatCard .dfMcInputs{margin-top:8px}
      #dfMatrixCompatCard .dfMcOutcome{border:2px solid #36516c;background:#07111d;border-radius:16px;padding:17px;margin-top:19px}
      #dfMatrixCompatCard .dfMcOutcome strong{display:block;color:#f8fafc;font-size:clamp(25px,6.5vw,39px);line-height:1.1;font-weight:950;letter-spacing:-.5px}
      #dfMatrixCompatCard .dfMcOutcome p{color:#cbd5e1;font-size:14px;line-height:1.5;margin:11px 0 0}
      #dfMatrixCompatCard .dfMcOutcome.good{border-color:#16a34a;background:#0b2417}
      #dfMatrixCompatCard .dfMcOutcome.good strong{color:#86efac}
      #dfMatrixCompatCard .dfMcOutcome.attention{border-color:#f5a000;background:#2a1c06}
      #dfMatrixCompatCard .dfMcOutcome.attention strong{color:#ffd36a}
      #dfMatrixCompatCard .dfMcOutcome.bad{border-color:#dc4242;background:#2c1113}
      #dfMatrixCompatCard .dfMcOutcome.bad strong{color:#fca5a5}
      #dfMatrixCompatCard .dfMcStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
      #dfMatrixCompatCard .dfMcStats>div{background:#0b1828;border:1px solid #29405a;border-radius:12px;padding:12px 8px;min-width:0}
      #dfMatrixCompatCard .dfMcStats span{display:block;color:#94a3b8;font-size:10px;font-weight:900;line-height:1.25}
      #dfMatrixCompatCard .dfMcStats b{display:block;font-size:17px;margin-top:5px;color:#fff;overflow-wrap:anywhere}
      #dfMatrixCompatCard .dfMcInfo{border-top:1px solid #29405a;padding-top:11px}
      #dfMatrixCompatCard .dfMcInfo h3{font-size:16px;color:#ffd36a;margin:4px 0 8px}
      #dfMatrixCompatCard .dfMcInfo ul{margin:0 0 12px;padding-left:22px;color:#d3deea;line-height:1.5;font-size:14px}
      #dfMatrixCompatCard .dfMcInfo li+li{margin-top:8px}
      #dfMatrixCompatCard .dfMcMethod{border-top:1px solid #29405a;padding-top:10px}
      #dfMatrixCompatCard .dfMcMethod summary{cursor:pointer;color:#ffd36a;font-weight:800}
      #dfMatrixCompatCard .dfMcMethod a{color:#ffd36a}
      @media(max-width:560px){#dfMatrixCompatCard .dfMcStats{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);

    const inputs = ['dfMcMaterial', 'dfMcOrigin', 'dfMcType', 'dfMcApplication', 'dfMcDie', 'dfMcGap', 'dfMcMode', 'dfMcWallMicra'];
    let wallWasEdited = false;
    function fillList(id, items) {
      const list = $(id);
      list.replaceChildren(...items.map(item => {
        const li = document.createElement('li');
        li.textContent = item;
        return li;
      }));
    }
    function syncWallSuggestion() {
      const topValue = number(topMicra.value);
      if (!wallWasEdited && Number.isFinite(topValue) && topValue > 0) {
        $('dfMcWallMicra').value = fmtInput(topValue / 2);
      }
    }
    function update() {
      const micraMode = $('dfMcMode').value;
      const material = $('dfMcMaterial').value;
      const application = $('dfMcApplication').value;
      const gapMm = $('dfMcGap').value;
      const result = analyze({ material, origin: $('dfMcOrigin').value, application,
        dieType: $('dfMcType').value, dieMm: $('dfMcDie').value, gapMm,
        widthCm: width.value, micraMode,
        micra: micraMode === 'dupla' ? topMicra.value : $('dfMcWallMicra').value });
      $('dfMcLinkedWidth').textContent = width.value ? width.value + ' cm' : 'não informada';
      $('dfMcLinkedMicra').textContent = topMicra.value ? topMicra.value + ' µm' : 'não informada';
      $('dfMcStatus').textContent = result.ready ?
        (result.status === 'RODA' ? '🟢 RODA' : result.status === 'RODA COM ATENÇÃO' ? '🟡 RODA COM ATENÇÃO' : '🔴 NÃO RECOMENDADO') : 'Preencha os campos';
      $('dfMcReason').textContent = result.ready ? result.reason : result.message;
      $('dfMcOutcome').className = 'dfMcOutcome ' + (!result.ready ? 'waiting' : result.status === 'RODA' ? 'good' : result.status === 'RODA COM ATENÇÃO' ? 'attention' : 'bad');
      $('dfMcBur').textContent = Number.isFinite(result.bur) ? fmt(result.bur, 2) + ':1' : '—';
      $('dfMcDdr').textContent = result.ready ? fmt(result.ddr, 1) + ':1' : '—';
      const selectedGapReference = gapReferences[application === 'padrao' ? material : application];
      $('dfMcUsedGap').textContent = Number.isFinite(number(gapMm)) ? gapMm + ' mm' : '—';
      $('dfMcReference').textContent = selectedGapReference ? (selectedGapReference.min === selectedGapReference.max ?
        fmtInput(selectedGapReference.min) : fmtInput(selectedGapReference.min) + '–' + fmtInput(selectedGapReference.max)) + ' mm' : '—';
      $('dfMcFit').textContent = result.ready ? result.matrixFit : '—';
      $('dfMcDrawLevel').textContent = result.ready ? result.drawLevel : '—';
      fillList('dfMcRisks', result.ready ? result.risks : ['Informe todos os campos para avaliar.']);
      fillList('dfMcAdjust', result.ready ? result.adjustments : ['Informe todos os campos para receber sugestões.']);
    }
    inputs.forEach(id => { $(id).addEventListener('input', update); $(id).addEventListener('change', update); });
    $('dfMcWallMicra').addEventListener('input', () => { wallWasEdited = true; });
    $('dfMcMode').addEventListener('change', () => {
      $('dfMcWallBox').hidden = $('dfMcMode').value !== 'parede';
      syncWallSuggestion();
      update();
    });
    width.addEventListener('input', update); width.addEventListener('change', update);
    topMicra.addEventListener('input', () => { syncWallSuggestion(); update(); });
    topMicra.addEventListener('change', () => { syncWallSuggestion(); update(); });
    syncWallSuggestion();
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  root.addEventListener('df-ui-ready', mount);
})(typeof window === 'undefined' ? globalThis : window);
