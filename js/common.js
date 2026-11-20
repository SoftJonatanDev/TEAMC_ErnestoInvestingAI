/* Ernesto Investing AI - S13 · Núcleo compartido de los 9 módulos.
   Material educativo; datos SINTÉTICOS.
   Aquí viven: navegación, tema claro/oscuro, idioma (ES-PE / EN-US con Intl) y estado compartido. */

const PAGES=[
 ["index.html","dashboard"],["watchlist.html","watchlist"],["trading.html","trading"],["leaderboard.html","leaderboard"],
 ["clasificacion.html","clasificacion",1],["regresion.html","regresion",1],["optimizador.html","optimizador",1],["portafolios.html","portafolios",1],["backtesting.html","backtesting",1]];

/* Textos del armazón (barra superior, aviso, errores). El contenido de cada módulo sigue en español. */
const I18N={
 "es-PE":{skip:"Saltar al contenido",navLabel:"Módulos del sistema",tema:"Tema",temaTitulo:"Cambiar tema claro/oscuro",idioma:"Idioma",
  pages:{dashboard:"Dashboard",watchlist:"Watchlist y alertas",trading:"Trading simulado",leaderboard:"Leaderboard",clasificacion:"Clasificación",regresion:"Regresión 30 días",optimizador:"Optimizador",portafolios:"Portafolios",backtesting:"Backtesting"},
  aviso:"Material educativo con datos <strong>sintéticos</strong> (patrones realistas, precios anclados al cierre del 11-nov-2026). No son precios reales ni asesoría de inversión. Los pronósticos, clasificaciones, NSGA-II/III y backtesting de este prototipo están <strong>simulados</strong>.",
  err:"Abra el sitio desde un servidor (GitHub Pages o <code>python -m http.server</code>), no con doble clic."},
 "en-US":{skip:"Skip to content",navLabel:"System modules",tema:"Theme",temaTitulo:"Switch light/dark theme",idioma:"Language",
  pages:{dashboard:"Dashboard",watchlist:"Watchlist & alerts",trading:"Simulated trading",leaderboard:"Leaderboard",clasificacion:"Classification",regresion:"30-day regression",optimizador:"Optimizer",portafolios:"Portfolios",backtesting:"Backtesting"},
  aviso:"Educational material with <strong>synthetic</strong> data (realistic patterns, prices anchored to the 11-Nov-2026 close). These are not real prices or investment advice. Forecasts, classifications, NSGA-II/III and backtesting in this prototype are <strong>simulated</strong>. Module content is shown in Spanish.",
  err:"Open the site from a server (GitHub Pages or <code>python -m http.server</code>), not by double-clicking the file."}
};
const LOCALES=["es-PE","en-US"];

const $=(s,r=document)=>r.querySelector(s);
function store(k,v){ try{ if(v===undefined){const s=localStorage.getItem(k);return s?JSON.parse(s):null} localStorage.setItem(k,JSON.stringify(v)) }catch(e){ return null } }
const LOC=()=>{const l=store("eia_lang");return LOCALES.includes(l)?l:"es-PE"};
const TXT=()=>I18N[LOC()];

/* Formato numérico con Intl según el idioma elegido en la barra superior. */
const fmt={
  n:(x,d=2)=>Number(x).toLocaleString(LOC(),{minimumFractionDigits:d,maximumFractionDigits:d}),
  pct:(x,d=2)=>(x>=0?"+":"")+Number(x).toLocaleString(LOC(),{minimumFractionDigits:d,maximumFractionDigits:d})+(LOC()==="en-US"?"%":" %"),
  usd:x=>"US$ "+Number(x).toLocaleString(LOC(),{minimumFractionDigits:2,maximumFractionDigits:2}),
  cls:x=>x>0?"up":(x<0?"dn":"mut")};

/* Estado compartido entre módulos (todo en localStorage, solo en este navegador):
   eia_theme · eia_lang · eia_ticker (activo seleccionado) · eia_pf (portafolio elegido)
   eia_watch (watchlist) · eia_port (efectivo y posiciones del trading simulado) */
const EIA={
  lang:LOC,
  setLang(l){ if(LOCALES.includes(l)&&l!==LOC()){ store("eia_lang",l); location.reload(); } },
  ticker:()=>store("eia_ticker"),
  setTicker(t){ if(t) store("eia_ticker",String(t).toUpperCase()); },
  portafolio:()=>store("eia_pf"),
  setPortafolio(r){ store("eia_pf",r); },
  watch:()=>store("eia_watch"),
  trading:()=>store("eia_port")
};
window.EIA=EIA;

const cache={};
async function loadJSON(name){ if(cache[name]) return cache[name];
  const r=await fetch("data/"+name); if(!r.ok) throw new Error("No se pudo leer data/"+name+" ("+r.status+")"); return cache[name]=await r.json(); }
function applyTheme(t){ if(t) document.documentElement.setAttribute("data-theme",t); }

function buildShell(){
  document.documentElement.lang=LOC();
  applyTheme(store("eia_theme"));
  const t=TXT(), page=document.body.dataset.page;
  const nav=PAGES.map(p=>`<li><a href="${p[0]}" ${p[1]===page?'aria-current="page"':''} class="${p[2]?'nuevo':''}">${t.pages[p[1]]}</a></li>`).join("");
  const opts=LOCALES.map(l=>`<option value="${l}" ${l===LOC()?"selected":""}>${l==="es-PE"?"ES-PE":"EN-US"}</option>`).join("");
  document.body.insertAdjacentHTML("afterbegin",`<a class="skip" href="#contenido">${t.skip}</a>
  <header class="top"><div class="bar"><a class="brand" href="index.html">Ernesto <span>Investing AI</span></a>
  <nav aria-label="${t.navLabel}"><ul>${nav}</ul></nav><span class="sp"></span>
  <label class="sr-only" for="idioma">${t.idioma}</label><select id="idioma" class="idioma">${opts}</select>
  <button id="tema" type="button" aria-pressed="false" title="${t.temaTitulo}">${t.tema}</button></div></header>`);
  $("#idioma").addEventListener("change",e=>EIA.setLang(e.target.value));
  const dark0=document.documentElement.getAttribute("data-theme")==="dark"||(!document.documentElement.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme:dark)").matches);
  $("#tema").setAttribute("aria-pressed",dark0);
  $("#tema").addEventListener("click",()=>{const cur=document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const n=cur==="dark"?"light":"dark";applyTheme(n);store("eia_theme",n);$("#tema").setAttribute("aria-pressed",n==="dark");if(window.onTheme)window.onTheme(n)});
  const m=$("main"); if(m){m.id="contenido";m.insertAdjacentHTML("beforeend",`<p class="aviso" style="margin-top:2rem">${t.aviso}</p>`)}
}
function showError(e){ const m=$("main"); m.insertAdjacentHTML("afterbegin",`<p class="err" role="alert">${e.message}. ${TXT().err}</p>`)}
document.addEventListener("DOMContentLoaded",()=>{buildShell(); if(window.init) Promise.resolve(window.init()).catch(showError)});
