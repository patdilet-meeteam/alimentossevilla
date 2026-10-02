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
- **Respuesta inicial:** Balance de masa directo: entran X kg de batch y salen Y kg cocidos.
- **Corrección del cliente (1-oct-2026):** la merma aplica únicamente a cantidades totales; la diferencia representa pérdida de agua y los nutrientes permanecen en el producto final.
- **Decisión vigente:** no ajustar nutrientes por merma. Esta respuesta supersede la mención inicial de que la merma concentra nutrientes.
- **Implementación de preentrega:** para un lote base `X` y una merma fraccional `m` (ej. `0,11`), se muestra cantidad perdida `X × m` y salida total estimada `X × (1 − m)`. El porcentaje se guarda en la versión del proceso; editarlo requiere un borrador nuevo. Los cálculos nutricionales y el costo de materias primas siguen usando las cantidades de entrada.
- **Estado:** `CONFIRMADA E IMPLEMENTADA — merma solo en cantidad total; nutrientes conservados`

### [OQ-008] ¿Cuáles son exactamente las reglas oficiales de redondeo y cifras significativas aplicables?
- **Respuesta Cliente:** Sí, las reglas y tablas del archivo CTN son la base oficial.
- **Respuesta adicional (1-oct-2026):** no aplicar redondeo y mantener exactitud hasta 2 cifras significativas, ejemplificado como `100,00`.
- **Decisión:** la suma de porcentajes sigue siendo exactamente 100, sin tolerancia; qué precisión aplicar a cada porcentaje y su presentación queda pendiente en OQ-034.
- **Estado:** `PARCIALMENTE CONFIRMADA — ver OQ-034`

---

## 4. Normativa y Documentos Históricos

### [OQ-009] ¿Cómo deben reaccionar los documentos y formulaciones históricas ante un cambio de normativa regulatoria?
- **Respuesta Cliente:** Los documentos históricos no se alteran (permanecen inmutables como snapshots); el recálculo aplica únicamente a documentos futuros.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-010] ¿Quién está autorizado para modificar parámetros regulatorios (umbrales de sellos, valores diarios de referencia)?
- **Respuesta Cliente:** Director técnico.
- **Decisión:** `ADMIN` representa al Director Técnico y es el único rol autorizado para modificar parámetros regulatorios. Cada cambio debe versionarse y auditarse.
- **Implementación provisional:** `/normativa` permite crear versiones para los umbrales actuales de sodio, azúcares/grasa saturada y grasas trans; la v1 conserva los valores que ya usaba el sistema. Los cambios aplican inmediatamente a cálculos futuros y no reescriben snapshots previos.
- **Observación al cliente:** confirmar si además deben administrarse valores diarios de referencia u otros parámetros, y si se requiere programar una vigencia futura.
- **Estado:** `CONFIRMADA`

---

## 5. Permisos y Roles de Usuario

### [OQ-011] ¿Cuál es la matriz definitiva de permisos por rol?
- **Respuesta Cliente:** Administrador/Director Técnico: administración técnica; Calidad: consulta y visualización sin exportar ni imprimir; I+D: ejecutar, imprimir y modificar; Finanzas: consulta.
- **Mapeo provisional de perfiles:** `ADMIN` = Administrador/Director Técnico, `R_AND_D` = I+D, `QUALITY` = Calidad y `VIEWER` = Finanzas.
- **Confirmado en respuestas posteriores:** Calidad sin exportar/imprimir; I+D puede ejecutar/imprimir/modificar; Finanzas consulta; aprobación/devolución de formulaciones y modificación de parámetros regulatorios corresponden a Director Técnico (`ADMIN`).
- **Pendiente:** acciones concretas de ADMIN, permiso de exportar para I+D/Finanzas, definición de ejecutar por módulo y matriz completa de rutas/acciones. Ver OQ-032.
- **Estado:** `PARCIALMENTE CONFIRMADA — no tratar como matriz final`

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
- **Respuesta Cliente:** la sesión expira a las 8 horas y se renueva inmediatamente mientras el usuario permanezca activo; la consulta debe estar disponible 24/7.
- **Decisión:** Better Auth conserva `expiresIn` de 8 horas y renueva la sesión en cada validación activa (`updateAge: 0`).
- **Estado:** `CONFIRMADA`

