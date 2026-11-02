# Spec 001 · Punto de venta

> **Estado:** aprobada por el autor · **Fecha:** 2026-10-31 · **Actualizada con la clarificación:** 2026-11-01 · **Último cambio:** 2026-11-01 (ver «Historial de cambios»)
> **Alcance acordado:** núcleo del cobro (buscar o escanear, carrito, total, cobrar y errores básicos al cobrar), desde el uso del **empleado** en el mostrador. Lo demás quedó en «Fuera de alcance (mejoras futuras)».

## Contexto

En el kiosco se atiende rápido y con fila: el empleado no puede hacer cuentas a mano ni buscar precios en un cuaderno. El punto de venta (`sistema/pos.html`) le permite pasar los productos por el lector de código de barras, ver el total al instante y cobrar con un toque. La venta se registra con la función `crear_venta`, que en una sola operación calcula los totales con los precios de la base, descuenta el stock y mueve la caja (P3). Esta spec fija ese comportamiento para poder probarlo y cambiarlo sin romperlo.

## Historias de usuario

- **H1.** Como empleado, quiero escanear los productos del cliente y que se sumen solos al carrito, para atender rápido sin escribir nada.
- **H2.** Como empleado, quiero buscar un producto por nombre cuando no tiene código o el lector no lo lee, para poder venderlo igual.
- **H3.** Como empleado, quiero cambiar la cantidad o quitar un producto del carrito, para corregir un error antes de cobrar.
- **H4.** Como empleado, quiero ver el total y cobrar eligiendo el método de pago, para registrar la venta sin hacer cuentas.
- **H5.** Como empleado, quiero que si el cobro falla no se pierda el carrito y me diga qué pasó, para poder corregirlo y volver a cobrar.

## Requisitos

### Agregar productos

> **Escaneo:** 3 o más caracteres terminados en Enter, que llegan con menos de 50 ms entre tecla y tecla (así escribe el lector).
> **Texto escrito:** lo que el empleado tipea a mano en el buscador, más lento que un escaneo.
> En los dos casos, el texto se compara de forma exacta con `codigo_barra`. El nombre exacto no cuenta como código: para buscar por nombre se usa la lista.

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-03 | Cuando llegue un escaneo, o el empleado presione Enter con un texto escrito, igual al `codigo_barra` de un producto activo que no está en el carrito, el sistema deberá agregarlo con cantidad 1. | Evento | Alta |
| RF-001-04 | Cuando llegue un escaneo, o el empleado presione Enter con un texto escrito, igual al `codigo_barra` de un producto que ya está en el carrito, el sistema deberá sumar 1 a su cantidad. | Evento | Alta |
| RF-001-05 | Si un escaneo no coincide con el `codigo_barra` de ningún producto activo, entonces el sistema deberá mostrar «No encontramos ese producto (código: <código>)» sin cambiar el carrito. | No deseado | Alta |
| RF-001-06 | Cuando el empleado escriba en el buscador, el sistema deberá mostrar en menos de 1 segundo (con 2.000 productos cargados, en la PC del mostrador) los productos activos cuyo nombre o código contengan el texto, sin tener en cuenta los espacios del principio y del final y sin distinguir mayúsculas ni marcas sobre las letras («cafe» encuentra «Café», «nandu» encuentra «Ñandú» y «pinguino» encuentra «Pingüino»); si el texto queda vacío o solo con espacios, deberá mostrar todos los productos activos. | Evento | Alta |
| RF-001-07 | Cuando el empleado elija un producto de la lista, el sistema deberá agregarlo al carrito con las mismas reglas de RF-001-03 y RF-001-04. | Evento | Alta |
| RF-001-09 | Si al agregar o cambiar una cantidad se supera el stock disponible (incluido un producto con stock 0), entonces el sistema deberá dejar la cantidad anterior y mostrar «Stock disponible: <N>». | No deseado | Alta |

### Carrito y total

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-10 | Cuando el empleado cambie la cantidad de un producto del carrito, el sistema deberá recalcular el total mostrado. | Evento | Alta |
| RF-001-11 | Cuando el empleado quite un producto del carrito, el sistema deberá sacarlo de la lista y recalcular el total mostrado. | Evento | Alta |
| RF-001-42 | El sistema deberá mostrar en pantalla el total calculado igual que `crear_venta`: la suma de los precios más el `impuesto_porcentaje` configurado, redondeado a 2 decimales. | Siempre | Alta |
| RF-001-14 | El sistema deberá no mostrar ni guardar `precio_costo` en ninguna parte del punto de venta. | Siempre | Alta |

