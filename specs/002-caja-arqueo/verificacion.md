# Verificación · 002-caja-arqueo

Fecha: 2026-11-03 · Verificado por: agente (skill verificar-criterios) · Revisado por: autor (pendiente)

> **Estado:** faltan las pruebas manuales en `pointer-demo`. Este informe no da por terminada la funcionalidad: eso lo decide el autor.
>
> **De dónde sale la evidencia:** `npm test` lo corrió el agente. Las corridas en la base y las pruebas en el navegador las hizo el autor, y el agente solo registra lo que informó. Las pruebas en el navegador fueron en local, con el rol dueño según lo que pudo comprobar el agente; en el sitio publicado solo se comprobó que `caja-logica.js` carga.

## Tests

`npm test`: 265 pasan, 0 fallan.

`tests/sql/caja-guard.sql`, corrido por el autor en la base de Pointer:

| Fecha | Guard | Resultado | Caja antes y después |
|---|---|---|---|
| 2026-11-02 (T12) | Viejo | 15 pasan, 32 fallan: las reglas nuevas fallan, como se esperaba. El script tenía 47 corridas | Igual |
| 2026-11-03 (T14) | Nuevo | 54 pasan, 0 fallan, con los dos roles y el panel | Igual |

## Requisitos

| RF | Estado | Evidencia | Si falla: ¿código o spec? |
|---|---|---|---|
| RF-002-01 | ✅ Cumple | `caja-guard.sql`: «apertura valida», «apertura valida con 0», «apertura con saldo inventado». Test `validarMontoApertura` en `tests/caja-logica.test.js`. `base-de-datos/20-caja-arqueo.sql:57` (paso 6); `sistema/js/app.js:617`; `sistema/js/pos.js:1123` | — |
| RF-002-02 | ✅ Cumple | Tests «app apertura», «app cierre», «pos apertura» y «pos cierre» de `tests/caja.test.js`, y `tests/caja-logica.test.js`. `app.js:617` y `:808`; `pos.js:1123` y `:1187`. El autor vio el mensaje con `1e` en las dos pantallas; falta el campo vacío en el punto de venta (prueba 3) | — |
| RF-002-03 | 🟡 Prueba manual pendiente | La base está comprobada: `caja-guard.sql`, «doble apertura con otro monto» y «con el mismo monto», con el texto exacto. Falta ver el mensaje en pantalla con dos pantallas (prueba 4). `app.js:645`; `pos.js:1147`; `20-caja-arqueo.sql:32` | — |
| RF-002-04 | ✅ Cumple | Tests «app cierre: RF-002-04» y «pos cierre: RF-002-04»; `calcularVistaPrevia` en `tests/caja-logica.test.js`. `app.js:794`; `pos.js:1112`. El autor lo comprobó en local, con y sin red, en las dos pantallas | — |
| RF-002-05 | ✅ Cumple | `caja-guard.sql`: «cierre con diferencia inventada», «sin mandar diferencia», «con contado 0», «sin contado». `20-caja-arqueo.sql:64` (paso 7). Con cierres reales, el autor obtuvo 100,00 desde la sección Caja y −50,00 desde el punto de venta | — |
| RF-002-06 | ✅ Cumple | `caja-guard.sql`: «apertura negativa», «cierre con contado negativo», «cierre con un saldo negativo anterior», con los dos roles. `20-caja-arqueo.sql:51` (paso 5) | — |
| RF-002-07 | 🟡 Prueba manual pendiente | La base está comprobada: `caja-guard.sql`, «segundo cierre» y seis pruebas de «caja cerrada», con el texto exacto y con los dos roles. Falta ver el mensaje en pantalla con dos pantallas (prueba 5). `20-caja-arqueo.sql:21`; `app.js:833`; `pos.js:1209` | — |
| RF-002-08 | 🟡 Prueba manual pendiente | Tests «app resumen» y «pos resumen»; `armarResumenCierre` y `describirDiferencia` en `tests/caja-logica.test.js`. `app.js:877` y `:901`; `pos.js:1261`. El autor lo comprobó en local con un escaneo simulado; falta el lector físico (prueba 6) | — |

