# Cambios v3.0: cámara y voz

Base: `Ernesto_Investing_AI_Graficas_Con_Limites.zip`.

## Incorporado

- `interaccion.html`: espacio persistente de asistencia; aloja las 13 pantallas
  en un marco del mismo origen. El estado del detector se conserva al navegar.
- `js/multimodal/launcher.js`: acceso desde todas las pantallas normales.
- `gesture-engine.js`: geometría de 21 puntos, normalización por palma, suavizado,
  máquina de estados, histéresis de pinza, modos de dos dedos y cancelación.
- `camera.js` y `hand-worker.js`: permiso de vídeo, carga diferida de MediaPipe,
  inferencia en worker cuando está disponible, fallback y liberación del flujo.
- `input-bridge.js`: adaptador a controles reales, teclado virtual, selectores,
  hover de gráficas y confirmaciones protegidas. No modifica datos financieros.
- `reader.js`: lectura de DOM y series de Plotly, cola segmentada, pausa,
  cancelación, voces locales por defecto y consentimiento para voces remotas.
- `host.js`: calibración, preferencias, combinación de modalidades, lectura por
  permanencia, seguimiento de la pantalla actual y controles de seguridad.
- `css/multimodal.css`: componentes que siguen el tema y el tamaño de pantalla,
  cursor virtual, vista de cámara, panel, transcripción y teclado.
- `preparar_camara.py`: instalación opcional de recursos para uso local/offline.
- `iniciar.py --multimodal` e `INICIAR_MULTIMODAL_WINDOWS.bat`: acceso directo.
- Guía de uso, informe de validación y pruebas reproducibles.

## Comportamiento gestual

El índice y medio de **una misma mano** controlan tanto desplazamiento como
zoom. La primera variación clara fija el modo; volver al índice lo libera.
La pinza pulgar-índice se reserva para clic/arrastre. Las distancias relativas y
los umbrales reducen falsos positivos, pero no garantizan precisión perfecta.

La voz no hace clics ni compra/vende. La lectura al señalar exige dos segundos,
con moderación del movimiento y sin repetición mientras se sigue en el mismo
componente. Los permisos iniciales requieren una acción convencional.

## Conservado

Los 14 JSON de datos son idénticos byte a byte a los del ZIP base: 13 originales
más el historial OHLCV de 504 sesiones de v2.1. También se conservaron sin cambios
`chart-viewport.js`, `chart-bridge.js`, `financial-chart.js`, `market.js` y los
módulos analíticos. No se reconstruyeron nuevas fechas, predicciones ni precios.

Las acciones de pan/zoom llaman a `setRange` del controlador existente. Por eso
mantienen los límites horizontales, el tramo mínimo, el ajuste Y a datos visibles
y la sincronización del Backtesting. Las operaciones se envían a los controles
originales, con sus mismas validaciones y comisiones.

## Alcance y dependencias

La integración no necesita backend ni clave API. El seguimiento sí necesita los
binarios de MediaPipe, que no pudieron descargarse en este entorno: el modo
predeterminado los obtiene de Internet. Se ofrece instalación local opcional.
Las voces dependen del navegador/OS. El asistente no es un servicio de chat ni
un modelo de lenguaje: explica y lee datos con plantillas y estado de pantalla.

Los informes antiguos documentan v2.0/v2.1. El alcance ejecutado en esta entrega
está separado en `docs/VALIDACION_MULTIMODAL.md`.
