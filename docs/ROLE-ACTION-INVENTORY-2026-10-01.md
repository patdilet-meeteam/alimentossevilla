# Inventario actual de permisos por módulo

**Fecha de lectura inicial:** 1 de octubre de 2026
**Revisión manual adicional:** 2 de octubre de 2026
**Propósito:** documentar la matriz provisional aplicada para preentrega. Los criterios marcados como provisionales se presentan al cliente para observaciones.

## Perfiles en código

| Rol técnico | Etiqueta actual | Perfil funcional previsto |
|---|---|---|
| `ADMIN` | Administrador | Administrador / Director Técnico |
| `R_AND_D` | Investigación y Desarrollo | I+D |
| `QUALITY` | Calidad | Calidad |
| `VIEWER` | Consulta | Finanzas |

## Operaciones observadas

| Módulo / operación | Lectura servidor actual | Mutación/ejecución servidor actual | Controles de UI observados |
|---|---|---|---|
| Ingredientes: lista y detalle | Cualquier usuario autenticado | — | Catálogo visible a todos. Formularios y perfiles nutricionales aparecen para `ADMIN` y `R_AND_D`. La carga de maestro piloto de junio no aparece en la interfaz actual; queda texto explicativo de que fue carga inicial, no mensual. |
| Ingredientes: CRUD y perfiles | — | `ADMIN`, `R_AND_D` | La UI usa el mismo conjunto de roles. |
| Productos y presentaciones | Los cuatro roles | Crear/editar/desactivar: `ADMIN`, `R_AND_D` | Crear y editar se muestra a `ADMIN` y `R_AND_D`. |
| Formulación: consulta e historial | Los cuatro roles; `QUALITY`/`VIEWER` solo reciben `APPROVED` | Crear/editar DRAFT, agregar/quitar ingredientes, enviar a revisión y obsoletar: `ADMIN`, `R_AND_D` | El servidor filtra versiones para perfiles de consulta. |
| Formulación: aprobación/devolución | — | Aprobar y devolver `IN_REVIEW → DRAFT`: solo `ADMIN` | Botones solo para `ADMIN`. |
| Cálculo nutricional/sellos | Todos los roles pueden consultar la página; la acción de cálculo se limita a `ADMIN`, `R_AND_D` | `calculateFormulationSeals`: `ADMIN`, `R_AND_D` | El botón **Calcular sellos** se muestra solo a perfiles con permiso de escritura (`ADMIN`, `R_AND_D`). Calidad y Finanzas quedan en consulta. |
| Importación CTN, maestro de junio y Banco Nutricional | — | `ADMIN`, `R_AND_D` | Controles se muestran a esos dos roles. |
| Costos: consulta/importaciones/resúmenes | Los cuatro roles | — | Historial y resumen visibles a todos. |
| Costos: crear/aplicar importación | — | Solo `ADMIN` (`FINANCE_ROLES`) | Carga y aplicación se muestran solo a `ADMIN`. |
| Documentos: previsualización e historial | Los cuatro roles | — | Consulta previsualización e historial de snapshots guardados. |
| Documentos: guardar snapshot preliminar | — | `ADMIN`, `R_AND_D` | Solo ADMIN/I+D; crea versión inmutable y auditoría. Sin PDF ni emisión oficial. |
| Documentos: imprimir previsualización | — | `ADMIN`, `R_AND_D` | Control de impresión a ADMIN/I+D; salida marcada PRELIMINAR — NO OFICIAL. La previsualización se oculta en impresión para QUALITY/VIEWER. |
| Usuarios: consulta | Solo `ADMIN`; los demás se redirigen a Dashboard antes de consultar `User` | — | Enlace visible solo a `ADMIN`. |
| Usuarios: cambio de rol/estado | — | Solo `ADMIN` | Acciones devuelven error si otro rol las invoca. |
| Auditoría: consulta | Solo `ADMIN`; los demás se redirigen a Dashboard antes de consultar eventos | — | Enlace visible solo a `ADMIN`. |
| Auditoría: mutación | No hay acción de mutación en esta pantalla | — | Vista de lectura. |
| Navegación | — | — | Usuarios y Auditoría solo aparecen a `ADMIN` en sidebar y dashboard; los demás módulos siguen visibles mientras se completa OQ-032. |

