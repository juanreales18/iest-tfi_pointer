// Tests de los archivos de la caja (specs/002-caja-arqueo).
// Leen los archivos sin navegador ni base; cada tarea suma lo que ya cumple.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

const PRUEBAS_DE_CIERRE = [
    'cierre con diferencia inventada',
    'cierre sin mandar diferencia',
    'cierre con contado 0',
    'cierre sin contado',
    'cierre con contado negativo',
    'cierre con saldo inventado',
    'cierre con saldo inicial inventado',
    'cierre con un saldo negativo anterior',
    'segundo cierre',
    'caja cerrada cambia saldo inicial',
    'caja cerrada cambia saldo actual',
    'caja cerrada cambia contado',
    'caja cerrada cambia diferencia',
    'caja cerrada cambia fecha de cierre',
    'caja cerrada con contado negativo',
];

for (const prueba of PRUEBAS_DE_CIERRE) {
    test(`caja-guard: RF-002-05, 06 y 07 · prueba «${prueba}»`, () => {
        assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes(`'${prueba}'`));
    });
}

const PRUEBAS_QUE_NO_SE_ROMPEN = [
    'venta en efectivo',
    'cancelacion de venta en efectivo',
    'reinicio con la caja abierta',
    'reinicio con la caja cerrada',
];

for (const prueba of PRUEBAS_QUE_NO_SE_ROMPEN) {
    test(`caja-guard: RF-002-05 y 07 · H-01 · prueba «${prueba}»`, () => {
        assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes(`'${prueba}'`));
    });
}

test('caja-guard: la venta comprueba que subió el saldo, con el total que guardó la base', () => {
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /saldo_actual = 1500 \+ \(SELECT total FROM public\.ventas/);
});

test('caja-guard: H-01 · el reinicio corre como el panel, sin cambiar de rol', () => {
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /\('panel', 'reinicio con la caja cerrada'/);
    assert.match(CAJA_GUARD_SIN_COMENTARIOS, /IF c\.rol <> 'panel' THEN/);
});

test('caja-guard: el reinicio manda lo mismo que 90-reinicio-total.sql', () => {
    const reinicio = leer('base-de-datos', '90-reinicio-total.sql').match(/UPDATE cajas SET([\s\S]*?);/);
    assert.ok(reinicio, 'no se encontró el UPDATE de cajas en 90-reinicio-total.sql');
    const columnas = reinicio[1].split(',').map((parte) => parte.trim().replace(/\s+/g, ' ').replace(/'/g, "''"));
    assert.equal(columnas.length, 10);
    for (const columna of columnas) {
        assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes(columna), `falta «${columna}»`);
    }
});

// ---------------------------------------------------------------
// cajas_guard: la migración y la estructura (plan, sección 3)
// ---------------------------------------------------------------
const { MENSAJES } = require('../sistema/js/caja-logica.js');

const MIGRACION = leer('base-de-datos', '20-caja-arqueo.sql');

// La función sin comentarios ni saltos de Windows; un deshacer comentado no cuenta
function guardDe(texto) {
    const guard = texto.match(/^CREATE OR REPLACE FUNCTION public\.cajas_guard\(\)[\s\S]*?\$function\$;/m);
    return guard ? guard[0].replace(/\r\n/g, '\n') : '';
}

const GUARD = guardDe(MIGRACION);

test('migración: trae cajas_guard', () => {
    assert.notEqual(GUARD, '');
});

test('migración: la función es igual en 00-estructura.sql', () => {
    assert.equal(guardDe(leer('base-de-datos', '00-estructura.sql')), GUARD);
});

test('migración: H-01 · la función no es SECURITY DEFINER, porque depende de current_user', () => {
    assert.doesNotMatch(GUARD, /SECURITY DEFINER/i);
    assert.match(GUARD, /current_user/);
});

test('migración: no crea ni cambia políticas de RLS', () => {
    assert.doesNotMatch(MIGRACION, /POLICY/i);
});

test('migración: D9 · los dos rechazos son letra por letra los de MENSAJES', () => {
    assert.ok(GUARD.includes(`raise exception '${MENSAJES.cajaYaAbierta}'`));
    assert.ok(GUARD.includes(`raise exception '${MENSAJES.cajaYaCerrada}'`));
});

test('migración: RF-002-05 · la diferencia es el contado menos el saldo anterior', () => {
    assert.match(GUARD, /new\.diferencia := new\.saldo_contado - old\.saldo_actual;/);
});

test('migración: los 9 pasos están en el orden del plan', () => {
    const posiciones = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((paso) => GUARD.indexOf(`-- Paso ${paso}:`));
    assert.ok(posiciones.every((posicion) => posicion >= 0), 'falta algún paso');
    assert.deepEqual(posiciones, [...posiciones].sort((a, b) => a - b));
});

const PRUEBAS_POR_ROL = [
    "('empleado', 'apertura a nombre de otro'",
    "('dueno', 'apertura a nombre de otro'",
    "('empleado', 'cierre cambia quien abrio'",
    "('dueno', 'cierre cambia quien abrio'",
    "('empleado', 'cierre cambia fecha de apertura'",
];

for (const prueba of PRUEBAS_POR_ROL) {
    test(`caja-guard: pasos 8 y 9 · prueba ${prueba}`, () => {
        assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes(prueba));
    });
}

