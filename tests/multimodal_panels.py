"""Independent camera/voice panels and launchers; device lifecycle uses explicit doubles.
No camera images, live inference or audible speech are used by this test.
"""
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from multimodal_harness import open_workspace, ROOT
from offline_harness import open_local
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
results=[];errors=[]
def check(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail})
    (OUT/'multimodal-panels.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    assert ok,(name,detail)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    p=browser.new_page(viewport={'width':1440,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)))
    open_workspace(p)
    check('Voice and camera start OFF',p.evaluate('!EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="off"'))
    check('Two independent named tool regions exist',p.locator('aside.mm-panel').count()==2)
    check('There is no shared tab strip or tab panel',p.locator('[role="tab"],[role="tablist"],[role="tabpanel"]').count()==0)
    check('Voice region contains no camera activation',p.locator('#mm-panel #mm-camera-enable').count()==0)
    check('Camera region contains no voice activation',p.locator('#mm-camera-window #mm-voice-enable').count()==0)
    check('Dock buttons target different panels',p.locator('#mm-open').get_attribute('aria-controls')=='mm-panel' and p.locator('#mm-camera-dock').get_attribute('aria-controls')=='mm-camera-window')
    check('Default voice panel is visible without requesting audio',p.locator('#mm-panel').is_visible() and not p.locator('#mm-camera-window').is_visible())
    p.locator('#mm-camera-dock').click()
    check('Desktop can show both panels at the same time',p.locator('#mm-panel').is_visible() and p.locator('#mm-camera-window').is_visible())
    a=p.locator('#mm-panel').bounding_box();c=p.locator('#mm-camera-window').bounding_box()
    check('Desktop panels do not overlap',c['x']+c['width']<a['x'])
    check('Opening camera settings does not enable the camera',p.evaluate('EIAMultimodal.camera.state==="off"&&!EIAMultimodal.reader.enabled'))
    p.screenshot(path=str(OUT/'paneles-separados-escritorio.png'))
    p.locator('#mm-panel-close').click()
    check('Closing voice leaves camera settings open',not p.locator('#mm-panel').is_visible() and p.locator('#mm-camera-window').is_visible())
    check('Voice close restores focus to its own launcher',p.evaluate('document.activeElement.id==="mm-open"'))
    p.locator('#mm-camera-close').click()
    check('Camera close restores focus to its own launcher',p.evaluate('document.activeElement.id==="mm-camera-dock"'))
    check('Both tools can be minimized while dock remains usable',not p.locator('#mm-panel').is_visible() and not p.locator('#mm-camera-window').is_visible() and p.locator('#mm-dock').is_visible())
    p.keyboard.press('Alt+Shift+c')
    check('Camera keyboard shortcut opens ONLY camera settings',p.locator('#mm-camera-window').is_visible() and not p.locator('#mm-panel').is_visible() and p.evaluate('EIAMultimodal.camera.state==="off"'))
    p.keyboard.press('Alt+Shift+a')
    check('Voice keyboard shortcut opens voice settings independently',p.locator('#mm-panel').is_visible() and p.locator('#mm-camera-window').is_visible())
    # Explicit doubles below validate UI independence, not hardware capabilities.
    p.evaluate('''()=>{
      window.__starts=0;window.__stops=0;window.__narrations=[];
      const c=EIAMultimodal.camera;const stop=c.stop.bind(c);
      c.start=async()=>{__starts++;c.status('on','Camera test double, no capture');};
      c.stop=()=>{__stops++;stop();};
      EIAMultimodal.reader.speak=t=>__narrations.push(t);
    }''')
    p.locator('#mm-camera-enable').click()
    check('Camera activation does not enable voice (device double)',p.evaluate('__starts===1&&EIAMultimodal.camera.state==="on"&&!EIAMultimodal.reader.enabled'))
    p.locator('#mm-camera-close').click()
    check('Minimizing camera keeps its active state (device double)',p.evaluate('EIAMultimodal.camera.state==="on"&&__stops===0'))
    p.locator('#mm-voice-enable').click()
    check('Voice activation does not restart or stop camera (device doubles)',p.evaluate('EIAMultimodal.reader.enabled&&__starts===1&&__stops===0'))
    p.locator('#mm-panel-close').click()
    check('Minimizing voice preserves both activated modes (device doubles)',p.evaluate('EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="on"'))
    p.locator('#mm-open').click();p.locator('#mm-voice-enable').click()
    check('Disabling voice leaves camera on (device doubles)',p.evaluate('!EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="on"&&__stops===0'))
    p.locator('#mm-voice-enable').click();p.locator('#mm-camera-dock').click();p.locator('#mm-camera-enable').click()
    check('Disabling camera leaves voice enabled (device doubles)',p.evaluate('EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="off"&&__stops===1'))
    p.locator('#mm-camera-enable').click()
    p.set_viewport_size({'width':390,'height':844})
    check('Compact layout displays only the last opened panel',p.locator('#mm-camera-window').is_visible() and not p.locator('#mm-panel').is_visible())
    p.locator('#mm-open').click()
    check('Mobile voice button shows its separate panel',p.locator('#mm-panel').is_visible() and not p.locator('#mm-camera-window').is_visible())
    check('Switching mobile panels does not change device activation (doubles)',p.evaluate('EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="on"&&__starts===2&&__stops===1'))
    p.locator('#mm-camera-dock').click()
    check('Mobile camera button shows only camera settings',p.locator('#mm-camera-window').is_visible() and not p.locator('#mm-panel').is_visible())
    p.locator('#mm-guide-panel summary').click()
    check('Gesture guide belongs to camera, not voice',p.locator('#mm-camera-window #mm-guide-panel[open]').count()==1 and p.locator('#mm-panel #mm-guide-panel').count()==0)
    text=p.locator('#mm-guide-panel').inner_text()
    check('Guide teaches thumb to palm, not fingertip pinch','palma' in text and 'pulgar' in text and 'pinza corta' not in text)
    check('Guide preserves same-hand index-middle zoom', 'mismos dos dedos' in text and 'sin el pulgar' in text)
    check('Mobile host has no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('Mobile tool fits viewport',p.locator('#mm-camera-window').bounding_box()['width']<=390)
    p.locator('#mm-emergency').click()
    check('Emergency stop still disables both modes together',p.evaluate('!EIAMultimodal.reader.enabled&&EIAMultimodal.camera.state==="off"'))
    p.locator('#mm-guide-panel summary').click()
    p.evaluate("document.querySelector('#mm-camera-window .mm-panel-body').scrollTop=0")
    p.screenshot(path=str(OUT/'paneles-separados-movil.png'))
    p.locator('#mm-camera-close').click();p.locator('#mm-open').click()
    p.screenshot(path=str(OUT/'asistente-voz-movil.png'))
    p.evaluate("document.getElementById('mm-app').contentDocument.documentElement.dataset.theme='light'")
    p.wait_for_timeout(100)
    check('Independent panels retain light-theme synchronization',p.evaluate("document.documentElement.dataset.theme==='light'"))
    check('No JavaScript exceptions in panel workflows',not errors,errors)
    p.close()
    for name,width,height in [('index',1440,1000),('trading',390,844)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        open_local(page,name)
        check(name+': ordinary page has TWO independent tool entry points',page.locator('.mm-launchers .mm-launcher').count()==2)
        check(name+': separate voice and camera launcher identities',page.locator('.mm-launcher[data-tool="voice"]').count()==1 and page.locator('.mm-launcher[data-tool="camera"]').count()==1)
        check(name+': ordinary page has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.close()
    browser.close()
print('Panel checks:',len(results),'passed:',sum(r['passed'] for r in results))
