/* Price charts always show the supplied historical snapshot, never live prices. */
(() => {
  'use strict';
  class FinancialChart {
    constructor(el,data,ticker,range=60){this.el=el;this.data=data;this.ticker=ticker;this.range=range;this.mode='candle';this.promise=Promise.resolve();this.observer=new ResizeObserver(()=>{if(el._fullLayout)Plotly.Plots.resize(el).catch(()=>{});});this.observer.observe(el);window.addEventListener('themechange',()=>this.render());}
    setTicker(ticker){this.ticker=ticker;return this.render();}
    setRange(range){this.range=range;return this.render();}
    setMode(mode){this.mode=mode;return this.render();}
    render(){const d=this.data.series[this.ticker];if(!d)return Promise.resolve();const n=this.range,x=this.data.fechas.slice(-n),close=d.c.slice(-n),open=d.o.slice(-n),high=d.h.slice(-n),low=d.l.slice(-n),vol=(d.v||x.map(()=>0)).slice(-n),up=UI.css('--up'),dn=UI.css('--dn'),ac=UI.css('--ac');
      const trace=this.mode==='candle'?{type:'candlestick',x,open,high,low,close,increasing:{line:{color:up,width:1},fillcolor:up},decreasing:{line:{color:dn,width:1},fillcolor:dn},name:this.ticker,hoverinfo:'text',text:x.map((date,i)=>`${this.ticker} \u00b7 ${date}<br>Apertura: ${UI.money(open[i])}<br>M\u00e1ximo: ${UI.money(high[i])}<br>M\u00ednimo: ${UI.money(low[i])}<br>Cierre: ${UI.money(close[i])}`)}:{type:'scatter',mode:'lines',x,y:close,line:{color:ac,width:2},fill:'tozeroy',fillcolor:document.documentElement.dataset.theme==='dark'?'rgba(88,223,189,0.06)':'rgba(8,126,102,0.06)',name:this.ticker,hovertemplate:'%{x}<br>Cierre: $%{y:,.2f}<extra></extra>'};
      const traces=[trace,{type:'bar',x,y:vol,yaxis:'y2',marker:{color:close.map((c,i)=>c>=open[i]?up:dn),opacity:.24},hoverinfo:'skip',name:'Volumen'}];
      const step=Math.max(1,Math.ceil(n/5)),tickvals=x.filter((_,i)=>i%step===0),ticktext=tickvals.map(v=>new Date(v+'T12:00:00').toLocaleDateString(EIA.lang(),{day:'2-digit',month:'short'}));
      const layout=UI.plotLayout({margin:{l:12,r:58,t:15,b:30},hovermode:'closest',bargap:.25,uirevision:this.ticker+'-'+n+'-'+this.mode,
        xaxis:{type:'category',anchor:'y2',rangeslider:{visible:false},showgrid:false,zeroline:false,tickvals,ticktext,tickfont:{color:UI.css('--mut'),size:10},fixedrange:false,showspikes:true,spikecolor:UI.css('--mut'),spikethickness:1,spikedash:'dot'},
        yaxis:{domain:[.23,1],side:'right',gridcolor:UI.css('--bd'),zeroline:false,nticks:5,tickfont:{size:10,color:UI.css('--mut')},tickformat:'.2f',autorange:true,fixedrange:false,showspikes:true,spikecolor:UI.css('--mut'),spikethickness:1,spikedash:'dot'},
        yaxis2:{domain:[0,.15],showgrid:false,showticklabels:false,zeroline:false,fixedrange:true},
        annotations:[{xref:'paper',yref:'paper',x:0,y:.18,text:'VOLUMEN SINT\u00c9TICO',showarrow:false,font:{size:8,color:UI.css('--mut')},xanchor:'left'}]});
      this.promise=this.promise.then(()=>Plotly.react(this.el,traces,layout,UI.plotConfig));return this.promise;
    }
    reset(){return Plotly.relayout(this.el,{'xaxis.autorange':true,'yaxis.autorange':true});}
    snapshot(){return Plotly.downloadImage(this.el,{format:'png',filename:`${this.ticker}-historia-sintetica`,width:1400,height:700});}
  }
  window.FinancialChart=FinancialChart;
})();