### Cobro

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-12 | Mientras el carrito esté vacío, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |
| RF-001-16 | Si el empleado toca «Cobrar» sin haber elegido método de pago, entonces el sistema deberá no registrar la venta y mostrar «Elegí un método de pago». | No deseado | Alta |
| RF-001-19 | Cuando el empleado confirme el cobro, el sistema deberá registrar la venta solo con `rpc('crear_venta')`. | Evento | Alta |

> El stock, la caja y el total que se guarda los resuelven `crear_venta` y sus triggers, que no cambian en esta spec (P3).

### Errores al cobrar

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-24 | Si no hay conexión al confirmar el cobro, entonces el sistema deberá conservar el carrito y mostrar «Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.». | No deseado | Alta |
| RF-001-26 | Si `crear_venta` rechaza la venta (por ejemplo, stock insuficiente o caja cerrada), entonces el sistema deberá conservar el carrito y mostrar el motivo que devuelve la base. | No deseado | Alta |

## Casos límite

1. **Escaneo con el cursor en el buscador:** el lector escribe el código dentro del campo de búsqueda y presiona Enter. Tiene que agregarse el producto (RF-001-03), no quedar el código escrito como búsqueda.
2. **Dos escaneos seguidos muy rápido** del mismo producto: la cantidad tiene que quedar en 2, no en 1 ni en 3.
3. **Producto con stock 0 por lector:** no entra al carrito y se muestra «Stock disponible: 0» (RF-001-09).
4. **Otra venta se llevó el último producto** desde otra PC antes del cobro: `crear_venta` rechaza por stock insuficiente y el carrito se conserva (RF-001-26).
5. **El dueño cerró la caja desde otra PC** mientras el empleado tenía el carrito armado: `crear_venta` rechaza por caja cerrada y el carrito se conserva (RF-001-26).
6. **El producto se desactivó** después de agregarlo al carrito: `crear_venta` lo rechaza, lo nombra en el mensaje y el carrito se conserva (RF-001-26).
7. **Se corta internet al cobrar:** el carrito se conserva y se avisa (RF-001-24). Que el reintento no duplique la venta es RF-001-25 (mejora futura).
8. **Texto escrito a mano + Enter con un código que existe:** se agrega el producto (RF-001-03).

## Fuera de alcance

- **Descuentos** (hoy existen en el POS; tendrán su propia spec).
- **Asociar un cliente a la venta** (RF10, otra spec).
- **Vender sin conexión** (guardar la venta en el navegador y subirla después): choca con P3.
- **Dar de alta un producto** desde el punto de venta cuando el código no existe.
- **Abrir y cerrar la caja y el arqueo** (RF03).
- **Cancelar una venta** (RF13, solo dueño).
- Diferencias del punto de venta para el rol `dueno`: esta spec describe el uso del empleado.
- Ventas a granel o con peso (cantidades con decimales).
- **Conservar el carrito al recargar la página.** Al recargar se pierde el carrito. Ante la duda, el empleado revisa el historial de ventas antes de volver a cobrar (va en la guía de uso).

### Mejoras futuras

Estos RF estaban en la spec y se sacaron del alcance el 2026-11-01 para cerrar primero el núcleo del cobro. Conservan su número; el texto completo está en la versión anterior de este archivo (historial de git). Lo que ya funciona hoy en `pos.js` sigue funcionando: solo deja de estar especificado y probado por esta spec.

| RF | Qué pedía | Motivo |
|---|---|---|
| 01, 02 | Aviso y «Cobrar» deshabilitado con la caja cerrada | `crear_venta` ya rechaza con la caja cerrada y RF-001-26 muestra el motivo. El aviso antes de cobrar es una mejora. |
| 08 | Etiqueta «Sin stock» en la lista | RF-001-09 ya impide agregarlo; la etiqueta es solo visual. |
| 13, 20, 21, 22 | Total con impuesto, descuento de stock y movimiento de caja en la base | La base ya lo hace y no cambia. Probarlo necesita `tests/sql/` y ejecutarlo en el panel. |
| 15 | Solo métodos de pago activos | Ya funciona y no cambia. |
| 17, 18, 33, 43, 44 | Vuelto, monto menor, monto vacío y vuelto alto | El vuelto ya se muestra; la base rechaza un monto menor (cae en RF-001-26). **Pendiente con prioridad:** hoy un monto «0» se toma como pago justo por `parseFloat(x) \|\| total`. |
| 23, 25, 29 | «Cobrar» deshabilitado al registrar, misma clave al reintentar, clave nueva después | Es la parte más compleja (firma de la venta y reintento). Hoy `pos.js` ya manda `p_idempotency_key` y `nuevaVenta` vacía el carrito. |
| 27, 28, 32 | Ticket, impresión y venta repetida | Es el cierre de la venta, no el cobro. El ticket ya existe. |
| 30, 31 | Venta completa solo con teclado; sin desplazamiento a 360 px | Se verifican a mano y no son parte del núcleo. |
| 34 | Mensajes de `crear_venta` con tildes y voseo | Necesita migrar `crear_venta`. Mientras tanto RF-001-26 muestra el texto actual de la base. |
| 35, 36, 37 | Rechazo y actualización cuando cambió el total | Necesita la firma nueva de `crear_venta` y un `DROP FUNCTION`. |
| 38 | Cantidad inválida (0, vacía, negativa o decimal) | Corrección menor del carrito. |
| 39 | Sesión vencida | Mientras tanto se ve el motivo de la base (RF-001-26). |
| 40, 41 | Producto con precio 0 | Para ser completo necesita un cambio en la base. |
| 45 | Enter con texto escrito que no es un código, sin aviso | Detalle del lector. `clasificarEntrada` ya existe (T04) y se puede enchufar después. |

