# Manual de identidad: Pointer

> Este archivo define cómo se ve y cómo habla Pointer. La IA debe leerlo antes de escribir cualquier pantalla, texto o componente.

## Esencia

| Elemento | Definición |
|---|---|
| **Nombre** | Pointer |
| **Eslogan** | *A confirmar por el autor* (propuesta: "Cada venta, en su lugar.") |
| **Misión** | Que cualquier kiosquero pueda vender, controlar su stock y cerrar la caja de forma rápida y segura, sin planillas ni cuadernos. |
| **Visión** | Ser el sistema de gestión de referencia para kioscos y comercios chicos del interior de Argentina. |
| **Personalidad** | Rápida, práctica, confiable y cercana. |
| **Público** | Dueños y empleados de kioscos y almacenes, que atienden de pie y con apuro. |

### Significado del nombre

**Pointer** ("puntero" en inglés) remite al **lector de código de barras que apunta y registra**, y al cursor que señala lo importante: el sistema le marca al kiosquero dónde está su plata y su mercadería. Es corto, se pronuncia fácil y funciona como nombre de producto de software.

> **Historial:** en el TP N° 3 el emprendimiento se llamaba *Re-Kiosco*. Se cambió a *Pointer* para la exposición de carreras del IEST (octubre de 2026), donde el sistema se presentó como producto de **Zondex**, la empresa armada para esa muestra. La paleta, las tipografías y el tono de voz se mantienen.

## Logo

El logo se guarda en `multimedia/marca/`.

| Versión | Archivo | Uso |
|---|---|---|
| Horizontal (isotipo + nombre) | `multimedia/marca/logo-horizontal.png` | Encabezado, login, documentos |
| Isotipo | `multimedia/marca/isotipo.png` | Favicon, barra lateral colapsada, avatar |

**Concepto:** se conserva el recurso del TP N° 3, un cuadrado de esquinas redondeadas color amarillo `#F59E0B` con la inicial en carbón `#1F2937`, seguido del nombre **Pointer** en el mismo carbón. Es el mismo recurso visual de la barra lateral del sistema, así la marca y la pantalla son coherentes.

> **Pendiente:** reemplazar el logo de Re-Kiosco por el de Pointer en `multimedia/marca/` (lo diseña el autor en Canva). Hasta entonces no se usa ningún logo generado por la IA.

**Tipografía del logo:** Nourd (peso semibold). Se usa **solo dentro de la imagen del logo**, no como fuente de la interfaz.

### Reglas del logo

- Altura mínima en pantalla: **32 px**.
- Área de seguridad: el alto de la inicial alrededor del logo.
- El logo horizontal se usa sobre fondos claros (Blanco o Gris niebla), porque su texto es carbón.
- Sobre fondos oscuros (por ejemplo la barra lateral `#111827`) se usa solo el isotipo, el cuadrado amarillo.

**La IA nunca debe:**

- Deformar, rotar ni recolorear el logo.
- Agregarle sombras, degradados ni efectos.
- Ponerlo sobre fondos de bajo contraste.
- Reconstruirlo con otra tipografía.

## Paleta de colores

Los colores salen del sistema real (`styles.css`).

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| Amarillo Pointer | `#F59E0B` | 245, 158, 11 | Color principal: botones, acentos, ítem activo |
| Ámbar oscuro | `#D97706` | 217, 119, 6 | Hover de botones y textos de énfasis |
| Crema | `#FEF3C7` | 254, 243, 199 | Fondos suaves, hover de filas, avisos |
| Carbón | `#1F2937` | 31, 41, 55 | Títulos, texto, encabezados de tabla |
| Negro profundo | `#111827` | 17, 24, 39 | Barra lateral y fondo del login |
| Gris pizarra | `#6B7280` | 107, 114, 128 | Textos de apoyo e íconos |
| Gris niebla | `#F9FAFB` | 249, 250, 251 | Fondo general de la aplicación |
| Blanco | `#FFFFFF` | 255, 255, 255 | Tarjetas, tablas y formularios |

### Colores de estado

| Estado | HEX | Uso |
|---|---|---|
| Éxito | `#10B981` | Venta registrada, caja abierta, stock suficiente |
| Peligro | `#EF4444` | Errores, caja cerrada, stock crítico |
| Información | `#3B82F6` | Avisos neutros |

Los colores de estado **solo avisan**, no se usan como color de marca.

### Proporción 60-30-10

- **60 %** fondos claros: Gris niebla y Blanco.
- **30 %** superficies oscuras: Carbón y Negro profundo (barra lateral, encabezados de tabla).
- **10 %** Amarillo Pointer: botones y llamados a la acción.

> **Regla de contraste:** el texto sobre amarillo es siempre Carbón `#1F2937`, nunca blanco.

## Tipografías

| Uso | Fuente | Peso | Notas |
|---|---|---|---|
| Títulos, números grandes, encabezados de tabla | **Barlow Condensed** | 700 y 800 | En mayúsculas, con `letter-spacing: 0.5px` |
| Textos, formularios, botones | **Barlow** | 400, 500, 600 y 700 | Tamaño base 15 px |
| Logo (solo dentro de la imagen) | **Nourd** | Semibold | No se usa en la interfaz web |

Ambas son de Google Fonts con licencia libre (OFL), por lo que se pueden usar en la web sin restricciones.

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800&display=swap" rel="stylesheet">
```

## Tono de voz

Pointer habla **en voseo, corto y directo**, como un compañero de mostrador: sin tecnicismos y sin vueltas.

| Sí | No |
|---|---|
| "Vendiste $ 0 hoy." | "Se ha registrado un total de ventas de $ 0." |
| "Se está acabando: quedan 3." | "El inventario se encuentra por debajo del mínimo." |
| "No pudimos guardar la venta. Probá de nuevo." | "Error 500: fallo de transacción." |
| "Abrí la caja para empezar a vender." | "Debe proceder a realizar la apertura de caja." |

- Frases cortas, verbos en voseo (*abrí, cerrá, probá*).
- Los errores explican qué pasó y qué hacer.
- Sin mayúsculas gritonas ni signos de exclamación de más.

## Variables para el código

Copiar tal cual en `css/styles.css`. La IA usa **siempre** estas variables, nunca colores escritos a mano.

| Variable | Valor |
|---|---|
| `--color-primary` | `#F59E0B` |
| `--color-primary-dark` | `#D97706` |
| `--color-primary-light` | `#FEF3C7` |
| `--color-dark` | `#1F2937` |
| `--color-dark-2` | `#111827` |
| `--color-gray` | `#6B7280` |
| `--color-bg` | `#F9FAFB` |
| `--color-surface` | `#FFFFFF` |
| `--color-success` | `#10B981` |
| `--color-danger` | `#EF4444` |
| `--color-info` | `#3B82F6` |

```css
/* css/styles.css */
:root {
    --color-primary:       #F59E0B;
    --color-primary-dark:  #D97706;
    --color-primary-light: #FEF3C7;
    --color-dark:          #1F2937;
    --color-dark-2:        #111827;
    --color-gray:          #6B7280;
    --color-bg:            #F9FAFB;
    --color-surface:       #FFFFFF;
    --color-success:       #10B981;
    --color-danger:        #EF4444;
    --color-info:          #3B82F6;

    --font-main:      'Barlow', sans-serif;
    --font-condensed: 'Barlow Condensed', sans-serif;

    --radius-md: 8px;
    --radius-lg: 12px;
}

h1 {
    font-family: var(--font-condensed);
    color: var(--color-dark);
}
```

Si la marca cambia un color, se edita una sola línea y se actualiza todo el sistema.
