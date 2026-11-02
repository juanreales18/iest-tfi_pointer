# Plan 001 · Punto de venta

> **Estado:** aprobado por el autor · **Fecha:** 2026-11-01 · **Actualizado:** 2026-11-01 (alcance reducido al núcleo del cobro, ver el historial de `spec.md`)
> **Entrada:** `spec.md` (15 RF activos) y `clarificacion.md`.
> **Fuentes leídas:** `documentacion/CONSTITUCION.md`, `04-ARQUITECTURA.md`, `05-DATOS.md`, `10-SEGURIDAD.md`, `crear_venta` en `base-de-datos/00-estructura.sql`, `sistema/js/pos.js`, `sistema/pos.html`, `sistema/sw.js` y `tests/constitucion.test.js`.
> Este plan **no tiene código**: dice qué archivo cambia, qué función se crea o se modifica y cómo se prueba.

## 1. Resumen

El punto de venta ya funciona. Este plan lo lleva a cumplir el núcleo de la spec con dos cambios:

1. **Navegador:** la lógica que decide (qué es un escaneo, si un producto se puede agregar, cuánto da el total, qué mensaje mostrar) sale de `pos.js` a un archivo nuevo **sin acceso al DOM ni a la base**, para poder probarla con `npm test`.
2. **Tests:** dos archivos de `node --test`.

**La base no cambia:** ningún RF activo pide tocar `crear_venta`, tablas, triggers ni RLS.

## 2. Decisiones de diseño

| ID | Decisión | Por qué | Principio |
|---|---|---|---|
| D1 | Archivo nuevo **`sistema/js/pos-logica.js`** con funciones puras (sin DOM, sin `window._supabase`). Se publica como `window.PosLogica` en el navegador y como `module.exports` en Node. `pos.js` las usa; `tests/pos-logica.test.js` las prueba. | Hoy toda la lógica está dentro de `DOMContentLoaded` y no se puede probar sin navegador. Así se prueba sin agregar dependencias. | P4 · P1 |
| D2 | El total que muestra la pantalla se calcula **en centavos enteros** y se redondea igual que `round(…, 2)` de PostgreSQL (mitad lejos del cero). | RF-001-42 pide mostrar el mismo total que va a guardar `crear_venta`. | P3 (la base decide; la pantalla solo la imita para mostrar) |
| D8 | El botón «Cobrar» **no** se deshabilita por falta de método de pago. | Si quedara deshabilitado, RF-001-16 («tocar Cobrar sin método → mensaje») no se podría cumplir. | P6 |
| D9 | Los textos de la pantalla que pide la spec quedan en **una constante `MENSAJES`** dentro de `pos-logica.js`. | Un test compara cada texto contra la spec, letra por letra. | P6 · P4 |
| D12 | **No se toca la base**: ni `crear_venta`, ni tablas, ni triggers, ni RLS. | Lo que pedía cambios en la base pasó a mejoras futuras. | P3 · P5 |

D3 a D7, D10 y D11 eran de RF que pasaron a mejoras futuras; se retoman cuando vuelvan esos RF.

## 3. Cambios en la base de datos

Ninguno. **Dependencia de la spec:** `base-de-datos/10-ocultar-costos.sql` lo ejecuta el autor en producción (RF-001-14). El plan no lo modifica.

## 4. Cambios en `sistema/`

| Archivo | Qué cambia |
|---|---|
| `sistema/js/pos-logica.js` (ya creado en T02) | Funciones puras y `MENSAJES` (ver tabla de abajo). |
| `sistema/js/pos.js` | Usa `PosLogica` en el lector, la búsqueda, el carrito, el total, el botón «Cobrar» y los errores. Saca `precio_costo` del carrito y de la consulta de productos. |
| `sistema/pos.html` | Carga `js/pos-logica.js` **antes** de `js/pos.js`. |
| `sistema/sw.js` | Agrega `/js/pos-logica.js` a la lista de archivos. `CACHE_VERSION` se sube una sola vez, antes de publicar. |

### Funciones de `pos-logica.js`

