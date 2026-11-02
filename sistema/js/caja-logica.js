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

    // =========================================================
    // APERTURA
    // entradaInvalida = validity.badInput del campo: con un texto
    // invalido, type="number" entrega el valor vacio (H-04).
    // Number y no parseFloat(x) || 0, que toma el vacio como 0
    // =========================================================
    function validarMontoApertura(valor, entradaInvalida) {
        const texto = String(valor ?? '').trim();
        const monto = Number(texto);
        if (entradaInvalida || texto === '' || !Number.isFinite(monto) || monto < 0) {
            return { valido: false, mensaje: MENSAJES.montoInvalido };
        }
        return { valido: true, monto };
    }

    // =========================================================
    // CONTADO
    // Es opcional: vacio cierra sin arqueo (null) y 0 es un contado.
    // Vacio con entradaInvalida no cuenta como vacio (caso limite 11)
    // =========================================================
    function validarContado(valor, entradaInvalida) {
        if (!entradaInvalida && String(valor ?? '').trim() === '') {
            return { valido: true, contado: null };
        }
        const resultado = validarMontoApertura(valor, entradaInvalida);
        return resultado.valido ? { valido: true, contado: resultado.monto } : resultado;
    }

    // =========================================================
    // VISTA PREVIA
    // Solo informa: la diferencia que vale la calcula la base (P3).
    // En centavos enteros. Sin esperado no hay diferencia: Number('')
    // y Number(null) dan 0 y mostrarian un resultado falso (caso limite 10)
    // =========================================================
    function aCentavos(valor) {
        if (valor === null || valor === undefined || valor === '') return null;
        const pesos = Number(valor);
        return Number.isFinite(pesos) ? Math.round(pesos * 100) : null;
    }

    function calcularVistaPrevia(esperado, contado) {
        const centavosEsperados = aCentavos(esperado);
        const centavosContados = aCentavos(contado);
        if (centavosEsperados === null || centavosContados === null) return null;
        return (centavosContados - centavosEsperados) / 100;
    }

    const CajaLogica = {
        MENSAJES,
        validarMontoApertura,
        validarContado,
        calcularVistaPrevia,
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
