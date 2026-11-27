# Guía de cámara y voz
## 1. Abrir el espacio de trabajo

Extrae el ZIP completo. Desde la carpeta `Ernesto_Investing_AI`, ejecuta:

```powershell
py iniciar.py --multimodal
```

En macOS/Linux sustituye `py` por `python3`. El iniciador abre `interaccion.html`
en el servidor local. Deja la terminal abierta. En Windows también se incluye
`INICIAR_MULTIMODAL_WINDOWS.bat`.

Puedes continuar con el inicio tradicional (`py iniciar.py`) y pulsar **Cámara
y voz** en cualquier pantalla. Ningún recurso de seguimiento se carga ni se pide
permiso hasta activar la cámara. El asistente de voz funciona por separado.

La aplicación se muestra en un marco del mismo origen dentro del espacio de
asistencia. Así, al cambiar de módulo no se recrea el seguimiento ni se solicita
otra cámara. Al recargar o cerrar el espacio, ambos controles vuelven apagados.

## 2. Preparar los recursos de seguimiento

El ZIP contiene el código de integración, no los binarios de MediaPipe. Por defecto
se utiliza `@mediapipe/tasks-vision@0.10.21` y el modelo `hand_landmarker/float16/1`
desde jsDelivr y Google. La cámara necesita conexión para cargar esos recursos;
no se garantiza funcionamiento offline a partir de la caché.

Para una demostración sin Internet, instala los recursos **antes**, con conexión:

```powershell
py preparar_camara.py
py preparar_camara.py --verify
py iniciar.py --multimodal
```

El instalador usa exclusivamente la biblioteca estándar de Python. Descarga JS,
WASM, modelo y licencia; valida formatos y registra tamaños, origen y SHA-256.
Solo cambia `vendor/mediapipe/sources.json` a `local` después de completar la
instalación. Los hashes sirven para comprobar cambios posteriores, no como una
firma del proveedor. `--force` vuelve a descargar los recursos. Si la descarga
falla, corrige la conexión y repite el comando; no modifiques archivos a mano.

El resto de la plataforma, sus gráficas y los datos ya son locales. No se requiere
cuenta, clave API, npm ni un servidor de inteligencia artificial.

## 3. Activar y calibrar la mano

Abre la pestaña **Cámara**, pulsa **Activar cámara** con el ratón o teclado y
acepta el permiso del navegador. No se solicita micrófono. El permiso del
navegador no se puede aceptar mediante el cursor de la propia página.

Muestra una sola mano completa, orientada hacia la cámara y bien iluminada,
con un fondo poco recargado. Dobla los dedos que no utilices. Extiende el índice
hasta que aparezca el cursor. El modelo busca una mano; no se deben alternar
varias personas o manos durante un gesto.

En **Calibrar área**, marca dos posiciones cómodas de tu espacio de movimiento:
superior izquierda e inferior derecha. Mantén el índice estable aproximadamente
un segundo en cada una o utiliza el botón de captura. No debes tocar las esquinas
físicas de la pantalla. Solo se guardan cuatro coordenadas, no imágenes.
Restablecer elimina esa calibración personalizada. Cambiar la vista espejo también
la restablece para evitar invertir el control accidentalmente.

Menor **Respuesta del cursor** produce más suavizado. La **Sensibilidad** regula
scroll, desplazamiento y zoom. Ratón y teclado siguen disponibles; el movimiento
real del ratón tiene prioridad temporal frente a los gestos.

## 4. Gestos implementados

| Postura / movimiento | Acción |
|---|---|
| Solo índice extendido | Apuntar y mover el cursor virtual. |
| Pulgar e índice: pinza corta y soltar | Clic sobre el control señalado. |
| Pulgar e índice unidos, mantener y mover | Arrastrar una gráfica, un deslizador o el contenido. |
| Índice y medio extendidos, mover juntos verticalmente | Desplazar página o panel. |
| Los mismos índice y medio, mover juntos horizontalmente sobre una gráfica | Desplazar la ventana de datos. |
| Separar esos mismos índice y medio sobre la gráfica | Acercar la gráfica. |
| Acercar esos mismos índice y medio | Alejar la gráfica. |
| Palma abierta aproximadamente medio segundo | Pausar gestos; la vista previa permanece activa. |
| Índice estable un segundo tras una pausa | Reanudar los gestos. |
| Puño cerrado | Cancelar el gesto y detener la lectura. |

Para pasar de scroll a zoom, o de zoom a desplazamiento, **vuelve primero a un
solo índice**. La primera variación clara bloquea el tipo de gesto mientras sigues
mostrando dos dedos. De esta forma no se desplaza y amplía una gráfica a la vez.

Se utiliza la distancia entre las puntas del índice y el medio normalizada por
el tamaño de la palma, preferentemente con coordenadas 3D del modelo. Esto reduce
la confusión por acercar toda la mano, pero no elimina los errores de perspectiva,
oclusiones o detección. Mantén una distancia y orientación cómodas y estables.

El zoom actúa sobre la gráfica, no sobre el navegador. Se conserva su ventana
mínima y máxima, el tope horizontal y el ajuste vertical automático. Capital y
drawdown continúan sincronizados. No se agregan ni cambian datos financieros.

