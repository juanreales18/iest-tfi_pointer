# Verificación · 001-punto-de-venta

Fecha: 2026-11-02 · Verificado por: agente (skill verificar-criterios) · Revisado por: autor

Versión verificada: commit `e0fb26e`, publicada en https://pointer-demo.netlify.app/ con `CACHE_VERSION` `kiosco-v-2026-11-02T15-45-00` y la base de Pointer.

**Origen de las pruebas manuales:** las hizo el autor en `pointer-demo` y las informó el 2026-11-02; el agente no las observó. Las pruebas de T11 a T13 fueron en Chrome con Supabase simulado.

## Tests

`npm test`: 102 pasan, 0 fallan (sin `todo` ni omitidos).

## Requisitos

| RF | Estado | Evidencia | Si falla: ¿código o spec? |
|---|---|---|---|
| RF-001-03 | ✅ Cumple | Tests «lector: RF-001-03 · …» y «stock: RF-001-03 · un producto nuevo entra con cantidad 1»; `sistema/js/pos.js:496`. Manual: lector físico | — |
| RF-001-04 | ✅ Cumple | Test «stock: RF-001-04 · un producto que ya está en el carrito suma 1»; `sistema/js/pos.js:256`. Manual: lector físico, producto repetido | — |
| RF-001-05 | ✅ Cumple | Tests «mensajes: RF-001-05 · …» y «lector: RF-001-05 · …»; `sistema/js/pos.js:510`. Manual: lector físico, código inexistente | — |
| RF-001-06 | ✅ Cumple | Tests «catálogo: RF-001-06 · …», incluido «con 2.000 productos filtra en menos de 100 ms»; `sistema/js/pos.js:189`. Manual: buscador en la PC del mostrador (ver nota 1) | — |
| RF-001-07 | ✅ Cumple | Test «stock: RF-001-07 · elegir de la lista sigue las mismas reglas»; `sistema/js/pos.js:256` | — |
| RF-001-09 | ✅ Cumple | Tests «stock: RF-001-09 · …» y «stock: caso límite 3 · …»; `sistema/js/pos.js:256` y `:299` | — |
| RF-001-10 | ✅ Cumple | Test «totales: RF-001-10 · cambiar la cantidad recalcula el total»; `sistema/js/pos.js:304-305` | — |
| RF-001-11 | ✅ Cumple | Tests «totales: RF-001-11 · …»; `sistema/js/pos.js:282-286` | — |
| RF-001-12 | ✅ Cumple | Tests «cobrar: RF-001-12 · …»; `sistema/js/pos.js:320` y `:432` | — |
| RF-001-14 | ✅ Cumple | Test «costos: RF-001-14 · pos.js no contiene precio_costo». Manual con sesión de empleado: pedido directo a la API da 403 y Red no lo muestra al abrir el POS | — |
| RF-001-16 | ✅ Cumple | Tests «mensajes: RF-001-16 · sinMetodo» y «cobrar: RF-001-16 · …»; `sistema/js/pos.js:673` (ver nota 2) | — |
| RF-001-19 | ✅ Cumple | Tests «cobro: RF-001-19 · pos.js solo llama a rpc(crear_venta)» y «capas: no hay insert directo en ventas ni detalle_ventas»; `sistema/js/pos.js:704` | — |
| RF-001-24 | ✅ Cumple | Tests «errores: RF-001-24 · …»; `sistema/js/pos.js:739` (el `catch` no vacía el carrito). Manual: red cortada, reintento y una sola venta | — |
| RF-001-26 | ✅ Cumple | Tests «errores: RF-001-26 · …»; `sistema/js/pos.js:715` y `:739`. Manual: sin stock, caja cerrada desde otra PC y producto desactivado | — |
| RF-001-42 | ✅ Cumple | Tests «totales: RF-001-42 · …»; `sistema/js/pos.js:412`. Manual: total en pantalla igual al del ticket, con centavos | — |

### Notas

1. **RF-001-06:** el test mide 2.000 productos en Node, no en la PC del mostrador. El autor informó que el buscador anduvo bien ahí, sin indicar el tiempo ni cuántos productos había.
2. **RF-001-16:** con «Efectivo» activo, queda elegido al abrir y no se puede desmarcar, así que el mensaje solo aparece si no hay «Efectivo». El código y los tests lo cumplen, pero no consta que el mensaje se haya visto en `pointer-demo`.

## Constitución

Archivos revisados (desde `249f0a5`, primer commit de la spec): `sistema/js/pos-logica.js`, `sistema/js/pos.js`, `sistema/pos.html`, `sistema/sw.js`, `tests/pos-logica.test.js` y `tests/punto-de-venta.test.js`.

| Principio | Resultado | Detalle |
|---|---|---|
| P2 · Marca | ✅ OK | Test «marca: no se agregan colores escritos a mano fuera de :root»; el diff de `sistema/` no agrega colores |
| P3 · Capas | ✅ OK | El navegador calcula el total solo para mostrarlo; los importes oficiales vuelven de `crear_venta` (`sistema/js/pos.js:718-725`) |
| P5 · Seguridad | ✅ OK | Tests «seguridad: …». `revisar-seguridad`: sin secretos, sin `precio_costo` en `pos.js`, HTML con `escapeHtml()` en los datos de usuario o base, sin cambios en `base-de-datos/` |
| P7 · Accesibilidad | 🟡 Observación | Test «accesibilidad: todas las imágenes tienen alt» y `alt` en `sistema/js/pos.js:224`. Los botones de cierre de `sistema/pos.html:217`, `:233` y `:255` tienen solo un ícono, sin texto accesible. Ya estaban: esta spec solo agregó un `<script>` a ese archivo |

## Criterios de finalización

- [x] Cada RF activo tiene al menos un test automático o una prueba manual descrita en `verificacion.md`. Ver «Requisitos».
- [x] `npm test` termina en verde. 102 de 102.
- [x] No existe `.from('ventas').insert` ni `.from('detalle_ventas').insert` en `sistema/`. Test «capas: no hay insert directo en ventas ni detalle_ventas».
- [x] Con el lector real: escanear 3 productos (uno repetido), cobrar y ver en la base la venta con el total que mostró la pantalla. Prueba del autor en `pointer-demo`, informada el 2026-11-02.
- [x] Cortar la red al tocar «Cobrar»: sale el mensaje de RF-001-24 y el carrito sigue en pantalla. Prueba del autor en `pointer-demo`.
- [x] Con la sesión de un `empleado`, `precio_costo` no aparece en la pantalla ni en las respuestas de red del POS. Prueba del autor en `pointer-demo`, al abrir el POS y después de un cobro, informada el 2026-11-02.
- [x] En `pointer-demo`, con la sesión de un `empleado`, pedir `precio_costo` de `productos` directo a la API devuelve un error de permiso. El autor obtuvo 403 con `data: null`.
- [x] Los mensajes de esta spec aparecen en voseo, con tildes y tal cual están escritos acá. Tests «mensajes: …». «El carrito esta vacio» y «La caja esta cerrada» (`sistema/js/pos.js:671-672`) no son mensajes de esta spec.
- [x] `CACHE_VERSION` de `sistema/sw.js` subió si cambió algo de `sistema/`. El sitio publicado sirve la versión nueva.

## Pruebas manuales pendientes

Ninguna. El autor informó el 2026-11-02 que hizo el flujo completo con lector, Red y consulta en la base, y que todo salió bien.

## Conclusión

15 de 15 RF cumplen y ninguno da «No cumple». Criterios de finalización: 9 de 9. El autor cerró la spec el 2026-11-02.
