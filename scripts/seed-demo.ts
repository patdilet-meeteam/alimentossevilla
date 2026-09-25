/**
 * scripts/seed-demo.ts
 *
 * Carga datos demo para que las pantallas de /costos, /normativa y /documentos
 * muestren contenido en la reunión de avance.
 *
 * - Importa "Junio costos Base de Datos ME - MPNC - MPC.xlsx" como DRAFT
 * - Aplica esa importación (DRAFT -> APPLIED) para mostrar costo directo
 * - Aprueba 2 formulaciones (Salchicha Desayuno Premium v2 y Tocineta Faizan v1)
 *   con audit events respetando el workflow DRAFT -> IN_REVIEW -> APPROVED
 * - Crea 2 perfiles nutricionales (BANCO_ALIMENTOS) sobre ingredientes de la
 *   formulación aprobada para que /normativa muestre "Listo para validación"
 *
 * Idempotente: si ya hay datos, los respeta. Ejecutar con: `npx tsx scripts/seed-demo.ts`
 */
import { PrismaClient, Role, FormulationVersionStatus, NutrientUnit, NutrientSource, CostImportStatus, CostImportItemStatus } from "@prisma/client";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
// Reutilizamos el parser real para no duplicar lógica
import { parseCostWorkbook } from "../src/lib/costs/cost-import-parser";

const db = new PrismaClient();

