/* =============================================================
   KIOSCO SYSTEM - AUTH.JS
   Autenticacion, sesion y control de roles con Supabase Auth
   ============================================================= */

// Estado global del usuario autenticado
window.AppUser = {
    session:  null,
    profile:  null,
    rol:      null,   // 'dueno' | 'empleado'
    isDueno:  false,
    isStaff:  false,
};


// =============================================================
// INICIALIZAR AUTH
// Llama a esta funcion al cargar cada pagina protegida
// =============================================================

/**
 * Verificar sesion activa y cargar perfil
 * Redirige a login si no hay sesion
 * @returns {Promise<boolean>}
 */
async function initAuth() {
    try {
        // 1. Verificar licencia antes de cualquier otra cosa
        const licenciaOk = await verificarLicencia();
        if (!licenciaOk) return false;

        // 2. Verificar sesion de Supabase
        const { data: { session }, error } = await window._supabase.auth.getSession();

        if (error || !session) {
            redirectToLogin();
            return false;
        }

        AppUser.session = session;

        // 3. Cargar perfil del usuario desde la tabla usuarios
        const profile = await loadUserProfile(session.user.id);
        if (!profile) {
            await window._supabase.auth.signOut();
            redirectToLogin();
            return false;
        }

        AppUser.profile  = profile;
        AppUser.rol      = profile.rol_nombre;
        AppUser.isDueno  = profile.rol_nombre === 'dueno';
        AppUser.isStaff  = profile.activo === true;

        if (!AppUser.isStaff) {
            await window._supabase.auth.signOut();
            redirectToLogin('Cuenta desactivada. Contacta al administrador.');
            return false;
        }

        // 4. Registrar ultimo login
        updateLastLogin(session.user.id);

        return true;

    } catch (err) {
        console.error('Auth error:', err);
        redirectToLogin();
        return false;
    }
}


// =============================================================
// VERIFICACION DE LICENCIA
// =============================================================

/**
 * Consulta DIRECTO la tabla licencias del panel Supabase.
 * Sin cache: verifica en cada carga de pagina para que
 * al desactivar desde el panel el bloqueo sea inmediato.
 * @returns {Promise<boolean>}
 */
async function verificarLicencia() {
    // Si no hay configuracion de licencia, dejar pasar
    if (typeof LICENSE_CONFIG === 'undefined' || !LICENSE_CONFIG.licencia) {
        return true;
    }

    // Credenciales del Supabase del PANEL (solo lectura de tabla licencias)
    const PANEL_URL = 'https://vymukcmieplatatwappt.supabase.co';
    const PANEL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bXVrY21pZXBsYXRhdHdhcHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTY4MjUsImV4cCI6MjA5MjY3MjgyNX0.hmuBcBCfL69dRe9g6F7S0BhyMSkppRFVR84zJFPoaDo';

    try {
        const url = `${PANEL_URL}/rest/v1/licencias?clave=eq.${encodeURIComponent(LICENSE_CONFIG.licencia)}&select=clave,estado,fecha_vencimiento&limit=1`;

        const response = await fetch(url, {
            method:  'GET',
            headers: {
                'apikey':        PANEL_KEY,
                'Authorization': `Bearer ${PANEL_KEY}`,
                'Content-Type':  'application/json',
            },
            signal: AbortSignal.timeout(7000),
        });

        if (!response.ok) {
            // Panel no disponible: solo se permite si hubo una verificacion correcta reciente
            console.warn('[Licencia] Panel no disponible (HTTP ' + response.status + ')');
            return licenciaEnGracia();
        }

        const data = await response.json();

        // Sin resultados: la clave no existe en el panel
        if (!data || data.length === 0) {
            mostrarPantallaBloqueo('Licencia no encontrada. Contacta al administrador.');
            return false;
        }

        const licencia = data[0];

        // Verificar estado
        if (licencia.estado !== 'activo') {
            mostrarPantallaBloqueo('Tu licencia fue desactivada. Contacta al administrador para reactivarla.');
            return false;
        }

        // Verificar vencimiento
        const hoy   = new Date();
        const vence = new Date(licencia.fecha_vencimiento);
        hoy.setHours(0, 0, 0, 0);
        vence.setHours(0, 0, 0, 0);

        if (vence < hoy) {
            const fechaStr = vence.toLocaleDateString('es-AR');
            mostrarPantallaBloqueo(`Tu licencia vencio el ${fechaStr}. Contacta al administrador para renovarla.`);
            return false;
        }

        // Todo OK: se recuerda la verificacion para el periodo de gracia
        try {
            localStorage.setItem(LIC_CACHE_KEY, JSON.stringify({
                clave: LICENSE_CONFIG.licencia,
                verificada: Date.now(),
                vence: licencia.fecha_vencimiento,
            }));
        } catch (e) { /* almacenamiento no disponible */ }
        return true;

    } catch (err) {
        // Error de red o timeout: solo se permite si hubo una verificacion correcta reciente
        console.warn('[Licencia] Error al verificar:', err.message);
        return licenciaEnGracia();
    }
}


