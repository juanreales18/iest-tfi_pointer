-- =============================================================
-- Re-Kiosco · REINICIO TOTAL (dejar el sistema como nuevo)
--
-- BORRA: ventas, cajas (movimientos), compras, gastos, proveedores,
--        productos, categorias, clientes, historial de stock y auditoria.
-- CONSERVA: usuarios (dueño y empleados), roles, metodos de pago,
--        configuracion del negocio, el cliente "Consumidor Final"
--        y la fila de la caja (queda cerrada y en $0).
--
-- Uso: copiar todo en el SQL Editor de Supabase y ejecutar.
-- Se puede usar las veces que haga falta (antes y despues de la capacitacion).
-- ES IRREVERSIBLE una vez hecho el COMMIT.
-- =============================================================
BEGIN;

-- 1) Ventas y caja
DELETE FROM movimientos_caja;
DELETE FROM detalle_ventas;
DELETE FROM ventas;

-- 2) Compras y gastos
DELETE FROM detalle_compras;
DELETE FROM compras;
DELETE FROM gastos;

-- 3) Stock, productos, categorias y proveedores
DELETE FROM historial_stock;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM proveedores;

-- 4) Clientes (se conserva solo Consumidor Final)
DELETE FROM clientes
WHERE NOT (lower(nombre) = 'consumidor' AND lower(coalesce(apellido, '')) = 'final');

-- Si por algun motivo no existe Consumidor Final, se crea
INSERT INTO clientes (nombre, apellido, activo)
SELECT 'Consumidor', 'Final', true
WHERE NOT EXISTS (
    SELECT 1 FROM clientes
    WHERE lower(nombre) = 'consumidor' AND lower(coalesce(apellido, '')) = 'final'
);
UPDATE clientes SET activo = true, deleted_at = NULL
WHERE lower(nombre) = 'consumidor' AND lower(apellido) = 'final';

-- 5) Registro de auditoria
DELETE FROM auditoria;

-- 6) Caja: no se borra (el sistema la necesita), se deja cerrada y en cero
UPDATE cajas SET
    estado         = 'cerrada',
    saldo_inicial  = 0,
    saldo_actual   = 0,
    usuario_id     = NULL,
    fecha_apertura = NULL,
    fecha_cierre   = NULL,
    notas_apertura = NULL,
    notas_cierre   = NULL,
    saldo_contado  = NULL,
    diferencia     = NULL;

-- 7) La proxima venta vuelve a ser la N° 1
ALTER SEQUENCE public.ventas_numero_venta_seq RESTART WITH 1;

-- 8) Verificacion: todo en 0, salvo cajas = 1, clientes = 1 (Consumidor Final),
--    y los usuarios / metodos de pago que tengas.
SELECT
    (SELECT count(*) FROM ventas)           AS ventas,
    (SELECT count(*) FROM movimientos_caja) AS movimientos_caja,
    (SELECT count(*) FROM compras)          AS compras,
    (SELECT count(*) FROM gastos)           AS gastos,
    (SELECT count(*) FROM productos)        AS productos,
    (SELECT count(*) FROM categorias)       AS categorias,
    (SELECT count(*) FROM proveedores)      AS proveedores,
    (SELECT count(*) FROM historial_stock)  AS historial_stock,
    (SELECT count(*) FROM auditoria)        AS auditoria,
    (SELECT count(*) FROM clientes)         AS clientes,
    (SELECT count(*) FROM cajas)            AS cajas,
    (SELECT estado::text || ' / $' || saldo_actual FROM cajas LIMIT 1) AS estado_caja,
    (SELECT count(*) FROM usuarios)         AS usuarios,
    (SELECT count(*) FROM metodos_pago WHERE activo) AS metodos_pago_activos;

COMMIT;
-- Si en la verificacion ves algo raro, en vez de COMMIT ejecuta ROLLBACK;
-- y no se borra nada.


-- =============================================================
-- OPCIONAL: borrar un usuario de prueba (por ejemplo, el empleado de prueba)
-- No se hace aca: andá a Supabase → Authentication → Users, buscá el email
-- y elegí "Delete user". Eso borra el acceso y su perfil.
-- Si ese usuario ya hizo ventas que no borraste, Supabase no lo va a dejar
-- borrar: en ese caso desactivalo desde la pantalla Usuarios del sistema.
-- =============================================================
