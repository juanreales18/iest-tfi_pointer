# 08 · Tareas: en qué orden lo hacemos

La IA trabaja **una tarea por vez** y la marca con `[x]` al terminar.

## Etapa 1 · Preparación

- [x] Definir el proyecto y su identidad de marca
- [x] Escribir el kit de especificación (AGENTS.md y documentacion/)
- [ ] Crear el repositorio público `iest-tfi_pointer` en GitHub (TFI, Actividad 1)
- [ ] Conectar el repositorio a Netlify (carpeta de publicación: `sistema/`)
- [ ] Subir el logo de Pointer y el favicon a `multimedia/marca/`

## Etapa 2 · Base de datos y seguridad

- [x] Crear las tablas, tipos y relaciones en Supabase
- [x] Activar RLS en todas las tablas
- [x] Cerrar las vistas `v_*` a usuarios anónimos
- [x] Corregir las funciones (`search_path`, `is_dueno`)
- [x] Políticas de `ventas`, `detalle_ventas`, `auditoria`, `movimientos_caja` e `historial_stock`
- [x] Trigger de cajas
- [x] Función `crear_venta` que calcule los totales en el servidor (atómica y con clave anti-duplicados)
- [x] Cerrar la inserción directa de ventas: solo se vende con `crear_venta`
- [ ] Desactivar el registro público de usuarios (signup) y verificarlo en el panel de Supabase
- [x] Crear usuarios desde una Edge Function (`crear-usuario`), solo para el dueño
- [x] Ocultar `precio_costo` a los empleados (permiso por columna + función `get_costos()` solo para el dueño)

## Etapa 3 · Acceso y roles

- [x] Pantalla de login
- [x] Roles `dueno` y `empleado`
- [x] Barra lateral que cambia según el rol
- [x] Verificación de licencia con 3 días de gracia si el panel no responde (ver 10-SEGURIDAD.md)
- [ ] Endurecer la licencia: validarla en el servidor

## Etapa 4 · Ventas y caja

- [x] Abrir y cerrar caja
- [x] Nueva venta con lector de código de barras
- [x] Método de pago, vuelto y ticket
- [x] Historial de ventas
- [x] Caja: apertura y cierre en $0, arqueo (efectivo contado vs. esperado) y solo el efectivo suma a la caja
- [x] Cancelar venta con devolución de stock y caja (función `cancelar_venta`, solo dueño)

## Etapa 5 · Stock, compras y reportes

- [x] Productos y categorías con alerta de stock mínimo
- [x] Proveedores y compras que suman stock
- [x] Gastos
- [x] Reportes de ventas y ganancias
- [x] Consulta de auditoría

## Etapa 6 · Calidad y publicación

- [x] Agregar la política de seguridad de contenido (CSP) en `netlify.toml` (parcial: usa `unsafe-inline`)
- [ ] Quitar `unsafe-inline` de la CSP moviendo los scripts y `onclick` a archivos .js
- [ ] Probar en celular y en la PC del mostrador con el lector
- [ ] Revisar los permisos de cada rol una vez más
- [ ] Publicar la versión final en Netlify

## Etapa 7 · Trabajo Final Integrador

- [ ] Actividad 1: constitución, arnés del agente y matriz de herramientas
- [ ] Actividad 2: tres funcionalidades con el ciclo SDD completo en `specs/`
- [ ] Actividad 3: tests en verde, Lighthouse de 80 o más y publicación final
- [ ] Pasar a variables CSS los 54 colores escritos a mano que quedan en `sistema/css/` (deuda medida por `tests/constitucion.test.js`; bajar `DEUDA_COLORES_CSS` a 0)
- [ ] Actividad 4: imágenes, video, gráficos y fichas en `multimedia/`
- [ ] Actividad 5: declaración de uso de IA y análisis de riesgos
- [ ] Actividad 6: informe guionado y defensa

