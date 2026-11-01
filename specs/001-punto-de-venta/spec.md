# Spec 001 · Punto de venta

> **Estado:** aprobada por el autor · **Fecha:** 2026-10-31 · **Actualizada con la clarificación:** 2026-11-01 · **Último cambio:** 2026-11-01 (ver «Historial de cambios»)
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

> **Escaneo:** 3 o más caracteres terminados en Enter, que llegan con menos de 50 ms entre tecla y tecla (así escribe el lector).
> **Texto escrito:** lo que el empleado tipea a mano en el buscador, más lento que un escaneo.
> En los dos casos, el texto se compara de forma exacta con `codigo_barra`. El nombre exacto no cuenta como código: para buscar por nombre se usa la lista.

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-03 | Cuando llegue un escaneo, o el empleado presione Enter con un texto escrito, igual al `codigo_barra` de un producto activo que no está en el carrito, el sistema deberá agregarlo con cantidad 1. | Evento | Alta |
| RF-001-04 | Cuando llegue un escaneo, o el empleado presione Enter con un texto escrito, igual al `codigo_barra` de un producto que ya está en el carrito, el sistema deberá sumar 1 a su cantidad. | Evento | Alta |
| RF-001-05 | Si un escaneo no coincide con el `codigo_barra` de ningún producto activo, entonces el sistema deberá mostrar «No encontramos ese producto (código: <código>)» sin cambiar el carrito. | No deseado | Alta |
| RF-001-45 | Si el empleado presiona Enter con un texto escrito que no coincide con ningún `codigo_barra`, entonces el sistema deberá dejar el texto en el buscador y mostrar la lista filtrada de RF-001-06, sin aviso de error. | No deseado | Alta |
| RF-001-06 | Cuando el empleado escriba en el buscador, el sistema deberá mostrar en menos de 1 segundo (con 2.000 productos cargados, en la PC del mostrador) los productos activos cuyo nombre o código contengan el texto, sin distinguir mayúsculas ni marcas sobre las letras («cafe» encuentra «Café», «nandu» encuentra «Ñandú» y «pinguino» encuentra «Pingüino»). | Evento | Alta |
| RF-001-46 | Cuando el empleado escriba en el buscador, el sistema deberá filtrar la lista sin tener en cuenta los espacios del principio y del final del texto. | Evento | Alta |
| RF-001-47 | Mientras el buscador esté vacío o tenga solo espacios, el sistema deberá mostrar todos los productos activos. | Estado | Alta |
| RF-001-07 | Cuando el empleado elija un producto de la lista, el sistema deberá agregarlo al carrito con las mismas reglas de RF-001-03 y RF-001-04. | Evento | Alta |
| RF-001-08 | Si un producto tiene stock 0, entonces el sistema deberá mostrarlo con la etiqueta «Sin stock» y no deberá agregarlo al carrito. | No deseado | Alta |
| RF-001-40 | Si un producto tiene `precio_venta` igual a 0, entonces el sistema deberá no agregarlo al carrito y mostrar «Este producto no tiene precio. Avisale al dueño.». | No deseado | Alta |
| RF-001-41 | Si la venta incluye un producto con `precio_venta` igual a 0, entonces `crear_venta` deberá rechazarla con «Este producto no tiene precio. Avisale al dueño.». | No deseado | Alta |
| RF-001-09 | Si al agregar o cambiar una cantidad se supera el stock disponible, entonces el sistema deberá dejar la cantidad anterior y mostrar «Stock disponible: <N>». | No deseado | Alta |

