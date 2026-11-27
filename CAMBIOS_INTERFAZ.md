# Cambios de la interfaz simulada

## 1. Una identidad coherente

Nueva navegacion lateral con tres grupos, barra de contexto, buscador global,
ribbon de activos, perfil de demostracion y pie con transparencia de datos.
Paleta oscura azul/marino con acentos menta, tema claro, cifras tabulares, tarjetas
con jerarquia consistente, botones y estados de foco unificados. Identidad grafica
propia mediante SVG y fuentes del sistema.

La composicion cambia en movil: menu desplegable con control de foco, tarjetas
reorganizadas, ticket de orden apilado y tablas con desplazamiento interno. Las
animaciones son discretas y respetan la preferencia de movimiento reducido.

## 2. Dashboard y seguimiento

Patrimonio de la cuenta, indicadores SPY/QQQ/EPU, precio de demostracion, compra/venta
accesible, favoritos, velas o linea, volumen y periodos de 20/60/120 sesiones.
Buscador y filtros de los 26 activos, ordenacion de columnas, vista de watchlist,
exportacion CSV, amplitud simulada de mercado y resumen de consenso de modelos.

La Watchlist permite anadir y quitar activos mediante un selector, consultar sus
variaciones y crear alertas por precio superior o inferior. Las alertas se disparan
una vez, quedan registradas y pueden reactivarse. Las notificaciones corresponden
a acciones o condiciones de la demo, no a noticias inventadas.

## 3. Operaciones con consecuencias consistentes

Ticket con activo, lado, tipo, cantidad entera y precio limite. El usuario puede
asignar una fraccion del efectivo disponible, revisar importe y comision, confirmar
o cancelar y recibir un comprobante con identificador.

Las compras a mercado usan ASK; las ventas usan BID. La comision es 0.10 %.
El precio medio de compra incluye comisiones; las ventas actualizan efectivo,
posiciones y resultado realizado. El patrimonio usa la cotizacion simulada LAST.
Una perdida inmediata pequena tras comprar puede corresponder al spread y a la
comision, no a un error de suma.

Una orden limite no cruzada reserva efectivo o acciones. Solo se ejecuta si la
cotizacion de la simulacion alcanza el limite; puede cancelarse mientras esta
pendiente. Las compras sin fondos, ventas sin acciones y cantidades invalidas
muestran un error antes de realizar cambios. No se pueden enviar dos veces desde
el mismo boton mientras la confirmacion esta procesandose.

El historial incluye pendientes, ejecutadas y canceladas. Las metricas de la
cuenta y el Leaderboard usan ese estado. No se fabrica una serie historica ni un
Sharpe para la cuenta local. Los otros participantes siguen siendo ficticios.

## 4. Analisis y graficos sin dependencia de Internet

Se conservan los datos y las funciones educativas de Clasificacion, Regresion,
Optimizador, Portafolios y Backtesting. El marco visual y los controles se integran
con el resto de la experiencia. El optimizador muestra un punto inicial de ejemplo,
seleccion de portafolios y escala de CVaR. Las opciones originales de teclado y
las tablas alternativas siguen disponibles.

Los graficos se dibujan con una copia local de Plotly.js, incluyendo su licencia.
El adaptador especifico traduce las opciones de los modulos originales. No se
requiere conexion a un CDN. El snapshot historico y los datos predictivos no se
alteran para aparentar que provienen de un mercado en tiempo real.

## 5. Comportamiento transparente

Persistencia exclusivamente local; la cuenta no tiene autenticacion real.
Busqueda global con teclado, confirmaciones, comprobantes, mensajes vacios,
notificaciones, errores de carga y boton de pausa. Los formularios no son
meramente decorativos: sus acciones afectan al estado compartido.

Las preferencias regionales existentes se mantienen. La nueva redaccion visual
esta en espanol; no se anuncia una localizacion completa de todos los componentes.
No se han implementado pagos, retiros, API de mercado ni entrenamiento de modelos.
No se modifica el prototipo React conservado en `figma-src/`.

## 6. Recorrido sugerido para probar la experiencia

Abre el Dashboard, elige NVDA, cambia las velas a linea y guarda el activo en tu
Watchlist. Abre Trading, revisa una compra pequena y confirmala. Consulta su
comprobante y el historial; crea despues una orden limite alejada del precio y
observa la reserva, luego cancelala. Crea una alerta de precio en Watchlist y
consulta sus eventos en la campana. Explora los modelos de Clasificacion,
Regresion, Optimizador y Portafolios, y termina con Backtesting.

Para una alerta de demostracion inmediata, usa una condicion claramente cumplida
por el precio sintetico y mantente en la pestana. Para una orden pendiente, usa
un limite de compra claramente inferior al ASK. Estas elecciones son mecanismos
de prueba, no recomendaciones de inversion.
