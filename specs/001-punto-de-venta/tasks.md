# Tareas 001 · Punto de venta

> **Estado:** aprobado por el autor · **Fecha:** 2026-11-01 · **Reorganizado:** 2026-11-01 (alcance reducido a 15 RF; test y código juntos; 10 tareas activas)
> **Entrada:** `plan.md` (actualizado 2026-11-01). Rama: `feature/punto-de-venta`.
> Cada tarea dura menos de 30 minutos y termina en **un commit** con el mensaje propuesto.

## Reglas para todas las tareas

- **Tests primero, en la misma tarea:** se escribe o ajusta el test, se ve fallar, se escribe el código y se pone en verde. Se commitea todo junto, con `npm test` en verde (P4). Ya no se usa `{ todo: true }` para dejar tests pendientes entre tareas, salvo el caso de `precio_costo` de T11, que se cierra en T13.
- Antes de cada commit: `npm test` en verde y, si la tarea toca `sistema/js/`, la skill `revisar-seguridad`.
- `CACHE_VERSION` de `sistema/sw.js` se sube **una sola vez, en T14**, antes de publicar en Netlify. T11 igual agrega `/js/pos-logica.js` a la lista de `sw.js`.
- Cada commit actualiza `memory.md` (estado de la tarea) en el mismo commit.
- Se muestra el diff y se espera tu aprobación antes de cada commit.
- Los números de «caso límite» son los de `spec.md`.

## Hechas (antes de reducir el alcance)

T01 a T05 se hicieron con la regla anterior (una tarea para el test y otra para el código). Quedan como están.

- [x] T01 · **Test:** esqueleto de `tests/pos-logica.test.js` y textos de `MENSAJES`
  - **Commit:** `agrega los tests de los mensajes del punto de venta`
- [x] T02 · **Código:** crea `pos-logica.js` con la doble salida y `MENSAJES`
  - **Commit:** `agrega pos-logica.js con los mensajes del punto de venta`
- [x] T03 · **Test:** `clasificarEntrada` y `buscarPorCodigo`
  - **Commit:** `agrega los tests del lector de código de barras`
- [x] T04 · **Código:** `clasificarEntrada` y `buscarPorCodigo`
  - **Commit:** `agrega la clasificación de escaneos y la búsqueda por código`
- [x] T05 · **Test:** `filtrarCatalogo` (15 casos como `todo`)
  - **Commit:** `agrega los tests del filtro del catálogo`

> `MENSAJES` y sus tests (T01, T02) también tienen textos de RF que pasaron a mejoras futuras (01, 18, 39, 40, 43). Se dejan: no molestan y se usan cuando vuelvan esos RF.

## Etapa 1 · Lógica pura (`pos-logica.js`)

- [x] T06 · `filtrarCatalogo`
  - **RF:** 06, 07
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** implementa el filtro (los tests ya están de T05) y les saca el `todo`.
  - **Listo cuando:** los 15 casos `catálogo: …` (incluido el de rendimiento) pasan sin `todo`; `tests/pos-logica.test.js` no tiene ningún `todo`; `npm test` en verde.
  - **Commit:** `agrega el filtro del catálogo del punto de venta`

- [x] T07 · `validarAgregado` y `validarCantidad` (test + código)
  - **RF:** 03, 04, 07, 09
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** producto nuevo → cantidad 1; ya en el carrito → +1; stock superado o stock 0 → cantidad anterior y «Stock disponible: N» (caso límite 3); cambio de cantidad que supera el stock → la anterior con el mismo mensaje.
  - **Listo cuando:** los casos nuevos pasan; `npm test` en verde.
  - **Commit:** `agrega la validación de stock al agregar y cambiar cantidades`

- [x] T08 · `calcularTotales` (test + código)
  - **RF:** 10, 11, 42
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** subtotal, impuesto y total en centavos enteros con redondeo «mitad lejos del cero», igual que `round(…, 2)` de PostgreSQL; casos con medio centavo; impuesto 0 y 21 %; cambiar y quitar productos recalcula.
  - **Listo cuando:** los casos nuevos pasan; `npm test` en verde.
  - **Commit:** `agrega el cálculo del total en centavos`

- [ ] T09 · `puedeCobrar` (test + código)
  - **RF:** 12, 16
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** deshabilitado con carrito vacío; habilitado con productos aunque no haya método elegido (D8).
  - **Listo cuando:** los casos nuevos pasan; `npm test` en verde.
  - **Commit:** `agrega la regla del botón cobrar`

- [ ] T10 · `mensajeDeError` (test + código)
  - **RF:** 24, 26
  - **Archivos:** `sistema/js/pos-logica.js`, `tests/pos-logica.test.js`
  - **Hace:** sin conexión → el texto de RF-001-24; cualquier otro rechazo → el texto que devuelve la base, tal cual.
  - **Listo cuando:** los casos nuevos pasan; `npm test` en verde.
  - **Commit:** `agrega la interpretación de los errores al cobrar`

## Etapa 2 · Pantalla (`pos.js`, `pos.html`, `sw.js`)

