/* =============================================================
   KIOSCO SYSTEM - PRODUCTS.JS
   Gestion de productos, categorias, proveedores,
   clientes, historial de stock y compras
   ============================================================= */


// =============================================================
// COSTOS (solo dueno)
// El costo de los productos no se puede leer directo de la tabla: la base lo
// entrega unicamente al dueno, a traves de la funcion get_costos().
// =============================================================

async function cargarCostos(ids) {
    if (!AppUser.isDueno) return {};
    const { data, error } = await window._supabase.rpc('get_costos', { p_ids: ids && ids.length ? ids : null });
    if (error) { console.warn('[Costos]', error.message); return {}; }
    const mapa = {};
    (data || []).forEach(r => { mapa[r.id] = r.precio_costo; });
    return mapa;
}

// Columnas de productos que puede leer cualquier usuario (sin precio_costo)
const PRODUCTO_COLUMNAS = 'id, categoria_id, proveedor_id, codigo_barra, codigo_interno, nombre, descripcion, ' +
    'precio_venta, precio_mayorista, stock_actual, stock_minimo, stock_maximo, unidad_medida, imagen_url, activo, destacado';


// =============================================================
// PRODUCTOS
// =============================================================

async function renderProductos(area) {
    let page       = 1;
    let search     = '';
    let catFilter  = '';
    const pageSize = ITEMS_PAGE;

    let categorias = [];
    try {
        const { data } = await window._supabase
            .from('categorias')
            .select('id, nombre')
            .eq('activa', true)
            .order('orden');
        categorias = data || [];
    } catch(e) {}

    async function load() {
        const from = (page - 1) * pageSize;

        let query = window._supabase
            .from('productos')
            .select(`
                id, nombre, codigo_barra, precio_venta,
                stock_actual, stock_minimo, activo, destacado,
                categorias ( nombre ),
                proveedores ( razon_social )
            `, { count: 'exact' })
            .is('deleted_at', null)
            .order('nombre');

        if (search)    query = query.ilike('nombre', `%${search}%`);
        if (catFilter) query = query.eq('categoria_id', catFilter);

        const { data, count, error } = await query.range(from, from + pageSize - 1);

        if (error) { toastError('Error al cargar productos'); return; }

        // El costo llega aparte y solo para el dueno
        const costos = await cargarCostos((data || []).map(p => p.id));
        (data || []).forEach(p => { p.precio_costo = costos[p.id]; });

        const totalPages = Math.ceil((count || 0) / pageSize);
        const catOpts = categorias.map(c =>
            `<option value="${c.id}" ${catFilter === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`
        ).join('');

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Productos</h1>
            <div style="display:flex;gap:10px">
                <button class="btn btn-ghost btn-sm" id="btn-export-prod">Exportar CSV</button>
                ${AppUser.isDueno
                    ? `<button class="btn btn-primary" id="btn-nuevo-prod">+ Nuevo producto</button>`
                    : ''}
            </div>
        </div>

        <div class="filter-bar">
            <div class="search-bar" style="flex:1;max-width:360px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="prod-search" placeholder="Buscar por nombre o codigo..." value="${escapeHtml(search)}">
            </div>
            <select id="prod-cat-filter" class="form-select" style="width:180px">
                <option value="">Todas las categorias</option>
                ${catOpts}
            </select>
        </div>

        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">${count || 0} productos</span>
                <div style="display:flex;gap:6px;align-items:center">
                    <span class="badge badge-danger" id="badge-sin-stock" style="display:none">Sin stock</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead><tr>
                        <th>Producto</th>
                        <th>Codigo</th>
                        <th>Categoria</th>
                        <th>Costo</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        ${AppUser.isDueno ? '<th>Acciones</th>' : ''}
                    </tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--color-gray)">
                                   No se encontraron productos
                               </td></tr>`
                            : data.map(p => `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:10px">
                                        <div class="product-row-image">${escapeHtml(p.nombre[0].toUpperCase())}</div>
                                        <div>
                                            <div style="font-weight:600;font-size:14px">${escapeHtml(p.nombre)}</div>
                                            ${p.destacado ? '<span class="badge badge-warning" style="font-size:10px">Destacado</span>' : ''}
                                        </div>
                                    </div>
                                </td>
                                <td><code style="font-size:12px;color:var(--color-gray)">${escapeHtml(p.codigo_barra || '-')}</code></td>
                                <td>${escapeHtml(p.categorias?.nombre || '-')}</td>
                                <td>${AppUser.isDueno ? formatCurrency(p.precio_costo) : '-'}</td>
                                <td><strong>${formatCurrency(p.precio_venta)}</strong></td>
                                <td>
                                    <span style="font-family:var(--font-condensed);font-weight:700;font-size:1.05rem;
                                        color:${p.stock_actual <= 0 ? 'var(--color-danger)' : p.stock_actual <= p.stock_minimo ? 'var(--color-warning)' : 'var(--color-success)'}">
                                        ${p.stock_actual}
                                    </span>
                                    <span style="font-size:11px;color:var(--color-gray)"> / min ${p.stock_minimo}</span>
                                </td>
                                <td><span class="badge ${p.activo ? 'badge-success' : 'badge-danger'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
                                ${AppUser.isDueno ? `
                                <td class="td-actions">
                                    <button class="btn btn-ghost btn-sm" data-id="${p.id}" data-action="edit-prod">Editar</button>
                                    <button class="btn btn-ghost btn-sm" data-id="${p.id}" data-action="ajuste-stock" title="Ajuste de stock">Stock</button>
                                    <button class="btn btn-ghost btn-sm btn-danger" data-id="${p.id}" data-action="delete-prod">Eliminar</button>
                                </td>` : ''}
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
            <div class="table-section-footer">
                <span style="font-size:13px;color:var(--color-gray)">
                    Pagina ${page} de ${totalPages || 1}
                </span>
                <div id="pagination-productos"></div>
            </div>
        </div>`;

        renderPagination('pagination-productos', page, totalPages, (p) => { page = p; load(); });

        // Eventos
        const searchInput = document.getElementById('prod-search');
        searchInput?.addEventListener('input', debounce(() => {
            search = searchInput.value.trim();
            page = 1;
            load();
        }, 350));

        document.getElementById('prod-cat-filter')?.addEventListener('change', (e) => {
            catFilter = e.target.value;
            page = 1;
            load();
        });

        document.getElementById('btn-nuevo-prod')?.addEventListener('click', () => {
            modalProducto(null, categorias, () => load());
        });

        document.getElementById('btn-export-prod')?.addEventListener('click', () => {
            exportCSV(data || [], 'productos', {
                nombre: 'Nombre', codigo_barra: 'Codigo',
                precio_costo: 'Costo', precio_venta: 'Precio', stock_actual: 'Stock'
            });
        });

        area.querySelectorAll('[data-action="edit-prod"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { data: prod } = await window._supabase
                    .from('productos').select(PRODUCTO_COLUMNAS).eq('id', btn.dataset.id).single();
                if (prod) {
                    const costos = await cargarCostos([prod.id]);
                    prod.precio_costo = costos[prod.id];
                    modalProducto(prod, categorias, () => load());
                }
            });
        });

        area.querySelectorAll('[data-action="ajuste-stock"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { data: prod } = await window._supabase
                    .from('productos').select('id, nombre, stock_actual').eq('id', btn.dataset.id).single();
                if (prod) modalAjusteStock(prod, () => load());
            });
        });

        area.querySelectorAll('[data-action="delete-prod"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                confirmAction(
                    'Eliminar producto',
                    'Se desactivara el producto. Las ventas existentes no se veran afectadas.',
                    async () => {
                        await window._supabase.from('productos')
                            .update({ deleted_at: new Date().toISOString(), activo: false })
                            .eq('id', id);
                        await registrarAuditoria('eliminar', 'productos', id, 'Producto eliminado (soft delete)');
                        toastSuccess('Producto eliminado');
                        load();
                    }
                );
            });
        });
    }

    await load();
}


// =============================================================
// MODAL PRODUCTO (CREAR / EDITAR)
// =============================================================

function modalProducto(prod, categorias, onSaved) {
    const isEdit = !!prod;
    const catOpts = categorias.map(c =>
        `<option value="${c.id}" ${prod?.categoria_id === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`
    ).join('');

    const body = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Nombre del producto <span style="color:red">*</span></label>
                <input type="text" id="mp-nombre" class="form-input"
                    value="${escapeHtml(prod?.nombre || '')}" placeholder="Ej: Coca Cola 500ml">
                <span class="field-error" id="mp-nombre-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Codigo de barras</label>
                <input type="text" id="mp-codigo" class="form-input"
                    value="${escapeHtml(prod?.codigo_barra || '')}" placeholder="7790001234567">
            </div>
            <div class="form-group">
                <label class="form-label">Categoria</label>
                <select id="mp-cat" class="form-select">
                    <option value="">Sin categoria</option>
                    ${catOpts}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Precio de costo</label>
                <input type="number" id="mp-costo" class="form-input"
                    value="${prod?.precio_costo || 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label class="form-label">Precio de venta <span style="color:red">*</span></label>
                <input type="number" id="mp-precio" class="form-input"
                    value="${prod?.precio_venta || ''}" min="0" step="0.01" placeholder="0.00">
                <span class="field-error" id="mp-precio-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Stock actual</label>
                <input type="number" id="mp-stock" class="form-input"
                    value="${prod?.stock_actual ?? 0}" min="0" ${isEdit ? 'readonly style="background:var(--color-bg-2)"' : ''}>
                ${isEdit ? '<span class="form-hint">Para modificar el stock usa el boton "Stock"</span>' : ''}
            </div>
            <div class="form-group">
                <label class="form-label">Stock minimo (alerta)</label>
                <input type="number" id="mp-stock-min" class="form-input"
                    value="${prod?.stock_minimo ?? 5}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">Unidad de medida</label>
                <input type="text" id="mp-unidad" class="form-input"
                    value="${escapeHtml(prod?.unidad_medida || 'unidad')}" placeholder="unidad, kg, litro...">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Descripcion</label>
                <textarea id="mp-desc" class="form-textarea" placeholder="Opcional...">${escapeHtml(prod?.descripcion || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-check">
                    <input type="checkbox" id="mp-activo" ${prod?.activo !== false ? 'checked' : ''}>
                    <span class="form-check-label">Producto activo</span>
                </label>
            </div>
            <div class="form-group">
                <label class="form-check">
                    <input type="checkbox" id="mp-destacado" ${prod?.destacado ? 'checked' : ''}>
                    <span class="form-check-label">Destacar en POS</span>
                </label>
            </div>
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-producto">
            ${isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>`;

    openModal(isEdit ? 'Editar producto' : 'Nuevo producto', body, footer, 'modal-lg');

    // Preview de margen en tiempo real
    const costoInput  = document.getElementById('mp-costo');
    const precioInput = document.getElementById('mp-precio');

    document.getElementById('confirm-producto').addEventListener('click', async () => {
        const nombre    = document.getElementById('mp-nombre').value.trim();
        const codigo    = document.getElementById('mp-codigo').value.trim();
        const catId     = document.getElementById('mp-cat').value || null;
        const costo     = parseFloat(document.getElementById('mp-costo').value) || 0;
        const precio    = parseFloat(document.getElementById('mp-precio').value);
        const stock     = parseInt(document.getElementById('mp-stock').value) || 0;
        const stockMin  = parseInt(document.getElementById('mp-stock-min').value) || 0;
        const unidad    = document.getElementById('mp-unidad').value.trim() || 'unidad';
        const desc      = document.getElementById('mp-desc').value.trim();
        const activo    = document.getElementById('mp-activo').checked;
        const destacado = document.getElementById('mp-destacado').checked;

        if (!nombre) { showFieldError('mp-nombre', 'El nombre es obligatorio'); return; }
        if (isNaN(precio) || precio < 0) { showFieldError('mp-precio', 'Ingresa un precio valido'); return; }

        const payload = {
            nombre, precio_venta: precio, precio_costo: costo,
            stock_minimo: stockMin, unidad_medida: unidad,
            categoria_id: catId, descripcion: desc || null,
            activo, destacado,
            ...(codigo ? { codigo_barra: codigo } : {}),
        };

        if (!isEdit) payload.stock_actual = stock;

        let error;
        let savedId = prod?.id;

        if (isEdit) {
            const res = await window._supabase.from('productos').update(payload).eq('id', prod.id);
            error = res.error;
        } else {
            const res = await window._supabase.from('productos').insert(payload).select('id').single();
            error = res.error;
            savedId = res.data?.id;
        }

        if (error) {
            if (error.code === '23505') toastError('El codigo de barras ya existe');
            else toastError('No se pudo guardar el producto: ' + error.message);
            return;
        }

        await registrarAuditoria(
            isEdit ? 'editar' : 'crear',
            'productos', savedId,
            `Producto ${isEdit ? 'editado' : 'creado'}: ${nombre}`
        );

        closeModal();
        toastSuccess(isEdit ? 'Producto actualizado' : 'Producto creado correctamente');
        if (onSaved) onSaved();
    });
}


// =============================================================
// MODAL AJUSTE DE STOCK
// =============================================================

function modalAjusteStock(prod, onSaved) {
    const body = `
        <div style="margin-bottom:16px;padding:14px;background:var(--color-bg-2);border-radius:var(--radius-md)">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">${escapeHtml(prod.nombre)}</div>
            <div>Stock actual: <strong style="font-family:var(--font-condensed);font-size:1.2rem">${prod.stock_actual}</strong></div>
        </div>
        <div class="form-group">
            <label class="form-label">Tipo de ajuste</label>
            <select id="ajuste-tipo" class="form-select">
                <option value="entrada">Entrada (sumar)</option>
                <option value="salida">Salida (restar)</option>
                <option value="ajuste_manual">Ajuste manual (establecer)</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Cantidad <span style="color:red">*</span></label>
            <input type="number" id="ajuste-cantidad" class="form-input" min="0" placeholder="0">
            <span class="field-error" id="ajuste-cantidad-error"></span>
        </div>
        <div class="form-group">
            <label class="form-label">Motivo</label>
            <input type="text" id="ajuste-motivo" class="form-input" placeholder="Ej: Merma, robo, correccion...">
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-ajuste">Aplicar ajuste</button>`;

    openModal('Ajuste de stock', body, footer, 'modal-sm');

    document.getElementById('confirm-ajuste').addEventListener('click', async () => {
        const tipo     = document.getElementById('ajuste-tipo').value;
        const cantidad = parseInt(document.getElementById('ajuste-cantidad').value);
        const motivo   = document.getElementById('ajuste-motivo').value.trim();

        if (isNaN(cantidad) || cantidad < 0) {
            showFieldError('ajuste-cantidad', 'Ingresa una cantidad valida');
            return;
        }

        let nuevoStock;
        let delta;

        if (tipo === 'ajuste_manual') {
            nuevoStock = cantidad;
            delta      = cantidad - prod.stock_actual;
        } else if (tipo === 'entrada') {
            nuevoStock = prod.stock_actual + cantidad;
            delta      = cantidad;
        } else {
            nuevoStock = Math.max(0, prod.stock_actual - cantidad);
            delta      = -(prod.stock_actual - nuevoStock);
        }

        const { error } = await window._supabase
            .from('productos')
            .update({ stock_actual: nuevoStock })
            .eq('id', prod.id);

        if (error) { toastError('No se pudo ajustar el stock'); return; }

        // Registrar en historial
        await window._supabase.from('historial_stock').insert({
            producto_id:      prod.id,
            usuario_id:       AppUser.profile.id,
            tipo_movimiento:  tipo,
            cantidad_antes:   prod.stock_actual,
            cantidad_cambio:  delta,
            cantidad_despues: nuevoStock,
            motivo:           motivo || `Ajuste manual - ${tipo}`,
        });

        await registrarAuditoria('editar', 'productos', prod.id,
            `Ajuste de stock: ${prod.stock_actual} -> ${nuevoStock}`);

        closeModal();
        toastSuccess(`Stock actualizado: ${nuevoStock} unidades`);
        if (onSaved) onSaved();
    });
}


// =============================================================
// CATEGORIAS
// =============================================================

async function renderCategorias(area) {
    async function load() {
        const { data } = await window._supabase
            .from('categorias')
            .select('*, productos(count)')
            .is('deleted_at', null)
            .order('orden');

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Categorias</h1>
            ${AppUser.isDueno
                ? `<button class="btn btn-primary" id="btn-nueva-cat">+ Nueva categoria</button>`
                : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
            ${!data?.length
                ? `<p style="color:var(--color-gray);grid-column:1/-1">Sin categorias</p>`
                : data.map(c => `
                <div class="card" style="padding:16px">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                        <div style="width:38px;height:38px;border-radius:var(--radius-md);background:${escapeHtml(c.color || '#F59E0B')}22;display:flex;align-items:center;justify-content:center">
                            <div style="width:12px;height:12px;border-radius:50%;background:${escapeHtml(c.color || '#F59E0B')}"></div>
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:14px">${escapeHtml(c.nombre)}</div>
                            <div style="font-size:12px;color:var(--color-gray)">${c.productos?.[0]?.count || 0} productos</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between">
                        <span class="badge ${c.activa ? 'badge-success' : 'badge-gray'}">${c.activa ? 'Activa' : 'Inactiva'}</span>
                        ${AppUser.isDueno ? `
                        <div style="display:flex;gap:6px">
                            <button class="btn btn-ghost btn-sm" data-id="${c.id}" data-action="edit-cat">Editar</button>
                            <button class="btn btn-ghost btn-sm btn-danger" data-id="${c.id}" data-action="delete-cat">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                            </button>
                        </div>` : ''}
                    </div>
                </div>`).join('')
            }
        </div>`;

        document.getElementById('btn-nueva-cat')?.addEventListener('click', () => modalCategoria(null, load));

        area.querySelectorAll('[data-action="edit-cat"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { data: cat } = await window._supabase
                    .from('categorias').select('*').eq('id', btn.dataset.id).single();
                if (cat) modalCategoria(cat, load);
            });
        });

        area.querySelectorAll('[data-action="delete-cat"]').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('Eliminar categoria', 'Los productos de esta categoria quedaran sin categoria.', async () => {
                    await window._supabase.from('categorias')
                        .update({ deleted_at: new Date().toISOString(), activa: false })
                        .eq('id', btn.dataset.id);
                    toastSuccess('Categoria eliminada');
                    load();
                });
            });
        });
    }

    await load();
}

function modalCategoria(cat, onSaved) {
    const isEdit = !!cat;
    const body = `
        <div class="form-group">
            <label class="form-label">Nombre <span style="color:red">*</span></label>
            <input type="text" id="cat-nombre" class="form-input"
                value="${escapeHtml(cat?.nombre || '')}" placeholder="Ej: Bebidas">
            <span class="field-error" id="cat-nombre-error"></span>
        </div>
        <div class="form-group">
            <label class="form-label">Descripcion</label>
            <input type="text" id="cat-desc" class="form-input"
                value="${escapeHtml(cat?.descripcion || '')}" placeholder="Opcional">
        </div>
        <div class="form-group">
            <label class="form-label">Color</label>
            <input type="color" id="cat-color" class="form-input" style="height:44px;padding:4px"
                value="${cat?.color || '#F59E0B'}">
        </div>
        <div class="form-group">
            <label class="form-label">Orden de aparicion</label>
            <input type="number" id="cat-orden" class="form-input"
                value="${cat?.orden || 0}" min="0">
        </div>
        <div class="form-group">
            <label class="form-check">
                <input type="checkbox" id="cat-activa" ${cat?.activa !== false ? 'checked' : ''}>
                <span class="form-check-label">Categoria activa</span>
            </label>
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-cat">${isEdit ? 'Guardar' : 'Crear'}</button>`;

    openModal(isEdit ? 'Editar categoria' : 'Nueva categoria', body, footer, 'modal-sm');

    document.getElementById('confirm-cat').addEventListener('click', async () => {
        const nombre = document.getElementById('cat-nombre').value.trim();
        if (!nombre) { showFieldError('cat-nombre', 'El nombre es obligatorio'); return; }

        const payload = {
            nombre,
            descripcion: document.getElementById('cat-desc').value.trim() || null,
            color:       document.getElementById('cat-color').value,
            orden:       parseInt(document.getElementById('cat-orden').value) || 0,
            activa:      document.getElementById('cat-activa').checked,
        };

        let error;
        if (isEdit) {
            ({ error } = await window._supabase.from('categorias').update(payload).eq('id', cat.id));
        } else {
            ({ error } = await window._supabase.from('categorias').insert(payload));
        }

        if (error) { toastError('No se pudo guardar: ' + error.message); return; }
        closeModal();
        toastSuccess(isEdit ? 'Categoria actualizada' : 'Categoria creada');
        if (onSaved) onSaved();
    });
}


// =============================================================
// HISTORIAL DE STOCK
// =============================================================

async function renderStock(area) {
    let page     = 1;
    const pgSize = 25;

    async function load() {
        const from = (page - 1) * pgSize;
        const { data, count } = await window._supabase
            .from('historial_stock')
            .select(`
                *, 
                productos ( nombre, codigo_barra ),
                usuarios  ( nombre, apellido )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + pgSize - 1);

        const totalPages = Math.ceil((count || 0) / pgSize);

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Historial de stock</h1>
            <button class="btn btn-ghost btn-sm" id="btn-export-stock">Exportar CSV</button>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">${count || 0} movimientos</span>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead><tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Antes</th>
                        <th>Cambio</th>
                        <th>Despues</th>
                        <th>Usuario</th>
                        <th>Motivo</th>
                    </tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--color-gray)">Sin movimientos</td></tr>`
                            : data.map(m => `
                            <tr>
                                <td style="white-space:nowrap">${formatDate(m.created_at, true)}</td>
                                <td>
                                    <div style="font-weight:600;font-size:13px">${escapeHtml(m.productos?.nombre || '-')}</div>
                                    <div style="font-size:11px;color:var(--color-gray)">${escapeHtml(m.productos?.codigo_barra || '')}</div>
                                </td>
                                <td><span class="badge ${
                                    m.tipo_movimiento === 'venta'   ? 'badge-danger' :
                                    m.tipo_movimiento === 'compra'  ? 'badge-success' :
                                    'badge-info'}">${m.tipo_movimiento}</span>
                                </td>
                                <td style="font-family:var(--font-condensed);font-weight:700">${m.cantidad_antes}</td>
                                <td style="font-weight:700;color:${m.cantidad_cambio >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                                    ${m.cantidad_cambio >= 0 ? '+' : ''}${m.cantidad_cambio}
                                </td>
                                <td style="font-family:var(--font-condensed);font-weight:700">${m.cantidad_despues}</td>
                                <td>${escapeHtml(m.usuarios ? `${m.usuarios.nombre} ${m.usuarios.apellido}` : '-')}</td>
                                <td style="font-size:12px;color:var(--color-gray)">${escapeHtml(m.motivo || '-')}</td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
            <div class="table-section-footer">
                <span style="font-size:13px;color:var(--color-gray)">Pagina ${page} de ${totalPages || 1}</span>
                <div id="pagination-stock"></div>
            </div>
        </div>`;

        renderPagination('pagination-stock', page, totalPages, (p) => { page = p; load(); });

        document.getElementById('btn-export-stock')?.addEventListener('click', () => {
            exportCSV(data || [], 'historial_stock', {
                created_at: 'Fecha', tipo_movimiento: 'Tipo',
                cantidad_antes: 'Antes', cantidad_cambio: 'Cambio',
                cantidad_despues: 'Despues', motivo: 'Motivo'
            });
        });
    }

    await load();
}


// =============================================================
// PROVEEDORES
// =============================================================

async function renderProveedores(area) {
    async function load() {
        const { data } = await window._supabase
            .from('proveedores')
            .select('*')
            .is('deleted_at', null)
            .order('razon_social');

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Proveedores</h1>
            <button class="btn btn-primary" id="btn-nuevo-prov">+ Nuevo proveedor</button>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">${data?.length || 0} proveedores</span>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr>
                        <th>Razon social</th><th>Contacto</th><th>CUIT</th>
                        <th>Telefono</th><th>Email</th><th>Estado</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--color-gray)">Sin proveedores</td></tr>`
                            : data.map(p => `
                            <tr>
                                <td><strong>${escapeHtml(p.razon_social)}</strong></td>
                                <td>${escapeHtml(p.nombre_contacto || '-')}</td>
                                <td><code style="font-size:12px">${escapeHtml(p.cuit || '-')}</code></td>
                                <td>${escapeHtml(p.telefono || '-')}</td>
                                <td>${escapeHtml(p.email || '-')}</td>
                                <td><span class="badge ${p.activo ? 'badge-success' : 'badge-gray'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
                                <td class="td-actions">
                                    <button class="btn btn-ghost btn-sm" data-id="${p.id}" data-action="edit-prov">Editar</button>
                                    <button class="btn btn-ghost btn-sm btn-danger" data-id="${p.id}" data-action="delete-prov">Eliminar</button>
                                </td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>`;

        document.getElementById('btn-nuevo-prov')?.addEventListener('click', () => modalProveedor(null, load));

        area.querySelectorAll('[data-action="edit-prov"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { data: prov } = await window._supabase
                    .from('proveedores').select('*').eq('id', btn.dataset.id).single();
                if (prov) modalProveedor(prov, load);
            });
        });

        area.querySelectorAll('[data-action="delete-prov"]').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('Eliminar proveedor', 'Se desactivara el proveedor del sistema. Sus compras anteriores se conservan.', async () => {
                    const { data: ok, error } = await window._supabase.from('proveedores')
                        .update({ deleted_at: new Date().toISOString(), activo: false })
                        .eq('id', btn.dataset.id)
                        .select('id');
                    if (error || !ok?.length) { toastError('No se pudo eliminar el proveedor'); return; }
                    toastSuccess('Proveedor eliminado');
                    load();
                });
            });
        });
    }

    await load();
}

