/* =============================================================
   KIOSCO SYSTEM - CONFIG.JS
   Configuracion de Supabase y utilidades globales
   ============================================================= */

// =============================================================
// CONFIGURACION SUPABASE
// Las credenciales se leen desde meta tags inyectados por
// Netlify en el momento del build usando sus variables de
// entorno. Ver: netlify.toml y el README de configuracion.
//
// Para desarrollo local: crea un archivo env.js con:
//   window.ENV = { SUPABASE_URL: '...', SUPABASE_ANON: '...' }
// y agregalo al .gitignore
// =============================================================

(function () {
    // 1. Intentar leer desde window.ENV (desarrollo local)
    const localEnv = window.ENV || {};

    // 2. Intentar leer desde meta tags inyectados por Netlify
    const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"]`);
        return el ? el.getAttribute('content') : null;
    };

    const SUPABASE_URL  = localEnv.SUPABASE_URL  || getMeta('supabase-url')  || '';
    const SUPABASE_ANON = localEnv.SUPABASE_ANON || getMeta('supabase-anon') || '';

    if (!SUPABASE_URL || !SUPABASE_ANON) {
        console.error(
            '[KioscoSystem] Credenciales de Supabase no configuradas.\n' +
            'Configura SUPABASE_URL y SUPABASE_ANON en las variables de entorno de Netlify,\n' +
            'o crea un archivo /js/env.js para desarrollo local.'
        );
    }

    // Inicializar cliente Supabase y exponerlo globalmente
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
})();


// =============================================================
// CONSTANTES GLOBALES
// =============================================================
const APP_NAME    = 'KioscoSystem';
const VERSION     = '1.0.0';
const ITEMS_PAGE  = 20; // registros por pagina
const TZ_AR      = '-03:00'; // Argentina no usa horario de verano

/**
 * Fecha de hoy (YYYY-MM-DD) en hora de Argentina.
 * No depende de la zona horaria del navegador ni de UTC
 * (toISOString() devuelve UTC y despues de las 21:00 ya marca el dia siguiente).
 */
function hoyAR() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
}


// =============================================================
// UTILIDADES: FORMATO
// =============================================================

/**
 * Formatear numero como moneda
 * @param {number} value
 * @param {string} symbol - simbolo de moneda (default '$')
 * @returns {string}
 */
