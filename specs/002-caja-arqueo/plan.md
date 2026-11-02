# Plan 002 · Caja y arqueo

> **Estado:** aprobado por el autor · **Fecha:** 2026-11-02
> **Entrada:** `spec.md` (8 RF) y `clarificacion.md` (12 hallazgos respondidos).
> **Fuentes leídas:** `documentacion/CONSTITUCION.md`, `04-ARQUITECTURA.md`, `05-DATOS.md`, `10-SEGURIDAD.md`, `07-CONVENCIONES.md`, `memory.md`, `cajas_guard` y `crear_venta` en `base-de-datos/00-estructura.sql`, `90-reinicio-total.sql`, `sistema/js/app.js`, `sistema/js/pos.js`, `sistema/js/config.js`, `sistema/js/auth.js`, `sistema/pos.html` y `sistema/dashboard.html`.
> Este plan **no tiene código**: dice qué archivo cambia, qué función se crea o se modifica y cómo se prueba. No se consultó la base real: todo lo que dice sobre ella sale de `00-estructura.sql`, y el paso 1 del orden de trabajo lo comprueba.

## 1. Resumen

La apertura y el cierre ya existen. Este plan hace tres cambios:

1. **Base:** se amplía `cajas_guard`. La base pasa a calcular la diferencia y a rechazar saldos inventados, negativos y cambios en una caja cerrada, también al dueño.
2. **Lógica sin pantalla:** archivo nuevo `sistema/js/caja-logica.js`, con las validaciones, la vista previa y los textos, para probarlos con `npm test`.
3. **Pantallas:** `app.js` y `pos.js` dejan de calcular la diferencia, sacan la lectura previa al cierre y muestran un resumen que dura hasta «Listo».

No cambia ninguna política de RLS, ninguna tabla ni ningún trigger: solo se reemplaza el cuerpo de una función.

## 2. Decisiones de diseño

Las decisiones **D3, D5, D6, D7 y D8** no están escritas en la spec ni en la clarificación: salen de leer el código al planificar y las aprobó el autor (ver la sección 11).

| ID | Decisión | Por qué | Principio |
|---|---|---|---|
| D1 | Archivo nuevo `sistema/js/caja-logica.js` con funciones puras, igual que `pos-logica.js`: se publica como `window.CajaLogica` en el navegador y como `module.exports` en Node. Lo usan `app.js` y `pos.js`. | Dentro de `app.js` y `pos.js` no se puede probar sin navegador. Es la decisión de la spec. | P4 · P1 |
| D2 | La migración va en un archivo propio, `base-de-datos/20-caja-arqueo.sql`, que solo reemplaza `cajas_guard`. El autor la revisa y la ejecuta en el panel. También se actualiza la sección 7.7 de `00-estructura.sql`. | Reemplazar la función no toca el trigger ni los permisos. El archivo de estructura sirve para instalar de cero, no para migrar. | P3 · P5 |
| D3 | Con la caja abierta, si un `update` que la deja `abierta` cambia saldos, `usuario_id` o `fecha_apertura`, se rechaza con «La caja ya está abierta» **para los dos roles**. | RF-002-03 no se cumple mirando solo los saldos. Si el dueño abre desde una pantalla vieja con el mismo monto, los saldos no cambian: el `update` pasaría, pisaría la fecha de apertura y el usuario, sumaría otro movimiento y diría «Caja abierta». | P3 |
| D4 | El cierre pide la fila actualizada con `.select(...)`, sin `.single()`. Si vuelve vacía, se trata como error: «No se pudo cerrar la caja». Lo mismo vale para la apertura. El resumen, el movimiento y la auditoría usan esa fila. | Lección de `memory.md`: un `update` bloqueado por RLS no devuelve error. Y H-05: el movimiento usa la fila devuelta. | P3 |
| D5 | Con el resumen abierto, el foco va al **título del modal**, no a «Listo», y en el POS el lector y los atajos no actúan. «Listo» se alcanza con Tab. | El lector termina cada lectura con Enter. Con el foco en «Listo», un escaneo cerraría el resumen sin que nadie lo lea, y RF-002-08 pide que dure hasta que lo toque el usuario. | P7 |
| D6 | Si al abrir el modal de cierre la lectura dice que la caja ya está `cerrada`, no se abre el modal: se muestra «La caja ya fue cerrada» y se actualiza la pantalla. | Una caja cerrada conserva su `saldo_actual`: se mostraría como esperado un saldo de un turno terminado. | P3 · P6 |
| D7 | `tests/sql/caja-guard.sql` es un solo bloque que **termina siempre en un error a propósito**, cuyo texto trae el resultado de cada prueba. | Ese error deshace todo, también si el script falla en el medio, y no hay forma de que termine en un `COMMIT`. Además, hasta donde sé, el editor del panel muestra solo el resultado de la última sentencia, y con un `ROLLBACK` final no se vería nada. Falta comprobarlo en el panel. | P5 · P4 |
| D8 | Se saca el `addEventListener` que está dentro de `cargarCaja` (`pos.js:115`). | `setupCajaModal` ya lo registra. Hoy se suma un listener en cada carga y después de cada venta, así que un clic abre el modal varias veces y hace varias lecturas del esperado. | P3 |
| D9 | Los textos de la spec quedan en una constante `MENSAJES` de `caja-logica.js`. Un test comprueba que los dos que manda la base estén también en la migración, letra por letra. | Las pantallas reconocen esos dos rechazos por su texto: si difieren, se vería el error genérico. | P6 · P4 |

