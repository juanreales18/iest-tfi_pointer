# Spec 002 · Caja y arqueo

> **Estado:** terminada: implementada, publicada en `pointer-demo` y dada por terminada por el autor el 2026-11-03 · **Fecha:** 2026-11-02
> **Alcance acordado:** abrir la caja con un monto inicial y cerrarla mostrando la diferencia entre lo esperado y lo contado (solo efectivo), en la sección Caja y en el punto de venta. Lo demás quedó en «Fuera de alcance (mejoras futuras)».

## Contexto

Al terminar el turno, el kiosco necesita saber si el efectivo del cajón coincide con lo que el sistema espera. La apertura y el cierre ya existen, pero el navegador calcula la diferencia y `cajas_guard` no la controla, así que se puede guardar cualquier valor; eso choca con P3. Además, el resultado solo aparece en un aviso temporal, sin esperado ni contado. Esta spec pasa el cálculo a la base, valida los montos y deja el resultado a la vista hasta que el usuario lo cierre. Todas las transferencias siguen fuera del arqueo: la caja cuenta solo el efectivo.

## Historias de usuario

- **H1.** Como empleado o dueño, quiero abrir la caja con el efectivo que hay en el cajón, para que el sistema sepa con cuánto arranca el turno.
- **H2.** Como empleado o dueño, quiero ver el efectivo esperado y escribir lo que conté, para saber cuánto da la diferencia antes de cerrar.
- **H3.** Como empleado o dueño, quiero ver un resumen al cerrar, para saber si sobró o faltó plata y poder anotarlo.
- **H4.** Como dueño, quiero que la base calcule la diferencia y no se pueda cambiar después, para confiar en el dato guardado.

## Requisitos

> **Efectivo esperado:** `cajas.saldo_actual` (fondo inicial + ventas en efectivo − cancelaciones en efectivo). Lo mantienen `registrar_movimiento_venta` y `cancelar_venta`.
> **Diferencia:** `saldo_contado − saldo_actual`. Positiva es «Sobrante», negativa es «Faltante» y 0 es «Sin diferencia».
> **Usuario:** `dueno` o `empleado`. Los dos roles abren y cierran, desde la sección Caja (`app.js`) y desde el punto de venta (`pos.js`), con las mismas reglas.

### Apertura

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-002-01 | Cuando el usuario confirme la apertura de una caja cerrada con un monto de 0 o más, el sistema deberá dejarla `abierta` con `saldo_inicial` y `saldo_actual` iguales a ese monto. | Evento | Alta |
| RF-002-02 | Si el monto inicial queda vacío o no es un número de 0 o más, o si el efectivo contado escrito no es un número de 0 o más, entonces el sistema deberá no abrir ni cerrar la caja y mostrar «Ingresá un monto de 0 o más». | No deseado | Alta |
| RF-002-03 | Si el usuario intenta abrir una caja que ya está abierta (por ejemplo, desde una pantalla sin actualizar), entonces el sistema deberá no cambiar sus saldos y mostrar «La caja ya está abierta». | No deseado | Alta |

### Cierre y arqueo

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-002-04 | Mientras el modal de cierre esté abierto, el sistema deberá mostrar el efectivo esperado y, si hay un contado escrito, la diferencia que resultaría. | Estado | Alta |
| RF-002-05 | Cuando una caja pase a `cerrada`, la base deberá guardar en `diferencia` el resultado de `saldo_contado` menos el `saldo_actual` anterior al `update`, o `null` si no hay contado, descartando el valor que mande el navegador. | Evento | Alta |
| RF-002-08 | Cuando la caja quede cerrada, el sistema deberá mostrar en el modal, hasta que el usuario toque «Listo», el esperado guardado en la base junto con el contado y la diferencia con «Sobrante», «Faltante» o «Sin diferencia», o junto con «Cerrada sin arqueo» si no hubo contado. | Evento | Alta |

### Protección en la base

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-002-06 | Si un `update` de `cajas` cambia `saldo_inicial` o `saldo_contado` a un valor negativo, entonces `cajas_guard` deberá rechazarlo para cualquier rol. | No deseado | Alta |
| RF-002-07 | Si una caja que sigue `cerrada` recibe un cambio de `saldo_inicial`, `saldo_actual`, `saldo_contado`, `diferencia` o `fecha_cierre`, entonces el sistema deberá rechazarlo para cualquier rol y mostrar «La caja ya fue cerrada». | No deseado | Alta |

