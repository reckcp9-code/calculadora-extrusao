(function (root) {
  'use strict';

  // Faixas iniciais de BUR para triagem. Não substituem a ficha da resina,
  // os limites da linha nem um teste com a produção e refrigeração reais.
  const MATERIALS = {
    pebd: { label: 'PEBD', min: 2, max: 3, target: 2.5 },
    pelbd: { label: 'PE linear', min: 2, max: 3, target: 2.5 },
    pead: { label: 'PEAD', min: 2.5, max: 4, target: 3.2 },
    reciclado: { label: 'PE reciclado', min: 2, max: 3, target: 2.5 }
  };
  const SIZES = [60, 75, 90, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750, 900];
  const fmt = (n, digits) => Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0
  });
  function number(value) {
    const str = String(value == null ? '' : value).trim().replace(/\s/g, '');
    if (!str) return NaN;
    const normalized = str.includes(',') && str.includes('.')
      ? str.replace(/\./g, '').replace(',', '.') : str.replace(',', '.');
    return Number(normalized);
  }

  function analyze({ material, widthCm, dieMm, gapMm, doubleMicra }) {
    const spec = MATERIALS[material] || MATERIALS.pebd;
    const width = number(widthCm);
    const die = number(dieMm);
    const gap = number(gapMm);
    const micra = number(doubleMicra);
    if (!(width > 0 && width <= 2000)) return { ready: false, message: 'Informe a largura do filme fechado no campo acima.' };

    // A largura achatada equivale à metade da circunferência do balão.
    const bubbleMm = width * 20 / Math.PI;
    const minDie = bubbleMm / spec.max;
    const maxDie = bubbleMm / spec.min;
    const candidates = SIZES.filter(size => size >= minDie && size <= maxDie);
    const recommended = candidates.length ? candidates.reduce((best, size) =>
      Math.abs(bubbleMm / size - spec.target) < Math.abs(bubbleMm / best - spec.target) ? size : best
    ) : Math.max(10, Math.round(bubbleMm / spec.target / 10) * 10);

    const result = { ready: true, material: spec.label, recommended, referenceMin: Math.round(minDie),
      referenceMax: Math.round(maxDie), bur: NaN, status: '', reason: '', gapAdvice: '', frostAdvice: '' };
    if (!(die > 0 && die <= 2000)) {
      result.status = 'Informe a matriz instalada';
      result.reason = 'A sugestão de matriz já aparece abaixo. Para avaliar a sua, informe o diâmetro em mm.';
    } else {
      result.bur = bubbleMm / die;
      const low = result.bur < spec.min;
      const high = result.bur > spec.max;
      if (!low && !high) {
        result.status = 'Boa para testar';
        result.reason = 'O diâmetro da matriz combina com a largura dentro da faixa inicial de expansão para ' + spec.label + '.';
      } else if (result.bur >= spec.min * .9 && result.bur <= spec.max * 1.1) {
        result.status = 'No limite';
        result.reason = low ? 'Matriz grande para essa largura: o balão expande pouco.'
          : 'Matriz pequena para essa largura: o balão precisa expandir bastante.';
      } else {
        result.status = 'Não recomendada';
        result.reason = low ? 'Matriz grande demais como ponto de partida para essa largura.'
          : 'Matriz pequena demais como ponto de partida para essa largura.';
      }
    }

    if (Number.isFinite(gap) && gap > 0) {
      if (gap < .8) result.gapAdvice = 'Gap estreito: confira a pressão, a vazão e a ficha da resina antes de rodar.';
      else if (gap > 2.5) result.gapAdvice = 'Gap largo: o filme terá mais estiramento; confira a estabilidade e a micra na máquina.';
      else result.gapAdvice = 'Gap informado: confira pressão, vazão e estabilidade na máquina. A abertura ideal depende da resina e da produção.';
      if (Number.isFinite(micra) && micra > 0 && Number.isFinite(result.bur)) {
        // Micra informada é das duas paredes; cada parede tem metade dessa espessura.
        result.drawdown = gap * 1000 / ((micra / 2) * result.bur);
        if (result.drawdown < 1) result.gapAdvice += ' A combinação com essa micra merece revisão: a espessura informada é maior que a redução geométrica calculada.';
        else if (result.drawdown > 30) result.gapAdvice += ' Para a micra informada, esta combinação exige bastante estiramento; observe se o balão aguenta estável.';
      }
    } else result.gapAdvice = 'Informe o gap para receber um alerta inicial sobre a abertura.';

    result.frostAdvice = 'A altura da linha de névoa não sai só da largura ou da matriz. Ela muda com a resina, massa, temperatura e refrigeração. Meça a altura real a partir da matriz; procure uma linha nivelada e um balão estável.';
    if (material === 'reciclado') result.reason += ' Com reciclado, confirme com um teste: o lote pode mudar o comportamento do balão.';
    return result;
  }

  root.DFDieAdvisorTest = { analyze };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  let mounted = false;

  function mount() {
    if (mounted || $('dfDieAdvisorTest')) return;
    const page = $('pgEx');
    const width = $('exL');
    const micra = $('exM');
    if (!page || !width || !micra) return;
    const first = page.querySelector(':scope > .card');
    if (!first) return;
    mounted = true;
    const card = document.createElement('div');
    card.id = 'dfDieAdvisorTest';
    card.className = 'card dfExVisible';
    card.dataset.dfExGroup = 'extrusao';
    card.innerHTML = `
      <span class="tag">EXTRUSÃO</span>
      <h2>Qual matriz usar neste filme?</h2>
      <p class="dfDieIntro">Digite a largura e a micra no campo acima. Aqui você informa o material e, se quiser comparar, a matriz da máquina.</p>
      <label for="dfDieMaterial">Material do filme</label>
      <select id="dfDieMaterial"><option value="pebd">PEBD / convencional</option><option value="pelbd">PE linear</option><option value="pead">PEAD / alta</option><option value="reciclado">PE reciclado</option></select>
      <div class="grid">
        <div><label for="dfDieDiameter">Matriz instalada (mm)</label><input id="dfDieDiameter" inputmode="decimal" placeholder="Ex.: 150"></div>
        <div><label for="dfDieGap">Gap da matriz (mm)</label><input id="dfDieGap" inputmode="decimal" placeholder="Ex.: 1,5"></div>
      </div>
      <div class="dfDieReading" id="dfDieReading">Largura e micra: informe no campo acima.</div>
      <div class="dfDieOutcome" id="dfDieOutcome" aria-live="polite">
        <strong id="dfDieStatus">Informe a largura do filme</strong>
        <p id="dfDieReason">O resultado aparece automaticamente.</p>
      </div>
      <div class="dfDieRecommendation"><span>MATRIZ SUGERIDA</span><strong id="dfDieSuggested">—</strong><p id="dfDieSuggestedNote"></p></div>
      <div class="dfDieGuidance"><b>Gap</b><p id="dfDieGapAdvice"></p></div>
      <div class="dfDieGuidance"><b>Linha de névoa</b><p id="dfDieFrostAdvice"></p></div>
      <p class="dfDieLimit">Orientação inicial. Confirme com o tipo exato da resina, a capacidade da linha e o teste do balão.</p>`;
    first.insertAdjacentElement('afterend', card);

    const style = document.createElement('style');
    style.id = 'dfDieAdvisorTestStyle';
    style.textContent = `
      #dfDieAdvisorTest .dfDieIntro,#dfDieAdvisorTest .dfDieLimit{color:#aeb8c7;font-size:13px;line-height:1.45}
      #dfDieAdvisorTest .dfDieReading{color:#d6e4f2;font-size:13px;font-weight:700;margin:15px 0 8px}
      #dfDieAdvisorTest .dfDieOutcome{border:1px solid #36516c;background:#07111d;border-radius:14px;padding:14px;margin-top:12px}
      #dfDieAdvisorTest .dfDieOutcome strong{font-size:21px;color:#f8fafc}
      #dfDieAdvisorTest .dfDieOutcome p,#dfDieAdvisorTest .dfDieGuidance p,#dfDieAdvisorTest .dfDieRecommendation p{margin:7px 0 0;line-height:1.45;font-size:13px;color:#cbd5e1}
      #dfDieAdvisorTest .dfDieOutcome.good{border-color:#16a34a;background:#0c2118}
      #dfDieAdvisorTest .dfDieOutcome.good strong{color:#86efac}
      #dfDieAdvisorTest .dfDieOutcome.limit{border-color:#f5a000;background:#241a08}
      #dfDieAdvisorTest .dfDieOutcome.limit strong{color:#ffd36a}
      #dfDieAdvisorTest .dfDieOutcome.bad{border-color:#b93838;background:#2a1111}
      #dfDieAdvisorTest .dfDieOutcome.bad strong{color:#fca5a5}
      #dfDieAdvisorTest .dfDieRecommendation{background:#231800;border:1px solid #b98516;border-radius:14px;padding:14px;margin-top:10px}
      #dfDieAdvisorTest .dfDieRecommendation span{display:block;font-size:11px;font-weight:900;color:#ffd36a}
      #dfDieAdvisorTest .dfDieRecommendation strong{display:block;margin-top:3px;color:#fff;font-size:25px}
      #dfDieAdvisorTest .dfDieGuidance{padding:11px 0;border-bottom:1px solid #263244}
      #dfDieAdvisorTest .dfDieGuidance b{color:#ffd36a}
      #dfDieAdvisorTest .dfDieLimit{margin-bottom:0}`;
    document.head.appendChild(style);

    function update() {
      const data = analyze({ material: $('dfDieMaterial').value, widthCm: width.value,
        doubleMicra: micra.value, dieMm: $('dfDieDiameter').value, gapMm: $('dfDieGap').value });
      $('dfDieReading').textContent = `Largura: ${width.value || '—'} cm · Micra dupla: ${micra.value || '—'} µm`;
      $('dfDieStatus').textContent = data.ready ? data.status : 'Informe a largura do filme';
      $('dfDieReason').textContent = data.ready ? data.reason : data.message;
      $('dfDieSuggested').textContent = data.ready ? fmt(data.recommended) + ' mm' : '—';
      $('dfDieSuggestedNote').textContent = data.ready
        ? `Faixa geométrica inicial: aproximadamente ${fmt(data.referenceMin)} a ${fmt(data.referenceMax)} mm. Sugestão arredondada para um diâmetro comum; confirme a disponibilidade na máquina.` : '';
      $('dfDieGapAdvice').textContent = data.ready ? data.gapAdvice : 'Informe a largura para começar.';
      $('dfDieFrostAdvice').textContent = data.ready ? data.frostAdvice : 'Informe a largura para começar.';
      $('dfDieOutcome').className = 'dfDieOutcome ' + (data.status === 'Boa para testar' ? 'good' :
        data.status === 'No limite' ? 'limit' : data.status === 'Não recomendada' ? 'bad' : '');
    }
    [width, micra, $('dfDieMaterial'), $('dfDieDiameter'), $('dfDieGap')].forEach(el => {
      el.addEventListener('input', update); el.addEventListener('change', update);
    });
    let chosenByOperator = false;
    $('dfDieMaterial').addEventListener('change', () => { chosenByOperator = true; });
    function syncDensity() {
      if (chosenByOperator) return;
      const density = $('exDs')?.value;
      $('dfDieMaterial').value = density === '0.952' ? 'pead' : density === '0.918' ? 'pelbd' : 'pebd';
      update();
    }
    $('exDs')?.addEventListener('change', syncDensity);
    syncDensity();
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  root.addEventListener('df-ui-ready', mount);
})(typeof window === 'undefined' ? globalThis : window);