## 3. Cambios en la base de datos

**Tablas, columnas, RLS y triggers:** sin cambios. **Función:** `cajas_guard`, con `CREATE OR REPLACE`. Sigue sin ser `SECURITY DEFINER` (H-01). En este orden:

| Paso | Cuándo | Qué hace | RF |
|---|---|---|---|
| 1 | `current_user` no es `authenticated` ni `anon` | Sale sin controlar nada: `crear_venta`, `cancelar_venta`, `registrar_movimiento_venta` y el panel | H-01 |
| 2 | Sigue `cerrada` y cambia `saldo_inicial`, `saldo_actual`, `saldo_contado`, `diferencia` o `fecha_cierre` | Rechaza: «La caja ya fue cerrada» | 07 |
| 3 | Sigue `abierta` y cambian los saldos, `usuario_id` o `fecha_apertura` | Rechaza: «La caja ya está abierta» | 03 (D3) |
| 4 | Pasa de `abierta` a `cerrada` y cambia algún saldo | Rechaza | H-02 |
| 5 | `saldo_inicial` o `saldo_contado` **cambian** a un valor negativo | Rechaza | 06 (H-01) |
| 6 | Pasa de `cerrada` a `abierta` y `saldo_actual` no es igual a `saldo_inicial` | Rechaza | 01 (H-02) |
| 7 | Pasa de `abierta` a `cerrada` | Pisa `diferencia` con `saldo_contado` menos el `saldo_actual` anterior; sin contado queda `null` | 05 |
| 8 | Es el dueño | Sale | H-01 |
| 9 | Es otro rol | Reglas que ya existen y solo valen para él: no cambia `usuario_id` ni `fecha_apertura` al cerrar, y al abrir `usuario_id` tiene que ser el propio | RF02 del kit |

Los pasos 2 y 3 van antes que el 5 para que un rechazo por pantalla vieja muestre el texto correcto.

**Venta y cierre a la vez (caso límite 3):** el trigger recibe la versión más nueva de la fila, después de esperar el bloqueo de `crear_venta`. Por eso la diferencia usa el saldo del momento del cierre. Se prueba de forma indirecta en `tests/sql/`; la simultaneidad real no se prueba.

## 4. Cambios en `sistema/`

| Archivo | Qué cambia |
|---|---|
| `sistema/js/caja-logica.js` (**nuevo**) | Funciones puras y `MENSAJES` (tabla de abajo). |
| `sistema/js/app.js` | `modalAbrirCaja` y `modalCerrarCaja` (detalle en la sección 6). |
| `sistema/js/pos.js` | `openCajaModal`, `closePOSCajaModal`, `setupKeyboard`, el lector de `setupSearch` y `cargarCaja` (D5, D8). |
| `sistema/js/config.js` | Una función `fijarModal()`: la X y el clic afuera dejan de cerrar el modal global mientras se muestra el resumen. `openModal` y `closeModal` la vuelven a su estado normal. Las otras pantallas no cambian. |
| `sistema/css/styles.css` | Clases `caja-resumen…` para el resumen, solo con variables de marca. El resultado se distingue por el texto, no solo por el color. |
| `sistema/dashboard.html`, `sistema/pos.html` | Cargan `js/caja-logica.js` antes de `js/app.js` y de `js/pos.js`. |
| `sistema/sw.js` | Agrega `/js/caja-logica.js`. `CACHE_VERSION` se sube una sola vez, antes de publicar. |

### Funciones de `caja-logica.js`

