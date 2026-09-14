# SPEC-003 — Productos, Formulaciones y Versionamiento

> **Semana 3** del cronograma firmado por Alimentos Sevilla S.A.S.
> **Estado:** `cierre técnico validado — aceptación funcional pendiente de OQ-021` (base `main` @ `854ae47`).
> **Implementado por:** Hermes (sin agente remoto — credentials codex/claude caen por gateway omniroute).
> **Fecha de cierre:** pendiente al pasar todos los quality gates.

---

## 1. Resumen

Implementar el maestro de **productos terminados**, sus **presentaciones comerciales** (gramaje/porciones), las **formulaciones** (1:1 con producto según OQ-002) y el **versionamiento inmutable** de cada formulación con workflow de estados (DRAFT → IN_REVIEW → APPROVED → OBSOLETE). Auditoría transversal.

Fuera de alcance (explícito): cálculo nutricional automático, sellos, redondeos, costos, normativa, documentos técnicos, importación SIESA.

## 2. OQ que gobiernan la SPEC

- **OQ-002:** 1 Producto → 1 Formulación → N Presentaciones (lo que cambia por presentación es gramaje neto, unidades por empaque, porción declarada, porciones por envase).
- **OQ-003:** se crea versión nueva cuando cambian MP o porcentajes. Versiones inmutables (v1, v2, v3, …).
- **OQ-004:** el Director de I+D/Técnico libera y aprueba cada cambio dejando trazabilidad.
- **OQ-005:** aprueban Director / Calidad con perfil de aprobación.
- **OQ-011 (abierta):** matriz granular de permisos → usar baseline (ADMIN/R_AND_D escriben, QUALITY/VIEWER solo lectura) y dejar TODO.
- **OQ-013 (abierta):** tolerancia de cierre de % en una versión de formulación → tratada como **warning**, no error, hasta confirmación del cliente.
- **OQ-014 (abierta):** el cliente usa dos códigos para la misma MP (`MPPS150` operativo vs `1210005` contable) → decisión pendiente Lina. No bloquea esta SPEC.

## 3. Cambios al modelo de dominio

### 3.1 Relajación previa (`spec_002p1_ingredient_relax`)

Antes de crear las nuevas tablas, dos cambios pequeños al modelo de ingredientes para absorber los datos reales del cliente:

- `Ingredient.siesaCode`: la validación `^(11|12|13)\d{5}$` se reemplaza por `^[A-Z0-9]{6,8}$` (cubre `MPCC010`, `MPII311`, `1210005`, `2903003`, etc.). El helper `getSiesaPrefix` pasa a devolver `code.slice(0, 2)` sin asumir `11|12|13`. `categorizeBySiesaCode` se actualiza con un mapa explícito de prefijos del cliente.
- `IngredientCategory` se amplía a 10 valores reales del cliente: `MPC`, `MPNC`, `PROTEINA`, `AGUA`, `CONDIMENTO_ESPECIA`, `CONSERVANTE`, `REGULADOR_ACIDEZ`, `SABORIZANTE`, `COLORANTE`, `MPC_PROTEINA`. Los 12 registros demo se recategorizan al bucket más cercano en la migración.

Los nombres de los enums en PostgreSQL se preservan como `IngredientCategory_category_key` mediante `ALTER TYPE` para no romper columnas.

### 3.2 Nuevos modelos (`spec_003_products`)

