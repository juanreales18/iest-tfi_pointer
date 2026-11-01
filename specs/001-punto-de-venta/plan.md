# Plan 001 · Punto de venta

> **Estado:** aprobado por el autor (con las 4 decisiones de la sección 10) · **Fecha:** 2026-11-01
> **Entrada:** `spec.md` (aprobada y actualizada con la clarificación) y `clarificacion.md` (17 hallazgos respondidos).
> **Fuentes leídas:** `documentacion/CONSTITUCION.md`, `04-ARQUITECTURA.md`, `05-DATOS.md`, `10-SEGURIDAD.md`, `crear_venta` en `base-de-datos/00-estructura.sql`, `sistema/js/pos.js`, `sistema/pos.html`, `sistema/sw.js` y `tests/constitucion.test.js`.
> Este plan **no tiene código**: dice qué archivo cambia, qué función se crea o se modifica y cómo se prueba.

## 1. Resumen

El punto de venta ya funciona. Este plan lo lleva a cumplir la spec con tres cambios grandes:

1. **Base:** `crear_venta` recibe el total que muestra la pantalla, rechaza productos con precio 0 y devuelve los mensajes con tildes y en voseo.
2. **Navegador:** la lógica que decide (qué es un escaneo, si un producto se puede agregar, cuánto da el total, qué mensaje mostrar) sale de `pos.js` a un archivo nuevo **sin acceso al DOM ni a la base**, para poder probarla con `npm test`.
3. **Tests:** dos archivos nuevos de `node --test` y un script SQL que se corre contra la base dentro de una transacción que se deshace.

## 2. Decisiones de diseño

| ID | Decisión | Por qué | Principio |
|---|---|---|---|
| D1 | Archivo nuevo **`sistema/js/pos-logica.js`** con funciones puras (sin DOM, sin `window._supabase`). Se publica como `window.PosLogica` en el navegador y como `module.exports` en Node. `pos.js` las usa; `tests/pos-logica.test.js` las prueba. | Hoy toda la lógica está dentro de `DOMContentLoaded` y no se puede probar sin navegador. Así se prueba sin agregar dependencias. | P4 · P1 (sin `package.json` ni librerías en `sistema/`) |
| D2 | El total que muestra la pantalla se calcula **en centavos enteros** y se redondea igual que `round(…, 2)` de PostgreSQL (mitad hacia arriba, lejos del cero). | Si la pantalla redondea distinto que la base, RF-001-36 rechazaría ventas por un centavo. | P3 (la base decide; la pantalla solo la imita para mostrar) |
| D3 | `crear_venta` recibe un parámetro nuevo **`p_total_esperado`** (opcional) y rechaza la venta si su total no coincide. | Pedido de H-05 («frenar y confirmar»). Es opcional para que la versión de la pantalla que ya está publicada siga funcionando mientras se despliega la nueva. La seguridad no depende de él: la base sigue usando sus propios precios. | P3 · P5 |
| D4 | Los rechazos nuevos llevan un **código de error propio** (`PV001` = producto sin precio, `PV002` = total cambiado) además del texto. | La pantalla reconoce el caso por el código, no comparando textos: si mañana se corrige una palabra, no se rompe RF-001-37. | P3 · P6 |
| D5 | El total del mensaje «El total cambió a $X…» se arma **en la base** con formato argentino (`$1.234,50`), sin depender del idioma del servidor. | RF-001-34 pide que el mensaje salga tal cual de `crear_venta`. | P6 |
| D6 | `crear_venta` también devuelve la **fecha de la venta**. | Con `repetida: true` (RF-001-32) el ticket tiene que mostrar la hora de la venta original, no la del reintento (RF-001-27). | P3 |
| D7 | La «firma» que decide si se reusa la `idempotency_key` pasa a ser **solo productos, cantidades y método de pago**. Hoy también incluye descuento y cliente. | Es lo que dice RF-001-25 después de H-01. Descuentos y clientes están fuera de alcance; dejarlos fuera de la firma evita duplicar una venta si se tocan después de un corte. | P3 |
| D8 | El botón «Cobrar» se deshabilita solo con **carrito vacío, caja cerrada o venta en proceso**. Ya no se deshabilita por falta de método de pago. | Si el botón queda deshabilitado sin método, RF-001-16 («tocar Cobrar sin método → mensaje») no se puede cumplir. | P6 (el error dice qué hacer) |
| D9 | Todos los textos de la pantalla que pide la spec quedan en **una constante de mensajes** dentro de `pos-logica.js`. | Un test compara cada texto contra la spec, letra por letra. | P6 · P4 |
| D10 | Los RF que resuelve la base (RF-001-13, 20, 21, 22, 36, 41 y los mensajes) se prueban con **`tests/sql/001-crear-venta.sql`**, que el autor corre desde el editor SQL de Supabase dentro de `BEGIN … ROLLBACK`, haciéndose pasar por un empleado de prueba. | Un test automático contra la base real necesitaría claves en el repositorio o en la máquina del test, y P5 lo prohíbe. El script no deja datos y muestra «OK» o «FALLA» por caso. | P5 · P4 · H-17 |
| D11 | La migración va en un archivo propio **`base-de-datos/20-punto-de-venta.sql`**, y `00-estructura.sql` se actualiza para que siga siendo la estructura completa. | El autor ejecuta el script en producción desde el panel, igual que `10-ocultar-costos.sql`. | P5 · P8 (la persona decide qué se ejecuta) |
| D12 | **No se toca ninguna política de RLS** ni ninguna tabla. Solo cambia la función `crear_venta` y su permiso `GRANT EXECUTE`. | AGENTS.md: no se cambia RLS sin aprobación. No hace falta. | P3 · P5 |