### [OQ-018] ¿Se requerirá a futuro autenticación federada (SSO / Azure AD / Google Workspace) o se mantiene autenticación local con email y contraseña segura?
- **Respuesta Cliente:** solo usuario y contraseña.
- **Decisión:** se mantiene inicio de sesión local; SSO queda fuera de alcance.
- **Estado:** `CONFIRMADA`

---

## 9. Preguntas abiertas durante SPEC-003 (Semana 3)

### [OQ-019] Tolerancia de cierre de % en una versión de formulación
- **Respuesta Cliente:** no se acepta redondeo ni tolerancia; la suma debe mantenerse exactamente en `100,00`.
- **Aclaración recibida (1-oct-2026):** la respuesta confirma suma exacta; no se aplica tolerancia ni redondeo para validar. La escala de presentación individual queda en OQ-034.
- **Decisión:** la transición `DRAFT → IN_REVIEW` exige que la suma decimal almacenada sea exactamente 100; el servidor la bloquea y la interfaz deshabilita el envío cuando no se cumple.
- **Estado:** `CONFIRMADA E IMPLEMENTADA`

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

### [OQ-014] Códigos SIESA duplicados entre operativo y contable
- **Estado anterior:** `ABIERTA — Bloqueante para SPEC-003.5`
- **Decisión actualizada:** **se mantiene el modelo actual** (`Ingredient.siesaCode` único, ambos formatos aceptados). En la carga inicial (SPEC-003.5) se cargan los 90 ingredientes del BIN (operativo, formato `MPxxxxxx`) primero, y los del archivo de costos (contable, formato `1210005`) después como `CostImportItem` referenciando al ingrediente del BIN por nombre cuando coincidan. Si hay duplicados explícitos, el equipo de finanzas decide cuál es el canónico y se actualiza el mapeo.
- **Estado:** `RESUELTA — decisión operativa definida para SPEC-003.5`

### [OQ-007] ¿El CTN v11 es la referencia oficial para el cálculo?
- **Estado anterior:** `ABIERTA — Pendiente Lina`
- **Decisión actualizada:** **asumida como SÍ** (ver P-07). Si la cliente confirma lo contrario, ajustar.
- **Estado:** `INFERIDA — ABIERTA confirmación`

### [OQ-021] ¿Quién puede devolver una versión desde `IN_REVIEW` a `DRAFT`?
- **Respuesta Cliente:** Director técnico.
- **Decisión:** `IN_REVIEW → DRAFT` solo puede ejecutarlo `ADMIN` (Director Técnico), con motivo y auditoría.
- **Estado:** `CONFIRMADA`

---

## 12. Preparación SPEC-004 — Motor nutricional y sellos

### [OQ-022] ¿El archivo CTN v11 entregado es la referencia oficial vigente para SPEC-004?
- **Contexto:** La respuesta P-07 la considera una inferencia, no una confirmación explícita. El libro contiene la hoja `CTN`, análisis, tabla nutricional y presentaciones, además de ejemplos de otros productos.
- **Impacto:** Define el caso patrón contra el que deben verificarse fórmula, redondeo y resultados del motor.
- **Inferencia documental:** **sí puede tratarse como referencia oficial del comportamiento histórico de cálculo**. OQ-006 confirma que el Excel es la base oficial, P-08 exige replicarlo sin omitir cifras y P-15 selecciona expresamente la formulación CTN v11 para la carga vigente. Esta inferencia no convierte sus códigos de ingrediente ni posibles errores de fórmula en datos canónicos.
- **Respuesta Cliente:** los archivos Excel compartidos son la base del cálculo nutricional vigente y la réplica debe ser 1:1.
- **Estado:** `CONFIRMADA`

