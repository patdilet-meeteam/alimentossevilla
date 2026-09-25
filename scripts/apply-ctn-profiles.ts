import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { parseCtnCsv } from "../src/lib/nutrition/ctn-import";
import { normalizeCostDescription as n } from "../src/lib/costs/cost-import-parser";
const db=new PrismaClient();
const a=Object.fromEntries([["COLOR NATURAL LINICOL","COLOR NATURAL ROJO AC150"],["HUMO CHARDEX EN POLVO","HUMO TRUSMOKE OIL EX"],["TOCINO CINTA","TOCINO NACIONAL"],["REPELE FAZÁN","REPELE CHARQUEADO"],["COLOR NATURAL NARANJA PR801 WD.","COLOR NATURAL NARANJA PR801WD"],["SAL REDUCIDA EN SODIO.","SAL REDUCIDA EN SODIO 60/40"],["MEZCLA DE FOSFATOS SUPRA MEAT F451","SUPRA MEAT F451"],["CEBOLLA EN POLVO B.1.","CEBOLLA EN POLVO"],["PIMIENTA NEGRA MOLIDA ESP. 0.9 MM.","PIMIENTA NEGRA MOLIDA"]].map(([x,y])=>[n(x),n(y)]));
async function main() {
 const user = await db.user.findUniqueOrThrow({ where: { email: "admin@alimentossevilla.com" } });
 const rows = parseCtnCsv(readFileSync("/Users/patmac/Downloads/CTN - Salchicha Desayuno Premium - v11.xlsx - CTN.csv", "utf8"));
 const ingredients = await db.ingredient.findMany({ where: { isActive: true } });
 const names = new Map(ingredients.flatMap((ingredient) => [ingredient.name, ingredient.genericName].filter(Boolean).map((name) => [n(name!), ingredient])));
 const resolved = rows.map((row) => ({ row, ingredient: names.get(a[n(row.sourceName)] ?? n(row.sourceName)) }));
 if (resolved.some(({ ingredient }) => !ingredient)) throw new Error("Ingrediente no resuelto");
 const unique = [...new Map(resolved.map(({ ingredient, row }) => [ingredient!.id, { ingredient: ingredient!, row }])).values()];
 const nutrients = new Map((await db.nutrient.findMany()).map((nutrient) => [nutrient.key, nutrient.id]));

 await db.$transaction(async (tx) => {
  for (const { ingredient, row } of unique) {
   await tx.nutritionalProfile.updateMany({ where: { ingredientId: ingredient.id, isActive: true }, data: { isActive: false } });
   await tx.nutritionalProfile.create({
    data: {
     ingredientId: ingredient.id,
     source: "BANCO_ALIMENTOS",
     sourceDetail: `CTN v11 fila ${row.sourceRow}`,
     createdById: user.id,
     values: { create: Object.entries(row.nutrientsPer100g).map(([key, value]) => ({ nutrientId: nutrients.get(key)!, value, method: "CTN v11" })) },
    },
   });
  }
  await tx.auditEvent.create({ data: { actorId: user.id, actorEmail: user.email, action: "nutritional_profile.ctn_pilot_import", entity: "NutritionalProfile", metadata: { sourceRows: rows.length, persistedIngredients: unique.length } } });
 });
 console.log(unique.length);
}
main().finally(() => db.$disconnect());