## 3. Cambios en la base de datos

**Archivo nuevo:** `base-de-datos/20-punto-de-venta.sql` · **Archivo que se actualiza:** `base-de-datos/00-estructura.sql`

Pasos del script, en orden:

1. **Borrar la firma vieja de `crear_venta`** (7 parámetros). Hace falta porque PostgreSQL trata la función con un parámetro más como otra función distinta, y con las dos juntas Supabase no sabe cuál llamar. ⚠️ Es un `DROP FUNCTION`: **necesita tu «sí»** antes de ejecutarlo.
2. **Crear `crear_venta` con 8 parámetros:** los 7 de hoy más `p_total_esperado numeric` (opcional, al final).
3. Dentro de la función, sin cambiar el orden actual de los controles:
   - Al recorrer los productos: si `precio_venta` es 0 o menos, rechazar con «Este producto no tiene precio. Avisale al dueño.» y código `PV001` (RF-001-41).
   - Después de calcular el total y **antes** de insertar: si llegó `p_total_esperado` y es distinto del total calculado, rechazar con «El total cambió a $X porque se actualizó un precio. Revisalo y volvé a cobrar.» y código `PV002` (RF-001-36).
   - Reemplazar los 8 textos de la tabla «Mensajes de `crear_venta`» de la spec por los nuevos, con tildes y en voseo (RF-001-34).
   - Agregar la fecha de la venta a lo que devuelve, tanto en una venta nueva como en una repetida (D6).
   - La búsqueda de la clave repetida sigue siendo **lo primero**: un reintento con la misma clave devuelve la venta ya registrada aunque cambie el total esperado (RF-001-32).
4. **Volver a dar permiso** `GRANT EXECUTE` a `authenticated` y `service_role` con la firma nueva.
5. Se mantienen igual: `SECURITY DEFINER`, `search_path` fijo, el control `is_staff()` y los mensajes de descuentos y de «No autorizado» (fuera de esta spec).

**Sin cambios:** tablas, RLS, triggers `descontar_stock_venta` y `registrar_movimiento_venta` (ya cumplen RF-001-20 a RF-001-22).

**Dependencia de la spec:** `base-de-datos/10-ocultar-costos.sql` lo ejecuta el autor en producción (RF-001-14, H-09). El plan no lo modifica.

## 4. Cambios en `sistema/`

