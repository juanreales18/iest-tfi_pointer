---
description: Revisa una spec como QA y registra hallazgos y decisiones en clarificacion.md
argument-hint: carpeta de la spec, por ejemplo specs/001-punto-de-venta
---

Revisá la spec de `$ARGUMENTS/spec.md` **como si fueras QA buscando problemas**, no como su autor.

1. Leé `docs/CONSTITUCION.md` y la spec completa.
2. Buscá y numerá los hallazgos (`H-01`, `H-02`…) de estos tipos:
   - Requisitos ambiguos o que no se pueden probar.
   - Requisitos que no siguen EARS (usá `.agents/skills/escribir-ears/SKILL.md`).
   - Casos límite que faltan (datos vacíos, sin conexión, permisos, doble clic, montos 0).
   - Contradicciones con la constitución, con `05-DATOS.md` o con otra spec.
   - Riesgos de seguridad o de datos personales.
3. Escribí `$ARGUMENTS/clarificacion.md` con una tabla: **Hallazgo · Por qué importa · Propuesta · Decisión del autor**. La columna «Decisión del autor» queda **vacía**.
4. Hacé las preguntas al autor de a una. Cuando responda, completá la decisión y, si corresponde, actualizá `spec.md`.
5. No escribas código.
