# 01 · Contexto: por qué existe Pointer

## Problema

Muchos kioscos llevan las ventas, el stock y la caja en cuadernos o planillas sueltas. Eso trae tres problemas de todos los días:

- No saben cuánta plata tiene que haber en la caja al cerrar.
- Se enteran de que se acabó un producto cuando el cliente lo pide.
- No hay registro de quién hizo qué cuando atienden varias personas.

Además, atender de pie y con apuro exige cargar una venta en pocos segundos.

## Objetivo

Un sistema web que permita **vender rápido con lector de código de barras**, llevar el stock al día, abrir y cerrar la caja con control, y que el dueño vea reportes y un registro de auditoría de lo que pasa en su negocio.

## Público

| Quién | Qué necesita |
|---|---|
| **Dueño del kiosco** | Ver ventas, ganancias, stock bajo, reportes y qué hizo cada empleado |
| **Empleado** | Cargar ventas rápido, cobrar y cerrar su turno sin ver datos sensibles como costos |

Es para kioscos y almacenes chicos, con una o pocas personas atendiendo.

## Servicios del sistema

| Módulo | Qué resuelve |
|---|---|
| Ventas | Cargar productos con el lector, cobrar, calcular el vuelto e imprimir el ticket |
| Stock | Productos, categorías, alertas de stock mínimo e historial de movimientos |
| Caja | Apertura, cierre, ingresos, egresos y saldo |
| Compras y proveedores | Registrar mercadería recibida, que suma al stock |
| Gastos | Anotar gastos fijos, variables y extraordinarios |
| Reportes | Ventas y ganancias por período |
| Auditoría | Registro de quién entró, creó, editó o eliminó algo |

## No incluye (por ahora)

- Facturación electrónica.
- Cobro online o QR integrado.
- Tienda online para clientes.
- Aplicación móvil nativa (se usa desde el navegador).
- Varias sucursales.
