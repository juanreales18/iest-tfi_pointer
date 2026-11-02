# Spec 002 · Caja y arqueo

> **Estado:** aprobada por el autor; falta `/clarificar` · **Fecha:** 2026-11-02
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
| RF-002-05 | Cuando una caja pase a `cerrada`, la base deberá guardar en `diferencia` el resultado de `saldo_contado − saldo_actual`, o `null` si no hay contado, descartando el valor que mande el navegador. | Evento | Alta |
| RF-002-08 | Cuando la caja quede cerrada, el sistema deberá mostrar en el modal, hasta que el usuario toque «Listo», el esperado, el contado y la diferencia guardados en la base con «Sobrante», «Faltante» o «Sin diferencia», o «Cerrada sin arqueo» si no hubo contado. | Evento | Alta |

### Protección en la base

| ID | Requisito (EARS) | Patrón | Prioridad |
|---|---|---|---|
| RF-002-06 | Si un `update` de `cajas` intenta guardar un `saldo_inicial` o un `saldo_contado` negativo, entonces `cajas_guard` deberá rechazarlo para cualquier rol. | No deseado | Alta |
| RF-002-07 | Si una caja que sigue `cerrada` recibe un cambio de `saldo_contado`, `diferencia` o `fecha_cierre`, entonces el sistema deberá rechazarlo para cualquier rol y mostrar «La caja ya fue cerrada». | No deseado | Alta |

> El contado es **opcional**: vacío no es un error y la caja se cierra sin arqueo (decisión del autor). `0` sí es un contado.
> El esperado sale de `cajas.saldo_actual` y no de `movimientos_caja`, porque un `empleado` solo ve por RLS sus propios movimientos.
> Los movimientos de `apertura` y `cierre`, las notas y la auditoría siguen como hoy; la auditoría y el resumen usan la diferencia que devuelve la base. No cambia ninguna política de RLS.
> Las validaciones de monto, la vista previa y la elección de «Sobrante», «Faltante» o «Sin diferencia» van en un archivo de lógica pura sin DOM (`sistema/js/caja-logica.js`), con el patrón de `pos-logica.js` y tests en `tests/`. La vista previa solo informa: el dato que vale es el de la base (P3).

## Casos límite

1. **Se contó $0:** es un contado válido y la diferencia es todo lo esperado, en negativo (RF-002-05).
2. **Contado vacío:** la caja se cierra, `saldo_contado` y `diferencia` quedan en `null` y el resumen dice «Cerrada sin arqueo» (RF-002-05, RF-002-08).
3. **Entra una venta en efectivo con el modal de cierre abierto:** la base calcula con el saldo del momento del cierre, así que el resumen puede diferir de la vista previa. Vale el resumen (RF-002-05, RF-002-08).
4. **Dos PC cierran la misma caja:** la segunda no cambia nada y ve «La caja ya fue cerrada» (RF-002-07).
5. **El dueño abre desde una pantalla sin actualizar con la caja ya abierta:** hoy el trigger no lo frena y pisaría el saldo. Con esta spec no cambia y ve «La caja ya está abierta» (RF-002-03).
6. **Alguien manda por API una diferencia inventada o un contado negativo:** la diferencia se descarta y el negativo se rechaza (RF-002-05, RF-002-06).
7. **Se paga un gasto o se retira efectivo del cajón:** nada de eso descuenta de `saldo_actual`, así que aparece como «Faltante». Es un límite conocido de este alcance (ver «Movimientos manuales» en las mejoras futuras).
8. **Se cancela una venta en efectivo antes de cerrar:** `cancelar_venta` ya baja `saldo_actual` y el esperado queda bien (RF-002-04).
9. **Turno con solo transferencias:** el esperado es el fondo inicial, porque las transferencias no entran al cajón (RF-002-04).
10. **Se corta internet al cerrar:** la caja sigue abierta, el modal conserva lo escrito y se muestra «No se pudo cerrar la caja», como hoy.

