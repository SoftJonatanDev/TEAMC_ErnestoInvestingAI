/* Ordinary pages retain their original behaviour until the user opens Assist. */
(() => {
 'use strict';
 try{if(window!==window.parent&&window.parent.EIAMultimodalHost)return;}catch{}
 function open(){const file=location.pathname.split('/').pop()||'index.html';location.href='interaccion.html?pagina='+encodeURIComponent(file+location.search+location.hash);}
 const button=document.createElement('button');button.className='mm-launcher';button.type='button';button.setAttribute('aria-label','Abrir asistente de lectura y control por cámara');button.title='Asistente de lectura y control por cámara. Alt + Mayús + A';button.innerHTML='<span aria-hidden="true">e</span><span>Cámara y voz</span>';button.onclick=open;document.body.append(button);
 document.addEventListener('keydown',e=>{if(e.altKey&&e.shiftKey&&e.code==='KeyA'){e.preventDefault();open();}});
})();