> **Orden dentro de `cajas_guard` (H-01):** primero la salida para funciones internas (`crear_venta`, `cancelar_venta`, `registrar_movimiento_venta` y el panel), después las reglas de esta spec para todos los roles y recién después la salida del dueño. La función sigue sin ser `SECURITY DEFINER`, porque depende de `current_user`.
> **Saldos por API (H-02):** para los dos roles, `saldo_inicial` y `saldo_actual` cambian solo al abrir una caja cerrada, con los dos iguales al monto de apertura (RF-002-01). Con la caja abierta, un cambio de saldo se rechaza, también al cerrarla (RF-002-03, RF-002-05). Las funciones internas y el panel no pasan por esta regla.
> El contado es **opcional**: vacío no es un error y la caja se cierra sin arqueo (decisión del autor). `0` sí es un contado.
> El esperado sale de `cajas.saldo_actual` y no de `movimientos_caja`, porque un `empleado` solo ve por RLS sus propios movimientos.
> Los movimientos de `apertura` y `cierre`, las notas y la auditoría siguen como hoy; la auditoría y el resumen usan la diferencia que devuelve la base, y el movimiento de cierre usa el saldo de la fila que devuelve el `update`. No cambia ninguna política de RLS.
> Los campos de monto siguen siendo `type="number"`. La validación recibe el valor y también `validity.badInput`, para distinguir «vacío» de «inválido» (H-04).
> Las validaciones de monto, la vista previa y la elección de «Sobrante», «Faltante» o «Sin diferencia» van en un archivo de lógica pura sin DOM (`sistema/js/caja-logica.js`), con el patrón de `pos-logica.js` y tests en `tests/`. La vista previa solo informa: el dato que vale es el de la base (P3).

## Casos límite

1. **Se contó $0:** es un contado válido y la diferencia es todo lo esperado, en negativo (RF-002-05).
2. **Contado vacío:** la caja se cierra, `saldo_contado` y `diferencia` quedan en `null` y el resumen muestra el esperado y «Cerrada sin arqueo» (RF-002-05, RF-002-08).
3. **Entra una venta en efectivo con el modal de cierre abierto:** la base calcula con el saldo del momento del cierre, así que el resumen puede diferir de la vista previa. Vale el resumen (RF-002-05, RF-002-08).
4. **Dos PC cierran la misma caja:** la segunda no cambia nada y ve «La caja ya fue cerrada» (RF-002-07).
5. **El dueño abre desde una pantalla sin actualizar con la caja ya abierta:** hoy el trigger no lo frena y pisaría el saldo. Con esta spec no cambia y ve «La caja ya está abierta» (RF-002-03).
6. **Alguien manda por API una diferencia inventada, un contado negativo o un saldo inventado:** la diferencia se descarta, y el negativo y el saldo se rechazan, también si viene del dueño (RF-002-05, RF-002-06).
7. **Se paga un gasto o se retira efectivo del cajón:** nada de eso descuenta de `saldo_actual`, así que aparece como «Faltante». Es un límite conocido de este alcance (ver «Movimientos manuales» en las mejoras futuras).
8. **Se cancela una venta en efectivo antes de cerrar:** `cancelar_venta` ya baja `saldo_actual` y el esperado queda bien (RF-002-04).
9. **Turno con solo transferencias:** el esperado es el fondo inicial, porque las transferencias no entran al cajón (RF-002-04).
10. **Se corta internet al cerrar:** la caja sigue abierta, el modal conserva lo escrito y se muestra «No se pudo cerrar la caja». No se muestra «La caja ya fue cerrada» y «Cobrar» no se bloquea. Si no hay internet al abrir el modal de cierre, en lugar del esperado se muestra «No se pudo leer el efectivo esperado. Revisá la conexión.», nunca $0 ni un saldo viejo (RF-002-04).
11. **Se escribe un contado inválido (`abc`, `1e`):** aunque el campo `type="number"` entregue vacío, no cuenta como «sin contado». La caja no se cierra y se muestra «Ingresá un monto de 0 o más» (RF-002-02).

