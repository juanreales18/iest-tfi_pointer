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

// ---------------------------------------------------------------
// Sección Caja de app.js (RF-002-01, 02 y 03)
// ---------------------------------------------------------------
const APP = leer('sistema', 'js', 'app.js').replace(/\r\n/g, '\n');
const ABRIR_EN_APP = APP.slice(APP.indexOf('async function modalAbrirCaja'), APP.indexOf('async function modalCerrarCaja'));

test('app apertura: RF-002-02 · valida con validity.badInput y no con parseFloat', () => {
    assert.doesNotMatch(ABRIR_EN_APP, /parseFloat/);
    assert.match(ABRIR_EN_APP, /CajaLogica\.validarMontoApertura\(campo\.value, campo\.validity\.badInput\)/);
});

test('app apertura: RF-002-02 · si no es válido, muestra el mensaje antes de mandar nada', () => {
    const mensaje = ABRIR_EN_APP.indexOf("showFieldError('saldo-apertura', validacion.mensaje)");
    const update = ABRIR_EN_APP.indexOf('.update(');
    assert.ok(mensaje >= 0 && mensaje < update);
    assert.match(ABRIR_EN_APP, /id="saldo-apertura-error"/);
});

test('app apertura: RF-002-03 · el botón se deshabilita mientras procesa y vuelve si hay error', () => {
    assert.match(ABRIR_EN_APP, /btn\.disabled = true;/);
    assert.match(ABRIR_EN_APP, /btn\.disabled = false;/);
});

test('app apertura: D4 · pide la fila y una respuesta vacía es error', () => {
    assert.match(ABRIR_EN_APP, /\.select\('id'\)/);
    assert.doesNotMatch(ABRIR_EN_APP, /\.single\(\)/);
    assert.match(ABRIR_EN_APP, /error \|\| !data\?\.length/);
});

test('app apertura: RF-002-03 · ante un rechazo cierra, muestra el texto y vuelve a leer', () => {
    assert.match(ABRIR_EN_APP, /CajaLogica\.interpretarErrorCaja\(error, 'abrir'\)/);
    assert.match(ABRIR_EN_APP, /fallo\.releer/);
    assert.doesNotMatch(ABRIR_EN_APP, /toastError\('No se pudo abrir la caja'\)/);
});

// ---------------------------------------------------------------
// Sección Caja de app.js: modal de cierre (RF-002-04, D6)
// ---------------------------------------------------------------
function cierreEnApp() {
    const inicio = APP.indexOf('async function modalCerrarCaja');
    return APP.slice(inicio, APP.indexOf('\n    }\n', inicio));
}

test('app cierre: RF-002-04 · la vista previa usa calcularVistaPrevia y no resta en la pantalla', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /CajaLogica\.calcularVistaPrevia\(/);
    assert.doesNotMatch(cierre, /parseFloat\(v\)/);
});

test('app cierre: caso límite 10 · sin lectura avisa y no calcula con un saldo viejo', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /CajaLogica\.MENSAJES\.esperadoNoLeido/);
    assert.match(cierre, /calcularVistaPrevia\(esperadoLeido \? cajaFresh\.saldo_actual : null,/);
});

test('app cierre: RF-002-04 · sin lectura no se muestran el resumen del turno ni el desglose', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /\$\{esperadoLeido \? `\s*<!-- Resumen del turno -->/);
    assert.ok(cierre.indexOf('<!-- Desglose por metodo de pago -->') < cierre.indexOf("` : ''}"));
});

test('app cierre: D6 · con la caja ya cerrada avisa y no abre el modal', () => {
    const cierre = cierreEnApp();
    const aviso = cierre.indexOf("cajaFresh?.estado === 'cerrada'");
    assert.ok(aviso >= 0 && aviso < cierre.indexOf("openModal('Cerrar caja'"));
    assert.match(cierre, /toastWarning\(CajaLogica\.MENSAJES\.cajaYaCerrada\)/);
});

