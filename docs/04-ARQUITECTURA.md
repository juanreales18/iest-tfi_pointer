# 04 · Arquitectura: cómo se organiza el código

## Árbol de carpetas

```text
iest-tfi_pointer/src/
├── index.html              ← entrada: redirige a login o dashboard según la sesión
├── login.html              ← pantalla de ingreso
├── dashboard.html          ← aplicación (barra lateral + secciones dinámicas)
├── pos.html                ← punto de venta con lector de código de barras
├── sw.js                   ← Service Worker (caché que se renueva en cada deploy)
├── netlify.toml            ← cabeceras de seguridad (CSP) y redirección
├── css/
│   ├── styles.css          ← variables de marca y estilos de componentes
│   └── pos.css             ← estilos de la pantalla de venta
├── js/
│   ├── vendor/
│   │   └── supabase.js     ← librería de Supabase incluida en el proyecto (sin CDN)
│   ├── config.js           ← crea el cliente de Supabase (window._supabase) y helpers
│   ├── auth.js             ← sesión, perfil, rol, licencia y registro de auditoría
│   ├── login.js            ← formulario de ingreso
│   ├── app.js              ← dashboard, caja, usuarios, auditoría y configuración
│   ├── products.js         ← productos, categorías, proveedores, compras y gastos
│   ├── reports.js          ← reportes de ventas y ganancias
│   └── pos.js              ← carrito, cobro y lector de código de barras
└── (sin carpetas docs/ ni specs/: viven en la raíz del repositorio)
```

## Función de cada parte

| Parte | Responsabilidad |
|---|---|
| `login.html` / `dashboard.html` / `pos.html` | Páginas del sistema; `dashboard.html` carga cada sección dentro del área de contenido |
| `css/styles.css` | Variables de marca, botones, tablas, tarjetas, modales y diseño responsive |
| `js/config.js` | Crea el cliente de Supabase; nadie más se conecta a la base |
| `js/auth.js` | Verifica la sesión y el rol antes de mostrar cada sección |
| `js/pos.js` | Escucha el lector, arma la venta y la registra |
| `sw.js` | Guarda los archivos en caché para que el sistema cargue rápido |
| `netlify.toml` | Cabeceras HTTP de seguridad |

## Reglas de organización

- Un archivo JavaScript por área del negocio.
- Toda consulta pasa por `window._supabase`, creado una sola vez en `config.js`.
- La lógica sensible (totales, stock, caja, cancelaciones) vive en funciones SQL: `crear_venta`, `cancelar_venta`, `get_costos` y los triggers (ver `05-DATOS.md`).
- Ningún archivo del frontend contiene claves secretas.

## Estructura del repositorio

```text
iest-tfi_pointer/
├── AGENTS.md · CLAUDE.md · memory.md · README.md · package.json
├── docs/        ← constitución, kit de especificación, prompts y declaración de IA
├── specs/       ← una carpeta por funcionalidad (spec, clarificación, plan, tareas, verificación)
├── .agents/skills/   ← skills propias (verificar-criterios, revisar-seguridad, escribir-ears)
├── .claude/commands/ ← comandos del agente (/spec, /clarificar, /planificar, /tareas, /verificar, /cambio)
├── src/         ← el sistema que se publica en Netlify (este árbol)
├── supabase/    ← SQL de la base y la Edge Function crear-usuario
├── tests/       ← tests automáticos (npm test)
├── public/      ← marca/ (logos) y media/ (imágenes del sitio)
└── multimedia/  ← piezas generadas con IA y FICHAS-IA.md
```