| Archivo | Qué cambia |
|---|---|
| `sistema/js/pos-logica.js` (**nuevo**) | Funciones puras y la constante de mensajes (ver tabla de abajo). |
| `sistema/js/pos.js` | Usa `PosLogica` en el lector, la búsqueda, el carrito, el total, el monto recibido, el cobro y los errores. Saca `precio_costo` del carrito. Envía `p_total_esperado`. Escape cierra el ticket si está abierto. Enter en el monto recibido equivale a «Cobrar». No registra auditoría cuando la venta vuelve `repetida`. |
| `sistema/pos.html` | Carga `js/pos-logica.js` **antes** de `js/pos.js`. Lugar para el aviso de vuelto alto (RF-001-43). |
| `sistema/css/pos.css` | Estilo del vuelto resaltado y foco visible en botones de método, «Cobrar» y ticket. Solo con variables de marca. Revisión del ancho a 360 px. |
| `sistema/sw.js` | Agrega `/js/pos-logica.js` a la lista de archivos y sube `CACHE_VERSION` (lección de `memory.md`). |

### Funciones de `pos-logica.js`

| Función | Qué decide | RF |
|---|---|---|
| `clasificarEntrada(texto, intervalosMs)` | Si un Enter es **escaneo** (3+ caracteres, todos con menos de 50 ms entre teclas) o **texto escrito**. | 03, 04, 05, 45 |
| `buscarPorCodigo(productos, texto)` | Producto activo con `codigo_barra` **exactamente** igual. El nombre no cuenta. | 03, 04, 05, 45 |
| `filtrarCatalogo(productos, texto)` | Activos cuyo nombre o código contienen el texto, sin distinguir mayúsculas. | 06, 07 |
| `validarAgregado(producto, carrito, cajaAbierta)` | Si se puede sumar una unidad y, si no, qué mensaje mostrar (caja cerrada, sin stock, precio 0, stock superado). | 01, 03, 04, 08, 09, 40 |
| `validarCantidad(texto, anterior, stock)` | Cantidad nueva válida, o volver a la anterior (0, vacío, negativo, decimal, más que el stock). | 09, 38 |
| `calcularTotales(carrito, descuentoPct, impuestoPct)` | Subtotal, impuesto y total en centavos, con el redondeo de la base (D2). | 10, 11, 42 |
| `interpretarMonto(texto, total)` | Estado del monto recibido: vacío (pago justo), insuficiente, justo, con vuelto o vuelto alto; y el vuelto. | 17, 18, 33, 43 |
| `puedeCobrar(estado)` | Si el botón «Cobrar» se habilita (D8). | 02, 12, 23 |
| `firmaVenta(items, metodoId)` y `claveIdempotencia(anterior, firma, generarUuid)` | Reusar la clave o generar una nueva (D7). | 25, 29 |
| `actualizarPreciosCarrito(carrito, productos)` | Pasar al carrito los precios recién leídos de la base. | 37 |
| `mensajeDeError(error, enLinea)` | Qué texto mostrar: sin conexión, sesión vencida («No autorizado» o token vencido) o el mensaje de la base. | 24, 26, 34, 39 |
| `esTotalCambiado(error)` | Si el rechazo tiene código `PV002`. | 36, 37 |
| `MENSAJES` | Todos los textos de la spec en un solo lugar. | 01, 05, 09, 16, 18, 24, 39, 40, 43 |