function modalProveedor(prov, onSaved) {
    const isEdit = !!prov;
    const body = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Razon social <span style="color:red">*</span></label>
                <input type="text" id="pv-razon" class="form-input"
                    value="${escapeHtml(prov?.razon_social || '')}" placeholder="Ej: Distribuidora Norte SRL">
                <span class="field-error" id="pv-razon-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Nombre de contacto</label>
                <input type="text" id="pv-contacto" class="form-input"
                    value="${escapeHtml(prov?.nombre_contacto || '')}" placeholder="Juan Perez">
            </div>
            <div class="form-group">
                <label class="form-label">CUIT</label>
                <input type="text" id="pv-cuit" class="form-input"
                    value="${escapeHtml(prov?.cuit || '')}" placeholder="20-12345678-0">
            </div>
            <div class="form-group">
                <label class="form-label">Telefono</label>
                <input type="text" id="pv-tel" class="form-input"
                    value="${escapeHtml(prov?.telefono || '')}" placeholder="011 4444-5555">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="pv-email" class="form-input"
                    value="${escapeHtml(prov?.email || '')}" placeholder="ventas@distribuidor.com">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Domicilio</label>
                <input type="text" id="pv-domicilio" class="form-input"
                    value="${escapeHtml(prov?.domicilio || '')}" placeholder="Av. San Martin 1234, CABA">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Notas internas</label>
                <textarea id="pv-notas" class="form-textarea" placeholder="Condiciones, dias de entrega...">${escapeHtml(prov?.notas || '')}</textarea>
            </div>
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-prov">${isEdit ? 'Guardar' : 'Crear proveedor'}</button>`;

    openModal(isEdit ? 'Editar proveedor' : 'Nuevo proveedor', body, footer, 'modal-lg');

    document.getElementById('confirm-prov').addEventListener('click', async () => {
        const razon = document.getElementById('pv-razon').value.trim();
        if (!razon) { showFieldError('pv-razon', 'La razon social es obligatoria'); return; }
        const emailPv = document.getElementById('pv-email').value.trim();
        if (emailPv && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPv)) { toastError('El email no es valido'); return; }

        const payload = {
            razon_social:    razon,
            nombre_contacto: document.getElementById('pv-contacto').value.trim() || null,
            cuit:            document.getElementById('pv-cuit').value.trim() || null,
            telefono:        document.getElementById('pv-tel').value.trim() || null,
            email:           document.getElementById('pv-email').value.trim() || null,
            domicilio:       document.getElementById('pv-domicilio').value.trim() || null,
            notas:           document.getElementById('pv-notas').value.trim() || null,
        };

        let error;
        if (isEdit) {
            ({ error } = await window._supabase.from('proveedores').update(payload).eq('id', prov.id));
        } else {
            ({ error } = await window._supabase.from('proveedores').insert(payload));
        }

        if (error) { toastError('No se pudo guardar: ' + error.message); return; }
        closeModal();
        toastSuccess(isEdit ? 'Proveedor actualizado' : 'Proveedor creado');
        if (onSaved) onSaved();
    });
}


