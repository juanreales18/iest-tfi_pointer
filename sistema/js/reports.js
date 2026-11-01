/* =============================================================
   KIOSCO SYSTEM - REPORTS.JS
   Reportes diarios, semanales, mensuales y estadisticas
   ============================================================= */


// =============================================================
// ENTRADA PRINCIPAL
// =============================================================

function renderReportes(area) {
    if (!AppUser.isDueno) {
        area.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <p>Acceso restringido</p>
                <span>Solo el dueno puede ver los reportes</span>
            </div>`;
        return;
    }

    area.innerHTML = `
    <div class="page-header">
        <h1 class="page-title">Reportes</h1>
    </div>

    <!-- Tabs de reportes -->
    <div class="report-tabs" id="report-tabs">
        <button class="report-tab active" data-tab="ventas">Ventas</button>
        <button class="report-tab" data-tab="productos">Productos</button>
        <button class="report-tab" data-tab="caja">Caja</button>
        <button class="report-tab" data-tab="rentabilidad">Rentabilidad</button>
    </div>

    <!-- Filtros de periodo -->
    <div class="report-filters card" style="margin-bottom:20px;padding:14px 18px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-ghost period-btn active" data-period="hoy">Hoy</button>
                <button class="btn btn-sm btn-ghost period-btn" data-period="semana">Esta semana</button>
                <button class="btn btn-sm btn-ghost period-btn" data-period="mes">Este mes</button>
                <button class="btn btn-sm btn-ghost period-btn" data-period="custom">Personalizado</button>
            </div>
            <div id="custom-range" style="display:none;gap:8px;align-items:center;flex-wrap:wrap">
                <input type="date" id="fecha-desde" class="form-input" style="width:160px">
                <span style="color:var(--color-gray);font-size:13px">hasta</span>
                <input type="date" id="fecha-hasta" class="form-input" style="width:160px">
                <button class="btn btn-primary btn-sm" id="btn-apply-custom">Aplicar</button>
            </div>
        </div>
    </div>

    <!-- Contenido dinamico del reporte activo -->
    <div id="report-content">
        <div class="page-loader"><div class="spinner-md"></div></div>
    </div>`;

    // Estado de filtros
    const state = {
        tab:    'ventas',
        period: 'hoy',
        desde:  null,
        hasta:  null,
    };

    // Tabs
    area.querySelectorAll('.report-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            area.querySelectorAll('.report-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.tab = btn.dataset.tab;
            loadReport(state);
        });
    });

    // Botones de periodo
    area.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            area.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.period = btn.dataset.period;
            const customRange = document.getElementById('custom-range');
            if (state.period === 'custom') {
                customRange.style.display = 'flex';
                // Inicializar fechas por defecto
                const hoy = hoyAR();
                document.getElementById('fecha-desde').value = hoy;
                document.getElementById('fecha-hasta').value = hoy;
            } else {
                customRange.style.display = 'none';
                const range = getPeriodRange(state.period);
                state.desde = range.desde;
                state.hasta = range.hasta;
                loadReport(state);
            }
        });
    });

    // Rango custom
    document.getElementById('btn-apply-custom')?.addEventListener('click', () => {
        const desde = document.getElementById('fecha-desde').value;
        const hasta  = document.getElementById('fecha-hasta').value;
        if (!desde || !hasta) { toastWarning('Selecciona un rango de fechas'); return; }

        // Aplicar timezone local al rango custom tambien
        const offsetMin = new Date().getTimezoneOffset();
        const sign      = offsetMin <= 0 ? '+' : '-';
        const absMin    = Math.abs(offsetMin);
        const pad       = n => String(n).padStart(2, '0');
        const tz        = `${sign}${pad(Math.floor(absMin/60))}:${pad(absMin%60)}`;

        state.desde = `${desde}T00:00:00${tz}`;
        state.hasta  = `${hasta}T23:59:59${tz}`;
        loadReport(state);
    });

    // Carga inicial
    const range = getPeriodRange('hoy');
    state.desde = range.desde;
    state.hasta = range.hasta;
    loadReport(state);
}


// =============================================================
// OBTENER RANGO DE FECHAS POR PERIODO
// =============================================================

function getPeriodRange(period) {
    // Usar fecha local del navegador, no UTC
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');

    // Formatear fecha local YYYY-MM-DD sin conversion UTC
    const fmtLocal = d => {
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    };

    // Obtener offset UTC del navegador en formato +HH:MM o -HH:MM
    // Supabase acepta timestamps con timezone: '2024-01-15T00:00:00-03:00'
    const offsetMin = now.getTimezoneOffset(); // minutos, negativo para UTC+
    const sign      = offsetMin <= 0 ? '+' : '-';
    const absMin    = Math.abs(offsetMin);
    const tzOffset  = `${sign}${pad(Math.floor(absMin/60))}:${pad(absMin%60)}`;

    switch(period) {
        case 'hoy': {
            const hoy = fmtLocal(now);
            return {
                desde: `${hoy}T00:00:00${tzOffset}`,
                hasta:  `${hoy}T23:59:59${tzOffset}`,
            };
        }
        case 'semana': {
            const day  = now.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const lun  = new Date(now);
            lun.setDate(now.getDate() + diff);
            return {
                desde: `${fmtLocal(lun)}T00:00:00${tzOffset}`,
                hasta:  `${fmtLocal(now)}T23:59:59${tzOffset}`,
            };
        }
        case 'mes': {
            const desde = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
            return {
                desde: `${desde}T00:00:00${tzOffset}`,
                hasta:  `${fmtLocal(now)}T23:59:59${tzOffset}`,
            };
        }
        default: {
            const hoy = fmtLocal(now);
            return {
                desde: `${hoy}T00:00:00${tzOffset}`,
                hasta:  `${hoy}T23:59:59${tzOffset}`,
            };
        }
    }
}


// =============================================================
// ROUTER DE REPORTES
// =============================================================

async function loadReport(state) {
    const content = document.getElementById('report-content');
    if (!content) return;
    content.innerHTML = '<div class="page-loader"><div class="spinner-md"></div></div>';

    try {
        switch(state.tab) {
            case 'ventas':        await reportVentas(content, state);       break;
            case 'productos':     await reportProductos(content, state);    break;
            case 'caja':          await reportCaja(content, state);         break;
            case 'rentabilidad':  await reportRentabilidad(content, state); break;
        }
    } catch(err) {
        content.innerHTML = `
            <div class="empty-state">
                <p>Error al cargar el reporte</p>
                <span>${escapeHtml(err.message)}</span>
            </div>`;
    }
}


// =============================================================
// REPORTE: VENTAS
// =============================================================

async function reportVentas(container, state) {
    const { data: ventas } = await window._supabase
        .from('ventas')
        .select(`
            id, numero_venta, total, subtotal, descuento_monto,
            impuesto_monto, estado, created_at, monto_recibido,
            metodos_pago ( nombre ),
            usuarios ( nombre, apellido ),
            clientes ( nombre, apellido )
        `)
        .gte('created_at', state.desde)
        .lte('created_at', state.hasta)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    const completadas = (ventas || []).filter(v => v.estado === 'completada');
    const canceladas  = (ventas || []).filter(v => v.estado === 'cancelada');

    const totalVentas    = completadas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    const totalDescuentos= completadas.reduce((s, v) => s + parseFloat(v.descuento_monto || 0), 0);
    const totalImpuestos = completadas.reduce((s, v) => s + parseFloat(v.impuesto_monto || 0), 0);
    const ticketPromedio = completadas.length ? totalVentas / completadas.length : 0;

    // Agrupar por metodo de pago
    const porMetodo = {};
    completadas.forEach(v => {
        const metodo = v.metodos_pago?.nombre || 'Sin metodo';
        if (!porMetodo[metodo]) porMetodo[metodo] = { count: 0, total: 0 };
        porMetodo[metodo].count++;
        porMetodo[metodo].total += parseFloat(v.total || 0);
    });

    // Agrupar por dia (para grafico)
    const porDia = {};
    completadas.forEach(v => {
        const dia = v.created_at.slice(0, 10);
        if (!porDia[dia]) porDia[dia] = 0;
        porDia[dia] += parseFloat(v.total || 0);
    });
    const diasOrdenados = Object.keys(porDia).sort();
    const maxDia = Math.max(...Object.values(porDia), 1);

    container.innerHTML = `
    <!-- Stats resumen -->
    <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
            <div class="stat-card-icon yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Total vendido</div>
                <div class="stat-card-value">${formatCurrency(totalVentas)}</div>
                <span class="stat-card-change">${completadas.length} ventas completadas</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Ticket promedio</div>
                <div class="stat-card-value">${formatCurrency(ticketPromedio)}</div>
                <span class="stat-card-change">por transaccion</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Descuentos</div>
                <div class="stat-card-value">${formatCurrency(totalDescuentos)}</div>
                <span class="stat-card-change">otorgados en el periodo</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon dark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Canceladas</div>
                <div class="stat-card-value">${canceladas.length}</div>
                <span class="stat-card-change">ventas anuladas</span>
            </div>
        </div>
    </div>

    <div class="content-grid" style="grid-template-columns:2fr 1fr;margin-bottom:20px">
        <!-- Grafico de ventas por dia -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">Ventas por dia</span>
            </div>
            ${diasOrdenados.length === 0
                ? `<div class="empty-state" style="padding:30px"><p>Sin datos en el periodo</p></div>`
                : diasOrdenados.map(dia => `
                <div class="chart-bar-row">
                    <div class="chart-bar-label">${dia.slice(5)}</div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width:${Math.round((porDia[dia]/maxDia)*100)}%"></div>
                    </div>
                    <div class="chart-bar-value">${formatCurrency(porDia[dia])}</div>
                </div>`).join('')
            }
        </div>

        <!-- Por metodo de pago -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">Por metodo de pago</span>
            </div>
            ${Object.keys(porMetodo).length === 0
                ? `<div class="empty-state" style="padding:30px"><p>Sin datos</p></div>`
                : Object.entries(porMetodo)
                    .sort((a,b) => b[1].total - a[1].total)
                    .map(([metodo, data]) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                padding:10px 0;border-bottom:1px solid var(--color-border)">
                        <div>
                            <div style="font-size:14px;font-weight:600">${escapeHtml(metodo)}</div>
                            <div style="font-size:12px;color:var(--color-gray)">${data.count} ventas</div>
                        </div>
                        <strong style="font-family:var(--font-condensed);font-size:1.05rem">
                            ${formatCurrency(data.total)}
                        </strong>
                    </div>`).join('')
            }
        </div>
    </div>

    <!-- Tabla de ventas -->
    <div class="table-section">
        <div class="table-section-header">
            <span class="table-section-title">Detalle de ventas</span>
            <button class="btn btn-ghost btn-sm" id="btn-export-ventas">Exportar CSV</button>
        </div>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead><tr>
                    <th>#</th><th>Fecha / Hora</th><th>Vendedor</th>
                    <th>Cliente</th><th>Metodo</th><th>Total</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    ${!ventas?.length
                        ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--color-gray)">Sin ventas en el periodo seleccionado</td></tr>`
                        : ventas.map(v => `
                        <tr>
                            <td><strong>#${v.numero_venta}</strong></td>
                            <td style="white-space:nowrap">${formatDate(v.created_at, true)}</td>
                            <td>${escapeHtml(v.usuarios ? `${v.usuarios.nombre} ${v.usuarios.apellido}` : '-')}</td>
                            <td>${escapeHtml(v.clientes ? `${v.clientes.nombre}` : 'Consumidor final')}</td>
                            <td><span class="venta-metodo">${escapeHtml(v.metodos_pago?.nombre || '-')}</span></td>
                            <td><strong>${formatCurrency(v.total)}</strong></td>
                            <td><span class="badge ${v.estado === 'completada' ? 'badge-success' : 'badge-danger'}">${v.estado}</span></td>
                            <td>${v.estado === 'completada'
                                ? `<button class="btn btn-ghost btn-sm btn-cancelar-venta" data-id="${v.id}" data-num="${v.numero_venta}" data-total="${v.total}" style="color:var(--color-danger)">Cancelar</button>`
                                : ''}</td>
                        </tr>`).join('')
                    }
                </tbody>
            </table>
        </div>
        <div class="table-section-footer">
            <span style="font-size:13px;color:var(--color-gray)">${ventas?.length || 0} registros</span>
        </div>
    </div>`;

    // Cancelar venta (solo dueno): devuelve el stock y saca el efectivo de la caja
    container.querySelectorAll('.btn-cancelar-venta').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, num, total } = btn.dataset;
            const body = `
                <p style="font-size:14px;line-height:1.6;margin-bottom:12px">
                    Vas a cancelar la venta <strong>#${escapeHtml(num)}</strong> por <strong>${formatCurrency(total)}</strong>.
                    Se devuelve el stock y, si fue en efectivo, se descuenta de la caja.
                    La caja de esa venta tiene que seguir abierta.
                </p>
                <div class="form-group">
                    <label class="form-label">Motivo (opcional)</label>
                    <input type="text" id="motivo-cancelacion" class="form-input" maxlength="120" placeholder="Ej: error al cobrar">
                </div>`;
            const footer = `
                <button class="btn btn-ghost" onclick="closeModal()">Volver</button>
                <button class="btn btn-danger" id="confirm-cancelar-venta">Cancelar venta</button>`;
            openModal('Cancelar venta', body, footer, 'modal-sm');

            document.getElementById('confirm-cancelar-venta').addEventListener('click', async (ev) => {
                const b = ev.currentTarget;
                b.disabled = true; b.textContent = 'Cancelando...';
                try {
                    const motivo = document.getElementById('motivo-cancelacion')?.value || '';
                    const { error } = await window._supabase.rpc('cancelar_venta', { p_venta_id: id, p_motivo: motivo });
                    if (error) throw error;
                    closeModal();
                    toastSuccess(`Venta #${num} cancelada`);
                    loadReport(state);
                } catch (err) {
                    b.disabled = false; b.textContent = 'Cancelar venta';
                    const msg = String(err?.message || '');
                    toastError(/Failed to fetch|NetworkError/i.test(msg)
                        ? 'Sin conexion: no se cancelo la venta'
                        : msg || 'No se pudo cancelar la venta');
                }
            });
        });
    });

    document.getElementById('btn-export-ventas')?.addEventListener('click', () => {
        exportCSV(ventas || [], 'reporte_ventas', {
            numero_venta: '#', created_at: 'Fecha', total: 'Total',
            descuento_monto: 'Descuento', estado: 'Estado'
        });
    });
}


