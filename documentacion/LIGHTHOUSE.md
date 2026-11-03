# Lighthouse: resultados de Pointer

Medición hecha el **3 de noviembre de 2026** sobre la versión publicada, en ventana de incógnito de Chrome (Lighthouse 13.5.0). Los informes completos están en `documentacion/evidencia/lighthouse/`.

**Páginas medidas:** https://pointer-demo.netlify.app/login y https://pointer-demo.netlify.app/presentacion

| Categoría | Login · Mobile | Login · Desktop | Presentación · Mobile | Presentación · Desktop | Mínimo pedido |
|---|---|---|---|---|---|
| Rendimiento | 98 | 100 | 92 | 97 | 80 |
| Accesibilidad | 92 | 93 | 100 | 100 | 80 |
| Buenas prácticas | 100 | 100 | 100 | 100 | 80 |
| SEO | 92 | 92 | 92 | 92 | 80 |

**Resultado:** las cuatro categorías superan 80 en las cuatro pruebas.

## Informes

- Login, mobile: `documentacion/evidencia/lighthouse/login-mobile.html`
- Login, desktop: `documentacion/evidencia/lighthouse/login-desktop.html`
- Presentación, mobile: `documentacion/evidencia/lighthouse/presentacion-mobile.html`
- Presentación, desktop: `documentacion/evidencia/lighthouse/presentacion-desktop.html`

## Alcance de la medición

Se midieron `/login` y `/presentacion` porque son las pantallas públicas. Las pantallas internas (punto de venta, caja, productos, historial) piden iniciar sesión, así que Lighthouse no puede analizarlas como una visita anónima. Su accesibilidad y su uso de colores se controlan con los tests de `tests/constitucion.test.js` (por ejemplo, que no haya colores escritos a mano y que las imágenes tengan texto alternativo).

## Qué se corrigió antes de medir

- Títulos y descripciones propios en cada pantalla, según `09-SEO.md`.
- `/login` indexable, con `<link rel="canonical">`; las pantallas internas siguen con `noindex`.
- Nombre accesible (`aria-label`) en los botones de cierre de los modales.
