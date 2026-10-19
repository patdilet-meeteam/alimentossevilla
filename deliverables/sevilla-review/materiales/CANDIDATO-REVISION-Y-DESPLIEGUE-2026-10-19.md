> INFORME HISTÓRICO: conserva evidencia del momento. No usar sus solicitudes generales ni conteos como estado vigente. Consulte `proyecto/docs/ESTADO-VIGENTE-ENTREGA.md` en el ZIP y el ensayo final.

# Candidato de revisión y plan separado de despliegue

**Estado: candidato técnico revisable, no liberado ni desplegado.** No se importó en producción ni se declaró vigente ninguna variante. Base de comparación `21ea62a`, rama `codex/ready-use-audit-fixes`. Ruta local: `<REPO>`.

## Qué permite revisar

En Productos → detalle → versión, ADMIN e I+D conservan el selector de variantes y su alcance actual. La selección en pantalla no equivale a vigencia. El nuevo panel muestra hoja y SHA, filas/cantidades/porcentajes originales, diferencias con componentes vinculados, reprocesos sin código, fórmulas y totalizadores, y perfiles activos ausentes/ambiguos o con nutrientes faltantes. Las agrupaciones de productos terminados se muestran aparte.

El panel es de consulta de evidencia: no resuelve identidades ni libera bloqueos automáticamente. Una corrección debe tener fuente y pasar por el flujo existente. No hay botón que permita declarar resuelta una discrepancia sin evidencia.

Roles sin cambios: ADMIN e R_AND_D modifican borradores; solo ADMIN aprueba/devuelve. QUALITY y VIEWER conservan consulta de versiones aprobadas, no se les abren borradores. El backend exige IN_REVIEW para aprobar y vuelve a comprobar los bloqueos de fuente y la suma exacta100; registra actor, fecha y auditoría. No se añadieron roles, permisos, cuentas ni accesos persistentes.

## Validación y límites

- Suite completa:149pruebas/29archivos correctos, con13casos de integración en PostgreSQL local efímero. Incluye rechazo por fuente pendiente, rechazo por suma distinta de100 y aprobación ADMIN válida en prueba simulada; no aprobó datos de negocio.
- Build Next webpack standalone, TypeScript y lint de cambios correctos.
- Ensayo exclusivo para pruebas:606filas fuente conservadas,597componentes vinculados,9filas sin identidad de código válida.33versiones DRAFT,4conjuntos DRAFT, cero aprobaciones. Repetición crea0entidades nuevas y mantiene recuentos. No representa carga vigente.
- Trece páginas HTTP autenticadas200: panel fuente, reproceso sin código, variante sin vigencia, perfiles pendientes, conjuntos, porciones y mensajes de aprobación comprobados por contenido. El usuario/sesión de prueba se eliminó.
- Revisión visual/interactiva añadida medianteChrome instalado enheadless/CDP y perfil aislado:15comprobaciones y8capturas, variantes por clic en escritorio/móvil, fuentes/reprocesos/perfiles y controles por rol. Se corrigieron desbordamiento móvil, cabecera y bloqueo deAprobar/Enviar. Alcance de2variantesBrakel yfixture sintético; no acredita el despliegue existente. VerREVISION-VISUAL-2026-10-19.md. IAB sigue no disponible. El contenedor y servidor temporales se eliminan al cerrar; no se entrega URLpersistente con credenciales.

## Cambios exactos del candidato

El paquete contiene `manifest_cambios_candidato.csv`, generado de `git diff --name-status 21ea62a HEAD`, y el parche completo `sevilla-ready-fixes.patch`. Ese manifiesto es la lista exacta de archivos; no incluye fuentes privadas ni payloads dentro del repositorio.

| Área | Cambios del código |
| --- | --- |
| Productos y revisión | Métricas de porciones; mensajes/selección de versión; panel de evidencia por versión; perfiles críticos activos; agrupaciones de terminados. Archivos en `src/components/products`, `src/app/(app)/productos/[id]/page.tsx`, `src/app/actions/product-actions.ts`, `src/lib/products/presentation-metrics.ts`. |
| Validación y cálculo | Suma decimal exacta; captura de receta fuente; bloqueos al enviar/aprobar/calcular/previsualizar; detección de las dos composiciones de combo incompatibles; regla de especie con clasificación explícita, sin inferencia automática. Archivos en `src/lib/formulations`, `src/lib/nutrition`, `src/components/nutrition` y acciones de formulación/nutrición/documentos. |
| Importadores | Encabezados originales del Banco, nutrientes ausentes sin ceros inventados; identidad CTN por evidencia; rechazo de porcentajes no exactos/duplicados; planificación de perfiles por código/fila/SHA. Utilidades de revisión aisladas en `scripts/review`. |
| Persistencia | Una migración nueva, descrita abajo; cliente Prisma regenerado. Ningún cambio de auth, roles o permisos. |
| Evidencia | Pruebas de regresión, conciliación de fuentes y vigencia, plan y límites de revisión. |

## A. Plan de despliegue del código — no ejecutado

