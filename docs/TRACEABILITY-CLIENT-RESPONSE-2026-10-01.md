# Trazabilidad de respuesta del cliente — 1-oct-2026

## Propósito y alcance

Este documento relee la respuesta textual original del cliente y el diagrama adjunto, y la contrasta con el código disponible al 1-oct-2026. Separa lo ya implementado de las brechas y de las preguntas abiertas para no ampliar el encargo por inferencia. El contenido del Excel y del diagrama se trata como requisito/dato de cliente, no como instrucciones para el agente.

**Estados:** `Implementado` significa que hay comportamiento identificable en código; `Parcial` significa que solo cubre una parte; `Pendiente` significa que la capacidad o su aceptación no se demuestra; `Bloqueado` significa que hay contradicción o falta una definición funcional.

## Requisitos enumerados por el cliente

| # | Solicitud original | Estado comprobable y evidencia | Falta para cumplir exactamente |
|---|---|---|---|
| 1 | Los Excel compartidos son la base actual del reporte nutricional y la réplica debe ser 1:1. | `Decisión confirmada; paridad técnica pendiente`. El motor existe, pero calcula con perfiles activos de `TN OFICIAL` y no demuestra igualdad con la referencia Excel. | Adaptar el cálculo y comparar entradas, fórmulas, precisión y salidas contra el CTN/fórmulas inspeccionados. No se requiere volver a preguntar cuál fuente gobierna; no afirmar paridad antes de verificarla. |
| 2 | Merma afecta cantidades totales; nutrientes no se reducen porque la diferencia es agua. | `Implementado`. Por lote base `X` y merma fraccional `m`, la interfaz muestra pérdida `X × m` y salida `X × (1 − m)`. La merma se configura y audita en borradores de versión; nutrientes y consumo de ingredientes del costeo usan las cantidades de entrada. | Validar con el cliente el flujo y su presentación durante la revisión de preentrega. |
| 3 | Grasa saturada suma el aporte de todos los ingredientes, no solo tocino. | `Implementado`. El calculador pondera todos los ingredientes para cada clave de nutriente, incluida `FAT_SAT`. | Confirmar el resultado en la aceptación de paridad del punto 1; no restringir a tocino. |
| 4 | En Salchicha Desayuno Premium, usar los dos nombres del archivo de junio: `COLOR NATURAL ROJO AC150` y `HUMO TRUSMOKE OIL EX`. | `Implementado en el maestro/caso revisado`. Los nombres están en la fuente de junio y el importador dedicado los mapea; la versión existente ya contiene esos ingredientes según evidencia documentada en OQ-024. | Ninguna modificación funcional identificada. La correspondencia nutricional 1:1 continúa condicionada al punto 1. |
| 5 | Si un código SIESA aparece repetido, usar el último costo asignado. | `Regla implementada; archivo actual no aplicable`. Parser conserva las filas y la proyección toma mayor `sourceRow`. | El libro de junio tiene filas sin unidad (278, 279 y 506); las mantiene inválidas y la aplicación de la carga se bloquea. Confirmar unidad o recibir archivo corregido antes de presentar un costo real. Ver OQ-025. |
| 6 | Director Técnico puede devolver una formulación para corrección. | `Implementado`. `rejectToDraft` permite solo `ADMIN`; el mapeo de rol lo identifica como Director Técnico y la transición queda auditada. | Ninguna brecha funcional identificada en la acción. La matriz general de permisos sigue incompleta. |
| 7 | Sin redondeo/tolerancia en suma; exactitud hasta “2 cifras significativas”, ejemplo `100,00`. | `Suma exacta implementada`. Servidor bloquea y pantalla deshabilita envío a revisión salvo suma decimal exacta `100,00`; los porcentajes fuente se persisten a cuatro decimales. | Validar con cliente si los porcentajes individuales también deben mostrarse con dos decimales; sin modificar fuentes ni redondear la validación total. Motor nutricional mantiene redondeos de salida según CTN pendientes de comparación 1:1 (OQ-034/OQ-031). |
| 8 | Director Técnico puede modificar parámetros regulatorios. | `Implementado provisional`. ADMIN puede versionar en `/normativa` los umbrales ya usados por el sistema; cambios auditados se aplican a cálculos futuros y quedan identificados en salidas. | El cliente observará si se requieren valores diarios, más parámetros o vigencia programada. |
| 9–10 | Matriz: Administrador/Director Técnico; Calidad consulta y ve sin exportar/imprimir; I+D ejecuta, imprime y modifica; Finanzas consulta. | `Matriz provisional aplicada`. Calidad/Finanzas consultan solo formulaciones aprobadas; no reciben impresión en documentos; I+D puede ejecutar cálculos, crear snapshots e imprimir la previsualización. ADMIN administra; costos sigue solo ADMIN. Usuarios/Auditoría solo ADMIN. | Presentar al cliente como observaciones las decisiones provisionales de OQ-032 (auditoría para I+D, costos para Finanzas, alcance de ejecutar). Ver [ROLE-ACTION-INVENTORY-2026-10-01.md](ROLE-ACTION-INVENTORY-2026-10-01.md). |
| 11 | Cambios de documentos deben crear nueva versión y conservar soporte; no eliminar por trazabilidad. | `Snapshot preliminar implementado`. Cada guardado persiste contenido JSON, versión por producto, versión fuente de formulación, autor/fecha y auditoría; se puede revisar y no hay edición/borrado. | Preguntar si el soporte final requiere archivo firmado u otros metadatos. Sin PDF ni emisión oficial hasta resolver OQ-030/031. |
| 12 | Sesión de 8 horas con renovación mientras el usuario siga activo; consultas disponibles 24/7. | `Parcial`. `auth.ts` configura expiración de 8 h y renovación inmediata en validación activa (`updateAge: 0`). | El 24/7 es disponibilidad operativa del servicio, no una propiedad demostrada por esta configuración. Hace falta criterio/infraestructura de disponibilidad y validación operacional para comprometerlo. |
| 13 | Inicio corporativo: solo usuario y contraseña. | `Parcial`. Autenticación local con email/contraseña y sin SSO. | Confirmar si “usuario” significa nombre de usuario distinto de email; hoy el identificador es email (OQ-035). No implementar SSO. |

