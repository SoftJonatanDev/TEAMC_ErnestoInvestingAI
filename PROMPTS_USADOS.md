# Prompts Usados — Ernesto Investing AI (Equipo C)

Registro literal de los prompts utilizados en **Figma Make** y **Claude** para el diseño y desarrollo del sistema web *Ernesto Investing AI* (IHC 2026-II, Semana 13).

## 1. Prompts de Figma Make (Diseño y Prototipo)

\<prompt id="P01_INTEGRACION_TOTAL" nombre="Figma Make: integración completa de Ernesto Investing AI en proyecto existente">

\<role> Eres un diseñador UI/UX senior y desarrollador front-end especializado en aplicaciones financieras, visualización de datos, interfaces responsive, accesibilidad WCAG 2.2 AA y prototipos funcionales desarrollados con Figma Make.

Debes trabajar SOBRE EL PROYECTO FIGMA MAKE ACTUAL.

No debes crear otro proyecto, no debes sustituir la aplicación existente y no debes reconstruir desde cero aquellas pantallas o funcionalidades que ya funcionan.
\</role>

\<context> Sistema: Ernesto Investing AI, sitio web bursátil educativo que utiliza datos sintéticos y resultados simulados.

El proyecto Figma Make actual ya contiene parte del sistema.

Antes de realizar modificaciones:

1. Inspecciona la aplicación actual.
2. Identifica las páginas, componentes, navegación, estilos, tema claro/oscuro y comportamiento responsive ya existentes.
3. Conserva las pantallas existentes y su identidad visual.
4. Reutiliza los componentes, estilos y estructura actuales siempre que sea posible.
5. Crea únicamente las páginas, componentes o funcionalidades que falten.

El resultado debe ser UNA SOLA aplicación denominada:

"Ernesto Investing AI"

con exactamente 9 módulos principales:

1. Dashboard.
2. Watchlist y alertas.
3. Trading simulado.
4. Leaderboard.
5. Clasificación.
6. Regresión.
7. Optimizador.
8. Portafolios.
9. Backtesting.

Si Dashboard, Watchlist, Trading, Leaderboard o cualquier otro módulo ya existe, NO lo vuelvas a crear. Adáptalo solamente cuando sea necesario para integrarlo a la navegación, tema y estado global.

Modo oscuro y versión móvil NO son módulos independientes.

Deben funcionar como características globales de toda la aplicación.

Universo de activos: 26 activos.

Paleta base del sistema:

- Azul principal: #0B4F9C.
- Verde positivo: #0A7D3C.

\<task>
1\. SISTEMA VISUAL Y NAVEGACIÓN

Inspecciona el proyecto existente y conserva en lo posible:

- Dashboard.
- Watchlist.
- Trading.
- Header.
- Navbar.
- Sidebar.
- Tipografía.
- Paleta.
- Tarjetas.
- Botones.
- Tablas.
- Gráficos.
- Componentes.
- Interacciones existentes.

No elimines funcionalidades que ya funcionen.

Utiliza el diseño existente como sistema visual base para los nuevos módulos.

Implementa una navegación global única con:

Dashboard | Watchlist | Trading | Leaderboard | Clasificación | Regresión | Optimizador | Portafolios | Backtesting

La opción activa debe distinguirse claramente.

Todos los módulos deben sentirse como partes de una misma aplicación.

2. DASHBOARD

Si ya existe, consérvalo.

Debe contener o mantener:

- Tarjetas SPY, QQQ y EPU.
- Precio.
- Variación porcentual.
- Indicadores positivos y negativos.
- Selector de activo.
- Filtro por grupo.
- Gráfico de velas.
- Aproximadamente 120 sesiones.
- Universo completo de 26 activos.

No rediseñarlo si ya funciona.

3. WATCHLIST Y ALERTAS

Si ya existe, consérvalo.

Debe permitir:

- Visualizar activos guardados.
- Precio y variación.
- Mini-gráficos.
- Agregar y quitar activos.
- Crear alertas de precio.
- Crear alertas de variación.
- Visualizar alertas activadas.

Las alertas activadas deben utilizar simultáneamente:

- Color.
- Texto.
- Símbolo o icono.

La información nunca debe depender exclusivamente del color.

4. TRADING SIMULADO

Si ya existe, consérvalo.

Debe incluir:

- Compra.
- Venta.
- Selector de activo.
- Cantidad.
- Precio.
- Efectivo disponible.
- Posiciones.
- Valor del portafolio.
- Historial de operaciones.
- Validación de cantidad.
- Validación de efectivo.
- Validación de posiciones disponibles.

Mostrar claramente:

"Trading simulado"

Los errores deben mostrarse próximos al campo correspondiente.

5. LEADERBOARD

Si todavía no existe, créalo.

Debe incluir:

- Ranking de traders ficticios.
- Posición.
- Nombre del usuario.
- Valor del portafolio.
- Retorno.
- Indicador de rendimiento.
- Usuario actual resaltado.

Destacar visualmente:

1.º
2.º
3.º

y posteriormente mostrar el ranking general.

El rendimiento del usuario debe ser coherente con su estado en Trading.

6. CLASIFICACIÓN BINARIA

