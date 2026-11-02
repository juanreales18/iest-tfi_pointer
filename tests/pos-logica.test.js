// Tests de sistema/js/pos-logica.js (specs/001-punto-de-venta).
// Prueban la lógica del punto de venta sin navegador ni base.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Si el archivo no se puede cargar, los casos fallan sin cortar el resto de los tests
function cargarPosLogica() {
    try {
        return require(path.join(__dirname, '..', 'sistema', 'js', 'pos-logica.js'));
    } catch {
        return {};
    }
}

const PosLogica = cargarPosLogica();
const MENSAJES = PosLogica.MENSAJES || {};

// ---------------------------------------------------------------
// MENSAJES: cada texto igual al de spec.md, letra por letra
// ---------------------------------------------------------------
const TEXTOS_FIJOS = [
    ['RF-001-01', 'cajaCerrada', 'Abrí la caja para empezar a vender'],
    ['RF-001-40', 'sinPrecio', 'Este producto no tiene precio. Avisale al dueño.'],
    ['RF-001-16', 'sinMetodo', 'Elegí un método de pago'],
    ['RF-001-18', 'montoInsuficiente', 'El monto recibido es menor al total'],
    ['RF-001-43', 'vueltoAlto', 'El vuelto es mayor que el total. Presioná Enter otra vez para confirmar.'],
    ['RF-001-24', 'sinConexion', 'Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.'],
    ['RF-001-39', 'sesionVencida', 'Tu sesión venció. Ingresá de nuevo para seguir vendiendo.'],
];

for (const [rf, clave, texto] of TEXTOS_FIJOS) {
    test(`mensajes: ${rf} · ${clave}`, () => {
        assert.equal(MENSAJES[clave], texto);
    });
}

test('mensajes: RF-001-05 · productoNoEncontrado incluye el código', () => {
    assert.equal(MENSAJES.productoNoEncontrado('7790001'), 'No encontramos ese producto (código: 7790001)');
});

test('mensajes: RF-001-09 · stockDisponible incluye el stock', () => {
    assert.equal(MENSAJES.stockDisponible(3), 'Stock disponible: 3');
});

// ---------------------------------------------------------------
// LECTOR: clasificarEntrada y buscarPorCodigo (T03 → T04)
// clasificarEntrada recibe los ms entre una tecla y la siguiente.
// Escaneo = 3+ caracteres y todos los intervalos con menos de 50 ms.
// ---------------------------------------------------------------
const PRODUCTOS = [
    { id: 1, nombre: 'Alfajor triple', codigo_barra: '7790001', activo: true },
    { id: 2, nombre: 'Gaseosa 500', codigo_barra: '7790002', activo: true },
    { id: 3, nombre: 'Chicle menta', codigo_barra: '7790003', activo: false },
    { id: 4, nombre: '7790009', codigo_barra: '1234567', activo: true },
    { id: 5, nombre: 'Caramelo suelto', codigo_barra: null, activo: true },
];

test('lector: RF-001-03 · 3 caracteres rápidos son un escaneo', () => {
    assert.equal(PosLogica.clasificarEntrada('779', [10, 12, 8]), 'escaneo');
});

test('lector: RF-001-03 · un código largo rápido es un escaneo', () => {
    assert.equal(PosLogica.clasificarEntrada('7790001', [5, 6, 4, 7, 5, 6, 30]), 'escaneo');
});

test('lector: RF-001-45 · 2 caracteres rápidos son texto escrito', () => {
    assert.equal(PosLogica.clasificarEntrada('77', [5, 5]), 'texto');
});

test('lector: RF-001-45 · un intervalo lento convierte todo en texto escrito', () => {
    assert.equal(PosLogica.clasificarEntrada('7790001', [5, 6, 4, 120, 5, 6, 5]), 'texto');
});

test('lector: RF-001-45 · 50 ms justos ya no son escaneo', () => {
    assert.equal(PosLogica.clasificarEntrada('7790001', [49, 49, 49, 50, 49, 49, 49]), 'texto');
});

test('lector: RF-001-45 · tipeo a mano es texto escrito', () => {
    assert.equal(PosLogica.clasificarEntrada('alfajor', [180, 210, 150, 240, 190, 170, 300]), 'texto');
});

test('lector: RF-001-45 · sin intervalos medidos no es escaneo', () => {
    assert.equal(PosLogica.clasificarEntrada('7790001', []), 'texto');
});

