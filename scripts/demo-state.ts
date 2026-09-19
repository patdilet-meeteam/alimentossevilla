import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  console.log("════════════ ESTADO PARA LA DEMO ════════════\n");

  console.log("📦 /costos");
  const ci = await db.costImport.findMany({
    include: {
      items: { where: { status: { in: ["INVALID", "DUPLICATE_CONFLICT"] } }, take: 3 },
    },
  });
  for (const c of ci) {
    console.log(`  ✓ ${c.sourceFileName}`);
    console.log(`    Periodo: ${c.periodStart.toISOString().slice(0,7)} · Estado: ${c.status}`);
    console.log(`    ${c.rowCount} filas (${c.validItemCount} válidas, ${c.warningCount} advertencias)`);
  }
  const formulas = await db.formulation.findMany({
    where: { versions: { some: { estado: "APPROVED" } } },
    include: { product: { select: { nombreComercial: true } } },
  });
  console.log(`  Formulaciones aprobadas que verán costo: ${formulas.length}`);
  formulas.forEach(f => console.log(`    · ${f.product.nombreComercial}`));

  console.log("\n🧮 /normativa (preparación nutricional)");
  const ap = await db.formulationVersion.findMany({
    where: { estado: "APPROVED" },
    include: {
      formulation: { include: { product: true } },
      ingredients: { include: { ingredient: { include: { profiles: { where: { isActive: true } } } } } },
    },
  });
  for (const v of ap) {
    const ready = v.ingredients.filter(fi => fi.ingredient.profiles.length > 0).length;
    console.log(`  ✓ ${v.formulation.product.nombreComercial} v${v.numeroSecuencial}`);
    console.log(`    ${v.ingredients.length} ingredientes · ${ready} con perfil activo · ${v.ingredients.length - ready} sin perfil`);
  }

  console.log("\n📄 /documentos (previsualización no emitida)");
  for (const v of ap) {
    const presentations = await db.presentation.count({ where: { productId: v.formulation.productId, isActive: true } });
    const allergens = new Set<string>();
    for (const fi of v.ingredients) {
      for (const tag of fi.ingredient.allergenTags || []) allergens.add(tag);
    }
    console.log(`  ✓ ${v.formulation.product.nombreComercial} v${v.numeroSecuencial}`);
    console.log(`    ${v.ingredients.length} ingredientes ordenados por % · ${presentations} presentaciones · ${allergens.size} alérgenos`);
  }

  console.log("\n══════════════════════════════════════════════");
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
