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

    // =========================================================
    // LECTOR DE CODIGO DE BARRAS
    // Escaneo = 3+ caracteres, todos con menos de 50 ms entre
    // tecla y tecla (RF-001-03, RF-001-45)
    // =========================================================
    const MINIMO_CARACTERES_ESCANEO = 3;
    const MAXIMO_MS_ESCANEO = 50; // 50 justos ya es texto escrito

    // intervalosMs: ms entre una tecla y la siguiente
    function clasificarEntrada(texto, intervalosMs) {
        if (typeof texto !== 'string' || texto.length < MINIMO_CARACTERES_ESCANEO) return 'texto';
        if (!Array.isArray(intervalosMs) || intervalosMs.length === 0) return 'texto';
        const todosRapidos = intervalosMs.every((ms) => ms < MAXIMO_MS_ESCANEO);
        return todosRapidos ? 'escaneo' : 'texto';
    }

    // Solo el codigo_barra exacto de un producto activo; el nombre no cuenta
    function buscarPorCodigo(productos, texto) {
        if (typeof texto !== 'string' || texto === '') return null;
        const encontrado = productos.find((p) => p.activo === true && p.codigo_barra === texto);
        return encontrado || null;
    }

    // =========================================================
    // CATALOGO DEL BUSCADOR
    // Sin mayusculas ni marcas sobre las letras: la ñ se compara
    // como n y la ü como u (RF-001-06)
    // =========================================================
    function normalizarTexto(texto) {
        if (typeof texto !== 'string') return ''; // codigo_barra puede ser null
        return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    }

    // Activos cuyo nombre o codigo contienen el texto; vacio = todos los activos
    function filtrarCatalogo(productos, texto) {
        const buscado = normalizarTexto(texto).trim();
        return productos.filter((p) => p.activo === true && (
            normalizarTexto(p.nombre).includes(buscado) ||
            normalizarTexto(p.codigo_barra).includes(buscado)
        ));
    }

    const PosLogica = { MENSAJES, clasificarEntrada, buscarPorCodigo, filtrarCatalogo };

    // =========================================================
    // SALIDA: Node (tests) o navegador (pos.js) (D1)
    // =========================================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PosLogica;
    } else {
        raiz.PosLogica = PosLogica;
    }
})(typeof window !== 'undefined' ? window : globalThis);