Crear o completar el módulo Clasificación.

Debe utilizar 18 modelos:

11 modelos de Machine Learning:

- Regresión logística.
- SVC RBF.
- K vecinos.
- Naive Bayes.
- Árbol de decisión.
- Random Forest.
- Extra Trees.
- AdaBoost.
- Gradient Boosting.
- XGBoost.
- LightGBM.

7 modelos de Deep Learning:

- MLP.
- RNN.
- LSTM.
- GRU.
- BiLSTM.
- CNN 1D.
- Transformer.

La salida es estrictamente binaria:

▲ SUBE

o

▼ BAJA

Nunca mostrar:

- NEUTRO.
- HOLD.
- MANTENER.

Crear:

A. Mapa de calor activo × modelo.

Cada celda debe mostrar:

- Probabilidad de SUBE.
- SUBE o BAJA.
- Símbolo ▲ o ▼.
- Color correspondiente.

B. Panel de consenso:

- Votos SUBE.
- Votos BAJA.
- Probabilidad media.
- Confianza alta, media o baja.

C. Métricas:

- Exactitud.
- Precisión.
- Recall.
- F1.
- AUC.

D. Matriz de confusión.

E. Filtros:

- Todos.
- ML.
- DL.
- Grupo de activos.

Mostrar permanentemente:

"Datos sintéticos · clasificación simulada"

Explicar visualmente que una exactitud aproximada entre 52 % y 58 % representa un rendimiento solo ligeramente superior al azar.

7. REGRESIÓN A 30 SESIONES

Crear o completar el módulo Regresión.

Debe incluir:

- Historia reciente del activo.
- Separación clara entre historia y pronóstico.
- 30 sesiones futuras.
- Predicciones de los modelos.
- Mediana del ensamble.
- Banda p10-p90.
- Cono de volatilidad.

Controles:

- Selector de activo.
- Todos los modelos.
- Solo ML.
- Solo DL.
- Activar/desactivar modelos.

Mostrar:

"Retorno proyectado a 30 sesiones"

Ejemplos:

+2,93 % ▲

-1,70 % ▼

Tabla de métricas:

- MAPE.
- MAE.
- RMSE.
- R².
- Mejora frente a persistencia.

La incertidumbre debe estar siempre disponible visualmente.

Nunca representar el pronóstico como una certeza.

Mostrar permanentemente:

"Datos sintéticos · pronóstico simulado · no es asesoría de inversión"

8. OPTIMIZADOR

Crear o completar el módulo Optimizador.

Debe comparar:

- Markowitz.
- NSGA-II.
- NSGA-III.

Crear un gráfico riesgo-retorno:

Eje X:
Riesgo / volatilidad.

Eje Y:
Retorno esperado.

Mostrar:

- Curva eficiente de Markowitz.
- Frente NSGA-II.
- Frente NSGA-III.

Representar CVaR 95 % de NSGA-III mediante un canal visual adecuado.

Agregar controles:

- Mostrar/ocultar Markowitz.
- Mostrar/ocultar NSGA-II.
- Mostrar/ocultar NSGA-III.
- Universo completo.
- Solo activos elegibles.

Al seleccionar un punto mostrar:

- Activos.
- Pesos.
- Retorno.
- Volatilidad.
- Sharpe.
- CVaR.

Agregar explicación breve de:

- Markowitz.
- NSGA-II.
- NSGA-III.
- Criterio de activos elegibles.

Mostrar permanentemente:

"NSGA-II y NSGA-III simulados: no se ejecutó ningún algoritmo evolutivo"

9. PORTAFOLIOS

Crear o completar el módulo Portafolios.

Debe presentar tres perfiles:

- CONSERVADOR.
- MODERADO.
- AGRESIVO.

En escritorio deben mostrarse comparables lado a lado.

Cada perfil debe incluir:

- Retorno esperado.
- Volatilidad.
- Sharpe.
- CVaR.
- Composición.
- Pesos.
- Gráfico de dona o barras.

Al seleccionar un portafolio mostrar:

- Activos incluidos.
- Peso.
- Grupo.
- Razón de inclusión.

La explicación debe relacionarse visualmente con:

- Clasificación.
- Regresión.

Agregar botón:

"Llevar a Trading"

Este botón debe conectar el portafolio seleccionado con Trading simulado.

10. BACKTESTING

Crear o completar el módulo Backtesting.

Comparar tres portafolios:

- Conservador.
- Moderado.
- Agresivo.

Contra cuatro referencias:

- SPY.
- QQQ.
- EPU.
- 1/N.

Mostrar:

A. Curvas de capital base 100.

B. Curva de drawdown.

C. Tabla de métricas:

- Retorno total.
- CAGR.
- Volatilidad.
- Sharpe.
- Máximo drawdown.
- Calmar.
- Meses positivos.

D. Línea de tiempo de rebalanceos.

E. Panel de interpretación.

No asumir que los portafolios superan al mercado.

La interfaz debe poder representar honestamente que una referencia obtenga mejores resultados.

Mostrar:

"Backtesting sobre historia sintética · desempeño pasado no garantiza desempeño futuro"

11. NAVEGACIÓN CONTEXTUAL

Implementar conexiones entre módulos:

