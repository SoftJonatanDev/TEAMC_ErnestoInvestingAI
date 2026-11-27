"""Browser integration with actual app sources; transport is supplied offline.
Synthetic landmark streams test gesture actions. This is NOT real-camera validation.
Speech tests use a deterministic OS-voice substitute; audio is not audited.
"""
import json
import os
import shutil
import sys
import time
import hashlib
import zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from multimodal_harness import open_workspace, ROOT
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
results=[];errors=[]
start=time.monotonic()
flows_only="--flows-only" in sys.argv
report_name="multimodal-flows-browser.json" if flows_only else "multimodal-browser.json"

def check(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail})
    (OUT/report_name).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(('PASS ' if ok else 'FAIL ')+name+' ['+str(round(time.monotonic()-start,1))+'s]',flush=True)
    if not ok:raise AssertionError((name,detail))

def goto(page,name):
    page.evaluate('(name)=>__testNavigate(name)',name+'.html')
    page.wait_for_function('(name)=>document.getElementById("mm-app").contentDocument.body?.dataset.page===name && window.EIAMultimodal.ready',arg=name if name!='index' else 'dashboard',timeout=20000)
    page.wait_for_timeout(450)

def pt(page,selector):
    return page.evaluate('''sel=>{const doc=document.getElementById('mm-app').contentDocument,e=doc.querySelector(sel);doc.documentElement.style.scrollBehavior='auto';if(!e)throw new Error('Missing '+sel);const r=e.getBoundingClientRect();if(r.top<80||r.bottom>innerHeight-90){doc.scrollingElement.scrollTop+=r.top-150;}const q=e.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2};}''',selector)

def bridgeclick(page,selector):
    point=pt(page,selector);page.evaluate('p=>EIAMultimodal.bridge.click(p)',point)

def graph_setup(page,selector):
    page.wait_for_function("sel=>{const e=document.getElementById('mm-app').contentDocument.querySelector(sel);return !!e?._eiaViewport && !e._eiaViewport.rendering && !!e.querySelector('.nsewdrag');}",arg=selector,timeout=20000)
    point=pt(page,selector+' .nsewdrag')
    page.evaluate('p=>EIAMultimodal.bridge.begin(p)',point)
    return point