### [OQ-023] ¿Cuál es el contrato exacto de cálculo que debe extraerse del CTN?
- **Contexto:** El libro contiene valores por ingrediente, aportes ponderados, resultados por 100 g, resultados por porción y presentaciones de 115 g, 240 g, 480 g y 960 g. No está documentado aún el orden formal de aplicación de merma/rendimiento, conversión de base, retenciones y redondeo intermedio/final.
- **Impacto:** Sin ese orden no se puede convertir las fórmulas Excel en un servicio reproducible ni crear pruebas de paridad.
- **Contrato inferido directamente de las fórmulas:** aporte por ingrediente = valor nutricional por 100 g × porcentaje de participación; luego se suman los aportes. Con merma `11 %`, la hoja multiplica humedad por `1 - merma` y los demás nutrientes por `1 + merma`. Los valores ajustados alimentan `Análisis`; allí se redondean primero grasa, carbohidratos, fibra, azúcares y proteína, y con esos valores se calcula energía. Los valores por porción se obtienen como valor por 100 g × gramos de porción / 100. Las porciones son 46 g para 115 g y 34 g para 240/480/960 g.
- **Respuesta Cliente:** la fórmula de merma se usa únicamente para cantidades totales. Los nutrientes no se ajustan por merma porque la pérdida es agua y los nutrientes permanecen en el producto final. La grasa saturada es la suma de los aportes de todos los ingredientes; que el Excel usara solo tocino era una limitación de su ejemplo.
- **Decisión:** el motor debe conservar los aportes nutricionales ponderados sin factor de merma y sumar `FAT_SATURATED` de todos los ingredientes. La merma se aplica solo a cantidades totales del proceso.
- **Estado:** `CONFIRMADA`

### [OQ-024] ¿Qué fuentes y códigos de ingrediente son canónicos para el caso patrón CTN?
- **Contexto:** El libro incluye ejemplos de salchicha y chorizo, códigos de materia prima, descripciones y fuentes variadas (por ejemplo ICBF, FTP y referencias externas). En particular, la hoja `CTN` titulada “SALCHICHAS DESAYUNO PREMIUM” toma códigos de la hoja oculta `Chorizo con ternera (3)`. Debe confirmarse qué hoja/producto/códigos pertenecen al caso oficial y cómo se resuelven códigos vacíos o descripciones distintas.
- **Impacto:** Bloquea una importación o prueba de paridad que pueda asociar un perfil nutricional al ingrediente equivocado.
- **Cruce inferido:** `Junio (1).xlsx`, en las hojas de Salchicha Desayuno 115/240/480/960 g, contiene códigos contables y porcentajes consistentes entre presentaciones para las 18 líneas de la receta. Permite recuperar, entre otros, `2903003` Brazuelo, `1121009` Tocino, `2903002` Repele, `1131002` Agua, `1210006` Sal reducida, `1210004` Sal curante, `1240002` INBAC, `1220014` PVH, `1210003` Eritorbato y `1220010` Dextrosa.
- **Respuesta Cliente:** para Salchicha Desayuno Premium se usan los ingredientes del archivo de junio `COLOR NATURAL ROJO AC150` y `HUMO TRUSMOKE OIL EX`.
- **Decisión:** esos dos nombres del archivo de junio son canónicos para la fórmula de Salchicha Desayuno Premium. Los demás cruces deben conservar la trazabilidad de su fuente.
- **Estado:** `CONFIRMADA`

---

## 13. Preguntas abiertas durante SPEC-005

