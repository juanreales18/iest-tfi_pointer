-- =============================================================
-- Re-Kiosco · Ocultar precio_costo a los empleados
-- EJECUTAR SOLO DESPUES de subir a Netlify el nuevo products.js
-- (y de que get_costos() exista, ya creada).
-- =============================================================

-- 1) Nadie puede leer productos.precio_costo directo de la tabla.
--    El dueño lo obtiene con la funcion get_costos().
REVOKE SELECT ON public.productos FROM authenticated, anon;
GRANT SELECT (
    id, categoria_id, proveedor_id, codigo_barra, codigo_interno, nombre, descripcion,
    precio_venta, precio_mayorista, stock_actual, stock_minimo, stock_maximo,
    unidad_medida, imagen_url, activo, destacado, deleted_at, created_at, updated_at
) ON public.productos TO authenticated;

-- 2) Los empleados ya no leen detalle_ventas (ahi tambien viaja el costo).
--    Ninguna pantalla de empleado lo usa; los reportes son solo del dueño.
DROP POLICY IF EXISTS detalle_ventas_select_empleado ON public.detalle_ventas;

-- -------------------------------------------------------------
-- VERIFICACION (debe dar: sin_costo = false para authenticated, y las demas true)
-- -------------------------------------------------------------
-- select has_column_privilege('authenticated','public.productos','precio_costo','select') as costo_visible,
--        has_column_privilege('authenticated','public.productos','precio_venta','select') as precio_visible;

-- -------------------------------------------------------------
-- PARA DESHACER (si algo falla):
-- -------------------------------------------------------------
-- GRANT SELECT ON public.productos TO authenticated;
-- CREATE POLICY detalle_ventas_select_empleado ON public.detalle_ventas FOR SELECT USING (
--   (NOT is_dueno()) AND EXISTS (SELECT 1 FROM ventas v WHERE v.id = detalle_ventas.venta_id
--   AND v.usuario_id = auth.uid()
--   AND ((v.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)));