async function main() {
  console.log("🚀 Seed-demo: preparando datos para la reunión de avance\n");

  const admin = await db.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) {
    throw new Error("No hay usuario ADMIN. Corre primero `pnpm db:seed` (o el bootstrap).");
  }
  console.log(`✓ Admin: ${admin.email} (${admin.id})`);

  // ─────────────────────────────────────────────────────────────
  // 1. Importar archivo de costos de Junio
  // ─────────────────────────────────────────────────────────────
  const archivoJunio = "/Users/patmac/Downloads/Junio  costos Base de Datos ME - MPNC - MPC.xlsx";
  if (!fs.existsSync(archivoJunio)) {
    console.error(`✗ No se encontró el archivo: ${archivoJunio}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(archivoJunio);
  const sha = createHash("sha256").update(buffer).digest("hex");

  const existingImport = await db.costImport.findUnique({ where: { sourceFileHash: sha } });
  let costImport;
  if (existingImport) {
    console.log(`  ↻ Importación de costos ya existe: ${existingImport.sourceFileName} (${existingImport.status})`);
    costImport = existingImport;
  } else {
    console.log("→ Importando archivo de costos de Junio...");
    const parsed = await parseCostWorkbook(Buffer.from(buffer));
    const periodStart = new Date("2026-06-01T00:00:00.000Z");

    costImport = await db.$transaction(async (tx) => {
      const ci = await tx.costImport.create({
        data: {
          periodStart,
          sourceFileName: "Junio costos Base de Datos ME - MPNC - MPC.xlsx",
          sourceFileHash: sha,
          status: CostImportStatus.DRAFT,
          rowCount: parsed.rows.length,
          validItemCount: parsed.validItemCount,
          warningCount: parsed.warningCount,
          importedById: admin.id,
        },
      });

      const ingredients = await tx.ingredient.findMany({
        select: { id: true, name: true, genericName: true, siesaCode: true },
      });
      const byCode = new Map(ingredients.map(i => [i.siesaCode, i]));
      const resolvedByCode = new Map<string, { id: string; created: boolean }>();

      for (const row of parsed.rows) {
        let resolved = resolvedByCode.get(row.sourceCode);
        if (!resolved && !row.sourceCode.startsWith("INVALID-")) {
          const exact = byCode.get(row.sourceCode);
          if (exact) {
            resolved = { id: exact.id, created: false };
          } else {
            // Crear ingrediente nuevo
            const ing = await tx.ingredient.create({
              data: {
                name: row.description,
                siesaCode: row.sourceCode,
                category: "OTRO",
                pendingReview: true,
                createdById: admin.id,
              },
            });
            resolved = { id: ing.id, created: true };
          }
          resolvedByCode.set(row.sourceCode, resolved);
        }

        const status = !row.sourceCode.startsWith("INVALID-") &&
                       row.status === "VALID" && resolved
          ? CostImportItemStatus.MATCHED
          : CostImportItemStatus.INVALID;

        await tx.costImportItem.create({
          data: {
            costImportId: ci.id,
            sourceRow: row.sourceRow,
            sourceCode: row.sourceCode,
            description: row.description,
            unit: row.unit,
            unitCost: row.unitCost as any,
            status,
            issues: row.issues,
          },
        });
      }
      return ci;
    });
    console.log(`  ✓ Importación creada: ${costImport.sourceFileName}`);
    console.log(`    - ${costImport.rowCount} filas (${costImport.validItemCount} válidas)`);
  }

  // Aplicar la importación si está en DRAFT
  if (costImport.status === CostImportStatus.DRAFT) {
    console.log("→ Aplicando importación (DRAFT → APPLIED)...");
    await db.costImport.update({
      where: { id: costImport.id },
      data: {
        status: CostImportStatus.APPLIED,
        approvedById: admin.id,
        appliedAt: new Date(),
      },
    });
    await db.auditEvent.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "cost_import.apply",
        entity: "CostImport",
        entityId: costImport.id,
        metadata: { sourceFileName: costImport.sourceFileName },
      },
    });
    console.log(`  ✓ Importación aplicada: ${costImport.sourceFileName}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Aprobar 2 formulaciones
  // ─────────────────────────────────────────────────────────────
  const productosObjetivo = ["salchicha-desayuno-premium-480", "tocineta-faizan-1000"];
  const formulations = await db.formulation.findMany({
    where: { product: { codigoInterno: { in: productosObjetivo } } },
    include: {
      product: true,
      versions: { orderBy: { numeroSecuencial: "desc" }, take: 1 },
    },
  });

  for (const f of formulations) {
    const latestVersion = f.versions[0];
    if (!latestVersion) {
      console.log(`  ⚠ ${f.product.nombreComercial}: sin versiones`);
      continue;
    }
    if (latestVersion.estado === FormulationVersionStatus.APPROVED) {
      console.log(`  ↻ ${f.product.nombreComercial} v${latestVersion.numeroSecuencial}: ya aprobada`);
      continue;
    }

    // Pasar a IN_REVIEW si está en DRAFT
    if (latestVersion.estado === FormulationVersionStatus.DRAFT) {
      await db.formulationVersion.update({
        where: { id: latestVersion.id },
        data: { estado: FormulationVersionStatus.IN_REVIEW },
      });
      await db.auditEvent.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          action: "formulation_version.submit_for_review",
          entity: "FormulationVersion",
          entityId: latestVersion.id,
          metadata: { numeroSecuencial: latestVersion.numeroSecuencial, source: "seed-demo" },
        },
      });
    }

    // Aprobar
    const audit = await db.auditEvent.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "formulation_version.approve",
        entity: "FormulationVersion",
        entityId: latestVersion.id,
        metadata: { numeroSecuencial: latestVersion.numeroSecuencial, source: "seed-demo" },
      },
    });
    await db.formulationVersion.update({
      where: { id: latestVersion.id },
      data: {
        estado: FormulationVersionStatus.APPROVED,
        aprobadaPorId: admin.id,
        aprobadaEn: new Date(),
        auditTrailId: audit.id,
        validFrom: new Date(),
      },
    });
    console.log(`  ✓ ${f.product.nombreComercial} v${latestVersion.numeroSecuencial} → APPROVED`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Cargar perfiles nutricionales mock para ingredientes de la formulación aprobada
  // ─────────────────────────────────────────────────────────────
  console.log("\n→ Cargando perfiles nutricionales mock...");
  const approvedSalchicha = await db.formulation.findFirst({
    where: { product: { codigoInterno: "salchicha-desayuno-premium-480" } },
    include: {
      versions: { where: { estado: "APPROVED" }, include: { ingredients: { include: { ingredient: true } } } },
    },
  });

  const nutrients = await db.nutrient.findMany({ where: { isRequiredOnLabel: true } });
  console.log(`  → ${nutrients.length} nutrientes obligatorios definidos`);

  if (approvedSalchicha && approvedSalchicha.versions.length > 0) {
    const ingredients = approvedSalchicha.versions[0].ingredients.map(fi => fi.ingredient);
    for (const ing of ingredients) {
      // Verificar si ya tiene perfil activo
      const existing = await db.nutritionalProfile.findFirst({
        where: { ingredientId: ing.id, isActive: true },
      });
      if (existing) continue;

      // Crear perfil mock con valores plausibles para una salchicha
      const profile = await db.nutritionalProfile.create({
        data: {
          ingredientId: ing.id,
          source: NutrientSource.BANCO_ALIMENTOS,
          isActive: true,
          referenceBase: "100g",
          sourceDetail: "Banco de Alimentos — perfil demo cargado por scripts/seed-demo.ts",
          createdById: admin.id,
        },
      });

      // Valores mock plausibles por categoría del ingrediente
      const baseValues: Record<string, { value: number; unit: NutrientUnit }> = {
        ENERGY_KCAL:   { value: 250,  unit: NutrientUnit.KCAL },
        ENERGY_KJ:     { value: 1046, unit: NutrientUnit.KJ },
        FAT_TOTAL:     { value: 18,   unit: NutrientUnit.G },
        FAT_SAT:       { value: 7,    unit: NutrientUnit.G },
        FAT_TRANS:     { value: 0.3,  unit: NutrientUnit.G },
        CARBS_TOTAL:   { value: 4,    unit: NutrientUnit.G },
        SUGAR_TOTAL:   { value: 1,    unit: NutrientUnit.G },
        SUGAR_ADDED:   { value: 0.5,  unit: NutrientUnit.G },
        FIBER:         { value: 0.5,  unit: NutrientUnit.G },
        PROTEIN:       { value: 14,   unit: NutrientUnit.G },
        SODIUM:        { value: 720,  unit: NutrientUnit.MG },
      };

      for (const nut of nutrients) {
        const v = baseValues[nut.key];
        if (!v) continue;
        await db.nutrientValue.create({
          data: {
            profileId: profile.id,
            nutrientId: nut.id,
            value: v.value as any,
          },
        });
      }
      console.log(`  ✓ Perfil creado para: ${ing.name}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Resumen final
  // ─────────────────────────────────────────────────────────────
  console.log("\n📊 Estado final:");
  console.log(`  • Versiones aprobadas: ${await db.formulationVersion.count({ where: { estado: "APPROVED" } })}`);
  console.log(`  • Importaciones de costos aplicadas: ${await db.costImport.count({ where: { status: "APPLIED" } })}`);
  console.log(`  • Ingredientes con perfil activo: ${await db.nutritionalProfile.count({ where: { isActive: true } })}`);
  console.log("\n✅ Listo. Recargá el dashboard en el navegador para ver los datos.");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error("ERROR:", e);
    process.exit(1);
  });