| Función | Qué decide | RF | Estado |
|---|---|---|---|
| `MENSAJES` | Los textos de la spec en un solo lugar. Ya tiene también los de algunos RF de mejoras futuras; se dejan para cuando vuelvan. | 05, 09, 16, 24 | Hecha (T02) |
| `clasificarEntrada(texto, intervalosMs)` | Si un Enter es **escaneo** (3+ caracteres, todos con menos de 50 ms entre teclas) o **texto escrito**. | 03, 04, 05 | Hecha (T04) |
| `buscarPorCodigo(productos, texto)` | Producto activo con `codigo_barra` **exactamente** igual. El nombre no cuenta. | 03, 04, 05 | Hecha (T04) |
| `filtrarCatalogo(productos, texto)` | Activos cuyo nombre o código contienen el texto, sin distinguir mayúsculas ni marcas sobre las letras y sin los espacios de los bordes. Vacío o solo espacios: todos los activos. Tolera `codigo_barra: null`. | 06, 07 | Tests hechos (T05) |
| `validarAgregado(producto, carrito)` | Si se puede sumar una unidad (nuevo con cantidad 1 o +1 si ya está) o, si se supera el stock, «Stock disponible: N». | 03, 04, 07, 09 | |
| `validarCantidad(cantidad, anterior, stock)` | Si la cantidad nueva supera el stock: vuelve a la anterior con «Stock disponible: N». Los valores no válidos (RF-001-38) siguen como hoy en `pos.js`. | 09, 10 | |
| `calcularTotales(carrito, descuentoPct, impuestoPct)` | Subtotal, impuesto y total en centavos, con el redondeo de la base (D2). El descuento se mantiene porque `pos.js` lo usa, aunque los descuentos están fuera de alcance. | 10, 11, 42 | |
| `puedeCobrar(estado)` | Habilitado solo si el carrito tiene productos; no depende del método (D8). | 12 | |
| `mensajeDeError(error, enLinea)` | Sin conexión → mensaje de RF-001-24; si no, el texto que devuelve la base. | 24, 26 | |

## 5. Tests

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `tests/pos-logica.test.js` | `node --test`, automático | Cada función de `pos-logica.js` con los casos de la spec y los casos límite 1, 2, 3 y 8. Rendimiento de `filtrarCatalogo` con 2.000 productos de prueba. |
| `tests/punto-de-venta.test.js` (**nuevo**) | `node --test`, automático, lee archivos | `pos.js` no contiene `precio_costo` (14); solo llama a `rpc('crear_venta')` (19); `pos.html` carga `pos-logica.js` antes de `pos.js`; `sw.js` lista `pos-logica.js`. |
| `tests/constitucion.test.js` | Ya existe, sin cambios | Sin insert directo en `ventas` (19), sin scripts de CDN (P1), sin colores a mano (P2), imágenes con `alt` (P7). |
| Pruebas manuales | En `verificacion.md` | Lector real, red cortada, rechazos de la base (casos límite 4, 5 y 6), sesión de empleado sin `precio_costo` en la red ni en la API (14), rendimiento en la PC del mostrador (06). |

Como ahora cada tarea trae su test y su código juntos, ya no hace falta la regla de los `{ todo: true }`: el test se escribe primero, se ve fallar y se pone en verde dentro de la misma tarea, antes del commit.

## 6. Detalle por requisito

### Agregar productos

- **RF-001-03 / RF-001-04** · `pos-logica.js` (`clasificarEntrada`, `buscarPorCodigo`, `validarAgregado`), `pos.js` (`setupSearch`: guarda la hora de cada tecla y deja de aceptar el nombre exacto como código). Test: `pos-logica.test.js` (cantidad 1; si ya está, suma 1; nombre exacto no agrega; casos límite 1, 2 y 8).
- **RF-001-05** · Mismas funciones; el aviso sale solo si `clasificarEntrada` dice escaneo. Test: `pos-logica.test.js`.
- **RF-001-06** · `pos-logica.js` (`filtrarCatalogo`), `pos.js` (`filtrarProductos`). Test: `pos-logica.test.js` (T05) + prueba manual en la PC del mostrador. P7.
- **RF-001-07** · `pos.js` (`crearTarjetaProducto` usa `validarAgregado`). Test: `pos-logica.test.js` (mismas reglas que 03/04).
- **RF-001-09** · `pos-logica.js` (`validarAgregado`, `validarCantidad`): el mensaje pasa a «Stock disponible: N» también al escanear y con stock 0 (caso límite 3). Test: `pos-logica.test.js`.

### Carrito y total

