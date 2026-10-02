# SPEC-004 — Cálculo Nutricional y Sellos de Advertencia

## Parámetros regulatorios versionados — preentrega (1-oct-2026)

- `ADMIN` representa al Director Técnico y es el único rol autorizado por Server Action para crear una nueva versión.
- La migración crea una línea base v1 con los umbrales existentes: sodio 300 mg/100 g, azúcares y grasa saturada 10% de energía, y grasa trans 1% de energía.
- `/normativa` expone valores activos e historial; cada cambio conserva autor/fecha y genera `AuditEvent`. La versión activa se usa en los cálculos posteriores.
- Los cálculos y previsualizaciones muestran qué versión de parámetros usaron. Los snapshots documentales ya guardados son inmutables.
- Esta UI cubre los umbrales ya existentes; valores diarios de referencia, nuevas categorías de sello y vigencia programada se registran para observación del cliente y no se inventan en esta entrega.

> **Semana 4** del cronograma de Alimentos Sevilla S.A.S.
> **Estado:** `decisión de fuente Excel confirmada; captura CTN por versión implementada; cotejo numérico completo pendiente`.
> **Fecha de preparación:** 14 de septiembre de 2026.

---

## 1. Propósito

Implementar un motor reproducible que convierta una versión aprobada de formulación y sus perfiles nutricionales en resultados nutricionales por 100 g y por presentación, utilizando el contrato de cálculo oficial validado por el cliente. El motor debe conservar trazabilidad de sus entradas y de la versión de formulación que calcula.

## 2. Evidencia fuente inspeccionada

El archivo `CTN - Salchicha Desayuno Premium - v11.xlsx` contiene:

- Una hoja `CTN` con ingredientes, cantidades, porcentajes, valores nutricionales de entrada y aportes ponderados.
- Hojas de análisis y tabla nutricional con resultados por 100 g y por porción.
- Presentaciones de 115 g, 240 g, 480 g y 960 g.
- Hojas de lista de ingredientes con porcentajes y clasificaciones de aditivos.

La auditoría de fórmulas identificó que los aportes ponderados siguen el patrón `nutriente del ingrediente × porcentaje de participación`. Después se suman por nutriente. La hoja aplica la merma de cocción y frío (`11 %`) como humedad × `0,89` y demás nutrientes × `1,11`; los resultados ajustados pasan a la hoja `Análisis`, que redondea macronutrientes antes de calcular energía y escala los resultados por gramos de porción.

Las respuestas del cliente corrigen dos comportamientos del ejemplo: la merma se aplica solo a cantidades totales, pues la pérdida es agua y los nutrientes permanecen en el producto final; y la grasa saturada debe sumar el aporte de todos los ingredientes, no solo el tocino. Para Salchicha Desayuno Premium, los nombres canónicos son `COLOR NATURAL ROJO AC150` y `HUMO TRUSMOKE OIL EX` del archivo de junio.

La respuesta más reciente del cliente confirma que los Excel compartidos son la base del reporte y deben replicarse 1:1. Esta prioridad sustituye para el reporte la decisión anterior de OQ-028 que hacía prevalecer `TN OFICIAL` ante diferencias con CTN; el Banco Nutricional sigue disponible como fuente de perfiles, pero no demuestra paridad. El motor ya implementa las correcciones confirmadas de merma y grasa saturada. Falta adaptar y verificar técnicamente las entradas/fórmulas/salidas del motor antes de declarar paridad o presentar el reporte como final; no falta una respuesta del cliente sobre la fuente.

## 3. Alcance posible una vez confirmadas las preguntas abiertas

1. Servicio de cálculo puro y tipado, separado de Server Actions y componentes React.
2. Selección de una versión `APPROVED` y de perfiles nutricionales activos por ingrediente.
3. Cálculo de aportes por ingrediente, resultado por 100 g y resultado por porción.
4. Registro de entradas, resultado y versión de formulación para auditoría.
5. Pruebas de paridad contra el caso CTN oficial, incluyendo valores de borde y redondeos.
6. Evaluación de sellos a partir de parámetros regulatorios versionados y vigentes.

## 4. Reglas confirmadas para implementar

- Replicar 1:1 la secuencia y precisión de los archivos Excel compartidos.
- Aplicar merma únicamente a cantidades totales del proceso; no concentrar ni reducir nutrientes por merma.
- Sumar el aporte ponderado de grasa saturada de todos los ingredientes.
- Exigir exactamente `100,00 %` al enviar una formulación a revisión, sin tolerancia ni redondeo de validación.
- Importar porcentajes desde cantidades canónicas, no desde porcentajes visibles redondeados; la distribución determinista del residuo garantiza `100,0000 %` persistido y conserva el origen.

## 5. Fuera de alcance hasta contar con insumos aprobados

- Umbrales de sellos, valores diarios de referencia o leyendas regulatorias.
- Selección automática de una fuente nutricional ante perfiles múltiples.
- Carga masiva no auditada de productos o ingredientes desde el CTN.

## 6. Insumos pendientes para la paridad automatizada

| Pregunta | Decisión requerida | Riesgo si se infiere |
|---|---|---|
| Insumo | Uso requerido | Riesgo si falta |
| Archivo Excel fuente | Fixture de paridad automatizada | No se puede demostrar réplica 1:1 |
| Umbrales y vigencia normativa | Evaluación de sellos | No se pueden inventar límites |

## 7. Criterios de aceptación propuestos para validación humana

