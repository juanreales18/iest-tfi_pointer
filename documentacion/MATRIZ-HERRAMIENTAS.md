# Matriz de selección de herramientas de IA (Anexo I)

> Elección fundamentada a partir de lo investigado en el TP N° 2 (cómo las empresas construyen, entrenan y venden sus modelos). Las condiciones de uso se revisaron en octubre de 2026 y **pueden cambiar**: antes de generar cada pieza se vuelven a leer los términos vigentes.
>
> Las filas marcadas con *(a confirmar)* son la elección propuesta; si al producir la pieza se usa otra herramienta, se corrige esta tabla y la ficha en `multimedia/FICHAS-IA.md`.

| Uso | Herramienta y modelo | Empresa y plan | Motivo de la elección | Riesgos y mitigación |
|---|---|---|---|---|
| **Programación (agente)** | Claude Code con modelos Claude (Sonnet / Opus), en modo plan | Anthropic · plan pago de Claude del autor | Lee el repositorio completo, respeta `AGENTS.md`, `CLAUDE.md`, comandos y skills del proyecto; trabaja con terminal, Supabase y Netlify; permite planificar antes de editar | Cambios en muchos archivos a la vez → modo plan, una tarea por conversación y revisión del diff en VS Code antes de aceptar. Comandos destructivos → nunca con permiso permanente |
| **Editor y revisión** | Visual Studio Code | Microsoft · gratuito | El autor lee cada archivo que cambia, compara diffs con Git y corre `npm test` | Aceptar sin leer → regla P8 de la constitución: nada entra sin revisión humana |
| **Specs y documentación** | Claude (mismo agente, comandos `/spec` y `/clarificar`) | Anthropic · plan pago | La entrevista y la revisión como QA siguen las skills del proyecto (`escribir-ears`) | Requisitos inventados → el agente pregunta antes de escribir; el autor decide cada hallazgo en `clarificacion.md` |
| **Base de datos** | Conector de Supabase usado por el agente (consultas y migraciones) | Supabase · plan gratuito | Permite inspeccionar tablas, políticas y probar funciones dentro de transacciones que se deshacen | Cambios destructivos en producción → las operaciones que borran o quitan permisos las ejecuta el autor a mano, después de leerlas |
| **Imágenes** *(a confirmar)* | Google Gemini (generación de imágenes) | Google · plan gratuito | Buen realismo fotográfico y edición por instrucciones; permite iterar sobre la misma imagen para mantener coherencia de personajes y local | Manos, carteles y textos deformados → revisión con la Tabla 3; Google agrega marca de agua invisible (SynthID): se declara igual con la leyenda «Generado con IA» |
| **Video** *(a confirmar)* | Google Veo (desde Gemini o Flow) | Google · plan gratuito con cupo limitado de videos | Clips cortos realistas a partir de texto o de una imagen ya aprobada, lo que ayuda a mantener la coherencia de marca | Cupo chico → guion técnico cerrado antes de generar (Anexo II); clips con errores físicos → se descartan y se registra la iteración |
| **Voz en off** *(a confirmar)* | ElevenLabs (texto a voz, voz de catálogo) o la voz del propio autor | ElevenLabs · plan gratuito | Voz natural en español | El plan gratuito **no permite uso comercial y exige atribución** («elevenlabs.io»): el video es académico y no monetizado, y la atribución va en la descripción. Nunca se clona la voz de una persona real |
| **Música** *(a confirmar)* | Suno (plan gratuito) o Biblioteca de audio de YouTube | Suno · plan gratuito / Google · gratuito | Música de fondo propia para el spot | En el plan gratuito de Suno **la canción es de Suno y solo se puede usar sin fines comerciales**: alcanza para el TFI; si Pointer se usa en publicidad real, se cambia por música de la biblioteca de YouTube o de un plan pago |
| **Edición de video** *(a confirmar)* | CapCut | ByteDance · gratuito | Subtítulos automáticos, montaje y exportación para YouTube | Plantillas con logos o música de terceros → no se usan; subtítulos automáticos → se corrigen a mano |
| **Gráficos e infografía** | Claude (genera el código de los gráficos con Chart.js o Python) | Anthropic · plan pago | Los gráficos salen de **datos reales del repositorio** (`git log`, `tasks.md`, `verificacion.md`), así se pueden verificar | Datos inventados = falta grave → el script lee los datos del repositorio y queda guardado en `multimedia/graficos/` junto al gráfico |

## Criterios usados para elegir

1. **Revisión humana posible:** que el resultado se pueda leer, comparar y corregir antes de usarlo.
2. **Licencia compatible:** que el plan permita el uso que se le va a dar (académico, no monetizado) y que se pueda declarar.
3. **Coherencia de marca:** que permita iterar sobre una misma imagen o personaje.
4. **Costo:** planes gratuitos siempre que alcancen; el único pago es el plan de Claude que el autor ya usa.
5. **Privacidad:** ninguna herramienta recibe datos reales de clientes, contraseñas ni claves (principio P8).
