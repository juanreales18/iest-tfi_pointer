---
description: Escribe la spec de una funcionalidad nueva en specs/NNN-nombre/spec.md
argument-hint: nombre-de-la-funcionalidad y una descripción corta
---

Vas a escribir la **spec** de la funcionalidad: $ARGUMENTS

1. Leé `docs/CONSTITUCION.md`, `memory.md`, `docs/02-REQUERIMIENTOS.md` y `docs/08-TAREAS.md`.
2. Buscá el número siguiente en `specs/` y creá la carpeta `specs/NNN-nombre/` (tres dígitos, minúsculas, sin tildes).
3. **Entrevistá al autor antes de escribir:** hacé de 3 a 6 preguntas cortas sobre quién usa la funcionalidad, qué pasa en los casos raros y qué queda afuera. No inventes respuestas.
4. Con las respuestas, escribí `spec.md` con estas secciones:
   - **Contexto** (por qué existe, 3 a 5 líneas).
   - **Historias de usuario** («Como … quiero … para …»).
   - **Requisitos** en notación EARS, numerados `RF-NNN-01`, `RF-NNN-02`… con prioridad Alta, Media o Baja. Leé `.agents/skills/escribir-ears/SKILL.md` y seguí sus patrones.
   - **Casos límite** (al menos 4).
   - **Fuera de alcance**.
   - **Criterios de finalización** (casillas comprobables).
   - **RF del kit relacionados** (por ejemplo RF04 de `02-REQUERIMIENTOS.md`).
5. No escribas código. Mostrá la spec completa y esperá que el autor la apruebe o la corrija.