function formatCurrency(value, symbol = '$') {
    const num = parseFloat(value) || 0;
    return `${symbol}${num.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Formatear fecha a string legible
 * @param {string|Date} date
 * @param {boolean} withTime
 * @returns {string}
 */
function formatDate(date, withTime = false) {
    if (!date) return '-';
    const d = new Date(date);
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (withTime) {
        opts.hour   = '2-digit';
        opts.minute = '2-digit';
    }
    return d.toLocaleDateString('es-AR', opts);
}

/**
 * Formatear numero con separadores de miles
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
    return (parseFloat(value) || 0).toLocaleString('es-AR');
}

/**
 * Obtener iniciales de un nombre
 * @param {string} nombre
 * @param {string} apellido
 * @returns {string}
 */
function getInitials(nombre = '', apellido = '') {
    const n = nombre.trim()[0] || '';
    const a = apellido.trim()[0] || '';
    return (n + a).toUpperCase() || 'U';
}

/**
 * Truncar texto largo
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(text, maxLen = 40) {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

/**
 * Escapar HTML para prevenir XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/**
 * Capitalizar primera letra
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


// =============================================================
// UTILIDADES: DOM
// =============================================================

/**
 * Selector corto
 * @param {string} selector
 * @param {Element} context
 * @returns {Element|null}
 */
function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Selector multiple
 * @param {string} selector
 * @param {Element} context
 * @returns {NodeList}
 */
function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Mostrar elemento (quitar clase hidden)
 * @param {string|Element} el
 */
function show(el) {
    const elem = typeof el === 'string' ? $(el) : el;
    if (elem) elem.classList.remove('hidden');
}

/**
 * Ocultar elemento
 * @param {string|Element} el
 */
function hide(el) {
    const elem = typeof el === 'string' ? $(el) : el;
    if (elem) elem.classList.add('hidden');
}

/**
 * Toggle clase hidden
 * @param {string|Element} el
 * @param {boolean} condition - si true muestra, si false oculta
 */
function toggleVisible(el, condition) {
    const elem = typeof el === 'string' ? $(el) : el;
    if (!elem) return;
    if (condition) {
        elem.classList.remove('hidden');
    } else {
        elem.classList.add('hidden');
    }
}

/**
 * Establecer texto de un elemento
 * @param {string} selector
 * @param {string} text
 */
function setText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text ?? '';
}

/**
 * Establecer HTML de un elemento
 * @param {string} selector
 * @param {string} html
 */
function setHtml(selector, html) {
    const el = $(selector);
    if (el) el.innerHTML = html ?? '';
}


// =============================================================
// UTILIDADES: TOAST NOTIFICATIONS
// =============================================================

/**
 * Mostrar notificacion toast
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - ms
 */
function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };

    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-msg">${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Cerrar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(div);

    // Cierre manual
    div.querySelector('.toast-close').addEventListener('click', () => removeToast(div));

    // Auto-cierre
    const timer = setTimeout(() => removeToast(div), duration);
    div._timer = timer;
}

function removeToast(div) {
    clearTimeout(div._timer);
    div.classList.add('removing');
    div.addEventListener('animationend', () => div.remove(), { once: true });
    setTimeout(() => div.remove(), 300);
}

function toastSuccess(msg) { toast(msg, 'success'); }
function toastError(msg)   { toast(msg, 'error', 5000); }
function toastWarning(msg) { toast(msg, 'warning'); }


// =============================================================
// UTILIDADES: MODAL GLOBAL (solo para dashboard.html)
// =============================================================

/**
 * Abrir modal global
 * @param {string} title
 * @param {string} bodyHtml
 * @param {string} footerHtml
 * @param {string} size - 'modal-sm' | '' | 'modal-lg' | 'modal-xl'
 */
function openModal(title, bodyHtml, footerHtml = '', size = '') {
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('modal');
    if (!overlay || !modal) return;

    // Reset tamanio
    modal.className = 'modal ' + size;

    setText('#modal-title', title);
    setHtml('#modal-body',  bodyHtml);
    setHtml('#modal-footer', footerHtml);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Cerrar modal global
 */
function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

// Cerrar modal al hacer click en overlay o boton X
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
});


// =============================================================
// UTILIDADES: VALIDACIONES
// =============================================================

/**
 * Validar que un campo no este vacio
 */
function required(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

/**
 * Validar email
 */
function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

/**
 * Validar que sea numero positivo
 */
function isPositiveNumber(value) {
    const n = parseFloat(value);
    return !isNaN(n) && n >= 0;
}

/**
 * Mostrar error en campo de formulario
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (field) field.classList.add('is-error');
    if (error) error.textContent = message;
}

/**
 * Limpiar errores de formulario
 */
function clearFieldErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.form-input.is-error').forEach(el => el.classList.remove('is-error'));
    form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}


// =============================================================
// UTILIDADES: DEBOUNCE
// =============================================================

/**
 * Debounce: retrasar ejecucion de funcion
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}


// =============================================================
// UTILIDADES: PAGINACION
// =============================================================

/**
 * Renderizar controles de paginacion
 * @param {string} containerId - id del contenedor
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {Function} onPageChange - callback(page)
 */
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';

    // Anterior
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

    // Paginas
    const range = getPaginationRange(currentPage, totalPages);
    range.forEach(p => {
        if (p === '...') {
            html += `<span class="page-btn" style="border:none;cursor:default;">...</span>`;
        } else {
            html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
    });

    // Siguiente
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (!isNaN(page)) onPageChange(page);
        });
    });
}

function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}


// =============================================================
// UTILIDADES: EXPORTAR CSV
// =============================================================

/**
 * Exportar array de objetos a CSV y descargar
 * @param {Array} data
 * @param {string} filename
 * @param {Object} headers - { key: 'Etiqueta' }
 */
function exportCSV(data, filename, headers) {
    if (!data || !data.length) {
        toastWarning('No hay datos para exportar');
        return;
    }

    const keys  = Object.keys(headers);
    const label = Object.values(headers);

    const rows = [
        label.join(','),
        ...data.map(row =>
            keys.map(k => {
                const val = row[k] ?? '';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];

    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}_${hoyAR()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Exportacion completada');
}


// =============================================================
// UTILIDADES: CONFIRMAR ACCION
// =============================================================

/**
 * Dialog de confirmacion simple usando modal global
 * @param {string} title
 * @param {string} message
 * @param {Function} onConfirm
 * @param {string} btnLabel
 * @param {string} btnClass
 */
function confirmAction(title, message, onConfirm, btnLabel = 'Confirmar', btnClass = 'btn-danger') {
    const body = `<p style="font-size:15px;color:var(--color-dark-3);line-height:1.6;">${escapeHtml(message)}</p>`;
    const footer = `
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn ${btnClass}" id="confirm-action-btn">${escapeHtml(btnLabel)}</button>
    `;
    openModal(title, body, footer, 'modal-sm');

    document.getElementById('confirm-action-btn').addEventListener('click', () => {
        closeModal();
        onConfirm();
    });
}


// =============================================================
// UTILIDADES: FECHAS RELATIVAS
// =============================================================

/**
 * Tiempo relativo (ej: "hace 5 minutos")
 * @param {string|Date} date
 * @returns {string}
 */
function timeAgo(date) {
    const d     = new Date(date);
    const now   = new Date();
    const secs  = Math.floor((now - d) / 1000);
    if (secs < 60)   return 'ahora mismo';
    const mins  = Math.floor(secs / 60);
    if (mins < 60)   return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)  return `hace ${hours}h`;
    const days  = Math.floor(hours / 24);
    if (days < 30)   return `hace ${days}d`;
    return formatDate(date);
}


// =============================================================
// UTILIDADES: STORAGE LOCAL (cache liviano)
// =============================================================
const Cache = {
    set(key, value, ttlMinutes = 5) {
        const item = { value, expires: Date.now() + ttlMinutes * 60 * 1000 };
        try { localStorage.setItem('kiosco_' + key, JSON.stringify(item)); } catch(e) {}
    },
    get(key) {
        try {
            const raw = localStorage.getItem('kiosco_' + key);
            if (!raw) return null;
            const item = JSON.parse(raw);
            if (Date.now() > item.expires) { this.del(key); return null; }
            return item.value;
        } catch(e) { return null; }
    },
    del(key) {
        try { localStorage.removeItem('kiosco_' + key); } catch(e) {}
    },
    clear() {
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith('kiosco_'))
                .forEach(k => localStorage.removeItem(k));
        } catch(e) {}
    }
};

// =============================================================
// CONFIGURACION DE LICENCIA
// Solo necesitas poner la clave que generaste en tu panel.
// En produccion se lee del meta tag <meta name="license-key"> de cada pagina.
// En desarrollo local tambien se puede definir en js/env.js (window.ENV.LICENSE_KEY).
// =============================================================
const LICENSE_CONFIG = {
    licencia: window.ENV?.LICENSE_KEY
              || document.querySelector('meta[name="license-key"]')?.getAttribute('content')
              || '',  // ej: 'LIC-RV7D2SR4'
};

console.log(`%c${APP_NAME} v${VERSION}`, 'color:#F59E0B;font-weight:800;font-size:16px;');