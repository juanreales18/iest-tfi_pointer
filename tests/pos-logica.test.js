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
    test(`mensajes: ${rf} · ${clave}`, { todo: true }, () => {
        assert.equal(MENSAJES[clave], texto);
    });
}

test('mensajes: RF-001-05 · productoNoEncontrado incluye el código', { todo: true }, () => {
    assert.equal(MENSAJES.productoNoEncontrado('7790001'), 'No encontramos ese producto (código: 7790001)');
});

test('mensajes: RF-001-09 · stockDisponible incluye el stock', { todo: true }, () => {
    assert.equal(MENSAJES.stockDisponible(3), 'Stock disponible: 3');
});