Clasificación
→ Regresión del mismo activo.

Regresión
→ Optimizador.

Optimizador
→ Portafolios.

Portafolios
→ Trading.

Mantener el activo seleccionado entre módulos cuando resulte razonable.

12. TEMA CLARO Y OSCURO

Implementar o reutilizar un único selector:

☀ Claro
🌙 Oscuro

NO crear una página llamada "Modo oscuro".

El tema debe aplicarse a los 9 módulos y modificar coherentemente:

- Fondo.
- Navbar.
- Sidebar.
- Tarjetas.
- Tablas.
- Formularios.
- Botones.
- Texto.
- Bordes.
- Gráficos.
- Ejes.
- Leyendas.
- Tooltips.

El tema seleccionado debe mantenerse al navegar.

Si ya existe modo oscuro, reutilizarlo y extenderlo a los módulos nuevos.

13. RESPONSIVE

NO crear una página llamada "Versión móvil".

Toda la aplicación debe ser responsive.

Desktop:
1280-1440 px aproximadamente.

Móvil:
390 px.

A 390 px:

- No debe existir desbordamiento horizontal general.
- Navbar y sidebar deben adaptarse.
- Tarjetas deben reorganizarse.
- Formularios deben seguir siendo legibles.
- Gráficos deben adaptarse al ancho disponible.
- Tipografía debe seguir siendo legible.
- Botones deben mantener un tamaño táctil adecuado.

En Portafolios:

Desktop:
[Conservador] [Moderado] [Agresivo]

Móvil:
[Conservador]
[Moderado]
[Agresivo]

14. COMPONENTES REUTILIZABLES

Reutilizar componentes existentes y crear componentes compartidos únicamente cuando sea necesario:

- Header.
- Navbar.
- Sidebar.
- MetricCard.
- StatusBadge.
- AssetSelector.
- FilterBar.
- DataTable.
- ChartContainer.
- Alert.
- Modal.
- Tooltip.
- FormField.
- ThemeToggle.
- SimulationNotice.

Evitar múltiples versiones visualmente distintas del mismo componente.

15. ACCESIBILIDAD

Aplicar WCAG 2.2 AA.

Contraste mínimo de texto:
4,5:1.

La información nunca debe depender solamente del color.

Ejemplo correcto:

Verde + ▲ + SUBE.

Rojo + ▼ + BAJA.

Implementar:

- Foco visible.
- Navegación por teclado.
- Labels.
- Estados de error comprensibles.
- Tooltips cuando sean necesarios.
- Tablas legibles.
- Alternativas textuales para información importante de los gráficos.

16. ESTADO COMPARTIDO

Preparar la aplicación para compartir coherentemente:

- Watchlist.
- Activo seleccionado.
- Portafolio seleccionado.
- Estado de Trading.
- Tema seleccionado.

La experiencia debe sentirse como una sola aplicación.

17. REVISIÓN FINAL

Después de integrar todo, recorrer los nueve módulos.

Corregir:

- Navegación rota.
- Componentes duplicados.
- Diferencias innecesarias de estilo.
- Elementos fuera del viewport.
- Contraste deficiente.
- Desbordamientos.
- Páginas inaccesibles.
- Botones sin acción.
- Estados activos incorrectos.

No eliminar requisitos para resolver problemas de implementación.
\</task>

\<constraints>
\- Trabajar sobre ESTE proyecto Figma Make existente.
\- No crear un nuevo proyecto.
\- No reemplazar la aplicación actual.
\- No eliminar pantallas existentes.
\- No reconstruir Dashboard, Watchlist o Trading si ya funcionan.
\- Crear únicamente los módulos o funcionalidades faltantes.
\- El resultado debe contener exactamente 9 módulos principales.
\- Modo oscuro NO es un décimo módulo.
\- Versión móvil NO es un décimo módulo.
\- No crear una página "Modo oscuro".
\- No crear una página "Versión móvil".
\- Clasificación solo puede mostrar SUBE o BAJA.
\- Nunca utilizar NEUTRO, HOLD o MANTENER como salida del clasificador.
\- Mantener el mismo lenguaje visual en los 9 módulos.
\- Identificar los resultados predictivos como datos sintéticos o simulados.
\- No presentar las predicciones como asesoría financiera.
\- No eliminar gráficos, métricas o tablas obligatorias para simplificar la aplicación.
\- No modificar radicalmente el diseño existente.
\- Reutilizar componentes siempre que sea posible.
\- Toda la aplicación debe funcionar desde una única navegación.
\</constraints>

\<output>
Modificar directamente el proyecto Figma Make actual.

El resultado debe ser UNA SOLA aplicación:

Ernesto Investing AI

con:

1. Dashboard.
2. Watchlist.
3. Trading.
4. Leaderboard.
5. Clasificación.
6. Regresión.
7. Optimizador.
8. Portafolios.
9. Backtesting.

Todos deben compartir:

- Navegación global.
- Componentes.
- Tema claro.
- Tema oscuro.
- Estado compartido.
- Responsive móvil.

No generar una aplicación separada.

Implementar directamente los cambios en el proyecto actual.
\</output>

\<verification>
Antes de finalizar verificar:

- Existen exactamente 9 módulos.
- Todos utilizan una única navegación.
- Dashboard sigue funcionando.
- Watchlist sigue funcionando.
- Trading sigue funcionando.
- Leaderboard está disponible.
- Clasificación contiene 18 modelos.
- Clasificación utiliza únicamente SUBE y BAJA.
- Regresión representa 30 sesiones futuras.
- Regresión muestra incertidumbre.
- Optimizador incluye Markowitz.
- Optimizador incluye NSGA-II.
- Optimizador incluye NSGA-III.
- Portafolios contiene Conservador.
- Portafolios contiene Moderado.
- Portafolios contiene Agresivo.
- Portafolios conecta con Trading.
- Backtesting contiene los tres perfiles.
- Backtesting compara SPY, QQQ, EPU y 1/N.
- Tema oscuro funciona en los 9 módulos.
- Los gráficos también responden al cambio de tema.
- Tema claro funciona en los 9 módulos.
- No existe una página independiente "Modo oscuro".
- No existe una página independiente "Versión móvil".
- A 390 px no existe desbordamiento horizontal general.
- La navegación móvil funciona.
- El contraste mínimo es 4,5:1.
- SUBE/BAJA utilizan texto, símbolo y color.
- Los módulos predictivos informan que usan datos sintéticos o simulados.
- La aplicación se comporta como UN SOLO SISTEMA.

Si se detecta un fallo durante esta revisión, corregirlo antes de considerar terminada la implementación.
\</verification>

\</prompt>


## 2. Prompts de Claude (Implementación de Módulos)

### 2.1. Módulo Clasificación (`clasificacion.html` y `js/clasificacion.js`)

```xml
<prompt id="P06_Clasificacion" nombre="Claude: módulo de Clasificación direccional ML y DL">
<role>Eres un desarrollador front-end senior especializado en visualización financiera accesible (WCAG 2.2 AA).</role>
<context>
Sistema Ernesto Investing AI. Archivos de salida: clasificacion.html y js/clasificacion.js.
Usa css/styles.css y js/common.js existentes (funciones $, fmt, loadJSON, store).
Conserva exactamente la barra de navegación superior y el selector de tema claro/oscuro del archivo clasificacion.html base adjunto (igual que en portafolios.html y backtesting.html).
Para el contenido principal, sigue la estructura visual de la captura adjunta:
1. Banner superior de advertencia: «Datos sintéticos · clasificación simulada. No constituye asesoría de inversión.»
2. Barra de controles:
   - Izquierda: botones tipo píldora para filtrar modelos («Todos los modelos», «ML», «DL») con estado aria-pressed.
   - Derecha: selector desplegable (<select>) de activo/ticker (si la URL trae ?ticker=XXX, seleccionar ese ticker por defecto; de lo contrario, el primero disponible, como SPY).
3. Fila de 4 tarjetas KPI sincronizadas con el activo seleccionado y los modelos visibles según el filtro (Todos / ML / DL):
   - Tarjeta 1: «CONSENSO · [TICKER]» mostrando dirección mayoritaria («▲ SUBE» o «▼ BAJA»), barra horizontal dividida verde/roja y conteo inferior («▲ SUBE X» y «▼ BAJA Y»).
   - Tarjeta 2: «Probabilidad media» (%) con subtítulo «Promedio de modelos visibles».
   - Tarjeta 3: «Confianza» (Alta / Media / Baja según margen respecto a 50%) con subtítulo «N modelos evaluados».
   - Tarjeta 4: «Acuerdo» (% de modelos en la dirección mayoritaria) con subtítulo «Dirección mayoritaria».
4. Tarjeta «Mapa de calor» («N activos × M modelos · probabilidad de SUBE») con leyenda superior derecha («▼ BAJA» y «▲ SUBE»):
   - Tabla/matriz accesible con primera columna fija (nombre del modelo + insignia ML o DL) y columnas para cada activo, con desplazamiento horizontal suave.
   - Cada celda muestra la probabilidad en % y la etiqueta «▲ SUBE» (verde) o «▼ BAJA» (rojo) usando doble codificación (color + símbolo + texto).
   - Al hacer clic (o presionar Enter) en el encabezado de un activo o en una celda, actualizar el activo seleccionado en toda la página y resaltar su columna.
5. Sección «Métricas específicas del modelo» con selector <select> de modelo arriba a la derecha (filtrado según Todos / ML / DL) y dos tarjetas lado a lado:
   - Izquierda: «Métricas de validación · [Modelo]» con barras horizontales y porcentajes para Exactitud, Precisión, Recall, F1 y AUC, más la nota aclaratoria inferior.
   - Derecha: «Matriz de confusión · [Modelo]» en cuadrícula 2×2 accesible (columnas «Pred. BAJA» y «Pred. SUBE»; filas «Real BAJA» y «Real SUBE») mostrando Verdadero BAJA, Falso SUBE, Falso BAJA y Verdadero SUBE.
6. Barra inferior de navegación contextual: «¿Quieres explorar el precio futuro de [TICKER]?» y botón «Ver regresión →» enlazando a regresion.html?ticker=[TICKER].
Datos de entrada: el archivo JSON de clasificación adjunto de la carpeta data/. Inspecciona su estructura exacta y mapea sus campos dinámicamente.
</context>
<task>
Genera clasificacion.html y js/clasificacion.js completos:
1. Leer todos los modelos, familias (ML/DL), activos, probabilidades, métricas de validación y matrices de confusión directamente desde el JSON adjunto de data/.
2. Recalcular dinámicamente los 4 KPIs de consenso y filtrar tanto el mapa de calor como el selector de modelo al alternar entre «Todos los modelos», «ML» y «DL».
3. Soportar parámetro de consulta ?ticker= en la URL para integración directa desde Portafolios o Watchlist.
4. Garantizar contraste WCAG 2.2 AA (mínimo 4,5:1) tanto en tema claro como en tema oscuro, atributos aria-pressed, aria-live="polite" en cambios de activo/modelo, scope="col"/"row" en tablas y cero desborde horizontal de página a 390 px de ancho (solo desplazamiento interno dentro del mapa de calor).
</task>
<constraints>
- Prohibido escribir cifras, nombres de modelos, tickers o métricas fijas en el código; todo debe provenir del JSON.
- Sin frameworks ni dependencias externas adicionales.
</constraints>
<output>Los archivos clasificacion.html y js/clasificacion.js completos, limpios y con comentarios en español.</output>
<verification>Comprobar en consola que no hay errores, que los conteos de SUBE + BAJA coinciden con los modelos visibles, que cambiar entre ML/DL actualiza los KPIs y que funciona en tema claro y oscuro.</verification>
</prompt>
```

