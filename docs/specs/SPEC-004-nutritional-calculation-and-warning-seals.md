# SPEC-004 — Cálculo Nutricional y Sellos de Advertencia

> **Semana 4** del cronograma de Alimentos Sevilla S.A.S.
> **Estado:** `preparación documentada — implementación bloqueada por OQ-022, OQ-023 y OQ-024`.
> **Fecha de preparación:** 14 de septiembre de 2026.

---

## 1. Propósito

Implementar un motor reproducible que convierta una versión aprobada de formulación y sus perfiles nutricionales en resultados nutricionales por 100 g y por presentación, utilizando el contrato de cálculo oficial validado por el cliente. El motor debe conservar trazabilidad de sus entradas y de la versión de formulación que calcula.

## 2. Evidencia fuente inspeccionada

El archivo `CTN - Salchicha Desayuno Premium - v11.xlsx` contiene:

- Una hoja `CTN` con ingredientes, cantidades, porcentajes, valores nutricionales de entrada y aportes ponderados.
- Hojas de análisis y tabla nutricional con resultados por 100 g y por porción.
- Presentaciones de 115 g, 240 g, 480 g y 960 g.
- Hojas de lista de ingredientes con porcentajes y clasificaciones de aditivos.

La auditoría de fórmulas identificó que los aportes ponderados siguen el patrón `nutriente del ingrediente × porcentaje de participación`. Después se suman por nutriente. La hoja aplica la merma de cocción y frío (`11 %`) como humedad × `0,89` y demás nutrientes × `1,11`; los resultados ajustados pasan a la hoja `Análisis`, que redondea macronutrientes antes de calcular energía y escala los resultados por gramos de porción.

Sin embargo, la hoja `CTN` titulada como salchicha toma códigos desde la hoja oculta `Chorizo con ternera (3)`. Además, la evaluación del sello de grasa saturada usa solo el aporte del tocino (`CTN!AA6`) y no el total de grasa saturada. Estas inconsistencias impiden usar el archivo como fixture normativo definitivo hasta resolver OQ-023 y OQ-024.

Esto confirma que existe un caso de referencia útil para pruebas de paridad. No confirma por sí mismo las reglas de cálculo, redondeo, retención o los parámetros regulatorios que el código debe implementar.

## 3. Alcance posible una vez confirmadas las preguntas abiertas

1. Servicio de cálculo puro y tipado, separado de Server Actions y componentes React.
2. Selección de una versión `APPROVED` y de perfiles nutricionales activos por ingrediente.
3. Cálculo de aportes por ingrediente, resultado por 100 g y resultado por porción.
4. Registro de entradas, resultado y versión de formulación para auditoría.
5. Pruebas de paridad contra el caso CTN oficial, incluyendo valores de borde y redondeos.
6. Evaluación de sellos a partir de parámetros regulatorios versionados y vigentes.

## 4. No implementar antes de la confirmación

- Fórmulas de merma, concentración o retención de nutrientes.
- Reglas de redondeo, cifras significativas o conversión de unidades.
- Umbrales de sellos, valores diarios de referencia o leyendas regulatorias.
- Selección automática de una fuente nutricional ante perfiles múltiples.
- Carga masiva de productos o ingredientes desde el CTN.

## 5. Preguntas que bloquean la implementación

| Pregunta | Decisión requerida | Riesgo si se infiere |
|---|---|---|
| OQ-022 | Confirmar CTN v11 como patrón oficial vigente | Paridad contra un caso no canónico |
| OQ-023 | Entregar o validar el orden matemático de cálculo | Resultados nutricionales incorrectos |
| OQ-024 | Definir fuente, hoja y mapeo canónico de ingredientes | Asociar datos nutricionales a materia prima equivocada |
| OQ-010 | Definir quién actualiza parámetros regulatorios | Permiso funcional no autorizado |

## 6. Criterios de aceptación propuestos para validación humana

- El cliente reconoce el caso CTN seleccionado y sus resultados esperados.
- Cada resultado calculado conserva referencia a versión de formulación, perfiles nutricionales y parámetros usados.
- Las pruebas de paridad cubren resultado por 100 g, porción, presentaciones y redondeos confirmados.
- Cambiar una formulación aprobada requiere una nueva versión; los resultados históricos no se modifican.
- Los sellos se calculan solo con la norma y los umbrales vigentes confirmados.

## 7. Próximo paso verificable

Recibir una respuesta del cliente para OQ-022 a OQ-024 y un caso CTN oficial con resultados esperados que se pueda convertir en fixture de prueba. Hasta entonces, el avance permitido es documentación, inventario de datos y diseño técnico desacoplado.

### Respuesta mínima solicitada al cliente

1. Indicar el archivo, producto y hoja que constituyen el caso oficial de paridad, y confirmar que sus resultados son los que debe reproducir la plataforma.
2. Entregar o validar la secuencia completa que aplica el Excel: base de entrada, participación, rendimiento/merma, conversiones, retenciones, resultados por 100 g, porción y cada punto de redondeo.
3. Confirmar el código y la fuente canónicos de cada ingrediente del caso; incluir cómo deben resolverse códigos vacíos, duplicados o con descripción distinta.
4. Identificar la norma, vigencia y responsables autorizados para parametrizar sellos y demás valores regulatorios (OQ-010).

Estas respuestas no cambian los criterios de aceptación: solo permiten convertir los criterios ya documentados en pruebas de paridad reproducibles.
