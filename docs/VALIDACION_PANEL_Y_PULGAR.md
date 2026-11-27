# Validación v3.1: paneles separados y clic con el pulgar

Fecha: 27 de noviembre de 2026. Base: `Ernesto_Investing_AI_Camara_y_Voz.zip`.

## Resultado y alcance

Se completaron **235 comprobaciones** distribuidas en siete suites. Los reportes
están en `docs/qa/paneles-pulgar/`. Esto valida lógica, integración y diseño,
no la precisión de una webcam real ni la calidad del audio de un dispositivo.

| Suite | Comprobaciones completadas | Alcance |
|---|---:|---|
| `multimodal_gestures.cjs` | 44 | Geometría y estados con coordenadas sintéticas |
| `multimodal_devices.cjs` | 30 | Permisos, ciclo de vida y voz mediante dobles |
| `multimodal_panels.py` | 40 | Independencia de paneles, accesos, foco y móvil |
| `multimodal_interaction.py` | 12 | Gesto conectado a botones, zoom, lector y parada |
| `multimodal_browser.py` | 71 | Módulos, gráficas, formularios y confirmaciones |
| `chart_data_integrity.py` | 28 | Datos, cierres, velas, pronósticos y portafolios |
| `multimodal_http.py` | 10 | Archivos servidos por HTTP y comparación de bytes |

### Separación de herramientas

Se verificó que existen dos regiones accesibles diferentes, sin un contenedor
de pestañas compartido, con botones y controles de activación separados.
Los paneles de escritorio se muestran juntos sin superponerse. En móvil se
alterna el visible sin cambiar la activación de las funciones (ciclo de vida
verificado mediante dobles, sin cámara física). Se probó la restauración del
foco al minimizar, los atajos y la sincronización con el tema claro.

Se inspeccionaron capturas a 1440 x 1000 y 390 x 844. Los accesos separados también
se verificaron en la página normal, fuera del espacio persistente de asistencia.

### Gesto nuevo

El ciclo **índice extendido + pulgar abierto, cerrado hacia la palma y abierto**
produce un clic. Se verificó que la antigua pinza entre puntas no lo produce,
que una mano que aparece con el pulgar cerrado no activa botones y que los
movimientos ambiguos, posturas incompatibles y pérdidas de seguimiento cancelan
la pulsación. El arrastre conserva inicio, movimiento y liberación sin clic final.

La geometría se probó con mano reflejada, escala y rotación, incluyendo una
secuencia de 21 puntos sintéticos conectada a la máquina de estados. No se
reprodujeron grabaciones reales ni se ejecutó el modelo de inferencia descargable.
Los umbrales de palma y tiempos son heurísticas conservadoras, no una certificación
anatómica ni una garantía de reconocimiento para todas las personas.

### Conservación de la aplicación

Los **14 JSON de datos son idénticos byte a byte** a los del ZIP de entrada.
Se incluyen hashes SHA-256 y la comparación en `integridad-v3.1.json`.
También se comprobó que no cambiaron los motores financiero, de lectura y de
cámara, ni el controlador de límites de las gráficas.

Las 71 comprobaciones de integración verificaron zoom, límites X, ajuste Y,
series completas y sincronización de Backtesting; selección de activos, teclado
virtual y la doble confirmación protegida para una orden simulada. Se verificó
que el espacio mantiene la misma instancia de cámara al navegar entre módulos.

## Límites del entorno y ejecuciones adicionales

Las pruebas Playwright ejecutan HTML, CSS, JavaScript, Plotly y datos reales del
proyecto. El transporte de archivos y almacenamiento usa el armazón de pruebas
incluido porque la política del navegador del entorno bloquea la navegación HTTP
incluso hacia localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`). La tentativa nativa
se registra en `native-http-panels.json`; no se cuenta como aprobada.
El servidor sí entregó los archivos correctos al cliente HTTP de Python.

Una ejecución conjunta excedió el límite del ejecutor. La suite de integración
se repitió de forma aislada y completó 71 de 71 comprobaciones. La suite extensa
adicional `chart_navigation.py` llegó a 53 comprobaciones aprobadas antes del
límite de 180 segundos; **no se declara completa ni se suma al total de 235**.
Su registro parcial queda en `navegacion-adicional-parcial.json`. Los informes
anteriores de gráficas siguen siendo evidencia histórica, no ejecuciones nuevas.

No se validaron webcam física, inferencia de MediaPipe, exactitud de detección,
audio audible, dispositivos de todas las marcas ni persistencia nativa de
almacenamiento entre sesiones. Los dobles no acreditan esas capacidades.

## Comprobación manual recomendada en el equipo de uso

Abre la aplicación por localhost, activa la cámara y calibra el área. Comprueba
el indicador del pulgar al abrirlo hacia un lado y cerrarlo hacia la palma,
manteniendo el índice arriba y los otros tres dedos doblados. Prueba primero
botones sin consecuencias; después arrastre y zoom con índice y medio.
Minimiza cada panel y comprueba sus indicadores de actividad. Verifica por
separado el volumen y la voz elegida. Ratón y teclado permanecen disponibles.

La primera carga del modelo requiere Internet, salvo instalación local previa
con `preparar_camara.py`. Esta revisión conserva ese mecanismo sin cambios.
