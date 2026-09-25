# SPEC-006 — Datos para Documentos Técnicos y Cierre

> **Estado:** `previsualización técnica ampliada y validada; pendiente plantilla y emisión oficial`.
> **Fecha:** 14 de septiembre de 2026.

## Alcance confirmado implementado

La pantalla `/documentos` expone una **previsualización no emitida** para cada formulación aprobada:

- toma los ingredientes directamente desde la versión aprobada de la formulación;
- los ordena de forma descendente por porcentaje de participación;
- conserva la lista de etiquetas de alérgenos declaradas en los ingredientes;
- muestra las presentaciones activas como contexto del producto.
- calcula y muestra información nutricional por 100 g y por cada porción comercial declarada;
- muestra los sellos propuestos por la evaluación de la versión aprobada.

Esto implementa la parte confirmada de P-09 sin redactar una leyenda legal ni transformar nombres o alérgenos. La pantalla no crea archivos, no registra una emisión y no modifica la formulación.

## Fuera de alcance hasta contar con insumos aprobados

- Diseño, estructura y texto completo de la ficha técnica.
- Plantilla definitiva del documento `Textos Legales` y sus campos obligatorios.
- Plantilla oficial, leyendas regulatorias, diseño final del rótulo y cualquier emisión oficial.
- Emisión de documentos oficiales, exportación PDF y definición de responsable de aprobación.
- Persistencia de snapshots emitidos: P-11 confirma que deben ser inmutables, pero el contenido exacto, la plantilla y el flujo de emisión todavía no están especificados.

## Evidencia técnica

```text
pnpm typecheck                         OK
pnpm lint                              OK
pnpm test                              80 passed, 0 failed
pnpm exec next build --webpack         OK
git diff --check                       OK
```

La prueba unitaria valida el orden descendente y la deduplicación de etiquetas de alérgenos. Las pruebas de integración existentes de formulaciones y costos también ejecutaron contra PostgreSQL local.

## Siguiente paso verificable

La estructura funcional está confirmada por OQ-016/P-10 y P-11: el documento Textos Legales sirve como guía y los documentos emitidos deben conservar snapshots inmutables. El archivo físico TL v4 ya fue revisado y confirma los campos y el orden general.

La emisión oficial permanece bloqueada por OQ-030: el TL/arte final y el cálculo vigente de `TN OFICIAL` no coinciden en valores nutricionales ni en cantidad de sellos.

Con el archivo físico disponible se debe validar, campo por campo, la denominación legal, QUID si aplica, alérgenos, tabla nutricional, sellos, conservación, vida útil y cualquier leyenda fija. El arte final gráfico permanece fuera del alcance.