test('caja-guard: RF-002-03 · prueba «caja abierta cambia contado»', () => {
    assert.ok(CAJA_GUARD_SIN_COMENTARIOS.includes("'caja abierta cambia contado'"));
});

// ---------------------------------------------------------------
// Carga de caja-logica.js (D1)
// ---------------------------------------------------------------
function cargaAntes(html, archivo) {
    const logica = html.indexOf('<script src="js/caja-logica.js"></script>');
    const siguiente = html.indexOf(`<script src="js/${archivo}"></script>`);
    return logica >= 0 && siguiente >= 0 && logica < siguiente;
}

test('carga: dashboard.html trae caja-logica.js antes que app.js', () => {
    assert.ok(cargaAntes(leer('sistema', 'dashboard.html'), 'app.js'));
});

test('carga: pos.html trae caja-logica.js antes que pos.js', () => {
    assert.ok(cargaAntes(leer('sistema', 'pos.html'), 'pos.js'));
});

test('carga: sw.js lista caja-logica.js', () => {
    assert.match(leer('sistema', 'sw.js'), /['"]\/js\/caja-logica\.js['"]/);
});

test('carga: en el navegador deja CajaLogica en window', () => {
    const ventana = {};
    vm.runInNewContext(leer('sistema', 'js', 'caja-logica.js'), { window: ventana });
    assert.equal(typeof ventana.CajaLogica.validarContado, 'function');
});

// ---------------------------------------------------------------
// fijarModal (RF-002-08): corre el config.js real con un DOM falso
// ---------------------------------------------------------------
function elementoFalso() {
    const clases = new Set();
    const eventos = {};
    return {
        style: {},
        classList: { add: (c) => clases.add(c), remove: (c) => clases.delete(c), contains: (c) => clases.has(c) },
        addEventListener: (nombre, fn) => { eventos[nombre] = fn; },
        clic(target) { eventos.click({ target: target || this }); },
    };
}

function abrirConfig() {
    const overlay = elementoFalso();
    const cerrar = elementoFalso();
    const elementos = { 'modal-overlay': overlay, 'modal-close': cerrar, modal: elementoFalso() };
    let alCargar;
    const documento = {
        body: elementoFalso(),
        querySelector: () => null,
        getElementById: (id) => elementos[id] || null,
        addEventListener: (nombre, fn) => { if (nombre === 'DOMContentLoaded') alCargar = fn; },
    };
    const contexto = vm.createContext({
        window: {},
        document: documento,
        console: { error() {}, warn() {}, log() {} },
        supabase: { createClient: () => ({}) },
    });
    vm.runInContext(leer('sistema', 'js', 'config.js'), contexto);
    alCargar();
    return { contexto, overlay, cerrar, abierto: () => overlay.classList.contains('open') };
}

test('fijarModal: sin fijar, la X y el clic afuera cierran como siempre', () => {
    const { contexto, overlay, cerrar, abierto } = abrirConfig();
    contexto.openModal('t', 'b');
    cerrar.clic();
    assert.equal(abierto(), false);
    contexto.openModal('t', 'b');
    overlay.clic();
    assert.equal(abierto(), false);
});

test('fijarModal: fijado, la X y el clic afuera no lo cierran', () => {
    const { contexto, overlay, cerrar, abierto } = abrirConfig();
    contexto.openModal('t', 'b');
    contexto.fijarModal();
    cerrar.clic();
    assert.equal(abierto(), true);
    overlay.clic();
    assert.equal(abierto(), true);
});

test('fijarModal: closeModal, que es lo que hace «Listo», lo cierra igual y lo reinicia', () => {
    const { contexto, cerrar, abierto } = abrirConfig();
    contexto.openModal('t', 'b');
    contexto.fijarModal();
    contexto.closeModal();
    assert.equal(abierto(), false);
    contexto.openModal('t', 'b');
    cerrar.clic();
    assert.equal(abierto(), false);
});

test('fijarModal: openModal lo reinicia, aunque el anterior no se haya cerrado', () => {
    const { contexto, overlay, abierto } = abrirConfig();
    contexto.openModal('t', 'b');
    contexto.fijarModal();
    contexto.openModal('otro', 'b');
    overlay.clic();
    assert.equal(abierto(), false);
});
