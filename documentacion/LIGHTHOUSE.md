# Lighthouse: resultados de Pointer

Medición hecha el **3 de noviembre de 2026** sobre la versión publicada, en ventana de incógnito de Chrome (Lighthouse 13.5.0). Los informes completos están en `documentacion/evidencia/lighthouse/`.

**Página medida:** https://pointer-demo.netlify.app/login

| Categoría | Mobile | Desktop | Mínimo pedido |
|---|---|---|---|
| Rendimiento | 98 | 100 | 80 |
| Accesibilidad | 92 | 93 | 80 |
| Buenas prácticas | 100 | 100 | 80 |
| SEO | 92 | 92 | 80 |

**Resultado:** las cuatro categorías superan 80 en las dos pruebas.

## Informes

- Mobile: `documentacion/evidencia/lighthouse/login-mobile.html`
- Desktop: `documentacion/evidencia/lighthouse/login-desktop.html`

## Alcance de la medición

Se midió `/login` porque es la única pantalla pública. Las pantallas internas (punto de venta, caja, productos, historial) piden iniciar sesión, así que Lighthouse no puede analizarlas como una visita anónima. Su accesibilidad y su uso de colores se controlan con los tests de `tests/constitucion.test.js` (por ejemplo, que no haya colores escritos a mano y que las imágenes tengan texto alternativo).

## Qué se corrigió antes de medir

- Títulos y descripciones propios en cada pantalla, según `09-SEO.md`.
- `/login` indexable, con `<link rel="canonical">`; las pantallas internas siguen con `noindex`.
- Nombre accesible (`aria-label`) en los botones de cierre de los modales.