// =============================================================
// COMPRAS
// =============================================================

async function renderCompras(area) {
    async function load() {
        const { data } = await window._supabase
            .from('compras')
            .select('*, proveedores(razon_social), usuarios(nombre)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(40);

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Compras</h1>
            <button class="btn btn-primary" id="btn-nueva-compra">+ Nueva orden de compra</button>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">${data?.length || 0} ordenes</span>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr>
                        <th>Fecha</th><th>Proveedor</th><th>Factura</th>
                        <th>Total</th><th>Estado</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray)">Sin compras registradas</td></tr>`
                            : data.map(c => `
                            <tr>
                                <td>${formatDate(c.created_at)}</td>
                                <td><strong>${escapeHtml(c.proveedores?.razon_social || (c.proveedor_id ? 'Proveedor eliminado' : 'Sin proveedor'))}</strong></td>
                                <td><code style="font-size:12px">${escapeHtml(c.numero_factura || '-')}</code></td>
                                <td><strong>${formatCurrency(c.total)}</strong></td>
                                <td><span class="badge ${
                                    c.estado === 'recibida'  ? 'badge-success' :
                                    c.estado === 'cancelada' ? 'badge-danger'  :
                                    'badge-warning'}">${c.estado}</span>
                                </td>
                                <td class="td-actions">
                                    <button class="btn btn-ghost btn-sm" data-id="${c.id}" data-action="ver-compra">Ver detalle</button>
                                    ${c.estado === 'pendiente'
                                        ? `<button class="btn btn-success btn-sm" data-id="${c.id}" data-action="recibir-compra">Recibir</button>
                                           <button class="btn btn-ghost btn-sm btn-danger" data-id="${c.id}" data-action="cancelar-compra">Cancelar</button>`
                                        : ''
                                    }
                                </td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>`;

        document.getElementById('btn-nueva-compra')?.addEventListener('click', () => modalNuevaCompra(load));

        area.querySelectorAll('[data-action="recibir-compra"]').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('Marcar como recibida', 'Se actualizara el stock segun los productos de esta orden.', async () => {
                    const { data: ok, error } = await window._supabase.from('compras')
                        .update({ estado: 'recibida', fecha_recibida: new Date().toISOString() })
                        .eq('id', btn.dataset.id)
                        .eq('estado', 'pendiente')          // evita recibirla dos veces
                        .select('id');
                    if (error || !ok?.length) {
                        toastError(error?.message || 'La compra ya no esta pendiente');
                        load(); return;
                    }
                    toastSuccess('Compra recibida. Stock y costos actualizados.');
                    load();
                }, 'Confirmar', 'btn-success');
            });
        });

        area.querySelectorAll('[data-action="ver-compra"]').forEach(btn => {
            btn.addEventListener('click', () => verDetalleCompra(btn.dataset.id));
        });

        area.querySelectorAll('[data-action="cancelar-compra"]').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('Cancelar orden', 'Se cancelara esta orden de compra.', async () => {
                    const { data: ok, error } = await window._supabase.from('compras')
                        .update({ estado: 'cancelada' })
                        .eq('id', btn.dataset.id)
                        .eq('estado', 'pendiente')
                        .select('id');
                    if (error || !ok?.length) { toastError('No se pudo cancelar la orden'); load(); return; }
                    toastSuccess('Orden cancelada');
                    load();
                });
            });
        });
    }

    await load();
}

