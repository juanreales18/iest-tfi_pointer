---
name: revisar-seguridad
description: Revisa un cambio de Pointer antes del commit buscando secretos, lógica sensible en el navegador, HTML inseguro y problemas de RLS. Usar antes de cualquier commit que toque src/js/, supabase/ o permisos.
---

# Skill: revisar-seguridad

Pointer maneja plata, stock y datos de clientes. El navegador **no es de confianza**: cualquiera puede abrir la consola y cambiar lo que se envía. Esta skill revisa un cambio contra `docs/10-SEGURIDAD.md` y el principio P5 de la constitución.

## Entrada

Los archivos que cambian en el commit: `git diff --cached --name-only` (o `git diff --name-only` si todavía no se agregaron).

## Lista de control

### 1. Secretos (bloqueante)
- Buscar en el diff: `service_role`, `eyJ` seguido de un token largo que **no** sea la clave pública ya conocida de `src/js/config.js`, `password =`, `secret`, `sk_`, archivos `.env`.
- Si aparece algo: **detener el commit** y avisar. No copiar el valor en el chat.

### 2. Lógica en el lugar correcto
- ¿El cambio calcula totales, descuentos, stock o saldos de caja **en el navegador** y los guarda directo en una tabla? → debe ir en una función SQL (`crear_venta`, `cancelar_venta` o una nueva).
- ¿Aparece `.from('ventas').insert`, `.from('detalle_ventas').insert` o un `update` del `estado` de una venta? → no permitido.
- ¿Se pide `precio_costo` en un `select` que puede ejecutar un empleado? → usar `get_costos()`.

### 3. HTML seguro
- Todo texto que viene del usuario o de la base y se mete en `innerHTML` pasa por `escapeHtml()`.
- Los filtros de búsqueda que van a `.or()` de Supabase quitan comas, paréntesis y comodines (ver `palabrasBusqueda()`).

### 4. Base de datos (si el cambio toca `supabase/`)
- Toda tabla nueva tiene `ENABLE ROW LEVEL SECURITY` y políticas por rol.
- Toda función `SECURITY DEFINER` tiene `SET search_path TO 'public'` y verifica el rol (`is_dueno()` / `is_staff()`) al principio.
- `REVOKE EXECUTE ... FROM PUBLIC, anon` en las funciones nuevas.
- Las políticas nuevas o cambiadas se muestran al autor **antes** de aplicarlas.

### 5. Errores que no se ven
- Un `update` o `delete` que RLS bloquea no devuelve error: comprobar con `.select('id')` que volvió una fila.
- Los mensajes al usuario no muestran detalles técnicos (stack, SQL, ids internos).

## Salida

Una tabla corta para el autor:

| Punto | Resultado | Archivo y línea | Qué hacer |
|---|---|---|---|
| Secretos | OK / BLOQUEA | … | … |

Si algún punto **bloquea**, el commit no se hace hasta corregirlo. Si todo da OK, se puede commitear y se menciona en el mensaje del PR o en `verificacion.md`.
