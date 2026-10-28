---
description: Escribe el plan técnico (sin código) de una spec aprobada
argument-hint: carpeta de la spec
---

Escribí `$ARGUMENTS/plan.md` a partir de `spec.md` y `clarificacion.md` (que tienen que estar aprobadas).

- Leé `docs/CONSTITUCION.md`, `docs/04-ARQUITECTURA.md`, `docs/05-DATOS.md` y `docs/10-SEGURIDAD.md`.
- Para **cada RF** explicá: qué archivo se toca (`src/…`, `supabase/…`, `tests/…`), qué cambia en la base (tablas, funciones, RLS), y cómo se va a probar.
- Incluí una tabla **RF → archivos → test**.
- Señalá qué principio de la constitución aplica a cada decisión.
- **Sin código.** Solo nombres de funciones, archivos y pasos.
- Mostrá el plan y esperá aprobación.
