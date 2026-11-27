"""Offline transport for a browser whose administrator policy blocks all URLs.
App HTML/CSS/JS and financial data are real. Only HTTP, navigation and storage
transport are supplied by this harness. Camera/voice device stubs are opt-in.
"""
import json
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]


def html_source(name, app=False):
    soup=BeautifulSoup((ROOT/name).read_text(encoding='utf-8'),'html.parser')
    for tag in soup.find_all('link',rel='stylesheet'):
        style=soup.new_tag('style')
        style.string=(ROOT/tag['href']).read_text(encoding='utf-8')
        tag.replace_with(style)
    for tag in soup.find_all('link'):
        tag.decompose()
    for tag in soup.find_all('script',src=True):
        script="(0,eval)(parent.__plotlySource);" if app and tag['src']=='vendor/plotly.min.js' else (ROOT/tag['src']).read_text(encoding='utf-8')
        del tag['src']
        tag.string=script.replace('</script','<\\/script')
    if app:
        shim=soup.new_tag('script')
        shim.string=r'''
          Object.defineProperty(window,'localStorage',{configurable:true,value:parent.localStorage});
          window.fetch=parent.__fixtureFetch;
          document.addEventListener('click',e=>{
            const a=e.target.closest('a[href]');if(!a||a.getAttribute('href').startsWith('#')||a.hasAttribute('download'))return;
            const href=a.getAttribute('href');if(/^[a-z_]+\.html(?:[?#]|$)/i.test(href)){e.preventDefault();parent.__testNavigate(href);}
          },true);
        '''
        soup.head.insert(0,shim)
    return str(soup)


def open_workspace(page,initial='index.html',storage=None):
    host=BeautifulSoup(html_source('interaccion.html'),'html.parser')
    scripts=[]
    for tag in host.find_all('script'):
        scripts.append(tag.string or '')
        tag.decompose()
    page.set_content(str(host),wait_until='domcontentloaded')
    fixtures={str(p.relative_to(ROOT)):p.read_text(encoding='utf-8') for folder in ['data','locales'] for p in (ROOT/folder).glob('*.json')}
    fixtures['vendor/mediapipe/sources.json']=(ROOT/'vendor/mediapipe/sources.json').read_text()
    pages={p.name:html_source(p.name,app=True) for p in ROOT.glob('*.html') if p.name!='interaccion.html'}
    page.evaluate(r'''({fixtures,pages,initial,storage,plotly})=>{
      window.__plotlySource=plotly;
      const values={...storage};const local={getItem:k=>Object.hasOwn(values,k)?values[k]:null,setItem:(k,v)=>values[k]=String(v),removeItem:k=>delete values[k],clear:()=>Object.keys(values).forEach(k=>delete values[k]),key:i=>Object.keys(values)[i]||null,get length(){return Object.keys(values).length;}};
      Object.defineProperty(window,'localStorage',{configurable:true,value:local});window.__testStorage=values;
      window.__fixtureFetch=async path=>{const key=String(path).replace(/^\.\//,'');return new Response(fixtures[key]||'Not found',{status:key in fixtures?200:404,headers:{'Content-Type':'application/json'}});};window.fetch=window.__fixtureFetch;
      const frame=document.getElementById('mm-app');let first=true;
      window.__testNavigate=(value)=>{const key=String(first?initial:value).split(/[?#]/)[0].split('/').pop();first=false;window.__testCurrentPage=key;if(!pages[key])throw new Error('Missing page fixture: '+key);frame.srcdoc=pages[key];};
      Object.defineProperty(frame,'src',{configurable:true,get:()=>window.__testCurrentPage||initial,set:window.__testNavigate});
    }''',{'fixtures':fixtures,'pages':pages,'initial':initial,'storage':storage or {},'plotly':(ROOT/'vendor/plotly.min.js').read_text()})
    for script in scripts:
        # add_script_tag has no HTML parsing, so undo inline-safe closing tag escapes.
        page.add_script_tag(content=script.replace('<\\/script','</script'))
    page.wait_for_function('window.EIAMultimodal?.ready===true',timeout=25000)
    page.wait_for_timeout(500)
    return page.frame_locator('#mm-app')