// Periodo de gracia si el panel de licencias no responde
const LIC_CACHE_KEY   = 'kiosco_licencia_ok';
const LIC_GRACIA_DIAS = 3;

/**
 * Permite el acceso solo si la licencia se verifico bien en los ultimos
 * LIC_GRACIA_DIAS dias y no esta vencida. Si no, bloquea.
 * @returns {boolean}
 */
function licenciaEnGracia() {
    let cache = null;
    try { cache = JSON.parse(localStorage.getItem(LIC_CACHE_KEY) || 'null'); } catch (e) { cache = null; }

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const vigente = cache
        && cache.clave === LICENSE_CONFIG.licencia
        && (Date.now() - Number(cache.verificada || 0)) < LIC_GRACIA_DIAS * 24 * 60 * 60 * 1000
        && (!cache.vence || new Date(cache.vence) >= hoy);

    if (vigente) {
        console.warn('[Licencia] Acceso por periodo de gracia');
        return true;
    }

    mostrarPantallaBloqueo('Revisa la conexion a internet y volve a intentar. Si el problema sigue, contacta al administrador.', true);
    return false;
}


/**
 * Mostrar pantalla de bloqueo por licencia vencida.
 * Reemplaza todo el contenido de la pagina con el aviso.
 * @param {string} mensaje
 */
