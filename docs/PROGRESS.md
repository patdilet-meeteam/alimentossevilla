# PROGRESS.md — Seguimiento de Avance

Este documento registra el estado comprobable del proyecto. Cada actualización debe separar: alcance implementado, evidencia de validación, decisiones pendientes y siguiente paso. Un estado de código o un HTTP 200 no sustituyen la aceptación funcional.

## Resumen al 14 de septiembre de 2026

| SPEC | Alcance | Estado | Estimación | Evidencia vigente | Pendiente / bloqueo |
|---|---|---|---:|---|---|
| SPEC-001 | Foundation: autenticación, roles, auditoría, Prisma y PostgreSQL | Cerrada | 7,0 h | Integrada previamente en `main` | Ninguno conocido para este alcance |
| SPEC-002 | Ingredientes y perfiles nutricionales | Cerrada | 5,5 h | Integrada previamente en `main` | Ninguno conocido para este alcance |
| SPEC-003 | Productos, presentaciones, formulaciones y versionamiento | Cierre técnico validado | 6,0 h | `db:generate`, `db:deploy`, typecheck, lint, 62/62 tests y build Webpack correctos | OQ-021 para la autorización de rechazo funcional |
| SPEC-004 | Cálculo nutricional y sellos | Preparación documentada | 8,5 h | CTN v11 inspeccionado; patrón de ponderación identificado; SPEC y OQ-022 a OQ-024 preparados | Requiere CTN oficial, contrato de cálculo, mapeo de ingredientes y normativa confirmada |
| SPEC-005 | Costos e importador mensual SIESA | Cierre técnico validado | 5,5 h | `db:deploy`, typecheck, lint, 76/76 tests y build Webpack correctos | OQ-025 bloquea aplicar archivos con códigos duplicados; requiere revisión de Finanzas |
| SPEC-006 | Fichas técnicas, textos legales y cierre | No iniciada | 7,5 h | — | Requiere plantilla final y muestras aprobadas de salida |

**Estimación base:** 40,0 h. **Alcance técnico completado:** 24,0 h (SPEC-001 a SPEC-003 y SPEC-005). **Estimación base restante:** 16,0 h, sin incluir decisiones funcionales, correcciones de datos ni aceptación humana.

## SPEC-003 — Estado detallado

### Implementado

- Maestro de productos terminados y presentaciones comerciales.
- Relación confirmada `1 Producto → 1 Formulación → N Presentaciones`.
- Versiones secuenciales de formulación, ingredientes por versión y estados `DRAFT`, `IN_REVIEW`, `APPROVED`, `OBSOLETE`.
- Validación server-side, control de roles y registro de auditoría para operaciones de productos, presentaciones y versiones.
- Inmutabilidad de versiones: solo `DRAFT` permite cambios de ingredientes o porcentajes.
- Migraciones versionadas de Prisma para categorías reales de ingredientes y entidades de SPEC-003.

### Evidencia de cierre técnico

Ejecutado el 14 de septiembre de 2026 en PostgreSQL local `localhost:5439`:

```text
pnpm db:generate                       OK
pnpm db:deploy                         No pending migrations to apply
pnpm typecheck                         OK
pnpm lint                              OK
pnpm test                              62 passed, 0 failed
pnpm exec next build --webpack         OK
git diff --check                       OK
```

La revalidación posterior a la preparación de SPEC-004 confirmó nuevamente `62/62` pruebas, migraciones sin pendientes y build Webpack correcto. Las pruebas de integración solo alcanzan PostgreSQL cuando se ejecutan fuera del aislamiento de red del entorno; el contenedor `alimentossevilla_postgres` estaba `healthy` y publicado en `localhost:5439`.

El build con Turbopack no fue aceptado como evidencia porque el entorno restringido impidió que abriese un puerto durante el procesamiento CSS; el build Webpack sí completó con todas las rutas de la aplicación.

### Pendiente funcional

- **OQ-021:** confirmar quién puede ejecutar `IN_REVIEW → DRAFT`.
  - Mientras no exista respuesta del cliente, la aplicación permite esa transición solo a `ADMIN`, el único rol común entre las dos definiciones contradictorias de la SPEC.
  - No se debe ampliar ese permiso a `QUALITY` o `R_AND_D` sin confirmación.

### Estado Git

- Rama: `main`.
- HEAD de referencia: `854ae4718726d01d34bd6f782ae264781015db55`.
- SPEC-003 permanece sin commit, push ni despliegue.
- Los cambios locales preexistentes de documentación, dashboard, login y header se preservan y no se atribuyen a SPEC-003.

