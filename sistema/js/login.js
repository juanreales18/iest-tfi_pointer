/* =============================================================
   KIOSCO SYSTEM - LOGIN.JS
   Logica del formulario de inicio de sesion
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    // Si ya hay sesion activa, redirigir directo
    const { data: { session } } = await window._supabase.auth.getSession();
    if (session) {
        window.location.replace('dashboard.html');
        return;
    }

    // Mostrar mensaje de sesion expirada u otros
    const loginMsg = sessionStorage.getItem('login_msg');
    if (loginMsg) {
        showAlert(loginMsg, 'error');
        sessionStorage.removeItem('login_msg');
    }

    // Referencias DOM
    const form        = document.getElementById('login-form');
    const emailInput  = document.getElementById('email');
    const passInput   = document.getElementById('password');
    const loginBtn    = document.getElementById('login-btn');
    const btnText     = document.getElementById('login-btn-text');
    const btnLoader   = document.getElementById('login-btn-loader');
    const alertBox    = document.getElementById('login-alert');
    const toggleBtn   = document.getElementById('toggle-password');
    const iconOff     = document.getElementById('icon-eye-off');
    const iconOn      = document.getElementById('icon-eye');

    // Toggle de contrasena
    toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type  = isPass ? 'text' : 'password';
        iconOff.style.display = isPass ? 'none'  : 'block';
        iconOn.style.display  = isPass ? 'block' : 'none';
    });

    // Submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        clearErrors();

        const email    = emailInput.value.trim();
        const password = passInput.value;
        let valid = true;

        // Validaciones frontend
        if (!email) {
            setError('email', 'El correo es obligatorio');
            valid = false;
        } else if (!isEmail(email)) {
            setError('email', 'Ingresa un correo valido');
            valid = false;
        }

        if (!password) {
            setError('password', 'La contrasena es obligatoria');
            valid = false;
        } else if (password.length < 6) {
            setError('password', 'Minimo 6 caracteres');
            valid = false;
        }

        if (!valid) return;

        setLoading(true);

        try {
            const { data, error } = await window._supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setLoading(false);
                handleAuthError(error);
                return;
            }

            // Verificar que el usuario tenga perfil en la tabla usuarios
            const { data: profile, error: profileError } = await window._supabase
                .from('usuarios')
                .select('id, activo, nombre')
                .eq('id', data.user.id)
                .eq('activo', true)
                .is('deleted_at', null)
                .single();

            if (profileError || !profile) {
                await window._supabase.auth.signOut();
                setLoading(false);
                showAlert('Tu cuenta no esta habilitada en el sistema. Contacta al administrador.', 'error');
                return;
            }

            // Login exitoso
            window.location.replace('dashboard.html');

        } catch (err) {
            setLoading(false);
            showAlert('Error de conexion. Verificá tu internet e intenta nuevamente.', 'error');
            console.error('Login error:', err);
        }
    });

    // Limpiar error de campo al escribir
    emailInput.addEventListener('input', () => clearFieldError('email'));
    passInput.addEventListener('input',  () => clearFieldError('password'));


    // =========================================================
    // HELPERS
    // =========================================================

    function setLoading(state) {
        loginBtn.disabled = state;
        btnText.classList.toggle('hidden', state);
        btnLoader.classList.toggle('hidden', !state);
    }

    function showAlert(message, type = 'error') {
        alertBox.textContent = message;
        alertBox.className   = `alert alert-${type}`;
        alertBox.classList.remove('hidden');
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideAlert() {
        alertBox.classList.add('hidden');
        alertBox.textContent = '';
    }

    function setError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + '-error');
        if (input) input.classList.add('is-error');
        if (error) error.textContent = message;
    }

    function clearFieldError(fieldId) {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + '-error');
        if (input) input.classList.remove('is-error');
        if (error) error.textContent = '';
    }

    function clearErrors() {
        clearFieldError('email');
        clearFieldError('password');
    }

    function handleAuthError(error) {
        const code = error?.message?.toLowerCase() || '';
        let msg = 'Credenciales incorrectas. Verifica tu correo y contrasena.';

        if (code.includes('invalid login credentials') || code.includes('invalid_credentials')) {
            msg = 'Correo o contrasena incorrectos.';
        } else if (code.includes('email not confirmed')) {
            msg = 'Debes confirmar tu correo electronico primero.';
        } else if (code.includes('too many requests') || code.includes('rate limit')) {
            msg = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
        } else if (code.includes('network') || code.includes('fetch')) {
            msg = 'Error de conexion. Verifica tu internet.';
        }

        showAlert(msg, 'error');
    }
});
