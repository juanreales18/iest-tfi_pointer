# Spec 001 · Punto de venta

> **Estado:** aprobada por el autor · **Fecha:** 2026-10-31
> **Alcance acordado:** núcleo de la venta + ticket, desde el uso del **empleado** en el mostrador.

## Contexto

En el kiosco se atiende rápido y con fila: el empleado no puede hacer cuentas a mano ni buscar precios en un cuaderno. El punto de venta (`sistema/pos.html`) le permite pasar los productos por el lector de código de barras, ver el total y el vuelto al instante y cobrar con un toque. La venta se registra con la función `crear_venta`, que en una sola operación calcula los totales con los precios de la base, descuenta el stock y mueve la caja (P3). Esta spec fija ese comportamiento para poder probarlo y cambiarlo sin romperlo.

## Historias de usuario

- **H1.** Como empleado, quiero escanear los productos del cliente y que se sumen solos al carrito, para atender rápido sin escribir nada.
- **H2.** Como empleado, quiero buscar un producto por nombre cuando no tiene código o el lector no lo lee, para poder venderlo igual.
- **H3.** Como empleado, quiero cambiar la cantidad o quitar un producto del carrito, para corregir un error antes de cobrar.
- **H4.** Como empleado, quiero elegir el método de pago y ver el vuelto al cargar lo que me dieron, para no equivocarme con el cambio.
- **H5.** Como empleado, quiero que si se corta internet al cobrar no se pierda el carrito ni se duplique la venta, para poder reintentar tranquilo.
- **H6.** Como empleado, quiero ver e imprimir el ticket de la venta, para entregárselo al cliente si lo pide.

## Requisitos

### Caja

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-01 | Mientras la caja esté `cerrada`, cuando el empleado intente agregar un producto, el sistema deberá no agregarlo y mostrar «Abrí la caja para empezar a vender». | Estado + Evento | Alta |
| RF-001-02 | Mientras la caja esté `cerrada`, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |

### Agregar productos

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-03 | Cuando el lector envíe el código de un producto activo que no está en el carrito, el sistema deberá agregarlo con cantidad 1. | Evento | Alta |
| RF-001-04 | Cuando el lector envíe el código de un producto que ya está en el carrito, el sistema deberá sumar 1 a su cantidad. | Evento | Alta |
| RF-001-05 | Si el código enviado por el lector no corresponde a ningún producto activo, entonces el sistema deberá mostrar «No encontramos ese producto (código: <código>)» sin cambiar el carrito. | No deseado | Alta |
| RF-001-06 | Cuando el empleado escriba en el buscador, el sistema deberá mostrar en menos de 1 segundo los productos activos cuyo nombre o código contengan el texto, sin distinguir mayúsculas. | Evento | Alta |
| RF-001-07 | Cuando el empleado elija un producto de la lista, el sistema deberá agregarlo al carrito con las mismas reglas de RF-001-03 y RF-001-04. | Evento | Alta |
| RF-001-08 | Si un producto tiene stock 0, entonces el sistema deberá mostrarlo con la etiqueta «Sin stock» y no deberá agregarlo al carrito. | No deseado | Alta |
| RF-001-09 | Si al agregar o cambiar una cantidad se supera el stock disponible, entonces el sistema deberá dejar la cantidad anterior y mostrar «Stock disponible: <N>». | No deseado | Alta |

### Carrito y total

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-10 | Cuando el empleado cambie la cantidad de un producto del carrito, el sistema deberá recalcular el total mostrado. | Evento | Alta |
| RF-001-11 | Cuando el empleado quite un producto del carrito, el sistema deberá sacarlo de la lista y recalcular el total mostrado. | Evento | Alta |
| RF-001-12 | Mientras el carrito esté vacío, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |
| RF-001-13 | El sistema deberá registrar la venta con el total que calcula `crear_venta` a partir de los precios guardados en la base, aunque el total mostrado en pantalla sea distinto. | Siempre | Alta |
| RF-001-14 | El sistema deberá no mostrar `precio_costo` en ninguna parte del punto de venta. | Siempre | Alta |

