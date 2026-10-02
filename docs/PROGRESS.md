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
- Detección de filas inválidas y de códigos duplicados: conserva filas fuente; usa la última asignación para el costo y bloquea aplicación solo por filas inválidas/conflictos.
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

**Avance por inferencia controlada:** el contrato matemático visible del CTN ya fue extraído y documentado en OQ-023. El cruce con `Junio (1).xlsx` recuperó códigos contables y porcentajes de la receta por presentación. La respuesta del cliente sobre merma/grasa saturada ya se implementó; el cliente confirmó Excel como base 1:1 del reporte. La brecha pendiente es adaptar y cotejar técnicamente la salida del motor.

## Extensión candidata: seguimiento de importaciones

El archivo `Seguimiento Importaciones.xlsx` recibido del cliente contiene seguimiento de cargas, documentos, fechas, costos logísticos, alertas y KPI. Se considera una extensión candidata posterior a SPEC-005 (`SPEC-005.5`), no un reemplazo del importador mensual de costos. Su alcance debe formalizarse por separado tras validar los hitos, reglas de alertas y calidad de fechas/fórmulas del archivo.

## Actualización de respuestas funcionales — 1-oct-2026

El plan secuenciado para llevar estos pendientes a una versión preliminar está en [`docs/PLAN-DESARROLLO-VERSION-PRELIMINAR.md`](PLAN-DESARROLLO-VERSION-PRELIMINAR.md). La primera actividad propuesta es fijar la línea base vigente (Fase 0); el documento es un plan, no evidencia de que las tareas se hayan ejecutado.

**Avance posterior:** se integraron por fast-forward tres commits de `meeteam/main` (`731f736`) con branding, login y sidebar colapsable. La pantalla de login se revisó visualmente en local; se quitaron del UI las cuentas/contraseñas de prueba, sin alterar seeds. También se retiraron etiquetas de roadmap por semanas del dashboard/sidebar, se ajustaron descripciones, y Productos/Formulaciones ahora tienen estados vacíos con acciones de continuación en vez de mensajes de planificación. Se restringió el cálculo de sellos a `ADMIN`/`R_AND_D` en interfaz y servidor, de modo que Calidad y Finanzas conservan consulta sin ejecutar. Las otras rutas requieren recorrido visual y no se han ejecutado validaciones automatizadas.

En la revisión estática posterior, Costos dejó de afirmar que todo código repetido bloquea la importación y ya no precarga junio como período; Preparación Nutricional aclara dónde aparece el cálculo preliminar. Posteriormente se restringieron Usuarios/Auditoría a ADMIN y se aplicó la matriz provisional documentada en OQ-032.

El estado de guardas por módulo y las observaciones de OQ-032 están en [`docs/ROLE-ACTION-INVENTORY-2026-10-01.md`](ROLE-ACTION-INVENTORY-2026-10-01.md). La matriz provisional ya está aplicada en servidor e interfaz para esta preentrega.

La comparación requisito por requisito de la respuesta original del cliente y del diagrama, con evidencia y brechas sin ampliar alcance, está en [`docs/TRACEABILITY-CLIENT-RESPONSE-2026-10-01.md`](TRACEABILITY-CLIENT-RESPONSE-2026-10-01.md).

### Ya reflejado en implementación (requiere revalidación de aceptación, no reescritura funcional)

- SPEC-004 calcula nutrientes desde cantidades canónicas sin concentrarlos por merma y suma grasa saturada de todos los ingredientes.
- SPEC-003 exige suma porcentual exacta de `100` sin tolerancia en la transición a revisión.
- SPEC-005 conserva filas duplicadas y el resumen de costo selecciona la última `sourceRow`; la regla ya está implementada en `cost-actions.ts`.
- La sesión expira a 8 horas y la sesión activa se renueva en cada validación. La autenticación local sin SSO está confirmada.
- Director Técnico (`ADMIN`) puede devolver formulaciones y modificar parámetros regulatorios. Se implementó una bitácora versionada de umbrales con los valores existentes como línea base; nuevas versiones se auditan y se usan en cálculos futuros, sin reescribir snapshots previos. La selección completa de parámetros/precisión queda como observación de preentrega.

### Revisión visual local por rol (1-oct-2026)

