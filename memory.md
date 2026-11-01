# memory.md · Memoria del proyecto Pointer

> Lo que el agente tiene que recordar entre conversaciones. Se actualiza al terminar cada tarea, en el mismo commit. Frases cortas; lo viejo que ya no sirve se borra.

## Estado actual

- **Fase del TFI:** Actividad 1 (constitución y arnés) terminada en el repositorio. Sigue la Actividad 2.
- **Actividad 2:** `specs/001-punto-de-venta/spec.md` aprobada (núcleo de la venta + ticket, uso del empleado) y clarificada (17 hallazgos, RF-001-01 a RF-001-45). `plan.md` y `tasks.md` (39 tareas) aprobados (2026-11-01). Sigue la T01. Rama: `feature/punto-de-venta`.
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
| 2026-11 | Los RF que resuelve la base se prueban con `tests/sql/`, que corre el autor en el panel con `ROLLBACK` | Un test automático contra la base necesitaría claves (P5) |
| 2026-11 | La clave anti-duplicados depende solo de productos, cantidades y método de pago | RF-001-25 / H-01: no duplicar una venta si se toca otra cosa después de un corte |
| 2026-11 | «Cobrar» no se deshabilita por falta de método de pago | Así se ve el mensaje de RF-001-16 |
| 2026-11 | La tarea del test commitea sus casos con `{ todo: true }` y la tarea del código los saca | Tests primero sin dejar `npm test` en rojo (P4) |
| 2026-11 | Cómo se publica en Netlify (T37) se decide al llegar a esa tarea | Pedido del autor |

## Lecciones (errores que no hay que repetir)

- Al escribir una función SQL con `FOR UPDATE`, no usar `GROUP BY` en la misma consulta: Postgres no lo permite.
- En compras, si un producto aparece en dos líneas, hay que **sumarlas** antes de actualizar el stock (`UPDATE ... FROM` aplica una sola).
- `parseFloat(x) || 20` convierte un 0 válido en 20: usar `Number.isFinite` cuando el 0 es un valor posible.
- Un `update` bloqueado por RLS **no devuelve error**: agregar `.select('id')` y comprobar que volvió una fila.
- La hoja de estilos general oculta los modales al imprimir: el ticket se imprime desde un área propia fuera del modal.
- Después de cada cambio en `sistema/`, subir `CACHE_VERSION` en `sistema/sw.js` o los navegadores siguen con la versión vieja.

## Datos útiles (sin secretos)

- Proyecto Supabase: "Kiosco Web" (las claves están en el panel, nunca acá).
- Publicación: Netlify, carpeta `sistema/`.
- La estructura completa de la base está en `base-de-datos/00-estructura.sql`.
