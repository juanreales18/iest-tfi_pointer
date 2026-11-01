-- =====================================================================
-- RE-KIOSCO · ESTRUCTURA COMPLETA DE LA BASE DE DATOS
-- Copia exacta del proyecto "Kiosco Web" (exportada el 16/10/2026)
--
-- Incluye: extensiones, tipos, tablas, restricciones, indices, funciones,
-- vistas, triggers, seguridad por filas (RLS), politicas, permisos
-- y los datos base que el sistema necesita para arrancar.
-- NO incluye: ventas, productos, clientes ni ningun dato de negocio.
--
-- COMO USARLO
--   1) Crear un proyecto NUEVO en Supabase (vacio).
--   2) Abrir SQL Editor, pegar TODO este archivo y ejecutar.
--   3) Seguir los pasos finales del final del archivo (primer dueño,
--      Edge Function y ajustes de Authentication).
-- =====================================================================


-- =====================================================================
-- 1. EXTENSIONES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto    WITH SCHEMA extensions;


-- =====================================================================
-- 2. TIPOS (ENUMS)
-- =====================================================================
CREATE TYPE public.estado_caja AS ENUM ('abierta', 'cerrada');
CREATE TYPE public.estado_compra AS ENUM ('pendiente', 'recibida', 'cancelada');
CREATE TYPE public.estado_venta AS ENUM ('completada', 'cancelada', 'pendiente');
CREATE TYPE public.rol_tipo AS ENUM ('dueno', 'empleado', 'desarrollador');
CREATE TYPE public.tipo_auditoria AS ENUM ('login', 'logout', 'crear', 'editar', 'eliminar', 'ver_reporte', 'apertura_caja', 'cierre_caja');
CREATE TYPE public.tipo_gasto AS ENUM ('fijo', 'variable', 'extraordinario');
CREATE TYPE public.tipo_movimiento_caja AS ENUM ('apertura', 'cierre', 'ingreso', 'egreso', 'venta', 'devolucion');


-- =====================================================================
-- 3. SECUENCIAS
-- =====================================================================
CREATE SEQUENCE public.ventas_numero_venta_seq START WITH 1 INCREMENT BY 1;


