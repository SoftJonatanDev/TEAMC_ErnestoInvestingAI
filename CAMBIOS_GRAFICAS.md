# Graficas acotadas y ampliacion coherente del historial - v2.1

Esta revision modifica la interfaz estatica de la carpeta principal. No requiere
instalar dependencias para usarla. Se conserva figma-src/ como fuente de referencia,
sin cambios: ejecutar esa carpeta no abre esta interfaz.

## 1. Desplazamiento horizontal

La vista se detiene en el primer y ultimo dato disponible. Un arrastre mueve el
intervalo completo, sin reducirlo al llegar al borde. Esto evita el zoom accidental
que producia el recorte individual de extremos del motor grafico.

Los datos completos permanecen cargados. Mover la vista revela las observaciones
adyacentes, no una franja de ejes vacios. Tambien se impone un ancho minimo de ventana.
En el Optimizador, el rango no puede quedarse en un hueco sin portafolios: se ajusta
al punto valido mas cercano, sin fabricar nuevos puntos.

## 2. Escala vertical

Y se ajusta automaticamente a los valores del tramo visible, con un margen pequeno.
No se admite desplazamiento vertical libre ni una escala que deje las observaciones
fuera del cuadro. Esto se aplica tambien durante los arrastres horizontales. En velas
se consideran los maximos y minimos, no solo los cierres; el volumen tiene su propio
ajuste. En Regresion se incluyen las bandas/modelos activos y el cono cuando se activa.
En drawdown el limite superior es 0 %, preservando el significado del indicador.

## 3. Historial y procedencia

| Modulo | Cobertura disponible | Regla de integridad |
|---|---|---|
| Dashboard / Trading | 504 sesiones del 06 dic. 2024 al 11 nov. 2026 | Cierres identicos a 02; ultimas 120 velas identicas a 03 |
| Regresion | 504 historicas y 30 proyectadas, hasta el 24 dic. 2026 | Proyecciones, mediana, bandas y metricas originales sin cambios |
| Optimizador | Los mismos 170 portafolios de las cuatro listas | Se muestran los que corresponden a los filtros; no se agregan soluciones ficticias |
| Backtesting | 253 puntos: base inicial y 252 sesiones | Curvas, retornos, rebalanceos y periodo originales sin cambios |

**No se inventan precios historicos futuros para rellenar el costado derecho.**
Al llegar al ultimo dato o pronostico suministrado, la vista se detiene. El espacio
util de la grafica muestra datos, y el boton Todo permite ver la cobertura completa.
Los periodos 1M, 3M, 6M y 1A son atajos de 20, 60, 120 y 252 sesiones, no meses
calendario exactos. La barra inferior siempre muestra las fechas y el conteo reales.

### Nuevo archivo: data/14_ohlcv_sintetico_504d.json

El archivo 02 ya contenia 504 cierres por cada uno de los 26 activos. El archivo 03
solo aportaba 120 velas OHLCV. Para ofrecer todo el historial tambien en modo velas:

- Se copian los 504 cierres originales sin redondearlos ni recalcularlos.
- Se copian exactamente las ultimas 120 aperturas, maximos, minimos y volumenes.
- Se reconstruyen de forma **sintetica** los campos O/H/L/V de las primeras 384
  sesiones. La apertura se basa en el cierre previo con un gap acotado; maximo y
  minimo envuelven apertura y cierre; el volumen es entero, positivo y toma la
  escala del volumen sintetico suministrado. No son datos observados nuevos.
- La semilla es estable por ticker. `scripts/build_extended_ohlcv.py` reproduce
  el archivo y valida las desigualdades `minimo <= apertura/cierre <= maximo`.
- Los metadatos, los tooltips de las velas anteriores y el pie del grafico indican
  que se trata de una reconstruccion. La simulacion de precios actual sigue
  separada del historial, como en la version anterior.

Los 13 JSON originales no se modifican. Sus huellas se conservan en
`docs/fuentes-originales.sha256.json` y se comprueban en las pruebas.

## 4. Controles e informacion sincronizada

Cada grafico afectado incluye desplazamiento anterior/siguiente, barra de posicion,
acercar/alejar, Todo y Restablecer. Doble clic restaura la vista inicial. Los botones
se desactivan cuando no procede seguir avanzando o no hay series activas.

Dashboard y Trading ofrecen 1A y Todo, ademas de 1M/3M/6M. Sus cifras bajo la grafica
corresponden al tramo visible: apertura inicial, extremos del periodo y volumen
acumulado o cierre final, segun el modulo. La cotizacion demo superior sigue
identificada por separado; no se presenta como el ultimo cierre de la vista.

Regresion mantiene una vista inicial de 120 sesiones de historia y las 30 previstas,
pero permite explorar hacia atras las 504 sesiones completas. El inicio de cada
pronostico sigue anclado al ultimo cierre original, no al borde de la ventana.

Capital y drawdown comparten el mismo desplazamiento y zoom, aunque cada grafico
conserve su propia escala Y. Cambiar las series no desincroniza las fechas. Ocultar
todas las series muestra un estado explicito, no una grafica silenciosamente vacia.

Se conserva la seleccion de portafolios mediante clic y teclado. En las series
temporales, con el contenedor enfocado mediante Tab, las flechas navegan; Inicio/Fin
van a los extremos; + y - cambian el zoom y 0 restaura la vista inicial. Tambien se
probo arrastre tactil horizontal. El gesto vertical tactil permite desplazar la pagina.

## 5. Archivos principales

`js/chart-viewport.js` centraliza limites, paneo, ajuste Y, controles y sincronizacion.
`js/financial-chart.js` conserva el historial completo y representa las velas/lineas.
`js/chart-bridge.js` aplica el mismo control a Regresion, Optimizador y Backtesting.
Los dos primeros modulos consumen el nuevo JSON; Regresion utiliza toda la historia
que ya existia. Se actualizan las descripciones, los resumenes, el CSS adaptable y las
pruebas que antes esperaban que cambiar de periodo eliminara puntos del grafico.

## 6. Validacion

Consulta `docs/VALIDACION_GRAFICAS.md`. Los reportes distinguen verificaciones
numericas, interaccion real del navegador con transporte offline y acceso HTTP a
archivos. No se afirma haber ejecutado una prueba de navegador sobre HTTP real
cuando el entorno de preparacion bloquea ese tipo de navegacion.