test('lector: RF-001-03 · código exacto encuentra el producto activo', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '7790002'), PRODUCTOS[1]);
});

test('lector: RF-001-03 · el nombre exacto no cuenta como código', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, 'Alfajor triple'), null);
    // El producto 4 se llama «7790009», pero su código es otro
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '7790009'), null);
});

test('lector: RF-001-03 · una parte del código no alcanza', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '779000'), null);
});

test('lector: RF-001-05 · un producto inactivo no aparece aunque el código coincida', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '7790003'), null);
});

test('lector: RF-001-05 · un código que no existe devuelve null', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '0000000'), null);
});

test('lector: RF-001-45 · texto vacío no encuentra productos sin código', () => {
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, ''), null);
});

test('lector: RF-001-04 · buscar no cambia la lista de productos', () => {
    const copia = structuredClone(PRODUCTOS);
    PosLogica.buscarPorCodigo(PRODUCTOS, '7790001');
    assert.deepEqual(PRODUCTOS, copia);
});

test('lector: caso límite 1 · escaneo dentro del buscador agrega, no busca', () => {
    // El lector escribe en el campo de búsqueda: lo que decide es la velocidad, no dónde está el cursor
    const texto = '7790001';
    assert.equal(PosLogica.clasificarEntrada(texto, [6, 5, 7, 4, 6, 5, 8]), 'escaneo');
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, texto), PRODUCTOS[0]);
});

test('lector: caso límite 2 · dos escaneos seguidos se clasifican cada uno por separado', () => {
    // Cada escaneo trae solo sus intervalos; el segundo no se pega al primero.
    // Que la cantidad quede en 2 lo prueba validarAgregado (T07).
    const intervalos = [6, 5, 7, 4, 6, 5, 8];
    assert.equal(PosLogica.clasificarEntrada('7790001', intervalos), 'escaneo');
    assert.equal(PosLogica.clasificarEntrada('7790001', intervalos), 'escaneo');
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '7790001'), PRODUCTOS[0]);
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, '7790001'), PRODUCTOS[0]);
});

test('lector: caso límite 15 · código escrito a mano que no existe no lleva aviso', () => {
    // Texto escrito + sin coincidencia: queda como búsqueda, sin el aviso de RF-001-05
    const texto = '7799999';
    assert.equal(PosLogica.clasificarEntrada(texto, [200, 180, 220, 190, 210, 230, 250]), 'texto');
    assert.equal(PosLogica.buscarPorCodigo(PRODUCTOS, texto), null);
});

// ---------------------------------------------------------------
// CATÁLOGO: filtrarCatalogo (T05 → T06)
// Activos cuyo nombre o código contienen el texto, sin mayúsculas ni
// marcas sobre las letras; espacios de los bordes no cuentan; vacío = todos.
// Se comparan los id para que el orden de la lista también quede probado.
// ---------------------------------------------------------------
const CATALOGO = [
    { id: 1, nombre: 'Alfajor triple', codigo_barra: '7790001', activo: true },
    { id: 2, nombre: 'Gaseosa 500', codigo_barra: '7790002', activo: true },
    { id: 3, nombre: 'Chicle menta', codigo_barra: '7790003', activo: false },
    { id: 4, nombre: 'Alfajor simple', codigo_barra: '7790004', activo: false },
    { id: 5, nombre: 'Café molido', codigo_barra: '7790005', activo: true },
    { id: 6, nombre: 'Galletitas Ñandú', codigo_barra: '7790006', activo: true },
    { id: 7, nombre: 'Pingüino de chocolate', codigo_barra: '7790007', activo: true },
    { id: 8, nombre: 'Caramelo suelto', codigo_barra: null, activo: true },
];

const ACTIVOS = [1, 2, 5, 6, 7, 8];

function idsFiltrados(texto, productos = CATALOGO) {
    return PosLogica.filtrarCatalogo(productos, texto).map((p) => p.id);
}

test('catálogo: RF-001-06 · encuentra por una parte del nombre', () => {
    assert.deepEqual(idsFiltrados('fajor'), [1]);
});

test('catálogo: RF-001-06 · encuentra por una parte del código', () => {
    assert.deepEqual(idsFiltrados('0002'), [2]);
    assert.deepEqual(idsFiltrados('77900'), [1, 2, 5, 6, 7]);
});

test('catálogo: RF-001-06 · no distingue mayúsculas', () => {
    assert.deepEqual(idsFiltrados('ALFAJOR'), [1]);
    assert.deepEqual(idsFiltrados('gAsEoSa'), [2]);
});

