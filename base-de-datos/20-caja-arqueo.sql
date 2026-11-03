-- =============================================================
-- POINTER - Reglas de apertura y cierre de caja (specs/002-caja-arqueo)
-- Amplia cajas_guard: calcula la diferencia y frena a los dos roles.
-- EJECUTAR SOLO EN LA BASE DE POINTER, en el panel de Supabase.
-- No cambia tablas, columnas, politicas ni triggers.
-- =============================================================

-- Los pasos son los de plan.md, seccion 3, y van en ese orden.
-- Sin SECURITY DEFINER: el paso 1 depende de current_user (H-01).
CREATE OR REPLACE FUNCTION public.cajas_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
    -- Paso 1: crear_venta, cancelar_venta, registrar_movimiento_venta y el panel no se controlan
    if current_user not in ('authenticated', 'anon') then
        return new;
    end if;

    -- Paso 2: una caja cerrada no cambia sus saldos ni su arqueo (RF-002-07)
    if old.estado = 'cerrada' and new.estado = 'cerrada' then
        if new.saldo_inicial is distinct from old.saldo_inicial
        or new.saldo_actual  is distinct from old.saldo_actual
        or new.saldo_contado is distinct from old.saldo_contado
        or new.diferencia    is distinct from old.diferencia
        or new.fecha_cierre  is distinct from old.fecha_cierre then
            raise exception 'La caja ya fue cerrada';
        end if;
    end if;

    -- Paso 3: una caja abierta no se vuelve a abrir, ni con el mismo monto (RF-002-03, D3)
    if old.estado = 'abierta' and new.estado = 'abierta' then
        if new.saldo_inicial  is distinct from old.saldo_inicial
        or new.saldo_actual   is distinct from old.saldo_actual
        or new.saldo_contado  is distinct from old.saldo_contado
        or new.usuario_id     is distinct from old.usuario_id
        or new.fecha_apertura is distinct from old.fecha_apertura then
            raise exception 'La caja ya está abierta';
        end if;
    end if;

    -- Paso 4: el cierre no cambia ningun saldo, el contado va aparte (H-02)
    if old.estado = 'abierta' and new.estado = 'cerrada' then
        if new.saldo_inicial is distinct from old.saldo_inicial
        or new.saldo_actual  is distinct from old.saldo_actual then
            raise exception 'El cierre no puede cambiar los saldos';
        end if;
    end if;

    -- Paso 5: mira el cambio, asi una caja que ya tenga un negativo se puede cerrar (RF-002-06, H-01)
    if (new.saldo_inicial < 0 and new.saldo_inicial is distinct from old.saldo_inicial)
    or (new.saldo_contado < 0 and new.saldo_contado is distinct from old.saldo_contado) then
        raise exception 'El monto no puede ser negativo';
    end if;

    -- Paso 6: al abrir, los dos saldos son el monto de apertura (RF-002-01, H-02)
    if old.estado = 'cerrada' and new.estado = 'abierta' then
        if new.saldo_actual is distinct from new.saldo_inicial then
            raise exception 'Apertura de caja invalida';
        end if;
    end if;

    -- Paso 7: la diferencia la calcula la base; sin contado da null (RF-002-05)
    if old.estado = 'abierta' and new.estado = 'cerrada' then
        new.diferencia := new.saldo_contado - old.saldo_actual;
    end if;

    -- Paso 8: el resto solo vale para los otros roles
    if public.is_dueno() then
        return new;
    end if;

    -- Paso 9: el empleado abre a su nombre y al cerrar no cambia quien ni cuando abrio
    if old.estado = 'cerrada' and new.estado = 'abierta' then
        if new.usuario_id is distinct from auth.uid() then
            raise exception 'Apertura de caja invalida';
        end if;
    elsif old.estado = 'abierta' and new.estado = 'cerrada' then
        if new.usuario_id     is distinct from old.usuario_id
        or new.fecha_apertura is distinct from old.fecha_apertura then
            raise exception 'El cierre no puede cambiar la apertura';
        end if;
    end if;

    return new;
end;
$function$;

-- -------------------------------------------------------------
-- VERIFICACION: correr tests/sql/caja-guard.sql; tienen que pasar todas.
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- PARA DESHACER (si fallan ventas o cancelacion): la version anterior.
-- -------------------------------------------------------------
-- CREATE OR REPLACE FUNCTION public.cajas_guard()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SET search_path TO 'public'
-- AS $function$
-- begin
--     if current_user not in ('authenticated', 'anon') or public.is_dueno() then
--         return new;
--     end if;
--
--     if old.estado = 'abierta' then
--         if new.saldo_actual   is distinct from old.saldo_actual
--         or new.saldo_inicial  is distinct from old.saldo_inicial
--         or new.usuario_id     is distinct from old.usuario_id
--         or new.fecha_apertura is distinct from old.fecha_apertura then
--             raise exception 'No se puede modificar el saldo ni la apertura de una caja abierta';
--         end if;
--     else
--         if new.estado = 'abierta' then
--             if new.saldo_inicial < 0
--             or new.saldo_actual is distinct from new.saldo_inicial
--             or new.usuario_id   is distinct from auth.uid() then
--                 raise exception 'Apertura de caja invalida';
--             end if;
--         elsif new.saldo_actual  is distinct from old.saldo_actual
--            or new.saldo_inicial is distinct from old.saldo_inicial then
--             raise exception 'No se puede modificar el saldo de una caja cerrada';
--         end if;
--     end if;
--
--     return new;
-- end;
-- $function$;
