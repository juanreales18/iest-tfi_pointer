/* =============================================================
   POINTER - CAJA-LOGICA.JS
   Logica pura de la caja y el arqueo (specs/002-caja-arqueo)
   Sin pantalla ni base: recibe datos y devuelve resultados.
   La usan app.js y pos.js, y la prueba tests/caja-logica.test.js
   El dato que vale es el de la base: esto valida, informa y elige textos (P3)
   ============================================================= */

(function (raiz) {
    'use strict';

    // =========================================================
    // MENSAJES DE LA PANTALLA
    // Cada texto es el de spec.md, letra por letra (D9)
    // =========================================================
    const MENSAJES = Object.freeze({
        montoInvalido:   'Ingresá un monto de 0 o más',   // RF-002-02
        cajaYaAbierta:   'La caja ya está abierta',       // RF-002-03
        cajaYaCerrada:   'La caja ya fue cerrada',        // RF-002-07
        sobrante:        'Sobrante',                      // RF-002-08
        faltante:        'Faltante',                      // RF-002-08
        sinDiferencia:   'Sin diferencia',                // RF-002-08
        sinArqueo:       'Cerrada sin arqueo',            // RF-002-08
        listo:           'Listo',                         // RF-002-08
        esperadoNoLeido: 'No se pudo leer el efectivo esperado. Revisá la conexión.', // caso límite 10
        noSePudoCerrar:  'No se pudo cerrar la caja',     // caso límite 10
        noSePudoAbrir:   'No se pudo abrir la caja',      // RF-002-03
    });

    const CajaLogica = {
        MENSAJES,
    };

    // =========================================================
    // SALIDA: Node (tests) o navegador (app.js y pos.js) (D1)
    // =========================================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CajaLogica;
    } else {
        raiz.CajaLogica = CajaLogica;
    }
})(typeof window !== 'undefined' ? window : globalThis);
