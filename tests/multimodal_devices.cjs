/* Device lifecycle contracts with deterministic doubles, NOT physical webcam/audio QA. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),report=[];fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
function check(name,condition){assert.ok(condition,name);report.push({test:name,passed:true});console.log('PASS '+name);}
function voiceEnv(voices){
 const events=[],synth={spoken:[],cancelCount:0,paused:false,getVoices:()=>voices,addEventListener(){},speak(u){this.spoken.push(u);u.onstart?.();},cancel(){this.cancelCount++;},pause(){this.paused=true;},resume(){this.paused=false;}};
 const c={window:{speechSynthesis:synth},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},Intl,console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/multimodal/reader.js'),'utf8'),c);
 const r=new c.window.EIAReader.Reader({state:(s,m)=>events.push([s,m]),transcript:t=>events.push(['text',t])});
 return {r,synth,events,api:c.window.EIAReader};
}
const local={voiceURI:'local-es',name:'Test local',lang:'es-PE',localService:true,default:true};
const remote={voiceURI:'remote-es',name:'Test remote',lang:'es-ES',localService:false,default:false};
let v=voiceEnv([local,remote]);
v.r.speak('Texto de prueba');check('Voice is OFF initially and preparing text never starts audio',v.synth.spoken.length===0&&!v.r.enabled);
check('Prepared transcript remains available when voice is off',v.events.some(e=>e[0]==='text'&&e[1]==='Texto de prueba'));
v.r.enable(true);v.r.speak('Primera frase. '.repeat(50));check('Speech queue is segmented into bounded utterances',v.r.queue.length>1&&v.r.queue.every(s=>s.length<=200));
check('Local Spanish voice is selected by default',v.synth.spoken.at(-1).voice===local);
const first=v.synth.spoken.at(-1);first.onend();check('End event advances to next sentence exactly once',v.synth.spoken.length===2&&v.r.index===1);
v.r.pause();check('Pause keeps queue and pauses synthesis',v.r.state==='paused'&&v.synth.paused&&v.r.queue.length>1);
v.r.pause();check('Resume continues the same reading queue',v.r.state==='speaking'&&!v.synth.paused);
const stale=v.synth.spoken.at(-1),count=v.synth.spoken.length;v.r.stop();stale.onend();check('Stop invalidates pending callbacks and empties the queue',v.r.queue.length===0&&v.synth.spoken.length===count);
v.r.speak('Texto nuevo');v.r.configure({rate:1.3});check('Changing voice preferences cancels current speech safely',v.r.state==='ready'&&v.r.queue.length===0);
v.r.speak('Texto principal');const main=v.synth.spoken.length;v.r.speak('Aviso',{notify:true});check('Notifications do not interrupt ongoing narration',v.synth.spoken.length===main);
v.r.speak('Otra lectura');v.synth.spoken.at(-1).onerror({error:'not-allowed'});check('Blocked browser audio reports an error with transcript preserved',v.r.state==='error'&&v.events.some(e=>e[0]==='text'&&e[1]==='Otra lectura'));
v.r.enable(false);check('Disabling voice cancels and returns to OFF',!v.r.enabled&&v.r.state==='off');
v=voiceEnv([remote]);v.r.enable(true);v.r.speak('Privacidad');check('Remote-only voices are refused until user opt-in',v.r.state==='error'&&v.synth.spoken.length===0);
v.r.configure({allowRemote:true});v.r.speak('Consentimiento');check('Remote voice becomes available only after opt-in',v.synth.spoken.length===1&&v.synth.spoken[0].voice===remote);
v.r.configure({allowRemote:false});v.r.speak('Volver a local');check('Revoking remote consent prevents subsequent remote speech',v.synth.spoken.length===1&&v.r.state==='error');
v=voiceEnv([]);v.r.enable(true);v.r.speak('Sin voces');check('Missing system voices fail gracefully',v.r.state==='error'&&v.synth.spoken.length===0);
function cameraEnv(){
 const events=[],track={stopped:0,callbacks:{},stop(){this.stopped++;},addEventListener(n,f){this.callbacks[n]=f;}},stream={getTracks:()=>[track],getVideoTracks:()=>[track]},video={srcObject:null,currentTime:1,readyState:2,async play(){},pause(){this.paused=true;}},media={requests:[],async getUserMedia(opts){this.requests.push(opts);return stream;}},workers=[];
 class Worker{constructor(){this.terminated=false;workers.push(this);}postMessage(m){if(m.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));else if(m.type==='frame')queueMicrotask(()=>this.onmessage?.({data:{type:'result',result:{landmarks:[]},ms:4}}));}terminate(){this.terminated=true;}}
 const window={isSecureContext:true,Worker,createImageBitmap:async()=>({close(){}})};
 const c={window,navigator:{mediaDevices:media},location:{href:'http://localhost:8000/interaccion.html'},fetch:async()=>({ok:true,json:async()=>({mode:'cdn'})}),Worker,createImageBitmap:window.createImageBitmap,URL,performance:{now:()=>1000},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout,clearTimeout,console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/multimodal/camera.js'),'utf8'),c);
 const camera=new window.EIACamera(video,{status:(s,m)=>events.push([s,m]),result:r=>events.push(['result',r]),stopped:()=>events.push(['stopped'])});
 return {camera,events,track,stream,video,media,workers,c};
}
(async()=>{
 let e=cameraEnv();e.c.window.isSecureContext=false;await e.camera.start();check('Insecure origin cannot request a camera',e.camera.state==='error'&&e.media.requests.length===0);
 e=cameraEnv();e.media.getUserMedia=async opts=>{e.media.requests.push(opts);throw Object.assign(new Error('Denied'),{name:'NotAllowedError'});};await e.camera.start();check('Permission denial produces a recoverable error',e.camera.state==='error'&&!e.camera.stream);check('Camera requests explicitly disable microphone',e.media.requests[0].audio===false);
 e=cameraEnv();let resolve;e.media.getUserMedia=()=>new Promise(r=>resolve=r);const waiting=e.camera.start();e.camera.stop();resolve(e.stream);await waiting;check('Cancelling pending permission stops any subsequently returned stream',e.track.stopped===1&&!e.camera.stream&&e.camera.state==='off');
 e=cameraEnv();await e.camera.start();await Promise.resolve();check('Successful camera lifecycle owns one video stream',e.camera.state==='on'&&e.camera.stream===e.stream&&e.video.srcObject===e.stream&&e.media.requests.length===1);check('Worker results are delivered to the gesture callback',e.events.some(x=>x[0]==='result'));
 await e.camera.start();check('Repeated activation cannot create a second stream',e.media.requests.length===1);e.camera.stop();check('Stop releases stream, worker, preview and pending frame state',e.track.stopped===1&&!e.video.srcObject&&!e.camera.stream&&!e.camera.worker&&e.workers[0].terminated&&!e.camera.busy);
 e=cameraEnv();await e.camera.start();e.track.callbacks.ended();check('Device disconnection stops camera and reports an error',e.camera.state==='error'&&!e.camera.stream&&e.workers[0].terminated);
 e=cameraEnv();e.video.play=async()=>{throw new Error('Playback failed');};await e.camera.start();check('Video startup failure does not leak the camera stream',e.track.stopped===1&&!e.camera.stream&&e.camera.state==='error');
 e=cameraEnv();e.camera.assets=async()=>{throw new Error('Model download unavailable');};await e.camera.start();check('Model resource failure stops capture rather than leaving camera on',e.track.stopped===1&&!e.camera.stream&&e.camera.state==='error');
 e=cameraEnv();await e.camera.start();e.camera.frameError('test');e.camera.frameError('test');e.camera.frameError('test');check('Repeated inference errors trigger camera shutdown',e.camera.state==='error'&&!e.camera.stream);
 e=cameraEnv();const assets=await e.camera.assets();check('Default assets are version-pinned, not latest',assets.bundle.includes('@0.10.21/')&&assets.model.includes('float16/1/'));e.c.fetch=async()=>({ok:true,json:async()=>({mode:'local'})});const localAssets=await e.camera.assets();check('Local installation loads model and WASM from the same origin',Object.values(localAssets).every(x=>x.startsWith('http://localhost:8000/vendor/mediapipe/')));
 fs.writeFileSync(path.join(root,'test-results/multimodal-devices.json'),JSON.stringify({scope:'Deterministic device doubles; not a physical webcam, acoustic, or model accuracy test.',checks:report},null,2));console.log('Device contract checks: '+report.length+' passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
