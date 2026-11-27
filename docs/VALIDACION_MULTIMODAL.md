# Validación de cámara y voz · v3.0

Base exacta: `Ernesto_Investing_AI_Graficas_Con_Limites.zip`.
La evidencia de esta entrega está en `docs/qa/multimodal/`.
Los documentos de validación anteriores corresponden a versiones previas.

## Qué se ejecutó

| Grupo | Comprobaciones aprobadas | Evidencia |
|---|---:|---|
| Geometría y máquina de estados gestual | 17 | `multimodal-gestures.json` |
| Contratos de cámara y voz con dobles de prueba | 30 | `multimodal-devices.json` |
| Integración navegador: 13 pantallas, formularios y gráficas | 71 | `multimodal-browser.json` |
| Gestos conectados, lectura por permanencia y parada | 12 | `multimodal-interaction.json` |
| Archivos servidos por el iniciador HTTP | 10 | `multimodal-http.json` |
| Igualdad byte a byte frente al ZIP base | 23 archivos | `multimodal-integrity.json` |
| Integridad financiera e historial reproducible | 28 | `chart-data-integrity.json` |
| Flujos financieros originales | 34 | `flows.json` |
| Módulos analíticos y navegación original | 20 | `analysis.json` |
| Navegación de gráficas original: ratón, teclado y tacto | 101 | `chart-navigation.json` |

Los primeros cinco grupos son **140 comprobaciones de la nueva integración**.
Los grupos restantes verifican conservación de archivos y ausencia de regresiones.
Son aserciones funcionales, no una medida de cobertura de código, precisión del
modelo, rendimiento con cámara, cumplimiento integral de accesibilidad o certificación.

## Detalles de los controles

Los flujos gestuales verifican separación índice-medio para acercar y aproximación
para alejar, elección exclusiva entre scroll/pan/zoom, normalización de escala,
calibración, espejo, clic único, arrastre sin clic adicional, cancelación al perder
la mano y bloqueo tras palma/puño. Las pruebas conectadas llegan desde las
características gestuales hasta controles y gráficas reales de la aplicación.

La prueba del navegador carga las pantallas originales dentro del host persistente:
el adaptador no reemplaza los cálculos financieros ni las funciones de Plotly. Prueba
selectores, entrada con teclado virtual, orden simulada con confirmación doble,
conservación de series, límites, ventana mínima, ajuste Y y sincronía de Backtesting.
Comprueba formatos de escritorio de 1440 × 1000 y móvil de 390 × 844 sin desborde
horizontal. Las capturas finales se revisaron visualmente.

Las pruebas de voz verifican segmentación, pausa, reanudación, invalidación de
callbacks tras cancelar, ausencia de lectura automática inicial, preservación de
transcripción, exclusión de contraseñas y consentimiento de voces remotas.
Se verificó que la lectura al señalar no pulse el botón señalado.

Los contratos de cámara verifican `audio:false`, permiso denegado, origen no seguro,
cancelación mientras se espera permiso, un solo flujo, errores de inicio/modelo,
desconexión, terminación del worker y liberación del flujo. La parada general
requiere una sola acción, incluso gestual; no hereda la doble confirmación de Trading.

La comparación exacta conserva los 14 JSON del ZIP base y nueve archivos centrales:
controladores de gráficas, motor financiero y módulos analíticos. No se modificaron
los cierres, OHLCV, predicciones, pesos, retornos ni comisiones del sistema.

## Límites del entorno y lo que NO se validó

**No se utilizó una cámara física ni se escuchó audio real.** Los tests del motor
usan coordenadas/características sintéticas; los tests de dispositivos emplean
sustitutos deterministas de MediaStream, Worker y SpeechSynthesis. No hay una
medida real de precisión, falsos positivos, comodidad, latencia, fps o inteligibilidad.

**No se descargó ni ejecutó el modelo MediaPipe en este entorno.** La salida a
Internet del proceso de preparación estaba bloqueada. El código utiliza las APIs
documentadas y versiones fijadas, pero la carga del modelo y su inferencia real
deben probarse en el equipo final. `preparar_camara.py --verify` informa, como se
espera en el ZIP entregado, que los binarios todavía no están instalados.

La navegación HTTP del navegador automatizado también estaba bloqueada por una
política del entorno. Por eso, los tests de navegador insertan los HTML/CSS/JS
reales y sustituyen únicamente transporte JSON, localStorage y navegación de
pantallas mediante un harness. No sustituyen el motor de gráficas o de operaciones.
Esto **no certifica** los permisos nativos, navegación HTTP completa, persistencia
real entre pestañas, CORS del CDN ni todas las políticas de iframe del navegador.

Se realizó aparte una comprobación HTTP real con el iniciador y un cliente de la
biblioteca estándar de Python: el host y sus nueve recursos adicionales responden
200 y entregan exactamente los bytes del proyecto. No es una prueba end-to-end
con cámara en navegador.

La visualización móvil se evaluó en Chromium con viewport/tacto emulados, no en
un teléfono físico. No se ejecutó una auditoría formal WCAG ni pruebas con usuarios.

## Verificación manual recomendada antes de presentar

1. Abrir el ZIP completo desde `iniciar.py --multimodal` en el equipo final.
2. Descargar recursos o preparar la instalación local; revisar permisos de cámara.
3. Confirmar detección de una mano, calibrar, probar clic, arrastre, scroll y zoom
   con índice y medio sobre cada gráfica. Repetir con diferentes luces/distancias.
4. Probar pausa, reanudación, mano fuera de cuadro, apagado y pestaña oculta.
5. Navegar entre módulos y verificar que el indicador de cámara y el seguimiento
   continúan sin abrir un segundo flujo.
6. Elegir una voz española local, escuchar cifras y texto, pausar y detener.
   Confirmar que al señalar se lee y no se ejecutan operaciones.
7. Revisar una orden de demostración y confirmar que no se ejecuta sin confirmación.
8. Si se requiere modo offline, ejecutar el instalador, verificarlo y volver a
   probar con la red desactivada. No confiar exclusivamente en la caché del CDN.

## Referencias técnicas de la integración

- Google MediaPipe, Hand Landmarker para web: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- MDN, permiso y contexto seguro de getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN, SpeechSynthesis: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- MDN, distinción local/remota de voz: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

Estas referencias describen las APIs; no equivalen a la validación del hardware
particular del usuario. El paquete MediaPipe se fija en 0.10.21 por reproducibilidad,
no porque se declare que es la versión más reciente.