### Carrito y total

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-10 | Cuando el empleado cambie la cantidad de un producto del carrito, el sistema deberá recalcular el total mostrado. | Evento | Alta |
| RF-001-38 | Si el empleado escribe una cantidad que no es un entero mayor o igual a 1 (0, vacío, negativo o decimal), entonces el sistema deberá volver a la cantidad anterior. | No deseado | Alta |
| RF-001-11 | Cuando el empleado quite un producto del carrito, el sistema deberá sacarlo de la lista y recalcular el total mostrado. | Evento | Alta |
| RF-001-12 | Mientras el carrito esté vacío, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |
| RF-001-13 | El sistema deberá registrar la venta con el total que calcula `crear_venta`: la suma de los precios guardados en la base más el `impuesto_porcentaje` configurado, redondeado a 2 decimales. | Siempre | Alta |
| RF-001-42 | El sistema deberá mostrar en pantalla el total calculado de la misma forma que RF-001-13 (precios más impuesto, redondeado a 2 decimales). | Siempre | Alta |
| RF-001-35 | Cuando el empleado confirme el cobro, el sistema deberá enviar a `crear_venta` el total que estaba mostrando la pantalla. | Evento | Alta |
| RF-001-36 | Si el total que calcula `crear_venta` es distinto del total enviado por la pantalla, entonces el sistema deberá no registrar la venta y mostrar «El total cambió a $X porque se actualizó un precio. Revisalo y volvé a cobrar.». | No deseado | Alta |
| RF-001-37 | Cuando la venta se rechace porque cambió el total, el sistema deberá actualizar los precios del carrito y el total mostrado con los de la base. | Evento | Alta |
| RF-001-14 | El sistema deberá no mostrar `precio_costo` en ninguna parte del punto de venta. | Siempre | Alta |

### Cobro

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-15 | El sistema deberá ofrecer solo los métodos de pago con `activo = true`. | Siempre | Alta |
| RF-001-16 | Si el empleado toca «Cobrar» sin haber elegido método de pago, entonces el sistema deberá no registrar la venta y mostrar «Elegí un método de pago». | No deseado | Alta |
| RF-001-17 | Donde el método de pago sea Efectivo, cuando el empleado cargue el monto recibido, el sistema deberá mostrar el vuelto (monto recibido menos total). | Opcional + Evento | Alta |
| RF-001-18 | Si el método es Efectivo y el monto recibido es menor al total (incluido 0 o un número negativo), entonces el sistema deberá no registrar la venta y mostrar «El monto recibido es menor al total». | No deseado | Alta |
| RF-001-43 | Si el vuelto es mayor que el total, entonces el sistema deberá resaltar el vuelto y mostrar «El vuelto es mayor que el total. Presioná Enter otra vez para confirmar.». | No deseado | Media |
| RF-001-44 | Mientras se muestre el aviso de RF-001-43, el sistema deberá registrar la venta solo cuando el empleado confirme por segunda vez. | Estado | Media |
| RF-001-33 | Donde el método de pago sea Efectivo, si el empleado deja vacío el monto recibido, entonces el sistema deberá registrar la venta como pago justo, con vuelto $0. | Opcional + No deseado | Alta |
| RF-001-19 | Cuando el empleado confirme el cobro, el sistema deberá registrar la venta solo con `rpc('crear_venta')`. | Evento | Alta |
| RF-001-20 | Cuando se registre una venta, el sistema deberá descontar el stock de cada producto en la misma operación. | Evento | Alta |
| RF-001-21 | Cuando se registre una venta en Efectivo, el sistema deberá sumar el total al saldo de la caja abierta. | Evento | Alta |
| RF-001-22 | Si la venta se paga con un método distinto de Efectivo, entonces el sistema deberá no cambiar el saldo de efectivo de la caja. | No deseado | Alta |
| RF-001-23 | Mientras la venta se está registrando, el sistema deberá deshabilitar el botón «Cobrar». | Estado | Alta |

> RF-001-20, RF-001-21 y RF-001-22 los cumplen `crear_venta` y los triggers `descontar_stock_venta` y `registrar_movimiento_venta`. Se prueban **contra la base** (test o consulta SQL), no en el navegador.

