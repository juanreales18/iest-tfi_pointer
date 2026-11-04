# Declaración de uso de IA (Anexo IV)

| Parte del trabajo | Herramienta | Para qué se usó | Qué hizo el estudiante |
|---|---|---|---|
| Specs | Claude Code (comandos `/spec` y `/clarificar`, skill `escribir-ears`) | Entrevista para armar cada spec, redacción en EARS y revisión como QA | Respondió la entrevista, decidió cada requisito y resolvió cada hallazgo de la clarificación |
| Constitución y arnés | Claude Code | Borrador de la constitución, AGENTS.md, CLAUDE.md, memory.md, comandos y skills | Eligió el nombre, el editor y las herramientas; revisó y aprobó cada principio |
| Código | Claude Code + VS Code | Propuestas de cambios, funciones SQL y tests | Leyó cada diff en VS Code, probó en el sistema publicado y aprobó o rechazó cada cambio |
| Base de datos | Claude Code con el conector de Supabase | Consultas de diagnóstico y migraciones probadas en transacciones que se deshacen | Ejecutó a mano los cambios que borran datos o quitan permisos |
| Publicación y calidad | Claude Code | Colores a variables, títulos y descripciones, `canonical`, nombres accesibles | Aprobó cada edición a mano, publicó en Netlify, probó el login en incógnito y corrió Lighthouse |
| Acompañamiento | Claude (chat) | Guía de las actividades, revisión de lo que proponía Claude Code y redacción de documentos | Decidió qué aceptar de cada propuesta y en qué orden trabajar |
| Logo | Canva (IA de diseño), desde Claude | Opciones de logo y ajustes de color y tamaño | Eligió la opción en cada ronda, revisó los ajustes y exportó el archivo final |
| Spot promocional | Remotion, con código escrito por Claude | Animación de 73 s con escenas 2D, 3D e isométricas | Eligió el estilo, aprobó cada escena del storyboard, pidió los cambios de cada versión |
| Voz en off | ElevenLabs (voz de catálogo, plan gratuito) | Narración del spot | Eligió la voz y una toma por frase; generó y descargó las últimas frases |
| Música y efectos | Código Python escrito por Claude | Música de fondo y efectos sin muestras de terceros | Pidió el ajuste de volumen y aprobó la mezcla |
| Gráficos | Python (matplotlib), código escrito por Claude | 4 gráficos con datos reales del repositorio | Revisó los datos y la fuente de cada gráfico |
| Imágenes | Google Gemini (Nano Banana), con prompts preparados por Claude; mockups montados por el autor en Photopea (un primer montaje con un script de Python se descartó) | 8 imágenes fotorrealistas del kiosco, 2 de ellas mockups con capturas reales de Pointer | Corrigió los prompts con referencias de Google Street View de Tinogasta, generó y revisó cada imagen con la Tabla 3, descartó la que no cumplía y tomó las capturas del sistema |
| Video demo | — (sin IA) | Recorrido de 4:30 por las secciones del sistema | Grabó la pantalla, narró con su voz y editó el video |
| Informe | Claude (chat) | Borrador del informe a partir de los documentos del repositorio | Revisó, corrigió y aprobó el texto final |

## Riesgos del uso de IA y cómo se mitigaron

| N° | Riesgo | Dónde apareció | Mitigación aplicada | Evidencia |
|---|---|---|---|---|
| R1 | **Código o documentos incorrectos aceptados sin revisar** | La IA se equivocó al menos 11 veces durante el proyecto (por ejemplo, una función SQL que PostgreSQL rechazaba y un texto con poco contraste) | Cada edición se aprueba a mano (nunca en modo automático), `npm test` corre antes de cada commit y cada error queda registrado | `documentacion/PROMPTS.md` (E-01 a E-11), 293 tests en verde |
| R2 | **Privacidad y datos de terceros** | La IA consultó la base de un cliente creyendo que era la de Pointer (E-06) | Se separaron las bases en `memory.md` y en las specs; la IA no recibe contraseñas ni claves; los cambios que borran datos los ejecuta el autor | `documentacion/PROMPTS.md` (E-06), principio P8 |
| R3 | **Datos inventados** en gráficos o en el informe | Riesgo propio de pedirle números a una IA | Los gráficos se arman con datos del repositorio y llevan la fuente al pie; cuando la fuente estaba mal escrita, se corrigió | `multimedia/graficos/`, Figuras 5 a 8 de `FICHAS-IA.md` |
| R4 | **Voz sintética y licencias** | La voz de ElevenLabs suena como una persona real; el plan gratuito no permite uso comercial | Voz de catálogo (sin clonar a nadie), atribución «elevenlabs.io» en el video y en YouTube, uso académico y no monetizado | Cierre del spot, Figura 2 de `FICHAS-IA.md` |
| R5 | **Sesgo en la representación de personas** | En el spot el kiosquero es un hombre y quien compra es una mujer, lo que repite un estereotipo del comercio de barrio | Se registró al revisar el spot. En las imágenes fotorrealistas se representan tres mujeres y dos hombres de entre 25 y 60 años, como dueñas, dueños y empleados | Figuras 9 a 16 de `FICHAS-IA.md` y tabla de personas de `multimedia/imagenes/PROMPTS-IMAGENES.md` |
| R6 | **Que el público no sepa qué hizo la IA** | Piezas que parecen hechas a mano o grabadas | Leyenda «Generado con IA» en cada pieza, ficha en `FICHAS-IA.md` y etiqueta de contenido sintético en YouTube | Epígrafes del sitio, cierre del spot, descripción del video |
| R7 | **Una imagen que no representa el lugar real** | La primera imagen mostraba un pueblo antiguo, seco y con autos viejos, que no es Tinogasta | El autor revisó el lugar en Google Street View y corrigió los prompts; la imagen se descartó y se rehízo | Figura 9 de `FICHAS-IA.md` |

## Dónde están las etiquetas «Generado con IA»

- **Spot:** leyenda en la escena final y en la descripción de YouTube, con la etiqueta de contenido alterado o sintético activada.
- **Sitio:** epígrafe debajo de cada pieza en la página de presentación, copiado de su ficha.
- **Informe:** epígrafe de cada figura, con el número de ficha.

Declaro que leí, revisé y comprendo todo el código y el contenido entregado; que las piezas generadas con IA están identificadas como tales; que no utilicé la imagen, la voz ni los datos de personas reales sin su consentimiento; y que puedo explicar y defender cada decisión tomada en este trabajo.

Firma y aclaración: ______________________________ · Juan Angel Reales
