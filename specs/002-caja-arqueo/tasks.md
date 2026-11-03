# Tareas 002 · Caja y arqueo

> **Estado:** aprobado por el autor · **Fecha:** 2026-11-02
> **Entrada:** `plan.md` (aprobado 2026-11-02). Rama: `002-caja-arqueo`.
> Cada tarea dura menos de 30 minutos y termina en **un commit** con el mensaje propuesto.

## Reglas para todas las tareas

- **Tests primero, en la misma tarea:** se escribe o ajusta el test, se ve fallar, se escribe el código y se pone en verde. Se commitea todo junto, con `npm test` en verde (P4). Es la regla de `memory.md` desde la spec 001: un test separado dejaría el commit en rojo. No se usa `{ todo: true }`.
- Antes de cada commit: `npm test` en verde y, si la tarea toca `sistema/js/` o `base-de-datos/`, la skill `revisar-seguridad`.
- `CACHE_VERSION` de `sistema/sw.js` se sube **una sola vez, en T26**, antes de publicar. T15 igual agrega `/js/caja-logica.js` a la lista de `sw.js`.
- **La IA no ejecuta SQL en la base (P8).** Las tareas marcadas **Autor** las hace el autor en el panel, en la base de Pointer (`ebsiqjiioqzpzdsonkit`). «Kiosco Web» y `pointer-web001` no se tocan.
- «En local» significa Chrome con Supabase simulado, sin credenciales, como en la spec 001. Las pruebas con la base real van en T27.
- Cada commit actualiza `memory.md` (estado de la tarea) en el mismo commit.
- Se muestra el diff y se espera la aprobación del autor antes de cada commit.
- Los números de «caso límite» son los de `spec.md`; los «paso N», los de la tabla de `cajas_guard` en la sección 3 de `plan.md`.

## Etapa 0 · Comprobación de viabilidad

- [x] T01 · **Autor:** comparar la función real con `00-estructura.sql`
  - **RF:** 03, 05, 06, 07 (paso 1 del orden de trabajo del plan)
  - **Archivos:** `memory.md`
  - **Hace:** el autor lee en el panel la definición de `cajas_guard` (`select pg_get_functiondef('public.cajas_guard()'::regprocedure);`, solo lectura) y la compara con la sección 7.7 de `00-estructura.sql`. Guarda esa definición: es la versión para volver atrás.
  - **Listo cuando:** `memory.md` dice si coinciden. Si difieren, se frena acá y se ajusta el plan antes de seguir.
  - **Commit:** `registra la comprobación de cajas_guard contra la base real`

## Etapa 1 · Lógica pura (`caja-logica.js`)

- [x] T02 · Esqueleto de `caja-logica.js` y `MENSAJES` (test + código)
  - **RF:** 02, 03, 07, 08
  - **Archivos:** `sistema/js/caja-logica.js` (nuevo), `tests/caja-logica.test.js` (nuevo)
  - **Hace:** doble salida igual que `pos-logica.js` (`window.CajaLogica` y `module.exports`). `MENSAJES` con los textos de la spec, comprobados letra por letra (D9).
  - **Listo cuando:** el test compara cada texto con el de la spec, incluidos «Ingresá un monto de 0 o más», «La caja ya está abierta» y «La caja ya fue cerrada»; `npm test` en verde.
  - **Commit:** `agrega caja-logica.js con los mensajes de la caja`

- [x] T03 · `validarMontoApertura` (test + código)
  - **RF:** 01, 02
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** vacío, `entradaInvalida` o negativo devuelven el mensaje de RF-002-02; `0` y los positivos devuelven el monto. Usa `Number` y `Number.isFinite`, no `parseFloat(x) || 0`.
  - **Listo cuando:** pasan los casos vacío, `0`, `1000`, `-1` y `entradaInvalida = true`; `npm test` en verde.
  - **Commit:** `agrega la validación del monto de apertura`

- [x] T04 · `validarContado` (test + código)
  - **RF:** 02
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** vacío y válido es «sin contado» (`null`); `0` es un contado; `entradaInvalida` o negativo devuelven el mensaje de RF-002-02.
  - **Listo cuando:** pasan los casos límite 1 ($0), 2 (vacío) y 11 (vacío con `entradaInvalida = true` no cuenta como «sin contado»); `npm test` en verde.
  - **Commit:** `agrega la validación del efectivo contado`

