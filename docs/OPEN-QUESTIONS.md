# OPEN-QUESTIONS.md — Catálogo de Preguntas Abiertas

Este documento centraliza todas las dudas funcionales, normativas y técnicas pendientes de resolución por parte del cliente **Alimentos Sevilla S.A.S.** o de las mesas de trabajo del Kick-Off funcional de la Semana 1.

> **REGLA DE TRABAJO:** Ningún agente ni desarrollador debe asumir o inventar una respuesta unilateral para estas preguntas. Toda implementación dependiente de una pregunta abierta debe postergarse o desacoplarse hasta su confirmación oficial.

---

## 1. Banco Nutricional y Materias Primas

### [OQ-001] ¿Cuál es la fuente oficial nutricional cuando existen múltiples valores o fuentes para una misma materia prima?
- **Respuesta Cliente:** Si un ingrediente cambia de proveedor y tiene componentes que alteran la composición nutricional, se considera un ingrediente diferente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 2. Formulaciones, Versiones y Workflows

### [OQ-002] ¿Una formulación es única por producto o puede variar según la presentación comercial?
- **Respuesta Cliente:** Es la misma formulación. Lo que cambia por presentación es el gramaje neto de producto terminado y el consumo de material de empaque.
- **Estado:** `CONFIRMADA EN SEMANA 1` (Modelo: 1 Producto -> 1 Formulación -> N Presentaciones).

### [OQ-003] ¿Bajo qué condiciones se dispara la creación de una nueva versión de una formulación?
- **Respuesta Cliente:** Cuando se cambian materias primas o porcentajes de participación dentro de la fórmula.
- **Estado:** `CONFIRMADA EN SEMANA 1` (Versiones inmutables v1, v2, v3).

### [OQ-004] ¿Existe un workflow formal de estados (Borrador -> En Revisión -> Aprobada -> Obsoleta)?
- **Respuesta Cliente:** El Director de I+D/Técnico debe liberar y aprobar cada cambio dejando trazabilidad.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-005] ¿Qué roles o cargos específicos tienen la potestad de aprobar formulaciones para producción?
- **Respuesta Cliente:** Rol Director / Calidad con perfil de aprobación.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 3. Motor de Cálculo Nutricional y Rendimientos

### [OQ-006] ¿Los archivos Excel CTN representan exactamente la lógica que debe reproducir el motor de cálculo?
- **Respuesta Cliente:** Sí, esa es la base oficial del cálculo y debe ser replicable matemáticamente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-007] ¿Cómo deben manejarse el rendimiento de cocción/horneo, transformación y pérdidas de proceso?
- **Respuesta Cliente:** Balance de masa directo: entran X kg de batch y salen Y kg cocidos; la diferencia es la merma de proceso que concentra los nutrientes.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-008] ¿Cuáles son exactamente las reglas oficiales de redondeo y cifras significativas aplicables?
- **Respuesta Cliente:** Sí, las reglas y tablas del archivo CTN son la base oficial.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 4. Normativa y Documentos Históricos

### [OQ-009] ¿Cómo deben reaccionar los documentos y formulaciones históricas ante un cambio de normativa regulatoria?
- **Respuesta Cliente:** Los documentos históricos no se alteran (permanecen inmutables como snapshots); el recálculo aplica únicamente a documentos futuros.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-010] ¿Quién está autorizado para modificar parámetros regulatorios (umbrales de sellos, valores diarios de referencia)?
- **Inferencia técnica aplicable:** `ADMIN` es el único rol que debe crear o modificar parámetros regulatorios. `QUALITY` puede revisar y utilizar los parámetros vigentes, pero no modificarlos. La inferencia sigue el alcance documentado del rol Administrador (parámetros del sistema), evita ampliar permisos mientras OQ-011 continúa abierta y exige auditoría/versionamiento de cada cambio.
- **Límite de la inferencia:** la matriz definitiva todavía requiere ratificación funcional; no se ampliará el permiso a `QUALITY` sin respuesta explícita.
- **Estado:** `ABIERTA (Pendiente Semana 4)`