test('catálogo: RF-001-06 · un producto inactivo no aparece aunque coincida', () => {
    assert.deepEqual(idsFiltrados('chicle'), []);
    assert.deepEqual(idsFiltrados('7790004'), []);
});

test('catálogo: RF-001-06 · no distingue tildes', () => {
    assert.deepEqual(idsFiltrados('cafe'), [5]);
    assert.deepEqual(idsFiltrados('CAFÉ'), [5]);
    assert.deepEqual(idsFiltrados('móli'), [5]);
});

test('catálogo: RF-001-06 · la ñ se compara como n', () => {
    assert.deepEqual(idsFiltrados('nandu'), [6]);
    assert.deepEqual(idsFiltrados('ÑANDÚ'), [6]);
});

test('catálogo: RF-001-06 · la diéresis no cuenta', () => {
    assert.deepEqual(idsFiltrados('pinguino'), [7]);
});

test('catálogo: RF-001-06 · un producto sin código no rompe el filtro', () => {
    assert.deepEqual(idsFiltrados('caramelo'), [8]);
    assert.deepEqual(idsFiltrados('779'), [1, 2, 5, 6, 7]);
});

test('catálogo: caso límite 15 · sin coincidencia la lista queda vacía', () => {
    assert.deepEqual(idsFiltrados('7799999'), []);
});

test('catálogo: RF-001-46 · los espacios del principio y del final no cuentan', () => {
    assert.deepEqual(idsFiltrados('  alfajor  '), [1]);
    assert.deepEqual(idsFiltrados(' 0002 '), [2]);
});

test('catálogo: RF-001-46 · los espacios del medio sí cuentan', () => {
    assert.deepEqual(idsFiltrados('alfajor triple'), [1]);
    assert.deepEqual(idsFiltrados('alfajortriple'), []);
});

test('catálogo: RF-001-47 · texto vacío muestra todos los activos', () => {
    assert.deepEqual(idsFiltrados(''), ACTIVOS);
});

test('catálogo: RF-001-47 · texto con solo espacios muestra todos los activos', () => {
    assert.deepEqual(idsFiltrados('   '), ACTIVOS);
});

test('catálogo: RF-001-06 · filtrar no cambia la lista de productos', () => {
    const copia = structuredClone(CATALOGO);
    PosLogica.filtrarCatalogo(CATALOGO, 'cafe');
    PosLogica.filtrarCatalogo(CATALOGO, '');
    assert.deepEqual(CATALOGO, copia);
});

test('catálogo: RF-001-06 · con 2.000 productos filtra en menos de 100 ms', () => {
    // Uno de cada 10 sin código y uno de cada 7 inactivo, como en un kiosco real
    const productos = Array.from({ length: 2000 }, (_, i) => ({
        id: i + 1,
        nombre: `Producto de prueba ${i + 1} Ñandú`,
        codigo_barra: i % 10 === 0 ? null : String(7790000000 + i),
        activo: i % 7 !== 0,
    }));
    for (const texto of ['producto de prueba 1', 'NANDU', '7790001', '']) {
        const inicio = performance.now();
        const resultado = PosLogica.filtrarCatalogo(productos, texto);
        const duracion = performance.now() - inicio;
        assert.ok(resultado.length > 0, `«${texto}» tiene que encontrar productos`);
        assert.ok(duracion < 100, `«${texto}» tardó ${duracion.toFixed(1)} ms`);
    }
});

// ---------------------------------------------------------------
// STOCK: validarAgregado y validarCantidad (T07)
// Las dos devuelven { ok, cantidad, mensaje }: cantidad es la que
// tiene que quedar en el carrito; mensaje es null si ok es true.
// ---------------------------------------------------------------
const ALFAJOR = { id: 1, nombre: 'Alfajor triple', codigo_barra: '7790001', activo: true, stock_actual: 3 };
const GASEOSA = { id: 2, nombre: 'Gaseosa 500', codigo_barra: '7790002', activo: true, stock_actual: 5 };
const AGOTADO = { id: 3, nombre: 'Chicle menta', codigo_barra: '7790003', activo: true, stock_actual: 0 };

test('stock: RF-001-03 · un producto nuevo entra con cantidad 1', () => {
    assert.deepEqual(PosLogica.validarAgregado(ALFAJOR, []), { ok: true, cantidad: 1, mensaje: null });
});

