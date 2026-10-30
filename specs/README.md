# specs/

Una carpeta por funcionalidad, con el formato `NNN-nombre` (tres dígitos, minúsculas, sin tildes).

Cada carpeta recorre las fases del ciclo SDD (ver `AGENTS.md`):

```text
specs/001-nombre/
├── spec.md            ← /spec        (historias, RF en EARS, casos límite, fuera de alcance, criterios)
├── clarificacion.md   ← /clarificar  (hallazgos de la IA como QA y decisión del autor)
├── plan.md            ← /planificar  (cómo se construye, sin código, ligado a cada RF)
├── tasks.md           ← /tareas      (tareas de menos de 30 min con «Listo cuando»)
└── verificacion.md    ← /verificar   (cada RF: cumple / no cumple / prueba manual pendiente)
```

Si durante el desarrollo aparece un requisito nuevo, se usa `/cambio`: primero se actualiza la spec y después el código.
