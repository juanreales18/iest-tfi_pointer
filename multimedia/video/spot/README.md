# Spot de Pointer (Remotion)

Video promocional de 73 s hecho con código en [Remotion](https://www.remotion.dev/) (React). El código lo escribió Claude a pedido del autor, que eligió el estilo (pueblo isométrico de noche, a partir de referencias de reels) y revisó cada escena.

## Qué hay

| Archivo | Para qué sirve |
|---|---|
| `src/Spot.tsx` | Línea de tiempo: las 9 escenas, voces, subtítulos, música y efectos |
| `src/Escenas.tsx` | Escenas isométricas (3, 4 y 8) y piezas comunes |
| `src/Escenas2D.tsx` | Escenas 2D y 3D con el vendedor (1, 2, 5, 6, 7) y el cierre (9) |
| `src/Pueblo.tsx` | El pueblo isométrico reutilizable (kiosco, gente, faroles, etiquetas) |
| `src/marca.tsx` | Colores y tipografías de `documentacion/IDENTIDAD-MARCA.md` |
| `gen/sonidos.py` | Genera la música y los efectos (sin samples de terceros) |
| `public/` | Fuentes Barlow (licencia OFL), logo, voces de ElevenLabs y sonidos |

## Cómo se renderiza

```bash
npm install
python3 gen/sonidos.py public/sfx      # música y efectos
# copiar las voces de ../voz/ a public/voz/
npx remotion studio                    # vista previa en el navegador
npx remotion render src/index.ts Spot spot-pointer.mp4
```

## Piezas y origen

- **Animación:** código propio en Remotion (sin clips de IA).
- **Voz en off:** ElevenLabs, plan gratuito (uso no comercial, atribución «elevenlabs.io»).
- **Música y efectos:** generados por código en `gen/sonidos.py`.
- **Logo:** diseñado con Canva (ver `documentacion/IDENTIDAD-MARCA.md`).
