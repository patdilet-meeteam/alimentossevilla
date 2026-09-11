# SPEC-002 — Catálogo de Ingredientes y Perfiles Nutricionales

| Metadato | Detalle |
|---|---|
| **Código** | SPEC-002 |
| **Título** | Catálogo de Ingredientes y Perfiles Nutricionales |
| **Fase / Semana** | Semana 2 — Levantamiento & Catálogo |
| **Estado** | ✅ COMPLETADO |
| **Responsable** | Principal Software Engineer |
| **Dependencias** | SPEC-001 (Platform Foundation) |

---

## 1. Resumen Ejecutivo y Objetivo

El objetivo de **SPEC-002** es implementar el módulo de gestión del catálogo de ingredientes y perfiles nutricionales de la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.**

Esta especificación establece la estructura de datos para materias primas con código SIESA (prefijos 11, 12, 13), perfiles nutricionales por 100g con fuentes verificables, y la interfaz de usuario para administración del catálogo.

---

## 2. Alcance (In Scope)

### 2.1 Modelado de Datos

1. **Enumeraciones:**
   - `IngredientCategory`: `CARNE`, `MATERIA_SECA`, `EMPAQUE`, `ADITIVO`, `OTRO`
   - `NutrientSource`: `BANCO_ALIMENTOS`, `LAB_PROVEEDOR`, `LITERATURA`
   - `NutrientUnit`: `G`, `MG`, `MCG`, `KCAL`, `KJ`

2. **Modelos:**
   - `Ingredient`: Maestro de materias primas con código SIESA único, nombre, categoría, alérgenos y estado.
   - `NutritionalProfile`: Perfil nutricional por ingrediente (vigente/histórico), fuente del dato, base de referencia (100g).
   - `Nutrient`: Catálogo de nutrientes (energía, proteínas, grasas, carbohidratos, etc.) sembrado en BD.
   - `NutrientValue`: Valor numérico de un nutriente en un perfil específico.

### 2.2 Funcionalidades de Negocio

3. **Administración de Ingredientes:**
   - Crear, editar, desactivar ingredientes.
   - Búsqueda por nombre y filtro por prefijo SIESA (11*, 12*, 13*).
   - Asociación con código SIESA único por categoría.

4. **Gestión de Perfiles Nutricionales:**
   - Crear nuevo perfil nutricional para un ingrediente.
   - Al crear perfil nuevo, el anterior se vuelve histórico (no se elimina).
   - Solo un perfil activo por ingrediente a la vez.
   - Indicador de fuente del perfil.

5. **Autorización:**
   - ADMIN y R_AND_D pueden escribir.
   - QUALITY y VIEWER son solo lectura.
   - Baseline de OQ-011 (matriz granular pendiente).

### 2.3 Interfaz de Usuario

6. **UI /ingredientes:**
   - Tabla con paginación, búsqueda, badges por categoría SIESA.
   - Formulario de creación/edición con validación Zod.
   - Vista de detalle con perfil nutricional vigente.
   - Indicador visual de fuente del perfil.

### 2.4 Infraestructura

7. **Auditoría:**
   - CREATE, UPDATE, DEACTIVATE de ingrediente registrados en AuditEvent.
   - Sanitización automática de datos sensibles.

8. **Seed:
   - Catálogo de Nutrient sembrado con nutrientes obligatorios según normativa.

---

## 3. Fuera de Alcance (Out of Scope para SPEC-002)

- ❌ Cálculo nutricional, fórmulas de rendimiento o sellos de advertencia (SPEC-004).
- ❌ Tablas de productos, formulaciones, presentaciones, costos (Semana 3+).
- ❌ Integración con SIESA por API.
- ❌ Importación de Excel de costos.
- ❌ Matriz granular de permisos (OQ-011 ABIERTA — usar baseline).

---

## 4. Modelo Físico Prisma