def snapshot(page,selector):
    return page.evaluate('''sel=>{const e=document.getElementById('mm-app').contentDocument.querySelector(sel),v=e._eiaViewport,x=v.range,y=e._fullLayout.yaxis.range,p=v.visiblePoints(x);return {x,y,bounds:v.bounds,width:x[1]-x[0],min:v.minSpan,points:p.length,within:x[0]>=v.bounds[0]-1e-6&&x[1]<=v.bounds[1]+1e-6,fit:p.every(p=>p.lo>=y[0]-1e-6&&p.hi<=y[1]+1e-6),fixedY:e._fullLayout.yaxis.fixedrange,total:v.labels.length,series:e.data.map(t=>[t.x?.length,t.y?.length,t.close?.length])};}''',selector)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:errors.append(str(e)))
    app=open_workspace(page)
    check('Workspace starts with camera and voice OFF',page.evaluate("EIAMultimodal.camera.state==='off'&&!EIAMultimodal.reader.enabled&&!EIAMultimodal.camera.stream"))
    check('No nested launcher inside persistent application',app.locator('.mm-launcher').count()==0)
    page.locator('#mm-read-summary').click()
    text=page.locator('#mm-transcript').inner_text()
    check('Summary uses actual account and current module', 'Panorama de mercado' in text and 'Valor de tu cuenta virtual' in text,text[:500])
    check('Preparing text does not auto-enable speech',page.evaluate('!EIAMultimodal.reader.enabled'))
    page.locator('#mm-read-chart').click()
    check('Chart description includes synthetic nature and visible period','sintéticos' in page.locator('#mm-transcript').inner_text() and '60 puntos' in page.locator('#mm-transcript').inner_text())
    page.screenshot(path=str(OUT/'multimodal-desktop.png'))
    page.locator('#mm-panel-close').click()
    for name,selector,total in ([] if flows_only else [('index','#market-chart',504),('trading','#trade-chart',504),('regresion','#grafico',534),('optimizador','#grafico',0),('backtesting','#graf-capital',253)]):
        goto(page,name)
        point=graph_setup(page,selector);before=snapshot(page,selector)
        check(name+': complete chart series still present',before['total']==total,before['series'])
        page.evaluate('p=>EIAMultimodal.bridge.zoom(.45,p)',point);page.wait_for_timeout(200)
        zoom=snapshot(page,selector)
        check(name+': gesture zoom narrows view with bounded X and fitted Y',zoom['within'] and zoom['fit'] and zoom['fixedY'] and zoom['width']<before['width'],zoom)
        page.evaluate('p=>EIAMultimodal.bridge.pan({x:90000,y:90000},p)',point);page.wait_for_timeout(200)
        left=snapshot(page,selector)
        check(name+': excessive gesture pan cannot create empty axes',left['within'] and left['fit'] and left['points']>0 and abs(left['width']-zoom['width'])<1e-6,left)
        page.evaluate('p=>EIAMultimodal.bridge.pan({x:-190000,y:-190000},p)',point);page.wait_for_timeout(200)
        right=snapshot(page,selector)
        check(name+': reverse pan also respects bounds',right['within'] and right['fit'] and right['points']>0,right)
        page.evaluate('p=>EIAMultimodal.bridge.zoom(10000,p)',point);page.wait_for_timeout(250)
        out=snapshot(page,selector)
        check(name+': maximum zoom-out cannot exceed data range',out['within'] and abs(out['width']-(out['bounds'][1]-out['bounds'][0]))<1e-5 and out['fit'],out)
        page.evaluate('p=>EIAMultimodal.bridge.zoom(.000001,p)',point);page.wait_for_timeout(250)
        small=snapshot(page,selector)
        check(name+': maximum zoom-in enforces minimum span',small['width']>=small['min']-1e-6 and small['points']>0 and small['fit'],small)
        check(name+': gesture navigation never changes series length',small['series']==before['series'])
        if name=='backtesting':
            synced=page.evaluate("()=>{const d=document.getElementById('mm-app').contentDocument;return [...d.querySelectorAll('.js-plotly-plot')].filter(e=>e._eiaViewport?.options.group).map(e=>({id:e.id,x:e._eiaViewport.range}));}")
            check('Backtesting group remains synchronized under gesture zoom',len(synced)>=2 and synced[0]['x']==synced[1]['x'],synced)
    # Physical and virtual selection both use original change events.
    goto(page,'index');page.evaluate('()=>document.getElementById("mm-app").contentWindow.Market.toggle(false)')
    bridgeclick(page,'#sel')
    check('Gesture on native select opens accessible choice panel',page.locator('#mm-popup').is_visible())
    options=page.locator('#mm-popup [data-option]');count=options.count()
    msft=page.locator('#mm-popup [data-option]').filter(has_text='MSFT').first
    msft.click();page.wait_for_timeout(300)
    check('Choice panel changes real asset selector',app.locator('#sel').input_value()=='MSFT',count)
    bridgeclick(page,'#asset-filter')
    check('Gesture on text field opens virtual keyboard',page.locator('#mm-edit-buffer').is_visible())
    page.locator('[data-edit="clear"]').click()
    for key in 'nvda':page.locator('[data-key="'+key+'"]').click()
    page.locator('[data-edit="apply"]').click();page.wait_for_timeout(100)
    check('Virtual keyboard filters actual market rows',app.locator('#asset-filter').input_value()=='nvda' and app.locator('#market-table tr').count()==1)
    check('Only matching asset remains after virtual input','NVDA' in app.locator('#market-table').inner_text())
    # Two explicit pinches retain the existing order review and validations.
    goto(page,'trading')
    page.evaluate('()=>{const w=document.getElementById("mm-app").contentWindow;if(w.Market.state().enabled)w.Market.toggle();}')
    app.locator('#order-qty').fill('2');app.locator('#review-order').click()
    check('Original trading review still opens',app.locator('[data-confirm-order]').count()==1)
    before=page.evaluate('document.getElementById("mm-app").contentWindow.Market.orders().length')
    bridgeclick(page,'[data-confirm-order]');page.wait_for_timeout(100)
    check('First confirmation gesture is guarded, not executed',page.evaluate('document.getElementById("mm-app").contentWindow.Market.orders().length')==before)
    bridgeclick(page,'[data-confirm-order]');page.wait_for_timeout(600)
    check('Second explicit gesture executes one validated simulated order',page.evaluate('document.getElementById("mm-app").contentWindow.Market.orders().length')==before+1)
    # Every original module loads in the persistent camera/voice host.
    host_id=page.evaluate('()=>{window.__hostReference=EIAMultimodal.camera;return true;}')
    for name in ['watchlist','leaderboard','clasificacion','portafolios','perfil','configuracion','ayuda','acerca']:
        goto(page,name)
        check(name+': loads with persistent camera instance',page.evaluate('window.__hostReference===EIAMultimodal.camera'))
        text=page.evaluate('EIAReader.summary(document.getElementById("mm-app").contentDocument)')
        check(name+': contextual text is available',len(text)>60,text[:180])
    check('No JavaScript exceptions in desktop integration',not errors,errors)
    page.close()
    # Mobile layout and light theme.
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    open_workspace(mobile)
    check('Mobile host has no horizontal overflow',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('Assistant fits the mobile viewport',mobile.locator('#mm-panel').bounding_box()['width']<=390)
    mobile.screenshot(path=str(OUT/'multimodal-mobile.png'))
    mobile.locator('#mm-tab-guide').click();check('Gesture guide is available on mobile',mobile.locator('#mm-guide-panel').is_visible())
    mobile.locator('#mm-panel-close').click();check('Dock remains available when assistant is minimized',mobile.locator('#mm-dock').is_visible())
    mobile.evaluate("document.getElementById('mm-app').contentDocument.documentElement.dataset.theme='light'")
    mobile.wait_for_timeout(100);check('Host follows application light theme',mobile.evaluate("document.documentElement.dataset.theme==='light'"))
    mobile.close();browser.close()
print('Browser checks:',len(results),'passed:',sum(r['passed'] for r in results),flush=True)