| Función | Qué decide | RF |
|---|---|---|
| `MENSAJES` | Los textos de la spec en un solo lugar | 02, 03, 07, 08 |
| `validarMontoApertura(valor, entradaInvalida)` | Vacío, inválido o negativo: mensaje de RF-002-02. Si no, el monto. Usa `Number` y `Number.isFinite`, no `parseFloat(x) \|\| 0` | 01, 02 |
| `validarContado(valor, entradaInvalida)` | Vacío y válido: sin contado (`null`). `0` es un contado. Con `validity.badInput` o negativo: mensaje de RF-002-02 | 02 |
| `calcularVistaPrevia(esperado, contado)` | La diferencia en centavos enteros. Sin contado o sin esperado: nada. Solo informa (P3) | 04 |
| `describirDiferencia(diferencia)` | «Sobrante», «Faltante» o «Sin diferencia» y el valor sin signo; con `null`, «Cerrada sin arqueo» | 08 |
| `armarResumenCierre(fila)` | A partir de la fila que devuelve la base: esperado, contado, diferencia y texto | 05, 08 |
| `interpretarErrorCaja(error, accion)` | Qué texto mostrar y si hay que volver a leer la caja. Reconoce los dos rechazos de la base. Cualquier otro error, también el de red, da «No se pudo abrir la caja» o «No se pudo cerrar la caja» | 03, 07 |

## 5. Tests

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `tests/caja-logica.test.js` (**nuevo**) | `node --test`, automático | Cada función de `caja-logica.js`, los textos letra por letra y los casos límite 1, 2 y 11. |
| `tests/caja.test.js` (**nuevo**) | `node --test`, automático, lee archivos | `caja-logica.js` cargado antes que `app.js` y `pos.js`, y listado en `sw.js`. No queda el cálculo de la diferencia ni la lectura previa al cierre en `app.js` y `pos.js`. Los dos textos de la base están en `20-caja-arqueo.sql` y en `00-estructura.sql`. La migración no tiene `POLICY`, y `caja-guard.sql` no trae ids escritos a mano (P5). |
| `tests/sql/caja-guard.sql` (**nuevo**) | Lo corre el autor en el panel (D7) | Con cada rol, usando `SET LOCAL ROLE authenticated` y `request.jwt.claims`, con ids buscados por consulta: apertura válida, doble apertura (también con el mismo monto), diferencia inventada, contado 0 y vacío, negativos, saldo inventado al cerrar, caja cerrada que no cambia. Además, `crear_venta` y `cancelar_venta` con la caja abierta y el `UPDATE cajas` de `90-reinicio-total.sql`. Cada prueba prepara antes el estado de la caja, porque la real puede estar abierta. |
| `tests/constitucion.test.js` | Ya existe, sin cambios | Sin colores a mano (P2), sin secretos (P5), sin CDN (P1). |
| Pruebas manuales | En `verificacion.md`, en `pointer-demo` | Los criterios de finalización, desde la sección Caja y desde el POS, con los dos roles. |

**Test primero:** `caja-guard.sql` se corre también **antes** de la migración, y tiene que fallar. Así se comprueba que las pruebas detectan el problema y que el rol simulado funciona (H-03).

## 6. Detalle por requisito

### Apertura

- **RF-002-01** · `app.js` (`modalAbrirCaja`), `pos.js` (`openCajaModal`), `caja-logica.js` (`validarMontoApertura`). Base: paso 6 del guard. Test: `caja-logica.test.js`, `caja-guard.sql`. P3.
- **RF-002-02** · Las dos pantallas le pasan a `validarMontoApertura` y `validarContado` el valor y `validity.badInput`. Si no es válido, no se manda el `update`, el modal queda abierto y se muestra el mensaje. La base solo frena los negativos, así que **este RF se cumple en la pantalla**. Test: `caja-logica.test.js`, y la prueba manual con `1e` en Chrome que pide la spec. P5 · P6.
- **RF-002-03** · Base: paso 3 (D3). Pantallas: `interpretarErrorCaja`; ante el rechazo se cierra el modal, se muestra el texto y se vuelve a leer la caja (`renderCaja` y `loadCajaStatus` en `app.js`; `cargarCaja` y `calcularTotales` en `pos.js`, que corrige `POS.cajaAbierta` y destraba «Cobrar»). «Abrir caja» se deshabilita mientras se procesa y vuelve a habilitarse si hay error. Test: `caja-guard.sql`, `caja-logica.test.js` y la prueba manual con dos pantallas. P3.

### Cierre y arqueo