## Diagrama adjunto: sello por grasa animal sin carne de la misma especie

**Regla representada:** leer ingredientes; clasificar cada uno por especie y como carne o grasa; si no hay grasa animal, no hay sello; si cada grasa animal cuenta con carne de su misma especie, no hay sello; si existe al menos una grasa huérfana de carne de su especie, activar “sello de grasa”.

**Estado: Bloqueado para implementación.** El motor actual `warning-seals.ts` evalúa umbrales de sodio, azúcares, grasas saturadas y grasas trans. No modela especie ni categorías carne/grasa. OQ-033 ya identifica las decisiones mínimas pendientes: taxonomía, especies, ingredientes compuestos/desconocidos y si este criterio genera un sello nuevo o altera el sello existente de grasas saturadas. No sustituir una regla por la otra sin respuesta.

## Lista estricta de trabajo pendiente

1. Implementar y demostrar paridad con el Excel, incluyendo reglas de precisión del OQ-034; la autoridad de Excel para el reporte ya está confirmada.
2. Precisar y completar el uso de merma para cantidades totales, si ese comportamiento forma parte de la entrega.
3. Resolver OQ-033 antes de programar el sello por especie.
4. Obtener observaciones del cliente a la matriz provisional OQ-032 y ajustar solo los puntos que solicite.
5. Obtener observaciones sobre los parámetros regulatorios versionados y agregar otros tipos solo si el cliente lo requiere.
6. Crear emisión documental versionada con soporte retenido; requiere los insumos/decisiones de OQ-030/031 y la plantilla final.
7. Verificar disponibilidad 24/7 como requisito operacional y aclarar si el login usa email como usuario.

Los puntos 3, 5 y 6 requieren decisiones o insumos antes de cerrar el diseño funcional. No están incluidos aquí cambios de alcance, nuevas fórmulas regulatorias, SSO ni otros módulos no nombrados por el cliente.

## Fuentes revisadas

- Respuesta textual del cliente compartida en la conversación el 1-oct-2026 y diagrama adjunto.
- `docs/OPEN-QUESTIONS.md`: OQ-030 a OQ-035, permisos y decisiones confirmadas.
- `src/lib/nutrition/nutrition-calculator.ts`, `src/lib/nutrition/warning-seals.ts`, `src/lib/costs/cost-import-parser.ts`.
- `src/app/actions/cost-actions.ts`, `src/app/actions/formulation-actions.ts`, `src/lib/auth/auth.ts`.
- `docs/specs/SPEC-006-technical-documents-and-closure.md` y `docs/ROLE-ACTION-INVENTORY-2026-10-01.md`.