// Ver detalle de una orden de compra (antes el boton no hacia nada)
async function verDetalleCompra(compraId) {
    const { data: c, error } = await window._supabase
        .from('compras')
        .select('*, proveedores(razon_social), usuarios(nombre), detalle_compras(cantidad, precio_unitario, subtotal, productos(nombre))')
        .eq('id', compraId)
        .single();
    if (error || !c) { toastError('No se pudo cargar el detalle'); return; }

    const filas = (c.detalle_compras || []).map(d => `
        <tr>
            <td>${escapeHtml(d.productos?.nombre || 'Producto')}</td>
            <td style="text-align:right">${d.cantidad}</td>
            <td style="text-align:right">${formatCurrency(d.precio_unitario)}</td>
            <td style="text-align:right"><strong>${formatCurrency(d.subtotal)}</strong></td>
        </tr>`).join('');

    const body = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:13px;margin-bottom:14px">
            <div><span style="color:var(--color-gray)">Proveedor:</span> <strong>${escapeHtml(c.proveedores?.razon_social || (c.proveedor_id ? 'Proveedor eliminado' : 'Sin proveedor'))}</strong></div>
            <div><span style="color:var(--color-gray)">Estado:</span> <strong>${escapeHtml(c.estado)}</strong></div>
            <div><span style="color:var(--color-gray)">Factura:</span> ${escapeHtml(c.numero_factura || '-')}</div>
            <div><span style="color:var(--color-gray)">Cargada por:</span> ${escapeHtml(c.usuarios?.nombre || '-')}</div>
            <div><span style="color:var(--color-gray)">Creada:</span> ${formatDate(c.created_at, true)}</div>
            <div><span style="color:var(--color-gray)">Recibida:</span> ${c.fecha_recibida ? formatDate(c.fecha_recibida, true) : '-'}</div>
        </div>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead><tr><th>Producto</th><th style="text-align:right">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
                <tbody>${filas || '<tr><td colspan="4" style="text-align:center;color:var(--color-gray)">Sin productos</td></tr>'}</tbody>
            </table>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-top:10px">
            <span>Total</span><span>${formatCurrency(c.total)}</span>
        </div>`;
    openModal('Detalle de compra', body, '<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>', 'modal-lg');
}

async function modalNuevaCompra(onSaved) {
    const [{ data: provs }, { data: prods }] = await Promise.all([
        window._supabase.from('proveedores').select('id, razon_social').eq('activo', true).order('razon_social'),
        window._supabase.from('productos').select('id, nombre').eq('activo', true).is('deleted_at', null).order('nombre'),
    ]);

    // El costo sugerido de cada producto se pide aparte (solo el dueno puede verlo)
    const costosCompra = await cargarCostos();
    (prods || []).forEach(p => { p.precio_costo = costosCompra[p.id] ?? 0; });

    const provOpts = (provs || []).map(p =>
        `<option value="${p.id}">${escapeHtml(p.razon_social)}</option>`
    ).join('');

    const body = `
        <div class="form-group">
            <label class="form-label">Proveedor</label>
            <select id="cmp-prov" class="form-select">
                <option value="">Sin proveedor</option>
                ${provOpts}
            </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
                <label class="form-label">Numero de factura</label>
                <input type="text" id="cmp-factura" class="form-input" placeholder="0001-00001234">
            </div>
            <div class="form-group">
                <label class="form-label">Fecha esperada</label>
                <input type="date" id="cmp-fecha" class="form-input" value="${hoyAR()}">
            </div>
        </div>

        <div style="border-top:1px solid var(--color-border);padding-top:14px;margin-top:4px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <label class="form-label" style="margin:0">Productos</label>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-add-compra-item">+ Agregar producto</button>
            </div>
            <div id="compra-items"></div>
        </div>

        <div style="border-top:1px solid var(--color-border);padding-top:12px;margin-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700">
                <span>Total estimado</span>
                <span id="compra-total">$0,00</span>
            </div>
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-compra">Crear orden</button>`;

    openModal('Nueva orden de compra', body, footer, 'modal-lg');

    const items = [];

    const prodOpts = (prods || []).map(p =>
        `<option value="${p.id}" data-costo="${p.precio_costo}">${escapeHtml(p.nombre)}</option>`
    ).join('');

    function updateTotal() {
        const total = items.reduce((sum, item) => {
            const qty   = parseInt(document.getElementById(`cmp-qty-${item.key}`)?.value) || 0;
            const price = parseFloat(document.getElementById(`cmp-price-${item.key}`)?.value) || 0;
            return sum + qty * price;
        }, 0);
        setText('#compra-total', formatCurrency(total));
    }

    function addItem() {
        const key = Date.now();
        items.push({ key });
        const container = document.getElementById('compra-items');
        const div = document.createElement('div');
        div.id = `item-${key}`;
        div.style.cssText = 'display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:end;margin-bottom:8px';
        div.innerHTML = `
            <div class="form-group" style="margin:0">
                <select class="form-select cmp-prod-select" id="cmp-prod-${key}">
                    <option value="">Seleccionar producto</option>
                    ${prodOpts}
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <input type="number" class="form-input" id="cmp-qty-${key}"
                    placeholder="Cant" min="1" value="1" style="width:70px">
            </div>
            <div class="form-group" style="margin:0">
                <input type="number" class="form-input" id="cmp-price-${key}"
                    placeholder="Precio" min="0" step="0.01" style="width:100px">
            </div>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-key="${key}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>`;
        container.appendChild(div);

        // Auto-llenar precio con el costo del producto
        div.querySelector(`#cmp-prod-${key}`).addEventListener('change', (e) => {
            const opt = e.target.selectedOptions[0];
            const costo = opt?.dataset?.costo;
            if (costo) document.getElementById(`cmp-price-${key}`).value = costo;
            updateTotal();
        });

        div.querySelector('[data-key]').addEventListener('click', () => {
            div.remove();
            const idx = items.findIndex(i => i.key === key);
            if (idx > -1) items.splice(idx, 1);
            updateTotal();
        });

        div.querySelector(`#cmp-qty-${key}`).addEventListener('input', updateTotal);
        div.querySelector(`#cmp-price-${key}`).addEventListener('input', updateTotal);
    }

    document.getElementById('btn-add-compra-item')?.addEventListener('click', addItem);
    addItem(); // Un item por defecto

    document.getElementById('confirm-compra').addEventListener('click', async () => {
        const provId   = document.getElementById('cmp-prov').value || null;
        const factura  = document.getElementById('cmp-factura').value.trim() || null;
        const fecha    = document.getElementById('cmp-fecha').value || null;

        const lineas = items.map(item => ({
            prod_id:  document.getElementById(`cmp-prod-${item.key}`)?.value,
            cantidad: parseInt(document.getElementById(`cmp-qty-${item.key}`)?.value) || 0,
            precio:   parseFloat(document.getElementById(`cmp-price-${item.key}`)?.value) || 0,
        })).filter(d => d.prod_id && d.cantidad > 0);

        if (!lineas.length) { toastWarning('Agrega al menos un producto'); return; }
        if (lineas.some(d => d.precio <= 0)) {
            toastWarning('Completa el precio de compra de cada producto'); return;
        }

        // Si el mismo producto se cargo en dos lineas, se juntan en una
        const porProd = {};
        lineas.forEach(d => {
            if (!porProd[d.prod_id]) porProd[d.prod_id] = { ...d, cantidad: 0 };
            porProd[d.prod_id].cantidad += d.cantidad;
            porProd[d.prod_id].precio = d.precio;
        });
        const detalles = Object.values(porProd);

        const btnCrear = document.getElementById('confirm-compra');
        btnCrear.disabled = true;

        const total = detalles.reduce((s, d) => s + d.cantidad * d.precio, 0);

        const { data: compra, error } = await window._supabase.from('compras').insert({
            proveedor_id:   provId,
            usuario_id:     AppUser.profile.id,
            numero_factura: factura,
            fecha_esperada: fecha,
            total,
        }).select('id').single();

        if (error) { btnCrear.disabled = false; toastError('No se pudo crear la orden: ' + error.message); return; }

        const { error: errDet } = await window._supabase.from('detalle_compras').insert(
            detalles.map(d => ({
                compra_id:       compra.id,
                producto_id:     d.prod_id,
                cantidad:        d.cantidad,
                precio_unitario: d.precio,
                subtotal:        d.cantidad * d.precio,
            }))
        );

        if (errDet) {
            // Sin productos la orden no sirve: se borra para no dejarla vacia
            await window._supabase.from('compras').delete().eq('id', compra.id);
            btnCrear.disabled = false;
            toastError('No se pudo guardar el detalle de la compra: ' + errDet.message);
            return;
        }

        closeModal();
        toastSuccess('Orden de compra creada. Marcala como "Recibida" cuando llegue la mercaderia.');
        if (onSaved) onSaved();
    });
}