```prisma
enum ProductCategory {
  SALCHICHA
  CHORIZO
  JAMON
  MORTADELA
  TOCINETA
  PERRO_CALIENTE
  OTRO
}

enum FormulationVersionStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  OBSOLETE
}

model Product {
  id          String   @id @default(cuid())
  codigoInterno String @unique           // slug único legible
  nombreComercial String                 // "Salchicha Desayuno Premium"
  categoriaProducto ProductCategory
  descripcion String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id], onDelete: SetNull)
  presentations   Presentation[]
  formulations    Formulation[]
  formulationIngredients FormulationIngredient[]

  @@index([categoriaProducto])
  @@index([isActive])
  @@map("products")
}

model Presentation {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  gramajeNeto     Decimal  @db.Decimal(12, 3) // g
  unidadesPorEmpaque Int?                    // ej. 14 unidades por empaque primario
  porcionDeclarada   Decimal? @db.Decimal(12, 3) // g, ej. 1 unidad = 34 g
  porcionPorEnvase   Decimal? @db.Decimal(12, 4) // ej. 14 para 480 g, 2.5 para 115 g
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([productId])
  @@index([isActive])
  @@map("presentations")
}

model Formulation {
  id          String   @id @default(cuid())
  productId   String   @unique             // 1:1 con Product (OQ-002)
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  baseCalculo Decimal  @default(100) @db.Decimal(12, 4) // kg, base por defecto
  // rendimientoEsperado a nivel de Formulation: merma/rendimiento del **proceso** asociado
  // a la receta, según confirmación del cliente (P-03): "kg que entran - kg que salen".
  // Decimal entre 0 y 1 (ej. 0.11 = 11 % de merma).
  // Se replica en FormulationVersion para que cambios de proceso queden versionados.
  rendimientoEsperado Decimal? @db.Decimal(6, 4)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    FormulationVersion[]

  @@index([productId])
  @@map("formulations")
}

model FormulationVersion {
  id              String   @id @default(cuid())
  formulationId   String
  formulation     Formulation @relation(fields: [formulationId], references: [id], onDelete: Cascade)
  numeroSecuencial Int                          // 1, 2, 3 ...
  estado          FormulationVersionStatus @default(DRAFT)
  // Override del rendimiento del proceso para esta versión específica.
  // Si cambia el proceso (ej. cambia el horno, cambia la línea), se crea v2 con
  // el nuevo rendimientoEsperado — un cambio de proceso es cambio de versión (P-05).
  rendimientoEsperado Decimal? @db.Decimal(6, 4)
  validFrom       DateTime?                       // fecha desde la que está vigente (si APPROVED)
  aprobadaPorId   String?
  aprobadaPor     User?    @relation(fields: [aprobadaPorId], references: [id], onDelete: SetNull)
  aprobadaEn      DateTime?
  auditTrailId    String?                        // FK al AuditEvent que la aprobó
  auditTrail      AuditEvent? @relation(fields: [auditTrailId], references: [id], onDelete: SetNull)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  ingredients     FormulationIngredient[]

  @@unique([formulationId, numeroSecuencial])
  @@index([estado])
  @@index([formulationId])
  @@map("formulation_versions")
}

model FormulationIngredient {
  id                   String   @id @default(cuid())
  formulationVersionId String
  formulationVersion   FormulationVersion @relation(fields: [formulationVersionId], references: [id], onDelete: Cascade)
  ingredientId         String
  ingredient           Ingredient @relation(fields: [ingredientId], references: [id])
  porcentajeParticipacion Decimal @db.Decimal(7, 4) // 0.0000 a 100.0000
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([formulationVersionId, ingredientId])
  @@index([ingredientId])
  @@map("formulation_ingredients")
}
```

Se agregan back-relations en `User` (auditEvents ya está; falta `products`, `formulationVersionsAprobadas`) y en `AuditEvent` (`formulationVersions`).

## 4. Permisos (baseline hasta OQ-011)

| Acción | ADMIN | R_AND_D | QUALITY | VIEWER |
|---|:-:|:-:|:-:|:-:|
| Listar/buscar productos | ✅ | ✅ | ✅ | ✅ |
| Crear/editar producto | ✅ | ✅ | ❌ | ❌ |
| Desactivar producto | ✅ | ✅ | ❌ | ❌ |
| CRUD presentaciones | ✅ | ✅ | ❌ | ❌ |
| Crear versión DRAFT | ✅ | ✅ | ❌ | ❌ |
| Editar versión DRAFT | ✅ | ✅ | ❌ | ❌ |
| Pasar DRAFT → IN_REVIEW | ✅ | ✅ | ❌ | ❌ |
| Pasar IN_REVIEW → APPROVED | ✅ | ❌ | ✅ | ❌ |
| Pasar IN_REVIEW → DRAFT | ✅ temporalmente (OQ-021) | ❌ | ❌ | ❌ |
| Pasar APPROVED → OBSOLETE | ✅ | ✅ | ❌ | ❌ |
| Modificar versión APPROVED | ❌ | ❌ | ❌ | ❌ (defensa en 2 capas: API + service) |
| Eliminar cualquier versión | ❌ | ❌ | ❌ | ❌ |

