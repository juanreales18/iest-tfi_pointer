# Fichas de piezas generadas con IA (Anexo III)

> Una ficha por cada imagen, video, gráfico, voz o música generada con IA, o hecha con código escrito por una IA. La leyenda de transparencia se copia tal cual al epígrafe de la pieza en el sitio.
>
> Las cantidades marcadas *(completar)* las tiene que confirmar el autor, porque salen de lo que generó en cada herramienta.

## Registro de producción

| Pieza | Generadas | Usadas | Descartadas |
|---|---|---|---|
| Logo (Canva) | *(completar: opciones vistas en las 3 rondas)* | 1 | *(completar)* |
| Voz en off (ElevenLabs) | 18 tomas como mínimo (2 por frase en 9 frases), más las regeneradas de las escenas 4 y 8 | 9 | 9 como mínimo |
| Spot (Remotion) | 3 versiones renderizadas (isométrica, mixta 2D/3D, ajuste de volumen) | 1 | 2 |
| Música y efectos (código) | 1 música y 5 efectos | 6 | 0 |
| Gráficos (código) | 4, y una nueva versión del gráfico 4 | 4 | 1 (primera versión del gráfico 4) |
| Imágenes fotorrealistas | *(completar al producirlas)* | | |

---

## Figura 1. Logo de Pointer

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 1. Logo de Pointer (versión horizontal e isotipo) |
| Tipo | Imagen (logo) |
| Herramienta y modelo | Canva, generación de diseños con IA, usada desde Claude con el conector de Canva. Noviembre de 2026 |
| Prompt final | Logo para «Pointer», sistema de gestión para kioscos: isotipo cuadrado de esquinas redondeadas en amarillo `#F59E0B` con una «P» en carbón `#1F2937`, seguido del nombre «Pointer» en carbón; tipografía sans-serif bold, estilo plano, sin sombras ni degradados, fondo claro. |
| Iteraciones | 1) Primera propuesta dibujada por Claude en SVG: descartada por el autor, que prefirió hacerlo en Canva. 2) Primera ronda en Canva: el autor pidió más opciones. 3) Segunda ronda (grupos A y B): eligió la opción 8 del grupo A, con la paleta de la marca y el grosor de letra del grupo B. 4) Tercera ronda con la paleta y la tipografía de la opción 12: eligió la opción 2. 5) Ajustes en Canva hechos por Claude: «P» más grande, cuadrado de color sólido `#F59E0B` en vez de imagen, capa de fondo para tapar un borde rosado de la sombra original. |
| Edición humana | El autor eligió la opción en cada ronda, revisó los ajustes y exportó el PNG. Después se recortó, se dejó el fondo transparente y se armaron el isotipo y los favicons (32 y 192 px). |
| Uso en el proyecto | Barra lateral y login del sistema, favicon, cierre del spot, página de presentación e informe. Archivos en `multimedia/marca/` |
| Licencia | Condiciones de uso de Canva para contenido generado con su IA, revisadas al momento de uso; uso académico, no comercial. |
| Leyenda de transparencia | «Logo generado con IA (Canva) y editado por el autor» |

## Figura 2. Voz en off del spot

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 2. Voz en off del spot (9 frases, `multimedia/video/voz/voz-01.mp3` a `voz-09.mp3`) |
| Tipo | Voz |
| Herramienta y modelo | ElevenLabs, texto a voz, voz de catálogo «Carlos Pro - Argentinian Documentary & Radio», modelo eleven_v4. Noviembre de 2026 |
| Prompt final | El texto de cada frase del guion técnico (`multimedia/video/GUION-TECNICO.md`, versión 3), en voseo. Ejemplo: «Para eso... está Pointer. El sistema pensado para tu kiosco.» |
| Iteraciones | 1) Primera narración, más corta: el autor notó que el spot quedaba con silencios. 2) Narración más larga, una frase por escena, con la voz elegida por el autor. 3) Las escenas 4 y 8 se reescribieron porque «Pointer.» sonaba seco y cortado. 4) El plan gratuito tiene un límite por minuto, así que el autor generó y descargó él mismo las últimas frases. Se generaron 2 tomas por frase y el autor eligió una. |
| Edición humana | El autor eligió cada toma. Claude ajustó el volumen de la música y los efectos para que la voz se entienda (música al 35 %, efectos a la mitad). |
| Uso en el proyecto | Spot promocional (`multimedia/video/spot-pointer.mp4`) |
| Licencia | Plan gratuito de ElevenLabs: **uso no comercial y atribución obligatoria** («elevenlabs.io»). Es una voz de catálogo: no se clonó la voz de ninguna persona real. |
| Leyenda de transparencia | «Voz generada con IA (elevenlabs.io)» |

