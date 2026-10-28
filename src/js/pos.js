/* =============================================================
   KIOSCO SYSTEM - POS.JS
   Logica completa del Punto de Venta
   Carrito, cobro, ticket, caja, clientes y metodos de pago
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 1. INICIALIZAR AUTH
    // =========================================================
    const ok = await initAuth();
    if (!ok) return;

    updateUserUI();

    // =========================================================
    // 2. ESTADO GLOBAL DEL POS
    // =========================================================
    const POS = {
        carrito:        [],       // items del carrito
        categoriaActiva:'all',    // filtro de categoria
        metodoPagoId:   null,     // id del metodo de pago seleccionado
        metodoPagoNombre: '',
        clienteId:      null,     // id del cliente seleccionado
        clienteNombre:  '',
        descuentoPct:   0,        // porcentaje de descuento
        cajaId:         null,     // id de caja activa
        cajaAbierta:    false,
        config:         {},       // configuracion del negocio
        productos:      [],       // cache de productos cargados
    };

    // =========================================================
    // 3. CARGA INICIAL
    // =========================================================
    await Promise.all([
        cargarConfig(),
        cargarCaja(),
        cargarCategorias(),
        cargarMetodosPago(),
    ]);
    await cargarProductos();

    setupSearch();
    setupDescuentos();
    setupCobrar();
    setupClienteModal();
    setupCajaModal();
    setupKeyboard();


    // =========================================================
    // 4. CONFIGURACION DEL NEGOCIO
    // =========================================================
    async function cargarConfig() {
        try {
            const cached = Cache.get('config');
            if (cached) { POS.config = cached; return; }
            const { data } = await window._supabase
                .from('configuracion_negocio')
                .select('*').limit(1).single();
            if (data) {
                POS.config = data;
                Cache.set('config', data, 30);
            }
        } catch(e) {}
    }


    // =========================================================
    // 5. ESTADO DE CAJA
    // =========================================================
    async function cargarCaja() {
        try {
            const { data } = await window._supabase
                .from('cajas')
                .select('id, estado, nombre, saldo_actual, saldo_inicial, fecha_apertura')
                .order('created_at', { ascending: false })
                .limit(1).single();

            if (!data) return;

            POS.cajaId     = data.id;
            POS.cajaAbierta = data.estado === 'abierta';

            const dot   = document.getElementById('pos-caja-dot');
            const label = document.getElementById('pos-caja-label');
            const info  = document.getElementById('pos-caja-info');

            if (dot) dot.className = `pos-caja-dot ${POS.cajaAbierta ? 'open' : 'closed'}`;
            if (label) {
                if (POS.cajaAbierta) {
                    // Efectivo cobrado (saldo actual menos fondo) y total vendido de todos los medios
                    const efectivo = parseFloat(data.saldo_actual || 0) - parseFloat(data.saldo_inicial || 0);
                    const sym = POS.config.simbolo_moneda || '$';
                    let vendido = 0;
                    if (data.fecha_apertura) {
                        const { data: vs } = await window._supabase
                            .from('ventas').select('total')
                            .eq('caja_id', data.id).eq('estado', 'completada')
                            .is('deleted_at', null).gte('created_at', data.fecha_apertura);
                        vendido = (vs || []).reduce((s, v) => s + parseFloat(v.total || 0), 0);
                    }
                    label.textContent = `${data.nombre} - Vendido ${formatCurrency(vendido, sym)} · Efectivo ${formatCurrency(efectivo, sym)}`;
                } else {
                    label.textContent = 'Caja cerrada';
                }
            }

            // Mostrar alerta si caja cerrada
            toggleVisible('#pos-caja-alert', !POS.cajaAbierta);

            // Click en info de caja abre modal
            info?.addEventListener('click', () => openCajaModal());

        } catch(e) {}
    }


    // =========================================================
    // 6. CATEGORIAS
    // =========================================================
    async function cargarCategorias() {
        try {
            const { data } = await window._supabase
                .from('categorias')
                .select('id, nombre, color')
                .eq('activa', true)
                .order('orden');

            const container = document.getElementById('pos-categories');
            if (!container || !data?.length) return;

            data.forEach(cat => {
                const btn = document.createElement('button');
                btn.className   = 'category-chip';
                btn.dataset.id  = cat.id;
                btn.textContent = cat.nombre;
                btn.style.setProperty('--cat-color', cat.color || '#F59E0B');
                container.appendChild(btn);
            });

            container.querySelectorAll('.category-chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    POS.categoriaActiva = btn.dataset.id;
                    filtrarProductos();
                });
            });
        } catch(e) {}
    }


    // =========================================================
    // 7. CARGAR PRODUCTOS
    // =========================================================
    async function cargarProductos() {
        const grid = document.getElementById('pos-products-grid');
        if (!grid) return;

        try {
            const { data } = await window._supabase
                .from('productos')
                .select(`
                    id, nombre, precio_venta, stock_actual,
                    stock_minimo, activo, destacado, imagen_url,
                    categoria_id, codigo_barra
                `)
                .eq('activo', true)
                .is('deleted_at', null)
                .order('destacado', { ascending: false })
                .order('nombre');

            POS.productos = data || [];
            filtrarProductos();
        } catch(e) {
            grid.innerHTML = `<div class="pos-empty"><p>Error al cargar productos</p></div>`;
        }
    }

    function filtrarProductos(query = '') {
        const grid  = document.getElementById('pos-products-grid');
        const empty = document.getElementById('pos-empty');
        if (!grid) return;

        let lista = POS.productos;

        // Filtro categoria
        if (POS.categoriaActiva !== 'all') {
            lista = lista.filter(p => p.categoria_id === POS.categoriaActiva);
        }

        // Filtro busqueda
        if (query) {
            const q = query.toLowerCase().trim();
            lista = lista.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                (p.codigo_barra && p.codigo_barra.includes(q))
            );
            // Busqueda exacta por codigo: agregar automaticamente si hay un solo resultado
            if (lista.length === 1 && lista[0].codigo_barra === query.trim()) {
                agregarAlCarrito(lista[0]);
                document.getElementById('pos-search').value = '';
                return cargarProductos();
            }
        }

        grid.innerHTML = '';
        toggleVisible(empty, lista.length === 0);

        if (lista.length === 0) {
            const emptyQ = document.getElementById('pos-empty-query');
            if (emptyQ) emptyQ.textContent = query ? `"${query}"` : '';
            return;
        }

        lista.forEach(prod => {
            const card = crearTarjetaProducto(prod);
            grid.appendChild(card);
        });
    }

    function crearTarjetaProducto(prod) {
        const sinStock  = prod.stock_actual <= 0;
        const stockBajo = prod.stock_actual > 0 && prod.stock_actual <= prod.stock_minimo;
        const enCarrito = POS.carrito.find(i => i.id === prod.id);
        const sym       = POS.config.simbolo_moneda || '$';

        const card = document.createElement('div');
        card.className = `product-card${sinStock ? ' sin-stock' : ''}`;
        card.dataset.id = prod.id;
        card.innerHTML = `
            ${enCarrito ? `<div class="product-in-cart-badge">${enCarrito.cantidad}</div>` : ''}
            <div class="product-card-image">
                ${prod.imagen_url
                    ? `<img src="${escapeHtml(prod.imagen_url)}" alt="${escapeHtml(prod.nombre)}" loading="lazy">`
                    : escapeHtml(prod.nombre.slice(0, 2).toUpperCase())
                }
            </div>
            <div class="product-card-name">${escapeHtml(prod.nombre)}</div>
            <div class="product-card-price">${formatCurrency(prod.precio_venta, sym)}</div>
            <div class="product-card-stock ${stockBajo ? 'low' : ''}">
                ${sinStock ? 'Sin stock' : `Stock: ${prod.stock_actual}`}
            </div>`;

        if (!sinStock) {
            card.addEventListener('click', () => {
                agregarAlCarrito(prod);
                // Animar la tarjeta
                card.style.transform = 'scale(0.94)';
                setTimeout(() => card.style.transform = '', 150);
            });
        }

        return card;
    }


    // =========================================================
    // 8. CARRITO
    // =========================================================
    function agregarAlCarrito(prod) {
        if (!POS.cajaAbierta) {
            toastWarning('Debes abrir la caja antes de vender');
            return;
        }

        const existente = POS.carrito.find(i => i.id === prod.id);

        if (existente) {
            if (existente.cantidad >= prod.stock_actual) {
                toastWarning('No hay mas stock disponible');
                return;
            }
            existente.cantidad++;
        } else {
            POS.carrito.push({
                id:            prod.id,
                nombre:        prod.nombre,
                precio:        parseFloat(prod.precio_venta),
                precio_costo:  parseFloat(prod.precio_costo || 0),
                stock:         prod.stock_actual,
                cantidad:      1,
            });
        }

        renderCarrito();
        calcularTotales();
        actualizarBadgesProductos();
    }

    function quitarDelCarrito(prodId) {
        POS.carrito = POS.carrito.filter(i => i.id !== prodId);
        renderCarrito();
        calcularTotales();
        actualizarBadgesProductos();
    }

    function cambiarCantidad(prodId, nuevaCantidad) {
        const item = POS.carrito.find(i => i.id === prodId);
        if (!item) return;

        const qty = parseInt(nuevaCantidad);
        if (isNaN(qty) || qty < 1) {
            quitarDelCarrito(prodId);
            return;
        }
        if (qty > item.stock) {
            toastWarning(`Stock disponible: ${item.stock}`);
            return;
        }
        item.cantidad = qty;
        calcularTotales();
        actualizarBadgesProductos();
    }

    function renderCarrito() {
        const list  = document.getElementById('pos-cart-list');
        const empty = document.getElementById('pos-cart-empty');
        const btnClear  = document.getElementById('btn-clear-cart');
        const btnCobrar = document.getElementById('btn-cobrar');
        const sym   = POS.config.simbolo_moneda || '$';

        if (!list) return;

        toggleVisible(empty, POS.carrito.length === 0);
        if (btnClear)  btnClear.disabled  = POS.carrito.length === 0;
        if (btnCobrar) btnCobrar.disabled = POS.carrito.length === 0 || !POS.cajaAbierta || !POS.metodoPagoId;

        // Limpiar items anteriores (no el empty state)
        list.querySelectorAll('.cart-item').forEach(el => el.remove());

        POS.carrito.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.dataset.id = item.id;
            div.innerHTML = `
                <div class="cart-item-name">${escapeHtml(item.nombre)}</div>
                <div class="cart-item-price">${formatCurrency(item.precio * item.cantidad, sym)}</div>
                <div class="cart-item-controls">
                    <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
                    <input type="number" class="qty-input" value="${item.cantidad}"
                        min="1" max="${item.stock}" data-id="${item.id}">
                    <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" aria-label="Quitar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div class="cart-item-unit-price">${formatCurrency(item.precio, sym)} c/u</div>`;

            list.insertBefore(div, empty);

            // Eventos de la fila
            div.querySelector('[data-action="minus"]').addEventListener('click', () => {
                const nuevo = item.cantidad - 1;
                if (nuevo < 1) quitarDelCarrito(item.id);
                else cambiarCantidad(item.id, nuevo);
                renderCarrito();
            });

            div.querySelector('[data-action="plus"]').addEventListener('click', () => {
                cambiarCantidad(item.id, item.cantidad + 1);
                renderCarrito();
            });

            div.querySelector('.qty-input').addEventListener('change', (e) => {
                cambiarCantidad(item.id, e.target.value);
                renderCarrito();
            });

            div.querySelector('.cart-item-remove').addEventListener('click', () => {
                quitarDelCarrito(item.id);
            });
        });
    }

    function actualizarBadgesProductos() {
        document.querySelectorAll('.product-card').forEach(card => {
            const id    = card.dataset.id;
            const item  = POS.carrito.find(i => i.id === id);
            let badge   = card.querySelector('.product-in-cart-badge');

            if (item) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'product-in-cart-badge';
                    card.appendChild(badge);
                }
                badge.textContent = item.cantidad;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    // Boton limpiar carrito
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
        if (!POS.carrito.length) return;
        confirmPOS('Vaciar carrito', '¿Eliminar todos los productos del carrito?', () => {
            POS.carrito = [];
            POS.descuentoPct = 0;
            resetDescuentos();
            renderCarrito();
            calcularTotales();
            actualizarBadgesProductos();
        });
    });


    // =========================================================
    // 9. TOTALES
    // =========================================================
    function calcularTotales() {
        const sym    = POS.config.simbolo_moneda || '$';
        const ivaPct = parseFloat(POS.config.impuesto_porcentaje) || 0;

        const subtotalBruto = POS.carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
        const descuentoMonto = (subtotalBruto * POS.descuentoPct) / 100;
        const subtotalNeto   = subtotalBruto - descuentoMonto;
        const impuestoMonto  = (subtotalNeto * ivaPct) / 100;
        const total          = subtotalNeto + impuestoMonto;

        setText('#pos-subtotal',  formatCurrency(subtotalBruto, sym));
        setText('#pos-descuento', `-${formatCurrency(descuentoMonto, sym)}`);
        setText('#pos-impuesto',  formatCurrency(impuestoMonto, sym));
        setText('#pos-total',     formatCurrency(total, sym));

        toggleVisible('#pos-descuento-row', descuentoMonto > 0);
        toggleVisible('#pos-impuesto-row',  impuestoMonto > 0);

        // Actualizar boton cobrar
        const btnCobrar = document.getElementById('btn-cobrar');
        const totalLabel = document.getElementById('btn-cobrar-total');
        if (totalLabel) totalLabel.textContent = formatCurrency(total, sym);
        if (btnCobrar) {
            btnCobrar.disabled = POS.carrito.length === 0 || !POS.cajaAbierta || !POS.metodoPagoId;
        }

        // Recalcular vuelto
        calcularVuelto(total);

        return { subtotalBruto, descuentoMonto, subtotalNeto, impuestoMonto, total };
    }

    function calcularVuelto(total) {
        const sym      = POS.config.simbolo_moneda || '$';
        const recibido = parseFloat(document.getElementById('monto-recibido')?.value) || 0;
        const vuelto   = recibido - total;
        const el       = document.getElementById('vuelto-amount');

        if (el) {
            el.textContent = formatCurrency(Math.abs(vuelto), sym);
            el.className   = `vuelto-amount ${vuelto < 0 ? 'negativo' : ''}`;
        }

        return vuelto;
    }


    // =========================================================
    // 10. BUSQUEDA
    // =========================================================
    function setupSearch() {
        const input = document.getElementById('pos-search');
        if (!input) return;

        // ── LECTOR DE CODIGO DE BARRAS ──────────────────────────
        // Los lectores fisicos escriben los caracteres muy rapido
        // (< 50ms entre teclas) y terminan con Enter.
        // Detectamos eso para distinguirlo del tipeo manual.
        let scanBuffer    = '';
        let lastKeyTime   = 0;
        const SCAN_SPEED  = 50;   // ms entre teclas del lector
        const SCAN_MIN    = 3;    // minimo de caracteres para considerar escaneo

        document.addEventListener('keydown', (e) => {
            // Ignorar si el foco esta en otro input que no sea la busqueda
            // (ej: campos de cantidad del carrito, notas, etc.)
            const tag = document.activeElement?.tagName;
            const esInputAjeno = (tag === 'INPUT' || tag === 'TEXTAREA') &&
                                  document.activeElement !== input;
            if (esInputAjeno) return;

            // Ignorar teclas de control
            if (e.key.length > 1 && e.key !== 'Enter') return;

            const ahora = Date.now();
            const delta = ahora - lastKeyTime;
            lastKeyTime = ahora;

            if (e.key === 'Enter') {
                const codigo = scanBuffer.trim();
                scanBuffer = '';

                if (codigo.length >= SCAN_MIN) {
                    // Buscar producto por codigo de barras exacto
                    const prod = POS.productos.find(p => p.codigo_barra === codigo);

                    if (prod) {
                        // Lector encontro el producto: agregar al carrito
                        e.preventDefault();
                        input.value = '';
                        filtrarProductos('');
                        agregarAlCarrito(prod);
                        flashScanner('success');
                        return;
                    }

                    // No encontrado por codigo: buscar por nombre exacto
                    const porNombre = POS.productos.filter(p =>
                        p.nombre.toLowerCase() === codigo.toLowerCase()
                    );
                    if (porNombre.length === 1) {
                        e.preventDefault();
                        input.value = '';
                        filtrarProductos('');
                        agregarAlCarrito(porNombre[0]);
                        flashScanner('success');
                        return;
                    }

                    // No encontrado: mostrar aviso
                    if (delta < SCAN_SPEED * 3) {
                        // Solo si fue un escaneo rapido (no tipeo manual + Enter)
                        flashScanner('error');
                        toastWarning(`Producto no encontrado: ${codigo}`);
                        input.value = '';
                        filtrarProductos('');
                        return;
                    }
                }

                // Enter manual con texto en el input: buscar y agregar si hay uno solo
                const query = input.value.trim();
                if (query) {
                    const found = POS.productos.filter(p =>
                        p.codigo_barra === query ||
                        p.nombre.toLowerCase() === query.toLowerCase()
                    );
                    if (found.length === 1) {
                        agregarAlCarrito(found[0]);
                        input.value = '';
                        filtrarProductos('');
                    }
                }
                return;
            }

            // Acumular en buffer si viene rapido (lector) o si el foco esta en el input
            if (delta < SCAN_SPEED || document.activeElement === input) {
                if (document.activeElement !== input) {
                    // Lector escribiendo fuera del input: redirigir al input
                    input.focus();
                    scanBuffer += e.key;
                    input.value = scanBuffer;
                } else {
                    scanBuffer += e.key;
                }
            } else {
                // Tipeo lento: reiniciar buffer
                scanBuffer = e.key;
            }
        });

        // Busqueda en tiempo real al escribir manualmente
        input.addEventListener('input', debounce(() => {
            filtrarProductos(input.value.trim());
        }, 250));

        // Foco inicial
        input.focus();
    }

    // Flash visual del borde del POS al escanear
    function flashScanner(tipo) {
        const header = document.querySelector('.pos-search-wrapper');
        if (!header) return;
        const color = tipo === 'success' ? '#10B981' : '#EF4444';
        header.style.transition = 'box-shadow 0.1s ease';
        header.style.boxShadow  = `0 0 0 3px ${color}`;
        setTimeout(() => {
            header.style.boxShadow = '';
        }, 400);
    }


    // =========================================================
    // 11. DESCUENTOS
    // =========================================================
    function setupDescuentos() {
        document.querySelectorAll('.descuento-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const pct  = parseFloat(btn.dataset.pct);
                const maxD = parseFloat(POS.config.descuento_maximo) || 100;

                if (pct > maxD) {
                    toastWarning(`El descuento maximo permitido es ${maxD}%`);
                    return;
                }

                // Toggle: si ya esta activo, desactivar
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    POS.descuentoPct = 0;
                } else {
                    document.querySelectorAll('.descuento-chip').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    POS.descuentoPct = pct;
                }

                const customInput = document.getElementById('descuento-custom');
                if (customInput) customInput.value = '';
                calcularTotales();
            });
        });

        const customInput = document.getElementById('descuento-custom');
        customInput?.addEventListener('input', debounce(() => {
            let pct    = parseFloat(customInput.value) || 0;
            const maxD = parseFloat(POS.config.descuento_maximo) || 100;

            if (pct > maxD) {
                pct = maxD;
                customInput.value = maxD;
                toastWarning(`Descuento maximo: ${maxD}%`);
            }

            document.querySelectorAll('.descuento-chip').forEach(b => b.classList.remove('active'));
            POS.descuentoPct = pct;
            calcularTotales();
        }, 400));
    }

    function resetDescuentos() {
        POS.descuentoPct = 0;
        document.querySelectorAll('.descuento-chip').forEach(b => b.classList.remove('active'));
        const customInput = document.getElementById('descuento-custom');
        if (customInput) customInput.value = '';
    }


    // =========================================================
    // 12. METODOS DE PAGO
    // =========================================================
    async function cargarMetodosPago() {
        try {
            const { data } = await window._supabase
                .from('metodos_pago')
                .select('id, nombre')
                .eq('activo', true)
                .order('orden');

            const container = document.getElementById('payment-methods');
            if (!container || !data?.length) return;

            container.innerHTML = '';
            data.forEach(mp => {
                const btn = document.createElement('button');
                btn.className   = 'payment-method-btn';
                btn.dataset.id  = mp.id;
                btn.textContent = mp.nombre;
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    POS.metodoPagoId     = mp.id;
                    POS.metodoPagoNombre = mp.nombre;

                    // Mostrar/ocultar campo vuelto segun metodo
                    const changeSection = document.getElementById('pos-change-section');
                    if (changeSection) {
                        changeSection.style.display = mp.nombre === 'Efectivo' ? 'flex' : 'none';
                    }

                    calcularTotales();
                });
                container.appendChild(btn);
            });

            // Mostrar efectivo por defecto
            const efectivo = data.find(m => m.nombre === 'Efectivo');
            if (efectivo) {
                container.querySelector(`[data-id="${efectivo.id}"]`)?.click();
            }
        } catch(e) {}
    }

    // Campo de monto recibido
    document.getElementById('monto-recibido')?.addEventListener('input', () => {
        const { total } = calcularTotales();
        calcularVuelto(total);
    });


    // =========================================================
    // 13. COBRAR
    // =========================================================
    function setupCobrar() {
        document.getElementById('btn-cobrar')?.addEventListener('click', () => procesarVenta());
    }

    async function procesarVenta() {
        if (!POS.carrito.length) { toastWarning('El carrito esta vacio'); return; }
        if (!POS.cajaAbierta)    { toastWarning('La caja esta cerrada'); return; }
        if (!POS.metodoPagoId)   { toastWarning('Selecciona un metodo de pago'); return; }

        const totales   = calcularTotales();
        const recibido  = parseFloat(document.getElementById('monto-recibido')?.value) || totales.total;
        const vuelto    = recibido - totales.total;

        if (POS.metodoPagoNombre === 'Efectivo' && recibido < totales.total) {
            toastWarning('El monto recibido es menor al total');
            return;
        }

        // Deshabilitar boton para evitar doble click
        const btnCobrar = document.getElementById('btn-cobrar');
        if (btnCobrar) {
            btnCobrar.disabled = true;
            btnCobrar.textContent = 'Procesando...';
        }

        try {
            // Clave de idempotencia: si el cobro se reintenta con el mismo carrito
            // (por ejemplo tras un corte de internet) el servidor devuelve la misma venta
            // en lugar de crear otra. Si el carrito cambia, se genera una clave nueva.
            const items = POS.carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad }));
            const firma = JSON.stringify([items, POS.metodoPagoId, POS.descuentoPct, POS.clienteId]);
            if (!POS.idemKey || POS.idemFirma !== firma) {
                POS.idemKey   = crypto.randomUUID();
                POS.idemFirma = firma;
            }

            // La venta completa (cabecera, detalle, stock y caja) se registra en el servidor
            // en una sola operacion: o se guarda todo o no se guarda nada.
            const { data: res, error: ventaError } = await window._supabase.rpc('crear_venta', {
                p_caja_id:         POS.cajaId,
                p_metodo_pago_id:  POS.metodoPagoId,
                p_items:           items,
                p_cliente_id:      POS.clienteId || null,
                p_descuento_pct:   POS.descuentoPct || 0,
                p_monto_recibido:  POS.metodoPagoNombre === 'Efectivo' ? recibido : null,
                p_idempotency_key: POS.idemKey,
            });

            if (ventaError) throw new Error(ventaError.message || 'No se pudo registrar la venta');

            // Los importes oficiales son los que devuelve el servidor
            const venta = { id: res.id, numero_venta: res.numero_venta };
            totales.subtotalBruto  = res.subtotal;
            totales.descuentoMonto = res.descuento_monto;
            totales.impuestoMonto  = res.impuesto_monto;
            totales.total          = res.total;
            const recibidoFinal    = res.monto_recibido;
            const vueltoFinal      = res.vuelto;

            // Auditoria
            await registrarAuditoria('crear', 'ventas', venta.id,
                `Venta #${venta.numero_venta} por ${formatCurrency(totales.total)}`);

            // Mostrar ticket
            mostrarTicket(venta, totales, recibidoFinal, vueltoFinal);

            // Actualizar saldo de caja en UI
            await cargarCaja();

        } catch(err) {
            // Sin internet: la venta NO se registro. Se puede reintentar sin riesgo de duplicar
            // porque se conserva la misma clave de idempotencia mientras el carrito no cambie.
            const msgErr = String(err?.message || '');
            const sinRed = !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network/i.test(msgErr);
            toastError(sinRed
                ? 'Sin conexion a internet. La venta no se registro: volve a intentar cuando vuelva la conexion.'
                : (msgErr || 'No se pudo procesar la venta'));
            if (btnCobrar) {
                btnCobrar.disabled = false;
                btnCobrar.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    COBRAR <span id="btn-cobrar-total">${formatCurrency(totales.total)}</span>`;
            }
        }
    }


    // =========================================================
    // 14. TICKET
    // =========================================================
    function mostrarTicket(venta, totales, recibido, vuelto) {
        const config    = POS.config;
        const sym       = config.simbolo_moneda || '$';
        const fecha     = new Date();
        const fechaStr  = fecha.toLocaleDateString('es-AR');
        const horaStr   = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const lineas = POS.carrito.map(item =>
            `<div class="ticket-row">
                <span>${escapeHtml(truncate(item.nombre, 22))} x${item.cantidad}</span>
                <span>${formatCurrency(item.precio * item.cantidad, sym)}</span>
            </div>`
        ).join('');

        const ticketHtml = `
        <div class="ticket-container" id="ticket-print">
            <div class="ticket-header">
                <h2>${escapeHtml(config.nombre_negocio || 'Mi Kiosco')}</h2>
                ${config.domicilio ? `<p>${escapeHtml(config.domicilio)}</p>` : ''}
                ${config.cuit ? `<p>CUIT: ${escapeHtml(config.cuit)}</p>` : ''}
                <p>${fechaStr} ${horaStr}</p>
                <p>Venta #${venta.numero_venta}</p>
            </div>
            <div class="ticket-divider"></div>
            ${lineas}
            <div class="ticket-divider"></div>
            <div class="ticket-row"><span>Subtotal</span><span>${formatCurrency(totales.subtotalBruto, sym)}</span></div>
            ${totales.descuentoMonto > 0
                ? `<div class="ticket-row"><span>Descuento (${POS.descuentoPct}%)</span><span>-${formatCurrency(totales.descuentoMonto, sym)}</span></div>`
                : ''}
            ${totales.impuestoMonto > 0
                ? `<div class="ticket-row"><span>IVA (${config.impuesto_porcentaje}%)</span><span>${formatCurrency(totales.impuestoMonto, sym)}</span></div>`
                : ''}
            <div class="ticket-row total"><span>TOTAL</span><span>${formatCurrency(totales.total, sym)}</span></div>
            <div class="ticket-divider"></div>
            <div class="ticket-row"><span>Pago: ${escapeHtml(POS.metodoPagoNombre)}</span></div>
            <div class="ticket-row"><span>Recibido</span><span>${formatCurrency(recibido, sym)}</span></div>
            <div class="ticket-row bold"><span>Vuelto</span><span>${formatCurrency(Math.max(0, vuelto), sym)}</span></div>
            <div class="ticket-divider"></div>
            <div class="ticket-footer">
                ${escapeHtml(config.mensaje_ticket || 'Gracias por su compra')}
            </div>
        </div>`;

        // Mostrar en modal
        const overlay = document.getElementById('modal-venta-overlay');
        const body    = document.getElementById('ticket-preview');
        const title   = document.getElementById('modal-venta-title');

        if (body)  body.innerHTML  = ticketHtml;
        if (title) title.textContent = `Venta #${venta.numero_venta} - ${formatCurrency(totales.total, sym)}`;
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Cerrar modal ticket
    document.getElementById('modal-venta-close')?.addEventListener('click', cerrarTicket);
    document.getElementById('modal-venta-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-venta-overlay')) cerrarTicket();
    });

    // Nueva venta
    document.getElementById('btn-nueva-venta')?.addEventListener('click', nuevaVenta);

    // Imprimir ticket
    // El ticket vive dentro de un modal, y la hoja de estilos general oculta los modales al
    // imprimir (por eso salia la hoja en blanco). Se copia el ticket a un area propia fuera
    // del modal y solo esa area se imprime, en ancho de ticketera (80 mm) y sin encabezados.
    document.getElementById('btn-imprimir-ticket')?.addEventListener('click', imprimirTicket);

    function imprimirTicket() {
        const ticket = document.getElementById('ticket-print');
        if (!ticket) { toastWarning('No hay ticket para imprimir'); return; }

        if (!document.getElementById('print-ticket-style')) {
            const st = document.createElement('style');
            st.id = 'print-ticket-style';
            st.textContent = `
                #print-area { display: none; }
                @media print {
                    @page { size: 80mm auto; margin: 4mm; }
                    body.printing-ticket > *:not(#print-area) { display: none !important; }
                    body.printing-ticket #print-area,
                    body.printing-ticket #print-area * { visibility: visible !important; }
                    body.printing-ticket #print-area { display: block !important; position: static !important; }
                    body.printing-ticket #print-area .ticket-container {
                        position: static !important; width: 100% !important; max-width: 72mm;
                        border: none !important; box-shadow: none !important; margin: 0 auto;
                        color: #000 !important; background: #fff !important;
                    }
                    body.printing-ticket { background: #fff !important; overflow: visible !important; }
                }`;
            document.head.appendChild(st);
        }

        let area = document.getElementById('print-area');
        if (!area) {
            area = document.createElement('div');
            area.id = 'print-area';
            document.body.appendChild(area);
        }
        area.innerHTML = ticket.outerHTML;
        area.firstElementChild?.removeAttribute('id');

        document.body.classList.add('printing-ticket');
        const limpiar = () => {
            document.body.classList.remove('printing-ticket');
            area.innerHTML = '';
            window.removeEventListener('afterprint', limpiar);
        };
        window.addEventListener('afterprint', limpiar);
        window.print();
        setTimeout(limpiar, 1000);   // respaldo si el navegador no dispara afterprint
    }

    function cerrarTicket() {
        const overlay = document.getElementById('modal-venta-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
        nuevaVenta();
    }

    function nuevaVenta() {
        // Resetear estado del POS
        POS.carrito       = [];
        POS.clienteId     = null;
        POS.clienteNombre = '';
        POS.descuentoPct  = 0;
        POS.idemKey       = null;
        POS.idemFirma     = null;

        // Limpiar UI
        renderCarrito();
        resetDescuentos();
        hide('#pos-cliente-badge');
        setText('#btn-cliente-text', 'Cliente');

        const montoInput = document.getElementById('monto-recibido');
        if (montoInput) montoInput.value = '';

        // Restaurar boton COBRAR completamente
        const btnCobrar = document.getElementById('btn-cobrar');
        if (btnCobrar) {
            btnCobrar.disabled = true;
            btnCobrar.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                COBRAR
                <span id="btn-cobrar-total">$0,00</span>`;
        }

        // Cerrar modal ticket
        const overlay = document.getElementById('modal-venta-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';

        // Recalcular totales en cero
        calcularTotales();

        // Recargar productos para reflejar stock actualizado
        cargarProductos();

        // Foco en busqueda
        document.getElementById('pos-search')?.focus();
    }


    // =========================================================
    // 15. CLIENTE
    // =========================================================
    function setupClienteModal() {
        const overlay = document.getElementById('modal-cliente-overlay');
        const closeBtn = document.getElementById('modal-cliente-close');
        const btnCliente = document.getElementById('btn-cliente');
        const searchInput = document.getElementById('cliente-search');

        btnCliente?.addEventListener('click', () => {
            overlay?.classList.add('open');
            document.body.style.overflow = 'hidden';
            buscarClientes('');
            setTimeout(() => searchInput?.focus(), 100);
        });

        closeBtn?.addEventListener('click', () => {
            overlay?.classList.remove('open');
            document.body.style.overflow = '';
        });

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        });

        searchInput?.addEventListener('input', debounce(() => {
            buscarClientes(searchInput.value.trim());
        }, 300));

        document.getElementById('btn-remove-cliente')?.addEventListener('click', () => {
            POS.clienteId    = null;
            POS.clienteNombre = '';
            hide('#pos-cliente-badge');
            setText('#btn-cliente-text', 'Cliente');
        });
    }

    async function buscarClientes(query) {
        const list = document.getElementById('cliente-list');
        if (!list) return;

        list.innerHTML = `<div style="padding:16px;text-align:center"><div class="spinner-sm"></div></div>`;

        try {
            let q = window._supabase
                .from('clientes')
                .select('id, nombre, apellido, dni')
                .eq('activo', true)
                .is('deleted_at', null)
                .order('nombre')
                .limit(20);

            // Cada palabra en nombre, apellido o DNI; se quitan caracteres que rompen el filtro
            String(query || '').replace(/[,()*%\\:."']/g, ' ').split(/\s+/).filter(Boolean).slice(0, 4)
                .forEach(w => { q = q.or(`nombre.ilike.%${w}%,apellido.ilike.%${w}%,dni.ilike.%${w}%`); });

            const { data } = await q;

            if (!data?.length) {
                list.innerHTML = `<div class="empty-state" style="padding:20px"><p>Sin resultados</p></div>`;
                return;
            }

            list.innerHTML = data.map(c => `
                <div class="cliente-item" data-id="${c.id}" data-nombre="${escapeHtml(c.nombre)} ${escapeHtml(c.apellido || '')}">
                    <div class="cliente-item-avatar">${getInitials(c.nombre, c.apellido || '')}</div>
                    <div>
                        <div class="cliente-item-name">${escapeHtml(c.nombre)} ${escapeHtml(c.apellido || '')}</div>
                        ${c.dni ? `<div class="cliente-item-dni">DNI: ${escapeHtml(c.dni)}</div>` : ''}
                    </div>
                </div>`).join('');

            list.querySelectorAll('.cliente-item').forEach(item => {
                item.addEventListener('click', () => {
                    POS.clienteId     = item.dataset.id;
                    POS.clienteNombre = item.dataset.nombre;

                    setText('#pos-cliente-nombre', POS.clienteNombre);
                    setText('#btn-cliente-text', 'Cliente');
                    show('#pos-cliente-badge');

                    document.getElementById('modal-cliente-overlay')?.classList.remove('open');
                    document.body.style.overflow = '';
                });
            });
        } catch(e) {
            list.innerHTML = `<div class="empty-state" style="padding:20px"><p>Error al buscar</p></div>`;
        }
    }


    // =========================================================
    // 16. MODAL CAJA
    // =========================================================
    function setupCajaModal() {
        const info    = document.getElementById('pos-caja-info');
        const alert   = document.getElementById('btn-abrir-caja-alert');
        info?.addEventListener('click',  openCajaModal);
        alert?.addEventListener('click', openCajaModal);
    }

    function openCajaModal() {
        const overlay  = document.getElementById('modal-caja-overlay');
        const title    = document.getElementById('modal-caja-title');
        const body     = document.getElementById('modal-caja-body');
        const footer   = document.getElementById('modal-caja-footer');
        const closeBtn = document.getElementById('modal-caja-close');

        const sym = POS.config.simbolo_moneda || '$';

        if (POS.cajaAbierta) {
            if (title) title.textContent = 'Cerrar caja';
            if (body) body.innerHTML = `
                <div class="alert alert-warning">Una vez cerrada, no podras registrar ventas hasta volver a abrirla.</div>
                <div class="form-group">
                    <label class="form-label">Efectivo contado en caja <span style="font-weight:400;color:var(--color-gray)">(opcional)</span></label>
                    <input type="number" id="pos-contado" class="form-input" placeholder="0.00" min="0" step="0.01">
                    <span class="form-hint" id="pos-esperado-hint">Calculando efectivo esperado...</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Notas de cierre</label>
                    <textarea id="pos-notas-cierre" class="form-textarea" placeholder="Opcional..."></textarea>
                </div>`;
            if (footer) footer.innerHTML = `
                <button class="btn btn-ghost" onclick="closePOSCajaModal()">Cancelar</button>
                <button class="btn btn-danger" id="pos-confirm-cierre">Cerrar caja</button>`;
        } else {
            if (title) title.textContent = 'Abrir caja';
            if (body) body.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Saldo inicial en efectivo</label>
                    <input type="number" id="pos-saldo-apertura" class="form-input"
                        placeholder="0.00" min="0" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Notas de apertura</label>
                    <textarea id="pos-notas-apertura" class="form-textarea" placeholder="Opcional..."></textarea>
                </div>`;
            if (footer) footer.innerHTML = `
                <button class="btn btn-ghost" onclick="closePOSCajaModal()">Cancelar</button>
                <button class="btn btn-success" id="pos-confirm-apertura">Abrir caja</button>`;
        }

        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        closeBtn?.addEventListener('click', closePOSCajaModal, { once: true });
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) closePOSCajaModal();
        }, { once: true });

        // Arqueo: se muestra el efectivo esperado y la diferencia contra lo contado
        if (POS.cajaAbierta) {
            (async () => {
                const hint = document.getElementById('pos-esperado-hint');
                const { data: cj } = await window._supabase
                    .from('cajas').select('saldo_actual').eq('id', POS.cajaId).single();
                const esperado = parseFloat(cj?.saldo_actual || 0);
                const mostrar = () => {
                    const v = document.getElementById('pos-contado')?.value;
                    if (!hint) return;
                    if (v === '' || v == null) {
                        hint.textContent = `Efectivo esperado (fondo inicial + ventas en efectivo): ${formatCurrency(esperado)}`;
                    } else {
                        const dif = Math.round((parseFloat(v) - esperado) * 100) / 100;
                        hint.textContent = `Esperado: ${formatCurrency(esperado)} · Diferencia: ${dif > 0 ? '+' : ''}${formatCurrency(dif)}`;
                    }
                };
                mostrar();
                document.getElementById('pos-contado')?.addEventListener('input', mostrar);
            })();
        }

        // Confirmar apertura
        document.getElementById('pos-confirm-apertura')?.addEventListener('click', async () => {
            const saldo = parseFloat(document.getElementById('pos-saldo-apertura')?.value) || 0;
            const notas = document.getElementById('pos-notas-apertura')?.value.trim();

            const { error } = await window._supabase.from('cajas').update({
                estado:         'abierta',
                saldo_inicial:  saldo,
                saldo_actual:   saldo,
                usuario_id:     AppUser.profile.id,
                fecha_apertura: new Date().toISOString(),
                notas_apertura: notas || null,
                fecha_cierre:   null,
                saldo_contado:  null,
                diferencia:     null,
            }).eq('id', POS.cajaId);

            if (error) { toastError('No se pudo abrir la caja'); return; }

            const { error: movErr } = await window._supabase.from('movimientos_caja').insert({
                caja_id:          POS.cajaId,
                usuario_id:       AppUser.profile.id,
                tipo:             'apertura',
                monto:            saldo,
                saldo_previo:     0,
                saldo_posterior:  saldo,
                descripcion:      'Apertura de caja',
            });
            if (movErr) console.warn('[Apertura] movimiento:', movErr.message);
            await registrarAuditoria('apertura_caja', 'cajas', POS.cajaId, 'Apertura de caja');

            closePOSCajaModal();
            toastSuccess('Caja abierta');
            POS.cajaAbierta = true;
            await cargarCaja();
            calcularTotales();
        });

        // Confirmar cierre
        document.getElementById('pos-confirm-cierre')?.addEventListener('click', async () => {
            const btn = document.getElementById('pos-confirm-cierre');

            // Evitar doble click
            if (btn.disabled) return;
            btn.disabled = true;
            btn.textContent = 'Cerrando...';

            // Verificar que la caja siga abierta antes de ejecutar
            const { data: estadoActual } = await window._supabase
                .from('cajas').select('estado').eq('id', POS.cajaId).single();

            if (estadoActual?.estado !== 'abierta') {
                closePOSCajaModal();
                toastWarning('La caja ya fue cerrada');
                POS.cajaAbierta = false;
                await cargarCaja();
                calcularTotales();
                return;
            }

            // Obtener saldo actual y saldo inicial para calcular solo lo recaudado
            const { data: cajaData } = await window._supabase
                .from('cajas').select('saldo_actual, saldo_inicial').eq('id', POS.cajaId).single();

            const saldoActual  = parseFloat(cajaData?.saldo_actual  || 0);
            const saldoInicial = parseFloat(cajaData?.saldo_inicial || 0);
            const recaudado    = saldoActual - saldoInicial;

            const notas = document.getElementById('pos-notas-cierre')?.value.trim();

            // Arqueo: efectivo contado vs. efectivo esperado
            const contadoRaw = document.getElementById('pos-contado')?.value;
            const contado    = (contadoRaw !== '' && contadoRaw != null && !isNaN(parseFloat(contadoRaw)))
                ? parseFloat(contadoRaw) : null;
            const diferencia = contado === null ? null : Math.round((contado - saldoActual) * 100) / 100;

            const { error } = await window._supabase.from('cajas').update({
                estado:        'cerrada',
                fecha_cierre:  new Date().toISOString(),
                notas_cierre:  notas || null,
                saldo_contado: contado,
                diferencia:    diferencia,
            }).eq('id', POS.cajaId);

            if (error) {
                toastError('No se pudo cerrar la caja');
                btn.disabled = false;
                btn.textContent = 'Cerrar caja';
                return;
            }

            const { error: movErr } = await window._supabase.from('movimientos_caja').insert({
                caja_id:         POS.cajaId,
                usuario_id:      AppUser.profile.id,
                tipo:            'cierre',
                monto:           -recaudado,
                saldo_previo:    saldoActual,
                saldo_posterior: 0,
                descripcion:     `Cierre de caja - Recaudado en efectivo: ${formatCurrency(recaudado)}`,
            });
            if (movErr) console.warn('[Cierre] movimiento:', movErr.message);

            await registrarAuditoria('cierre_caja', 'cajas', POS.cajaId,
                'Cierre de caja' + (diferencia === null ? '' : ` (diferencia ${formatCurrency(diferencia)})`));

            closePOSCajaModal();
            if (diferencia !== null && diferencia !== 0) {
                toastWarning(`Caja cerrada con una diferencia de ${formatCurrency(diferencia)}`);
            } else {
                toastSuccess('Caja cerrada correctamente');
            }
            POS.cajaAbierta = false;
            await cargarCaja();
            calcularTotales();
        });
    }

    function closePOSCajaModal() {
        const overlay = document.getElementById('modal-caja-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.closePOSCajaModal = closePOSCajaModal;


    // =========================================================
    // 17. ATAJOS DE TECLADO
    // =========================================================
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // F2: enfocar busqueda
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('pos-search')?.focus();
            }
            // F10: cobrar
            if (e.key === 'F10') {
                e.preventDefault();
                const btn = document.getElementById('btn-cobrar');
                if (btn && !btn.disabled) btn.click();
            }
            // Escape: limpiar busqueda
            if (e.key === 'Escape') {
                const search = document.getElementById('pos-search');
                if (search) {
                    search.value = '';
                    filtrarProductos('');
                    search.focus();
                }
            }
        });

        // Mantener foco en busqueda cuando se hace click en cualquier
        // parte del panel de productos (no en botones ni inputs)
        document.getElementById('pos-products-grid')?.addEventListener('click', () => {
            setTimeout(() => document.getElementById('pos-search')?.focus(), 50);
        });

        // Si el usuario hace click fuera del carrito, devolver foco al input
        document.addEventListener('click', (e) => {
            const enCarrito = e.target.closest('.pos-right');
            const enModal   = e.target.closest('.modal-overlay');
            const esInput   = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if (!enCarrito && !enModal && !esInput) {
                setTimeout(() => document.getElementById('pos-search')?.focus(), 50);
            }
        });
    }


    // =========================================================
    // 18. CONFIRM INTERNO DEL POS (sin usar modal global)
    // =========================================================
    function confirmPOS(title, message, onConfirm) {
        const body = `<p style="font-size:15px;color:var(--color-dark-3);line-height:1.6">${escapeHtml(message)}</p>`;

        // Usar alert nativo por simplicidad en el POS
        if (window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    }


    // =========================================================
    // 19. RENDER INICIAL DE TOTALES
    // =========================================================
    calcularTotales();

}); // fin DOMContentLoaded
