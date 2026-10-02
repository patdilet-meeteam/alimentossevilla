# Plan de trabajo — preentrega funcional

**Fecha:** 1 de octubre de 2026
**Estado:** plan de ejecución actualizado con el requerimiento original, la implementación actual y los cambios de diseño integrados; no altera criterios de aceptación ni reglas de negocio.
**Objetivo:** dejar la aplicación funcional y visualmente terminada para una preentrega, implementando todo requisito confirmado que no dependa de una decisión pendiente. Las limitaciones regulatorias o de contenido que no se puedan resolver sin el cliente quedarán delimitadas y visibles.

## Resultado esperado

Una aplicación coherente en navegación, diseño y flujos funcionales confirmados, lista para revisión/uso de preentrega. Debe conservar auditoría e historial y hacer cumplir los permisos confirmados. La fuente Excel 1:1 ya está decidida; las salidas permanecen en validación técnica hasta demostrar paridad (OQ-031) y resolver la definición adicional del sello por especie (OQ-033). La lista exacta de requisitos y brechas está en [`TRACEABILITY-CLIENT-RESPONSE-2026-10-01.md`](TRACEABILITY-CLIENT-RESPONSE-2026-10-01.md).

## Reglas de ejecución

- Conservar los cambios locales preexistentes; revisar rama, `git status` y `git diff` antes de cada fase.
- Seguir el orden de las fases y no aplicar una regla comercial/normativa no confirmada.
- Usar migraciones Prisma versionadas; no hacer `db push` ni aplicar migraciones destructivas sin el proceso de escalamiento definido en `AGENTS.md`.
- Proteger operaciones en servidor además de ocultar acciones en la interfaz. Registrar en `AuditEvent` las mutaciones relevantes.
- Mantener datos fuente, versiones y documentos anteriores. Ninguna carga preliminar debe sobrescribir ni borrar evidencia.
- No desplegar ni comunicar resultados al cliente como oficiales dentro de este plan.

## Avance aplicado — integración de diseño y permiso de cálculo

- Se hizo fetch y fast-forward de `meeteam/main` (`731f736`), que incorpora branding de Alimentos Sevilla, pantalla de login y menú lateral colapsable. Los cambios locales previos de documentación quedaron preservados.
- Se corrigió una brecha inequívoca de OQ-032: Calidad y Finanzas ya no pueden ejecutar cálculo de sellos; el botón se oculta en UI y la Server Action restringe la llamada directa a `ADMIN`/`R_AND_D`.
- Se retiraron del login las credenciales rápidas de cuentas demo y del dashboard/sidebar las etiquetas de roadmap por semanas; las tarjetas ahora describen el alcance disponible y el estado preliminar de nutrición/documentos.
- Productos y Formulaciones ahora muestran estados vacíos propios con acciones de continuación; se eliminó el componente de “Etapa de Levantamiento & Diseño” que presentaba módulos implementados como planificados. La navegación llama “Preparación Nutricional” a la pantalla de revisión de perfiles.
- Costos ya describe el criterio confirmado de códigos repetidos, distingue filas inválidas/conflictos y no precarga un período de junio. Preparación Nutricional informa que los cálculos preliminares se consultan desde el detalle del producto y que la paridad sigue pendiente.
- Se aplicó una matriz provisional de preentrega basada en la respuesta más reciente: ADMIN administra; I+D edita/ejecuta e imprime previsualizaciones; Calidad y Finanzas consultan; Finanzas no opera cargas de costo. Calidad/Finanzas solo reciben versiones APPROVED; Usuarios/Auditoría quedan para ADMIN. Se documentan observaciones para ajustar la matriz tras la revisión cliente.
- Revisión visual local completada solo para `/login`: branding y formulario renderizan, y ya no aparecen cuentas/contraseñas demo. Los demás cambios de interfaz se basan en revisión de código; falta recorrer las rutas internas y responsive con una sesión válida. No se han ejecutado pruebas automatizadas.

## Fases

### Fase 0 — línea base reproducible y confirmación de brechas

**Trabajo**

1. Registrar rama, HEAD, cambios locales, migraciones, versión de dependencias y configuración del entorno local.
2. Usar la trazabilidad del requerimiento y confirmar los hallazgos directamente en código: distinguir comportamiento presente, evidencia histórica y aceptación pendiente.
3. Revalidar los comandos de lint, typecheck, suite existente y build acordados por el repositorio, además de las migraciones contra la base local disponible.
4. No incluir ni revertir el trabajo documental ya presente en el árbol.

**Salida:** hoja de línea base con comandos, resultados fechados y bloqueos de entorno. La reconciliación de datos de junio ya se hizo: los dos ingredientes indicados están en la v3 aprobada, por lo que no se crea ni carga otra formulación para ese requisito.