## Figura 3. Spot promocional de Pointer

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 3. Spot «Pointer. Cada venta, en su lugar.» (73 s, 1920×1080, 30 fps) |
| Tipo | Video (animación) |
| Herramienta y modelo | Remotion 4.0 (animación con React). El código lo escribió Claude a pedido del autor, en el chat. Noviembre de 2026 |
| Prompt final | «Hacé el video con las escenas aprobadas, las voces que están en la carpeta y algunos sonidos: escenas 2D, 3D e isométricas, mostrando al vendedor haciendo las ventas; al final, el logo y el eslogan, sin "Hecho en Tinogasta" ni el enlace.» |
| Iteraciones | 1) Versión 1 en papel: clips realistas generados con IA (Veo). Se descartó antes de producirla porque el autor prefirió una animación, con referencias de reels de Instagram. 2) Versión 2: animación toda isométrica. El autor pidió bajar la música y los efectos, más narración y escenas variadas. 3) Versión 3: mezcla de escenas 2D, 3D e isométricas, aprobada escena por escena con imágenes fijas (storyboard). 4) Ajuste final de volumen. |
| Edición humana | El autor eligió el estilo, aprobó cada escena del storyboard, eligió las voces, pidió los cambios de cada versión y decidió sacar «Hecho en Tinogasta» y el enlace. Los personajes son dibujos inventados y los productos no tienen marcas. |
| Uso en el proyecto | YouTube y página de presentación del sitio. Guion en `multimedia/video/GUION-TECNICO.md`; código en `multimedia/video/spot/` |
| Licencia | Remotion es gratuito para personas y equipos chicos según su licencia; el uso es académico. La voz lleva las condiciones de ElevenLabs (Figura 2). |
| Leyenda de transparencia | En el cierre del video: «Animación hecha con código (Remotion) · Voz generada con IA (elevenlabs.io) · Música y sonidos generados por código». Epígrafe en el sitio: «Animación hecha con código escrito por IA (Claude), con voz generada con IA (elevenlabs.io)» |

## Figura 4. Música y efectos del spot

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 4. Música de fondo y efectos (pitido del lector, campana, barrido, «pop» y lápiz) |
| Tipo | Música y efectos de sonido |
| Herramienta y modelo | Código Python (`multimedia/video/spot/gen/sonidos.py`) escrito por Claude: los sonidos se calculan con ondas y ruido filtrado, sin muestras de terceros. Noviembre de 2026 |
| Prompt final | «Agregá algunos sonidos al spot: el pitido del lector al escanear, una campana al registrar la venta y una música suave de fondo.» |
| Iteraciones | 1) Primera mezcla: el autor dijo que la música y los efectos estaban altos. 2) Música al 35 % y efectos a la mitad: aprobada. |
| Edición humana | El autor pidió el ajuste de volumen y aprobó la mezcla final. |
| Uso en el proyecto | Spot promocional |
| Licencia | Sonido propio generado por código: no depende de condiciones de terceros. |
| Leyenda de transparencia | «Música y sonidos generados por código» |

## Figuras 5 a 8. Gráficos con datos del proyecto

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 5. Requisitos por tipo de frase EARS · Figura 6. Tests automáticos que pasan, por hito · Figura 7. Tareas completadas por funcionalidad · Figura 8. Colores escritos a mano en el CSS |
| Tipo | Gráfico |
| Herramienta y modelo | Python con matplotlib. El código lo escribió Claude a pedido del autor. 3 de noviembre de 2026 |
| Prompt final | «Hacé los gráficos con datos reales del repo.» Los datos salen de las tablas de `specs/001-punto-de-venta/spec.md` y `specs/002-caja-arqueo/spec.md`, de los `tasks.md`, de los `verificacion.md`, de la ejecución de `npm test` y del conteo de colores antes y después de la tarea de la Actividad 3. |
| Iteraciones | 1) Primera versión de los 4 gráficos. 2) El gráfico 8 se rehízo porque su nota de fuente atribuía al test los 36 `rgba()`, que en realidad se contaron al revisar el CSS. |
| Edición humana | El autor revisó los gráficos. Cada uno tiene la fuente de sus datos escrita al pie. |
| Uso en el proyecto | Informe, página de presentación e infografía. Archivos en `multimedia/graficos/` |
| Licencia | matplotlib es software libre. Los datos son del propio proyecto. |
| Leyenda de transparencia | «Gráfico generado con código escrito por IA (Claude) a partir de datos reales del proyecto» |

---

## Plantilla (copiar por cada pieza)

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura N. … |
| Tipo | Imagen / video / gráfico / voz / música |
| Herramienta y modelo | Nombre, modelo o versión y fecha de uso |
| Prompt final | Texto completo del prompt que dio el resultado elegido |
| Iteraciones | Cantidad de intentos y qué se corrigió en cada uno (revisado con la Tabla 3) |
| Edición humana | Recortes, retoques, color, montaje o textos agregados por el autor |
| Uso en el proyecto | Página, sección, video o informe |
| Licencia | Condiciones de uso de la herramienta y si permite uso comercial |
| Leyenda de transparencia | «Imagen generada con IA (herramienta) y editada por el autor» |