test('stock: RF-001-04 · un producto que ya está en el carrito suma 1', () => {
    const carrito = [{ id: 1, cantidad: 1 }];
    assert.deepEqual(PosLogica.validarAgregado(ALFAJOR, carrito), { ok: true, cantidad: 2, mensaje: null });
});

test('stock: RF-001-07 · elegir de la lista sigue las mismas reglas', () => {
    const [elegido] = PosLogica.filtrarCatalogo([ALFAJOR, GASEOSA], 'alfajor');
    assert.deepEqual(PosLogica.validarAgregado(elegido, []), { ok: true, cantidad: 1, mensaje: null });
    assert.deepEqual(PosLogica.validarAgregado(elegido, [{ id: 1, cantidad: 1 }]), { ok: true, cantidad: 2, mensaje: null });
});

test('stock: RF-001-09 · se puede agregar la última unidad', () => {
    const carrito = [{ id: 1, cantidad: 2 }];
    assert.deepEqual(PosLogica.validarAgregado(ALFAJOR, carrito), { ok: true, cantidad: 3, mensaje: null });
});

test('stock: RF-001-09 · superar el stock deja la cantidad anterior y avisa', () => {
    const carrito = [{ id: 1, cantidad: 3 }];
    assert.deepEqual(PosLogica.validarAgregado(ALFAJOR, carrito), { ok: false, cantidad: 3, mensaje: 'Stock disponible: 3' });
});

test('stock: caso límite 3 · un producto con stock 0 no entra al carrito', () => {
    assert.deepEqual(PosLogica.validarAgregado(AGOTADO, []), { ok: false, cantidad: 0, mensaje: 'Stock disponible: 0' });
});

test('stock: caso límite 2 · dos escaneos seguidos dejan la cantidad en 2', () => {
    const carrito = [];
    const primero = PosLogica.validarAgregado(ALFAJOR, carrito);
    carrito.push({ id: ALFAJOR.id, cantidad: primero.cantidad });
    const segundo = PosLogica.validarAgregado(ALFAJOR, carrito);
    assert.equal(segundo.cantidad, 2);
});

test('stock: RF-001-04 · otro producto del carrito no cuenta', () => {
    const carrito = [{ id: 2, cantidad: 4 }];
    assert.deepEqual(PosLogica.validarAgregado(ALFAJOR, carrito), { ok: true, cantidad: 1, mensaje: null });
});

test('stock: validarAgregado no cambia el carrito ni el producto', () => {
    const carrito = [{ id: 1, cantidad: 1 }];
    const copiaCarrito = structuredClone(carrito);
    const copiaProducto = structuredClone(ALFAJOR);
    PosLogica.validarAgregado(ALFAJOR, carrito);
    assert.deepEqual(carrito, copiaCarrito);
    assert.deepEqual(ALFAJOR, copiaProducto);
});

test('stock: RF-001-09 · una cantidad dentro del stock se acepta', () => {
    assert.deepEqual(PosLogica.validarCantidad(2, 1, 3), { ok: true, cantidad: 2, mensaje: null });
});

test('stock: RF-001-09 · una cantidad igual al stock se acepta', () => {
    assert.deepEqual(PosLogica.validarCantidad(3, 1, 3), { ok: true, cantidad: 3, mensaje: null });
});

test('stock: RF-001-09 · una cantidad que supera el stock vuelve a la anterior y avisa', () => {
    assert.deepEqual(PosLogica.validarCantidad(4, 2, 3), { ok: false, cantidad: 2, mensaje: 'Stock disponible: 3' });
});

test('stock: RF-001-09 · con stock 0 vuelve a la anterior y avisa', () => {
    assert.deepEqual(PosLogica.validarCantidad(2, 1, 0), { ok: false, cantidad: 1, mensaje: 'Stock disponible: 0' });
});

// ---------------------------------------------------------------
// TOTALES: calcularTotales (T08)
// Recibe el carrito con precios en pesos y devuelve todo en centavos
// enteros. Sigue a crear_venta: descuento e impuesto se redondean por
// separado, con la mitad lejos del cero; el total no se vuelve a redondear.
// ---------------------------------------------------------------
test('totales: RF-001-42 · un carrito vacío da todo en 0', () => {
    assert.deepEqual(PosLogica.calcularTotales([], 0, 0), { subtotal: 0, descuento: 0, neto: 0, impuesto: 0, total: 0 });
});

