# Cámara y voz · v3.0

Esta entrega integra seguimiento de una mano y un lector contextual opcionales.
Los datos financieros y el controlador de gráficas de v2.1 no se modifican.

**Inicio directo:** `py iniciar.py --multimodal` (Windows) o
`python3 iniciar.py --multimodal` (macOS/Linux). También puedes abrir
`INICIAR_MULTIMODAL_WINDOWS.bat`. Desde cualquier pantalla normal, el botón
**Cámara y voz** abre el mismo espacio de trabajo.

**Importante:** el ZIP incluye la integración completa, pero no los binarios de
MediaPipe. Por defecto se descargan de jsDelivr/Google al activar la cámara.
Para instalarlos localmente y no depender de Internet después, ejecuta una vez
`py preparar_camara.py` o `python3 preparar_camara.py` con conexión.
El resto de la aplicación y sus gráficas continúan funcionando sin Internet.
Las voces disponibles dependen de tu navegador y del sistema operativo.

Consulta `GUIA_CAMARA_Y_VOZ.md`, `CAMBIOS_MULTIMODAL.md` y
`docs/VALIDACION_MULTIMODAL.md`. La cámara física, el modelo descargable y el
audio de tu dispositivo requieren verificación local; las pruebas automatizadas
incluidas no sustituyen esa comprobación.

---

# Ernesto Investing AI
## Interfaz simulada de alta fidelidad - v2.1

**Equipo C - Interaccion Humano-Computador, FISI-UNMSM.**

Una experiencia financiera educativa con Dashboard, Watchlist, Trading,
Clasificacion, Regresion, Optimizador, Portafolios, Backtesting y Leaderboard.
La interfaz incluye navegacion lateral, temas oscuro/claro, graficos interactivos
locales y una cuenta virtual compartida entre pantallas.

> No es una plataforma de inversion real. No envia ordenes a un intermediario,
> no conecta con mercados y no entrena modelos de IA. Los resultados analiticos
> proceden de los JSON sinteticos suministrados. Sin dinero real ni asesoria financiera.

## Actualizacion de graficas (v2.1)

Los graficos de Dashboard, Trading, Regresion, Optimizador y Backtesting ya tienen
limites de desplazamiento. Arrastrar contra un borde no cambia el zoom ni deja
una ventana sin datos; Y se ajusta al tramo visible y no admite arrastre libre.
La barra inferior permite desplazar, acercar, alejar, ver todo y restablecer.
En las series temporales tambien puedes enfocar el grafico con Tab y usar
flechas izquierda/derecha, Inicio, Fin, +, - y 0. Doble clic restaura la vista inicial.

Dashboard y Trading incluyen 504 sesiones; Regresion ofrece esa misma historia
mas las 30 proyecciones originales. Optimizador conserva los puntos originales.
Capital y drawdown de Backtesting comparten exactamente el mismo intervalo.
No se inventan proyecciones adicionales ni se extiende artificialmente un rendimiento.

Consulta `CAMBIOS_GRAFICAS.md` y `docs/VALIDACION_GRAFICAS.md` para la procedencia
de los datos nuevos, alcance, pruebas y limitaciones del entorno de validacion.

## Abrir la aplicacion

Extrae el ZIP completo y abre una terminal en la carpeta que contiene `iniciar.py`.
Con Python 3 instalado:

```powershell
# Windows
py iniciar.py
```

```bash
# macOS / Linux
python3 iniciar.py
```

El navegador se abre automaticamente. La terminal muestra la direccion elegida.
Por defecto usa `http://127.0.0.1:8000/`; si esta ocupado prueba puertos siguientes.
Deja la terminal abierta y presiona `Ctrl+C` para detener el servidor.
En Windows tambien puedes ejecutar `INICIAR_WINDOWS.bat`.

Alternativa sin iniciador:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000/`. No abras `index.html` mediante `file://`.
No necesitas instalar paquetes de Python, Node.js, npm, pnpm ni configurar un backend.

**Esta entrega se ejecuta desde la raiz.** `figma-src/` se conserva sin cambios como
fuente del prototipo React original; no contiene el nuevo acabado de esta entrega.

## Que puedes hacer

- Explorar 26 activos, filtrar y ordenar la tabla, exportar CSV, guardar favoritos,
  cambiar entre velas y lineas, y seleccionar 20, 60, 120, 252 o 504 sesiones historicas.
  El historial completo permanece cargado: arrastre acotado, zoom, barra de posicion
  y escala vertical automatica que impide perder las series fuera de la pantalla.
- Buscar activos o pantallas con `Ctrl+K` / `Cmd+K`; consultar notificaciones reales
  de la simulacion y usar un menu lateral adaptable.
- Comprar y vender acciones virtuales mediante ordenes a mercado o limite,
  revisar la orden antes de enviarla, recibir su comprobante y cancelar pendientes.
