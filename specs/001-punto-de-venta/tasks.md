# Tareas 001 · Punto de venta

> **Estado:** aprobado por el autor (con la regla de los `todo`; la forma de publicar de T37 se decide al llegar) · **Fecha:** 2026-11-01
> **Entrada:** `plan.md` (aprobado 2026-11-01). Rama: `feature/punto-de-venta`.
> Cada tarea dura menos de 30 minutos y termina en **un commit** con el mensaje propuesto.

## Reglas para todas las tareas

- **Tests primero sin romper P4:** la tarea del test agrega los casos con la opción `{ todo: true }` de `node --test`. Así quedan escritos y se ven fallar, pero `npm test` no queda en rojo. La tarea de código que sigue **saca el `todo`** y los pone en verde.
- `tests/pos-logica.test.js` carga `sistema/js/pos-logica.js` con un `try/catch`: si el archivo todavía no existe, los casos `todo` fallan sin cortar el resto de los tests.
- Antes de cada commit: `npm test` en verde (P4) y, si la tarea toca `sistema/js/` o `base-de-datos/`, la skill `revisar-seguridad`.
- `CACHE_VERSION` de `sistema/sw.js` se sube **una sola vez, en T37**, antes de publicar en Netlify (decisión del autor, 2026-11-01). Las tareas anteriores no la tocan; T20 igual agrega `/js/pos-logica.js` a la lista de `sw.js`.
- Cada commit actualiza `memory.md` (estado de la tarea) en el mismo commit.
- Se muestra el diff y se espera tu aprobación antes de cada commit.
- Los números de «caso límite» son los de `spec.md`.

## Etapa 1 · Lógica pura (`pos-logica.js`)

- [x] T01 · **Test:** esqueleto de `tests/pos-logica.test.js` y textos de `MENSAJES`
  - **RF:** 01, 05, 09, 16, 18, 24, 39, 40, 43
  - **Archivos:** `tests/pos-logica.test.js` (nuevo)
  - **Hace:** carga del módulo con `try/catch`; un caso `todo` por cada texto de la spec, comparado letra por letra.
  - **Listo cuando:** `npm test` termina en verde y muestra los casos de `MENSAJES` como `todo` fallidos.
  - **Commit:** `agrega los tests de los mensajes del punto de venta`

- [x] T02 · **Código:** crea `pos-logica.js` con la doble salida y `MENSAJES`
  - **RF:** 01, 05, 09, 16, 18, 24, 39, 40, 43
  - **Archivos:** `sistema/js/pos-logica.js` (nuevo), `tests/pos-logica.test.js`
  - **Hace:** publica `window.PosLogica` en el navegador y `module.exports` en Node (D1); constante `MENSAJES` (D9). Sin DOM ni `window._supabase`.
  - **Listo cuando:** los casos de `MENSAJES` pasan sin `todo`; `npm test` en verde; el archivo no contiene `document`, `window._supabase` ni `precio_costo`.
  - **Commit:** `agrega pos-logica.js con los mensajes del punto de venta`

- [x] T03 · **Test:** `clasificarEntrada` y `buscarPorCodigo`
  - **RF:** 03, 04, 05, 45
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** escaneo (3+ caracteres, todos con menos de 50 ms) contra texto escrito; código exacto; el nombre exacto no cuenta; producto inactivo no aparece; casos límite 1, 2 y 15.
  - **Listo cuando:** los casos nuevos están como `todo` y `npm test` sigue en verde.
  - **Commit:** `agrega los tests del lector de código de barras`

- [x] T04 · **Código:** `clasificarEntrada` y `buscarPorCodigo`
  - **RF:** 03, 04, 05, 45
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T03 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega la clasificación de escaneos y la búsqueda por código`

- [ ] T05 · **Test:** `filtrarCatalogo`
  - **RF:** 06, 07
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** contiene el texto en nombre o código, sin distinguir mayúsculas, solo activos; 2.000 productos de prueba en menos de 100 ms.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests del filtro del catálogo`

