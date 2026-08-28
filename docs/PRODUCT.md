# PRODUCT.md — Plataforma Centralizada de Gestión Técnica y Nutricional

## 1. Información General del Proyecto

- **Cliente:** Alimentos Sevilla S.A.S.
- **Proyecto:** Plataforma Centralizada de Gestión Técnica y Nutricional
- **Objetivo Principal:** Reemplazar y automatizar el flujo técnico-nutricional que históricamente ha dependido de múltiples libros de Excel desconectados, archivos de control de formulaciones y documentos legales dispersos, garantizando la centralización de datos, integridad de cálculos, trazabilidad histórica y cumplimiento normativo.
- **Fase Actual:** **Semana 1 — Levantamiento y Diseño** (Kick-Off funcional pendiente de confirmación de reglas específicas de negocio).

---

## 2. Alcance General y Módulos del Sistema

La plataforma se concibe como una solución integral B2B que integrará los siguientes módulos funcionales:

### 2.1. Dashboard Ejecutivo y Técnico
- Visualización del estado del catálogo, formulaciones en curso, actividad de auditoría reciente y accesos directos a los flujos principales.

### 2.2. Módulo de Ingredientes (Materias Primas)
- Catálogo centralizado de materias primas y aditivos.
- Almacenamiento de perfiles nutricionales por ingrediente.
- Vinculación mediante **código de materia prima SIESA** para posibilitar cruces con la estructura financiera.
- Gestión de alérgenos, origen y especificaciones de proveedores.

### 2.3. Módulo de Productos y Presentaciones Comerciales
- Catálogo de productos terminados (SKUs base).
- Soporte para múltiples presentaciones comerciales (empaques, gramajes, porciones por envase).
- Asociación de textos legales, declaraciones nutricionales e información para rotulado.

### 2.4. Módulo de Formulaciones y Recetas
- Creación, edición y versionamiento de fórmulas/recetas por producto.
- Control de porcentajes de inclusión, mermas, rendimientos y pérdidas de proceso.
- Historial completo y trazabilidad de cambios por versión.
- *Nota:* El workflow formal de revisión y aprobación está pendiente de confirmación en el Kick-Off.

### 2.5. Motor de Cálculo Nutricional y Regulatorio
- Cálculo automatizado de tablas nutricionales a partir de ingredientes, factores de rendimiento y tamaños de porción.
- Parametrización de normativas vigentes (resoluciones de etiquetado nutricional y frontal de advertencia).
- Determinación de sellos de advertencia ("Exceso en Sodio", "Exceso en Grasas Saturadas", "Exceso en Azúcares Añadidos", etc.) y leyendas obligatorias.
- Generación de valores diarios de referencia (VDR) y redondeos oficiales.

### 2.6. Módulo de Costos de Formulaciones
- Importación mensual de archivos de costos de materias primas provenientes de sistemas contables.
- Cruce automático mediante el código SIESA del ingrediente.
- Cálculo de costo teórico por batch y por unidad de presentación comercial.
- *Frontera de alcance:* **NO existe integración API directa con SIESA.** SIESA únicamente proporciona el código identificador presente en los archivos cargados mensualmente.

### 2.7. Módulo de Normativa y Parámetros Regulatorios
- Administración de tablas de referencia regulatoria, nutrientes obligatorios, límites para sellos de advertencia y factores de conversión energética.
- Control de vigencia y aplicación de resoluciones sanitarias.

### 2.8. Módulo de Documentación Técnica y Fichas
- Generación estandarizada de Fichas Técnicas de Producto, Textos Legales de Rotulado y Tablas Nutricionales para empaque.
- Control de versiones de los documentos emitidos.
- *Frontera de alcance:* El diseño gráfico final del arte para empaque (agencia de diseño/impresión) está **fuera de alcance**. La plataforma genera el contenido técnico, datos y textos validados.

### 2.9. Módulo de Usuarios, Perfiles y Roles
- Gestión de cuentas de usuario internas.
- Soporte para los roles iniciales identificados:
  - **Administrador**: Gestión técnica global, usuarios y parámetros del sistema.
  - **Investigación y Desarrollo (I+D)**: Creación y ajuste de formulaciones y cálculos experimentales.
  - **Calidad**: Validación técnica, parámetros regulatorios y revisión de fichas.
  - **Consulta**: Lectura y consulta de fichas técnicas y tablas aprobadas.
- *Nota:* La matriz de permisos detallada por acción está sujeta a validación en el Kick-Off.

### 2.10. Módulo de Auditoría y Trazabilidad
- Registro cronológico inmutable de eventos sensibles del sistema (creación/modificación de fórmulas, cambios de costos, accesos y modificaciones de usuarios).
- Trazabilidad de quién, cuándo y qué se modificó.

---

## 3. Estado de Definición y Hoja de Ruta

```
+-------------------------------------------------------------------------------+
| SEMANA 1 (Actual) : Platform Foundation (SPEC-001) + Levantamiento / Kick-Off |
| SEMANA 2          : Catálogo de Ingredientes y Perfiles Nutricionales         |
| SEMANA 3          : Productos, Formulaciones y Versionamiento                 |
| SEMANA 4          : Motor de Cálculo Nutricional y Sellos Regulatorios        |
| SEMANA 5          : Costos de Formulación e Importador Mensual                |
| SEMANA 6          : Generador de Fichas Técnicas, Textos Legales y Cierre     |
+-------------------------------------------------------------------------------+
```

> **IMPORTANTE:** Durante la Semana 1, el foco es **SPEC-001 (Platform Foundation)**. No se implementan fórmulas nutricionales ni lógica regulatoria provisional para evitar reescrituras antes de la consolidación formal del Kick-Off.
