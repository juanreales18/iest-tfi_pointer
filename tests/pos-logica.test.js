// Tests de sistema/js/pos-logica.js (specs/001-punto-de-venta).
// Prueban la lógica del punto de venta sin navegador ni base.
// Los casos con { todo: true } esperan el código de la tarea siguiente (tasks.md).
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Si el archivo todavía no existe, los casos fallan como `todo` sin cortar el resto de los tests
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
