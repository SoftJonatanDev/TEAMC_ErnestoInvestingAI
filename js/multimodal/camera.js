/* Explicit permission, one video-only stream, worker inference, deterministic cleanup. */
(() => {
 'use strict';
 class Camera{
  constructor(video,callbacks={}){this.video=video;this.cb=callbacks;this.generation=0;this.state='off';this.busy=false;this.frame=0;this.errors=0;}
  status(state,message){this.state=state;this.cb.status?.(state,message);}
  async assets(){
   let config={mode:'cdn'};try{const r=await fetch('vendor/mediapipe/sources.json');if(r.ok)config=await r.json();}catch{}
   if(config.mode==='local')return {bundle:new URL('vendor/mediapipe/vision_bundle.mjs',location.href).href,wasm:new URL('vendor/mediapipe/wasm',location.href).href,model:new URL('vendor/mediapipe/models/hand_landmarker.task',location.href).href};
   return {bundle:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs',wasm:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',model:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'};
  }
  async start(){
   if(this.state==='on'||this.state==='loading')return;
   if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){this.status('error','La cámara necesita HTTPS o localhost. Abre el proyecto con iniciar.py.');return;}
   const id=++this.generation;this.status('loading','Autoriza la cámara en el navegador. No se solicita micrófono.');
   try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}},audio:false});
    if(id!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
    this.stream=stream;this.video.srcObject=stream;await this.video.play();
    stream.getVideoTracks()[0].addEventListener('ended',()=>{if(this.state==='on'||this.state==='loading'){this.stop();this.status('error','La cámara fue desconectada. Vuelve a activarla.');}});
    this.status('loading','Cargando seguimiento de manos. La primera carga puede necesitar Internet.');
    const assets=await this.assets();if(id!==this.generation)return;
    let workerFailed=false;
    if(window.Worker&&window.createImageBitmap){
     try{await this.initWorker(assets,id);}catch(error){if(id!==this.generation)return;this.worker?.terminate();this.worker=null;workerFailed=true;console.warn('Hand worker fallback:',error.message);}
    }else workerFailed=true;
    if(workerFailed){
     this.status('loading','Preparando seguimiento compatible con este navegador...');
     const {FilesetResolver,HandLandmarker}=await import(assets.bundle);
     const files=await FilesetResolver.forVisionTasks(assets.wasm);
     const detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:assets.model,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65});
     if(id!==this.generation){detector.close();return;}this.detector=detector;
    }
    if(id!==this.generation)return;
    this.status('on','Cámara activa. Muestra una sola mano con el índice extendido.');this.busy=false;this.lastTime=-1;this.lastFrame=0;this.errors=0;this.loop(id);
   }catch(error){
    if(id!==this.generation)return;
    this.stop();const messages={NotAllowedError:'Permiso denegado. Habilita la cámara en los permisos del sitio y vuelve a intentarlo.',NotFoundError:'No se encontró una cámara conectada.',NotReadableError:'La cámara está ocupada o no se puede abrir. Cierra otras aplicaciones que la usan.',OverconstrainedError:'Esta cámara no admite la configuración solicitada.'};
    this.status('error',messages[error.name]||'No se pudo cargar el seguimiento. Revisa Internet o ejecuta preparar_camara.py para instalar los recursos locales. Detalle: '+String(error.message||error).slice(0,180));
   }
  }
  initWorker(assets,id){return new Promise((resolve,reject)=>{
   const w=this.worker=new Worker('js/multimodal/hand-worker.js');
   const timer=setTimeout(()=>reject(new Error('Tiempo de carga del modelo agotado')),40000);
   w.onerror=e=>{clearTimeout(timer);if(this.state==='loading')reject(new Error(e.message||'Worker no compatible'));else {this.busy=false;this.stop();this.status('error','Se interrumpió el proceso de seguimiento. Reactiva la cámara.');}};
   w.onmessage=({data})=>{if(id!==this.generation)return;
    if(data.type==='ready'){clearTimeout(timer);resolve();}
    else if(data.type==='error'){clearTimeout(timer);reject(new Error(data.message));}
    else if(data.type==='result'){this.busy=false;this.errors=0;this.cb.result?.(data.result,data.ms);}
    else if(data.type==='frameError'){this.busy=false;this.frameError(data.message);}
   };w.postMessage({type:'init',assets});
   this.abortInit=()=>{clearTimeout(timer);reject(new Error('Carga cancelada'));};
  });}
  frameError(message){if(++this.errors>=3){this.stop();this.status('error','El seguimiento se interrumpió. Reactiva la cámara. '+String(message||'').slice(0,100));}}
  loop(id){
   if(id!==this.generation||this.state!=='on')return;
   this.frame=requestAnimationFrame(()=>this.loop(id));const now=performance.now();
   if(this.video.readyState<2||this.busy||this.video.currentTime===this.lastTime||now-this.lastFrame<(this.worker?45:80))return;
   this.lastTime=this.video.currentTime;this.lastFrame=now;
   if(this.worker){this.busy=true;createImageBitmap(this.video).then(bitmap=>{if(id!==this.generation||!this.worker){bitmap.close();return;}this.worker.postMessage({type:'frame',bitmap,time:now},[bitmap]);}).catch(e=>{this.busy=false;this.frameError(e.message);});}
   else{try{const t=performance.now(),result=this.detector.detectForVideo(this.video,now);this.cb.result?.(result,performance.now()-t);}catch(e){this.frameError(e.message);}}
  }
  stop(){++this.generation;cancelAnimationFrame(this.frame);this.abortInit?.();this.abortInit=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.pause();this.video.srcObject=null;this.worker?.terminate();this.worker=null;this.detector?.close();this.detector=null;this.busy=false;this.status('off','Cámara apagada. No se capturan imágenes.');this.cb.stopped?.();}
 }
 window.EIACamera=Camera;
})();