- Login local de Calidad: `/productos` y `/documentos` muestran el aprobado; no hay acciones para guardar snapshot ni imprimir; acceso directo a `/usuarios` redirige al dashboard. El historial/auditoría no aparece en navegación ni dashboard.
- Login local de I+D: el catálogo muestra borradores y la ficha habilita modificación de merma por versión; `/documentos` ofrece guardar snapshot preliminar e imprimir; `/normativa` presenta parámetros e historial en lectura, sin edición.
- Se encontró un resumen de merma que mezclaba el valor heredado de la formulación con el valor de la versión activa (v.g. `11 %` en encabezado y `sin definir` en versión). Se corrigió para calcular salida solo con la merma explícita de la versión seleccionada; si no está definida, la salida queda sin estimar.
- La suma porcentual de `99,9990 %` en un borrador local exponía texto obsoleto de advertencia tolerable, pese a que el servidor ya bloqueaba el envío. Se alineó con respuesta del cliente: sin tolerancia; el aviso ahora es de error y se deshabilita el envío hasta total exacto.
- Recorrido solo lectura; no se guardó merma, snapshot, parámetros regulatorios ni cambios de formulación. No se creó ni eliminó información.

### Reconciliación documental de los dos Excel de junio

- `Junio (1).xlsx` es la fuente de formulación. En `SCHA DESAYUNO 480 G -14 UND`, filas 9 y 22, constan `COLOR NATURAL ROJO AC150` (`1250009`) y `HUMO TRUSMOKE OIL EX` (`1270004`). El mismo libro trae hojas de Salchicha Desayuno para 115 g, 240 g y 960 g.
- `Junio costos Base de Datos ME - MPNC - MPC.xlsx` es el maestro de costos, no la fuente de cantidades de receta. `Hoja1` lista esos dos códigos como KG con costos `83.551,55` y `50.662,00`, respectivamente.
- El importador existente `june-salchicha-master-import.ts` ya apunta a la hoja de 480 g, admite los 18 ingredientes y el fixture de unidad contiene ambos nombres confirmados. Por esta evidencia no se cambió código ni se creó otra formulación.
- Aclaración de operación: la carga del maestro desde el libro de junio es una utilidad puntual de inicialización/reconciliación para ese piloto, no una carga general mensual ni el flujo para incorporar cualquier producto. Se conserva disponible para entornos sin los 18 registros y rechaza códigos existentes con datos distintos. El Banco Nutricional es una carga separada para versionar perfiles cuando se reciba una nueva versión aprobada; requiere la hoja `TN OFICIAL`, pero no un mes específico ni una acción para la consulta diaria.
- Para evitar confundir una tarea de preparación con la operación recurrente, se retiró el formulario de carga inicial de junio de `/ingredientes`. La acción técnica se conserva en servidor para configurar un entorno piloto vacío; costos mensuales y actualizaciones del Banco siguen como procesos visibles separados.
- La importación CTN ahora acepta el libro `.xlsx` con hoja `CTN` o exportación `.csv`, y conserva por versión las cantidades y los valores nutricionales de cada fila. La previsualización y el cálculo de sellos usan esa fuente cuando está presente; las versiones históricas sin captura mantienen el Banco como fuente visible. La paridad final requiere importar/aprobar el CTN y cotejar sus salidas.
- **Comprobación local 1-oct-2026:** consulta Prisma en transacción `READ ONLY` confirmó ambos ingredientes activos, no pendientes de revisión, con perfil activo `BANCO_ALIMENTOS`, ligados a Salchicha Desayuno Premium 480 G v3 `APPROVED`. Sus porcentajes persistidos son `0,0252 %` y `0,0410 %`.
- No se cargaron ni alteraron datos. No se requiere nueva versión para incorporar esos dos ingredientes; la decisión de que Excel gobierna el reporte ya está confirmada. Sigue pendiente demostrar técnicamente la paridad 1:1 con sus fórmulas y resultados.

### Pendiente de desarrollo o definición

- **Brecha técnica de aceptación nutricional:** adaptar y cotejar el motor contra los Excel, dado que la decisión vigente exige réplica 1:1; los resultados actuales basados en perfiles activos de `TN OFICIAL` difieren. Ver OQ-031. No falta una nueva decisión del cliente sobre qué fuente gobierna el cálculo.
- **Bloqueante de SPEC-004:** interpretar y modelar el diagrama nuevo de sello de grasas animales; faltan taxonomía de carne/grasa/especie y comportamiento para desconocidos. Ver OQ-033.
- **Permisos:** matriz provisional aplicada. Recoger observaciones del cliente sobre alcance de Auditoría, costos y acciones de ejecución antes del cierre final. Ver OQ-032.
- **SPEC-006:** emisión oficial/PDF no disponible; snapshots preliminares versionados ya conservan soporte JSON, autor, fecha y referencia a formulación. Confirmar si se requiere artefacto final adicional.
- **Precisión:** precisar si dos decimales se refieren a porcentaje visible o almacenado; no relajar el control exacto de suma 100 mientras tanto. Ver OQ-034.
- **Costos / archivo de junio:** la regla de usar la última asignación está implementada; el archivo actual no se puede aplicar porque las filas 278 (`2906002`), 279 (`2917001`) y 506 (`1131002`) no tienen unidad. Confirmar unidad con cliente/Finanzas o recibir archivo corregido; no deducirla del nombre ni de otra fila. Ver OQ-025.
- **Acceso:** aclarar si “usuario” equivale al email existente o requiere username separado. Ver OQ-035.
- **Disponibilidad 24/7:** no es una función de sesión; falta objetivo/SLO y evidencia operacional de disponibilidad, fuera del código de autenticación. Ver OQ-037.
- **Datos maestros de Salchicha Desayuno Premium:** reconciliación completada para los dos ingredientes confirmados; los registros ya están en la v3 `APPROVED`. La paridad del reporte con Excel está pendiente de implementación/verificación, no de resolver la fuente con el cliente.

