// Tests de los archivos de la pantalla del punto de venta (specs/001-punto-de-venta).
// Leen pos.html, pos.js y sw.js sin abrir el navegador.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'sistema');
const leer = (...ruta) => fs.readFileSync(path.join(SRC, ...ruta), 'utf8');

// ---------------------------------------------------------------
// CARGA: si pos-logica.js no llega antes que pos.js, la pantalla falla
// ---------------------------------------------------------------
test('carga: pos.html carga pos-logica.js antes de pos.js', () => {
    const scripts = [...leer('pos.html').matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
    const logica = scripts.indexOf('js/pos-logica.js');
    assert.notEqual(logica, -1, 'pos.html no carga js/pos-logica.js');
    assert.ok(logica < scripts.indexOf('js/pos.js'), `Orden actual: ${scripts.join(', ')}`);
});

test('carga: sw.js lista pos-logica.js', () => {
    assert.match(leer('sw.js'), /['"]\/js\/pos-logica\.js['"]/);
});

// ---------------------------------------------------------------
// RF-001-19: la venta se registra solo con crear_venta
// ---------------------------------------------------------------
test('cobro: RF-001-19 · pos.js solo llama a rpc(crear_venta)', () => {
    const llamadas = [...leer('js', 'pos.js').matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    assert.deepEqual(llamadas, ['crear_venta']);
});

// ---------------------------------------------------------------
// RF-001-14: el punto de venta no usa el costo
// ---------------------------------------------------------------
test('costos: RF-001-14 · pos.js no contiene precio_costo', () => {
    assert.doesNotMatch(leer('js', 'pos.js'), /precio_costo/);
});

// ---------------------------------------------------------------
// RF-001-42: el total sale de PosLogica, que devuelve centavos
// ---------------------------------------------------------------
test('totales: RF-001-42 · pos.js usa PosLogica.calcularTotales y pasa los centavos a pesos', () => {
    const pos = leer('js', 'pos.js');
    assert.match(pos, /PosLogica\.calcularTotales\(POS\.carrito, POS\.descuentoPct, ivaPct\)/);
    assert.match(pos, /const total\s*= centavos\.total \/ 100;/);
});

// ---------------------------------------------------------------
// RF-001-12 y RF-001-16: el botón mira el carrito y la caja, no el método (D8)
// ---------------------------------------------------------------
test('cobrar: RF-001-12 · el botón usa puedeCobrar y sigue controlando la caja', () => {
    const estados = [...leer('js', 'pos.js').matchAll(/btnCobrar\.disabled = (?!true|false)(.+);/g)].map((m) => m[1]);
    assert.deepEqual(estados, Array(2).fill('!PosLogica.puedeCobrar(POS) || !POS.cajaAbierta'));
});

test('cobrar: RF-001-16 · sin método muestra el mensaje de la spec', () => {
    assert.match(leer('js', 'pos.js'), /if \(!POS\.metodoPagoId\)\s*\{ toastWarning\(PosLogica\.MENSAJES\.sinMetodo\); return; \}/);
});

// ---------------------------------------------------------------
// RF-001-24 y RF-001-26: mensajeDeError necesita el code del error
// ---------------------------------------------------------------
test('errores: RF-001-26 · el error de crear_venta llega entero a mensajeDeError', () => {
    const pos = leer('js', 'pos.js');
    assert.match(pos, /if \(ventaError\) throw ventaError;/);
    assert.match(pos, /toastError\(PosLogica\.mensajeDeError\(err, navigator\.onLine\)\)/);
    assert.doesNotMatch(pos, /new Error\(ventaError/);
});
