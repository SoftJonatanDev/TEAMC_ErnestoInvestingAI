/* Two independent entry points. Opening a tool NEVER activates a device. */
(() => {
 'use strict';
 try{if(window!==window.parent&&window.parent.EIAMultimodalHost)return;}catch{}
 function open(kind){
  const file=location.pathname.split('/').pop()||'index.html';
  location.href='interaccion.html?pagina='+encodeURIComponent(file+location.search+location.hash)+'&panel='+kind;
 }
 const group=document.createElement('div');
 group.className='mm-launchers';group.setAttribute('role','group');group.setAttribute('aria-label','Herramientas de asistencia');
 for(const [kind,label,icon,shortcut] of [['voice','Asistente de voz','e','A'],['camera','C\u00e1mara','eye','C']]){
  const button=document.createElement('button');button.className='mm-launcher mm-launcher-'+kind;button.type='button';
  button.setAttribute('aria-label','Abrir '+label);button.dataset.tool=kind;button.title=label+'. Alt + May\u00fas + '+shortcut;
  const mark=kind==='voice'?'e':(window.UI?UI.icon('eye',18):'C');
  button.innerHTML='<span aria-hidden="true">'+mark+'</span><span>'+label+'</span>';button.onclick=()=>open(kind);group.append(button);
 }
 document.body.append(group);
 document.addEventListener('keydown',e=>{
  if(e.altKey&&e.shiftKey&&['KeyA','KeyC'].includes(e.code)){e.preventDefault();open(e.code==='KeyC'?'camera':'voice');}
 });
})();
