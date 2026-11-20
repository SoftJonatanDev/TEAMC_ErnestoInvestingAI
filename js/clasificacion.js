/* Ernesto Investing AI · Módulo Clasificación direccional (ML y DL)
   Todo (modelos, familias, activos, probabilidades, métricas y matrices) se lee de
   data/05_clasificadores_binarios.json. Depende de common.js ($, fmt, loadJSON). */
(function () {
  'use strict';

  // Estado de la página
  const ST = {
    datos: null,      // JSON completo
    tickers: [],      // claves de "predicciones", en el orden del JSON
    familias: [],     // familias únicas encontradas en "modelos"
    idx: {},          // idx[ticker][modelo] -> predicción individual
    filtro: 'todos',  // 'todos' o una familia (ML / DL)
    ticker: null,
    modelo: null,
    umbrales: null    // cortes de confianza derivados del propio JSON
  };

  // Utilidades
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pc = (x, d = 0) => fmt.n(x * 100, d) + '%';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

  /* ---------- Datos ---------- */

  // Modelos visibles según el filtro de familia
  const visibles = () => ST.datos.modelos.filter(m => ST.filtro === 'todos' || m.familia === ST.filtro);

  // Deriva los cortes de "confianza" (margen respecto a 50 %) a partir de las
  // etiquetas ya presentes en el JSON, para no fijar cifras en el código.
  function derivarUmbrales(pred) {
    const g = {};
    Object.values(pred).forEach(p => {
      const k = String(p.confianza || '').toLowerCase();
      (g[k] = g[k] || []).push(Math.abs(p.prob_media - 0.5));
    });
    const mx = a => (a && a.length ? Math.max(...a) : null);
    const mn = a => (a && a.length ? Math.min(...a) : null);
    const corte = (inf, sup) => (mx(inf) !== null && mn(sup) !== null ? (mx(inf) + mn(sup)) / 2 : null);
    // Valores de respaldo solo si el JSON no trae las tres etiquetas
    return { bajo: corte(g.baja, g.media) ?? 0.04, alto: corte(g.media, g.alta) ?? 0.08 };
  }

  const etiquetaConfianza = margen =>
    margen >= ST.umbrales.alto ? 'Alta' : margen >= ST.umbrales.bajo ? 'Media' : 'Baja';

  // Resumen de consenso para el activo seleccionado y los modelos visibles
  function consenso(ticker) {
    const s = visibles().map(m => ST.idx[ticker] && ST.idx[ticker][m.modelo]).filter(Boolean);
    const n = s.length;
    const sube = s.filter(x => x.senal === 'SUBE').length;
    const baja = n - sube;
    const prob = n ? mean(s.map(x => x.prob_sube)) : 0.5;
    // Solo hay dos clases: en caso de empate decide la probabilidad media
    const dir = sube > baja ? 'SUBE' : baja > sube ? 'BAJA' : (prob >= 0.5 ? 'SUBE' : 'BAJA');
    const acuerdo = n ? Math.max(sube, baja) / n : 0;
    return { n, sube, baja, prob, dir, acuerdo, conf: etiquetaConfianza(Math.abs(prob - 0.5)) };
  }

  /* ---------- Render ---------- */

  function renderPills() {
    const items = [['todos', 'Todos los modelos']].concat(ST.familias.map(f => [f, f]));
    $('#pills').innerHTML = items.map(([k, t]) =>
      `<button type="button" data-f="${esc(k)}" aria-pressed="${k === ST.filtro}">${esc(t)}</button>`).join('');
  }

  function renderTickerSelect() {
    $('#selTicker').innerHTML = ST.tickers.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    $('#selTicker').value = ST.ticker;
  }

  function renderKPIs() {
    const c = consenso(ST.ticker);
    const cls = c.dir === 'SUBE' ? 'dirup' : 'dirdn';
    const sym = c.dir === 'SUBE' ? '▲' : '▼';
    const wS = c.n ? (c.sube / c.n) * 100 : 0;
    $('#kpis').innerHTML = `
      <article class="card kpi">
        <p class="tit">CONSENSO · ${esc(ST.ticker)}</p>
        <p class="v ${cls}">${sym} ${c.dir}</p>
        <div class="split" role="img" aria-label="${c.sube} modelos SUBE y ${c.baja} modelos BAJA">
          <span class="s" style="width:${wS}%"></span><span class="b" style="width:${100 - wS}%"></span></div>
        <div class="cnt"><span class="dirup">▲ SUBE ${c.sube}</span><span class="dirdn">▼ BAJA ${c.baja}</span></div>
      </article>
      <article class="card kpi"><p class="lbl">Probabilidad media</p><p class="v">${pc(c.prob)}</p><p class="sub">Promedio de modelos visibles</p></article>
      <article class="card kpi"><p class="lbl">Confianza</p><p class="v">${c.conf}</p><p class="sub">${c.n} modelos evaluados</p></article>
      <article class="card kpi"><p class="lbl">Acuerdo</p><p class="v">${pc(c.acuerdo)}</p><p class="sub">Dirección mayoritaria</p></article>`;
    $('#liveA').textContent = `${ST.ticker}: consenso ${c.dir}, ${c.sube} modelos SUBE y ${c.baja} BAJA, probabilidad media ${pc(c.prob)}, confianza ${c.conf.toLowerCase()}, acuerdo ${pc(c.acuerdo)}.`;
  }

  function renderHeatmap() {
    const vis = visibles();
    $('#hmSub').textContent = `${ST.tickers.length} activos × ${vis.length} modelos · probabilidad de SUBE`;
    const head = ST.tickers.map(t =>
      `<th scope="col" data-t="${esc(t)}"><button type="button" class="th-b" data-t="${esc(t)}" aria-label="Seleccionar activo ${esc(t)}">${esc(t)}</button></th>`).join('');
    const rows = vis.map(m => {
      const celdas = ST.tickers.map(t => {
        const p = ST.idx[t][m.modelo];
        if (!p) return `<td data-t="${esc(t)}">–</td>`;
        const up = p.senal === 'SUBE';
        return `<td data-t="${esc(t)}"><button type="button" class="cell ${up ? 'u' : 'd'}" data-t="${esc(t)}"
          aria-label="${esc(m.modelo)}, ${esc(t)}: probabilidad de SUBE ${pc(p.prob_sube)}, señal ${p.senal}">
          <b>${pc(p.prob_sube)}</b><span>${up ? '▲' : '▼'} ${p.senal}</span></button></td>`;
      }).join('');
      return `<tr><th scope="row">${esc(m.modelo)}<br><span class="fam">${esc(m.familia)}</span></th>${celdas}</tr>`;
    }).join('');
    $('#hm').innerHTML = `<table><caption class="sr">Probabilidad de SUBE por modelo (filas) y activo (columnas)</caption>
      <thead><tr><th scope="col">Modelo</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    marcarColumna();
  }

  // Resalta la columna del activo seleccionado sin volver a dibujar la tabla
  function marcarColumna() {
    $$('#hm [data-t]').forEach(el => {
      const sel = el.dataset.t === ST.ticker;
      if (el.tagName === 'TH' || el.tagName === 'TD') el.classList.toggle('sel', sel);
      if (el.classList.contains('th-b')) el.setAttribute('aria-pressed', sel);
    });
  }

  function renderModeloSelect() {
    const vis = visibles();
    if (!vis.some(m => m.modelo === ST.modelo)) ST.modelo = vis[0].modelo;
    $('#selModelo').innerHTML = vis.map(m => `<option value="${esc(m.modelo)}">${esc(m.modelo)} (${esc(m.familia)})</option>`).join('');
    $('#selModelo').value = ST.modelo;
  }

  function renderMetricas() {
    const m = ST.datos.modelos.find(x => x.modelo === ST.modelo);
    const defs = [['Exactitud', 'exactitud'], ['Precisión', 'precision'], ['Recall', 'recall'], ['F1', 'f1'], ['AUC', 'auc']];
    $('#tMet').textContent = `Métricas de validación · ${m.modelo}`;
    $('#met').innerHTML = defs.map(([l, k]) => `
      <div class="mrow"><span id="m_${k}">${l}</span>
        <div class="tr" role="progressbar" aria-labelledby="m_${k}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${(m[k] * 100).toFixed(1)}"><div class="fl" style="width:${m[k] * 100}%"></div></div>
        <span class="pv">${fmt.n(m[k] * 100, 1)}%</span></div>`).join('');
    $('#notaMet').textContent = `Métricas calculadas sobre ${m.n_prueba} observaciones de prueba y propias de cada modelo. Un resultado apenas superior al azar no implica capacidad predictiva estable.`;

    const c = m.matriz_confusion;
    $('#tCm').textContent = `Matriz de confusión · ${m.modelo}`;
    $('#cm').innerHTML = `<table class="cm"><caption class="sr">Matriz de confusión de ${esc(m.modelo)}</caption>
      <thead><tr><td></td><th scope="col">Pred. BAJA</th><th scope="col">Pred. SUBE</th></tr></thead>
      <tbody>
        <tr><th scope="row">Real BAJA</th><td class="ok"><b>${c.VN}</b><span>Verdadero BAJA</span></td><td class="ko"><b>${c.FP}</b><span>Falso SUBE</span></td></tr>
        <tr><th scope="row">Real SUBE</th><td class="ko"><b>${c.FN}</b><span>Falso BAJA</span></td><td class="ok"><b>${c.VP}</b><span>Verdadero SUBE</span></td></tr>
      </tbody></table>`;
    $('#liveM').textContent = `Modelo ${m.modelo}: exactitud ${pc(m.exactitud, 1)}, F1 ${pc(m.f1, 1)}, AUC ${pc(m.auc, 1)}.`;
  }

  function renderCTA() {
    $('#ctaTxt').innerHTML = `¿Quieres explorar el precio futuro de <strong>${esc(ST.ticker)}</strong>?`;
    $('#ctaBtn').href = 'regresion.html?ticker=' + encodeURIComponent(ST.ticker);
  }

  /* ---------- Acciones ---------- */

  function elegirTicker(t) {
    if (!ST.idx[t]) return;
    ST.ticker = t;
    $('#selTicker').value = t;
    try {   // mantiene la URL sincronizada para compartir/volver
      const u = new URL(location.href); u.searchParams.set('ticker', t); history.replaceState(null, '', u);
    } catch (e) { /* entornos sin history: se ignora */ }
    renderKPIs(); marcarColumna(); renderCTA();
  }

  function elegirFiltro(f) {
    ST.filtro = f;
    $$('#pills button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f));
    renderKPIs(); renderHeatmap(); renderModeloSelect(); renderMetricas();
  }

  function enlazarEventos() {
    $('#pills').addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) elegirFiltro(b.dataset.f); });
    $('#selTicker').addEventListener('change', e => elegirTicker(e.target.value));
    $('#selModelo').addEventListener('change', e => { ST.modelo = e.target.value; renderMetricas(); });
    // Clic o Enter/Espacio (nativo en <button>) sobre encabezado o celda
    $('#hm').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) elegirTicker(b.dataset.t); });
  }

  /* ---------- Inicio (lo invoca common.js) ---------- */
  window.init = async function () {
    const d = await loadJSON('05_clasificadores_binarios.json');
    ST.datos = d;
    ST.tickers = Object.keys(d.predicciones);
    ST.familias = Array.from(new Set(d.modelos.map(m => m.familia)));
    ST.tickers.forEach(t => {
      ST.idx[t] = {};
      d.predicciones[t].modelos.forEach(p => { ST.idx[t][p.modelo] = p; });
    });
    ST.umbrales = derivarUmbrales(d.predicciones);

    // ?ticker=XXX (sin distinguir mayúsculas); si no existe, el primero disponible
    const q = (new URLSearchParams(location.search).get('ticker') || '').toUpperCase();
    ST.ticker = ST.tickers.find(t => t.toUpperCase() === q) || ST.tickers[0];
    ST.modelo = d.modelos[0].modelo;

    renderPills(); renderTickerSelect(); renderKPIs(); renderHeatmap();
    renderModeloSelect(); renderMetricas(); renderCTA();
    enlazarEventos();
  };
})();
