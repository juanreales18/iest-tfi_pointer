# 09 · SEO: cómo nos encuentran en Google

Pointer es un **sistema interno**: casi todas sus pantallas están detrás de un login y **no deben aparecer en Google**. Solo la pantalla de ingreso necesita un título y una descripción claros.

## Título y descripción por página

| Página | Título | Descripción | Indexar |
|---|---|---|---|
| `login.html` | Ingresar · Pointer | Sistema de ventas, stock y caja para kioscos. Ingresá con tu usuario. | Sí |
| `dashboard.html` y `pos.html` (aplicación) | Pointer · Panel | Panel de gestión del kiosco. | No (`noindex`) |
| `index.html` | Pointer | Redirige a login o panel. | No (`noindex`) |

```html
<!-- login.html -->
<html lang="es">
<head>
    <title>Ingresar · Pointer</title>
    <meta name="description" content="Sistema de ventas, stock y caja para kioscos. Ingresá con tu usuario.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<!-- dashboard.html, pos.html e index.html -->
<meta name="robots" content="noindex, nofollow">
```

## Palabras clave

| Tema | Palabras |
|---|---|
| Producto | sistema para kiosco, sistema de ventas para kioscos, control de stock |
| Funciones | lector de código de barras, caja diaria, reportes de ventas |
| Lugar | Catamarca, Argentina |

## Texto alternativo de imágenes

| Imagen | Texto `alt` |
|---|---|
| `img/logo/logo-horizontal.png` | Pointer, sistema de gestión para kioscos |
| `img/logo/isotipo.png` | Logo de Pointer: las letras Re sobre un cuadrado amarillo |
| Imagen de producto | Nombre del producto |

## Lista de control

- [ ] Título único en cada página
- [ ] Un solo `<h1>` por página
- [x] `lang="es"` en todas las páginas
- [x] `noindex` en las pantallas privadas (meta robots y cabecera `X-Robots-Tag` en `netlify.toml`)
- [ ] Todas las imágenes con `alt`
- [ ] Etiquetas semánticas (`header`, `nav`, `main`, `table`)
- [ ] PageSpeed de 90 o más en la pantalla de ingreso
