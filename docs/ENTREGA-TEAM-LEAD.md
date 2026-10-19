# Gate final — entrega de código fuente

**Recomendación: LISTO PARA SUBIR EL PAQUETE ÚNICO DE CÓDIGO para revisión/construcción del team lead.** No significa aprobación de carga de datos, despliegue ni emisión oficial. Este gate es el corte previo a la publicación; el recibo posterior confirma el SHA remoto. No autoriza merge ni deploy.

## Procedimiento real y arquitectura

El procedimiento operativo es **README §8 + `docker-compose.prod.yml` + `Dockerfile` del repositorio**. README ordena `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`; Compose define `build.context: .` y los targets `herramientas`/`runtime`. No referencia imágenes publicadas de la aplicación en un registro. Las imágenes se construyen en destino.

Las imágenes locales linux/arm64 y sus archivos son evidencia de ensayo, **no artefactos que deban cargarse en el servidor**. No hace falta conocer arm64/amd64 para subir el código ni producir otra imagen local. El team lead verifica su plataforma y construye nativamente allí, con Node22/pnpm fijados por el Dockerfile y lockfile congelado. Los Dockerfiles de ensamblaje de artefactos incluidos en la evidencia explican cómo se evitó el disco lleno del Mac; no sustituyen el Dockerfile de despliegue.

## Gate de código y evidencia

- Diff revisable respecto de `e891300f8acddd24a226e402d45e6a29f12b026e`; el ZIP incluye parche completo y listado de archivos cambiados/nuevos. Sin nuevo commit/push ni historia Git extra.
- Huella ensayada de los200 archivos: `62c755bbb0af85d417944c141e9d4fb0544ec94e4115e76d35f75ace1453e403`. Huella de publicación: `6e3399ddff66e1ce9543bd8f2ba372f671bfca868768495dadee8fd1528c102e`. La única diferencia de código posterior es quitar un espacio final en el generador de informes; su AST Python es idéntico y todos los demás archivos de código/tests/harness son byte a byte los probados. Logs publicados sin espacios finales; trazabilidad en `materiales/PUBLICATION-FORMATTING.json`.
-186 pruebas/40 archivos,18 casos atómicos, tipos/lint/build y25 comprobaciones de navegador correctos. Seis capturas y PDF de fixture; no aprobaciones reales.
- Docker: load/run normal de herramientas con migraciones/bootstrap/integración; runtime actual normal sin montar código de aplicación, UID1000/disco de solo lectura, cuatro páginas protegidas y18 assets correctos. Sus2215 archivos coinciden con la compilación exportada. Ver `deliverables/sevilla-review/materiales/docker_cierre_final`.
- Revisión de secretos y hashes de contenido: sin credenciales reales, `.env` reales, respaldos/dumps, claves privadas ni tokens. Las plantillas y el literal de cabecera de clave del test de sanitización no son credenciales. Las fuentes empresariales incluidas mantienen sus hashes y el alcance previamente autorizado.

## Migraciones y rollback

Hay13 migraciones en el repo; el destino debe consultar su historial real. Respecto de la base de esta entrega se añaden dos:

1. `20261019190000_preserve_nutrient_source_precision`: amplía `nutrient_values.value` a DECIMAL(38,24). El ensayo conserva los1206 valores previos del fixture, sin redondearlos.
2. `20261019210000_source_working_review`: añade JSONB nullable `sourceReviewSnapshot`, sin reescribir recetas ni cambiar estados/aprobaciones.

`20261019170000_source_recipes_and_bundles` ya está en la base del paquete; no se asume aplicada en el servidor. El team lead debe cotejar todas las pendientes y aplicar `prisma migrate deploy` mediante el servicio `migrar`, primero en una restauración autorizada del respaldo real. El arranque no ejecuta seed ni importa las recetas de los materiales.

**Rollback:** antes de migrar/cargar, el operador crea y prueba un respaldo real y conserva el release anterior. Si falla, detiene escrituras y vuelve al release conocido; estas dos ampliaciones pueden permanecer sin contraer DECIMAL ni borrar evidencia JSON. No hay una migración inversa destructiva automática. Si se necesita volver al estado de datos anterior, se restaura el respaldo validado en el destino confirmado, teniendo en cuenta las escrituras posteriores. No usar `migrate reset`, truncamientos o reducciones de precisión. El ensayo local demuestra restauración y rollback de transacciones de importación; no certifica un respaldo del servidor ni un downgrade de producción.

## Pendientes visibles y efecto funcional

Junio (1).xlsx es la última base confirmada, más correcciones documentadas de Joan. No se pide otro historial general. Cada cambio se prepara en otra copia DRAFT y conserva la fuente; Director aprueba con referencia explícita.

- Identidad, unidad, cantidades o suma distinta de100: el borrador se puede preparar; no se presenta como composición conciliada apta para revisión cuando incumple sus controles. No se redondea ni normaliza.
-13 identidades nutricionales faltantes afectan14 productos del fixture base: bloquean el cálculo/documento completo, no la preparación del borrador. No equivalen al déficit del catálogo desplegado; los65 códigos candidatos son otra cohorte y no se suman.
- Santa, Cervecero500 y Mega mantienen sus discrepancias por celda; códigos compartidos entre materias/fabricantes/orígenes permanecen por aparición. Ver matriz y libro de cierre. No se inventan pesos, perfiles ni equivalencias.
- Clasificación grasa/especie incompleta: bloquea guardar/imprimir documento; no altera nutrientes ni umbrales numéricos. La clasificación sustentada se conserva con la versión.
- Agrupaciones: conciliación y aprobación de composición disponibles; etiqueta nutricional agregada bloqueada. No se calcula usando una receta ficticia de ingredientes.
- Documento: snapshot preliminar e impresión **NO OFICIAL**. No se afirma firma, emisión ni paridad campo a campo con TLv4 ausente.

## Controles que corresponden al team lead en destino

1. Revisar el diff/alcance y construir desde el código con el Dockerfile/Compose del repo; comprobar arquitectura, espacio, proxy/red y variables privadas sin publicarlas.
2. Respaldar/restaurar y cotejar esquema/historial/colisiones del destino antes de migraciones o datos; validar el adaptador aplicable. Los scripts `scripts/review/*` restringidos a fixtures no se ejecutan como importadores de producción.
3. Aplicar migraciones pendientes, arrancar y comprobar salud, login, permisos, lectura/escritura en borrador y documento con los datos y entorno reales. El bootstrap es solo inicial; nunca ejecutar el seed de demostración en producción.
4. Tramitar las resoluciones y aprobaciones operativas dentro de la app. Cargar datos o publicar documentos requiere su decisión específica; subir este código no las ejecuta.

Estas son comprobaciones legítimas del destino, no impedimentos para entregar el código. Las guías vigentes son este gate, README §8 y `ESTADO-VIGENTE-ENTREGA.md`; los ensayos/informes anteriores identificados como históricos no generan requisitos nuevos.
