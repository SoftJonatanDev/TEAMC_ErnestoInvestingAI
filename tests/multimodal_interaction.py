"""Connected gesture callbacks, emergency controls and contextual text.
Landmarks are represented by deterministic geometric features, not webcam video.
"""
import json
import os
import shutil
from playwright.sync_api import sync_playwright
from multimodal_harness import open_workspace, ROOT
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True);results=[]
def check(name, condition, detail=None):
    results.append({'test':name,'passed':bool(condition),'detail':detail})
    (OUT/'multimodal-interaction.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(('PASS ' if condition else 'FAIL ')+name,flush=True)
    assert condition,(name,detail)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox'])
    p=b.new_page(viewport={'width':1440,'height':1000});app=open_workspace(p)
    p.locator('#mm-panel-close').click()
    p.evaluate(r'''()=>{
      window.__gesturePoint=(point,t,shape='point',thumbValue=1,separation=.4)=>{
        const prefs=EIAMultimodal.prefs,b=prefs.bounds;
        let x=b.left+point.x/innerWidth*(b.right-b.left);if(prefs.mirror)x=1-x;
        const y=b.top+point.y/innerHeight*(b.bottom-b.top);
        EIAMultimodal.engine.step({shape,thumbState:thumbValue<.3?'closed':'open',separation,index:{x,y},mid:{x,y}},t,{width:innerWidth,height:innerHeight});
      };
      const doc=document.getElementById('mm-app').contentDocument;
      const btn=doc.createElement('button');btn.id='contract-button';btn.textContent='Boton de prueba';btn.style='position:fixed;left:500px;top:160px;width:160px;height:60px;z-index:99999';btn.onclick=()=>window.__contractClicks=(window.__contractClicks||0)+1;doc.body.append(btn);
      EIAMultimodal.engine.reset();const point={x:580,y:190};for(const t of [1000,1200])__gesturePoint(point,t);__gesturePoint(point,1300,'point',.2);__gesturePoint(point,1380,'point',.2);__gesturePoint(point,1500,'point',.6);__gesturePoint(point,1580,'point',.6);
    }''')
    check('Complete thumb-to-palm cycle clicks an actual application button once',p.evaluate('window.__contractClicks===1'))
    p.evaluate(r'''()=>{const point={x:580,y:190};__gesturePoint(point,2200);__gesturePoint(point,2300,'point',.2);__gesturePoint(point,2380,'point',.2);EIAMultimodal.engine.step(null,2700);__gesturePoint(point,2800);__gesturePoint(point,3000);}''')
    check('Losing the tracked hand cancels a pending application click',p.evaluate('window.__contractClicks===1'))
    p.evaluate('document.getElementById("mm-app").contentDocument.getElementById("contract-button").remove()')
    p.wait_for_function("()=>document.getElementById('mm-app').contentDocument.getElementById('market-chart')?._eiaViewport && !document.getElementById('mm-app').contentDocument.getElementById('market-chart')._eiaViewport.rendering")
    before=p.evaluate(r'''()=>{const d=document.getElementById('mm-app').contentDocument;d.documentElement.style.scrollBehavior='auto';const e=d.querySelector('#market-chart');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.querySelector('.nsewdrag').getBoundingClientRect();window.__chartPoint={x:r.x+r.width*.5,y:r.y+r.height*.45};return e._eiaViewport.range.slice();}''')
    p.evaluate(r'''()=>{EIAMultimodal.engine.reset();const p=__chartPoint;__gesturePoint(p,4000);__gesturePoint(p,4200);__gesturePoint(p,4300,'two',1,.4);__gesturePoint(p,4420,'two',1,.4);__gesturePoint(p,4500,'two',1,.5);__gesturePoint(p,4600,'two',1,.6);__gesturePoint(p,4700,'two',1,.7);}''')
    p.wait_for_timeout(200)
    after=p.evaluate("document.getElementById('mm-app').contentDocument.querySelector('#market-chart')._eiaViewport.range")
    check('Index-middle separation reaches real chart zoom through the gesture engine',after[1]-after[0]<before[1]-before[0],{'before':before,'after':after})
    p.evaluate(r'''()=>{const p=__chartPoint;__gesturePoint(p,4800,'two',1,.6);__gesturePoint(p,4900,'two',1,.5);}''');p.wait_for_timeout(200)
    out=p.evaluate("document.getElementById('mm-app').contentDocument.querySelector('#market-chart')._eiaViewport.range")
    check('Closing the same index-middle pair zooms out',out[1]-out[0]>after[1]-after[0])
    # Reader contract over the exact visible graph and field state.
    desc=p.evaluate("EIAReader.chartText(document.getElementById('mm-app').contentDocument.querySelector('#market-chart'))")
    check('Chart narration reflects currently selected visible period', 'Tramo visible:' in desc and 'primer cierre' in desc and 'sint\u00e9tic' in desc)
    p.evaluate(r'''()=>{const d=document.getElementById('mm-app').contentDocument,i=d.createElement('input');i.type='password';i.value='NO-DEBE-LEERSE';i.id='test-private';d.body.append(i);}''')
    secret=p.evaluate("EIAReader.elementText(document.getElementById('mm-app').contentDocument.getElementById('test-private'))")
    check('Private password text is excluded from contextual narration','NO-DEBE-LEERSE' not in secret and 'privado' in secret)
    # Dwell invokes reading but cannot click. No actual synthesis is installed or used.
    p.evaluate(r'''()=>{
      const d=document.getElementById('mm-app').contentDocument,el=d.createElement('button');el.id='dwell-test';el.textContent='Lectura contextual verificable';el.style='position:fixed;left:500px;top:160px;width:260px;height:60px;z-index:99999';el.onclick=()=>window.__dwellClicked=true;d.body.append(el);
      EIAMultimodal.reader.enabled=true;EIAMultimodal.prefs.hoverRead=true;
      window.__realSpeak=EIAMultimodal.reader.speak;window.__spoken=[];
      EIAMultimodal.reader.speak=(text)=>__spoken.push(text);
      EIAMultimodal.engine.reset();const point={x:630,y:190};for(const t of [6000,6200,6800,7500,8250])__gesturePoint(point,t);
    }''')
    check('Two-second stable pointing reads actual component text',p.evaluate("__spoken.length===1 && __spoken[0].includes('Lectura contextual verificable')"))
    check('Point-to-read never executes the pointed control',p.evaluate('!window.__dwellClicked'))
    p.evaluate(r'''()=>{EIAMultimodal.reader.speak=__realSpeak;EIAMultimodal.prefs.hoverRead=false;document.getElementById('mm-app').contentDocument.getElementById('dwell-test').remove();EIAMultimodal.reader.enable(false);}''')
    p.evaluate(r'''()=>{window.__stops=0;window.__realStop=EIAMultimodal.camera.stop.bind(EIAMultimodal.camera);EIAMultimodal.camera.stop=()=>{__stops++;__realStop();};EIAMultimodal.reader.enable(true);const r=document.getElementById('mm-emergency').getBoundingClientRect();EIAMultimodal.bridge.click({x:r.x+r.width/2,y:r.y+r.height/2});}''')
    check('Emergency shutdown needs only one virtual click',p.evaluate('__stops===1&&!EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="off"'))
    p.evaluate(r'''()=>{EIAMultimodal.camera.stop=__realStop;EIAMultimodal.engine.paused=false;EIAMultimodal.reader.enable(true);document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}''')
    check('Escape cancels narration without enabling camera',p.evaluate('EIAMultimodal.reader.state==="ready"&&EIAMultimodal.camera.state==="off"'))
    p.evaluate("__testNavigate('backtesting.html')")
    p.wait_for_function("EIAMultimodal.ready&&!!document.getElementById('mm-app').contentDocument.getElementById('graf-dd')?.data")
    dd=p.evaluate("EIAReader.chartText(document.getElementById('mm-app').contentDocument.getElementById('graf-dd'))")
    check('Drawdown narration identifies percentage units','por ciento' in dd)
    p.evaluate(r'''()=>{window.__hiddenStops=0;const stop=EIAMultimodal.camera.stop.bind(EIAMultimodal.camera);EIAMultimodal.camera.stop=()=>{__hiddenStops++;stop();};Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}''')
    check('Hiding the host triggers camera cleanup and reading cancellation',p.evaluate('__hiddenStops===1&&EIAMultimodal.camera.state==="off"&&EIAMultimodal.reader.queue.length===0'))
    b.close()
print('Connected interaction checks:',len(results))
