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
-- Las reglas de la caja se repiten con los dos roles; lo que no se tiene que
-- romper va con su rol (panel: se queda en postgres, como 90-reinicio-total.sql).
-- El producto de las ventas lo crea el script: tambien se deshace.
-- Las columnas de cada prueba:
--   nombre   lo que se informa
--   prep     como se deja la caja antes: cerrada, abierta, abierta_pareja,
--            abierta_negativa o abierta_con_venta
--   accion   la sentencia; $1 caja, $2 usuario, $3 metodo de pago, $4 items, $5 venta, $6 el otro usuario
--   rechazo  NULL: tiene que pasar. '*': cualquier rechazo. Si no, el texto exacto
--   control  condicion sobre la fila despues de la accion (NULL: ninguna); $2 es la venta y $3 el otro usuario
-- =============================================================
DO $prueba$
DECLARE
    C_ABRIR CONSTANT text := 'UPDATE public.cajas SET estado = ''abierta'', saldo_inicial = %s, saldo_actual = %s, '
        || 'usuario_id = $2, fecha_apertura = now(), notas_apertura = NULL, fecha_cierre = NULL, '
        || 'saldo_contado = NULL, diferencia = NULL WHERE id = $1';
    C_CERRAR CONSTANT text := 'UPDATE public.cajas SET estado = ''cerrada'', fecha_cierre = now(), notas_cierre = NULL, '
        || 'saldo_contado = %s, diferencia = %s WHERE id = $1';
    C_CAMBIAR CONSTANT text := 'UPDATE public.cajas SET %s WHERE id = $1';
    C_YA_ABIERTA CONSTANT text := 'La caja ya está abierta';
    C_YA_CERRADA CONSTANT text := 'La caja ya fue cerrada';
    C_APERTURA_INVALIDA CONSTANT text := 'Apertura de caja invalida';
    C_CIERRE_CAMBIA_APERTURA CONSTANT text := 'El cierre no puede cambiar la apertura';
    -- Como queda una caja cerrada por prep: si cambia, no se protegio
    C_ARQUEO_INTACTO CONSTANT text := 'estado = ''cerrada'' AND saldo_inicial = 1000 AND saldo_actual = 1500 '
        || 'AND saldo_contado = 1450 AND diferencia = -50 AND fecha_cierre < now()';
    -- El UPDATE de 90-reinicio-total.sql: tests/caja.test.js comprueba que sea el mismo
    C_REINICIO CONSTANT text := 'estado = ''cerrada'', saldo_inicial = 0, saldo_actual = 0, usuario_id = NULL, '
        || 'fecha_apertura = NULL, fecha_cierre = NULL, notas_apertura = NULL, notas_cierre = NULL, '
        || 'saldo_contado = NULL, diferencia = NULL';
    C_REINICIADA CONSTANT text := 'estado = ''cerrada'' AND saldo_inicial = 0 AND saldo_actual = 0 AND usuario_id IS NULL '
        || 'AND fecha_apertura IS NULL AND fecha_cierre IS NULL AND saldo_contado IS NULL AND diferencia IS NULL';

    v_caja     uuid;
    v_dueno    uuid;
    v_empleado uuid;
    v_usuario  uuid;
    v_otro     uuid;
    v_metodo   uuid;
    v_producto uuid;
    v_items    jsonb;
    v_venta    uuid;
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

    SELECT id INTO v_metodo FROM public.metodos_pago WHERE nombre = 'Efectivo' AND activo LIMIT 1;

    IF v_caja IS NULL OR v_dueno IS NULL OR v_empleado IS NULL OR v_metodo IS NULL THEN
        RAISE EXCEPTION 'caja-guard: hacen falta una caja, un dueno activo, un empleado activo y el metodo Efectivo';
    END IF;

    INSERT INTO public.productos (nombre, precio_venta, stock_actual)
    VALUES ('Prueba caja-guard', 100, 1000)
    RETURNING id INTO v_producto;
    v_items := jsonb_build_array(jsonb_build_object('producto_id', v_producto, 'cantidad', 1));

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
            -- RF-002-03: el contado se carga al cerrar, no con la caja abierta
            ('caja abierta cambia contado', 'abierta', format(C_CAMBIAR, 'saldo_contado = 1'), C_YA_ABIERTA, 'saldo_contado IS NULL'),
            -- RF-002-06
            ('apertura negativa', 'cerrada', format(C_ABRIR, -1, -1), '*', 'estado = ''cerrada'''),
            -- H-02: al abrir, los dos saldos tienen que ser iguales
            ('apertura con saldo inventado', 'cerrada', format(C_ABRIR, 1000, 9000), '*', 'estado = ''cerrada'''),
            -- RF-002-05: la diferencia es contado menos saldo, mande lo que mande el navegador
            ('cierre con diferencia inventada', 'abierta', format(C_CERRAR, 1450, 999), NULL,
                'estado = ''cerrada'' AND saldo_contado = 1450 AND diferencia = -50'),
            ('cierre sin mandar diferencia', 'abierta',
                format(C_CAMBIAR, 'estado = ''cerrada'', fecha_cierre = now(), saldo_contado = 1450'), NULL,
                'estado = ''cerrada'' AND saldo_contado = 1450 AND diferencia = -50'),
            ('cierre con contado 0', 'abierta', format(C_CERRAR, 0, 'NULL'), NULL,
                'estado = ''cerrada'' AND saldo_contado = 0 AND diferencia = -1500'),
            ('cierre sin contado', 'abierta', format(C_CERRAR, 'NULL', 999), NULL,
                'estado = ''cerrada'' AND saldo_contado IS NULL AND diferencia IS NULL'),
            -- RF-002-06
            ('cierre con contado negativo', 'abierta', format(C_CERRAR, -1, 'NULL'), '*', 'estado = ''abierta'''),
            -- H-01: el rechazo mira el cambio, asi que un negativo que ya estaba no traba el cierre
            ('cierre con un saldo negativo anterior', 'abierta_negativa', format(C_CERRAR, 'NULL', 'NULL'), NULL,
                'estado = ''cerrada'' AND saldo_inicial = -5'),
            -- H-02: al cerrar no cambia ningun saldo
            ('cierre con saldo inventado', 'abierta',
                format(C_CAMBIAR, 'estado = ''cerrada'', fecha_cierre = now(), saldo_contado = 1450, saldo_actual = 1450'), '*',
                'estado = ''abierta'' AND saldo_actual = 1500'),
            ('cierre con saldo inicial inventado', 'abierta',
                format(C_CAMBIAR, 'estado = ''cerrada'', fecha_cierre = now(), saldo_inicial = 500'), '*',
                'estado = ''abierta'' AND saldo_inicial = 1000'),
            -- RF-002-07: una caja que sigue cerrada no cambia su arqueo ni sus saldos
            ('segundo cierre', 'cerrada', format(C_CERRAR, 1600, 'NULL'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            ('caja cerrada cambia saldo inicial', 'cerrada', format(C_CAMBIAR, 'saldo_inicial = 1'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            ('caja cerrada cambia saldo actual', 'cerrada', format(C_CAMBIAR, 'saldo_actual = 1'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            ('caja cerrada cambia contado', 'cerrada', format(C_CAMBIAR, 'saldo_contado = 1500'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            ('caja cerrada cambia diferencia', 'cerrada', format(C_CAMBIAR, 'diferencia = 0'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            ('caja cerrada cambia fecha de cierre', 'cerrada', format(C_CAMBIAR, 'fecha_cierre = now()'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            -- El plan pone el paso 2 antes que el 5: una pantalla vieja ve este texto y no otro
            ('caja cerrada con contado negativo', 'cerrada', format(C_CAMBIAR, 'saldo_contado = -1'), C_YA_CERRADA, C_ARQUEO_INTACTO),
            -- H-01: la venta sube el saldo desde adentro de una funcion, sin chocar con el guard
            ('venta en efectivo', 'abierta', 'SELECT public.crear_venta($1, $3, $4)', NULL,
                'saldo_actual = 1500 + (SELECT total FROM public.ventas WHERE caja_id = cajas.id ORDER BY numero_venta DESC LIMIT 1) '
                || 'AND saldo_actual > 1500')
        ) AS p(nombre, prep, accion, rechazo, control)
        UNION ALL
        VALUES
            -- H-01: si la venta de la preparacion no hubiera subido el saldo, aca no volveria a 1500
            ('dueno', 'cancelacion de venta en efectivo', 'abierta_con_venta', 'SELECT public.cancelar_venta($5, ''prueba'')', NULL,
                'saldo_actual = 1500 AND (SELECT estado::text FROM public.ventas WHERE id = $2) = ''cancelada'''),
            -- H-01: el panel limpia la caja en cualquier estado; a otro rol el guard se lo rechazaria
            ('panel', 'reinicio con la caja abierta', 'abierta', format(C_CAMBIAR, C_REINICIO), NULL, C_REINICIADA),
            ('panel', 'reinicio con la caja cerrada', 'cerrada', format(C_CAMBIAR, C_REINICIO), NULL, C_REINICIADA),
            -- Pasos 8 y 9: el empleado abre a su nombre y no cambia la apertura al cerrar; el dueno puede
            ('empleado', 'apertura a nombre de otro', 'cerrada', format(C_CAMBIAR, 'estado = ''abierta'', saldo_inicial = 0, saldo_actual = 0, usuario_id = $6'),
                C_APERTURA_INVALIDA, 'estado = ''cerrada'''),
            ('dueno', 'apertura a nombre de otro', 'cerrada', format(C_CAMBIAR, 'estado = ''abierta'', saldo_inicial = 0, saldo_actual = 0, usuario_id = $6'),
                NULL, 'estado = ''abierta'' AND usuario_id = $3'),
            ('empleado', 'cierre cambia quien abrio', 'abierta', format(C_CAMBIAR, 'estado = ''cerrada'', usuario_id = $6'),
                C_CIERRE_CAMBIA_APERTURA, 'estado = ''abierta'' AND usuario_id <> $3'),
            ('dueno', 'cierre cambia quien abrio', 'abierta', format(C_CAMBIAR, 'estado = ''cerrada'', usuario_id = $6'),
                NULL, 'estado = ''cerrada'' AND usuario_id = $3'),
            ('empleado', 'cierre cambia fecha de apertura', 'abierta', format(C_CAMBIAR, 'estado = ''cerrada'', fecha_apertura = now()'),
                C_CIERRE_CAMBIA_APERTURA, 'estado = ''abierta'' AND fecha_apertura < now()')
    LOOP
        v_falla := NULL;
        v_error := NULL;
        v_venta := NULL;
        v_usuario := CASE c.rol WHEN 'empleado' THEN v_empleado ELSE v_dueno END;
        v_otro := CASE c.rol WHEN 'empleado' THEN v_dueno ELSE v_empleado END;

        BEGIN
            -- Como postgres: el guard no controla la preparacion
            UPDATE public.cajas SET
                estado         = CASE c.prep WHEN 'cerrada' THEN 'cerrada' ELSE 'abierta' END::estado_caja,
                saldo_inicial  = CASE c.prep WHEN 'abierta_negativa' THEN -5 ELSE 1000 END,
                saldo_actual   = CASE c.prep WHEN 'abierta_pareja' THEN 1000 ELSE 1500 END,
                usuario_id     = v_usuario,
                fecha_apertura = now() - interval '2 hours',
                fecha_cierre   = CASE c.prep WHEN 'cerrada' THEN now() - interval '1 hour' END,
                saldo_contado  = CASE c.prep WHEN 'cerrada' THEN 1450 END,
                diferencia     = CASE c.prep WHEN 'cerrada' THEN -50 END
            WHERE id = v_caja;

            PERFORM set_config('request.jwt.claims',
                json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

            IF c.prep = 'abierta_con_venta' THEN
                v_venta := (public.crear_venta(v_caja, v_metodo, v_items) ->> 'id')::uuid;
            END IF;

            IF c.rol <> 'panel' THEN
                SET LOCAL ROLE authenticated;
            END IF;

            BEGIN
                EXECUTE c.accion USING v_caja, v_usuario, v_metodo, v_items, v_venta, v_otro;
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
                EXECUTE 'SELECT (' || c.control || ') FROM public.cajas WHERE id = $1' INTO v_control USING v_caja, v_venta, v_otro;
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
