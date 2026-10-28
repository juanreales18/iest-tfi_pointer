# CLAUDE.md

Este proyecto usa **Claude Code** como agente y **VS Code** para revisar cada cambio.

Las instrucciones completas están en `AGENTS.md` (compartidas con cualquier otro agente):

@AGENTS.md

## Específico de Claude Code

- Al empezar cada sesión: leé `docs/CONSTITUCION.md` y `memory.md` antes de responder.
- Los comandos del proyecto están en `.claude/commands/`: `/spec`, `/clarificar`, `/plan`, `/tareas`, `/verificar` y `/cambio`.
- Las skills propias están en `.agents/skills/` (no en `.claude/skills/`): cuando una tarea las necesite, leé su `SKILL.md` completo antes de usarlas.
- Usá el **modo plan** para cualquier cambio que toque más de un archivo: primero el plan, después el código.
- Antes de ejecutar un comando de terminal, mostralo y explicá qué hace. Nunca aceptes permisos permanentes para comandos que borran o publican.
- No pegues en la conversación el contenido de `.env` ni las claves del panel de Supabase.
- Al terminar una tarea, actualizá `memory.md` (estado y decisiones) en el mismo commit.
