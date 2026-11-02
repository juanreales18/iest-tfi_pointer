-- =============================================================
-- POINTER - PRUEBAS DE cajas_guard (specs/002-caja-arqueo)
-- Lo corre el autor en el panel de Supabase, SOLO en la base de Pointer.
-- Termina SIEMPRE en un error a proposito: ese error trae los resultados
-- y deshace todo, tambien si algo falla en el medio (D7). No deja cambios,
-- salvo los numeros de venta que gaste crear_venta (la secuencia no vuelve).
--
-- En el panel, current_user es postgres y el guard no aplica sus reglas.
-- Por eso cada prueba cambia a authenticated y carga el usuario del rol,
-- buscado con una consulta (H-03). Cada prueba prepara antes la caja,
-- porque la real puede estar abierta o cerrada.
--
-- Cada prueba se repite con los dos roles. Sus columnas:
--   nombre   lo que se informa
--   prep     como se deja la caja antes: cerrada, abierta o abierta_pareja
--   accion   la sentencia; $1 es la caja y $2 el usuario que la manda
--   rechazo  NULL: tiene que pasar. '*': cualquier rechazo. Si no, el texto exacto
--   control  condicion sobre la fila despues de la accion (NULL: ninguna)
-- =============================================================
DO $prueba$
DECLARE
    C_ABRIR CONSTANT text := 'UPDATE public.cajas SET estado = ''abierta'', saldo_inicial = %s, saldo_actual = %s, '
        || 'usuario_id = $2, fecha_apertura = now(), notas_apertura = NULL, fecha_cierre = NULL, '
        || 'saldo_contado = NULL, diferencia = NULL WHERE id = $1';
    C_YA_ABIERTA CONSTANT text := 'La caja ya está abierta';

    v_caja     uuid;
    v_dueno    uuid;
    v_empleado uuid;
    v_usuario  uuid;
    c          record;
    v_error    text;
    v_filas    integer;
    v_control  boolean;
    v_falla    text;
    v_pasan    integer := 0;
    v_fallan   integer := 0;
    v_informe  text := '';
BEGIN
    SELECT id INTO v_caja FROM public.cajas ORDER BY created_at LIMIT 1;

    SELECT u.id INTO v_dueno
    FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
    WHERE r.nombre = 'dueno' AND u.activo = true AND u.deleted_at IS NULL
    LIMIT 1;

    SELECT u.id INTO v_empleado
    FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
    WHERE r.nombre = 'empleado' AND u.activo = true AND u.deleted_at IS NULL
    LIMIT 1;

    IF v_caja IS NULL OR v_dueno IS NULL OR v_empleado IS NULL THEN
        RAISE EXCEPTION 'caja-guard: hacen falta una caja, un dueno activo y un empleado activo';
    END IF;

    FOR c IN
        SELECT r.rol, p.*
        FROM (VALUES ('dueno'), ('empleado')) AS r(rol)
        CROSS JOIN (VALUES
            -- RF-002-01: abre una caja cerrada con los dos saldos iguales al monto
            ('apertura valida', 'cerrada', format(C_ABRIR, 2000, 2000), NULL,
                'estado = ''abierta'' AND saldo_inicial = 2000 AND saldo_actual = 2000'),
            ('apertura valida con 0', 'cerrada', format(C_ABRIR, 0, 0), NULL,
                'estado = ''abierta'' AND saldo_inicial = 0 AND saldo_actual = 0'),
            -- RF-002-03: con la caja abierta no cambia nada
            ('doble apertura con otro monto', 'abierta', format(C_ABRIR, 2000, 2000), C_YA_ABIERTA,
                'saldo_inicial = 1000 AND saldo_actual = 1500'),
            -- D3: los saldos son iguales y solo cambiaria la fecha de apertura
            ('doble apertura con el mismo monto', 'abierta_pareja', format(C_ABRIR, 1000, 1000), C_YA_ABIERTA,
                'saldo_inicial = 1000 AND saldo_actual = 1000 AND fecha_apertura < now()'),
            -- RF-002-06
            ('apertura negativa', 'cerrada', format(C_ABRIR, -1, -1), '*', 'estado = ''cerrada'''),
            -- H-02: al abrir, los dos saldos tienen que ser iguales
            ('apertura con saldo inventado', 'cerrada', format(C_ABRIR, 1000, 9000), '*', 'estado = ''cerrada''')
        ) AS p(nombre, prep, accion, rechazo, control)
    LOOP
        v_falla := NULL;
        v_error := NULL;
        v_usuario := CASE c.rol WHEN 'dueno' THEN v_dueno ELSE v_empleado END;

        BEGIN
            -- Como postgres: el guard no controla la preparacion
            UPDATE public.cajas SET
                estado         = CASE c.prep WHEN 'cerrada' THEN 'cerrada' ELSE 'abierta' END::estado_caja,
                saldo_inicial  = 1000,
                saldo_actual   = CASE c.prep WHEN 'abierta_pareja' THEN 1000 ELSE 1500 END,
                usuario_id     = v_usuario,
                fecha_apertura = now() - interval '2 hours',
                fecha_cierre   = CASE c.prep WHEN 'cerrada' THEN now() - interval '1 hour' END,
                saldo_contado  = CASE c.prep WHEN 'cerrada' THEN 1450 END,
                diferencia     = CASE c.prep WHEN 'cerrada' THEN -50 END
            WHERE id = v_caja;

            PERFORM set_config('request.jwt.claims',
                json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);
            SET LOCAL ROLE authenticated;

            BEGIN
                EXECUTE c.accion USING v_caja, v_usuario;
                GET DIAGNOSTICS v_filas = ROW_COUNT;
            EXCEPTION WHEN OTHERS THEN
                v_error := SQLERRM;
            END;

            SET LOCAL ROLE NONE;

            IF c.rechazo IS NULL THEN
                IF v_error IS NOT NULL THEN
                    v_falla := 'rechazó: ' || v_error;
                ELSIF v_filas <> 1 THEN
                    v_falla := 'no cambió ninguna fila';
                END IF;
            ELSIF v_error IS NULL THEN
                v_falla := 'no rechazó';
            ELSIF c.rechazo <> '*' AND v_error <> c.rechazo THEN
                v_falla := 'rechazó con otro texto: ' || v_error;
            END IF;

            IF v_falla IS NULL AND c.control IS NOT NULL THEN
                EXECUTE 'SELECT (' || c.control || ') FROM public.cajas WHERE id = $1' INTO v_control USING v_caja;
                IF v_control IS NOT TRUE THEN
                    v_falla := 'la caja quedó distinta de lo esperado';
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_falla := 'error en la prueba: ' || SQLERRM;
        END;

        IF v_falla IS NULL THEN
            v_pasan := v_pasan + 1;
            v_informe := v_informe || E'\nPASA  · ' || c.rol || ' · ' || c.nombre;
        ELSE
            v_fallan := v_fallan + 1;
            v_informe := v_informe || E'\nFALLA · ' || c.rol || ' · ' || c.nombre || ' · ' || v_falla;
        END IF;
    END LOOP;

    RAISE EXCEPTION USING MESSAGE = format('caja-guard: %s pasan, %s fallan. Se deshizo todo.%s', v_pasan, v_fallan, v_informe);
END
$prueba$;