// =============================================================
// CLIENTES
// =============================================================

// Convierte el texto buscado en palabras seguras para el filtro de Supabase
// (las comas, parentesis y comodines romperian la consulta).
function palabrasBusqueda(texto) {
    return String(texto || '')
        .replace(/[,()*%\\:."']/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4);
}

// El cliente generico que usa el punto de venta: no se edita ni se elimina
function esConsumidorFinal(c) {
    return (c?.nombre || '').trim().toLowerCase() === 'consumidor'
        && (c?.apellido || '').trim().toLowerCase() === 'final';
}

async function renderClientes(area) {
    let page   = 1;
    let search = '';
    const pgSize = ITEMS_PAGE;

    async function load() {
        const from = (page - 1) * pgSize;
        let query = window._supabase
            .from('clientes')
            .select('*', { count: 'exact' })
            .is('deleted_at', null)
            .order('nombre');

        // Cada palabra tiene que aparecer en el nombre, el apellido o el DNI ("juan perez" funciona)
        palabrasBusqueda(search).forEach(w => {
            query = query.or(`nombre.ilike.%${w}%,apellido.ilike.%${w}%,dni.ilike.%${w}%`);
        });

        const { data, count } = await query.range(from, from + pgSize - 1);
        const totalPages = Math.ceil((count || 0) / pgSize);

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Clientes</h1>
            <button class="btn btn-primary" id="btn-nuevo-cliente">+ Nuevo cliente</button>
        </div>
        <div class="filter-bar">
            <div class="search-bar" style="flex:1;max-width:360px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="cli-search" placeholder="Buscar por nombre o DNI..." value="${escapeHtml(search)}">
            </div>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">${count || 0} clientes</span>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr>
                        <th>Nombre</th><th>DNI</th><th>Telefono</th>
                        <th>Email</th><th>Estado</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray)">Sin clientes registrados</td></tr>`
                            : data.map(c => `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:10px">
                                        <div class="product-row-image" style="border-radius:50%;background:var(--color-info-light);color:var(--color-info)">
                                            ${getInitials(c.nombre, c.apellido || '')}
                                        </div>
                                        <strong>${escapeHtml(c.nombre)} ${escapeHtml(c.apellido || '')}</strong>
                                    </div>
                                </td>
                                <td>${escapeHtml(c.dni || '-')}</td>
                                <td>${escapeHtml(c.telefono || '-')}</td>
                                <td>${escapeHtml(c.email || '-')}</td>
                                <td><span class="badge ${c.activo ? 'badge-success' : 'badge-gray'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
                                <td class="td-actions">
                                    ${!AppUser.isDueno ? '' : esConsumidorFinal(c)
                                        ? '<span style="font-size:12px;color:var(--color-gray)">Cliente del sistema</span>'
                                        : `<button class="btn btn-ghost btn-sm" data-id="${c.id}" data-action="hist-cli">Historial</button>
                                           <button class="btn btn-ghost btn-sm" data-id="${c.id}" data-action="edit-cli">Editar</button>
                                           <button class="btn btn-ghost btn-sm btn-danger" data-id="${c.id}" data-action="delete-cli">Eliminar</button>`}
                                </td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
            <div class="table-section-footer">
                <span style="font-size:13px;color:var(--color-gray)">Pagina ${page} de ${totalPages || 1}</span>
                <div id="pagination-clientes"></div>
            </div>
        </div>`;

        renderPagination('pagination-clientes', page, totalPages, (p) => { page = p; load(); });

        const searchInput = document.getElementById('cli-search');
        searchInput?.addEventListener('input', debounce(() => {
            search = searchInput.value.trim(); page = 1; load();
        }, 350));

        document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => modalCliente(null, load));

        area.querySelectorAll('[data-action="edit-cli"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { data: cli } = await window._supabase
                    .from('clientes').select('*').eq('id', btn.dataset.id).single();
                if (cli) modalCliente(cli, load);
            });
        });

        area.querySelectorAll('[data-action="hist-cli"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cli = (data || []).find(c => c.id === btn.dataset.id);
                if (cli) modalHistorialCliente(cli);
            });
        });

        area.querySelectorAll('[data-action="delete-cli"]').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('Eliminar cliente', '¿Confirmas eliminar este cliente? Sus ventas anteriores se conservan.', async () => {
                    const { data: borrados, error } = await window._supabase.from('clientes')
                        .update({ deleted_at: new Date().toISOString(), activo: false })
                        .eq('id', btn.dataset.id)
                        .select('id');
                    if (error || !borrados?.length) { toastError('No se pudo eliminar el cliente'); return; }
                    toastSuccess('Cliente eliminado'); load();
                });
            });
        });
    }

    await load();
}