## Dependencias

- **`base-de-datos/10-ocultar-costos.sql` ejecutado en producción.** Sin ese script, RF-001-14 se cumple en la pantalla pero no en la API. Lo ejecuta el autor desde el panel de Supabase (cambia permisos de la base).

## Criterios de finalización

- [ ] Cada RF activo tiene al menos un test automático o una prueba manual descrita en `verificacion.md`.
- [ ] `npm test` termina en verde.
- [ ] No existe `.from('ventas').insert` ni `.from('detalle_ventas').insert` en `sistema/`.
- [ ] Con el lector real: escanear 3 productos (uno repetido), cobrar y ver en la base la venta con el total que mostró la pantalla.
- [ ] Cortar la red al tocar «Cobrar»: sale el mensaje de RF-001-24 y el carrito sigue en pantalla.
- [ ] Con la sesión de un `empleado`, `precio_costo` no aparece en la pantalla ni en las respuestas de red del POS.
- [ ] `10-ocultar-costos.sql` está ejecutado en producción: con la sesión de un `empleado`, pedir `precio_costo` de `productos` directo a la API devuelve un error de permiso.
- [ ] Los mensajes de esta spec aparecen en voseo, con tildes y tal cual están escritos acá.
- [ ] `CACHE_VERSION` de `sistema/sw.js` subió si cambió algo de `sistema/`.

## RF del kit relacionados

| RF del kit (`02-REQUERIMIENTOS.md`) | RF de esta spec |
|---|---|
| RF02 · Roles `dueno` y `empleado` | RF-001-14 |
| RF04 · Venta escaneando el código de barras | RF-001-03 a RF-001-05, RF-001-09 a RF-001-12, RF-001-19, RF-001-24, RF-001-26, RF-001-42 |
| RF05 · Buscar un producto por nombre o código | RF-001-06, RF-001-07 |
| RF06 · Método de pago y vuelto | RF-001-16 (el vuelto es mejora futura) |
| RF01, RF03, RF07 | Mejoras futuras (RF-001-39; 01, 02; 27, 28) |
| RNF rápido | RF-001-06 |

## Diferencias con el código actual

Lo que hoy no cumple la spec (sirve de entrada para `/planificar`):

- Los mensajes de `sistema/js/pos.js` están en tuteo y sin tildes: «Selecciona un metodo de pago», «Producto no encontrado: <código>», «Sin conexion a internet…» (RF-001-05, RF-001-16, RF-001-24).
- Un nombre exacto se acepta como código (RF-001-03).
- `pos.js` guarda `precio_costo` en cada producto del carrito (RF-001-14).
- El buscador todavía no ignora tildes ni espacios de los bordes (RF-001-06).

El detalle de cada decisión está en `clarificacion.md`.

## Historial de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-01 | RF-001-06 no distingue marcas sobre las letras (tildes, ñ y diéresis). Nuevos RF-001-46 (se ignoran los espacios del principio y del final) y RF-001-47 (buscador vacío o solo con espacios → todos los activos). Solo afectan a la lista del buscador: la comparación exacta con `codigo_barra` de RF-001-03 a RF-001-05 no cambia. | Al escribir los tests de `filtrarCatalogo` (T05) apareció que la spec no decía qué pasa con el texto vacío, las tildes ni los espacios. Decisión del autor. |
| 2026-11-01 | Alcance reducido al núcleo del cobro: quedan 15 RF activos (03, 04, 05, 06, 07, 09, 10, 11, 12, 14, 16, 19, 24, 26, 42). RF-001-46 y 47 pasan a ser parte del texto de RF-001-06. Los otros 30 RF pasan a «Mejoras futuras» con su motivo; se saca la tabla «Mensajes de `crear_venta`» (era de RF-001-34). Ningún RF activo pide cambios en la base. | Pedido del autor (`/cambio`): cerrar primero un núcleo chico y comprobable. |
