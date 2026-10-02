# SPEC-006 — Datos para Documentos Técnicos y Cierre

> **Estado:** `previsualización y snapshots preliminares versionados; emisión oficial pendiente`.
> **Fecha:** 14 de septiembre de 2026.

## Alcance confirmado implementado

La pantalla `/documentos` expone una **previsualización no emitida** para cada formulación aprobada:

- toma los ingredientes directamente desde la versión aprobada de la formulación;
- los ordena de forma descendente por porcentaje de participación;
- conserva la lista de etiquetas de alérgenos declaradas en los ingredientes;
- muestra las presentaciones activas como contexto del producto.
- calcula y muestra información nutricional por 100 g y por cada porción comercial declarada;
- muestra los sellos propuestos por la evaluación de la versión aprobada.
- permite a `ADMIN` y `R_AND_D` guardar una copia inmutable de la previsualización, numerada por producto y vinculada a la versión aprobada de la formulación;
- permite a los perfiles de consulta revisar los snapshots guardados, incluyendo contenido, autor y fecha.
- incluye la versión de parámetros regulatorios utilizada en el cálculo de sellos.

Esto implementa la parte confirmada de P-09 sin redactar una leyenda legal ni transformar nombres o alérgenos. El snapshot JSON es soporte técnico provisional de preentrega; no crea un PDF/arte final, no registra una emisión oficial y no modifica la formulación.

## Fuera de alcance hasta contar con insumos aprobados

- Diseño, estructura y texto completo de la ficha técnica.
- Plantilla definitiva del documento `Textos Legales` y sus campos obligatorios.
- Plantilla oficial, leyendas regulatorias, diseño final del rótulo y cualquier emisión oficial.
- Emisión de documentos oficiales, exportación PDF y definición de responsable de aprobación.
- Emisión oficial, PDF final, aprobación, firma o soporte gráfico aprobado. El cliente aún puede pedir soporte adicional al snapshot técnico provisional.

## Evidencia técnica

Para el avance del 1-oct-2026: Prisma Client generado; migraciones `20261001090000_spec_006_preliminary_document_snapshots` y `20261001100000_spec_004_regulatory_parameter_versions` aplicadas; `prisma migrate status` reportó esquema actualizado; TypeScript y build Webpack de Next.js completaron correctamente. No se ejecutó suite de pruebas en este avance.

```text
pnpm typecheck                         OK
pnpm lint                              OK
pnpm test                              80 passed, 0 failed
pnpm exec next build --webpack         OK
git diff --check                       OK
```

La prueba unitaria valida el orden descendente y la deduplicación de etiquetas de alérgenos. Las pruebas de integración existentes de formulaciones y costos también ejecutaron contra PostgreSQL local.

## Siguiente paso verificable

La estructura funcional está confirmada por OQ-016/P-10 y P-11: el documento Textos Legales sirve como guía y los documentos emitidos deben conservar snapshots inmutables. Para preentrega se implementa una bitácora preliminar JSON; no se declara como plantilla o soporte final. El archivo físico TL v4 ya fue revisado y confirma los campos y el orden general.

El cliente ya confirmó que el cálculo del reporte debe replicar los Excel compartidos 1:1. La previsualización permanece en validación porque el motor aún usa perfiles activos de `TN OFICIAL` y no demuestra paridad con el Excel. Esta es una brecha técnica de implementación/validación, no una pregunta funcional pendiente. La salida oficial y el soporte final siguen pendientes de desarrollar y verificar según la plantilla aprobada.

Con el archivo físico disponible se debe validar, campo por campo, la denominación legal, QUID si aplica, alérgenos, tabla nutricional, sellos, conservación, vida útil y cualquier leyenda fija. El arte final gráfico permanece fuera del alcance.
