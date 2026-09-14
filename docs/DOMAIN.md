# DOMAIN.md — Modelo Conceptual de Dominio (V0)

Este documento define el **Modelo Conceptual de Dominio V0** para la Plataforma Centralizada de Gestión Técnica y Nutricional de **Alimentos Sevilla S.A.S.**

Para mantener la máxima disciplina metodológica y evitar introducir esquemas físicos especulativos antes del Kick-Off funcional, cada entidad conceptual se clasifica formalmente en tres niveles de certeza:

1. **CONFIRMED CONCEPT:** Concepto verificado y necesario para la Foundation actual. Implementado físicamente en la base de datos para SPEC-001.
2. **PROVISIONAL CONCEPT:** Concepto identificado en el levantamiento inicial pero cuya estructura de campos, relaciones y restricciones detalladas se confirmarán en las siguientes semanas. **NO se migra a base de datos en SPEC-001.**
3. **OPEN QUESTION:** Aspectos de negocio, cardinalidad o reglas de cálculo cuya ambigüedad requiere validación formal en el Kick-Off.

---

## 1. Clasificación del Modelo Conceptual V0

| Entidad | Estado Conceptual | Implementado en BD (SPEC-001) | Descripción / Rol en el Dominio |
|---|---|---|---|
| **User** | `CONFIRMED CONCEPT` | **SÍ** | Cuenta de usuario del sistema con credenciales y estado activo. |
| **Role** | `CONFIRMED CONCEPT` | **SÍ** | Perfil de usuario (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`). |
| **Session** | `CONFIRMED CONCEPT` | **SÍ** | Sesión de usuario autenticada (Better Auth) con token y expiración. |
| **AuditEvent** | `CONFIRMED CONCEPT` | **SÍ** | Registro de auditoría transversal para trazabilidad inmutable. |
| **Ingredient** | **IMPLEMENTADO en SPEC-002** (10 sep 2026) | **SÍ** | Materia prima con código SIESA (validación relajada en SPEC-003) y perfil nutricional. |
| **NutritionalProfile** | **IMPLEMENTADO en SPEC-002** (10 sep 2026) | **SÍ** | Valores nutricionales por 100g de materia prima. |
| **Product** | **IMPLEMENTADO en SPEC-003** (11 sep 2026) | **SÍ** | Producto terminado elaborado por la compañía. |
| **Presentation** | **IMPLEMENTADO en SPEC-003** (11 sep 2026) | **SÍ** | Presentaciones comerciales (gramaje neto, unidades por empaque, porción declarada, porciones por envase). |
| **Formulation** | **IMPLEMENTADO en SPEC-003** (11 sep 2026) | **SÍ** | Receta base 1:1 con Product (OQ-002). |
| **FormulationVersion** | **IMPLEMENTADO en SPEC-003** (11 sep 2026) | **SÍ** | Versión inmutable (v1, v2) con workflow DRAFT→IN_REVIEW→APPROVED→OBSOLETE. |
| **FormulationIngredient** | **IMPLEMENTADO en SPEC-003** (11 sep 2026) | **SÍ** | Ingrediente de una versión con porcentaje de participación. |
| **CostImport** | `CONFIRMED CONCEPT (Semana 5)` | Siguiente SPEC | Archivo mensual de costos cargado por Finanzas. |
| **TechnicalDocument** | `CONFIRMED CONCEPT (Semana 6)` | Siguiente SPEC | Ficha técnica y texto legal almacenados como snapshots inmutables. |

---

## 2. Definición Detallada de Entidades Conceptuales

### 2.1. Entidades Confirmadas (SPEC-001 Foundation)

#### User
- **Propósito:** Representa a los colaboradores autorizados para interactuar con la plataforma.
- **Atributos Clave:** `id`, `email`, `name`, `passwordHash`, `role`, `isActive`, `createdAt`, `updatedAt`.
- **Relaciones:** Tiene múltiples `Session`, participa como actor en múltiples `AuditEvent`.

#### Role
- **Propósito:** Perfil funcional que determina las capacidades de acceso.
- **Valores Confirmados:**
  - `ADMIN` (*Administración / Director Técnico / Finanzas*): Configuración, gestión de usuarios, auditoría, aprobación de versiones y aprobación de costos. En esta empresa, **el rol ADMIN representa tres funciones reales**: Director Técnico (libera versiones de formulación, ver P-06 del cliente), Finanzas (aprueba costos, ver P-14) y Administrador del sistema (gestión de usuarios y parámetros globales).
  - `R_AND_D` (*Investigación y Desarrollo*): Creación y edición de productos, presentaciones, ingredientes, perfiles nutricionales y versiones de formulación en estado DRAFT. **No aprueba.**
  - `QUALITY` (*Calidad*): Revisión y aprobación de versiones de formulación (IN_REVIEW → APPROVED).
  - `VIEWER` (*Consulta*): Solo lectura sobre catálogos, formulaciones aprobadas y reportes.
- **Open Question asociada:** Matriz granular de permisos (ver `docs/OPEN-QUESTIONS.md#OQ-011`).

#### Session
- **Propósito:** Gestión de sesión segura del lado del servidor.
- **Atributos Clave:** `id`, `userId`, `token`, `expiresAt`, `createdAt`.

#### AuditEvent
- **Propósito:** Bitácora inmutable de eventos de seguridad y de negocio.
- **Atributos Clave:** `id`, `actorId`, `actorEmail`, `action`, `entity`, `entityId`, `timestamp`, `metadata` (JSON estructurado sin secretos).

---

### 2.2. Entidades Provisionales (Diseño Conceptual para Semanas 2 a 6)

#### Ingredient & NutritionalProfile
```
[ Ingredient ] 1 ──── 1..* [ NutritionalProfile ] 1 ──── * [ NutrientValue ] * ──── 1 [ Nutrient ]
       │ (Código SIESA)
       ▼
[ CostImportItem ]
```
- **Ingredient:** Nombre comercial, nombre genérico, código de materia prima SIESA, alérgenos, estado.
- **NutritionalProfile:** Origen del dato (Banco de Alimentos, análisis de laboratorio del proveedor, literatura técnica), fecha de vigencia, base de referencia (ej. 100g).
- **Nutrient:** Clave única (ej. `SODIUM`, `FAT_SAT`, `SUGAR_ADDED`), unidad de medida (`g`, `mg`, `kcal`, `kJ`), obligatorio en tabla nutricional (booleano).
- **NutrientValue:** Valor numérico, método analítico o fuente.

#### Product, Formulation & Presentation
```
[ Product ] 1 ──── 1 [ Formulation ] 1 ──── * [ FormulationVersion ] 1 ──── * [ FormulationIngredient ]
     │                                                                                │
     ├──── * [ Presentation ]                                                         ▼
     │            │                                                            [ Ingredient ]
     │            ▼
     └──── * [ TechnicalDocument ]
```
- **Product:** Identificador único, nombre comercial, categoría de producto, descripción general.
- **Formulation:** Receta asociada al producto.
- **FormulationVersion:** Número secuencial de versión (`v1`, `v2`, ...), estado (Borrador, En Revisión, Aprobada, Obsoleta), base de cálculo (ej. 100 kg), rendimiento esperado de proceso.
- **FormulationIngredient:** Ingrediente, porcentaje o peso en batch, factor de retención de humedad/grasa (si aplica).
- **Presentation:** Gramaje neto, unidades por empaque primario/secundario, porción declarada (g/ml), número de porciones por envase.

#### Regulatory & Compliance
- **RegulatoryParameter:** Resolución aplicable (ej. Res. 810/2021, Res. 2492/2022 de Colombia u otras), límites de nutrientes críticos para sellos de advertencia en alimentos sólidos y líquidos, tamaño tipográfico mínimo, leyendas de edulcorantes.

#### Costing & SIESA Mapping
- **CostImport:** Fecha de importación, periodo contable (Mes/Año), usuario responsable, nombre de archivo origen.
- **CostImportItem:** Código de materia prima SIESA, descripción contable, costo unitario por kg, moneda.

#### Technical Documentation
- **TechnicalDocument:** Tipo de documento (Ficha Técnica, Texto Legal, Tabla Nutricional), versión, producto/presentación asociada, contenido JSON estructurado, fecha de emisión.

---

## 3. Decisiones de No Implementación Prematura

Para evitar el acoplamiento y la deuda técnica antes del Kick-Off:
1. **NO se crean tablas en Prisma para entidades provisionales en SPEC-001.**
2. La definición de claves foráneas y tipos de datos numéricos (ej. `Decimal` vs `Float` para precisiones de microgramos) se realizará con las muestras reales de datos de la Semana 2.
3. Las reglas de transición de estados de `FormulationVersion` se formalizarán en la SPEC-003.
