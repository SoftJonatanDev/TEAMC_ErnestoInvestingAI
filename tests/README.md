# Pruebas opcionales

La aplicacion no necesita estas dependencias. Son herramientas de desarrollo.

## Navegador real sobre HTTP local

Inicia el servidor desde la raiz con `python iniciar.py --no-browser`.
En otra terminal, instala Playwright para el script Node:

```bash
npm install --no-save --prefix tests playwright
npx --prefix tests playwright install chromium
node tests/smoke.mjs
```

Usa `BASE` para indicar otra direccion; el valor por defecto es
`http://127.0.0.1:8000/`. Usa `CHROMIUM_PATH` si dispones de un ejecutable propio.
El script comprueba 13 pantallas en escritorio/movil, errores, carga de graficos,
referencias locales y persistencia entre paginas. No sustituye el motor grafico.
Genera `test-results/http-smoke.json`. Ejecutalo en un perfil de prueba aislado.

## Reproducir la validacion offline de esta entrega

```bash
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/offline_flows.py
python tests/offline_analysis.py
python tests/offline_extra.py
python tests/offline_render.py desktop
python tests/offline_render.py mobile
```

Estos scripts usan los HTML/CSS/JS reales y Plotly local, pero transportan los
JSON y emulan localStorage porque el entorno de preparacion bloqueaba la
navegacion HTTP del navegador. NO prueban persistencia nativa, concurrencia
entre pestanas ni despliegue HTTP de extremo a extremo. Consulta
`docs/VALIDACION.md` para distinguir lo ejecutado de lo pendiente.
Los resultados se guardan en `test-results/`.

## Graficas acotadas e integridad de datos (v2.1)

```bash
python tests/chart_data_integrity.py
python tests/chart_navigation.py
```

La primera prueba solo usa Python estandar; verifica los SHA-256 de los 13 archivos
originales, cierres, velas, anclas, bandas y resultados, y reproduce el nuevo historial.
La segunda usa Playwright y el mismo transporte offline documentado arriba. Prueba
arrastres reales de raton (tambien antes de soltar), tacto movil, limites, ausencia
de zoom involuntario, escalado Y, selectores, resumenes, puntos del optimizador y
sincronizacion de capital/drawdown. No sustituye el motor grafico.

Se actualizo la asercion de periodo en offline_flows.py: ahora espera 504 puntos
cargados y una ventana visible de 20 al seleccionar 1M, en lugar de eliminar datos.
Los reportes de esta entrega se conservan en docs/qa/ con prefijo graficas-.


## Camara y voz (v3.0)

La aplicacion no necesita Node ni Playwright para ejecutarse. Estos comandos
son exclusivamente para reproducir pruebas de desarrollo:

```bash
node tests/multimodal_gestures.cjs
node tests/multimodal_devices.cjs
python tests/multimodal_http.py
python tests/multimodal_browser.py
python tests/multimodal_interaction.py
```

Los dos scripts Node usan solo modulos nativos. La prueba HTTP usa Python
estandar. Las pruebas del navegador usan las dependencias de requirements.txt.
Admiten CHROMIUM_PATH, chromium/chromium-browser en PATH o el Chromium de
Playwright instalado por `python -m playwright install chromium`.

`multimodal_harness.py` carga el codigo real del host y las pantallas, pero
sustituye el transporte debido a la restriccion de HTTP del navegador del entorno.
`multimodal_devices.cjs` usa dobles de camara/voz; no acredita inferencia del
modelo, webcam fisica ni audio audible. `multimodal_interaction.py` conecta
caracteristicas gestuales sinteticas al adaptador real de graficas/formularios.

Consulta docs/VALIDACION_MULTIMODAL.md para los resultados exactos, los limites
de estas pruebas y la lista de verificaciones manuales. Las evidencias finales
entregadas estan en docs/qa/multimodal/; ejecutar pruebas genera test-results/.


## Paneles independientes y pulgar hacia palma (v3.1)

```bash
node tests/multimodal_gestures.cjs
node tests/multimodal_devices.cjs
python tests/multimodal_panels.py
python tests/multimodal_interaction.py
python tests/multimodal_browser.py
python tests/chart_data_integrity.py
python tests/multimodal_http.py
```

La geometria y maquina de estados comprueban el ciclo de pulgar abierto-cerrado
hacia palma-abierto, la exclusion de la pinza antigua, arrastre, cancelacion,
mano reflejada, rotacion y conservacion del zoom indice-medio. Los paneles prueban
accesos independientes y que minimizar o cambiar entre ellos no apaga servicios.
Estas pruebas usan coordenadas sinteticas y dobles de dispositivos donde se
indica; no acreditan exactitud de una webcam ni audio audible.

Resultados de esta revision: `docs/qa/paneles-pulgar/`. Consulta el informe
`docs/VALIDACION_PANEL_Y_PULGAR.md`; los reportes de v3.0 son historicos.
