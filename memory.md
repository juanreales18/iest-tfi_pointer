# memory.md · Memoria del proyecto Pointer

> Lo que el agente tiene que recordar entre conversaciones. Se actualiza al terminar cada tarea, en el mismo commit. Frases cortas; lo viejo que ya no sirve se borra.

## Estado actual

- **Fase del TFI:** Actividad 1 (constitución y arnés) terminada en el repositorio. Sigue la Actividad 2.
- **Actividad 2:** `specs/001-punto-de-venta/spec.md` aprobada y clarificada; el 2026-11-01 se redujo por `/cambio` al **núcleo del cobro: 15 RF activos** (03, 04, 05, 06, 07, 09, 10, 11, 12, 14, 16, 19, 24, 26, 42); los otros 30 están en «Mejoras futuras» con su motivo. `plan.md` y `tasks.md` reorganizados: 15 tareas, test y código juntos. La base no cambia en esta spec. T01 a T15 hechas: `sistema/js/pos-logica.js` está cargado en `pos.html` y `sw.js`, y `pos.js` lo usa en el lector, la búsqueda, el carrito, el total, «Cobrar» y los errores; ya no hay `precio_costo` en `pos.js` ni ningún `todo` en los tests. T11 a T13 se probaron en Chrome real con Supabase simulado en local (sin credenciales y sin tocar producción): en T15 el autor repitió las pruebas en `pointer-demo` con la base real y lector físico. Comprobado en Chrome: el error de red llega como `TypeError: Failed to fetch` con `code` vacío (red cortada, servidor caído y DNS). Con «Efectivo» activo queda elegido al abrir y no se puede desmarcar: el mensaje sin método solo aparece si no hay «Efectivo». La T14 quedó publicada a mano en `pointer-demo` (`CACHE_VERSION` 2026-11-02T15-45-00); pedir `precio_costo` a la API da 403. La verificación da 15 de 15 RF y 9 de 9 criterios (`verificacion.md`). Spec 001 cerrada por el autor el 2026-11-02 y fusionada a `main`.
- **Spec 002 (caja y arqueo):** `specs/002-caja-arqueo/spec.md` aprobada y clarificada por el autor el 2026-11-02, con 8 RF y 12 hallazgos respondidos (`clarificacion.md`). `plan.md` y `tasks.md` (27 tareas) aprobados el 2026-11-02. T01 hecha: el 2026-11-02, `cajas_guard` en la base de Pointer dio igual a la sección 7.7 de `00-estructura.sql`, salvo los finales de línea (CRLF en el cuerpo de la función). No se compararon el trigger ni las otras funciones: eso lo prueba `tests/sql/` en T12. T02 a T08 hechas: `sistema/js/caja-logica.js` tiene `MENSAJES` y las 6 funciones del plan, y todavía no se carga en ninguna pantalla (T15). T09 a T11 hechas: `tests/sql/caja-guard.sql` tiene el armazón y las pruebas de apertura, cierre, ventas y reinicio. T12 hecha: el 2026-11-02 el autor corrió el script en la base de Pointer con el guard viejo y dio 15 pasan y 32 fallan, igual que en PGlite. El panel muestra el informe completo; ventas, cancelación y reinicio pasan, las reglas nuevas fallan como se esperaba, y la caja quedó igual antes y después. T13 hecha: `base-de-datos/20-caja-arqueo.sql` tiene el guard de 9 pasos y `caja-guard.sql` suma 7 corridas para los pasos 3, 8 y 9, que no tenían prueba; en PGlite dan 54 pasan y 0 fallan. T14 hecha: el 2026-11-03 el autor ejecutó la migración en la base de Pointer y las pruebas dieron 54 pasan y 0 fallan; la caja quedó igual antes y después. El guard nuevo ya está activo en la base y las pantallas nuevas todavía no están publicadas (T26). T15 hecha: `caja-logica.js` ya se carga en `dashboard.html` y `pos.html`, y está en `sw.js`; `CACHE_VERSION` sigue igual hasta la T26. T16 hecha: `fijarModal` en `config.js`. T17 hecha: la apertura de la sección Caja valida el monto y muestra los rechazos de la base. Sigue la T18. Todavía no se cambiaron pantallas ni base.
- **Sistema:** publicado en Netlify (https://pointer-demo.netlify.app/) con Supabase como base de datos. El sitio `pointer-web001` y la base «Kiosco Web» son de un cliente: no se tocan.
- **Funcionando:** login y roles, punto de venta con lector, caja con arqueo, cancelar venta, productos, categorías, clientes con historial, proveedores, compras, gastos, reportes (con descuentos), usuarios por Edge Function, auditoría.
- **Pendientes de seguridad:** desactivar el registro público y activar la protección de contraseñas filtradas en Supabase Auth.

## Decisiones tomadas (no volver a discutir)

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10 | Stack sin framework (no Next.js) | El sistema ya funciona y la seguridad vive en la base. Ver `documentacion/03-TECNOLOGIAS.md` |
| 2026-10 | La caja cuenta **solo el efectivo** | Las transferencias no entran al cajón; el "vendido del turno" se muestra aparte |
| 2026-10 | Las ventas se crean solo con `crear_venta` | Atómica, con precios de la base y clave anti-duplicados (`idempotency_key`) |
| 2026-10 | Una venta solo se cancela con la caja de su turno abierta | Si la caja se cerró, el efectivo ya se contó en el arqueo |
| 2026-10 | Mercado Pago QR desactivado | Se usa Transferencia |
| 2026-10 | El IVA se suma encima del precio; por defecto 0 | Los kioscos cargan precios con IVA incluido |
| 2026-10 | Licencia: 3 días de gracia si el panel no responde | Antes fallaba abierta |
| 2026-10 | Nombre del emprendimiento: **Pointer** (antes Re-Kiosco) | Presentado así en la expo de carreras del IEST |
| 2026-10 | Estructura simple del repositorio: `documentacion/`, `specs/`, `sistema/`, `base-de-datos/`, `multimedia/`, `tests/` y `.claude/` | La estructura del PDF era un ejemplo; esta es más fácil de recorrer y explicar |
| 2026-10 | El comando del plan se llama `/planificar` | `/plan` ya existe en Claude Code (activa el modo plan) |
| 2026-11 | La lógica del POS que decide va en `sistema/js/pos-logica.js` (funciones puras) | `pos.js` vive dentro de `DOMContentLoaded` y no se puede probar con `node --test` |
| 2026-11 | Los RF que resuelve la base se prueban con `tests/sql/`, que corre el autor en el panel con `ROLLBACK` | Un test automático contra la base necesitaría claves (P5). En la spec 001 quedó para las mejoras futuras |
| 2026-11 | La clave anti-duplicados depende solo de productos, cantidades y método de pago | RF-001-25 / H-01. Pasó a mejoras futuras de la spec 001; se aplica cuando vuelva |
| 2026-11 | «Cobrar» no se deshabilita por falta de método de pago | Así se ve el mensaje de RF-001-16 |
| 2026-11 | Spec 001 reducida al núcleo del cobro (15 RF); sin cambios en la base | Pedido del autor (`/cambio`): cerrar primero un núcleo chico y comprobable |
| 2026-11 | Cada tarea trae su test y su código juntos (test primero, commit en verde); ya no se separan con `{ todo: true }` | Pedido del autor al reorganizar `tasks.md`. Reemplaza la regla anterior de los `todo` |
| 2026-11 | La T14 se publica a mano: se sube `sistema/` al sitio `pointer-demo` | Decisión del autor al llegar a esa tarea |
| 2026-11 | En la spec 001, `CACHE_VERSION` se sube una sola vez, en T14, antes de publicar | Subirla en cada tarea no sirve si no se publica; al final queda todo en orden |
| 2026-11 | El buscador del POS ignora mayúsculas, tildes, ñ y diéresis y los espacios de los bordes; vacío muestra todos los activos (RF-001-06, que ahora incluye a 46 y 47) | Decisión del autor en T05 (`/cambio`). El lector (`buscarPorCodigo`) sigue comparando exacto |
| 2026-11 | Una tarjeta con stock 0 sigue sin recibir clics ni avisar: muestra «Sin stock». «Stock disponible: 0» sale solo por lector | Decisión del autor en T12. El caso límite 3 habla del lector; avisar en la lista pediría cambiar `pos.css` con `/cambio` |
| 2026-11 | `puedeCobrar` solo mira el carrito; el control de caja cerrada se mantiene en `pos.js` y se confirma en T13 | Decisión del autor en T09: sigue el plan (RF-001-12) |
| 2026-11 | `mensajeDeError` también toma como sin conexión un pedido que no llegó (sin `code` y con texto de red), aunque `enLinea` sea `true`; sin texto devuelve «No se pudo procesar la venta» | T10: `navigator.onLine` no alcanza para detectar un corte, y `pos.js` ya hacía las dos cosas |
| 2026-11 | El sitio de Pointer es `pointer-demo` y su base, `ebsiqjiioqzpzdsonkit`; `10-ocultar-costos.sql` no se ejecuta porque esa base ya oculta el costo | Lo confirmó el autor y lo comprobó en el panel. `pointer-web001` y «Kiosco Web» son de un cliente |
| 2026-11 | La diferencia del arqueo la calcula la base, ampliando `cajas_guard`, y no el navegador; `caja-logica.js` solo valida, muestra la vista previa y elige los textos | P3. Decisión del autor en la spec 002; una función `cerrar_caja` atómica queda como mejora futura |
| 2026-11 | Spec 002: se aplica en la sección Caja y en el POS; el contado es opcional y el esperado queda visible para los dos roles | Decisión del autor. Contado obligatorio y arqueo ciego quedan como mejoras futuras |
| 2026-11 | `cajas_guard` va en este orden: salida para funciones internas, reglas de la spec 002 para todos los roles, salida del dueño. Sigue sin ser `SECURITY DEFINER` | H-01: si no, se rompen `crear_venta`, `cancelar_venta` y `90-reinicio-total.sql` |
| 2026-11 | Por API, para los dos roles, los saldos de `cajas` cambian solo al abrir una caja cerrada; la diferencia usa el saldo anterior al `update` | H-02: si no, el dueño puede inventar el esperado. El panel no pasa por esta regla |
| 2026-11 | `tests/sql/` simula cada rol con `SET LOCAL ROLE authenticated` y `request.jwt.claims`, buscando los ids con una consulta | H-03: en el panel, `current_user` es `postgres` y el guard no aplica sus reglas |
| 2026-11 | Los montos de caja siguen en `type="number"`; la validación también recibe `validity.badInput` | H-04: un texto inválido llega vacío y cerraría la caja sin arqueo |
| 2026-11 | El cierre de caja ya no hace la lectura previa al `update`; el movimiento usa la fila devuelta | H-05: sin internet, esa lectura mostraba «La caja ya fue cerrada». RF-002-07 cubre dos cierres a la vez |
| 2026-11 | Con la caja abierta, `cajas_guard` también le rechaza al dueño los cambios de `usuario_id` y `fecha_apertura` («La caja ya está abierta») | D3 del plan 002: abrir desde una pantalla vieja con el mismo monto no cambia los saldos y RF-002-03 no lo frenaría |
| 2026-11 | Con el resumen de cierre abierto, el foco va al título y no a «Listo»; en el POS, el lector y los atajos no actúan | D5 del plan 002: el Enter del lector cerraría el resumen sin que nadie lo lea |
| 2026-11 | Si la caja ya está cerrada al abrir el modal de cierre, se avisa y el modal no se abre | D6 del plan 002: una caja cerrada conserva su saldo y se mostraría como esperado |
| 2026-11 | `tests/sql/caja-guard.sql` termina siempre en un error a propósito con los resultados, en lugar de un `ROLLBACK` escrito | D7 del plan 002: deshace todo aunque falle en el medio. Falta comprobar en el panel que el texto se ve |
| 2026-11 | Se publica primero la migración de `cajas_guard` y después el sitio | Plan 002: la pantalla nueva con el guard viejo mostraría siempre «Cerrada sin arqueo» |
| 2026-11 | La spec 002 sigue en la rama `002-caja-arqueo`, aunque `07-CONVENCIONES.md` pide `feature/nombre` | Decisión del autor: la rama ya tenía tres commits de la spec |
| 2026-11 | En la spec 002, `tests/caja.test.js` nace en T09 y cada tarea le suma lo que ya cumple | Comprobar todo de una vez dejaría `npm test` en rojo hasta T23 (P4) |

## Lecciones (errores que no hay que repetir)

- Al escribir una función SQL con `FOR UPDATE`, no usar `GROUP BY` en la misma consulta: Postgres no lo permite.
- En compras, si un producto aparece en dos líneas, hay que **sumarlas** antes de actualizar el stock (`UPDATE ... FROM` aplica una sola).
- `parseFloat(x) || 20` convierte un 0 válido en 20: usar `Number.isFinite` cuando el 0 es un valor posible.
- Un `update` bloqueado por RLS **no devuelve error**: agregar `.select('id')` y comprobar que volvió una fila.
- La hoja de estilos general oculta los modales al imprimir: el ticket se imprime desde un área propia fuera del modal.
- Antes de publicar cambios de `sistema/`, subir `CACHE_VERSION` en `sistema/sw.js` o los navegadores siguen con la versión vieja.
- Antes de consultar una base o publicar en un sitio, comprobar que sea el de Pointer (`sistema/pos.html` dice cuál es la base): en las mismas cuentas hay un sitio y una base de un cliente.

## Datos útiles (sin secretos)

- Proyecto Supabase de Pointer: `ebsiqjiioqzpzdsonkit` (las claves están en el panel, nunca acá).
- Publicación: a mano en Netlify, sitio `pointer-demo`, carpeta `sistema/`. El sitio no está conectado a GitHub: un push no publica.
- La estructura completa de la base está en `base-de-datos/00-estructura.sql`.
- Cada corrida de `tests/sql/` que prueba `crear_venta` deja un salto en la numeración de ventas: el `ROLLBACK` no devuelve la secuencia. Se acepta en `pointer-demo`.