- **RF-002-04** · `app.js` (`modalCerrarCaja`) y `pos.js` (el bloque que completa `pos-esperado-hint`) usan `calcularVistaPrevia`. Si la lectura del esperado falla, se muestra «No se pudo leer el efectivo esperado. Revisá la conexión.» y la vista previa no calcula nada. En `app.js` **tampoco se muestra el bloque «Resumen del turno»** en ese caso, porque usa los mismos saldos: mostraría $0 o un valor viejo. D6 cubre la caja que ya estaba cerrada. Test: `caja-logica.test.js` y prueba manual con la red cortada. P3 · P6.
- **RF-002-05** · Base: paso 7. `app.js` y `pos.js`: el `update` de cierre ya no manda `diferencia` y se saca la lectura previa (`app.js:771`, `pos.js:1149` y `pos.js:1162`). Sin internet el `update` falla, se ve «No se pudo cerrar la caja», lo escrito queda y el botón vuelve a habilitarse (caso límite 10). `validarContado` también reemplaza a `parseFloat`. Test: `caja-guard.sql` (el valor inventado se descarta; cuenta con contado 0 y sin contado), `caja.test.js`. P3.
- **RF-002-08** · `app.js` y `pos.js`: después del `update` se registran el movimiento de cierre y la auditoría con la fila devuelta (D4). Después el modal se reescribe con `armarResumenCierre` y se actualiza la pantalla de atrás. Solo «Listo» lo cierra: `fijarModal()` en `config.js` para la sección Caja, y una marca `POS.resumenCajaVisible` en `pos.js` que revisan la X, el clic afuera, `setupKeyboard` y el lector (D5). Los fallos del movimiento o de la auditoría no impiden ver el resumen: el movimiento sigue con su `console.warn` y `registrarAuditoria` ya no corta el flujo. El resumen solo muestra números y textos fijos, sin notas: no necesita `escapeHtml`, pero sigue pasando por `setHtml` y el `innerHTML` actuales. Test: `caja-logica.test.js` y los criterios manuales. P3 · P6 · P7.

### Protección en la base

- **RF-002-06** · Base: paso 5; rechaza solo si el valor cambia (H-01), así una caja que ya tenga un negativo se puede cerrar igual. Por pantalla no se llega: RF-002-02 lo frena antes. Test: `caja-guard.sql` con los dos roles. P5.
- **RF-002-07** · Base: paso 2. Un segundo cierre siempre choca porque manda otra `fecha_cierre`. Pantallas: `interpretarErrorCaja`, y se vuelve a leer como en RF-002-03. Test: `caja-guard.sql`, `caja-logica.test.js` y prueba manual con dos pantallas. P3.

## 7. Tabla RF → archivos → test

| RF | Archivos | Cambio en la base | Test |
|---|---|---|---|
| 01 | `caja-logica.js`, `app.js`, `pos.js` | Guard, paso 6 | `caja-logica.test.js`, `caja-guard.sql` |
| 02 | `caja-logica.js`, `app.js`, `pos.js` | Ninguno propio (el paso 5 frena negativos por API) | `caja-logica.test.js` + manual en Chrome (`1e`) |
| 03 | `caja-logica.js`, `app.js`, `pos.js` | Guard, paso 3 | `caja-guard.sql`, `caja-logica.test.js` + manual con dos pantallas |
| 04 | `caja-logica.js`, `app.js`, `pos.js` | Ninguno | `caja-logica.test.js` + manual con la red cortada |
| 05 | `app.js`, `pos.js`, `20-caja-arqueo.sql`, `00-estructura.sql` | Guard, pasos 4 y 7 | `caja-guard.sql`, `caja.test.js` |
| 06 | `20-caja-arqueo.sql`, `00-estructura.sql` | Guard, paso 5 | `caja-guard.sql` |
| 07 | `caja-logica.js`, `app.js`, `pos.js`, `20-caja-arqueo.sql`, `00-estructura.sql` | Guard, paso 2 | `caja-guard.sql`, `caja-logica.test.js` + manual con dos pantallas |
| 08 | `caja-logica.js`, `app.js`, `pos.js`, `config.js`, `styles.css` | Ninguno | `caja-logica.test.js` + manual en `pointer-demo` |

Las rutas son `sistema/js/…`, `sistema/css/…`, `base-de-datos/…`, `tests/…` y `tests/sql/…`. Los archivos de carga (`dashboard.html`, `pos.html`, `sw.js`) se prueban con `caja.test.js`.

**Documentación:** `05-DATOS.md` (ahora `cajas_guard` frena a los dos roles), `04-ARQUITECTURA.md` (agrega `caja-logica.js` y `pos-logica.js`, que tampoco figura), `memory.md` y `documentacion/PROMPTS.md`, si corresponde.

## 8. Orden de trabajo y despliegue