// ---------------------------------------------------------------
// Sección Caja de app.js: update de cierre (RF-002-02, 05 y 07)
// ---------------------------------------------------------------
test('app cierre: RF-002-05 · no calcula ni manda la diferencia, ni lee la caja antes', () => {
    const cierre = cierreEnApp();
    assert.doesNotMatch(cierre, /cajaFreshCheck/);
    assert.doesNotMatch(cierre, /diferencia:/);
    assert.doesNotMatch(cierre, /Math\.round/);
});

test('app cierre: RF-002-02 · valida el contado con validity.badInput antes de mandar nada', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /CajaLogica\.validarContado\(campo\.value, campo\.validity\.badInput\)/);
    assert.match(cierre, /id="contado-cierre-error"/);
    assert.ok(cierre.indexOf("showFieldError('contado-cierre', validacion.mensaje)") < cierre.indexOf('.update('));
    assert.doesNotMatch(cierre, /contadoRaw/);
});

test('app cierre: D4 · pide la fila, vacía es error, y el movimiento usa esa fila', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /\.select\('id, saldo_inicial, saldo_actual, saldo_contado, diferencia'\)/);
    assert.match(cierre, /error \|\| !data\?\.length/);
    assert.match(cierre, /const fila = data\[0\];/);
    assert.match(cierre, /parseFloat\(fila\.saldo_actual\s+\?\? 0\)/);
});

test('app cierre: RF-002-07 y caso límite 10 · el rechazo vuelve a leer y sin red el botón vuelve', () => {
    const cierre = cierreEnApp();
    assert.match(cierre, /CajaLogica\.interpretarErrorCaja\(error, 'cerrar'\)/);
    assert.match(cierre, /fallo\.releer/);
    assert.match(cierre, /btn\.disabled = false;/);
    assert.doesNotMatch(cierre, /toastError\('No se pudo cerrar la caja'\)/);
});

// ---------------------------------------------------------------
// Sección Caja de app.js: resumen de cierre (RF-002-08, D5)
// ---------------------------------------------------------------
function resumenEnApp() {
    const inicio = APP.indexOf('function mostrarResumenCierre');
    return inicio < 0 ? '' : APP.slice(inicio, APP.indexOf('\n    }\n', inicio));
}

test('app resumen: RF-002-08 · sale de la fila de la base, después del movimiento y la auditoría', () => {
    const cierre = cierreEnApp();
    const auditoria = cierre.indexOf("registrarAuditoria('cierre_caja'");
    const resumen = cierre.indexOf('mostrarResumenCierre(resumen)');
    assert.ok(auditoria >= 0 && auditoria < resumen);
    assert.match(cierre, /const resumen\s+= CajaLogica\.armarResumenCierre\(fila\);/);
});

test('app resumen: RF-002-08 · reemplaza al aviso temporal y actualiza la pantalla de atrás', () => {
    const despues = cierreEnApp().split('mostrarResumenCierre(resumen)')[1] || '';
    assert.match(despues, /renderCaja\(area\)/);
    assert.match(despues, /loadCajaStatus\(\)/);
    assert.doesNotMatch(cierreEnApp(), /Caja cerrada con una diferencia/);
    assert.doesNotMatch(despues, /closeModal\(\)/);
});

test('app resumen: RF-002-08 · solo «Listo» lo cierra', () => {
    const resumen = resumenEnApp();
    assert.ok(resumen.indexOf('openModal(') >= 0 && resumen.indexOf('openModal(') < resumen.indexOf('fijarModal()'));
    assert.match(resumen, /onclick="closeModal\(\)">\$\{CajaLogica\.MENSAJES\.listo\}/);
});

test('app resumen: D5 · el foco va al título, no a «Listo»', () => {
    const resumen = resumenEnApp();
    assert.match(resumen, /getElementById\('modal-title'\)/);
    assert.match(resumen, /titulo\.focus\(\)/);
    assert.doesNotMatch(resumen, /autofocus/);
});

test('app resumen: RF-002-08 · muestra el esperado, y el contado solo si hubo', () => {
    const resumen = resumenEnApp();
    assert.match(resumen, /formatCurrency\(datos\.esperado\)/);
    assert.match(resumen, /datos\.contado === null/);
    assert.match(resumen, /datos\.texto/);
});

