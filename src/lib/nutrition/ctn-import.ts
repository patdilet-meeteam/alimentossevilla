import { Prisma } from "@prisma/client";
import { normalizePercentagesFromQuantities, type NutritionIngredientInput } from "@/lib/nutrition/nutrition-calculator";

export interface CtnParsedRow {
  sourceRow: number;
  sourceCode: string | null;
  sourceName: string;
  quantity: Prisma.Decimal;
  nutrientsPer100g: Record<string, Prisma.Decimal>;
}

export interface CtnImportPlanItem {
  sourceRow: number;
  sourceCode: string | null;
  sourceName: string;
  quantity: Prisma.Decimal;
  percentage: Prisma.Decimal;
  nutrientsPer100g: Record<string, Prisma.Decimal>;
}

const COLUMN_TO_NUTRIENT: Record<string, string> = {
  "GRASA (G)": "FAT_TOTAL",
  "GRASA SATURADA (G)": "FAT_SAT",
  "GRASA TRANS (G)": "FAT_TRANS",
  "PROTEÍNA (G)": "PROTEIN",
  "CHO (G)": "CARBS_TOTAL",
  "AZ TOTALES (G)": "SUGAR_TOTAL",
  "AZ. AÑADIDO (G)": "SUGAR_ADDED",
  "FIBRA (G)": "FIBER",
  "SODIO (MG)": "SODIUM",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [[]];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { rows.at(-1)!.push(field); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      rows.at(-1)!.push(field); rows.push([]); field = "";
    } else field += character;
  }
  rows.at(-1)!.push(field);
  return rows.filter((row) => row.some((value) => value.trim()));
}

function key(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

function decimalOrZero(value: string): Prisma.Decimal {
  const normalized = value.trim().replace(/\s/g, "");
  return !normalized || normalized === "-" ? new Prisma.Decimal(0) : new Prisma.Decimal(normalized);
}

/** Parses the CTN ingredient table; it never interprets its post-merma totals. */
export function parseCtnCsv(text: string): CtnParsedRow[] {
  const rows = parseCsv(text);
  const headerIndex = rows.findIndex((row) => row.some((value) => key(value) === "DESCRIPCION"));
  if (headerIndex < 0) throw new Error("No se encontró el encabezado DESCRIPCIÓN del CTN.");
  const header = rows[headerIndex].map(key);
  const indexOf = (name: string) => header.findIndex((value) => value === name);
  const codeIndex = indexOf("CODIGO");
  const nameIndex = indexOf("DESCRIPCION");
  const quantityIndex = indexOf("CANTIDAD");
  if (nameIndex < 0 || quantityIndex < 0) throw new Error("El CTN no contiene DESCRIPCIÓN y CANTIDAD.");
  const nutrientIndexes = Object.entries(COLUMN_TO_NUTRIENT)
    .map(([column, nutrient]) => [indexOf(key(column)), nutrient] as const)
    .filter(([index]) => index >= 0);

  const parsed: CtnParsedRow[] = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    const sourceName = row[nameIndex]?.trim() ?? "";
    const rawQuantity = row[quantityIndex]?.trim() ?? "";
    const sourceCode = codeIndex >= 0 && row[codeIndex]?.trim() ? row[codeIndex].trim() : null;
    if (sourceName.toUpperCase() === "TOTAL" || sourceCode?.toUpperCase() === "TOTAL") break;
    if (!sourceName || !rawQuantity) continue;
    const quantity = decimalOrZero(rawQuantity);
    if (quantity.lessThanOrEqualTo(0)) throw new Error(`Cantidad inválida para ${sourceName}.`);
    parsed.push({
      sourceRow: index + 1,
      sourceCode,
      sourceName,
      quantity,
      nutrientsPer100g: Object.fromEntries(nutrientIndexes.map(([columnIndex, nutrient]) => [nutrient, decimalOrZero(row[columnIndex] ?? "")])),
    });
  }
  if (parsed.length === 0) throw new Error("El CTN no contiene ingredientes importables.");
  return parsed;
}

export function buildCtnImportPlan(rows: readonly CtnParsedRow[]): CtnImportPlanItem[] {
  const normalized = normalizePercentagesFromQuantities(rows.map((row) => ({
    ingredientId: String(row.sourceRow), name: row.sourceName, quantity: row.quantity, nutrientsPer100g: row.nutrientsPer100g,
  } satisfies NutritionIngredientInput)));
  return normalized.map((row, index) => ({ ...rows[index], quantity: new Prisma.Decimal(row.quantity), percentage: row.percentage }));
}
