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

    // =========================================================
    // STOCK DEL CARRITO
    // Devuelven { ok, cantidad, mensaje }: cantidad es la que
    // tiene que quedar; mensaje es null si ok es true (RF-001-09)
    // =========================================================
    function validarCantidad(cantidad, anterior, stock) {
        if (cantidad > stock) {
            return { ok: false, cantidad: anterior, mensaje: MENSAJES.stockDisponible(stock) };
        }
        return { ok: true, cantidad, mensaje: null };
    }

    // Nuevo = cantidad 1; ya en el carrito = +1 (RF-001-03, RF-001-04, RF-001-07)
    function validarAgregado(producto, carrito) {
        const linea = carrito.find((item) => item.id === producto.id);
        const anterior = linea ? linea.cantidad : 0;
        return validarCantidad(anterior + 1, anterior, producto.stock_actual);
    }

    // =========================================================
    // TOTALES
    // Solo para mostrar: el total oficial lo decide crear_venta (D2).
    // Todo en centavos enteros, en el mismo orden que crear_venta.
    // Precios y porcentajes nunca son negativos, asi que Math.round
    // redondea igual que round(..., 2) de PostgreSQL
    // =========================================================
    function aCentavos(pesos) {
        return Math.round(pesos * 100);
    }

    // El porcentaje pasa a centesimos enteros: multiplicado con
    // decimales corre el medio centavo (1,13 % de 50,00 daria 56)
    function porcentajeEnCentavos(centavos, porcentaje) {
        return Math.round(centavos * Math.round(porcentaje * 100) / 10000);
    }

    // carrito: lineas con precio en pesos; devuelve todo en centavos
    function calcularTotales(carrito, descuentoPct, impuestoPct) {
        const subtotal = carrito.reduce((suma, item) => suma + aCentavos(item.precio) * item.cantidad, 0);
        const descuento = porcentajeEnCentavos(subtotal, descuentoPct);
        const neto = subtotal - descuento;
        const impuesto = porcentajeEnCentavos(neto, impuestoPct);
        return { subtotal, descuento, neto, impuesto, total: neto + impuesto };
    }

    // =========================================================
    // BOTON COBRAR
    // Solo mira el carrito (RF-001-12). Sin metodo sigue habilitado
    // para que se vea el mensaje de RF-001-16 (D8). La caja cerrada
    // la controla pos.js
    // =========================================================
    function puedeCobrar(estado) {
        return estado.carrito.length > 0;
    }

    // =========================================================
    // ERRORES AL COBRAR
    // navigator.onLine puede decir en linea aunque el pedido no
    // llegue: eso tambien es sin conexion (RF-001-24). Un rechazo
    // de la base trae code y su texto pasa tal cual (RF-001-26),
    // aunque un producto se llame «Cable Network»
    // =========================================================
    const ERROR_DE_RED = /Failed to fetch|NetworkError|Load failed|network/i;

    function mensajeDeError(error, enLinea) {
        const texto = error?.message || '';
        const noLlego = !error?.code && ERROR_DE_RED.test(texto);
        if (!enLinea || noLlego) return MENSAJES.sinConexion;
        return texto || 'No se pudo procesar la venta';
    }

    const PosLogica = {
        MENSAJES,
        clasificarEntrada,
        buscarPorCodigo,
        filtrarCatalogo,
        validarAgregado,
        validarCantidad,
        calcularTotales,
        puedeCobrar,
        mensajeDeError,
    };

    // =========================================================
    // SALIDA: Node (tests) o navegador (pos.js) (D1)
    // =========================================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PosLogica;
    } else {
        raiz.PosLogica = PosLogica;
    }
})(typeof window !== 'undefined' ? window : globalThis);