test('totales: RF-001-42 · con impuesto 0 el total es la suma de los precios', () => {
    const carrito = [{ id: 1, precio: 100, cantidad: 2 }, { id: 2, precio: 50.5, cantidad: 1 }];
    assert.deepEqual(PosLogica.calcularTotales(carrito, 0, 0), { subtotal: 25050, descuento: 0, neto: 25050, impuesto: 0, total: 25050 });
});

test('totales: RF-001-42 · con impuesto 21 % lo suma encima del precio', () => {
    const carrito = [{ id: 1, precio: 100, cantidad: 1 }];
    assert.deepEqual(PosLogica.calcularTotales(carrito, 0, 21), { subtotal: 10000, descuento: 0, neto: 10000, impuesto: 2100, total: 12100 });
});

test('totales: RF-001-42 · medio centavo de impuesto se redondea hacia arriba', () => {
    // 2,50 × 21 % = 0,525
    const carrito = [{ id: 1, precio: 2.5, cantidad: 1 }];
    assert.deepEqual(PosLogica.calcularTotales(carrito, 0, 21), { subtotal: 250, descuento: 0, neto: 250, impuesto: 53, total: 303 });
});

test('totales: RF-001-42 · menos de medio centavo se redondea hacia abajo', () => {
    // 2,49 × 21 % = 0,5229
    const carrito = [{ id: 1, precio: 2.49, cantidad: 1 }];
    assert.equal(PosLogica.calcularTotales(carrito, 0, 21).impuesto, 52);
});

test('totales: RF-001-42 · los decimales de JavaScript no corren el medio centavo', () => {
    // 50,00 × 1,13 % = 0,565; multiplicado en decimales da 56
    const carrito = [{ id: 1, precio: 50, cantidad: 1 }];
    assert.equal(PosLogica.calcularTotales(carrito, 0, 1.13).impuesto, 57);
});

test('totales: RF-001-42 · los precios no acumulan error de decimales', () => {
    assert.equal(PosLogica.calcularTotales([{ id: 1, precio: 19.99, cantidad: 3 }], 0, 0).total, 5997);
    assert.equal(PosLogica.calcularTotales([{ id: 1, precio: 1.1, cantidad: 3 }], 0, 0).total, 330);
    const carrito = [{ id: 1, precio: 0.1, cantidad: 1 }, { id: 2, precio: 0.2, cantidad: 1 }];
    assert.equal(PosLogica.calcularTotales(carrito, 0, 0).total, 30);
});

test('totales: RF-001-42 · el impuesto se redondea sobre el total, no por línea', () => {
    // 0,50 × 10 % = 5 centavos; línea por línea daría 3 + 3
    const carrito = [{ id: 1, precio: 0.25, cantidad: 1 }, { id: 2, precio: 0.25, cantidad: 1 }];
    assert.equal(PosLogica.calcularTotales(carrito, 0, 10).impuesto, 5);
});

test('totales: RF-001-42 · el impuesto se calcula sobre el neto, después del descuento', () => {
    // Descuento: 2,50 × 21 % = 0,525 → 53. Impuesto: 1,97 × 21 % = 0,4137 → 41
    const carrito = [{ id: 1, precio: 2.5, cantidad: 1 }];
    assert.deepEqual(PosLogica.calcularTotales(carrito, 21, 21), { subtotal: 250, descuento: 53, neto: 197, impuesto: 41, total: 238 });
});

test('totales: RF-001-10 · cambiar la cantidad recalcula el total', () => {
    const antes = [{ id: 1, precio: 100, cantidad: 1 }];
    const despues = [{ id: 1, precio: 100, cantidad: 3 }];
    assert.equal(PosLogica.calcularTotales(antes, 0, 21).total, 12100);
    assert.equal(PosLogica.calcularTotales(despues, 0, 21).total, 36300);
});

test('totales: RF-001-11 · quitar un producto recalcula el total', () => {
    const antes = [{ id: 1, precio: 100, cantidad: 1 }, { id: 2, precio: 50, cantidad: 2 }];
    const despues = [{ id: 1, precio: 100, cantidad: 1 }];
    assert.equal(PosLogica.calcularTotales(antes, 0, 0).total, 20000);
    assert.equal(PosLogica.calcularTotales(despues, 0, 0).total, 10000);
});

test('totales: RF-001-11 · quitar el último producto deja el total en 0', () => {
    assert.equal(PosLogica.calcularTotales([], 0, 21).total, 0);
});