-- =====================================================================
-- 4. TABLAS
-- =====================================================================
CREATE TABLE public.roles (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre rol_tipo NOT NULL,
    descripcion text,
    permisos jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    rol_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(30),
    activo boolean DEFAULT true NOT NULL,
    avatar_url text,
    ultimo_login timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.configuracion_negocio (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre_negocio character varying(150) DEFAULT 'Mi Kiosco'::character varying NOT NULL,
    razon_social character varying(200),
    cuit character varying(20),
    domicilio text,
    telefono character varying(30),
    email character varying(255),
    logo_url text,
    moneda character varying(10) DEFAULT 'ARS'::character varying NOT NULL,
    simbolo_moneda character varying(5) DEFAULT '$'::character varying NOT NULL,
    alerta_stock_minimo integer DEFAULT 5 NOT NULL,
    impuesto_porcentaje numeric(5,2) DEFAULT 0.00 NOT NULL,
    mensaje_ticket text DEFAULT 'Gracias por su compra'::text,
    permite_descuentos boolean DEFAULT true NOT NULL,
    descuento_maximo numeric(5,2) DEFAULT 20.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.metodos_pago (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.categorias (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    color character varying(7) DEFAULT '#F59E0B'::character varying,
    icono character varying(50) DEFAULT 'ti-tag'::character varying,
    activa boolean DEFAULT true NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.proveedores (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    razon_social character varying(200) NOT NULL,
    nombre_contacto character varying(100),
    cuit character varying(20),
    telefono character varying(30),
    email character varying(255),
    domicilio text,
    notas text,
    activo boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.productos (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    categoria_id uuid,
    proveedor_id uuid,
    codigo_barra character varying(50),
    codigo_interno character varying(50),
    nombre character varying(200) NOT NULL,
    descripcion text,
    precio_costo numeric(12,2) DEFAULT 0.00 NOT NULL,
    precio_venta numeric(12,2) NOT NULL,
    precio_mayorista numeric(12,2),
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 5 NOT NULL,
    stock_maximo integer,
    unidad_medida character varying(30) DEFAULT 'unidad'::character varying,
    imagen_url text,
    activo boolean DEFAULT true NOT NULL,
    destacado boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.clientes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100),
    dni character varying(20),
    telefono character varying(30),
    email character varying(255),
    domicilio text,
    notas text,
    activo boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.cajas (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    nombre character varying(100) DEFAULT 'Caja Principal'::character varying NOT NULL,
    estado estado_caja DEFAULT 'cerrada'::estado_caja NOT NULL,
    saldo_inicial numeric(12,2) DEFAULT 0.00 NOT NULL,
    saldo_actual numeric(12,2) DEFAULT 0.00 NOT NULL,
    usuario_id uuid,
    fecha_apertura timestamp with time zone,
    fecha_cierre timestamp with time zone,
    notas_apertura text,
    notas_cierre text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    saldo_contado numeric(12,2),
    diferencia numeric(12,2)
);

CREATE TABLE public.ventas (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    numero_venta integer DEFAULT nextval('public.ventas_numero_venta_seq'::regclass) NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid,
    caja_id uuid NOT NULL,
    metodo_pago_id uuid,
    estado estado_venta DEFAULT 'completada'::estado_venta NOT NULL,
    subtotal numeric(12,2) DEFAULT 0.00 NOT NULL,
    descuento_monto numeric(12,2) DEFAULT 0.00 NOT NULL,
    descuento_porcentaje numeric(5,2) DEFAULT 0.00 NOT NULL,
    impuesto_monto numeric(12,2) DEFAULT 0.00 NOT NULL,
    total numeric(12,2) DEFAULT 0.00 NOT NULL,
    monto_recibido numeric(12,2) DEFAULT 0.00 NOT NULL,
    vuelto numeric(12,2) DEFAULT 0.00 NOT NULL,
    notas text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    idempotency_key uuid
);
ALTER SEQUENCE public.ventas_numero_venta_seq OWNED BY public.ventas.numero_venta;

CREATE TABLE public.detalle_ventas (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    venta_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    precio_costo numeric(12,2) DEFAULT 0.00 NOT NULL,
    descuento_monto numeric(12,2) DEFAULT 0.00 NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.movimientos_caja (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    caja_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    venta_id uuid,
    tipo tipo_movimiento_caja NOT NULL,
    monto numeric(12,2) NOT NULL,
    saldo_previo numeric(12,2) DEFAULT 0.00 NOT NULL,
    saldo_posterior numeric(12,2) DEFAULT 0.00 NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.compras (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    proveedor_id uuid,
    usuario_id uuid NOT NULL,
    numero_factura character varying(50),
    estado estado_compra DEFAULT 'pendiente'::estado_compra NOT NULL,
    total numeric(12,2) DEFAULT 0.00 NOT NULL,
    notas text,
    fecha_esperada date,
    fecha_recibida timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.detalle_compras (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    compra_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.gastos (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    caja_id uuid,
    tipo tipo_gasto DEFAULT 'variable'::tipo_gasto NOT NULL,
    concepto character varying(200) NOT NULL,
    descripcion text,
    monto numeric(12,2) NOT NULL,
    fecha date DEFAULT ((now() AT TIME ZONE 'America/Argentina/Buenos_Aires'::text))::date NOT NULL,
    comprobante_url text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.historial_stock (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    producto_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    tipo_movimiento character varying(30) NOT NULL,
    cantidad_antes integer NOT NULL,
    cantidad_cambio integer NOT NULL,
    cantidad_despues integer NOT NULL,
    referencia_id uuid,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.auditoria (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    usuario_id uuid,
    tipo tipo_auditoria NOT NULL,
    tabla character varying(50),
    registro_id uuid,
    descripcion text NOT NULL,
    datos_antes jsonb,
    datos_despues jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- =====================================================================
-- 5. CLAVES PRIMARIAS, UNICAS, CHECKS Y FORANEAS
-- =====================================================================
ALTER TABLE ONLY public.auditoria ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cajas ADD CONSTRAINT cajas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.compras ADD CONSTRAINT compras_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.configuracion_negocio ADD CONSTRAINT configuracion_negocio_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.detalle_compras ADD CONSTRAINT detalle_compras_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.detalle_ventas ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gastos ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.historial_stock ADD CONSTRAINT historial_stock_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.metodos_pago ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.movimientos_caja ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.proveedores ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ventas ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categorias ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.metodos_pago ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_codigo_barra_key UNIQUE (codigo_barra);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_codigo_interno_key UNIQUE (codigo_interno);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);

ALTER TABLE ONLY public.detalle_compras ADD CONSTRAINT cant_compra_positiva CHECK ((cantidad > 0));
ALTER TABLE ONLY public.detalle_ventas ADD CONSTRAINT cantidad_positiva CHECK ((cantidad > 0));
ALTER TABLE ONLY public.detalle_ventas ADD CONSTRAINT subtotal_positivo CHECK ((subtotal >= (0)::numeric));
ALTER TABLE ONLY public.gastos ADD CONSTRAINT gasto_positivo CHECK ((monto > (0)::numeric));
ALTER TABLE ONLY public.movimientos_caja ADD CONSTRAINT monto_no_cero CHECK (((monto <> (0)::numeric) OR (tipo = ANY (ARRAY['apertura'::tipo_movimiento_caja, 'cierre'::tipo_movimiento_caja]))));
ALTER TABLE ONLY public.productos ADD CONSTRAINT precio_costo_positivo CHECK ((precio_costo >= (0)::numeric));
ALTER TABLE ONLY public.productos ADD CONSTRAINT precio_venta_positivo CHECK ((precio_venta >= (0)::numeric));
ALTER TABLE ONLY public.productos ADD CONSTRAINT stock_no_negativo CHECK ((stock_actual >= 0));
ALTER TABLE ONLY public.ventas ADD CONSTRAINT total_positivo CHECK ((total >= (0)::numeric));

ALTER TABLE ONLY public.auditoria ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.cajas ADD CONSTRAINT cajas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.compras ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);
ALTER TABLE ONLY public.compras ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.detalle_compras ADD CONSTRAINT detalle_compras_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalle_compras ADD CONSTRAINT detalle_compras_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);
ALTER TABLE ONLY public.detalle_ventas ADD CONSTRAINT detalle_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);
ALTER TABLE ONLY public.detalle_ventas ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.gastos ADD CONSTRAINT gastos_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.cajas(id);
ALTER TABLE ONLY public.gastos ADD CONSTRAINT gastos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.historial_stock ADD CONSTRAINT historial_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);
ALTER TABLE ONLY public.historial_stock ADD CONSTRAINT historial_stock_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.movimientos_caja ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.cajas(id);
ALTER TABLE ONLY public.movimientos_caja ADD CONSTRAINT movimientos_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.movimientos_caja ADD CONSTRAINT movimientos_caja_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);
ALTER TABLE ONLY public.ventas ADD CONSTRAINT ventas_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.cajas(id);
ALTER TABLE ONLY public.ventas ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);
ALTER TABLE ONLY public.ventas ADD CONSTRAINT ventas_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id);
ALTER TABLE ONLY public.ventas ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


-- =====================================================================
-- 6. INDICES
-- =====================================================================
CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (created_at DESC);
CREATE INDEX idx_auditoria_tabla ON public.auditoria USING btree (tabla);
CREATE INDEX idx_auditoria_tipo ON public.auditoria USING btree (tipo);
CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_id);
CREATE INDEX idx_cajas_estado ON public.cajas USING btree (estado);
CREATE INDEX idx_cajas_usuario ON public.cajas USING btree (usuario_id);
CREATE INDEX idx_categorias_activa ON public.categorias USING btree (activa);
CREATE INDEX idx_categorias_deleted ON public.categorias USING btree (deleted_at);
CREATE UNIQUE INDEX clientes_dni_activos_uq ON public.clientes USING btree (dni) WHERE ((deleted_at IS NULL) AND (dni IS NOT NULL));
CREATE INDEX idx_clientes_activo ON public.clientes USING btree (activo);
CREATE INDEX idx_clientes_deleted ON public.clientes USING btree (deleted_at);
CREATE INDEX idx_compras_deleted ON public.compras USING btree (deleted_at);
CREATE INDEX idx_compras_estado ON public.compras USING btree (estado);
CREATE INDEX idx_compras_fecha ON public.compras USING btree (created_at DESC);
CREATE INDEX idx_compras_proveedor ON public.compras USING btree (proveedor_id);
CREATE INDEX idx_det_compra_id ON public.detalle_compras USING btree (compra_id);
CREATE INDEX idx_det_compra_prod ON public.detalle_compras USING btree (producto_id);
CREATE INDEX idx_detalle_producto ON public.detalle_ventas USING btree (producto_id);
CREATE INDEX idx_detalle_venta ON public.detalle_ventas USING btree (venta_id);
CREATE INDEX idx_gastos_deleted ON public.gastos USING btree (deleted_at);
CREATE INDEX idx_gastos_fecha ON public.gastos USING btree (fecha DESC);
CREATE INDEX idx_gastos_tipo ON public.gastos USING btree (tipo);
CREATE INDEX idx_gastos_usuario ON public.gastos USING btree (usuario_id);
CREATE INDEX idx_hstock_fecha ON public.historial_stock USING btree (created_at DESC);
CREATE INDEX idx_hstock_producto ON public.historial_stock USING btree (producto_id);
CREATE INDEX idx_hstock_tipo ON public.historial_stock USING btree (tipo_movimiento);
CREATE INDEX idx_mov_caja_id ON public.movimientos_caja USING btree (caja_id);
CREATE INDEX idx_mov_fecha ON public.movimientos_caja USING btree (created_at DESC);
CREATE INDEX idx_mov_tipo ON public.movimientos_caja USING btree (tipo);
CREATE INDEX idx_mov_usuario ON public.movimientos_caja USING btree (usuario_id);
CREATE INDEX idx_productos_activo ON public.productos USING btree (activo);
CREATE INDEX idx_productos_categoria ON public.productos USING btree (categoria_id);
CREATE INDEX idx_productos_codigo ON public.productos USING btree (codigo_barra);
CREATE INDEX idx_productos_deleted ON public.productos USING btree (deleted_at);
CREATE INDEX idx_productos_nombre_fts ON public.productos USING gin (to_tsvector('spanish'::regconfig, (nombre)::text));
CREATE INDEX idx_productos_proveedor ON public.productos USING btree (proveedor_id);
CREATE INDEX idx_productos_stock ON public.productos USING btree (stock_actual);
CREATE INDEX idx_proveedores_activo ON public.proveedores USING btree (activo);
CREATE INDEX idx_proveedores_deleted ON public.proveedores USING btree (deleted_at);
CREATE INDEX idx_usuarios_activo ON public.usuarios USING btree (activo);
CREATE INDEX idx_usuarios_deleted ON public.usuarios USING btree (deleted_at);
CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);
CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol_id);
CREATE INDEX idx_ventas_caja ON public.ventas USING btree (caja_id);
CREATE INDEX idx_ventas_cliente ON public.ventas USING btree (cliente_id);
CREATE INDEX idx_ventas_deleted ON public.ventas USING btree (deleted_at);
CREATE INDEX idx_ventas_estado ON public.ventas USING btree (estado);
CREATE INDEX idx_ventas_fecha ON public.ventas USING btree (created_at DESC);
CREATE INDEX idx_ventas_numero ON public.ventas USING btree (numero_venta);
CREATE INDEX idx_ventas_usuario ON public.ventas USING btree (usuario_id);
CREATE UNIQUE INDEX ventas_idempotency_key_uq ON public.ventas USING btree (usuario_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


-- =====================================================================
-- 7. FUNCIONES
-- =====================================================================

-- 7.1 Ayudantes de roles (se usan en las politicas de seguridad)
CREATE OR REPLACE FUNCTION public.is_dueno()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from public.usuarios u
        join public.roles r on r.id = u.rol_id
        where u.id = auth.uid()
          and r.nombre = 'dueno'
          and u.activo = true
          and u.deleted_at is null
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.activo = TRUE AND u.deleted_at IS NULL
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_rol()
 RETURNS rol_tipo
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT r.nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = auth.uid()
    LIMIT 1;
$function$;

-- 7.2 Costos (solo el dueño)
CREATE OR REPLACE FUNCTION public.get_costos(p_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(id uuid, precio_costo numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT public.is_dueno() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    RETURN QUERY
        SELECT p.id, p.precio_costo FROM productos p
        WHERE p.deleted_at IS NULL AND (p_ids IS NULL OR p.id = ANY(p_ids));
END;
$function$;

-- 7.3 updated_at automatico
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 7.4 Descontar stock al vender
CREATE OR REPLACE FUNCTION public.descontar_stock_venta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_stock_antes INTEGER;
BEGIN
    SELECT stock_actual INTO v_stock_antes
    FROM productos WHERE id = NEW.producto_id;

    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad,
        updated_at   = NOW()
    WHERE id = NEW.producto_id;

    INSERT INTO historial_stock (
        producto_id, usuario_id, tipo_movimiento,
        cantidad_antes, cantidad_cambio, cantidad_despues,
        referencia_id, motivo
    )
    SELECT
        NEW.producto_id,
        v.usuario_id,
        'venta',
        v_stock_antes,
        -NEW.cantidad,
        v_stock_antes - NEW.cantidad,
        NEW.venta_id,
        'Venta #' || v.numero_venta::text
    FROM ventas v WHERE v.id = NEW.venta_id;

    RETURN NEW;
END;
$function$;

-- 7.5 Sumar a la caja las ventas en efectivo
CREATE OR REPLACE FUNCTION public.registrar_movimiento_venta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_saldo    numeric(12,2);
    v_efectivo boolean;
BEGIN
    IF NEW.estado = 'completada' THEN
        -- Solo el efectivo entra a la caja; tarjeta, transferencia y QR no.
        SELECT (m.nombre = 'Efectivo') INTO v_efectivo FROM metodos_pago m WHERE m.id = NEW.metodo_pago_id;
        IF COALESCE(v_efectivo, false) THEN
            SELECT saldo_actual INTO v_saldo FROM cajas WHERE id = NEW.caja_id;
            INSERT INTO movimientos_caja (caja_id, usuario_id, venta_id, tipo, monto, saldo_previo, saldo_posterior, descripcion)
            VALUES (NEW.caja_id, NEW.usuario_id, NEW.id, 'venta', NEW.total, v_saldo, v_saldo + NEW.total, 'Venta #' || NEW.numero_venta::text);
            UPDATE cajas SET saldo_actual = saldo_actual + NEW.total, updated_at = NOW() WHERE id = NEW.caja_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 7.6 Reponer stock y costo al recibir una compra
CREATE OR REPLACE FUNCTION public.reponer_stock_compra()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_item record;
    v_antes integer;
BEGIN
    IF NEW.estado = 'recibida' AND OLD.estado = 'pendiente' THEN
        -- Se agrupa por producto: si un producto aparece en dos lineas se suman las dos
        FOR v_item IN
            SELECT dc.producto_id,
                   SUM(dc.cantidad)::integer AS cantidad,
                   (array_agg(dc.precio_unitario ORDER BY dc.created_at DESC))[1] AS precio
            FROM detalle_compras dc
            WHERE dc.compra_id = NEW.id
            GROUP BY dc.producto_id
            ORDER BY dc.producto_id
        LOOP
            SELECT stock_actual INTO v_antes FROM productos WHERE id = v_item.producto_id FOR UPDATE;

            UPDATE productos
            SET stock_actual = stock_actual + v_item.cantidad,
                -- Si la linea no tiene precio, se conserva el costo que tenia el producto
                precio_costo = CASE WHEN v_item.precio > 0 THEN v_item.precio ELSE precio_costo END,
                updated_at   = NOW()
            WHERE id = v_item.producto_id;

            INSERT INTO historial_stock (producto_id, usuario_id, tipo_movimiento,
                cantidad_antes, cantidad_cambio, cantidad_despues, referencia_id, motivo)
            VALUES (v_item.producto_id, COALESCE(auth.uid(), NEW.usuario_id), 'compra',
                v_antes, v_item.cantidad, v_antes + v_item.cantidad, NEW.id,
                'Compra recibida' || COALESCE(' - Factura ' || NEW.numero_factura, ''));
        END LOOP;
    ELSIF NEW.estado = 'recibida' AND OLD.estado = 'cancelada' THEN
        RAISE EXCEPTION 'Una compra cancelada no se puede recibir';
    ELSIF OLD.estado = 'recibida' AND NEW.estado <> 'recibida' THEN
        RAISE EXCEPTION 'Una compra recibida no se puede cambiar de estado';
    END IF;
    RETURN NEW;
END;
$function$;

-- 7.7 Proteccion de la caja (el empleado no puede tocar saldos)
CREATE OR REPLACE FUNCTION public.cajas_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
    if current_user not in ('authenticated', 'anon') or public.is_dueno() then
        return new;
    end if;

    if old.estado = 'abierta' then
        if new.saldo_actual   is distinct from old.saldo_actual
        or new.saldo_inicial  is distinct from old.saldo_inicial
        or new.usuario_id     is distinct from old.usuario_id
        or new.fecha_apertura is distinct from old.fecha_apertura then
            raise exception 'No se puede modificar el saldo ni la apertura de una caja abierta';
        end if;
    else
        if new.estado = 'abierta' then
            if new.saldo_inicial < 0
            or new.saldo_actual is distinct from new.saldo_inicial
            or new.usuario_id   is distinct from auth.uid() then
                raise exception 'Apertura de caja invalida';
            end if;
        elsif new.saldo_actual  is distinct from old.saldo_actual
           or new.saldo_inicial is distinct from old.saldo_inicial then
            raise exception 'No se puede modificar el saldo de una caja cerrada';
        end if;
    end if;

    return new;
end;
$function$;

-- 7.8 Una venta completada solo se anula con cancelar_venta
CREATE OR REPLACE FUNCTION public.ventas_guard_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.estado = 'completada' AND NEW.estado IS DISTINCT FROM OLD.estado
       AND COALESCE(current_setting('app.cancelando', true), '') <> 'on'
       AND current_user IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'Para anular una venta usa la opcion Cancelar venta';
    END IF;
    RETURN NEW;
END;
$function$;

-- 7.9 Registrar una venta completa (atomica, con precios del servidor)
CREATE OR REPLACE FUNCTION public.crear_venta(p_caja_id uuid, p_metodo_pago_id uuid, p_items jsonb, p_cliente_id uuid DEFAULT NULL::uuid, p_descuento_pct numeric DEFAULT 0, p_monto_recibido numeric DEFAULT NULL::numeric, p_idempotency_key uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_uid uuid := auth.uid(); v_cfg record; v_metodo text; v_caja_est estado_caja;
    v_cliente uuid := p_cliente_id; v_venta ventas%ROWTYPE; v_prev ventas%ROWTYPE; v_item record;
    v_subtotal numeric(12,2) := 0; v_desc numeric(12,2); v_neto numeric(12,2); v_imp numeric(12,2);
    v_total numeric(12,2); v_recibido numeric(12,2); v_vuelto numeric(12,2) := 0;
    v_pct numeric := COALESCE(p_descuento_pct, 0); v_agg jsonb; v_qty integer; v_n integer := 0;
BEGIN
    IF v_uid IS NULL OR NOT public.is_staff() THEN RAISE EXCEPTION 'No autorizado'; END IF;
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_prev FROM ventas WHERE usuario_id = v_uid AND idempotency_key = p_idempotency_key;
        IF FOUND THEN
            RETURN jsonb_build_object('id', v_prev.id, 'numero_venta', v_prev.numero_venta,
                'subtotal', v_prev.subtotal, 'descuento_monto', v_prev.descuento_monto,
                'impuesto_monto', v_prev.impuesto_monto, 'total', v_prev.total,
                'monto_recibido', v_prev.monto_recibido, 'vuelto', v_prev.vuelto, 'repetida', true);
        END IF;
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta no tiene productos'; END IF;
    SELECT * INTO v_cfg FROM configuracion_negocio LIMIT 1;
    IF v_pct < 0 OR v_pct > 100 THEN RAISE EXCEPTION 'Descuento invalido'; END IF;
    IF v_pct > 0 AND NOT public.is_dueno() THEN
        IF NOT COALESCE(v_cfg.permite_descuentos, false) THEN RAISE EXCEPTION 'El negocio no permite descuentos'; END IF;
        IF v_pct > COALESCE(v_cfg.descuento_maximo, 0) THEN RAISE EXCEPTION 'El descuento maximo permitido es %', v_cfg.descuento_maximo; END IF;
    END IF;
    SELECT nombre INTO v_metodo FROM metodos_pago WHERE id = p_metodo_pago_id AND activo;
    IF v_metodo IS NULL THEN RAISE EXCEPTION 'Metodo de pago invalido'; END IF;
    SELECT estado INTO v_caja_est FROM cajas WHERE id = p_caja_id FOR UPDATE;
    IF v_caja_est IS DISTINCT FROM 'abierta' THEN RAISE EXCEPTION 'La caja esta cerrada'; END IF;
    IF v_cliente IS NULL THEN
        SELECT id INTO v_cliente FROM clientes WHERE nombre = 'Consumidor' AND apellido = 'Final' LIMIT 1; END IF;
    SELECT jsonb_object_agg(pid, qty) INTO v_agg FROM (
        SELECT e->>'producto_id' AS pid, SUM((e->>'cantidad')::integer) AS qty
        FROM jsonb_array_elements(p_items) e GROUP BY 1) s;
    FOR v_item IN
        SELECT p.id, p.nombre, p.precio_venta, p.stock_actual, p.activo FROM productos p
        WHERE p.id::text IN (SELECT jsonb_object_keys(v_agg)) AND p.deleted_at IS NULL
        ORDER BY p.id FOR UPDATE OF p
    LOOP
        v_qty := (v_agg->>(v_item.id::text))::integer; v_n := v_n + 1;
        IF NOT v_item.activo THEN RAISE EXCEPTION 'El producto "%" no esta activo', v_item.nombre; END IF;
        IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Cantidad invalida para "%"', v_item.nombre; END IF;
        IF v_item.stock_actual < v_qty THEN RAISE EXCEPTION 'Stock insuficiente de "%" (disponible: %)', v_item.nombre, v_item.stock_actual; END IF;
        v_subtotal := v_subtotal + v_item.precio_venta * v_qty;
    END LOOP;
    IF v_n <> (SELECT count(*) FROM jsonb_object_keys(v_agg)) THEN
        RAISE EXCEPTION 'Hay productos que no existen o fueron eliminados'; END IF;
    v_desc := round(v_subtotal * v_pct / 100, 2); v_neto := v_subtotal - v_desc;
    v_imp := round(v_neto * COALESCE(v_cfg.impuesto_porcentaje, 0) / 100, 2); v_total := v_neto + v_imp;
    IF v_metodo = 'Efectivo' THEN
        v_recibido := COALESCE(p_monto_recibido, v_total);
        IF v_recibido < v_total THEN RAISE EXCEPTION 'El monto recibido es menor al total'; END IF;
        v_vuelto := v_recibido - v_total;
    ELSE v_recibido := v_total; END IF;
    INSERT INTO ventas (usuario_id, cliente_id, caja_id, metodo_pago_id, estado, subtotal, descuento_monto,
        descuento_porcentaje, impuesto_monto, total, monto_recibido, vuelto, idempotency_key)
    VALUES (v_uid, v_cliente, p_caja_id, p_metodo_pago_id, 'completada', v_subtotal, v_desc, v_pct, v_imp,
        v_total, v_recibido, v_vuelto, p_idempotency_key) RETURNING * INTO v_venta;
    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, precio_costo, descuento_monto, subtotal)
    SELECT v_venta.id, p.id, (v_agg->>(p.id::text))::integer, p.precio_venta, p.precio_costo, 0,
           p.precio_venta * (v_agg->>(p.id::text))::integer
    FROM productos p WHERE p.id::text IN (SELECT jsonb_object_keys(v_agg));
    RETURN jsonb_build_object('id', v_venta.id, 'numero_venta', v_venta.numero_venta, 'subtotal', v_subtotal,
        'descuento_monto', v_desc, 'impuesto_monto', v_imp, 'total', v_total,
        'monto_recibido', v_recibido, 'vuelto', v_vuelto, 'repetida', false);
END; $function$;

-- 7.10 Cancelar una venta (solo el dueño, con la caja abierta)
CREATE OR REPLACE FUNCTION public.cancelar_venta(p_venta_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_uid      uuid := auth.uid();
    v_venta    ventas%ROWTYPE;
    v_caja     cajas%ROWTYPE;
    v_efectivo boolean;
    v_det      record;
    v_antes    integer;
    v_motivo   text := NULLIF(btrim(COALESCE(p_motivo, '')), '');
BEGIN
    IF v_uid IS NULL OR NOT public.is_dueno() THEN
        RAISE EXCEPTION 'Solo el dueno puede cancelar ventas';
    END IF;

    SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La venta no existe';
    END IF;
    IF v_venta.estado <> 'completada' THEN
        RAISE EXCEPTION 'La venta ya esta %', v_venta.estado;
    END IF;

    -- La plata solo se puede devolver a una caja que sigue abierta
    SELECT * INTO v_caja FROM cajas WHERE id = v_venta.caja_id FOR UPDATE;
    IF v_caja.estado IS DISTINCT FROM 'abierta' THEN
        RAISE EXCEPTION 'No se puede cancelar: la caja de esta venta ya fue cerrada';
    END IF;

    SELECT (m.nombre = 'Efectivo') INTO v_efectivo FROM metodos_pago m WHERE m.id = v_venta.metodo_pago_id;

    -- Devolver el stock (filas bloqueadas por producto, en orden)
    FOR v_det IN
        SELECT d.producto_id, SUM(d.cantidad)::integer AS cantidad
        FROM detalle_ventas d WHERE d.venta_id = v_venta.id
        GROUP BY d.producto_id ORDER BY d.producto_id
    LOOP
        SELECT stock_actual INTO v_antes FROM productos WHERE id = v_det.producto_id FOR UPDATE;
        UPDATE productos SET stock_actual = stock_actual + v_det.cantidad, updated_at = NOW()
        WHERE id = v_det.producto_id;
        INSERT INTO historial_stock (producto_id, usuario_id, tipo_movimiento, cantidad_antes, cantidad_cambio, cantidad_despues, referencia_id, motivo)
        VALUES (v_det.producto_id, v_uid, 'cancelacion', v_antes, v_det.cantidad, v_antes + v_det.cantidad,
                v_venta.id, 'Cancelacion venta #' || v_venta.numero_venta::text);
    END LOOP;

    -- Sacar el efectivo de la caja
    IF COALESCE(v_efectivo, false) AND v_venta.total > 0 THEN
        INSERT INTO movimientos_caja (caja_id, usuario_id, venta_id, tipo, monto, saldo_previo, saldo_posterior, descripcion)
        VALUES (v_venta.caja_id, v_uid, v_venta.id, 'devolucion', -v_venta.total,
                v_caja.saldo_actual, v_caja.saldo_actual - v_venta.total,
                'Cancelacion venta #' || v_venta.numero_venta::text);
        UPDATE cajas SET saldo_actual = saldo_actual - v_venta.total, updated_at = NOW()
        WHERE id = v_venta.caja_id;
    END IF;

    PERFORM set_config('app.cancelando', 'on', true);
    UPDATE ventas
    SET estado = 'cancelada',
        notas  = btrim(COALESCE(notas, '') || ' [Cancelada: ' || COALESCE(v_motivo, 'sin motivo') || ']'),
        updated_at = NOW()
    WHERE id = v_venta.id;

    INSERT INTO auditoria (usuario_id, tipo, tabla, registro_id, descripcion, datos_antes, datos_despues)
    VALUES (v_uid, 'editar', 'ventas', v_venta.id,
            'Cancelacion de venta #' || v_venta.numero_venta::text || ' por ' || v_venta.total::text
              || COALESCE(' - ' || v_motivo, ''),
            jsonb_build_object('estado', 'completada', 'total', v_venta.total),
            jsonb_build_object('estado', 'cancelada', 'efectivo_devuelto', COALESCE(v_efectivo, false)));

    RETURN jsonb_build_object('id', v_venta.id, 'numero_venta', v_venta.numero_venta,
                              'total', v_venta.total, 'efectivo_devuelto', COALESCE(v_efectivo, false));
END;
$function$;


-- =====================================================================
-- 8. VISTAS
-- =====================================================================
CREATE VIEW public.v_productos_mas_vendidos WITH (security_invoker = true) AS
 SELECT p.id,
    p.nombre,
    p.codigo_barra,
    sum(dv.cantidad) AS unidades_vendidas,
    sum(dv.subtotal) AS monto_total,
    count(DISTINCT dv.venta_id) AS cantidad_ventas
   FROM detalle_ventas dv
     JOIN productos p ON p.id = dv.producto_id
     JOIN ventas v ON v.id = dv.venta_id
  WHERE v.estado = 'completada'::estado_venta AND v.deleted_at IS NULL
  GROUP BY p.id, p.nombre, p.codigo_barra
  ORDER BY (sum(dv.cantidad)) DESC;

CREATE VIEW public.v_stock_bajo WITH (security_invoker = true) AS
 SELECT p.id,
    p.nombre,
    p.codigo_barra,
    p.stock_actual,
    p.stock_minimo,
    c.nombre AS categoria
   FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.stock_actual <= p.stock_minimo AND p.activo = true AND p.deleted_at IS NULL
  ORDER BY p.stock_actual;

CREATE VIEW public.v_ventas_hoy WITH (security_invoker = true) AS
 SELECT count(*) AS cantidad_ventas,
    sum(total) AS total_ventas,
    sum(descuento_monto) AS total_descuentos,
    avg(total) AS ticket_promedio,
    max(total) AS venta_maxima
   FROM ventas
  WHERE (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'::text)::date = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires'::text)::date AND estado = 'completada'::estado_venta AND deleted_at IS NULL;


-- =====================================================================
-- 9. TRIGGERS
-- =====================================================================
CREATE TRIGGER trg_cajas_guard BEFORE UPDATE ON public.cajas FOR EACH ROW EXECUTE FUNCTION public.cajas_guard();
CREATE TRIGGER trg_cajas_updated_at BEFORE UPDATE ON public.cajas FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_compras_updated_at BEFORE UPDATE ON public.compras FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_stock_compra AFTER UPDATE OF estado ON public.compras FOR EACH ROW EXECUTE FUNCTION public.reponer_stock_compra();
CREATE TRIGGER trg_config_updated_at BEFORE UPDATE ON public.configuracion_negocio FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_stock_venta AFTER INSERT ON public.detalle_ventas FOR EACH ROW EXECUTE FUNCTION public.descontar_stock_venta();
CREATE TRIGGER trg_gastos_updated_at BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER trg_movimiento_venta AFTER INSERT ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.registrar_movimiento_venta();
CREATE TRIGGER trg_ventas_guard_estado BEFORE UPDATE ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.ventas_guard_estado();
CREATE TRIGGER trg_ventas_updated_at BEFORE UPDATE ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


-- =====================================================================
-- 10. SEGURIDAD POR FILAS (RLS)
-- =====================================================================
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- 11. POLITICAS
-- (las ventas y su detalle NO tienen politica de INSERT: se crean solo
--  con la funcion crear_venta)
-- =====================================================================
CREATE POLICY auditoria_insert_staff ON public.auditoria AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK ((is_staff() AND (usuario_id = auth.uid())));
CREATE POLICY auditoria_select_dueno ON public.auditoria AS PERMISSIVE FOR SELECT TO public
    USING (is_dueno());

CREATE POLICY cajas_delete_dueno ON public.cajas AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY cajas_insert_dueno ON public.cajas AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_dueno());
CREATE POLICY cajas_select_staff ON public.cajas AS PERMISSIVE FOR SELECT TO public
    USING (is_staff());
CREATE POLICY cajas_update_staff ON public.cajas AS PERMISSIVE FOR UPDATE TO public
    USING (is_staff());

CREATE POLICY categorias_delete_dueno ON public.categorias AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY categorias_insert_dueno ON public.categorias AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_dueno());
CREATE POLICY categorias_select_staff ON public.categorias AS PERMISSIVE FOR SELECT TO public
    USING (is_staff());
CREATE POLICY categorias_update_dueno ON public.categorias AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());

CREATE POLICY clientes_delete_dueno ON public.clientes AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY clientes_insert_staff ON public.clientes AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_staff());
CREATE POLICY clientes_select_staff ON public.clientes AS PERMISSIVE FOR SELECT TO public
    USING ((is_staff() AND (deleted_at IS NULL)));
CREATE POLICY clientes_update_dueno ON public.clientes AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());

