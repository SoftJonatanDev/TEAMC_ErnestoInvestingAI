/* ==========================================================================
   regresion.js — Módulo de Regresión de precios a 30 sesiones (ECharts)
   Datos sintéticos · pronóstico simulado, no es asesoría de inversión.

   Entradas:
     data/06_regresores_precio_30d.json  → fechas_pronostico, modelos, predicciones
     data/02_precios_sinteticos_504d.json → fechas, cierres[ticker]
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Constantes ----------
  var RUTA_REGRESORES = 'data/06_regresores_precio_30d.json';
  var RUTA_HISTORIA = 'data/02_precios_sinteticos_504d.json';
  var N_HIST = 504;   // historia completa disponible; la vista inicial usa 120 sesiones
  var N_PRON = 30;    // sesiones proyectadas
  var IDX_ULTIMO = N_HIST - 1; // posición del último cierre en el eje X
  var TOL_CENTAVO = 0.01;


  // ---------- Estado ----------
  var estado = {
    reg: null,          // JSON de regresores
    hist: null,         // JSON de historia
    ticker: null,
    familia: 'todos',
    visibles: new Set(),// nombres de modelos activados
    banda: true,        // la banda p10–p90 es visible por defecto
    cono: false,
    locale: document.documentElement.lang || 'es-PE',
    orden: { clave: 'mape_30d_pct', dir: 'asc' },
    colores: {}         // modelo → color
  };

  var grafico = null;   // instancia de ECharts
  var $ = function (id) { return document.getElementById(id); };
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
  function temaActual() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  // ==========================================================================
  // Formato con Intl según el locale activo
  // ==========================================================================
  var fmt = {};
  function crearFormatos() {
    var l = estado.locale;
    fmt.precio = new Intl.NumberFormat(l, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    fmt.num3 = new Intl.NumberFormat(l, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    // Porcentaje: se recibe el valor ya en % (2,93) y se divide entre 100 para Intl
    fmt.pct = new Intl.NumberFormat(l, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    fmt.pctSigno = new Intl.NumberFormat(l, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
    fmt.fechaCorta = new Intl.DateTimeFormat(l, { day: '2-digit', month: 'short', timeZone: 'UTC' });
    fmt.fechaLarga = new Intl.DateTimeFormat(l, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  // Las fechas llegan como "AAAA-MM-DD"; se interpretan en UTC para que no se corran de día
  function aFecha(iso) { return new Date(iso + 'T00:00:00Z'); }
  var precio = function (v) { return fmt.precio.format(v); };
  var pct = function (v) { return fmt.pct.format(v / 100); };
  var pctSigno = function (v) { return fmt.pctSigno.format(v / 100); };
  var fechaCorta = function (iso) { return fmt.fechaCorta.format(aFecha(iso)); };
  var fechaLarga = function (iso) { return fmt.fechaLarga.format(aFecha(iso)); };

  // ==========================================================================
  // Carga de datos
  // ==========================================================================
  function cargarJSON(ruta) {
    return fetch(ruta).then(function (r) {
      if (!r.ok) throw new Error('No se pudo cargar ' + ruta + ' (HTTP ' + r.status + ')');
      return r.json();
    });
  }

  function mostrarError(texto) {
    var m = $('mensaje');
    m.className = 'error';
    m.textContent = texto;
  }

  function iniciar() {
    if (typeof echarts === 'undefined') {
      mostrarError('No se pudo cargar el motor local de gráficos. Revisa la carpeta vendor.');
      return;
    }
    return Promise.all([cargarJSON(RUTA_REGRESORES), cargarJSON(RUTA_HISTORIA)])
      .then(function (r) {
        estado.reg = r[0];
        estado.hist = r[1];
        arrancar();
      })
      .catch(function (e) {
        mostrarError(e.message + '. Si abriste el archivo con doble clic (file://), sírvelo desde un servidor local, ' +
          'por ejemplo: python3 -m http.server');
      });
  }

  // ==========================================================================
  // Arranque de la interfaz
  // ==========================================================================
  function arrancar() {
    // Solo activos presentes en ambos archivos
    var tickers = Object.keys(estado.reg.predicciones).filter(function (t) { return estado.hist.cierres[t]; });
    var solicitado = (new URLSearchParams(location.search).get('ticker') || EIA.ticker() || '').toUpperCase();
    estado.ticker = tickers.find(function (t) { return t.toUpperCase() === solicitado; }) || tickers[0];
    EIA.setTicker(estado.ticker);

    asignarColores();
    seleccionarPorFamilia('todos');

    // Selector de activo
    var sel = $('sel-activo');
    tickers.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      sel.appendChild(o);
    });
    sel.value = estado.ticker;

    // Eventos
    sel.addEventListener('change', function () { estado.ticker = sel.value; EIA.setTicker(estado.ticker); sincronizarTickerURL(); actualizarTodo(); });
    $('filtros-familia').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-familia]');
      if (!b) return;
      estado.familia = b.dataset.familia;
      seleccionarPorFamilia(estado.familia);
      $('filtros-familia').querySelectorAll('button').forEach(function (boton) {
        boton.setAttribute('aria-pressed', String(boton === b));
      });
      actualizarTodo();
    });
    $('chk-banda').addEventListener('change', function (e) { estado.banda = e.target.checked; dibujarGrafico(); });
    $('chk-cono').addEventListener('change', function (e) { estado.cono = e.target.checked; dibujarGrafico(); });
    $('btn-todos').addEventListener('click', function () {
      estado.reg.modelos.forEach(function (m) { estado.visibles.add(m.modelo); });
      construirListaModelos(); dibujarGrafico(); pintarKPIs();
    });
    $('btn-ninguno').addEventListener('click', function () {
      estado.visibles.clear();
      construirListaModelos(); dibujarGrafico(); pintarKPIs();
    });

    $('app').hidden = false;
    $('mensaje').textContent = '';
    $('mensaje').className = '';

    grafico = echarts.init($('grafico'));
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { grafico.resize(); }).observe($('grafico'));
    } else {
      window.addEventListener('resize', function () { grafico.resize(); });
    }
    actualizarTodo();
  }

  function sincronizarTickerURL() {
    try {
      var url = new URL(location.href);
      url.searchParams.set('ticker', estado.ticker);
      history.replaceState(null, '', url);
    } catch (e) {
      // Si el entorno no permite modificar el historial, el selector sigue funcionando.
    }
  }

  // Un color por modelo: tonos azul-verdosos para ML, tonos violeta-magenta para DL
  function asignarColores() {
    var ml = estado.reg.modelos.filter(function (m) { return m.familia === 'ML'; });
    var dl = estado.reg.modelos.filter(function (m) { return m.familia === 'DL'; });
    var luz = temaActual() === 'dark' ? 68 : 35;
    ml.forEach(function (m, i) {
      estado.colores[m.modelo] = 'hsl(' + (170 + i * (50 / Math.max(ml.length - 1, 1))) + ', 68%, ' + (luz + (i % 3) * (temaActual() === 'dark' ? 3 : 6)) + '%)';
    });
    dl.forEach(function (m, i) {
      estado.colores[m.modelo] = 'hsl(' + (265 + i * (80 / Math.max(dl.length - 1, 1))) + ', 68%, ' + (luz + (i % 3) * (temaActual() === 'dark' ? 3 : 6)) + '%)';
    });
  }

  // "Todos", "Solo ML" o "Solo DL": marca las casillas de esa familia
  function seleccionarPorFamilia(fam) {
    estado.visibles.clear();
    estado.reg.modelos.forEach(function (m) {
      if (fam === 'todos' || m.familia === fam) estado.visibles.add(m.modelo);
    });
  }

  function actualizarTodo() {
    crearFormatos();
    asignarColores();
    pintarKPIs();
    construirListaModelos();
    dibujarGrafico();
    pintarRetorno();
    pintarCTA();
    construirTablaMetricas();
    construirTablaMediana();
    verificarActivo();
  }

  function pintarKPIs() {
    var p = estado.reg.predicciones[estado.ticker];
    $('kpi-precio').textContent = precio(p.precio_ultimo);
    $('kpi-ticker').textContent = estado.ticker;
    $('kpi-mediana').textContent = precio(p.ensamble_mediana[N_PRON - 1]);
    $('kpi-fecha').textContent = fechaLarga(estado.reg.fechas_pronostico[N_PRON - 1]);
    $('kpi-banda').textContent = precio(p.banda_p10[N_PRON - 1]) + ' – ' + precio(p.banda_p90[N_PRON - 1]);
    $('kpi-modelos').textContent = estado.visibles.size + ' de ' + estado.reg.modelos.length + ' modelos visibles';
  }

  function pintarCTA() {
    $('ctaTxt').textContent = 'Usa las señales de ' + estado.ticker + ' dentro de una asignación diversificada.';
  }

  // ==========================================================================
  // Lista de modelos con casillas (agrupada por familia)
  // ==========================================================================
  function muestraLinea(color, discontinua) {
    return '<svg width="28" height="10" aria-hidden="true"><line x1="0" y1="5" x2="28" y2="5" stroke="' + color +
      '" stroke-width="2.5"' + (discontinua ? ' stroke-dasharray="5 3"' : '') + '/></svg>';
  }

  function construirListaModelos() {
    var cont = $('lista-modelos');
    cont.innerHTML = '';
    [['ML', 'Aprendizaje automático (ML)'], ['DL', 'Aprendizaje profundo (DL)']].forEach(function (g) {
      var fs = document.createElement('fieldset');
      var lg = document.createElement('legend');
      lg.textContent = g[1];
      fs.appendChild(lg);
      estado.reg.modelos.filter(function (m) { return m.familia === g[0]; }).forEach(function (m) {
        var lab = document.createElement('label');
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = estado.visibles.has(m.modelo);
        chk.addEventListener('change', function () {
          if (chk.checked) estado.visibles.add(m.modelo); else estado.visibles.delete(m.modelo);
          dibujarGrafico(); pintarKPIs();
        });
        lab.appendChild(chk);
        lab.insertAdjacentHTML('beforeend', muestraLinea(estado.colores[m.modelo], g[0] === 'DL'));
        var t = document.createElement('span');
        t.textContent = m.modelo;
        lab.appendChild(t);
        // Al pasar el cursor o enfocar, se resalta la línea del modelo en el gráfico
        var resaltar = function (on) {
          if (!grafico || !estado.visibles.has(m.modelo)) return;
          grafico.dispatchAction({ type: on ? 'highlight' : 'downplay', seriesName: m.modelo });
        };
        lab.addEventListener('mouseenter', function () { resaltar(true); });
        lab.addEventListener('mouseleave', function () { resaltar(false); });
        chk.addEventListener('focus', function () { resaltar(true); });
        chk.addEventListener('blur', function () { resaltar(false); });
        fs.appendChild(lab);
      });
      cont.appendChild(fs);
    });
  }

  // ==========================================================================
  // Series del gráfico
  // ==========================================================================
  // Devuelve 534 posiciones (504 de historia + 30 de pronostico).
  // La posición del último cierre se "ancla" con el valor dado para que las líneas
  // proyectadas partan visualmente del último precio real.
  function rellenarPronostico(arr30, ancla) {
    var out = new Array(N_HIST + N_PRON).fill(null);
    out[IDX_ULTIMO] = ancla;
    for (var i = 0; i < N_PRON; i++) out[N_HIST + i] = arr30[i];
    return out;
  }

  function datosActivo() {
    var t = estado.ticker;
    var p = estado.reg.predicciones[t];
    var fechasH = estado.hist.fechas.slice(-N_HIST);
    var cierres = estado.hist.cierres[t].slice(-N_HIST);
    return {
      p: p,
      fechas: fechasH.concat(estado.reg.fechas_pronostico),
      cierres: cierres
    };
  }

  function dibujarGrafico() {
    if (!grafico) return;
    var d = datosActivo(), p = d.p;
    var ancla = p.precio_ultimo;

    var historia = d.cierres.concat(new Array(N_PRON).fill(null));
    var mediana = rellenarPronostico(p.ensamble_mediana, ancla);
    var p10 = rellenarPronostico(p.banda_p10, ancla);
    var p90 = rellenarPronostico(p.banda_p90, ancla);
    var ancho = p10.map(function (v, i) { return v === null ? null : Math.round((p90[i] - v) * 100) / 100; });

    var series = [];

    // 1) Banda p10–p90: dos áreas apiladas (base transparente + ancho sombreado)
    if (estado.banda) {
      series.push({
        name: 'banda-base', type: 'line', data: p10, stack: 'banda', symbol: 'none', silent: true,
        lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 }, tooltip: { show: false }, z: 1
      });
      series.push({
        name: 'Banda p10–p90', type: 'line', data: ancho, stack: 'banda', symbol: 'none', silent: true,
        lineStyle: { opacity: 0 }, areaStyle: { color: css('--ac'), opacity: 0.16 }, z: 1
      });
    }

    // 2) Cono de volatilidad (opcional)
    if (estado.cono) {
      [['Cono inferior', p.cono_volatilidad_inf], ['Cono superior', p.cono_volatilidad_sup]].forEach(function (c) {
        series.push({
          name: c[0], type: 'line', data: rellenarPronostico(c[1], ancla), symbol: 'none', silent: true,
          lineStyle: { width: 1.2, type: 'dotted', color: css('--mut') }, z: 2
        });
      });
    }

    // 3) Una línea tenue por modelo activado
    estado.reg.modelos.forEach(function (m) {
      if (!estado.visibles.has(m.modelo)) return;
      var pm = p.modelos.filter(function (x) { return x.modelo === m.modelo; })[0];
      if (!pm) return;
      series.push({
        name: m.modelo, type: 'line', data: rellenarPronostico(pm.precios, ancla), symbol: 'none',
        lineStyle: { width: 1, opacity: 0.4, color: estado.colores[m.modelo], type: m.familia === 'DL' ? 'dashed' : 'solid' },
        itemStyle: { color: estado.colores[m.modelo] },
        emphasis: { focus: 'none', lineStyle: { width: 2.5, opacity: 1 } }, z: 3
      });
    });

    // 4) Historia
    var medianaColor = css('--ac');
    var historiaColor = css('--mut');
    series.push({
      name: 'Historia', type: 'line', data: historia, symbol: 'none',
      lineStyle: { width: 2, color: historiaColor }, itemStyle: { color: historiaColor }, z: 4
    });

    // 5) Mediana del ensamble, destacada
    series.push({
      name: 'Mediana del ensamble', type: 'line', data: mediana, symbol: 'none',
      lineStyle: { width: 3.2, color: medianaColor }, itemStyle: { color: medianaColor }, z: 6,
      markLine: {
        silent: true, symbol: 'none', animation: false,
        lineStyle: { color: css('--mut'), type: 'dashed', width: 1 },
        label: { formatter: 'Último cierre', color: css('--fg'), position: 'insideEndTop' },
        data: [{ xAxis: IDX_ULTIMO }]
      }
    });

    var sinAnimacion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    grafico.setOption({
      viewport: { key: 'regresion-' + estado.ticker, initialRange: [N_HIST - 120 - 0.5, N_HIST + N_PRON - 0.5], minSpan: 15, positive: true },
      animation: !sinAnimacion,
      textStyle: { color: css('--fg') },
      grid: { left: 64, right: 24, top: 24, bottom: 56, containLabel: true },
      xAxis: {
        type: 'category', data: d.fechas, boundaryGap: false,
        axisLabel: { color: css('--mut'), hideOverlap: true, formatter: function (v) { return fechaCorta(v); } },
        axisLine: { lineStyle: { color: css('--bd') } },
        axisTick: { lineStyle: { color: css('--bd') } }
      },
      yAxis: {
        type: 'value', scale: true,
        axisLabel: { color: css('--mut'), formatter: function (v) { return precio(v); } },
        axisLine: { lineStyle: { color: css('--bd') } },
        splitLine: { lineStyle: { color: css('--bd') } }
      },
      dataZoom: [{ type: 'inside', filterMode: 'none' }],
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'cross' }, confine: true,
        backgroundColor: css('--panel'), borderColor: css('--bd'), textStyle: { color: css('--fg') },
        formatter: function (params) { return textoTooltip(params, d); }
      },
      series: series
    }, true); // true = reemplaza la configuración anterior (evita series huérfanas)

    // Descripción accesible del gráfico
    var ret = p.retorno_proyectado_30d_pct;
    var txt = estado.ticker + ': último cierre ' + precio(p.precio_ultimo) + ' el ' + fechaLarga(estado.hist.fechas[estado.hist.fechas.length - 1]) +
      '; mediana proyectada a 30 sesiones ' + precio(p.ensamble_mediana[N_PRON - 1]) + ' (' + pctSigno(ret) + '). ' +
      'Banda p10–p90 al final: ' + precio(p.banda_p10[N_PRON - 1]) + ' a ' + precio(p.banda_p90[N_PRON - 1]) + '. ' +
      'Modelos mostrados: ' + estado.visibles.size + ' de ' + estado.reg.modelos.length + '. La tabla de la mediana está debajo del gráfico.';
    $('resumen').textContent = txt;
    $('grafico').setAttribute('aria-label', 'Gráfico de líneas de ' + estado.ticker + '. ' + txt);
  }

  // Tooltip propio: evita listar 18 modelos y muestra lo esencial
  function textoTooltip(params, d) {
    var i = params[0].dataIndex;
    var p = d.p;
    var h = '<strong>' + fechaLarga(d.fechas[i]) + '</strong><br>';
    if (i <= IDX_ULTIMO) {
      h += 'Cierre: <strong>' + precio(d.cierres[i]) + '</strong>';
      if (i === IDX_ULTIMO) h += ' (último cierre)';
      return h;
    }
    var k = i - N_HIST;
    var med = p.ensamble_mediana[k];
    h += 'Mediana: <strong>' + precio(med) + '</strong> (' + pctSigno((med / p.precio_ultimo - 1) * 100) + ')<br>';
    h += 'P10–P90: ' + precio(p.banda_p10[k]) + ' – ' + precio(p.banda_p90[k]);
    // Si hay una línea de modelo resaltada, se muestra su valor
    params.forEach(function (s) {
      var m = estado.reg.modelos.filter(function (x) { return x.modelo === s.seriesName; })[0];
      if (m && s.value != null) h += '<br>' + s.marker + m.modelo + ': ' + precio(s.value);
    });
    return h;
  }

  // ==========================================================================
  // Etiqueta de retorno proyectado: color + flecha + texto
  // ==========================================================================
  function pintarRetorno() {
    var r = estado.reg.predicciones[estado.ticker].retorno_proyectado_30d_pct;
    var el = $('etiqueta-retorno');
    var clase, flecha, palabra;
    if (r > 0) { clase = 'sube'; flecha = '▲'; palabra = 'alza'; }
    else if (r < 0) { clase = 'baja'; flecha = '▼'; palabra = 'baja'; }
    else { clase = 'neutro'; flecha = '▬'; palabra = 'sin cambio'; }
    el.className = 'etiqueta-retorno ' + clase;
    el.textContent = pctSigno(r) + ' ' + flecha;
    el.setAttribute('aria-label', pctSigno(r) + ', proyección a la ' + palabra);
  }

  function pintarTema() {
    asignarColores();
    dibujarGrafico();
    construirListaModelos();
  }
  window.onTheme = pintarTema;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!document.documentElement.hasAttribute('data-theme') && grafico) pintarTema();
  });

  // ==========================================================================
  // Tabla de métricas por modelo (ordenable)
  // ==========================================================================
  var COLUMNAS = [
    { clave: 'modelo', titulo: function () { return I18N.t('model'); }, tipo: 'texto' },
    { clave: 'familia', titulo: function () { return I18N.t('model_family'); }, tipo: 'texto' },
    { clave: 'mape_30d_pct', titulo: 'MAPE', tipo: 'pct' },
    { clave: 'mae_relativo_pct', titulo: 'MAE', tipo: 'pct' },
    { clave: 'rmse_relativo_pct', titulo: 'RMSE', tipo: 'pct' },
    { clave: 'r2_retornos_30d', titulo: 'R²', tipo: 'num3' },
    { clave: 'mejora_vs_persistencia_pct', titulo: function () { return I18N.t('improvement_vs_persistence'); }, tipo: 'pctSigno' }
  ];
  var tituloColumna = function (columna) {
    return typeof columna.titulo === 'function' ? columna.titulo() : columna.titulo;
  };

  function construirTablaMetricas() {
    var tabla = $('tabla-metricas');
    var o = estado.orden;
    var valorOrden = estado.reg.modelos.length ? estado.reg.modelos[0][o.clave] : null;
    var filas = typeof valorOrden === 'string'
      ? I18N.sort(estado.reg.modelos, function (modelo) { return String(modelo[o.clave]); })
      : estado.reg.modelos.slice().sort(function (a, b) { return a[o.clave] - b[o.clave]; });
    if (o.dir !== 'asc') filas.reverse();

    var html = '<caption>Métricas de los 18 modelos a 30 sesiones (' + filas.length + ' filas).</caption><thead><tr>';
    COLUMNAS.forEach(function (c) {
      var activa = o.clave === c.clave;
      var aria = activa ? (o.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      var flecha = activa ? (o.dir === 'asc' ? ' ▲' : ' ▼') : '';
      html += '<th scope="col" aria-sort="' + aria + '"><button type="button" data-clave="' + c.clave + '">' +
        tituloColumna(c) + flecha + '</button></th>';
    });
    html += '</tr></thead><tbody>';
    filas.forEach(function (m) {
      html += '<tr>';
      COLUMNAS.forEach(function (c) {
        var v = m[c.clave], txt, cls = '';
        if (c.clave === 'modelo') { html += '<th scope="row">' + v + '</th>'; return; }
        if (c.clave === 'familia') { html += '<td><span class="etq-familia">' + v + '</span></td>'; return; }
        if (c.tipo === 'pct') txt = pct(v);
        else if (c.tipo === 'num3') txt = fmt.num3.format(v);
        else { txt = pctSigno(v); cls = v > 0 ? 'sube' : (v < 0 ? 'baja' : ''); }
        html += '<td class="' + cls + '">' + txt + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    tabla.innerHTML = html;

    // Reordenar al pulsar un encabezado (se conserva el foco en el mismo botón)
    tabla.querySelectorAll('th button').forEach(function (b) {
      b.addEventListener('click', function () {
        var clave = b.getAttribute('data-clave');
        if (estado.orden.clave === clave) estado.orden.dir = estado.orden.dir === 'asc' ? 'desc' : 'asc';
        else estado.orden = { clave: clave, dir: (clave === 'r2_retornos_30d' || clave === 'mejora_vs_persistencia_pct') ? 'desc' : 'asc' };
        construirTablaMetricas();
        var nuevo = $('tabla-metricas').querySelector('th button[data-clave="' + clave + '"]');
        if (nuevo) nuevo.focus();
      });
    });
  }

  // ==========================================================================
  // Alternativa en tabla: los 30 precios de la mediana (lectores de pantalla)
  // ==========================================================================
  function construirTablaMediana() {
    var p = estado.reg.predicciones[estado.ticker];
    var fechas = estado.reg.fechas_pronostico;
    var html = '<caption>Mediana del ensamble para ' + estado.ticker + ': 30 sesiones proyectadas. ' +
      'Último cierre: ' + precio(p.precio_ultimo) + '.</caption>' +
      '<thead><tr><th scope="col">Sesión</th><th scope="col">Fecha</th><th scope="col">Mediana</th>' +
      '<th scope="col">P10</th><th scope="col">P90</th><th scope="col">Cambio vs último cierre</th></tr></thead><tbody>';
    for (var i = 0; i < N_PRON; i++) {
      var cambio = (p.ensamble_mediana[i] / p.precio_ultimo - 1) * 100;
      html += '<tr><th scope="row">' + (i + 1) + '</th><td>' + fechaLarga(fechas[i]) + '</td><td>' + precio(p.ensamble_mediana[i]) +
        '</td><td>' + precio(p.banda_p10[i]) + '</td><td>' + precio(p.banda_p90[i]) +
        '</td><td class="' + (cambio > 0 ? 'sube' : (cambio < 0 ? 'baja' : '')) + '">' + pctSigno(cambio) + '</td></tr>';
    }
    html += '</tbody>';
    $('tabla-mediana').innerHTML = html;
  }

  // ==========================================================================
  // Verificación: último punto de la mediana = precio_ultimo × (1 + retorno/100)
  // ==========================================================================
  function comprobar(ticker) {
    var p = estado.reg.predicciones[ticker];
    var esperado = p.precio_ultimo * (1 + p.retorno_proyectado_30d_pct / 100);
    var real = p.ensamble_mediana[N_PRON - 1];
    var dif = Math.abs(real - esperado);
    // El retorno viene redondeado a 2 decimales (±0,005 %), lo que introduce un error
    // inevitable de precio_ultimo × 0,00005. Se informa por separado de la tolerancia de 1 centavo.
    var margenRedondeo = p.precio_ultimo * 0.00005;
    return {
      ticker: ticker, mediana_final: real, esperado: Math.round(esperado * 10000) / 10000,
      diferencia: Math.round(dif * 10000) / 10000,
      ok_1_centavo: dif <= TOL_CENTAVO + 1e-9,
      ok_por_redondeo: dif <= Math.max(TOL_CENTAVO, margenRedondeo) + 1e-9
    };
  }

  function verificarActivo() {
    var r = comprobar(estado.ticker);
    var txt;
    if (r.ok_1_centavo) {
      txt = 'Verificación: mediana final ' + precio(r.mediana_final) + ' = ' + precio(r.esperado) + ' esperado (diferencia ' + precio(r.diferencia) + '). OK.';
    } else if (r.ok_por_redondeo) {
      txt = 'Verificación: mediana final ' + precio(r.mediana_final) + ' vs ' + fmt.precio.format(r.esperado) + ' esperado (diferencia ' + fmt.num3.format(r.diferencia) +
        '). Supera 1 centavo solo por el redondeo del retorno a 2 decimales.';
    } else {
      txt = 'Verificación: la mediana final no coincide con el retorno proyectado (diferencia ' + fmt.num3.format(r.diferencia) + ').';
    }
    $('verificacion').textContent = txt;
  }

  // Utilidad para la consola: verificarTodos() lista los 26 activos
  window.verificarTodos = function () {
    var filas = Object.keys(estado.reg.predicciones).map(comprobar);
    console.table(filas);
    return filas;
  };

  // ---------- Inicio ----------
  window.init = iniciar;
})();