Al perder la mano, se cancela cualquier clic pendiente; no se ejecuta al reaparecer.
Para seleccionar un punto del Optimizador, apúntalo y realiza una pinza corta.

## 5. Formularios y confirmaciones

Un clic gestual en un selector abre una lista grande de opciones. Un clic gestual
en un campo editable abre un teclado virtual alfanumérico o numérico. Al aplicar
se ejecutan los mismos eventos y validaciones del formulario original. Las
contraseñas y los selectores de archivo requieren entrada convencional.

Las órdenes conservan la revisión previa: llenar el formulario o leerlo no opera.
Para pulsar **Confirmar** mediante gestos se exigen dos pinzas distintas sobre
el botón dentro de seis segundos. La primera muestra un aviso; la segunda hace
el clic normal, sin saltarse saldo, cantidad, comisión ni validaciones. Con ratón
se conserva el flujo original. **La parada de cámara y voz siempre es inmediata**.

## 6. Lector contextual

En **Asistente**, pulsa **Activar voz** con ratón o teclado al menos la primera vez
para satisfacer las restricciones de audio del navegador. No hay escucha de voz,
reconocimiento de comandos, micrófono, chat remoto ni respuestas generativas.
Es un lector y resumidor determinista de la propia interfaz.

Puedes preparar un resumen de pantalla, leer su contenido principal completo,
leer una selección de texto o el último elemento apuntado, y describir una gráfica.
El desplegable de gráficas permite elegir capital o drawdown, por ejemplo. Las
descripciones usan las series visibles, los filtros vigentes y el tramo que estás
mirando; no extraen cifras del dibujo ni inventan resultados.

**Leer al señalar** es opcional: mantener el índice o ratón dos segundos sobre un
elemento inicia su lectura, no hace clic. Mantenerse sobre él no repite
indefinidamente la lectura. Al moverte a otro elemento se inicia otra espera.
También hay opciones independientes para leer al cambiar de módulo y anunciar
confirmaciones/alertas. No se anuncian todas las oscilaciones de precio.

El texto es una instantánea del momento de solicitar la lectura. Si cambias un
filtro o un precio mientras habla, solicita un resumen nuevo. Una notificación
no interrumpe una lectura ya activa. El panel muestra la transcripción aunque no
haya una voz disponible o el navegador bloquee el audio.

En las preferencias puedes elegir voz, velocidad, tono y volumen. Por defecto
solo son elegibles voces marcadas como locales por el navegador. Si no hay una
voz española local, instala una voz en tu sistema o permite expresamente voces
remotas: **estas pueden enviar el texto al proveedor**. No todas las voces
respetan tono/velocidad igual. La compatibilidad y calidad dependen del dispositivo.
El lector complementa, no reemplaza, los lectores de pantalla habituales.

## 7. Seguridad y privacidad operativa

Cámara y voz comienzan apagadas. No se guardan fotografías ni vídeo. La inferencia
de manos ocurre en el navegador; la red se utiliza para recursos descargables,
no para enviar fotogramas. El instalador tampoco abre la cámara.

Ocultar la vista previa **no apaga la cámara**. El botón de la barra sigue marcado.
En cambio, ocultar la pestaña, salir del espacio, apagar la cámara o pulsar la
parada libera el flujo. Volver a la pestaña no lo reactiva automáticamente.
Solo se persisten preferencias y calibración, no el permiso ni el estado encendido.

Atajos: **Esc** detiene la lectura, cierra el panel emergente y pausa gestos;
**Alt + Mayús + A** abre el asistente; **Alt + Mayús + C** alterna la cámara.
La parada de la barra inferior apaga cámara y voz. El botón de salir vuelve a
la página tradicional y libera los recursos.

## 8. Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| No solicita permiso | Abrir mediante `iniciar.py` en localhost/127.0.0.1 o HTTPS. No usar `file://`. |
| Permiso denegado | Ajustar los permisos de cámara del sitio y volver a activarla. |
| Cámara ocupada | Cerrar otras aplicaciones que la usen y comprobar permisos del sistema. |
| No carga el seguimiento | Comprobar Internet, bloqueo de CDN/proxy o ejecutar `preparar_camara.py`. |
| Modelo local incompleto | Ejecutar `preparar_camara.py --verify`; reinstalar con `--force` si corresponde. |
| No aparece el cursor | Mostrar mano completa, extender solo índice, mejorar luz y calibrar. |
| Se mueve a saltos | Aumentar suavizado bajando Respuesta del cursor; evitar contraluz y fondo complejo. |
| Confunde zoom y scroll | Volver al índice y comenzar el nuevo gesto con claridad; mantener estable la distancia a la cámara. |
| No hay voz | Activarla con ratón, revisar volumen y voces del sistema; consultar el aviso del panel. |
| El modelo va lento | Cerrar aplicaciones pesadas; se usa un worker y un fallback de CPU, pero el rendimiento varía. |
| Cambios no aparecen | Recargar con Ctrl+F5 y comprobar que se extrajo todo el ZIP en una carpeta nueva. |

Este control es de la página web, no del escritorio ni del sistema operativo. No
se certifica compatibilidad con todos los navegadores, dispositivos, pantallas
táctiles o configuraciones corporativas. Verifica la cámara, precisión, permisos y
audio en el equipo de la demostración antes de presentarlo.
