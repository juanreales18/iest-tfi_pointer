# 09 · SEO: cómo nos encuentran en Google

Pointer es un **sistema interno**: casi todas sus pantallas están detrás de un login y **no deben aparecer en Google**. Solo la página de presentación y la pantalla de ingreso necesitan un título y una descripción claros.

## Título y descripción por página

| Página | Título | Descripción | Indexar |
|---|---|---|---|
| `presentacion.html` | Pointer · Cada venta, en su lugar | Pointer es un sistema web para kioscos: ventas con lector de código de barras, stock, caja con arqueo y reportes. Mirá cómo funciona. | Sí |
| `login.html` | Ingresar · Pointer | Sistema de ventas, stock y caja para kioscos. Ingresá con tu usuario. | Sí |
| `dashboard.html` (aplicación) | Pointer · Panel | Panel de gestión del kiosco. | No (`noindex`) |
| `pos.html` (aplicación) | Pointer · Punto de venta | Panel de gestión del kiosco. | No (`noindex`) |
| `index.html` | Pointer | Redirige a login o panel. | No (`noindex`) |

```html
<!-- login.html -->
<html lang="es">
<head>
    <title>Ingresar · Pointer</title>
    <meta name="description" content="Sistema de ventas, stock y caja para kioscos. Ingresá con tu usuario.">
    <link rel="canonical" href="https://pointer-demo.netlify.app/login">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<!-- presentacion.html: sin meta robots -->
<link rel="canonical" href="https://pointer-demo.netlify.app/presentacion">

<!-- dashboard.html, pos.html e index.html -->
<meta name="robots" content="noindex, nofollow">
```

Además, `sistema/netlify.toml` manda la cabecera `X-Robots-Tag: noindex, nofollow` por ruta: `/`, `/index.html`, `/dashboard`, `/dashboard.html`, `/pos` y `/pos.html`. Netlify sirve cada página con y sin `.html`, por eso van las dos.

Una ruta desconocida recibe `index.html`, así que su protección es la meta `robots` de ese archivo: no hay que sacarla.

`/login` y `/login.html` son la misma página. El `canonical` le indica a Google que use `/login`. No se usa una redirección 301 a propósito: `sw.js` guarda `/login.html` en caché y el código navega a esa dirección, así que redirigirla podría romper el login.

`/presentacion` se indexa: no lleva meta `robots` ni cabecera `X-Robots-Tag`. Su `canonical` apunta a `/presentacion`, sin `.html`.

## Palabras clave

| Tema | Palabras |
|---|---|
| Producto | sistema para kiosco, sistema de ventas para kioscos, control de stock |
| Funciones | lector de código de barras, caja diaria, reportes de ventas |
| Lugar | Catamarca, Argentina |

## Texto alternativo de imágenes

| Imagen | Texto `alt` |
|---|---|
| `img/presentacion/logo-horizontal.webp` | Logo de Pointer: una P carbón en un cuadrado amarillo, seguida del nombre |
| `img/presentacion/isotipo.webp` | Isotipo de Pointer, una P en un cuadrado amarillo |
| Imagen de producto | Nombre del producto |
| Otras imágenes de `presentacion.html` | Descripción de lo que muestra cada una, en su `alt` |

## Lista de control

- [x] Título único en cada página
- [ ] Un solo `<h1>` por página (`presentacion.html` ya lo cumple)
- [x] `lang="es"` en todas las páginas
- [x] `noindex` solo en las pantallas privadas (meta robots y cabecera `X-Robots-Tag` por ruta en `netlify.toml`); `login.html` y `presentacion.html` se indexan
- [ ] Todas las imágenes con `alt`
- [ ] Etiquetas semánticas (`header`, `nav`, `main`, `table`)
- [ ] PageSpeed de 90 o más en la pantalla de ingreso
