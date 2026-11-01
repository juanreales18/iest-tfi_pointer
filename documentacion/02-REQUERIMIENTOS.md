# 02 · Requerimientos: qué tiene que hacer

## Requerimientos funcionales

| ID | Requerimiento funcional | Prioridad |
|---|---|---|
| RF01 | Iniciar sesión con email y contraseña | Alta |
| RF02 | Roles `dueno` y `empleado` con permisos distintos | Alta |
| RF03 | Abrir y cerrar la caja con saldo inicial y notas | Alta |
| RF04 | Registrar una venta escaneando el código de barras | Alta |
| RF05 | Buscar un producto por nombre o código | Alta |
| RF06 | Elegir método de pago y calcular el vuelto | Alta |
| RF07 | Imprimir el ticket de la venta | Media |
| RF08 | Alta, edición y baja de productos con stock mínimo y alerta | Alta |
| RF09 | Administrar categorías de productos | Media |
| RF10 | Registrar clientes, asociarlos a una venta y ver su historial de compras | Baja |
| RF11 | Registrar proveedores y compras que suman stock | Media |
| RF12 | Registrar gastos | Media |
| RF13 | Ver el historial de ventas y cancelar una venta (devuelve stock y efectivo) | Media |
| RF14 | Reportes de ventas y ganancias por período (solo dueño) | Media |
| RF15 | Registrar en auditoría las acciones importantes | Alta |
| RF16 | Administrar usuarios del sistema (solo dueño) | Media |
| RF17 | Configurar los datos del negocio y el mensaje del ticket | Baja |
| RF18 | Verificar la licencia del sistema | Media |

## Requerimientos no funcionales

- **Responsive:** se usa desde la PC del mostrador y desde el celular.
- **Rápido:** cargar una venta con el lector no debe tardar más de unos segundos, y las pantallas cargan en menos de 2 s.
- **Compatible con el lector:** el lector USB funciona como un teclado que escribe el código y presiona Enter.
- **Seguro:** RLS en todas las tablas y totales calculados en el servidor (ver `10-SEGURIDAD.md`).
- **Accesible:** contraste suficiente, botones grandes y textos legibles.
- **Trazable:** toda acción sensible queda registrada con usuario y fecha.

## Historia de usuario

> Como empleado, quiero escanear los productos del cliente y ver el total y el vuelto al instante, para atender rápido sin hacer cuentas a mano.

### Criterios de aceptación

- [ ] Al escanear un código, el producto se agrega a la venta y suma 1.
- [ ] Si el código no existe, avisa con un mensaje claro.
- [ ] Se puede cambiar la cantidad o quitar un producto.
- [ ] El total se calcula solo y el vuelto aparece al ingresar el monto recibido.
- [ ] Al confirmar, baja el stock y se registra el movimiento de caja.
