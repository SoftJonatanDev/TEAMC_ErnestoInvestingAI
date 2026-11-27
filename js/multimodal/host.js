/* Persistent same-origin workspace: camera and voice survive page navigation. */
(() => {
'use strict';
window.EIAMultimodalHost=true;
const $=s=>document.querySelector(s),frame=$('#mm-app'),cursor=$('#mm-cursor'),highlight=$('#mm-highlight');
const pages=['index','watchlist','trading','leaderboard','clasificacion','regresion','optimizador','portafolios','backtesting','perfil','configuracion','ayuda','acerca'].map(x=>x+'.html');
const defaults={rate:1,pitch:1,volume:.85,voiceURI:'',allowRemote:false,hoverRead:false,autoRead:false,notifyRead:false,sensitivity:1,smoothing:.3,mirror:true,bounds:{left:.14,right:.86,top:.12,bottom:.88}};
let stored={};try{stored=JSON.parse(localStorage.getItem('eia_multimodal_v1'))||{};}catch{}
const prefs={...defaults,...stored};
for(const [key,min,max] of [['rate',.6,1.6],['pitch',.7,1.3],['volume',0,1],['sensitivity',.6,1.6],['smoothing',.15,.65]])prefs[key]=Number.isFinite(+prefs[key])?Math.max(min,Math.min(max,+prefs[key])):defaults[key];
if(!prefs.bounds||!['left','right','top','bottom'].every(k=>Number.isFinite(prefs.bounds[k])&&prefs.bounds[k]>=0&&prefs.bounds[k]<=1)||prefs.bounds.right-prefs.bounds.left<.15||prefs.bounds.bottom-prefs.bounds.top<.15)prefs.bounds={...defaults.bounds};
const save=()=>{try{localStorage.setItem('eia_multimodal_v1',JSON.stringify(prefs));}catch{notice('No se pudieron guardar las preferencias en este navegador.');}};
let reader,engine,camera,bridge,noticeTimer,lastPhysical=0,lastPoint=null,lastReadable=null,dwellInfo=null,calibration=null,lastFeatures=null,popupFocus=null,navVersion=0,themeObserver;
function notice(text){$('#mm-notice').textContent=text;$('#mm-notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#mm-notice').hidden=true,6500);}
function appDoc(){try{return frame.contentDocument;}catch{return null;}}
function appWin(){try{return frame.contentWindow;}catch{return null;}}
// Independent, non-modal tools. Closing or switching a panel never toggles a device.
let lastPanel='voice';
const panelElement=kind=>$(kind==='camera'?'#mm-camera-window':'#mm-panel');
const panelButton=kind=>$(kind==='camera'?'#mm-camera-dock':'#mm-open');
function updatePanels(){
 const other=lastPanel==='voice'?'camera':'voice';
 if(panelElement(lastPanel).hidden&&!panelElement(other).hidden)lastPanel=other;
 if(/^https?:$/.test(location.protocol)){try{const url=new URL(location.href);url.searchParams.set('panel',lastPanel);history.replaceState(null,'',url);}catch{}}
 document.body.classList.toggle('mm-both-panels',!panelElement('voice').hidden&&!panelElement('camera').hidden);
 for(const kind of ['voice','camera'])panelButton(kind).setAttribute('aria-expanded',String(!panelElement(kind).hidden));
}
function showPanel(kind='voice'){
 const guide=kind==='guide';kind=kind==='camera'||guide?'camera':'voice';lastPanel=kind;
 if(innerWidth<960)panelElement(kind==='voice'?'camera':'voice').hidden=true;
 panelElement(kind).hidden=false;updatePanels();
 if(guide)$('#mm-guide-panel').open=true;
 if(kind==='voice')refreshCharts();
}
function hidePanel(kind='voice',restoreFocus=true){
 panelElement(kind).hidden=true;updatePanels();
 if(restoreFocus)panelButton(kind).focus({preventScroll:true});
}
function togglePanel(kind){if(panelElement(kind).hidden)showPanel(kind);else hidePanel(kind);}
window.addEventListener('resize',()=>{
 if(innerWidth<960&&!panelElement('voice').hidden&&!panelElement('camera').hidden)hidePanel(lastPanel==='voice'?'camera':'voice',false);
});
$('#mm-camera-skip').onclick=e=>{e.preventDefault();showPanel('camera');panelElement('camera').focus();};
$('.mm-skip').onclick=e=>{e.preventDefault();showPanel('voice');panelElement('voice').focus();};
function setGestureStatus(s){if($('#mm-gesture-label').textContent!==s)$('#mm-gesture-label').textContent=s;}
function resetDwell(){dwellInfo=null;cursor.style.setProperty('--progress',0);}
function dwell(p,time){
 if(!p||!reader?.enabled||!prefs.hoverRead||calibration){resetDwell();return;}
 const hit=bridge.hit(p);if(!hit||hit.doc===document){resetDwell();return;}
 const target=EIAReader.readableTarget(hit.el);if(!target){resetDwell();return;}
 lastReadable=target;
 if(!dwellInfo||dwellInfo.target!==target||Math.hypot(p.x-dwellInfo.x,p.y-dwellInfo.y)>26){dwellInfo={target,start:time,x:p.x,y:p.y,done:false};cursor.style.setProperty('--progress',0);return;}
 const progress=Math.min(1,(time-dwellInfo.start)/2000);cursor.style.setProperty('--progress',progress);
 if(progress===1&&!dwellInfo.done){dwellInfo.done=true;reader.speak(EIAReader.elementText(target),{title:'Elemento señalado'});}
}
function popup(title,html){closePopup();popupFocus=document.activeElement;$('#mm-popup-title').textContent=title;$('#mm-popup-body').innerHTML=html;$('#mm-popup').hidden=false;frame.inert=true;bridge?.cancel();resetDwell();const first=$('#mm-popup-body').querySelector('button,input,select');(first||$('#mm-popup-close')).focus();return $('#mm-popup-body');}
function closePopup(){if($('#mm-popup').hidden)return;$('#mm-popup').hidden=true;frame.inert=false;calibration=null;engine?.reset();popupFocus?.isConnected&&popupFocus.focus({preventScroll:true});popupFocus=null;}
function selectMenu(el){
 const label=el.labels?.[0]?.textContent||el.getAttribute('aria-label')||'Selecciona una opción';
 const body=popup(label,`<p class="mm-small">Señala con el índice y cierra y reabre el pulgar hacia la palma para elegir. No se modifica nada hasta seleccionar.</p><div class="mm-options">${[...el.options].map((o,i)=>`<button type="button" data-option="${i}" ${o.disabled||o.parentElement.disabled?'disabled':''} aria-pressed="${el.selectedIndex===i}">${UI.esc(o.textContent)}</button>`).join('')}</div>`);
 body.onclick=e=>{const b=e.target.closest('[data-option]');if(!b||!el.isConnected)return;el.selectedIndex=Number(b.dataset.option);const w=el.ownerDocument.defaultView;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));closePopup();notice('Opción seleccionada.');};
}
function editInput(el){
 if(el.id==='mm-edit-buffer'){el.focus();return;}
 const numeric=['number','range'].includes(el.type),label=el.labels?.[0]?.textContent||el.getAttribute('aria-label')||el.placeholder||'Escribir';
 const keys=numeric?'7894561230.-'.split(''):'1234567890qwertyuiopasdfghjklñzxcvbnmáéíóú@.-'.split('');
 const body=popup(label,`<label for="mm-edit-buffer">Contenido del campo</label><input id="mm-edit-buffer" autocomplete="off" spellcheck="false" value="${UI.esc(el.value)}" ${numeric?'inputmode="decimal"':''}><div class="mm-keyboard ${numeric?'numeric':''}">${keys.map(k=>`<button type="button" data-key="${k}">${k}</button>`).join('')}</div><div class="mm-keyboard-actions"><button type="button" data-edit="back">Borrar</button><button type="button" data-edit="clear">Vaciar</button>${numeric?'':'<button type="button" data-edit="space">Espacio</button><button type="button" data-edit="caps">Mayús.</button>'}</div><div class="mm-keyboard-actions"><button type="button" data-edit="cancel">Cancelar</button><button type="button" data-edit="apply" class="primary">Aplicar</button></div>`);
 let caps=false;const buffer=body.querySelector('input');
 function apply(){if(el.isConnected){el.value=buffer.value;const w=el.ownerDocument.defaultView;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));}closePopup();}
 body.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-key')){const k=caps?b.dataset.key.toUpperCase():b.dataset.key;buffer.value+=k;}else{const action=b.dataset.edit;if(action==='back')buffer.value=buffer.value.slice(0,-1);if(action==='clear')buffer.value='';if(action==='space')buffer.value+=' ';if(action==='caps'){caps=!caps;b.setAttribute('aria-pressed',caps);}if(action==='cancel')closePopup();if(action==='apply')apply();}};
 buffer.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply();}};
}
bridge=new EIAInputBridge(frame,{notice,select:selectMenu,edit:editInput,status:setGestureStatus,highlight:r=>{highlight.hidden=!r;if(r)Object.assign(highlight.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});},clicked:()=>resetDwell()});
reader=new EIAReader.Reader({
 state:(state,message)=>{
  $('#mm-voice-status').textContent=message;$('#mm-voice-status').classList.toggle('error',state==='error');document.body.classList.toggle('mm-speaking',state==='speaking');$('#mm-pause-voice').disabled=!['speaking','paused'].includes(state);$('#mm-pause-voice').textContent=state==='paused'?'Reanudar lectura':'Pausar lectura';$('#mm-current-sentence').hidden=!['speaking','paused'].includes(state);
 },
 transcript:(text,title)=>{$('#mm-transcript').textContent=text;$('#mm-transcript-title').textContent=title;$('#mm-reading-progress').textContent='';},
 progress:(i,n,text)=>{$('#mm-reading-progress').textContent=(i+1)+' / '+n;$('#mm-current-sentence').textContent=text;},
 voices:list=>{
  const select=$('#mm-voice-choice');select.replaceChildren();const eligible=list.filter(v=>prefs.allowRemote||v.localService);
  for(const v of eligible){const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+' - '+v.lang+(v.localService?' (local)':' (remota)');select.append(o);}
  if(!eligible.length){select.innerHTML='<option value="">No hay voces disponibles</option>';select.disabled=true;}else{select.disabled=false;select.value=eligible.find(v=>v.voiceURI===prefs.voiceURI)?.voiceURI||eligible.find(v=>v.lang.startsWith('es'))?.voiceURI||eligible[0].voiceURI;}
 },notice
},prefs);
engine=new EIAGestures.Engine({
 cursor:p=>{cursor.style.left=p.x+'px';cursor.style.top=p.y+'px';lastPoint=p;},visible:yes=>{cursor.hidden=!yes;if(!yes)highlight.hidden=true;},status:setGestureStatus,
 hover:p=>{bridge.hover(p);const h=bridge.hit(p);if(h&&h.doc!==document)lastReadable=EIAReader.readableTarget(h.el)||lastReadable;},dwell,
 press:()=>cursor.classList.add('pressed'),release:()=>cursor.classList.remove('pressed'),click:p=>bridge.click(p),
 dragStart:p=>bridge.startDrag(p),drag:p=>bridge.drag(p),dragEnd:()=>bridge.end(),
 twoStart:p=>bridge.begin(p),pan:(d,p)=>bridge.pan({x:d.x*prefs.sensitivity,y:d.y},p),scroll:(d,p)=>bridge.scroll({x:d.x,y:d.y*prefs.sensitivity},p),zoom:(f,p)=>bridge.zoom(f,p),twoEnd:()=>bridge.end(),
 cancel:()=>{bridge.cancel();resetDwell();cursor.classList.remove('pressed');},stopReading:()=>reader.stop(),lost:()=>{bridge.cancel();resetDwell();},
 pause:paused=>{$('#mm-pause-hand').textContent=paused?'Reanudar gestos':'Pausar gestos';cursor.hidden=true;highlight.hidden=true;resetDwell();}
},prefs);
const connections=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
let fpsFrames=0,fpsSince=performance.now(),lastDetection=0;
function drawHand(lm){const canvas=$('#mm-skeleton'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,640,480);if(!lm)return;ctx.strokeStyle='#58dfbd';ctx.lineWidth=2;ctx.beginPath();for(const [a,b] of connections){ctx.moveTo(lm[a].x*640,lm[a].y*480);ctx.lineTo(lm[b].x*640,lm[b].y*480);}ctx.stroke();for(let i=0;i<lm.length;i++){ctx.fillStyle=i===4?'#ffb0d0':i===8||i===12?'#ffd18c':'#ebfff8';ctx.beginPath();ctx.arc(lm[i].x*640,lm[i].y*480,i===4||i===8||i===12?5:3,0,Math.PI*2);ctx.fill();}}
function thumbFeedback(f){
 const output=$('#mm-thumb-state'),meter=$('#mm-thumb-meter');
 meter.hidden=!f||f.shape!=='point';
 if(!f){output.textContent='Sin seguimiento';meter.value=0;return;}
 if(f.shape!=='point'){output.textContent='Extiende solo el índice para hacer clic';return;}
 output.textContent={open:'Abierto',closed:'Cerrado hacia la palma',transition:'En transición'}[f.thumbState]||'Sin lectura';
 meter.value=EIAGestures.clamp((f.thumbSpread-EIAGestures.THUMB.closed)/(EIAGestures.THUMB.open-EIAGestures.THUMB.closed),0,1);
}
function calPoint(){return lastFeatures?{x:prefs.mirror?1-lastFeatures.index.x:lastFeatures.index.x,y:lastFeatures.index.y}:null;}
function captureCalibration(){
 if(!calibration||lastFeatures?.shape!=='point'){notice('Muestra un solo índice extendido para capturar el punto.');return;}
 const p=calPoint();if(calibration.step===0){calibration.points=[p];calibration.step=1;calibration.after=performance.now()+1000;calibration.anchor=null;$('#mm-cal-title').textContent='2 / 2: extremo inferior derecho';$('#mm-cal-instruction').textContent='Lleva el índice al extremo inferior derecho de tu área cómoda y mantenlo quieto. Debe quedar más a la derecha y más abajo que el primer punto.';$('#mm-cal-arrow').textContent='2';$('#mm-cal-progress').value=0;}
 else{const first=calibration.points[0];if(p.x-first.x<.22||p.y-first.y<.22){notice('Amplia el área: el segundo punto debe estar bastante más a la derecha y abajo.');calibration.after=performance.now()+1200;calibration.anchor=null;return;}
  prefs.bounds={left:first.x,right:p.x,top:first.y,bottom:p.y};save();engine.configure(prefs);closePopup();$('#mm-calibration-status').textContent='Área personal calibrada y guardada.';notice('Calibración lista. Señala con el índice para mover el cursor.');}
}
function startCalibration(){
 if(camera.state!=='on'){notice('Activa la cámara antes de calibrar.');return;}
 popup('Calibración del área cómoda','<p class="eyebrow" id="mm-cal-title">1 / 2: extremo superior izquierdo</p><div class="mm-calibration-indicator" id="mm-cal-arrow">1</div><p id="mm-cal-instruction">Dentro de la imagen de la cámara, mueve el índice hacia el extremo superior izquierdo que alcances cómodamente. Manténlo quieto 1 segundo. No necesitas apuntar físicamente al monitor.</p><progress id="mm-cal-progress" value="0" max="1" aria-label="Estabilidad del punto"></progress><p class="mm-small">Los clics gestuales están suspendidos durante la calibración. También puedes capturar con el botón usando ratón o teclado. Esc cancela.</p><button id="mm-capture-point" class="primary full-width">Capturar posición actual</button>');
 calibration={step:0,points:[],anchor:null,since:0,after:performance.now()+500};$('#mm-preview').hidden=false;$('#mm-capture-point').onclick=captureCalibration;engine.reset();
}
function calibrationFrame(f,now){if(!calibration)return;if(f?.shape!=='point'||now<calibration.after){calibration.anchor=null;$('#mm-cal-progress').value=0;return;}const p=calPoint();if(!calibration.anchor||Math.hypot(p.x-calibration.anchor.x,p.y-calibration.anchor.y)>.018){calibration.anchor=p;calibration.since=now;}const v=Math.min(1,(now-calibration.since)/1100);$('#mm-cal-progress').value=v;if(v>=1)captureCalibration();}
camera=new EIACamera($('#mm-video'),{
 status:(state,message)=>{
  $('#mm-camera-status').textContent=message;$('#mm-camera-status').classList.toggle('error',state==='error');$('#mm-camera-enable').textContent=state==='on'?'Apagar cámara':state==='loading'?'Cancelar activación':'Activar cámara';$('#mm-camera-enable').setAttribute('aria-pressed',String(state==='on'));$('#mm-camera-dock').dataset.active=String(state==='on'||state==='loading');$('#mm-camera-dock-state').textContent=state==='loading'?'Cargando':state==='on'?'Encendida':state==='error'?'Revisar':'Apagada';$('#mm-pause-hand').disabled=state!=='on';$('#mm-calibrate').disabled=state!=='on';if(state==='on'){$('#mm-preview').hidden=false;fpsFrames=0;fpsSince=performance.now();}if(state==='error'){showPanel('camera');notice(message);}
 },
 result:(result,ms)=>{
  const now=performance.now(),lm=result.landmarks?.[0],world=result.worldLandmarks?.[0];lastDetection=now;
  drawHand(lm);lastFeatures=EIAGestures.features(lm,world,$('#mm-video').videoWidth/($('#mm-video').videoHeight||480));thumbFeedback(lastFeatures);$('#mm-tracking-badge').textContent=lm?(engine.paused?'En pausa':'Mano detectada'):'Muestra una mano';fpsFrames++;
  if(now-fpsSince>1000){$('#mm-fps').textContent=Math.round(fpsFrames*1000/(now-fpsSince))+' fps / '+Math.round(ms)+' ms';fpsSince=now;fpsFrames=0;}
  if(calibration){calibrationFrame(lastFeatures,now);return;}
  if(now<lastPhysical){cursor.hidden=true;highlight.hidden=true;return;}
  engine.step(lastFeatures,now,{width:innerWidth,height:innerHeight});
 },
 stopped:()=>{engine.reset();engine.paused=false;$('#mm-pause-hand').textContent='Pausar gestos';bridge.cancel();cursor.hidden=true;highlight.hidden=true;$('#mm-preview').hidden=true;drawHand(null);thumbFeedback(null);resetDwell();}
});
function toggleCamera(){if(['on','loading'].includes(camera.state))camera.stop();else{showPanel('camera');camera.start();}}
function voiceUI(){const enabled=reader.enabled;$('#mm-voice-enable').textContent=enabled?'Desactivar voz':'Activar voz';$('#mm-voice-enable').setAttribute('aria-pressed',String(enabled));$('#mm-open').dataset.active=String(enabled);$('#mm-voice-dock-state').textContent=enabled?'Activada':'Apagada';}
function toggleVoice(){reader.enable(!reader.enabled);voiceUI();if(reader.enabled){showPanel('voice');reader.speak('Hola. Soy el lector de Ernesto. Puedes elegir un resumen, un texto o una gráfica.',{title:'Asistente listo'});}}
function stopAll(){camera.stop();reader.enable(false);voiceUI();closePopup();notice('Cámara apagada y lectura detenida.');}
function refreshCharts(){const doc=appDoc(),select=$('#mm-chart-choice'),value=select.value;select.replaceChildren();const charts=doc?[...doc.querySelectorAll('.js-plotly-plot')]:[];for(const [i,el] of charts.entries()){const o=document.createElement('option');o.value=el.id;o.textContent=(i+1)+'. '+(el.getAttribute('aria-label')||el.closest('section,.card,.bt-chart-card,.grafico')?.querySelector('h2,h3')?.textContent||el.id);select.append(o);}if(!charts.length)select.innerHTML='<option value="">No hay gráficas en esta pantalla</option>';else if(charts.some(c=>c.id===value))select.value=value;}
function readChart(){refreshCharts();const doc=appDoc();let el=doc?.getElementById($('#mm-chart-choice').value);if(!el)el=doc?.querySelector('.js-plotly-plot');reader.speak(EIAReader.chartText(el),{title:'Descripción de gráfica'});}
function readSelection(){const text=appWin()?.getSelection()?.toString().trim();if(text){reader.speak(text,{title:'Texto seleccionado'});return;}if(lastReadable?.isConnected){reader.speak(EIAReader.elementText(lastReadable),{title:'Último elemento señalado'});return;}notice('Selecciona texto con el ratón o señala un elemento con el índice antes de usar esta opción.');}
$('#mm-open').onclick=()=>togglePanel('voice');$('#mm-panel-close').onclick=()=>hidePanel('voice');$('#mm-camera-close').onclick=()=>hidePanel('camera');$('#mm-camera-dock').onclick=()=>togglePanel('camera');
$('#mm-camera-enable').onclick=toggleCamera;$('#mm-voice-enable').onclick=toggleVoice;$('#mm-emergency').onclick=stopAll;
$('#mm-pause-hand').onclick=()=>engine.pause(!engine.paused);$('#mm-pause-voice').onclick=()=>reader.pause();$('#mm-stop-voice').onclick=()=>reader.stop();$('#mm-read-summary').onclick=()=>reader.speak(EIAReader.summary(appDoc()),{title:'Resumen de pantalla'});$('#mm-read-page').onclick=()=>reader.speak(EIAReader.pageText(appDoc()),{title:'Contenido de la pantalla'});$('#mm-read-selection').onclick=readSelection;$('#mm-read-chart').onclick=readChart;
$('#mm-popup-close').onclick=closePopup;$('#mm-popup').addEventListener('click',e=>{if(e.target===$('#mm-popup'))closePopup();});
$('#mm-preview-hide').onclick=()=>{$('#mm-preview').hidden=true;notice('Vista previa oculta. La cámara sigue activa; puedes apagarla desde el panel Cámara o con la parada de la barra inferior.');};$('#mm-show-preview').onclick=()=>{if(camera.state==='on')$('#mm-preview').hidden=false;else notice('La vista previa aparece al activar la cámara.');};
$('#mm-calibrate').onclick=startCalibration;$('#mm-reset-calibration').onclick=()=>{prefs.bounds={...defaults.bounds};save();engine.configure(prefs);$('#mm-calibration-status').textContent='Área de movimiento predeterminada.';notice('Área de movimiento restablecida.');};
for(const name of ['rate','pitch','volume','sensitivity','smoothing']){const input=$('#mm-'+name);input.value=prefs[name];const display=()=>{$('#mm-'+name+'-value').textContent=name==='volume'?Math.round(prefs[name]*100)+'%':name==='smoothing'?prefs[name].toFixed(2):prefs[name].toFixed(1)+(name==='pitch'?'':'x');};display();input.oninput=()=>{prefs[name]=Number(input.value);display();save();if(['sensitivity','smoothing'].includes(name))engine.configure(prefs);else reader.configure(prefs);};}
for(const [id,key] of [['mm-remote','allowRemote'],['mm-hover-read','hoverRead'],['mm-auto-read','autoRead'],['mm-notify-read','notifyRead'],['mm-mirror','mirror']]){const input=$('#'+id);input.checked=!!prefs[key];input.onchange=()=>{prefs[key]=input.checked;resetDwell();if(key==='allowRemote'){reader.configure(prefs);notice(input.checked?'Voces remotas permitidas: el proveedor puede recibir el texto.':'Solo se permiten voces locales.');}if(key==='mirror'){prefs.bounds={...defaults.bounds};engine.configure(prefs);$('.mm-video-wrap').classList.toggle('mirror',prefs.mirror);$('#mm-calibration-status').textContent='Área restablecida al cambiar la vista espejo.';}save();};}
$('.mm-video-wrap').classList.toggle('mirror',prefs.mirror);$('#mm-voice-choice').onchange=e=>{prefs.voiceURI=e.target.value;save();reader.configure(prefs);};
for(const el of document.querySelectorAll('[data-mm-icon]'))el.innerHTML=UI.icon(el.dataset.mmIcon,18);
function safePage(input){try{const url=new URL(input,location.href),base=new URL('.',location.href);if(url.origin!==base.origin||url.pathname.slice(0,url.pathname.lastIndexOf('/')+1)!==base.pathname||!pages.includes(url.pathname.split('/').pop()))return 'index.html';return url.pathname.split('/').pop()+url.search+url.hash;}catch{return 'index.html';}}
$('#mm-exit').onclick=()=>{const current=safePage(appWin()?.location?.href||'index.html');camera.stop();reader.stop();location.href=current;};
function manual(e,offset={x:0,y:0}){if(!e.isTrusted)return;if(e.type==='pointermove'){lastPoint={x:e.clientX+offset.x,y:e.clientY+offset.y};if(Math.abs(e.movementX)+Math.abs(e.movementY)<1)return;}if(camera.state==='on'&&!calibration){lastPhysical=performance.now()+1000;engine.reset();cursor.hidden=true;highlight.hidden=true;}}
function keys(e){if(e.key==='Escape'){reader.stop();if(camera.state==='on')engine.pause(true);closePopup();resetDwell();}if(e.altKey&&e.shiftKey&&e.code==='KeyA'){e.preventDefault();showPanel();}if(e.altKey&&e.shiftKey&&e.code==='KeyC'){e.preventDefault();showPanel('camera');}}
document.addEventListener('pointermove',e=>manual(e),{passive:true});document.addEventListener('pointerdown',e=>manual(e),{passive:true});document.addEventListener('keydown',keys);
$('#mm-popup').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...$('#mm-popup').querySelectorAll('button,input,select,[tabindex="0"]')].filter(x=>!x.disabled&&x.offsetParent!==null);if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}});
function attachApplication(){
 const doc=appDoc(),win=appWin();if(!doc?.body?.dataset?.page)return;
 const version=++navVersion;window.EIAMultimodal.ready=false;lastReadable=null;bridge.cancel();engine.reset();resetDwell();reader.stop();lastPhysical=performance.now()+700;
 const onReady=()=>{if(version!==navVersion)return;$('#mm-loading').hidden=true;$('#mm-current-page').textContent=doc.querySelector('h1')?.textContent||doc.title;refreshCharts();
  try{history.replaceState(null,'','interaccion.html?pagina='+encodeURIComponent(safePage(win.location.href))+'&panel='+lastPanel);}catch{}
  document.documentElement.dataset.theme=doc.documentElement.dataset.theme||'dark';themeObserver?.disconnect();themeObserver=new MutationObserver(()=>document.documentElement.dataset.theme=doc.documentElement.dataset.theme||'dark');themeObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(reader.enabled&&prefs.autoRead)reader.speak(EIAReader.summary(doc),{title:'Nuevo módulo'});
  const seen=new Set((win.Market?.notifications()||[]).map(x=>x.id));win.addEventListener('market:notifications',()=>{const items=(win.Market?.notifications()||[]).filter(x=>!seen.has(x.id));items.forEach(x=>seen.add(x.id));if(reader.enabled&&prefs.notifyRead&&items.length)reader.speak(items.slice(0,3).map(x=>x.title+'. '+x.message).join(' '),{title:'Notificaciones',notify:true});});
  if(win.UI){const original=win.UI.toast;win.UI.toast=(message,tone)=>{original(message,tone);if(reader.enabled&&prefs.notifyRead)reader.speak(message,{title:'Confirmación de interfaz',notify:true});};}
  window.EIAMultimodal.ready=true;
 };
 doc.addEventListener('pointermove',e=>{const r=frame.getBoundingClientRect();manual(e,{x:r.left,y:r.top});const el=EIAReader.readableTarget(e.target);if(el)lastReadable=el;},{passive:true});doc.addEventListener('pointerdown',manual,{passive:true});doc.addEventListener('wheel',manual,{passive:true});doc.addEventListener('keydown',keys);
 if(doc.body.classList.contains('app-ready'))onReady();else{let tries=0;const timer=setInterval(()=>{if(version!==navVersion){clearInterval(timer);return;}if(doc.body.classList.contains('app-ready')||++tries>100){clearInterval(timer);onReady();}},100);}
}
frame.addEventListener('load',attachApplication);
setInterval(()=>{const now=performance.now();if(camera.state==='on'&&lastDetection&&now-lastDetection>600&&!calibration)engine.step(null,now);if(prefs.hoverRead&&reader.enabled&&lastPoint&&(camera.state!=='on'||now<lastPhysical))dwell(lastPoint,now);},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden){camera.stop();reader.stop();closePopup();}});
window.addEventListener('pagehide',()=>{camera.stop();reader.stop();});
window.EIAMultimodal={engine,bridge,reader,camera,prefs,ready:false,showPanel,hidePanel,refreshCharts,readChart,startCalibration};
if(new URLSearchParams(location.search).get('panel')==='camera'){hidePanel('voice',false);showPanel('camera');}else updatePanels();
fetch('vendor/mediapipe/sources.json').then(r=>r.json()).then(c=>{if(c.mode==='local')$('#mm-assets-info').textContent='Modelo y bibliotecas instalados localmente. No se necesita Internet para el seguimiento.';}).catch(()=>{});
if(location.protocol==='file:'){$('#mm-loading').innerHTML='<strong>Abre el proyecto con iniciar.py</strong><p>El control necesita un servidor local o HTTPS, no doble clic en el HTML.</p>';}
else frame.src=safePage(new URLSearchParams(location.search).get('pagina')||'index.html');
})();