```prisma
enum IngredientCategory {
  CARNE
  MATERIA_SECA
  EMPAQUE
  ADITIVO
  OTRO
}

enum NutrientSource {
  BANCO_ALIMENTOS
  LAB_PROVEEDOR
  LITERATURA
}

enum NutrientUnit {
  G
  MG
  MCG
  KCAL
  KJ
}

model Ingredient {
  id            String             @id @default(cuid())
  name          String
  genericName   String?
  siesaCode     String            @unique
  category      IngredientCategory
  isAllergen    Boolean           @default(false)
  allergenTags  String[]
  isActive      Boolean           @default(true)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  createdById   String?
  createdBy     User?             @relation(fields: [createdById], references: [id], onDelete: SetNull)
  profiles      NutritionalProfile[]

  @@index([siesaCode])
  @@index([category])
  @@index([isActive])
  @@map("ingredients")
}

model NutritionalProfile {
  id            String           @id @default(cuid())
  ingredientId  String
  ingredient    Ingredient       @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  source        NutrientSource
  sourceDetail  String?
  validFrom     DateTime         @default(now())
  referenceBase String          @default("100g")
  isActive      Boolean          @default(true)
  createdAt     DateTime         @default(now())
  createdById   String?
  createdBy     User?            @relation(fields: [createdById], references: [id], onDelete: SetNull)
  values        NutrientValue[]

  @@index([ingredientId])
  @@index([isActive])
  @@map("nutritional_profiles")
}

model Nutrient {
  id              String        @id @default(cuid())
  key             String       @unique // SODIUM, FAT_TOTAL, PROTEIN, etc.
  unit            NutrientUnit
  displayName     String
  isRequiredOnLabel Boolean    @default(false)
  createdAt       DateTime     @default(now())
  values          NutrientValue[]

  @@index([key])
  @@map("nutrients")
}

model NutrientValue {
  id           String            @id @default(cuid())
  profileId    String
  profile      NutritionalProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  nutrientId   String
  nutrient     Nutrient          @relation(fields: [nutrientId], references: [id], onDelete: Cascade)
  value        Decimal           @db.Decimal(12, 4)
  method       String?

  @@unique([profileId, nutrientId])
  @@index([nutrientId])
  @@map("nutrient_values")
}
```

---

## 5. Criterios de Aceptación (Acceptance Criteria)

| ID | Criterio | Método de Verificación |
|---|---|---|
| **AC-01** | La aplicación compila sin errores con `pnpm build` y `pnpm typecheck` ejecuta con cero errores. | Ejecución local |
| **AC-02** | `pnpm lint` ejecuta con cero advertencias o errores. | Ejecución local |
| **AC-03** | `pnpm test` pasa todos los tests existentes (24) más los nuevos de SPEC-002. | Ejecución local |
| **AC-04** | Migración Prisma aplicada correctamente en base de datos PostgreSQL local. | `pnpm db:deploy` |
| **AC-05** | Catálogo de Nutrient sembrado con los 12 nutrientes obligatorios. | Query a BD |
| **AC-06** | Crear ingrediente con código SIESA único, categoría y alérgenos. | UI + Query BD |
| **AC-07** | Crear perfil nutricional con valores para 3 nutrientes. | UI + Query BD |
| **AC-08** | Al crear nuevo perfil, el anterior queda inactivo (isActive=false). | Query BD |
| **AC-09** | Solo ADMIN y R_AND_D pueden crear/editar ingredientes. VIEWER recibe 403. | UI + API |
| **AC-10** | Los eventos de auditoría se registran en AuditEvent con datos sanitizados. | Query BD |
| **AC-11** | Búsqueda por nombre y filtro por prefijo SIESA funcionan correctamente. | UI + API |
| **AC-12** | La vista de detalle muestra el perfil nutricional vigente y su fuente. | UI |

---

## 6. Plan de Migraciones

1. **001_spec_002_ingredients**: Crear tablas Ingredient, NutritionalProfile, Nutrient, NutrientValue.
2. **002_spec_002_seed_nutrients**: Sembrar catálogo de nutrientes obligatorios.

---

## 7. Plan de Tests

### Unitarios
- Validación Zod de Ingredient y NutritionalProfile.
- Normalización de código SIESA (trim, mayúsculas, prefijo 11/12/13).
- Lógica de transición de perfil activo.

### Integración
- Crear ingrediente y verificar en BD.
- Asignar perfil nutricional y verificar relación.
- Intentar escribir como VIEWER (rechazado).
- Verificar auditoría con sanitización.

---

## 8. Open Questions Relacionadas

- **OQ-011**: Matriz granular de permisos — usar baseline (ADMIN/R_AND_D=write) y marcar TODO para Semana 6.
- **OQ-019**: Catálogo definitivo de nutrientes — documentar si hay campos faltantes del Excel.

---

## 9. Matriz de Verificación

| Entregable | Estado | Evidencia |
|---|---|---|
| SPEC-002 redactada | ✅ | docs/specs/SPEC-002-ingredients-catalog.md |
| Migraciones aplicadas | ✅ | prisma/migrations/20260911022228_spec_002_ingredients/ |
| Schema Prisma actualizado | ✅ | prisma/schema.prisma (4 modelos nuevos) |
| Server Actions implementadas | ✅ | src/app/actions/ingredient-actions.ts |
| UI /ingredientes funcional | ✅ | src/app/(app)/ingredientes/ (3 rutas) |
| Tests nuevos pasando | ✅ | 39/39 (15 nuevos en ingredients-validation) |
| Quality gates verdes | ✅ | build, typecheck, test — sin errores |
| DOMAIN.md actualizado | ✅ | docs/DOMAIN.md |
| Commit en spec-002-ingredients | ✅ | `f794d25 feat(spec-002): implement ingredients catalog and nutritional profiles` |