## Próximo hito: cierre de insumos para SPEC-004

Antes de escribir código para el motor nutricional, obtener y registrar:

1. Confirmación explícita de que CTN v11 es la fuente oficial o su reemplazo oficial.
2. Archivo(s) CTN de referencia completos, con fórmulas y resultados esperados para casos de prueba.
3. Regla exacta de rendimiento/merma, unidades y momento de aplicación en el cálculo.
4. Reglas oficiales de redondeo, cifras significativas y valores por 100 g / porción.
5. Normativa vigente, umbrales y fechas de aplicación de sellos.

Sin estos insumos, SPEC-004 no debe implementar fórmulas, límites regulatorios ni aproximaciones.

## SPEC-005 — Estado detallado

### Implementado

- Importación mensual de archivos `.xlsx`, con huella SHA-256 para impedir reprocesos del mismo archivo.
- Persistencia de las filas fuente, unidades, costos, hallazgos y trazabilidad de cada importación.
- Detección de filas inválidas y de códigos duplicados: el archivo queda en `DRAFT` y no selecciona costos silenciosamente.
- Creación de ingredientes desconocidos con `pendingReview=true`, sin descartar el archivo completo.
- Workflow `DRAFT → APPLIED → SUPERSEDED`, restringido a `ADMIN` y auditado.
- Cálculo de costo directo para una formulación aprobada: exclusivamente costos inequívocos con unidad `KG`; reporta faltantes, ambigüedad y unidades incompatibles sin convertir ni estimar valores.

### Evidencia de cierre técnico

Ejecutado el 14 de septiembre de 2026 contra PostgreSQL local `localhost:5439`:

```text
pnpm db:generate                       OK
pnpm db:deploy                         No pending migrations to apply
pnpm typecheck                         OK
pnpm lint                              OK
pnpm test                              76 passed, 0 failed
pnpm exec next build --webpack         OK
git diff --check                       OK
```

Las 3 pruebas de integración de SPEC-005 verifican persistencia, auditoría, aplicación de un período, reemplazo del período aplicado anterior y cálculo directo de materia prima. Los fixtures crean y eliminan sus propios datos.

### Pendiente funcional

- **OQ-025:** Finanzas debe definir cómo resolver un mismo código con más de un costo o unidad. Hasta entonces, ese caso se marca `DUPLICATE_CONFLICT`, es visible para revisión y bloquea aplicar la importación.
- La importación real del archivo canónico y su aprobación requieren al usuario `ADMIN` que representa a Finanzas; no se cargó ni aplicó ningún archivo de cliente durante la validación técnica.

La preparación de SPEC-004 quedó documentada en `docs/specs/SPEC-004-nutritional-calculation-and-warning-seals.md`, junto con OQ-022, OQ-023 y OQ-024.

**Hallazgo de trazabilidad:** el archivo CTN v11 no se puede convertir todavía en fixture de paridad. Su hoja `CTN`, rotulada como “SALCHICHAS DESAYUNO PREMIUM”, referencia códigos en la hoja oculta `Chorizo con ternera (3)`. Hasta que el cliente determine la hoja, producto y códigos canónicos, no se asociarán esos datos a ingredientes de la plataforma.

**Avance por inferencia controlada:** el contrato matemático visible del CTN ya fue extraído y documentado en OQ-023. El cruce con `Junio (1).xlsx` recuperó códigos contables y porcentajes de la receta por presentación. Permanecen bloqueadas la implementación y la paridad definitiva por dos anomalías de fórmula (merma y sello de grasa saturada) y por conflictos de identidad entre los colorantes y humos de ambas fuentes.

## Extensión candidata: seguimiento de importaciones

El archivo `Seguimiento Importaciones.xlsx` recibido del cliente contiene seguimiento de cargas, documentos, fechas, costos logísticos, alertas y KPI. Se considera una extensión candidata posterior a SPEC-005 (`SPEC-005.5`), no un reemplazo del importador mensual de costos. Su alcance debe formalizarse por separado tras validar los hitos, reglas de alertas y calidad de fechas/fórmulas del archivo.

## Plantilla para cada actualización

```text
Fecha:
SPEC / hito:
Estado: pendiente | en curso | cierre técnico | aceptación funcional | bloqueado
Cambios:
Evidencia: comandos, resultados, migraciones, pruebas y SHA
Riesgos / Open Questions:
Siguiente paso:
Autorizaciones requeridas:
```