CREATE POLICY compras_all_dueno ON public.compras AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY compras_select_dueno ON public.compras AS PERMISSIVE FOR SELECT TO public
    USING ((is_dueno() AND (deleted_at IS NULL)));

CREATE POLICY config_insert_dueno ON public.configuracion_negocio AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_dueno());
CREATE POLICY config_select_staff ON public.configuracion_negocio AS PERMISSIVE FOR SELECT TO public
    USING (is_staff());
CREATE POLICY config_update_dueno ON public.configuracion_negocio AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());

CREATE POLICY det_compras_all_dueno ON public.detalle_compras AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY det_compras_select_dueno ON public.detalle_compras AS PERMISSIVE FOR SELECT TO public
    USING (is_dueno());

CREATE POLICY detalle_ventas_delete_dueno ON public.detalle_ventas AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY detalle_ventas_select_dueno ON public.detalle_ventas AS PERMISSIVE FOR SELECT TO public
    USING (is_dueno());
-- (No se copia "detalle_ventas_select_empleado": el empleado no debe ver
--  el detalle con costos. Es lo que hacia el script 3b_ocultar_costos.)

CREATE POLICY gastos_all_dueno ON public.gastos AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY gastos_select_dueno ON public.gastos AS PERMISSIVE FOR SELECT TO public
    USING ((is_dueno() AND (deleted_at IS NULL)));

