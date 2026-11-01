# Registro de prompts y errores de la IA

> Los pedidos más importantes hechos al agente y, como mínimo, **tres casos en los que la IA se equivocó**: qué hizo mal, cómo se detectó y cómo se corrigió. Se completa durante todo el proyecto (Actividad 2).

## Prompts importantes

| N° | Fecha | Fase / spec | Prompt (resumido) | Resultado y decisión del autor |
|---|---|---|---|---|
| P-01 | 2026-10 | Auditoría previa al TFI | «Revisá el código del sistema y fijate si se duplican ventas y si la caja da bien.» | La IA encontró que la venta se guardaba en dos pasos desde el navegador y podía quedar a medias o duplicada. El autor aprobó crear la función `crear_venta` en la base. |
| P-02 | 2026-10 | Caja | «Hice una venta por transferencia de $4.000 y la caja quedó en 0.» | La IA explicó que era por diseño (la caja cuenta solo efectivo) y propuso cambiar los textos; el autor eligió eso en lugar de cambiar la lógica. |
| P-03 | 2026-10 | Reportes | «Corregí los descuentos en Rentabilidad.» | Ventas netas = brutas − descuentos; la IA además cambió la consulta para no armar listas de ids en la URL. |
| P-04 | 2026-10 | Actividad 1 | «Empecemos por la actividad 1, ya tenemos el sistema.» | Se armó el repositorio con constitución, arnés, comandos y skills. El autor eligió el nombre Pointer y Claude Code + VS Code. |

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

> Durante la Actividad 2 se agregan los errores nuevos con el mismo formato.
