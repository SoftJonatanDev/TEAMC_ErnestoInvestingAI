/* Bounded, accessible chart navigation for the locally bundled Plotly 3.x.
 * The viewport changes the view, NEVER the underlying financial data.
 * Native minallowed/maxallowed stop the pointer at the data edges while dragging.
 * Y is locked to an automatic fit of the visible observations (not freely pannable).
 */
(() => {
  'use strict';
  const controllers = new Map();
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const near = (a,b) => Math.abs(a-b) < 1e-7;
  const equal = (a,b) => Array.isArray(a) && Array.isArray(b) && near(+a[0],+b[0]) && near(+a[1],+b[1]);
  const extent = values => {
    let lo=Infinity, hi=-Infinity;
    for(const value of values) if(finite(value)){lo=Math.min(lo,value);hi=Math.max(hi,value);}
    return lo===Infinity ? null : [lo,hi];
  };
  function clampRange(input,bounds,minSpan=1){
    const [lo,hi]=bounds,total=hi-lo;
    if(!input || !input.every(finite) || input[1]<=input[0]) return [...bounds];
    const width=Math.min(total,Math.max(Math.min(minSpan,total),input[1]-input[0]));
    let left=(input[0]+input[1]-width)/2;
    left=Math.max(lo,Math.min(hi-width,left));
    return [left,left+width];
  }
  function padded([lo,hi], options={}){
    const span=hi-lo;
    const pad=Math.max(span * 0.075, Math.max(Math.abs(lo),Math.abs(hi))*0.002, 0.01);
    let a=lo-pad,b=hi+pad;
    if(options.positive) a=Math.max(0,a);
    if(finite(options.yMax)) b=options.yMax;
    if(finite(options.yMin)) a=options.yMin;
    if(b<=a) a=b-Math.max(pad,0.1);
    return [a,b];
  }
  function formatDate(label){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(label||'')) return String(label??'');
    return new Intl.DateTimeFormat(document.documentElement.lang||'es-PE',{
      day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'
    }).format(new Date(label+'T12:00:00Z'));
  }
  class Viewport {
    constructor(el){
      this.el=el; this.bound=false; this.applying=false; this.rendering=false;
      this.range=null; this.options={}; this.onRelayout=this.onRelayout.bind(this);
      this.onDoubleClick=()=>{this.reset();return false;};
      controllers.set(el,this);el._eiaViewport=this;
    }
    prepare(traces,layout,options={}){
      this.rendering=true;
      const oldKey=this.key;
      this.options=options;this.key=options.key||this.el.id;
      this.category=layout.xaxis.type==='category';
      this.labels=this.category?(options.labels||layout.xaxis.categoryarray||traces[0]?.x||[]):[];
      const index=new Map(this.labels.map((v,i)=>[v,i]));
      this.points=[];this.volume=[];
      for(const t of traces){
        if(t.visible===false || t.visible==='legendonly' || t._viewportIgnore) continue;
        const vol=t.yaxis==='y2';
        for(let i=0;i<(t.x?.length||0);i++){
          const x=this.category ? (index.get(t.x[i])??i) : +t.x[i];
          if(!finite(x)) continue;
          const lows=t.type==='candlestick'?t.low:t.y, highs=t.type==='candlestick'?t.high:t.y;
          if(finite(lows?.[i]) && finite(highs?.[i])) (vol?this.volume:this.points).push({x,lo:lows[i],hi:highs[i]});
        }
      }
      this.empty=this.points.length===0;
      const xs=this.points.map(p=>p.x);this.uniqueX=[...new Set(xs)].sort((a,b)=>a-b);
      const ex=extent(xs)||[0,1];
      this.bounds=this.category?[-0.5,Math.max(0.5,this.labels.length-0.5)]:padded(ex);
      this.minSpan=this.category?Math.min(options.minSpan||10,this.labels.length):Math.max((this.bounds[1]-this.bounds[0])*0.06,0.05);
      this.initial=clampRange(options.initialRange||this.bounds,this.bounds,this.minSpan);
      this.range=this.nonempty(clampRange(oldKey===this.key && this.range?this.range:this.initial,this.bounds,this.minSpan));
      const yr=this.yRange(this.range);
      layout.xaxis={...layout.xaxis,autorange:false,range:[...this.range],minallowed:this.bounds[0],maxallowed:this.bounds[1],fixedrange:this.empty,
        autorangeoptions:{minallowed:this.bounds[0],maxallowed:this.bounds[1]}};
      if(this.category) Object.assign(layout.xaxis,{categoryorder:'array',categoryarray:this.labels,...this.ticks(this.range)});
      layout.yaxis={...layout.yaxis,autorange:false,range:yr,minallowed:yr[0],maxallowed:yr[1],fixedrange:true};
      if(this.volume.length) layout.yaxis2={...layout.yaxis2,autorange:false,range:this.volumeRange(this.range),fixedrange:true};
      layout.uirevision=this.key;
      layout.dragmode='pan';
      if(this.empty){
        layout.annotations=[...(layout.annotations||[]),{xref:'paper',yref:'paper',x:0.5,y:0.5,showarrow:false,
          text:'No hay series visibles. Activa al menos una serie.',font:{color:layout.font.color,size:12}}];
      }
      return this;
    }
    nonempty(range){
      if(this.empty||this.category||this.uniqueX.some(x=>x>=range[0]&&x<=range[1]))return range;
      const mid=(range[0]+range[1])/2;
      const nearest=this.uniqueX.reduce((a,b)=>Math.abs(a-mid)<=Math.abs(b-mid)?a:b);
      const w=range[1]-range[0];
      return clampRange([nearest-w/2,nearest+w/2],this.bounds,this.minSpan);
    }
    visiblePoints(range, points=this.points){
      // Include the adjacent endpoints of clipped line segments, but never nulls.
      const lo=this.category?Math.floor(range[0]):range[0],hi=this.category?Math.ceil(range[1]):range[1];
      return points.filter(p=>p.x>=lo&&p.x<=hi);
    }
    yRange(range){
      const pts=this.visiblePoints(range), values=pts.flatMap(p=>[p.lo,p.hi]);
      return padded(extent(values)||extent(this.points.flatMap(p=>[p.lo,p.hi]))||[0,1],this.options);
    }
    volumeRange(range){
      const max=extent(this.visiblePoints(range,this.volume).map(p=>p.hi))?.[1]||1;
      return [0,max*1.18];
    }
    ticks(range){
      const inset=(range[1]-range[0])*Math.min(0.08,30/Math.max(200,this.el.clientWidth||600));
      const first=Math.max(0,Math.ceil(range[0]+inset)),last=Math.min(this.labels.length-1,Math.floor(range[1]-inset));
      const available=Math.max(2,Math.min(7,Math.floor((this.el.clientWidth||600)/125)));
      const step=Math.max(1,Math.ceil((last-first)/Math.max(1,available-1)));
      const ids=[];for(let i=first;i<=last;i+=step)ids.push(i);
      if(ids.length && last-ids.at(-1)>step*0.6)ids.push(last);
      const fmt=this.options.tickFormatter||formatDate;
      const labels=ids.map(i=>this.labels[i]);
      return {tickmode:'array',tickvals:labels,ticktext:labels.map(x=>fmt(x)),tickangle:0};
    }
    bind(){
      this.rendering=false;
      if(!this.bound){
        this.bound=true;
        this.el.on('plotly_relayout',this.onRelayout);
        this.el.on('plotly_doubleclick',this.onDoubleClick);
        this.bindPointerPan();
        if(this.category){
          if(!this.el.hasAttribute('tabindex'))this.el.tabIndex=0;
          this.el.addEventListener('keydown',e=>{
            if(e.target!==this.el||e.ctrlKey||e.metaKey||e.altKey)return;
            const actions={ArrowLeft:()=>this.pan(-1),ArrowRight:()=>this.pan(1),Home:()=>this.edge(false),End:()=>this.edge(true),'+':()=>this.zoom(0.65),'=':()=>this.zoom(0.65),'-':()=>this.zoom(1.5),'0':()=>this.reset()};
            if(actions[e.key]){e.preventDefault();actions[e.key]();}
          });
        }
        this.makeControls();
      }
      this.updateControls();this.notify();return this;
    }
    bindPointerPan(){
      // Plotly clamps each native drag endpoint separately, shrinking the viewport
      // at an edge. Capture main-plot drags and move the WHOLE interval instead.
      // Native bounds remain a second guard for axis interactions/API changes.
      let gesture=null,lastTap=0,lastTapPoint=null;
      const rectFor=target=>target?.closest?.('.nsewdrag,.ewdrag');
      this.el.on('plotly_hover',event=>{this.hoverPoints=event.points;});
      this.el.on('plotly_unhover',()=>{this.hoverPoints=null;});
      this.el.addEventListener('pointerdown',event=>{
        const rect=rectFor(event.target);
        if(!rect||this.empty||(event.button!==0&&event.pointerType!=='touch'))return;
        if(gesture)return;
        const width=rect.getBoundingClientRect().width;
        if(width<20)return;
        event.stopImmediatePropagation();
        if(event.pointerType!=='touch')event.preventDefault();
        gesture={id:event.pointerId,startX:event.clientX,startY:event.clientY,range:[...this.range],width,
          touch:event.pointerType==='touch',moved:false,points:this.hoverPoints};
        if(!gesture.touch){try{this.el.setPointerCapture(event.pointerId);}catch{}}
      },true);
      // Stop the legacy mouse/touch handlers of Plotly, without cancelling normal
      // vertical page scrolling on a touch screen (CSS touch-action: pan-y).
      for(const name of ['mousedown','touchstart'])this.el.addEventListener(name,event=>{
        if(rectFor(event.target)){event.stopImmediatePropagation();if(name==='mousedown')event.preventDefault();}
      },{capture:true,passive:false});
      const move=event=>{
        if(!gesture||event.pointerId!==gesture.id)return;
        const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
        if(gesture.touch&&!gesture.moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>6){gesture=null;return;}
        if(Math.abs(dx)<4&&!gesture.moved)return;
        gesture.moved=true;this.el.classList.add('chart-panning');event.preventDefault();
        const delta=dx*(gesture.range[1]-gesture.range[0])/gesture.width;
        this.setRange(gesture.range.map(v=>v-delta));
      };
      const finish=event=>{
        if(!gesture||event.pointerId!==gesture.id)return;
        const g=gesture;gesture=null;this.el.classList.remove('chart-panning');
        try{this.el.releasePointerCapture(event.pointerId);}catch{}
        if(event.type==='pointercancel')return;
        if(g.moved)return;
        if(Math.abs(event.clientY-g.startY)>5)return;
        const now=performance.now(),same=lastTapPoint&&Math.hypot(event.clientX-lastTapPoint[0],event.clientY-lastTapPoint[1])<12;
        if(now-lastTap<360&&same){lastTap=0;lastTapPoint=null;this.reset();return;}
        lastTap=now;lastTapPoint=[event.clientX,event.clientY];
        const picked=this.pickPoint(event.clientX,event.clientY);
        const points=picked?[picked]:(!g.touch?g.points:null);
        if(points?.length){
          if(g.touch)try{Plotly.Fx.hover(this.el,points.map(p=>({curveNumber:p.curveNumber,pointNumber:p.pointNumber})));}catch{}
          this.el.emit('plotly_click',{points,event});
        }
      };
      window.addEventListener('pointermove',move,{capture:true,passive:false});
      window.addEventListener('pointerup',finish,true);
      window.addEventListener('pointercancel',finish,true);
      this.removePointerListeners=()=>{
        window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true);
      };
    }
    pickPoint(clientX,clientY){
      // A finger has no preceding hover event. Resolve a tap in pixel space so
      // portfolio selection (and a price tooltip) still works on touch devices.
      const layout=this.el._fullLayout,rect=this.el.getBoundingClientRect();
      if(!layout)return null;
      let best=null,bestDistance=Infinity;
      (this.el.data||[]).forEach((trace,curveNumber)=>{
        if(trace.visible===false||trace.visible==='legendonly'||trace._viewportIgnore||trace.yaxis==='y2')return;
        const xa=layout.xaxis,ya=layout.yaxis;
        for(let i=0;i<(trace.x?.length||0);i++){
          const x=trace.x[i],y=trace.type==='candlestick'?trace.close[i]:trace.y?.[i];
          if(!finite(y))continue;
          const px=rect.x+xa._offset+xa.d2p(x),py=rect.y+ya._offset+ya.d2p(y);
          const distance=Math.hypot(clientX-px,clientY-py);
          const markerSize=Array.isArray(trace.marker?.size)?trace.marker.size[i]:trace.marker?.size||8;
          if(distance<=Math.max(14,markerSize/2+5)&&distance<bestDistance){
            bestDistance=distance;best={curveNumber,pointNumber:i,pointIndex:i,x,y,data:trace,fullData:this.el._fullData[curveNumber],xaxis:xa,yaxis:ya};
          }
        }
      });
      return best;
    }
    eventRange(event){
      if(event['xaxis.autorange'])return [...this.initial];
      if(Array.isArray(event['xaxis.range']))return event['xaxis.range'].map(Number);
      if('xaxis.range[0]' in event || 'xaxis.range[1]' in event)
        return [Number(event['xaxis.range[0]']??this.range[0]),Number(event['xaxis.range[1]']??this.range[1])];
      return null;
    }
    onRelayout(event){
      if(this.applying||this.rendering||!this.el._fullLayout)return;
      const range=this.eventRange(event);
      if(range||Object.keys(event).some(k=>/^yaxis\d*\./.test(k))) this.setRange(range||this.range);
      else if('width' in event||'height' in event||event.autosize) this.setRange(this.range,{broadcast:false});
    }
    setRange(raw,{broadcast=true}={}){
      if(!this.el._fullLayout)return Promise.resolve();
      if(this.rendering){this.range=this.nonempty(clampRange(raw,this.bounds,this.minSpan));return Promise.resolve();}
      if(this.applying){this.pending={raw,broadcast};return this.pendingPromise||Promise.resolve();}
      const range=this.nonempty(clampRange(raw,this.bounds,this.minSpan));
      this.range=range;
      const yr=this.yRange(range),patch={};
      if(!equal(this.el._fullLayout.xaxis.range,range)||this.el.layout.xaxis.autorange){patch['xaxis.autorange']=false;patch['xaxis.range']=range;}
      if(!equal(this.el._fullLayout.yaxis.range,yr)||this.el.layout.yaxis.autorange){
        patch['yaxis.autorange']=false;patch['yaxis.range']=yr;patch['yaxis.minallowed']=yr[0];patch['yaxis.maxallowed']=yr[1];
      }
      if(this.category){const tick=this.ticks(range);for(const [k,v] of Object.entries(tick)){
        if(JSON.stringify(this.el.layout.xaxis[k])!==JSON.stringify(v))patch['xaxis.'+k]=v;
      }}
      if(this.volume.length){const v=this.volumeRange(range);if(!equal(this.el._fullLayout.yaxis2.range,v))patch['yaxis2.range']=v;}
      this.updateControls();
      this.applying=true;
      this.pendingPromise=(Object.keys(patch).length?Plotly.relayout(this.el,patch):Promise.resolve()).then(()=>{
        this.applying=false;this.notify();
        if(broadcast && this.options.group) for(const other of controllers.values()){
          if(other!==this && other.options.group===this.options.group && !equal(other.range,range))other.setRange(range,{broadcast:false});
        }
        if(this.pending){const p=this.pending;this.pending=null;return this.setRange(p.raw,{broadcast:p.broadcast});}
      }).catch(error=>{this.applying=false;console.error('Viewport:',error);});
      return this.pendingPromise;
    }
    pan(direction){const w=this.range[1]-this.range[0],d=w*0.65*direction;return this.setRange(this.range.map(v=>v+d));}
    edge(last){const w=this.range[1]-this.range[0];return this.setRange(last?[this.bounds[1]-w,this.bounds[1]]:[this.bounds[0],this.bounds[0]+w]);}
    zoom(factor){const mid=(this.range[0]+this.range[1])/2,w=(this.range[1]-this.range[0])*factor;return this.setRange([mid-w/2,mid+w/2]);}
    reset(){return this.setRange(this.initial);}
    all(){return this.setRange(this.bounds);}
    indices(range=this.range){return [Math.max(0,Math.ceil(range[0])),Math.min(this.labels.length-1,Math.floor(range[1]))];}
    notify(){
      const [first,last]=this.indices();
      this.el.dispatchEvent(new CustomEvent('chart:viewport',{detail:{range:[...this.range],first,last,count:Math.max(0,last-first+1),total:this.labels.length}}));
    }
    makeControls(){
      const box=document.createElement('div');box.className='chart-navigation';box.dataset.chartFor=this.el.id;
      box.setAttribute('role','group');box.setAttribute('aria-label','Navegaci\u00f3n del gr\u00e1fico con l\u00edmites');
      box.innerHTML='<div class="chart-navigation-top"><span class="chart-window-status" aria-live="polite"></span><span class="chart-scale-lock">Y: ajuste autom\u00e1tico</span></div>'+
        '<div class="chart-navigation-actions"><button type="button" data-nav="back" title="Desplazar hacia el inicio" aria-label="Desplazar hacia el inicio">\u2190</button>'+
        '<input class="chart-position" type="range" min="0" max="1000" step="1" aria-label="Posici\u00f3n dentro de los datos disponibles">'+
        '<button type="button" data-nav="forward" title="Desplazar hacia el final" aria-label="Desplazar hacia el final">\u2192</button>'+
        '<button type="button" data-nav="out" title="Alejar" aria-label="Alejar gr\u00e1fico">\u2212</button><button type="button" data-nav="in" title="Acercar" aria-label="Acercar gr\u00e1fico">+</button>'+
        '<button type="button" data-nav="all">Todo</button><button type="button" data-nav="reset" title="Volver a la vista inicial">Restablecer</button></div>'+
        '<p class="chart-navigation-hint">Arrastra horizontalmente \u00b7 L\u00edmites de datos activos \u00b7 Doble clic: restablecer</p>';
      this.el.insertAdjacentElement('afterend',box);this.controls=box;
      const actions={back:()=>this.pan(-1),forward:()=>this.pan(1),out:()=>this.zoom(1.5),in:()=>this.zoom(0.65),all:()=>this.all(),reset:()=>this.reset()};
      box.addEventListener('click',e=>{const key=e.target.closest('[data-nav]')?.dataset.nav;if(key)actions[key]();});
      box.querySelector('input').addEventListener('input',e=>{
        const width=this.range[1]-this.range[0],travel=this.bounds[1]-this.bounds[0]-width;
        const left=this.bounds[0]+travel*(+e.target.value/1000);this.setRange([left,left+width]);
      });
    }
    updateControls(range=this.range){
      if(!this.controls)return;
      const box=this.controls,[first,last]=this.indices(range),w=range[1]-range[0],span=this.bounds[1]-this.bounds[0],travel=span-w;
      const position=box.querySelector('input');position.value=travel>1e-6?Math.round((range[0]-this.bounds[0])/travel*1000):0;position.disabled=this.empty||travel<=1e-6;
      const stat=box.querySelector('.chart-window-status');
      if(this.empty)stat.textContent='No hay series activadas';
      else if(this.category) stat.textContent=`${formatDate(this.labels[first])} \u2014 ${formatDate(this.labels[last])} \u00b7 ${Math.max(0,last-first+1)} / ${this.labels.length} ${this.options.unit||'puntos'}`;
      else stat.textContent=`Volatilidad: ${range[0].toFixed(2)}\u2013${range[1].toFixed(2)} % \u00b7 ${this.visiblePoints(range).length} portafolios visibles`;
      position.setAttribute('aria-valuetext',stat.textContent);
      for(const b of box.querySelectorAll('button')){
        const action=b.dataset.nav;b.disabled=this.empty || (action==='back'&&near(range[0],this.bounds[0])) || (action==='forward'&&near(range[1],this.bounds[1])) || ((action==='out'||action==='all')&&near(w,span)) || (action==='in'&&w<=this.minSpan+1e-6);
      }
    }
    dispose(){this.removePointerListeners?.();controllers.delete(this.el);this.controls?.remove();delete this.el._eiaViewport;}
  }
  window.ChartViewport={prepare(el,traces,layout,options){return (controllers.get(el)||new Viewport(el)).prepare(traces,layout,options);},get:el=>controllers.get(el),clampRange};
})();
