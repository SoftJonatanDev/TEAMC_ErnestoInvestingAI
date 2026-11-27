/* Same-origin UI adapter. Never edits data arrays or bypasses trading validation. */
(() => {
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class Bridge{
  constructor(frame,callbacks={}){this.frame=frame;this.cb=callbacks;this.context=null;this.dragging=null;this.pending=null;this.lastHover=0;}
  hit(p){
   let doc=document,win=window,offset={x:0,y:0},el=doc.elementFromPoint(p.x,p.y);
   if(el===this.frame){try{const r=this.frame.getBoundingClientRect();offset={x:r.left,y:r.top};doc=this.frame.contentDocument;win=this.frame.contentWindow;el=doc.elementFromPoint(p.x-r.left,p.y-r.top);}catch{return null;}}
   return el?{el,doc,win,offset,x:p.x-offset.x,y:p.y-offset.y}:null;
  }
  rect(el){const r=el.getBoundingClientRect(),o=el.ownerDocument===document?{left:0,top:0}:this.frame.getBoundingClientRect();return {x:r.left+o.left,y:r.top+o.top,width:r.width,height:r.height};}
  control(hit){const raw=hit?.el;if(!raw)return null;const el=raw.closest('button,a,input,textarea,select,label,summary,[role="button"]');if(el?.tagName==='LABEL'&&el.control)return el.control;return el;}
  graph(hit){const el=hit?.el?.closest('.js-plotly-plot');return el?{el,viewport:el._eiaViewport,hit}:null;}
  click(p){
   const h=this.hit(p);if(!h)return;
   const g=this.graph(h);if(g?.viewport){const point=g.viewport.pickPoint(h.x,h.y);if(point)g.el.emit('plotly_click',{points:[point],event:{clientX:h.x,clientY:h.y,type:'gesture'}});return;}
   const el=this.control(h);if(!el||el.matches(':disabled,[aria-disabled="true"]')||el.closest('[inert]'))return;
   if(el.matches('select')){this.cb.select?.(el);return;}
   if(el.matches('input[type="range"]')){this.range(el,h.x);return;}
   if(el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]),textarea')){
    if(el.readOnly||el.type==='file'||el.type==='password'){this.cb.notice?.('Este campo se completa con teclado o ratón por privacidad y permisos del navegador.');return;}
    this.cb.edit?.(el);return;
   }
   // A new, separate thumb open-close-open cycle is required for destructive/final confirmation buttons.
   if(el.ownerDocument!==document&&el.matches('[data-confirm-order],button.danger,[data-confirm].danger')){
    const now=performance.now();if(this.pending?.el!==el||now>this.pending.until){this.pending={el,until:now+6000};this.cb.notice?.('Confirmación protegida: mantén el índice arriba y repite el ciclo de cerrar y reabrir el pulgar hacia la palma sobre este botón en los próximos 6 segundos.');return;}this.pending=null;
   }
   el.focus({preventScroll:true});el.click();this.cb.clicked?.(el);
  }
  range(el,x){const r=el.getBoundingClientRect(),min=Number(el.min||0),max=Number(el.max||100),step=Number(el.step)||1;el.value=String(clamp(Math.round((min+(max-min)*clamp((x-r.left)/r.width,0,1)-min)/step)*step+min,min,max));const w=el.ownerDocument.defaultView;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));}
  hover(p){const h=this.hit(p);if(!h)return;const target=this.control(h)||EIAReader.readableTarget(h.el);this.cb.highlight?.(target?this.rect(target):null);
   const g=this.graph(h),now=performance.now();if(g?.viewport&&now-this.lastHover>160){this.lastHover=now;const picked=g.viewport.pickPoint(h.x,h.y);if(picked){try{h.win.Plotly.Fx.hover(g.el,[{curveNumber:picked.curveNumber,pointNumber:picked.pointNumber}]);}catch{}}this.hoverGraph=g;}
   else if(!g&&this.hoverGraph){try{this.hoverGraph.hit.win.Plotly.Fx.unhover(this.hoverGraph.el);}catch{}this.hoverGraph=null;}
  }
  begin(p){this.context={hit:this.hit(p),anchor:{...p}};this.context.graph=this.graph(this.context.hit);}
  pan(delta,p){if(!this.context)this.begin(p);const c=this.context,g=c.graph;
   if(g?.viewport&&!g.viewport.empty){const v=g.viewport,axis=g.el._fullLayout.xaxis,dx=delta.x*(v.range[1]-v.range[0])/Math.max(50,axis._length);v.setRange(v.range.map(x=>x-dx));}
   else this.scrollBy(-delta.x*1.6,0,c.hit);
  }
  zoom(factor,p){if(!this.context)this.begin(p);const c=this.context,g=c.graph;if(!g?.viewport||g.viewport.empty){this.cb.status?.('Para ampliar, apunta primero a una gráfica');return;}
   const v=g.viewport,r=g.el.getBoundingClientRect(),axis=g.el._fullLayout.xaxis,at=clamp((c.hit.x-r.left-axis._offset)/axis._length,.05,.95),width=v.range[1]-v.range[0],newWidth=clamp(width*factor,v.minSpan,v.bounds[1]-v.bounds[0]),anchor=v.range[0]+at*width;
   v.setRange([anchor-at*newWidth,anchor+(1-at)*newWidth]);
  }
  scroll(delta,p){if(!this.context)this.begin(p);this.scrollBy(0,-delta.y*1.8,this.context.hit);}
  scrollBy(dx,dy,h){if(!h)return;for(let el=h.el;el&&el!==h.doc.body;el=el.parentElement){const cs=h.win.getComputedStyle(el),x=dx&&/(auto|scroll)/.test(cs.overflowX)&&el.scrollWidth>el.clientWidth+2,y=dy&&/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+2;if(x||y){const before=x?el.scrollLeft:el.scrollTop;el.scrollTo({left:el.scrollLeft+(x?dx:0),top:el.scrollTop+(y?dy:0),behavior:'instant'});if((x?el.scrollLeft:el.scrollTop)!==before)return;}}
   const root=h.doc.scrollingElement;if(root)root.scrollTo({top:root.scrollTop+dy,left:root.scrollLeft+dx,behavior:'instant'});
  }
  startDrag(p){this.begin(p);const h=this.context.hit;this.dragging={start:{...p},last:{...p},hit:h,control:this.control(h)};}
  drag(p){const d=this.dragging;if(!d)return;if(d.control?.matches('input[type="range"]'))this.range(d.control,p.x-d.hit.offset.x);else if(this.context.graph?.viewport)this.pan({x:p.x-d.last.x,y:p.y-d.last.y},d.start);else this.scrollBy(d.last.x-p.x,d.last.y-p.y,d.hit);d.last={...p};}
  end(){this.context=null;this.dragging=null;}
  cancel(){this.end();this.pending=null;this.cb.highlight?.(null);}
 }
 window.EIAInputBridge=Bridge;
})();
