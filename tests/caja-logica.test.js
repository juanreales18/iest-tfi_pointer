// Tests de sistema/js/caja-logica.js (specs/002-caja-arqueo).
// Prueban la lógica de la caja sin navegador ni base.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Si el archivo no se puede cargar, los casos fallan sin cortar el resto de los tests
function cargarCajaLogica() {
    try {
        return require(path.join(__dirname, '..', 'sistema', 'js', 'caja-logica.js'));
    } catch {
        return {};
    }
}

const CajaLogica = cargarCajaLogica();
const MENSAJES = CajaLogica.MENSAJES || {};

// ---------------------------------------------------------------
// MENSAJES: cada texto igual al de spec.md, letra por letra (D9)
// ---------------------------------------------------------------
const TEXTOS_FIJOS = [
    ['RF-002-02', 'montoInvalido', 'Ingresá un monto de 0 o más'],
    ['RF-002-03', 'cajaYaAbierta', 'La caja ya está abierta'],
    ['RF-002-07', 'cajaYaCerrada', 'La caja ya fue cerrada'],
    ['RF-002-08', 'sobrante', 'Sobrante'],
    ['RF-002-08', 'faltante', 'Faltante'],
    ['RF-002-08', 'sinDiferencia', 'Sin diferencia'],
    ['RF-002-08', 'sinArqueo', 'Cerrada sin arqueo'],
    ['RF-002-08', 'listo', 'Listo'],
    ['caso límite 10', 'esperadoNoLeido', 'No se pudo leer el efectivo esperado. Revisá la conexión.'],
    ['caso límite 10', 'noSePudoCerrar', 'No se pudo cerrar la caja'],
    ['plan, RF-002-03', 'noSePudoAbrir', 'No se pudo abrir la caja'],
];

for (const [origen, clave, texto] of TEXTOS_FIJOS) {
    test(`mensajes: ${origen} · ${clave}`, () => {
        assert.equal(MENSAJES[clave], texto);
    });
}