## 5. Tests

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `tests/pos-logica.test.js` (**nuevo**) | `node --test`, automático | Cada función de `pos-logica.js` con los casos de la spec y los casos límite 1, 2, 9, 10, 11, 13, 14 y 15. Rendimiento de `filtrarCatalogo` con 2.000 productos de prueba. |
| `tests/punto-de-venta.test.js` (**nuevo**) | `node --test`, automático, lee archivos | `pos.js` no contiene `precio_costo`; solo llama a `rpc('crear_venta')` y envía `p_total_esperado`; pide `metodos_pago` con `activo = true`; `pos.html` carga `pos-logica.js` antes de `pos.js`; `sw.js` lista `pos-logica.js`; `20-punto-de-venta.sql` tiene los 10 mensajes de la spec tal cual, los códigos `PV001` y `PV002` y el `GRANT` con la firma nueva. |
| `tests/sql/001-crear-venta.sql` (**nuevo**) | SQL contra la base, lo corre el autor (D10) | Total con impuesto (13), stock descontado (20), efectivo suma a la caja (21), transferencia no la cambia (22), total distinto rechazado (36), precio 0 rechazado (41), clave repetida devuelve la misma venta (25, 32), caja cerrada, producto inactivo, stock insuficiente, método inactivo y monto menor (26, 34, 18, 15). Todo dentro de `BEGIN … ROLLBACK`. |
| `tests/constitucion.test.js` | Ya existe, sin cambios | Sin insert directo en `ventas` (19), sin scripts de CDN (P1), sin colores a mano (P2), imágenes con `alt` (P7). |
| Pruebas manuales | En `verificacion.md` | Teclado (30), 360 px (31), impresión (28), ticket (27), red cortada y reintento, lector real, sesión de empleado sin `precio_costo` en la red ni en la API (14), rendimiento en la PC del mostrador (06). |

## 6. Detalle por requisito

### Caja

- **RF-001-01** · `pos-logica.js` (`validarAgregado`, `MENSAJES`), `pos.js` (`agregarAlCarrito`). Cambia el texto a «Abrí la caja para empezar a vender». Base: sin cambios. Test: `pos-logica.test.js` (caja cerrada → no agrega y devuelve el mensaje). P6.
- **RF-001-02** · `pos-logica.js` (`puedeCobrar`), `pos.js` (`calcularTotales`). Base: sin cambios (`crear_venta` igual rechaza con caja cerrada). Test: `pos-logica.test.js`. P3.

### Agregar productos

- **RF-001-03 / RF-001-04** · `pos-logica.js` (`clasificarEntrada`, `buscarPorCodigo`, `validarAgregado`), `pos.js` (`setupSearch`: el lector guarda la hora de cada tecla y deja de aceptar el nombre exacto como código). Base: sin cambios. Test: `pos-logica.test.js` (agrega con cantidad 1; si ya está, suma 1; nombre exacto no agrega; casos límite 1 y 2). P4.
- **RF-001-05** · Mismas funciones; el aviso «No encontramos ese producto (código: …)» sale solo si `clasificarEntrada` dice escaneo. Test: `pos-logica.test.js`. P6.
- **RF-001-45** · `pos.js` (`setupSearch`): un texto escrito que no es código queda en el buscador y se filtra la lista, sin aviso (hoy en algunos casos se borra). Test: `pos-logica.test.js` (texto lento → «texto»; sin coincidencia → sin mensaje) y caso límite 15. P6.
- **RF-001-06** · `pos-logica.js` (`filtrarCatalogo`), `pos.js` (`filtrarProductos`). Test: `pos-logica.test.js` (contiene, sin mayúsculas, solo activos, 2.000 productos en menos de 100 ms) + prueba manual en la PC del mostrador con la pantalla completa. P7.
- **RF-001-07** · `pos.js` (`crearTarjetaProducto` usa `validarAgregado`). Test: `pos-logica.test.js` (mismas reglas que 03/04). P4.
- **RF-001-08** · `pos-logica.js` (`validarAgregado`): hoy un producto **nuevo** con stock 0 entra al carrito si llega por el lector. La tarjeta sigue mostrando «Sin stock». Test: `pos-logica.test.js`. P3 (la base igual lo rechaza al cobrar).
- **RF-001-40** · `pos-logica.js` (`validarAgregado`, `MENSAJES`). Test: `pos-logica.test.js` (caso límite 11). P5.
- **RF-001-41** · `base-de-datos/20-punto-de-venta.sql` (`crear_venta`, código `PV001`). Test: `tests/sql/001-crear-venta.sql` + `punto-de-venta.test.js` (el mensaje está en el script). P5.
- **RF-001-09** · `pos-logica.js` (`validarAgregado`, `validarCantidad`): el mensaje pasa a «Stock disponible: N» también al escanear (hoy dice «No hay mas stock disponible»). Test: `pos-logica.test.js`. P6.

