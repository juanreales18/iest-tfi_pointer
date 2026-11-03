// Tests de la constitución de Pointer (documentacion/CONSTITUCION.md).
// Cada test comprueba un principio sobre el código de sistema/ y el repositorio.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'sistema');
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
test('stack: sistema/ no tiene package.json ni scripts cargados desde internet', () => {
    assert.equal(fs.existsSync(path.join(SRC, 'package.json')), false, 'sistema/ no debe tener package.json');
    const conCdn = archivos(SRC, ['.html'])
        .filter((f) => /<script[^>]+src=["']https?:/i.test(leer(f)))
        .map(relativo);
    assert.deepEqual(conCdn, [], `Scripts desde CDN en: ${conCdn.join(', ')}`);
});

// ---------------------------------------------------------------
// P2 · Marca: colores solo desde variables CSS
// Cuenta hexadecimales y rgba() con números; rgba(var(--x-rgb), 0.5)
// está permitido porque el color sale de :root.
// ---------------------------------------------------------------
const DEUDA_COLORES_CSS = 0;

test('marca: no se agregan colores escritos a mano fuera de :root', () => {
    let total = 0;
    const detalle = [];
    for (const f of archivos(path.join(SRC, 'css'), ['.css'])) {
        const sinRoot = leer(f).replace(/:root\s*\{[^}]*\}/g, '');
        const n = (sinRoot.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g) || []).length;
        total += n;
        if (n) detalle.push(`${relativo(f)}: ${n}`);
    }
    assert.ok(
        total <= DEUDA_COLORES_CSS,
        `Hay ${total} colores escritos a mano (máximo permitido ${DEUDA_COLORES_CSS}). ${detalle.join('; ')}`
    );
});

// Lo único que queda con el valor literal, y por qué:
const EXCEPCIONES_COLORES = {
    // <input type="color"> solo acepta un hex: con var() guardaría negro
    [path.join('sistema', 'js', 'products.js')]: ["value=\"${cat?.color || '#F59E0B'}\""],
    // La consola no resuelve variables; &#039; es la comilla de escapeHtml, no un color
    [path.join('sistema', 'js', 'config.js')]: ["'color:#F59E0B;font-weight:800;font-size:16px;'", '&#039;'],
};

test('marca: los html y js de sistema/ no tienen colores escritos a mano', () => {
    const detalle = [];
    for (const f of archivos(SRC, ['.html', '.js'])) {
        let texto = leer(f);
        for (const permitido of EXCEPCIONES_COLORES[relativo(f)] || []) {
            assert.ok(texto.includes(permitido), `Excepción vieja en ${relativo(f)}: ${permitido}`);
            texto = texto.replace(permitido, '');
        }
        const n = (texto.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d|color:\s*red\b/g) || []).length;
        if (n) detalle.push(`${relativo(f)}: ${n}`);
    }
    assert.deepEqual(detalle, [], `Colores escritos a mano en: ${detalle.join('; ')}`);
});

test('marca: index.html y el aviso de bloqueo cargan las variables de styles.css', () => {
    const hoja = /<link rel="stylesheet" href="css\/styles\.css">/;
    assert.match(leer(path.join(SRC, 'index.html')), hoja);
    assert.match(leer(path.join(SRC, 'js', 'auth.js')), hoja);
});

// ---------------------------------------------------------------
// Nombre y SEO (documentacion/09-SEO.md)
// ---------------------------------------------------------------
const PAGINAS_SEO = {
    'login.html': ['Ingresar · Pointer', 'Sistema de ventas, stock y caja para kioscos. Ingresá con tu usuario.'],
    'dashboard.html': ['Pointer · Panel', 'Panel de gestión del kiosco.'],
    'pos.html': ['Pointer · Punto de venta', 'Panel de gestión del kiosco.'],
    'index.html': ['Pointer', 'Redirige a login o panel.'],
};

test('nombre: ninguna pantalla muestra el nombre viejo', () => {
    const conNombreViejo = archivos(SRC, ['.html', '.js'])
        .filter((f) => /KioscoSystem|Kiosco Web/.test(leer(f)))
        .map(relativo);
    assert.deepEqual(conNombreViejo, [], `Nombre viejo en: ${conNombreViejo.join(', ')}`);
    assert.match(leer(path.join(SRC, 'js', 'config.js')), /const APP_NAME\s*=\s*'Pointer';/);
    assert.match(leer(path.join(SRC, 'dashboard.html')), /<span class="sidebar-logo-text">Pointer<\/span>/);
    assert.match(leer(path.join(SRC, 'login.html')), /<h1 class="brand-title">Pointer<\/h1>/);
    assert.match(leer(path.join(SRC, 'js', 'auth.js')), /<div class="bloqueo-logo">Pointer<\/div>/);
});

