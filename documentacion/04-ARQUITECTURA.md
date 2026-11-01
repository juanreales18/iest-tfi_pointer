# 04 · Arquitectura: cómo se organiza el código

## Árbol de carpetas

```text
iest-tfi_pointer/sistema/
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
└── (sin carpetas documentacion/ ni specs/: viven en la raíz del repositorio)
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
├── README.md · AGENTS.md · CLAUDE.md · memory.md   ← lo que lee el agente (tienen que estar en la raíz)
├── documentacion/   ← TODOS los .md del proyecto: constitución, kit 01 a 10, marca, prompts, declaración, matriz
├── specs/           ← una carpeta por funcionalidad (001, 002, 003)
├── sistema/         ← Pointer: el sitio que se publica en Netlify
├── base-de-datos/   ← SQL de Supabase y la función crear-usuario
├── multimedia/      ← logo, imágenes, video, gráficos y FICHAS-IA.md
├── tests/           ← tests automáticos (npm test)
└── .claude/         ← comandos y skills del agente (carpeta oculta: Claude Code la busca con ese nombre)
```

Las imágenes que muestra el sitio van en `sistema/img/`; los originales del logo y las piezas generadas con IA quedan en `multimedia/`.