## Fuera de alcance

- **Vender, cobrar y cancelar ventas:** no cambian (spec 001 y RF13).
- **Cambiar quién puede abrir o cerrar:** los dos roles siguen como hoy.
- **Abrir más de una caja a la vez:** el sistema usa una sola fila de `cajas`.

### Mejoras futuras

| Mejora | Motivo |
|---|---|
| Movimientos manuales (ingresos, retiros y gastos pagados del cajón) | Pide pantalla, permisos y reglas de saldo propios; no entra en pocas horas. Mientras tanto se ven como «Faltante» (caso límite 7). |
| Historial de cajas | Hoy cada apertura reutiliza la misma fila y borra el arqueo anterior. Guardar cada turno cambia el modelo de datos. Hasta entonces, la protección de RF-002-07 vale mientras la caja sigue cerrada: reabrirla borra el arqueo y, por API, sin dejar auditoría. Las notas, `usuario_id` y `fecha_apertura` de una caja cerrada tampoco quedan protegidos. |
| Reportes de arqueo | Dependen del historial: sin él solo existe el último cierre. |
| Arqueo ciego para `empleado` | Ver el esperado permite escribir justo ese monto y esconder un faltante. Para resolverlo hay que ocultar `saldo_actual` en la tarjeta, el POS, los movimientos y la API (RLS): decisión del autor, no entra en pocas horas. |
| Contado obligatorio al cerrar | Hoy se puede cerrar sin contar y evitar el arqueo. Decisión del autor: se mantiene opcional. |
| Función atómica `cerrar_caja` | Hoy el movimiento de cierre y la auditoría van después del `update`: si fallan, la caja queda cerrada igual. Lo mismo pasa si se corta justo antes de la respuesta: se ve «No se pudo cerrar la caja», al reintentar «La caja ya fue cerrada», y quedan sin resumen, movimiento ni auditoría. El arqueo queda bien guardado en `cajas`. El trigger alcanza para proteger la diferencia y es un cambio más chico. |
| Unificar el código de caja de `app.js` y `pos.js` | Sacar el duplicado es un cambio mayor; acá solo comparten `caja-logica.js`. |
| Conteo por billetes y monedas | Comodidad que no cambia el cálculo. |
| Corrección del arqueo por el dueño, con auditoría | Un error de tipeo (`1.450` queda como 1,45) da un «Faltante» que RF-002-07 no deja corregir. Pide una regla y una pantalla nuevas. La vista previa de RF-002-04 permite verlo antes de cerrar. |
| Rechazar `NaN` y montos que no entran en `numeric(12,2)` | Desde la interfaz no se llega a `NaN`: requiere una sesión válida y usar la API a mano. Un monto demasiado grande da el error genérico. |

## Dependencias

- **Migración en la base de Pointer (`ebsiqjiioqzpzdsonkit`).** RF-002-03 y RF-002-05 a RF-002-07 amplían `cajas_guard`. El autor revisa el SQL y lo ejecuta en el panel; se actualizan también `base-de-datos/00-estructura.sql` y `documentacion/05-DATOS.md`, que hoy dice que `cajas_guard` frena solo al empleado. La base «Kiosco Web» y el sitio `pointer-web001` son de un cliente y no se tocan.
- **Publicación en `pointer-demo`:** a mano, como en la spec 001, con `CACHE_VERSION` actualizada.
- **`tests/sql/` (carpeta nueva):** en el panel, `current_user` es `postgres` y `cajas_guard` no aplica sus reglas. Por eso, cada prueba cambia a `authenticated` (`SET LOCAL ROLE`) y carga en `request.jwt.claims` el `sub` de un usuario activo de cada rol, dentro de una transacción con `ROLLBACK` y sin claves. Los ids se buscan con una consulta y no se escriben en el repositorio. El autor comprobó el 2026-11-02 que la base de Pointer tiene un `dueno` y un `empleado` activos.

## Criterios de finalización