---

## 5. Permisos y Roles de Usuario

### [OQ-011] ¿Cuál es la matriz definitiva de permisos por rol?
- **Estado:** `ABIERTA (Se ajustará progresivamente en Semana 2-6)`

---

## 6. Estructura Financiera, Costos y Códigos SIESA

### [OQ-012] ¿Cuál de los archivos de costos entregados representa el formato estándar del archivo mensual oficial?
- **Respuesta Cliente:** El archivo mensual de costos de materias primas.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-013] ¿Cuál es la estructura del código identificador SIESA?
- **Respuesta Cliente:** Prefijos por insumo: `11` = Carnes, `12` = Materia seca, `13` = Empaques, más códigos para Producto en Proceso y Producto Terminado.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-014] ¿Qué ocurre si el archivo financiero mensual contiene un código SIESA desconocido?
- **Respuesta Cliente:** El archivo mensual representa la última versión de materias primas e insumos. Si hay códigos nuevos, se advierte para parametrizar.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 7. Alcance Documental y Migración

### [OQ-015] ¿Debe migrarse información histórica o solamente información vigente?
- **Respuesta Cliente:** Solo la información vigente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-016] ¿El documento "Textos Legales" entregado representa el formato exacto que deberá generar la plataforma?
- **Respuesta Cliente:** Sí, es la guía y referencia de salida.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 8. Aspectos Técnicos Adicionales

### [OQ-017] ¿Cuál es la política corporativa de expiración de sesión y timeout por inactividad?
- **Contexto:** Se ha configurado una expiración de sesión por defecto de 8 horas con renovación pasiva.
- **Impacto:** Ajuste de configuración de seguridad de sesiones en `src/lib/auth/session.ts`.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-018] ¿Se requerirá a futuro autenticación federada (SSO / Azure AD / Google Workspace) o se mantiene autenticación local con email y contraseña segura?
- **Contexto:** SPEC-001 implementa autenticación local robusta con hash bcrypt y sesiones en base de datos.
- **Impacto:** Futura extensión del proveedor de autenticación.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 9. Preguntas abiertas durante SPEC-003 (Semana 3)

### [OQ-019] Tolerancia de cierre de % en una versión de formulación
- **Contexto:** el cliente aún no ha confirmado la tolerancia que se aplica a la suma de `porcentajeParticipacion` de los `FormulationIngredient` de una versión (¿se acepta 99.5 %? ¿99.8 %? ¿exacto 100 %?).
- **Impacto:** ajuste de la validación Zod de `FormulationIngredient` cuando se confirme; actualmente se trata como **advertencia visual**, no error.
- **Estado:** `ABIERTA (Bloqueante para SPEC-003.5 — carga inicial)`

### [OQ-020] Códigos SIESA duplicados entre operativo y contable
- **Contexto:** el cliente maneja la misma materia prima con dos códigos distintos según el sistema (ej. SAL YODADA REFISAL es `MPPS150` operativo y `1210005` contable). La validación actual los trata como ingredientes distintos.
- **Impacto:** la carga inicial de los 106 productos reales debe colapsarlos a un único registro por MP física. Decisión pendiente de Lina.
- **Estado:** `ABIERTA (Bloqueante para SPEC-003.5 — carga inicial)`

---

## 10. Respuestas del cliente — Preguntas Semana 3 (11-sep-2026, vía correo)

> Origen: correo del cliente con 15 preguntas operativas. Lina contestó en azul. Las preguntas y respuestas se transcriben aquí tal cual, y cada una deja una decisión técnica cerrada para SPEC-003, SPEC-003.5 y SPEC-005.

### [P-01] ¿Un mismo ingrediente puede existir con distintos proveedores o referencias?
- **Respuesta Cliente:** Sí, puede. Si los componentes cambian o alteran algo, se considera un ingrediente diferente; si no, es el mismo.
- **Decisión:** `Ingredient.siesaCode` identifica un único ingrediente. La asociación ingrediente↔proveedor se modela en una tabla aparte (`IngredientSupplier`, fuera del SPEC-003). **No** se duplican ingredientes por proveedor.
- **Estado:** `CONFIRMADA`