CREATE POLICY hstock_insert_system ON public.historial_stock AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK ((is_dueno() AND (usuario_id = auth.uid())));
CREATE POLICY hstock_select_dueno ON public.historial_stock AS PERMISSIVE FOR SELECT TO public
    USING (is_dueno());

CREATE POLICY metodos_all_dueno ON public.metodos_pago AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY metodos_select_staff ON public.metodos_pago AS PERMISSIVE FOR SELECT TO public
    USING (is_staff());

CREATE POLICY mov_caja_insert_staff ON public.movimientos_caja AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK ((is_dueno() OR (is_staff() AND (usuario_id = auth.uid()) AND (tipo = ANY (ARRAY['apertura'::tipo_movimiento_caja, 'cierre'::tipo_movimiento_caja])))));
CREATE POLICY mov_caja_select_dueno ON public.movimientos_caja AS PERMISSIVE FOR SELECT TO public
    USING (is_dueno());
CREATE POLICY mov_caja_select_empleado ON public.movimientos_caja AS PERMISSIVE FOR SELECT TO public
    USING (((NOT is_dueno()) AND (usuario_id = auth.uid())));

CREATE POLICY productos_delete_dueno ON public.productos AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY productos_insert_dueno ON public.productos AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_dueno());
CREATE POLICY productos_select_staff ON public.productos AS PERMISSIVE FOR SELECT TO public
    USING ((is_staff() AND (deleted_at IS NULL)));