### Carrito y total

- **RF-001-10 / RF-001-11** · `pos-logica.js` (`calcularTotales`), `pos.js` (`cambiarCantidad`, `quitarDelCarrito`). Test: `pos-logica.test.js`. P3.
- **RF-001-38** · `pos-logica.js` (`validarCantidad`), `pos.js` (`cambiarCantidad`): hoy una cantidad inválida **quita** el producto y un decimal se acepta truncado; pasa a volver a la cantidad anterior. Test: `pos-logica.test.js` (0, vacío, −1, 2.5; caso límite 13). P4.
- **RF-001-12** · `pos-logica.js` (`puedeCobrar`). Test: `pos-logica.test.js`.
- **RF-001-13** · Base: `crear_venta` ya calcula así; no cambia la cuenta. Test: `tests/sql/001-crear-venta.sql` (con impuesto distinto de 0 dentro de la transacción). P3.
- **RF-001-42** · `pos-logica.js` (`calcularTotales`, D2). Test: `pos-logica.test.js` (casos con medio centavo, impuesto 0 y 21 %, mismos números que el script SQL). P3.
- **RF-001-35** · `pos.js` (`procesarVenta` envía `p_total_esperado`). Test: `punto-de-venta.test.js`. P3.
- **RF-001-36** · `20-punto-de-venta.sql` (código `PV002`, D3 y D5). Test: `tests/sql/001-crear-venta.sql` (precio cambiado dentro de la transacción → rechazo, sin venta nueva). P3.
- **RF-001-37** · `pos.js` (si `esTotalCambiado`: recargar productos, `actualizarPreciosCarrito`, recalcular y mostrar). Test: `pos-logica.test.js` (`esTotalCambiado`, `actualizarPreciosCarrito`) + caso límite 4 manual. P3.
- **RF-001-14** · `pos.js` (sacar `precio_costo` del carrito; la consulta de productos ya no lo pide). Base: dependencia `10-ocultar-costos.sql`. Test: `punto-de-venta.test.js` (la palabra no aparece en `pos.js`) + prueba manual con sesión de empleado (pestaña Red y pedido directo a la API). P5.

### Cobro

- **RF-001-15** · `pos.js` (`cargarMetodosPago` ya filtra `activo = true`). Base: `crear_venta` ya rechaza métodos inactivos. Test: `punto-de-venta.test.js` + caso en el script SQL.
- **RF-001-16** · `pos.js` (`procesarVenta`), `pos-logica.js` (`MENSAJES`), D8. Test: `pos-logica.test.js` (`puedeCobrar` habilitado sin método) + revisión del mensaje. P6.
- **RF-001-17** · `pos-logica.js` (`interpretarMonto`), `pos.js` (`calcularVuelto`). Test: `pos-logica.test.js`.
- **RF-001-18** · `pos-logica.js` (`interpretarMonto`): «0» y negativos son insuficientes (hoy `parseFloat(x) || total` toma el 0 como pago justo, lección de `memory.md`). Base: ya rechaza. Test: `pos-logica.test.js` (caso límite 10) + script SQL. P5.
- **RF-001-33** · `pos-logica.js` (`interpretarMonto`: vacío = pago justo); `pos.js` envía el monto vacío como «sin monto» y la base lo toma como el total. Test: `pos-logica.test.js` (casos límite 9 y 10).
- **RF-001-43 / RF-001-44** · `pos-logica.js` (`interpretarMonto` → vuelto alto), `pos.js` (bandera de «falta confirmar», se borra si cambia el monto; Enter en el monto equivale a «Cobrar»), `pos.html` (lugar del aviso), `pos.css` (resaltado con variables). Test: `pos-logica.test.js` + prueba manual. P2 · P6.
- **RF-001-19** · Ya cumple. Test: `constitucion.test.js` (sin insert directo) + `punto-de-venta.test.js`. P3.
- **RF-001-20 / 21 / 22** · Base: triggers sin cambios. Test: `tests/sql/001-crear-venta.sql` (stock antes y después; saldo de caja con Efectivo y con Transferencia). P3 · H-17.
- **RF-001-23** · `pos-logica.js` (`puedeCobrar` con «en proceso»), `pos.js`. Test: `pos-logica.test.js` + caso límite 3 manual (doble clic).