### 2.2. Módulo Regresión (`regresion.html` y `js/regresion.js`)

<prompt id="P06_Regresion" nombre="Claude: módulo de Regresión de precios a 30 sesiones">
<role>Eres un desarrollador front-end senior especializado en visualización financiera accesible (WCAG 2.2 AA).</role>
<context>
Sistema Ernesto Investing AI. Archivos de salida: regresion.html y js/regresion.js.
Usa css/styles.css y js/common.js existentes (funciones $, fmt, loadJSON, store) y ECharts 5.5.1 desde https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js.
Conserva exactamente la barra de navegación superior y el botón de tema claro/oscuro del archivo regresion.html base adjunto (igual que en clasificacion.html, portafolios.html y backtesting.html).
Para el contenido principal, sigue exactamente la estructura visual de la captura adjunta:
1. Encabezado superior:
   - Izquierda: etiqueta «PRONÓSTICO PROBABILÍSTICO», título «Regresión de precios a 30 sesiones» y subtítulo «Historia reciente, 18 estimaciones por modelo y rango de incertidumbre.»
   - Derecha: selector desplegable (<select>) «Activo» con ticker y nombre (ej. «SPY - S&P 500 ETF»); si la URL trae ?ticker=XXX, seleccionar ese activo por defecto.
2. Banner superior de advertencia: «Datos sintéticos · pronóstico simulado · no es asesoría de inversión.»
3. Fila de 4 tarjetas KPI sincronizadas con el activo seleccionado y los modelos visibles activos:
   - Tarjeta 1: «Retorno proyectado a 30 sesiones» con dirección y variación porcentual (ej. «▲ +1.29%» en verde o «▼ -X.XX%» en rojo) y subtítulo «Mediana del ensamble · escenario, no certeza».
   - Tarjeta 2: «Precio actual» en US$ con subtítulo del ticker activo (ej. «SPY»).
   - Tarjeta 3: «Mediana día 30» en US$ con subtítulo «Estimación central».
   - Tarjeta 4: «Banda p10–p90» (rango US$ mínimo–máximo al día 30) con subtítulo «Dispersión entre modelos».
4. Tarjeta principal «Historia y pronóstico» («La línea vertical separa observaciones y 30 sesiones futuras.»):
   - Arriba a la derecha: botones filtro «Todos los modelos», «Solo ML» y «Solo DL» con estado aria-pressed.
   - Gráfico ECharts interactivo: tramo histórico izquierdo («60 sesiones atrás» hasta «Hoy») en línea continua, línea vertical punteada etiquetada «Hoy», y tramo derecho («Hoy» hasta «+30 sesiones») con trayectorias individuales de cada modelo visible, línea central destacada «Mediana del ensamble» y área sombreada «Banda p10–p90» calculada sesión a sesión con los percentiles 10 y 90 de los modelos activos.
   - Leyenda inferior: Historia, Modelos individuales, Mediana del ensamble y Banda p10–p90.
5. Sección inferior en 2 columnas:
   - Izquierda: tarjeta «Modelos visibles» con contador dinámico («N de 18 modelos»), botón «Ocultar todos» / «Mostrar todos» arriba a la derecha, cuadrícula de 2 columnas con interruptores individuales por modelo (icono de visibilidad, color de serie, nombre e insignia «ML» o «DL») y nota inferior: «La banda p10–p90 se calcula en cada sesión con la dispersión de los modelos incluidos en la vista.»
   - Derecha: tarjeta «Métricas de validación · 18 regresores» con tabla desplazable y ordenable con columnas: MODELO, TIPO (ML/DL), MAPE, MAE, RMSE, R² y VS. PERSISTENCIA (con flecha ▲/▼ y color accesible).