### [P-02] ¿Qué representa el código SIESA dentro de los archivos de costos?
- **Respuesta Cliente:** Es un código de identificación del insumo / producto en proceso / producto terminado. Los prefijos 11/12/13 son **insumos** (carnes / materia seca / empaques). Hay un cuarto prefijo para producto en proceso y otro para producto terminado.
- **Decisión:** el modelo actual de categorías (CARNE / MATERIA_SECA / EMPAQUE / ADITIVO) se queda como una taxonomía **nutricional** del producto. Para la capa de costos se necesita una segunda dimensión: `tipoCodigo` ∈ { `INSUMO`, `PRODUCTO_EN_PROCESO`, `PRODUCTO_TERMINADO` }. **Esto se modela en SPEC-005** (CostImport). Por ahora se documenta en `Ingredient` con un campo opcional `tipoCodigo` (default `INSUMO`).
- **Estado:** `CONFIRMADA con extensión a SPEC-005`

### [P-03] ¿Cómo se calcula la merma / rendimiento y a qué nivel se define?
- **Respuesta Cliente:** Ingresan kg `X`, salen kg `Y`, la diferencia es la merma de proceso.
- **Decisión:** `rendimientoEsperado` vive en `FormulationVersion` y representa la merma del **proceso** asociado a esa receta (no del producto, no de la formulación, no del ingrediente). El valor es un número entre 0 y 1 que expresa cuánto se pierde en el proceso (ej. 0.11 = 11 % de merma).
- **Estado:** `CONFIRMADA`

### [P-04] ¿Las distintas presentaciones (115 g / 240 g / 480 g / 960 g) usan la misma formulación?
- **Respuesta Cliente:** Sí, la misma formulación; cambia la cantidad de producto terminado y el consumo de empaque.
- **Decisión:** confirma OQ-002 tal cual está modelada. La asociación con materiales de empaque queda para SPEC-005 (CostImport) y SPEC-006 (Documentos Técnicos).
- **Estado:** `CONFIRMADA`

### [P-05] ¿Cuándo se crea una nueva versión de formulación?
- **Respuesta Cliente:** Cuando cambian ingredientes o % de ingredientes dentro de la fórmula.
- **Decisión:** confirma el modelo actual. El cambio de proveedor NO crea versión (OQ-013 sigue); el cambio de merma/rendimiento **sí** crea versión (porque está al nivel de proceso de la receta).
- **Estado:** `CONFIRMADA`

### [P-06] ¿Existe un flujo de revisión / aprobación?
- **Respuesta Cliente:** No existe de manera oficial hoy, pero el deber ser es que el Director libere cada cambio dejando trazabilidad.
- **Decisión:** el flujo del SPEC-003 (DRAFT → IN_REVIEW → APPROVED → OBSOLETE) se mantiene. En esta empresa, el rol `ADMIN` representa al Director Técnico (encargado de aprobar). El modelo de permisos no se cambia.
- **Estado:** `CONFIRMADA con interpretación del rol ADMIN`

### [P-07] ¿El archivo CTN de Salchicha Desayuno Premium es la referencia oficial para el cálculo nutricional?
- **Respuesta Cliente:** *(no respondió explícitamente)*
- **Decisión:** se asume **SÍ** por consistencia con la pregunta 8 ("Sin cifras representativas obviadas"). Si la cliente confirma lo contrario, se ajusta en SPEC-004.
- **Estado:** `INFERIDA — ABIERTA confirmación`

### [P-08] ¿Las reglas de redondeo y nutricionales de los Excel deben reproducirse tal cual?
- **Respuesta Cliente:** **Sí. Esa es la base del cálculo. Esta base debe ser replicable sin cifras representativas obviadas o no contempladas.**
- **Decisión:** SPEC-004 (motor nutricional) replica exactamente las reglas del Excel. No hay "atajos" ni reglas simplificadas. Los valores de rotulado se calculan por 100 g y por porción.
- **Estado:** `CONFIRMADA`