### Errores y reintento

- **RF-001-24** · `pos-logica.js` (`mensajeDeError`, `MENSAJES` con tildes). El carrito no se toca. Test: `pos-logica.test.js` + prueba manual con la red cortada. P6.
- **RF-001-25** · `pos-logica.js` (`firmaVenta`, `claveIdempotencia`, D7). Test: `pos-logica.test.js` (mismo carrito y método → misma clave aunque cambie el monto; otra cantidad o método → clave nueva; caso límite 8) + script SQL (clave repetida → una sola venta). P3.
- **RF-001-26 / RF-001-34** · `pos-logica.js` (`mensajeDeError` deja pasar el texto de la base), `20-punto-de-venta.sql` (textos nuevos). Test: `punto-de-venta.test.js` (los 10 mensajes, letra por letra) + script SQL (casos límite 5, 6 y 7). P6.
- **RF-001-39** · `pos-logica.js` (`mensajeDeError` reconoce «No autorizado» y el token vencido). El carrito queda a la vista. Test: `pos-logica.test.js` + prueba manual (desactivar al empleado de prueba con el carrito armado). P6.
- **RF-001-32** · `pos.js` (`procesarVenta`: con `repetida` muestra el ticket con los datos y la fecha que devuelve la base y no registra auditoría otra vez). Base: D6. Test: script SQL (reintento devuelve `repetida: true` y la misma venta) + prueba manual.

### Ticket y cierre

- **RF-001-27** · `pos.js` (`mostrarTicket` usa la fecha de la base). Prueba manual (Media).
- **RF-001-28** · Ya cumple con el área de impresión propia (lección de `memory.md`). Prueba manual (Media).
- **RF-001-29** · `pos.js` (`nuevaVenta` ya borra la clave). Test: `pos-logica.test.js` (`claveIdempotencia` sin clave anterior genera una nueva).

### Uso

- **RF-001-30** · `pos.js` (`setupKeyboard`: Escape cierra el ticket si está abierto; si no, limpia la búsqueda), `pos.css` (foco visible). Prueba manual descrita en la spec. P7.
- **RF-001-31** · `pos.css`. Prueba manual a 360 px con las herramientas del navegador. P7.

## 7. Tabla RF → archivos → test

