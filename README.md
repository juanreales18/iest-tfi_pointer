# Pointer

**Sistema web de gestión para kioscos:** ventas con lector de código de barras, stock, caja con arqueo, compras, gastos, clientes, reportes y auditoría. Pensado para kioscos y almacenes chicos del interior de Argentina, donde se atiende de pie y con apuro.

> Trabajo Final Integrador de **Inteligencia Artificial** · Tecnicatura en Desarrollo de Software · Instituto de Estudios Superiores de Tinogasta (IEST) · 2026
> Autor: **Juan Angel Reales** · Docente: Prof. Ana Camila Barrionuevo

## Enlaces

| Qué | Dónde |
|---|---|
| Sistema publicado | https://pointer-web001.netlify.app/ |
| Video promocional | *(se agrega en la Actividad 4)* |
| Video demo | *(se agrega en la Actividad 4)* |

## Stack

HTML + CSS + JavaScript (sin framework) · Supabase (PostgreSQL, Auth, RLS y Edge Functions) · Netlify.
Por qué no se usa Next.js: ver [`docs/03-TECNOLOGIAS.md`](docs/03-TECNOLOGIAS.md).

## Cómo se trabajó con IA

El proyecto sigue **Desarrollo Guiado por Especificaciones (SDD)** con **Claude Code + VS Code**:

1. [`docs/CONSTITUCION.md`](docs/CONSTITUCION.md): 8 principios comprobables que el agente lee antes de cada tarea.
2. [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) y [`memory.md`](memory.md): el arnés del agente.
3. Comandos en [`.claude/commands/`](.claude/commands): `/spec`, `/clarificar`, `/plan`, `/tareas`, `/verificar`, `/cambio`.
4. Skills propias en [`.agents/skills/`](.agents/skills): `verificar-criterios`, `revisar-seguridad`, `escribir-ears`.
5. Una carpeta por funcionalidad en [`specs/`](specs).
6. Registro de prompts y errores de la IA en [`docs/PROMPTS.md`](docs/PROMPTS.md) y declaración en [`docs/DECLARACION-IA.md`](docs/DECLARACION-IA.md).

## Estructura

```text
iest-tfi_pointer/
├── AGENTS.md · CLAUDE.md · memory.md · README.md · package.json
├── docs/        ← constitución, kit de especificación (01 a 10), marca, prompts, declaración, matriz de herramientas
├── specs/       ← una carpeta por funcionalidad
├── .agents/skills/ · .claude/commands/
├── src/         ← el sistema (se publica en Netlify)
├── supabase/    ← estructura SQL de la base y Edge Function crear-usuario
├── tests/       ← npm test
├── public/      ← marca/ y media/
└── multimedia/  ← imágenes, video, gráficos y FICHAS-IA.md
```

## Correr los tests

Requiere Node.js 18 o más (no hace falta instalar dependencias):

```bash
npm test
```

## Publicar

En Netlify, el sitio se conecta a este repositorio con **Base directory: `src`**, sin comando de compilación (la configuración y las cabeceras de seguridad están en `src/netlify.toml`). La base se crea con `supabase/sql/00-estructura.sql` (ver los pasos finales dentro del archivo).

## Seguridad

El repositorio **no contiene secretos**. La única clave que aparece en `src/js/config.js` es la **clave pública** de Supabase, que por sí sola no da acceso a nada porque todas las tablas tienen RLS. La clave de servicio solo existe en el panel de Supabase, como variable de la Edge Function.