### Errores y reintento

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-24 | Si no hay conexión al confirmar el cobro, entonces el sistema deberá conservar el carrito y mostrar «Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.». | No deseado | Alta |
| RF-001-25 | Cuando el empleado reintente el cobro sin haber cambiado los productos, las cantidades ni el método de pago, el sistema deberá enviar la misma `idempotency_key` para que la venta no se registre dos veces, aunque haya cambiado el monto recibido. | Evento | Alta |
| RF-001-26 | Si `crear_venta` rechaza la venta (por ejemplo, stock insuficiente o caja cerrada), entonces el sistema deberá conservar el carrito y mostrar el motivo que devuelve la base. | No deseado | Alta |
| RF-001-39 | Si al cobrar la sesión venció o el usuario fue desactivado, entonces el sistema deberá no registrar la venta, mostrar «Tu sesión venció. Ingresá de nuevo para seguir vendiendo.» y dejar el carrito a la vista. | No deseado | Alta |
| RF-001-34 | Si `crear_venta` rechaza una venta, entonces el sistema deberá devolver el mensaje de la tabla «Mensajes de `crear_venta`», con tildes y en voseo. | No deseado | Alta |
| RF-001-32 | Cuando `crear_venta` responda que la venta ya estaba registrada (`repetida: true`), el sistema deberá mostrar el ticket de esa venta sin registrar otra. | Evento | Alta |

#### Mensajes de `crear_venta`

| Hoy | Tiene que decir |
|---|---|
| La venta no tiene productos | «La venta no tiene productos.» |
| Metodo de pago invalido | «El método de pago no es válido. Elegí otro.» |
| La caja esta cerrada | «La caja está cerrada. Abrila para seguir vendiendo.» |
| El producto "X" no esta activo | «El producto "X" no está activo. Quitalo del carrito.» |
| Cantidad invalida para "X" | «La cantidad de "X" no es válida.» |
| Stock insuficiente de "X" (disponible: N) | «Stock insuficiente de "X" (disponible: N).» |
| Hay productos que no existen o fueron eliminados | «Hay productos que ya no existen. Quitalos del carrito.» |
| El monto recibido es menor al total | «El monto recibido es menor al total.» |
| (nuevo) | «Este producto no tiene precio. Avisale al dueño.» |
| (nuevo) | «El total cambió a $X porque se actualizó un precio. Revisalo y volvé a cobrar.» |

Los mensajes de descuentos y de «No autorizado» no son parte de esta tabla: los descuentos están fuera de alcance y la sesión vencida la cubre RF-001-39.

### Ticket y cierre de la venta

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-27 | Cuando la venta quede registrada, el sistema deberá mostrar el ticket con número de venta, fecha y hora, productos con cantidad y precio, total, método de pago y, si fue en efectivo, monto recibido y vuelto. | Evento | Media |
| RF-001-28 | Cuando el empleado toque «Imprimir», el sistema deberá imprimir solo el ticket, sin el resto de la pantalla. | Evento | Media |
| RF-001-29 | Cuando la venta quede registrada, el sistema deberá vaciar el carrito y preparar una `idempotency_key` nueva para la venta siguiente. | Evento | Alta |

### Uso

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-001-30 | El sistema deberá permitir hacer una venta completa (escanear, elegir método, cargar monto, cobrar y cerrar el ticket) solo con el lector y las teclas Tab, Enter y Escape. | Siempre | Media |
| RF-001-31 | El sistema deberá mostrar el punto de venta sin desplazamiento horizontal en pantallas desde 360 px de ancho. | Siempre | Media |

**Prueba manual de RF-001-30:** con el mouse desconectado, escanear un producto; con Tab llegar al método Efectivo y elegirlo con Enter; escribir el monto; con Tab llegar a «Cobrar» y presionar Enter; cerrar el ticket con Escape. Cada paso tiene que mostrar el foco a la vista.

## Casos límite

