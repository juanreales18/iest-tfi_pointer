# Fichas de piezas generadas con IA (Anexo III)

> Una ficha por cada imagen, video, gráfico, voz o música generada con IA, o hecha con código escrito por una IA. En el sitio y en el informe, cada pieza lleva como epígrafe su leyenda de transparencia, copiada tal cual; todas las leyendas dicen que la pieza fue generada con IA, como pide el principio P8.
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
| Infografía (código) | 2 versiones | 1 | 1 (la primera cortaba la última sección) |
| Montaje de los mockups | 4 (2 con script y 2 rehechos por el autor) | 2 | 2 |
| Imágenes fotorrealistas (Gemini) | 9 imágenes en 11 intentos (en 2 intentos Gemini no generó nada) | 8 | 1 (primera versión de la imagen 1) |

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

## Figura 9. Frente del kiosco

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 9. Frente del kiosco (`multimedia/imagenes/01-frente-kiosco.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista del frente de un kiosco moderno en una calle comercial de una ciudad chica actual del noroeste argentino (Tinogasta, Catamarca). Local de una planta, de ladrillo revocado y pintado en un color claro, con zócalo de cerámica, puerta y vidriera amplias de vidrio con marco de aluminio, y dentro se ven góndolas iluminadas con luces LED y golosinas de envases genéricos. Vereda de baldosas rojas, calle asfaltada, cordón de cemento, postes de luz con cables cruzando la calle, árboles grandes y frondosos de hojas verdes en la vereda, y dos autos actuales estacionados. A los costados, otros locales y casas pintadas de distintos colores. Muy lejos, en el horizonte, se ven los cerros, suaves y azulados. Luz cálida del atardecer, suave, cielo apenas nublado. Cámara a la altura de los ojos, desde la vereda de enfrente, lente de 35 mm, plano general, encuadre horizontal 16:9. Estilo fotográfico documental, colores naturales y vivos. El toldo del kiosco es color amarillo ámbar (#F59E0B). Sin carteles con texto legible, sin logos ni marcas reales, sin personas en primer plano. |
| Iteraciones | 2 intentos. 1) Primera imagen, con el prompt ya corregido una vez: se veía antigua y seca (fachada descascarada, auto viejo, cerros áridos pegados al pueblo) y tenía texto legible («KIOSCO / ABIERTO»), así que falló la Tabla 3. El autor corrigió el prompt: ciudad más urbana y verde, autos actuales, cerros lejos, kiosco moderno. 2) Imagen elegida. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

## Figura 10. Kiosquera atendiendo

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 10. Kiosquera atendiendo (`multimedia/imagenes/02-kiosquera-atendiendo.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de una mujer argentina de unos 40 años, de pelo oscuro recogido, con remera y delantal color amarillo ámbar (#F59E0B), sonriendo mientras le entrega un paquete a un cliente detrás del mostrador de un kiosco moderno. El mostrador es de melamina blanca con frente de vidrio y golosinas exhibidas adentro. Al fondo, góndolas de metal blancas bien ordenadas con golosinas, galletitas y snacks de envases genéricos, luces LED en el techo y una heladera exhibidora con puerta de vidrio llena de bebidas sin marca. Paredes blancas y piso cerámico claro. Luz interior clara y pareja, con un poco de luz natural cálida que entra por la vidriera. Cámara réflex, lente de 50 mm, plano medio, poca profundidad de campo, encuadre horizontal 16:9. Estilo fotográfico realista, colores limpios. Persona ficticia. Manos con cinco dedos, sin texto legible en los envases, sin logos ni marcas reales. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

## Figura 11. Kiosquero escaneando

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 11. Kiosquero escaneando (`multimedia/imagenes/03-kiosquero-escaneando.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de un hombre argentino de unos 60 años, canoso, con camisa lisa de manga corta, escaneando un paquete de galletitas genérico con un lector de código de barras de mano, detrás del mostrador de melamina blanca de un kiosco moderno. En el mostrador hay una notebook moderna abierta, de espaldas a la cámara. Al fondo, góndolas de metal con productos de envases genéricos y luces LED, desenfocadas. Luz interior clara, con luz natural cálida desde la vidriera lateral. Cámara a la altura del mostrador, lente de 50 mm, plano medio corto, enfoque en las manos y el lector, encuadre horizontal 16:9. Estilo fotográfico realista. Un detalle en amarillo ámbar (#F59E0B) en el lector o en el borde del mostrador. Persona ficticia. Manos con cinco dedos, sin texto legible, sin logos ni marcas reales. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

## Figura 12. El cuaderno (el «antes»)

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 12. El cuaderno (el «antes») (`multimedia/imagenes/04-cuaderno-ventas.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista en primer plano de las manos de una persona anotando con una birome en un cuaderno espiral abierto, con columnas de números escritos a mano, sumas tachadas y correcciones, sobre el mostrador blanco de un kiosco moderno. Al costado hay un celular, algunas monedas y billetes argentinos de colores, desenfocados, y al fondo se adivinan góndolas iluminadas. Luz interior clara y pareja, con un toque cálido de la vidriera. Cámara cenital levemente inclinada, lente de 50 mm, poca profundidad de campo, encuadre horizontal 16:9. Estilo fotográfico realista. Manos con cinco dedos, números ilegibles, sin logos ni marcas reales. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

## Figura 13. Mockup notebook en el mostrador

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 13. Mockup notebook en el mostrador (`multimedia/imagenes/05-mockup-notebook-pointer.jpg`) · mockup |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de una notebook moderna y delgada abierta sobre el mostrador de melamina blanca de un kiosco moderno, vista de frente y levemente en diagonal, con un lector de código de barras al lado. Al fondo, desenfocadas, góndolas de metal con golosinas de envases genéricos, luces LED y una heladera exhibidora con puerta de vidrio. La pantalla de la notebook es un rectángulo de color verde uniforme (#00FF00), plano, sin reflejos ni brillos, con los bordes bien visibles. Luz interior clara y suave. Cámara a la altura del mostrador, lente de 35 mm, poca profundidad de campo, encuadre horizontal 16:9. Estilo fotográfico realista de producto. Detalle en amarillo ámbar (#F59E0B) en el ambiente. Sin personas, sin texto legible, sin logos ni marcas reales en la notebook. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | La pantalla salió en verde a propósito para pegarle una captura real del punto de venta de Pointer. 1) Primer montaje con un script de Python (OpenCV) escrito por Claude (`multimedia/imagenes/mockups.py`): el autor lo descartó porque la pantalla quedaba plana, sin brillo. 2) El autor rehízo el montaje con Photopea (transformación libre con distorsión), ajustando la perspectiva y el brillo. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini) con una captura real de Pointer en la pantalla» |

## Figura 14. Mockup celular en la mano

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 14. Mockup celular en la mano (`multimedia/imagenes/06-mockup-celular-pointer.jpg`) · mockup |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de la mano de una mujer joven sosteniendo un celular moderno en posición vertical, dentro de un kiosco moderno, con el mostrador blanco y las góndolas iluminadas con luces LED desenfocadas al fondo. La pantalla del celular es un rectángulo de color verde uniforme (#00FF00), plano, sin reflejos, con los bordes bien visibles. Luz interior clara y suave. Cámara a la altura del pecho, lente de 50 mm, poca profundidad de campo, encuadre vertical 4:5. Estilo fotográfico realista de producto. Pulsera o funda con un detalle amarillo ámbar (#F59E0B). Persona ficticia. Mano con cinco dedos, sin texto legible, sin logos ni marcas reales en el celular. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | La pantalla salió en verde a propósito para pegarle una captura real del panel de Pointer tomada desde el celular. 1) Primer montaje con el script de Python (`multimedia/imagenes/mockups.py`): descartado porque quedaba plano y la captura tenía poca resolución. 2) El autor rehízo el montaje con Photopea (transformación libre con distorsión). |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini) con una captura real de Pointer en la pantalla» |

## Figura 15. Cierre de caja de noche

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 15. Cierre de caja de noche (`multimedia/imagenes/07-cierre-caja.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de un hombre argentino joven, de unos 25 años, con buzo oscuro, contando billetes argentinos de colores sobre el mostrador blanco de un kiosco moderno de noche, con una notebook moderna abierta a su lado, de espaldas a la cámara. El local está iluminado por luces LED cálidas y las góndolas brillan al fondo. Por la vidriera se ve la calle asfaltada de noche, con faroles encendidos, un árbol frondoso y un auto actual estacionado. Luz interior cálida, contraste suave con el exterior oscuro. Cámara a la altura de los ojos, lente de 35 mm, plano medio, encuadre horizontal 16:9. Estilo fotográfico realista, ambiente nocturno. Detalle en amarillo ámbar (#F59E0B) en el mostrador o en una lámpara. Persona ficticia. Manos con cinco dedos, billetes sin texto legible, sin logos ni marcas reales. |
| Iteraciones | 1 intento, aprobado con la Tabla 3. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

## Figura 16. La dueña mirando las ventas (el «después»)

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 16. La dueña mirando las ventas (el «después») (`multimedia/imagenes/08-duena-ventas.jpg`) |
| Tipo | Imagen fotorrealista |
| Herramienta y modelo | Google Gemini, generación de imágenes (Nano Banana), plan gratuito. 3 de noviembre de 2026 |
| Prompt final | Fotografía realista de una mujer argentina de unos 55 años, de pelo corto y canoso, sonriendo tranquila mientras mira la pantalla de una notebook moderna sobre el mostrador blanco de su kiosco moderno, con un mate al lado. La notebook está de costado a la cámara, sin que se vea su pantalla. Al fondo, góndolas de metal ordenadas con productos de envases genéricos, luces LED y una vidriera amplia que da a una vereda con árboles verdes y frondosos. Luz cálida de tarde que entra por la vidriera, mezclada con la luz clara del local. Cámara a la altura de los ojos, lente de 50 mm, plano medio, poca profundidad de campo, encuadre horizontal 16:9. Estilo fotográfico realista, colores cálidos y limpios. Detalle en amarillo ámbar (#F59E0B) en su ropa o en el ambiente. Persona ficticia. Manos con cinco dedos, sin texto legible, sin logos ni marcas reales. |
| Iteraciones | 3 intentos. 1 y 2) Gemini no generó la imagen: devolvió la misma pregunta o respondió «Solo soy una IA basada en texto, por lo que no puedo ayudarte con eso». 3) El autor aclaró que la imagen era para un proyecto académico y Gemini la generó; aprobada con la Tabla 3. |
| Edición humana | Ninguna. |
| Uso en el proyecto | Página de presentación del sitio e informe |
| Licencia | Condiciones de Gemini vigentes al momento de uso; Google agrega una marca de agua invisible (SynthID). Uso académico, no comercial. Persona y lugar ficticios, productos sin marcas. |
| Leyenda de transparencia | «Imagen generada con IA (Gemini)» |

---

## Figura 17. Infografía «Pointer en números»

| Campo | Contenido |
|---|---|
| Nº y nombre de la pieza | Figura 17. Infografía «Pointer en números» (`multimedia/graficos/infografia-pointer.png`) |
| Tipo | Infografía |
| Herramienta y modelo | HTML y CSS renderizados con Playwright; el código lo escribió Claude a pedido del autor. 3 de noviembre de 2026 |
| Prompt final | «Hacé la infografía con datos reales del proyecto.» Datos: requisitos y tareas de las specs 001 y 002, `npm test` (267 en verde), Lighthouse del 3 de noviembre de 2026, conteo de colores, `PROMPTS.md` (11 errores), `DECLARACION-IA.md` (7 riesgos) y esta lista de fichas. |
| Iteraciones | 1) La primera versión tenía alto fijo y el pie tapaba la sección «Uso responsable de la IA» y las tecnologías. 2) Alto automático: aprobada. |
| Edición humana | El autor revisó los datos y el diseño. Las fuentes de cada dato están escritas al pie de la infografía. |
| Uso en el proyecto | Informe, página de presentación y defensa oral. Código en `multimedia/graficos/infografia-pointer.html` |
| Licencia | Código propio; fuentes Barlow y Barlow Condensed con licencia libre (OFL); logo propio. |
| Leyenda de transparencia | «Infografía generada con código escrito por IA (Claude) a partir de datos reales del proyecto» |

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