## Fuera de alcance

- **Vender, cobrar y cancelar ventas:** no cambian (spec 001 y RF13).
- **Cambiar quién puede abrir o cerrar:** los dos roles siguen como hoy.
- **Abrir más de una caja a la vez:** el sistema usa una sola fila de `cajas`.

### Mejoras futuras

| Mejora | Motivo |
|---|---|
| Movimientos manuales (ingresos, retiros y gastos pagados del cajón) | Pide pantalla, permisos y reglas de saldo propios; no entra en pocas horas. Mientras tanto se ven como «Faltante» (caso límite 7). |
| Historial de cajas | Hoy cada apertura reutiliza la misma fila y borra el arqueo anterior. Guardar cada turno cambia el modelo de datos. |
| Reportes de arqueo | Dependen del historial: sin él solo existe el último cierre. |
| Arqueo ciego para `empleado` | Ver el esperado permite escribir justo ese monto y esconder un faltante. Para resolverlo hay que ocultar `saldo_actual` en la tarjeta, el POS, los movimientos y la API (RLS): decisión del autor, no entra en pocas horas. |
| Contado obligatorio al cerrar | Hoy se puede cerrar sin contar y evitar el arqueo. Decisión del autor: se mantiene opcional. |
| Función atómica `cerrar_caja` | Hoy el movimiento de cierre y la auditoría van después del `update`: si fallan, la caja queda cerrada igual. El trigger alcanza para proteger la diferencia y es un cambio más chico. |
| Unificar el código de caja de `app.js` y `pos.js` | Sacar el duplicado es un cambio mayor; acá solo comparten `caja-logica.js`. |
| Conteo por billetes y monedas | Comodidad que no cambia el cálculo. |

## Dependencias

- **Migración en la base de Pointer (`ebsiqjiioqzpzdsonkit`).** RF-002-03 y RF-002-05 a RF-002-07 amplían `cajas_guard`. El autor revisa el SQL y lo ejecuta en el panel; se actualiza también `base-de-datos/00-estructura.sql`. La base «Kiosco Web» y el sitio `pointer-web001` son de un cliente y no se tocan.
- **Publicación en `pointer-demo`:** a mano, como en la spec 001, con `CACHE_VERSION` actualizada.

## Criterios de finalización

- [ ] Cada RF tiene al menos un test automático, un test en `tests/sql/` o una prueba manual descrita en `verificacion.md`.
- [ ] `npm test` termina en verde, con los tests de `caja-logica.js` en `tests/`.
- [ ] `tests/sql/` comprueba, con `ROLLBACK` y en la base de Pointer, que una diferencia inventada se descarta, que un negativo se rechaza con los dos roles y que una caja cerrada no cambia su arqueo.
- [ ] En `pointer-demo`: abrir con $1.000, vender $500 en efectivo y $300 por transferencia, y cerrar con $1.450 contados. El resumen muestra esperado $1.500, contado $1.450 y «Faltante» de $50, y `cajas.diferencia` vale −50.
- [ ] Lo mismo se comprueba abriendo y cerrando desde la sección Caja y desde el punto de venta.
- [ ] Cerrar con el contado vacío muestra «Cerrada sin arqueo» y deja `diferencia` en `null`.
- [ ] Abrir desde una segunda pantalla sin actualizar, con la caja ya abierta, no cambia el saldo.
- [ ] Ninguna política de RLS cambió.
- [ ] Los mensajes aparecen en voseo, con tildes y tal cual están escritos acá.
- [ ] `caja-logica.js` está cargado en `sw.js` y `CACHE_VERSION` subió.

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
- `cajas_guard` no controla al dueño: acepta un monto negativo y una reapertura que pisa el saldo (RF-002-03, RF-002-06).
- `cajas_guard` deja cambiar `saldo_contado` y `diferencia` con la caja cerrada (RF-002-07).
- El resultado solo se ve en un aviso temporal, sin esperado ni contado (RF-002-08).
