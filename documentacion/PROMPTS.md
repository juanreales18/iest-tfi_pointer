# Registro de prompts y errores de la IA

> Los pedidos más importantes hechos al agente y, como mínimo, **tres casos en los que la IA se equivocó**: qué hizo mal, cómo se detectó y cómo se corrigió. Se completa durante todo el proyecto (Actividad 2).

## Prompts importantes

| N° | Fecha | Fase / spec | Prompt (resumido) | Resultado y decisión del autor |
|---|---|---|---|---|
| P-01 | 2026-10 | Auditoría previa al TFI | «Revisá el código del sistema y fijate si se duplican ventas y si la caja da bien.» | La IA encontró que la venta se guardaba en dos pasos desde el navegador y podía quedar a medias o duplicada. El autor aprobó crear la función `crear_venta` en la base. |
| P-02 | 2026-10 | Caja | «Hice una venta por transferencia de $4.000 y la caja quedó en 0.» | La IA explicó que era por diseño (la caja cuenta solo efectivo) y propuso cambiar los textos; el autor eligió eso en lugar de cambiar la lógica. |
| P-03 | 2026-10 | Reportes | «Corregí los descuentos en Rentabilidad.» | Ventas netas = brutas − descuentos; la IA además cambió la consulta para no armar listas de ids en la URL. |
| P-04 | 2026-10 | Actividad 1 | «Empecemos por la actividad 1, ya tenemos el sistema.» | Se armó el repositorio con constitución, arnés, comandos y skills. El autor eligió el nombre Pointer y Claude Code + VS Code. |
| P-06 | 2026-11-03 | Actividad 3 | «Borrá las leyendas de IA de la página de presentación.» | La IA frenó porque chocaba con P8, la Declaración y la atribución que pide ElevenLabs, y propuso una sola nota al pie. El autor la eligió. |
| P-05 | 2026-11-03 | Actividad 3 | «Página de presentación de Pointer. Hacela de una, sin plan previo ni preguntas: si algo no está claro, decidí lo más razonable y anotalo al final.» | La IA hizo `presentacion.html` con un commit y sin spec, como pidió el autor. La lista de lo que decidió sola y de lo que el autor tiene que revisar queda en `memory.md`. |

## Errores de la IA

### E-01 · Interlineado del informe del TP N° 3
- **Qué hizo mal:** aplicó interlineado de 1,5 a todo el texto, cuando la consigna pedía interlineado sencillo y **1,5 entre párrafos**.
- **Cómo se detectó:** el autor comparó el Word con las pautas de presentación.
- **Cómo se corrigió:** se cambió a interlineado sencillo con espacio posterior entre párrafos y se volvió a generar el documento.

### E-02 · Primer borrador de `crear_venta`
- **Qué hizo mal:** usó `FOR UPDATE` (bloqueo de filas) en una consulta con `GROUP BY`, algo que PostgreSQL no permite.
- **Cómo se detectó:** la base rechazó la función al crearla.
- **Cómo se corrigió:** se agruparon las cantidades primero en un JSON y se bloqueó cada producto en un bucle aparte.

### E-03 · Afirmación incorrecta sobre los totales
- **Qué hizo mal:** afirmó que cualquiera podía cambiar libremente el precio de una venta desde el navegador.
- **Cómo se detectó:** al revisar las políticas de seguridad, la propia verificación mostró que la base sí controlaba el precio unitario (pero no el total).
- **Cómo se corrigió:** se rectificó el diagnóstico y el problema real (el total) se resolvió calculándolo en el servidor.

### E-04 · Reinicio de stock en las compras
- **Qué hizo mal:** la función original de compras actualizaba el stock con un `UPDATE … FROM` que, si un producto venía en dos líneas, sumaba solo una.
- **Cómo se detectó:** revisando el código de Compras a pedido del autor; se reprodujo con una prueba dentro de una transacción (3 + 2 unidades sumaban 3).
- **Cómo se corrigió:** la función agrupa por producto antes de sumar y el formulario junta las líneas repetidas. La prueba dio 5.