- **RF-001-10 / RF-001-11** · `pos-logica.js` (`calcularTotales`), `pos.js` (`cambiarCantidad`, `quitarDelCarrito`). Test: `pos-logica.test.js`.
- **RF-001-42** · `pos-logica.js` (`calcularTotales`, D2). Test: `pos-logica.test.js` (medio centavo, impuesto 0 y 21 %).
- **RF-001-14** · `pos.js` (sacar `precio_costo` del carrito y de la consulta). Test: `punto-de-venta.test.js` + prueba manual con sesión de empleado. Dependencia: `10-ocultar-costos.sql`. P5.

### Cobro

- **RF-001-12** · `pos-logica.js` (`puedeCobrar`), `pos.js` (estado del botón). Test: `pos-logica.test.js`.
- **RF-001-16** · `pos.js` (`procesarVenta`), `MENSAJES`, D8. Test: `pos-logica.test.js` (`puedeCobrar` habilitado sin método; texto del mensaje).
- **RF-001-19** · Ya cumple. Test: `constitucion.test.js` + `punto-de-venta.test.js`. P3.

### Errores al cobrar

- **RF-001-24** · `pos-logica.js` (`mensajeDeError`), `pos.js` (`procesarVenta`: el carrito no se toca). Test: `pos-logica.test.js` + prueba manual con la red cortada.
- **RF-001-26** · `pos-logica.js` (`mensajeDeError` deja pasar el texto de la base), `pos.js`. Test: `pos-logica.test.js` + prueba manual (casos límite 4, 5 y 6).

## 7. Tabla RF → archivos → test

| RF | Archivos | Test |
|---|---|---|
| 03, 04 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 05 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 06 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual en la PC del mostrador |
| 07 | `pos.js` | `pos-logica.test.js` |
| 09 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 10, 11 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 42 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 14 | `pos.js` (+ `10-ocultar-costos.sql` en producción) | `punto-de-venta.test.js` + manual con sesión de empleado |
| 12 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 16 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` |
| 19 | `pos.js` (sin cambios) | `constitucion.test.js`, `punto-de-venta.test.js` |
| 24 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual (red cortada) |
| 26 | `pos-logica.js`, `pos.js` | `pos-logica.test.js` + manual |

## 8. Orden de trabajo y despliegue

1. `pos-logica.js`: cada función con su test, primero el test (AGENTS.md).
2. `punto-de-venta.test.js` y la carga de `pos-logica.js` en `pos.html` y `sw.js`.
3. `pos.js` usando `PosLogica`.
4. **El autor** ejecuta `10-ocultar-costos.sql` en producción si todavía no se hizo.
5. Publicar `sistema/` en Netlify con `CACHE_VERSION` nueva (la forma se decide al llegar).
6. `/verificar` y `verificacion.md`, con las pruebas manuales.

Cada paso está partido en `tasks.md`, con un commit por tarea, `npm test` en verde (P4) y la skill `revisar-seguridad` antes de cada commit que toque `sistema/js/`.

## 9. Riesgos

| Riesgo | Qué se hace |
|---|---|
| Dibujar 2.000 tarjetas puede tardar más de 1 segundo aunque el filtro sea rápido (RF-001-06). | Se mide en la PC del mostrador. Si no llega, se dibuja solo una parte de la lista (cambia la pantalla, no la spec). |
| Si `pos-logica.js` no se cachea o no carga, `pos.js` falla entero. | Test que comprueba el orden en `pos.html` y la lista de `sw.js`. |
| `pos.js` no tiene tests automáticos (vive en `DOMContentLoaded`). | Lo que decide va a `pos-logica.js`; lo que queda en `pos.js` se prueba a mano en local en cada tarea. |
| Sin RF-001-25, esta spec no garantiza que un reintento después de un corte no duplique la venta. | Hoy `pos.js` ya manda `p_idempotency_key` y no se toca esa parte; especificarla y probarla queda como mejora futura. |

## 10. Decisiones del autor (2026-11-01)

| Pregunta | Decisión |
|---|---|
| **D8:** «Cobrar» queda habilitado aunque no haya método elegido | **Aprobado.** |
| Reducir el alcance al núcleo del cobro (15 RF) | **Aprobado** (`/cambio`). Las decisiones sobre `DROP FUNCTION`, D7 y D10 quedan para cuando vuelvan esos RF. |
