# memory.md · Memoria del proyecto Pointer

> Lo que el agente tiene que recordar entre conversaciones. Se actualiza al terminar cada tarea, en el mismo commit. Frases cortas; lo viejo que ya no sirve se borra.

## Estado actual

- **Fase del TFI:** Actividad 1 (constitución y arnés) terminada en el repositorio. Sigue la Actividad 2.
- **Actividad 2:** `specs/001-punto-de-venta/spec.md` aprobada y clarificada; el 2026-11-01 se redujo por `/cambio` al **núcleo del cobro: 15 RF activos** (03, 04, 05, 06, 07, 09, 10, 11, 12, 14, 16, 19, 24, 26, 42); los otros 30 están en «Mejoras futuras» con su motivo. `plan.md` y `tasks.md` reorganizados: 15 tareas, test y código juntos. La base no cambia en esta spec. T01 a T12 hechas (`sistema/js/pos-logica.js` con `MENSAJES`, `clasificarEntrada`, `buscarPorCodigo`, `filtrarCatalogo`, `validarAgregado`, `validarCantidad`, `calcularTotales`, `puedeCobrar` y `mensajeDeError`, ya cargado en `pos.html` y `sw.js`; único `todo`: `precio_costo` en `tests/punto-de-venta.test.js`, se cierra en T13). T11 y T12 se adelantaron a T08-T10 a pedido del autor; `pos.js` ya usa `PosLogica` en el lector, la búsqueda y el carrito. `calcularTotales` devuelve centavos: `pos.js` todavía no la usa y en T13 tiene que dividir por 100 antes de mostrar o de comparar con el monto recibido. `puedeCobrar` solo mira el carrito: `pos.js` todavía no la usa y en T13 tiene que seguir controlando la caja cerrada por su cuenta y dejar de deshabilitar «Cobrar» por falta de método (D8). `mensajeDeError` necesita el `code` del error: en T13, `pos.js` tiene que pasarle `ventaError` entero y sacar el `throw new Error(ventaError.message)`, porque si no un producto con «network» en el nombre se lee como corte de red. Sigue la T13. Falta la prueba manual de T11 y T12 en local con un navegador real: consola sin errores, escaneo, código inexistente, «cafe» y stock superado (solo se probó en jsdom). Rama: `feature/punto-de-venta`.
- **Sistema:** en producción en Netlify (https://pointer-web001.netlify.app/) con Supabase como base de datos.
- **Funcionando:** login y roles, punto de venta con lector, caja con arqueo, cancelar venta, productos, categorías, clientes con historial, proveedores, compras, gastos, reportes (con descuentos), usuarios por Edge Function, auditoría.
- **Pendientes de seguridad:** ejecutar `base-de-datos/10-ocultar-costos.sql` en la base de producción; desactivar el registro público y activar la protección de contraseñas filtradas en Supabase Auth.

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
| 2026-11 | Cómo se publica en Netlify (T14) se decide al llegar a esa tarea | Pedido del autor |
| 2026-11 | En la spec 001, `CACHE_VERSION` se sube una sola vez, en T14, antes de publicar | Subirla en cada tarea no sirve si no se publica; al final queda todo en orden |
| 2026-11 | El buscador del POS ignora mayúsculas, tildes, ñ y diéresis y los espacios de los bordes; vacío muestra todos los activos (RF-001-06, que ahora incluye a 46 y 47) | Decisión del autor en T05 (`/cambio`). El lector (`buscarPorCodigo`) sigue comparando exacto |
| 2026-11 | Una tarjeta con stock 0 sigue sin recibir clics ni avisar: muestra «Sin stock». «Stock disponible: 0» sale solo por lector | Decisión del autor en T12. El caso límite 3 habla del lector; avisar en la lista pediría cambiar `pos.css` con `/cambio` |
| 2026-11 | `puedeCobrar` solo mira el carrito; el control de caja cerrada se mantiene en `pos.js` y se confirma en T13 | Decisión del autor en T09: sigue el plan (RF-001-12) |
| 2026-11 | `mensajeDeError` también toma como sin conexión un pedido que no llegó (sin `code` y con texto de red), aunque `enLinea` sea `true`; sin texto devuelve «No se pudo procesar la venta» | T10: `navigator.onLine` no alcanza para detectar un corte, y `pos.js` ya hacía las dos cosas |

## Lecciones (errores que no hay que repetir)

- Al escribir una función SQL con `FOR UPDATE`, no usar `GROUP BY` en la misma consulta: Postgres no lo permite.
- En compras, si un producto aparece en dos líneas, hay que **sumarlas** antes de actualizar el stock (`UPDATE ... FROM` aplica una sola).
- `parseFloat(x) || 20` convierte un 0 válido en 20: usar `Number.isFinite` cuando el 0 es un valor posible.
- Un `update` bloqueado por RLS **no devuelve error**: agregar `.select('id')` y comprobar que volvió una fila.
- La hoja de estilos general oculta los modales al imprimir: el ticket se imprime desde un área propia fuera del modal.
- Antes de publicar cambios de `sistema/`, subir `CACHE_VERSION` en `sistema/sw.js` o los navegadores siguen con la versión vieja.

## Datos útiles (sin secretos)

- Proyecto Supabase: "Kiosco Web" (las claves están en el panel, nunca acá).
- Publicación: Netlify, carpeta `sistema/`.
- La estructura completa de la base está en `base-de-datos/00-estructura.sql`.