### E-05 · Escaneo y búsqueda en la spec 001 (H-06)
- **Qué hizo mal:** en `/clarificar` propuso tomar como código **todo** Enter con 3 o más caracteres, vinieran del lector o del teclado. Eso rompía la búsqueda a mano: escribir «coca» y apretar Enter mostraba «No encontramos ese producto».
- **Cómo se detectó:** el autor leyó la consecuencia en el resumen de la clarificación y pidió que el buscador aceptara las dos formas.
- **Cómo se corrigió:** un texto escrito igual a un `codigo_barra` agrega el producto; si no coincide, queda como búsqueda y no avisa. El aviso de código inexistente se muestra solo para el lector, que se reconoce por la velocidad (menos de 50 ms entre teclas). Se reescribieron RF-001-03 a RF-001-05 y se agregó RF-001-45.

### E-06 · Consulta a la base de un cliente en la T14
- **Qué hizo mal:** tomó «Kiosco Web» como la base de Pointer porque el sitio publicado y `memory.md` la nombraban, y le hizo tres consultas de solo lectura al catálogo sin preguntar, aunque los HTML del repositorio apuntaban a otra base. También recomendó ejecutar ahí `10-ocultar-costos.sql`.
- **Cómo se detectó:** el agente avisó de la diferencia entre el sitio y el repositorio; el autor preguntó de qué cuenta salía esa base y aclaró que era de un cliente.
- **Cómo se corrigió:** no se cambió nada en esa base y se retiró la recomendación. La spec 001 y `memory.md` ahora nombran el sitio y la base de Pointer; el autor comprobó los permisos desde su panel.

### E-07 · Consulta sin paréntesis en la T01 de la spec 002
- **Qué hizo mal:** escribió `'public.cajas_guard'::regprocedure` en `tasks.md` y en el chat sin haberla probado. Ese tipo exige los paréntesis de la función, así que PostgreSQL respondió `expected a left parenthesis`.
- **Cómo se detectó:** el autor ejecutó la consulta en el panel y pegó el error. No se cambió ningún dato.
- **Cómo se corrigió:** la consulta pasó a `'public.cajas_guard()'::regprocedure` en `tasks.md`, en el mismo commit de la T01.

### E-08 · Pruebas de la caja que no detectaban los pasos 8 y 9
- **Qué hizo mal:** escribió `tests/sql/caja-guard.sql` sin ninguna prueba que distinguiera lo que puede el dueño de lo que no puede el empleado. Sin los pasos 8 y 9 del guard, el script seguía dando todo verde.
- **Cómo se detectó:** el propio agente, en la T13, al sacar cada paso del guard de a uno en PGlite. El autor no llegó a correrlo en ese estado.
- **Cómo se corrigió:** el script sumó 7 corridas, y sin esos pasos ahora fallan. Los pasos 1, 2 y 4 a 7 se midieron antes de sumarlas y no se volvieron a medir.

### E-09 · Test mal escrito en la T19 de la spec 002
- **Qué hizo mal:** el test pedía un solo espacio en `fila.saldo_actual ?? 0`, y el código alinea con dos, como el resto del archivo. Además, el primer arreglo con `sed` no cambió la línea y dio otra corrida en rojo.
- **Cómo se detectó:** `npm test` siguió en rojo después de escribir el código. El agente leyó el mensaje real del test.
- **Cómo se corrigió:** el test acepta la alineación. No cambió el código ni se hizo commit en rojo.

### E-10 · Poco contraste en el resumen de cierre
- **Qué hizo mal:** en la T20 usó `--color-success` y `--color-danger` como color de texto sobre blanco. Dan unos 2,5:1 y 3,8:1, por debajo de lo que pide P7. Lo mencionó como algo para mirar, sin calcularlo.
- **Cómo se detectó:** el propio agente, en la verificación de la T27. El autor había aprobado la tarea sin que el contraste estuviera calculado.
- **Cómo se corrigió:** el resultado pasó a texto oscuro sobre `--color-success-light` y `--color-danger-light`, en la T28.

### E-11 · Decir que estos errores no se registraban
- **Qué hizo mal:** en la T25 le dijo al autor que `PROMPTS.md` no correspondía porque el autor no había marcado errores. P8 pide registrar cada error de la IA, lo detecte quien lo detecte.
- **Cómo se detectó:** el propio agente, al revisar P8 en la T27.
- **Cómo se corrigió:** se registraron E-08 a E-11. `AGENTS.md` sigue diciendo «que el autor detecte», y eso llevó a la confusión; P8 es más amplio y manda, así que el agente también anota los que detecta solo.

> Durante la Actividad 2 se agregan los errores nuevos con el mismo formato.