**Gate:** no comenzar cambios funcionales hasta conocer el estado real de la rama y los archivos modificados.

### Fase 1 — terminar integración visual y recorrido completo

**Trabajo**

1. Aceptar el branding/login/sidebar integrados desde `meeteam/main` como base visual.
2. Recorrer dashboard, ingredientes, productos/formulaciones, nutrición, costos, documentos, usuarios y auditoría para detectar módulos con placeholders, inconsistencias de navegación, estados vacíos o estilos que impidan una preentrega coherente.
3. Completar UI, accesibilidad básica, estados de carga/error/vacío y adaptación a móvil para capacidades ya existentes, sin crear reglas de negocio ni pantallas que supongan decisiones abiertas.
4. Distinguir acciones que existen de las que aún no existen; eliminar etiquetas de fase/semana solo donde sean decoración obsoleta y no una promesa contractual.

**Salida:** recorrido de los módulos existentes con presentación consistente y hallazgos de alcance pendientes separados.

### Fase 2 — decisiones bloqueantes para no desarrollar de más

Solicitar/registrar resolución de estas preguntas en `docs/OPEN-QUESTIONS.md`:

- **OQ-031:** implementar y demostrar la paridad con el Excel confirmado; ya no requiere decisión adicional del cliente sobre la fuente.
- **OQ-033:** clasificaciones de carne/grasa/especie, ingredientes compuestos o desconocidos y nombre/efecto del sello del diagrama.
- **OQ-032:** permisos efectivos por perfil, acción y módulo, incluidos imprimir/exportar.
- **OQ-034:** exactitud interna, escala persistida y formato visible de porcentajes.
- **OQ-035:** si el identificador “usuario” corresponde al email actual o a un username.
- **OQ-036:** contenido obligatorio del soporte de cada documento/versionado y artefacto que debe conservarse.
- **OQ-037:** objetivo de disponibilidad 24/7 y responsable/evidencia de operación.

**Salida:** respuestas, o registro expreso de preguntas aún abiertas. No bloquear trabajo técnico independiente.

### Fase 3 — verificación del maestro, sin recarga duplicada

**Trabajo**

1. Conservar como evidencia la verificación existente: ambos nombres/códigos ya están en la v3 aprobada y el importador del maestro los reconoce.
2. No recargar ni crear una versión nueva por este punto; hacerlo solo si una comprobación posterior detecta que falta algún dato requerido.
3. Mantener pendiente la verificación del cálculo de esos ingredientes dentro de OQ-031; no sustituir perfiles por similitud de nombres.

**Salida:** reconciliación existente aceptada como evidencia de presencia; sin cambios de datos ni de formulación.

**Gate:** reabrir esta fase solo ante diferencia demostrable en maestro o formulación.

### Fase 4 — cerrar matriz y corregir permisos

**Trabajo**

1. La matriz provisional quedó implementada en servidor y UI y está descrita en `ROLE-ACTION-INVENTORY-2026-10-01.md`.
2. En la preentrega se asume I+D para cambios operativos técnicos; ADMIN para gestión transversal, costos y auditoría; Calidad/Finanzas solo lectura y solo versiones aprobadas.
3. Presentar los puntos de observación de OQ-032 al cliente y ajustar los roles tras su revisión. Los cambios de permisos deben seguir auditados en servidor.

**Salida:** matriz accionable documentada y permisos efectivos verificables para cada acción resuelta.

**Gate:** no otorgar facultades no especificadas a ADMIN, Finanzas u otros perfiles por inferencia.

### Fase 5 — cerrar cálculo sin rehacer reglas ya implementadas

**Trabajo**

1. No reescribir lo ya cubierto: los nutrientes no reciben merma, grasa saturada agrega todos los ingredientes, la suma de fórmula se valida exactamente en 100 y el costo duplicado selecciona la última fila.
2. Completar OQ-031/OQ-034 con cotejo celda a celda. La captura CTN por versión ya se conserva; falta comparar entradas, intermedios, precisión/formato y resultado contra una importación del libro fuente.
3. Resolver OQ-033 antes de construir su regla nueva de sello; aislarla de los umbrales actuales y usar solo las clasificaciones que el cliente confirme.
4. Mantener salidas como **EN VALIDACIÓN TÉCNICA — NO OFICIAL** hasta demostrar paridad y resolver el criterio de sello por especie. No cambiar silenciosamente las fuentes actuales.
5. La merma ya se aplica a la salida total estimada: lote base por (1 − merma). La pérdida y salida se muestran en kg; no modifica nutrientes ni consumos de ingredientes del costeo.

