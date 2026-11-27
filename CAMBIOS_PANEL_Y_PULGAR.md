# Cambios v3.1: paneles independientes y clic con pulgar hacia la palma

Base exacta: `Ernesto_Investing_AI_Camara_y_Voz.zip`. Fecha: 27 de noviembre de 2026.

## Solicitudes implementadas

**Separación de herramientas.** El Asistente de voz y el Control por cámara ya
no pertenecen a un panel con pestañas. Tienen accesos separados desde todas las
pantallas, regiones accesibles con títulos distintos, estados propios y botones
independientes para minimizar. En escritorio pueden coexistir sin superponerse;
en pantallas menores de 960 px se alterna el panel visible. Los servicios activos
no se interrumpen por esta alternancia. Abrir un panel no solicita permisos.

**Clic nuevo.** El índice permanece extendido; el pulgar se abre hacia un lado,
se cierra hacia la palma y vuelve a abrirse. La pulsación se completa al reabrir.
Se retira la regla basada en la distancia entre las puntas del pulgar y el índice.
Se utiliza la proyección del pulgar en un sistema de referencia de la palma,
normalizada por su tamaño. El cierre exige que la punta esté en la zona de la
palma, no junto a la punta del índice levantado. Funciona con referencias de
mano derecha o izquierda sin invertir la definición de abierto/cerrado.

**Arrastre.** Cerrar el pulgar, sostenerlo y mover el índice inicia el arrastre.
Reabrir suelta el elemento sin añadir un clic. El cursor se ancla durante una
pulsación breve y se consideran las desviaciones máximas del recorrido, no
solo el punto final, para evitar que salir y volver se interprete como un clic.

**Seguridad del gesto.** Se exige una postura inicial abierta estable. Hay
umbrales diferentes para abrir y cerrar, estabilidad temporal y bloqueo de
repeticiones. Una postura incompatible, pérdida de seguimiento, pausa, cambio
de calibración o pulgar ambiguo cancela la acción pendiente. Las confirmaciones
protegidas siguen exigiendo dos ciclos explícitos separados.

**Guía y diagnóstico.** El panel de cámara incluye instrucciones en tres pasos,
estado de pulgar abierto/cerrado/en transición y medidor relativo. El indicador
no es una medida anatómica ni acredita la precisión de una cámara.

## Conservado sin cambios

- Los 14 JSON y las 504 sesiones existentes.
- Cálculos, validaciones, simulación financiera y estado de cuenta.
- Controlador de gráficas, topes horizontales, ajuste vertical y sincronización.
- Zoom y desplazamiento con índice y medio de una sola mano.
- Motor de lectura contextual, preferencias de voz y procesamiento de cámara.
- Permisos explícitos, parada general, ratón y teclado como alternativa.

## Ejecución y pruebas

El inicio no cambia: `py iniciar.py --multimodal` o
`python3 iniciar.py --multimodal`. Extrae el ZIP en una carpeta nueva y recarga
con Ctrl+F5 para no reutilizar JavaScript antiguo en caché.

Consulta `docs/VALIDACION_PANEL_Y_PULGAR.md` para las pruebas realizadas y sus
límites. No se hizo una validación con webcam física ni audio audible.
