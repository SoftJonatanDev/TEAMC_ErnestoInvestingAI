from pathlib import Path
import json
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
FIXTURES={str(p.relative_to(ROOT)):p.read_text() for folder in ['data','locales'] for p in (ROOT/folder).glob('*.json')}

def open_local(page,name,storage=None):
    """Render actual project sources offline; browser policy blocks all URL navigation.
    Only browser storage/fetch transport are supplied by the harness. App code is unmodified.
    """
    soup=BeautifulSoup((ROOT/(name+'.html')).read_text(),'html.parser')
    scripts=[]
    for tag in soup.find_all('script'):
        scripts.append((ROOT/tag['src']).read_text() if tag.has_attr('src') else tag.string or '')
        tag.decompose()
    for tag in soup.find_all('link',rel='stylesheet'):
        style=soup.new_tag('style');style.string=(ROOT/tag['href']).read_text();tag.replace_with(style)
    for tag in soup.find_all('link'):tag.decompose()
    page.set_content(str(soup),wait_until='domcontentloaded')
    page.evaluate(r'''({fixtures,initial})=>{
      const data={...initial};
      const local={getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,setItem:(k,v)=>{data[k]=String(v);},removeItem:k=>{delete data[k];},clear:()=>Object.keys(data).forEach(k=>delete data[k]),key:i=>Object.keys(data)[i]||null,get length(){return Object.keys(data).length;}};
      Object.defineProperty(window,'localStorage',{configurable:true,value:local});window.__testStorage=data;
      window.fetch=async input=>{const key=String(input).replace(/^\.\//,'');if(!(key in fixtures))return new Response('Missing fixture '+key,{status:404});return new Response(fixtures[key],{status:200,headers:{'Content-Type':'application/json'}});};
    }''',{'fixtures':FIXTURES,'initial':storage or {}})
    for script in scripts:page.add_script_tag(content=script)
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_selector('body.app-ready',timeout=20000)
    page.wait_for_timeout(400)
