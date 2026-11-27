# Validación de la entrega

Fecha de preparación: 27 de noviembre de 2026.

## Resultado registrado

Se completaron **68 comprobaciones automatizadas** del código de la interfaz:
34 de flujos principales, 20 de análisis/navegación y 14 adicionales de
integridad de cuenta y adaptación a otros anchos. Los resultados originales
se incluyen en `qa/flows.json`, `qa/analysis.json` y `qa/extra.json`.

Además se renderizaron las **13 pantallas a 1440 px y a 390 px**: 26 combinaciones,
sin excepciones JavaScript, errores de consola ni desborde horizontal del documento
en las comprobaciones registradas. Se verificaron también Dashboard y Trading a
320 px, Regresión a 768 px y Optimizador a 1024 px. Las tablas extensas mantienen
su propio desplazamiento interno; eso no se considera desborde del documento.

Se inspeccionaron capturas de Dashboard, Trading, Regresión, Optimizador y vistas
móviles. Las imágenes incluidas son capturas reales de la interfaz renderizada,
no maquetas generadas por imagen. `qa/render.json` conserva las observaciones de
las 26 combinaciones de pantalla/ancho.

## Qué se comprobó

- Tabla de 26 activos, filtros, estado vacío, favoritos, búsqueda con teclado,
  cambio de rango y tipo de gráfico, tema claro y transferencia del activo elegido.
- Validación de cantidades, efectivo insuficiente y ventas sin acciones; revisión
  antes de ejecutar; compra, venta, saldo, comisión y conservación del patrimonio
  descontando spread y comisión con cotizaciones congeladas.
- Órdenes límite pendientes, reservas de efectivo/acciones, cancelación y
  liberación de reservas, límite cruzado y restauración de la cuenta.
- Alertas creadas, disparadas y desactivadas; notificaciones leídas y continuidad
  del estado entre pantallas mediante el almacén suministrado por el arnés de prueba.
- Filtros de modelos, cono de volatilidad, selección por teclado del optimizador,
  selección de perfil sin compra automática y series del Backtesting.
- Menú móvil, fondo inerte y cierre con Escape; ausencia de Sharpe ficticio en
  la cuenta local del Leaderboard.

## Alcance real del entorno de prueba

La política del navegador de este entorno bloqueaba navegar a direcciones HTTP,
incluido localhost. Por ello la validación de interfaz utilizó **Chromium con los
HTML, CSS y JavaScript reales**, insertados en una página de prueba. El arnés
entregó los JSON originales a `fetch` y emuló `localStorage` en memoria.
El motor Plotly local sí se ejecutó; los gráficos no fueron reemplazados por
imágenes ni por un objeto vacío. El código de la aplicación no se sustituyó.

Por tanto, estas pruebas **no equivalen a una prueba completa de navegación HTTP,
persistencia nativa tras cerrar el navegador o concurrencia entre pestañas**.
El script `tests/smoke.mjs` queda preparado para repetir esa verificación en un
navegador sin esa restricción; se comprobó su sintaxis, pero no se presenta como
una suite HTTP de navegador ya ejecutada.

Por separado, se inició el servidor real `iniciar.py` y se hicieron siete
solicitudes HTTP desde Python: inicio, Trading, CSS, motor de simulación, Plotly,
datos y diccionario. Todas respondieron 200 y el servidor terminó correctamente
con Ctrl+C simulado. Esto comprueba servicio de archivos, no toda la experiencia
del navegador. Registro: `qa/static-and-http.json`.

## Integridad de la entrega

Se verificaron las referencias locales de los HTML: **0 archivos faltantes y
0 recursos externos necesarios en tiempo de ejecución**. Los 13 JSON de `data/`
son idénticos byte a byte a los del ZIP suministrado, con hashes incluidos en el
registro. Los 42 archivos del prototipo React original permanecen sin cambios.
Todos los JavaScript de `js/` superaron `node --check`. El iniciador Python y los
scripts de prueba superaron la comprobación de sintaxis.

## Pendientes fuera de estas comprobaciones

Compatibilidad completa entre navegadores y lectores de pantalla; auditoría
formal WCAG; pruebas de carga y seguridad; sincronización concurrente real;
traducción completa de los componentes nuevos; despliegue de producción.
La aplicación se entrega como simulación académica, no como sistema financiero.
