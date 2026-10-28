/* =============================================================
   KIOSCO SYSTEM - APP.JS
   Controlador del dashboard: navegacion, secciones y widgets
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 1. INICIALIZAR AUTH
    // =========================================================
    const ok = await initAuth();
    if (!ok) return;

    updateUserUI();
    applyRoleVisibility();
    setupSidebar();
    setupLogout();
    await loadCajaStatus();
    await checkStockAlerts();

    // Navegacion inicial
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);

    // Escuchar cambios de hash para navegacion por historial
    window.addEventListener('hashchange', () => {
        const section = location.hash.replace('#', '') || 'dashboard';
        navigateTo(section, false);
    });


    // =========================================================
    // 2. SIDEBAR
    // =========================================================
    function setupSidebar() {
        const sidebar      = document.getElementById('sidebar');
        const toggleBtn    = document.getElementById('sidebar-toggle');
        const overlay      = document.getElementById('sidebar-overlay');
        const menuBtn      = document.getElementById('topbar-menu-btn');

        // Colapsar / expandir en desktop
        toggleBtn?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });

        // Restaurar estado guardado
        if (localStorage.getItem('sidebar_collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        // Abrir en mobile
        menuBtn?.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        // Cerrar con overlay
        overlay?.addEventListener('click', closeMobileSidebar);

        function closeMobileSidebar() {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        }

        // Clicks en items de nav
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (!section) return;
                closeMobileSidebar();
                navigateTo(section);
            });
        });
    }


    // =========================================================
    // 3. NAVEGACION ENTRE SECCIONES
    // =========================================================
    function navigateTo(section, pushHash = true) {
        // Verificar permiso de seccion
        const restricted = {
            reportes:       'ver_reportes',
            estadisticas:   'ver_estadisticas',
            gastos:         'gestionar_gastos',
            usuarios:       'administrar_usuarios',
            auditoria:      'ver_auditoria',
            configuracion:  'configurar_sistema',
            proveedores:    'gestionar_proveedores',
            compras:        'gestionar_compras',
            stock:          'ver_estadisticas',
        };

        if (restricted[section] && !hasPermission(restricted[section])) {
            toastError('No tienes permiso para acceder a esta seccion');
            return;
        }

        // Refrescar el badge de stock bajo al cambiar de seccion (sin bloquear)
        checkStockAlerts();

        // Actualizar nav activo
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const active = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (active) active.classList.add('active');

        // Actualizar breadcrumb
        const labels = {
            dashboard:      'Dashboard',
            productos:      'Productos',
            categorias:     'Categorias',
            stock:          'Historial de Stock',
            proveedores:    'Proveedores',
            compras:        'Compras',
            clientes:       'Clientes',
            caja:           'Caja',
            reportes:       'Reportes',
            gastos:         'Gastos',
            usuarios:       'Usuarios',
            auditoria:      'Auditoria',
            configuracion:  'Configuracion',
        };
        setText('#breadcrumb', labels[section] || section);

        if (pushHash) history.pushState(null, '', `#${section}`);

        // Renderizar seccion
        renderSection(section);
    }


    // =========================================================
    // 4. RENDERIZAR SECCIONES
    // =========================================================
    async function renderSection(section) {
        const area = document.getElementById('content-area');
        if (!area) return;

        show('#page-loader');
        area.querySelectorAll(':scope > *:not(#page-loader)').forEach(el => el.remove());

        try {
            switch(section) {
                case 'dashboard':    await renderDashboard(area);    break;
                case 'productos':    await renderProductos(area);     break;
                case 'categorias':   await renderCategorias(area);    break;
                case 'stock':        await renderStock(area);         break;
                case 'proveedores':  await renderProveedores(area);   break;
                case 'compras':      await renderCompras(area);       break;
                case 'clientes':     await renderClientes(area);      break;
                case 'caja':         await renderCaja(area);          break;
                case 'reportes':     renderReportes(area);            break;
                case 'gastos':       await renderGastos(area);        break;
                case 'usuarios':     await renderUsuarios(area);      break;
                case 'auditoria':    await renderAuditoria(area);     break;
                case 'configuracion':await renderConfiguracion(area); break;
                default:             await renderDashboard(area);
            }
        } catch(err) {
            console.error(`Error en seccion ${section}:`, err);
            area.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>Error al cargar la seccion</p>
                    <span>${err.message}</span>
                </div>`;
        } finally {
            hide('#page-loader');
        }
    }


    // =========================================================
    // 5. DASHBOARD PRINCIPAL
    // =========================================================
    async function renderDashboard(area) {
        const [statsHoy, productosBajos, ventasRecientes, config] = await Promise.all([
            getStatsHoy(),
            getProductosBajoStock(),
            getVentasRecientes(8),
            getConfig(),
        ]);

        const sym = config?.simbolo_moneda || '$';

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
            <span style="font-size:13px;color:var(--color-gray)">${formatDate(new Date(), false)}</span>
        </div>

        <!-- Stats hoy -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-icon yellow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Ventas hoy</div>
                    <div class="stat-card-value">${formatCurrency(statsHoy.total_ventas || 0, sym)}</div>
                    <span class="stat-card-change up">${statsHoy.cantidad_ventas || 0} transacciones</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Ticket promedio</div>
                    <div class="stat-card-value">${formatCurrency(statsHoy.ticket_promedio || 0, sym)}</div>
                    <span class="stat-card-change">Venta maxima ${formatCurrency(statsHoy.venta_maxima || 0, sym)}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon red">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Stock bajo</div>
                    <div class="stat-card-value">${productosBajos.length}</div>
                    <span class="stat-card-change ${productosBajos.length > 0 ? 'down' : 'up'}">${productosBajos.length > 0 ? 'Requiere atencion' : 'Todo en orden'}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon dark">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Descuentos hoy</div>
                    <div class="stat-card-value">${formatCurrency(statsHoy.total_descuentos || 0, sym)}</div>
                    <span class="stat-card-change">Aplicados en ventas</span>
                </div>
            </div>
        </div>

        <div class="content-grid wide">
            <!-- Ventas recientes -->
            <div class="table-section">
                <div class="table-section-header">
                    <span class="table-section-title">Ultimas ventas</span>
                    ${AppUser.isDueno ? `<button class="btn btn-ghost btn-sm" onclick="navigateTo('reportes')">Ver reportes</button>` : ''}
                </div>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead><tr>
                            <th>#</th>
                            <th>Hora</th>
                            <th>Metodo</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr></thead>
                        <tbody id="tbody-ventas-recientes">
                            ${ventasRecientes.length === 0
                                ? `<tr><td colspan="5" style="text-align:center;color:var(--color-gray);padding:24px">Sin ventas hoy</td></tr>`
                                : ventasRecientes.map(v => `
                                <tr>
                                    <td><strong>#${v.numero_venta}</strong></td>
                                    <td>${formatDate(v.created_at, true).split(' ')[1] || '-'}</td>
                                    <td><span class="venta-metodo">${escapeHtml(v.metodos_pago?.nombre || '-')}</span></td>
                                    <td><strong>${formatCurrency(v.total, sym)}</strong></td>
                                    <td><span class="badge ${v.estado === 'completada' ? 'badge-success' : 'badge-danger'}">${v.estado}</span></td>
                                </tr>`).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Stock bajo -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Stock bajo</span>
                    <button class="btn btn-ghost btn-sm" onclick="navigateTo('productos')">Ver todos</button>
                </div>
                ${productosBajos.length === 0
                    ? `<div class="empty-state" style="padding:30px">
                           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                           <p style="font-size:14px">Todo el stock esta OK</p>
                       </div>`
                    : productosBajos.slice(0, 5).map(p => `
                        <div class="stock-alert-item">
                            <div class="product-row-image">${escapeHtml(p.nombre[0].toUpperCase())}</div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.nombre)}</div>
                                <div style="font-size:11px;color:var(--color-gray)">${escapeHtml(p.categoria || 'Sin categoria')}</div>
                            </div>
                            <div class="stock-alert-current ${p.stock_actual <= 2 ? 'critical' : 'warning'}">${p.stock_actual}</div>
                        </div>`).join('')
                }
            </div>
        </div>`;

        // Hacer navigateTo disponible globalmente para los onclick inline
        window.navigateTo = navigateTo;
    }


    // =========================================================
    // 6. LOGOUT
    // =========================================================
    function setupLogout() {
        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            confirmAction(
                'Cerrar sesion',
                'Esta seguro que deseas cerrar tu sesion?',
                () => logout(),
                'Cerrar sesion',
                'btn-danger'
            );
        });
    }


    // =========================================================
    // 7. ESTADO DE CAJA EN TOPBAR
    // =========================================================
    async function loadCajaStatus() {
        try {
            const { data } = await window._supabase
                .from('cajas')
                .select('estado, nombre')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const open   = data?.estado === 'abierta';
            const dot    = document.getElementById('caja-dot');
            const text   = document.getElementById('caja-status-text');

            if (dot)  dot.className  = `caja-dot ${open ? 'open' : 'closed'}`;
            if (text) text.textContent = open ? 'Caja abierta' : 'Caja cerrada';

        } catch(e) { /* silencioso */ }
    }


    // =========================================================
    // 8. ALERTAS DE STOCK
    // =========================================================
    async function checkStockAlerts() {
        try {
            // PostgREST no compara dos columnas entre si: se traen stock y minimo y se filtra aca
            const { data, error } = await window._supabase
                .from('productos')
                .select('id, stock_actual, stock_minimo')
                .eq('activo', true)
                .is('deleted_at', null)
                .limit(10000);
            if (error) throw error;

            const total = (data || []).filter(p =>
                Number(p.stock_actual) <= Number(p.stock_minimo || 0)).length;
            const btn   = document.getElementById('btn-stock-alert');
            const badge = document.getElementById('stock-alert-count');

            if (total > 0) {
                show(btn);
                if (badge) badge.textContent = total > 99 ? '99+' : total;
                if (btn) btn.title = `${total} producto${total !== 1 ? 's' : ''} con stock bajo`;
                if (btn && !btn.dataset.wired) {
                    btn.dataset.wired = '1';
                    btn.addEventListener('click', () => navigateTo('productos'));
                }
            } else {
                hide(btn);
            }
        } catch(e) { console.warn('[Stock] No se pudo verificar el stock bajo:', e?.message); }
    }


    // =========================================================
    // 9. QUERIES DE DATOS
    // =========================================================

    async function getStatsHoy() {
        try {
            const today = hoyAR();
            const { data } = await window._supabase
                .from('ventas')
                .select('total, descuento_monto')
                .eq('estado', 'completada')
                .gte('created_at', today + 'T00:00:00' + TZ_AR)
                .lte('created_at', today + 'T23:59:59' + TZ_AR)
                .is('deleted_at', null);

            if (!data || !data.length) return {};

            const totales = data.reduce((acc, v) => {
                acc.total_ventas    += parseFloat(v.total) || 0;
                acc.total_descuentos += parseFloat(v.descuento_monto) || 0;
                acc.cantidad_ventas++;
                acc.venta_maxima = Math.max(acc.venta_maxima, parseFloat(v.total) || 0);
                return acc;
            }, { total_ventas: 0, total_descuentos: 0, cantidad_ventas: 0, venta_maxima: 0 });

            totales.ticket_promedio = totales.cantidad_ventas
                ? totales.total_ventas / totales.cantidad_ventas : 0;

            return totales;
        } catch(e) { return {}; }
    }

    // Productos con stock en o por debajo de su minimo (el mismo criterio que el badge)
    async function getProductosBajoStock() {
        try {
            const { data } = await window._supabase
                .from('productos')
                .select('id, nombre, stock_actual, stock_minimo, categorias(nombre)')
                .eq('activo', true)
                .is('deleted_at', null)
                .limit(10000);

            return (data || [])
                .filter(p => Number(p.stock_actual) <= Number(p.stock_minimo || 0))
                .sort((a, b) => a.stock_actual - b.stock_actual)
                .map(p => ({ ...p, categoria: p.categorias?.nombre || null }));
        } catch(e) { return []; }
    }

    async function getVentasRecientes(limit = 8) {
        try {
            const today = hoyAR();
            const { data } = await window._supabase
                .from('ventas')
                .select('numero_venta, total, estado, created_at, metodos_pago(nombre)')
                .gte('created_at', today + 'T00:00:00' + TZ_AR)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

            return data || [];
        } catch(e) { return []; }
    }

    async function getConfig() {
        try {
            const cached = Cache.get('config');
            if (cached) return cached;
            const { data } = await window._supabase
                .from('configuracion_negocio')
                .select('*')
                .limit(1)
                .single();
            if (data) Cache.set('config', data, 30);
            return data;
        } catch(e) { return null; }
    }


    // =========================================================
    // 10. SECCIONES — delegadas a products.js y reports.js
    //     Las siguientes se llaman desde renderSection()
    // =========================================================

    // Caja
    async function renderCaja(area) {
        const { data: cajas } = await window._supabase
            .from('cajas')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: movimientos } = await window._supabase
            .from('movimientos_caja')
            .select('*, usuarios(nombre, apellido)')
            .order('created_at', { ascending: false })
            .limit(30);

        const caja = cajas?.[0];
        const open = caja?.estado === 'abierta';

        // Separar saldo inicial (fondo de caja) de lo recaudado por ventas
        const saldoInicial = parseFloat(caja?.saldo_inicial || 0);
        const saldoActual  = parseFloat(caja?.saldo_actual  || 0);
        const recaudado    = saldoActual - saldoInicial;   // efectivo cobrado en el turno

        // Ventas del turno de TODOS los medios de pago (la caja solo cuenta efectivo)
        let vendidoTotal = 0, vendidoCant = 0;
        const vendidoPorMetodo = {};
        if (caja?.id && caja.fecha_apertura) {
            const { data: ventasTurno } = await window._supabase
                .from('ventas')
                .select('total, metodos_pago(nombre)')
                .eq('caja_id', caja.id)
                .eq('estado', 'completada')
                .is('deleted_at', null)
                .gte('created_at', caja.fecha_apertura);
            (ventasTurno || []).forEach(v => {
                const t = parseFloat(v.total || 0);
                const n = v.metodos_pago?.nombre || 'Sin metodo';
                vendidoTotal += t;
                vendidoCant++;
                vendidoPorMetodo[n] = (vendidoPorMetodo[n] || 0) + t;
            });
        }
        const vendidoDetalle = vendidoCant
            ? Object.entries(vendidoPorMetodo).map(([n, t]) => `${escapeHtml(n)} ${formatCurrency(t)}`).join(' · ')
            : 'Sin ventas en el turno';

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Caja</h1>
            <div style="display:flex;gap:10px">
                ${open
                    ? `<button class="btn btn-danger" id="btn-cerrar-caja">Cerrar caja</button>`
                    : `<button class="btn btn-success" id="btn-abrir-caja">Abrir caja</button>`
                }
            </div>
        </div>

        <div class="stats-grid caja-stats-grid">
            <div class="stat-card">
                <div class="stat-card-icon ${open ? 'green' : 'red'}">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Estado</div>
                    <div class="stat-card-value" style="font-size:1.3rem">${open ? 'Abierta' : 'Cerrada'}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Saldo inicial</div>
                    <div class="stat-card-value">${formatCurrency(saldoInicial)}</div>
                    <span class="stat-card-change">Fondo de apertura</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon yellow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Vendido en el turno</div>
                    <div class="stat-card-value" style="color:var(--color-success)">
                        ${formatCurrency(vendidoTotal)}
                    </div>
                    <span class="stat-card-change">${vendidoCant} venta${vendidoCant !== 1 ? 's' : ''} · ${vendidoDetalle}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon dark">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div class="stat-card-body">
                    <div class="stat-card-label">Efectivo en caja</div>
                    <div class="stat-card-value">${formatCurrency(saldoActual)}</div>
                    <span class="stat-card-change">Fondo + cobros en efectivo (${formatCurrency(recaudado)}). Transferencias no entran al cajón</span>
                </div>
            </div>
        </div>

        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">Movimientos recientes</span>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead><tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Descripcion</th>
                        <th>Monto</th>
                        <th>Saldo</th>
                        <th>Usuario</th>
                    </tr></thead>
                    <tbody>
                        ${!movimientos?.length
                            ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-gray)">Sin movimientos</td></tr>`
                            : movimientos.map(m => `
                            <tr>
                                <td>${formatDate(m.created_at, true)}</td>
                                <td><span class="badge ${m.tipo === 'venta' ? 'badge-success' : m.tipo === 'apertura' ? 'badge-info' : 'badge-gray'}">${m.tipo}</span></td>
                                <td>${escapeHtml(m.descripcion || '-')}</td>
                                <td style="font-weight:700;color:${m.monto > 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${m.monto > 0 ? '+' : ''}${formatCurrency(m.monto)}</td>
                                <td>${formatCurrency(m.saldo_posterior)}</td>
                                <td>${escapeHtml(m.usuarios ? `${m.usuarios.nombre} ${m.usuarios.apellido}` : '-')}</td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>`;

        document.getElementById('btn-abrir-caja')?.addEventListener('click', () => modalAbrirCaja(caja, area));
        document.getElementById('btn-cerrar-caja')?.addEventListener('click', () => modalCerrarCaja(caja, area));
    }

    async function modalAbrirCaja(caja, area) {
        const body = `
            <div class="form-group">
                <label class="form-label">Saldo inicial en efectivo</label>
                <input type="number" id="saldo-apertura" class="form-input" placeholder="0.00" min="0" step="0.01" value="0">
                <span class="form-hint">Este monto es el fondo de caja. No se cuenta como recaudacion del turno.</span>
            </div>
            <div class="form-group">
                <label class="form-label">Notas de apertura</label>
                <textarea id="notas-apertura" class="form-textarea" placeholder="Opcional..."></textarea>
            </div>`;

        const footer = `
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-success" id="confirm-abrir-caja">Abrir caja</button>`;

        openModal('Abrir caja', body, footer, 'modal-sm');

        document.getElementById('confirm-abrir-caja').addEventListener('click', async () => {
            const saldo = parseFloat(document.getElementById('saldo-apertura').value) || 0;
            const notas = document.getElementById('notas-apertura').value.trim();

            const { error } = await window._supabase
                .from('cajas')
                .update({
                    estado:         'abierta',
                    saldo_inicial:  saldo,
                    saldo_actual:   saldo,
                    usuario_id:     AppUser.profile.id,
                    fecha_apertura: new Date().toISOString(),
                    notas_apertura: notas || null,
                    fecha_cierre:   null,
                    saldo_contado:  null,
                    diferencia:     null,
                })
                .eq('id', caja.id);

            if (error) { toastError('No se pudo abrir la caja'); return; }

            // Movimiento de apertura
            await window._supabase.from('movimientos_caja').insert({
                caja_id:          caja.id,
                usuario_id:       AppUser.profile.id,
                tipo:             'apertura',
                monto:            saldo,
                saldo_previo:     0,
                saldo_posterior:  saldo,
                descripcion:      'Apertura de caja',
            });

            await registrarAuditoria('apertura_caja', 'cajas', caja.id, 'Apertura de caja');
            closeModal();
            toastSuccess('Caja abierta correctamente');
            await renderCaja(area);
            await loadCajaStatus();
        });
    }

    async function modalCerrarCaja(caja, area) {
        // Refrescar datos de la caja directo desde Supabase para asegurar
        // que saldo_inicial y saldo_actual esten actualizados
        const { data: cajaFresh } = await window._supabase
            .from('cajas')
            .select('id, saldo_inicial, saldo_actual, fecha_apertura, estado')
            .eq('id', caja.id)
            .single();

        const cajaData     = cajaFresh || caja;
        const saldoInicial = parseFloat(cajaData.saldo_inicial ?? 0);
        const saldoActual  = parseFloat(cajaData.saldo_actual  ?? 0);
        const recaudado    = saldoActual - saldoInicial;

        // Consultar ventas del turno (desde apertura hasta ahora)
        const desde = caja.fecha_apertura || new Date().toISOString();
        const { data: ventas } = await window._supabase
            .from('ventas')
            .select('total, metodos_pago(nombre)')
            .eq('estado', 'completada')
            .is('deleted_at', null)
            .gte('created_at', desde)
            .order('created_at', { ascending: false });

        const totalVentas = ventas?.length || 0;

        // Agrupar por metodo de pago
        const porMetodo = {};
        (ventas || []).forEach(v => {
            const m = v.metodos_pago?.nombre || 'Sin metodo';
            if (!porMetodo[m]) porMetodo[m] = { count: 0, total: 0 };
            porMetodo[m].count++;
            porMetodo[m].total += parseFloat(v.total || 0);
        });

        const metodoRows = Object.entries(porMetodo)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([nombre, d]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;border-bottom:1px solid var(--color-bg-2)">
                    <span style="color:var(--color-dark-3)">${escapeHtml(nombre)} <span style="color:var(--color-gray)">(${d.count} venta${d.count !== 1 ? 's' : ''})</span></span>
                    <span style="font-weight:600">${formatCurrency(d.total)}</span>
                </div>`).join('');

        const body = `
            <!-- Resumen del turno -->
            <div style="background:var(--color-dark);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:14px">
                <div style="font-family:var(--font-condensed);font-weight:700;font-size:11px;
                            text-transform:uppercase;letter-spacing:0.5px;color:var(--color-primary);margin-bottom:10px">
                    Resumen del turno
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
                    <span style="color:var(--color-gray-light)">Cantidad de ventas</span>
                    <span style="font-family:var(--font-condensed);font-weight:700;font-size:1.1rem;color:#fff">${totalVentas}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
                    <span style="color:var(--color-gray-light)">Total vendido (todos los medios)</span>
                    <span style="font-weight:600;color:#fff">${formatCurrency(Object.values(porMetodo).reduce((s, d) => s + d.total, 0))}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
                    <span style="color:var(--color-gray-light)">Fondo inicial</span>
                    <span style="font-weight:600;color:#fff">${formatCurrency(saldoInicial)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0 4px;
                            border-top:1px solid rgba(255,255,255,0.1);margin-top:6px;font-size:15px">
                    <span style="font-weight:700;color:#fff">Recaudado en efectivo</span>
                    <strong style="color:var(--color-primary);font-family:var(--font-condensed);font-size:1.3rem">${formatCurrency(recaudado)}</strong>
                </div>
            </div>

            <!-- Desglose por metodo de pago -->
            ${totalVentas > 0 ? `
            <div style="margin-bottom:14px">
                <div style="font-size:12px;font-weight:700;color:var(--color-gray);
                            text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">
                    Por metodo de pago
                </div>
                ${metodoRows}
            </div>` : `
            <div style="text-align:center;padding:10px 0 14px;font-size:13px;color:var(--color-gray)">
                Sin ventas registradas en este turno
            </div>`}

            <div class="form-group">
                <label class="form-label">Efectivo contado en caja <span style="font-weight:400;color:var(--color-gray)">(opcional)</span></label>
                <input type="number" id="contado-cierre" class="form-input" placeholder="0.00" min="0" step="0.01">
                <span class="form-hint" id="esperado-hint">Efectivo esperado (fondo inicial + ventas en efectivo): ${formatCurrency(saldoActual)}</span>
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Notas de cierre</label>
                <textarea id="notas-cierre" class="form-textarea" placeholder="Opcional..."></textarea>
            </div>`;

        const footer = `
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" id="confirm-cerrar-caja">Cerrar caja</button>`;

        openModal('Cerrar caja', body, footer, 'modal-sm');

        document.getElementById('contado-cierre')?.addEventListener('input', () => {
            const v    = document.getElementById('contado-cierre').value;
            const hint = document.getElementById('esperado-hint');
            if (!hint) return;
            if (v === '') {
                hint.textContent = `Efectivo esperado (fondo inicial + ventas en efectivo): ${formatCurrency(saldoActual)}`;
            } else {
                const dif = Math.round((parseFloat(v) - saldoActual) * 100) / 100;
                hint.textContent = `Esperado: ${formatCurrency(saldoActual)} · Diferencia: ${dif > 0 ? '+' : ''}${formatCurrency(dif)}`;
            }
        });

        document.getElementById('confirm-cerrar-caja').addEventListener('click', async () => {
            const btn = document.getElementById('confirm-cerrar-caja');

            // Evitar doble click
            if (btn.disabled) return;
            btn.disabled = true;
            btn.textContent = 'Cerrando...';

            // Obtener valores frescos de la DB (evita usar datos desactualizados)
            const { data: cajaFreshCheck } = await window._supabase
                .from('cajas')
                .select('id, estado, saldo_actual, saldo_inicial')
                .eq('id', cajaData.id)
                .single();

            if (!cajaFreshCheck || cajaFreshCheck.estado !== 'abierta') {
                closeModal();
                toastWarning('La caja ya fue cerrada');
                await renderCaja(area);
                await loadCajaStatus();
                return;
            }

            const saldoActualFinal  = parseFloat(cajaFreshCheck.saldo_actual  ?? 0);
            const saldoInicialFinal = parseFloat(cajaFreshCheck.saldo_inicial ?? 0);
            const recaudadoFinal    = saldoActualFinal - saldoInicialFinal;

            const notas = document.getElementById('notas-cierre').value.trim();

            // Arqueo: efectivo contado vs. efectivo esperado
            const contadoRaw = document.getElementById('contado-cierre')?.value;
            const contado    = (contadoRaw !== '' && contadoRaw != null && !isNaN(parseFloat(contadoRaw)))
                ? parseFloat(contadoRaw) : null;
            const diferencia = contado === null ? null : Math.round((contado - saldoActualFinal) * 100) / 100;

            const { error } = await window._supabase
                .from('cajas')
                .update({
                    estado:        'cerrada',
                    fecha_cierre:  new Date().toISOString(),
                    notas_cierre:  notas || null,
                    saldo_contado: contado,
                    diferencia:    diferencia,
                })
                .eq('id', cajaData.id);

            if (error) {
                toastError('No se pudo cerrar la caja');
                btn.disabled = false;
                btn.textContent = 'Cerrar caja';
                return;
            }

            // La base acepta monto 0 en apertura y cierre, asi que siempre se registra
            const { error: movErr } = await window._supabase
                .from('movimientos_caja').insert({
                    caja_id:         cajaData.id,
                    usuario_id:      AppUser.profile.id,
                    tipo:            'cierre',
                    monto:           -recaudadoFinal,
                    saldo_previo:    saldoActualFinal,
                    saldo_posterior: 0,
                    descripcion:     `Cierre de caja - Recaudado en efectivo: ${formatCurrency(recaudadoFinal)}`,
                });
            if (movErr) console.warn('[Cierre] movimiento:', movErr.message);

            await registrarAuditoria('cierre_caja', 'cajas', caja.id,
                'Cierre de caja' + (diferencia === null ? '' : ` (diferencia ${formatCurrency(diferencia)})`));
            closeModal();
            if (diferencia !== null && diferencia !== 0) {
                toastWarning(`Caja cerrada con una diferencia de ${formatCurrency(diferencia)}`);
            } else {
                toastSuccess('Caja cerrada correctamente');
            }
            await renderCaja(area);
            await loadCajaStatus();
        });
    }


    // Gastos
    async function renderGastos(area) {
        let page = 1;
        const pageSize = 15;

        async function load() {
            const from = (page - 1) * pageSize;
            const { data, count } = await window._supabase
                .from('gastos')
                .select('*, usuarios(nombre)', { count: 'exact' })
                .is('deleted_at', null)
                .order('fecha', { ascending: false })
                .range(from, from + pageSize - 1);

            const totalPages = Math.ceil((count || 0) / pageSize);

            // Total del mes en curso
            const inicioMes = hoyAR().slice(0, 8) + '01';
            const { data: delMes } = await window._supabase
                .from('gastos').select('monto').is('deleted_at', null).gte('fecha', inicioMes);
            const totalMes = (delMes || []).reduce((s, g) => s + parseFloat(g.monto || 0), 0);

            area.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Gastos <span style="font-size:14px;font-weight:600;color:var(--color-gray)">· Este mes: ${formatCurrency(totalMes)}</span></h1>
                <button class="btn btn-primary" id="btn-nuevo-gasto">+ Nuevo gasto</button>
            </div>
            <div class="table-section">
                <div class="table-section-header">
                    <span class="table-section-title">Registro de gastos</span>
                    <button class="btn btn-ghost btn-sm" id="btn-export-gastos">Exportar CSV</button>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead><tr>
                            <th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Monto</th><th>Registrado por</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            ${!data?.length
                                ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray)">Sin gastos registrados</td></tr>`
                                : data.map(g => `
                                <tr>
                                    <td>${formatDate(g.fecha)}</td>
                                    <td>${escapeHtml(g.concepto)}</td>
                                    <td><span class="badge badge-gray">${g.tipo}</span></td>
                                    <td><strong>${formatCurrency(g.monto)}</strong></td>
                                    <td>${escapeHtml(g.usuarios?.nombre || '-')}</td>
                                    <td class="td-actions">
                                        <button class="btn btn-ghost btn-sm btn-danger" data-id="${g.id}" data-action="delete-gasto">Eliminar</button>
                                    </td>
                                </tr>`).join('')
                            }
                        </tbody>
                    </table>
                </div>
                <div class="table-section-footer">
                    <span style="font-size:13px;color:var(--color-gray)">${count || 0} registros</span>
                    <div id="pagination-gastos"></div>
                </div>
            </div>`;

            renderPagination('pagination-gastos', page, totalPages, (p) => { page = p; load(); });

            document.getElementById('btn-nuevo-gasto')?.addEventListener('click', () => modalGasto());

            // Exporta TODOS los gastos, no solo la pagina que se ve
            document.getElementById('btn-export-gastos')?.addEventListener('click', async () => {
                const { data: todos, error } = await window._supabase
                    .from('gastos').select('fecha, concepto, tipo, monto, descripcion')
                    .is('deleted_at', null).order('fecha', { ascending: false }).limit(10000);
                if (error) { toastError('No se pudo exportar'); return; }
                exportCSV(todos || [], 'gastos', {
                    fecha: 'Fecha', concepto: 'Concepto', tipo: 'Tipo', monto: 'Monto', descripcion: 'Descripcion'
                });
            });

            area.querySelectorAll('[data-action="delete-gasto"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    confirmAction('Eliminar gasto', 'Esta accion no se puede deshacer.', async () => {
                        const { data: ok, error } = await window._supabase.from('gastos')
                            .update({ deleted_at: new Date().toISOString() }).eq('id', id).select('id');
                        if (error || !ok?.length) { toastError('No se pudo eliminar el gasto'); return; }
                        toastSuccess('Gasto eliminado');
                        load();
                    });
                });
            });
        }

        await load();
    }

    function modalGasto() {
        const body = `
            <div class="form-group">
                <label class="form-label">Concepto <span style="color:red">*</span></label>
                <input type="text" id="gasto-concepto" class="form-input" placeholder="Ej: Alquiler, luz, limpieza...">
                <span class="field-error" id="gasto-concepto-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Monto <span style="color:red">*</span></label>
                <input type="number" id="gasto-monto" class="form-input" placeholder="0.00" min="0.01" step="0.01">
                <span class="field-error" id="gasto-monto-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <select id="gasto-tipo" class="form-select">
                    <option value="variable">Variable</option>
                    <option value="fijo">Fijo</option>
                    <option value="extraordinario">Extraordinario</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha</label>
                <input type="date" id="gasto-fecha" class="form-input" value="${hoyAR()}">
            </div>
            <div class="form-group">
                <label class="form-label">Descripcion</label>
                <textarea id="gasto-desc" class="form-textarea" placeholder="Opcional..."></textarea>
            </div>`;

        const footer = `
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="confirm-gasto">Guardar gasto</button>`;

        openModal('Nuevo gasto', body, footer, 'modal-sm');

        document.getElementById('confirm-gasto').addEventListener('click', async () => {
            const concepto = document.getElementById('gasto-concepto').value.trim();
            const monto    = parseFloat(document.getElementById('gasto-monto').value);
            const tipo     = document.getElementById('gasto-tipo').value;
            const fecha    = document.getElementById('gasto-fecha').value;
            const desc     = document.getElementById('gasto-desc').value.trim();

            if (!concepto) { showFieldError('gasto-concepto', 'Campo obligatorio'); return; }
            if (!monto || monto <= 0) { showFieldError('gasto-monto', 'Ingresa un monto valido'); return; }

            const { error } = await window._supabase.from('gastos').insert({
                concepto, monto, tipo, fecha,
                descripcion: desc || null,
                usuario_id:  AppUser.profile.id,
            });

            if (error) { toastError('No se pudo guardar el gasto'); return; }
            closeModal();
            toastSuccess('Gasto registrado');
            navigateTo('gastos');
        });
    }


    // Usuarios
    async function renderUsuarios(area) {
        const { data: roles } = await window._supabase.from('roles').select('id, nombre');
        const { data: users } = await window._supabase
            .from('usuarios')
            .select('*, roles(nombre)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Usuarios</h1>
            <button class="btn btn-primary" id="btn-nuevo-usuario">+ Nuevo usuario</button>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">Personal del negocio</span>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Ultimo acceso</th><th>Acciones</th></tr></thead>
                    <tbody>
                        ${!users?.length
                            ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray)">Sin usuarios</td></tr>`
                            : users.map(u => `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:10px">
                                        <div class="product-row-image" style="border-radius:50%">${getInitials(u.nombre, u.apellido)}</div>
                                        <span style="font-weight:600">${escapeHtml(u.nombre)} ${escapeHtml(u.apellido)}</span>
                                    </div>
                                </td>
                                <td>${escapeHtml(u.email)}</td>
                                <td><span class="badge ${u.roles?.nombre === 'dueno' ? 'badge-warning' : 'badge-gray'}">${u.roles?.nombre || '-'}</span></td>
                                <td><span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                                <td>${u.ultimo_login ? formatDate(u.ultimo_login, true) : 'Nunca'}</td>
                                <td class="td-actions">
                                    ${u.id !== AppUser.profile.id
                                        ? `<button class="btn btn-ghost btn-sm" data-id="${u.id}" data-activo="${u.activo}" data-action="toggle-user">
                                               ${u.activo ? 'Desactivar' : 'Activar'}
                                           </button>`
                                        : '<span style="font-size:12px;color:var(--color-gray)">Tu cuenta</span>'
                                    }
                                </td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>`;

        document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => modalNuevoUsuario(roles));

        area.querySelectorAll('[data-action="toggle-user"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id     = btn.dataset.id;
                const activo = btn.dataset.activo === 'true';
                const label  = activo ? 'desactivar' : 'activar';
                confirmAction(`${capitalize(label)} usuario`, `Confirmas ${label} este usuario?`, async () => {
                    await window._supabase.from('usuarios').update({ activo: !activo }).eq('id', id);
                    toastSuccess(`Usuario ${activo ? 'desactivado' : 'activado'}`);
                    renderUsuarios(area);
                }, capitalize(label), activo ? 'btn-danger' : 'btn-success');
            });
        });
    }

    function modalNuevoUsuario(roles) {
        const rolesOpts = (roles || []).map(r =>
            `<option value="${r.id}">${capitalize(r.nombre)}</option>`
        ).join('');

        const body = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label class="form-label">Nombre <span style="color:red">*</span></label>
                    <input type="text" id="nu-nombre" class="form-input" placeholder="Juan">
                    <span class="field-error" id="nu-nombre-error"></span>
                </div>
                <div class="form-group">
                    <label class="form-label">Apellido <span style="color:red">*</span></label>
                    <input type="text" id="nu-apellido" class="form-input" placeholder="Perez">
                    <span class="field-error" id="nu-apellido-error"></span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Email <span style="color:red">*</span></label>
                <input type="email" id="nu-email" class="form-input" placeholder="usuario@kiosco.com">
                <span class="field-error" id="nu-email-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Contrasena <span style="color:red">*</span></label>
                <input type="password" id="nu-pass" class="form-input" placeholder="Minimo 8 caracteres" autocomplete="new-password">
                <span class="field-error" id="nu-pass-error"></span>
            </div>
            <div class="form-group">
                <label class="form-label">Rol <span style="color:red">*</span></label>
                <select id="nu-rol" class="form-select">${rolesOpts}</select>
            </div>`;

        const footer = `
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="confirm-nuevo-usuario">Crear usuario</button>`;

        openModal('Nuevo usuario', body, footer);

        document.getElementById('confirm-nuevo-usuario').addEventListener('click', async () => {
            const nombre   = document.getElementById('nu-nombre').value.trim();
            const apellido = document.getElementById('nu-apellido').value.trim();
            const email    = document.getElementById('nu-email').value.trim();
            const pass     = document.getElementById('nu-pass').value;
            const rolId    = document.getElementById('nu-rol').value;
            let valid = true;

            if (!nombre)          { showFieldError('nu-nombre',   'Obligatorio'); valid = false; }
            if (!apellido)        { showFieldError('nu-apellido', 'Obligatorio'); valid = false; }
            if (!isEmail(email))  { showFieldError('nu-email',    'Email invalido'); valid = false; }
            if (pass.length < 8)  { showFieldError('nu-pass',     'Minimo 8 caracteres'); valid = false; }
            if (!valid) return;

            const btnCrear = document.getElementById('confirm-nuevo-usuario');
            if (btnCrear.disabled) return;
            btnCrear.disabled = true;
            btnCrear.textContent = 'Creando...';

            // El usuario se crea en el servidor (Edge Function "crear-usuario"):
            // la clave de servicio nunca pasa por el navegador y solo el dueno puede usarla.
            const { data: creado, error: fnErr } = await window._supabase.functions.invoke('crear-usuario', {
                body: { nombre, apellido, email, password: pass, rol_id: rolId }
            });

            if (fnErr) {
                let msg = 'No se pudo crear el usuario';
                try {
                    const detalle = await fnErr.context.json();
                    if (detalle?.error) msg = detalle.error;
                } catch (_) { /* sin detalle: se deja el mensaje general */ }
                toastError(msg);
                btnCrear.disabled = false;
                btnCrear.textContent = 'Crear usuario';
                return;
            }

            await registrarAuditoria('crear', 'usuarios', creado?.id, `Usuario creado: ${email}`);
            closeModal();
            toastSuccess('Usuario creado exitosamente');
            renderUsuarios(area);
        });
    }


    // Auditoria
    async function renderAuditoria(area) {
        const { data } = await window._supabase
            .from('auditoria')
            .select('*, usuarios(nombre, apellido)')
            .order('created_at', { ascending: false })
            .limit(50);

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Auditoria del sistema</h1>
        </div>
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">Ultimas 50 acciones</span>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead><tr><th>Fecha</th><th>Usuario</th><th>Tipo</th><th>Tabla</th><th>Descripcion</th></tr></thead>
                    <tbody>
                        ${!data?.length
                            ? `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--color-gray)">Sin registros</td></tr>`
                            : data.map(a => `
                            <tr>
                                <td style="white-space:nowrap">${formatDate(a.created_at, true)}</td>
                                <td>${escapeHtml(a.usuarios ? `${a.usuarios.nombre} ${a.usuarios.apellido}` : 'Sistema')}</td>
                                <td><span class="badge badge-gray">${a.tipo}</span></td>
                                <td><span style="font-size:12px;color:var(--color-gray)">${a.tabla || '-'}</span></td>
                                <td>${escapeHtml(a.descripcion)}</td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>`;
    }


    // Configuracion
    async function renderConfiguracion(area) {
        const { data: config } = await window._supabase
            .from('configuracion_negocio')
            .select('*')
            .limit(1)
            .single();

        if (!config) { area.innerHTML = '<p>Error al cargar configuracion</p>'; return; }

        area.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Configuracion del negocio</h1>
        </div>
        <div class="card" style="max-width:680px">
            <div id="config-alert"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Nombre del negocio</label>
                    <input type="text" id="cfg-nombre" class="form-input" value="${escapeHtml(config.nombre_negocio || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Razon social</label>
                    <input type="text" id="cfg-razon" class="form-input" value="${escapeHtml(config.razon_social || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">CUIT</label>
                    <input type="text" id="cfg-cuit" class="form-input" value="${escapeHtml(config.cuit || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Telefono</label>
                    <input type="text" id="cfg-tel" class="form-input" value="${escapeHtml(config.telefono || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="cfg-email" class="form-input" value="${escapeHtml(config.email || '')}">
                </div>
                <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Domicilio</label>
                    <input type="text" id="cfg-domicilio" class="form-input" value="${escapeHtml(config.domicilio || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Simbolo de moneda</label>
                    <input type="text" id="cfg-moneda" class="form-input" value="${escapeHtml(config.simbolo_moneda || '$')}" maxlength="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Alerta stock minimo global</label>
                    <input type="number" id="cfg-stock" class="form-input" value="${config.alerta_stock_minimo || 5}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">IVA % (0 = sin IVA)</label>
                    <input type="number" id="cfg-iva" class="form-input" value="${config.impuesto_porcentaje || 0}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Descuento maximo %</label>
                    <input type="number" id="cfg-desc" class="form-input" value="${config.descuento_maximo || 20}" min="0" max="100">
                </div>
                <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Mensaje en ticket</label>
                    <input type="text" id="cfg-ticket" class="form-input" value="${escapeHtml(config.mensaje_ticket || '')}">
                </div>
            </div>
            <div style="margin-top:8px">
                <button class="btn btn-primary" id="btn-guardar-config">Guardar cambios</button>
            </div>
        </div>`;

        document.getElementById('btn-guardar-config').addEventListener('click', async () => {
            const updates = {
                nombre_negocio:      document.getElementById('cfg-nombre').value.trim(),
                razon_social:        document.getElementById('cfg-razon').value.trim() || null,
                cuit:                document.getElementById('cfg-cuit').value.trim() || null,
                telefono:            document.getElementById('cfg-tel').value.trim() || null,
                email:               document.getElementById('cfg-email').value.trim() || null,
                domicilio:           document.getElementById('cfg-domicilio').value.trim() || null,
                simbolo_moneda:      document.getElementById('cfg-moneda').value.trim() || '$',
                alerta_stock_minimo: parseInt(document.getElementById('cfg-stock').value) || 5,
                impuesto_porcentaje: parseFloat(document.getElementById('cfg-iva').value) || 0,
                descuento_maximo:    parseFloat(document.getElementById('cfg-desc').value) || 20,
                mensaje_ticket:      document.getElementById('cfg-ticket').value.trim() || null,
            };

            const { error } = await window._supabase
                .from('configuracion_negocio')
                .update(updates)
                .eq('id', config.id);

            if (error) { toastError('No se pudo guardar la configuracion'); return; }

            Cache.del('config');
            toastSuccess('Configuracion guardada correctamente');
            await registrarAuditoria('editar', 'configuracion_negocio', config.id, 'Actualizacion de configuracion');
        });
    }

}); // fin DOMContentLoaded
