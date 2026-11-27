/* A deterministic, local-only exchange simulator. All monetary data are USD. */
(() => {
  'use strict';
  const FEE=0.001;
  const safeRead=(k,f=null)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{if(!warnedStorage){warnedStorage=true;UI.toast('El navegador no permite guardar datos. Habilita el almacenamiento local para operar.','error');}return false;}};
  const copy=x=>JSON.parse(JSON.stringify(x));
  const round=x=>Math.round((x+Number.EPSILON)*100)/100;
  const uid=prefix=>prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  let assets=[],seed=null,history=null,started=false,warnedStorage=false,checking=false;
  const emit=name=>window.dispatchEvent(new CustomEvent(name));
  function state(){return safeRead('eia_simulation',{enabled:true,frozenTick:Math.floor(Date.now()/5000)});}
  function tick(){const s=state();return s.enabled?Math.floor(Date.now()/5000):s.frozenTick;}
  function at(ticker,step){const a=assets.find(a=>a.ticker===ticker);if(!a)return 0;const h=Array.from(ticker).reduce((n,c)=>n*31+c.charCodeAt(0),0)%10007;
    // Smooth, bounded variation around the supplied snapshot; never real quotes.
    const factor=1+Math.sin(step/23+h)*0.0028+Math.cos(step/7+h*2)*0.0006;
    return round(a.ultimo*factor);
  }
  function quote(ticker){const a=assets.find(a=>a.ticker===ticker);if(!a)throw new Error('Activo no disponible.');const last=at(ticker,tick()),spread=Math.max(.01,round(last*.0001));
    return {...a,last,bid:round(last-spread),ask:round(last+spread),change:(last/(a.ultimo/(1+a.var_1d_pct/100))-1)*100};}
  function ledger(){const saved=safeRead('eia_ledger_v2');return saved&&saved.portfolio&&Array.isArray(saved.orders)?saved:{portfolio:copy(seed.portafolio_demo),orders:[],realized:0};}
  function saveLedger(data){if(!write('eia_ledger_v2',data))throw new Error('No se pudo guardar la operaci\u00f3n. No se ha ejecutado.');write('eia_port',data.portfolio);emit('market:state');}
  async function locked(fn){return navigator.locks?navigator.locks.request('eia-ledger-v2',fn):fn();}
  function available(data=ledger(),exclude=''){
    const pending=data.orders.filter(o=>o.status==='pending'&&o.id!==exclude);
    return {cash:round(data.portfolio.efectivo-pending.filter(o=>o.side==='C').reduce((n,o)=>n+round(o.qty*o.limit*(1+FEE)),0)),
      shares:t=>((data.portfolio.posiciones.find(p=>p.ticker===t)||{}).cantidad||0)-pending.filter(o=>o.side==='V'&&o.ticker===t).reduce((n,o)=>n+o.qty,0)};
  }
  function validate(data,order,price,exclude=''){
    if(!assets.some(a=>a.ticker===order.ticker))throw new Error('Selecciona un activo v\u00e1lido.');
    if(!Number.isSafeInteger(order.qty)||order.qty<1||order.qty>1000000)throw new Error('Introduce una cantidad entera entre 1 y 1 000 000.');
    if(!['C','V'].includes(order.side))throw new Error('Lado de orden no v\u00e1lido.');
    if(!Number.isFinite(price)||price<=0)throw new Error('Introduce un precio v\u00e1lido, mayor que cero.');
    const av=available(data,exclude);
    if(order.side==='C'&&round(order.qty*price*(1+FEE))>av.cash+.001)throw new Error('Efectivo insuficiente. Revisa el importe, la comisi\u00f3n y tus \u00f3rdenes pendientes.');
    if(order.side==='V'&&order.qty>av.shares(order.ticker))throw new Error('No tienes suficientes acciones disponibles. No se permiten ventas en corto.');
  }
  function fill(data,order,price){
    validate(data,order,price,order.id);
    const gross=round(price*order.qty),fee=round(gross*FEE),p=data.portfolio;
    let pos=p.posiciones.find(x=>x.ticker===order.ticker);
    if(order.side==='C'){
      p.efectivo=round(p.efectivo-gross-fee);
      if(pos){pos.costo=(pos.costo*pos.cantidad+gross+fee)/(pos.cantidad+order.qty);pos.cantidad+=order.qty;}
      else p.posiciones.push({ticker:order.ticker,cantidad:order.qty,costo:(gross+fee)/order.qty});
    }else{
      p.efectivo=round(p.efectivo+gross-fee);data.realized=round((data.realized||0)+gross-fee-pos.costo*order.qty);pos.cantidad-=order.qty;p.posiciones=p.posiciones.filter(p=>p.cantidad>0);
    }
    Object.assign(order,{status:'filled',price,fee,gross,filledAt:Date.now()});
  }
  function notify(title,message,type='info',withToast=true){const all=safeRead('eia_notifications',[]);all.unshift({id:uid('N'),title,message,type,time:Date.now(),read:false});write('eia_notifications',all.slice(0,80));emit('market:notifications');if(withToast)UI.toast(message);}
  async function placeOrder(input){return locked(()=>{
    const data=ledger();const q=quote(input.ticker),price=input.side==='C'?q.ask:q.bid;
    const order={id:uid('EIA'),ticker:input.ticker,side:input.side,qty:Number(input.qty),type:input.type||'market',limit:Number(input.limit)||null,createdAt:Date.now(),status:'pending'};
    if(!['market','limit'].includes(order.type))throw new Error('Tipo de orden no permitido.');
    if(order.type==='market'&&Number.isFinite(input.expectedPrice)&&Math.abs(price/input.expectedPrice-1)>.003)throw new Error('La cotizaci\u00f3n cambi\u00f3. Revisa y confirma una nueva orden.');
    validate(data,order,order.type==='limit'?order.limit:price);
    data.orders.unshift(order);
    const marketable=order.type==='market'||(order.side==='C'?price<=order.limit:price>=order.limit);
    if(marketable)fill(data,order,price);
    saveLedger(data);EIA.setTicker(order.ticker);
    notify(order.status==='filled'?'Orden ejecutada':'Orden l\u00edmite registrada',`${order.side==='C'?'Compra':'Venta'} de ${order.qty} ${order.ticker} ${order.status==='filled'?'a '+UI.money(order.price):'a la espera del precio l\u00edmite'}.`,'order');
    return copy(order);
  });}
  async function cancelOrder(id){return locked(()=>{const d=ledger(),o=d.orders.find(o=>o.id===id);if(!o||o.status!=='pending')throw new Error('La orden ya no est\u00e1 pendiente.');o.status='cancelled';o.cancelledAt=Date.now();saveLedger(d);notify('Orden cancelada',`${o.ticker}: se liber\u00f3 el saldo o las acciones reservadas.`,'order');});}
  async function checkOrders(){if(checking||document.hidden)return;checking=true;try{await locked(()=>{const d=ledger();let changed=false;const messages=[];
    d.orders.filter(o=>o.status==='pending').sort((a,b)=>a.createdAt-b.createdAt).forEach(o=>{const q=quote(o.ticker),p=o.side==='C'?q.ask:q.bid;if(o.side==='C'?p<=o.limit:p>=o.limit){try{fill(d,o,p);messages.push(`${o.qty} ${o.ticker} ejecutadas a ${UI.money(p)}.`);}catch(e){o.status='rejected';o.reason=e.message;messages.push(`${o.ticker}: ${e.message}`);}changed=true;}});
    if(changed){saveLedger(d);messages.forEach(m=>notify('Actualizaci\u00f3n de orden l\u00edmite',m,'order'));}
  });}finally{checking=false;}}
  function portfolio(){const d=ledger(),p=d.portfolio,positions=p.posiciones.map(p=>({...p,quote:quote(p.ticker)}));const value=positions.reduce((n,p)=>n+p.cantidad*p.quote.last,0),cost=positions.reduce((n,p)=>n+p.cantidad*p.costo,0);
    const base=seed.portafolio_demo.efectivo+seed.portafolio_demo.posiciones.reduce((n,p)=>n+p.costo*p.cantidad,0);
    return {cash:p.efectivo,positions,value,nav:p.efectivo+value,unrealized:value-cost,realized:d.realized||0,returnPct:((p.efectivo+value)/base-1)*100,base,availableCash:available(d).cash};}
  function watch(){return safeRead('eia_watch',seed?.watchlist_inicial||[]).filter(t=>assets.some(a=>a.ticker===t));}
  function toggleWatch(ticker){if(!assets.some(a=>a.ticker===ticker))return;const w=watch(),exists=w.includes(ticker);write('eia_watch',exists?w.filter(t=>t!==ticker):[...w,ticker]);emit('market:watch');UI.toast(`${ticker} ${exists?'se quit\u00f3 de':'se a\u00f1adi\u00f3 a'} tu watchlist.`);}
  function alerts(){return safeRead('eia_alerts_v2',[]);}
  function addAlert(ticker,type,value){if(!assets.some(a=>a.ticker===ticker)||!['precio_sobre','precio_bajo'].includes(type)||!Number.isFinite(value)||value<=0)throw new Error('Selecciona un activo y un precio objetivo v\u00e1lido.');const all=alerts();all.unshift({id:uid('AL'),ticker,tipo:type,umbral:round(value),activa:true,createdAt:Date.now()});write('eia_alerts_v2',all);emit('market:alerts');UI.toast('Alerta creada. Se evaluar\u00e1 mientras la demo est\u00e9 abierta.');}
  function deleteAlert(id){write('eia_alerts_v2',alerts().filter(a=>a.id!==id));emit('market:alerts');UI.toast('Alerta eliminada.');}
  function toggleAlert(id){const all=alerts(),a=all.find(a=>a.id===id);if(a){a.activa=!a.activa;delete a.triggeredAt;write('eia_alerts_v2',all);emit('market:alerts');}}
  async function checkAlerts(){if(document.hidden)return;await locked(()=>{const all=alerts();let changed=false;all.forEach(a=>{if(!a.activa)return;const q=quote(a.ticker),ok=a.tipo==='precio_sobre'?q.last>=a.umbral:a.tipo==='precio_bajo'?q.last<=a.umbral:a.tipo==='var_1d_menor_a_pct'?q.change<=a.umbral:q.change>=a.umbral;if(ok){a.activa=false;a.triggeredAt=Date.now();changed=true;notify('Objetivo de precio alcanzado',`${a.ticker} cumple tu condici\u00f3n en la simulaci\u00f3n. Cotizaci\u00f3n: ${UI.money(q.last)}.`,'alert');}});if(changed){write('eia_alerts_v2',all);emit('market:alerts');}});}
  function toggle(){const s=state();s.frozenTick=tick();s.enabled=!s.enabled;write('eia_simulation',s);emit('market:tick');UI.toast(s.enabled?'Cotizaciones simuladas reanudadas.':'Cotizaciones simuladas en pausa.');return s.enabled;}
  async function reset(all=false){await locked(()=>{saveLedger({portfolio:copy(seed.portafolio_demo),orders:[],realized:0});if(all){write('eia_watch',copy(seed.watchlist_inicial));write('eia_alerts_v2',seed.alertas.map(a=>({...a,id:uid('AL')})));['eia_pf','eia_ticker','portafolio_seleccionado'].forEach(k=>localStorage.removeItem(k));}write('eia_notifications',[]);});emit('market:notifications');emit('market:watch');emit('market:alerts');UI.toast('Simulaci\u00f3n restablecida.');}
  async function init(){if(started)return;[assets,seed,history]=await Promise.all([loadJSON('10_dashboard_mercado.json'),loadJSON('11_watchlist_alertas_portafolio_demo.json'),loadJSON('02_precios_sinteticos_504d.json')]);
    if(!safeRead('eia_ledger_v2')){const old=safeRead('eia_port');const p=old&&Number.isFinite(old.efectivo)&&Array.isArray(old.posiciones)?old:seed.portafolio_demo;saveLedger({portfolio:copy(p),orders:[],realized:0});}
    if(!safeRead('eia_alerts_v2'))write('eia_alerts_v2',seed.alertas.map((a,i)=>({...a,id:'DEMO-'+i})));
    if(!safeRead('eia_simulation'))write('eia_simulation',state());
    started=true;
    setInterval(()=>{if(!document.hidden){emit('market:tick');checkOrders().catch(()=>{});checkAlerts().catch(()=>{});}},5000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){emit('market:tick');checkOrders().catch(()=>{});}});
    window.addEventListener('storage',e=>{if(e.key?.startsWith('eia_')){emit('market:state');emit('market:tick');emit('market:watch');emit('market:alerts');emit('market:notifications');}});
  }
  window.Market={init,get assets(){return assets;},get history(){return history;},quote,portfolio,watch,toggleWatch,alerts,addAlert,deleteAlert,toggleAlert,state,toggle,placeOrder,cancelOrder,orders:()=>ledger().orders,available,reset,feeRate:FEE,
    series:t=>Array.from({length:30},(_,i)=>at(t,tick()-29+i)),notifications:()=>safeRead('eia_notifications',[]),markNotificationsRead:()=>{write('eia_notifications',safeRead('eia_notifications',[]).map(n=>({...n,read:true})));emit('market:notifications');},notify};
})();