CREATE POLICY productos_update_dueno ON public.productos AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());

CREATE POLICY proveedores_all_dueno ON public.proveedores AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY proveedores_select_dueno ON public.proveedores AS PERMISSIVE FOR SELECT TO public
    USING ((is_dueno() AND (deleted_at IS NULL)));

CREATE POLICY roles_all_dueno ON public.roles AS PERMISSIVE FOR ALL TO public
    USING (is_dueno());
CREATE POLICY roles_select_staff ON public.roles AS PERMISSIVE FOR SELECT TO public
    USING (is_staff());

CREATE POLICY usuarios_delete_dueno ON public.usuarios AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY usuarios_insert_dueno ON public.usuarios AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (is_dueno());
CREATE POLICY usuarios_select_self ON public.usuarios AS PERMISSIVE FOR SELECT TO public
    USING (((id = auth.uid()) OR is_dueno()));
CREATE POLICY usuarios_update_dueno ON public.usuarios AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());

CREATE POLICY ventas_delete_dueno ON public.ventas AS PERMISSIVE FOR DELETE TO public
    USING (is_dueno());
CREATE POLICY ventas_select_dueno ON public.ventas AS PERMISSIVE FOR SELECT TO public
    USING ((is_dueno() AND (deleted_at IS NULL)));
