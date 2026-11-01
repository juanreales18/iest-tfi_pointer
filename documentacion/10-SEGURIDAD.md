# 10 · Seguridad: cómo protegemos datos y sistema

En Pointer el navegador **no es de confianza**: cualquier persona puede abrir la consola y cambiar lo que el sitio envía. Por eso las reglas importantes las aplica la base de datos.

## Datos sensibles

| Dato | Dónde vive | Quién puede verlo |
|---|---|---|
| Contraseñas | Supabase Auth (cifradas) | Nadie, ni el dueño |
| `precio_costo` y ganancias | Base de datos | Solo el dueño |
| Reportes y auditoría | Base de datos | Solo el dueño |
| Datos de clientes y proveedores | Base de datos | Usuarios autenticados según su rol |
| Claves de Supabase | Panel de Supabase y de Netlify | Solo quien administra el proyecto |

## Qué nunca debe llegar al navegador

- La clave `service_role` de Supabase.
- Contraseñas, tokens o claves de acceso de cualquier tipo.
- El costo de los productos cuando el usuario es empleado.
- Datos de otros negocios o de otros usuarios sin permiso.

> La clave pública (`anon`) sí está en el navegador y eso es normal: por sí sola **no da acceso a nada**, porque cada tabla tiene RLS.

## Reglas de protección

| Capa | Regla |
|---|---|
| Base de datos | RLS activo en todas las tablas, con políticas por rol |
| Base de datos | Las vistas no se exponen a usuarios anónimos |
| Base de datos | Funciones con `search_path` fijo y verificación de rol (`is_dueno`) |
| Ventas | La función `crear_venta` calcula totales y stock en el servidor, con precios de la base |
| Autenticación | Sin registro público: los usuarios los crea el dueño (a verificar en Supabase) |
| Frontend | No usar `innerHTML` con datos del usuario; usar `textContent` |
| Publicación | Cabeceras CSP en `netlify.toml` (hoy con `unsafe-inline`, protección parcial) |
| Código | El repositorio no contiene claves ni archivos `.env` |

## Validaciones

- Se validan los datos en la base con restricciones (`CHECK`, `NOT NULL`, `UNIQUE`) y no solo en el formulario.
- Los montos no pueden ser negativos y el stock no puede quedar por debajo de 0.
- Toda consulta usa parámetros del cliente de Supabase; nunca se arma SQL pegando texto.
- Las acciones sensibles (login, crear, editar, eliminar, abrir y cerrar caja) quedan registradas en `auditoria`.

```js
// MAL: confiar en el total que manda el navegador
await supabase.from('ventas').insert({ total: totalDelNavegador });

// BIEN: el servidor calcula el total con los precios de la base
await supabase.rpc('crear_venta', { p_items: items, p_metodo_pago_id: metodoId });
```

## Lista de control

- [x] RLS activo en todas las tablas
- [x] Vistas cerradas a usuarios anónimos
- [x] Funciones con `search_path` fijo
- [x] Función `crear_venta` con cálculo en el servidor
- [ ] Registro público de usuarios desactivado
- [x] `precio_costo` oculto a empleados
- [x] CSP configurada en Netlify (parcial, con `unsafe-inline`)
- [ ] CSP sin `unsafe-inline`
- [ ] Repositorio sin claves (público para el TFI: solo contiene la clave pública `anon`, que no da acceso sin RLS)
- [x] Funciones ayudantes (`is_dueno`, `is_staff`, `get_user_rol`) cerradas a usuarios anónimos
- [ ] Protección de contraseñas filtradas activada en Supabase Auth

## Limitaciones conocidas

| Limitación | Por qué importa | Plan |
|---|---|---|
| El rol se guarda 10 minutos en `localStorage` | Solo decide qué botones se muestran; el acceso real lo controla RLS | Mantener RLS por rol en cada tabla |
| La licencia se verifica desde el navegador | Un usuario técnico podría saltearla | Mitigado: si el panel no responde, solo se permite el acceso por 3 días desde la última verificación correcta. Pendiente: validarla en el servidor |
| Los totales de una venta se calculaban en el navegador | Un usuario técnico podía alterar el total | Resuelto: `crear_venta` calcula en el servidor y la inserción directa está cerrada |
| `precio_costo` llegaba al navegador del empleado | Aunque la pantalla lo ocultaba, el dato viajaba | Resuelto: permiso por columna y función `get_costos()` solo para el dueño |
| `auth.admin.createUser` se llamaba desde el navegador | La clave pública no tiene ese permiso, así que fallaba | Resuelto: Edge Function `crear-usuario`, solo para el dueño |