// =============================================================
// REPORTE: PRODUCTOS MAS VENDIDOS
// =============================================================

async function reportProductos(container, state) {
    // Ventas completadas del periodo con su detalle en una sola consulta
    const { data: ventasProd } = await window._supabase
        .from('ventas')
        .select('detalle_ventas ( cantidad, subtotal, precio_unitario, precio_costo, productos ( id, nombre, codigo_barra, categorias(nombre) ) )')
        .gte('created_at', state.desde)
        .lte('created_at', state.hasta)
        .eq('estado', 'completada')
        .is('deleted_at', null)
        .limit(10000);

    const detalles = (ventasProd || []).flatMap(v => v.detalle_ventas || []);

    // Agrupar por producto
    const porProducto = {};
    (detalles || []).forEach(d => {
        const id = d.productos?.id;
        if (!id) return;
        if (!porProducto[id]) {
            porProducto[id] = {
                nombre:     d.productos?.nombre || '-',
                codigo:     d.productos?.codigo_barra || '-',
                categoria:  d.productos?.categorias?.nombre || '-',
                unidades:   0,
                subtotal:   0,
                costo:      0,
            };
        }
        porProducto[id].unidades += parseInt(d.cantidad || 0);
        porProducto[id].subtotal += parseFloat(d.subtotal || 0);
        porProducto[id].costo    += parseFloat(d.precio_costo || 0) * parseInt(d.cantidad || 0);
    });

    const ranking = Object.values(porProducto)
        .sort((a, b) => b.unidades - a.unidades);

    const maxUnidades = ranking[0]?.unidades || 1;
    const totalFacturado = ranking.reduce((s, p) => s + p.subtotal, 0);

    container.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
            <div class="stat-card-icon yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Productos diferentes</div>
                <div class="stat-card-value">${ranking.length}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Total facturado</div>
                <div class="stat-card-value">${formatCurrency(totalFacturado)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Mas vendido</div>
                <div class="stat-card-value" style="font-size:1rem;line-height:1.2">${escapeHtml(ranking[0]?.nombre || '-')}</div>
                <span class="stat-card-change">${ranking[0]?.unidades || 0} unidades</span>
            </div>
        </div>
    </div>

    <!-- Ranking visual -->
    <div class="content-grid" style="grid-template-columns:1fr 1fr;margin-bottom:20px">
        <div class="card">
            <div class="card-header"><span class="card-title">Top 10 por unidades vendidas</span></div>
            ${ranking.slice(0, 10).map((p, i) => `
            <div class="chart-bar-row">
                <div class="chart-bar-label" style="width:90px;font-size:11px" title="${escapeHtml(p.nombre)}">
                    ${i+1}. ${escapeHtml(truncate(p.nombre, 12))}
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.round((p.unidades/maxUnidades)*100)}%;
                        background:${i === 0 ? 'var(--color-primary)' : i < 3 ? 'var(--color-dark-3)' : 'var(--color-border-dark)'}">
                    </div>
                </div>
                <div class="chart-bar-value">${p.unidades}</div>
            </div>`).join('') || '<div class="empty-state" style="padding:20px"><p>Sin datos</p></div>'
            }
        </div>

        <div class="card">
            <div class="card-header"><span class="card-title">Top 10 por monto facturado</span></div>
            ${[...ranking].sort((a,b) => b.subtotal - a.subtotal).slice(0, 10).map((p, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 0;border-bottom:1px solid var(--color-border)">
                <div style="min-width:0;flex:1">
                    <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${i+1}. ${escapeHtml(p.nombre)}
                    </div>
                    <div style="font-size:11px;color:var(--color-gray)">${p.unidades} un. - ${escapeHtml(p.categoria)}</div>
                </div>
                <strong style="font-family:var(--font-condensed);font-size:1rem;margin-left:10px;flex-shrink:0">
                    ${formatCurrency(p.subtotal)}
                </strong>
            </div>`).join('') || '<div class="empty-state" style="padding:20px"><p>Sin datos</p></div>'
            }
        </div>
    </div>

    <!-- Tabla completa -->
    <div class="table-section">
        <div class="table-section-header">
            <span class="table-section-title">Todos los productos vendidos</span>
            <button class="btn btn-ghost btn-sm" id="btn-export-prod-rep">Exportar CSV</button>
        </div>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead><tr>
                    <th>Producto</th><th>Categoria</th><th>Unidades</th>
                    <th>Facturado</th><th>Costo total</th><th>Ganancia est.</th>
                </tr></thead>
                <tbody>
                    ${!ranking.length
                        ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray)">Sin ventas en el periodo</td></tr>`
                        : ranking.map(p => {
                            const ganancia = p.subtotal - p.costo;
                            const margen   = p.subtotal > 0 ? ((ganancia / p.subtotal) * 100).toFixed(1) : '0.0';
                            return `
                            <tr>
                                <td>
                                    <div style="font-weight:600">${escapeHtml(p.nombre)}</div>
                                    <code style="font-size:11px;color:var(--color-gray)">${escapeHtml(p.codigo)}</code>
                                </td>
                                <td>${escapeHtml(p.categoria)}</td>
                                <td style="font-family:var(--font-condensed);font-weight:700;font-size:1.05rem">${p.unidades}</td>
                                <td><strong>${formatCurrency(p.subtotal)}</strong></td>
                                <td>${formatCurrency(p.costo)}</td>
                                <td>
                                    <span style="color:${ganancia >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                                        ${formatCurrency(ganancia)}
                                    </span>
                                    <span style="font-size:11px;color:var(--color-gray)">(${margen}%)</span>
                                </td>
                            </tr>`;
                        }).join('')
                    }
                </tbody>
            </table>
        </div>
    </div>`;

    document.getElementById('btn-export-prod-rep')?.addEventListener('click', () => {
        exportCSV(ranking, 'reporte_productos', {
            nombre: 'Producto', categoria: 'Categoria',
            unidades: 'Unidades', subtotal: 'Facturado', costo: 'Costo'
        });
    });
}


// =============================================================
// REPORTE: CAJA
// =============================================================

async function reportCaja(container, state) {
    const { data: movimientos } = await window._supabase
        .from('movimientos_caja')
        .select('*, usuarios(nombre, apellido), cajas(nombre)')
        .gte('created_at', state.desde)
        .lte('created_at', state.hasta)
        .order('created_at', { ascending: false });

    const todos = movimientos || [];

    // Excluir apertura y cierre: no son recaudacion real,
    // son movimientos contables del fondo de caja
    const TIPOS_EXCLUIDOS = ['apertura', 'cierre'];
    const movRecaudacion  = todos.filter(m => !TIPOS_EXCLUIDOS.includes(m.tipo));

    const ingresos = movRecaudacion.filter(m => m.monto > 0);
    const egresos  = movRecaudacion.filter(m => m.monto < 0);

    const totalIngresos = ingresos.reduce((s, m) => s + parseFloat(m.monto), 0);
    const totalEgresos  = Math.abs(egresos.reduce((s, m) => s + parseFloat(m.monto), 0));
    const saldoNeto     = totalIngresos - totalEgresos;

    // Agrupar por tipo (solo movimientos de recaudacion)
    const porTipo = {};
    movRecaudacion.forEach(m => {
        if (!porTipo[m.tipo]) porTipo[m.tipo] = { count: 0, monto: 0 };
        porTipo[m.tipo].count++;
        porTipo[m.tipo].monto += parseFloat(m.monto);
    });

    container.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
            <div class="stat-card-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Ingresos en efectivo</div>
                <div class="stat-card-value">${formatCurrency(totalIngresos)}</div>
                <span class="stat-card-change up">${ingresos.length} ventas</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Total egresos</div>
                <div class="stat-card-value">${formatCurrency(totalEgresos)}</div>
                <span class="stat-card-change down">${egresos.length} movimientos</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon ${saldoNeto >= 0 ? 'yellow' : 'red'}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Saldo neto</div>
                <div class="stat-card-value" style="color:${saldoNeto >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                    ${formatCurrency(saldoNeto)}
                </div>
            </div>
        </div>
    </div>

    <div class="content-grid" style="grid-template-columns:2fr 1fr;margin-bottom:20px">
        <!-- Movimientos -->
        <div class="table-section">
            <div class="table-section-header">
                <span class="table-section-title">Movimientos de caja (solo efectivo)</span>
                <button class="btn btn-ghost btn-sm" id="btn-export-caja">Exportar CSV</button>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead><tr>
                        <th>Fecha</th><th>Tipo</th><th>Descripcion</th>
                        <th>Monto</th><th>Saldo</th><th>Usuario</th>
                    </tr></thead>
                    <tbody>
                        ${!movRecaudacion.length
                            ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-gray)">Sin movimientos de venta en el periodo</td></tr>`
                            : movRecaudacion.map(m => `
                            <tr>
                                <td style="white-space:nowrap">${formatDate(m.created_at, true)}</td>
                                <td><span class="badge ${
                                    m.tipo === 'venta'    ? 'badge-success' :
                                    m.tipo === 'apertura' ? 'badge-info'    :
                                    m.tipo === 'cierre'   ? 'badge-dark'    :
                                    m.monto < 0           ? 'badge-danger'  : 'badge-gray'}">${m.tipo}</span>
                                </td>
                                <td>${escapeHtml(m.descripcion || '-')}</td>
                                <td style="font-weight:700;color:${m.monto >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                                    ${m.monto >= 0 ? '+' : ''}${formatCurrency(m.monto)}
                                </td>
                                <td>${formatCurrency(m.saldo_posterior)}</td>
                                <td>${escapeHtml(m.usuarios ? `${m.usuarios.nombre}` : '-')}</td>
                            </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Resumen por tipo -->
        <div class="card">
            <div class="card-header"><span class="card-title">Por tipo de movimiento</span></div>
            ${Object.entries(porTipo).map(([tipo, d]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:10px 0;border-bottom:1px solid var(--color-border)">
                <div>
                    <div style="font-size:14px;font-weight:600">${tipo}</div>
                    <div style="font-size:12px;color:var(--color-gray)">${d.count} registros</div>
                </div>
                <span style="font-family:var(--font-condensed);font-weight:700;
                    color:${d.monto >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                    ${d.monto >= 0 ? '+' : ''}${formatCurrency(d.monto)}
                </span>
            </div>`).join('') || '<div class="empty-state" style="padding:20px"><p>Sin datos</p></div>'
            }
        </div>
    </div>`;

    document.getElementById('btn-export-caja')?.addEventListener('click', () => {
        exportCSV(movRecaudacion, 'reporte_caja', {
            created_at: 'Fecha', tipo: 'Tipo', descripcion: 'Descripcion',
            monto: 'Monto', saldo_posterior: 'Saldo'
        });
    });
}


// =============================================================
// REPORTE: RENTABILIDAD
// =============================================================

async function reportRentabilidad(container, state) {
    // Ventas del periodo con su detalle en una sola consulta (sin listas de ids en la URL)
    const [ventasRes, { data: gastos }] = await Promise.all([
        window._supabase
            .from('ventas')
            .select('descuento_monto, detalle_ventas ( cantidad, subtotal, precio_costo )')
            .gte('created_at', state.desde)
            .lte('created_at', state.hasta)
            .eq('estado', 'completada')
            .is('deleted_at', null)
            .limit(10000),
        window._supabase
            .from('gastos')
            .select('monto, tipo, concepto')
            .gte('fecha', state.desde)
            .lte('fecha', state.hasta)
            .is('deleted_at', null),
    ]);

    const ventasRent = ventasRes.data || [];
    const detalles   = ventasRent.flatMap(v => v.detalle_ventas || []);

    const ventasBrutas  = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);
    const totalDescuentos = ventasRent.reduce((s, v) => s + parseFloat(v.descuento_monto || 0), 0);
    const totalVentas   = ventasBrutas - totalDescuentos;           // ventas netas (despues de descuentos, sin IVA)
    const costoMercad   = detalles.reduce((s, d) => s + (parseFloat(d.precio_costo || 0) * parseInt(d.cantidad || 0)), 0);
    const utilidadBruta = totalVentas - costoMercad;
    const margenBruto   = totalVentas > 0 ? ((utilidadBruta / totalVentas) * 100) : 0;

    const totalGastos   = (gastos || []).reduce((s, g) => s + parseFloat(g.monto || 0), 0);
    const utilidadNeta  = utilidadBruta - totalGastos;
    const margenNeto    = totalVentas > 0 ? ((utilidadNeta / totalVentas) * 100) : 0;

    // Gastos por tipo
    const gastosPorTipo = {};
    (gastos || []).forEach(g => {
        if (!gastosPorTipo[g.tipo]) gastosPorTipo[g.tipo] = 0;
        gastosPorTipo[g.tipo] += parseFloat(g.monto);
    });

    const barMaxRent = Math.max(ventasBrutas, totalVentas, costoMercad, Math.abs(utilidadBruta), totalGastos, Math.abs(utilidadNeta), 1);

    container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
            <div class="stat-card-icon yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Ventas netas</div>
                <div class="stat-card-value">${formatCurrency(totalVentas)}</div>
                <span class="stat-card-change">Brutas ${formatCurrency(ventasBrutas)} - descuentos ${formatCurrency(totalDescuentos)}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Costo de mercaderia</div>
                <div class="stat-card-value">${formatCurrency(costoMercad)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Utilidad bruta</div>
                <div class="stat-card-value" style="color:${utilidadBruta >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                    ${formatCurrency(utilidadBruta)}
                </div>
                <span class="stat-card-change ${utilidadBruta >= 0 ? 'up' : 'down'}">
                    Margen: ${margenBruto.toFixed(1)}%
                </span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon ${utilidadNeta >= 0 ? 'dark' : 'red'}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-label">Utilidad neta</div>
                <div class="stat-card-value" style="color:${utilidadNeta >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                    ${formatCurrency(utilidadNeta)}
                </div>
                <span class="stat-card-change ${utilidadNeta >= 0 ? 'up' : 'down'}">
                    Margen neto: ${margenNeto.toFixed(1)}%
                </span>
            </div>
        </div>
    </div>

    <div class="content-grid" style="grid-template-columns:1fr 1fr;margin-bottom:20px">
        <!-- Cascada de rentabilidad -->
        <div class="card">
            <div class="card-header"><span class="card-title">Cascada de resultados</span></div>
            ${[
                { label: 'Ventas brutas',     val: ventasBrutas,  color: 'var(--color-primary)' },
                { label: 'Descuentos',        val: totalDescuentos, color: 'var(--color-warning)' },
                { label: 'Ventas netas',      val: totalVentas,   color: 'var(--color-primary-dark)' },
                { label: 'Costo mercaderia',  val: costoMercad,   color: 'var(--color-danger)' },
                { label: 'Utilidad bruta',    val: utilidadBruta, color: 'var(--color-success)' },
                { label: 'Gastos operativos', val: totalGastos,   color: 'var(--color-warning)' },
                { label: 'Utilidad neta',     val: utilidadNeta,  color: utilidadNeta >= 0 ? 'var(--color-dark)' : 'var(--color-danger)' },
            ].map(row => `
            <div class="chart-bar-row">
                <div class="chart-bar-label" style="width:120px;font-size:12px">${row.label}</div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.abs(Math.round((row.val/barMaxRent)*100))}%;background:${row.color}"></div>
                </div>
                <div class="chart-bar-value" style="width:80px;color:${row.color}">${formatCurrency(Math.abs(row.val))}</div>
            </div>`).join('')}
        </div>

        <!-- Gastos por tipo -->
        <div class="card">
            <div class="card-header"><span class="card-title">Gastos del periodo</span></div>
            ${!gastos?.length
                ? `<div class="empty-state" style="padding:24px"><p>Sin gastos registrados</p></div>`
                : `
                <div style="margin-bottom:14px">
                    ${Object.entries(gastosPorTipo).map(([tipo, monto]) => `
                    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--color-border)">
                        <span style="font-size:14px;font-weight:600;text-transform:capitalize">${tipo}</span>
                        <strong>${formatCurrency(monto)}</strong>
                    </div>`).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;
                            padding-top:10px;border-top:2px solid var(--color-border)">
                    <span>Total gastos</span>
                    <span style="color:var(--color-danger)">${formatCurrency(totalGastos)}</span>
                </div>
                <div style="margin-top:16px">
                    <div class="table-section-header" style="padding:0;margin-bottom:8px">
                        <span class="table-section-title" style="font-size:13px">Detalle</span>
                    </div>
                    ${gastos.map(g => `
                    <div style="display:flex;justify-content:space-between;font-size:13px;
                                padding:5px 0;border-bottom:1px solid var(--color-bg-2)">
                        <span style="color:var(--color-dark-3)">${escapeHtml(g.concepto)}</span>
                        <span style="font-weight:600">${formatCurrency(g.monto)}</span>
                    </div>`).join('')}
                </div>`
            }
        </div>
    </div>`;
}


// =============================================================
// ESTILOS ADICIONALES PARA REPORTES (inyectados una vez)
// =============================================================
(function injectReportStyles() {
    if (document.getElementById('report-styles')) return;
    const style = document.createElement('style');
    style.id = 'report-styles';
    style.textContent = `
        .report-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 16px;
            border-bottom: 2px solid var(--color-border);
            padding-bottom: 0;
        }
        .report-tab {
            padding: 9px 20px;
            font-size: 14px;
            font-weight: 600;
            color: var(--color-gray);
            border: none;
            background: none;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: color var(--transition), border-color var(--transition);
        }
        .report-tab:hover { color: var(--color-dark); }
        .report-tab.active {
            color: var(--color-primary-dark);
            border-bottom-color: var(--color-primary);
        }
        .period-btn {
            border-color: var(--color-border);
        }
        .period-btn.active {
            background: var(--color-dark);
            color: var(--color-primary);
            border-color: var(--color-dark);
        }
    `;
    document.head.appendChild(style);
})();
