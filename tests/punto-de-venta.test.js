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
// RF-001-14: el punto de venta no usa el costo (se cierra en T13)
// ---------------------------------------------------------------
test('costos: RF-001-14 · pos.js no contiene precio_costo', { todo: true }, () => {
    assert.doesNotMatch(leer('js', 'pos.js'), /precio_costo/);
});