6. Barra inferior de navegación contextual: «Usa las señales de [TICKER] dentro de una asignación diversificada.» y botón primario de alto contraste «Ir al Optimizador →» enlazando a optimizador.html.
Datos de entrada: data/06_regresores_precio_30d.json y data/01_universo_tickers.json (o data/02_precios_sinteticos_504d.json si la serie histórica está ahí; inspecciona los JSON adjuntos y mapea sus campos exactos).
</context>
<task>
Genera regresion.html y js/regresion.js completos:
1. Leer series históricas, trayectorias de pronóstico a 30 sesiones, familias (ML/DL) y métricas de validación directamente desde los JSON adjuntos de data/.
2. Recalcular dinámicamente en el navegador la mediana del ensamble, la banda p10–p90 sesión por sesión y los 4 KPIs superiores cada vez que el usuario cambie de activo, filtre por ML/DL o active/desactive modelos individuales en «Modelos visibles».
3. Soportar el parámetro de consulta ?ticker= en la URL para navegación directa desde Clasificación, Portafolios o Watchlist.
4. Adaptar colores de ejes, grillas, bandas y tooltips de ECharts automáticamente al alternar entre tema claro y tema oscuro.
5. Incluir un bloque desplegable accesible (<details>) con tabla resumen alternativa del pronóstico para lectores de pantalla.
</task>
<constraints>
- Prohibido escribir precios, nombres de modelos, tickers o métricas fijas a mano; todo debe venir de los JSON.
- Cumplir WCAG 2.2 AA: contraste mínimo 4,5:1 en tema claro y oscuro (incluido el botón «Ir al Optimizador →»), atributos aria-pressed, aria-live="polite", scope="col" y cero desborde horizontal a 390 px de ancho.
- Sin frameworks ni librerías adicionales (solo ECharts 5.5.1).
</constraints>
<output>Los archivos regresion.html y js/regresion.js completos, limpios y con comentarios en español.</output>
<verification>Comprobar en consola que no hay errores, que al ocultar/mostrar modelos se actualiza la banda p10–p90 y los KPIs, que funciona ?ticker= en la URL y que ambos temas tienen contraste adecuado.</verification>
</prompt>



---

### 2.3. Módulo Optimizador (`optimizador.html` y `js/optimizador.js`)

<prompt id="P06_Optimizador" nombre="Claude: módulo Optimizador multiobjetivo (Markowitz, NSGA-II y NSGA-III)">
<role>Eres un desarrollador front-end senior especializado en visualización financiera accesible (WCAG 2.2 AA).</role>
<context>
Sistema Ernesto Investing AI. Archivos de salida: optimizador.html y js/optimizador.js.
Usa css/styles.css y js/common.js existentes (funciones $, fmt, loadJSON, store) y ECharts 5.5.1 desde https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js.
Conserva exactamente la barra de navegación superior y el botón de tema claro/oscuro del archivo optimizador.html base adjunto (igual que en portafolios.html y backtesting.html).
Para el contenido principal, sigue exactamente la estructura visual de la captura adjunta:
1. Encabezado superior:
   - Izquierda: etiqueta «ASIGNACIÓN MULTIOBJETIVO», título «Optimizador» y subtítulo «Compara retorno esperado, volatilidad y riesgo de cola entre métodos.»
   - Derecha: selector segmentado con botones «Universo completo» y «Solo elegibles» (con aria-pressed).
2. Banner superior de advertencia: «NSGA-II y NSGA-III simulados: no se ejecutó ningún algoritmo evolutivo.»
3. Tarjeta principal «Fronteras riesgo-retorno» («Markowitz completo, NSGA-II y NSGA-III · selecciona un punto.»):
   - Arriba a la derecha: casillas/filtros interactivos para activar o desactivar cada frontera en el gráfico: «Markowitz» (azul), «NSGA-II» (verde) y «NSGA-III» (naranja/ámbar).
   - Gráfico de dispersión ECharts: eje Y «Retorno esperado (%)», eje X «Riesgo / volatilidad (%)» y nota centrada bajo el eje X: «En NSGA-III, el tamaño del punto representa la magnitud del CVaR 95 %.»
   - Al hacer clic en cualquier punto del gráfico (o seleccionarlo desde una tabla/lista accesible alternativa), marcar ese punto como seleccionado y actualizar el panel inferior izquierdo.
4. Sección inferior en 2 columnas:
   - Izquierda: tarjeta «PUNTO SELECCIONADO · COMPLETO» (o «· ELEGIBLES» según el universo activo) con subtítulo del método del punto elegido («Markowitz completo», «NSGA-II» o «NSGA-III»), cuadrícula 2×2 de métricas («Retorno», «Volatilidad», «Sharpe», «CVaR 95 %») y sección «Pesos del portafolio» con barras horizontales de progreso y porcentaje por ticker (ordenados de mayor a menor peso).
   - Derecha: tarjeta «Cómo leer los métodos» con la leyenda descriptiva de los tres enfoques:
     * Punto azul — Markowitz completo: «Frontera explícita correspondiente al universo seleccionado.»
     * Punto verde — NSGA-II: «Representación simulada de soluciones no dominadas para dos objetivos.»
     * Punto naranja — NSGA-III: «Representación simulada que incorpora CVaR 95 % como tercer objetivo.»
     * Botón primario ancho completo de alto contraste en la parte inferior: «Comparar portafolios →» enlazando a portafolios.html (y guardando opcionalmente la solución seleccionada en localStorage vía store).