- [ ] T06 · **Código:** `filtrarCatalogo`
  - **RF:** 06, 07
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T05 (incluido el de rendimiento) pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega el filtro del catálogo del punto de venta`

- [ ] T07 · **Test:** `validarAgregado`
  - **RF:** 01, 03, 04, 08, 09, 40
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** caja cerrada; producto nuevo con stock 0 (también por lector); precio 0 (caso límite 11); stock superado («Stock disponible: N»); producto ya en el carrito suma 1.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests de la validación al agregar productos`

- [ ] T08 · **Código:** `validarAgregado`
  - **RF:** 01, 03, 04, 08, 09, 40
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T07 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega la validación al agregar productos al carrito`

- [ ] T09 · **Test:** `validarCantidad`
  - **RF:** 09, 38
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** 0, vacío, −1 y 2.5 vuelven a la cantidad anterior; más que el stock vuelve a la anterior con «Stock disponible: N»; caso límite 13.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests de la cantidad del carrito`

- [ ] T10 · **Código:** `validarCantidad`
  - **RF:** 09, 38
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T09 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega la validación de la cantidad del carrito`

- [ ] T11 · **Test:** `calcularTotales`
  - **RF:** 10, 11, 42
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** subtotal, impuesto y total en centavos; casos con medio centavo; impuesto 0 y 21 %; mismos números que usará `tests/sql/001-crear-venta.sql` (D2).
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests del total del carrito`

- [ ] T12 · **Código:** `calcularTotales`
  - **RF:** 10, 11, 42
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** cuenta en centavos enteros con redondeo «mitad lejos del cero», igual que `round(…, 2)` de PostgreSQL.
  - **Listo cuando:** los casos de T11 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega el cálculo del total en centavos`

- [ ] T13 · **Test:** `interpretarMonto`
  - **RF:** 17, 18, 33, 43
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** vacío = pago justo; «0» y negativos = insuficiente (caso límite 10); justo; con vuelto; vuelto alto; caso límite 9.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests del monto recibido`

- [ ] T14 · **Código:** `interpretarMonto`
  - **RF:** 17, 18, 33, 43
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** usa `Number.isFinite`, nunca `parseFloat(x) || total` (lección de `memory.md`).
  - **Listo cuando:** los casos de T13 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega la interpretación del monto recibido y el vuelto`

- [ ] T15 · **Test:** `puedeCobrar`, `firmaVenta` y `claveIdempotencia`
  - **RF:** 02, 12, 16, 23, 25, 29
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** «Cobrar» deshabilitado solo con carrito vacío, caja cerrada o venta en proceso; habilitado sin método (D8). Misma firma y misma clave con el mismo carrito y método aunque cambie el monto, el descuento o el cliente; clave nueva con otra cantidad u otro método; sin clave anterior genera una nueva (caso límite 8, D7).
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests del botón cobrar y la clave anti-duplicados`

- [ ] T16 · **Código:** `puedeCobrar`, `firmaVenta` y `claveIdempotencia`
  - **RF:** 02, 12, 16, 23, 25, 29
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T15 pasan sin `todo`; `npm test` en verde.
  - **Commit:** `agrega las reglas del botón cobrar y de la clave anti-duplicados`

