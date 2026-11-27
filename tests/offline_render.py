import os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from offline_harness import open_local
import json,sys
out=(Path(__file__).resolve().parents[1]/'test-results');out.mkdir(exist_ok=True)
names=['index','watchlist','trading','leaderboard','clasificacion','regresion','optimizador','portafolios','backtesting','perfil','configuracion','ayuda','acerca']
if len(sys.argv)>2: names=sys.argv[2].split(',')
results=[]; (Path(__file__).resolve().parents[1]/'test-results').mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for viewport,w,h in [('mobile',390,844)] if len(sys.argv)>1 and sys.argv[1]=='mobile' else [('desktop',1440,1000)]:
  context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=viewport=='mobile',has_touch=viewport=='mobile')
  storage={}
  for name in names:
   page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
   try:
    open_local(page,name,storage)
    info=page.evaluate('''() => ({ready:document.body.classList.contains('app-ready'),title:document.querySelector('h1')?.textContent,wide:document.documentElement.scrollWidth>innerWidth+2,plots:document.querySelectorAll('.js-plotly-plot').length,bodyWidth:document.documentElement.scrollWidth,errors:[...document.querySelectorAll('.load-error,.error,.err')].filter(e=>e.textContent.trim()).map(e=>e.textContent.slice(0,250)),overflow:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2&&e.getBoundingClientRect().width>0&&!e.closest('.table-scroll,.tw,.hm,.envoltura')).slice(0,5).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',id:e.id,right:e.getBoundingClientRect().right}))})''')
    page.screenshot(path=str(out/(name+'-'+viewport+'.png')),full_page=True)
    storage=page.evaluate('window.__testStorage')
   except Exception as e: info={'failure':str(e)}
   results.append({'page':name,'viewport':viewport,**info,'console':errors.copy()});print(viewport,name,info,'CONSOLE',errors[:3],flush=True);page.close();(out/('batch-'+viewport+'-'+names[0]+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2))
  context.close()
 browser.close()
(out/'initial.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
