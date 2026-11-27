const fs=require('fs'),vm=require('vm');
global.window={};vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','js','chart-viewport.js'),'utf8'));
const clamp=window.ChartViewport.clampRange;
let checks=0;
for(let k=0;k<1000;k++){
 const lo=-Math.abs(Math.sin(k)*1000),hi=lo+5+Math.abs(Math.cos(k)*1000);
 const start=Math.sin(k*3.1)*100000,width=.001+Math.abs(Math.sin(k*.13)*50000);
 const a=clamp([start,start+width],[lo,hi],3);
 if(!(a[0]>=lo-1e-7&&a[1]<=hi+1e-7&&a[1]>a[0]&&a[1]-a[0]>=3-1e-7))throw new Error(JSON.stringify({lo,hi,start,width,a}));
 checks++;
}
console.log('Clamp invariant cases passed:',checks);
