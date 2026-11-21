/* Pruebas de humo del sitio integrado (Semana 13 · P07).
   Abre las 13 páginas a 1280 px y a 375 px y reporta: errores de consola, errores de página,
   solicitudes fallidas, desborde horizontal y elementos clave. Además verifica el estado
   compartido entre módulos y el selector de idioma.

   Uso:
     npm i -D playwright && npx playwright install chromium
     python -m http.server 8000            # en otra terminal
     node tests/smoke.mjs                  # o: BASE=https://<usuario>.github.io/<repo>/ node tests/smoke.mjs
   Sin Internet (ECharts no carga desde el CDN): OFFLINE=1 node tests/smoke.mjs
   OFFLINE=1 sustituye ECharts por un doble vacío; solo comprueba la lógica de las páginas, NO los gráficos. */
import { chromium } from 'playwright';

const BASE = (process.env.BASE || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const OFFLINE = process.env.OFFLINE === '1';
const PAGES = [
  ['index.html', '#kpis .card'], ['watchlist.html', '#tb tr'], ['trading.html', '#f'], ['leaderboard.html', '#tb tr'],
  ['clasificacion.html', '#selTicker'], ['regresion.html', '#sel-activo'], ['optimizador.html', '#grafico'],
  ['portafolios.html', '#btn-trading'], ['backtesting.html', '#tabla-met'], ['perfil.html', '#perfil-cash'],
  ['configuracion.html', '#eia-save'], ['ayuda.html', 'details'], ['acerca.html', '#about-semilla']
];
const ECHARTS_STUB = `window.echarts={init(){const c={setOption(){},resize(){},dispose(){},on(){},off(){},clear(){},dispatchAction(){},getZr(){return{on(){},off(){}}},getWidth(){return 800},getHeight(){return 400},isDisposed(){return false}};return c},registerTheme(){},graphic:{}}`;

const filas = []; let fallos = 0;
const reg = (caso, ok, detalle = '') => { filas.push([caso, ok ? 'OK' : 'FALLA', detalle]); if (!ok) fallos++; };

const browser = await chromium.launch();
async function nuevaPagina(ancho) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: 800 } });
  const page = await ctx.newPage(); const errores = [];
  page.on('console', m => { if (m.type() === 'error') errores.push('consola: ' + m.text()); });
  page.on('pageerror', e => errores.push('página: ' + e.message));
  page.on('requestfailed', r => errores.push('red: ' + r.url()));
  if (OFFLINE) await ctx.route(/echarts/, r => r.fulfill({ contentType: 'application/javascript', body: ECHARTS_STUB }));
  return { ctx, page, errores };
}

for (const ancho of [1280, 375]) {
  for (const [url, clave] of PAGES) {
    const { ctx, page, errores } = await nuevaPagina(ancho);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const info = await page.evaluate(k => ({
      desborde: document.documentElement.scrollWidth - window.innerWidth,
      nav: document.querySelectorAll('header.top nav a').length,
      skip: !!document.querySelector('a.skip'), h1: !!document.querySelector('main h1'),
      aviso: !!document.querySelector('main .aviso'), clave: !!document.querySelector(k), lang: document.documentElement.lang
    }), clave);
    const motivo = [];
    if (errores.length) motivo.push(errores.join(' | ').slice(0, 160));
    if (info.desborde > 1) motivo.push(`desborde horizontal ${info.desborde}px`);
    if (info.nav !== 13) motivo.push(`nav con ${info.nav} enlaces`);
    if (!info.skip) motivo.push('sin «Saltar al contenido»');
    if (!info.h1) motivo.push('sin h1');
    if (!info.aviso) motivo.push('sin aviso sintético');
    if (!info.clave) motivo.push(`falta ${clave}`);
    reg(`${url} @${ancho}`, motivo.length === 0, motivo.join('; '));
    await ctx.close();
  }
}

/* Integración 1: el activo elegido en el Dashboard se conserva en Regresión y en Clasificación */
{ const nombre = "Integración 1";
  try {
  const { ctx, page } = await nuevaPagina(1280);
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  const t = await page.evaluate(() => { const s = document.querySelector('#sel'); return [...s.options].map(o => o.value).find(v => v === 'NVDA') || s.options[3].value; });
  await page.selectOption('#sel', t);
  await page.goto(BASE + 'regresion.html', { waitUntil: 'networkidle' });
  reg('Estado compartido: activo Dashboard → Regresión', (await page.inputValue('#sel-activo')) === t, `esperado ${t}`);
  await page.goto(BASE + 'clasificacion.html', { waitUntil: 'networkidle' });
  reg('Estado compartido: activo Dashboard → Clasificación', (await page.inputValue('#selTicker')) === t, `esperado ${t}`);
  reg('Enlace cruzado Clasificación → Regresión', ((await page.getAttribute('#ctaBtn', 'href')) || '').includes('ticker=' + t));
  await page.goto(BASE + 'regresion.html', { waitUntil: 'networkidle' });
  reg('Enlace cruzado Regresión → Optimizador', (await page.locator('a[href="optimizador.html"]').count()) > 0);
  await ctx.close();
  } catch (e) { reg(nombre, false, String(e.message).split('\n')[0].slice(0, 140)); }
}

/* Integración 2: el portafolio elegido llega a Trading y a Backtesting */
{ const nombre = "Integración 2";
  try {
  const { ctx, page } = await nuevaPagina(1280);
  await page.goto(BASE + 'portafolios.html', { waitUntil: 'networkidle' });
  await page.click('#btn-trading');
  await page.goto(BASE + 'trading.html', { waitUntil: 'networkidle' });
  reg('Estado compartido: portafolio elegido → Trading', await page.locator('#pfsel:not([hidden])').count() === 1);
  await page.goto(BASE + 'backtesting.html', { waitUntil: 'networkidle' });
  reg('Estado compartido: portafolio elegido → Backtesting', await page.locator('#pf-elegido').count() === 1);
  await ctx.close();
  } catch (e) { reg(nombre, false, String(e.message).split('\n')[0].slice(0, 140)); }
}

/* Integración 3: selector de idioma ES-PE / EN-US */
{ const nombre = "Integración 3";
  try {
  const { ctx, page } = await nuevaPagina(1280);
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await Promise.all([page.waitForNavigation(), page.selectOption('#idioma', 'en-US')]);
  await page.waitForLoadState('networkidle');
  const lang = await page.evaluate(() => document.documentElement.lang);
  const navTxt = await page.locator('header.top nav a[href="clasificacion.html"]').innerText();
  reg('Idioma EN-US: lang y navegación traducida', lang === 'en-US' && /Classification/.test(navTxt), `${lang} / ${navTxt}`);
  await page.goto(BASE + 'regresion.html', { waitUntil: 'networkidle' });
  reg('Idioma EN-US persiste en otro módulo', (await page.evaluate(() => document.documentElement.lang)) === 'en-US');
  await ctx.close();
  } catch (e) { reg(nombre, false, String(e.message).split('\n')[0].slice(0, 140)); }
}
await browser.close();

console.log('\n| Caso | Resultado | Detalle |\n|---|---|---|');
for (const f of filas) console.log(`| ${f[0]} | ${f[1]} | ${f[2]} |`);
console.log(`\n${filas.length - fallos}/${filas.length} casos OK` + (OFFLINE ? ' (modo OFFLINE: ECharts sustituido, gráficos NO verificados)' : ''));
process.exit(fallos ? 1 : 0);