| RF | Prioridad | Archivos | Test |
|---|---|---|---|
| 01 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 02 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 03 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 04 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 05 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 45 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 06 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual en la PC del mostrador |
| 07 | Alta | `pos.js` | `pos-logica.test.js` |
| 08 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 40 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 41 | Alta | `20-punto-de-venta.sql`, `00-estructura.sql` | `sql/001-crear-venta.sql`, `punto-de-venta.test.js` |
| 09 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 10 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 38 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 11 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 12 | Alta | `pos-logica.js` | `pos-logica.test.js` |
| 13 | Alta | (base, sin cambios en la cuenta) | `sql/001-crear-venta.sql` |
| 42 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 35 | Alta | `pos.js` | `punto-de-venta.test.js` |
| 36 | Alta | `20-punto-de-venta.sql`, `00-estructura.sql` | `sql/001-crear-venta.sql` |
| 37 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual (caso límite 4) |
| 14 | Alta | `pos.js` (+ `10-ocultar-costos.sql` en producción) | `punto-de-venta.test.js` + manual con sesión de empleado |
| 15 | Alta | `pos.js` (sin cambios) | `punto-de-venta.test.js`, `sql/001-crear-venta.sql` |
| 16 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 17 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 18 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js`, `sql/001-crear-venta.sql` |
| 43 | Media | `pos-logica.js`, `pos.js`, `pos.html`, `pos.css` | `pos-logica.test.js` + manual |
| 44 | Media | `pos.js` | manual |
| 33 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 19 | Alta | `pos.js` (sin cambios) | `constitucion.test.js`, `punto-de-venta.test.js` |
| 20 | Alta | (triggers, sin cambios) | `sql/001-crear-venta.sql` |
| 21 | Alta | (triggers, sin cambios) | `sql/001-crear-venta.sql` |
| 22 | Alta | (triggers, sin cambios) | `sql/001-crear-venta.sql` |
| 23 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual (doble clic) |
| 24 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual (red cortada) |
| 25 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js`, `sql/001-crear-venta.sql` |
| 26 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js`, `sql/001-crear-venta.sql` |
| 39 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual |
| 34 | Alta | `20-punto-de-venta.sql`, `00-estructura.sql` | `punto-de-venta.test.js`, `sql/001-crear-venta.sql` |
| 32 | Alta | `pos.js`, `20-punto-de-venta.sql` | `sql/001-crear-venta.sql` + manual |
| 27 | Media | `pos.js` | manual |
| 28 | Media | `pos.js` (sin cambios) | manual |
| 29 | Alta | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 30 | Media | `pos.js`, `pos.css` | manual (prueba de la spec) |
| 31 | Media | `pos.css` | manual a 360 px |

En todos los casos, además: `pos.html` carga `pos-logica.js` y `sw.js` sube `CACHE_VERSION`.

## 8. Orden de trabajo y despliegue

1. **Tests primero** (AGENTS.md): `pos-logica.test.js` y `punto-de-venta.test.js` en rojo.
2. `pos-logica.js` hasta poner en verde sus tests.
3. `pos.js`, `pos.html`, `pos.css` y `sw.js` usando `PosLogica`.
4. `20-punto-de-venta.sql`, `00-estructura.sql` y `tests/sql/001-crear-venta.sql`.
5. **El autor** ejecuta `20-punto-de-venta.sql` en producción (con el «sí» al `DROP FUNCTION`) y después `tests/sql/001-crear-venta.sql`. Como `p_total_esperado` es opcional, la pantalla publicada sigue funcionando entre este paso y el siguiente.
6. Publicar `sistema/` en Netlify con `CACHE_VERSION` nueva.
7. **El autor** ejecuta `10-ocultar-costos.sql` en producción si todavía no se hizo.
8. `/verificar` y `verificacion.md`, con las pruebas manuales.

Cada paso se parte en tareas de menos de 30 minutos en `tasks.md` (`/tareas`), con un commit por tarea, `npm test` en verde (P4) y la skill `revisar-seguridad` antes de cada commit que toque `sistema/js/` o `base-de-datos/`.

## 9. Riesgos

| Riesgo | Qué se hace |
|---|---|
| Dibujar 2.000 tarjetas puede tardar más de 1 segundo aunque el filtro sea rápido (RF-001-06). | Se mide en la PC del mostrador. Si no llega, se dibuja solo una parte de la lista (cambia la pantalla, no la spec). |
| Si `pos-logica.js` no se cachea o no carga, `pos.js` falla entero. | Test que comprueba el orden en `pos.html` y la lista de `sw.js`. |
| Mientras conviven la función vieja y la nueva, Supabase no sabe cuál llamar. | El script borra la vieja y crea la nueva en la misma ejecución. |
| El script SQL depende de que el autor lo corra. | Se nombra en `verificacion.md` con la fecha en que se corrió y su resultado. |

## 10. Decisiones del autor (2026-11-01)

| Pregunta | Decisión |
|---|---|
| **`DROP FUNCTION` de la firma vieja de `crear_venta`** (paso 1 de la sección 3) | **Aprobado.** Lo ejecuta el autor desde el panel, dentro de `20-punto-de-venta.sql`. |
| **D10:** los RF de la base se prueban con un script SQL que corre el autor (con `ROLLBACK`), no con un test automático que necesitaría claves | **Aprobado.** |
| **D7:** descuento y cliente salen de la firma de la clave anti-duplicados | **Aprobado.** |
| **D8:** «Cobrar» queda habilitado aunque no haya método elegido | **Aprobado.** |