Datos de entrada: data/07_optimizador_markowitz_nsga.json (y data/01_universo_tickers.json si se requieren nombres de activos). Inspecciona el JSON adjunto y mapea sus campos exactos.
</context>
<task>
Genera optimizador.html y js/optimizador.js completos:
1. Leer las soluciones de frontera para ambos universos («Universo completo» y «Solo elegibles») y los tres métodos (Markowitz, NSGA-II y NSGA-III) directamente desde data/07_optimizador_markowitz_nsga.json.
2. Renderizar el gráfico de dispersión ECharts escalando el tamaño de los puntos de NSGA-III proporcionalmente a la magnitud del CVaR 95 %, con tooltip detallado y selección por clic que actualice al instante las 4 métricas y las barras de pesos del portafolio.
3. Permitir alternar entre «Universo completo» y «Solo elegibles», así como mostrar/ocultar cada método en la gráfica sin errores aunque quede un solo método activo.
4. Adaptar colores de ejes, grillas, puntos y tooltips de ECharts automáticamente al cambiar entre tema claro y tema oscuro.
5. Incluir un bloque desplegable accesible (<details>) con tabla alternativa de puntos de las fronteras para usuarios de teclado y lectores de pantalla.
</task>
<constraints>
- Prohibido escribir retornos, volatilidades, Sharpe, CVaR o pesos fijos a mano; todo debe provenir de data/07_optimizador_markowitz_nsga.json.
- Cumplir WCAG 2.2 AA: contraste mínimo 4,5:1 en tema claro y oscuro (incluido el botón «Comparar portafolios →»), atributos aria-pressed, aria-live="polite" y cero desborde horizontal a 390 px de ancho.
- Sin frameworks ni librerías adicionales (solo ECharts 5.5.1).
</constraints>
<output>Los archivos optimizador.html y js/optimizador.js completos, limpios y con comentarios en español.</output>
<verification>Comprobar en consola que no hay errores, que hacer clic en puntos de Markowitz, NSGA-II y NSGA-III actualiza los pesos y métricas, y que el cambio entre «Universo completo» y «Solo elegibles» funciona correctamente.</verification>
</prompt>

---

### 2.4. Módulo Portafolios (`portafolios.html` y `js/portafolios.js`)

```xml
<prompt id="P06_Portafolios" nombre="Claude: módulo de Portafolios en 3 niveles de riesgo">
<role>Eres un desarrollador front-end senior especializado en tableros financieros accesibles (WCAG 2.2 AA).</role>
<context>
Sistema Ernesto Investing AI. Archivos de salida: portafolios.html y js/portafolios.js.
Usa css/styles.css y js/common.js existentes (funciones $, fmt, loadJSON, store) y ECharts 5.5.1 desde [https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js](https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js).
Conserva la barra de navegación superior y el selector de tema claro/oscuro del archivo portafolios.html base adjunto.
Para el contenido principal, sigue exactamente la distribución visual de la captura adjunta:
- Banner superior informativo.
- 3 tarjetas seleccionables lado a lado (Conservador con acento azul, Moderado con acento morado y seleccionado por defecto, Agresivo con acento naranja).
- Dentro de cada tarjeta: gráfico de dona ECharts con texto central "100% asignado", cuadrícula 2x2 de métricas (Retorno esperado, Volatilidad, Sharpe, CVaR 95%) y leyenda inferior de tickers con porcentajes.
- Panel inferior "DETALLE SELECCIONADO" que cambia dinámicamente al hacer clic (o presionar Enter/Espacio) en cualquiera de las 3 tarjetas, con botón «Llevar a Trading →» a la derecha y tabla con columnas: ACTIVO, PESO (barra de progreso visual + %), GRUPO, RAZÓN DE INCLUSIÓN (campo "razon" del JSON) y SEÑALES RELACIONADAS (enlaces a clasificacion.html?ticker=X y regresion.html?ticker=X).
Datos de entrada: data/08_portafolios_3_niveles_riesgo.json.
</context>
<task>
Genera portafolios.html y js/portafolios.js completamente funcionales leyendo los datos desde data/08_portafolios_3_niveles_riesgo.json:
1. Mostrar aviso superior visible: «Composiciones basadas en señales sintéticas de Clasificación y Regresión. No son recomendaciones de inversión».
2. Renderizar las 3 tarjetas interactivas (accesibles por teclado con role="button", tabindex="0" y aria-pressed) y sus 3 gráficos de dona ECharts que se adapten al tema claro/oscuro.
3. Al seleccionar una tarjeta, actualizar el título del panel inferior y la tabla de detalle con los activos de ese nivel.
4. Al hacer clic en «Llevar a Trading →», guardar en localStorage (mediante store de common.js, por ejemplo bajo la clave 'portafolio_seleccionado') el nivel elegido, sus pesos y fecha, mostrando una notificación visual accesible (aria-live="polite").
5. Incluir una sección o detalle desplegable con tabla alternativa accesible de los pesos para lectores de pantalla.
</task>
<constraints>
- Prohibido escribir cifras o textos de activos a mano en el HTML/JS; todo debe leerse dinámicamente de data/08_portafolios_3_niveles_riesgo.json.
- Cumplir WCAG 2.2 AA: contraste mínimo 4,5:1 en tema claro y oscuro, encabezados de tabla con scope="col", foco visible y cero desborde horizontal a 390 px de ancho.
- Sin frameworks ni librerías adicionales (solo ECharts 5.5.1).
</constraints>
<output>Los archivos portafolios.html y js/portafolios.js completos y listos para guardar, con comentarios en español.</output>
<verification>Comprobar que los datos coinciden con el JSON, que al hacer clic en Conservador/Moderado/Agresivo cambia la tabla inferior, que los gráficos responden al botón de tema y que no hay errores en consola.</verification>
</prompt>
```
---

