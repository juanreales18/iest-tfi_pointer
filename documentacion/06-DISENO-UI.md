# 06 · Diseño UI: la marca en pantalla

La interfaz usa la paleta y tipografías definidas en `IDENTIDAD-MARCA.md`: fondo claro, barra lateral oscura y amarillo `#F59E0B` solo para lo importante.

## Pantallas

| Pantalla | Quién la ve | Qué muestra |
|---|---|---|
| Login | Todos | Panel oscuro con la marca a la izquierda y el formulario a la derecha |
| Inicio | Todos | Tarjetas con ventas del día, estado de caja y productos con stock bajo |
| Nueva venta | Dueño y empleado | Campo del lector, lista de la venta, total, método de pago y vuelto |
| Historial de ventas | Dueño y empleado | Tabla de ventas con estado y método de pago |
| Productos | Dueño (el empleado ve sin costos) | Tabla con búsqueda, filtros y stock |
| Categorías | Dueño | Lista con color e ícono |
| Caja | Dueño y empleado | Estado, saldo y movimientos |
| Clientes y proveedores | Dueño | Listados con alta y edición |
| Compras y gastos | Dueño | Registro de mercadería recibida y gastos |
| Reportes | Dueño | Barras simples de ventas y ganancias por período |
| Auditoría | Dueño | Tabla con quién hizo qué y cuándo |
| Usuarios y configuración | Dueño | Alta de empleados y datos del negocio |

## Cómo se aplica la identidad

| Componente | Estilo |
|---|---|
| Fondo de la app | `--color-bg` (Gris niebla) |
| Barra lateral | Fondo `--color-dark-2`; ítem activo en amarillo con una marca a la izquierda |
| Botón principal | Fondo `--color-primary`, texto `--color-dark`, esquinas de 8 px |
| Botón de hover | `--color-primary-dark` |
| Tarjetas y tablas | Fondo blanco, borde `--color-border`, esquinas de 12 px |
| Encabezado de tabla | Fondo `--color-dark`, texto amarillo, Barlow Condensed en mayúsculas |
| Fila de tabla al pasar el mouse | `--color-primary-light` |
| Títulos de página | Barlow Condensed ExtraBold, mayúsculas, color `--color-dark` |
| Formularios | Borde gris; al enfocar, borde amarillo con halo suave |
| Estados | Verde (éxito), rojo (peligro) y azul (información): solo avisan |
| Mensajes (toast) | Fondo oscuro con borde de color según el tipo |

```css
/* Botón principal */
.btn-primary {
    background: var(--color-primary);
    color: var(--color-dark);
    border-radius: var(--radius-md);
}
.btn-primary:hover {
    background: var(--color-primary-dark);
}
```

## Reglas de diseño

- El texto sobre amarillo es siempre oscuro, nunca blanco.
- Los botones de la pantalla de venta son grandes, porque se usan de pie y con apuro.
- En celular la barra lateral se oculta y se abre con un botón de menú.
- Las tablas se pueden desplazar horizontalmente en pantallas chicas.