### [P-09] ¿La lista legal de ingredientes sale directamente de la formulación?
- **Respuesta Cliente:** **Sí**, desde la formulación, en orden decreciente según el % de participación.
- **Decisión:** SPEC-006 (Documentos Técnicos) ordena `FormulationIngredient` por `porcentajeParticipacion DESC` para componer la lista legal. No hay edición manual intermedia.
- **Estado:** `CONFIRMADA`

### [P-10] ¿El documento "Textos Legales" sirve como plantilla para los documentos generados?
- **Respuesta Cliente:** **Sí, es la guía. Es un ejemplo de las muchas fórmulas existentes.**
- **Decisión:** el PDF de "Textos Legales" es la plantilla estructural. SPEC-006 lo digitaliza y lo aplica a cada producto/presentación.
- **Estado:** `CONFIRMADA`

### [P-11] Cuando cambia una resolución o parámetro regulatorio, ¿se recalculan los documentos antiguos?
- **Respuesta Cliente:** **No. Los documentos históricos no deben alterarse. Su recálculo será usado para valores futuros.**
- **Decisión:** cuando se actualiza una regla nutricional, NO se recalculan los documentos antiguos (mantienen el valor con el que fueron emitidos). Esto se modela con un **snapshot inmutable de los valores calculados** al momento de emitir el documento. En SPEC-006 se especifica el modelo de snapshot.
- **Estado:** `CONFIRMADA — implica modelo de snapshot en SPEC-006`

### [P-12] ¿Qué archivo mensual carga Finanzas?
- **Respuesta Cliente:** **El archivo de costos de materia prima. Es la base para cualquier cálculo futuro.**
- **Decisión:** `Junio costos Base de Datos ME - MPNC - MPC.xlsx` es la fuente canónica de costos (ya vista en el shared drive). El formato mensual mantiene la misma estructura. Se carga en SPEC-005.
- **Estado:** `CONFIRMADA`

### [P-13] Si el archivo mensual trae un código SIESA que no existe en la plataforma, ¿qué ocurre?
- **Respuesta Cliente:** **Todo lo suministrado en el archivo mensual corresponde a la última versión de ingredientes y productos a fabricar.** (es decir, no es esperable que aparezcan códigos nuevos; si aparecen, hay que parametrizarlos).
- **Decisión:** cuando `CostImport` (SPEC-005) detecte un código SIESA nuevo, lo crea **automáticamente como ingrediente con un flag `pendienteRevision=true`** y notifica al equipo de finanzas. NO se rechaza el archivo completo.
- **Estado:** `CONFIRMADA con flujo de auto-creación`

### [P-14] ¿Quién revisa/aprueba los nuevos costos antes de aplicarlos?
- **Respuesta Cliente:** **El equipo de finanzas.**
- **Decisión:** en esta empresa, el equipo de finanzas opera con el rol `ADMIN` (mismo mapeo que en P-06). El modelo de `CostImport` tendrá un workflow similar a `FormulationVersion`: `DRAFT → APPLIED → SUPERSEDED`, donde `APPLIED` requiere aprobación de `ADMIN`.
- **Estado:** `CONFIRMADA con mapeo de rol ADMIN = Finanzas`

### [P-15] ¿Cargamos histórico o solo la información vigente?
- **Respuesta Cliente:** **Solo la información vigente.**
- **Decisión:** SPEC-003.5 (carga inicial) carga únicamente los **90 ingredientes del BIN**, los **106 productos de Junio** y la formulación del **CTN v11**. NO se carga histórico de productos/formulaciones/costos anteriores.
- **Estado:** `CONFIRMADA`

---

## 11. Cierre de preguntas abiertas (11-sep-2026)

Como consecuencia de las respuestas anteriores, las preguntas abiertas se actualizan así:

