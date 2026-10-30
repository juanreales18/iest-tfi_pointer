# Pointer: instrucciones para el agente de IA

Sistema web de gestión para kioscos: ventas con lector de código de barras, stock, caja con arqueo, compras, gastos, clientes, reportes y auditoría.

**Stack:** HTML + CSS + JavaScript (sin framework) + Supabase (PostgreSQL, Auth, RLS) + Netlify.
**Código del sistema:** `src/` · **Base de datos:** `supabase/` · **Tests:** `tests/` (`npm test`).

## Antes de hacer cualquier cosa

1. Leé **`docs/CONSTITUCION.md`**. Sus 8 principios mandan sobre todo lo demás.
2. Leé **`memory.md`**: estado actual, decisiones tomadas y errores que no hay que repetir.
3. Leé el archivo del kit que corresponda a la tarea:

| Archivo | Para qué sirve |
|---|---|
| `docs/IDENTIDAD-MARCA.md` | Colores, tipografías, logo y tono de voz |
| `docs/01-CONTEXTO.md` | Por qué existe Pointer y para quién es |
| `docs/02-REQUERIMIENTOS.md` | Qué tiene que hacer (RF y RNF) |
| `docs/03-TECNOLOGIAS.md` | Con qué se construye y qué no se usa |
| `docs/04-ARQUITECTURA.md` | Árbol de carpetas y función de cada parte |
| `docs/05-DATOS.md` | Tablas, funciones y triggers |
| `docs/06-DISENO-UI.md` | Pantallas y cómo se aplica la marca |
| `docs/07-CONVENCIONES.md` | Nombres, idioma del código y commits |
| `docs/08-TAREAS.md` | Etapas de trabajo con casillas |
| `docs/09-SEO.md` | Títulos, descripciones y qué indexar |
| `docs/10-SEGURIDAD.md` | Datos sensibles, validaciones y RLS |

## Cómo se trabaja (ciclo SDD)

Cada funcionalidad vive en `specs/NNN-nombre/` y pasa por estas fases, en orden:

| Fase | Comando | Archivo que produce |
|---|---|---|
| 1 · Spec | `/spec` | `spec.md` (historias, RF en EARS, casos límite, fuera de alcance, criterios de finalización) |
| 2 · Clarificación | `/clarificar` | `clarificacion.md` (hallazgos como QA + decisión del autor) |
| 3 · Plan | `/planificar` | `plan.md` (cómo se construye, sin código, ligado a cada RF) |
| 4 · Tareas | `/tareas` | `tasks.md` (tareas de menos de 30 min, cada una con «Listo cuando») |
| 5 · Implementación | — | código + tests + un commit por tarea |
| 6 · Validación | `/verificar` | `verificacion.md` (cada RF: cumple / no cumple / prueba manual pendiente) |
| 7 · Cambio | `/cambio` | spec actualizada **antes** que el código |

## Reglas de trabajo

- **Una tarea por vez y una conversación por tarea.** Lo que haya que recordar va a `memory.md`, no al chat.
- **Tests primero:** antes de cambiar código se escribe o ajusta el test que lo comprueba.
- **Mostrá el diff y esperá aprobación** antes de dar una tarea por terminada. El autor revisa cada archivo que cambia.
- **Un commit por tarea**, con el formato de `docs/07-CONVENCIONES.md`.
- Si aparece un requisito nuevo, se escribe primero en la spec (`/cambio`) y después en el código.
- Los errores de la IA que el autor detecte se anotan en `docs/PROMPTS.md`.

## Reglas obligatorias del código

- Colores y fuentes **siempre** con las variables CSS de `IDENTIDAD-MARCA.md`.
- El navegador usa **solo la clave pública** de Supabase. La `service_role` jamás aparece en `src/` ni en el repositorio.
- Toda consulta pasa por `window._supabase` (creado en `src/js/config.js`).
- Las ventas se crean con `crear_venta` y se anulan con `cancelar_venta`; nunca con `insert` o `update` directos.
- No se crea ni se cambia una política de RLS sin aprobación del autor.
- Textos de la interfaz en voseo, cortos y claros.

## Lo que el agente nunca debe hacer

- Escribir o mostrar claves, tokens o contraseñas, ni pedirlas en el chat.
- Usar `innerHTML` con texto del usuario o de la base sin `escapeHtml()`.
- Mostrar `precio_costo` a usuarios con rol `empleado`.
- Ejecutar comandos destructivos (borrar datos, `git push --force`, `DROP`) sin mostrarlos antes y recibir un «sí».
- Generar imágenes o voces de personas reales, o imitar marcas y estilos de artistas.
- Tocar proyectos, bases o sitios que no sean los de Pointer.

## Skills propias

Están en `.agents/skills/`. Leé el `SKILL.md` correspondiente cuando:

| Skill | Cuándo se usa |
|---|---|
| `verificar-criterios` | Al cerrar una tarea o una funcionalidad (la usa `/verificar`) |
| `revisar-seguridad` | Antes de un commit que toque `src/js/`, `supabase/` o permisos |
| `escribir-ears` | Al redactar o corregir requisitos en una `spec.md` (la usa `/spec`) |

## Si algo no está claro

Preguntá antes de inventar.
