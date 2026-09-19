/**
 * scripts/normalize-demo.ts
 *
 * Deja el demo en un estado conocido y presentable:
 * - Salchicha v1 → APPROVED (con 18 ingredientes)
 * - Salchicha v2 → DRAFT (vacía)
 * - Tocineta v1 → APPROVED (con 19 ingredientes)
 * - Carga perfiles para ingredientes que aún no tengan.
 *
 * Idempotente: corre varias veces, mismo resultado.
 */
import { PrismaClient, FormulationVersionStatus, NutrientSource } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const admin = await db.user.findFirst();
  if (!admin) throw new Error("No hay admin");

  console.log("🔧 Normalizando aprobaciones y perfiles para la demo...\n");

  // 1. Revertir Salchicha v2 (vacía) si está APPROVED
  const v2 = await db.formulationVersion.findFirst({
    where: { formulation: { product: { codigoInterno: "salchicha-desayuno-premium-480" } }, numeroSecuencial: 2 },
  });
  if (v2?.estado === FormulationVersionStatus.APPROVED) {
    await db.formulationVersion.update({
      where: { id: v2.id },
      data: { estado: FormulationVersionStatus.DRAFT, aprobadaPorId: null, aprobadaEn: null, auditTrailId: null },
    });
    console.log(`  ↻ Salchicha v2: APPROVED → DRAFT (estaba vacía)`);
  }

  // 2. Aprobar Salchicha v1 si está DRAFT
  const v1 = await db.formulationVersion.findFirst({
    where: { formulation: { product: { codigoInterno: "salchicha-desayuno-premium-480" } }, numeroSecuencial: 1 },
  });
  if (v1 && v1.estado !== FormulationVersionStatus.APPROVED) {
    await db.formulationVersion.update({
      where: { id: v1.id },
      data: { estado: FormulationVersionStatus.IN_REVIEW },
    });
    const audit = await db.auditEvent.create({
      data: {
        actorId: admin.id, actorEmail: admin.email,
        action: "formulation_version.approve",
        entity: "FormulationVersion", entityId: v1.id,
        metadata: { numeroSecuencial: 1, source: "normalize-demo" },
      },
    });
    await db.formulationVersion.update({
      where: { id: v1.id },
      data: {
        estado: FormulationVersionStatus.APPROVED,
        aprobadaPorId: admin.id,
        aprobadaEn: new Date(),
        auditTrailId: audit.id,
        validFrom: new Date(),
      },
    });
    console.log(`  ✓ Salchicha v1: DRAFT → APPROVED (18 ingredientes)`);
  }

  // 3. Cargar perfiles faltantes para ingredientes de Salchicha v1
  const nutrients = await db.nutrient.findMany({ where: { isRequiredOnLabel: true } });
  const ingredientsV1 = await db.formulationIngredient.findMany({
    where: { formulationVersionId: v1!.id },
    include: { ingredient: { include: { profiles: { where: { isActive: true } } } } },
  });

  const baseValues: Record<string, number> = {
    ENERGY_KCAL: 250, ENERGY_KJ: 1046, FAT_TOTAL: 18, FAT_SAT: 7, FAT_TRANS: 0.3,
    CARBS_TOTAL: 4, SUGAR_TOTAL: 1, SUGAR_ADDED: 0.5, FIBER: 0.5, PROTEIN: 14, SODIUM: 720,
  };
  let creados = 0;
  for (const fi of ingredientsV1) {
    if (fi.ingredient.profiles.length > 0) continue;
    const profile = await db.nutritionalProfile.create({
      data: {
        ingredientId: fi.ingredientId,
        source: NutrientSource.BANCO_ALIMENTOS,
        isActive: true,
        referenceBase: "100g",
        sourceDetail: "Perfil demo cargado por scripts/normalize-demo.ts",
        createdById: admin.id,
      },
    });
    for (const nut of nutrients) {
      const v = baseValues[nut.key];
      if (v === undefined) continue;
      await db.nutrientValue.create({
        data: { profileId: profile.id, nutrientId: nut.id, value: v },
      });
    }
    creados++;
  }
  console.log(`  ✓ ${creados} perfiles nuevos cargados para Salchicha v1`);

  // 4. Cargar perfiles faltantes para ingredientes de Tocineta v1
  const tociV1 = await db.formulationVersion.findFirst({
    where: { formulation: { product: { codigoInterno: "tocineta-faizan-1000" } }, numeroSecuencial: 1 },
  });
  if (tociV1) {
    const ingsToci = await db.formulationIngredient.findMany({
      where: { formulationVersionId: tociV1.id },
      include: { ingredient: { include: { profiles: { where: { isActive: true } } } } },
    });
    let t = 0;
    for (const fi of ingsToci) {
      if (fi.ingredient.profiles.length > 0) continue;
      const profile = await db.nutritionalProfile.create({
        data: {
          ingredientId: fi.ingredientId,
          source: NutrientSource.BANCO_ALIMENTOS,
          isActive: true,
          referenceBase: "100g",
          sourceDetail: "Perfil demo cargado por scripts/normalize-demo.ts",
          createdById: admin.id,
        },
      });
      for (const nut of nutrients) {
        const v = baseValues[nut.key];
        if (v === undefined) continue;
        await db.nutrientValue.create({
          data: { profileId: profile.id, nutrientId: nut.id, value: v },
        });
      }
      t++;
    }
    console.log(`  ✓ ${t} perfiles nuevos cargados para Tocineta v1`);
  }

  // 5. Resumen
  const ap = await db.formulationVersion.findMany({
    where: { estado: "APPROVED" },
    include: {
      formulation: { include: { product: true } },
      ingredients: { include: { ingredient: { include: { profiles: { where: { isActive: true } } } } } },
    },
  });
  console.log("\n📊 Estado final de versiones aprobadas:");
  for (const v of ap) {
    const ready = v.ingredients.filter(fi => fi.ingredient.profiles.length > 0).length;
    console.log(`  • ${v.formulation.product.nombreComercial} v${v.numeroSecuencial}: ${ready}/${v.ingredients.length} con perfil`);
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
