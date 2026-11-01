/* =============================================================
   POINTER - POS-LOGICA.JS
   Logica pura del Punto de Venta (specs/001-punto-de-venta)
   Sin pantalla ni base: recibe datos y devuelve resultados.
   La usa pos.js y la prueba tests/pos-logica.test.js
   ============================================================= */

(function (raiz) {
    'use strict';

    // =========================================================
    // MENSAJES DE LA PANTALLA
    // Cada texto es el de spec.md, letra por letra (D9)
    // =========================================================
    const MENSAJES = Object.freeze({
        cajaCerrada:       'Abrí la caja para empezar a vender',                  // RF-001-01
        sinPrecio:         'Este producto no tiene precio. Avisale al dueño.',    // RF-001-40
        sinMetodo:         'Elegí un método de pago',                             // RF-001-16
        montoInsuficiente: 'El monto recibido es menor al total',                 // RF-001-18
        vueltoAlto:        'El vuelto es mayor que el total. Presioná Enter otra vez para confirmar.', // RF-001-43
        sinConexion:       'Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.', // RF-001-24
        sesionVencida:     'Tu sesión venció. Ingresá de nuevo para seguir vendiendo.', // RF-001-39

        productoNoEncontrado: (codigo) => `No encontramos ese producto (código: ${codigo})`, // RF-001-05
        stockDisponible:      (stock) => `Stock disponible: ${stock}`,                      // RF-001-09
    });

    const PosLogica = { MENSAJES };

    // =========================================================
    // SALIDA: Node (tests) o navegador (pos.js) (D1)
    // =========================================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PosLogica;
    } else {
        raiz.PosLogica = PosLogica;
    }
})(typeof window !== 'undefined' ? window : globalThis);