function mostrarPantallaBloqueo(mensaje, sinConexion = false) {
    const titulo = sinConexion ? 'No se pudo verificar la licencia' : 'Sistema desactivado';
    // Limpiar sesion
    window._supabase?.auth.signOut().catch(() => {});
    Cache.del('license_status');

    document.open();
    document.write(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Barlow', sans-serif;
            background: #111827;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .bloqueo-card {
            background: #1F2937;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
        }
        .bloqueo-icon {
            width: 72px;
            height: 72px;
            background: rgba(239,68,68,0.15);
            border: 2px solid rgba(239,68,68,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .bloqueo-icon svg { color: #EF4444; }
        .bloqueo-logo {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 1rem;
            color: #F59E0B;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        h1 {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 1.8rem;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        p {
            font-size: 15px;
            color: #9CA3AF;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .bloqueo-mensaje {
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.25);
            border-radius: 8px;
            padding: 14px 18px;
            font-size: 14px;
            color: #FCA5A5;
            margin: 20px 0 28px;
            line-height: 1.5;
        }
        .bloqueo-contacto {
            font-size: 13px;
            color: #6B7280;
            margin-top: 20px;
        }
        .bloqueo-contacto strong { color: #F59E0B; }
    </style>
</head>
<body>
    <div class="bloqueo-card">
        <div class="bloqueo-logo">KioscoSystem</div>
        <div class="bloqueo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
        </div>
        <h1>${titulo}</h1>
        ${sinConexion ? '' : '<p>El acceso al sistema ha sido suspendido.</p>'}
        <div class="bloqueo-mensaje">${mensaje.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        ${sinConexion ? '<p><button onclick="location.reload()" style="padding:10px 22px;border:none;border-radius:8px;background:#f5a623;color:#111;font-weight:700;cursor:pointer">Reintentar</button></p>' : '<p>Para reactivar el sistema comunicate con el administrador.</p>'}
        <div class="bloqueo-contacto">
            Licencia: <strong>${typeof LICENSE_CONFIG !== 'undefined' ? LICENSE_CONFIG.licencia : '-'}</strong>
        </div>
    </div>
</body>
</html>`);
    document.close();
}


// =============================================================
// CARGAR PERFIL
// =============================================================

/**
 * Obtener perfil del usuario desde Supabase
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function loadUserProfile(userId) {
    try {
        const cached = Cache.get('profile_' + userId);
        if (cached) return cached;

        const { data, error } = await window._supabase
            .from('usuarios')
            .select(`
                id, nombre, apellido, email, telefono,
                activo, avatar_url, ultimo_login,
                roles ( nombre, descripcion, permisos )
            `)
            .eq('id', userId)
            .eq('activo', true)
            .is('deleted_at', null)
            .single();

        if (error || !data) return null;

        const profile = {
            ...data,
            rol_nombre:   data.roles?.nombre || 'empleado',
            rol_desc:     data.roles?.descripcion || '',
            permisos:     data.roles?.permisos || {},
            nombre_completo: `${data.nombre} ${data.apellido}`.trim(),
        };

        Cache.set('profile_' + userId, profile, 10);
        return profile;

    } catch (err) {
        console.error('loadUserProfile error:', err);
        return null;
    }
}


// =============================================================
// VERIFICAR PERMISOS
// =============================================================

/**
 * Verificar si el usuario tiene un permiso especifico
 * @param {string} permiso - clave del permiso (ej: 'ver_reportes')
 * @returns {boolean}
 */
function hasPermission(permiso) {
    if (!AppUser.profile) return false;
    if (AppUser.isDueno)  return true;
    return AppUser.profile.permisos?.[permiso] === true;
}

/**
 * Verificar acceso y redirigir si no tiene permiso
 * @param {string} permiso
 * @param {string} redirectTo
 */
function requirePermission(permiso, redirectTo = 'dashboard.html') {
    if (!hasPermission(permiso)) {
        toastError('No tienes permiso para acceder a esta seccion');
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 1500);
        return false;
    }
    return true;
}


// =============================================================
// APLICAR VISIBILIDAD POR ROL EN EL DOM
// Oculta elementos con data-role="dueno" si el usuario es empleado
// =============================================================

function applyRoleVisibility() {
    if (!AppUser.profile) return;

    // Ocultar elementos solo para dueno
    document.querySelectorAll('[data-role="dueno"], .dueno-only').forEach(el => {
        if (!AppUser.isDueno) {
            el.style.display = 'none';
        }
    });

    // Ocultar elementos solo para empleado
    document.querySelectorAll('[data-role="empleado"], .empleado-only').forEach(el => {
        if (AppUser.isDueno) {
            el.style.display = 'none';
        }
    });
}


// =============================================================
// ACTUALIZAR UI CON DATOS DEL USUARIO
// =============================================================

function updateUserUI() {
    if (!AppUser.profile) return;

    const { nombre, apellido, rol_nombre } = AppUser.profile;
    const initials = getInitials(nombre, apellido);
    const fullName = `${nombre} ${apellido}`.trim();

    // Sidebar
    setText('#sidebar-username', fullName);
    setText('#sidebar-role',     capitalize(rol_nombre));
    setText('#sidebar-avatar',   initials);

    // Topbar
    setText('#topbar-username',  nombre);
    setText('#topbar-avatar',    initials);

    // POS header (si existe)
    setText('#pos-username',     nombre);
    setText('#pos-avatar',       initials);
}


// =============================================================
// LOGOUT
// =============================================================

/**
 * Cerrar sesion
 */
async function logout() {
    try {
        // Registrar auditoria de logout
        if (AppUser.profile) {
            await registrarAuditoria('logout', null, null, 'Cierre de sesion');
        }
        Cache.clear();
        AppUser.session = null;
        AppUser.profile = null;
        await window._supabase.auth.signOut();
        window.location.replace('login.html');
    } catch (err) {
        console.error('Logout error:', err);
        window.location.replace('login.html');
    }
}


// =============================================================
// REDIRECCION
// =============================================================

function redirectToLogin(msg = '') {
    if (msg) {
        sessionStorage.setItem('login_msg', msg);
    }
    window.location.replace('login.html');
}


// =============================================================
// ACTUALIZAR ULTIMO LOGIN
// =============================================================

async function updateLastLogin(userId) {
    try {
        await window._supabase
            .from('usuarios')
            .update({ ultimo_login: new Date().toISOString() })
            .eq('id', userId);
    } catch(e) { /* silencioso */ }
}


// =============================================================
// AUDITORIA
// =============================================================

/**
 * Registrar accion en la tabla auditoria
 * @param {string} tipo - tipo_auditoria enum
 * @param {string|null} tabla
 * @param {string|null} registroId
 * @param {string} descripcion
 * @param {Object} datosAntes
 * @param {Object} datosDespues
 */
async function registrarAuditoria(tipo, tabla, registroId, descripcion, datosAntes = null, datosDespues = null) {
    try {
        if (!AppUser.profile) return;
        await window._supabase.from('auditoria').insert({
            usuario_id:    AppUser.profile.id,
            tipo,
            tabla,
            registro_id:   registroId,
            descripcion,
            datos_antes:   datosAntes,
            datos_despues: datosDespues,
        });
    } catch(e) { /* auditoria no debe romper el flujo */ }
}


// =============================================================
// LISTENER DE CAMBIOS DE SESION (token refresh, logout externo)
// =============================================================

window._supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (!session && event === 'TOKEN_REFRESHED')) {
        const enLoginPage = window.location.pathname.includes('login');
        if (!enLoginPage) {
            Cache.clear();
            window.location.replace('login.html');
        }
    }
    if (event === 'TOKEN_REFRESHED' && session) {
        AppUser.session = session;
    }
});