- El cliente reconoce el caso CTN seleccionado y sus resultados esperados.
- Cada resultado calculado conserva referencia a versión de formulación, perfiles nutricionales y parámetros usados.
- Las pruebas de paridad cubren resultado por 100 g, porción, presentaciones y redondeos confirmados.
- Cambiar una formulación aprobada requiere una nueva versión; los resultados históricos no se modifican.
- Los sellos se calculan solo con la norma y los umbrales vigentes confirmados.

### Actualización de alcance — respuesta del cliente recibida el 1-oct-2026

- La pérdida de proceso se aplica a cantidades totales; no se multiplica ningún nutriente por `1 ± merma`.
- `FAT_SAT` se calcula como suma del aporte de todos los ingredientes, no solo tocino.
- La matriz de permisos debe cubrir consulta, ejecución, modificación, impresión y exportación. Los permisos de ADMIN/Director Técnico siguen sin especificar acciones concretas; ver OQ-032.
- El diagrama “Una sola grasa sin carne de su especie activa el sello” propone una regla nueva de sello. Su interpretación operativa, taxonomía especie/carne/grasa y relación con los umbrales regulatorios requieren definición en OQ-033; no se debe codificar aún.

## 8. Implementación inicial

- `src/lib/nutrition/nutrition-calculator.ts` calcula aportes por 100 g y por porción desde cantidades canónicas, usando aritmética decimal.
- `src/lib/nutrition/ctn-import.ts` lee el libro Excel (hoja `CTN`) o exportación CSV, y genera un plan de importación que se detiene cuando `TOTAL` aparece como descripción o código; ignora fórmulas post-merma porque el cliente confirmó que la merma no ajusta nutrientes.
- `importCtnCsvToDraft` solo crea una nueva versión `DRAFT` si cada fila del CTN encuentra un ingrediente activo existente por código o nombre canónico. Conserva por versión cantidades y nutrientes exactos de las filas fuente; no crea ingredientes ni perfiles maestros de forma implícita.
- `importNutritionalBankProfiles` lee exclusivamente la hoja `TN OFICIAL` del Banco Nutricional y versiona perfiles solo para ingredientes maestros activos con coincidencia única por nombre o nombre genérico. El Banco no aporta código SIESA: las filas sin coincidencia se omiten y nunca crean ingredientes. Los perfiles activos de laboratorio o literatura quedan protegidos; cada importación deja una nueva versión y auditoría.
- El detalle de producto presenta la carga `.csv` únicamente a I+D y Director Técnico; el mensaje identifica ingredientes faltantes sin escribir cambios parciales.
- La migración `20260923010000_spec_004_canonical_quantities` incorpora `cantidadCanonica` nullable en `FormulationIngredient`, conservando versiones históricas que solo disponen de porcentaje.
- La reconciliación de porcentajes persiste exactamente `100,0000 %`, pero los nutrientes se calculan contra las cantidades originales de alta precisión; por ello la normalización de almacenamiento no modifica los resultados nutricionales.
- La prueba `tests/unit/nutrition-calculator.test.ts` cubre el caso patrón de 18 ingredientes de Salchicha Desayuno Premium y verifica cantidad total, grasa, grasa saturada, proteína, sodio y grasa saturada por porción, sin multiplicador de merma.

La v3 `APPROVED` de Salchicha Desayuno Premium preserva 18 ingredientes, `487,948` de cantidad canónica y `100,0000 %`, pero no tiene una captura nutricional CTN por versión y por eso todavía usa perfiles activos del Banco. Una nueva importación CTN conserva sus datos nutricionales en la versión `DRAFT`; al aprobarla, los cálculos usarán esa fuente versionada. La comparación numérica completa aún debe realizarse contra una importación del libro fuente disponible.

## 9. Evidencia de cierre técnico local

- PostgreSQL local saludable en `localhost:5439`; migraciones sin pendientes.
- La v3 `APPROVED` `cmueo3rx80001eo3cg2nd8zb7` contiene 18 ingredientes y perfiles activos completos para los nutrientes críticos.
- La ausencia de `FAT_TRANS` en `TN OFICIAL` se regularizó como `0 g/100 g` según OQ-029; 141 perfiles activos quedaron actualizados y auditados.
- El cálculo produce `613,04 mg/100 g` de sodio y `3,51 g/100 g` de grasa saturada, con sellos activos de sodio y grasas saturadas.
- La pantalla de producto fue verificada visualmente y muestra ambos sellos, valores y umbrales.
- Pruebas de workflows integrados existentes: `8/8`; pruebas unitarias de cálculo/sellos: `7/7`; typecheck y diff check correctos.

## 10. Pendiente de aceptación

La aceptación final requiere que el cliente valide los textos, umbrales y vigencia normativa aplicables al rotulado. La implementación no constituye por sí sola aprobación sanitaria ni reemplaza la revisión regulatoria.

### Respuesta mínima solicitada al cliente

1. Indicar el archivo, producto y hoja que constituyen el caso oficial de paridad, y confirmar que sus resultados son los que debe reproducir la plataforma.
2. Entregar o validar la secuencia completa que aplica el Excel: base de entrada, participación, rendimiento/merma, conversiones, retenciones, resultados por 100 g, porción y cada punto de redondeo.
3. Confirmar el código y la fuente canónicos de cada ingrediente del caso; incluir cómo deben resolverse códigos vacíos, duplicados o con descripción distinta.
4. Identificar la norma, vigencia y responsables autorizados para parametrizar sellos y demás valores regulatorios (OQ-010).

Estas respuestas no cambian los criterios de aceptación: solo permiten convertir los criterios ya documentados en pruebas de paridad reproducibles.
