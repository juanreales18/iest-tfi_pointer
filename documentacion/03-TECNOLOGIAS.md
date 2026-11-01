# 03 · Tecnologías: con qué lo construimos

## Stack elegido

| Capa | Tecnología | Motivo de la elección |
|---|---|---|
| Interfaz | HTML5 + CSS3 + JavaScript | Un sistema interno con pocas pantallas no necesita un framework; carga rápido y es fácil de mantener |
| Estilos | CSS con variables | Fiel al manual de marca: cambiar un color es editar una línea |
| Tipografías | Google Fonts (Barlow y Barlow Condensed) | Licencia libre, se puede usar en la web |
| Base de datos | PostgreSQL 17 en Supabase | SQL estándar, con relaciones, restricciones y RLS para proteger los datos |
| Autenticación | Supabase Auth | Login seguro sin programar el manejo de contraseñas |
| API | Supabase (PostgREST y funciones SQL) | Evita un servidor propio; las reglas críticas viven en la base |
| Caché | Service Worker (`sw.js`) | El sistema carga rápido y se actualiza solo en cada publicación |
| Librerías | `supabase.js` incluida en `js/vendor/` | Sin depender de un CDN externo |
| Código | Git + GitHub | Historial de cambios y respaldo del proyecto |
| Publicación | Netlify | Sitio estático con HTTPS, sin paso de compilación; publica la carpeta `sistema/` del repositorio de GitHub |
| Tests | `node:test` (incluido en Node.js) | Tests automáticos con `npm test`, sin instalar librerías |
| IA | Claude Code + VS Code | Claude Code como agente (specs, plan, tareas y código); VS Code para leer y revisar cada cambio. Ver `MATRIZ-HERRAMIENTAS.md` |

## Cómo se conecta todo

```text
Navegador (PC o celular del kiosco)
        │  HTTPS
        ▼
Netlify  ──  archivos estáticos (HTML, CSS, JS)
        │
        │  clave pública (anon) + sesión del usuario
        ▼
Supabase  ──  Auth + PostgREST + PostgreSQL con RLS
        ▲
        │  git push
GitHub (repositorio)  ──►  Netlify publica en cada push
```

Las reglas de seguridad **no dependen del navegador**: las aplica la base de datos con RLS.

## No usar en este proyecto

- React, Vue, Angular, jQuery.
- Tailwind y Bootstrap.
- Firebase y MongoDB.
- Claves de servidor (`service_role`) en el frontend.

> Es una decisión del proyecto, no una regla eterna: si cambia, primero se edita este archivo y después el código.

## Por qué no se usa el stack de clase (React + Next.js + PostgreSQL + Vercel)

El sistema ya estaba construido y en uso antes del Trabajo Final Integrador, y cumple los requisitos sin un framework:

- **Pocas pantallas y mucha lógica en la base:** las reglas críticas (totales, stock, caja, permisos) viven en PostgreSQL con RLS y funciones; React no agregaría seguridad.
- **Sin paso de compilación:** el kiosquero o el técnico puede publicar una corrección subiendo archivos, sin Node.js en la PC del mostrador.
- **PostgreSQL igual que en clase:** Supabase *es* PostgreSQL, así que el modelo de datos, SQL y RLS son los mismos.
- **Netlify en lugar de Vercel:** cumple la misma función (sitio estático con HTTPS y despliegue desde GitHub) y el proyecto ya estaba publicado ahí.

Migrar a Next.js significaría reescribir un sistema que funciona sin ganar ninguna funcionalidad pedida en las specs.

