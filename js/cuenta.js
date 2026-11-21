(function () {
  'use strict';

  const read = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };
  const locale = () => window.EIA ? window.EIA.lang() : (read('eia_locale') || read('eia_lang') || 'es-PE');
  const number = (value, digits = 2) => new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value) || 0);
  const money = (value) => 'US$ ' + number(value, 2);
  const page = document.body.dataset.page;

  function applyRegionalState() {
    const lang = locale();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar-EG' ? 'rtl' : 'ltr';
    document.documentElement.dataset.timezone = window.EIA ? window.EIA.timeZone() : (read('eia_tz') || 'America/Lima');
  }

  function normalizeTheme() {
    const theme = read('eia_theme');
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }

  async function initProfile() {
    let dashboard = [];
    let demo = null;
    try { dashboard = await loadJSON('10_dashboard_mercado.json'); } catch (_) {}
    try { demo = await loadJSON('11_watchlist_alertas_portafolio_demo.json'); } catch (_) {}
    const storedPortfolio = read('eia_port');
    const portfolio = storedPortfolio || (demo ? demo.portafolio_demo : null);
    const cash = portfolio && typeof portfolio.efectivo === 'number' ? portfolio.efectivo : 0;
    const positions = portfolio && Array.isArray(portfolio.posiciones) ? portfolio.posiciones : [];
    let positionValue = 0;
    const rows = positions.map((position) => {
      const market = dashboard.find((item) => item.ticker === position.ticker);
      const last = market ? market.ultimo : position.costo;
      const value = last * position.cantidad;
      positionValue += value;
      const pnl = (last - position.costo) * position.cantidad;
      return '<tr><th scope="row">' + position.ticker + '</th><td>' + number(position.cantidad, 0) +
        '</td><td>' + money(position.costo) + '</td><td>' + money(last) +
        '</td><td class="' + (pnl > 0 ? 'up' : pnl < 0 ? 'dn' : 'mut') + '">' + money(pnl) + '</td></tr>';
    }).join('');
    document.querySelector('#perfil-cash').textContent = money(cash);
    document.querySelector('#perfil-posiciones').textContent = money(positionValue);
    const watch = read('eia_watch') || (demo ? demo.watchlist_inicial : []);
    document.querySelector('#perfil-watch').textContent = number(Array.isArray(watch) ? watch.length : 0, 0);
    const selected = read('eia_pf') || read('portafolio_seleccionado');
    const risk = typeof selected === 'string' ? selected : selected && selected.nivel ? selected.nivel : '';
    const riskNode = document.querySelector('#perfil-riesgo');
    riskNode.textContent = risk || 'No seleccionado';
    if (!risk) riskNode.setAttribute('data-i18n', 'cuenta.perfil.sin_riesgo');
    document.querySelector('#perfil-portafolio').textContent = risk || 'Ninguno';
    document.querySelector('#perfil-posiciones-tbody').innerHTML = rows || '<tr><td colspan="5" data-i18n="cuenta.perfil.sin_posiciones">No hay posiciones registradas.</td></tr>';

    document.querySelector('#perfil-reset').addEventListener('click', () => {
      if (!window.confirm('¿Restablecer los datos locales de la simulación?')) return;
      ['eia_port', 'eia_watch', 'eia_pf', 'eia_ticker', 'portafolio_seleccionado'].forEach((key) => localStorage.removeItem(key));
      document.querySelector('#perfil-live').textContent = 'Datos locales de simulación restablecidos.';
      location.reload();
    });
  }

  function initSettings() {
    const localeSelect = document.querySelector('#eia-locale');
    const tzSelect = document.querySelector('#eia-tz');
    const savedLocale = locale();
    const savedTz = window.EIA ? window.EIA.timeZone() : (read('eia_tz') || 'America/Lima');
    localeSelect.value = savedLocale;
    tzSelect.value = savedTz;
    const theme = read('eia_theme') || (document.documentElement.getAttribute('data-theme') || 'light');
    const themeControl = document.querySelector('input[name="eia-theme"][value="' + theme + '"]');
    if (themeControl) themeControl.checked = true;

    const preview = () => {
      const selectedLocale = localeSelect.value;
      const date = new Date('2026-11-11T21:00:00Z');
      const formatter = new Intl.DateTimeFormat(selectedLocale, {
        timeZone: tzSelect.value,
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
      document.querySelector('#eia-market-preview').textContent = formatter.format(date);
    };
    localeSelect.addEventListener('change', () => {
      document.documentElement.lang = localeSelect.value;
      document.documentElement.dir = localeSelect.value === 'ar-EG' ? 'rtl' : 'ltr';
      preview();
    });
    tzSelect.addEventListener('change', preview);
    document.querySelectorAll('input[name="eia-theme"]').forEach((control) => {
      control.addEventListener('change', () => {
        if (window.EIA) window.EIA.setTheme(control.value);
        else document.documentElement.setAttribute('data-theme', control.value);
      });
    });
    document.querySelector('#eia-save').addEventListener('click', () => {
      const themeChoice = document.querySelector('input[name="eia-theme"]:checked');
      write('eia_locale', localeSelect.value);
      write('eia_tz', tzSelect.value);
      write('eia_theme', themeChoice ? themeChoice.value : 'light');
      write('eia_lang', localeSelect.value);
      document.documentElement.dataset.timezone = tzSelect.value;
      if (window.EIA) window.EIA.setTheme(themeChoice ? themeChoice.value : 'light');
      else document.documentElement.setAttribute('data-theme', themeChoice ? themeChoice.value : 'light');
      document.documentElement.dir = localeSelect.value === 'ar-EG' ? 'rtl' : 'ltr';
      document.documentElement.lang = localeSelect.value;
      const quickLocale = document.querySelector('#idioma');
      if (quickLocale) quickLocale.value = localeSelect.value;
      document.querySelector('#eia-settings-live').textContent = 'Preferencias guardadas en este navegador.';
    });
    preview();
  }

  async function initAbout() {
    try {
      const data = await loadJSON('13_patrones_y_parametros.json');
      document.querySelector('#about-semilla').textContent = new Intl.NumberFormat(locale(), {
        maximumFractionDigits: 0,
        useGrouping: false
      }).format(data.semilla);
      const anchor = new Date(data.fecha_ancla_precios + 'T12:00:00');
      document.querySelector('#about-date').textContent = new Intl.DateTimeFormat(locale(), {
        day: '2-digit', month: 'short', year: 'numeric',
        timeZone: window.EIA ? window.EIA.timeZone() : undefined
      }).format(anchor);
      document.querySelector('#about-date').dateTime = data.fecha_ancla_precios;
      document.querySelector('#about-real').textContent = data.que_es_real;
      document.querySelector('#about-synthetic').textContent = data.que_es_sintetico;
      document.querySelector('#about-generacion').textContent = 'Fecha de generación: ' +
        new Intl.DateTimeFormat(locale(), {
          dateStyle: 'long',
          timeZone: window.EIA ? window.EIA.timeZone() : undefined
        }).format(new Date(data.fecha_generacion + 'T12:00:00'));
    } catch (error) {
      throw error;
    }
  }

  window.init = async function () {
    applyRegionalState();
    normalizeTheme();
    if (page === 'perfil') await initProfile();
    if (page === 'configuracion') initSettings();
    if (page === 'acerca') await initAbout();
  };
})();
