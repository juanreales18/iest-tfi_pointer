---
description: Divide un plan aprobado en tareas chicas en tasks.md
argument-hint: carpeta de la spec
---

A partir de `$ARGUMENTS/plan.md`, escribí `$ARGUMENTS/tasks.md`:

- Tareas numeradas `T01`, `T02`… de **menos de 30 minutos** cada una.
- Cada tarea tiene: el RF que cubre, los archivos que toca y una línea **«Listo cuando: …»** comprobable.
- El orden respeta «tests primero»: la tarea del test va antes que la del código.
- Cada tarea termina en **un commit** con el mensaje ya propuesto (formato de `documentacion/07-CONVENCIONES.md`).
- Formato de casilla: `- [ ] T01 · …` para poder marcarlas al terminar.
- Mostrá la lista y esperá aprobación antes de empezar la T01.
