# 05 · Datos: qué información guarda

Base de datos PostgreSQL en Supabase. Todas las tablas tienen RLS activo. Los identificadores son `uuid`, las fechas son `timestamptz` y los precios son `numeric`.

## Entidades principales

| Tabla | Qué guarda | Campos principales |
|---|---|---|
| `roles` | Tipos de usuario | `id`, `nombre` (`dueno`, `empleado`, `desarrollador`), `descripcion`, `permisos` (jsonb) |
| `usuarios` | Personas que usan el sistema | `id` (igual al de Auth), `rol_id`, `nombre`, `apellido`, `email`, `telefono`, `activo`, `ultimo_login` |
| `configuracion_negocio` | Datos del kiosco | `nombre_negocio`, `cuit`, `domicilio`, `moneda`, `alerta_stock_minimo`, `descuento_maximo`, `mensaje_ticket` |
| `categorias` | Rubros de productos | `id`, `nombre`, `color`, `icono`, `activa`, `orden` |
| `proveedores` | A quién se compra | `razon_social`, `nombre_contacto`, `cuit`, `telefono`, `email`, `activo` |
| `productos` | Mercadería | `codigo_barra`, `codigo_interno`, `nombre`, `precio_costo`, `precio_venta`, `stock_actual`, `stock_minimo`, `categoria_id`, `proveedor_id`, `activo` |
| `clientes` | Clientes registrados | `nombre`, `apellido`, `dni`, `telefono`, `email`, `activo` |
| `metodos_pago` | Formas de cobro | `nombre`, `activo`, `orden` |
| `cajas` | Estado de la caja | `estado` (`abierta`, `cerrada`), `saldo_inicial`, `saldo_actual`, `saldo_contado`, `diferencia`, `usuario_id`, `fecha_apertura`, `fecha_cierre` |
| `ventas` | Cabecera de cada venta | `numero_venta`, `usuario_id`, `caja_id`, `cliente_id`, `metodo_pago_id`, `estado`, `subtotal`, `descuento_monto`, `total`, `monto_recibido`, `vuelto`, `idempotency_key` |
| `detalle_ventas` | Productos de cada venta | `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `precio_costo`, `subtotal` |
| `movimientos_caja` | Entradas y salidas de dinero | `caja_id`, `tipo`, `monto`, `saldo_previo`, `saldo_posterior`, `venta_id` |
| `compras` | Mercadería comprada | `proveedor_id`, `numero_factura`, `estado`, `total`, `fecha_recibida` |
| `detalle_compras` | Productos de cada compra | `compra_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal` |
| `gastos` | Gastos del negocio | `tipo` (`fijo`, `variable`, `extraordinario`), `concepto`, `monto`, `fecha`, `caja_id` |
| `historial_stock` | Cada cambio de stock | `producto_id`, `tipo_movimiento`, `cantidad_antes`, `cantidad_cambio`, `cantidad_despues`, `motivo` |
| `auditoria` | Registro de acciones | `usuario_id`, `tipo`, `tabla`, `registro_id`, `descripcion`, `datos_antes`, `datos_despues` |

## Relaciones clave

- Un `usuario` tiene un `rol`.
- Un `producto` pertenece a una `categoria` y puede tener un `proveedor`.
- Una `venta` ocurre en una `caja`, la hace un `usuario` y tiene muchos `detalle_ventas`.
- Cada venta genera un `historial_stock` por producto; solo las ventas en **efectivo** generan un `movimiento_caja`.

## Tipos enumerados

| Tipo | Valores |
|---|---|
| `rol_tipo` | `dueno`, `empleado`, `desarrollador` |
| `estado_caja` | `abierta`, `cerrada` |
| `estado_venta` | `completada`, `cancelada`, `pendiente` |
| `tipo_movimiento_caja` | `apertura`, `cierre`, `ingreso`, `egreso`, `venta`, `devolucion` |
| `tipo_auditoria` | `login`, `logout`, `crear`, `editar`, `eliminar`, `ver_reporte`, `apertura_caja`, `cierre_caja` |

## Funciones y triggers

| Nombre | Tipo | Qué hace |
|---|---|---|
| `crear_venta` | Función (RPC) | Registra la venta completa en una sola operación, con precios de la base y clave anti-duplicados |
| `cancelar_venta` | Función (RPC) | Solo el dueño, con la caja abierta: devuelve el stock y el efectivo y marca la venta como cancelada |
| `get_costos` | Función (RPC) | Devuelve `precio_costo` solo al dueño |
| `is_dueno`, `is_staff`, `get_user_rol` | Funciones | Ayudantes que usan las políticas de RLS |
| `descontar_stock_venta` | Trigger | Resta stock y registra el historial al vender |
| `registrar_movimiento_venta` | Trigger | Suma a la caja las ventas en efectivo |
| `reponer_stock_compra` | Trigger | Suma stock y actualiza el costo al recibir una compra |
| `cajas_guard`, `ventas_guard_estado` | Triggers | Impiden que un empleado toque saldos o anule ventas por fuera de `cancelar_venta` |

La estructura completa está en `supabase/sql/00-estructura.sql`.

## Reglas de integridad

- `precio_costo`, `precio_venta` y `total` no pueden ser negativos.
- `stock_actual` no puede ser menor que 0.
- `cantidad` de un detalle de venta debe ser mayor que 0.
- Los registros importantes se "borran" con `deleted_at`, sin eliminarlos de la base.

## Ejemplo de datos

```sql
-- Producto de ejemplo (los precios quedan en 0 como marcador)
INSERT INTO productos (codigo_barra, nombre, precio_costo, precio_venta, stock_actual, stock_minimo)
VALUES ('0000000000000', 'Producto de ejemplo', 0, 0, 10, 5);
```

| codigo_barra | nombre | precio_venta | stock_actual | stock_minimo |
|---|---|---|---|---|
| `0000000000000` | Producto de ejemplo | `$ 0` | 10 | 5 |