test('nombre: el ícono de cada pantalla lleva la inicial de Pointer', () => {
    assert.match(leer(path.join(SRC, 'dashboard.html')), /<span class="sidebar-logo-icon">P<\/span>/);
    assert.match(leer(path.join(SRC, 'login.html')), /<span class="brand-icon">P<\/span>/);
    assert.match(leer(path.join(SRC, 'pos.html')), /<span class="pos-logo-icon">P<\/span>/);
});

test('seo: cada página tiene el título y la descripción de 09-SEO.md', () => {
    const titulos = Object.values(PAGINAS_SEO).map(([titulo]) => titulo);
    assert.equal(new Set(titulos).size, titulos.length, 'Hay títulos repetidos');
    for (const [pagina, [titulo, descripcion]] of Object.entries(PAGINAS_SEO)) {
        const html = leer(path.join(SRC, pagina));
        assert.ok(html.includes(`<title>${titulo}</title>`), `${pagina}: falta el título «${titulo}»`);
        assert.ok(html.includes(`<meta name="description" content="${descripcion}">`), `${pagina}: falta la descripción`);
    }
});

test('marca: cada página usa los favicons de Pointer, iguales a los de multimedia/marca', () => {
    for (const tamano of ['32', '192']) {
        const nombre = `favicon-${tamano}.png`;
        const publicado = fs.readFileSync(path.join(SRC, 'img', nombre));
        assert.ok(publicado.equals(fs.readFileSync(path.join(RAIZ, 'multimedia', 'marca', nombre))), `${nombre} es distinto`);
        for (const pagina of Object.keys(PAGINAS_SEO)) {
            const enlace = `<link rel="icon" type="image/png" sizes="${tamano}x${tamano}" href="img/${nombre}">`;
            assert.ok(leer(path.join(SRC, pagina)).includes(enlace), `${pagina}: falta ${nombre}`);
        }
    }
});

test('seo: solo las pantallas internas llevan noindex en su meta robots', () => {
    const noindex = /<meta name="robots"\s+content="noindex, nofollow">/;
    assert.doesNotMatch(leer(path.join(SRC, 'login.html')), /<meta name="robots"/);
    // index.html también protege las rutas desconocidas: netlify.toml las sirve con ese archivo
    for (const pagina of ['dashboard.html', 'pos.html', 'index.html']) {
        assert.match(leer(path.join(SRC, pagina)), noindex, `${pagina}: falta noindex`);
    }
});

test('seo: login.html declara /login como canonical y no redirige', () => {
    assert.ok(leer(path.join(SRC, 'login.html')).includes('<link rel="canonical" href="https://pointer-demo.netlify.app/login">'), 'Falta el canonical');
    // Una redirección de /login.html podría romper el login: sw.js guarda esa dirección en caché
    assert.doesNotMatch(leer(path.join(SRC, 'netlify.toml')), /from\s*=\s*"\/login/);
});

test('seo: netlify.toml pone noindex por ruta y solo en las pantallas internas', () => {
    const conNoindex = leer(path.join(SRC, 'netlify.toml'))
        .split('[[headers]]')
        .filter((bloque) => /^\s*X-Robots-Tag\s*=\s*"noindex, nofollow"/m.test(bloque))
        .map((bloque) => bloque.match(/for\s*=\s*"([^"]+)"/)?.[1])
        .sort();
    assert.deepEqual(conNoindex, ['/', '/dashboard', '/dashboard.html', '/index.html', '/pos', '/pos.html']);
});

test('accesibilidad: las X de los modales tienen aria-label', () => {
    for (const pagina of ['dashboard.html', 'pos.html']) {
        const botones = leer(path.join(SRC, pagina)).match(/<button class="modal-close"[^>]*>/g) || [];
        assert.ok(botones.length > 0, `${pagina}: no se encontraron botones`);
        for (const boton of botones) assert.match(boton, /aria-label="Cerrar"/, `${pagina}: ${boton}`);
    }
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
    for (const archivo of ['documentacion/CONSTITUCION.md', 'documentacion/PROMPTS.md', 'documentacion/DECLARACION-IA.md', 'multimedia/FICHAS-IA.md', 'AGENTS.md', 'memory.md']) {
        assert.ok(fs.existsSync(path.join(RAIZ, archivo)), `Falta ${archivo}`);
    }
    const constitucion = leer(path.join(RAIZ, 'documentacion', 'CONSTITUCION.md'));
    assert.match(constitucion, /Uso responsable de la IA/);
});