## Observaciones abiertas para el cliente

1. **Ejecución:** para esta preentrega comprende cálculo de sellos y guardado de snapshot preliminar; ambos están habilitados para `ADMIN`/`R_AND_D`. Otras ejecuciones nuevas quedan sujetas a observación.
2. **Costos/Finanzas:** se aplica la respuesta más reciente: Finanzas (`VIEWER`) consulta y `ADMIN` importa/aplica. La discrepancia con P-14 anterior se presenta como observación.
3. **Usuarios y auditoría:** lectura/gestión de usuarios y bitácora global solo para `ADMIN`; I+D conserva historial de formulaciones en los productos.
4. **Vista de versiones:** `QUALITY`/`VIEWER` consultan solo `APPROVED`; `ADMIN`/`R_AND_D` consultan historial completo.
5. **Imprimir/exportar:** impresión de previsualización solo para `ADMIN`/`R_AND_D`; no hay exportación ni emisión oficial. Calidad y Finanzas no obtienen salida imprimible en esa pantalla.
6. **Administrador:** gestiona provisionalmente los módulos técnicos y costos. `ADMIN` también puede crear versiones de parámetros regulatorios; la lectura de parámetros está disponible a los demás perfiles.

## Límites de este inventario

- El inventario inspecciona guardas de Server Actions, componentes y páginas existentes. No es prueba de seguridad E2E.
- Cambios aplicados el 1-oct-2026: rutas de Usuarios/Auditoría protegidas en servidor; estados de formulación filtrados para Calidad/Finanzas; snapshots e impresión preliminar para ADMIN/I+D; parámetros regulatorios versionados, editables solo por ADMIN.
- Revisión visual autenticada completada localmente para Calidad e I+D en `/productos`, detalle de producto, `/documentos` y `/normativa`. Se confirmó el acceso de consulta/edición según rol y se corrigió el resumen de merma por versión. La revisión no guardó datos ni reemplaza una prueba E2E automatizada.
- El envío a revisión exige suma porcentual exacta de `100,00 %`, sin tolerancia: acción de servidor y botón de UI bloquean versiones que no la cumplen.
- Matriz provisional aplicada en interfaz y servidor; los puntos de observación están listados arriba y en OQ-032.


## Verificación manual local del 2 de octubre de 2026

- Se inició sesión en el navegador local con `QUALITY` e `R_AND_D`. Calidad pudo consultar `/documentos`, `/normativa`, `/costos`, catálogos y detalle de producto; en `/documentos` no se mostraron controles de guardar ni imprimir. En detalle, CTN, crear nueva versión y calcular sellos no aparecieron como acciones habilitadas (controles visibles deshabilitados en la versión aprobada).
- I+D tiene acceso de edición/ejecución en detalle de producto y los documentos muestran las acciones de guardar/imprimir cuando la fuente permite salida. Finanzas y ADMIN no fueron recorridos en esta sesión.
- El historial visible de documentos no contiene snapshots guardados en el estado local consultado; por ello no se validó visualmente la lectura del soporte de un snapshot existente. Guardar snapshots modificaría datos, así que no se hizo.
- Se encontró y corrigió el ofrecimiento de guardar/imprimir salidas cuya nutrición todavía proviene solo del Banco Nutricional: la UI ahora lo condiciona a captura CTN, y la acción del servidor rechaza otros orígenes. El snapshot conserva el origen como antes.
- Se añadió al dashboard el alcance de cada módulo según el perfil conectado, para que “Disponible” no sugiera que todos los roles pueden ejecutar las mismas acciones.
- Esta revisión es una comprobación manual de interfaz autenticada, no una prueba de seguridad completa ni una prueba E2E automatizada.