1. Identificar aplicación, entorno y responsable mediante el canal operativo; comprobar commit/artefacto actual y migraciones aplicadas. No asumir que el ZIP auditado representa producción. Registrar URL sin secretos. Mantener la operación de revisión de fuentes separada.
2. Generar backup completo PostgreSQL en formato custom y SHA256, almacenado fuera del repositorio y con acceso restringido. No imprimir URL, contraseña ni configuración secreta. Verificar `pg_restore --list` y realizar restauración de ensayo en una base aislada: un archivo legible no basta como prueba de recuperación. Guardar imagen/artefacto anterior y su configuración mediante el mecanismo de secretos existente, sin copiarlos al informe.
3. Repetir build/regresión y smoke en staging con el mismo artefacto y copia autorizada de datos. Inventariar tablas, recuentos, aprobaciones y asociaciones antes/después. Preparar ventana operativa para el bloqueo breve que puede requerir ALTER TABLE. No ejecutar seed ni herramientas de importación junto al despliegue.
4. Migración nueva exacta: `20261019170000_source_recipes_and_bundles` añade `formulation_versions.sourceRecipeSnapshot` nullable, amplía porcentaje/cantidad de componentes aDecimal(38,24) y crea `product_bundle_versions`/`product_bundle_components`, índices únicos yFK. No asigna vigencia, no cambia estados ni crea datos comerciales. Las diez migraciones previas pertenecen a la base del candidato; el operador debe comprobar cuáles faltan realmente. No usar `db push` para sustituir el historial.
5. Solo en una ejecución futura autorizada: aplicar las migraciones pendientes verificadas con `prisma migrate deploy`, arrancar el artefacto construido y revisar login, roles actuales, productos/versiones, perfiles, documentos y bloqueos. Comparar recuentos de negocio/aprobaciones; no deben cambiar por desplegar código. Conservar logs sanitizados, commit, hashes y migraciones aplicadas.

**Reversión:** si falla antes de arrancar la nueva app, detener la operación y evaluar el estado real de la transacción/migración antes de reintentar. Si falla la app tras una migración aditiva correcta y no hubo cargas nuevas, volver al artefacto anterior dejando las columnas/tablas aditivas; no bajar precisión ni borrar capturas/tablas como atajo. Si hubo datos nuevos o el artefacto anterior no puede operar con seguridad, mantener el servicio en la ventana de mantenimiento y restaurar el backup completo ensayado hacia un destino limpio, verificando recuentos y corte antes del cambio de conexión. No restaurar sobre producción ni eliminar datos automáticamente. Registrar la decisión y posible ventana de pérdida de cambios posteriores al backup.

## B. Datos revisables e importaciones — fuera del despliegue

- Preparación/conciliación sinDB: `prepare-bank-plan.ts`, `prepare-june-source-plan.py`, `reconcile-current-scope.py`. Conservan hash y filas, separan empaque/subfórmulas y no eligen variante vigente.
- Ensayo local: `simulate-bank-plan.cjs`, `recover-june-sources.cjs`, `verify-june-recovery.cjs`, `check-local-pages.cjs`. Rechazan host distinto de127.0.0.1 o base distinta de`sevilla_ready_dataset`; **no son comandos de importación en producción**. No se debe quitar esa protección para desplegar.
- Idempotencia de ensayo: perfiles por destino/procedencia/valores; recetas por producto+SHA+hoja, con rechazo si cambian filas existentes; conjuntos por producto+SHA+hoja, índice único. La repetición final produjo0altas. El SQL de componentes conserva decimales y las filas sin código quedan en captura, sin crear ingrediente0.
- El importador aditivo existente `scripts/safe-data-import.cjs` tiene dry-run por defecto, transacción, rechazo de colisiones, backup y confirmación de destino; **su adaptador actual no constituye aprobación ni soporte validado de los nuevos snapshots/conjuntos**. No introducir el plan revisable en él sin un manifiesto vigente y prueba específica del adaptador.
- Antes de cualquier carga real futura: manifiesto de receta vigente por producto, referencias resueltas, propuesta de correcciones explícitas, payload separado y privado, backup/restauración ensayada, dry-run completo, comparación de diferencias y autorización para aplicar. La segunda aplicación debe ser idéntica; una colisión debe detener la carga, nunca sobrescribir. El cambio de estado sigue siendo una acción del rol existente, no del importador.

## Qué sigue bloqueado

No hay manifiesto suficiente para acreditar vigencia de las33variantes; los78códigos son unión candidata, no faltantes vigentes. Faltan conciliar rangos/porcentajes contradictorios, identidades de reprocesos, capas de Milanesa y miembros/gramajes de combos. Se conserva la regla de100exacto y la separación de cálculo/merma documentada. Estos impedimentos bloquean carga vigente, aprobación de esas fuentes y cálculo/documento presentado como listo; no impiden revisar el candidato y sus evidencias.

Referencia de datos: `CONCILIACION-VIGENCIA-2026-10-19.md`. Referencia de resultados finales: `pruebas_candidato_final.log`, `build_candidato_final.log`, `candidato_pantallas_http.json`, `candidato_verificacion_fuentes.json` y las dos ejecuciones idempotentes en el paquete. No se investigaron fuentes nuevas ni se publicaron cambios.