- [x] T05 · `calcularVistaPrevia` (test + código)
  - **RF:** 04
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** la diferencia en centavos enteros. Sin contado o sin esperado no devuelve nada, nunca $0.
  - **Listo cuando:** pasan esperado 1500 con contado 1450 (−50), contado 0, sin contado, sin esperado y un caso con decimales que falla si se resta en coma flotante; `npm test` en verde.
  - **Commit:** `agrega la vista previa de la diferencia`

- [x] T06 · `describirDiferencia` (test + código)
  - **RF:** 08
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** «Sobrante», «Faltante» o «Sin diferencia» con el valor sin signo; `null` da «Cerrada sin arqueo».
  - **Listo cuando:** pasan los casos 50, −50, 0 y `null`, y `0` no se confunde con `null`; `npm test` en verde.
  - **Commit:** `agrega el texto del resultado del arqueo`

- [x] T07 · `armarResumenCierre` (test + código)
  - **RF:** 05, 08
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** arma el resumen desde la fila que devuelve la base. No recalcula la diferencia. Convierte a número los `numeric` que llegan como texto.
  - **Listo cuando:** la fila del criterio de finalización da esperado 1500, contado 1450 y «Faltante» de 50; una fila con `diferencia` distinta de la resta muestra la de la fila; sin contado da el esperado y «Cerrada sin arqueo» (caso límite 2); `npm test` en verde.
  - **Commit:** `agrega el resumen de cierre de caja`

- [x] T08 · `interpretarErrorCaja` (test + código)
  - **RF:** 03, 07
  - **Archivos:** `sistema/js/caja-logica.js`, `tests/caja-logica.test.js`
  - **Hace:** reconoce los dos rechazos de la base: devuelve su texto y pide volver a leer la caja. Cualquier otro error, también el de red, da «No se pudo abrir la caja» o «No se pudo cerrar la caja», sin volver a leer.
  - **Listo cuando:** pasan los dos rechazos, un `TypeError: Failed to fetch`, un error desconocido y las dos acciones; `npm test` en verde.
  - **Commit:** `agrega la interpretación de los errores de caja`

## Etapa 2 · Base de datos

- [x] T09 · `caja-guard.sql`: armazón y apertura
  - **RF:** 01, 03, 06
  - **Archivos:** `tests/sql/caja-guard.sql` (nuevo), `tests/caja.test.js` (nuevo)
  - **Hace:** un solo bloque que termina siempre en un error a propósito con los resultados (D7). Simula cada rol con `SET LOCAL ROLE authenticated` y `request.jwt.claims`, con ids buscados por consulta. Cada prueba prepara el estado de la caja. Casos con los dos roles: apertura válida, doble apertura (también con el mismo monto) y apertura negativa. `caja.test.js` arranca comprobando que el script no trae ids escritos a mano (P5).
  - **Listo cuando:** `npm test` en verde; el autor leyó el SQL y entiende cada caso. Todavía no se ejecuta.
  - **Commit:** `agrega las pruebas sql de la apertura de caja`

- [x] T10 · `caja-guard.sql`: cierre y caja cerrada
  - **RF:** 05, 06, 07
  - **Archivos:** `tests/sql/caja-guard.sql`
  - **Hace:** con los dos roles: diferencia inventada (se descarta), contado 0, contado vacío (`null`), contado negativo, saldo inventado al cerrar, y una caja cerrada que no cambia su arqueo ni sus saldos.
  - **Listo cuando:** cada caso del criterio de finalización de `tests/sql/` tiene su línea de resultado; `npm test` en verde.
  - **Commit:** `agrega las pruebas sql del cierre de caja`

- [x] T11 · `caja-guard.sql`: lo que no se tiene que romper
  - **RF:** 05, 07 (H-01)
  - **Archivos:** `tests/sql/caja-guard.sql`
  - **Hace:** `crear_venta` y `cancelar_venta` con la caja abierta, y el `UPDATE cajas` de `90-reinicio-total.sql`.
  - **Listo cuando:** los tres casos tienen su línea de resultado, y el de `crear_venta` comprueba que subió `saldo_actual`; `npm test` en verde.
  - **Commit:** `agrega las pruebas sql de ventas y reinicio con el guard`

