---
description: Escribe el plan técnico (sin código) de una spec aprobada
argument-hint: carpeta de la spec
---

Escribí `$ARGUMENTS/plan.md` a partir de `spec.md` y `clarificacion.md` (que tienen que estar aprobadas).

- Leé `documentacion/CONSTITUCION.md`, `documentacion/04-ARQUITECTURA.md`, `documentacion/05-DATOS.md` y `documentacion/10-SEGURIDAD.md`.
- Para **cada RF** explicá: qué archivo se toca (`sistema/…`, `base-de-datos/…`, `tests/…`), qué cambia en la base (tablas, funciones, RLS), y cómo se va a probar.
- Incluí una tabla **RF → archivos → test**.
- Señalá qué principio de la constitución aplica a cada decisión.
- **Sin código.** Solo nombres de funciones, archivos y pasos.
- Mostrá el plan y esperá aprobación.
