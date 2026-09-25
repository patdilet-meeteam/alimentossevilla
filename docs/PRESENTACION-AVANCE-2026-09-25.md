# Guion de presentación — Avance funcional

## Mensaje principal

La plataforma ya centraliza ingredientes, usuarios, formulaciones, versionamiento, costos, cálculo nutricional, sellos y una previsualización de documentos técnicos. La información queda trazable y las versiones aprobadas son inmutables.

## Recorrido recomendado

1. Iniciar sesión con un usuario Administrador.
2. Mostrar el catálogo de ingredientes y un perfil nutricional activo.
3. Abrir `SALCHICHA DESAYUNO PREMIUM 480 G`.
4. Mostrar la versión `v3 APPROVED`, sus 18 ingredientes y la trazabilidad de aprobación.
5. Seleccionar la presentación de 480 g y porción de 34,3 g.
6. Ejecutar `Calcular sellos`.
7. Explicar la tabla por 100 g y por porción:
   - 145,4 kcal/100 g y 49,9 kcal/porción.
   - 613,04 mg de sodio/100 g y 210,21 mg/porción.
   - Sellos propuestos: sodio y grasas saturadas.
8. Abrir `/documentos` y mostrar ingredientes, alérgenos, tabla nutricional, porciones y sellos.
9. Mostrar la alerta OQ-030 como ejemplo de control de calidad: el sistema no oculta diferencias entre la fuente histórica y la fuente nutricional vigente.

## Qué está técnicamente validado

- Foundation, autenticación, roles y auditoría.
- Catálogo de ingredientes y perfiles nutricionales.
- Productos, presentaciones, formulaciones y versionamiento.
- Importación y cálculo de costos.
- Motor nutricional y sellos.
- Previsualización técnica de documentos.

## Qué requiere decisión del cliente

- Fuente oficial final para resolver la diferencia TL v4/arte frente a `TN OFICIAL` (OQ-030).
- Aprobación regulatoria de textos, sellos y valores antes de emitir documentos.
- Revisión del formato físico final y flujo de emisión/snapshot.

## Frase de cierre sugerida

"El sistema ya permite calcular y explicar el resultado técnico. La emisión oficial queda protegida por una validación de fuente: cuando el documento histórico, el arte y la base nutricional vigente difieren, la plataforma lo hace visible y solicita una decisión, en lugar de aprobar silenciosamente un rotulado inconsistente."
