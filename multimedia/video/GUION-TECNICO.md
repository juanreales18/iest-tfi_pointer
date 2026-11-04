# Guion técnico del spot de Pointer (Anexo II)

> **Versión 3 (la que se produjo).** Historial de decisiones del autor: la versión 1 usaba clips realistas generados con IA (queda abajo); la versión 2 fue una animación toda isométrica, que el autor descartó porque la narración dejaba silencios y quería ver al vendedor trabajando. La versión 3 mezcla escenas 2D, 3D e isométricas, con narración más larga.

**Idea:** un kiosquero de Tinogasta anota todo en un cuaderno y nunca sabe cuánto vendió. Con Pointer vende, cobra y cierra la caja sin cuaderno.
**Duración total:** 1:13 (73 s) · **Formato:** 1920×1080, 30 fps · **Tono:** voseo, frases cortas.
**Animación:** código en Remotion (`multimedia/video/spot/`), escrito por Claude a pedido del autor y aprobado escena por escena con un storyboard. Personajes dibujados (no son personas reales) y productos sin marcas.
**Voz en off:** ElevenLabs, voz «Carlos Pro - Argentinian Documentary & Radio», modelo eleven_v4, 2 tomas por frase; el autor eligió y descargó una por frase. Plan gratuito: uso no comercial y atribución «elevenlabs.io».
**Música y efectos:** generados por código (`spot/gen/sonidos.py`).
**Subtítulos:** el texto de la voz en off aparece abajo en cada escena.

| Esc. | Tiempo | Estilo | Plano e imagen (animación) | Audio (voz en off) | Texto en pantalla |
|---|---|---|---|---|---|
| 1 | 0:00 a 0:08 | 2D | Amanecer frente al kiosco, cerros al fondo; el vendedor levanta la persiana y saluda. | «Todos los días, lo mismo: levantás la persiana, prendés la luz... y agarrás el cuaderno.» | «Todos los días, lo mismo.» |
| 2 | 0:08 a 0:17 | 2D | Mostrador: llega un cliente, el vendedor anota en el cuaderno y el total termina en «¿$ 4.800?». | «Anotás cada venta a mano. Sumás de memoria, tachás, volvés a sumar... y al cerrar, la caja nunca da.» | «Anotás. Sumás. Tachás.» |
| 3 | 0:17 a 0:25 | Isométrica | Pueblo de noche con tarjetas de preguntas flotando. | «¿Cuánto vendiste hoy? ¿Qué se está por acabar? ¿Cuánto te deben? Nadie lo sabe con certeza.» | Las tres preguntas |
| 4 | 0:25 a 0:31 | Isométrica | El kiosco se enciende en amarillo, la gente camina hacia él, etiqueta «Tu kiosco» e isotipo. | «Para eso... está Pointer. El sistema pensado para tu kiosco.» | «Para eso está POINTER» |
| 5 | 0:31 a 0:40 | 2D + 3D | El vendedor escanea productos con el lector; en la notebook se arma la venta y sube el total. | «Escaneás el producto con el lector, y Pointer lo suma solo: arma la venta y calcula el total al instante.» | «Escaneá. Cobrá.» |
| 6 | 0:40 a 0:49 | 3D | Notebook en perspectiva: la clienta paga en efectivo, se ve el vuelto y aparece «Venta registrada». | «Elegís cómo te pagan, ves el vuelto, y listo. Cada venta queda guardada una sola vez, sin duplicados.» | «Venta registrada» |
| 7 | 0:49 a 0:58 | 2D | De noche, el vendedor cuenta la plata y la notebook muestra el cierre de caja en $ 0. | «Y al cerrar el día, la caja te muestra lo que esperabas, lo que contaste... y si sobra o falta.» | «La caja, al día.» |
| 8 | 0:58 a 1:07 | Isométrica | Vuelta al pueblo: kiosco encendido, gente alrededor y etiqueta «Ventas de hoy $ 48.500». | «Ahora sabés cuánto vendiste, qué tenés que reponer y cómo está tu caja... sin abrir el cuaderno.» | «Ahora sabés cuánto vendiste.» |
| 9 | 1:07 a 1:13 | Plano | Logo horizontal, eslogan y leyenda de herramientas (sin enlace ni «Hecho en Tinogasta», por decisión del autor). | «Pointer. Cada venta, en su lugar.» | «Cada venta, en su lugar.» |