- [x] T12 · **Autor:** correr las pruebas antes de migrar
  - **RF:** 03, 05, 06, 07
  - **Archivos:** `memory.md` y, si hace falta, `tests/sql/caja-guard.sql`
  - **Hace:** el autor corre el script en el panel con el guard viejo. Comprueba dos cosas: que las pruebas detectan el problema y que el panel muestra el texto del error (D7). Si no lo muestra, se cambia cómo se informa, sin cambiar las pruebas.
  - **Listo cuando:** se leen los resultados en el panel; las pruebas del dueño (doble apertura, negativo, saldo inventado) y la diferencia inventada dan «falla»; ventas, cancelación y reinicio dan «pasa»; los datos de la caja no cambiaron.
  - **Commit:** `registra la corrida de las pruebas sql antes de la migración`

- [x] T13 · Migración de `cajas_guard`
  - **RF:** 01, 03, 05, 06, 07
  - **Archivos:** `base-de-datos/20-caja-arqueo.sql` (nuevo), `base-de-datos/00-estructura.sql` (sección 7.7), `tests/caja.test.js`
  - **Hace:** reemplaza la función con los 9 pasos del plan, sin `SECURITY DEFINER`. Test: los dos textos de la base están letra por letra en los dos archivos y coinciden con `MENSAJES`; la migración no tiene `POLICY`.
  - **Listo cuando:** `npm test` en verde; la función es igual en los dos archivos; el autor revisó el SQL. Todavía no se ejecuta.
  - **Commit:** `amplía cajas_guard para calcular la diferencia y frenar a los dos roles`

- [x] T14 · **Autor:** ejecutar la migración y repetir las pruebas
  - **RF:** 01, 03, 05, 06, 07
  - **Archivos:** `memory.md`
  - **Hace:** el autor ejecuta `20-caja-arqueo.sql` en la base de Pointer y corre otra vez `caja-guard.sql`. Si ventas o cancelación fallan, vuelve a la versión guardada en T01 y se frena.
  - **Listo cuando:** todas las pruebas dan «pasa», y los datos de la caja son los mismos que antes de correrlas.
  - **Commit:** `registra la migración de cajas_guard en la base de pointer`

## Etapa 3 · Pantallas

- [x] T15 · Carga de `caja-logica.js`
  - **RF:** 01 a 08 (carga)
  - **Archivos:** `tests/caja.test.js`, `sistema/dashboard.html`, `sistema/pos.html`, `sistema/sw.js`
  - **Hace:** test: `caja-logica.js` se carga antes que `app.js` y `pos.js`, y está en `sw.js`. Código: los `<script>` y la línea de `sw.js`, sin subir `CACHE_VERSION`.
  - **Listo cuando:** `npm test` en verde; en local, las dos pantallas abren sin errores en la consola y `window.CajaLogica` existe.
  - **Commit:** `carga caja-logica.js en la sección caja y el punto de venta`

- [x] T16 · `fijarModal` en `config.js`
  - **RF:** 08
  - **Archivos:** `sistema/js/config.js`, `tests/caja.test.js`
  - **Hace:** con el modal fijado, la X y el clic afuera no lo cierran. `openModal` y `closeModal` lo vuelven a su estado normal.
  - **Listo cuando:** `npm test` en verde (el test comprueba que `openModal` y `closeModal` lo reinician); en local, otro modal del panel se sigue cerrando con la X y con el clic afuera después de haber usado `fijarModal`.
  - **Commit:** `agrega fijarModal al modal global`

- [x] T17 · Sección Caja: apertura
  - **RF:** 01, 02, 03
  - **Archivos:** `sistema/js/app.js` (`modalAbrirCaja`), `tests/caja.test.js`
  - **Hace:** usa `validarMontoApertura` con `validity.badInput`; si no es válido, no manda nada y el modal queda abierto. «Abrir caja» se deshabilita mientras procesa y vuelve si hay error. Pide la fila con `.select(...)`; vacía es error (D4). Ante un rechazo: cierra, muestra el texto y vuelve a leer con `renderCaja` y `loadCajaStatus`.
  - **Listo cuando:** `npm test` en verde (`app.js` ya no usa `parseFloat` en `saldo-apertura`); en local, vacío y `1e` muestran «Ingresá un monto de 0 o más» y `0` abre.
  - **Commit:** `valida la apertura de caja en la sección caja`

