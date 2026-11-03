// Tests de la página de presentación (sistema/presentacion.html).
// Las leyendas se copian acá de multimedia/FICHAS-IA.md, salvo la del recorrido, que no tiene ficha.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'sistema');
const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const html = leer(path.join(SRC, 'presentacion.html'));
const css = leer(path.join(SRC, 'css', 'presentacion.css'));
const js = leer(path.join(SRC, 'js', 'presentacion.js'));
const toml = leer(path.join(SRC, 'netlify.toml'));

const GEMINI = 'Imagen generada con IA (Gemini)';
const MOCKUP = 'Imagen generada con IA (Gemini) con una captura real de Pointer en la pantalla';
const GRAFICO = 'Gráfico generado con código escrito por IA (Claude) a partir de datos reales del proyecto';

const LEYENDAS = {
    'logo-horizontal.webp': 'Logo generado con IA (Canva) y editado por el autor',
    '04-cuaderno-ventas.webp': GEMINI,
    '08-duena-ventas.webp': GEMINI,
    'spot-miniatura.webp': 'Animación hecha con código escrito por IA (Claude), con voz generada con IA (elevenlabs.io)',
    '05-mockup-notebook-pointer.webp': MOCKUP,
    '06-mockup-celular-pointer.webp': MOCKUP,
    // Sin ficha en FICHAS-IA.md: el autor tiene que confirmarla
    'recorrido-miniatura.webp': 'Grabación de pantalla del sistema con la voz del autor',
    '01-frente-kiosco.webp': GEMINI,
    '02-kiosquera-atendiendo.webp': GEMINI,
    '03-kiosquero-escaneando.webp': GEMINI,
    '07-cierre-caja.webp': GEMINI,
    'grafico-1-requisitos-ears.webp': GRAFICO,
    'grafico-2-tests.webp': GRAFICO,
    'grafico-3-tareas.webp': GRAFICO,
    'grafico-4-colores.webp': GRAFICO,
};

const figuras = () => (html.match(/<figure\b[\s\S]*?<\/figure>/g) || []).map((figura) => ({
    img: figura.match(/<img\b[^>]*>/)?.[0] || '',
    leyenda: figura.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1].trim(),
}));
const atributo = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\b${nombre}="([^"]*)"`))?.[1];
const archivoDe = (img) => path.basename(atributo(img, 'src') || '');

