"""Browser regression tests for bounded charts (actual JS/Plotly, offline transport).

Run from any directory: python tests/chart_navigation.py
The browser's HTTP navigation is blocked in the preparation environment, so the
existing harness embeds the real files and supplies fetch/localStorage transport.
No chart methods or financial calculations are mocked.
"""
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from offline_harness import open_local

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
results = []
errors = []


def check(name, ok, detail=None):
    results.append({'test': name, 'passed': bool(ok), 'detail': detail})
    (OUT/'chart-navigation.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(('PASS ' if ok else 'FAIL ') + name, flush=True)
    if not ok:
        raise AssertionError((name, detail))


def snapshot(page, selector):
    return page.eval_on_selector(selector, '''e=>{
      const v=e._eiaViewport, x=e._fullLayout.xaxis.range,y=e._fullLayout.yaxis.range;
      const points=v.visiblePoints(x),eps=1e-6;
      return {x,y,bounds:v.bounds,span:x[1]-x[0],minSpan:v.minSpan,points:points.length,
        initial:v.initial,empty:v.empty,total:v.labels.length,
        within:x[0]>=v.bounds[0]-eps&&x[1]<=v.bounds[1]+eps&&x[1]>x[0],
        fit:points.every(p=>p.lo>=y[0]-eps&&p.hi<=y[1]+eps),
        fixedY:e._fullLayout.yaxis.fixedrange,
        status:v.controls.querySelector('.chart-window-status').textContent};
    }''')


def settle(page):
    page.wait_for_timeout(200)


def drag(page, selector, dx, dy):
    page.locator(selector).scroll_into_view_if_needed()
    box = page.locator(selector+' .nsewdrag').first.bounding_box()
    x = box['x'] + box['width']*0.5
    y = box['y'] + box['height']*0.5
    page.mouse.move(x,y)
    page.mouse.down()
    page.mouse.move(x+dx,y+dy,steps=12)
    settle(page)
    held = snapshot(page,selector)
    page.mouse.up()
    settle(page)
    return held,snapshot(page,selector)


with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    specs=[('index','#market-chart',504),('trading','#trade-chart',504),('regresion','#grafico',534),('optimizador','#grafico',0),('backtesting','#graf-capital',253)]
    for name,selector,total in specs:
        page=browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda error:errors.append(str(error)))
        open_local(page,name)
        settle(page)
        initial=snapshot(page,selector)
        check(name+': bounded initial view and fitted Y',initial['within'] and initial['fit'] and initial['fixedY'] and initial['points']>0,initial)
        check(name+': complete underlying dataset loaded',initial['total']==total,initial['total'])
        held,after=drag(page,selector,-600,0)
        check(name+': drag beyond right edge stops while held',held['within'] and held['fit'] and held['points']>0,held)
        check(name+': hitting edge does not zoom',abs(after['span']-initial['span'])<1e-5,after)
        y_before=after['y']
        held,after=drag(page,selector,0,300)
        check(name+': vertical drag cannot escape observations',after['y']==y_before and held['fit'],after)
        nav=f'[data-chart-for="{selector[1:]}"]'
        page.locator(nav+' [data-nav="in"]').click()
        settle(page)
        zoom=snapshot(page,selector)
        check(name+': zoom retains a nonempty fitted view',zoom['within'] and zoom['fit'] and zoom['points']>0 and zoom['span']<initial['span'],zoom)
        held,after=drag(page,selector,320,-150)
        check(name+': diagonal drag moves X with continuous Y fit',held['within'] and held['fit'] and after['within'] and after['fit'] and after['points']>0,after)
        # The range input reaches both ends without adding future dates/empty space.
        for val,label in [('0','first'),('1000','last')]:
            page.locator(nav+' input.chart-position').evaluate('(e,value)=>{e.value=value;e.dispatchEvent(new Event("input",{bubbles:true}));}',val)
            settle(page)
            s=snapshot(page,selector)
            check(name+': navigator '+label+' edge',s['within'] and s['fit'] and s['points']>0,s)
        # API/range changes must also be clamped, not just mouse gestures.
        page.eval_on_selector(selector,"e=>Plotly.relayout(e,{'xaxis.range':[-99999,-99960],'yaxis.range':[99999,100000]})")
        settle(page)
        s=snapshot(page,selector)
        check(name+': invalid external ranges repaired',s['within'] and s['fit'] and s['points']>0,s)
        page.locator(nav+' [data-nav="reset"]').click()
        settle(page)
        check(name+': reset restores the selected initial window',snapshot(page,selector)['x']==initial['x'])
        page.locator(nav+' [data-nav="in"]').click()
        settle(page)
        # Exercise a real double-click, not just reset() called by the test.
        page.locator(selector+' .nsewdrag').first.dblclick(position={'x':70,'y':50})
        settle(page)
        check(name+': double click restores view',all(abs(a-b)<1e-5 for a,b in zip(snapshot(page,selector)['x'],initial['x'])))
        if name in ('index','trading'):
            page.click('#chart-ranges [data-range="504"]')
            settle(page)
            s=snapshot(page,selector)
            check(name+': all 504 candles reachable',s['total']==504 and abs(s['span']-504)<1e-5 and s['fit'],s)
            page.click('#chart-modes [data-mode="line"]')
            settle(page)
            check(name+': line mode preserves original closes',page.eval_on_selector(selector,"e=>e.data[0].type==='scatter'&&e.data[0].y.length===504") and snapshot(page,selector)['fit'])
            page.click('#chart-modes [data-mode="candle"]')
            page.click('#chart-ranges [data-range="60"]')
            settle(page)
            check(name+': 3M restored without data truncation',abs(snapshot(page,selector)['span']-60)<1e-5 and page.eval_on_selector(selector,'e=>e.data[0].close.length')==504)
        if name=='index':
            # Each asset has a different price scale; all must fit after switching.
            values=page.locator('#sel option').evaluate_all('(options)=>options.map(o=>o.value)')
            valid=[]
            for ticker in values:
                page.select_option('#sel',ticker)
                page.wait_for_timeout(90)
                s=snapshot(page,selector)
                valid.append((ticker,s['within'] and s['fit'] and s['points']>0))
            check('All 26 assets keep a valid view on selection',all(ok for _,ok in valid),valid)
            page.select_option('#sel','AAPL');settle(page)
            page.eval_on_selector(selector,'e=>e._eiaViewport.edge(false)');settle(page)
            actual=page.locator('#chart-summary strong').all_text_contents()
            expected=page.evaluate('''()=>{const e=document.querySelector('#market-chart'),v=e._eiaViewport,[a,b]=v.indices(),s=e.data[0];return [UI.money(s.open[a]),UI.money(Math.max(...s.high.slice(a,b+1))),UI.money(Math.min(...s.low.slice(a,b+1))),UI.num(e.data[1].y.slice(a,b+1).reduce((a,b)=>a+b,0)/1e6,2)+' M'];}''')
            check('Dashboard summaries follow the exact visible candles',actual==expected,{'actual':actual,'expected':expected})
        if name=='trading':
            page.select_option('#order-asset','NVDA');settle(page)
            check('Trading changes ticker without changing bounds coverage',snapshot(page,selector)['fit'] and page.eval_on_selector(selector,'e=>e.data[0].close.length')==504)
        if name=='regresion':
            # True forecast anchor, not an extrapolated/duplicated right-hand tail.
            check('Regression last historical close anchors forecast at index 503',page.eval_on_selector(selector,"e=>{const h=e.data.find(t=>t.name==='Historia'),m=e.data.find(t=>t.name==='Mediana del ensamble');return h.y.slice(0,504).every(v=>Number.isFinite(v))&&h.y.slice(504).every(v=>v===null)&&m.y[503]===h.y[503]&&m.y.length===534&&m.y.slice(504).every(v=>Number.isFinite(v));}"))
            page.check('#chk-cono');settle(page)
            check('Regression volatility cone included in fitted Y',snapshot(page,selector)['fit'])
            page.click('#btn-ninguno');settle(page)
            check('Regression keeps history and median with no individual model',snapshot(page,selector)['points']>0 and snapshot(page,selector)['fit'])
            page.locator(nav+' [data-nav="all"]').click();settle(page)
            check('Regression complete 504+30 window and data boundary',abs(snapshot(page,selector)['span']-534)<1e-5 and snapshot(page,selector)['fit'])
        if name=='optimizador':
            page.locator(nav+' [data-nav="reset"]').click();settle(page)
            before=page.locator('#det-cuerpo').inner_text()
            point=page.eval_on_selector(selector,"""e=>{const t=e.data[0],i=4,r=e.getBoundingClientRect(),l=e._fullLayout;return {x:r.x+l.xaxis._offset+l.xaxis.l2p(t.x[i]),y:r.y+l.yaxis._offset+l.yaxis.l2p(t.y[i])};}""")
            page.mouse.move(point['x'],point['y']);page.wait_for_timeout(180);page.mouse.click(point['x'],point['y']);settle(page)
            after=page.locator('#det-cuerpo').inner_text()
            check('Optimizer real pointer click still selects a portfolio',before!=after,after[:100])
            for toggle in ['#chk-mk','#chk-n2','#chk-n3']:page.click(toggle)
            settle(page)
            check('Optimizer all series off has explicit empty state',snapshot(page,selector)['empty'] and page.eval_on_selector(selector,"e=>e._fullLayout.annotations.some(a=>a.text.includes('No hay series'))"))
            for toggle in ['#chk-mk','#chk-n2','#chk-n3']:page.click(toggle)
            settle(page)
            check('Optimizer enabling series restores data bounds',snapshot(page,selector)['fit'] and snapshot(page,selector)['points']>0)
        if name=='backtesting':
            page.locator(nav+' [data-nav="in"]').click();settle(page)
            page.locator(nav+' [data-nav="back"]').click();settle(page)
            cap=snapshot(page,'#graf-capital');dd=snapshot(page,'#graf-dd')
            check('Backtesting capital/drawdown share exactly the same time window',cap['x']==dd['x'],{'capital':cap['x'],'drawdown':dd['x']})
            page.locator('#toggles button').first.click();settle(page)
            cap=snapshot(page,'#graf-capital');dd=snapshot(page,'#graf-dd')
            check('Backtesting filters retain synchronized window and fit',cap['x']==dd['x'] and cap['fit'] and dd['fit'] and dd['y'][1]==0)
        if name!='optimizador':
            page.locator(selector).focus();page.keyboard.press('Home');settle(page)
            at_start=snapshot(page,selector)
            page.keyboard.press('End');settle(page);at_end=snapshot(page,selector)
            page.keyboard.press('0');settle(page)
            check(name+': keyboard Home/End/reset stays inside data',abs(at_start['x'][0]-at_start['bounds'][0])<1e-5 and abs(at_end['x'][1]-at_end['bounds'][1])<1e-5 and snapshot(page,selector)['fit'])
        page.locator(selector).scroll_into_view_if_needed()
        page.screenshot(path=str(OUT/('chart-'+name+'-desktop.png')),full_page=False)
        check(name+': no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.close()
    # Touch-sized layout and a real touch gesture via Chromium DevTools Protocol.
    for name,selector,_ in specs:
        context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        open_local(page,name);settle(page)
        check(name+': mobile width without overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.locator(selector).scroll_into_view_if_needed()
        page.locator(f'[data-chart-for="{selector[1:]}"] [data-nav="in"]').click();settle(page)
        check(name+': mobile zoom remains bounded',snapshot(page,selector)['within'] and snapshot(page,selector)['fit'])
        if name=='index':
            page.locator(selector).scroll_into_view_if_needed();box=page.locator(selector+' .nsewdrag').first.bounding_box()
            x=box['x']+box['width']*.25;y=box['y']+box['height']*.5
            before=snapshot(page,selector)['x'];cdp=context.new_cdp_session(page)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            for i in range(1,9):
                cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+i*15,'y':y}]});page.wait_for_timeout(35)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});settle(page)
            now=snapshot(page,selector)
            check('Mobile horizontal touch drag navigates and fits data',now['within'] and now['fit'] and now['x']!=before,now)
        if name=='index':
            page.locator(selector).scroll_into_view_if_needed();box=page.locator(selector+' .nsewdrag').first.bounding_box()
            x=box['x']+box['width']*.5;y=box['y']+box['height']*.65
            before=page.evaluate('scrollY');cdp=context.new_cdp_session(page)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            for i in range(1,9):
                cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-i*12}]});page.wait_for_timeout(25)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});settle(page)
            check('Mobile vertical gesture scrolls the page, not the price scale',page.evaluate('scrollY')>before and snapshot(page,selector)['fit'])
        if name=='optimizador':
            page.locator(selector).scroll_into_view_if_needed()
            before=page.locator('#det-cuerpo').inner_text()
            point=page.eval_on_selector(selector,"e=>{const t=e.data[0],i=18,r=e.getBoundingClientRect(),l=e._fullLayout;return {x:r.x+l.xaxis._offset+l.xaxis.l2p(t.x[i]),y:r.y+l.yaxis._offset+l.yaxis.l2p(t.y[i])};}")
            cdp=context.new_cdp_session(page)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]})
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});settle(page)
            check('Optimizer touch tap still selects a portfolio',before!=page.locator('#det-cuerpo').inner_text())
        page.screenshot(path=str(OUT/('chart-'+name+'-mobile.png')),full_page=False)
        context.close()
    check('No JavaScript exceptions in chart interactions',not errors,errors)
    browser.close()
print(f'COMPLETE: {len(results)} checks passed.',flush=True)
