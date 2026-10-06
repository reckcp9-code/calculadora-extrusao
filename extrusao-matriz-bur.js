(function (root) {
  'use strict';

  // A prévia avalia a matriz pelas faixas de BUR configuradas pelo operador.
  // O GAP e o DDR são informações técnicas complementares.
  const MATERIALS = {
    pebd: { label: 'PEBD / convencional', min: 1.8, max: 3, target: 2.5 },
    pelbd: { label: 'PE linear / contrátil', min: 2.4, max: 3.2, target: 2.8 },
    pead: { label: 'PEAD / alta', min: 4, max: 6, target: 5 },
    reciclado: { label: 'PE reciclado (base PEBD)', min: 1.8, max: 3, target: 2.5 }
  };
  const SIZES = [60, 75, 90, 100, 125, 135, 150, 165, 175, 180, 200, 225, 250, 300, 350, 400, 450, 500, 600, 750, 900];
  const fmt = (n, digits) => Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0
  });
  function number(value) {
    if(typeof window.DFParsePtNumber==='function')return window.DFParsePtNumber(value);
    return Number(value);
  }

  function analyze({ material, widthCm, dieMm, gapMm, doubleMicra }) {
    const spec = MATERIALS[material] || MATERIALS.pebd;
    const width = number(widthCm), die = number(dieMm);
    const gap = number(gapMm), micra = number(doubleMicra);
    if (!(width > 0 && width <= 2000)) return {
      ready: false, message: 'Informe a largura do filme fechado no campo acima.'
    };
    const balloonMm = 20 * width / Math.PI;
    const minDie = balloonMm / spec.max;
    const maxDie = balloonMm / spec.min;
    const installed = Number.isFinite(die) && die > 0 && die <= 2000;
    const bur = installed ? balloonMm / die : NaN;
    const keepCurrent = installed && bur >= spec.min - 1e-9 && bur <= spec.max + 1e-9;
    const candidates = SIZES.filter(size => size >= minDie - 1e-9 && size <= maxDie + 1e-9);
    const recommended = keepCurrent ? die :
      candidates.length ? candidates.reduce((best, size) =>
        Math.abs(size - (installed ? die : balloonMm / spec.target)) <
        Math.abs(best - (installed ? die : balloonMm / spec.target)) ? size : best
      ) : NaN;
    const result = {
      ready: true, material: spec.label, recommended, keepCurrent,
      referenceMin: Math.round(minDie), referenceMax: Math.round(maxDie),
      bur, status: '', reason: '', gapAdvice: '', frostAdvice: ''
    };
    if (!installed) {
      result.status = 'Informe a matriz instalada';
      result.reason = 'Informe o diâmetro da matriz em mm para conferir o BUR.';
    } else if (keepCurrent) {
      result.status = 'Recomendada';
      result.reason = 'O BUR de ' + fmt(bur, 2) + ':1 está dentro da referência ' +
        fmt(spec.min, 2) + '–' + fmt(spec.max, 2) +
        ':1 para ' + spec.label + '. Mantenha a matriz atual.';
    } else {
      result.status = 'Fora da referência';
      result.reason = bur > spec.max
        ? 'Matriz pequena para essa largura: BUR ' + fmt(bur, 2) +
          ':1 acima do máximo ' + fmt(spec.max, 2) + ':1.'
        : 'Matriz grande para essa largura: BUR ' + fmt(bur, 2) +
          ':1 abaixo do mínimo ' + fmt(spec.min, 2) + ':1.';
      if (Number.isFinite(recommended)) result.reason +=
        ' Compare com ' + fmt(recommended) + ' mm antes de trocar.';
    }
    if (gap > 0) {
      result.gapAdvice = 'GAP informado: ' + fmt(gap, 1) + ' mm. Confira a referência do material abaixo.';
      if (micra > 0 && Number.isFinite(bur)) result.drawdown =
        gap / ((micra / 2) / 1000 * bur);
    } else result.gapAdvice = 'Informe o GAP para calcular o DDR.';
    result.frostAdvice = 'A linha de névoa depende de resina, temperatura, vazão, refrigeração e produção.';
    if (material === 'reciclado') result.reason += ' Confirme as condições do lote reciclado na máquina.';
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
      $('dfDieSuggested').textContent = data.ready && Number.isFinite(data.recommended) ? (data.keepCurrent ? 'MANTENHA A MATRIZ ATUAL · ' : '') + fmt(data.recommended) + ' mm' : '—';
      $('dfDieSuggestedNote').textContent = data.ready
        ? `Faixa calculada pela referência BUR: aproximadamente ${fmt(data.referenceMin)} a ${fmt(data.referenceMax)} mm. Se a matriz instalada atende, ela é mantida. Confirme a disponibilidade das alternativas na máquina.` : '';
      $('dfDieGapAdvice').textContent = data.ready ? data.gapAdvice : 'Informe a largura para começar.';
      $('dfDieFrostAdvice').textContent = data.ready ? data.frostAdvice : 'Informe a largura para começar.';
      $('dfDieOutcome').className = 'dfDieOutcome ' + (data.status === 'Recomendada' ? 'good' :
        data.status === 'Fora da referência' ? 'bad' : '');
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
