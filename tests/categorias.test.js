// Tests de la sección Categorías. Leen sistema/js/products.js sin abrir el navegador.
// Se corren con: npm test
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const productos = fs.readFileSync(path.join(__dirname, '..', 'sistema', 'js', 'products.js'), 'utf8');
const seccion = productos.slice(productos.indexOf('async function renderCategorias'), productos.indexOf('function modalCategoria'));

// productos tiene permisos por columna para ocultar precio_costo: contar la fila entera da 403
test('categorias: no cuenta los productos con productos(count), que la base rechaza', () => {
    assert.doesNotMatch(productos, /productos\s*\(\s*count\s*\)/);
    assert.match(seccion, /\.select\('\*, productos\(id\)'\)/);
    assert.match(seccion, /c\.productos\?\.length \|\| 0/);
    assert.doesNotMatch(seccion, /\.count\b/);
});

test('categorias: si la consulta falla, no dice que no hay categorías', () => {
    assert.match(seccion, /const \{ data, error \} = await window\._supabase/);
    assert.match(seccion, /\$\{error\s*\?\s*`[^`]*No pudimos cargar las categorías\. Probá de nuevo\.[^`]*`\s*:\s*!data\?\.length/);
});