- [x] Cada RF tiene al menos un test automático, un test en `tests/sql/` o una prueba manual descrita en `verificacion.md`.
- [x] `npm test` termina en verde, con los tests de `caja-logica.js` en `tests/`.
- [x] `tests/sql/` comprueba, con `ROLLBACK` y en la base de Pointer, que una diferencia inventada se descarta, que un negativo y un saldo inventado se rechazan con los dos roles y que una caja cerrada no cambia su arqueo ni sus saldos.
- [x] `tests/sql/` comprueba, con `ROLLBACK` y con el `cajas_guard` nuevo, que `crear_venta` y `cancelar_venta` funcionan con la caja abierta y que el `UPDATE cajas` de `90-reinicio-total.sql` sigue pasando.
- [x] En `pointer-demo`: abrir con $1.000, vender $500 en efectivo y $300 por transferencia, y cerrar con $1.450 contados. El resumen muestra esperado $1.500,00, contado $1.450,00 y «Faltante» de $50,00, y `cajas.diferencia` vale −50.
- [x] Lo mismo se comprueba abriendo y cerrando desde la sección Caja y desde el punto de venta.
- [x] Cerrar con el contado vacío muestra el esperado y «Cerrada sin arqueo», y deja `diferencia` en `null`.
- [x] En Chrome, escribir `1e` en el contado no cierra la caja y muestra «Ingresá un monto de 0 o más», desde la sección Caja y desde el punto de venta.
- [x] Abrir desde una segunda pantalla sin actualizar, con la caja ya abierta, no cambia el saldo.
- [x] Ninguna política de RLS cambió.
- [x] Los mensajes aparecen en voseo, con tildes y tal cual están escritos acá.
- [x] `caja-logica.js` está cargado en `dashboard.html`, `pos.html` y `sw.js`, y `CACHE_VERSION` subió.

## RF del kit relacionados

| RF del kit (`02-REQUERIMIENTOS.md`) | RF de esta spec |
|---|---|
| RF03 · Abrir y cerrar la caja con saldo inicial y notas | RF-002-01 a RF-002-08 (las notas no cambian) |
| RF02 · Roles `dueno` y `empleado` | RF-002-06, RF-002-07 |
| RF15 · Auditoría de las acciones importantes | No cambia; usa la diferencia de RF-002-05 |

## Diferencias con el código actual

Lo que hoy no cumple la spec (sirve de entrada para `/planificar`):

- `app.js` y `pos.js` calculan la diferencia y la mandan en el `update`; `cajas_guard` no la controla (RF-002-05).
- Un monto inicial vacío se toma como 0 por `parseFloat(x) || 0` (RF-002-02).
- Un contado inválido llega vacío y la caja se cierra sin arqueo: el código no mira `validity.badInput` (RF-002-02).
- Antes del `update` de cierre hay una lectura que, sin internet, se toma como caja cerrada (`app.js:777`, `pos.js:1152`). Se saca: RF-002-07 ya frena dos cierres a la vez (caso límite 10).
- Sin internet, el modal de cierre muestra un esperado de $0 en el POS (`pos.js:1085`) y un saldo viejo en la sección Caja (`app.js:661`) (RF-002-04).
- `cajas_guard` no controla al dueño: acepta un monto negativo, una reapertura que pisa el saldo y cualquier cambio de saldo por API (RF-002-01, RF-002-03, RF-002-05, RF-002-06).
- `cajas_guard` deja cambiar `saldo_contado` y `diferencia` con la caja cerrada (RF-002-07).
- El resultado solo se ve en un aviso temporal, sin esperado ni contado (RF-002-08).
- Los dos archivos reemplazan el error de la base por un texto fijo: hay que mostrar «La caja ya está abierta» y «La caja ya fue cerrada» (RF-002-03, RF-002-07).
- Tocar afuera del modal o la X lo cierra (`config.js:331`, `pos.js:1075`): en el resumen, solo «Listo» lo cierra (RF-002-08).
- «Abrir caja» no se deshabilita mientras se procesa: con doble clic, el segundo pedido daría error después de abrir bien (RF-002-03).
- Tras un rechazo de RF-002-03 o RF-002-07, la pantalla queda desactualizada y en el POS «Cobrar» sigue bloqueado: hay que volver a leer el estado de la caja.
