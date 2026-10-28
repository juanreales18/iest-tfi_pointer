---
name: verificar-criterios
description: Verifica una funcionalidad de Pointer contra su spec y la constitución, y escribe el informe en specs/NNN/verificacion.md. Usar al cerrar una tarea o una funcionalidad, o cuando el autor pide /verificar.
---

# Skill: verificar-criterios

Comprueba, con evidencia, si lo construido cumple lo que dice la spec. **Solo informa: no corrige nada.**

## Entrada

- La carpeta de la funcionalidad: `specs/NNN-nombre/` (con `spec.md`, `plan.md` y `tasks.md`).

## Pasos

1. **Leer** `docs/CONSTITUCION.md`, `specs/NNN-nombre/spec.md` y `tasks.md`.
2. **Correr los tests:** `npm test`. Anotá cuántos pasan y cuántos fallan. Si alguno falla, copiá el nombre del test y el mensaje.
3. **Recorrer cada RF** de la spec y decidir uno de estos estados:

   | Estado | Cuándo se usa |
   |---|---|
   | ✅ Cumple | Hay un test en verde que lo comprueba, **o** el código lo implementa y se puede señalar el archivo y la línea |
   | ❌ No cumple | El comportamiento falta o es distinto al de la spec |
   | 🟡 Prueba manual pendiente | Depende de la pantalla, del lector, de la impresora o de permisos reales: se describe la prueba a hacer |

   Para cada ❌ indicá si la falla es **del código** (la spec está bien y el código no la cumple) o **de la spec** (el requisito era ambiguo, imposible o contradictorio).

4. **Revisar la constitución** sobre los archivos que cambiaron en esta funcionalidad (`git diff --name-only` desde el primer commit de la spec):
   - P2: ¿algún color escrito a mano fuera de `:root`?
   - P3: ¿alguna regla de negocio calculada solo en el navegador?
   - P5: ¿alguna clave o secreto? (si el cambio toca `src/js/` o `supabase/`, aplicá también la skill `revisar-seguridad`).
   - P7: ¿imágenes sin `alt`? ¿botones sin texto accesible?
5. **Criterios de finalización:** marcá cada casilla de la spec como cumplida o no, con una línea de evidencia.
6. **Escribir** `specs/NNN-nombre/verificacion.md` con la plantilla de abajo.
7. **Mostrar** el informe al autor. No marques la funcionalidad como terminada: eso lo decide el autor.

## Plantilla de verificacion.md

```markdown
# Verificación · NNN-nombre

Fecha: AAAA-MM-DD · Verificado por: agente (skill verificar-criterios) · Revisado por: autor

## Tests
`npm test`: N pasan, N fallan.

## Requisitos
| RF | Estado | Evidencia | Si falla: ¿código o spec? |
|---|---|---|---|
| RF-NNN-01 | ✅ Cumple | test "…" en tests/…; src/js/…:LL | — |

## Constitución
| Principio | Resultado | Detalle |
|---|---|---|

## Criterios de finalización
- [x] …

## Pruebas manuales pendientes
1. …

## Conclusión
X de Y RF cumplen. Pendientes: …
```

## Reglas

- Nunca marques ✅ sin evidencia concreta.
- No modifiques código, tests ni la spec durante la verificación.
- Si `npm test` no corre, el estado general es «No verificado» y se explica por qué.