### 2.5. Módulo Backtesting (`backtesting.html` y `js/backtesting.js`)
```xml
<prompt id="P06_Backtesting" nombre="Claude: módulo de Backtesting histórico simulado">
<role>Eres un desarrollador front-end senior especializado en visualización financiera accesible (WCAG 2.2 AA).</role>
<context>
Sistema Ernesto Investing AI. Archivos de salida: backtesting.html y js/backtesting.js.
Usa css/styles.css y js/common.js existentes (funciones $, fmt, loadJSON, store) y ECharts 5.5.1 desde [https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js](https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js).
Conserva exactamente la barra de navegación superior y el botón de tema claro/oscuro del archivo backtesting.html base adjunto (igual que en portafolios.html).
Para el contenido principal, sigue la estructura visual de la captura adjunta:
- Encabezado "EVALUACIÓN HISTÓRICA / Backtesting" con insignia "Base 100 · 252 sesiones" y banner de advertencia: «Backtesting sobre historia sintética · desempeño pasado no garantiza desempeño futuro.»
- Tarjeta 1: "Curvas de capital" (Valor acumulado con base 100) con botones interactivos arriba a la derecha para activar/desactivar las 7 series (Conservador, Moderado, Agresivo, SPY, QQQ, EPU, Igual ponderado (1/N)) y gráfico de líneas ECharts sincronizado.
- Tarjeta 2: "Drawdown" (Caída porcentual desde el máximo previo) con gráfico ECharts de líneas/área negativa para las 7 series.
- Tarjeta 3: "Métricas comparativas derivadas" con tabla ordenable por clic y teclado en todas sus columnas (Estrategia, Retorno total, CAGR, Volatilidad, Sharpe, Máx. Drawdown, Calmar, Meses positivos), destacando dinámicamente en verde con etiqueta "SUPERIOR" la estrategia líder en retorno total.
- Sección inferior en 2 columnas:
  * Izquierda: "Rebalanceos y pesos por fecha" con acordeones desplegables por fecha mostrando los pesos de Conservador, Moderado y Agresivo (y turnover medio si está en el JSON).
  * Derecha: "INTERPRETACIÓN DINÁMICA" con título y párrafos generados 100% dinámicamente desde las métricas reales del JSON, explicando con honestidad si las carteras superaron o no a los benchmarks y por qué ocurre en series sintéticas con baja persistencia y ruido.
Datos de entrada: data/09_backtesting_portafolios.json {fechas (253), carteras {Conservador | Moderado | Agresivo: {curva, metricas, rebalanceos [{fecha, pesos}], turnover_medio, drawdown}}, referencias {SPY | QQQ | EPU | Igual ponderado (1/N): {curva, metricas}}}.
</context>
<task>
Genera backtesting.html y js/backtesting.js completos:
1. Leer todos los arreglos, fechas, métricas y rebalanceos directamente desde data/09_backtesting_portafolios.json.
2. Permitir ordenar la tabla de métricas por cualquier columna con indicadores visuales de orden y atributos aria-sort.
3. Adaptar colores de ejes, grillas y tooltips de ambos gráficos ECharts automáticamente al cambiar entre tema claro y oscuro.
4. Incluir un bloque desplegable accesible (<details>) con tabla resumen alternativa de las curvas inicial/final para lectores de pantalla.
5. Incluir pie de página aclarando que son datos sintéticos simulados y no asesoría de inversión.
</task>
<constraints>
- Prohibido escribir cifras, nombres de ganadores o textos de conclusión fijos a mano; todo se calcula desde el JSON.
- Cumplir WCAG 2.2 AA: contraste mínimo 4,5:1 en tema claro y oscuro, encabezados con scope="col", navegación por teclado y cero desborde horizontal a 390 px de ancho.
- Sin frameworks ni dependencias extra (solo ECharts 5.5.1).
</constraints>
<output>Los archivos backtesting.html y js/backtesting.js completos, limpios y con comentarios en español.</output>
<verification>Comprobar en consola que la última cifra de cada curva coincide con retorno_total_pct (curva_final/100 - 1) dentro de 0,05 puntos porcentuales, que los gráficos cambian de tema y que no hay errores en consola.</verification>
</prompt>
```