// Ancho y alto reales de un WebP, leídos de su cabecera
function medidasWebp(ruta) {
    const b = fs.readFileSync(ruta);
    assert.equal(b.toString('latin1', 0, 4) + b.toString('latin1', 8, 12), 'RIFFWEBP', `${ruta} no es WebP`);
    const tipo = b.toString('latin1', 12, 16);
    if (tipo === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (tipo === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}

test('presentacion: las secciones van en el orden pedido', () => {
    const ids = [...html.matchAll(/<(?:header|section|footer)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['portada', 'problema', 'spot', 'que-hace', 'recorrido', 'galeria', 'como-se-hizo', 'pie']);
});

test('presentacion: la portada tiene logo, eslogan y botón a /login', () => {
    const portada = html.match(/<header\b[\s\S]*?<\/header>/)[0];
    assert.match(portada, /logo-horizontal\.webp/);
    assert.match(portada, /<h1[^>]*>Cada venta, en su lugar\.<\/h1>/);
    assert.match(portada, /<a [^>]*href="\/login"[^>]*>Entrar al sistema<\/a>/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Tiene que haber un solo h1');
});

test('presentacion: cada imagen y video lleva su leyenda exacta y un alt descriptivo', () => {
    const lista = figuras();
    assert.deepEqual(lista.map((f) => archivoDe(f.img)), Object.keys(LEYENDAS));
    for (const { img, leyenda } of lista) {
        const archivo = archivoDe(img);
        assert.equal(leyenda, LEYENDAS[archivo], `${archivo}: leyenda distinta`);
        assert.ok((atributo(img, 'alt') || '').length >= 25, `${archivo}: alt muy corto`);
    }
    assert.equal((html.match(/<img\b/g) || []).length, lista.length, 'Hay una imagen fuera de una figura');
});

test('presentacion: las imágenes son WebP publicados de hasta 1200 px, con lazy salvo la portada', () => {
    for (const { img } of figuras()) {
        const archivo = archivoDe(img);
        assert.equal(atributo(img, 'src'), `/img/presentacion/${archivo}`);
        const [ancho, alto] = medidasWebp(path.join(SRC, 'img', 'presentacion', archivo));
        assert.ok(ancho <= 1200, `${archivo}: mide ${ancho} px`);
        assert.equal(atributo(img, 'width'), String(ancho), `${archivo}: width`);
        assert.equal(atributo(img, 'height'), String(alto), `${archivo}: height`);
        const esPortada = archivo === 'logo-horizontal.webp';
        assert.equal(atributo(img, 'loading'), esPortada ? undefined : 'lazy', `${archivo}: loading`);
    }
    assert.equal(fs.readdirSync(path.join(SRC, 'img', 'presentacion')).length, figuras().length, 'Hay imágenes sin usar');
});

test('presentacion: los videos muestran la miniatura y cargan youtube-nocookie recién al hacer clic', () => {
    assert.doesNotMatch(html, /<iframe\b/);
    assert.doesNotMatch(html, /i\.ytimg\.com|youtube\.com/);
    for (const id of ['QeGQytGbK9k', 'rcM15H-btQ4']) {
        assert.match(html, new RegExp(`<a [^>]*href="https://youtu\\.be/${id}"[^>]*data-video-id="${id}"`));
    }
    assert.match(js, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
    assert.match(js, /addEventListener\('click'/);
    assert.doesNotMatch(js, /innerHTML/);
    assert.match(html, /<script src="\/js\/presentacion\.js" defer><\/script>/);
    assert.doesNotMatch(html, /<script>|\son[a-z]+="/, 'Sin scripts en línea');
});

test('marca: presentacion usa solo los colores y las fuentes de IDENTIDAD-MARCA.md', () => {
    const permitidas = new Set(leer(path.join(RAIZ, 'documentacion', 'IDENTIDAD-MARCA.md')).match(/--color-[a-z0-9-]+/g));
    const hoja = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const usadas = hoja.match(/var\(--color-[a-z0-9-]+/g) || [];
    assert.ok(usadas.length > 0, 'La hoja no usa variables de color');
    for (const uso of usadas) assert.ok(permitidas.has(uso.slice(4)), `${uso.slice(4)} no está en IDENTIDAD-MARCA.md`);

    for (const [nombre, texto] of [['presentacion.css', hoja], ['presentacion.html', html], ['presentacion.js', js]]) {
        const literales = texto.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[\d.]/g) || [];
        assert.deepEqual(literales, [], `${nombre}: colores escritos a mano`);
    }
    assert.doesNotMatch(html, /\sstyle=|<style\b/, 'El html no lleva estilos propios');
    assert.doesNotMatch(hoja, /:root/, 'La hoja no define variables nuevas');

    // Sin los var(): --color-gray no es el color gray
    const nombrados = /:[^;{}]*\b(?:white|black|red|green|blue|yellow|orange|gold|amber|gray|grey|silver|navy|pink|purple|brown|beige|ivory|cream)\b/i;
    assert.doesNotMatch(hoja.replace(/var\([^)]*\)/g, ''), nombrados, 'Hay un color con nombre');

    for (const fuente of hoja.match(/font-family:[^;]+/g) || []) {
        assert.match(fuente, /^font-family:\s*var\(--font-(main|condensed)\)$/, fuente);
    }
    assert.match(html, /family=Barlow:wght@[\d;]+&(?:amp;)?family=Barlow\+Condensed:wght@/);
    assert.match(html, /<link rel="stylesheet" href="\/css\/styles\.css">/, 'Las variables salen de styles.css');
    assert.match(html, /<link rel="stylesheet" href="\/css\/presentacion\.css">/);
});

test('seo: presentacion es indexable y su canonical es /presentacion', () => {
    assert.ok(html.includes('<link rel="canonical" href="https://pointer-demo.netlify.app/presentacion">'));
    assert.doesNotMatch(html, /<meta name="robots"/);
    assert.match(html, /<meta name="viewport"/);
    assert.ok(leer(path.join(RAIZ, 'documentacion', '09-SEO.md')).includes('`presentacion.html`'), 'Falta en 09-SEO.md');
});

// ---------------------------------------------------------------
// CSP: los documentos de Netlify no garantizan que una regla específica
// reemplace a /*. Si las dos se sumaran, el navegador aplicaría las dos políticas
// y bloquearía el reproductor. Por eso /* no lleva CSP y cada ruta tiene la suya.
// ---------------------------------------------------------------
const reglasCsp = () => Object.fromEntries(toml.split('[[headers]]').slice(1)
    .filter((bloque) => /^\s*Content-Security-Policy\s*=/m.test(bloque))
    .map((bloque) => [bloque.match(/for\s*=\s*"([^"]+)"/)[1], bloque.match(/Content-Security-Policy\s*=\s*"([^"]+)"/)[1]]));

test('csp: solo presentacion permite el reproductor y las demás rutas quedan iguales', () => {
    const reglas = reglasCsp();
    const estrictas = ['/', '/index.html', '/login', '/login.html', '/dashboard', '/dashboard.html', '/pos', '/pos.html', '/sw.js'];
    assert.deepEqual(Object.keys(reglas).sort(), [...estrictas, '/presentacion', '/presentacion.html'].sort());

    const estricta = reglas['/login'];
    for (const ruta of estrictas) {
        assert.equal(reglas[ruta], estricta, `${ruta}: política distinta`);
        assert.doesNotMatch(reglas[ruta], /youtube|frame-src/, `${ruta}: no debe permitir el reproductor`);
    }
    assert.match(estricta, /^default-src 'self';.*frame-ancestors 'none'$/);

    const conReproductor = estricta.replace("default-src 'self';", "default-src 'self'; frame-src https://www.youtube-nocookie.com;");
    assert.equal(reglas['/presentacion'], conReproductor);
    assert.equal(reglas['/presentacion.html'], conReproductor);
});

test('csp: index.html la lleva en una meta para proteger las rutas desconocidas', () => {
    const estricta = reglasCsp()['/login'];
    const sinAncestros = estricta.replace(/;\s*frame-ancestors 'none'$/, '');
    const index = leer(path.join(SRC, 'index.html'));
    assert.ok(index.includes(`<meta http-equiv="Content-Security-Policy" content="${sinAncestros}">`), 'Falta la meta o es distinta');
    assert.ok(index.indexOf('http-equiv') < index.indexOf('<script'), 'La meta tiene que ir antes de los scripts');
    // frame-ancestors no funciona en una meta: esto lo cubre X-Frame-Options, que sigue en /*
    assert.match(toml, /for = "\/\*"\s+\[headers\.values\][\s\S]*?X-Frame-Options = "DENY"/);
});
