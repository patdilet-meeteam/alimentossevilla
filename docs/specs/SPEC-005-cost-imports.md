# SPEC-005 — Costos de Formulaciones e Importador Mensual

> **Estado:** `implementación técnica en curso`.
> **Fuente canónica:** archivo mensual de costos de materias primas confirmado en P-12.

## 1. Alcance confirmado

- Importar archivos `.xlsx` mensuales con código, descripción, unidad y costo unitario.
- Conservar nombre, huella SHA-256 y cada fila fuente para auditoría y reproceso seguro.
- Relacionar por código SIESA; usar coincidencia exacta de nombre solo cuando el código operativo y el contable difieren.
- Crear automáticamente códigos desconocidos como ingredientes `pendingReview=true`, sin rechazar el archivo completo (P-13).
- Workflow `DRAFT → APPLIED → SUPERSEDED`; el código actual exige `ADMIN` para cargar/aplicar. P-14 lo había asociado a Finanzas vía `ADMIN`, en conflicto con la matriz posterior (`VIEWER` consulta); mantener OQ-032 abierto hasta resolver la responsabilidad de carga.
- Detectar filas inválidas y conservar todas las filas de códigos duplicados; las inválidas bloquean aplicación, mientras duplicados válidos no bloquean y el costo efectivo usa la última asignación (mayor `sourceRow`).
- Calcular el costo directo de materia prima de una formulación como cantidad de entrada × costo unitario, solo cuando la unidad es `KG` y existe una coincidencia inequívoca.

## 2. Fuera de alcance hasta confirmación

- Conversión entre `KG`, `UND` y `MTR`.
- Costo por presentación, empaques, mano de obra, CIF, merma o rendimiento.
- Reglas contables distintas del archivo mensual confirmado.

## 3. Criterios de aceptación técnicos

1. El mismo archivo no puede importarse dos veces.
2. Cada fila conserva número de fila, código, descripción, unidad, costo, estado y problemas detectados.
3. Los códigos nuevos quedan visibles como pendientes de revisión.
4. Un archivo con filas inválidas permanece en `DRAFT`; los duplicados por sí solos no bloquean aplicar y el costo efectivo es el de la última fila fuente.
5. Solo `ADMIN` puede cargar o aplicar; los demás roles autorizados pueden consultar.
6. La carga y aplicación generan eventos de auditoría sin almacenar el archivo binario ni secretos.
7. El cálculo directo reporta faltantes y unidades incompatibles, sin sustituir valores.

## 4. Hallazgo del archivo canónico

El archivo inspeccionado contiene filas con 279 códigos clasificables: 20 códigos `11`, 81 códigos `12`, 167 códigos `13` y 11 códigos `29`. Usa 111 filas `KG`, 96 `UND`, 69 `MTR` y 3 sin unidad. Presenta cuatro códigos duplicados; algunos repiten el mismo código con unidad o costo diferente. Las unidades faltantes se encuentran en las filas fuente 278, 279 y 506; el archivo permanece bloqueado para aplicación hasta que Finanzas/cliente complete o confirme esas unidades. Ver OQ-025.