CREATE POLICY ventas_select_empleado ON public.ventas AS PERMISSIVE FOR SELECT TO public
    USING (((NOT is_dueno()) AND (usuario_id = auth.uid()) AND (((created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'::text))::date = ((now() AT TIME ZONE 'America/Argentina/Buenos_Aires'::text))::date) AND (deleted_at IS NULL)));
CREATE POLICY ventas_update_dueno ON public.ventas AS PERMISSIVE FOR UPDATE TO public
    USING (is_dueno());


-- =====================================================================
-- 12. PERMISOS
-- =====================================================================

-- 12.1 Tablas: sin acceso para visitantes sin sesion (anon)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Las vistas son solo de lectura
REVOKE INSERT, UPDATE, DELETE ON public.v_productos_mas_vendidos, public.v_stock_bajo, public.v_ventas_hoy FROM authenticated;

-- 12.2 El costo de los productos solo lo ve el dueño (via get_costos)
REVOKE SELECT ON public.productos FROM authenticated;
GRANT SELECT (id, categoria_id, proveedor_id, codigo_barra, codigo_interno, nombre, descripcion,
              precio_venta, precio_mayorista, stock_actual, stock_minimo, stock_maximo,
              unidad_medida, imagen_url, activo, destacado, deleted_at, created_at, updated_at)
    ON public.productos TO authenticated;

-- 12.3 Secuencia
REVOKE ALL ON SEQUENCE public.ventas_numero_venta_seq FROM anon;
GRANT USAGE, SELECT ON SEQUENCE public.ventas_numero_venta_seq TO authenticated, service_role;

-- 12.4 Funciones: nada ejecutable sin sesion
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_dueno()     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff()     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_costos(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crear_venta(uuid, uuid, jsonb, uuid, numeric, numeric, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_venta(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trigger_set_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ventas_guard_estado()    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cajas_guard()                TO service_role;
GRANT EXECUTE ON FUNCTION public.descontar_stock_venta()      TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_movimiento_venta() TO service_role;
GRANT EXECUTE ON FUNCTION public.reponer_stock_compra()       TO service_role;

-- 12.5 Lo que se cree en el futuro tampoco queda abierto a anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;


-- =====================================================================
-- 13. DATOS BASE (lo minimo para que el sistema arranque)
-- =====================================================================
INSERT INTO public.roles (nombre, descripcion, permisos) VALUES
('dueno', 'Acceso total al sistema',
 '{"ver_reportes": true, "ver_auditoria": true, "cambiar_precios": true, "editar_productos": true, "gestionar_gastos": true, "ver_estadisticas": true, "exportar_reportes": true, "gestionar_compras": true, "configurar_sistema": true, "eliminar_registros": true, "administrar_usuarios": true, "gestionar_proveedores": true}'::jsonb),
('empleado', 'Solo puede registrar ventas y operar la caja',
 '{"ver_reportes": false, "ver_auditoria": false, "cambiar_precios": false, "editar_productos": false, "gestionar_gastos": false, "ver_estadisticas": false, "exportar_reportes": false, "gestionar_compras": false, "configurar_sistema": false, "eliminar_registros": false, "administrar_usuarios": false, "gestionar_proveedores": false}'::jsonb),
('desarrollador', 'Rol de desarrollo con acceso total para pruebas', '{}'::jsonb);

INSERT INTO public.metodos_pago (nombre, activo, orden) VALUES
('Efectivo',        true,  1),
('Debito',          true,  2),
('Credito',         true,  3),
('Transferencia',   true,  4),
('Mercado Pago QR', false, 5),
('Vale / Cuenta',   true,  6);

INSERT INTO public.configuracion_negocio
    (nombre_negocio, simbolo_moneda, moneda, alerta_stock_minimo, impuesto_porcentaje,
     mensaje_ticket, permite_descuentos, descuento_maximo)
VALUES ('Mi Kiosco', '$', 'ARS', 5, 0, 'Gracias por su compra', true, 20);

INSERT INTO public.cajas (nombre, estado, saldo_inicial, saldo_actual)
VALUES ('Caja Principal', 'cerrada', 0, 0);

INSERT INTO public.clientes (nombre, apellido, activo)
VALUES ('Consumidor', 'Final', true);


-- =====================================================================
-- 14. VERIFICACION (deberia dar: tablas 17, vistas 3, funciones 12,
--     roles 3, metodos 6, cajas 1, clientes 1, costo_visible = false)
-- =====================================================================
SELECT
    (SELECT count(*) FROM pg_tables WHERE schemaname = 'public')                 AS tablas,
    (SELECT count(*) FROM pg_views  WHERE schemaname = 'public')                 AS vistas,
    (SELECT count(*) FROM pg_proc   WHERE pronamespace = 'public'::regnamespace) AS funciones,
    (SELECT count(*) FROM public.roles)        AS roles,
    (SELECT count(*) FROM public.metodos_pago) AS metodos,
    (SELECT count(*) FROM public.cajas)        AS cajas,
    (SELECT count(*) FROM public.clientes)     AS clientes,
    has_column_privilege('authenticated', 'public.productos', 'precio_costo', 'select') AS costo_visible;


-- =====================================================================
-- 15. PASOS FINALES (fuera de este SQL)
-- =====================================================================
-- A) PRIMER DUEÑO
--    1. Supabase → Authentication → Users → "Add user" → "Create new user".
--       Poné el email y la contraseña del dueño y marcá "Auto Confirm User".
--    2. Copiá el "User UID" que aparece y ejecutá (reemplazando los datos):
--
--    INSERT INTO public.usuarios (id, rol_id, nombre, apellido, email)
--    SELECT 'PEGAR-ACA-EL-USER-UID', id, 'Nombre', 'Apellido', 'email@del-dueno.com'
--    FROM public.roles WHERE nombre = 'dueno';
--
--    Los demas usuarios (empleados) se crean despues desde la pantalla
--    Usuarios del sistema.
--
-- B) EDGE FUNCTION "crear-usuario" (la usa la pantalla Usuarios)
--    Supabase → Edge Functions → "Deploy a new function" → "Via Editor",
--    nombre exacto: crear-usuario, pegar el archivo crear-usuario.ts y
--    dejar activado "Verify JWT". No hace falta cargar secretos.
--
-- C) AUTHENTICATION
--    - Sign In / Providers: desactivar "Allow new users to sign up".
--    - Activar "Leaked password protection" si tu plan lo permite.
--
-- D) FRONTEND
--    En js/config.js cambiar la URL y la clave publica (anon / publishable)
--    por las del proyecto nuevo (Project Settings → API).
--    Si usas licencias, cambiar tambien la clave de licencia en los HTML.
-- =====================================================================
