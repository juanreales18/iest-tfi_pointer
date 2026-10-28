---
description: Incorpora un requisito nuevo o un cambio: primero la spec, después el código
argument-hint: carpeta de la spec y descripción del cambio
---

Cambio pedido: $ARGUMENTS

1. Identificá a qué spec afecta. Si no existe ninguna, proponé crear una con `/spec`.
2. **Primero la spec:** agregá o modificá el RF en `spec.md` (en EARS) y anotá el cambio al final, en una sección **«Historial de cambios»** con fecha y motivo.
3. Actualizá `plan.md` y agregá las tareas nuevas en `tasks.md`.
4. Hacé un commit solo con la spec: `actualiza la spec NNN: …`.
5. Recién después implementá la tarea (test primero) y hacé su propio commit.
6. Anotá en `memory.md` la decisión si cambia algo que antes estaba decidido.
