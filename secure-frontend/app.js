(() => {
  const $ = id => document.getElementById(id);
  const API = String(window.DF_API_URL || '').replace(/\/$/, '');
  const K_KEY = 'df_secure_license_v1';
  const D_KEY = 'df_secure_device_v1';
  let token = sessionStorage.getItem('df_secure_token_v1') || '';
  let foCount = 0;

  function num(v) {
    let s = String(v ?? '').trim().replace(/\s/g, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  function val(id) { return num($(id)?.value); }
  function fmt(v, d = 2) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
  }
  function money(v) { return 'R$ ' + fmt(v, 2); }
  function text(id, value) { if ($(id)) $(id).textContent = value; }
  function msg(t, cls = '') {
    const e = $('globalMsg');
    if (e) { e.textContent = t || ''; e.className = 'status ' + cls; }
  }
  function licenseMsg(t, cls = '') {
    const e = $('licenseMsg');
    if (e) { e.textContent = t || ''; e.className = 'licenseMsg ' + cls; }
  }
  function deviceId() {
    let id = localStorage.getItem(D_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(D_KEY, id);
    }
    return id;
  }
  function ensureApi() {
    if (!API) throw new Error('A API privada ainda não foi configurada.');
  }
  async function rawPost(path, body, useToken = true) {
    ensureApi();
    const headers = { 'Content-Type': 'application/json', 'X-DF-Device': deviceId() };
    if (useToken && token) headers.Authorization = 'Bearer ' + token;
    const r = await fetch(API + path, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' });
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok || j.ok === false) {
      const e = new Error(j.error || ('Erro HTTP ' + r.status));
      e.status = r.status;
      throw e;
    }
    return j;
  }
  async function login(key, silent = false) {
    const k = String(key || '').trim();
    if (!k) throw new Error('Digite sua licença.');
    if (!silent) licenseMsg('Verificando licença...');
    const j = await rawPost('/auth', { licenseKey: k, deviceId: deviceId() }, false);
    token = j.token || '';
    if (!token) throw new Error('Servidor não retornou uma sessão válida.');
    sessionStorage.setItem('df_secure_token_v1', token);
    localStorage.setItem(K_KEY, k);
    $('licenseGate').style.display = 'none';
    $('app').style.display = 'block';
    licenseMsg('Licença válida.', 'ok');
    return true;
  }
  async function calc(type, input, retried = false) {
    try {
      const j = await rawPost('/calc', { type, input }, true);
      return j.result || {};
    } catch (e) {
      if (e.status === 401 && !retried) {
        const saved = localStorage.getItem(K_KEY);
        if (saved) {
          await login(saved, true);
          return calc(type, input, true);
        }
      }
      throw e;
    }
  }
  async function run(task) {
    msg('Calculando no servidor...', 'warn');
    try {
      await task();
      msg('Cálculo concluído pela API privada.', 'ok');
    } catch (e) {
      msg(e.message || 'Não foi possível calcular.', 'bad');
    }
  }
  function densityEx() {
    return $('exD').value === 'manual' ? val('exDManual') : num($('exD').value);
  }

  function setupTabs() {
    document.querySelectorAll('.tab[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.page;
        document.querySelectorAll('.tab[data-page]').forEach(x => x.classList.toggle('on', x === btn));
        document.querySelectorAll('.page').forEach(x => x.classList.remove('on'));
        $('pg-' + p)?.classList.add('on');
        window.scrollTo(0, 0);
      });
    });
  }

  function addFormulaRow(nome = '', pct = '', preco = '') {
    foCount++;
    const id = foCount;
    const d = document.createElement('div');
    d.className = 'row';
    d.dataset.row = String(id);
    d.innerHTML = `
      <div class="grid">
        <div><label>Material</label><input class="foNomeMat" value="${escapeHtml(nome)}" placeholder="Ex.: PEAD"></div>
        <div><label>Porcentagem %</label><input class="foPctMat" inputmode="decimal" value="${escapeHtml(pct)}"></div>
        <div><label>Preço por kg (R$)</label><input class="foPrecoMat" inputmode="decimal" value="${escapeHtml(preco)}"></div>
      </div>
      <div class="rowBtns"><button class="btn" type="button" data-remove="${id}">REMOVER</button></div>`;
    $('foRows').appendChild(d);
    d.querySelector('[data-remove]')?.addEventListener('click', () => d.remove());
  }
  function escapeHtml(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function formulaRows() {
    return [...document.querySelectorAll('#foRows .row')].map(row => ({
      nome: row.querySelector('.foNomeMat')?.value || '',
      pct: num(row.querySelector('.foPctMat')?.value),
      precoKg: num(row.querySelector('.foPrecoMat')?.value),
    })).filter(x => x.nome || x.pct || x.precoKg);
  }

  function bindCalculations() {
    $('exD').addEventListener('change', () => $('exDManualBox').classList.toggle('hidden', $('exD').value !== 'manual'));

    $('exCalc').addEventListener('click', () => run(async () => {
      const r = await calc('extrusao', { largura: val('exL'), micra: val('exM'), densidade: densityEx(), pesoMedido: val('exP') });
      text('exPesoIdeal', fmt(r.pesoIdeal, 2) + ' g/m');
      text('exMicraReal', fmt(r.micraReal, 2) + ' µm');
      text('exDifMicra', (r.diferencaMicraPct >= 0 ? '+' : '') + fmt(r.diferencaMicraPct, 2) + '% em relação à desejada');
    }));

    $('corCalc').addEventListener('click', () => run(async () => {
      const r = await calc('correcao', {
        largura: val('exL'), micra: val('exM'), densidade: densityEx(), pesoMedido: val('exP'),
        massa: val('corMassa'), puxador: val('corPux'), ar: val('corAr')
      });
      text('corDif', (r.diferencaPct >= 0 ? '+' : '') + fmt(r.diferencaPct, 2) + '%');
      text('corPuxRes', r.puxadorRecomendado ? fmt(r.puxadorRecomendado, 0) + ' RPM' : '—');
      text('corMassaRes', r.massaRecomendada ? fmt(r.massaRecomendada, 0) + ' RPM' : '—');
      text('corArRes', r.arAtual ? fmt(r.arAtual, 0) + ' RPM' : '—');
    }));

    $('prodCalc').addEventListener('click', () => run(async () => {
      const r = await calc('producao', { massa: val('prodMassa'), puxador: val('prodPux'), ar: val('prodAr'), percentual: val('prodPct') });
      text('prodMassaRes', r.massaNova ? fmt(r.massaNova, 0) + ' RPM' : '—');
      text('prodPuxRes', r.puxadorNovo ? fmt(r.puxadorNovo, 0) + ' RPM' : '—');
      text('prodArRes', r.arNovo ? fmt(r.arNovo, 0) + ' RPM' : '—');
    }));

    $('saCalc').addEventListener('click', () => run(async () => {
      const r = await calc('sacola', { largura: val('saL'), comprimento: val('saC'), micra: val('saM'), densidade: val('saD'), descontoPct: val('saDesc'), quantidade: val('saQ') });
      text('saPeso', r.pesoUnidade ? fmt(r.pesoUnidade, 2) + ' g' : '—');
      text('saQtdPeso', r.pesoQuantidadeKg ? fmt(r.pesoQuantidadeKg, 3) + ' kg' : '—');
      text('saPorKg', r.unidadesPorKg ? fmt(r.unidadesPorKg, 0) + ' un.' : '—');
      text('saMil', r.pesoMilKg ? fmt(r.pesoMilKg, 2) + ' kg' : '—');
    }));

    $('cuCalc').addEventListener('click', () => run(async () => {
      const r = await calc('custo', { pesoKg: val('cuPeso'), custoKg: val('cuCusto'), vendaKg: val('cuVenda'), quantidade: val('cuQ') });
      text('cuCustoU', money(r.custoUnidade || 0));
      text('cuVendaU', money(r.vendaUnidade || 0));
      text('cuLucro', money(r.lucroTotal || 0));
    }));

    $('foAdd').addEventListener('click', () => addFormulaRow());
    $('foCalc').addEventListener('click', () => run(async () => {
      const rows = formulaRows();
      const r = await calc('formulacao', { totalKg: val('foTotal'), rows: rows.map(x => ({ pct: x.pct, precoKg: x.precoKg })) });
      text('foPct', fmt(r.totalPct, 2) + '%');
      text('foKg', fmt(r.somaKg, 3) + ' kg');
      text('foCusto', money(r.custoTotal || 0));
      text('foCustoKg', money(r.custoKgFinal || 0) + '/kg');
      const e = $('foStatus');
      if (Math.abs(Number(r.diferencaPara100 || 0)) <= 0.05) { e.textContent = 'FORMULAÇÃO FECHADA 100% ✅'; e.className = 'status ok'; }
      else if (Number(r.diferencaPara100) > 0) { e.textContent = 'FALTAM ' + fmt(r.diferencaPara100, 2) + '%'; e.className = 'status warn'; }
      else { e.textContent = 'PASSOU ' + fmt(Math.abs(r.diferencaPara100), 2) + '%'; e.className = 'status bad'; }
    }));

    $('boCalc').addEventListener('click', () => run(async () => {
      const r = await calc('bobina', {
        larguraFisica: val('boL'), micra: val('boM'), densidade: val('boD'), fatorApertoPct: val('boK'), tipo: $('boTipo').value,
        sanfonaCadaLado: val('boSanf'), raioExterno: val('boRe'), raioNucleo: val('boRi'), pesoTubeteKg: val('boCore'),
        pesoDesejadoKg: val('boTarget'), pesoDesejadoIncluiTubete: $('boInclui').checked
      });
      const a = r.raioParaPeso || {}, b = r.pesoParaRaio || {};
      text('boPeso', a.pesoTotalKg ? fmt(a.pesoTotalKg, 3) + ' kg' : '—');
      text('boMetros', a.metros ? fmt(a.metros, 1) + ' m' : (b.metros ? fmt(b.metros, 1) + ' m' : '—'));
      text('boRaio', b.raioNecessarioCm ? fmt(b.raioNecessarioCm, 2) + ' cm' : '—');
      text('boDiam', b.diametroNecessarioCm ? fmt(b.diametroNecessarioCm, 2) + ' cm' : '—');
    }));

    $('boCal').addEventListener('click', () => run(async () => {
      const r = await calc('bobina_calibrar', {
        larguraFisica: val('boL'), densidade: val('boD'), tipo: $('boTipo').value, sanfonaCadaLado: val('boSanf'),
        raioExterno: val('boRe'), raioNucleo: val('boRi'), pesoTubeteKg: val('boCore'), pesoRealKg: val('boCalPeso'),
        pesoRealIncluiTubete: $('boCalInclui').value === 'sim'
      });
      text('boCalRes', fmt(r.fatorApertoBasePct, 2) + '%');
      if (r.fatorApertoBasePct) $('boK').value = fmt(r.fatorApertoBasePct, 2);
    }));
  }

  async function boot() {
    setupTabs();
    bindCalculations();
    addFormulaRow();
    text('deviceText', 'ID deste aparelho: ' + deviceId());

    $('loginBtn').addEventListener('click', async () => {
      const btn = $('loginBtn');
      btn.disabled = true;
      try { await login($('licenseKey').value, false); }
      catch (e) { licenseMsg(e.message || 'Falha ao validar licença.', 'bad'); }
      finally { btn.disabled = false; }
    });
    $('licenseKey').addEventListener('keydown', e => { if (e.key === 'Enter') $('loginBtn').click(); });

    const saved = localStorage.getItem(K_KEY);
    if (saved) {
      $('licenseKey').value = saved;
      if (API) {
        try { await login(saved, true); }
        catch (_) { sessionStorage.removeItem('df_secure_token_v1'); token = ''; }
      }
    }
    if (!API) licenseMsg('Frontend pronto. Falta configurar a URL do Cloudflare Worker.', 'warn');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