### [OQ-025] ¿Cómo debe resolverse un código repetido con unidad o costo diferente dentro del archivo mensual?
- **Contexto:** el archivo canónico de junio contiene cuatro códigos repetidos. `2903003` aparece en `UND` y `KG` con costos diferentes; `2906001` aparece tres veces en `KG` con tres costos diferentes; otros duplicados combinan una unidad informada con otra vacía.
- **Impacto:** escoger la primera o última fila alteraría costos sin una regla confirmada.
- **Respuesta Cliente:** usar el último costo asignado.
- **Decisión:** se conservan todas las filas del archivo por trazabilidad; la de mayor `sourceRow` es la última asignación y es la que se usa para calcular. El duplicado no bloquea aplicar la importación si no existen otras filas inválidas.
- **Validación contra el archivo recibido (1-oct-2026):** el código `2906002` tiene su última fila en 278 con costo `8.851,17`, pero la unidad está vacía; `1131002` (agua) tiene última fila en 506, costo `0` y unidad vacía. Además, `2917001` en fila 279 no declara unidad. El importador marca las filas sin unidad como inválidas y no permite aplicar el archivo mientras permanezcan; no se infiere la unidad de otra fila ni de la descripción.
- **Estado:** `REGLA DE DUPLICADOS CONFIRMADA — carga del archivo actual pendiente de completar/confirmar las unidades vacías`.

### [OQ-026] Precisión canónica de porcentajes en CTN Salchicha Desayuno Premium v11
- **Evidencia:** el CSV entregado `CTN - Salchicha Desayuno Premium - v11.xlsx - CTN.csv` contiene 18 porcentajes visibles que suman `100,005 %`; su fila `TOTAL` muestra `100 %` y la respuesta funcional exige exactamente `100,00 %`, sin tolerancia ni redondeo para validar.
- **Decisión técnica:** `CANTIDAD` es la fuente canónica. En importaciones se calcula `participación = cantidad / suma(cantidades) × 100` con decimal de alta precisión. Al persistir a cuatro decimales, el residuo de redondeo se distribuye determinísticamente por mayor fracción residual, conservando una suma exacta `100,0000 %`. Se guardan las cantidades y porcentajes fuente en la evidencia de importación para trazabilidad.
- **Razonamiento:** los porcentajes visibles son presentación redondeada y no pueden ser el valor persistido si contradicen el total declarado y la guarda funcional exacta.
- **Estado:** `RESUELTA — decisión técnica trazable`

### [OQ-027] Equivalencia nutricional de `COLOR NATURAL NARANJA PR801WD`
- **Evidencia:** la fórmula de junio usa el código SIESA `1250004` con la descripción `COLOR NATURAL NARANJA PR801WD`. La hoja `TN OFICIAL` del Banco Nutricional contiene `NaranjaPR80J WD`. Ambas referencias son similares, pero no son idénticas.
- **Decisión:** el cargador del maestro crea el ingrediente con su código y descripción de junio, pero no le asigna `genericName` ni le carga un perfil nutricional desde esa fila del Banco. El resto de mapeos se expresa de forma explícita y auditable.
- **Respuesta Director Técnico:** ambos nombres representan el mismo colorante.
- **Decisión:** el código SIESA `1250004` se vincula a `NaranjaPR80J WD` y puede recibir el perfil de `TN OFICIAL`.
- **Estado:** `CONFIRMADA`