- [ ] T17 · **Test:** `mensajeDeError`, `esTotalCambiado` y `actualizarPreciosCarrito`
  - **RF:** 24, 26, 34, 36, 37, 39
  - **Archivos:** `tests/pos-logica.test.js`
  - **Hace:** sin conexión; «No autorizado» y token vencido → sesión vencida; el texto de la base pasa tal cual; código `PV002` → total cambiado; los precios nuevos llegan al carrito sin tocar cantidades.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests de los errores al cobrar`

- [ ] T18 · **Código:** `mensajeDeError`, `esTotalCambiado` y `actualizarPreciosCarrito`
  - **RF:** 24, 26, 34, 36, 37, 39
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Listo cuando:** los casos de T17 pasan sin `todo`; `tests/pos-logica.test.js` ya no tiene ningún `todo`; `npm test` en verde.
  - **Commit:** `agrega la interpretación de los errores al cobrar`

## Etapa 2 · Pantalla (`pos.js`, `pos.html`, `pos.css`, `sw.js`)

- [ ] T19 · **Test:** `tests/punto-de-venta.test.js` sobre los archivos de la pantalla
  - **RF:** 14, 15, 19, 35
  - **Archivos:** `tests/punto-de-venta.test.js` (nuevo)
  - **Hace:** `pos.html` carga `pos-logica.js` antes de `pos.js`; `sw.js` lista `/js/pos-logica.js`; `pos.js` no contiene `precio_costo`; solo llama a `rpc('crear_venta')` y envía `p_total_esperado`; pide `metodos_pago` con `activo = true`. Los que hoy no se cumplen van como `todo`.
  - **Listo cuando:** `npm test` en verde; los casos de 15 y 19 ya pasan; los de 14, 35, `pos.html` y `sw.js` figuran como `todo`.
  - **Commit:** `agrega los tests de los archivos del punto de venta`

- [ ] T20 · **Código:** carga de `pos-logica.js` y caché
  - **RF:** todos (riesgo «si `pos-logica.js` no carga, `pos.js` falla»)
  - **Archivos:** `sistema/pos.html`, `sistema/sw.js`, `tests/punto-de-venta.test.js`
  - **Hace:** `<script src="js/pos-logica.js">` antes de `js/pos.js`; agrega el archivo a la lista de `sw.js` (`CACHE_VERSION` no se toca: se sube en T37).
  - **Listo cuando:** los casos de `pos.html` y `sw.js` pasan sin `todo`; `npm test` en verde; la pantalla abre en local sin errores en la consola y `window.PosLogica` existe.
  - **Commit:** `carga pos-logica.js en el punto de venta`

- [ ] T21 · **Código:** lector y búsqueda usan `PosLogica`
  - **RF:** 03, 04, 05, 06, 45
  - **Archivos:** `sistema/js/pos.js` (`setupSearch`, `filtrarProductos`)
  - **Hace:** guarda la hora de cada tecla; usa `clasificarEntrada`, `buscarPorCodigo` y `filtrarCatalogo`; deja de aceptar el nombre exacto como código; el texto escrito queda en el buscador sin aviso.
  - **Listo cuando:** `npm test` en verde; en local, un escaneo simulado (pegar código + Enter rápido) agrega el producto, un código inexistente muestra «No encontramos ese producto (código: …)» y un texto escrito a mano filtra sin aviso.
  - **Commit:** `usa pos-logica en el lector y la búsqueda del punto de venta`

- [ ] T22 · **Código:** carrito usa `validarAgregado` y `validarCantidad`
  - **RF:** 01, 07, 08, 09, 38, 40
  - **Archivos:** `sistema/js/pos.js` (`agregarAlCarrito`, `crearTarjetaProducto`, `cambiarCantidad`)
  - **Listo cuando:** `npm test` en verde; en local, con caja cerrada sale «Abrí la caja para empezar a vender»; una cantidad 0 o 2.5 vuelve a la anterior y no quita el producto; un producto con stock 0 no entra por lector.
  - **Commit:** `usa pos-logica en el carrito del punto de venta`

- [ ] T23 · **Código:** total con `calcularTotales` y fuera `precio_costo`
  - **RF:** 10, 11, 14, 42
  - **Archivos:** `sistema/js/pos.js` (`calcularTotales`, `cargarProductos`, carrito), `tests/punto-de-venta.test.js`
  - **Listo cuando:** el caso «`pos.js` no contiene `precio_costo`» pasa sin `todo`; `npm test` en verde; en local el total coincide con el que da `calcularTotales` en el test.
  - **Commit:** `calcula el total con pos-logica y saca el costo del punto de venta`

- [ ] T24 · **Código:** monto recibido y aviso de vuelto alto
  - **RF:** 17, 18, 33, 43, 44
  - **Archivos:** `sistema/js/pos.js` (`calcularVuelto`, campo del monto), `sistema/pos.html` (lugar del aviso)
  - **Hace:** usa `interpretarMonto`; bandera «falta confirmar» que se borra si cambia el monto; Enter en el monto equivale a «Cobrar».
  - **Listo cuando:** `npm test` en verde; en local, «0» muestra el mensaje de monto insuficiente, el vuelto alto pide confirmar y Enter en el monto cobra.
  - **Commit:** `usa pos-logica en el monto recibido y avisa el vuelto alto`

- [ ] T25 · **Código:** botón «Cobrar» y clave anti-duplicados
  - **RF:** 02, 12, 16, 23, 25, 29
  - **Archivos:** `sistema/js/pos.js` (`procesarVenta`, `nuevaVenta`, estado del botón)
  - **Hace:** usa `puedeCobrar` (D8), muestra el mensaje sin método, usa `firmaVenta` y `claveIdempotencia` (D7).
  - **Listo cuando:** `npm test` en verde; en local, «Cobrar» sin método muestra el mensaje de RF-001-16 y un doble clic no hace dos pedidos (pestaña Red).
  - **Commit:** `usa pos-logica en el botón cobrar y la clave anti-duplicados`

- [ ] T26 · **Código:** envío de `p_total_esperado` y manejo de errores
  - **RF:** 24, 26, 34, 35, 36, 37, 39
  - **Archivos:** `sistema/js/pos.js` (`procesarVenta`), `tests/punto-de-venta.test.js`
  - **Hace:** envía `p_total_esperado`; muestra `mensajeDeError`; con `esTotalCambiado` recarga productos, llama a `actualizarPreciosCarrito` y recalcula. El carrito nunca se borra por un error.
  - **Listo cuando:** el caso de `p_total_esperado` pasa sin `todo`; `tests/punto-de-venta.test.js` no tiene `todo` de la pantalla; `npm test` en verde; en local, con la red cortada sale el mensaje de sin conexión y el carrito sigue.
  - **Commit:** `envía el total esperado y muestra los errores al cobrar`

- [ ] T27 · **Código:** venta repetida, ticket y teclado
  - **RF:** 27, 30, 32
  - **Archivos:** `sistema/js/pos.js` (`procesarVenta`, `mostrarTicket`, `setupKeyboard`)
  - **Hace:** con `repetida` muestra el ticket con los datos y la fecha de la base y no registra auditoría; Escape cierra el ticket si está abierto y, si no, limpia la búsqueda.
  - **Listo cuando:** `npm test` en verde; en local, Escape cierra el ticket abierto; el ticket muestra la fecha que devuelve la base (se comprueba del todo después de T35).
  - **Commit:** `muestra la venta repetida con su fecha y cierra el ticket con escape`

- [ ] T28 · **Código:** estilos del punto de venta
  - **RF:** 30, 31, 43
  - **Archivos:** `sistema/css/pos.css`
  - **Hace:** vuelto resaltado; foco visible en botones de método, «Cobrar» y ticket; revisión del ancho a 360 px. Solo variables de marca.
  - **Listo cuando:** `npm test` en verde (incluye `marca: sin colores escritos a mano`); a 360 px no hay barra horizontal; con Tab se ve el foco en cada botón.
  - **Commit:** `ajusta los estilos del punto de venta para foco y celular`

## Etapa 3 · Base de datos

- [ ] T29 · **Test:** casos del script de migración en `tests/punto-de-venta.test.js`
  - **RF:** 34, 36, 41
  - **Archivos:** `tests/punto-de-venta.test.js`
  - **Hace:** `base-de-datos/20-punto-de-venta.sql` tiene los 10 mensajes de la spec tal cual, los códigos `PV001` y `PV002`, el `DROP FUNCTION` de la firma de 7 parámetros y el `GRANT EXECUTE` con la firma de 8; `00-estructura.sql` tiene `p_total_esperado`. Todo como `todo`.
  - **Listo cuando:** casos nuevos como `todo`; `npm test` en verde.
  - **Commit:** `agrega los tests del script del punto de venta`

- [ ] T30 · **Test SQL:** `tests/sql/001-crear-venta.sql`, preparación y casos que ya funcionan
  - **RF:** 13, 20, 21, 22, 25, 32
  - **Archivos:** `tests/sql/001-crear-venta.sql` (nuevo)
  - **Hace:** `BEGIN`; empleado, caja, productos y métodos de prueba; total con impuesto distinto de 0; stock descontado; Efectivo suma a la caja; Transferencia no la cambia; clave repetida → una sola venta y `repetida: true`. Cada caso muestra «OK» o «FALLA». `ROLLBACK` al final.
  - **Listo cuando:** el archivo empieza con `BEGIN` y termina con `ROLLBACK`; no tiene claves ni datos personales reales; `npm test` en verde.
  - **Commit:** `agrega el script de prueba de crear_venta`

- [ ] T31 · **Test SQL:** casos de rechazo
  - **RF:** 15, 18, 26, 34, 36, 41
  - **Archivos:** `tests/sql/001-crear-venta.sql`
  - **Hace:** total distinto → `PV002` y ninguna venta nueva; precio 0 → `PV001`; caja cerrada; producto inactivo; stock insuficiente; método inactivo; monto menor (casos límite 5, 6 y 7). Compara cada mensaje con la spec.
  - **Listo cuando:** cada caso tiene su «OK / FALLA»; `npm test` en verde.
  - **Commit:** `agrega los casos de rechazo al script de prueba de crear_venta`

- [ ] T32 · **Código SQL:** firma nueva de `crear_venta`
  - **RF:** 32, 35
  - **Archivos:** `base-de-datos/20-punto-de-venta.sql` (nuevo), `tests/punto-de-venta.test.js`
  - **Hace:** `DROP FUNCTION` de la firma de 7 parámetros (aprobado en la sección 10 del plan; lo ejecuta el autor); `CREATE` con `p_total_esperado` opcional al final; devuelve la fecha de la venta nueva y de la repetida (D6); `GRANT EXECUTE` a `authenticated` y `service_role`. Mantiene `SECURITY DEFINER`, `search_path` e `is_staff()`. Sin cambios de RLS ni de tablas (D12).
  - **Listo cuando:** los casos de `DROP` y `GRANT` pasan sin `todo`; `npm test` en verde; `revisar-seguridad` sin hallazgos.
  - **Commit:** `agrega la firma nueva de crear_venta con el total esperado`

- [ ] T33 · **Código SQL:** rechazos `PV001` y `PV002`
  - **RF:** 36, 41
  - **Archivos:** `base-de-datos/20-punto-de-venta.sql`, `tests/punto-de-venta.test.js`
  - **Hace:** precio 0 o menos → `PV001`; total distinto del esperado → `PV002`, con el total en formato argentino (`$1.234,50`) armado sin depender del idioma del servidor (D5). La búsqueda de la clave repetida sigue primero.
  - **Listo cuando:** los casos de `PV001` y `PV002` pasan sin `todo`; `npm test` en verde.
  - **Commit:** `rechaza en crear_venta los productos sin precio y el total cambiado`

- [ ] T34 · **Código SQL:** mensajes nuevos de `crear_venta`
  - **RF:** 34
  - **Archivos:** `base-de-datos/20-punto-de-venta.sql`, `tests/punto-de-venta.test.js`
  - **Hace:** reemplaza los 8 textos de la tabla «Mensajes de `crear_venta`» de la spec, con tildes y en voseo.
  - **Listo cuando:** el caso «los 10 mensajes tal cual» pasa sin `todo`; `npm test` en verde.
  - **Commit:** `corrige los mensajes de crear_venta con tildes y voseo`

- [ ] T35 · **Código SQL:** `00-estructura.sql` al día
  - **RF:** 34, 36, 41
  - **Archivos:** `base-de-datos/00-estructura.sql`, `tests/punto-de-venta.test.js`
  - **Hace:** reemplaza la `crear_venta` vieja por la de `20-punto-de-venta.sql` (sin el `DROP`).
  - **Listo cuando:** `tests/punto-de-venta.test.js` no tiene ningún `todo`; el cuerpo de la función es igual en los dos archivos; `npm test` en verde.
  - **Commit:** `actualiza crear_venta en la estructura completa de la base`

## Etapa 4 · Producción y verificación (las ejecuta el autor)

- [ ] T36 · **Autor:** migración y script de prueba en producción
  - **RF:** 13, 15, 18, 20, 21, 22, 25, 26, 32, 34, 36, 41
  - **Archivos:** `memory.md`
  - **Hace:** el autor ejecuta `20-punto-de-venta.sql` desde el panel (con el «sí» al `DROP FUNCTION`) y después `tests/sql/001-crear-venta.sql`. Se anota la fecha y el resultado.
  - **Listo cuando:** todos los casos del script dicen «OK»; `memory.md` registra la fecha.
  - **Commit:** `registra la migración del punto de venta en producción`

- [ ] T37 · **Publicación** de `sistema/` en Netlify
  - **RF:** todos los de la pantalla
  - **Archivos:** `sistema/sw.js`, `memory.md`
  - **Hace:** sube `CACHE_VERSION` una sola vez y se publica según lo que decida el autor (fusión a `main` o publicación manual).
  - **Listo cuando:** https://pointer-web001.netlify.app/ carga la versión nueva (`CACHE_VERSION` nueva en `sw.js` publicado) y una venta de prueba sale bien.
  - **Commit:** `publica la versión nueva del punto de venta`

- [ ] T38 · **Autor:** ocultar costos y prueba con sesión de empleado
  - **RF:** 14
  - **Archivos:** `memory.md`
  - **Hace:** el autor ejecuta `10-ocultar-costos.sql` en producción si todavía no se hizo; con sesión de empleado revisa que `precio_costo` no aparezca en la pestaña Red ni en un pedido directo a la API.
  - **Listo cuando:** `precio_costo` no aparece en ninguna respuesta para el empleado; `memory.md` saca el pendiente de seguridad.
  - **Commit:** `registra la ocultación de costos en producción`

- [ ] T39 · **Verificación** de la funcionalidad
  - **RF:** todos (01 a 45)
  - **Archivos:** `specs/001-punto-de-venta/verificacion.md` (nuevo), `memory.md`
  - **Hace:** `/verificar` con la skill `verificar-criterios`; pruebas manuales del plan (teclado, 360 px, impresión, ticket, red cortada, lector real, empleado sin costos, rendimiento en la PC del mostrador).
  - **Listo cuando:** cada RF figura como cumple / no cumple / prueba manual pendiente, con el test que lo cubre; `npm test` en verde.
  - **Commit:** `agrega la verificación del punto de venta`

## Cobertura RF → tareas

| RF | Test | Código |
|---|---|---|
| 01 | T01, T07 | T02, T08, T22 |
| 02 | T15 | T16, T25 |
| 03, 04 | T03, T07 | T04, T08, T21 |
| 05 | T01, T03 | T02, T04, T21 |
| 06 | T05 | T06, T21 |
| 07 | T05 | T06, T22 |
| 08 | T07 | T08, T22 |
| 09 | T01, T07, T09 | T02, T08, T10, T22 |
| 10, 11 | T11 | T12, T23 |
| 12 | T15 | T16, T25 |
| 13 | T30 | (base sin cambios) · T36 |
| 14 | T19 | T23 · T38 |
| 15 | T19, T31 | (sin cambios) · T36 |
| 16 | T01, T15 | T02, T16, T25 |
| 17 | T13 | T14, T24 |
| 18 | T01, T13, T31 | T02, T14, T24 · T36 |
| 19 | T19 | (sin cambios) |
| 20, 21, 22 | T30 | (triggers sin cambios) · T36 |
| 23 | T15 | T16, T25 |
| 24 | T01, T17 | T02, T18, T26 |
| 25 | T15, T30 | T16, T25 · T36 |
| 26 | T17, T31 | T18, T26 · T36 |
| 27 | manual (T39) | T27 |
| 28 | manual (T39) | (sin cambios) |
| 29 | T15 | T16, T25 |
| 30 | manual (T39) | T27, T28 |
| 31 | manual (T39) | T28 |
| 32 | T30 | T27, T32 · T36 |
| 33 | T13 | T14, T24 |
| 34 | T17, T29, T31 | T18, T26, T34, T35 · T36 |
| 35 | T19 | T26, T32 |
| 36 | T17, T29, T31 | T18, T26, T33, T35 · T36 |
| 37 | T17 | T18, T26 |
| 38 | T09 | T10, T22 |
| 39 | T01, T17 | T02, T18, T26 |
| 40 | T01, T07 | T02, T08, T22 |
| 41 | T29, T31 | T33, T35 · T36 |
| 42 | T11 | T12, T23 |
| 43 | T01, T13 | T02, T14, T24, T28 |
| 44 | manual (T39) | T24 |
| 45 | T03 | T04, T21 |