### [OQ-013] Tolerancia de cierre de % en una versión de formulación
- **Estado anterior:** `ABIERTA — Bloqueante para SPEC-003.5`
- **Decisión actualizada:** **se mantiene como warning visual, no bloquea**. Lina no respondió explícitamente a esta pregunta, pero su respuesta en P-08 ("sin cifras obviadas") refuerza que el sistema debe tolerar diferencias pequeñas de redondeo sin rechazar la versión. La decisión final sobre la tolerancia (¿99.5 %? ¿99.8 %?) queda pendiente para SPEC-004 (motor nutricional) cuando se midan los casos reales.
- **Estado:** `PARCIALMENTE RESUELTA — confirmar tolerancia exacta en SPEC-004`

### [OQ-014] Códigos SIESA duplicados entre operativo y contable
- **Estado anterior:** `ABIERTA — Bloqueante para SPEC-003.5`
- **Decisión actualizada:** **se mantiene el modelo actual** (`Ingredient.siesaCode` único, ambos formatos aceptados). En la carga inicial (SPEC-003.5) se cargan los 90 ingredientes del BIN (operativo, formato `MPxxxxxx`) primero, y los del archivo de costos (contable, formato `1210005`) después como `CostImportItem` referenciando al ingrediente del BIN por nombre cuando coincidan. Si hay duplicados explícitos, el equipo de finanzas decide cuál es el canónico y se actualiza el mapeo.
- **Estado:** `RESUELTA — decisión operativa definida para SPEC-003.5`

### [OQ-007] ¿El CTN v11 es la referencia oficial para el cálculo?
- **Estado anterior:** `ABIERTA — Pendiente Lina`
- **Decisión actualizada:** **asumida como SÍ** (ver P-07). Si la cliente confirma lo contrario, ajustar.
- **Estado:** `INFERIDA — ABIERTA confirmación`

### [OQ-021] ¿Quién puede devolver una versión desde `IN_REVIEW` a `DRAFT`?
- **Fuentes en conflicto:** La matriz de acciones de SPEC-003 asigna `rejectToDraft` a `QUALITY` y `ADMIN`; la tabla de transiciones de la misma SPEC asigna `IN_REVIEW → DRAFT` a `R_AND_D` y `ADMIN`.
- **Impacto:** La autorización de rechazo no puede considerarse confirmada. El resto de las transiciones inequívocas se mantiene; esta acción requiere decisión funcional antes de aceptación final.
- **Inferencia técnica aplicada:** mantener la acción exclusivamente en `ADMIN`. Es el único rol común entre ambas fuentes y el cliente ya indicó que el Director libera los cambios, representado actualmente por `ADMIN`. Esta decisión conserva el menor privilegio posible y coincide con la implementación vigente.
- **Estado:** `ABIERTA — E1 / E7`

---

## 12. Preparación SPEC-004 — Motor nutricional y sellos

### [OQ-022] ¿El archivo CTN v11 entregado es la referencia oficial vigente para SPEC-004?
- **Contexto:** La respuesta P-07 la considera una inferencia, no una confirmación explícita. El libro contiene la hoja `CTN`, análisis, tabla nutricional y presentaciones, además de ejemplos de otros productos.
- **Impacto:** Define el caso patrón contra el que deben verificarse fórmula, redondeo y resultados del motor.
- **Inferencia documental:** **sí puede tratarse como referencia oficial del comportamiento histórico de cálculo**. OQ-006 confirma que el Excel es la base oficial, P-08 exige replicarlo sin omitir cifras y P-15 selecciona expresamente la formulación CTN v11 para la carga vigente. Esta inferencia no convierte sus códigos de ingrediente ni posibles errores de fórmula en datos canónicos.
- **Estado:** `ABIERTA — requiere confirmación explícita del cliente`