## Constitución

| Principio | Resultado | Detalle |
|---|---|---|
| P1 · Stack | ✅ | Sin librerías nuevas. PGlite se usó fuera del repositorio |
| P2 · Marca | ✅ | Sin colores nuevos en el diff de `sistema/`; pasa `marca: no se agregan colores escritos a mano fuera de :root`, que la constitución llama `marca: sin colores escritos a mano` |
| P3 · Capas | ✅ | La diferencia y los rechazos los decide `cajas_guard`; la vista previa solo informa. Vacío y `1e` se frenan en la pantalla, y así lo decide el plan: a la base no le llega un valor que pueda distinguir |
| P4 · Tests | ✅ | Los 8 RF son de prioridad alta y cada uno nombra su test. Cada commit se hizo con `npm test` en verde |
| P5 · Seguridad | ✅ | Sin secretos en el diff: la única coincidencia es el patrón dentro de `tests/caja.test.js`. Sin cambios de RLS: ninguna línea con `POLICY` en el diff de `base-de-datos/` |
| P6 · Idioma | ✅ con observación | Los textos de la spec están letra por letra. `Apertura de caja invalida` queda sin tilde en la base, igual que antes, y `interpretarErrorCaja` lo reemplaza: no se muestra |
| P7 · Accesibilidad | ❌ Observación 1 y 2 | Ver abajo. Tampoco se probó el resumen a 360 px (prueba 8) |
| P8 · Uso de la IA | 🟡 Observación 3 | El autor aprobó cada tarea. Faltan registros en `PROMPTS.md` |

### Observaciones

1. **Contraste del resultado (P7, del código):** contra el fondo blanco, `--color-success` da unos 2,5:1, por debajo del mínimo de 3:1 para texto grande. `--color-danger` da unos 3,8:1: alcanza para el importe, que es grande, pero no para el texto de 16 px, que pide 4,5:1. Afecta a «Sobrante» y «Faltante» en las dos pantallas. Calculado con los colores de `styles.css`, sin Lighthouse. Las palabras se leen igual distinguiendo el resultado, pero con poco contraste.
2. **La X del modal de caja del punto de venta no tiene `aria-label` (P7, ya estaba):** `sistema/pos.html:255`. La spec 002 no la tocó; en el dashboard sí lo tiene.
3. **Errores de la IA sin registrar (P8):** la comprobación pide que cada error de la IA quede en `PROMPTS.md`, y en esta funcionalidad solo está E-07. Faltan, por lo menos, dos: el script no tenía pruebas para los pasos 8 y 9 hasta la T13, y un test de la T19 falló por un espacio mal pedido. El agente los consideró fuera de lugar en la T25; leyendo P8, corresponde registrarlos.
4. **Reapertura con un negativo guardado:** si una caja cerrada ya tiene `saldo_inicial` negativo, se puede reabrir con ese mismo valor, porque RF-002-06 y el paso 5 solo miran si el valor cambia. El guard viejo se lo frenaba al empleado. Hoy la base no tiene ese dato, y no es un incumplimiento de la spec.
5. **Clic adentro y después afuera en el modal de caja del punto de venta (ya estaba):** el modal no se cierra, porque el primer clic consume el listener `{ once: true }`. Fuera del alcance de la spec 002.

## Criterios de finalización

