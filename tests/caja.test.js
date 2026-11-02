// Tests de los archivos de la caja (specs/002-caja-arqueo).
// Leen los archivos sin navegador ni base; cada tarea suma lo que ya cumple.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function leer(...partes) {
    try {
        return fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8');
    } catch {
        return '';
    }
}

// El texto del script sin comentarios, para que una aclaración no haga pasar un test
const CAJA_GUARD = leer('tests', 'sql', 'caja-guard.sql');
const CAJA_GUARD_SIN_COMENTARIOS = CAJA_GUARD.replace(/^\s*--.*$/gm, '');

// ---------------------------------------------------------------
// tests/sql/caja-guard.sql: se corre en la base de Pointer (P5, D7, H-03)
// ---------------------------------------------------------------
test('caja-guard: existe', () => {
    assert.notEqual(CAJA_GUARD, '');
});

test('caja-guard: P5 · no trae ids escritos a mano', () => {
    assert.doesNotMatch(CAJA_GUARD, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
});

test('caja-guard: P5 · no trae claves', () => {
    assert.doesNotMatch(CAJA_GUARD, /service_role|eyJ[A-Za-z0-9_-]{10,}/);
});

test('caja-guard: D7 · es un solo bloque, sin COMMIT ni ROLLBACK escritos', () => {
    assert.equal((CAJA_GUARD_SIN_COMENTARIOS.match(/^DO \$prueba\$/gm) || []).length, 1);
    assert.doesNotMatch(CAJA_GUARD_SIN_COMENTARIOS, /\b(COMMIT|ROLLBACK)\b/i);
});

test('caja-guard: D7 · la última sentencia del bloque es el error con los resultados', () => {
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /RAISE EXCEPTION USING MESSAGE = [^;]+;\s*END\s*\$prueba\$;\s*$/);
});

test('caja-guard: H-03 · simula el rol y el usuario, y busca los ids con una consulta', () => {
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /SET LOCAL ROLE authenticated/);
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /request\.jwt\.claims/);
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /r\.nombre = 'dueno'/);
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /r\.nombre = 'empleado'/);
});

const PRUEBAS_DE_APERTURA = [
    'apertura valida',
    'doble apertura con otro monto',
    'doble apertura con el mismo monto',
    'apertura negativa',
    'apertura con saldo inventado',
];

for (const prueba of PRUEBAS_DE_APERTURA) {
    test(`caja-guard: RF-002-01, 03 y 06 · prueba «${prueba}»`, () => {
        assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes(`'${prueba}'`));
    });
}