**Notas**
- Las pantallas de las escenas 5 a 7 son una recreación animada con el estilo del sistema; los montos son de ejemplo. El sistema real se muestra en el video demo (4.3).
- Se evitaron frases que prometan algo que Pointer no hace (por ejemplo, vender sin conexión).
- La descripción del video en YouTube declara el uso de IA (voz) y la atribución «elevenlabs.io».

---

## Versión 1 (descartada): clips realistas con IA
**Idea:** un kiosquero de Tinogasta anota todo en un cuaderno y nunca sabe cuánto vendió. Con Pointer vende, cobra y cierra la caja sin cuaderno.
**Duración total:** 1:05 (65 s) · **Formato:** 1920×1080, 30 fps · **Tono:** voseo, frases cortas, como un compañero de mostrador (ver `documentacion/IDENTIDAD-MARCA.md`).
**Voz en off:** voz de catálogo de ElevenLabs (plan gratuito: uso no comercial y con atribución «elevenlabs.io» en la descripción del video). No se clona ninguna voz.
**Música:** instrumental suave, sin letra (Suno plan gratuito o Biblioteca de audio de YouTube). Se declara en la ficha.
**Montaje:** Remotion (código escrito con Claude Code, revisado por el autor) + clips generados con IA (Veo). Las escenas 4, 6, 7 y 9 son gráficos y capturas del sistema real hechos en Remotion; las escenas 1, 2, 3, 5 y 8 son clips generados con IA.

