/* Native HTTP smoke checks. Requires Playwright only for development/testing.
 * No chart mocks, no CDN, no application changes. Run server in another terminal.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const BASE = (process.env.BASE || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const pages = [
  ['index', '#market-table tr', 1], ['watchlist', '#add-watch', 0],
  ['trading', '#order-form', 1], ['leaderboard', '.your-row', 0],
  ['clasificacion', '#selTicker', 0], ['regresion', '#grafico', 1],
  ['optimizador', '#det-cuerpo', 1], ['portafolios', '#pf-tarjetas', 3],
  ['backtesting', '#graf-capital', 2], ['perfil', '#perfil-cash', 0],
  ['configuracion', '#eia-save', 0], ['ayuda', 'details', 0],
  ['acerca', '#about-semilla', 0]
];
const rows = [];
const record = (name, passed, detail = '') => {
  rows.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`);
};
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function open(page, name) {
  await page.goto(BASE + name + '.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('body.app-ready');
  await page.waitForTimeout(500);
}
try {
  for (const width of [1440, 390]) {
    for (const [name, selector, charts] of pages) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', r => errors.push(r.url() + ': request failed'));
      try {
        await open(page, name);
        const info = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          links: document.querySelectorAll('.sidebar nav a').length,
          charts: document.querySelectorAll('.js-plotly-plot').length,
          title: !!document.querySelector('main h1'),
          skip: !!document.querySelector('a.skip'),
          loadError: !!document.querySelector('.load-error'),
          resources: performance.getEntriesByType('resource').map(r => r.name)
        }));
        const issues = [...errors];
        if (info.width > width + 2) issues.push(`Overflow: ${info.width}px`);
        if (info.links !== 13) issues.push('Expected 13 navigation links');
        if (!info.title || !info.skip || info.loadError) issues.push('Missing shell or load error');
        if (await page.locator(selector).count() === 0) issues.push('Missing ' + selector);
        if (info.charts < charts) issues.push(`Missing charts: ${info.charts}/${charts}`);
        if (info.resources.some(url => new URL(url).origin !== new URL(BASE).origin)) issues.push('External resource detected');
        record(`${name} @ ${width}`, !issues.length, issues.join('; '));
      } catch (e) { record(`${name} @ ${width}`, false, e.message); }
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  try {
    await open(page, 'index');
    await page.selectOption('#sel', 'NVDA');
    await page.click('[data-watch="AAPL"]');
    await open(page, 'regresion');
    record('Activo persistente Dashboard -> Regresion', await page.inputValue('#sel-activo') === 'NVDA');
    await open(page, 'watchlist');
    record('Watchlist persiste por HTTP', await page.evaluate(() => Market.watch().includes('AAPL')));
    await open(page, 'trading');
    await page.evaluate(() => { if (Market.state().enabled) Market.toggle(); });
    await page.selectOption('#order-asset', 'AAPL');
    await page.fill('#order-qty', '1');
    await page.click('#review-order');
    record('Previsualizacion sin operacion', await page.evaluate(() => Market.orders().length === 0));
    await page.click('[data-confirm-order]');
    await page.waitForFunction(() => Market.orders().some(o => o.status === 'filled'));
    await open(page, 'leaderboard');
    record('Operacion persiste entre paginas', await page.evaluate(() => Market.orders().length === 1));
    record('Saldo actualizado', await page.evaluate(() => Market.portfolio().cash < 25000));
  } catch (e) { record('Integracion HTTP', false, e.message); }
  await context.close();
} finally {
  await browser.close();
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/http-smoke.json', JSON.stringify(rows, null, 2));
}
console.log(`${rows.filter(r => r.passed).length}/${rows.length} checks passed.`);
process.exitCode = rows.some(r => !r.passed) ? 1 : 0;
