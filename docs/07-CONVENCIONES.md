# 07 · Convenciones: cómo escribimos el código

## Idioma

- El código (variables, funciones, tablas, columnas) va en **español**, igual que la base de datos.
- Los textos de la interfaz van en español rioplatense (voseo).
- Los comentarios explican el *por qué*, no repiten lo que hace el código.

## Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos HTML, CSS y JS | minúsculas, sin espacios ni tildes | `ventas.js` |
| Variables y funciones | `camelCase` | `agregarProductoAVenta()` |
| Constantes | `MAYUSCULAS_CON_GUION_BAJO` | `STOCK_MINIMO_DEFECTO` |
| Clases CSS | `kebab-case` | `stat-card`, `btn-primary` |
| Variables CSS | `--color-nombre` | `--color-primary` |
| Tablas y columnas SQL | `snake_case` en español | `detalle_ventas`, `precio_venta` |
| Funciones SQL | `snake_case` | `crear_venta` |

## Estilo de código

- JavaScript moderno: `const` y `let`, nunca `var`.
- Comillas simples en JS y punto y coma al final.
- Una función hace una sola cosa.
- Los colores se usan con `var(--color-...)`.

## Commits

Formato: **verbo en presente + qué se hizo**, en español y en minúsculas.

```text
agrega lector de código de barras en nueva venta
corrige el cálculo del vuelto
cierra las vistas v_* para usuarios anónimos
```

## Ramas

| Rama | Uso |
|---|---|
| `main` | Versión publicada en Netlify |
| `feature/nombre` | Una funcionalidad nueva, por ejemplo `feature/caja` |
| `fix/nombre` | Corrección de un error |

Se fusiona a `main` solo cuando la tarea de `08-TAREAS.md` está terminada y probada.
