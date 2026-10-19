> INFORME HISTÓRICO: conserva evidencia del momento. No usar sus solicitudes generales ni conteos como estado vigente. Consulte `proyecto/docs/ESTADO-VIGENTE-ENTREGA.md` en el ZIP y el ensayo final.

# Recuperación local de fuentes — 19 octubre 2026

**Antecedente de ensayo, supersedido para integridad/vigencia por CONCILIACION-VIGENCIA-2026-10-19.md.** La extracción inicial omitió5reprocesos sin código y eligió el primer bloque; las601filas verificadas no representan todas lasfilas fuente. El inventario revisable corregido tiene606filas y ninguna receta vigente acreditada.78no es faltante vigente confirmado. No reutilizar este ensayo como plan de carga.

Resultado comprobado en PostgreSQL efímero local; no acredita el despliegue. Rama `codex/ready-use-audit-fixes`, base `21ea62a`. No push, despliegue, acceso a DB remota, importación real ni aprobación de negocio.

## Cobertura

| Entidad | ZIP auditado | Ensayo con fuentes |
| --- | ---: | ---: |
| Productos / presentaciones | 39 / 63 | 39 / 63 |
| Ingredientes | 430 | 456 |
| Formulaciones | 17 | 38 |
| Versiones de formulación | 18 | 51, todas DRAFT |
| Componentes de formulación | 275 | 872 |
| Versiones de conjuntos de productos terminados | 0 | 4, todas DRAFT |
| Componentes de conjuntos | 0 | 14 |
| Perfiles totales / activos | 18 / 18 | 71 / 68 |
| Valores nutricionales | 306 | 1206 |
| Versiones aprobadas | 0 | 0 |

Se recuperaron 33 hojas de recetas para 21 de los 22 productos sin formulación. Se contrastaron sus 601 filas: 597 componentes vinculados y cuatro filas con código literal 0 preservadas en la captura de fuente, sin crear ingrediente 0. Los 26 códigos nuevos existentes en esas hojas se conservan con descripción original, categoría OTRO y pendingReview; no se infiere clasificación comercial ni equivalencia nutricional. `explosi-n-me-dic` es una explosión de materiales de empaque, no una receta demostrada: conserva maestro, sin formulación inventada.

Ninguna de las 33 sumas de porcentajes fuente es exactamente 100. Algunas diferencias son de representación Excel; otras son materiales (por ejemplo CERVECERO 500: 111.970224509584545859). Cinco productos tienen variantes de composición entre presentaciones. No se redondeó, normalizó ni eligió una versión vigente. La cantidad conserva valor literal y unidad pendiente cuando el encabezado no la establece. Esas cuestiones impiden enviar a revisión, calcular nutrición o mostrar documento nutricional como listo.

Se amplió el almacenamiento de porcentajes/cantidades de componentes a Decimal(38,24). La suma de la interfaz usa enteros escalados exactos para no ocultar diferencias pequeñas. Las capturas JSON separadas conservan encabezados, filas, fórmulas cacheadas y totales; no recalculan Excel ni sustituyen la captura CTN.

## Conjuntos de productos terminados

Las dos recetas heredadas incorrectas de combos (mortadela/sal) se mantienen identificadas y bloqueadas; no se reemplazan por una mezcla inventada. Se modelan agrupaciones con unidades y gramajes por producto terminado:

- Mega 675: tres unidades de 225 g = 675 g; identidades de maestro pendientes porque no hay enlace fuente inequívoco.
- Mega 900 NUEVO: cuatro unidades; una dice MORTADELA JAMONADA sin gramaje. Peso total no verificable; subtotal conocido 675 g. No se trata el dato desconocido como cero ni como diferencia demostrada.
- Mega 675G X3: tres unidades de 225 g = 675 g, pero la celda de presentación declara 900 g: diferencia fuente demostrada.
- Súper Combo Viandé 900: cuatro unidades de 225 g = 900 g; cuatro referencias a productos corroboradas por dependencias de fórmulas. No se elige receta aprobada de cada miembro.

## Banco nutricional

El comentario original TN OFICIAL!C27 identifica Arcon T y T.N!C31 lo corrobora. El plan pasa de 52 a 53 perfiles explícitos, sin fusionar códigos. Conserva grasa total 0 y saturada 0.2: anomalía original pendiente, no corrección automática. Revisados 38 comentarios Banco/CTN y seis comentarios Junio/costos; estos seis no aportan identidad nutricional pendiente.

Los 14 códigos anteriores pasan a 13 pendientes. La recuperación amplía el universo: las 33 nuevas recetas todavía requieren perfiles completos en 78 códigos distintos. No confundir esos códigos con 78 alimentos necesariamente diferentes: existen códigos numéricos, operativos y descriptivos sin equivalencia aprobada. El plan anterior 53 no se propaga por parecido de nombre. Ninguna receta recuperada está nutricionalmente completa; el piloto Salchicha Desayuno Premium 480 sigue siendo la única referencia calculable del ensayo anterior, sin aprobación de negocio ni afirmación de paridad total con CTN.

## Evidencia y reproducción

En el paquete: `plan_recuperacion_junio_21_productos.json`, `ensayo_recuperacion_junio.json`, repetición idempotente, `verificacion_recuperacion_por_producto.json` (todas las filas y decimales), `cobertura_recuperacion_por_producto.csv`, comentarios originales, `mapeos_explicitos_53_perfiles.json`, `plan_53_perfiles_respaldados.json`, migraciones y parche completo desde base.

Scripts en `scripts/review`: `prepare-june-source-plan.py` recibe carpeta de evidencia; `recover-june-sources.cjs` recibe XLSX original, plan y salida; `verify-june-recovery.cjs` recibe plan y salida. Los scripts de DB rechazan cualquier hostname distinto de 127.0.0.1 y base distinta de sevilla_ready_dataset. Solo se ejecutaron contra contenedor tmpfs desechable. Repetir recuperación crea cero entidades nuevas y deja iguales los recuentos.

Validación: 143 pruebas en 28 archivos pasaron contra DB efímera; prueba adicional de anomalía Arcon pasó (144 casos en total). TypeScript y lint de cambios correctos. Build Next webpack standalone correcto. Doce páginas autenticadas HTTP 200, incluidas las nuevas recetas y agrupaciones; cuentas/sesiones temporales eliminadas. No prueba visual ni de interacción: IAB no disponible (inventario browsers=[]). No se tocó Safari.

Quedan pendientes conciliación de porcentajes/unidades/variantes/códigos 0, perfiles de códigos recuperados, identidades y gramajes incompletos de combos, y validación del estado actual mediante navegador cloud autorizado. TL no localizada en fuentes accesibles. La revisión de despliegue y capturas de producción corresponde al hilo padre; este ensayo no la sustituye.
