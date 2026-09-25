# PROGRESS.md — Seguimiento de Avance

Este documento registra el estado comprobable del proyecto. Cada actualización debe separar: alcance implementado, evidencia de validación, decisiones pendientes y siguiente paso. Un estado de código o un HTTP 200 no sustituyen la aceptación funcional.

## Resumen al 14 de septiembre de 2026

| SPEC | Alcance | Estado | Estimación | Evidencia vigente | Pendiente / bloqueo |
|---|---|---|---:|---|---|
| SPEC-001 | Foundation: autenticación, roles, auditoría, Prisma y PostgreSQL | Cerrada | 7,0 h | Integrada previamente en `main` | Ninguno conocido para este alcance |
| SPEC-002 | Ingredientes y perfiles nutricionales | Cerrada | 5,5 h | Integrada previamente en `main` | Ninguno conocido para este alcance |
| SPEC-003 | Productos, presentaciones, formulaciones y versionamiento | Ajustado a respuestas funcionales | 6,0 h | Validación exacta `100,00 %`; aprobación y devolución restringidas a Director Técnico | Pendiente validación integrada contra PostgreSQL |
| SPEC-004 | Cálculo nutricional y sellos | Cierre técnico local validado | 9,5 h | Motor decimal; CTN; cantidades canónicas; perfiles `TN OFICIAL`; `FAT_TRANS=0` confirmado y auditado; v3 aprobada; UI verificada con 2 sellos | Pendiente aceptación funcional/regulatoria del cliente |
| SPEC-005 | Costos e importador mensual SIESA | Ajustado a respuestas funcionales | 5,5 h | Se conserva trazabilidad y se usa la última fila/costo duplicado | Pendiente validación integrada contra PostgreSQL |
| SPEC-006 | Fichas técnicas, textos legales y cierre | Preparación técnica parcial validada | 7,5 h | Previsualización de ingredientes y alérgenos desde formulación aprobada; 80/80 tests y build Webpack correctos | Requiere plantilla final, flujo de emisión y muestras aprobadas de salida |

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

- **Decisión confirmada:** `IN_REVIEW → DRAFT` y `IN_REVIEW → APPROVED` solo pueden ser ejecutadas por el Director Técnico (`ADMIN`).

### Estado Git

- Rama: `main`.
- HEAD de referencia: `854ae4718726d01d34bd6f782ae264781015db55`.
- SPEC-003 permanece sin commit, push ni despliegue.
- Los cambios locales preexistentes de documentación, dashboard, login y header se preservan y no se atribuyen a SPEC-003.

## Próximo hito: sellos regulatorios de SPEC-004

El motor ya aplica las respuestas funcionales confirmadas: calcula nutrientes desde cantidades canónicas sin ajustar nutrientes por merma; suma grasa saturada de todos los ingredientes; y persiste porcentajes exactos a `100,00`.

### Implementado (23-sep-2026)

**Umbrales normativa colombiana**: Resolución 810 de 2021 modificada por Resolución 2492 de 2022, Artículo 32, Tabla 17:

| Nutriente | Umbral | Referencia |
|-----------|--------|------------|
| Sodio | ≥ 300 mg/100g | Fijo |
| Azúcares | ≥ 10% energía total | Por kcal |
| Grasas saturadas | ≥ 10% energía total | Por kcal |
| Grasas trans | ≥ 1% energía total | Por kcal |

**Función implementada**: `calculateFormulationSeals(versionId, portionGrams)` en `nutrition-actions.ts`.

**Evaluación sobre v3 APROBADA** (Salchicha Desayuno Premium):

| Nutriente | Valor/100g | % Energía | Umbral | Sello |
|-----------|------------|-----------|--------|-------|
| Sodio | 613 mg | — | 300 mg | 🔴 EXCESO_SODIO |
| Azúcares | 0.66 g | 1.83% | 10% | ✅ |
| Grasa saturada | 3.51 g | 21.70% | 10% | 🔴 EXCESO_GRASAS_SATURADAS |
| Grasa trans | 0 g | 0% | 1% | ✅ |

**Resultado**: 2 sellos activos sobre la formulación vigente.

**Verificación visual (24-sep-2026)**: la pantalla `/productos/prod_0019` muestra el botón **Calcular sellos** y, al ejecutarlo sobre v3 `APPROVED`, presenta `EXCESO EN SODIO` y `EXCESO EN GRASAS SATURADAS`, con valores por 100 g y umbrales.

**Evidencia integrada**: PostgreSQL local saludable en `localhost:5439`, migraciones sin pendientes y pruebas de workflow existentes `8/8` correctas. La regularización de `FAT_TRANS=0` afectó 141 perfiles `BANCO_ALIMENTOS` y quedó auditada.

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

- **Decisión confirmada:** ante un código repetido se conservan todas las filas y se usa la última asignación del archivo. El duplicado no bloquea por sí solo aplicar la importación.
- La importación real del archivo canónico y su aprobación requieren al usuario `ADMIN`; no se cargó ni aplicó ningún archivo de cliente durante la validación técnica.

La preparación de SPEC-004 quedó documentada en `docs/specs/SPEC-004-nutritional-calculation-and-warning-seals.md`, junto con OQ-022, OQ-023 y OQ-024.

El módulo `/normativa` ahora ofrece un control de preparación para las formulaciones aprobadas: identifica ingredientes sin perfil activo, con más de un perfil activo o con un perfil activo sin valores. No selecciona una fuente de perfiles, no calcula nutrientes y no evalúa sellos; por tanto, no anticipa decisiones bloqueadas por OQ-022 a OQ-024.

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