1. **Escaneo con el cursor en el buscador:** el lector escribe el código dentro del campo de búsqueda y presiona Enter. Tiene que agregarse el producto (RF-001-03), no quedar el código escrito como búsqueda.
2. **Dos escaneos seguidos muy rápido** del mismo producto: la cantidad tiene que quedar en 2, no en 1 ni en 3.
3. **Doble clic en «Cobrar»:** se registra una sola venta (RF-001-23 y RF-001-25).
4. **El precio cambió entre que se cargó la pantalla y el cobro:** la venta no se registra, la pantalla muestra el total nuevo y el empleado vuelve a cobrar (RF-001-35 a RF-001-37).
5. **Otra venta se llevó el último producto** desde otra PC antes del cobro: `crear_venta` rechaza con «Stock insuficiente de "<producto>" (disponible: N)» y el carrito se conserva (RF-001-26).
6. **El dueño cerró la caja desde otra PC** mientras el empleado tenía el carrito armado: el cobro se rechaza con «La caja está cerrada. Abrila para seguir vendiendo.» y el carrito se conserva.
7. **El producto se desactivó** después de agregarlo al carrito: `crear_venta` lo rechaza y lo nombra en el mensaje.
8. **Se corta internet y vuelve:** el empleado reintenta sin tocar el carrito y queda una sola venta (RF-001-25). Si cambió el carrito, es una venta nueva con clave nueva.
9. **Monto recibido igual al total:** se acepta y el vuelto es 0.
10. **Monto recibido vacío en Efectivo:** se registra como pago justo (RF-001-33). Si escribe «0», se rechaza (RF-001-18).
11. **Producto con precio 0:** no entra al carrito (RF-001-40) y, si llegara a la base, tampoco se vende (RF-001-41).
12. **Sesión vencida con el carrito armado:** no se registra la venta y el carrito queda a la vista (RF-001-39).
13. **Cantidad 0 o vacía en el carrito:** vuelve a la cantidad anterior; el producto se quita solo con el botón (RF-001-38).
14. **Texto escrito a mano + Enter:** si es un código que existe, se agrega el producto (RF-001-03); si no, queda como búsqueda y se ve la lista filtrada, sin aviso (RF-001-45).
15. **Código escrito a mano que no existe:** no avisa, porque no se puede distinguir de una búsqueda; la lista queda vacía (RF-001-45). El aviso de RF-001-05 es solo para el lector.

## Fuera de alcance

- **Descuentos** (hoy existen en el POS; tendrán su propia spec).
- **Asociar un cliente a la venta** (RF10, otra spec).
- **Vender sin conexión** (guardar la venta en el navegador y subirla después): choca con P3.
- **Dar de alta un producto** desde el punto de venta cuando el código no existe.
- **Abrir y cerrar la caja y el arqueo** (RF03): acá solo importa si la caja está abierta o cerrada.
- **Cancelar una venta** (RF13, solo dueño).
- Diferencias del punto de venta para el rol `dueno`: esta spec describe el uso del empleado.
- Ventas a granel o con peso (cantidades con decimales).
- **Conservar el carrito al recargar la página.** Al recargar se pierden el carrito y la clave anti-duplicados. Ante la duda, el empleado revisa el historial de ventas antes de volver a cobrar (va en la guía de uso).

## Dependencias

- **`base-de-datos/10-ocultar-costos.sql` ejecutado en producción.** Sin ese script, RF-001-14 se cumple en la pantalla pero no en la API. Lo ejecuta el autor desde el panel de Supabase (cambia permisos de la base).

## Criterios de finalización