### [OQ-028] ¿Qué fuente nutricional prevalece cuando el CTN y `TN OFICIAL` difieren para un ingrediente canónico?
- **Evidencia:** La v3 `DRAFT` de Salchicha Desayuno Premium usa 18 ingredientes, `487,948` de cantidad canónica y `100,0000 %`. Contra la fila `TOTAL` del CTN, el motor con los perfiles activos de `TN OFICIAL` obtiene por 100 g: grasa `9,4045` vs `9,36`, grasa saturada `3,5058` vs `3,50`, proteína `15,1441` vs `15,15` y sodio `613,0367` vs `616,13`.
- **Discrepancias de fuente:** el perfil de `COLOR NATURAL ROJO AC150` no coincide con `COLOR NATURAL LINICOL`; `PLASMA PORCINO` difiere en grasa saturada, proteína, carbohidratos y sodio; y `HUMO TRUSMOKE OIL EX` difiere de `HUMO CHARDEX EN POLVO` en grasa, grasa saturada, carbohidratos, azúcares y sodio.
- **Impacto:** OQ-022 exige reproducir el CTN 1:1, mientras que la carga vigente conserva `TN OFICIAL` como perfil activo. Elegir uno, mezclar valores o sustituir perfiles cambiaría una fuente nutricional y no puede inferirse técnicamente.
- **Respuesta Director Técnico:** prevalece `TN OFICIAL`.
- **Decisión:** los perfiles activos versionados desde `TN OFICIAL` son la fuente nutricional vigente. El CTN conserva trazabilidad de receta, cantidades y resultados históricos, pero sus valores por ingrediente no sustituyen ni corrigen automáticamente perfiles del Banco.
- **Vigencia:** decisión histórica de fuente de perfiles. Para el cálculo del reporte, la respuesta posterior del cliente en OQ-031 establece Excel 1:1 y sustituye esta prioridad cuando los resultados difieren.
- **Estado:** `SUPERADA PARA LA SALIDA DEL REPORTE POR OQ-031 — conserva vigencia como decisión de administración del Banco Nutricional`

### [OQ-029] ¿Cómo se interpreta la ausencia de `FAT_TRANS` en `TN OFICIAL`?
- **Decisión:** cuando la fila oficial no informa `FAT_TRANS`, se persiste explícitamente `0` g/100 g.
- **Trazabilidad:** el valor queda registrado con el método `TN OFICIAL · valor por defecto confirmado` y la importación o regularización deja un `AuditEvent` con el conteo afectado.
- **Estado:** `CONFIRMADA — decisión funcional del 24-sep-2026`

### [OQ-030] ¿Qué fuente debe prevalecer entre TL v4/arte final y el cálculo vigente de la plataforma?
- **Evidencia:** el TL v4 de `SALCHICHA DESAYUNO PREMIUM 480 g` declara aproximadamente 163 kcal, grasa total 10 g, grasa saturada 3,9 g y sodio 579 mg; además muestra únicamente un sello frontal de sodio. La plataforma, usando la v3 `APPROVED` y perfiles activos `TN OFICIAL`, calcula 145,4 kcal, grasa total 9,40 g, grasa saturada 3,51 g y sodio 613,04 mg, y propone sellos de sodio y grasas saturadas.
- **Impacto:** no se puede emitir una ficha técnica ni validar el arte final si la tabla nutricional y los sellos no tienen una fuente canónica única.
- **Respuesta posterior del cliente:** el reporte nutricional vigente debe reproducir los Excel compartidos 1:1 (OQ-031). Por tanto, la plataforma no debe usar el TL v4 como fuente de cálculo ni copiar sus valores para ocultar la diferencia.
- **Pendiente de producto:** el documento/arte final todavía debe ser revisado contra el cálculo Excel implementado y el criterio de sellos confirmado; la explicación del arte de sodio por sí solo no bloquea la regla de cálculo Excel.
- **Estado:** `FUENTE DE CÁLCULO RESUELTA — conciliación técnica del arte/documento final después de implementar y cotejar Excel`

---

## 14. Respuestas del cliente — actualización recibida el 1-oct-2026

