/* Ernesto Investing AI · Módulo Backtesting
 * Todo el contenido (cifras, ganadores, interpretación) se calcula desde
 * data/09_backtesting_portafolios.json. Material educativo con datos SINTÉTICOS.
 * Depende de: css/styles.css, js/common.js ($, fmt, loadJSON) y ECharts 5.5.1. */
(function () {
  'use strict';

  const ARCHIVO = '09_backtesting_portafolios.json';

  /* Paletas por tema (contraste ≥ 3:1 para líneas sobre el fondo de la tarjeta).
     Orden = 3 carteras + 4 referencias, en el orden del JSON. */
  const PALETAS = {
    light: ['#0b4f9c', '#7a3db8', '#c25400', '#5a6978', '#0a7d5a', '#b3261e', '#8a5a00'],
    dark:  ['#7db7ff', '#c9a6ff', '#ff9f4a', '#b4c0cc', '#52d1a2', '#ff8a80', '#ffcc66']
  };
  /* Trazos distintos para las referencias (no depender sólo del color) */
  const TRAZOS_REF = [[6, 3], [2, 3], [8, 3, 2, 3], [3, 3]];

  /* ---------- Utilidades ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const temaActual = () => document.documentElement.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  const reducirMovimiento = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const esFecha = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const aFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fechaLarga = s => esFecha(s) ? aFecha(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Inicio';
  const fechaCorta = s => esFecha(s) ? aFecha(s).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }) : 'Inicio';
  const lista = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  const pp = x => fmt.n(Math.abs(x), 1) + ' pp';
  const b = s => '<strong>' + esc(s) + '</strong>';
  const porMax = (a, f) => a.reduce((x, y) => f(y) > f(x) ? y : x);
  const porMin = (a, f) => a.reduce((x, y) => f(y) < f(x) ? y : x);

  /* Drawdown (%) a partir de una curva: caída desde el máximo previo */
  function calcDD(curva) {
    let max = -Infinity;
    return curva.map(v => { max = Math.max(max, v); return (v / max - 1) * 100; });
  }

  /* ---------- Estado del módulo ---------- */
  let D = null;            // JSON completo
  let series = [];         // 3 carteras + 4 referencias, normalizadas
  const visibles = new Set();
  let chartCap = null, chartDD = null;
  const orden = { col: null, dir: null };

  /* ---------- Normalización de datos ---------- */
  function construirSeries(d) {
    const out = [];
    Object.entries(d.carteras).forEach(([nombre, c]) => out.push({
      nombre, tipo: 'cartera', curva: c.curva, dd: c.drawdown || calcDD(c.curva),
      m: c.metricas, reb: c.rebalanceos || [], turnover: c.turnover_medio
    }));
    Object.entries(d.referencias).forEach(([nombre, r], i) => out.push({
      nombre, tipo: 'referencia', curva: r.curva, dd: calcDD(r.curva), m: r.metricas, trazo: TRAZOS_REF[i % TRAZOS_REF.length]
    }));
    out.forEach((s, i) => { s.idx = i; visibles.add(i); });
    return out;
  }

  /* ---------- Colores en CSS para los botones/swatches ---------- */
  function aplicarColoresCSS() {
    const pal = PALETAS[temaActual()];
    series.forEach(s => document.documentElement.style.setProperty('--c' + s.idx, pal[s.idx % pal.length]));
  }

  /* ---------- Botones de activación de series ---------- */
  function construirToggles() {
    const cont = $('#toggles');
    cont.innerHTML = series.map(s =>
      `<button type="button" data-i="${s.idx}" aria-pressed="true">
         <span class="sw ${s.tipo === 'referencia' ? 'ref' : ''}" style="--c:var(--c${s.idx})" aria-hidden="true"></span>${esc(s.nombre)}</button>`).join('');
    cont.addEventListener('click', e => {
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      const i = Number(btn.dataset.i);
      if (visibles.has(i)) visibles.delete(i); else visibles.add(i);
      btn.setAttribute('aria-pressed', visibles.has(i));
      dibujarGraficos();
    });
  }

  /* ---------- Gráficos ECharts ---------- */
  function opcionesGrafico(tipo) {
    const pal = PALETAS[temaActual()];
    const fg = css('--fg'), mut = css('--mut'), bd = css('--bd'), panel = css('--panel');
    const esDD = tipo === 'dd';
    const n = D.fechas.length;
    const paso = innerWidth < 640 ? 63 : 42;                 // pocas etiquetas en pantallas angostas
    const activas = series.filter(s => visibles.has(s.idx));
    return {
      animation: !reducirMovimiento(),
      animationDuration: 400,
      textStyle: { color: mut },
      grid: { left: 8, right: 14, top: 14, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category', data: D.fechas, boundaryGap: false,
        axisLine: { lineStyle: { color: bd } }, axisTick: { lineStyle: { color: bd } },
        axisLabel: { color: mut, hideOverlap: true, interval: i => i % paso === 0 || i === n - 1, formatter: fechaCorta }
      },
      yAxis: {
        type: 'value', scale: !esDD, max: esDD ? 0 : undefined,
        axisLabel: { color: mut, formatter: v => fmt.n(v, 0) + (esDD ? ' %' : '') },
        splitLine: { lineStyle: { color: bd } }
      },
      tooltip: {
        trigger: 'axis', confine: true,
        backgroundColor: panel, borderColor: bd, textStyle: { color: fg },
        axisPointer: { type: 'line', lineStyle: { color: mut } },
        formatter: ps => {
          if (!ps.length) return '';
          const i = ps[0].dataIndex;
          const filas = [...ps].sort((x, y) => y.value - x.value).map(p =>
            `<div style="display:flex;justify-content:space-between;gap:1rem"><span>${p.marker}${esc(p.seriesName)}</span><strong>${esDD ? fmt.n(p.value) + ' %' : fmt.n(p.value)}</strong></div>`).join('');
          return `<div style="margin-bottom:.25rem"><strong>${i === 0 ? 'Inicio' : 'Sesión ' + i}</strong> · ${esc(fechaLarga(D.fechas[i]))}</div>${filas}`;
        }
      },
      series: activas.map(s => {
        const color = pal[s.idx % pal.length];
        return {
          name: s.nombre, type: 'line', data: esDD ? s.dd : s.curva,
          showSymbol: false, symbol: 'none', emphasis: { focus: 'series' },
          lineStyle: { width: s.tipo === 'cartera' ? 2.4 : 1.8, color, type: s.tipo === 'cartera' ? 'solid' : s.trazo },
          itemStyle: { color },
          areaStyle: esDD ? { color, opacity: 0.07 } : undefined
        };
      })
    };
  }

  function dibujarGraficos() {
    if (!chartCap) return;
    chartCap.setOption(opcionesGrafico('capital'), true);
    chartDD.setOption(opcionesGrafico('dd'), true);
    // Descripción accesible dinámica de los gráficos
    const act = series.filter(s => visibles.has(s.idx));
    const fin = s => fmt.n(s.curva[s.curva.length - 1]);
    $('#graf-capital').setAttribute('aria-label',
      `Gráfico de líneas, base ${D.base}. Valores finales: ` + (act.map(s => `${s.nombre} ${fin(s)}`).join('; ') || 'ninguna serie seleccionada') + '. Hay una tabla alternativa debajo.');
    $('#graf-dd').setAttribute('aria-label',
      'Gráfico de drawdown. Caída máxima: ' + (act.map(s => `${s.nombre} ${fmt.n(s.m.max_drawdown_pct)} %`).join('; ') || 'ninguna serie seleccionada') + '.');
  }

  function iniciarGraficos() {
    if (typeof echarts === 'undefined') throw new Error('No se pudo cargar ECharts 5.5.1');
    chartCap = echarts.init($('#graf-capital'));
    chartDD = echarts.init($('#graf-dd'));
    chartCap.group = chartDD.group = 'bt';
    echarts.connect('bt');                                   // cursor y tooltip sincronizados
    dibujarGraficos();
    const redim = () => { chartCap.resize(); chartDD.resize(); dibujarGraficos(); };
    if ('ResizeObserver' in window) new ResizeObserver(() => { chartCap.resize(); chartDD.resize(); }).observe($('#graf-capital'));
    addEventListener('resize', redim);
  }

  /* ---------- Tabla de métricas ordenable ---------- */
  const COLUMNAS = [
    { id: 'nombre', t: 'Estrategia', v: s => s.nombre, texto: true },
    { id: 'ret', t: 'Retorno total', v: s => s.m.retorno_total_pct, f: s => `<span class="${fmt.cls(s.m.retorno_total_pct)}">${fmt.pct(s.m.retorno_total_pct)}</span>` },
    { id: 'cagr', t: 'CAGR', v: s => s.m.cagr_pct, f: s => `<span class="${fmt.cls(s.m.cagr_pct)}">${fmt.pct(s.m.cagr_pct)}</span>` },
    { id: 'vol', t: 'Volatilidad', v: s => s.m.volatilidad_anual_pct, f: s => fmt.n(s.m.volatilidad_anual_pct) + ' %' },
    { id: 'sharpe', t: 'Sharpe', v: s => s.m.sharpe, f: s => `<span class="${fmt.cls(s.m.sharpe)}">${fmt.n(s.m.sharpe)}</span>` },
    { id: 'dd', t: 'Máx. Drawdown', v: s => s.m.max_drawdown_pct, f: s => `<span class="dn">${fmt.n(s.m.max_drawdown_pct)} %</span>` },
    { id: 'calmar', t: 'Calmar', v: s => s.m.calmar, f: s => `<span class="${fmt.cls(s.m.calmar)}">${fmt.n(s.m.calmar)}</span>` },
    { id: 'meses', t: 'Meses positivos', v: s => s.m.meses_positivos_pct, f: s => fmt.n(s.m.meses_positivos_pct, 1) + ' %' }
  ];

  function construirEncabezados() {
    $('#fila-th').innerHTML = COLUMNAS.map(c =>
      `<th scope="col" aria-sort="none" data-col="${c.id}"${c.texto ? ' class="l"' : ''}><button type="button">${esc(c.t)}<span class="si" aria-hidden="true"></span></button></th>`).join('');
    $('#fila-th').addEventListener('click', e => {
      const th = e.target.closest('th[data-col]');
      if (!th) return;
      const col = COLUMNAS.find(c => c.id === th.dataset.col);
      // Primer clic: texto ascendente / números descendentes (mejor primero); luego alterna
      orden.dir = orden.col === col.id ? (orden.dir === 'ascending' ? 'descending' : 'ascending') : (col.texto ? 'ascending' : 'descending');
      orden.col = col.id;
      pintarTabla();
      $('#estado-orden').textContent = `Tabla ordenada por ${col.t}, orden ${orden.dir === 'ascending' ? 'ascendente' : 'descendente'}.`;
    });
  }

  function pintarTabla() {
    // Líder dinámico: mayor retorno total
    const lider = porMax(series, s => s.m.retorno_total_pct);
    const col = COLUMNAS.find(c => c.id === orden.col);
    const filas = [...series];
    if (col) {
      filas.sort((x, y) => {
        const a = col.v(x), c = col.v(y);
        const r = col.texto ? String(a).localeCompare(String(c), 'es') : a - c;
        return r === 0 ? x.idx - y.idx : (orden.dir === 'ascending' ? r : -r);
      });
    }
    // aria-sort en los encabezados
    document.querySelectorAll('#fila-th th').forEach(th => th.setAttribute('aria-sort', th.dataset.col === orden.col ? orden.dir : 'none'));
    $('#cuerpo-met').innerHTML = filas.map(s => {
      const esLider = s === lider;
      return `<tr${esLider ? ' class="lider"' : ''}>
        <th scope="row" class="l" style="font-weight:600;background:inherit;position:static"><span class="sw ${s.tipo === 'referencia' ? 'ref' : ''}" style="--c:var(--c${s.idx})" aria-hidden="true"></span>${esc(s.nombre)}${esLider ? '<span class="sup">SUPERIOR</span>' : ''}</th>` +
        COLUMNAS.slice(1).map(c => `<td>${c.f(s)}</td>`).join('') + '</tr>';
    }).join('');
  }

  /* ---------- Tabla alternativa (lectores de pantalla) ---------- */
  function construirTablaAlterna() {
    const ult = D.fechas.length - 1;
    $('#alt-cap').textContent = `Valor de cada curva al inicio (base ${D.base}) y al ${fechaLarga(D.fechas[ult])}.`;
    $('#alt-cuerpo').innerHTML = series.map(s => {
      const ini = s.curva[0], fin = s.curva[ult];
      const v = (fin / ini - 1) * 100;
      return `<tr><th scope="row" class="l">${esc(s.nombre)}</th><td class="l">${s.tipo === 'cartera' ? 'Cartera' : 'Referencia'}</td>
        <td>${fmt.n(ini)}</td><td>${fmt.n(fin)}</td><td class="${fmt.cls(v)}">${fmt.pct(v)}</td></tr>`;
    }).join('');
  }

  /* ---------- Acordeones de rebalanceos ---------- */
  function construirRebalanceos() {
    const carteras = series.filter(s => s.tipo === 'cartera');
    // Turnover medio (si existe en el JSON)
    const conTO = carteras.filter(s => typeof s.turnover === 'number');
    $('#turnover').innerHTML = conTO.length
      ? 'Turnover medio por rebalanceo: ' + conTO.map(s => `${b(s.nombre)} ${fmt.n(s.turnover * 100, 1)} %`).join(' · ')
      : '';
    // Fechas únicas de rebalanceo (unión de todas las carteras, ordenadas)
    const fechas = [...new Set(carteras.flatMap(s => s.reb.map(r => r.fecha)))].sort();
    $('#acordeones').innerHTML = fechas.map((f, i) => {
      const bloques = carteras.map(s => {
        const r = s.reb.find(x => x.fecha === f);
        if (!r) return '';
        const pesos = Object.entries(r.pesos).filter(([, w]) => w > 0).sort((x, y) => y[1] - x[1]);
        return `<div class="cart-w"><strong>${esc(s.nombre)}</strong><ul>${pesos.map(([t, w]) => `<li>${esc(t)} ${fmt.n(w * 100, 1)} %</li>`).join('')}</ul></div>`;
      }).join('');
      const etiqueta = f === D.periodo.inicio ? 'Inicio' : 'Rebalanceo';
      return `<details class="reb"${i === 0 ? ' open' : ''}><summary><span>${esc(fechaLarga(f))}</span><span class="mut">${etiqueta}</span></summary><div class="cuerpo">${bloques}</div></details>`;
    }).join('');
  }

  /* ---------- Interpretación dinámica (100 % calculada) ---------- */
  function construirInterpretacion() {
    const cart = series.filter(s => s.tipo === 'cartera');
    const refs = series.filter(s => s.tipo === 'referencia');
    const ret = s => s.m.retorno_total_pct;
    const n = D.periodo.sesiones;
    const lider = porMax(series, ret);
    const sh = porMax(series, s => s.m.sharpe);
    const dm = porMax(series, s => s.m.max_drawdown_pct);       // caída más cercana a 0
    const mC = porMax(cart, ret);
    const peorRef = porMin(refs, ret);
    const iw = refs.find(r => /1\/N/.test(r.nombre));

    $('#h-interp').textContent = `${lider.nombre} lidera el retorno`;

    // Párrafo 1: líderes por métrica
    const p1 = `En las ${n} sesiones, ${b(lider.nombre)} (${lider.tipo}) registró el mayor retorno total (${fmt.pct(ret(lider))}). ` +
      `${sh === lider ? b(lider.nombre) + ' también lidera' : b(sh.nombre) + ' lidera'} el Sharpe (${fmt.n(sh.m.sharpe)}) y ` +
      `${b(dm.nombre)} tuvo la caída máxima más contenida (${fmt.n(dm.m.max_drawdown_pct)} %).`;

    // Párrafo 2: ¿carteras vs referencias?
    let p2;
    if (!cart.some(c => refs.some(r => ret(c) > ret(r)))) {
      p2 = `Ninguna de las ${cart.length} carteras superó a una sola referencia: la mejor, ${b(mC.nombre)} (${fmt.pct(ret(mC))}), ` +
        `quedó ${pp(ret(mC) - ret(peorRef))} por debajo de la referencia más débil (${esc(peorRef.nombre)}, ${fmt.pct(ret(peorRef))})` +
        (mC !== lider ? ` y ${pp(ret(mC) - ret(lider))} por debajo de ${esc(lider.nombre)}.` : '.');
    } else {
      p2 = lista(cart.map(c => {
        const sup = refs.filter(r => ret(c) > ret(r)).map(r => esc(r.nombre));
        return sup.length ? `${b(c.nombre)} superó a ${lista(sup)}` : `${b(c.nombre)} no superó a ninguna referencia`;
      })) + '.';
    }
    if (iw) p2 += ` Frente al portafolio igual ponderado, la mejor cartera ${ret(mC) >= ret(iw) ? 'lo supera por' : 'queda por debajo en'} ${pp(ret(mC) - ret(iw))}.`;

    // Párrafo 3: por qué (explicación plausible, no prueba)
    const num = re => { const m = (D.metodo || '').match(re); return m ? Number(m[1]) : null; };
    const vent = num(/ventana de (\d+) sesiones/i), mom = num(/momentum a (\d+) sesiones/i), com = num(/comision (\d+) pb/i);
    const vol = s => s.m.volatilidad_anual_pct;
    const riesgoMax = porMax(cart, vol), peorCart = porMin(cart, ret);
    let p3;
    if (iw && cart.every(c => ret(c) < ret(iw))) {
      p3 = 'Esto es coherente con series sintéticas de baja persistencia y mucho ruido: ' +
        (mom && vent
          ? `el filtro de momentum (${mom} sesiones) y la estimación sobre ventanas de ${vent} sesiones extrapolan una tendencia que en estos datos no se mantiene el mes siguiente`
          : 'las señales calculadas sobre la historia reciente extrapolan una tendencia que no se mantiene el mes siguiente') +
        ', de modo que cada rebalanceo tiende a comprar lo que ya subió antes de que revierta.';
      const tos = cart.map(c => c.turnover).filter(x => typeof x === 'number');
      if (com && tos.length) {
        const tm = tos.reduce((x, y) => x + y, 0) / tos.length;
        const nReb = Math.max(...cart.map(c => c.reb.length));
        const costo = tm * (com / 10000) * nReb * 100;
        const brecha = ret(iw) - ret(mC);
        p3 += ` A eso se suman las comisiones: con un turnover medio de ${fmt.n(tm * 100, 1)} % y ${com} pb, el costo aproximado es de ${fmt.n(costo, 2)} pp en el periodo, ` +
          `${costo < brecha / 2 ? 'una parte menor' : 'una parte relevante'} de la brecha de ${pp(brecha)} frente a 1/N.`;
      }
      p3 += ' Es una explicación plausible, no una prueba.';
    } else {
      const gan = iw ? cart.filter(c => ret(c) > ret(iw)).map(c => esc(c.nombre)) : [];
      p3 = gan.length
        ? `Que ${lista(gan)} supere${gan.length > 1 ? 'n' : ''} al igual ponderado no demuestra una ventaja persistente: con una sola trayectoria sintética la diferencia puede deberse al azar.`
        : 'Las carteras quedaron en línea con el portafolio igual ponderado; con una sola trayectoria sintética la diferencia no es concluyente.';
    }
    p3 += ` ${b(riesgoMax.nombre)} fue la cartera más volátil (${fmt.n(vol(riesgoMax))} % anual)` +
      (riesgoMax === peorCart ? ' y también la de peor retorno: asumir más riesgo no se vio recompensado en esta muestra.' : ` y cerró con ${fmt.pct(ret(riesgoMax))}.`);

    // Párrafo 4: advertencia metodológica
    const p4 = `Con ${n} sesiones y una única trayectoria simulada, estas métricas describen una muestra, no una expectativa. Desempeño pasado no garantiza desempeño futuro.`;

    $('#interp-cuerpo').innerHTML = [p1, p2, p3, p4].map(p => `<p>${p}</p>`).join('');
  }

  /* ---------- Verificación en consola ---------- */
  function verificar() {
    const filas = series.map(s => {
      const calc = (s.curva[s.curva.length - 1] / D.base - 1) * 100;
      const dif = Math.abs(calc - s.m.retorno_total_pct);
      return { serie: s.nombre, curva_final: +s.curva[s.curva.length - 1].toFixed(3), calculado_pct: +calc.toFixed(2), json_pct: s.m.retorno_total_pct, dif_pp: +dif.toFixed(3), ok: dif <= 0.05 };
    });
    console.table(filas);
    console.assert(filas.every(f => f.ok), '[Backtesting] Alguna curva no coincide con retorno_total_pct (>0,05 pp)');
    if (filas.every(f => f.ok)) console.info('[Backtesting] Verificación OK: curvas coherentes con retorno_total_pct.');
  }

  /* ---------- Cambio de tema (invocado por common.js) ---------- */
  function alCambiarTema() {
    aplicarColoresCSS();
    dibujarGraficos();
    console.info('[Backtesting] Tema aplicado a los gráficos:', temaActual());
  }
  window.onTheme = alCambiarTema;
  // Si el usuario no eligió tema manual, seguir el del sistema
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => {
    if (!document.documentElement.hasAttribute('data-theme') && chartCap) alCambiarTema();
  });

  /* ---------- Arranque (common.js llama a window.init) ---------- */
  window.init = async function () {
    D = await loadJSON(ARCHIVO);
    series = construirSeries(D);
    const n = D.periodo.sesiones;

    $('#subtitulo').textContent = `Compara perfiles y referencias durante ${n} sesiones sobre la historia sintética.`;
    $('#insignia').textContent = `Base ${D.base} · ${n} sesiones`;
    $('#sub-capital').textContent = `Valor acumulado con base ${D.base}`;
    $('#sub-met').textContent = `Calculadas desde las ${n} observaciones simuladas.`;
    $('#pie-metodo').textContent = D.metodo ? 'Metodología: ' + D.metodo : '';

    aplicarColoresCSS();
    construirToggles();
    construirEncabezados();
    pintarTabla();
    construirTablaAlterna();
    construirRebalanceos();
    construirInterpretacion();
    iniciarGraficos();
    verificar();
  };
})();
