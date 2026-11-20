/* ==========================================================================
   optimizador.js — Módulo Optimizador: Markowitz, NSGA-II y NSGA-III (ECharts)
   NSGA-II y NSGA-III simulados: no se ejecutó ningún algoritmo evolutivo.

   Este módulo SOLO LEE las fronteras desde el JSON; no recalcula ni optimiza nada.
   Entrada: data/07_optimizador_markowitz_nsga.json
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Constantes ----------
  var RUTA_DATOS = 'data/07_optimizador_markowitz_nsga.json';
  var TOL_SUMA = 0.02;      // la suma de pesos debe ser 1 ± 0,02
  var EPS = 1e-9;           // holgura numérica al comparar con el tope

  // Definición de las cuatro series posibles. El orden fija el recorrido con las flechas ↑ ↓.
  var ORDEN = ['mk_e', 'mk_u', 'n2', 'n3'];
  var DEF = {
    mk_e: { nombre: 'Markowitz · elegibles', prefijo: 'MK-E', campo: 'markowitz_elegibles', color: '#1f3fbf', linea: 'solid' },
    mk_u: { nombre: 'Markowitz · universo completo', prefijo: 'MK-U', campo: 'markowitz_universo_completo', color: '#7a2fa8', linea: 'dashed' },
    n2:   { nombre: 'NSGA-II (simulado)', prefijo: 'N2', campo: 'nsga2_elegibles', color: '#0f7c78' },
    n3:   { nombre: 'NSGA-III (simulado)', prefijo: 'N3', campo: 'nsga3_elegibles', color: '#e07b39' }
  };
  // Escala secuencial para el CVaR 95 %: claro = poca pérdida en cola, oscuro = mucha
  var ESCALA_CVAR = ['#f2c14e', '#e07b39', '#b3361f', '#5c0f2e'];

  // ---------- Estado ----------
  var estado = {
    datos: null,
    series: {},          // clave → { def, puntos[] } (puntos ordenados por volatilidad)
    indices: {},         // clave → índice de la serie dentro del option de ECharts
    sel: null,           // { key, pos } portafolio seleccionado
    kbd: null,           // { key, pos } punto enfocado con el teclado
    locale: document.documentElement.lang || 'es-PE'
  };
  var grafico = null;
  var $ = function (id) { return document.getElementById(id); };

  // ==========================================================================
  // Formato con Intl según el locale activo
  // ==========================================================================
  var fmt = {};
  function crearFormatos() {
    var l = estado.locale;
    var porc = function (min, max) { return new Intl.NumberFormat(l, { style: 'percent', minimumFractionDigits: min, maximumFractionDigits: max }); };
    fmt.pct2 = porc(2, 2);   // recibe fracción: 0,2358 → 23,58 %
    fmt.pct0 = porc(0, 0);   // para las marcas de los ejes
    fmt.sharpe = new Intl.NumberFormat(l, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  // Las métricas del JSON vienen ya en % (ej. 8,62), por eso se divide entre 100 para Intl
  var pctPunto = function (v) { return fmt.pct2.format(v / 100); };
  var pctPeso = function (w) { return fmt.pct2.format(w); };   // los pesos vienen como fracción

  // ==========================================================================
  // Carga de datos
  // ==========================================================================
  function mostrarError(texto) {
    var m = $('mensaje');
    m.className = 'error';
    m.textContent = texto;
  }

  function iniciar() {
    if (typeof echarts === 'undefined') {
      mostrarError('No se cargó ECharts. Revisa tu conexión o aloja la librería localmente.');
      return;
    }
    fetch(RUTA_DATOS)
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar ' + RUTA_DATOS + ' (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function (d) { estado.datos = d; arrancar(); })
      .catch(function (e) {
        mostrarError(e.message + '. Si abriste el archivo con doble clic (file://), sírvelo desde un servidor local, ' +
          'por ejemplo: python3 -m http.server');
      });
  }

  // Convierte cada lista del JSON en puntos ordenados por volatilidad (solo lectura, sin recalcular)
  function prepararSeries() {
    ORDEN.forEach(function (k) {
      var def = DEF[k];
      var lista = estado.datos[def.campo].slice().sort(function (a, b) {
        return a.volatilidad_anual_pct - b.volatilidad_anual_pct;
      });
      var puntos = lista.map(function (p, i) {
        return {
          id: p.id || (def.prefijo + '-' + String(i + 1).padStart(2, '0')), // Markowitz no trae id: se le asigna uno
          key: k,
          vol: p.volatilidad_anual_pct,
          ret: p.retorno_esperado_anual_pct,
          sharpe: p.sharpe,
          cvar: p.cvar95_diario_pct,
          pesos: p.pesos
        };
      });
      estado.series[k] = { def: def, puntos: puntos };
    });
  }

  // ==========================================================================
  // Visibilidad de series según interruptores
  // ==========================================================================
  function modoMarkowitz() {
    return document.querySelector('input[name="modo-mk"]:checked').value;
  }
  function esVisible(k) {
    if (k === 'mk_e') return $('chk-mk').checked && modoMarkowitz() !== 'u';
    if (k === 'mk_u') return $('chk-mk').checked && modoMarkowitz() !== 'e';
    if (k === 'n2') return $('chk-n2').checked;
    return $('chk-n3').checked;
  }
  function clavesVisibles() { return ORDEN.filter(esVisible); }

  // ==========================================================================
  // Arranque de la interfaz
  // ==========================================================================
  function arrancar() {
    prepararSeries();
    $('sel-locale').value = estado.locale;
    if ($('sel-locale').value !== estado.locale) { estado.locale = 'es-PE'; $('sel-locale').value = 'es-PE'; }

    // Interruptores: cualquier cambio redibuja gráfico y tabla
    ['chk-mk', 'chk-n2', 'chk-n3'].forEach(function (id) { $(id).addEventListener('change', alCambiarSeries); });
    document.querySelectorAll('input[name="modo-mk"]').forEach(function (r) { r.addEventListener('change', alCambiarSeries); });
    $('sel-locale').addEventListener('change', function (e) { estado.locale = e.target.value; actualizarTodo(); });

    $('app').hidden = false;
    $('mensaje').textContent = '';
    $('mensaje').className = '';

    grafico = echarts.init($('grafico'));
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { grafico.resize(); }).observe($('grafico'));
    else window.addEventListener('resize', function () { grafico.resize(); });

    // Clic con el ratón sobre un punto del gráfico
    grafico.on('click', function (p) {
      if (p.seriesId && estado.series[p.seriesId]) seleccionar(p.seriesId, p.dataIndex, false);
    });
    // Teclado sobre el contenedor del gráfico
    $('grafico').addEventListener('keydown', alTeclear);
    $('grafico').addEventListener('blur', function () {
      grafico.dispatchAction({ type: 'hideTip' });
      grafico.dispatchAction({ type: 'downplay' });
    });

    actualizarTodo();
  }

  function alCambiarSeries() {
    // Si el punto enfocado con el teclado pertenece a una serie oculta, se descarta
    if (estado.kbd && !esVisible(estado.kbd.key)) estado.kbd = null;
    dibujarGrafico();
    construirTabla();
  }

  function actualizarTodo() {
    crearFormatos();
    dibujarGrafico();
    pintarPanel();
    construirTabla();
    pintarElegibles();
    pintarVerificacionGlobal();
    $('leyenda').textContent = 'Cada punto es un portafolio. Eje X: volatilidad anual; eje Y: retorno esperado anual. ' +
      'En NSGA-III el color indica el CVaR 95 % diario (más oscuro, mayor pérdida en la cola). El círculo negro marca el portafolio seleccionado.';
  }

  // ==========================================================================
  // Gráfico de dispersión
  // ==========================================================================
  function datosMarcador() {
    var s = estado.sel;
    if (!s || !esVisible(s.key)) return [];
    var p = estado.series[s.key].puntos[s.pos];
    return [[p.vol, p.ret]];
  }

  function dibujarGrafico() {
    if (!grafico) return;
    var series = [];
    estado.indices = {};

    ORDEN.forEach(function (k) {
      if (!esVisible(k)) return;
      var S = estado.series[k], def = S.def, pts = S.puntos, s;
      if (k === 'mk_e' || k === 'mk_u') {
        // Curva de Markowitz: línea con marcadores pequeños (cada marcador es seleccionable)
        s = {
          id: k, name: def.nombre, type: 'line', symbol: 'rect', symbolSize: 7,
          data: pts.map(function (p) { return [p.vol, p.ret]; }),
          lineStyle: { width: 2.5, color: def.color, type: def.linea },
          itemStyle: { color: def.color },
          emphasis: { scale: 1.9, itemStyle: { borderColor: '#000', borderWidth: 2 } },
          z: 3
        };
      } else if (k === 'n2') {
        // NSGA-II: rombos
        s = {
          id: k, name: def.nombre, type: 'scatter', symbol: 'diamond', symbolSize: 12,
          data: pts.map(function (p) { return [p.vol, p.ret]; }),
          itemStyle: { color: def.color, borderColor: '#073b39', borderWidth: 0.8 },
          emphasis: { scale: 1.6, itemStyle: { borderColor: '#000', borderWidth: 3 } },
          z: 4
        };
      } else {
        // NSGA-III: círculos; el color lo pone el visualMap según la dimensión 2 (CVaR 95 %)
        s = {
          id: k, name: def.nombre, type: 'scatter', symbol: 'circle', symbolSize: 11,
          data: pts.map(function (p) { return [p.vol, p.ret, p.cvar]; }),
          itemStyle: { borderColor: '#222', borderWidth: 0.8 },
          emphasis: { scale: 1.6, itemStyle: { borderColor: '#000', borderWidth: 3 } },
          z: 5
        };
      }
      estado.indices[k] = series.length;
      series.push(s);
    });

    // Marcador del portafolio seleccionado (anillo negro, no interactivo)
    series.push({
      id: 'sel', name: 'Seleccionado', type: 'scatter', symbol: 'circle', symbolSize: 26, silent: true,
      data: datosMarcador(), itemStyle: { color: 'rgba(0,0,0,0)', borderColor: '#000', borderWidth: 3 },
      tooltip: { show: false }, z: 10
    });

    // Escala de color del CVaR 95 %: solo si NSGA-III está visible
    var visualMap = null;
    if (esVisible('n3')) {
      var cv = estado.series.n3.puntos.map(function (p) { return p.cvar; });
      visualMap = {
        type: 'continuous', seriesId: 'n3', dimension: 2,
        min: Math.floor(Math.min.apply(null, cv) * 100) / 100,
        max: Math.ceil(Math.max.apply(null, cv) * 100) / 100,
        orient: 'horizontal', left: 'center', bottom: 6, itemWidth: 14, itemHeight: 220,
        calculable: false, text: ['CVaR 95 % mayor', 'menor'], textStyle: { color: '#3f4b59' },
        formatter: function (v) { return fmt.pct2.format(v / 100); },
        inRange: { color: ESCALA_CVAR }
      };
    }

    var sinAnimacion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    grafico.setOption({
      animation: !sinAnimacion,
      grid: { left: 70, right: 24, top: 20, bottom: visualMap ? 96 : 58 },
      xAxis: {
        type: 'value', scale: true, name: 'Volatilidad anual', nameLocation: 'middle', nameGap: 32,
        axisLabel: { color: '#3f4b59', formatter: function (v) { return fmt.pct0.format(v / 100); } },
        splitLine: { lineStyle: { color: '#e3e8ef' } }
      },
      yAxis: {
        type: 'value', scale: true, name: 'Retorno esperado anual', nameLocation: 'middle', nameGap: 50,
        axisLabel: { color: '#3f4b59', formatter: function (v) { return fmt.pct0.format(v / 100); } },
        splitLine: { lineStyle: { color: '#e3e8ef' } }
      },
      tooltip: {
        trigger: 'item', confine: true,
        formatter: function (p) {
          var S = estado.series[p.seriesId];
          if (!S) return '';
          var q = S.puntos[p.dataIndex];
          return '<strong>' + S.def.nombre + ' · ' + q.id + '</strong><br>' +
            'Retorno: ' + pctPunto(q.ret) + '<br>Volatilidad: ' + pctPunto(q.vol) + '<br>' +
            'Sharpe: ' + fmt.sharpe.format(q.sharpe) + '<br>CVaR 95 % diario: ' + pctPunto(q.cvar) +
            '<br><em>Clic o Enter para ver los pesos</em>';
        }
      },
      visualMap: visualMap || [],
      series: series
    }, true); // true = reemplaza el option anterior (evita series y escalas huérfanas)
  }

  // ==========================================================================
  // Selección de un portafolio (clic, Enter o botón de la tabla)
  // ==========================================================================
  function seleccionar(key, pos, enfocarPanel) {
    estado.sel = { key: key, pos: pos };
    // Se actualiza solo el anillo, sin redibujar todo el gráfico
    grafico.setOption({ series: [{ id: 'sel', data: datosMarcador() }] });
    pintarPanel();
    construirTabla();
    var p = estado.series[key].puntos[pos];
    $('anuncio').textContent = 'Seleccionado ' + p.id + ' de ' + estado.series[key].def.nombre +
      '. Los pesos y métricas están en el panel de detalle.';
    if (enfocarPanel) {
      var panel = $('detalle');
      panel.focus();
      if (panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest' });
    }
  }

  // ==========================================================================
  // Verificación: suma de pesos = 1 ± 0,02 y ningún peso sobre el tope
  // ==========================================================================
  function comprobarPunto(p) {
    var tope = estado.datos.tope_peso_por_activo;
    var vals = Object.keys(p.pesos).map(function (a) { return p.pesos[a]; });
    var suma = vals.reduce(function (x, y) { return x + y; }, 0);
    var maxPeso = vals.length ? Math.max.apply(null, vals) : 0;
    return {
      suma: suma, maxPeso: maxPeso,
      okSuma: Math.abs(suma - 1) <= TOL_SUMA + EPS,
      okTope: maxPeso <= tope + EPS
    };
  }

  // ==========================================================================
  // Panel de detalle: métricas y pesos en barras
  // ==========================================================================
  function pintarPanel() {
    var cont = $('det-cuerpo');
    if (!estado.sel) {
      cont.innerHTML = '<p class="vacio">Haz clic en un punto del gráfico para ver su composición. Con teclado: enfoca el gráfico con Tab, ' +
        'muévete con las flechas y pulsa Enter. También puedes usar «Ver pesos» en la tabla de puntos.</p>';
      return;
    }
    var S = estado.series[estado.sel.key];
    var p = S.puntos[estado.sel.pos];
    var tope = estado.datos.tope_peso_por_activo;
    var c = comprobarPunto(p);

    var html = '<p class="sub">' + S.def.nombre + ' · ' + p.id + '</p>';
    html += '<dl class="metricas">' +
      '<dt>Retorno esperado anual</dt><dd>' + pctPunto(p.ret) + '</dd>' +
      '<dt>Volatilidad anual</dt><dd>' + pctPunto(p.vol) + '</dd>' +
      '<dt>Sharpe (tasa libre ' + pctPeso(estado.datos.tasa_libre_riesgo) + ')</dt><dd>' + fmt.sharpe.format(p.sharpe) + '</dd>' +
      '<dt>CVaR 95 % diario</dt><dd>' + pctPunto(p.cvar) + '</dd></dl>';

    html += '<p class="pesos-tit" id="pesos-tit">Pesos del portafolio</p><ul class="pesos" aria-labelledby="pesos-tit">';
    Object.keys(p.pesos)
      .filter(function (a) { return p.pesos[a] > 0; })
      .sort(function (a, b) { return p.pesos[b] - p.pesos[a]; })
      .forEach(function (a) {
        var w = p.pesos[a];
        var enTope = w >= tope - EPS;
        html += '<li><span class="tk">' + a + '</span>' +
          '<span class="pista" aria-hidden="true"><span class="barra' + (enTope ? ' tope' : '') + '" style="display:block;width:' + Math.min(100, (w / tope) * 100).toFixed(1) + '%"></span></span>' +
          '<span class="val">' + pctPeso(w) + (enTope ? '<span class="solo-lector"> (en el tope)</span>' : '') + '</span></li>';
      });
    html += '</ul><p class="nota-barras">Barra completa = tope de ' + pctPeso(tope) + ' por activo (rayada si lo alcanza).</p>';

    var ok = c.okSuma && c.okTope;
    html += '<div class="chequeo ' + (ok ? 'ok' : 'mal') + '" role="status">' +
      '<p>' + (c.okSuma ? '✓' : '✗') + ' Suma de pesos: ' + pctPeso(c.suma) + ' (debe ser 100 % ± 2 %)</p>' +
      '<p>' + (c.okTope ? '✓' : '✗') + ' Peso máximo: ' + pctPeso(c.maxPeso) + ' (tope ' + pctPeso(tope) + ')</p></div>';
    cont.innerHTML = html;
  }

  // Verificación de todos los puntos del archivo, mostrada bajo el gráfico
  function resumenVerificacion() {
    var total = 0, fallan = 0, sMin = Infinity, sMax = -Infinity, mMax = 0;
    ORDEN.forEach(function (k) {
      estado.series[k].puntos.forEach(function (p) {
        var c = comprobarPunto(p);
        total++;
        if (!(c.okSuma && c.okTope)) fallan++;
        sMin = Math.min(sMin, c.suma); sMax = Math.max(sMax, c.suma); mMax = Math.max(mMax, c.maxPeso);
      });
    });
    return { total: total, fallan: fallan, sMin: sMin, sMax: sMax, mMax: mMax };
  }

  function pintarVerificacionGlobal() {
    var r = resumenVerificacion();
    $('verif-global').textContent = 'Verificación de los ' + r.total + ' portafolios del archivo: suma de pesos entre ' + pctPeso(r.sMin) + ' y ' +
      pctPeso(r.sMax) + ' (tolerancia ±2 %); peso máximo ' + pctPeso(r.mMax) + ' con tope ' + pctPeso(estado.datos.tope_peso_por_activo) + '. ' +
      (r.fallan === 0 ? 'Todos cumplen.' : r.fallan + ' no cumplen.');
  }

  // Utilidad para la consola: verificarTodos() resume cada serie
  window.verificarTodos = function () {
    var filas = ORDEN.map(function (k) {
      var pts = estado.series[k].puntos, sumas = [], maxs = [], mal = 0;
      pts.forEach(function (p) {
        var c = comprobarPunto(p); sumas.push(c.suma); maxs.push(c.maxPeso);
        if (!(c.okSuma && c.okTope)) mal++;
      });
      return { serie: DEF[k].nombre, puntos: pts.length, suma_min: Math.min.apply(null, sumas), suma_max: Math.max.apply(null, sumas),
        peso_max: Math.max.apply(null, maxs), tope: estado.datos.tope_peso_por_activo, incumplen: mal };
    });
    console.table(filas);
    return filas;
  };

  // ==========================================================================
  // Tabla alternativa de puntos (series visibles)
  // ==========================================================================
  function construirTabla() {
    var tabla = $('tabla-puntos');
    var visibles = clavesVisibles();
    var n = visibles.reduce(function (a, k) { return a + estado.series[k].puntos.length; }, 0);
    var html = '<caption>Puntos de las series visibles (' + n + ' filas), ordenados por volatilidad dentro de cada serie.</caption>' +
      '<thead><tr><th scope="col">Serie</th><th scope="col">ID</th><th scope="col">Volatilidad</th><th scope="col">Retorno</th>' +
      '<th scope="col">Sharpe</th><th scope="col">CVaR 95 % diario</th><th scope="col">Pesos</th></tr></thead><tbody>';
    visibles.forEach(function (k) {
      estado.series[k].puntos.forEach(function (p, i) {
        var actual = estado.sel && estado.sel.key === k && estado.sel.pos === i;
        html += '<tr' + (actual ? ' aria-current="true"' : '') + '><th scope="row">' + estado.series[k].def.nombre + '</th><td>' + p.id + '</td><td>' +
          pctPunto(p.vol) + '</td><td>' + pctPunto(p.ret) + '</td><td>' + fmt.sharpe.format(p.sharpe) + '</td><td>' + pctPunto(p.cvar) +
          '</td><td><button type="button" class="chico" data-k="' + k + '" data-i="' + i + '" aria-label="Ver pesos de ' + p.id + '">Ver pesos</button></td></tr>';
      });
    });
    html += '</tbody>';
    tabla.innerHTML = html;
    tabla.querySelectorAll('button[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        seleccionar(b.getAttribute('data-k'), parseInt(b.getAttribute('data-i'), 10), true);
      });
    });
  }

  // ==========================================================================
  // Teclado sobre el gráfico: ←/→ recorren puntos, ↑/↓ cambian de serie,
  // Inicio/Fin saltan a los extremos, Enter o Espacio seleccionan, Escape cierra el tooltip
  // ==========================================================================
  function alTeclear(e) {
    var visibles = clavesVisibles();
    if (!visibles.length) return;
    var k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ', 'Escape'].indexOf(k) < 0) return;
    e.preventDefault();

    if (k === 'Escape') {
      grafico.dispatchAction({ type: 'hideTip' });
      grafico.dispatchAction({ type: 'downplay' });
      return;
    }
    // Primera pulsación: se parte del primer punto de la primera serie visible
    if (!estado.kbd || visibles.indexOf(estado.kbd.key) < 0) {
      estado.kbd = { key: visibles[0], pos: 0 };
      // Con Enter o Espacio se selecciona ese punto inicial; con cualquier otra tecla solo se enfoca
      if (k !== 'Enter' && k !== ' ') { enfocarPunto(); return; }
    }
    var kb = estado.kbd, pts = estado.series[kb.key].puntos;

    if (k === 'Enter' || k === ' ') { seleccionar(kb.key, kb.pos, false); return; }
    if (k === 'ArrowRight') kb.pos = Math.min(pts.length - 1, kb.pos + 1);
    else if (k === 'ArrowLeft') kb.pos = Math.max(0, kb.pos - 1);
    else if (k === 'Home') kb.pos = 0;
    else if (k === 'End') kb.pos = pts.length - 1;
    else {
      // ↑ / ↓: cambiar de serie conservando la volatilidad más cercana
      var vol = pts[kb.pos].vol;
      var i = visibles.indexOf(kb.key);
      var ni = (i + (k === 'ArrowDown' ? 1 : -1) + visibles.length) % visibles.length;
      var destino = estado.series[visibles[ni]].puntos, mejor = 0;
      destino.forEach(function (p, j) {
        if (Math.abs(p.vol - vol) < Math.abs(destino[mejor].vol - vol)) mejor = j;
      });
      kb.key = visibles[ni]; kb.pos = mejor;
    }
    enfocarPunto();
  }

  // Resalta el punto enfocado, muestra su tooltip y lo anuncia a lectores de pantalla
  function enfocarPunto() {
    var kb = estado.kbd;
    var idx = estado.indices[kb.key];
    var p = estado.series[kb.key].puntos[kb.pos];
    grafico.dispatchAction({ type: 'downplay' });
    grafico.dispatchAction({ type: 'highlight', seriesIndex: idx, dataIndex: kb.pos });
    grafico.dispatchAction({ type: 'showTip', seriesIndex: idx, dataIndex: kb.pos });
    $('anuncio').textContent = estado.series[kb.key].def.nombre + ', ' + p.id + ' (' + (kb.pos + 1) + ' de ' + estado.series[kb.key].puntos.length +
      '): volatilidad ' + pctPunto(p.vol) + ', retorno ' + pctPunto(p.ret) + '. Pulsa Enter para ver los pesos.';
  }

  // ==========================================================================
  // Activos elegibles y criterio
  // ==========================================================================
  function pintarElegibles() {
    var d = estado.datos;
    $('criterio').textContent = 'Un activo es elegible cuando su consenso binario es SUBE y la proyección mediana de los regresores a 30 sesiones es mayor que 0. ' +
      'Hay ' + d.elegibles.length + ' activos elegibles.';
    var ul = $('lista-elegibles');
    ul.innerHTML = '';
    d.elegibles.forEach(function (a) {
      var li = document.createElement('li');
      li.textContent = a;
      ul.appendChild(li);
    });
    // El criterio original del archivo se muestra como texto plano (sin interpretarlo como HTML)
    var p = $('params');
    p.textContent = '';
    p.appendChild(document.createTextNode('Criterio tal como figura en el archivo: '));
    var code = document.createElement('code');
    code.textContent = d.criterio_elegibilidad;
    p.appendChild(code);
    p.appendChild(document.createTextNode('. Tope por activo: ' + pctPeso(d.tope_peso_por_activo) +
      '. Tasa libre de riesgo para el Sharpe: ' + pctPeso(d.tasa_libre_riesgo) + '.'));
  }

  // ---------- Inicio ----------
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