test('totales: calcularTotales no cambia el carrito', () => {
    const carrito = [{ id: 1, precio: 19.99, cantidad: 2 }];
    const copia = structuredClone(carrito);
    PosLogica.calcularTotales(carrito, 10, 21);
    assert.deepEqual(carrito, copia);
});

// ---------------------------------------------------------------
// COBRAR: puedeCobrar (T09)
// Solo mira el carrito. El método de pago no cuenta (D8) y la caja
// cerrada se sigue controlando en pos.js (se confirma en T13).
// ---------------------------------------------------------------
const LINEA = { id: 1, precio: 100, cantidad: 1 };

test('cobrar: RF-001-12 · con el carrito vacío no se puede cobrar', () => {
    assert.equal(PosLogica.puedeCobrar({ carrito: [] }), false);
});

test('cobrar: RF-001-12 · con productos en el carrito se puede cobrar', () => {
    assert.equal(PosLogica.puedeCobrar({ carrito: [LINEA] }), true);
});

test('cobrar: RF-001-12 · el carrito vacío no se puede cobrar aunque haya método', () => {
    assert.equal(PosLogica.puedeCobrar({ carrito: [], metodoPagoId: 1 }), false);
});

test('cobrar: RF-001-16 · sin método elegido se puede tocar Cobrar (D8)', () => {
    assert.equal(PosLogica.puedeCobrar({ carrito: [LINEA], metodoPagoId: null }), true);
});

test('cobrar: la caja no entra en la regla de puedeCobrar', () => {
    assert.equal(PosLogica.puedeCobrar({ carrito: [LINEA], cajaAbierta: false }), true);
});

test('cobrar: puedeCobrar no cambia el estado', () => {
    const estado = { carrito: [LINEA], metodoPagoId: null };
    const copia = structuredClone(estado);
    PosLogica.puedeCobrar(estado);
    assert.deepEqual(estado, copia);
});

// ---------------------------------------------------------------
// ERRORES AL COBRAR: mensajeDeError (T10)
// Sin conexión: el texto de RF-001-24. Un rechazo de la base trae
// code (P0001 en los RAISE EXCEPTION de crear_venta) y su texto pasa
// tal cual. Un pedido que no llegó no trae code y trae el texto del
// navegador, distinto en cada uno.
// ---------------------------------------------------------------
const SIN_CONEXION = 'Sin conexión a internet. La venta no se registró: volvé a intentar cuando vuelva la conexión.';

test('errores: RF-001-24 · sin conexión devuelve el mensaje de la spec', () => {
    assert.equal(PosLogica.mensajeDeError({ message: 'Failed to fetch' }, false), SIN_CONEXION);
});

test('errores: RF-001-24 · sin conexión y sin detalle del error devuelve el mismo mensaje', () => {
    assert.equal(PosLogica.mensajeDeError(null, false), SIN_CONEXION);
});

for (const texto of [
    'Failed to fetch',
    'TypeError: Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'Load failed',
]) {
    test(`errores: RF-001-24 · el pedido no llegó aunque el navegador diga en línea: «${texto}»`, () => {
        assert.equal(PosLogica.mensajeDeError({ message: texto, code: '' }, true), SIN_CONEXION);
    });
}

for (const texto of [
    'Stock insuficiente de "Alfajor triple" (disponible: 2)', // caso límite 4
    'La caja esta cerrada',                                   // caso límite 5
    'El producto "Alfajor triple" no esta activo',            // caso límite 6
]) {
    test(`errores: RF-001-26 · el rechazo de la base pasa tal cual: «${texto}»`, () => {
        assert.equal(PosLogica.mensajeDeError({ message: texto, code: 'P0001' }, true), texto);
    });
}

test('errores: RF-001-26 · un producto con «network» en el nombre no parece un corte de red', () => {
    const texto = 'El producto "Cable Network 5m" no esta activo';
    assert.equal(PosLogica.mensajeDeError({ message: texto, code: 'P0001' }, true), texto);
});

test('errores: RF-001-26 · sin texto del error no devuelve vacío', () => {
    assert.equal(PosLogica.mensajeDeError({ message: '' }, true), 'No se pudo procesar la venta');
    assert.equal(PosLogica.mensajeDeError(null, true), 'No se pudo procesar la venta');
});

test('errores: mensajeDeError no cambia el error', () => {
    const error = { message: 'La caja esta cerrada', code: 'P0001' };
    const copia = structuredClone(error);
    PosLogica.mensajeDeError(error, true);
    assert.deepEqual(error, copia);
});