### Cobro

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-15 | El sistema deberá ofrecer solo los métodos de pago con `activo = true` (hoy: Efectivo, Débito, Crédito, Transferencia y Vale / Cuenta). | Siempre | Alta |
| RF-001-16 | Si el empleado toca «Cobrar» sin haber elegido método de pago, entonces el sistema deberá no registrar la venta y mostrar «Elegí un método de pago». | No deseado | Alta |
| RF-001-17 | Donde el método de pago sea Efectivo, cuando el empleado cargue el monto recibido, el sistema deberá mostrar el vuelto (monto recibido menos total). | Opcional + Evento | Alta |
| RF-001-18 | Si el método es Efectivo y el monto recibido es menor al total, entonces el sistema deberá no registrar la venta y mostrar «El monto recibido es menor al total». | No deseado | Alta |
| RF-001-19 | Cuando el empleado confirme el cobro, el sistema deberá registrar la venta solo con `rpc('crear_venta')`. | Evento | Alta |
| RF-001-20 | Cuando se registre una venta, el sistema deberá descontar el stock de cada producto en la misma operación. | Evento | Alta |
| RF-001-21 | Cuando se registre una venta en Efectivo, el sistema deberá sumar el total al saldo de la caja abierta. | Evento | Alta |
| RF-001-22 | Si la venta se paga con un método distinto de Efectivo, entonces el sistema deberá no cambiar el saldo de efectivo de la caja. | No deseado | Alta |
| RF-001-23 | Mientras la venta se está registrando, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |

### Errores y reintento

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-24 | Si no hay conexión al confirmar el cobro, entonces el sistema deberá conservar el carrito y mostrar «Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.». | No deseado | Alta |
| RF-001-25 | Cuando el empleado reintente el cobro sin haber cambiado el carrito, el método de pago ni el monto, el sistema deberá enviar la misma `idempotency_key` para que la venta no se registre dos veces. | Evento | Alta |
| RF-001-26 | Si `crear_venta` rechaza la venta (por ejemplo, stock insuficiente o caja cerrada), entonces el sistema deberá conservar el carrito y mostrar el motivo que devuelve la base. | No deseado | Alta |

### Ticket y cierre de la venta

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-27 | Cuando la venta quede registrada, el sistema deberá mostrar el ticket con número de venta, fecha y hora, productos con cantidad y precio, total, método de pago y, si fue en efectivo, monto recibido y vuelto. | Evento | Media |
| RF-001-28 | Cuando el empleado toque «Imprimir», el sistema deberá imprimir solo el ticket, sin el resto de la pantalla. | Evento | Media |
| RF-001-29 | Cuando la venta quede registrada, el sistema deberá vaciar el carrito y preparar una `idempotency_key` nueva para la venta siguiente. | Evento | Alta |

### Uso

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-30 | El sistema deberá permitir hacer una venta completa (escanear, elegir método, cargar monto, cobrar y cerrar el ticket) solo con teclado y lector. | Siempre | Media |
| RF-001-31 | El sistema deberá mostrar el punto de venta sin desplazamiento horizontal en pantallas desde 360 px de ancho. | Siempre | Media |

## Casos límite

1. **Escaneo con el cursor en el buscador:** el lector escribe el código dentro del campo de búsqueda y presiona Enter. Tiene que agregarse el producto (RF-001-03), no quedar el código escrito como búsqueda.
2. **Dos escaneos seguidos muy rápido** del mismo producto: la cantidad tiene que quedar en 2, no en 1 ni en 3.
3. **Doble clic en «Cobrar»:** se registra una sola venta (RF-001-23 y RF-001-25).
4. **El precio cambió entre que se cargó la pantalla y el cobro:** el ticket y la venta usan el precio de la base (RF-001-13), aunque el carrito mostrara el anterior.
5. **Otra venta se llevó el último producto** desde otra PC antes del cobro: `crear_venta` rechaza con «Stock insuficiente de "<producto>" (disponible: N)» y el carrito se conserva (RF-001-26).
6. **El dueño cerró la caja desde otra PC** mientras el empleado tenía el carrito armado: el cobro se rechaza con «La caja está cerrada» y el carrito se conserva.
7. **El producto se desactivó** después de agregarlo al carrito: `crear_venta` lo rechaza y lo nombra en el mensaje.
8. **Se corta internet y vuelve:** el empleado reintenta sin tocar el carrito y queda una sola venta (RF-001-25). Si cambió el carrito, es una venta nueva con clave nueva.
9. **Monto recibido igual al total:** se acepta y el vuelto es 0.

