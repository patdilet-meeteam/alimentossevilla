import { Prisma } from "@prisma/client";
import { readSheet } from "read-excel-file/node";
import { z } from "zod";
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

const ctnNutritionSnapshotSchema = z.object({
  source: z.literal("CTN"),
  sourceFileName: z.string().min(1),
  rows: z.array(z.object({
    sourceRow: z.number().int().positive(),
    sourceCode: z.string().nullable(),
    sourceName: z.string().min(1),
    ingredientId: z.string().min(1),
    quantity: z.string().refine((value) => {
      try { return new Prisma.Decimal(value).isFinite() && new Prisma.Decimal(value).greaterThan(0); } catch { return false; }
    }),
    nutrientsPer100g: z.record(z.string(), z.string().refine((value) => {
      try { return new Prisma.Decimal(value).isFinite() && new Prisma.Decimal(value).greaterThanOrEqualTo(0); } catch { return false; }
    })),
  })).min(1),
});

export type CtnNutritionSourceSnapshot = z.infer<typeof ctnNutritionSnapshotSchema>;

export type CtnSnapshotIngredient = Pick<NutritionIngredientInput, "ingredientId" | "name" | "quantity">;

export type CtnNutritionSnapshotResolution =
  | { status: "absent" }
  | { status: "invalid"; reason: string }
  | { status: "ready"; sourceFileName: string; inputs: NutritionIngredientInput[] };

/**
 * Resolves immutable CTN row inputs for one formulation version. It refuses
 * stale/mismatched snapshots instead of silently falling back to the nutrient bank.
 */
export function resolveCtnNutritionSnapshot(
  rawSnapshot: unknown,
  formulationIngredients: readonly CtnSnapshotIngredient[],
): CtnNutritionSnapshotResolution {
  if (rawSnapshot === null || rawSnapshot === undefined) return { status: "absent" };
  const parsed = ctnNutritionSnapshotSchema.safeParse(rawSnapshot);
  if (!parsed.success) return { status: "invalid", reason: "La captura nutricional CTN guardada no tiene un formato válido." };

  const expected = new Map<string, Prisma.Decimal>();
  for (const ingredient of formulationIngredients) {
    expected.set(ingredient.ingredientId, new Prisma.Decimal(ingredient.quantity));
  }
  const actual = new Map<string, Prisma.Decimal>();
  for (const row of parsed.data.rows) {
    if (!expected.has(row.ingredientId)) {
      return { status: "invalid", reason: "La captura CTN contiene ingredientes que no pertenecen a esta versión." };
    }
    actual.set(row.ingredientId, (actual.get(row.ingredientId) ?? new Prisma.Decimal(0)).plus(row.quantity));
  }
  if (expected.size !== actual.size || [...expected].some(([id, quantity]) => !actual.get(id)?.eq(quantity))) {
    return { status: "invalid", reason: "La fórmula cambió después de importar el CTN. Reimporte el Excel para actualizar su base nutricional." };
  }

  return {
    status: "ready",
    sourceFileName: parsed.data.sourceFileName,
    inputs: parsed.data.rows.map((row) => ({
      ingredientId: row.ingredientId,
      name: row.sourceName,
      quantity: row.quantity,
      nutrientsPer100g: Object.fromEntries(Object.entries(row.nutrientsPer100g).map(([key, value]) => [key, new Prisma.Decimal(value)])),
    })),
  };
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

/** Reads the customer workbook directly when it contains the canonical CTN tab. */
export async function parseCtnWorkbook(buffer: Buffer): Promise<CtnParsedRow[]> {
  let rows: unknown[][];
  try {
    rows = await readSheet(buffer, "CTN");
  } catch {
    throw new Error("No se pudo leer la hoja CTN del archivo Excel.");
  }
  const csv = rows.map((row) => row.map((cell) => {
    const value = cell === null || cell === undefined ? "" : String(cell);
    return `"${value.replace(/"/g, '""')}"`;
  }).join(",")).join("\n");
  return parseCtnCsv(csv);
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