### Siguiente secuencia recomendada

**Avance aplicado (1-oct-2026):** rutas de Usuarios/Auditoría restringidas a `ADMIN`; Calidad/Finanzas reciben solo formulaciones aprobadas; snapshots documentales preliminares versionados e impresión para ADMIN/I+D; parámetros regulatorios versionados editables por ADMIN; merma configurada por versión y aplicada solo a cantidades. Las migraciones aditivas quedaron aplicadas y Prisma reportó el esquema actualizado. `tsc --noEmit`, `next build --webpack` y `git diff --check` pasan. Revisión visual autenticada completada para Calidad e I+D; no se ejecutó suite automatizada. Se corrigió el resumen de merma por versión y el bloqueo visual del total porcentual exacto.

**Hallazgo de fuente Excel (1-oct-2026):** el cliente confirmó que los Excel compartidos gobiernan el reporte y deben reproducirse 1:1. Los dos libros de junio inspeccionados sirven para receta/cantidades y costos, pero no contienen por sí solos una salida nutricional íntegra: `Junio (1).xlsx` enlaza otros libros y tiene resultados almacenados `#DIV/0!`/`#N/A`; el otro es maestro de costos. Esto no deja pendiente la decisión funcional; limita la evidencia disponible para la prueba de paridad, que debe construirse con el CTN y las fórmulas fuente registradas en SPEC-004.

**Claridad de módulos (1-oct-2026):** Normativa aclara que revisa perfiles y muestra parámetros base, sin calcular el reporte en esa pantalla; Costos explica la carga manual y selección del último costo por código; Documentos indica que incluye automáticamente todo producto con formulación aprobada y que la presencia en la lista no implica tabla completa ni documento oficial. Es una corrección de explicación, sin cambiar filtros, parámetros ni datos.

### OQ-031 — captura del Excel CTN por versión (2-oct-2026)

- La respuesta del cliente resuelve la fuente de cálculo: el reporte debe replicar los Excel compartidos 1:1. Para el reporte, esa regla posterior reemplaza la prioridad histórica de `TN OFICIAL` documentada en OQ-028; no cambia el uso del Banco Nutricional como catálogo de perfiles.
- El importador de CTN acepta ahora `.xlsx` con hoja `CTN` o `.csv`. Cada borrador importado guarda una captura inmutable de cantidades y nutrientes por fila en la versión; el cálculo nutricional y los sellos usan esa captura cuando está presente. Si ya no coincide con los ingredientes/cantidades de la versión, se bloquea el cálculo en vez de mezclar fuentes. Las versiones anteriores identifican explícitamente el Banco como su fuente.
- `/dashboard` y `/documentos` ya no presentan la situación como una confirmación pendiente del cliente. Informan que la fuente está confirmada y que queda el cotejo técnico.
- La migración aditiva `20261002100000_ctn_nutrient_source_snapshots` fue aplicada en PostgreSQL local. `npx prisma generate`, `npx tsc --noEmit`, `npx next build --webpack` y `git diff --check` finalizaron correctamente. No se ejecutó suite automatizada.
- No se pudo completar el cotejo numérico en esta sesión: los dos libros de junio inspeccionados son de receta/costos, no incluyen una salida nutricional íntegra ni una hoja `CTN`; no hay en el workspace una corrida CTN completa para importar y cotejar. Esto queda como límite de evidencia técnica, no como pregunta al cliente sobre la regla.

### Siguiente secuencia recomendada

1. Importar la fuente CTN nutricional completa a una nueva versión, aprobarla según el flujo y comparar celda-a-celda contra sus resultados de referencia; registrar evidencia reproducible de paridad.
2. Mantener OQ-033 (sello por especie/grasa) desacoplado hasta recibir taxonomía y definición de salida; no sustituir los sellos normativos existentes.
3. Entregar la matriz provisional y recoger las observaciones OQ-032; confirmar escala de porcentajes/OQ-034 e identificador de inicio de sesión/OQ-035.
4. Tratar disponibilidad 24/7 como hito de operación: acordar SLO, monitoreo, respaldo y recuperación antes de prometer esa disponibilidad.

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
