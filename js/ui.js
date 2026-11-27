/* Local UI primitives. No remote assets, telemetry, or account service. */
(() => {
  'use strict';
  const paths = {
    grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
    trade:'M4 8h16m-5-5 5 5-5 5M20 16H4m5-5-5 5 5 5',
    trophy:'M8 3h8v5c0 4-2 6-4 6S8 12 8 8V3Zm0 2H4v3c0 3 2 4 5 4m7-7h4v3c0 3-2 4-5 4M12 14v6m-4 1h8',
    brain:'M9 18a4 4 0 0 1-6-4 4 4 0 0 1 0-6 4 4 0 0 1 6-4c2-2 3 0 3 2v12c0 3-3 4-4 1M15 18a4 4 0 0 0 6-4 4 4 0 0 0 0-6 4 4 0 0 0-6-4c-2-2-3 0-3 2M7 8l2 2m-2 5 2-1m8-6-2 2m2 5-2-1',
    chart:'M3 3v18h18M6 15l4-5 4 3 6-9',
    sliders:'M4 21V14m0-6V3m8 18v-9m0-6V3m8 18v-5m0-6V3M1 11h6m2-2h6m2 4h6',
    pie:'M21 12a9 9 0 1 1-9-9v9Zm-6-9a9 9 0 0 1 6 6h-6Z',
    history:'M3 10a9 9 0 1 1 1 7M3 4v6h6m3-4v6l4 2',
    user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2c0-4 16-4 16 0v2',
    settings:'m9 3-1 3-3 1-2 4 2 2 1 4 3 1 2 3 4-1 1-3 3-1 2-4-2-2-1-4-3-1-2-3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01',
    info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10h.01',
    search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6',
    bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
    moon:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
    arrow:'M5 12h14m-5-5 5 5-5 5', up:'m6 14 6-6 6 6', down:'m6 10 6 6 6-6',
    download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    plus:'M12 4v16M4 12h16', close:'m6 6 12 12M6 18 18 6',
    check:'m4 12 5 5L20 6', checkcircle:'M21 11v1a9 9 0 1 1-5-8M9 11l3 3L22 4',
    pause:'M8 5v14M16 5v14', play:'m7 4 13 8-13 8Z',
    refresh:'M3 10a9 9 0 0 1 16-5l2 3M21 3v5h-5M21 14A9 9 0 0 1 5 19l-2-3M3 21v-5h5',
    wallet:'M20 7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h15V7m0 5h-6v5h6M16 14h.01',
    shield:'M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6ZM8 12l3 3 5-6',
    menu:'M4 6h16M4 12h16M4 18h16', chevron:'m9 5 7 7-7 7',
    candle:'M7 3v5m0 8v5M4 8h6v8H4Zm13-5v9m0 6v3m-3-9h6v6h-6Z',
    activity:'M2 12h5l3-8 4 16 3-8h5', clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
    globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    layers:'m12 3 10 6-10 6L2 9Zm-9 10 9 5 9-5M3 17l9 5 9-5',
    trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
    spark:'m12 3 2 6 7 3-7 2-2 7-2-7-7-2 7-3Z',
    lock:'M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4',
    external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7'
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, size=18) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.chart}"/></svg>`;
  const language = () => window.EIA ? EIA.lang() : 'es-PE';
  const num = (v,d=2) => new Intl.NumberFormat(language(),{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0);
  const money = v => '$'+num(v);
  const pct = v => `${v>0?'+':''}${num(v)}%`;
  const sign = v => v >= 0 ? 'up' : 'dn';
  function spark(values, width=120, height=36, cls='up') {
    if (!values?.length) return '';
    const lo=Math.min(...values),hi=Math.max(...values),gap=hi-lo||1;
    const points=values.map((v,i)=>`${(i*(width-4)/Math.max(values.length-1,1)+2).toFixed(1)},${(height-4-(v-lo)*(height-8)/gap).toFixed(1)}`).join(' ');
    return `<svg class="sparkline ${cls}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function asset(ticker, name='', small=false) {
    const tone = ['jade','blue','violet','amber','coral'][Array.from(ticker).reduce((a,c)=>a+c.charCodeAt(0),0)%5];
    return `<span class="asset-cell"><span class="asset-avatar ${tone} ${small?'small':''}">${esc(ticker.length<=3?ticker:ticker.slice(0,2))}</span><span><strong>${esc(ticker)}</strong>${name?`<small>${esc(name)}</small>`:''}</span></span>`;
  }
  function toast(message, tone='success') {
    let box=document.querySelector('#toast-stack');
    if(!box){box=document.createElement('div');box.id='toast-stack';box.setAttribute('aria-live','polite');document.body.append(box);}
    const item=document.createElement('div');item.className='toast '+tone;
    item.innerHTML=icon(tone==='error'?'info':'checkcircle')+`<span>${esc(message)}</span><button class="icon-btn" aria-label="Cerrar mensaje">${icon('close',16)}</button>`;
    item.querySelector('button').onclick=()=>item.remove();box.append(item);
    setTimeout(()=>item.remove(),6500);
  }
  let dialogCount=0;
  function modal(title, html, options={}) {
    const titleId='dialog-title-'+(++dialogCount);
    const previous=document.activeElement;
    const d=document.createElement('dialog');d.className='modal '+(options.className||'');
    d.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">ERNESTO INVESTING AI</span><h2 id="${titleId}">${esc(title)}</h2></div><button class="icon-btn close-modal" aria-label="Cerrar ventana">${icon('close')}</button></div><div class="modal-content">${html}</div>`;
    d.setAttribute('aria-labelledby',titleId);
    d.querySelector('.close-modal').onclick=()=>d.close();
    d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
    d.addEventListener('close',()=>{d.remove();if(previous?.isConnected)previous.focus();options.onClose?.();},{once:true});
    document.body.append(d);d.showModal();return d;
  }
  function confirm(title, message, action='Confirmar', danger=false) {
    return new Promise(resolve=>{
      let done=false;
      const d=modal(title,`<p class="modal-description">${esc(message)}</p><div class="modal-actions"><button data-cancel>Cancelar</button><button class="${danger?'danger':'primary'}" data-confirm>${esc(action)}</button></div>`,{onClose:()=>{if(!done)resolve(false);}});
      d.querySelector('[data-cancel]').onclick=()=>d.close();
      d.querySelector('[data-confirm]').onclick=()=>{done=true;d.close();resolve(true);};
      if(danger)d.querySelector('[data-cancel]').focus();
    });
  }
  function csv(filename,headers,rows) {
    const cell=v=>{let s=String(v??'');if(typeof v==='string'&&/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const text='\uFEFF'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Archivo CSV exportado. Incluye datos simulados.');
  }
  function empty(title,description,action='') {
    return `<div class="empty-state">${icon('layers',30)}<h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;
  }
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function plotLayout(extra={}) {
    const axis={gridcolor:css('--bd'),zeroline:false,linecolor:css('--bd'),tickfont:{size:11,color:css('--mut')},showline:false,automargin:true};
    return {paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Inter, Segoe UI, Arial, sans-serif',size:12,color:css('--mut')},margin:{l:52,r:16,t:14,b:34},xaxis:{...axis,showgrid:false},yaxis:{...axis},showlegend:false,hovermode:'x unified',hoverlabel:{bgcolor:css('--panel'),bordercolor:css('--bd'),font:{color:css('--fg'),size:12}},dragmode:'pan',...extra};
  }
  const plotConfig={responsive:true,displaylogo:false,displayModeBar:false,scrollZoom:false};
  function search() {
    if(document.querySelector('dialog.search-dialog'))return;
    const d=modal('Busca tu pr\u00f3ximo movimiento',`<div class="search-input">${icon('search')}<input id="global-query" autocomplete="off" placeholder="Activo, empresa o m\u00f3dulo..." aria-label="Buscar activo o pantalla"></div><div id="search-results" class="search-results"></div><p class="keyboard-hint"><kbd>\u2191</kbd><kbd>\u2193</kbd> para navegar <kbd>Enter</kbd> para abrir <kbd>Esc</kbd> para cerrar</p>`,{className:'search-dialog'});
    const input=d.querySelector('input'),results=d.querySelector('#search-results');let active=-1;
    function render(){const q=input.value.toLowerCase().trim();active=-1;
      const pages=(window.PREMIUM_PAGES||[]).filter(p=>(p[1]+' '+p[2]).toLowerCase().includes(q)).slice(0,q?4:3);
      const assets=(window.Market?.assets||[]).filter(a=>(a.ticker+' '+a.nombre).toLowerCase().includes(q)).slice(0,6);
      results.innerHTML=(pages.length?`<div class="list-label">ESPACIOS DE TRABAJO</div>`+pages.map(p=>`<a class="search-result" href="${p[0]}">${icon(p[3])}<span>${esc(p[1])}</span>${icon('arrow',16)}</a>`).join(''):'')+(assets.length?'<div class="list-label">ACTIVOS \u00b7 DATOS SINT\u00c9TICOS</div>'+assets.map(a=>`<a class="search-result" href="index.html?ticker=${a.ticker}">${asset(a.ticker,a.nombre,true)}<span class="result-price">${money(Market.quote(a.ticker).last)}</span></a>`).join(''):'');
      if(!pages.length&&!assets.length)results.innerHTML=empty('Sin resultados','Prueba con un s\u00edmbolo como NVDA o un m\u00f3dulo como Trading.');
    }
    input.oninput=render;
    d.addEventListener('keydown',e=>{const links=[...results.querySelectorAll('a')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;links.forEach((a,i)=>a.classList.toggle('highlighted',i===active));links[active]?.focus();}else if(e.key==='Enter'&&document.activeElement===input){e.preventDefault();links[0]?.click();}});
    render();input.focus();
  }
  function notifications() {
    const items=window.Market?.notifications()||[];
    const d=modal('Centro de notificaciones',`<p class="mut">Actividad de tu simulaci\u00f3n, guardada en este navegador.</p><div class="notification-list">${items.length?items.map(n=>`<article class="notification"><span class="notification-icon">${icon(n.type==='order'?'trade':n.type==='alert'?'bell':'info')}</span><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${new Date(n.time).toLocaleString(language(),{dateStyle:'short',timeStyle:'short'})}</small></div></article>`).join(''):empty('Todo al d\u00eda','Las confirmaciones de \u00f3rdenes y las alertas aparecer\u00e1n aqu\u00ed.')}</div>`,{className:'notifications-dialog'});
    Market.markNotificationsRead();return d;
  }
  window.UI={esc,icon,num,money,pct,sign,spark,asset,toast,modal,confirm,csv,empty,css,plotLayout,plotConfig,search,notifications};
})();
