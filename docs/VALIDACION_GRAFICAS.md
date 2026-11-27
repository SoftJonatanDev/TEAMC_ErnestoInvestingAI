# Validacion de graficas - revision v2.1

Fecha de preparacion: 27 de noviembre de 2026.
Base: ZIP Ernesto_Investing_AI_Interfaz_Realista.zip proporcionado en la conversacion.
Alcance: interfaz estatica de la carpeta principal; no se modifica figma-src/.

## Resultado ejecutado

| Grupo | Comprobaciones satisfactorias | Reporte |
|---|---:|---|
| Navegacion de graficas en navegador | 101 | qa/graficas-navegacion.json |
| Integridad y consistencia numerica | 28 | qa/graficas-integridad-datos.json |
| Referencias HTML y servicio de archivos HTTP | 14 | qa/graficas-estatico-http.json |
| Regresion de flujos de la aplicacion | 34 | qa/graficas-regresion-flujos.json |
| Regresion de modulos analiticos | 20 | qa/graficas-regresion-analitica.json |
| Casos adicionales y resoluciones | 14 | qa/graficas-regresion-adicional.json |

Total: **211 comprobaciones satisfactorias**. Adicionalmente se probaron 1 000
casos deterministas de la funcion matematica que acota los intervalos. Los archivos
JavaScript de js/ pasaron la comprobacion sintactica de Node.js.

Se corrigio una expectativa obsoleta de tests/offline_flows.py: seleccionar 1M
ahora conserva los 504 puntos cargados y muestra una ventana de 20 sesiones;
antes el test esperaba que el grafico solo conservara 20 puntos. Los flujos completos
se volvieron a ejecutar despues de actualizar esa asercion, y pasaron sus 34 casos.

## Interaccion comprobada

Se usan el HTML, CSS, JavaScript y Plotly locales reales, sin reemplazar el motor
grafico. Las pruebas incluyen Dashboard, Trading, Regresion, Optimizador y Backtesting.

- Arrastres reales con raton, incluso antes de soltar: limites X, datos visibles,
  escala Y ajustada y conservacion del ancho de ventana al llegar a un extremo.
- Arrastres verticales y diagonales; cambio de zoom, barra de posicion, extremos,
  restablecimiento, doble clic, y entradas de rango invalidas mediante la API.
- Todos los 26 activos; modos velas/lineas; historia completa; resumenes calculados
  desde exactamente el tramo visible y no desde una vela fija fuera de pantalla.
- Historia y ancla de proyeccion en el indice correcto; bandas, modelos y cono;
  seleccion de puntos del Optimizador con raton y con toque real emulado por CDP.
- Estado explicito cuando todas las series se ocultan; al reactivarlas vuelven
  los limites adecuados. Sin excepciones JavaScript en estas interacciones.
- Capital y drawdown sincronizados, tambien tras cambiar la visibilidad de series.
- Atajos de teclado en series temporales. Arrastre tactil horizontal y gesto tactil
  vertical que desplaza la pagina sin mover la escala de precios.
- Escritorio a 1440 px y movil a 390 px; controles y pagina sin desborde horizontal.
  Las pruebas adicionales conservadas tambien verifican pantallas a 320/768/1024 px.

Los flujos de compra, venta, ordenes limite, reservas de saldo, cancelacion,
watchlist, alertas y persistencia emulada entre pantallas tambien se comprobaron.
La nueva navegacion no sustituye ni modifica el motor de operaciones simuladas.

## Integridad de datos

Los SHA-256 de los **13 JSON originales** coinciden con los del ZIP anterior.
El nuevo archivo 14 tiene 26 activos y 504 sesiones, sin fechas repetidas. Sus
cierres coinciden uno a uno con el archivo 02 y sus ultimas 120 velas completas
coinciden con el archivo 03. Todas las velas tienen campos finitos/positivos,
volumen entero y extremos que contienen apertura y cierre.

La reconstruccion anterior reproduce exactamente el archivo entregado al ejecutar
scripts/build_extended_ohlcv.py. No se generaron nuevos cierres ni fechas futuras.
Los campos O/H/L/V reconstruidos son sinteticos; no se atribuyen a un proveedor.

Se verifican las anclas del Dashboard y los 26 pronosticos, los 18 modelos por
activo y la contencion de la mediana en p10-p90. La diferencia maxima de la mediana
frente al calculo con los valores redondeados de los modelos es aproximadamente
0.005 unidades de precio; la diferencia maxima del retorno reportado es menor
que 0.005 puntos porcentuales. Son diferencias de redondeo ya presentes en la fuente,
no ajustes introducidos para rellenar la grafica.

Las siete curvas de Backtesting conservan sus 253 puntos, base 100 y retornos/
caidas maximas coherentes con las metricas publicadas a su precision original.
Los 170 puntos del Optimizador mantienen los pesos de la fuente y cumplen su
restriccion de tope del 25 % y tolerancia de suma de +/-2 % documentada originalmente.
No se normalizaron silenciosamente los pesos ni se inventaron metricas nuevas.

## Entorno y limites de estas pruebas

El entorno de preparacion bloquea la navegacion HTTP del navegador con
ERR_BLOCKED_BY_ADMINISTRATOR. Por eso se uso el harness offline ya incluido:
carga los archivos reales en Chromium y suministra el transporte fetch y
localStorage en memoria. Los eventos de raton, teclado, touch y el motor Plotly
son reales; no se falsean los resultados de graficas o calculos.

Por separado, un servidor Python real sirvio los recursos y el nuevo JSON por
HTTP, verificando estado 200 e igualdad de sus bytes con los archivos locales.
Esto **no equivale a una prueba de navegador de extremo a extremo sobre HTTP**.
No se afirma haber probado persistencia nativa entre sesiones/pestanas, Safari,
Firefox ni dispositivos fisicos. No se certifica una estrategia financiera o
un modelo predictivo; es una interfaz de simulacion con datos academicos.

## Reproduccion

Para comprobar los datos, basta Python estandar:

```bash
python tests/chart_data_integrity.py
```

Para las pruebas de navegador, usa las dependencias opcionales de tests/README.md:

```bash
python tests/chart_navigation.py
python tests/offline_flows.py
python tests/offline_analysis.py
python tests/offline_extra.py
```

Las comprobaciones de intervalos tambien pueden reproducirse con Node.js:

```bash
node tests/chart_clamp.cjs
```

Las dependencias de pruebas no son necesarias para abrir y usar la aplicacion.