- Consultar efectivo, posiciones, comisiones, ganancias y perdidas e historial.
  Las ordenes pendientes reservan saldo o acciones y no cobran antes de ejecutarse.
- Crear alertas de precio, activarlas o desactivarlas y recibir su aviso local.
- Explorar los modulos de analisis suministrados con la nueva identidad visual y
  graficos renderizados localmente, sin CDN.

## Simulacion y persistencia

La cuenta parte de los **USD 25 000 en efectivo y posiciones precargadas** del JSON
`11_watchlist_alertas_portafolio_demo.json`; el patrimonio total incluye esas posiciones.
Las operaciones aplican una comision simulada de **0.10 %** y un spread bid/ask
explicito. No hay ventas en corto, apalancamiento, acciones fraccionarias, ejecucion
parcial, prioridad de mercado real ni garantias de liquidez.

Las cotizaciones de demostracion varian cada cinco segundos con una funcion
reproducible y acotada alrededor del snapshot del archivo. No son precios actuales.
Los 13 archivos de datos originales permanecen intactos, con corte historico al
**11 de noviembre de 2026**. El archivo adicional `14_ohlcv_sintetico_504d.json`
conserva todos los cierres de la historia y las ultimas 120 velas originales;
reconstruye unicamente apertura, maximo, minimo y volumen de 384 sesiones anteriores,
de manera sintetica y reproducible. No agrega nuevas observaciones de mercado.
La cotizacion dinamica y la ultima vela historica pueden diferir: estan etiquetadas
por separado. Los resultados de Clasificacion, Regresion y Backtesting no se
recalculan al cambiar esas cotizaciones.

Las alertas y ordenes pendientes se evaluran mientras la aplicacion esta abierta
y la pestana esta visible. No funcionan como un servicio en segundo plano.
`Pausar demo` congela las cotizaciones, no borra ordenes ni desactiva alertas.

El estado se guarda solo en `localStorage`. No se sincroniza con una cuenta externa.
Usa el mismo navegador y origen (host y puerto) para conservarlo. Borrar datos del
sitio elimina la simulacion. No guardes informacion sensible.

## Apariencia, idioma y accesibilidad

Tema oscuro inicial y tema claro persistente, navegacion por teclado, foco visible,
ventanas de dialogo nativas, mensajes de estado y respeto por movimiento reducido.
Las tablas extensas se desplazan horizontalmente en su propio contenedor.

La interfaz nueva esta escrita en espanol. Se conserva el selector regional y las
traducciones existentes de navegacion, cuenta y modulos analiticos; **la traduccion
de los componentes nuevos no es completa**. Arabe, japones y quechua mantienen la
condicion de borrador del material original. La moneda sigue siendo USD.
No se declara conformidad certificada con WCAG.

## Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `css/premium.css` | Sistema visual, componentes, temas y adaptacion responsive |
| `js/premium-shell.js` | Navegacion, buscador, notificaciones y marco comun |
| `js/ui.js` | Dialogos, iconos, formato, mensajes y exportacion CSV |
| `js/market.js` | Cotizaciones sinteticas, cartera, ordenes y alertas |
| `js/financial-chart.js` | Velas, lineas y volumen historico |
| `js/dashboard.js` | Dashboard y explorador de activos |
| `js/trading-pro.js` | Ticket de operacion, confirmacion e historial |
| `js/watchlist-pro.js` | Watchlist y alertas configurables |
| `js/league.js` | Liga ficticia y comparacion de la cuenta local |
| `js/chart-bridge.js` | Adaptacion especifica de los graficos analiticos originales |
| `vendor/plotly.min.js` | Motor grafico local con licencia MIT |
| `data/` | Los 13 archivos JSON originales, sin modificaciones |

`chart-bridge.js` traduce solo las opciones utilizadas en estos modulos. No es la
biblioteca ECharts ni un reemplazo universal de su API. El motor real es Plotly.js.

## Pruebas y documentacion

- `CAMBIOS_INTERFAZ.md`: cambios y alcance funcional.
- `docs/VALIDACION.md`: pruebas realizadas y limites del entorno de comprobacion.
- `tests/README.md`: como repetir las pruebas opcionales.
- `docs/README-original.md`: documentacion previa conservada como referencia historica.

Si la aplicacion no carga, confirma que el ZIP esta extraido, que el servidor sigue
abierto, que estas en la carpeta raiz y que usas la direccion que imprime el iniciador.
Con datos antiguos en el navegador, usa **Trading > Restablecer cuenta** para
comenzar con el escenario original. Recarga con `Ctrl+F5` tras sustituir una version.

## Licencias

Se conserva `LICENSE` del proyecto original (CC BY 4.0 y atribucion educativa).
Plotly.js se distribuye separadamente bajo MIT: consulta `vendor/LICENSE-plotly.txt`.
No se incluyen fuentes tipograficas comerciales ni servicios de terceros.
