/* Shared application frame and cross-page interaction. */
(() => {
  'use strict';
  const pages=[
    ['index.html','Panorama de mercado','dashboard','grid','Mercados','Tus activos, tus se\u00f1ales y tu siguiente movimiento.'],
    ['watchlist.html','Tu lista de seguimiento','watchlist','star','Mercados','Los activos que importan. Las alertas que necesitas.'],
    ['trading.html','Centro de operaciones','trading','trade','Mercados','Practica decisiones de inversi\u00f3n en un entorno seguro.'],
    ['leaderboard.html','Liga de inversores','leaderboard','trophy','Mercados','Explora la clasificaci\u00f3n y sigue tu progreso.'],
    ['clasificacion.html','Clasificaci\u00f3n de tendencias','clasificacion','brain','Laboratorio IA','Explora las se\u00f1ales de 18 modelos sobre 26 activos.'],
    ['regresion.html','Proyecciones a 30 sesiones','regresion','chart','Laboratorio IA','Del historial sint\u00e9tico a los posibles escenarios de precio.'],
    ['optimizador.html','Dise\u00f1a tu estrategia','optimizador','sliders','Laboratorio IA','Encuentra el equilibrio entre retorno, diversificaci\u00f3n y riesgo.'],
    ['portafolios.html','Portafolios por perfil','portafolios','pie','Laboratorio IA','Tres formas de distribuir el riesgo. Una visi\u00f3n de conjunto.'],
    ['backtesting.html','Eval\u00faa tu estrategia','backtesting','history','Laboratorio IA','Analiza el comportamiento de portafolios sobre historia sint\u00e9tica.'],
    ['perfil.html','Tu perfil de inversor','perfil','user','Tu espacio','Un resumen de tu cuenta educativa y tus preferencias.'],
    ['configuracion.html','Tu espacio, a tu medida','configuracion','settings','Tu espacio','Personaliza el idioma, la regi\u00f3n y la apariencia.'],
    ['ayuda.html','Centro de ayuda','ayuda','help','Tu espacio','Encuentra respuestas y descubre c\u00f3mo funciona la simulaci\u00f3n.'],
    ['acerca.html','Acerca de Ernesto','acerca','info','Tu espacio','Tecnolog\u00eda, metodolog\u00eda y transparencia de los datos.']
  ];
  window.PREMIUM_PAGES=pages;
  let current;
  const shortLabels=['Dashboard','Watchlist','Trading','Leaderboard','Clasificaci\u00f3n','Regresi\u00f3n','Optimizador','Portafolios','Backtesting','Mi perfil','Configuraci\u00f3n','Centro de ayuda','Acerca del proyecto'];
  const keys=['nav_dash','nav_watch','nav_trade','nav_lead','nav_clasif','nav_reg','nav_opt','nav_port','nav_back','nav_perfil','nav_config','nav_ayuda','nav_acerca'];
  function build(){
    current=pages.find(p=>p[2]===document.body.dataset.page)||pages[0];
    document.documentElement.setAttribute('data-theme',store('eia_theme')||'dark');
    let nav='';
    ['Mercados','Laboratorio IA','Tu espacio'].forEach((group,g)=>{
      nav+=`<p class="sidebar-label">${['ESPACIO DE TRABAJO','INTELIGENCIA & ESTRATEGIA','TU CUENTA'][g]}</p><ul>`;
      pages.forEach((p,i)=>{if(p[4]===group)nav+=`<li><a href="${p[0]}" ${p===current?'aria-current="page"':''}>${UI.icon(p[3])}<span data-i18n="${keys[i]}">${shortLabels[i]}</span>${i===4?'<span class="nav-chip">AI</span>':''}</a></li>`;});nav+='</ul>';
    });
    const options=LOCALES.map(c=>`<option value="${c}">${{'es-PE':'ES / Per\u00fa','en-US':'EN / US','ar-EG':'AR','ja-JP':'JA','qu-PE':'QU'}[c]}</option>`).join('');
    document.body.insertAdjacentHTML('afterbegin',`
      <a class="skip" href="#contenido" data-i18n="skip">Saltar al contenido</a><div class="app-loader" aria-hidden="true"></div>
      <div class="nav-backdrop"></div>
      <aside class="sidebar" aria-label="Men\u00fa principal"><button class="icon-btn sidebar-close" aria-label="Cerrar men\u00fa">${UI.icon('close')}</button>
        <a class="brand" href="index.html" aria-label="Ernesto Investing AI, inicio"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 24V8h17M8 16h13M8 24h17" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="m17 8 4 4 6-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></span><span>ernesto<small>INVESTING AI</small></span></a>
        <div class="sidebar-scroll"><nav aria-label="Navegaci\u00f3n principal">${nav}</nav></div>
        <div class="sidebar-bottom"><a class="account-link" href="perfil.html"><span class="avatar">EC</span><span><strong>Inversor Equipo C</strong><small>Cuenta educativa</small></span>${UI.icon('chevron',14)}</a><div class="account-mode"><span class="status-dot"></span>SIMULACI\u00d3N LOCAL <span style="margin-inline-start:auto">v3.0</span></div></div>
      </aside>
      <header class="app-topbar"><button class="icon-btn mobile-menu" aria-label="Abrir men\u00fa" aria-expanded="false">${UI.icon('menu',20)}</button><div class="breadcrumbs"><span>${current[4]}</span>${UI.icon('chevron',12)}<strong>${shortLabels[pages.indexOf(current)]}</strong></div>
        <div class="topbar-actions"><button class="command-trigger" aria-label="Buscar activos o m\u00f3dulos, Control K">${UI.icon('search',15)}<span>Buscar activos o m\u00f3dulos</span><kbd>Ctrl K</kbd></button><span class="topbar-divider"></span><label class="sr-only" for="idioma">Idioma</label><select id="idioma" class="idioma">${options}</select><button id="tema" class="icon-btn" aria-label="Cambiar tema" title="Cambiar tema" aria-pressed="true">${UI.icon('sun',18)}</button><button id="notifications-trigger" class="icon-btn" aria-label="Ver notificaciones">${UI.icon('bell',18)}<span class="notification-dot" hidden></span></button><a class="avatar" href="perfil.html" aria-label="Mi perfil">EC</a></div>
      </header><div class="quote-ribbon" aria-label="Resumen del mercado simulado"><div class="ribbon-label"><span class="status-dot"></span>DEMO MARKET</div><div id="ribbon-quotes" style="display:flex"></div></div><p id="draft-notice" class="aviso" role="note" data-i18n="draft_notice" hidden></p>`);
    const main=document.querySelector('main');main.id='contenido';main.setAttribute('tabindex','-1');main.setAttribute('aria-busy','true');
    const oldTitle=main.querySelector('h1');if(oldTitle)oldTitle.remove();
    main.insertAdjacentHTML('afterbegin',`<section class="page-heading"><div><p class="eyebrow">${current[4]==='Mercados'?'TU VISI\u00d3N DEL MERCADO':current[4]==='Laboratorio IA'?'ANALIZA. COMPARA. DECIDE.':'ERNESTO INVESTING AI'}</p><h1>${current[1]}</h1><p>${current[5]}</p></div><div class="heading-actions" id="heading-actions"><span class="demo-label">${UI.icon('shield',13)} Entorno simulado</span></div></section>`);
    document.body.insertAdjacentHTML('beforeend',`<footer class="app-footer"><span>${UI.icon('shield')} Simulaci\u00f3n acad\u00e9mica. Sin dinero real ni asesor\u00eda de inversi\u00f3n.</span><span><span class="status-dot"></span> Datos locales <span aria-hidden="true">\u00b7</span> <span id="session-clock"></span><a href="acerca.html">Metodolog\u00eda</a></span></footer>`);
    const skip=document.querySelector('.skip');skip.style.position='fixed';skip.style.insetBlockStart='-999px';skip.style.insetInlineStart='12px';skip.onfocus=()=>skip.style.insetBlockStart='12px';skip.onblur=()=>skip.style.insetBlockStart='-999px';
    document.querySelector('#idioma').onchange=e=>EIA.setLang(e.target.value);
    document.querySelector('#tema').onclick=()=>{EIA.setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');updateThemeIcon();};
    document.querySelector('.command-trigger').onclick=UI.search;document.querySelector('#notifications-trigger').onclick=UI.notifications;
    document.querySelector('.mobile-menu').onclick=()=>toggleNav(true);document.querySelector('.sidebar-close').onclick=()=>toggleNav(false);document.querySelector('.nav-backdrop').onclick=()=>toggleNav(false);
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();UI.search();}if(e.key==='Escape')toggleNav(false);
      if(e.key==='Tab'&&document.body.classList.contains('nav-open')){const list=[...document.querySelector('.sidebar').querySelectorAll('a,button')].filter(e=>e.offsetParent!==null);if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0].focus();}}
    });
    window.addEventListener('themechange',updateThemeIcon);
    document.querySelector('#draft-notice').style.marginInlineStart='var(--sidebar-w)';
    if(location.protocol==='file:')showError(new Error('Abre el proyecto con un servidor local, no con doble clic.'));
  }
  function toggleNav(open){const was=document.body.classList.contains('nav-open');if(!open&&!was)return;document.body.classList.toggle('nav-open',open);document.querySelector('.mobile-menu')?.setAttribute('aria-expanded',String(open));document.querySelector('main').inert=open;document.querySelector('.app-topbar').inert=open;document.querySelector('.quote-ribbon').inert=open;
    if(open)document.querySelector('.sidebar a[aria-current]')?.focus();else if(was)document.querySelector('.mobile-menu').focus();}
  function updateThemeIcon(){const b=document.querySelector('#tema');if(b){const dark=document.documentElement.dataset.theme==='dark';b.innerHTML=UI.icon(dark?'sun':'moon');b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Activar tema claro':'Activar tema oscuro');}}
  function updateRibbon(){const el=document.querySelector('#ribbon-quotes');if(!el)return;el.innerHTML=['SPY','QQQ','EPU','NVDA','AAPL'].map(t=>{const q=Market.quote(t);return `<a class="ribbon-asset" href="index.html?ticker=${t}"><strong>${t}</strong><span class="num">${UI.money(q.last)}</span><span class="change ${UI.sign(q.change)}">${UI.pct(q.change)}</span></a>`;}).join('');
    const enabled=Market.state().enabled;document.querySelector('.ribbon-label .status-dot').classList.toggle('paused',!enabled);
    const b=document.querySelector('#simulation-toggle');if(b){b.innerHTML=UI.icon(enabled?'pause':'play',13)+`<span>${enabled?'Pausar':'Reanudar'} demo</span>`;b.setAttribute('aria-pressed',String(!enabled));}
  }
  function connect(){
    updateRibbon();window.addEventListener('market:tick',updateRibbon);
    const actions=document.querySelector('#heading-actions');if(['dashboard','watchlist','trading','leaderboard'].includes(current[2])){actions.insertAdjacentHTML('beforeend',`<button id="simulation-toggle" title="Pausar o reanudar las variaciones de precio simuladas"></button>`);document.querySelector('#simulation-toggle').onclick=()=>Market.toggle();updateRibbon();}
    const notifications=()=>{const n=Market.notifications().filter(n=>!n.read).length;document.querySelector('.notification-dot').hidden=!n;document.querySelector('#notifications-trigger').setAttribute('aria-label',n?`Notificaciones: ${n} sin leer`:'Ver notificaciones');};notifications();window.addEventListener('market:notifications',notifications);
    const clock=()=>{document.querySelector('#session-clock').textContent=new Date().toLocaleTimeString(EIA.lang(),{hour:'2-digit',minute:'2-digit',timeZone:EIA.timeZone()})+' '+EIA.timeZone().split('/').at(-1).replace('_',' ');};clock();setInterval(clock,30000);
  }
  function ready(){document.body.classList.add('app-ready');document.querySelector('main').setAttribute('aria-busy','false');updateThemeIcon();
    document.querySelectorAll('.tw,.table-scroll,.hm,.envoltura').forEach(el=>{el.setAttribute('tabindex','0');if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Tabla desplazable: usa las flechas para recorrer las columnas');});
  }
  window.PremiumShell={build,connect,ready};
})();