## 5. Reglas de transición de estado

| Desde | A | Quién puede | Guarda |
|---|---|---|---|
| ∅ | DRAFT | R_AND_D, ADMIN | `createdAt` |
| DRAFT | IN_REVIEW | R_AND_D, ADMIN | `submittedAt` (en metadata) |
| IN_REVIEW | APPROVED | QUALITY, ADMIN | `aprobadaPorId`, `aprobadaEn`, `auditTrailId` |
| IN_REVIEW | DRAFT | ADMIN temporalmente (OQ-021) | rechaza revisión, vuelve a edición |
| APPROVED | OBSOLETE | R_AND_D, ADMIN | ya no es la vigente |
| OBSOLETE | (terminal) | — | — |

`FormulationVersion` con `estado = APPROVED` rechaza toda mutación de sus campos y de sus `FormulationIngredient` (defensa a nivel service; la DB no impide UPDATE sin trigger).

## 6. Server Actions / API

| Action | Permisos | Descripción |
|---|---|---|
| `listProducts(filter)` | todos | Lista con paginación, búsqueda, filtro por categoría y estado |
| `getProduct(id)` | todos | Detalle con presentaciones y formulación |
| `createProduct(input)` | R_AND_D, ADMIN | Crea producto (sin formulación todavía) |
| `updateProduct(id, input)` | R_AND_D, ADMIN | Edita nombre, categoría, descripción |
| `deactivateProduct(id)` | R_AND_D, ADMIN | Soft delete (`isActive=false`) |
| `createPresentation(productId, input)` | R_AND_D, ADMIN | |
| `updatePresentation(id, input)` | R_AND_D, ADMIN | |
| `deactivatePresentation(id)` | R_AND_D, ADMIN | |
| `getOrCreateFormulation(productId)` | R_AND_D, ADMIN | Crea 1:1 si no existe |
| `createDraftVersion(formulationId)` | R_AND_D, ADMIN | Crea v_n+1 en DRAFT |
| `updateDraftVersion(id, input)` | R_AND_D, ADMIN | Solo si estado=DRAFT |
| `addIngredientToVersion(versionId, ingredientId, porcentaje)` | R_AND_D, ADMIN | Solo si estado=DRAFT |
| `updateIngredientPercentage(versionId, ingredientId, porcentaje)` | R_AND_D, ADMIN | Solo si estado=DRAFT |
| `removeIngredientFromVersion(versionId, ingredientId)` | R_AND_D, ADMIN | Solo si estado=DRAFT |
| `submitForReview(id)` | R_AND_D, ADMIN | DRAFT → IN_REVIEW |
| `approveVersion(id)` | QUALITY, ADMIN | IN_REVIEW → APPROVED |
| `rejectToDraft(id, motivo)` | ADMIN temporalmente (OQ-021) | IN_REVIEW → DRAFT |
| `obsoleteVersion(id)` | R_AND_D, ADMIN | APPROVED → OBSOLETE |

Cada action llama `recordAuditEvent` con la metadata correspondiente (sin secretos).

## 7. UI

- `/productos` — tabla con búsqueda + filtro por categoría + estado; botón "Nuevo producto".
- `/productos/[id]` — detalle con presentaciones, formulación y su historial de versiones.
- `/productos/[id]/presentaciones/nueva` — formulario.
- `/formulaciones` — índice cruzado producto ↔ formulación ↔ versión vigente.
- `/formulaciones/[id]/v[nueva]` — formulario de edición con ingredientes (drag-and-drop o tabla con autocomplete). Validación visual de suma 100 % como **warning**.
- `/auditoria` — sin cambios, ya muestra `recordAuditEvent` para `entity=Product`, `entity=Formulation`, `entity=FormulationVersion`.