**Salida:** reporte con fuente y versiones visibles; evidencia de comparación 1:1 cuando se importe y coteje el libro CTN. Salida total estimada visible en la versión del proceso.

### Fase 6 — parámetros regulatorios versionados

**Avance aplicado:** se agregó una tabla de versiones con línea base inicial idéntica a los umbrales existentes; solo `ADMIN` (Director Técnico) crea versiones desde `/normativa`. Cada versión registra autor y fecha, genera auditoría y alimenta cálculos futuros. Las salidas identifican la versión aplicada.

**Observación de preentrega:** el cliente revisará si faltan parámetros, cambios de vigencia u otros valores regulatorios; los snapshots guardados no se reescriben.

**Salida:** parámetros consultables por versión, historial auditable y edición exclusiva del Director Técnico.

### Fase 7 — versionado y snapshots de documentos

**Trabajo**

1. Como soporte provisional confirmado para la preentrega, la copia inmutable JSON guarda contenido mostrado, número por producto, versión aprobada fuente, usuario y fecha.
2. Se añadió entidad Prisma y migración aditiva, validación Zod, autorización por rol y evento de auditoría.
3. Se puede consultar el historial y abrir el soporte guardado; no hay acción de edición ni borrado.
4. El cliente debe observar si requiere además un archivo firmado/final u otros metadatos. La emisión oficial permanece deshabilitada hasta validar fuente, reglas y plantilla.

**Salida:** historial consultable, snapshots inmutables y soporte asociado por versión; exportación oficial permanece deshabilitada hasta el gate funcional.

### Fase 8 — cierre de preentrega

**Trabajo**

- Ejecutar validaciones acordadas por AGENTS y dejar informe reproducible de pruebas de cálculo, permisos, persistencia, historial y UI.
- Revisar que Calidad no pueda imprimir/exportar y que las acciones no autorizadas fallen también al invocar el servidor directamente.
- Revisar que versiones/documentos previos continúen consultables y que nuevas operaciones dejen auditoría.
- Marcar claramente en UI y notas de entrega los bloqueos OQ pendientes y las diferencias conocidas.

**Criterio de salida de preentrega:** aplicación coherente visualmente, flujos confirmados implementados, permisos confirmados aplicados en servidor e interfaz, historial/auditoría preservados y salidas limitadas rotuladas con claridad. La paridad Excel 1:1, el sello por especie y la emisión oficial no se simulan: solo se cierran con las respuestas/insumos requeridos. La preparación técnica de entrega se documenta; el despliegue requiere instrucción aparte.

## Orden recomendado para comenzar

1. Completar la línea base y el recorrido visual/funcional de todas las rutas; cerrar defectos de UI/autorización evidentes y confirmar cómo se ve el preentregable.
2. Continuar aplicando las restricciones inequívocas de OQ-032; resolver acciones ambiguas antes de cambiarlas. El inventario ya está hecho y el cálculo para Calidad/Finanzas ya quedó restringido.
3. Implementar OQ-031/OQ-034 para terminar y demostrar la paridad del cálculo con el Excel confirmado.
4. Precisar OQ-033, OQ-036 y alcance/vigencia de parámetros regulatorios; desarrollar las capacidades después de contar con esas definiciones.
5. Implementar snapshots documentales y cierre de preentrega, preservando la salida como no oficial hasta el gate nutricional/regulatorio.
6. No recargar los dos ingredientes confirmados ni rehacer la lógica nutricional/duplicados ya implementada.

## Trabajo ya concluido que no se debe repetir

- Se verificó el maestro de junio: los dos ingredientes correctos están en la formulación aprobada; no hace falta nueva carga.
- Se inspeccionó el código para los puntos de merma nutricional, grasa saturada, suma porcentual, costo SIESA repetido, devolución, auth y sellos.
- Se documentó el inventario de permisos y la trazabilidad requisito por requisito en `ROLE-ACTION-INVENTORY-2026-10-01.md` y `TRACEABILITY-CLIENT-RESPONSE-2026-10-01.md`.
- El cliente ya confirmó usuario/contraseña sin SSO. Solo queda aclarar si el identificador debe ser email o username.

## Fuera del alcance de esta versión preliminar

- Declarar equivalencia certificada con los archivos Excel o aceptación regulatoria.
- Emitir documentos oficiales mientras estén abiertas las fuentes/cifras/sellos discrepantes.
- Interpretar por cuenta propia categorías de especie, carne o grasa.
- Cambiar reglas o permisos todavía abiertos para que la demostración “pase”.
- Prometer disponibilidad operacional 24/7 basándose únicamente en la renovación de sesiones.
