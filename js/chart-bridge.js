/* Compatibility adapter for the chart options used by the supplied modules.
 * Rendering, zooming, export and pointer interaction use local Plotly.js.
 * This is NOT the ECharts library and is not a general ECharts polyfill.
 */
(() => {
  'use strict';
  const instances=new Map();
  const css=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const rgba=(color,opacity)=>{if(/^#[0-9a-f]{6}$/i.test(color)){return `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${opacity})`;}return color;};
  const config={responsive:true,displaylogo:false,displayModeBar:false,scrollZoom:false};
  class Adapter {
    constructor(el){this.el=el;this.option={};this.handlers={};this.alive=true;this.promise=Promise.resolve();}
    setOption(next,replace=false){
      if(replace)this.option=next;
      else {const old=this.option;this.option={...old,...next};if(next.series&&old.series)this.option.series=old.series.map((s,i)=>({...s,...(next.series.find(n=>n.id&&n.id===s.id)||(!s.id?next.series[i]:null)||{})}));}
      this.render();
    }
    render(){if(!this.alive||!this.option.series)return;const o=this.option,fg=css('--fg'),mut=css('--mut'),bd=css('--bd'),ac=css('--ac'),panel=css('--panel');
      const xa=Array.isArray(o.xAxis)?o.xAxis[0]:(o.xAxis||{}),ya=Array.isArray(o.yAxis)?o.yAxis[0]:(o.yAxis||{});
      let stacked={};const shapes=[],annotations=[];
      const traces=o.series.map((s,index)=>{
        if(s.type==='pie'){const entries=s.data||[];return {type:'pie',labels:entries.map(d=>d.name),values:entries.map(d=>d.value),hole:.68,sort:false,direction:'clockwise',textinfo:'none',marker:{colors:entries.map(d=>d.itemStyle?.color||ac),line:{color:panel,width:2}},hovertemplate:'%{label}<br>%{percent}<extra></extra>',name:s.name||'',_eia:index};}
        const values=s.data||[],xy=values.length&&Array.isArray(values.find(v=>v!==null));
        const xs=xy?values.map(v=>v?.[0]):(xa.data||values.map((_,i)=>i)),ys=xy?values.map(v=>v?.[1]):values;
        const color=s.lineStyle?.color||s.itemStyle?.color||ac;
        const dash=({dashed:'dash',dotted:'dot',solid:'solid'})[s.lineStyle?.type]||s.lineStyle?.type||'solid';
        let y=ys,fill;
        if(s.stack){const prev=stacked[s.stack];y=ys.map((v,i)=>v===null?null:v+(prev?.[i]||0));stacked[s.stack]=y;if(prev)fill='tonexty';}
        else if(s.areaStyle)fill='tozeroy';
        const marker={color:s.itemStyle?.color||color,size:typeof s.symbolSize==='function'?values.map(v=>s.symbolSize(v)):s.symbolSize||6,
          symbol:({rect:'square',diamond:'diamond',circle:'circle'})[s.symbol]||'circle',line:{color:s.itemStyle?.borderColor||panel,width:s.itemStyle?.borderWidth||0}};
        const vm=Array.isArray(o.visualMap)?o.visualMap[0]:o.visualMap;
        if(vm&&([].concat(vm.seriesIndex).includes(index)||vm.seriesId===s.id)){marker.color=values.map(v=>v[2]);marker.colorscale=(vm.inRange?.color||['#55dec1','#d29aff']).map((c,i,a)=>[i/(a.length-1),c]);marker.cmin=vm.min;marker.cmax=vm.max;marker.showscale=true;marker.colorbar={orientation:'h',thickness:8,len:.45,x:.5,xanchor:'center',y:-.28,title:{text:'CVaR 95% diario',side:'top',font:{size:10}},tickfont:{size:10}};}
        const trace={type:'scatter',mode:s.type==='scatter'?'markers':((s.symbol&&s.symbol!=='none')?'lines+markers':'lines'),x:xs,y,name:s.name||'',line:{color,width:s.lineStyle?.width??2,dash},marker,connectgaps:false,fill,fillcolor:rgba(s.areaStyle?.color||color,s.areaStyle?.opacity??.1),opacity:s.lineStyle?.opacity===0?1:s.lineStyle?.opacity??1,hoverinfo:s.tooltip?.show===false?'skip':undefined,hovertemplate:'%{x}<br>%{y:,.2f}<extra>%{fullData.name}</extra>',_eia:index};
        if(s.lineStyle?.opacity===0)trace.line.width=0;
        if(s.type==='scatter'&&s.id==='sel'){trace.marker.color='rgba(0,0,0,0)';trace.hoverinfo='skip';delete trace.hovertemplate;}
        if(o.tooltip?.trigger==='item'&&typeof o.tooltip.formatter==='function'&&s.id&&s.id!=='sel'){
          trace.text=values.map((value,i)=>o.tooltip.formatter({seriesId:s.id,seriesName:s.name,seriesIndex:index,dataIndex:i,value,name:s.name,marker:''}));trace.hovertemplate='%{text}<extra></extra>';
        }
        if(s.markLine?.data)s.markLine.data.forEach(m=>{const x=xa.data?.[m.xAxis]??m.xAxis;if(x!==undefined){shapes.push({type:'line',xref:'x',yref:'paper',x0:x,x1:x,y0:0,y1:1,line:{color:mut,width:1,dash:'dot'}});annotations.push({x,y:1.04,xref:'x',yref:'paper',text:s.markLine.label?.formatter||'',showarrow:false,font:{size:10,color:mut}});}});
        return trace;
      });
      const suffix=axis=>{try{return typeof axis.axisLabel?.formatter==='function'&&/[%\u066a]/.test(axis.axisLabel.formatter(1))?' %':'';}catch{return '';}};
      const axis={gridcolor:bd,zeroline:false,showline:false,tickfont:{size:11,color:mut},automargin:true};
      const isPie=traces[0]?.type==='pie';
      const layout={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Segoe UI, Arial, sans-serif',size:11,color:fg},margin:isPie?{l:2,r:2,t:2,b:2}:{l:56,r:18,t:24,b:o.visualMap&&!Array.isArray(o.visualMap)?90:46},showlegend:false,
        xaxis:{...axis,type:xa.type==='category'?'category':'linear',ticksuffix:suffix(xa),showgrid:xa.type!=='category',nticks:6,title:{text:xa.name||'',font:{size:11,color:mut}},tickformat:xa.type==='value'?'.1f':undefined},
        yaxis:{...axis,ticksuffix:suffix(ya),title:{text:ya.name||'',font:{size:11,color:mut}},autorange:ya.max===0?'min':true,range:ya.max===0?[null,0]:undefined},
        hovermode:o.tooltip?.trigger==='item'?'closest':'x unified',hoverlabel:{bgcolor:panel,bordercolor:bd,font:{color:fg,size:11}},dragmode:'pan',shapes,annotations};
      if(xa.type==='category'&&xa.data?.length){const every=Math.max(1,Math.ceil(xa.data.length/6));layout.xaxis.tickvals=xa.data.filter((_,i)=>i%every===0);layout.xaxis.ticktext=layout.xaxis.tickvals.map(v=>{try{return typeof xa.axisLabel?.formatter==='function'?xa.axisLabel.formatter(v):v;}catch{return v;}});}
      this.promise=this.promise.then(()=>{if(!this.alive)return;return Plotly.react(this.el,traces,layout,config).then(()=>{
        if(this.bound)return;this.bound=true;
        this.el.on('plotly_click',e=>{const p=e.points?.[0];if(!p)return;const idx=p.data._eia??p.curveNumber,s=this.option.series[idx];const param={seriesId:s.id,seriesName:s.name,seriesIndex:idx,dataIndex:p.pointNumber,value:s.data[p.pointNumber],data:s.data[p.pointNumber],event:e.event};(this.handlers.click||[]).forEach(fn=>fn(param));});
        this.el.on('plotly_hover',e=>{if(!this.group||this.syncing)return;const p=e.points?.[0];if(!p)return;instances.forEach(other=>{if(other!==this&&other.group===this.group&&other.el._fullLayout){other.syncing=true;try{Plotly.Fx.hover(other.el,other.el.data.map((_,i)=>({curveNumber:i,pointNumber:p.pointNumber})));}finally{other.syncing=false;}}});});
        this.el.on('plotly_unhover',()=>{if(this.group)instances.forEach(other=>{if(other!==this&&other.group===this.group)try{Plotly.Fx.unhover(other.el);}catch{}});});
      });}).catch(error=>{console.error('Chart render:',error);});
    }
    on(name,fn){(this.handlers[name]||(this.handlers[name]=[])).push(fn);}
    resize(){if(this.alive&&this.el._fullLayout)Plotly.Plots.resize(this.el).catch(()=>{});}
    dispose(){this.alive=false;Plotly.purge(this.el);instances.delete(this.el);}
    dispatchAction(a){if(!this.el._fullLayout)return;if(a.type==='hideTip'){Plotly.Fx.unhover(this.el);return;}if(a.type==='showTip'||a.type==='highlight'){let i=a.seriesIndex??this.option.series.findIndex(s=>s.id===a.seriesId);if(i>=0&&a.dataIndex!==undefined)Plotly.Fx.hover(this.el,[{curveNumber:i,pointNumber:a.dataIndex}]);}}
    getOption(){return this.option;}
  }
  window.echarts={init:el=>{if(instances.has(el))return instances.get(el);const a=new Adapter(el);instances.set(el,a);return a;},getInstanceByDom:el=>instances.get(el),connect:()=>{},dispose:el=>instances.get(el)?.dispose(),version:'local-plotly-adapter'};
})();