test('app resumen: los estilos caja-resumen usan solo variables de marca', () => {
    const css = leer('sistema', 'css', 'styles.css').replace(/\r\n/g, '\n');
    const reglas = css.match(/\.caja-resumen[^{]*\{[^}]*\}/g) || [];
    assert.ok(reglas.length > 0, 'faltan las clases caja-resumen');
    for (const regla of reglas) {
        assert.doesNotMatch(regla, /#[0-9a-f]{3,8}\b|rgba?\(/i, regla);
    }
});

// ---------------------------------------------------------------
// Punto de venta, pos.js: clic de la caja y apertura (D8, RF-002-01, 02 y 03)
// ---------------------------------------------------------------
const POS_JS = leer('sistema', 'js', 'pos.js').replace(/\r\n/g, '\n');
const ABRIR_EN_POS = POS_JS.slice(POS_JS.indexOf('// Confirmar apertura'), POS_JS.indexOf('// Confirmar cierre'));

test('pos: D8 · el clic de la caja se registra una sola vez', () => {
    assert.equal((POS_JS.match(/info\?\.addEventListener\(/g) || []).length, 1);
    const cargar = POS_JS.slice(POS_JS.indexOf('async function cargarCaja'), POS_JS.indexOf('// 6. CATEGORIAS'));
    assert.doesNotMatch(cargar, /addEventListener/);
});

test('pos apertura: RF-002-02 · valida con validity.badInput y no con parseFloat', () => {
    assert.doesNotMatch(ABRIR_EN_POS, /parseFloat/);
    assert.match(ABRIR_EN_POS, /CajaLogica\.validarMontoApertura\(campo\.value, campo\.validity\.badInput\)/);
});

test('pos apertura: RF-002-02 · si no es válido, muestra el mensaje antes de mandar nada', () => {
    const mensaje = ABRIR_EN_POS.indexOf("showFieldError('pos-saldo-apertura', validacion.mensaje)");
    assert.ok(mensaje >= 0 && mensaje < ABRIR_EN_POS.indexOf('.update('));
    assert.match(POS_JS, /id="pos-saldo-apertura-error"/);
});

test('pos apertura: RF-002-03 · el botón se deshabilita mientras procesa y vuelve si hay error', () => {
    assert.match(ABRIR_EN_POS, /btn\.disabled = true;/);
    assert.match(ABRIR_EN_POS, /btn\.disabled = false;/);
});

test('pos apertura: D4 · pide la fila y una respuesta vacía es error', () => {
    assert.match(ABRIR_EN_POS, /\.select\('id'\)/);
    assert.match(ABRIR_EN_POS, /error \|\| !data\?\.length/);
});

test('pos apertura: RF-002-03 · ante un rechazo vuelve a leer y destraba «Cobrar»', () => {
    assert.match(ABRIR_EN_POS, /CajaLogica\.interpretarErrorCaja\(error, 'abrir'\)/);
    const releer = ABRIR_EN_POS.slice(ABRIR_EN_POS.indexOf('fallo.releer'));
    assert.match(releer, /closePOSCajaModal\(\);\s+await cargarCaja\(\);\s+calcularTotales\(\);/);
    assert.doesNotMatch(ABRIR_EN_POS, /toastError\('No se pudo abrir la caja'\)/);
});

// ---------------------------------------------------------------
// Punto de venta, pos.js: modal de cierre y vista previa (RF-002-04, D6)
// ---------------------------------------------------------------
const MODAL_EN_POS = POS_JS.slice(POS_JS.indexOf('async function openCajaModal'), POS_JS.indexOf('// Confirmar apertura'));

test('pos cierre: RF-002-04 · la vista previa usa calcularVistaPrevia y no resta en la pantalla', () => {
    assert.match(MODAL_EN_POS, /CajaLogica\.calcularVistaPrevia\(esperadoLeido \? lectura\.saldo_actual : null,/);
    assert.doesNotMatch(MODAL_EN_POS, /parseFloat\(v\)/);
});

test('pos cierre: caso límite 10 · sin lectura avisa, y nunca muestra $0', () => {
    assert.match(MODAL_EN_POS, /CajaLogica\.MENSAJES\.esperadoNoLeido/);
    assert.doesNotMatch(MODAL_EN_POS, /saldo_actual \|\| 0/);
});

test('pos cierre: D6 · lee antes de abrir, y con la caja ya cerrada avisa y no abre el modal', () => {
    const lectura = MODAL_EN_POS.indexOf(".select('saldo_actual, estado')");
    const aviso = MODAL_EN_POS.indexOf("lectura?.estado === 'cerrada'");
    const abre = MODAL_EN_POS.indexOf("overlay.classList.add('open')");
    assert.ok(lectura >= 0 && lectura < aviso && aviso < abre);
    assert.match(MODAL_EN_POS, /toastWarning\(CajaLogica\.MENSAJES\.cajaYaCerrada\);\s+await cargarCaja\(\);\s+calcularTotales\(\);\s+return;/);
});

// ---------------------------------------------------------------
// Punto de venta, pos.js: update de cierre (RF-002-02, 05 y 07)
// ---------------------------------------------------------------
const CIERRE_EN_POS = POS_JS.slice(POS_JS.indexOf('// Confirmar cierre'), POS_JS.indexOf('function closePOSCajaModal'));

test('pos cierre: RF-002-05 · no calcula ni manda la diferencia, ni lee la caja antes', () => {
    assert.doesNotMatch(CIERRE_EN_POS, /estadoActual/);
    assert.doesNotMatch(CIERRE_EN_POS, /\.select\('estado'\)/);
    assert.doesNotMatch(CIERRE_EN_POS, /\.select\('saldo_actual, saldo_inicial'\)/);
    assert.doesNotMatch(CIERRE_EN_POS, /diferencia:/);
    assert.doesNotMatch(CIERRE_EN_POS, /Math\.round/);
});

test('pos cierre: RF-002-02 · valida el contado con validity.badInput antes de mandar nada', () => {
    assert.match(CIERRE_EN_POS, /CajaLogica\.validarContado\(campo\.value, campo\.validity\.badInput\)/);
    assert.match(POS_JS, /id="pos-contado-error"/);
    const mensaje = CIERRE_EN_POS.indexOf("showFieldError('pos-contado', validacion.mensaje)");
    assert.ok(mensaje >= 0 && mensaje < CIERRE_EN_POS.indexOf('.update('));
    assert.doesNotMatch(CIERRE_EN_POS, /contadoRaw/);
});

test('pos cierre: D4 · pide la fila, vacía es error, y el movimiento usa esa fila', () => {
    assert.match(CIERRE_EN_POS, /\.select\('id, saldo_inicial, saldo_actual, saldo_contado, diferencia'\)/);
    assert.match(CIERRE_EN_POS, /error \|\| !data\?\.length/);
    assert.match(CIERRE_EN_POS, /const fila = data\[0\];/);
    assert.match(CIERRE_EN_POS, /parseFloat\(fila\.saldo_actual\s+\?\? 0\)/);
});

test('pos cierre: RF-002-07 · el rechazo vuelve a leer con cargarCaja', () => {
    assert.match(CIERRE_EN_POS, /CajaLogica\.interpretarErrorCaja\(error, 'cerrar'\)/);
    const releer = CIERRE_EN_POS.slice(CIERRE_EN_POS.indexOf('fallo.releer'));
    assert.match(releer, /closePOSCajaModal\(\);\s+await cargarCaja\(\);\s+calcularTotales\(\);/);
});

test('pos cierre: caso límite 10 · sin red el botón vuelve y POS.cajaAbierta no cambia', () => {
    const fallo = CIERRE_EN_POS.slice(CIERRE_EN_POS.indexOf('error || !data?.length'), CIERRE_EN_POS.indexOf('const fila = data[0];'));
    assert.match(fallo, /btn\.disabled = false;/);
    assert.doesNotMatch(fallo, /POS\.cajaAbierta/);
    assert.doesNotMatch(CIERRE_EN_POS, /toastError\('No se pudo cerrar la caja'\)/);
});

// ---------------------------------------------------------------
// Punto de venta, pos.js: resumen de cierre (RF-002-08, D5)
// ---------------------------------------------------------------
function resumenEnPos() {
    const inicio = POS_JS.indexOf('function mostrarResumenCierre');
    return inicio < 0 ? '' : POS_JS.slice(inicio, POS_JS.indexOf('\n    }\n', inicio));
}

test('pos resumen: RF-002-08 · sale de la fila de la base, después del movimiento y la auditoría', () => {
    const auditoria = CIERRE_EN_POS.indexOf("registrarAuditoria('cierre_caja'");
    const resumen = CIERRE_EN_POS.indexOf('mostrarResumenCierre(resumen)');
    assert.ok(auditoria >= 0 && auditoria < resumen);
    assert.match(CIERRE_EN_POS, /const resumen\s+= CajaLogica\.armarResumenCierre\(fila\);/);
});

test('pos resumen: RF-002-08 · reemplaza al aviso temporal y actualiza la pantalla de atrás', () => {
    const despues = CIERRE_EN_POS.split('mostrarResumenCierre(resumen)')[1] || '';
    assert.match(despues, /await cargarCaja\(\);\s+calcularTotales\(\);/);
    assert.doesNotMatch(CIERRE_EN_POS, /Caja cerrada con una diferencia/);
    assert.doesNotMatch(despues, /closePOSCajaModal\(\)/);
});

test('pos resumen: RF-002-08 · muestra el esperado, y el contado solo si hubo', () => {
    const resumen = resumenEnPos();
    assert.match(resumen, /formatCurrency\(datos\.esperado\)/);
    assert.match(resumen, /datos\.contado === null/);
    assert.match(resumen, /datos\.texto/);
    assert.match(resumen, /class="caja-resumen"/);
});

test('pos resumen: RF-002-08 · la marca se prende al mostrarlo, y solo «Listo» la baja', () => {
    const resumen = resumenEnPos();
    assert.match(resumen, /POS\.resumenCajaVisible = true;/);
    assert.match(resumen, /onclick="closePOSCajaModal\(\)">\$\{CajaLogica\.MENSAJES\.listo\}/);
    const cerrar = POS_JS.slice(POS_JS.indexOf('function closePOSCajaModal'), POS_JS.indexOf('window.closePOSCajaModal'));
    assert.match(cerrar, /POS\.resumenCajaVisible = false;/);
});

test('pos resumen: D5 · el foco va al título, no a «Listo»', () => {
    const resumen = resumenEnPos();
    assert.match(resumen, /getElementById\('modal-caja-title'\)/);
    assert.match(resumen, /titulo\.focus\(\)/);
    assert.doesNotMatch(resumen, /autofocus/);
});

test('pos resumen: RF-002-08 · la X y el clic afuera no lo cierran', () => {
    assert.match(MODAL_EN_POS, /e\.target === overlay && !POS\.resumenCajaVisible/);
    assert.match(MODAL_EN_POS, /closeBtn\?\.addEventListener\('click', \(\) => \{\s+if \(!POS\.resumenCajaVisible\) closePOSCajaModal\(\);/);
});

test('pos resumen: D5 · el lector no actúa', () => {
    const inicio = POS_JS.indexOf('function setupSearch');
    const lector = POS_JS.slice(POS_JS.indexOf("addEventListener('keydown'", inicio));
    assert.match(lector, /^addEventListener\('keydown', \(e\) => \{\s+if \(POS\.resumenCajaVisible\) return;/);
});

test('pos resumen: D5 · F2, F10 y Escape no actúan', () => {
    const inicio = POS_JS.indexOf('function setupKeyboard');
    const teclado = POS_JS.slice(POS_JS.indexOf("addEventListener('keydown'", inicio));
    assert.match(teclado, /^addEventListener\('keydown', \(e\) => \{\s+if \(POS\.resumenCajaVisible\) \{/);
    assert.ok(teclado.indexOf('POS.resumenCajaVisible') < teclado.indexOf("e.key === 'Escape'"));
});

test('pos resumen: con el resumen abierto no se abre otro modal de caja', () => {
    assert.match(MODAL_EN_POS, /^async function openCajaModal\(\) \{\s+if \(POS\.resumenCajaVisible\) return;/);
});
