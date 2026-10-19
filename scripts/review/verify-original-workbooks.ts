import { readFileSync, writeFileSync } from "node:fs";
import { parseNutritionalBankWorkbook } from "../../src/lib/nutrition/nutritional-bank-import";
import { parseCtnWorkbook } from "../../src/lib/nutrition/ctn-import";
import { calculateNutrition } from "../../src/lib/nutrition/nutrition-calculator";

const [bankPath, ctnPath, output] = process.argv.slice(2);
if (!bankPath || !ctnPath || !output) throw new Error("Pass BANK_XLSX CTN_XLSX OUTPUT_JSON");
const bank = await parseNutritionalBankWorkbook(readFileSync(bankPath));
const ctn = await parseCtnWorkbook(readFileSync(ctnPath));
const calculated = calculateNutrition(ctn.map((row) => ({ ingredientId: String(row.sourceRow), name: row.sourceName, quantity: row.quantity, nutrientsPer100g: row.nutrientsPer100g })), 100);
writeFileSync(output, JSON.stringify({
  scope: "Read-only parse and calculation; historical workbook, current validity unconfirmed",
  bankRows: bank.length,
  bankSourceBlank: bank.filter((row) => !row.sourceDetail).length,
  bank: bank.map((row) => ({ ...row, valuesPer100g: Object.fromEntries(Object.entries(row.valuesPer100g).map(([key, value]) => [key, value.toString()])) })),
  ctnRows: ctn.length,
  ctn: ctn.map((row) => ({ ...row, quantity: row.quantity.toString(), nutrientsPer100g: Object.fromEntries(Object.entries(row.nutrientsPer100g).map(([key, value]) => [key, value.toString()])) })),
  currentEngineFromCtnInputs: { per100g: calculated.per100g, energyKcalPer100g: calculated.energyKcalPer100g },
  caveat: "No claim of historical 1:1 parity: current engine uses quantities without process loss; historical CTN uses displayed percentages and 1.11 multiplier. Missing source fields remain absent."
}, null, 2));
console.log(JSON.stringify({ bankRows: bank.length, sourceBlank: bank.filter((row) => !row.sourceDetail).length, ctnRows: ctn.length }));
