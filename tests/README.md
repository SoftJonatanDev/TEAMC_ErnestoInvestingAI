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
