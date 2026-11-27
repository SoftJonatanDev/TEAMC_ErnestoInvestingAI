/* Classic worker: dynamic ESM import + Emscripten importScripts compatibility. */
'use strict';
let detector=null;
self.onmessage=async({data})=>{
 if(data.type==='init'){
  try{
   const {FilesetResolver,HandLandmarker}=await import(data.assets.bundle);
   const files=await FilesetResolver.forVisionTasks(data.assets.wasm);
   // CPU avoids requiring a WebGL context in the worker. Image preprocessing stays local.
   detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:data.assets.model,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65});
   self.postMessage({type:'ready'});
  }catch(error){self.postMessage({type:'error',message:String(error.message||error)});}
 }else if(data.type==='frame'){
  try{const start=performance.now(),result=detector.detectForVideo(data.bitmap,data.time);self.postMessage({type:'result',result,ms:performance.now()-start});}
  catch(error){self.postMessage({type:'frameError',message:String(error.message||error)});}
  finally{data.bitmap?.close();}
 }
};