### [OQ-023] ¿Cuál es el contrato exacto de cálculo que debe extraerse del CTN?
- **Contexto:** El libro contiene valores por ingrediente, aportes ponderados, resultados por 100 g, resultados por porción y presentaciones de 115 g, 240 g, 480 g y 960 g. No está documentado aún el orden formal de aplicación de merma/rendimiento, conversión de base, retenciones y redondeo intermedio/final.
- **Impacto:** Sin ese orden no se puede convertir las fórmulas Excel en un servicio reproducible ni crear pruebas de paridad.
- **Contrato inferido directamente de las fórmulas:** aporte por ingrediente = valor nutricional por 100 g × porcentaje de participación; luego se suman los aportes. Con merma `11 %`, la hoja multiplica humedad por `1 - merma` y los demás nutrientes por `1 + merma`. Los valores ajustados alimentan `Análisis`; allí se redondean primero grasa, carbohidratos, fibra, azúcares y proteína, y con esos valores se calcula energía. Los valores por porción se obtienen como valor por 100 g × gramos de porción / 100. Las porciones son 46 g para 115 g y 34 g para 240/480/960 g.
- **Inconsistencias no inferibles:** la fórmula de sello de grasa saturada usa únicamente `CTN!AA6` (aporte del tocino), no el total de grasa saturada; además, el ajuste de merma por multiplicación `1 ± 11 %` no expresa de forma inequívoca el balance de masa `entrada X / salida Y` descrito por el cliente. Debe decidirse si el motor replica literalmente esos comportamientos o corrige el Excel con una regla validada.
- **Estado:** `PARCIALMENTE RESUELTA — contrato extraído; dos decisiones funcionales pendientes`

### [OQ-024] ¿Qué fuentes y códigos de ingrediente son canónicos para el caso patrón CTN?
- **Contexto:** El libro incluye ejemplos de salchicha y chorizo, códigos de materia prima, descripciones y fuentes variadas (por ejemplo ICBF, FTP y referencias externas). En particular, la hoja `CTN` titulada “SALCHICHAS DESAYUNO PREMIUM” toma códigos de la hoja oculta `Chorizo con ternera (3)`. Debe confirmarse qué hoja/producto/códigos pertenecen al caso oficial y cómo se resuelven códigos vacíos o descripciones distintas.
- **Impacto:** Bloquea una importación o prueba de paridad que pueda asociar un perfil nutricional al ingrediente equivocado.
- **Cruce inferido:** `Junio (1).xlsx`, en las hojas de Salchicha Desayuno 115/240/480/960 g, contiene códigos contables y porcentajes consistentes entre presentaciones para las 18 líneas de la receta. Permite recuperar, entre otros, `2903003` Brazuelo, `1121009` Tocino, `2903002` Repele, `1131002` Agua, `1210006` Sal reducida, `1210004` Sal curante, `1240002` INBAC, `1220014` PVH, `1210003` Eritorbato y `1220010` Dextrosa.
- **Conflictos no inferibles:** el archivo de Junio identifica `COLOR NATURAL ROJO AC150` donde CTN dice `COLOR NATURAL LINICOL`, y `HUMO TRUSMOKE OIL EX` donde CTN dice `HUMO CHARDEX EN POLVO`. Los códigos visibles de CTN no son confiables porque enlazan una receta de chorizo. No se puede escoger entre CTN y Junio para esas identidades sin confirmación del cliente.
- **Estado:** `PARCIALMENTE RESUELTA — mapeo contable recuperado; identidades en conflicto pendientes`

---

## 13. Preguntas abiertas durante SPEC-005

### [OQ-025] ¿Cómo debe resolverse un código repetido con unidad o costo diferente dentro del archivo mensual?
- **Contexto:** el archivo canónico de junio contiene cuatro códigos repetidos. `2903003` aparece en `UND` y `KG` con costos diferentes; `2906001` aparece tres veces en `KG` con tres costos diferentes; otros duplicados combinan una unidad informada con otra vacía.
- **Impacto:** escoger la primera o última fila alteraría costos sin una regla confirmada.
- **Tratamiento técnico:** conservar todas las filas, marcarlas `DUPLICATE_CONFLICT` y mantener el import en `DRAFT`. No se calcula ni aplica un costo ambiguo.
- **Estado:** `ABIERTA — E2 / E5; bloquea aplicar el archivo, no bloquea importarlo y revisarlo`
