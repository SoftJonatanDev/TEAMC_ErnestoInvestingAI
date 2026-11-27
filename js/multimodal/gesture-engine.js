/* Deterministic gesture geometry and state machine. No DOM, camera or finance. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EIAGestures=api;})(globalThis,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
function angle(a,b,c){const u=[a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0)],v=[c.x-b.x,c.y-b.y,(c.z||0)-(b.z||0)];return Math.acos(clamp(u.reduce((s,x,i)=>s+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)||1),-1,1))*180/Math.PI;}
function features(lm,world,aspect=4/3){
 if(!Array.isArray(lm)||lm.length!==21||lm.some(p=>![p.x,p.y].every(Number.isFinite)))return null;
 const p=world?.length===21&&world.every(p=>[p.x,p.y,p.z].every(Number.isFinite))?world:lm.map(p=>({x:p.x*aspect,y:p.y,z:(p.z||0)*aspect}));
 const scale=Math.max(dist(p[5],p[17]),dist(p[0],p[9])*.75,.0001);
 const extended=[5,9,13,17].map(i=>angle(p[i],p[i+1],p[i+3])>150&&dist(p[0],p[i+3])>dist(p[0],p[i+1])*1.13);
 const pinch=dist(p[4],p[8])/scale,separation=dist(p[8],p[12])/scale;
 const [index,middle,ring,pinky]=extended;let shape='neutral';
 if(index&&middle&&ring&&pinky)shape='palm';
 else if(index&&middle&&!ring&&!pinky)shape='two';
 else if(!middle&&!ring&&!pinky&&pinch<.48&&(index||dist(p[0],p[8])>dist(p[0],p[6])*1.02))shape='pinch';
 else if(index&&!middle&&!ring&&!pinky)shape='point';
 else if(extended.every(v=>!v))shape='fist';
 return {shape,pinch,separation,index:lm[8],mid:{x:(lm[8].x+lm[12].x)/2,y:(lm[8].y+lm[12].y)/2},extended,palmScale:scale};
}
class Engine{
 constructor(callbacks={},options={}){this.cb=callbacks;this.options={mirror:true,smoothing:.32,sensitivity:1,bounds:{left:.14,right:.86,top:.12,bottom:.88},...options};this.paused=false;this.reset();}
 emit(name,...args){return this.cb[name]?.(...args);}
 reset(){if(this.pinch||this.two)this.emit('cancel');this.pinch=null;this.two=null;this.cursor=null;this.rawShape=null;this.since=0;this.lastSeen=0;this.lost=true;this.armed=false;this.palmFired=false;this.fistFired=false;this.lastClick=-Infinity;}
 configure(o){this.options={...this.options,...o};this.reset();}
 pause(value=true){this.paused=value;this.reset();this.emit('pause',value);}
 map(p,s){const b=this.options.bounds,x=this.options.mirror?1-p.x:p.x;return {x:clamp((x-b.left)/(b.right-b.left),.002,.998)*s.width,y:clamp((p.y-b.top)/(b.bottom-b.top),.002,.998)*s.height};}
 update(lm,world,t,s={width:1280,height:720},aspect=4/3){return this.step(features(lm,world,aspect),t,s);}
 step(f,t,s={width:1280,height:720}){
  if(!f){this.emit('visible',false);if(!this.lost&&t-this.lastSeen>180){this.reset();this.emit('status','Sin mano');this.emit('lost');}return;}
  this.lastSeen=t;if(this.lost){this.lost=false;this.since=t;this.rawShape=f.shape;this.emit('status','Coloca el índice');}
  if(f.shape!==this.rawShape){this.rawShape=f.shape;this.since=t;this.palmFired=false;this.fistFired=false;}
  const held=t-this.since;
  if(f.shape==='palm'&&held>=550&&!this.palmFired){this.palmFired=true;if(!this.paused){this.pause(true);this.emit('status','En pausa: índice 1 s para reanudar');}return;}
  if(f.shape==='fist'&&held>=260&&!this.fistFired){this.fistFired=true;this.emit('cancel');this.emit('stopReading');this.pinch=null;this.two=null;this.armed=false;this.emit('status','Cancelado');return;}
  if(this.paused){this.emit('visible',false);if(f.shape==='point'&&held>=1000){this.pause(false);this.emit('status','Control reanudado');}return;}
  if(['palm','fist','neutral'].includes(f.shape)){if(held>160){if(this.pinch||this.two)this.emit('cancel');this.pinch=null;this.two=null;this.emit('dwell',null,t);this.armed=false;this.emit('visible',false);}return;}
  this.emit('visible',true);
  if(!this.armed&&f.shape==='point'&&held>=180)this.armed=true;
  const raw=this.map(f.index,s),a=clamp(this.options.smoothing,.12,.75);
  if(!this.cursor)this.cursor={...raw};
  if(!this.pinch&&!this.two){this.cursor.x+=(raw.x-this.cursor.x)*a;this.cursor.y+=(raw.y-this.cursor.y)*a;this.emit('cursor',{...this.cursor});}
  if(f.shape==='two'&&held>=100&&this.armed){
   if(this.pinch){this.emit('cancel');this.pinch=null;}this.emit('dwell',null,t);
   const mid=this.map(f.mid,s);
   if(!this.two){this.two={start:mid,last:mid,sep:Math.max(f.separation,.08),lastSep:Math.max(f.separation,.08),mode:null,time:t,anchor:{...this.cursor}};this.emit('twoStart',this.two.anchor);this.emit('status','Dos dedos: mueve o separa');return;}
   const g=this.two,dx=mid.x-g.start.x,dy=mid.y-g.start.y,logRatio=Math.log(Math.max(f.separation,.08)/g.sep);
   if(!g.mode){
    if(Math.abs(logRatio)>.12&&Math.abs(logRatio)*180>Math.hypot(dx,dy)*.7)g.mode='zoom';
    else if(Math.hypot(dx,dy)>14)g.mode=Math.abs(dx)>Math.abs(dy)*1.2?'pan':'scroll';
    if(g.mode){g.last={...mid};g.lastSep=Math.max(f.separation,.08);this.emit('status',{zoom:'Zoom: índice y medio',pan:'Desplazamiento horizontal',scroll:'Desplazamiento vertical'}[g.mode]);}return;
   }
   if(g.mode==='zoom'){const ratio=clamp(Math.pow(g.lastSep/Math.max(f.separation,.08),this.options.sensitivity),.88,1.14);if(Math.abs(1-ratio)>.008){this.emit('zoom',ratio,g.anchor);g.lastSep=Math.max(f.separation,.08);}}
   else{const d={x:mid.x-g.last.x,y:mid.y-g.last.y};if(Math.hypot(d.x,d.y)>1.5){this.emit(g.mode,d,g.anchor);g.last={...mid};}}
   this.emit('cursor',g.anchor);return;
  }
  if(f.shape==='two')return;
  if(this.two){if(held<120)return;this.emit('twoEnd');this.two=null;this.cursor={...raw};}
  const close=f.pinch<.30,opened=f.pinch>.46||f.shape==='point';
  if(!this.pinch&&close&&this.armed&&held>=65&&t-this.lastClick>650){this.pinch={anchor:{...this.cursor},raw:{...raw},start:t,drag:false};this.emit('press',this.pinch.anchor);this.emit('status','Pinza');this.emit('dwell',null,t);return;}
  if(this.pinch){const p=this.pinch,dx=raw.x-p.raw.x,dy=raw.y-p.raw.y,movement=Math.hypot(dx,dy);
   if(opened){if(p.drag)this.emit('dragEnd');else if(t-p.start>=70&&t-p.start<900&&movement<32){this.emit('click',p.anchor);this.lastClick=t;}this.emit('release');this.pinch=null;this.cursor={...raw};this.emit('status','Apuntar');return;}
   if(!p.drag&&t-p.start>230&&movement>12){p.drag=true;this.emit('dragStart',p.anchor);this.emit('status','Arrastrando');}
   if(p.drag){const q={x:clamp(p.anchor.x+dx,0,s.width),y:clamp(p.anchor.y+dy,0,s.height)};this.emit('drag',q);this.emit('cursor',q);}return;
  }
  if(f.shape==='point'&&held>=100){this.emit('hover',this.cursor);this.emit('dwell',this.cursor,t);this.emit('status',this.armed?'Apuntar':'Estabilizando');}
 }
}
return {Engine,features,dist,angle,clamp};
});
