import os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from offline_harness import open_local
import json
out=(Path(__file__).resolve().parents[1]/'test-results');results=[]; (Path(__file__).resolve().parents[1]/'test-results').mkdir(exist_ok=True);errors=[]
def check(name,ok,detail=None):
 results.append({'test':name,'passed':bool(ok),'detail':detail});(out/'analysis.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(('PASS ' if ok else 'FAIL ')+name,detail or '',flush=True)
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1440,'height':1000});storage={}
 def page(name):
  pg=ctx.new_page();pg.on('pageerror',lambda e:errors.append(str(e)));open_local(pg,name,storage);return pg
 pg=page('clasificacion');pg.select_option('#selTicker','NVDA');check('Clasificacion comparte el activo elegido',pg.evaluate('EIA.ticker()')=='NVDA');check('Clasificacion enlaza el mismo activo a Regresion','ticker=NVDA' in pg.locator('#ctaBtn').get_attribute('href'));storage=pg.evaluate('window.__testStorage');pg.close()
 pg=page('regresion');check('Regresion recibe NVDA',pg.locator('#sel-activo').input_value()=='NVDA');pg.click('[data-familia="DL"]');check('Filtro de familia DL',pg.locator('[data-familia="DL"]').get_attribute('aria-pressed')=='true');pg.click('#btn-ninguno');check('Quitar modelos no destruye el grafico',pg.locator('#lista-modelos input:checked').count()==0);pg.click('#btn-todos');check('Seleccion multiple de modelos',pg.locator('#lista-modelos input:checked').count()>0);pg.check('#chk-cono');pg.wait_for_timeout(400);check('Cono de volatilidad visible',pg.evaluate("document.querySelector('#grafico').data.some(t=>/cono/i.test(t.name))"));pg.close()
 pg=page('optimizador');before=pg.locator('#det-cuerpo').inner_text();check('Optimizador muestra un punto de ejemplo inicial','MK-E-18' in before);pg.locator('#grafico').focus();pg.keyboard.press('ArrowRight');pg.keyboard.press('Enter');pg.wait_for_timeout(200);check('Seleccion del optimizador mediante teclado',pg.locator('#det-cuerpo').inner_text()!=before);pg.click('#chk-n3');pg.wait_for_timeout(300);check('Ocultar NSGA-III actualiza el grafico',pg.locator('#chk-n3').get_attribute('aria-pressed')=='false');pg.close()
 pg=page('portafolios');pg.locator('.pf-card').last.click();pg.click('#btn-trading');check('Portafolio elegido guardado',pg.evaluate("!!JSON.parse(localStorage.getItem('eia_pf'))") or pg.evaluate("!!JSON.parse(localStorage.getItem('portafolio_seleccionado'))"));storage=pg.evaluate('window.__testStorage');pg.close()
 pg=page('trading');check('Trading muestra perfil guardado',pg.locator('#pfsel').is_visible());check('Elegir perfil no ejecuta compras automaticamente',pg.evaluate('Market.orders().length')==0);pg.close()
 pg=page('backtesting');check('Backtesting conserva aviso del perfil',pg.locator('#pf-elegido').count()==1);n=pg.evaluate("document.querySelector('#graf-capital').data.filter(t=>t.y.length).length");pg.locator('#toggles button').first.click();pg.wait_for_timeout(350);m=pg.evaluate("document.querySelector('#graf-capital').data.filter(t=>t.y.length).length");check('Ocultar una serie modifica capital y drawdown',m<n,{'before':n,'after':m});check('Graficos de capital y drawdown renderizados',pg.locator('.js-plotly-plot').count()==2);pg.close()
 check('Interacciones analiticas sin excepciones JS',not errors,errors)
 ctx.close()
 ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);pg=ctx.new_page();open_local(pg,'index');pg.click('.mobile-menu');check('Menu movil visible',pg.locator('body').evaluate("e=>e.classList.contains('nav-open')"));check('Fondo inerte durante navegacion movil',pg.locator('main').evaluate('e=>e.inert'));pg.keyboard.press('Escape');check('Escape restaura interaccion movil',not pg.locator('main').evaluate('e=>e.inert'));pg.screenshot(path=str(out/'mobile-final.png'),full_page=False);ctx.close();b.close()