- [ ] Cada RF de prioridad Alta tiene al menos un test automático o una prueba manual descrita en `verificacion.md`.
- [ ] `npm test` termina en verde.
- [ ] No existe `.from('ventas').insert` ni `.from('detalle_ventas').insert` en `sistema/`.
- [ ] Con el lector real: escanear 3 productos (uno repetido), cobrar en efectivo y ver el vuelto correcto.
- [ ] Cortar la red al tocar «Cobrar», reintentar con la red de vuelta y comprobar en la base que hay **una sola** venta.
- [ ] Una venta con Transferencia no cambia el saldo de efectivo de la caja.
- [ ] Con la sesión de un `empleado`, `precio_costo` no aparece en la pantalla ni en las respuestas de red del POS.
- [ ] `10-ocultar-costos.sql` está ejecutado en producción: con la sesión de un `empleado`, pedir `precio_costo` de `productos` directo a la API devuelve un error de permiso.
- [ ] Todos los mensajes de esta spec aparecen en voseo, con tildes y tal cual están escritos acá.
- [ ] La pantalla se usa sin desplazamiento horizontal a 360 px.
- [ ] Una venta completa se hace solo con teclado y lector.
- [ ] El ticket se imprime sin el resto de la pantalla.
- [ ] `CACHE_VERSION` de `sistema/sw.js` subió si cambió algo de `sistema/`.

## RF del kit relacionados

| RF del kit (`02-REQUERIMIENTOS.md`) | RF de esta spec |
|---|---|
| RF01 · Iniciar sesión | RF-001-39 |
| RF02 · Roles `dueno` y `empleado` | RF-001-14 |
| RF03 · Abrir y cerrar la caja | RF-001-01, RF-001-02, RF-001-21, RF-001-22 |
| RF04 · Venta escaneando el código de barras | RF-001-03 a RF-001-05, RF-001-08 a RF-001-13, RF-001-19, RF-001-20, RF-001-23 a RF-001-26, RF-001-29, RF-001-32, RF-001-34 a RF-001-38, RF-001-40 a RF-001-42 |
| RF05 · Buscar un producto por nombre o código | RF-001-06, RF-001-07, RF-001-45 a RF-001-47 |
| RF06 · Método de pago y vuelto | RF-001-15 a RF-001-18, RF-001-33, RF-001-43, RF-001-44 |
| RF07 · Imprimir el ticket | RF-001-27, RF-001-28 |
| RF15 · Auditoría | (fuera de esta spec; lo registra la base) |
| RNF responsive, rápido, accesible | RF-001-06, RF-001-30, RF-001-31 |

## Diferencias con el código actual

Lo que hoy no cumple la spec (sirve de entrada para `/planificar`):

- Los mensajes de `sistema/js/pos.js` están en tuteo y sin tildes: «Debes abrir la caja antes de vender», «Selecciona un metodo de pago», «Producto no encontrado: <código>», «Sin conexion a internet…» (RF-001-01, RF-001-05, RF-001-16, RF-001-24).
- Los mensajes de `crear_venta` no tienen tildes (RF-001-34).
- `crear_venta` no recibe el total de la pantalla ni rechaza productos con precio 0 (RF-001-35, RF-001-36, RF-001-41).
- Un nombre exacto se acepta como código, y un Enter con texto escrito borra el buscador en algunos casos (RF-001-03 y RF-001-45).
- Un monto recibido «0» se toma como pago justo por `parseFloat(x) || total` (RF-001-18).
- Faltan: cantidad inválida (RF-001-38), sesión vencida (RF-001-39), precio 0 (RF-001-40), venta repetida (RF-001-32) y confirmación de vuelto alto (RF-001-43, RF-001-44).

El detalle de cada decisión está en `clarificacion.md`.

## Historial de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-01 | RF-001-06 no distingue marcas sobre las letras (tildes, ñ y diéresis). Nuevos RF-001-46 (se ignoran los espacios del principio y del final) y RF-001-47 (buscador vacío o solo con espacios → todos los activos). Solo afectan a la lista del buscador: la comparación exacta con `codigo_barra` de RF-001-03 a RF-001-05 no cambia. | Al escribir los tests de `filtrarCatalogo` (T05) apareció que la spec no decía qué pasa con el texto vacío, las tildes ni los espacios. Decisión del autor. |
