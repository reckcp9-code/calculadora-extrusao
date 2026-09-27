(function (root) {
  'use strict';

  // Triagem inicial; estas janelas não são limites universais de resina/máquina.
  // BUR = 2 × largura achatada / (π × diâmetro da matriz).
  // DDR aproximado = gap / (espessura de uma parede × BUR).
  // Referência das fórmulas: LyondellBasell, How to Solve Blown Film Problems.
  const materials = {
    'pead-virgem': { name: 'PEAD virgem', family: 'PEAD', origin: 'virgem' },
    'pead-reciclado': { name: 'PEAD reciclado', family: 'PEAD', origin: 'reciclado' },
    'pebd-virgem': { name: 'PEBD virgem', family: 'PEBD', origin: 'virgem' },
    'pebd-reciclado': { name: 'PEBD reciclado', family: 'PEBD', origin: 'reciclado' },
    'pelbd-virgem': { name: 'PELBD virgem', family: 'PELBD', origin: 'virgem' },
    'pelbd-reciclado': { name: 'PELBD reciclado', family: 'PELBD', origin: 'reciclado' }
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
    const dieMm = number(input.dieMm);
    const gapMm = number(input.gapMm);
    const widthCm = number(input.widthCm);
    const doubleMicra = number(input.doubleMicra);
    const preliminaryBur = dieMm >= 10 && dieMm <= 2000 && widthCm >= 1 && widthCm <= 2000
      ? (2 * widthCm * 10) / (Math.PI * dieMm) : NaN;
    const incomplete = message => ({ ready: false, message, bur: preliminaryBur });
    if (!material) return incomplete('Selecione o material do filme.');
    if (!labels[input.dieType]) return incomplete('Selecione o tipo da matriz.');
    const fields = [
      [dieMm, 10, 2000, 'diâmetro da matriz (10 a 2.000 mm)'],
      [gapMm, 0.1, 10, 'abertura do lábio (0,1 a 10 mm)'],
      [widthCm, 1, 2000, 'largura do filme fechado (1 a 2.000 cm)'],
      [doubleMicra, 2, 1000, 'micra desejada da parede dupla (2 a 1.000 µm)']
    ];
    const missing = fields.find(([value, min, max]) => !Number.isFinite(value) || value < min || value > max);
    if (missing) return incomplete('Informe ou confira ' + missing[3] + '.');

    const bur = (2 * widthCm * 10) / (Math.PI * dieMm);
    const ddr = (gapMm * 1000) / (bur * (doubleMicra / 2));
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
      add(1, material.name + ' em matriz de ' + labels[input.dieType] + ': pode rodar, mas o nome da matriz não informa sua geometria interna nem a pressão que a resina terá.',
        'Faça teste gradual e acompanhe pressão, temperatura da massa, formação do pescoço e estabilidade do balão.',
        'o material e o tipo de matriz pedem conferência na máquina');
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

    const ddrAttention = material.origin === 'reciclado' ? 40 : 55;
    const ddrHigh = material.origin === 'reciclado' ? 65 : 85;
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

    if (material.origin === 'reciclado' && doubleMicra < 25) {
      add(1, 'Filme de ' + fmtInput(doubleMicra) + ' µm duplos com reciclado: variação do lote pode tornar a micra e o balão instáveis.',
        'Confirme a ficha do lote e meça a micra em vários pontos após estabilizar.',
        'a micra fina com reciclado exige controle do lote');
    } else if (doubleMicra < 10) {
      add(1, 'Micra dupla abaixo de 10 µm: confira a capacidade da linha e a uniformidade em toda a largura.',
        'Valide o mínimo de espessura que a linha e a resina conseguem manter.',
        'a micra é muito fina para uma avaliação só geométrica');
    }

    const status = severe || score >= 4 ? 'NÃO RECOMENDADO' : score ? 'RODA COM ATENÇÃO' : 'RODA';
    const level = status === 'RODA' ? 'Alta' : status === 'RODA COM ATENÇÃO' ? 'Média' : 'Baixa';
    const geometry = `Com ${fmtInput(widthCm)} cm de largura fechada e matriz de ${fmtInput(dieMm)} mm, o BUR é ${fmt(bur, 2)}:1. ` +
      `O lábio de ${fmtInput(gapMm)} mm com ${fmtInput(doubleMicra)} µm duplos dá estiramento geométrico aproximado de ${fmt(ddr, 1)}:1.`;
    const reason = geometry + ' Janela inicial de ' + material.family + ': ' + fmt(band.min, 1) + ' a ' + fmt(band.max, 1) + ':1. ' +
      (explanations.length ? 'Classificação: ' + explanations.slice(0, 3).join('; ') + '.' :
        'Material e tipo de matriz correspondem, sem alerta geométrico forte nos valores informados.');
    if (!risks.length) risks.push('Sem alerta geométrico forte; pressão, temperatura da massa e estabilidade só podem ser confirmadas na máquina.');
    if (!adjustments.length) adjustments.push('Faça partida gradual e confirme micra real, pressão, temperatura da massa e estabilidade do balão.');
    if (material.origin === 'reciclado' && !mismatch) {
      adjustments.push('Confirme a estabilidade do lote reciclado antes de manter a produção.');
    }
    return { ready: true, status, level, score, bur, ddr, reason, risks, adjustments,
      material: material.name, dieType: labels[input.dieType], band };
  }

  root.DFMatrixCompatibilityTest = { analyze };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  let mounted = false;

  function mount() {
    if (mounted) return;
    const page = $('pgEx');
    const nav = $('dfExTabs');
    if (!page || !nav || $('dfMatrixCompatCard')) return;
    mounted = true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dfExTab';
    button.dataset.tab = 'compatibilidade';
    button.textContent = 'COMPATIBILIDADE DA MATRIZ';
    button.setAttribute('aria-label', 'Compatibilidade da Matriz');
    nav.appendChild(button);

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'dfMatrixCompatCard';
    card.dataset.dfExGroup = 'compatibilidade';
    card.innerHTML = `
      <span class="tag">TESTE · EXTRUSÃO</span>
      <h2>Compatibilidade da Matriz</h2>
      <p class="dfMcIntro">Informe o material e as medidas da máquina. A largura é do filme <b>fechado</b>; a micra é das <b>duas paredes</b>.</p>
      <label for="dfMcMaterial">Material</label>
      <select id="dfMcMaterial"><option value="">Selecione o material</option>
        <option value="pead-virgem">PEAD virgem</option><option value="pead-reciclado">PEAD reciclado</option>
        <option value="pebd-virgem">PEBD virgem</option><option value="pebd-reciclado">PEBD reciclado</option>
        <option value="pelbd-virgem">PELBD virgem</option><option value="pelbd-reciclado">PELBD reciclado</option></select>
      <label for="dfMcType">Tipo da matriz</label>
      <select id="dfMcType"><option value="">Selecione a matriz</option><option value="alta">Alta / PEAD</option><option value="baixa">Baixa / PEBD</option></select>
      <div class="grid dfMcInputs">
        <div><label for="dfMcDie">Diâmetro da matriz (mm)</label><input id="dfMcDie" inputmode="decimal" placeholder="Ex.: 150"></div>
        <div><label for="dfMcGap">Abertura do lábio (mm)</label><input id="dfMcGap" inputmode="decimal" placeholder="Ex.: 1,5"></div>
        <div><label for="dfMcWidth">Largura do filme fechado (cm)</label><input id="dfMcWidth" inputmode="decimal" placeholder="Ex.: 75"></div>
        <div><label for="dfMcMicra">Micra desejada, parede dupla (µm)</label><input id="dfMcMicra" inputmode="decimal" placeholder="Ex.: 45"></div>
      </div>
      <div class="dfMcOutcome waiting" id="dfMcOutcome" aria-live="polite">
        <strong id="dfMcStatus">Preencha os campos</strong>
        <p id="dfMcReason">O resultado aparece automaticamente.</p>
      </div>
      <div class="dfMcStats"><div><span>BUR CALCULADO</span><b id="dfMcBur">—</b></div><div><span>COMPATIBILIDADE</span><b id="dfMcLevel">—</b></div><div><span>ESTIRAMENTO (DDR)</span><b id="dfMcDdr">—</b></div></div>
      <div class="dfMcInfo"><h3>Principais riscos</h3><ul id="dfMcRisks"><li>Informe todos os campos para avaliar.</li></ul></div>
      <div class="dfMcInfo"><h3>O que ajustar ou conferir</h3><ul id="dfMcAdjust"><li>Informe todos os campos para receber sugestões.</li></ul></div>
      <p class="dfMcLimit">Avaliação inicial. “RODA” indica geometria favorável com os dados digitados; confirme na máquina a resina, vazão, pressão, temperatura da massa e estabilidade.</p>
      <details class="dfMcMethod"><summary>Como o app chega ao resultado</summary><p>BUR = 2 × largura fechada (mm) ÷ (π × diâmetro da matriz em mm). DDR aproximado = abertura do lábio (µm) ÷ (BUR × micra de uma parede). A micra informada é dupla. As janelas de BUR são pontos de partida do app (PEAD 2,5–4,0; PEBD/PELBD 2,0–3,2), não limites universais. O tipo de matriz e a origem reciclada mudam os alertas; os limites de estiramento são triagem, não garantia de rodagem. <a href="https://www.lyondellbasell.com/globalassets/lyb/our-solutions/products/documents/polymers-technical-literature/blown_film_problems.pdf" target="_blank" rel="noopener noreferrer">Referência das fórmulas</a>.</p></details>`;
    page.appendChild(card);

    const style = document.createElement('style');
    style.id = 'dfMatrixCompatStyle';
    style.textContent = `
      body.dfSectionMode #pgEx.dfExTabsReady>#dfMatrixCompatCard{display:none!important}
      body.dfSectionMode.dfMatrixCompatActive #pgEx.dfExTabsReady>.card:not(#dfMatrixCompatCard){display:none!important}
      body.dfSectionMode.dfMatrixCompatActive #pgEx.dfExTabsReady>#dfMatrixCompatCard{display:block!important}
      #dfMatrixCompatCard .dfMcIntro,#dfMatrixCompatCard .dfMcLimit,#dfMatrixCompatCard .dfMcMethod{color:#aeb8c7;font-size:13px;line-height:1.5}
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
      #dfMatrixCompatCard .dfMcStats b{display:block;font-size:19px;margin-top:5px;color:#fff;overflow-wrap:anywhere}
      #dfMatrixCompatCard .dfMcInfo{border-top:1px solid #29405a;padding-top:11px}
      #dfMatrixCompatCard .dfMcInfo h3{font-size:16px;color:#ffd36a;margin:4px 0 8px}
      #dfMatrixCompatCard .dfMcInfo ul{margin:0 0 12px;padding-left:22px;color:#d3deea;line-height:1.5;font-size:14px}
      #dfMatrixCompatCard .dfMcInfo li+li{margin-top:8px}
      #dfMatrixCompatCard .dfMcMethod{border-top:1px solid #29405a;padding-top:10px}
      #dfMatrixCompatCard .dfMcMethod summary{cursor:pointer;color:#ffd36a;font-weight:800}
      #dfMatrixCompatCard .dfMcMethod a{color:#ffd36a}
      @media(max-width:380px){#dfMatrixCompatCard .dfMcStats{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);

    const inputs = ['dfMcMaterial', 'dfMcType', 'dfMcDie', 'dfMcGap', 'dfMcWidth', 'dfMcMicra'];
    function fillList(id, items) {
      const list = $(id);
      list.replaceChildren(...items.map(item => {
        const li = document.createElement('li');
        li.textContent = item;
        return li;
      }));
    }
    function update() {
      const [material, dieType, dieMm, gapMm, widthCm, doubleMicra] = inputs.map(id => $(id).value);
      const result = analyze({ material, dieType, dieMm, gapMm, widthCm, doubleMicra });
      $('dfMcStatus').textContent = result.ready ?
        (result.status === 'RODA' ? '🟢 RODA' : result.status === 'RODA COM ATENÇÃO' ? '🟡 RODA COM ATENÇÃO' : '🔴 NÃO RECOMENDADO') : 'Preencha os campos';
      $('dfMcReason').textContent = result.ready ? result.reason : result.message;
      $('dfMcOutcome').className = 'dfMcOutcome ' + (!result.ready ? 'waiting' : result.status === 'RODA' ? 'good' : result.status === 'RODA COM ATENÇÃO' ? 'attention' : 'bad');
      $('dfMcBur').textContent = Number.isFinite(result.bur) ? fmt(result.bur, 2) + ':1' : '—';
      $('dfMcLevel').textContent = result.ready ? result.level : '—';
      $('dfMcDdr').textContent = result.ready ? fmt(result.ddr, 1) + ':1' : '—';
      fillList('dfMcRisks', result.ready ? result.risks : ['Informe todos os campos para avaliar.']);
      fillList('dfMcAdjust', result.ready ? result.adjustments : ['Informe todos os campos para receber sugestões.']);
    }
    inputs.forEach(id => { $(id).addEventListener('input', update); $(id).addEventListener('change', update); });
    nav.addEventListener('click', event => {
      const selected = event.target.closest('.dfExTab');
      if (selected) document.body.classList.toggle('dfMatrixCompatActive', selected.dataset.tab === 'compatibilidade');
    }, true);
    $('btEx')?.addEventListener('click', () => document.body.classList.remove('dfMatrixCompatActive'), true);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  root.addEventListener('df-ui-ready', mount);
})(typeof window === 'undefined' ? globalThis : window);
