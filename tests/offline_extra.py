import os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from offline_harness import open_local
import json
results=[]; (Path(__file__).resolve().parents[1]/'test-results').mkdir(exist_ok=True);out=(Path(__file__).resolve().parents[1]/'test-results')
def check(name,ok,detail=None):
 results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,detail or '',flush=True);(out/'extra.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1440,'height':1000});pg=ctx.new_page();open_local(pg,'trading');pg.evaluate('if(Market.state().enabled)Market.toggle()')
 vals=pg.evaluate('''async()=>{const q=Market.quote('NVDA');const pending=await Market.placeOrder({ticker:'NVDA',side:'V',qty:60,type:'limit',limit:q.ask*2});const reserved=Market.available().shares('NVDA');let rejected=false;try{await Market.placeOrder({ticker:'NVDA',side:'V',qty:1,type:'market'});}catch{rejected=true;}await Market.cancelOrder(pending.id);return {reserved,rejected,released:Market.available().shares('NVDA')};}''')
 check('Orden limite de venta reserva acciones',vals['reserved']==0)
 check('No se pueden vender dos veces acciones reservadas',vals['rejected'])
 check('Cancelar venta libera acciones',vals['released']==60)
 pg.evaluate('Market.reset()');pg.wait_for_function('Market.orders().length===0');pg.fill('#order-qty','0');pg.click('#review-order');check('Cantidad cero rechazada',bool(pg.locator('#order-error').inner_text()))
 pg.evaluate("Market.reset(true)");check('Restablecer cuenta recupera efectivo original',pg.evaluate('Market.portfolio().cash')==25000)
 check('Restablecer borra historial',pg.evaluate('Market.orders().length')==0)
 ctx.close()
 for w,name in [(320,'index'),(320,'trading'),(768,'regresion'),(1024,'optimizador')]:
  ctx=b.new_context(viewport={'width':w,'height':900});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));open_local(pg,name);width=pg.evaluate('document.documentElement.scrollWidth');check(f'{name} sin desborde a {w}px',width<=w+2,{'width':width});check(f'{name} sin excepciones a {w}px',not errs,errs);ctx.close()
 ctx=b.new_context(viewport={'width':1440,'height':1000});pg=ctx.new_page();open_local(pg,'index');pg.screenshot(path=str(out/'dashboard-final.png'),full_page=True);ctx.close();b.close()
