/* ============================================================================
   Ernesto Investing AI · Módulo «Portafolios de 3 niveles de riesgo»
   Archivo: js/portafolios.js
   Depende de: js/common.js ($, fmt, loadJSON, store, showError) y ECharts 5.5.1.
   Todas las cifras y textos de activos se leen de data/08_portafolios_3_niveles_riesgo.json.
   Material educativo con datos sintéticos.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Constantes ---------- */
  const ARCHIVO = '08_portafolios_3_niveles_riesgo.json';
  const CLAVE_STORE = 'eia_pf';   // clave de localStorage para Trading
  const OTROS = 'Otros';                           // activos sin fila en detalle_activos (peso muy bajo)
  const NIVEL_POR_DEFECTO = 'Moderado';

  // Paletas por tema: contraste >= 3:1 contra el fondo de la tarjeta (elementos gráficos, WCAG 1.4.11).
  // El color de cada ticker es estable entre niveles (se asigna por orden alfabético global).
  const PALETAS = {
    claro: {
      serie: ['#0b4f9c', '#b0306a', '#007c89', '#8a6d00', '#8e44ad', '#3b7d00',
              '#5c6b7a', '#b35400', '#0a7d3c', '#1f7fb8', '#6d3fc0', '#a3321c'],
      otros: '#6b7785'
    },
    oscuro: {
      serie: ['#7db7ff', '#ff7eb3', '#4fd6e0', '#e6c34a', '#d49bff', '#a6e04a',
              '#9fb0c3', '#ffa94d', '#52d18a', '#ff9e80', '#b49cff', '#ff6b6b'],
      otros: '#9aa7b5'
    }
  };

  /* ---------- Estado ---------- */
  let datos = null;        // contenido del JSON
  let modelos = [];        // datos derivados por nivel (ordenados, "Otros", totales)
  let tickers = [];        // todos los tickers presentes en cualquier nivel (orden alfabético)
  let seleccion = 0;       // índice del nivel seleccionado
  const graficos = [];     // instancias de ECharts (una por tarjeta)

  /* ---------- Utilidades ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const suma = arr => arr.reduce((s, x) => s + x, 0);
  const esOscuro = () => {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const reducirMovimiento = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fechaLarga = f => {
    const d = new Date(f + 'T12:00:00');
    return isNaN(d) ? f : d.toLocaleDateString(document.documentElement.lang, { day: 'numeric', month: 'long', year: 'numeric' });
  };
  function colorDe(ticker) {
    const p = esOscuro() ? PALETAS.oscuro : PALETAS.claro;
    if (ticker === OTROS) return p.otros;
    return p.serie[Math.max(0, tickers.indexOf(ticker)) % p.serie.length];
  }

  /* ---------- Modelo derivado de cada nivel ---------- */
  function modelar(n) {
    // Activos con razón de inclusión, de mayor a menor peso
    const det = [...n.detalle_activos].sort((a, b) => b.peso_pct - a.peso_pct);
    const enDetalle = new Set(det.map(d => d.ticker));
    // Pesos que existen en "pesos" pero no tienen fila de detalle: se agrupan como "Otros"
    const otros = suma(Object.entries(n.pesos).filter(([t]) => !enDetalle.has(t)).map(([, w]) => w));
    const total = suma(Object.values(n.pesos));
    const sector = det.map(d => ({
      name: d.ticker,
      value: n.pesos[d.ticker] != null ? n.pesos[d.ticker] : d.peso_pct / 100
    }));
    if (otros > 0) sector.push({ name: OTROS, value: otros });
    return { n, det, sector, otros, total };
  }

  /* ---------- Tarjetas ---------- */
  const ICONO_CHECK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>';

  function htmlTarjeta(m, i) {
    const n = m.n;
    const leyenda = m.det.map(d => ({ t: d.ticker, p: d.peso_pct }));
    if (m.otros > 0) leyenda.push({ t: OTROS, p: m.otros * 100 });
    const top3 = m.det.slice(0, 3).map(d => `${d.ticker} ${fmt.n(d.peso_pct, 1)} %`).join(', ');
    const resumen = `Retorno esperado ${fmt.n(n.retorno_esperado_anual_pct)} %, volatilidad ${fmt.n(n.volatilidad_anual_pct)} %, ` +
      `Sharpe ${fmt.n(n.sharpe, 3)}, CVaR 95 % diario menos ${fmt.n(n.cvar95_diario_pct)} %. Mayores pesos: ${top3}.`;
    return `
    <div class="pf-card" role="button" tabindex="0" aria-pressed="false" data-i="${i}"
         aria-labelledby="pf-n-${i}" aria-describedby="pf-d-${i}">
      <span class="pf-check" aria-hidden="true">${ICONO_CHECK}</span>
      <div class="pf-head">
        <span class="pf-bar" aria-hidden="true"></span>
        <div><div class="pf-eyebrow">Perfil</div><div class="pf-name" id="pf-n-${i}">${esc(n.nivel)}</div></div>
      </div>
      <div class="pf-dona" aria-hidden="true">
        <div class="pf-chart" id="pf-c-${i}"></div>
        <div class="pf-centro"><strong>${Math.round(m.total * 100)}%</strong><span>asignado</span></div>
      </div>
      <dl class="pf-mets">
        <div class="pf-met"><dt>Retorno esperado</dt><dd>${fmt.n(n.retorno_esperado_anual_pct)} %</dd></div>
        <div class="pf-met"><dt>Volatilidad</dt><dd>${fmt.n(n.volatilidad_anual_pct)} %</dd></div>
        <div class="pf-met"><dt>Sharpe</dt><dd>${fmt.n(n.sharpe, 3)}</dd></div>
        <div class="pf-met"><dt>CVaR 95 %</dt><dd class="dn">−${fmt.n(n.cvar95_diario_pct)} %</dd></div>
      </dl>
      <ul class="pf-leg">
        ${leyenda.map(l => `<li><i class="pf-dot" data-tk="${esc(l.t)}" aria-hidden="true"></i>${esc(l.t)} <strong>${fmt.n(l.p, 1)}%</strong></li>`).join('')}
      </ul>
      <span class="sr-only" id="pf-d-${i}">${esc(resumen)}</span>
    </div>`;
  }

  function pintarTarjetas() {
    const cont = $('#pf-tarjetas');
    cont.innerHTML = modelos.map(htmlTarjeta).join('');
    cont.querySelectorAll('.pf-card').forEach(card => {
      const i = Number(card.dataset.i);
      card.addEventListener('click', () => seleccionar(i));
      card.addEventListener('keydown', e => {
        // Enter o Espacio activan la tarjeta (Espacio sin desplazar la página)
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          seleccionar(i);
        }
      });
    });
  }

  /* ---------- Gráficos de dona (ECharts) ---------- */
  function crearGraficos() {
    if (!window.echarts) {
      $('#pf-errores').insertAdjacentHTML('beforeend',
        '<p class="err" role="alert">No se pudo cargar ECharts desde el CDN: los gráficos de dona no se muestran, pero las métricas, la leyenda y las tablas siguen disponibles.</p>');
      document.querySelectorAll('.pf-dona').forEach(el => { el.hidden = true; });
      return;
    }
    modelos.forEach((m, i) => {
      const el = $('#pf-c-' + i);
      const ch = echarts.init(el, null, { renderer: 'svg' });
      graficos.push(ch);
      if ('ResizeObserver' in window) new ResizeObserver(() => ch.resize()).observe(el);
    });
    window.addEventListener('resize', () => graficos.forEach(g => g.resize()));
  }

  // Aplica colores del tema actual a gráficos y puntos de la leyenda
  function pintarTema() {
    document.querySelectorAll('[data-tk]').forEach(p => { p.style.background = colorDe(p.dataset.tk); });
    if (!graficos.length) return;
    const fg = css('--fg'), panel = css('--panel'), bd = css('--bd');
    graficos.forEach((ch, i) => {
      ch.setOption({
        animation: !reducirMovimiento(),
        tooltip: {
          trigger: 'item', confine: true,
          backgroundColor: panel, borderColor: bd, textStyle: { color: fg, fontSize: 12 },
          formatter: p => `${p.marker} ${esc(p.name)}: <strong>${fmt.n(p.value * 100, 2)} %</strong>`
        },
        series: [{
          type: 'pie', radius: ['64%', '90%'], center: ['50%', '50%'], startAngle: 90,
          label: { show: false }, labelLine: { show: false },
          itemStyle: { borderColor: panel, borderWidth: 2 },
          emphasis: { scale: !reducirMovimiento() },
          data: modelos[i].sector.map(s => ({ name: s.name, value: s.value, itemStyle: { color: colorDe(s.name) } }))
        }]
      }, true);
    });
  }

  /* ---------- Panel de detalle ---------- */
  function pintarDetalle() {
    const m = modelos[seleccion], n = m.n;
    $('#det-nombre').textContent = 'Portafolio ' + n.nivel;
    $('#det-desc').textContent = `${n.descripcion} Origen: ${n.origen}. Restricciones: ${n.restricciones}.`;
    $('#det-caption').textContent = `Detalle del portafolio ${n.nivel}: peso, grupo, razón de inclusión y señales relacionadas de cada activo`;
    $('#btn-trading').setAttribute('aria-label', `Llevar a Trading el portafolio ${n.nivel}`);

    $('#det-cuerpo').innerHTML = m.det.map(d => {
      const tk = esc(d.ticker), q = encodeURIComponent(d.ticker);
      return `
      <tr>
        <th scope="row">${tk}</th>
        <td data-label="Peso"><div class="pf-peso">
          <span class="pf-track" aria-hidden="true"><span class="pf-fill" style="width:${Math.min(100, Math.max(0, d.peso_pct))}%"></span></span>
          <span class="pf-pct">${fmt.n(d.peso_pct, 1)} %</span></div></td>
        <td data-label="Grupo">${esc(d.grupo)}</td>
        <td data-label="Razón de inclusión">${esc(d.razon)}</td>
        <td data-label="Señales relacionadas">
          <a class="pf-sig" href="clasificacion.html?ticker=${q}">Clasificación<span class="sr-only"> de ${tk}</span></a>
          <a class="pf-sig" href="regresion.html?ticker=${q}">Regresión<span class="sr-only"> de ${tk}</span></a></td>
      </tr>`;
    }).join('');
  }

  // Tabla alternativa: matriz activo × nivel con los pesos completos del JSON
  function pintarAlternativa() {
    const ns = datos.niveles;
    const filas = tickers
      .map(t => ({ t, w: ns.map(n => n.pesos[t] || 0) }))
      .sort((a, b) => suma(b.w) - suma(a.w) || a.t.localeCompare(b.t));
    $('#alt-tabla').innerHTML =
      `<caption>Peso de cada activo por nivel de riesgo, datos al ${esc(fechaLarga(datos.fecha))}</caption>
       <thead><tr><th scope="col">Activo</th>${ns.map(n => `<th scope="col">${esc(n.nivel)}</th>`).join('')}</tr></thead>
       <tbody>${filas.map(f => `<tr><th scope="row">${esc(f.t)}</th>${f.w.map(w => `<td>${fmt.n(w * 100, 2)} %</td>`).join('')}</tr>`).join('')}</tbody>
       <tfoot><tr><th scope="row">Total</th>${ns.map(n => `<td>${fmt.n(suma(Object.values(n.pesos)) * 100, 2)} %</td>`).join('')}</tr></tfoot>`;
  }

  /* ---------- Selección ---------- */
  function seleccionar(i) {
    if (i < 0 || i >= modelos.length) return;
    const cambio = i !== seleccion;
    seleccion = i;
    document.querySelectorAll('.pf-card').forEach(c =>
      c.setAttribute('aria-pressed', String(Number(c.dataset.i) === i)));
    pintarDetalle();
    if (cambio) $('#pf-toast').innerHTML = '';   // la confirmación anterior ya no aplica
  }

  /* ---------- Llevar a Trading ---------- */
  function llevarATrading() {
    const n = modelos[seleccion].n;
    const registro = {
      nivel: n.nivel,
      origen: n.origen,
      fecha: datos.fecha,                         // fecha de los datos del JSON
      guardado_en: new Date().toISOString(),      // momento en que se envió
      metricas: {
        retorno_esperado_anual_pct: n.retorno_esperado_anual_pct,
        volatilidad_anual_pct: n.volatilidad_anual_pct,
        sharpe: n.sharpe,
        cvar95_diario_pct: n.cvar95_diario_pct
      },
      pesos: { ...n.pesos }
    };
    store(CLAVE_STORE, registro);
    const leido = store(CLAVE_STORE);             // verificación: store() devuelve null si falla
    const ok = !!(leido && leido.nivel === n.nivel);
    const toast = $('#pf-toast');
    toast.classList.toggle('pf-toast-err', !ok);
    toast.innerHTML = ok
      ? `<strong>Portafolio ${esc(n.nivel)} listo para Trading.</strong> Se guardaron ${Object.keys(n.pesos).length} activos con sus pesos (datos al ${esc(fechaLarga(datos.fecha))}). <a href="trading.html">Abrir Trading simulado</a>`
      : '<strong>No se pudo guardar el portafolio.</strong> El navegador bloqueó el almacenamiento local; revise sus permisos e inténtelo de nuevo.';
  }

  /* ---------- Inicio (lo invoca common.js al cargar el DOM) ---------- */
  window.init = async function () {
    datos = await loadJSON(ARCHIVO);
    if (!datos || !Array.isArray(datos.niveles) || !datos.niveles.length) {
      throw new Error('El archivo data/' + ARCHIVO + ' no contiene niveles de portafolio');
    }
    tickers = [...new Set(datos.niveles.flatMap(n => Object.keys(n.pesos)))].sort();
    modelos = datos.niveles.map(modelar);

    $('#pf-meta').textContent = 'Datos al ' + fechaLarga(datos.fecha);
    pintarTarjetas();
    pintarAlternativa();
    crearGraficos();

    $('#btn-trading').addEventListener('click', llevarATrading);

    // Moderado queda seleccionado por defecto; si no existe, el nivel central
    const idx = modelos.findIndex(m => m.n.nivel === NIVEL_POR_DEFECTO);
    seleccionar(idx >= 0 ? idx : Math.floor(modelos.length / 2));
    pintarTema();
  };

  // El botón de tema de common.js llama a window.onTheme: se redibujan gráficos y leyenda
  window.onTheme = pintarTema;
  // Si el usuario no eligió tema, seguir los cambios del sistema operativo
  try {
    matchMedia('(prefers-color-scheme:dark)').addEventListener('change', pintarTema);
  } catch (e) { /* navegadores antiguos: sin escucha del sistema */ }
})();
