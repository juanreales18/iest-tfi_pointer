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

// ---------------------------------------------------------------
// APERTURA: validarMontoApertura (RF-002-01, RF-002-02)
// ---------------------------------------------------------------
test('apertura: RF-002-01 · 0 es un monto válido', () => {
    assert.deepEqual(CajaLogica.validarMontoApertura('0', false), { valido: true, monto: 0 });
});

test('apertura: RF-002-01 · un monto positivo se devuelve como número', () => {
    assert.deepEqual(CajaLogica.validarMontoApertura('1000', false), { valido: true, monto: 1000 });
    assert.deepEqual(CajaLogica.validarMontoApertura('1000.50', false), { valido: true, monto: 1000.5 });
});

const APERTURAS_INVALIDAS = [
    ['vacío', '', false],
    ['solo espacios', '   ', false],
    ['sin valor', undefined, false],
    ['negativo', '-1', false],
    ['texto', 'abc', false],
    ['infinito', 'Infinity', false],
    ['el campo avisa una entrada inválida', '', true],
    ['entrada inválida aunque haya un valor', '100', true],
];

for (const [caso, valor, entradaInvalida] of APERTURAS_INVALIDAS) {
    test(`apertura: RF-002-02 · ${caso} no abre la caja`, () => {
        assert.deepEqual(
            CajaLogica.validarMontoApertura(valor, entradaInvalida),
            { valido: false, mensaje: 'Ingresá un monto de 0 o más' }
        );
    });
}

// ---------------------------------------------------------------
// CONTADO: validarContado (RF-002-02, casos límite 1, 2 y 11)
// ---------------------------------------------------------------
test('contado: caso límite 1 · 0 es un contado, no «sin contado»', () => {
    assert.deepEqual(CajaLogica.validarContado('0', false), { valido: true, contado: 0 });
});

test('contado: un monto positivo se devuelve como número', () => {
    assert.deepEqual(CajaLogica.validarContado('1450', false), { valido: true, contado: 1450 });
    assert.deepEqual(CajaLogica.validarContado('1450.50', false), { valido: true, contado: 1450.5 });
});

test('contado: caso límite 2 · vacío es «sin contado»', () => {
    assert.deepEqual(CajaLogica.validarContado('', false), { valido: true, contado: null });
    assert.deepEqual(CajaLogica.validarContado('   ', false), { valido: true, contado: null });
    assert.deepEqual(CajaLogica.validarContado(undefined, false), { valido: true, contado: null });
});

const CONTADOS_INVALIDOS = [
    ['caso límite 11 · vacío con entrada inválida no es «sin contado»', '', true],
    ['entrada inválida aunque haya un valor', '100', true],
    ['negativo', '-1', false],
    ['texto', 'abc', false],
    ['infinito', 'Infinity', false],
];

for (const [caso, valor, entradaInvalida] of CONTADOS_INVALIDOS) {
    test(`contado: RF-002-02 · ${caso}`, () => {
        assert.deepEqual(
            CajaLogica.validarContado(valor, entradaInvalida),
            { valido: false, mensaje: 'Ingresá un monto de 0 o más' }
        );
    });
}

// ---------------------------------------------------------------
// VISTA PREVIA: calcularVistaPrevia (RF-002-04)
// Solo informa: la diferencia que vale la calcula la base (P3)
// ---------------------------------------------------------------
test('vista previa: RF-002-04 · esperado 1500 y contado 1450 da -50', () => {
    assert.equal(CajaLogica.calcularVistaPrevia(1500, 1450), -50);
});

test('vista previa: RF-002-04 · sobrante y sin diferencia', () => {
    assert.equal(CajaLogica.calcularVistaPrevia(1500, 1600), 100);
    assert.equal(CajaLogica.calcularVistaPrevia(1500, 1500), 0);
});

test('vista previa: caso límite 1 · contado 0 da todo lo esperado en negativo', () => {
    assert.equal(CajaLogica.calcularVistaPrevia(1500, 0), -1500);
});

test('vista previa: resta en centavos, sin errores de coma flotante', () => {
    assert.notEqual(0.1 - 0.3, -0.2);
    assert.equal(CajaLogica.calcularVistaPrevia(0.3, 0.1), -0.2);
});

test('vista previa: acepta el esperado como texto, como puede llegar un numeric', () => {
    assert.equal(CajaLogica.calcularVistaPrevia('1500.00', 1450), -50);
});

test('vista previa: RF-002-04 · sin contado no calcula nada', () => {
    assert.equal(CajaLogica.calcularVistaPrevia(1500, null), null);
    assert.equal(CajaLogica.calcularVistaPrevia(1500, undefined), null);
});

test('vista previa: caso límite 10 · sin esperado no calcula nada, nunca como si fuera 0', () => {
    assert.equal(CajaLogica.calcularVistaPrevia(null, 1450), null);
    assert.equal(CajaLogica.calcularVistaPrevia(undefined, 1450), null);
    assert.equal(CajaLogica.calcularVistaPrevia('', 1450), null);
    assert.equal(CajaLogica.calcularVistaPrevia(NaN, 1450), null);
});