## Fuera de alcance

- **Descuentos** (hoy existen en el POS; tendrán su propia spec).
- **Asociar un cliente a la venta** (RF10, otra spec).
- **Vender sin conexión** (guardar la venta en el navegador y subirla después): choca con P3.
- **Dar de alta un producto** desde el punto de venta cuando el código no existe.
- **Abrir y cerrar la caja y el arqueo** (RF03): acá solo importa si la caja está abierta o cerrada.
- **Cancelar una venta** (RF13, solo dueño).
- Diferencias del punto de venta para el rol `dueno`: esta spec describe el uso del empleado.
- Ventas a granel o con peso (cantidades con decimales).

## Criterios de finalización

- [ ] Cada RF de prioridad Alta tiene al menos un test automático o una prueba manual descrita en `verificacion.md`.
- [ ] `npm test` termina en verde.
- [ ] No existe `.from('ventas').insert` ni `.from('detalle_ventas').insert` en `sistema/`.
- [ ] Con el lector real: escanear 3 productos (uno repetido), cobrar en efectivo y ver el vuelto correcto.
- [ ] Cortar la red al tocar «Cobrar», reintentar con la red de vuelta y comprobar en la base que hay **una sola** venta.
- [ ] Una venta con Transferencia no cambia el saldo de efectivo de la caja.
- [ ] Con la sesión de un `empleado`, `precio_costo` no aparece en la pantalla ni en las respuestas de red del POS.
- [ ] Todos los mensajes de esta spec aparecen en voseo, con tildes y tal cual están escritos acá.
- [ ] La pantalla se usa sin desplazamiento horizontal a 360 px.
- [ ] Una venta completa se hace solo con teclado y lector.
- [ ] El ticket se imprime sin el resto de la pantalla.
- [ ] `CACHE_VERSION` de `sistema/sw.js` subió si cambió algo de `sistema/`.

## RF del kit relacionados

| RF del kit (`02-REQUERIMIENTOS.md`) | RF de esta spec |
|---|---|
| RF02 · Roles `dueno` y `empleado` | RF-001-14 |
| RF03 · Abrir y cerrar la caja | RF-001-01, RF-001-02, RF-001-21, RF-001-22 |
| RF04 · Venta escaneando el código de barras | RF-001-03 a RF-001-05, RF-001-08 a RF-001-13, RF-001-19, RF-001-20, RF-001-23 a RF-001-26, RF-001-29 |
| RF05 · Buscar un producto por nombre o código | RF-001-06, RF-001-07 |
| RF06 · Método de pago y vuelto | RF-001-15 a RF-001-18 |
| RF07 · Imprimir el ticket | RF-001-27, RF-001-28 |
| RF15 · Auditoría | (fuera de esta spec; lo registra la base) |
| RNF responsive, rápido, accesible | RF-001-06, RF-001-30, RF-001-31 |

## Diferencias con el código actual (para `/clarificar`)

- Los mensajes de `sistema/js/pos.js` están en tuteo y sin tildes: «Debes abrir la caja antes de vender», «Selecciona un metodo de pago», «Producto no encontrado: <código>», «Sin conexion a internet…». La spec los fija en voseo (P6).
- Falta confirmar con el autor si la recarga de la página con un carrito armado lo tiene que conservar o puede perderlo.
