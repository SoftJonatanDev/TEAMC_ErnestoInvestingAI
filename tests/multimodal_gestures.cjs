/* Pure geometry/FSM regression. Synthetic coordinates, not a camera benchmark. */
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {Engine,features}=require('../js/multimodal/gesture-engine.js');
const results=[];
function check(name,test){try{test();results.push({test:name,passed:true});console.log('PASS',name);}catch(e){results.push({test:name,passed:false,error:e.message});console.error('FAIL',name,e.message);}}
function fixture(){const log=[];const cb=new Proxy({}, {get:(_,key)=>(...args)=>log.push({name:key,args})});const e=new Engine(cb,{mirror:false,smoothing:.6,bounds:{left:0,right:1,top:0,bottom:1}});return {e,log};}
const f=(shape='point',x=.5,y=.5,sep=.4,pinch=1)=>({shape,index:{x,y},mid:{x,y},separation:sep,pinch});
function ready(e){e.step(f(),0);e.step(f(),250);}
function events(log,name){return log.filter(x=>x.name===name);}
check('No click until pointing posture arms the engine',()=>{const {e,log}=fixture();e.step(f('pinch',.5,.5,.4,.1),0);e.step(f('pinch',.5,.5,.4,.1),100);e.step(f(),300);assert.equal(events(log,'click').length,0);});
check('Short index/thumb pinch emits exactly one click',()=>{const {e,log}=fixture();ready(e);e.step(f('pinch',.5,.5,.4,.1),300);e.step(f('pinch',.5,.5,.4,.1),400);e.step(f(),550);e.step(f(),900);assert.equal(events(log,'click').length,1);});
check('Held moving pinch starts drag and releases without click',()=>{const {e,log}=fixture();ready(e);e.step(f('pinch',.5,.5,.4,.1),300);e.step(f('pinch',.5,.5,.4,.1),400);e.step(f('pinch',.6,.5,.4,.1),700);e.step(f('point',.6,.5),850);assert.equal(events(log,'click').length,0);assert.equal(events(log,'dragStart').length,1);assert.equal(events(log,'dragEnd').length,1);});
check('Tracking loss cancels a pressed pinch without click',()=>{const {e,log}=fixture();ready(e);e.step(f('pinch',.5,.5,.4,.1),300);e.step(f('pinch',.5,.5,.4,.1),400);e.step(null,700);e.step(f(),900);assert.equal(events(log,'click').length,0);assert.ok(events(log,'cancel').length);});
check('Lost tracking cannot leave the cursor visible',()=>{const {e,log}=fixture();ready(e);e.step(null,600);assert.equal(events(log,'visible').at(-1).args[0],false);assert.equal(e.pinch,null);assert.equal(e.armed,false);});
check('Open palm pauses and held index resumes',()=>{const {e}=fixture();ready(e);e.step(f('palm'),300);e.step(f('palm'),900);assert.equal(e.paused,true);e.step(f(),1000);e.step(f(),2100);assert.equal(e.paused,false);});
check('Fist stops reading and cancels gesture',()=>{const {e,log}=fixture();ready(e);e.step(f('fist'),300);e.step(f('fist'),600);assert.equal(events(log,'stopReading').length,1);assert.ok(events(log,'cancel').length);});
check('Two fingers vertical travel chooses scroll only',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.55),550);e.step(f('two',.5,.6),650);assert.ok(events(log,'scroll').length);assert.equal(events(log,'zoom').length,0);assert.equal(events(log,'pan').length,0);});
check('Two fingers horizontal travel chooses pan only',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.55,.5),550);e.step(f('two',.6,.5),650);assert.ok(events(log,'pan').length);assert.equal(events(log,'scroll').length,0);});
check('Spreading INDEX AND MIDDLE emits zoom in (factor below one)',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.5,.5),550);e.step(f('two',.5,.5,.7),650);assert.ok(events(log,'zoom')[0].args[0]<1);assert.equal(events(log,'scroll').length,0);});
check('Bringing the same two fingers together emits zoom out',()=>{const {e,log}=fixture();ready(e);e.step(f('two',.5,.5,.7),300);e.step(f('two',.5,.5,.7),450);e.step(f('two',.5,.5,.5),550);e.step(f('two',.5,.5,.35),650);assert.ok(events(log,'zoom')[0].args[0]>1);});
check('A chosen scroll is not also turned into zoom',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.55),550);e.step(f('two',.5,.6,.8),650);assert.ok(events(log,'scroll').length);assert.equal(events(log,'zoom').length,0);});
check('Cursor mapping respects calibration and mirror',()=>{const {e}=fixture();e.configure({mirror:true,bounds:{left:.2,right:.8,top:.2,bottom:.8}});const p=e.map({x:.8,y:.2},{width:1000,height:1000});assert.ok(p.x<3&&p.y<3);const q=e.map({x:.2,y:.8},{width:1000,height:1000});assert.ok(q.x>997&&q.y>997);});
check('Invalid / missing landmark arrays are rejected',()=>{assert.equal(features(null),null);assert.equal(features([]),null);assert.equal(features(Array(21).fill({x:NaN,y:1})),null);});
function hand(){const a=Array.from({length:21},()=>({x:.5,y:.6,z:0}));a[0]={x:.5,y:.85,z:0};for(let f=0;f<4;f++){const base=5+f*4;for(let j=0;j<4;j++)a[base+j]={x:.38+f*.08,y:.65-j*.105,z:0};}a[4]={x:.2,y:.55,z:0};return a;}
check('Open-hand geometry classifies as palm',()=>assert.equal(features(hand()).shape,'palm'));
check('Normalized finger separation is invariant to uniform hand scale',()=>{const lm=hand(),b=lm.map(p=>({x:p.x*1.4+.1,y:p.y*1.4-.1,z:p.z*1.4}));assert.ok(Math.abs(features(lm).separation-features(b).separation)<1e-10);});
check('World coordinates remove camera depth scaling from zoom measure',()=>{const world=hand(),lm=world.map(p=>({...p})),scaled=lm.map(p=>({x:p.x*.65,y:p.y*.65,z:p.z*.65}));assert.equal(features(lm,world).separation,features(scaled,world).separation);});
const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'multimodal-gestures.json'),JSON.stringify(results,null,2));if(results.some(x=>!x.passed))process.exitCode=1;