// Historial de compras de un cliente (solo el dueno: los empleados no ven ventas de otros dias)
async function modalHistorialCliente(cli) {
    const nombre = `${cli.nombre} ${cli.apellido || ''}`.trim();
    const titulo = `Historial de ${nombre}`;
    openModal(titulo,
        '<div style="padding:30px;text-align:center"><div class="spinner-md"></div></div>',
        '<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>', 'modal-lg');

    const { data: ventas, error } = await window._supabase
        .from('ventas')
        .select('id, numero_venta, created_at, total, descuento_monto, estado, metodos_pago(nombre), detalle_ventas(cantidad, precio_unitario, subtotal, productos(nombre))')
        .eq('cliente_id', cli.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);

    const bodyEl = document.getElementById('modal-body');
    // Si mientras cargaba se cerro o se abrio otra ventana, no se pisa
    if (!bodyEl || document.getElementById('modal-title')?.textContent !== titulo) return;
    if (error) {
        bodyEl.innerHTML = `<div class="empty-state" style="padding:24px"><p>No se pudo cargar el historial</p></div>`;
        return;
    }

    const lista       = ventas || [];
    const completadas = lista.filter(v => v.estado === 'completada');
    const totalGastado = completadas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    const promedio     = completadas.length ? totalGastado / completadas.length : 0;
    const ultima       = completadas[0]?.created_at;

    // Productos que mas compra
    const porProd = {};
    completadas.forEach(v => (v.detalle_ventas || []).forEach(d => {
        const n = d.productos?.nombre || 'Producto';
        porProd[n] = (porProd[n] || 0) + parseInt(d.cantidad || 0);
    }));
    const favoritos = Object.entries(porProd).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const tarjeta = (label, valor) => `
        <div style="flex:1;min-width:130px;background:var(--color-bg-2);border-radius:var(--radius-md);padding:10px 12px">
            <div style="font-size:11px;color:var(--color-gray);text-transform:uppercase;font-weight:700">${label}</div>
            <div style="font-family:var(--font-condensed);font-weight:700;font-size:1.2rem">${valor}</div>
        </div>`;

    bodyEl.innerHTML = !lista.length
        ? `<div class="empty-state" style="padding:30px"><p>Este cliente todavia no tiene compras</p>
           <span>Para que una venta quede en su historial, elegilo en el punto de venta antes de cobrar.</span></div>`
        : `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
            ${tarjeta('Compras', completadas.length)}
            ${tarjeta('Total gastado', formatCurrency(totalGastado))}
            ${tarjeta('Promedio por compra', formatCurrency(promedio))}
            ${tarjeta('Ultima compra', ultima ? formatDate(ultima, false) : '-')}
        </div>
        ${favoritos.length ? `
        <div style="font-size:13px;margin-bottom:12px">
            <strong>Lo que mas compra:</strong>
            ${favoritos.map(([n, q]) => `${escapeHtml(n)} (${q})`).join(' · ')}
        </div>` : ''}
        <div class="table-responsive" style="max-height:380px;overflow:auto">
            <table class="table table-sm">
                <thead><tr><th>#</th><th>Fecha</th><th>Productos</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                    ${lista.map(v => `
                    <tr style="${v.estado === 'cancelada' ? 'opacity:.55' : ''}">
                        <td><strong>#${v.numero_venta}</strong></td>
                        <td style="white-space:nowrap">${formatDate(v.created_at, true)}</td>
                        <td style="font-size:12px">${(v.detalle_ventas || [])
                            .map(d => `${parseInt(d.cantidad)} x ${escapeHtml(d.productos?.nombre || 'Producto')}`).join('<br>')}</td>
                        <td>${escapeHtml(v.metodos_pago?.nombre || '-')}</td>
                        <td><strong>${formatCurrency(v.total)}</strong>${parseFloat(v.descuento_monto) > 0
                            ? `<div style="font-size:11px;color:var(--color-gray)">desc. ${formatCurrency(v.descuento_monto)}</div>` : ''}</td>
                        <td><span class="badge ${v.estado === 'completada' ? 'badge-success' : 'badge-danger'}">${v.estado}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        ${lista.length === 200 ? '<p style="font-size:12px;color:var(--color-gray);margin-top:8px">Se muestran las ultimas 200 compras.</p>' : ''}`;
}

function modalCliente(cli, onSaved) {
    const isEdit = !!cli;
    const body = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
                <label class="form-label">Nombre <span style="color:red">*</span></label>
                <input type="text" id="cl-nombre" class="form-input"
                    value="${escapeHtml(cli?.nombre || '')}" placeholder="Juan">
                <span class="field-error" id="cl-nombre-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" id="cl-apellido" class="form-input"
                    value="${escapeHtml(cli?.apellido || '')}" placeholder="Perez">
            </div>
            <div class="form-group">
                <label class="form-label">DNI</label>
                <input type="text" id="cl-dni" class="form-input"
                    value="${escapeHtml(cli?.dni || '')}" placeholder="12345678">
            </div>
            <div class="form-group">
                <label class="form-label">Telefono</label>
                <input type="text" id="cl-tel" class="form-input"
                    value="${escapeHtml(cli?.telefono || '')}" placeholder="011 1234-5678">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Email</label>
                <input type="email" id="cl-email" class="form-input"
                    value="${escapeHtml(cli?.email || '')}" placeholder="cliente@email.com">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Domicilio</label>
                <input type="text" id="cl-dom" class="form-input"
                    value="${escapeHtml(cli?.domicilio || '')}" placeholder="Calle 123">
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Notas</label>
                <textarea id="cl-notas" class="form-textarea" placeholder="Opcional...">${escapeHtml(cli?.notas || '')}</textarea>
            </div>
        </div>`;

    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="confirm-cliente">${isEdit ? 'Guardar' : 'Crear cliente'}</button>`;

    openModal(isEdit ? 'Editar cliente' : 'Nuevo cliente', body, footer);

    document.getElementById('confirm-cliente').addEventListener('click', async () => {
        const nombre = document.getElementById('cl-nombre').value.trim();
        if (!nombre) { showFieldError('cl-nombre', 'El nombre es obligatorio'); return; }

        // DNI solo con numeros: "12.345.678" y "12345678" son el mismo
        const dni   = document.getElementById('cl-dni').value.replace(/[^0-9A-Za-z]/g, '') || null;
        const email = document.getElementById('cl-email').value.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toastError('El email no es valido'); return;
        }

        const btnOk = document.getElementById('confirm-cliente');
        btnOk.disabled = true;

        const payload = {
            nombre,
            apellido:  document.getElementById('cl-apellido').value.trim() || null,
            dni,
            telefono:  document.getElementById('cl-tel').value.trim() || null,
            email:     email || null,
            domicilio: document.getElementById('cl-dom').value.trim() || null,
            notas:     document.getElementById('cl-notas').value.trim() || null,
        };

        let error, filas;
        if (isEdit) {
            ({ data: filas, error } = await window._supabase.from('clientes').update(payload).eq('id', cli.id).select('id'));
        } else {
            ({ data: filas, error } = await window._supabase.from('clientes').insert(payload).select('id'));
        }
        btnOk.disabled = false;

        if (error) {
            if (error.code === '23505') toastError('Ya hay un cliente con ese DNI');
            else toastError('No se pudo guardar: ' + error.message);
            return;
        }
        if (!filas?.length) { toastError('No tenes permiso para modificar este cliente'); return; }

        closeModal();
        toastSuccess(isEdit ? 'Cliente actualizado' : 'Cliente creado');
        if (onSaved) onSaved();
    });
}