- [x] T18 · Sección Caja: modal de cierre y vista previa
  - **RF:** 04
  - **Archivos:** `sistema/js/app.js` (`modalCerrarCaja`), `tests/caja.test.js`
  - **Hace:** usa `calcularVistaPrevia`. Lectura fallida: «No se pudo leer el efectivo esperado. Revisá la conexión.», sin vista previa y sin «Resumen del turno». Caja ya cerrada: avisa, no abre el modal y actualiza la pantalla (D6).
  - **Listo cuando:** `npm test` en verde (no queda la resta de la vista previa en `app.js`); en local, se ve el esperado y la diferencia al escribir; con la red cortada no aparece $0 ni un saldo viejo.
  - **Commit:** `usa la vista previa de caja-logica en la sección caja`

- [x] T19 · Sección Caja: `update` de cierre
  - **RF:** 02, 05, 07
  - **Archivos:** `sistema/js/app.js` (`modalCerrarCaja`), `tests/caja.test.js`
  - **Hace:** saca la lectura previa y la `diferencia` del `update`. Usa `validarContado` con `validity.badInput`. Pide la fila con `.select(...)`; vacía es error (D4). El movimiento y la auditoría usan esa fila. Ante un rechazo: muestra el texto y vuelve a leer. Sin internet: «No se pudo cerrar la caja», lo escrito queda y el botón vuelve (caso límite 10).
  - **Listo cuando:** `npm test` en verde (no queda el cálculo de la diferencia ni la lectura previa en `app.js`); en local, `1e` no cierra, y con la red cortada se conserva lo escrito.
  - **Commit:** `deja que la base calcule la diferencia en la sección caja`

- [x] T20 · Sección Caja: resumen de cierre
  - **RF:** 08
  - **Archivos:** `sistema/js/app.js` (`modalCerrarCaja`), `sistema/css/styles.css`
  - **Hace:** después del movimiento y la auditoría, reescribe el modal con `armarResumenCierre` y `fijarModal`, y actualiza la pantalla de atrás. Clases `caja-resumen…` solo con variables de marca. El foco va al título (D5); «Listo» se alcanza con Tab y es lo único que cierra. Un fallo del movimiento o de la auditoría no impide ver el resumen.
  - **Listo cuando:** `npm test` en verde (`marca: sin colores escritos a mano`); en local, el resumen no se cierra con la X, con el clic afuera ni con Enter, y se distingue el resultado sin depender del color.
  - **Commit:** `muestra el resumen de cierre en la sección caja`

- [x] T21 · POS: listener repetido y apertura
  - **RF:** 01, 02, 03
  - **Archivos:** `sistema/js/pos.js` (`cargarCaja`, `openCajaModal`), `tests/caja.test.js`
  - **Hace:** saca el `addEventListener` de `cargarCaja` (D8). Apertura igual que T17. Ante un rechazo vuelve a leer con `cargarCaja` y `calcularTotales`, y así se corrige `POS.cajaAbierta` y se destraba «Cobrar».
  - **Listo cuando:** `npm test` en verde (`pos.js` registra el clic de la caja una sola vez y no usa `parseFloat` en `pos-saldo-apertura`); en local, después de varias cargas un clic abre el modal una vez, y vacío y `1e` muestran el mensaje.
  - **Commit:** `valida la apertura de caja en el punto de venta`

- [x] T22 · POS: modal de cierre y vista previa
  - **RF:** 04
  - **Archivos:** `sistema/js/pos.js` (`openCajaModal`), `tests/caja.test.js`
  - **Hace:** igual que T18, en `pos-esperado-hint`. Hoy, si la lectura falla, muestra $0 (`parseFloat(cj?.saldo_actual || 0)`). Caja ya cerrada: avisa y no abre el modal (D6).
  - **Listo cuando:** `npm test` en verde; en local, con la red cortada se ve el mensaje y nunca $0.
  - **Commit:** `usa la vista previa de caja-logica en el punto de venta`

- [x] T23 · POS: `update` de cierre
  - **RF:** 02, 05, 07
  - **Archivos:** `sistema/js/pos.js` (`openCajaModal`), `tests/caja.test.js`
  - **Hace:** igual que T19. Saca las dos lecturas previas. Sin internet, `POS.cajaAbierta` no cambia y «Cobrar» no se bloquea (caso límite 10).
  - **Listo cuando:** `npm test` en verde (no queda el cálculo de la diferencia ni las lecturas previas en `pos.js`); en local, `1e` no cierra y con la red cortada «Cobrar» sigue habilitado.
  - **Commit:** `deja que la base calcule la diferencia en el punto de venta`