### [OQ-031] Paridad técnica del reporte con el Excel confirmado
- **Respuesta Cliente:** los Excel compartidos son la base de cálculo usada actualmente para el reporte nutricional y la plataforma debe replicarlos 1:1.
- **Hallazgo en los dos libros de Junio recibidos (1-oct-2026):** `Junio (1).xlsx` contiene hojas de receta/costo/merma con fórmulas enlazadas a otros libros; la hoja piloto de 480 g presenta resultados almacenados `#DIV/0!` y `#N/A`. `Junio costos Base de Datos ME - MPNC - MPC.xlsx` es un libro de costos (`Hoja1`/`Hoja2`). No encontramos en ninguno una tabla de resultados de nutrientes que se pueda usar como salida esperada del reporte. Ver [inspección de fuentes](DATA-SOURCES.md).
- **Decisión vigente:** la instrucción más reciente del cliente confirma que la salida del reporte debe reproducir los Excel compartidos 1:1. Esta prioridad sustituye la decisión anterior de usar `TN OFICIAL` como resultado nutricional prevalente cuando difiera del Excel; `TN OFICIAL` sigue siendo una fuente importable de perfiles, pero no prueba ni reemplaza la paridad del reporte.
- **Implementación:** el importador CTN ahora acepta `.xlsx` (hoja `CTN`) o `.csv` y guarda, de forma inmutable por versión, cantidades y valores nutricionales de cada fila. Los cálculos/documentos usan esa captura cuando existe; si una fórmula cambió y la captura ya no corresponde, se bloquea el cálculo en vez de volver silenciosamente al Banco. Las versiones previas sin captura conservan su fuente de perfiles activos.
- **Límite de evidencia:** los dos libros de junio inspeccionados son de receta/costos y no contienen por sí solos una salida nutricional íntegra. La comparación completa de una nueva versión contra el CTN depende de importar el archivo fuente correspondiente. Esto no revoca la decisión del cliente ni requiere volver a preguntar qué fuente debe gobernar.
- **Estado:** `DECISIÓN FUNCIONAL RESUELTA E IMPLEMENTADA — cotejo numérico 1:1 pendiente para una versión importada del CTN`.

### [OQ-032] Matriz final de permisos por acción y perfil
- **Respuesta Cliente:** Administrador / Director Técnico; Calidad: consultar y ver sin exportar o imprimir; I+D: ejecutar, imprimir y modificar; Finanzas: consulta.
- **Matriz provisional aplicada para preentrega:** `ADMIN` (Administrador/Director Técnico) administra y consulta todos los módulos, aprueba/devuelve formulaciones, administra usuarios, consulta auditoría, gestiona costos y crea snapshots preliminares; `R_AND_D` consulta y modifica los módulos técnicos, ejecuta cálculos y puede imprimir la previsualización; `QUALITY` consulta los módulos y documentos, no modifica, exporta ni imprime; `VIEWER` (Finanzas) consulta, sin acciones de modificación, exportación o impresión desde la aplicación.
- **Límites de impresión:** solo se habilita el control de impresión de la previsualización a `ADMIN` e `I+D`; Calidad/Finanzas reciben una salida de impresión vacía en esa pantalla. No existe exportación de documentos ni emisión oficial.
- **Visibilidad:** Usuarios y Auditoría quedan restringidos a `ADMIN`; Calidad/Finanzas consultan únicamente versiones de formulación `APPROVED`, mientras `ADMIN` e `I+D` pueden consultar el historial completo.
- **Costos:** se conserva carga/aplicación para `ADMIN` únicamente. Esta decisión provisional sigue la respuesta más reciente (Finanzas consulta) y prevalece para la preentrega sobre P-14 anterior, que mapeaba Finanzas a ADMIN.
- **Observaciones para el cliente:** confirmar si I+D requiere acceso al módulo Auditoría, si Finanzas puede imprimir, si alguna operación de costos corresponde al rol Finanzas, y qué acciones adicionales comprende “ejecutar”. Ajustaremos la matriz tras revisión de preentrega.
- **Hallazgos de código (1-oct-2026):** el cálculo está limitado en servidor e interfaz a `ADMIN`/`R_AND_D`; Usuarios/Auditoría a `ADMIN`; las listas de producto/formulación filtran estados no aprobados para `QUALITY`/`VIEWER`. Ver el [inventario de permisos actual](ROLE-ACTION-INVENTORY-2026-10-01.md).
- **Estado:** `MATRIZ PROVISIONAL DE PREENTREGA APLICADA — abierta a observaciones del cliente`.

