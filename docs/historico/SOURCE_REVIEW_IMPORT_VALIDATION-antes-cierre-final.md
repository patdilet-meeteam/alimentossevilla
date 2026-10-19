> HISTÓRICO. No usar como instrucciones vigentes. Consulte docs/ESTADO-VIGENTE-ENTREGA.md.

# Validación consolidada de fuentes e importación local

Ver [resultado y límites actuales](CONSOLIDACION-2026-10-19.md). El CLI `scripts/review/run-consolidated-local.cjs` reúne las comprobaciones en una sola ejecución sobre PostgreSQL desechable. Su salida y huellas se conservan en `deliverables/sevilla-review/materiales/ensayo_consolidado_revision/`.

El núcleo de recetas procesa33 versiones y4 conjuntos en una transacciónSerializable, con bloqueo asesor. Preserva todas las filas existentes, incluidos IDs/timestamps; compara encabezados, snapshots, componentes y estados antes de aceptar una repetición. Un error al final revierte el lote completo. No actualiza/elimina registros existentes ni normaliza cantidades/porcentajes. Su CLI mantiene127.0.0.1 y base`sevilla_ready_dataset`, dry-run por defecto y confirmación de ensayo únicamente con`--apply-local`.

Se aplican12 migraciones en una instalación limpia. La última amplía solamente el valor nutricional aDecimal(38,24). Una prueba independiente aplica esa ampliación sobre1206 filas existentes y conserva su huella íntegra. No se recupera por inferencia ningún decimal previamente truncado.

El plan66 se aplica dos veces al fixture; la segunda no crea/desactiva perfiles. Todos los275 porcentajes y1121 valores de perfiles se comparan con fuentes. Los1121 valores también fueron cotejados con celdas XML originales. Las221 cifras de las13 correspondencias nuevas se verifican adicionalmente en una transacción que revierte por completo; la prueba incluye24 dígitos fraccionarios exactos.

Los16 casos adicionales PostgreSQL incluyen dry-run completo, fallo tras33 recetas/3 conjuntos, backup custom restaurado en otra base independiente, preservación de una versión7 y unAPROBADO sintético previo, segunda aplicación idéntica, colisiones de encabezados/componentes/conjuntos/estado, rechazo de concurrencia, destino incorrecto y libro conSHA incorrecto. Los centinelas se eliminan:0usuarios,0sesiones y0aprobaciones de negocio al cierre.

Se conservan606 filas fuente y597 componentes vinculados en las33 recetas. Las9 identidades0/vacías quedan en snapshots, sin crear ingredientes ficticios. Los4 conjuntos suman14 miembros; datos ausentes o contradictorios quedan bloqueados. Los7 bloques alternativos/ensambles adicionales se inventarían, no se eligen como vigentes.

El flujo termina verificando contenido fuente, suite completa, TypeScript, lint y build webpack. La huella del código antes/después debe coincidir y se elimina el contenedor de prueba. El programa no acredita imágenes Docker de producción ni el estado de la aplicación remota.

**Límite operativo:** el fixture y los planes de ensayo no son un adaptador certificado para la base desplegada. El team lead debe restaurar un respaldo autorizado de ese destino y verificar esquema, contenido y colisiones antes de preparar la carga real. No quitar las guardas locales ni ejecutar el seed sobre producción. Ninguna receta/conjunto se aprueba ni adquiere vigencia por pasar estas pruebas.

## Evidencia vigente tras las guardas por fila

El cierre actual es `materiales/ensayo_consolidado_filas/`:172 pruebas/36 archivos y18 casos PostgreSQL. Se preservan606 filas;586 quedan vinculadas,20 conservan identidad pendiente. Cinco de esas filas tienen85 valores nutricionales de origen documentados, sin perfiles globales adicionales. Las11 filas aisladas ya no se unen por código; los3 códigos que requieren identidad por aparición no admiten nuevas asignaciones de perfil global por importador, editor ni cálculo basado en ese perfil. Una capturaCTN válida por fila conserva su vía independiente de cálculo. Ver el cierre y la matriz de impacto en la guía de consolidación. Los números597/9 y16casos descritos arriba corresponden al ensayo anterior, conservado por trazabilidad.