- [ ] T24 · POS: resumen de cierre
  - **RF:** 08
  - **Archivos:** `sistema/js/pos.js` (`openCajaModal`, `closePOSCajaModal`, `setupKeyboard`, `setupSearch`)
  - **Hace:** resumen con `armarResumenCierre` y las clases de T20. Marca `POS.resumenCajaVisible`: con ella no actúan la X, el clic afuera, el lector, F2, F10 ni Escape, que hoy le sacaría el foco al resumen. El foco va al título (D5). «Listo» baja la marca.
  - **Listo cuando:** `npm test` en verde; en local, un escaneo simulado (código + Enter) con el resumen abierto no lo cierra ni agrega nada al carrito; F2, F10 y Escape no actúan; después de «Listo» el lector vuelve a funcionar.
  - **Commit:** `muestra el resumen de cierre en el punto de venta`

## Etapa 4 · Documentación, publicación y verificación

- [ ] T25 · Documentación
  - **RF:** 01 a 08
  - **Archivos:** `documentacion/05-DATOS.md`, `documentacion/04-ARQUITECTURA.md`, `documentacion/PROMPTS.md` (si corresponde)
  - **Hace:** `05-DATOS.md`: `cajas_guard` frena a los dos roles. `04-ARQUITECTURA.md`: agrega `caja-logica.js`, `pos-logica.js`, `20-caja-arqueo.sql` y `tests/sql/`.
  - **Listo cuando:** ninguno de los dos archivos dice que `cajas_guard` frena solo al empleado; `npm test` en verde.
  - **Commit:** `actualiza la documentación de la caja`

- [ ] T26 · **Autor:** publicar en `pointer-demo`
  - **RF:** 01 a 08
  - **Archivos:** `sistema/sw.js`, `memory.md`
  - **Hace:** sube `CACHE_VERSION` una sola vez y el autor publica `sistema/` a mano. Se publica **después de T14**: la pantalla nueva con el guard viejo mostraría siempre «Cerrada sin arqueo». `pointer-web001` no se toca.
  - **Listo cuando:** https://pointer-demo.netlify.app/ carga la versión nueva, con `/js/caja-logica.js` disponible.
  - **Commit:** `publica caja y arqueo en pointer-demo`

- [ ] T27 · **Verificación** de la funcionalidad
  - **RF:** 01 a 08
  - **Archivos:** `specs/002-caja-arqueo/verificacion.md` (nuevo), `memory.md`
  - **Hace:** `/verificar` con la skill `verificar-criterios`. El autor hace las pruebas manuales en `pointer-demo`, con los dos roles y desde las dos pantallas: los criterios de finalización, `1e` en Chrome, dos pantallas (RF-002-03 y RF-002-07), red cortada y lector físico con el resumen abierto.
  - **Listo cuando:** cada RF figura como cumple / no cumple / prueba manual pendiente, con el test que lo cubre; `npm test` en verde.
  - **Commit:** `agrega la verificación de caja y arqueo`

> Si al abrir `app.js` o `pos.js` alguna de T17 a T24 resulta de más de 30 minutos, se parte en dos antes de empezar.

## Cobertura RF → tareas

| RF | Test automático | Test en `tests/sql/` | Código | Prueba manual |
|---|---|---|---|---|
| 01 | T03, T17, T21 | T09, T12, T14 | T03, T13, T17, T21 | T27 |
| 02 | T02, T03, T04, T17, T19, T21, T23 | — | T03, T04, T17, T19, T21, T23 | T27 (`1e`) |
| 03 | T02, T08, T13 | T09, T12, T14 | T08, T13, T17, T21 | T27 (dos pantallas) |
| 04 | T05, T18, T22 | — | T05, T18, T22 | T27 (red cortada) |
| 05 | T07, T19, T23 | T10, T11, T12, T14 | T07, T13, T19, T23 | T27 |
| 06 | T13 | T09, T10, T12, T14 | T13 | — |
| 07 | T02, T08, T13 | T10, T11, T12, T14 | T08, T13, T19, T23 | T27 (dos pantallas) |
| 08 | T02, T06, T07, T16 | — | T06, T07, T16, T20, T24 | T27 |