### [OQ-033] Regla del diagrama de sello por grasas animales
- **Insumo recibido:** diagrama titulado “Una sola grasa sin carne de su especie activa el sello”: leer ingredientes, clasificar especie + carne o grasa; si no hay grasa animal, sin sello; si cada grasa tiene carne de su misma especie, sin sello; si al menos una grasa no tiene carne de su especie, con sello de grasa.
- **Pendiente:** definir qué ingredientes cuentan como carne y grasa, cómo se reconoce especie y sinónimos/ingredientes compuestos, cómo se trata una especie desconocida y si el resultado activa el sello existente de grasas saturadas o un sello distinto. El diagrama describe un criterio de composición que no está cubierto por los umbrales actuales de SPEC-004.
- **Estado:** `ABIERTA — bloqueante para implementar esta regla de sello`.

### [OQ-034] Precisión de porcentajes: exactitud decimal frente a cifras significativas
- **Respuesta Cliente:** no aplicar redondeo; mantener exactitud hasta dos cifras significativas, ilustrado como `100,00`.
- **Conflicto de términos:** `100,00` expresa dos decimales, pero no dos cifras significativas. La validación ya exige suma exacta de 100 sin tolerancia; el modelo persiste cuatro decimales (`100,0000`).
- **Pregunta:** confirmar si la regla se refiere a porcentajes individuales con dos decimales, a la suma total `100,00`, o a precisión interna sin redondeo con solo presentación a dos decimales. Mantener el bloqueo exacto de suma actual mientras se aclara la precisión individual/visual.
- **Estado:** `ABIERTA — la escala individual y visualización queda para validación en preentrega; el total 100,00 exacto ya está definido e implementado`.

### [OQ-035] Identificador de inicio de sesión local
- **Respuesta Cliente:** solo usuario y contraseña.
- **Pendiente:** la autenticación actual identifica el usuario mediante email. Confirmar si “usuario” significa email corporativo como nombre de usuario o un identificador separado; no habilitar SSO, que queda fuera de alcance.
- **Estado:** `PARCIALMENTE CONFIRMADA — sin SSO; identificador pendiente`.

### [OQ-036] Retención de documentos emitidos y evidencia de nuevas versiones
- **Respuesta Cliente:** al cambiar el documento se debe cambiar la versión y dejar soporte; no eliminar por trazabilidad.
- **Decisión:** toda nueva emisión debe crear una versión nueva e inmutable y conservar versiones y soportes anteriores; nunca sobreescribir ni borrar documentos emitidos.
- **Decisión provisional de preentrega:** cada guardado crea un snapshot JSON inmutable de la previsualización, con número de versión por producto, referencia a la formulación aprobada, autor y fecha. Solo `ADMIN` e `I+D` crean snapshots; todos los perfiles de consulta pueden revisarlos. No se genera ni conserva PDF/arte firmado.
- **Observación al cliente:** confirmar si el soporte final exige además conservar el archivo emitido, firmas, motivo u otros metadatos. Los snapshots preliminares no se borran ni sobrescriben.
- **Estado:** `RETENCIÓN CONFIRMADA — snapshot preliminar implementado; soporte final sujeto a observación`.

### [OQ-037] Vigencia de sesión y disponibilidad 24/7
- **Respuesta Cliente:** sesión de 8 horas con renovación mientras el usuario permanece activo; renovación inmediata es aceptable; consulta debe estar disponible 24/7.
- **Decisión:** la configuración existente conserva expiración de 8 horas y renueva al validar actividad. El requisito 24/7 es disponibilidad del servicio, no duración ilimitada de una sesión; requiere operación/monitorización y recuperación fuera del alcance de autenticación.
- **Estado:** `REGLA DE SESIÓN CONFIRMADA — disponibilidad operativa 24/7 pendiente de SLO/infraestructura`.
