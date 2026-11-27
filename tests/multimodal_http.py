"""HTTP resource check using standard-library client, not browser camera/audio QA."""
import json
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
(ROOT/'test-results').mkdir(exist_ok=True)
log=ROOT/'test-results/multimodal-http.log'
with log.open('w') as out:
    process=subprocess.Popen([sys.executable,str(ROOT/'iniciar.py'),'--port',str(port),'--multimodal','--no-browser'],stdout=out,stderr=out)
    try:
        base=f'http://127.0.0.1:{port}/'
        for attempt in range(40):
            try:
                urllib.request.urlopen(base,timeout=1).close();break
            except (OSError,urllib.error.URLError):time.sleep(.1)
        records=[]
        paths=['interaccion.html','css/multimodal.css','js/multimodal/launcher.js','js/multimodal/gesture-engine.js','js/multimodal/host.js','js/multimodal/reader.js','js/multimodal/input-bridge.js','js/multimodal/camera.js','js/multimodal/hand-worker.js','vendor/mediapipe/sources.json']
        for path in paths:
            with urllib.request.urlopen(base+path,timeout=3) as res:
                body=res.read();ok=res.status==200 and body==(ROOT/path).read_bytes()
                records.append({'test':path+' HTTP bytes match delivered file','passed':ok,'content_type':res.headers.get('Content-Type')})
                assert ok,path
                print('PASS '+path)
        (ROOT/'test-results/multimodal-http.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
    finally:
        process.terminate();process.wait(timeout=5)
