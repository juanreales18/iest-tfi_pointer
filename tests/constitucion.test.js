// Tests de la constitución de Pointer (docs/CONSTITUCION.md).
// Cada test comprueba un principio sobre el código de src/ y el repositorio.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const IGNORAR = new Set(['.git', 'node_modules', 'vendor']);

// Lista recursiva de archivos, sin .git, node_modules ni librerías de terceros
function archivos(dir, extensiones) {
    const salida = [];
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORAR.has(entrada.name)) continue;
        const ruta = path.join(dir, entrada.name);
        if (entrada.isDirectory()) salida.push(...archivos(ruta, extensiones));
        else if (!extensiones || extensiones.includes(path.extname(entrada.name))) salida.push(ruta);
    }
    return salida;
}

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const relativo = (ruta) => path.relative(RAIZ, ruta);

// ---------------------------------------------------------------
// P1 · Stack: sin frameworks ni scripts desde CDN
// ---------------------------------------------------------------
test('stack: src/ no tiene package.json ni scripts cargados desde internet', () => {
    assert.equal(fs.existsSync(path.join(SRC, 'package.json')), false, 'src/ no debe tener package.json');
    const conCdn = archivos(SRC, ['.html'])
        .filter((f) => /<script[^>]+src=["']https?:/i.test(leer(f)))
        .map(relativo);
    assert.deepEqual(conCdn, [], `Scripts desde CDN en: ${conCdn.join(', ')}`);
});

// ---------------------------------------------------------------
// P2 · Marca: colores solo desde variables CSS
// Deuda conocida al empezar el TFI: el CSS heredado tiene colores
// escritos a mano. El test impide que la deuda crezca; la tarea de
// llevarla a 0 está en docs/08-TAREAS.md (Etapa 7).
// ---------------------------------------------------------------
const DEUDA_COLORES_CSS = 54;

test('marca: no se agregan colores escritos a mano fuera de :root', () => {
    let total = 0;
    const detalle = [];
    for (const f of archivos(path.join(SRC, 'css'), ['.css'])) {
        const sinRoot = leer(f).replace(/:root\s*\{[^}]*\}/g, '');
        const n = (sinRoot.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
        total += n;
        if (n) detalle.push(`${relativo(f)}: ${n}`);
    }
    assert.ok(
        total <= DEUDA_COLORES_CSS,
        `Hay ${total} colores escritos a mano (máximo permitido ${DEUDA_COLORES_CSS}). ${detalle.join('; ')}`
    );
});

// ---------------------------------------------------------------
// P3 · Capas: las ventas solo se crean y anulan en la base
// ---------------------------------------------------------------
test('capas: no hay insert directo en ventas ni detalle_ventas', () => {
    const prohibido = /\.from\(\s*['"](ventas|detalle_ventas)['"]\s*\)\s*\.insert/;
    const culpables = archivos(path.join(SRC, 'js'), ['.js'])
        .filter((f) => prohibido.test(leer(f)))
        .map(relativo);
    assert.deepEqual(culpables, [], `Insert directo en: ${culpables.join(', ')}`);
});

test('capas: el punto de venta usa crear_venta y reportes usa cancelar_venta', () => {
    assert.match(leer(path.join(SRC, 'js', 'pos.js')), /rpc\(\s*['"]crear_venta['"]/);
    assert.match(leer(path.join(SRC, 'js', 'reports.js')), /rpc\(\s*['"]cancelar_venta['"]/);
});

// ---------------------------------------------------------------
// P5 · Seguridad: sin secretos en el repositorio
// ---------------------------------------------------------------
function rolDelToken(jwt) {
    try {
        const carga = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(carga, 'base64').toString('utf8')).role;
    } catch {
        return null;
    }
}

test('seguridad: ningún token del repositorio es de servicio (service_role)', () => {
    const tokens = [];
    for (const f of archivos(RAIZ, ['.js', '.ts', '.html', '.md', '.sql', '.toml', '.json'])) {
        for (const jwt of leer(f).match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g) || []) {
            tokens.push({ archivo: relativo(f), rol: rolDelToken(jwt) });
        }
    }
    const peligrosos = tokens.filter((t) => t.rol !== 'anon');
    assert.deepEqual(peligrosos, [], `Tokens que no son públicos: ${JSON.stringify(peligrosos)}`);
});

test('seguridad: no hay archivos .env y .gitignore los excluye', () => {
    const envs = archivos(RAIZ).filter((f) => /(^|[\\/])\.env(\.|$)/.test(f)).map(relativo);
    assert.deepEqual(envs, [], `Archivos .env en el repositorio: ${envs.join(', ')}`);
    assert.match(leer(path.join(RAIZ, '.gitignore')), /^\.env/m);
});

// ---------------------------------------------------------------
// P7 · Accesibilidad: imágenes con alt y páginas en español
// ---------------------------------------------------------------
test('accesibilidad: todas las imágenes tienen alt', () => {
    const sinAlt = [];
    for (const f of archivos(SRC, ['.html', '.js'])) {
        for (const img of leer(f).match(/<img\b[^>]*>/gi) || []) {
            if (!/\balt=/i.test(img)) sinAlt.push(`${relativo(f)}: ${img.slice(0, 60)}`);
        }
    }
    assert.deepEqual(sinAlt, [], `Imágenes sin alt:\n${sinAlt.join('\n')}`);
});

test('accesibilidad: todas las páginas declaran lang="es"', () => {
    const sinLang = archivos(SRC, ['.html'])
        .filter((f) => !/<html[^>]*\blang=["']es/i.test(leer(f)))
        .map(relativo);
    assert.deepEqual(sinLang, [], `Páginas sin lang="es": ${sinLang.join(', ')}`);
});

// ---------------------------------------------------------------
// P8 · Uso responsable de la IA: el arnés y los registros existen
// ---------------------------------------------------------------
test('ia responsable: existen la constitución, el registro de prompts, la declaración y las fichas', () => {
    for (const archivo of ['docs/CONSTITUCION.md', 'docs/PROMPTS.md', 'docs/DECLARACION-IA.md', 'multimedia/FICHAS-IA.md', 'AGENTS.md', 'memory.md']) {
        assert.ok(fs.existsSync(path.join(RAIZ, archivo)), `Falta ${archivo}`);
    }
    const constitucion = leer(path.join(RAIZ, 'docs', 'CONSTITUCION.md'));
    assert.match(constitucion, /Uso responsable de la IA/);
});
