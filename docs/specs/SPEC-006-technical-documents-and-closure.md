# SPEC-006 — Datos para Documentos Técnicos y Cierre

> **Estado:** `preparación técnica parcial validada`.
> **Fecha:** 14 de septiembre de 2026.

## Alcance confirmado implementado

La pantalla `/documentos` expone una **previsualización no emitida** para cada formulación aprobada:

- toma los ingredientes directamente desde la versión aprobada de la formulación;
- los ordena de forma descendente por porcentaje de participación;
- conserva la lista de etiquetas de alérgenos declaradas en los ingredientes;
- muestra las presentaciones activas como contexto del producto.

Esto implementa la parte confirmada de P-09 sin redactar una leyenda legal ni transformar nombres o alérgenos. La pantalla no crea archivos, no registra una emisión y no modifica la formulación.

## Fuera de alcance hasta contar con insumos aprobados

- Diseño, estructura y texto completo de la ficha técnica.
- Plantilla definitiva del documento `Textos Legales` y sus campos obligatorios.
- Tabla nutricional, valores por porción, sellos, leyendas y cualquier cálculo regulatorio.
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

## Siguiente decisión requerida

Entregar la plantilla aprobada de ficha técnica / Textos Legales, especificar el flujo y roles de emisión, y confirmar el contenido que debe conservar el snapshot histórico definido en P-11. Con esos insumos se podrá implementar generación y trazabilidad de documentos sin inventar contratos públicos ni textos normativos.
