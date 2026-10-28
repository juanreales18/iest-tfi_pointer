# Constitución de Pointer

> Principios que **no se negocian**. El agente los lee antes de escribir una spec, un plan, una tarea o una línea de código. Si una tarea choca con un principio, se detiene y pregunta.
>
> Cada principio tiene una **comprobación**: algo concreto que se puede revisar para saber si se cumple. La skill `verificar-criterios` y `npm test` usan estas comprobaciones.

## P1 · Stack

El sistema es **HTML + CSS + JavaScript sin framework**, con **Supabase** (PostgreSQL, Auth, RLS) y publicado en **Netlify**. No se agregan React, Vue, jQuery, Tailwind ni Bootstrap sin cambiar primero `docs/03-TECNOLOGIAS.md`.

**Comprobación:** `src/` no tiene `package.json` ni carpeta `node_modules/`; ningún HTML carga librerías desde un CDN de scripts.

## P2 · Marca

Los colores y las fuentes salen **solo de las variables CSS** definidas en `docs/IDENTIDAD-MARCA.md`. Ningún color se escribe a mano fuera del bloque `:root`.

**Comprobación:** test `marca: sin colores escritos a mano` de `tests/constitucion.test.js`.

## P3 · Capas

El navegador **muestra y pide**; la base de datos **decide**. Totales, stock, caja, costos y permisos se resuelven en PostgreSQL (funciones y RLS), nunca en el JavaScript del navegador.

**Comprobación:** las ventas solo se crean con `rpc('crear_venta')` y se anulan con `rpc('cancelar_venta')`; no existe `.from('ventas').insert` en `src/`; las 17 tablas tienen RLS activo.

## P4 · Tests

Cada requerimiento funcional de **prioridad alta** que se toca tiene al menos un test automático. **No se hace commit con `npm test` en rojo.**

**Comprobación:** `npm test` termina sin fallas; cada `specs/NNN/verificacion.md` nombra el test que cubre cada RF.

## P5 · Seguridad

En el repositorio y en el chat con la IA **no hay secretos**: ni la clave `service_role`, ni contraseñas, ni archivos `.env`. La `service_role` solo existe dentro de la Edge Function, como variable de entorno de Supabase. Los datos se validan **en la base** (restricciones y funciones), no solo en el formulario.

**Comprobación:** test `seguridad: sin secretos en el repositorio`; `.gitignore` incluye `.env`.

## P6 · Idioma

Todo en **español**: código, tablas, commits y documentación. La interfaz habla en **voseo**, con frases cortas y errores que dicen qué pasó y qué hacer.

**Comprobación:** los mensajes de commit siguen `docs/07-CONVENCIONES.md` (verbo en presente, en español, en minúsculas).

## P7 · Accesibilidad y rendimiento

Se diseña **desde 360 px** (celular) hacia arriba. Todas las imágenes tienen `alt`, todo se puede usar con teclado y el contraste del texto es suficiente (texto oscuro sobre amarillo, nunca blanco).

**Comprobación:** Lighthouse con 80 o más en Rendimiento, Accesibilidad, Buenas prácticas y SEO en la pantalla de ingreso; test `accesibilidad: todas las imágenes tienen alt`.

## P8 · Uso responsable de la IA

La IA **propone; la persona decide**. Ningún código, texto o imagen generado con IA entra al repositorio sin que el autor lo haya leído, entendido y aprobado. Nunca se pegan en un prompt datos personales reales, contraseñas ni claves. Toda pieza generada con IA lleva la leyenda **«Generado con IA»** y su ficha en `multimedia/FICHAS-IA.md`. No se generan imágenes, voces ni videos de personas reales.

**Comprobación:** cada pedido importante y cada error de la IA quedan en `docs/PROMPTS.md`; cada pieza de `multimedia/` tiene su ficha; la declaración firmada está en `docs/DECLARACION-IA.md`.

---

*Si un principio tiene que cambiar, primero se edita este archivo (con un commit propio que explique por qué) y después el código.*
