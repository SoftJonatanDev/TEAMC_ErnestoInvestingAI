/* Historical price/volume chart: all data stay loaded; only the viewport moves.
 * The earlier O/H/L/V fields are synthetic reconstructions. Every close is copied
 * from the canonical 504-session history; the last 120 candles are unchanged.
 */
(() => {
  'use strict';
  class FinancialChart {
    constructor(el,data,ticker,range=60){
      this.el=el;this.data=data;this.ticker=ticker;this.range=range;this.mode='candle';this.promise=Promise.resolve();
      this.observer=new ResizeObserver(()=>{if(el._fullLayout)Plotly.Plots.resize(el).catch(()=>{});});
      this.observer.observe(el);window.addEventListener('themechange',()=>this.render());
    }
    setTicker(ticker){this.ticker=ticker;return this.render();}
    setRange(range){this.range=Math.max(10,Math.min(this.data.fechas.length,range));return this.render();}
    setMode(mode){this.mode=mode;return this.render();}
    render(){
      const d=this.data.series[this.ticker];if(!d)return Promise.resolve();
      // Do not slice the data: the complete history provides a real buffer on either
      // side of any zoomed view. No artificial future candles are appended.
      const x=this.data.fechas,close=d.c,open=d.o,high=d.h,low=d.l,vol=d.v||x.map(()=>0);
      const up=UI.css('--up'),dn=UI.css('--dn'),ac=UI.css('--ac');
      const trace=this.mode==='candle'?{
        type:'candlestick',x,open,high,low,close,
        increasing:{line:{color:up,width:1},fillcolor:up},decreasing:{line:{color:dn,width:1},fillcolor:dn},name:this.ticker,
        hoverinfo:'text',text:x.map((date,i)=>`${this.ticker} \u00b7 ${date}<br>Apertura: ${UI.money(open[i])}<br>M\u00e1ximo: ${UI.money(high[i])}<br>M\u00ednimo: ${UI.money(low[i])}<br>Cierre: ${UI.money(close[i])}<br>Volumen: ${UI.num(vol[i],0)}${i<x.length-120?'<br>O/H/L/V reconstruidos \u00b7 cierre original':'<br>Vela sint\u00e9tica original'}`)
      }:{
        type:'scatter',mode:'lines',x,y:close,line:{color:ac,width:2},name:this.ticker,
        hovertemplate:'%{x}<br>Cierre sint\u00e9tico: $%{y:,.2f}<extra></extra>'
      };
      const traces=[trace,{type:'bar',x,y:vol,yaxis:'y2',marker:{color:close.map((c,i)=>c>=open[i]?up:dn),opacity:.24},hoverinfo:'skip',name:'Volumen'}];
      const layout=UI.plotLayout({margin:{l:12,r:58,t:15,b:36},hovermode:'closest',bargap:.25,
        xaxis:{type:'category',categoryorder:'array',categoryarray:x,anchor:'y2',rangeslider:{visible:false},showgrid:false,zeroline:false,tickfont:{color:UI.css('--mut'),size:10},showspikes:true,spikecolor:UI.css('--mut'),spikethickness:1,spikedash:'dot'},
        yaxis:{domain:[.23,1],side:'right',gridcolor:UI.css('--bd'),zeroline:false,nticks:5,tickfont:{size:10,color:UI.css('--mut')},tickformat:'.2f',showspikes:true,spikecolor:UI.css('--mut'),spikethickness:1,spikedash:'dot'},
        yaxis2:{domain:[0,.15],showgrid:false,showticklabels:false,zeroline:false,fixedrange:true},
        annotations:[{xref:'paper',yref:'paper',x:0,y:.18,text:'VOLUMEN SINT\u00c9TICO',showarrow:false,font:{size:8,color:UI.css('--mut')},xanchor:'left'}]});
      const options={key:this.ticker+'-'+this.range,labels:x,initialRange:[x.length-this.range-0.5,x.length-0.5],positive:true,unit:'sesiones',minSpan:10,
        tickFormatter:v=>new Date(v+'T12:00:00Z').toLocaleDateString(EIA.lang(),{day:'2-digit',month:'short',year:'2-digit',timeZone:'UTC'})};
      this.promise=this.promise.then(()=>{
        this.viewport=ChartViewport.prepare(this.el,traces,layout,options);
        return Plotly.react(this.el,traces,layout,{...UI.plotConfig,doubleClick:false}).then(()=>this.viewport.bind());
      });
      return this.promise;
    }
    reset(){return this.viewport?.reset()||Promise.resolve();}
    visible(){const [first,last]=this.viewport?.indices()||[Math.max(0,this.data.fechas.length-this.range),this.data.fechas.length-1];return {first,last};}
    snapshot(){return Plotly.downloadImage(this.el,{format:'png',filename:`${this.ticker}-historia-sintetica`,width:1400,height:700});}
  }
  window.FinancialChart=FinancialChart;
})();
