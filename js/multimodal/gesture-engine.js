/* Pure hand geometry + deterministic gesture state machine.
 * Click: raised INDEX + THUMB open -> folded towards PALM -> open.
 * Index/middle separation remains the ONLY zoom gesture. No tip-to-tip pinch.
 * Coordinates are normalized to the palm, not the camera's image axes.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.EIAGestures=api;
})(globalThis,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:(a.z||0)-(b.z||0)});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=a=>Math.hypot(a.x,a.y,a.z);
const unit=a=>{const n=norm(a);return n>1e-8?{x:a.x/n,y:a.y/n,z:a.z/n}:null;};
function angle(a,b,c){
  const u=sub(a,b),v=sub(c,b);
  return Math.acos(clamp(dot(u,v)/(norm(u)*norm(v)||1),-1,1))*180/Math.PI;
}
const THUMB={open:.82,closed:.46,openMs:120,closeMs:70,releaseMs:70,cooldownMs:650};
function thumbGeometry(p,scale){
  // Across always points from the little-finger side towards the index side.
  // Therefore handedness, image mirroring and camera roll do not flip the test.
  const along=unit(sub(p[9],p[0]));
  if(!along)return null;
  const side=sub(p[5],p[17]),projection=dot(side,along);
  const across=unit({x:side.x-projection*along.x,y:side.y-projection*along.y,z:side.z-projection*along.z});
  if(!across)return null;
  const center=[0,5,9,13,17].reduce((s,i)=>({x:s.x+p[i].x/5,y:s.y+p[i].y/5,z:s.z+(p[i].z||0)/5}),{x:0,y:0,z:0});
  const spread=dot(sub(p[4],center),across)/scale;
  const length=dist(p[0],p[9]);
  const reach=dot(sub(p[4],p[0]),along)/Math.max(length,1e-8);
  // A thumb touching the raised index TIP is outside this palm band. It must
  // not be accepted as a closed thumb, even when the two tips are very close.
  const nearPalm=reach>=-.15&&reach<=1.35&&dist(p[4],center)/scale<=.95;
  const state=spread>=THUMB.open?'open':spread<=THUMB.closed&&nearPalm?'closed':'transition';
  return {thumbState:state,thumbSpread:spread,thumbReach:reach,thumbNearPalm:nearPalm};
}
function features(lm,world,aspect=4/3){
  if(!Array.isArray(lm)||lm.length!==21||lm.some(p=>!p||![p.x,p.y].every(Number.isFinite)||(p.z!==undefined&&!Number.isFinite(p.z))))return null;
  aspect=Number.isFinite(aspect)&&aspect>0?aspect:4/3;
  const validWorld=Array.isArray(world)&&world.length===21&&world.every(p=>p&&[p.x,p.y,p.z].every(Number.isFinite));
  const p=validWorld?world:lm.map(p=>({x:p.x*aspect,y:p.y,z:(p.z||0)*aspect}));
  const scale=Math.max(dist(p[5],p[17]),dist(p[0],p[9])*.75);
  if(scale<1e-8)return null;
  const thumb=thumbGeometry(p,scale);
  if(!thumb)return null;
  const extended=[5,9,13,17].map(i=>angle(p[i],p[i+1],p[i+3])>150&&dist(p[0],p[i+3])>dist(p[0],p[i+1])*1.13);
  const [index,middle,ring,pinky]=extended;
  let shape='neutral';
  if(index&&middle&&ring&&pinky)shape='palm';
  else if(index&&middle&&!ring&&!pinky)shape='two';
  else if(index&&!middle&&!ring&&!pinky)shape='point';
  else if(extended.every(v=>!v))shape='fist';
  return {shape,...thumb,separation:dist(p[8],p[12])/scale,index:lm[8],mid:{x:(lm[8].x+lm[12].x)/2,y:(lm[8].y+lm[12].y)/2},extended,palmScale:scale};
}
class Engine{
  constructor(callbacks={},options={}){
    this.cb=callbacks;
    this.options={mirror:true,smoothing:.32,sensitivity:1,bounds:{left:.14,right:.86,top:.12,bottom:.88},...options};
    this.paused=false;
    this.reset();
  }
  emit(name,...args){return this.cb[name]?.(...args);}
  resetThumb(cancel=true){
    if(this.thumbPress){if(cancel)this.emit('cancel');this.emit('release');}
    this.thumbPress=null;this.thumbReady=false;this.thumbState=null;this.thumbSince=0;
  }
  reset(){
    this.resetThumb();
    if(this.two)this.emit('cancel');
    this.two=null;this.cursor=null;this.rawShape=null;this.since=0;this.lastSeen=0;
    this.lost=true;this.armed=false;this.palmFired=false;this.fistFired=false;this.lastClick=-Infinity;
  }
  configure(o){this.options={...this.options,...o};this.reset();}
  pause(value=true){this.paused=value;this.reset();this.emit('pause',value);}
  map(p,s){
    const b=this.options.bounds,x=this.options.mirror?1-p.x:p.x;
    return {x:clamp((x-b.left)/(b.right-b.left),.002,.998)*s.width,y:clamp((p.y-b.top)/(b.bottom-b.top),.002,.998)*s.height};
  }
  update(lm,world,t,s={width:1280,height:720},aspect=4/3){return this.step(features(lm,world,aspect),t,s);}
  step(f,t,s={width:1280,height:720}){
    if(!Number.isFinite(t))return;
    if(!f||!f.index||![f.index.x,f.index.y].every(Number.isFinite)){
      this.emit('visible',false);
      // Never complete a press across a missing detection, even a single frame.
      if(!this.lost){this.reset();this.emit('status','Sin mano');this.emit('lost');}
      return;
    }
    this.lastSeen=t;
    if(this.lost){this.lost=false;this.since=t;this.rawShape=f.shape;this.emit('status','Coloca el \u00edndice');}
    if(f.shape!==this.rawShape){this.rawShape=f.shape;this.since=t;this.palmFired=false;this.fistFired=false;}
    const held=t-this.since;
    // Thumb cycles are valid ONLY with a single, continuously raised index.
    if(f.shape!=='point')this.resetThumb();
    if(f.shape==='palm'&&held>=550&&!this.palmFired){
      this.palmFired=true;
      if(!this.paused){this.pause(true);this.emit('status','En pausa: \u00edndice 1 s para reanudar');}
      return;
    }
    if(f.shape==='fist'&&held>=260&&!this.fistFired){
      this.fistFired=true;this.emit('cancel');this.emit('stopReading');this.two=null;this.armed=false;this.emit('status','Cancelado');return;
    }
    if(this.paused){
      this.emit('visible',false);
      if(f.shape==='point'&&held>=1000){this.pause(false);this.emit('status','Control reanudado');}
      return;
    }
    if(!['point','two'].includes(f.shape)){
      if(held>160){if(this.two)this.emit('cancel');this.two=null;this.emit('dwell',null,t);this.armed=false;this.emit('visible',false);}
      return;
    }
    this.emit('visible',true);
    if(!this.armed&&f.shape==='point'&&held>=180)this.armed=true;
    const raw=this.map(f.index,s),a=clamp(this.options.smoothing,.12,.75);
    if(!this.cursor)this.cursor={...raw};
    if(!this.thumbPress&&!this.two){
      this.cursor.x+=(raw.x-this.cursor.x)*a;this.cursor.y+=(raw.y-this.cursor.y)*a;
      this.emit('cursor',{...this.cursor});
    }
    if(f.shape==='two'&&held>=100&&this.armed){
      this.emit('dwell',null,t);
      if(!f.mid||!Number.isFinite(f.separation)||f.separation<=0)return;
      const mid=this.map(f.mid,s);
      if(!this.two){
        this.two={start:mid,last:mid,sep:Math.max(f.separation,.08),lastSep:Math.max(f.separation,.08),mode:null,time:t,anchor:{...this.cursor}};
        this.emit('twoStart',this.two.anchor);this.emit('status','Dos dedos: mueve o separa');return;
      }
      const g=this.two,dx=mid.x-g.start.x,dy=mid.y-g.start.y,logRatio=Math.log(Math.max(f.separation,.08)/g.sep);
      if(!g.mode){
        if(Math.abs(logRatio)>.12&&Math.abs(logRatio)*180>Math.hypot(dx,dy)*.7)g.mode='zoom';
        else if(Math.hypot(dx,dy)>14)g.mode=Math.abs(dx)>Math.abs(dy)*1.2?'pan':'scroll';
        if(g.mode){
          g.last={...mid};g.lastSep=Math.max(f.separation,.08);
          this.emit('status',{zoom:'Zoom: \u00edndice y medio',pan:'Desplazamiento horizontal',scroll:'Desplazamiento vertical'}[g.mode]);
        }
        return;
      }
      if(g.mode==='zoom'){
        const ratio=clamp(Math.pow(g.lastSep/Math.max(f.separation,.08),this.options.sensitivity),.88,1.14);
        if(Math.abs(1-ratio)>.008){this.emit('zoom',ratio,g.anchor);g.lastSep=Math.max(f.separation,.08);}
      }else{
        const d={x:mid.x-g.last.x,y:mid.y-g.last.y};
        if(Math.hypot(d.x,d.y)>1.5){this.emit(g.mode,d,g.anchor);g.last={...mid};}
      }
      this.emit('cursor',g.anchor);return;
    }
    if(f.shape==='two')return;
    if(this.two){
      if(held<120)return;
      this.emit('twoEnd');this.two=null;this.cursor={...raw};this.resetThumb();
    }
    const state=['open','closed','transition'].includes(f.thumbState)?f.thumbState:'transition';
    if(state!==this.thumbState){this.thumbState=state;this.thumbSince=t;}
    const thumbHeld=t-this.thumbSince;
    if(!this.thumbPress&&state==='open'&&thumbHeld>=THUMB.openMs&&this.armed&&t-this.lastClick>THUMB.cooldownMs)this.thumbReady=true;
    if(!this.thumbPress&&state==='closed'&&thumbHeld>=THUMB.closeMs&&this.thumbReady&&this.armed&&t-this.lastClick>THUMB.cooldownMs){
      this.thumbPress={anchor:{...this.cursor},raw:{...raw},start:t,drag:false,maxMovement:0};
      this.thumbReady=false;this.emit('press',this.thumbPress.anchor);
      this.emit('status','Pulgar cerrado: abre para hacer clic');this.emit('dwell',null,t);return;
    }
    if(this.thumbPress){
      const p=this.thumbPress,dx=raw.x-p.raw.x,dy=raw.y-p.raw.y,movement=Math.hypot(dx,dy);
      p.maxMovement=Math.max(p.maxMovement,movement);
      if(state==='open'&&thumbHeld>=THUMB.releaseMs){
        if(p.drag)this.emit('dragEnd');
        else if(t-p.start>=70&&t-p.start<900&&p.maxMovement<32){this.emit('click',p.anchor);this.lastClick=t;}
        this.emit('release');this.thumbPress=null;this.thumbReady=false;this.cursor={...raw};
        // Every new click requires a distinct stable open posture again.
        this.thumbSince=t;this.emit('status','Apuntar');return;
      }
      if(state==='transition'&&thumbHeld>350){
        this.resetThumb();this.emit('status','Gesto cancelado: abre el pulgar');return;
      }
      if(!p.drag&&t-p.start>=900&&p.maxMovement<12){
        this.resetThumb();this.emit('status','Abre el pulgar para otro clic');return;
      }
      if(state==='closed'){
        if(!p.drag&&t-p.start>230&&movement>12){p.drag=true;this.emit('dragStart',p.anchor);this.emit('status','Arrastrando con pulgar cerrado');}
        if(p.drag){
          const q={x:clamp(p.anchor.x+dx,0,s.width),y:clamp(p.anchor.y+dy,0,s.height)};
          this.emit('drag',q);this.emit('cursor',q);
        }
      }
      return;
    }
    if(held>=100){
      this.emit('hover',this.cursor);
      if(state==='closed'){
        this.emit('dwell',null,t);this.emit('status','Abre el pulgar para preparar el clic');
      }else{
        this.emit('dwell',this.cursor,t);
        this.emit('status',this.thumbReady?'Apuntar \u00b7 cierra el pulgar':'Apuntar');
      }
    }
  }
}
return {Engine,features,thumbGeometry,THUMB,dist,angle,clamp};
});