1. **El autor** compara en el panel la función real con `00-estructura.sql` (solo lectura). Es la comprobación de viabilidad que quedó pendiente en la clarificación. Si difieren, se frena y se ajusta el plan.
2. `caja-logica.js`, cada función con su test, primero el test.
3. `caja-guard.sql` y `20-caja-arqueo.sql`. **El autor** corre las pruebas antes (fallan), ejecuta la migración y las corre otra vez (pasan). Después se comprueba que los datos de la caja no cambiaron con las pruebas.
4. `caja.test.js` y la carga de `caja-logica.js` en `dashboard.html`, `pos.html` y `sw.js`.
5. `app.js`, `config.js`, `pos.js` y `styles.css`, de a una pantalla por vez, probando en local.
6. Documentación.
7. **Publicar `sistema/` en `pointer-demo` recién después de la migración**, con `CACHE_VERSION` nueva. `pointer-web001` y «Kiosco Web» no se tocan.
8. `/verificar` y `verificacion.md`, con las pruebas manuales.

**Por qué ese orden:** la pantalla nueva con el guard viejo mostraría «Cerrada sin arqueo» siempre, porque ya no manda la diferencia y nadie la calcularía. Al revés no hay problema: una pantalla vieja con el guard nuevo sigue funcionando y lo que manda se descarta. Eso también cubre a los navegadores que todavía tengan la versión en caché.

Un commit por tarea, con `npm test` en verde (P4) y la skill `revisar-seguridad` antes de cada commit que toque `sistema/js/` o `base-de-datos/`.

## 9. Riesgos

| Riesgo | Qué se hace |
|---|---|
| La base real puede diferir de `00-estructura.sql` (la clarificación no la consultó). | Paso 1 del orden de trabajo. |
| **`tests/sql/` gasta números de venta:** el `ROLLBACK` no devuelve lo que avanzó `ventas_numero_venta_seq`, así que cada corrida que prueba `crear_venta` deja un salto en la numeración. | Se acepta porque `pointer-demo` es una base de demostración. Se corre pocas veces. El script solo se usa en la base de Pointer. |
| El guard nuevo rompe `crear_venta` o `cancelar_venta` y deja el kiosco sin vender. | Paso 1 del guard y pruebas en `caja-guard.sql` antes de publicar. Para volver atrás, la versión anterior queda en el historial de Git de `00-estructura.sql`. |
| El panel no muestra el texto del error de D7 tal como se espera. | Se ve en la primera corrida, que es antes de migrar. Si pasa, se cambia cómo se informa, sin cambiar las pruebas. |
| `app.js` y `pos.js` no tienen tests automáticos y el código de caja sigue duplicado. | Lo que decide va a `caja-logica.js`; lo demás se prueba a mano en los dos lugares. Unificarlo es una mejora futura de la spec. |
| Se corta justo antes de la respuesta del cierre: queda cerrada sin resumen, movimiento ni auditoría. | Límite aceptado en H-12. |

## 10. Principios de la constitución

| Principio | Cómo se aplica |
|---|---|
| P1 · Stack | Sin dependencias nuevas: `node --test` y JavaScript sin framework. |
| P2 · Marca | El resumen usa solo variables CSS (`marca: sin colores escritos a mano`). |
| P3 · Capas | La base calcula la diferencia y decide los rechazos. `caja-logica.js` solo valida, muestra la vista previa y elige textos. |
| P4 · Tests | Los 8 RF son de prioridad alta y cada uno tiene test automático o en `tests/sql/`, según la decisión de `memory.md`. |
| P5 · Seguridad | Los negativos se frenan en la base. `tests/sql/` no tiene claves ni ids, y corre sin dejar cambios. |
| P6 · Idioma | Textos en voseo y con tildes, en `MENSAJES`. |
| P7 · Accesibilidad | Foco manejado en el resumen (D5), «Listo» alcanzable con teclado, y el resultado se distingue por el texto. |
| P8 · Uso de la IA | El autor revisa y ejecuta el SQL. La IA no toca la base. |

## 11. Decisiones del autor (2026-11-02)

| Pregunta | Decisión |
|---|---|
| **D3:** el guard también rechaza cambios de `usuario_id` y `fecha_apertura` del dueño con la caja abierta | **Aprobado.** |
| **D5:** el foco del resumen va al título, no a «Listo», y el lector no actúa mientras está abierto | **Aprobado.** |
| **D6:** si la caja ya está cerrada al abrir el modal de cierre, se avisa y no se abre | **Aprobado.** |
| **D7:** `caja-guard.sql` termina siempre en un error a propósito, en lugar de un `ROLLBACK` escrito | **Aprobado.** |
| **D8:** se saca el listener repetido de `cargarCaja` | **Aprobado.** |
