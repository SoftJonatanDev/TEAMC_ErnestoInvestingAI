/* Thumb/palm regression. Synthetic geometry, NOT a physical-camera benchmark. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Engine,features}=require('../js/multimodal/gesture-engine.js');
const results=[];
function check(name,test){try{test();results.push({test:name,passed:true});console.log('PASS',name);}catch(e){results.push({test:name,passed:false,error:e.message});console.error('FAIL',name,e.stack);}}
function fixture(){const log=[];const cb=new Proxy({}, {get:(_,key)=>(...args)=>log.push({name:key,args})});const e=new Engine(cb,{mirror:false,smoothing:.6,bounds:{left:0,right:1,top:0,bottom:1}});return {e,log};}
const f=(shape='point',x=.5,y=.5,sep=.4,thumb='open')=>({shape,index:{x,y},mid:{x,y},separation:sep,thumbState:thumb});
const thumb=(state,x=.5,y=.5)=>f('point',x,y,.4,state);
const events=(log,name)=>log.filter(x=>x.name===name);
function ready(e,t=0){e.step(thumb('open'),t);e.step(thumb('open'),t+250);}
function press(e,t=300){e.step(thumb('closed'),t);e.step(thumb('closed'),t+100);}
function release(e,t=520,x=.5){e.step(thumb('open',x),t);e.step(thumb('open',x),t+80);}
check('Open -> palm-closed -> open with raised index emits ONE click',()=>{const {e,log}=fixture();ready(e);press(e);release(e);e.step(thumb('open'),900);assert.equal(events(log,'click').length,1);assert.equal(events(log,'press').length,1);assert.equal(events(log,'release').length,1);});
check('A closed thumb on first appearance cannot click',()=>{const {e,log}=fixture();e.step(thumb('closed'),0);e.step(thumb('closed'),250);release(e);assert.equal(events(log,'click').length,0);assert.equal(events(log,'press').length,0);});
check('A fresh open posture is required after every click',()=>{const {e,log}=fixture();ready(e);press(e);release(e);e.step(thumb('closed'),800);e.step(thumb('closed'),950);release(e,1100);assert.equal(events(log,'click').length,1);});
check('Two intentional thumb cycles produce two clicks after cooldown',()=>{const {e,log}=fixture();ready(e);press(e);release(e);e.step(thumb('open'),1400);press(e,1500);release(e,1720);assert.equal(events(log,'click').length,2);});
check('Stable closed thumb does not repeat clicks',()=>{const {e,log}=fixture();ready(e);press(e);for(let t=500;t<5000;t+=80)e.step(thumb('closed'),t);assert.equal(events(log,'click').length,0);assert.equal(events(log,'press').length,1);});
check('Very brief closed-thumb jitter is ignored',()=>{const {e,log}=fixture();ready(e);e.step(thumb('closed'),300);e.step(thumb('closed'),330);release(e,350);assert.equal(events(log,'click').length,0);assert.equal(events(log,'press').length,0);});
check('Release must also remain stable (hysteresis)',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('open'),520);e.step(thumb('closed'),560);assert.equal(events(log,'click').length,0);release(e,650);assert.equal(events(log,'click').length,1);});
check('Old fingertip pinch feature never triggers a click',()=>{const {e,log}=fixture();ready(e);for(const t of [300,400,500])e.step({...f('pinch'),pinch:.01},t);release(e,700);assert.equal(events(log,'click').length,0);});
check('Close index/thumb tips alone are not used by the new engine',()=>{const {e,log}=fixture();ready(e);for(const t of [300,400,500])e.step({...thumb('transition'),pinch:.01},t);release(e,700);assert.equal(events(log,'click').length,0);});
check('Click cannot start until index pointing is armed',()=>{const {e,log}=fixture();e.step(thumb('open'),0);e.step(thumb('closed'),60);e.step(thumb('closed'),160);release(e,220);assert.equal(events(log,'click').length,0);});
check('Lowering index cancels pending click immediately',()=>{const {e,log}=fixture();ready(e);press(e);e.step(f('fist'),460);release(e,520);assert.equal(events(log,'click').length,0);assert.ok(events(log,'cancel').length);});
check('Neutral / unsupported posture cancels pending click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(f('neutral'),460);release(e,520);assert.equal(events(log,'click').length,0);assert.equal(e.thumbPress,null);});
check('Switching to index-middle gestures cannot complete a click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(f('two'),460);e.step(f('two'),580);release(e,700);assert.equal(events(log,'click').length,0);});
check('Thumb closure while index+middle extended never clicks',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);for(const t of [500,650])e.step(f('two',.5,.5,.4,'closed'),t);e.step(f('two'),800);release(e,1000);assert.equal(events(log,'click').length,0);});
check('Tracking loss cancels even a one-frame pending click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(null,420);release(e,450);assert.equal(events(log,'click').length,0);assert.ok(events(log,'cancel').length);});
check('Loss hides cursor, releases visual press, and disarms',()=>{const {e,log}=fixture();ready(e);press(e);e.step(null,450);assert.equal(events(log,'visible').at(-1).args[0],false);assert.equal(e.thumbPress,null);assert.equal(e.thumbReady,false);assert.equal(e.armed,false);assert.equal(events(log,'release').length,1);});
check('Reconfiguration cancels an active click',()=>{const {e,log}=fixture();ready(e);press(e);e.configure({smoothing:.4});release(e,520);assert.equal(events(log,'click').length,0);});
check('Long stationary press is cancelled, not deferred until release',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('closed'),1400);release(e,1500);assert.equal(events(log,'click').length,0);assert.equal(e.thumbPress,null);});
check('Ambiguous thumb posture for too long cancels a press',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('transition'),450);e.step(thumb('transition'),810);release(e,850);assert.equal(events(log,'click').length,0);});
check('Cursor excursion then return cannot accidentally become a click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('closed',.56),450);e.step(thumb('closed'),500);release(e);assert.equal(events(log,'click').length,0);assert.equal(events(log,'dragStart').length,0);});
check('Held palm-folded thumb plus motion starts drag, no extra click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('closed',.6),700);e.step(thumb('closed',.65),750);release(e,820,.65);assert.equal(events(log,'click').length,0);assert.equal(events(log,'dragStart').length,1);assert.ok(events(log,'drag').length>=2);assert.equal(events(log,'dragEnd').length,1);});
check('Interrupted drag is cancelled without click',()=>{const {e,log}=fixture();ready(e);press(e);e.step(thumb('closed',.6),700);e.step(null,750);release(e,900);assert.equal(events(log,'click').length,0);assert.ok(events(log,'cancel').length);});
check('Open palm pauses; one held index resumes',()=>{const {e}=fixture();ready(e);e.step(f('palm'),300);e.step(f('palm'),900);assert.equal(e.paused,true);e.step(f(),1000);e.step(f(),2100);assert.equal(e.paused,false);});
check('Fist cancels gesture and stops reading',()=>{const {e,log}=fixture();ready(e);e.step(f('fist'),300);e.step(f('fist'),600);assert.equal(events(log,'stopReading').length,1);assert.ok(events(log,'cancel').length);});
check('Paused engine cannot perform thumb click',()=>{const {e,log}=fixture();ready(e);e.pause(true);press(e);release(e);assert.equal(events(log,'click').length,0);});
check('Index-middle vertical motion chooses scroll only',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.55),550);e.step(f('two',.5,.6),650);assert.ok(events(log,'scroll').length);assert.equal(events(log,'zoom').length,0);assert.equal(events(log,'pan').length,0);});
check('Index-middle horizontal motion chooses pan only',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.55,.5),550);e.step(f('two',.6,.5),650);assert.ok(events(log,'pan').length);assert.equal(events(log,'scroll').length,0);});
check('Spreading the SAME index and middle fingers zooms in',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.5,.5),550);e.step(f('two',.5,.5,.7),650);assert.ok(events(log,'zoom')[0].args[0]<1);assert.equal(events(log,'scroll').length,0);});
check('Bringing index and middle together zooms out',()=>{const {e,log}=fixture();ready(e);e.step(f('two',.5,.5,.7),300);e.step(f('two',.5,.5,.7),450);e.step(f('two',.5,.5,.5),550);e.step(f('two',.5,.5,.35),650);assert.ok(events(log,'zoom')[0].args[0]>1);});
check('Chosen scroll cannot simultaneously become zoom',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(f('two',.5,.55),550);e.step(f('two',.5,.6,.8),650);assert.ok(events(log,'scroll').length);assert.equal(events(log,'zoom').length,0);});
check('Returning from two fingers requires a new thumb cycle',()=>{const {e,log}=fixture();ready(e);e.step(f('two'),300);e.step(f('two'),450);e.step(thumb('closed'),550);e.step(thumb('closed'),750);release(e,800);assert.equal(events(log,'click').length,0);});
check('Cursor mapping retains calibration, mirror and screen limits',()=>{const {e}=fixture();e.configure({mirror:true,bounds:{left:.2,right:.8,top:.2,bottom:.8}});const p=e.map({x:.8,y:.2},{width:1000,height:1000});assert.ok(p.x<3&&p.y<3);const q=e.map({x:.2,y:.8},{width:1000,height:1000});assert.ok(q.x>997&&q.y>997);});
check('Invalid and degenerate landmark arrays are rejected',()=>{assert.equal(features(null),null);assert.equal(features([]),null);assert.equal(features(Array(21).fill(null)),null);assert.equal(features(Array(21).fill({x:NaN,y:1})),null);assert.equal(features(Array(21).fill({x:.5,y:.5,z:0})),null);});
function hand(state='open',shape='point'){
 const a=Array.from({length:21},()=>({x:.5,y:.6,z:0}));a[0]={x:.5,y:.85,z:0};
 for(let i=0;i<4;i++){
  const base=5+i*4,ext=shape==='palm'||(shape==='point'&&i===0)||(shape==='two'&&i<2);
  for(let j=0;j<4;j++)a[base+j]={x:.38+i*.08,y:ext?.65-j*.105:[.65,.59,.69,.73][j],z:0};
 }
 a[1]={x:.42,y:.78,z:0};a[2]={x:.32,y:.72,z:0};a[3]={x:.24,y:.67,z:0};
 a[4]=state==='closed'?{x:.48,y:.70,z:0}:state==='pinchtip'?{...a[8]}:{x:.15,y:.62,z:0};
 return a;
}
check('Geometry recognizes index-up and thumb open to palm side',()=>{const q=features(hand());assert.equal(q.shape,'point');assert.equal(q.thumbState,'open');});
check('Geometry recognizes thumb folded towards palm, index still up',()=>{const q=features(hand('closed'));assert.equal(q.shape,'point');assert.equal(q.thumbState,'closed');assert.equal(q.thumbNearPalm,true);});
check('Touching thumb to raised INDEX TIP is NOT palm closure',()=>{const q=features(hand('pinchtip'));assert.equal(q.shape,'point');assert.notEqual(q.thumbState,'closed');assert.equal(q.thumbNearPalm,false);});
check('Mirrored left/right hand geometry gives same thumb state',()=>{for(const state of ['open','closed']){const h=hand(state),mirrored=h.map(p=>({...p,x:1-p.x}));assert.equal(features(h).thumbState,features(mirrored).thumbState);}});
check('Palm-local thumb geometry survives scale and rotation in 3D world coordinates',()=>{
 for(const state of ['open','closed'])for(const scale of [.4,1,2.1])for(const deg of [-120,-45,0,55,130]){
  const h=hand(state),rad=deg*Math.PI/180,world=h.map(p=>({x:scale*(p.x*Math.cos(rad)-p.y*Math.sin(rad))+.4,y:scale*(p.x*Math.sin(rad)+p.y*Math.cos(rad))-.2,z:scale*p.z+.3}));
  assert.equal(features(h,world).thumbState,state,`${state}, scale=${scale}, rotation=${deg}`);
 }
});
check('World palm geometry makes thumb state independent of image size',()=>{const world=hand('closed'),small=world.map(p=>({x:p.x*.45,y:p.y*.45,z:p.z*.45}));assert.equal(features(small,world).thumbState,features(world,world).thumbState);});
check('Open-hand geometry still classifies as palm',()=>assert.equal(features(hand('open','palm')).shape,'palm'));
check('Two-finger geometry still identifies index and middle',()=>assert.equal(features(hand('closed','two')).shape,'two'));
check('Finger separation remains uniform-scale invariant',()=>{const h=hand('open','two'),b=h.map(p=>({x:p.x*1.4+.1,y:p.y*1.4-.1,z:p.z*1.4}));assert.ok(Math.abs(features(h).separation-features(b).separation)<1e-10);});
check('Actual landmark open-close-open sequence reaches click FSM',()=>{const {e,log}=fixture();for(const t of [0,250])e.update(hand(),null,t);for(const t of [300,400])e.update(hand('closed'),null,t);for(const t of [520,600])e.update(hand(),null,t);assert.equal(events(log,'click').length,1);});
check('Actual old pinch landmarks cannot click even after arming',()=>{const {e,log}=fixture();for(const t of [0,250])e.update(hand(),null,t);for(const t of [300,400])e.update(hand('pinchtip'),null,t);for(const t of [520,600])e.update(hand(),null,t);assert.equal(events(log,'click').length,0);});
const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'multimodal-gestures.json'),JSON.stringify(results,null,2));
console.log(`Gesture checks: ${results.filter(x=>x.passed).length}/${results.length}`);if(results.some(x=>!x.passed))process.exitCode=1;
