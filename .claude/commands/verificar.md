---
description: Verifica una funcionalidad contra su spec y escribe verificacion.md
argument-hint: carpeta de la spec
---

Verificá la funcionalidad de `$ARGUMENTS` siguiendo **`.claude/skills/verificar-criterios/SKILL.md`** paso a paso (leelo completo antes de empezar).

Al terminar, `$ARGUMENTS/verificacion.md` tiene que tener:

- Resultado de `npm test` (cantidad de tests y si están en verde).
- Una fila por cada RF de la spec: **Cumple / No cumple / Prueba manual pendiente**, con la evidencia (test, archivo y línea, o captura a tomar).
- Para cada «No cumple»: si la falla es **del código** o **de la spec**.
- La lista de criterios de finalización con su casilla marcada o no.

No corrijas nada durante la verificación: solo informá. Las correcciones son tareas nuevas.
