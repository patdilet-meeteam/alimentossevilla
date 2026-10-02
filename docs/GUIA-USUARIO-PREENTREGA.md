# Guía de uso — preentrega

**Plataforma Centralizada de Gestión Técnica y Nutricional · Alimentos Sevilla S.A.S.**

## Para qué sirve esta guía

Esta versión se entrega al equipo para recorrer los flujos disponibles, probarlos con el perfil asignado y registrar observaciones. El menú visible depende del usuario. La matriz de permisos aplicada es provisional y está abierta a revisión.

## Flujo principal: desde la materia prima hasta el documento

### Paso 1. Revise Ingredientes

Abra **Ingredientes** desde el menú lateral. Esta pantalla contiene el catálogo de materias primas y sus perfiles nutricionales.

1. Busque por nombre, categoría o código SIESA.
2. Abra el registro y revise nombre, código, categoría y perfiles nutricionales disponibles.
3. Señale códigos o nombres duplicados, perfiles faltantes o información que no corresponda con la fuente esperada.

Administración e I+D pueden mantener el catálogo. Los demás perfiles pueden consultarlo. La carga mensual de costos se realiza en **Costos**; el maestro piloto de junio no es una carga mensual.

### Paso 2. Revise Productos y Presentaciones

Abra **Productos**. Este catálogo identifica los productos terminados y sus presentaciones comerciales.

1. Busque el producto que desea revisar y abra su detalle.
2. Compruebe código interno, nombre, categoría y estado.
3. Revise el gramaje neto, porción declarada y unidades por empaque de cada presentación.

Administración e I+D pueden crear y editar productos. El modelo actual relaciona un producto con una formulación común y varias presentaciones.

### Paso 3. Revise Formulaciones y versiones

Puede abrir **Formulaciones** para ver el estado general o entrar al producto desde el paso anterior para consultar el detalle.

1. Revise la versión vigente y el estado de las demás versiones: **Borrador**, **En revisión**, **Aprobada** u **Obsoleta**.
2. En el detalle, compruebe la lista de ingredientes y sus porcentajes de participación.
3. I+D puede crear o modificar borradores, agregar o quitar ingredientes y enviar una versión a revisión. El envío requiere una suma exacta de 100 %.
4. Administración/Director Técnico revisa una versión en revisión y puede aprobarla o devolverla a borrador.
5. Calidad y Finanzas consultan solo las versiones aprobadas. Administración e I+D pueden consultar el historial completo.

Una versión aprobada es la referencia que utilizan las vistas de preparación nutricional, costos y documentos. No modifique una receta aprobada para esta revisión; si necesita proponer un cambio, use el flujo de nueva versión disponible para su perfil.

### Paso 4. Revise Preparación Nutricional

Abra **Preparación Nutricional** después de localizar una formulación aprobada. Esta pantalla comprueba si los ingredientes tienen perfiles nutricionales activos y muestra alertas estructurales.

1. Revise si hay ingredientes sin perfil, con más de un perfil activo o con valores incompletos.
2. Abra el enlace al producto para consultar el detalle y los resultados disponibles.
3. Tome nota del producto, ingrediente y alerta cuando algo no corresponda.

Esta pantalla no calcula el reporte nutricional. Los umbrales regulatorios se muestran aquí; solo Administración puede registrar una nueva versión de parámetros. El resultado nutricional continúa en validación técnica contra los Excel confirmados como fuente 1:1, por lo que no debe tratarse como salida final aprobada.

### Paso 5. Revise Costos (si corresponde a su trabajo)

Abra **Costos** para consultar las importaciones y los resúmenes disponibles. La carga es manual y no tiene conexión directa con SIESA.

1. Consulte el período, archivo, cantidad de filas, advertencias y estado de cada importación.
2. Revise el resumen de costo directo por formulación aprobada y la fuente/período usado.
3. Administración puede cargar el archivo mensual, revisar filas inválidas o conflictos y aplicar una importación válida.
4. Si ve un costo ausente o inesperado, reporte el código SIESA, producto, período y unidad mostrados.

La consulta está habilitada para todos los perfiles. La carga y aplicación están reservadas a Administración. Los códigos repetidos se conservan para trazabilidad y el cálculo utiliza la última asignación; el resumen usa costos de materia prima con unidad KG y formulaciones aprobadas.

### Paso 6. Revise Documentos Técnicos

Abra **Documentos Técnicos** para ver las previsualizaciones generadas a partir de productos con formulación aprobada.

1. Busque el producto y revise los ingredientes y alérgenos presentados.
2. Compruebe la fuente y los datos nutricionales identificados en la vista.
3. Administración e I+D pueden guardar una versión preliminar cuando la fuente permite la salida; pueden imprimir la previsualización habilitada.
4. Calidad y Finanzas tienen consulta, sin guardar ni imprimir desde esta pantalla.

Las fichas son preliminares y no oficiales. Guardar una versión conserva un snapshot con trazabilidad; no equivale a emitir un documento oficial. No hay exportación final desde la plataforma.

## Otros módulos

| Módulo | Para qué sirve | Quién lo usa |
|---|---|---|
| Dashboard | Resumen de módulos y alcance de acciones para el perfil conectado. | Todos los perfiles |
| Usuarios | Consulta de cuentas y gestión de roles y estado de acceso. | Solo Administración |
| Auditoría | Consulta de eventos y cambios registrados. | Solo Administración |

## Resumen de perfiles de esta preentrega

- **Administrador / Director Técnico:** acceso administrativo; aprueba o devuelve formulaciones, gestiona usuarios, consulta auditoría, administra costos y parámetros regulatorios, y puede guardar/imprimir documentos preliminares.
- **Investigación y Desarrollo (I+D):** crea y edita ingredientes, productos y borradores; ejecuta cálculos disponibles; puede guardar e imprimir documentos preliminares.
- **Calidad:** consulta módulos y versiones aprobadas; no modifica ni imprime documentos desde la aplicación.
- **Finanzas / Consulta:** consulta módulos y formulaciones aprobadas; no carga costos ni imprime documentos desde la aplicación.

La matriz es provisional y algunos alcances están abiertos a observaciones. Si necesita una acción que no aparece, reporte el perfil, módulo y acción requerida; no intente eludir una restricción.

## Cómo registrar y enviar una observación

La plataforma todavía no recoge observaciones dentro de la aplicación. Envíe los hallazgos a la persona que coordinó su acceso y use esta pauta:

1. **Módulo y registro:** nombre del módulo, producto, ingrediente o período.
2. **Perfil:** el rol con el que inició sesión.
3. **Pasos:** qué seleccionó o hizo, en orden.
4. **Esperado / observado:** qué esperaba obtener y qué ocurrió.
5. **Impacto:** qué tarea le impide o dificulta completar.
6. Adjunte una captura si ayuda, ocultando contraseñas y datos sensibles.

| Módulo / registro | Perfil | Pasos para reproducir | Esperaba | Observé | Impacto / prioridad |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Referencias del alcance

La [matriz provisional de permisos](ROLE-ACTION-INVENTORY-2026-10-01.md) documenta acciones observadas por módulo. Las decisiones pendientes de revisión están en [Preguntas Abiertas](OPEN-QUESTIONS.md). Esta guía explica el uso de la preentrega y no crea reglas de negocio ni cambia criterios de aceptación.
