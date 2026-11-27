/* Context comes from rendered application state / Plotly traces, never invented data.
 * Speech is optional, segmented, cancellable; remote voices require explicit opt-in.
 */
(() => {
 'use strict';
 const tidy=s=>String(s||'').replace(/\s+/g,' ').trim();
 const number=(v,d=2)=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:d}).format(v);
 const tagText=s=>String(s||'').replace(/<[^>]*>/g,'');
 function chartText(el){
  const v=el?._eiaViewport, traces=(el?.data||[]).filter(t=>t.visible!==false&&t.visible!=='legendonly'&&t.yaxis!=='y2'&&!t._viewportIgnore);
  if(!el)return 'No hay una gráfica seleccionada.';
  const name=el.getAttribute('aria-label')||el.closest('section,article,.card')?.querySelector('h2,h3')?.textContent||'Gráfica';
  let intro=tidy(name)+'. Datos sintéticos. ';
  if(v?.empty||!traces.length)return intro+'No hay series visibles. Activa una serie para analizarla.';
  if(v&&!v.category){const pts=v.visiblePoints(v.range);return intro+`${pts.length} puntos visibles. Eje horizontal: volatilidad anual de ${number(v.range[0])} a ${number(v.range[1])} por ciento. `+(pts.length?`Los retornos anuales esperados visibles van de ${number(Math.min(...pts.map(p=>p.lo)))} a ${number(Math.max(...pts.map(p=>p.hi)))} por ciento. `:'')+'Son soluciones simuladas, no resultados garantizados. El panel lateral contiene los pesos del portafolio seleccionado.';}
  let first=0,last=Infinity;if(v){[first,last]=v.indices();intro+=`Tramo visible: ${v.labels[first]} a ${v.labels[last]}. ${last-first+1} puntos. `;}
  const idx=v?new Map(v.labels.map((x,i)=>[x,i])):null;
  const sentences=[];
  for(const t of traces){
   const ys=t.type==='candlestick'?t.close:t.y;if(!Array.isArray(ys))continue;
   const points=[];for(let i=0;i<ys.length;i++){const k=idx?(idx.get(t.x?.[i])??i):i;if(k>=first&&k<=last&&typeof ys[i]==='number'&&Number.isFinite(ys[i]))points.push({y:ys[i],i});}
   if(!points.length)continue;
   const values=points.map(p=>p.y),start=values[0],end=values.at(-1),name=tagText(t.name||'Serie');
   let unit=(el.id.includes('draw')||el.id==='graf-dd')?' por ciento':el.id.includes('capital')?' puntos de capital base 100':'';
   if(t.type==='candlestick'){
    const lows=points.map(p=>t.low[p.i]),highs=points.map(p=>t.high[p.i]);
    sentences.push(`${name}: primer cierre ${number(start)} dólares; último cierre ${number(end)} dólares. Máximo de las velas ${number(Math.max(...highs))}, mínimo ${number(Math.min(...lows))}. Volumen y velas pertenecen a la historia sintética, no a la cotización de la demo.`);
   }else sentences.push(`${name}: primer valor visible ${number(start)}${unit}; último ${number(end)}${unit}. Mínimo ${number(Math.min(...values))}; máximo ${number(Math.max(...values))}.`);
  }
  return intro+(sentences.length?sentences.join(' '):'Consulta la tabla asociada para leer las celdas de esta visualización.')+' La escala vertical se ajusta a los datos visibles.';
 }
 function visible(el){if(!el?.isConnected||el.closest('[hidden],[aria-hidden="true"],.sr-only,.sr'))return false;const s=el.ownerDocument.defaultView.getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden';}
 function elementText(el){
  if(!el)return '';
  const graph=el.closest('.js-plotly-plot');if(graph)return chartText(graph);
  if(el.matches('input,textarea,select')){
   const label=el.labels?.[0]?.textContent||el.getAttribute('aria-label')||el.placeholder||'Campo';
   if(el.type==='password')return tidy(label)+'. Campo privado; no se lee su contenido.';
   if(el.matches('select'))return tidy(label)+': '+tidy(el.selectedOptions[0]?.textContent);
   if(['checkbox','radio'].includes(el.type))return tidy(label)+(el.checked?': seleccionado.':': no seleccionado.');
   return tidy(label)+': '+tidy(el.value||'vacío');
  }
  const target=el.closest('button,a,label,td,th,h1,h2,h3,p,article.metric-card,.chart-summary,.estimate-row,li,summary')||el;
  const text=tidy(target.innerText||target.textContent||target.getAttribute('aria-label'));
  return text||tidy(target.getAttribute('aria-label')||target.title);
 }
 function readableTarget(el){return el?.closest('.js-plotly-plot,input,textarea,select,button,a,label,td,th,h1,h2,h3,p,article.metric-card,.chart-summary,.estimate-row,li,summary')||null;}
 function pageText(doc){
  const root=doc.querySelector('dialog[open]')||doc.querySelector('main');if(!root)return 'La página está cargando.';
  const out=[];
  function visit(n){
   if(n.nodeType===3){const text=tidy(n.textContent);if(text)out.push(text);return;}
   if(n.nodeType!==1||!visible(n)||n.matches('script,style,svg,canvas,template,.chart-navigation,.plot-container'))return;
   if(n.matches('.js-plotly-plot')){out.push(chartText(n));return;}
   if(n.matches('input,textarea,select')){out.push(elementText(n));return;}
   if(n.matches('details:not([open])')){const s=n.querySelector('summary');if(s)visit(s);return;}
   for(const c of n.childNodes)visit(c);
   if(n.matches('p,h1,h2,h3,h4,article,tr,li,section,button'))out.push('.');
  }
  visit(root);return tidy(out.join(' ').replace(/\s+\./g,'.').replace(/\.{2,}/g,'.'));
 }
 function summary(doc){
  if(!doc)return 'La página está cargando.';
  const page=doc.body.dataset.page,title=doc.querySelector('h1')?.textContent||doc.title;
  const selectors={dashboard:'#dashboard-metrics,#market-insight,#chart-summary',trading:'#trading-metrics,#order-estimate,#available-label',watchlist:'.metrics-grid,#watch-summary',leaderboard:'.metrics-grid',clasificacion:'.kpis,.resumen,#resumen',regresion:'#kpis,#resumen',optimizador:'#detalle,.opt-detalle',portafolios:'.pf-det-cab,.kpis',backtesting:'.bt-summary,.kpis',perfil:'.account-grid'};
  const chunks=[tidy(title)+'. Entorno educativo de datos sintéticos.'];
  if(selectors[page])for(const el of doc.querySelectorAll(selectors[page]))if(visible(el))chunks.push(tidy(el.innerText));
  if(chunks.length===1){const p=doc.querySelector('.page-heading p:last-child');if(p)chunks.push(tidy(p.textContent));const chart=doc.querySelector('.js-plotly-plot');if(chart)chunks.push(chartText(chart));else for(const el of [...doc.querySelectorAll('main h2,main p')].slice(0,8))if(visible(el))chunks.push(tidy(el.innerText));}
  return chunks.filter(Boolean).join(' ');
 }
 function chunks(text){const clean=tidy(text);const parts=[];let rest=clean;while(rest.length){let length=Math.min(200,rest.length);if(length<rest.length){const part=rest.slice(0,length);const cut=Math.max(part.lastIndexOf('. '),part.lastIndexOf('; '),part.lastIndexOf(', '),part.lastIndexOf(' '));if(cut>65)length=cut+1;}parts.push(rest.slice(0,length).trim());rest=rest.slice(length).trim();}return parts;}
 class Reader{
  constructor(callbacks={},options={}){this.cb=callbacks;this.options={rate:1,pitch:1,volume:.85,voiceURI:'',allowRemote:false,...options};this.enabled=false;this.token=0;this.state='off';this.synth=window.speechSynthesis;this.queue=[];this.index=0;if(this.synth){this.synth.addEventListener('voiceschanged',()=>this.cb.voices?.(this.voices()));}this.cb.voices?.(this.voices());}
  voices(){return this.synth?.getVoices()||[];}
  selectedVoice(){const list=this.voices().filter(v=>this.options.allowRemote||v.localService);return list.find(v=>v.voiceURI===this.options.voiceURI)||list.find(v=>v.lang.toLowerCase().startsWith('es'))||list.find(v=>v.default)||list[0];}
  setState(state,message){this.state=state;this.cb.state?.(state,message);}
  enable(value){this.enabled=value;if(!value){this.stop();this.setState('off','Voz apagada');}else this.setState('ready','Voz habilitada. Elige que quieres escuchar.');}
  configure(options){this.options={...this.options,...options};if(this.state==='speaking'||this.state==='paused')this.stop();this.cb.voices?.(this.voices());}
  speak(text,{title='Lectura',notify=false}={}){
   text=tidy(text);if(!text)return;
   if(notify&&(this.state==='speaking'||this.state==='paused')){this.cb.notice?.('Hay una notificación nueva. No se interrumpió la lectura.');return;}
   this.stop();this.cb.transcript?.(text,title);
   if(!this.enabled){this.setState('off','Texto preparado. Activa la voz para escucharlo.');return;}
   if(!this.synth||typeof SpeechSynthesisUtterance==='undefined'){this.setState('error','Este navegador no ofrece síntesis de voz. El texto sigue disponible.');return;}
   const voice=this.selectedVoice();if(!voice){this.setState('error',this.options.allowRemote?'No hay voces disponibles. Instala una voz en el sistema o prueba otro navegador.':'No hay voces locales disponibles. Instala una voz en el sistema o permite voces remotas de forma opcional.');return;}
   this.queue=chunks(text);this.index=0;this.voice=voice;const token=++this.token;this.setState('speaking','Leyendo');this.next(token);
  }
  next(token){if(token!==this.token||!this.enabled)return;if(this.index>=this.queue.length){this.setState('ready','Lectura terminada');return;}
   const u=new SpeechSynthesisUtterance(this.queue[this.index]);u.voice=this.voice;u.lang=this.voice.lang;u.rate=this.options.rate;u.pitch=this.options.pitch;u.volume=this.options.volume;this.utterance=u;
   u.onstart=()=>{if(token!==this.token)return;this.setState('speaking','Leyendo '+(this.index+1)+' / '+this.queue.length);this.cb.progress?.(this.index,this.queue.length,u.text);};
   u.onend=()=>{if(token!==this.token)return;this.index++;this.next(token);};
   u.onerror=e=>{if(token!==this.token||['interrupted','canceled'].includes(e.error))return;this.setState('error',e.error==='not-allowed'?'El navegador bloqueó el audio. Pulsa Activar voz con ratón o teclado y vuelve a leer.':'No se pudo reproducir la voz: '+e.error+'. El texto permanece disponible.');};
   try{this.synth.speak(u);}catch(e){this.setState('error','Error de síntesis de voz: '+e.message);}
  }
  pause(){if(this.state==='speaking'){this.synth.pause();this.setState('paused','Lectura pausada');}else if(this.state==='paused'){this.synth.resume();this.setState('speaking','Leyendo');}}
  stop(){++this.token;this.synth?.cancel();this.queue=[];this.index=0;this.utterance=null;this.setState(this.enabled?'ready':'off',this.enabled?'Lectura detenida':'Voz apagada');}
 }
 window.EIAReader={Reader,chartText,elementText,readableTarget,pageText,summary,chunks,visible};
})();