| Esc. | Tiempo | Plano e imagen | Prompt de generación | Audio | Texto en pantalla |
|---|---|---|---|---|---|
| 1 | 0:00 a 0:07 | **Plano general.** Amanecer en una calle de Tinogasta, casas de adobe, cerros al fondo. Un hombre levanta la persiana de su kiosco. | *(Clip IA)* Video realista de un hombre de unos 50 años levantando la persiana metálica de un kiosco pequeño al amanecer, en una calle de un pueblo del oeste catamarqueño con casas de adobe y cerros al fondo. Luz dorada de amanecer, cálida, baja y lateral. Cámara fija a la altura de los ojos, lente 35 mm, movimiento muy suave. Estilo fotográfico realista. Detalles en amarillo ámbar `#F59E0B`. Sin texto legible, sin logos ni marcas reales, manos con cinco dedos. | Voz en off: «Todos los días, lo mismo: abrís el kiosco y agarrás el cuaderno.» Música suave, entra. | — |
| 2 | 0:07 a 0:14 | **Primer plano.** Manos anotando ventas a lápiz en un cuaderno de tapa dura; una calculadora al lado. | *(Clip IA)* Video realista en primer plano de las manos de un hombre de unos 50 años anotando cifras con lápiz en un cuaderno de tapa dura sobre un mostrador de madera de un kiosco, con una calculadora a un lado. Luz natural de ventana, cálida, desde la izquierda. Cámara réflex, lente 50 mm, poca profundidad de campo. Estilo realista. Sin texto legible, sin logos ni marcas reales, manos con cinco dedos. | Voz en off: «Anotás cada venta. Sumás de memoria. Y al cerrar, la caja nunca da.» | — |
| 3 | 0:14 a 0:21 | **Plano medio.** El kiosquero mira el cuaderno lleno de tachaduras y se rasca la cabeza; estantes con golosinas genéricas atrás. | *(Clip IA)* Video realista, plano medio de un hombre de unos 50 años detrás del mostrador de un kiosco, mirando con gesto de duda un cuaderno lleno de tachaduras. Estantes con golosinas de envases genéricos sin marcas ni texto detrás. Luz de ventana, tarde cálida. Cámara fija, lente 35 mm. Estilo realista. Sin texto legible, sin logos ni marcas reales, manos con cinco dedos. | Voz en off: «¿Cuánto vendiste? ¿Qué se está acabando? Nadie lo sabe.» | «¿Y la plata de hoy?» |
| 4 | 0:21 a 0:26 | **Gráfico (Remotion).** Corte a fondo Negro profundo `#111827`; entra el isotipo amarillo y el nombre. | *(No es IA: animación en Remotion con el logo y la paleta de la marca.)* | Voz en off: «Para eso... está Pointer.» Un golpe suave de música. | «Pointer» |
| 5 | 0:26 a 0:34 | **Plano detalle.** Un lector de código de barras escanea un paquete; en una notebook se ve el punto de venta. | *(Clip IA)* Video realista en plano detalle de un lector de código de barras escaneando un paquete genérico sin marca sobre un mostrador, con una notebook al fondo desenfocada. Luz cálida de tarde, desde la izquierda. Cámara réflex, lente 50 mm, poca profundidad de campo. Estilo realista. Detalles en ámbar `#F59E0B`. Sin texto legible, sin logos ni marcas reales, manos con cinco dedos. | Voz en off: «Escaneás el producto. Pointer arma la venta y calcula el total.» | «Escaneá. Cobrá.» |
| 6 | 0:34 a 0:42 | **Captura animada (Remotion).** Pantalla real del punto de venta: carrito, total, cobro en efectivo, vuelto y aviso de venta registrada. | *(No es IA: grabación de pantalla del sistema real, animada en Remotion.)* | Voz en off: «Cobrás, ves el vuelto y listo. Cada venta queda guardada una sola vez.» | «Venta registrada» |
| 7 | 0:42 a 0:50 | **Captura animada (Remotion).** Pantalla real del cierre de caja: esperado, contado y diferencia. | *(No es IA: grabación de pantalla del sistema real, animada en Remotion.)* | Voz en off: «Al cerrar, la caja te dice si sobra o falta.» | «Caja con arqueo» |
| 8 | 0:50 a 0:58 | **Plano medio.** El kiosquero sonríe, guarda el cuaderno en un cajón y una clienta ficticia se va con su compra. | *(Clip IA)* Video realista, plano medio de un hombre de unos 50 años sonriendo detrás del mostrador de un kiosco mientras guarda un cuaderno en un cajón; una mujer joven ficticia sale del local con una bolsa. Luz cálida de tarde, entra por la puerta. Cámara fija, lente 35 mm. Estilo realista. Detalles en ámbar `#F59E0B`. Sin texto legible, sin logos ni marcas reales, manos con cinco dedos. | Voz en off: «Ahora sabés cuánto vendiste... sin abrir el cuaderno.» | — |
| 9 | 0:58 a 1:05 | **Cierre (Remotion).** Fondo claro, logo horizontal, eslogan y leyenda de transparencia. | *(No es IA: animación en Remotion.)* | Música baja y se apaga. | «Pointer · Cada venta, en su lugar.» · «Hecho en Tinogasta» · «Escenas generadas con IA» |

**Notas de producción**
- Los clips de IA duran unos 8 s cada uno: se recortan en Remotion para ajustar el tiempo de cada escena.
- Las escenas 6 y 7 usan capturas del sistema real publicado en `pointer-demo`, con datos de prueba (nada de datos reales de clientes).
- La escena 7 depende de que la funcionalidad 002 (caja y arqueo) esté terminada; si no llega, se reemplaza por una captura del historial de ventas.
- El eslogan «Cada venta, en su lugar.» era una propuesta en esta versión; el autor lo confirmó en noviembre de 2026 (`documentacion/IDENTIDAD-MARCA.md`).
- Cada clip, la voz y la música llevan su ficha en `multimedia/FICHAS-IA.md`, con el prompt final y las iteraciones.
- La descripción del video en YouTube declara el uso de IA y activa la etiqueta de contenido alterado o sintético.