- [x] Cada RF tiene al menos un test automático, un test en `tests/sql/` o una prueba manual descrita acá. *Ver la tabla de requisitos.*
- [x] `npm test` termina en verde, con los tests de `caja-logica.js` en `tests/`. *265 de 265.*
- [x] `tests/sql/` comprueba, en la base de Pointer, que una diferencia inventada se descarta, que un negativo y un saldo inventado se rechazan con los dos roles y que una caja cerrada no cambia. *T14. Se deshace con un error a propósito en lugar de un `ROLLBACK` escrito (D7).*
- [x] `tests/sql/` comprueba, con el `cajas_guard` nuevo, que `crear_venta` y `cancelar_venta` funcionan con la caja abierta y que el `UPDATE cajas` de `90-reinicio-total.sql` sigue pasando. *T14; un test exige que el `UPDATE` sea igual al del archivo.*
- [ ] En `pointer-demo`: abrir con $1.000, vender $500 en efectivo y $300 por transferencia, y cerrar con $1.450 contados. *Pendiente: prueba 1.*
- [ ] Lo mismo, abriendo y cerrando desde la sección Caja y desde el punto de venta. *Pendiente: prueba 1.*
- [ ] Cerrar con el contado vacío muestra el esperado y «Cerrada sin arqueo», y deja `diferencia` en `null`. *Visto en local en las dos pantallas; falta `pointer-demo`: prueba 2.*
- [ ] En Chrome, `1e` en el contado no cierra la caja y muestra el mensaje, en las dos pantallas. *Visto en local; falta `pointer-demo`: prueba 3.*
- [ ] Abrir desde una segunda pantalla sin actualizar no cambia el saldo. *Base comprobada; falta la pantalla: prueba 4.*
- [x] Ninguna política de RLS cambió. *Ninguna línea con `POLICY` en el diff de `base-de-datos/`, y un test lo exige en la migración.*
- [ ] Los mensajes aparecen en voseo, con tildes y tal cual están escritos acá. *Los textos coinciden en el código; falta verlos todos en pantalla.*
- [x] `caja-logica.js` está cargado en `dashboard.html`, `pos.html` y `sw.js`, y `CACHE_VERSION` subió. *`dashboard.html:202`, `pos.html:272`, `sw.js:31`; el autor comprobó el sitio publicado.*

## Pruebas manuales pendientes

Todas en https://pointer-demo.netlify.app/. Hacen falta un usuario dueño y uno empleado.

1. **Flujo completo, con los dos roles y desde las dos pantallas:** abrir con $1.000, vender $500 en efectivo y $300 por transferencia, y cerrar con $1.450. El resumen muestra esperado $1.500,00, contado $1.450,00 y «Faltante» de $50,00, y `cajas.diferencia` vale −50.
2. **Sin contado:** cerrar con el campo vacío. Muestra el esperado y «Cerrada sin arqueo», y `diferencia` queda en `null`.
3. **Valores inválidos en Chrome, en las dos pantallas:** `1e` en la apertura y en el contado, y el campo vacío en la apertura. Sale «Ingresá un monto de 0 o más» y no cambia nada. El campo vacío en el punto de venta no quedó confirmado en local.
4. **RF-002-03, dos pantallas:** con la caja cerrada, dejar el modal de apertura abierto en una pantalla, abrir la caja desde otra y confirmar en la primera. Sale «La caja ya está abierta», el saldo no cambia y la pantalla se actualiza; en el punto de venta, «Cobrar» queda disponible.
5. **RF-002-07 y D6, dos pantallas:** con la caja abierta, dejar el modal de cierre abierto en una, cerrar desde la otra y confirmar en la primera: sale «La caja ya fue cerrada». Después, con la pantalla sin actualizar, tocar de nuevo para cerrar: avisa lo mismo y no abre el modal.
6. **RF-002-08, lector físico:** con el resumen abierto en el punto de venta, escanear un producto. El resumen no se cierra y el carrito no cambia. Después de «Listo», el lector vuelve a funcionar.
7. **Sin internet en el sitio publicado:** en las dos pantallas, se ve «No se pudo leer el efectivo esperado. Revisá la conexión.», nunca $0; al cerrar, «No se pudo cerrar la caja», se conserva lo escrito y «Cobrar» sigue disponible.
8. **A 360 px:** el resumen de cierre se lee entero y «Listo» se puede tocar.

## Conclusión

5 de 8 RF cumplen, 3 tienen una prueba manual pendiente y ninguno está incumplido. Hay un problema de accesibilidad que resolver en el código (observación 1) y registros que faltan en `PROMPTS.md` (observación 3). Para decidir si termina la funcionalidad, faltan las 8 pruebas manuales y la decisión del autor sobre las observaciones.