Mantengo el `ModulePlaceholder` en `/productos` solo mientras no haya productos, pero **lo retiro** desde la primera carga demo: la pantalla debe mostrar la tabla real con datos.

## 8. Auditoría

Eventos que se registran:

- `product.create`, `product.update`, `product.deactivate`
- `presentation.create`, `presentation.update`, `presentation.deactivate`
- `formulation.upsert` (cuando se crea por primera vez desde `getOrCreateFormulation`)
- `formulation_version.create`, `formulation_version.update`, `formulation_version.submit`, `formulation_version.approve`, `formulation_version.reject`, `formulation_version.obsolete`
- `formulation_ingredient.add`, `formulation_ingredient.update`, `formulation_ingredient.remove`

Sanitización aplicada (módulo `src/lib/audit/audit-service.ts` ya lo hace).

## 9. Validación requerida

| Gate | Comando | Esperado |
|---|---|---|
| Install | `pnpm install` | sin warnings críticos |
| Generate | `pnpm db:generate` | cliente Prisma regenerado |
| Lint | `pnpm lint` | 0 errores, 0 warnings nuevos |
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | 39 anteriores + nuevos, todos verdes |
| Build | `pnpm build` | exit 0, sin rutas rotas |
| Deploy DB | `pnpm db:deploy` | aplica `spec_002p1_ingredient_relax` + `spec_003_products` limpias |
| Verificación manual | login admin/calidad/consulta, crear producto+presentación+v1, intentar editar APPROVED (debe rechazar) | logs y respuestas literales |

## 10. No hacer

- No cálculo nutricional, sellos, redondeos, normativa.
- No crear tablas de costos, importación SIESA, documentos técnicos.
- No aprobar OQ-011 (permisos granulares).
- No modificar el seed de Better Auth ni los 4 usuarios demo.
- No cambiar `main` directamente.
- No usar `db push` — solo migraciones versionadas.
- No desplegar, hacer push remoto ni contactar al cliente.
- No ejecutar la carga inicial de los 90 ingredientes BIN / 106 productos Junio / 1 formulación CTN v11 — queda como **SPEC-003.5** pendiente de Lina.
- No reintroducir el badge de etapa fijo en el header.

## 11. Entregables

- `docs/specs/SPEC-003-products-formulations.md` (este archivo).
- `prisma/migrations/<ts>_spec_002p1_ingredient_relax/` (SQL).
- `prisma/migrations/<ts>_spec_003_products/` (SQL).
- `src/lib/validations/ingredients.ts` (relajación).
- `src/lib/validations/products.ts` (nuevo).
- `src/lib/validations/formulations.ts` (nuevo).
- `src/app/actions/product-actions.ts` (nuevo).
- `src/app/actions/formulation-actions.ts` (nuevo).
- `src/app/(app)/productos/page.tsx` (reemplaza placeholder).
- `src/app/(app)/formulaciones/page.tsx` (reemplaza placeholder).
- `src/components/products/`, `src/components/formulations/` (nuevo).
- `tests/unit/products-validation.test.ts`, `tests/unit/formulations-validation.test.ts`, `tests/integration/formulation-workflow.test.ts`.
- `docs/DOMAIN.md` actualizado (Product/Formulation/FormulationVersion/FormulationIngredient/Presentation → IMPLEMENTADO en SPEC-003).
- `docs/OPEN-QUESTIONS.md` actualizado (OQ-013, OQ-014 añadidas).

## 12. Cierre técnico y pendiente de aceptación

- El código, las migraciones, las validaciones y las pruebas de SPEC-003 están preparados para aceptación.
- La autorización para `IN_REVIEW → DRAFT` se limita a `ADMIN` mientras el cliente resuelve OQ-021; no se concede esa capacidad a `QUALITY` ni `R_AND_D` por inferencia.
- `pnpm db:deploy` validó que no hay migraciones pendientes en PostgreSQL local. El registro histórico de la migración fallida y revertida (`20260911042442_spec_002p1_ingredient_relax`) se conserva solo como antecedente de diagnóstico; no fue modificado.