- [x] T11 · Tests de los archivos de la pantalla y carga de `pos-logica.js`
  - **RF:** 14, 19
  - **Archivos:** `tests/punto-de-venta.test.js` (nuevo), `sistema/pos.html`, `sistema/sw.js`
  - **Hace:** tests: `pos.html` carga `pos-logica.js` antes de `pos.js`; `sw.js` lista `/js/pos-logica.js`; `pos.js` solo llama a `rpc('crear_venta')`; `pos.js` no contiene `precio_costo` (este va como `todo` hasta T13). Código: el `<script>` en `pos.html` y la entrada en `sw.js` (sin tocar `CACHE_VERSION`).
  - **Listo cuando:** `npm test` en verde con solo el caso de `precio_costo` como `todo`; la pantalla abre en local sin errores en la consola y `window.PosLogica` existe.
  - **Commit:** `carga pos-logica.js en el punto de venta`

- [x] T12 · `pos.js`: lector, búsqueda y carrito usan `PosLogica`
  - **RF:** 03, 04, 05, 06, 07, 09, 10, 11
  - **Archivos:** `sistema/js/pos.js` (`setupSearch`, `filtrarProductos`, `agregarAlCarrito`, `crearTarjetaProducto`, `cambiarCantidad`)
  - **Hace:** guarda la hora de cada tecla; usa `clasificarEntrada`, `buscarPorCodigo`, `filtrarCatalogo`, `validarAgregado` y `validarCantidad`; deja de aceptar el nombre exacto como código; mensajes de `MENSAJES`.
  - **Listo cuando:** `npm test` en verde; en local, un escaneo simulado (pegar código + Enter rápido) agrega el producto, un código inexistente muestra «No encontramos ese producto (código: …)», «cafe» encuentra «Café» y pasar el stock muestra «Stock disponible: N».
  - **Commit:** `usa pos-logica en el lector, la búsqueda y el carrito`

- [ ] T13 · `pos.js`: total, «Cobrar» y errores con `PosLogica`; fuera `precio_costo`
  - **RF:** 12, 14, 16, 24, 26, 42
  - **Archivos:** `sistema/js/pos.js` (`calcularTotales`, `cargarProductos`, `procesarVenta`, estado del botón), `tests/punto-de-venta.test.js`
  - **Hace:** usa `calcularTotales`, `puedeCobrar` y `mensajeDeError`; «Cobrar» sin método muestra «Elegí un método de pago»; el carrito nunca se borra por un error; saca `precio_costo` del carrito y de la consulta.
  - **Listo cuando:** el caso de `precio_costo` pasa sin `todo`; `npm test` en verde sin ningún `todo`; en local el total coincide con el del test, «Cobrar» sin método muestra el mensaje y con la red cortada sale el mensaje de RF-001-24 y el carrito sigue.
  - **Commit:** `usa pos-logica en el total, el cobro y los errores, y saca el costo`

> Si al abrir `pos.js` T12 o T13 resultan de más de 30 minutos, se parten en dos antes de empezar (quedarían 11 o 12 tareas).

## Etapa 3 · Producción y verificación

- [ ] T14 · **Autor:** ocultar costos y publicar
  - **RF:** 14 (y todos los de la pantalla)
  - **Archivos:** `sistema/sw.js`, `memory.md`
  - **Hace:** el autor ejecuta `10-ocultar-costos.sql` en producción si todavía no se hizo; se sube `CACHE_VERSION` una sola vez y se publica según lo que decida el autor (fusión a `main` o publicación manual).
  - **Listo cuando:** https://pointer-web001.netlify.app/ carga la versión nueva; con sesión de empleado, `precio_costo` no aparece en la pestaña Red ni en un pedido directo a la API; `memory.md` saca el pendiente de seguridad.
  - **Commit:** `publica el núcleo del punto de venta y registra la ocultación de costos`

- [ ] T15 · **Verificación** de la funcionalidad
  - **RF:** los 15 activos
  - **Archivos:** `specs/001-punto-de-venta/verificacion.md` (nuevo), `memory.md`
  - **Hace:** `/verificar` con la skill `verificar-criterios`; pruebas manuales: lector real, red cortada, rechazos de la base (casos límite 4, 5 y 6), empleado sin costos y rendimiento en la PC del mostrador.
  - **Listo cuando:** cada RF activo figura como cumple / no cumple / prueba manual pendiente, con el test que lo cubre; `npm test` en verde.
  - **Commit:** `agrega la verificación del punto de venta`

## Cobertura RF → tareas

| RF | Test | Código |
|---|---|---|
| 03, 04 | T03, T07 | T04, T07, T12 |
| 05 | T01, T03 | T02, T04, T12 |
| 06 | T05 | T06, T12 |
| 07 | T05, T07 | T06, T07, T12 |
| 09 | T01, T07 | T02, T07, T12 |
| 10, 11 | T08 | T08, T12 |
| 42 | T08 | T08, T13 |
| 12 | T09 | T09, T13 |
| 16 | T01, T09 | T02, T09, T13 |
| 14 | T11 | T13 · T14 |
| 19 | T11 | (sin cambios) |
| 24 | T01, T10 | T02, T10, T13 |
| 26 | T10 | T10, T13 |
